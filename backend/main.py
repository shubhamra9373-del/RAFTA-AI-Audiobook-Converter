from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import asyncio
import edge_tts
import io
import os
import re
import uuid
import zipfile
import xml.etree.ElementTree as ET

from html.parser import HTMLParser


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="RAFTA AI Audiobook Converter",
    version="3.0.0",
)


# =========================================================
# CONFIG
# =========================================================

LOCAL_FRONTEND_URLS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

FRONTEND_URLS_ENV = os.getenv(
    "FRONTEND_URLS",
    "",
).strip()

FRONTEND_URLS = list(LOCAL_FRONTEND_URLS)

if FRONTEND_URLS_ENV:
    for origin in FRONTEND_URLS_ENV.split(","):
        origin = origin.strip().rstrip("/")

        if origin and origin not in FRONTEND_URLS:
            FRONTEND_URLS.append(origin)


# Render / other hosted frontend URLs are accepted by regex.
FRONTEND_ORIGIN_REGEX = (
    r"^https://.*\.(onrender\.com|vercel\.app)$"
)


PUBLIC_BASE_URL = (
    os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
)

if not PUBLIC_BASE_URL:
    PUBLIC_BASE_URL = (
        os.getenv("RENDER_EXTERNAL_URL", "")
        .strip()
        .rstrip("/")
    )

if not PUBLIC_BASE_URL:
    PUBLIC_BASE_URL = (
        "http://127.0.0.1:8000"
    )


DEFAULT_VOICE = "en-IN-NeerjaNeural"

# Keep concurrency reasonable.
# Six simultaneous Edge TTS requests can be unreliable.
TTS_CONCURRENCY = 2

# Edge TTS requests should not contain enormous text blocks.
MAX_TTS_CHARS = 4500


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_origin_regex=FRONTEND_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

AUDIO_FOLDER = os.path.join(
    BASE_DIR,
    "generated_audio",
)

os.makedirs(
    AUDIO_FOLDER,
    exist_ok=True,
)

app.mount(
    "/generated_audio",
    StaticFiles(
        directory=AUDIO_FOLDER
    ),
    name="generated_audio",
)


# =========================================================
# MODELS
# =========================================================

class AudioRequest(BaseModel):
    text: str
    voice: str = DEFAULT_VOICE


class BookConversionRequest(BaseModel):
    text: str
    book_title: str = "Untitled Audiobook"
    voice: str = DEFAULT_VOICE


# =========================================================
# JOB STORAGE
# =========================================================

BOOK_JOBS = {}


# =========================================================
# EPUB HTML PARSER
# =========================================================

class EPUBTextParser(HTMLParser):
    BLOCK_TAGS = {
        "p",
        "div",
        "section",
        "article",
        "header",
        "footer",
        "main",
        "aside",
        "blockquote",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "br",
    }

    IGNORE_TAGS = {
        "script",
        "style",
        "svg",
        "head",
        "noscript",
    }

    def __init__(self):
        super().__init__()

        self.parts = []
        self.ignore_depth = 0

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()

        if tag in self.IGNORE_TAGS:
            self.ignore_depth += 1
            return

        if self.ignore_depth > 0:
            return

        if tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        tag = tag.lower()

        if tag in self.IGNORE_TAGS:
            if self.ignore_depth > 0:
                self.ignore_depth -= 1
            return

        if self.ignore_depth > 0:
            return

        if tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        if self.ignore_depth > 0:
            return

        clean = " ".join(
            data.split()
        )

        if clean:
            self.parts.append(clean)

    def get_text(self):
        raw_text = "".join(
            self.parts
        )

        lines = []

        for line in raw_text.splitlines():
            clean = " ".join(
                line.split()
            )

            if clean:
                lines.append(clean)

        return "\n\n".join(
            lines
        )


# =========================================================
# TEXT CLEANING
# =========================================================

def clean_extracted_text(
    text: str,
) -> str:
    if not text:
        return ""

    lines = []

    for line in text.splitlines():
        clean = " ".join(
            line.split()
        )

        if clean:
            lines.append(clean)

    return "\n\n".join(
        lines
    ).strip()


# =========================================================
# CHAPTER DETECTION
# =========================================================

FRONT_MATTER_TITLES = {
    "copyright",
    "copyright page",
    "contents",
    "table of contents",
    "contents page",
    "toc",
    "index",
    "dedication",
    "acknowledgements",
    "acknowledgments",
    "foreword",
    "preface",
    "introduction",
    "epigraph",
    "about the author",
    "also by",
    "title page",
    "publication information",
    "isbn",
    "publisher",
    "legal notice",
    "disclaimer",
}

NARRATIVE_SECTION_TITLES = {
    "prologue",
    "epilogue",
}


NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
}


ROMAN_NUMBERS = {
    "i": 1,
    "ii": 2,
    "iii": 3,
    "iv": 4,
    "v": 5,
    "vi": 6,
    "vii": 7,
    "viii": 8,
    "ix": 9,
    "x": 10,
    "xi": 11,
    "xii": 12,
    "xiii": 13,
    "xiv": 14,
    "xv": 15,
    "xvi": 16,
    "xvii": 17,
    "xviii": 18,
    "xix": 19,
    "xx": 20,
}


CHAPTER_PATTERNS = [
    re.compile(
        r"^\s*chapter\s+"
        r"(?:"
        r"\d{1,3}"
        r"|[IVXLCDM]+"
        r"|one|two|three|four|five|six|seven|eight|nine|ten|"
        r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|"
        r"seventeen|eighteen|nineteen|twenty"
        r")"
        r"(?:\s*[:.\-–—]\s*|\s+)?"
        r"(.*?)"
        r"\s*$",
        re.IGNORECASE,
    ),
    re.compile(
        r"^\s*part\s+"
        r"(?:"
        r"\d{1,3}"
        r"|[IVXLCDM]+"
        r"|one|two|three|four|five|six|seven|eight|nine|ten"
        r")"
        r"(?:\s*[:.\-–—]\s*|\s+)?"
        r"(.*?)"
        r"\s*$",
        re.IGNORECASE,
    ),
]


def normalize_line(
    line: str,
) -> str:
    return " ".join(
        line.split()
    ).strip()


def is_front_matter_title(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    ).lower()

    if not clean:
        return False

    if clean in FRONT_MATTER_TITLES:
        return True

    for title in FRONT_MATTER_TITLES:
        if clean.startswith(
            title + ":"
        ):
            return True

        if clean.startswith(
            title + " "
        ):
            return True

    return False


def is_narrative_section_title(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    ).lower()

    return clean in (
        NARRATIVE_SECTION_TITLES
    )


def is_contents_heading(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    ).lower()

    return clean in {
        "contents",
        "table of contents",
        "contents page",
        "toc",
    }


def looks_like_toc_entry(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    )

    if not clean:
        return False

    if re.search(
        r"\.{2,}\s*\d{1,4}\s*$",
        clean,
    ):
        return True

    if re.search(
        r"[-–—]{3,}\s*\d{1,4}\s*$",
        clean,
    ):
        return True

    if re.match(
        r"^(chapter|part)\s+",
        clean,
        re.IGNORECASE,
    ):
        if re.search(
            r"\s+\d{1,4}\s*$",
            clean,
        ):
            return True

    return False


def is_page_number_line(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    )

    return bool(
        re.fullmatch(
            r"(?:page\s*)?\d{1,5}",
            clean,
            re.IGNORECASE,
        )
    )


def parse_number_value(
    value: str,
):

    value = value.lower().strip()

    if value.isdigit():
        return int(value)

    if value in NUMBER_WORDS:
        return NUMBER_WORDS[value]

    if value in ROMAN_NUMBERS:
        return ROMAN_NUMBERS[value]

    return None


def get_chapter_number(
    line: str,
):

    clean = normalize_line(
        line
    )

    match = CHAPTER_PATTERNS[0].match(
        clean
    )

    if not match:
        return None

    number_match = re.search(
        r"chapter\s+"
        r"(\d{1,3}|[IVXLCDM]+|one|two|three|four|five|six|seven|eight|nine|ten|"
        r"eleven|twelve|thirteen|fourteen|fifteen|sixteen|"
        r"seventeen|eighteen|nineteen|twenty)",
        clean,
        re.IGNORECASE,
    )

    if not number_match:
        return None

    return parse_number_value(
        number_match.group(1)
    )


def get_heading_title(
    line: str,
    fallback_number: int,
) -> str:

    clean = normalize_line(
        line
    )

    for pattern in CHAPTER_PATTERNS:
        match = pattern.match(
            clean
        )

        if not match:
            continue

        title = (
            match.group(1) or ""
        ).strip()

        title = re.sub(
            r"\s+\d{1,4}$",
            "",
            title,
        ).strip()

        if title:
            return title

        number = get_chapter_number(
            clean
        )

        if number is not None:
            return (
                f"Chapter {number}"
            )

        prefix = (
            "Part"
            if clean.lower().startswith("part")
            else "Chapter"
        )

        return (
            f"{prefix} {fallback_number}"
        )

    if is_narrative_section_title(
        clean
    ):
        return clean.title()

    return (
        f"Chapter {fallback_number}"
    )


def looks_like_prose(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    )

    if not clean:
        return False

    if is_page_number_line(
        clean
    ):
        return False

    if looks_like_toc_entry(
        clean
    ):
        return False

    if is_contents_heading(
        clean
    ):
        return False

    words = clean.split()

    if len(words) < 5:
        return False

    if len(words) <= 10:
        uppercase_words = sum(
            1
            for word in words
            if word.isupper()
            and len(word) > 2
        )

        if uppercase_words >= 3:
            return False

    return True


def is_chapter_heading(
    line: str,
) -> bool:

    clean = normalize_line(
        line
    )

    if not clean:
        return False

    if is_front_matter_title(
        clean
    ):
        return False

    if is_contents_heading(
        clean
    ):
        return False

    if looks_like_toc_entry(
        clean
    ):
        return False

    if len(clean) > 180:
        return False

    if is_narrative_section_title(
        clean
    ):
        return True

    for pattern in CHAPTER_PATTERNS:
        if pattern.match(clean):
            return True

    return False


def has_real_body(
    lines,
    heading_index: int,
) -> bool:

    prose_words = 0
    checked_lines = 0

    max_scan = min(
        heading_index + 25,
        len(lines),
    )

    for index in range(
        heading_index + 1,
        max_scan,
    ):
        line = normalize_line(
            lines[index]
        )

        if not line:
            continue

        checked_lines += 1

        if is_chapter_heading(
            line
        ):
            return False

        if is_contents_heading(
            line
        ):
            continue

        if is_front_matter_title(
            line
        ):
            continue

        if is_page_number_line(
            line
        ):
            continue

        if looks_like_toc_entry(
            line
        ):
            continue

        if looks_like_prose(
            line
        ):
            prose_words += len(
                line.split()
            )

            if prose_words >= 25:
                return True

        if checked_lines >= 15:
            break

    return False


def split_into_chapters(
    text: str,
):

    clean_text = text.strip()

    if not clean_text:
        return []

    lines = clean_text.splitlines()

    candidates = []

    for index, line in enumerate(lines):
        clean_line = normalize_line(
            line
        )

        if not is_chapter_heading(
            clean_line
        ):
            continue

        if not has_real_body(
            lines,
            index,
        ):
            continue

        candidates.append(
            {
                "index": index,
                "line": clean_line,
                "chapter_number":
                    get_chapter_number(
                        clean_line
                    ),
            }
        )

    if not candidates:
        return [
            {
                "number": 1,
                "title": "Full Audiobook",
                "text": clean_text,
            }
        ]

    # Remove headings repeated very close together.
    filtered_candidates = []

    for candidate in candidates:
        if filtered_candidates:
            previous = (
                filtered_candidates[-1]
            )

            if (
                candidate["index"]
                - previous["index"]
                <= 5
            ):
                continue

        filtered_candidates.append(
            candidate
        )

    chapters = []

    for position, candidate in enumerate(
        filtered_candidates
    ):

        start_index = candidate[
            "index"
        ]

        if (
            position + 1
            < len(filtered_candidates)
        ):
            end_index = (
                filtered_candidates[
                    position + 1
                ]["index"]
            )
        else:
            end_index = len(lines)

        body_lines = lines[
            start_index + 1:
            end_index
        ]

        body = "\n".join(
            body_lines
        ).strip()

        if not body:
            continue

        number = len(chapters) + 1

        title = get_heading_title(
            candidate["line"],
            number,
        )

        chapter_text = (
            f"{title}\n\n{body}"
        )

        chapters.append(
            {
                "number": number,
                "title": title,
                "text": chapter_text,
            }
        )

    if not chapters:
        return [
            {
                "number": 1,
                "title": "Full Audiobook",
                "text": clean_text,
            }
        ]

    return chapters


# =========================================================
# TTS TEXT CHUNKING
# =========================================================

def split_text_for_tts(
    text: str,
    max_chars: int = MAX_TTS_CHARS,
):

    text = text.strip()

    if not text:
        return []

    paragraphs = re.split(
        r"\n\s*\n",
        text,
    )

    chunks = []
    current = ""

    for paragraph in paragraphs:
        paragraph = paragraph.strip()

        if not paragraph:
            continue

        if len(paragraph) <= max_chars:
            candidate = (
                f"{current}\n\n{paragraph}"
                if current
                else paragraph
            )

            if len(candidate) <= max_chars:
                current = candidate
                continue

            if current:
                chunks.append(
                    current.strip()
                )

            current = paragraph
            continue

        if current:
            chunks.append(
                current.strip()
            )
            current = ""

        remaining = paragraph

        while len(remaining) > max_chars:
            cut = remaining.rfind(
                ". ",
                0,
                max_chars,
            )

            if cut < max_chars // 2:
                cut = remaining.rfind(
                    " ",
                    0,
                    max_chars,
                )

            if cut <= 0:
                cut = max_chars

            piece = remaining[
                :cut
            ].strip()

            if piece:
                chunks.append(piece)

            remaining = remaining[
                cut:
            ].strip()

        if remaining:
            current = remaining

    if current:
        chunks.append(
            current.strip()
        )

    return chunks


async def generate_mp3_file(
    text: str,
    voice: str,
    file_path: str,
):

    chunks = split_text_for_tts(
        text
    )

    if not chunks:
        raise ValueError(
            "No readable text was supplied for audio generation."
        )

    audio_parts = []

    for chunk in chunks:

        communicate = edge_tts.Communicate(
            chunk,
            voice,
        )

        received_audio = False

        async for event in communicate.stream():

            if event.get("type") == "audio":
                data = event.get(
                    "data",
                    b"",
                )

                if data:
                    audio_parts.append(
                        data
                    )
                    received_audio = True

        if not received_audio:
            raise RuntimeError(
                "Edge TTS returned no audio data."
            )

    if not audio_parts:
        raise RuntimeError(
            "No audio data was generated."
        )

    with open(
        file_path,
        "wb",
    ) as output:
        for part in audio_parts:
            output.write(part)

    if not os.path.exists(
        file_path
    ):
        raise RuntimeError(
            "MP3 file was not created."
        )

    if os.path.getsize(
        file_path
    ) == 0:
        raise RuntimeError(
            "Generated MP3 file is empty."
        )


# =========================================================
# EPUP EXTRACTION
# =========================================================

def find_epub_rootfile(
    epub_zip,
):

    try:
        data = epub_zip.read(
            "META-INF/container.xml"
        )

        root = ET.fromstring(
            data
        )

        for element in root.iter():
            if element.tag.endswith(
                "rootfile"
            ):
                full_path = element.attrib.get(
                    "full-path"
                )

                if full_path:
                    return full_path

    except Exception:
        pass

    return None


def normalize_epub_path(
    base_path: str,
    href: str,
) -> str:

    href = href.split(
        "#",
        1,
    )[0]

    href = href.split(
        "?",
        1,
    )[0]

    base_dir = os.path.dirname(
        base_path
    )

    combined = os.path.normpath(
        os.path.join(
            base_dir,
            href,
        )
    )

    return combined.replace(
        "\\",
        "/",
    )


def get_epub_spine_files(
    epub_zip,
):

    opf_path = find_epub_rootfile(
        epub_zip
    )

    if not opf_path:
        return []

    try:
        opf_data = epub_zip.read(
            opf_path
        )

        root = ET.fromstring(
            opf_data
        )

        manifest = {}

        for element in root.iter():

            if not element.tag.endswith(
                "item"
            ):
                continue

            item_id = element.attrib.get(
                "id"
            )

            href = element.attrib.get(
                "href"
            )

            media_type = element.attrib.get(
                "media-type",
                "",
            ).lower()

            properties = element.attrib.get(
                "properties",
                "",
            ).lower()

            if not item_id or not href:
                continue

            if (
                "html" not in media_type
                and "xhtml" not in media_type
            ):
                continue

            if "nav" in properties:
                continue

            manifest[item_id] = (
                normalize_epub_path(
                    opf_path,
                    href,
                )
            )

        result = []

        for element in root.iter():

            if not element.tag.endswith(
                "itemref"
            ):
                continue

            item_id = element.attrib.get(
                "idref"
            )

            if (
                item_id
                and item_id in manifest
            ):
                result.append(
                    manifest[item_id]
                )

        return result

    except Exception:
        return []


def extract_epub_text(
    file_bytes: bytes,
) -> str:

    try:
        with zipfile.ZipFile(
            io.BytesIO(file_bytes),
            "r",
        ) as epub_zip:

            all_names = set(
                epub_zip.namelist()
            )

            spine_files = (
                get_epub_spine_files(
                    epub_zip
                )
            )

            html_files = [
                path
                for path in spine_files
                if path in all_names
            ]

            if not html_files:
                for name in all_names:

                    lower_name = (
                        name.lower()
                    )

                    if not lower_name.endswith(
                        (
                            ".html",
                            ".xhtml",
                            ".htm",
                        )
                    ):
                        continue

                    basename = os.path.basename(
                        lower_name
                    )

                    if basename in {
                        "nav.xhtml",
                        "toc.xhtml",
                        "toc.html",
                        "contents.xhtml",
                        "contents.html",
                    }:
                        continue

                    html_files.append(
                        name
                    )

            if not html_files:
                raise ValueError(
                    "No readable EPUB content was found."
                )

            all_text = []

            for html_file in html_files:

                try:
                    raw_data = (
                        epub_zip.read(
                            html_file
                        )
                    )

                    content = raw_data.decode(
                        "utf-8",
                        errors="ignore",
                    )

                    parser = EPUBTextParser()

                    parser.feed(
                        content
                    )

                    chapter_text = (
                        parser.get_text()
                    ).strip()

                    if chapter_text:
                        all_text.append(
                            chapter_text
                        )

                except Exception:
                    continue

            final_text = "\n\n".join(
                all_text
            ).strip()

            if not final_text:
                raise ValueError(
                    "Could not extract readable text from EPUB."
                )

            return final_text

    except zipfile.BadZipFile:
        raise ValueError(
            "Invalid EPUB file."
        )


# =========================================================
# PDF EXTRACTION
# =========================================================

def extract_pdf_text(
    file_bytes: bytes,
) -> str:

    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError(
            "PDF support requires pypdf. "
            "Run: python -m pip install pypdf"
        )

    try:
        reader = PdfReader(
            io.BytesIO(
                file_bytes
            )
        )

        pages = []

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                clean = page_text.strip()

                if clean:
                    pages.append(
                        clean
                    )

        result = "\n\n".join(
            pages
        ).strip()

        if not result:
            raise ValueError(
                "No readable text was found in this PDF. "
                "Scanned/image-only PDFs need OCR."
            )

        return result

    except ValueError:
        raise

    except Exception as error:
        raise ValueError(
            f"PDF text extraction failed: {error}"
        )


# =========================================================
# HOME
# =========================================================

@app.get("/")
async def home():

    return {
        "message": (
            "RAFTA AI Audiobook Converter "
            "Backend is Running"
        ),
        "version": "3.0.0",
        "public_base_url": PUBLIC_BASE_URL,
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/api/health")
async def health():

    return {
        "status": "ok",
        "version": "3.0.0",
        "public_base_url": PUBLIC_BASE_URL,
        "audio_folder": AUDIO_FOLDER,
        "active_book_jobs": len(
            BOOK_JOBS
        ),
    }


# =========================================================
# TEXT -> SINGLE MP3
# =========================================================

@app.post("/api/convert")
async def convert_text_to_audio(
    request: AudioRequest,
):

    clean_text = request.text.strip()
    voice = request.voice.strip()

    if not clean_text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty.",
        )

    if not voice:
        voice = DEFAULT_VOICE

    filename = (
        f"{uuid.uuid4()}.mp3"
    )

    file_path = os.path.join(
        AUDIO_FOLDER,
        filename,
    )

    try:

        await generate_mp3_file(
            clean_text,
            voice,
            file_path,
        )

    except Exception as error:

        if os.path.exists(
            file_path
        ):
            try:
                os.remove(
                    file_path
                )
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail=(
                f"Audio generation failed: {error}"
            ),
        )

    audio_url = (
        f"{PUBLIC_BASE_URL}"
        f"/generated_audio/{filename}"
    )

    return {
        "message": (
            "Audiobook generated successfully."
        ),
        "audio_url": audio_url,
        "relative_audio_url": (
            f"/generated_audio/{filename}"
        ),
        "voice": voice,
        "file_name": filename,
    }


# =========================================================
# FILE EXTRACTION
# =========================================================

@app.post("/api/extract")
async def extract_text_from_file(
    file: UploadFile = File(...),
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is missing.",
        )

    filename = file.filename.lower()

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    try:

        if filename.endswith(
            ".txt"
        ):

            text = file_bytes.decode(
                "utf-8",
                errors="ignore",
            ).strip()

        elif filename.endswith(
            ".pdf"
        ):

            text = extract_pdf_text(
                file_bytes
            )

        elif filename.endswith(
            ".epub"
        ):

            text = extract_epub_text(
                file_bytes
            )

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file type. "
                    "Use TXT, PDF, or EPUB."
                ),
            )

        cleaned_text = (
            clean_extracted_text(
                text
            )
        )

        if not cleaned_text:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No readable text was found "
                    "in the uploaded file."
                ),
            )

        chapters = split_into_chapters(
            cleaned_text
        )

        chapter_preview = [
            {
                "number": chapter[
                    "number"
                ],
                "title": chapter[
                    "title"
                ],
            }
            for chapter in chapters
        ]

        return {
            "message": (
                "Text extracted successfully."
            ),
            "text": cleaned_text,
            "chapter_count": len(
                chapters
            ),
            "chapters": chapter_preview,
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# GENERATE ONE BOOK CHAPTER
# =========================================================

async def generate_chapter_audio(
    job_id: str,
    chapter_index: int,
    chapter: dict,
    voice: str,
    semaphore: asyncio.Semaphore,
):

    async with semaphore:

        if job_id not in BOOK_JOBS:
            return

        chapter_state = (
            BOOK_JOBS[job_id][
                "chapters"
            ][chapter_index]
        )

        chapter_state[
            "status"
        ] = "processing"

        file_name = (
            f"{job_id}"
            f"_chapter_"
            f"{chapter['number']}.mp3"
        )

        file_path = os.path.join(
            AUDIO_FOLDER,
            file_name,
        )

        try:

            await generate_mp3_file(
                chapter["text"],
                voice,
                file_path,
            )

            audio_url = (
                f"{PUBLIC_BASE_URL}"
                f"/generated_audio/"
                f"{file_name}"
            )

            chapter_state[
                "status"
            ] = "completed"

            chapter_state[
                "audio_url"
            ] = audio_url

            chapter_state[
                "error"
            ] = None

            BOOK_JOBS[job_id][
                "completed"
            ] += 1

        except Exception as error:

            chapter_state[
                "status"
            ] = "error"

            chapter_state[
                "error"
            ] = str(error)

            BOOK_JOBS[job_id][
                "errors"
            ] += 1


# =========================================================
# BACKGROUND BOOK GENERATION
# =========================================================

async def run_book_generation(
    job_id: str,
    chapters: list,
    voice: str,
):

    if job_id not in BOOK_JOBS:
        return

    BOOK_JOBS[job_id][
        "status"
    ] = "processing"

    semaphore = asyncio.Semaphore(
        TTS_CONCURRENCY
    )

    tasks = []

    for index, chapter in enumerate(
        chapters
    ):

        tasks.append(
            asyncio.create_task(
                generate_chapter_audio(
                    job_id,
                    index,
                    chapter,
                    voice,
                    semaphore,
                )
            )
        )

    if tasks:
        await asyncio.gather(
            *tasks,
            return_exceptions=True,
        )

    if job_id not in BOOK_JOBS:
        return

    # IMPORTANT:
    # The frontend waits for exactly "completed".
    # Even when some chapters fail, mark the entire
    # background job as completed and expose errors.
    BOOK_JOBS[job_id][
        "status"
    ] = "completed"


# =========================================================
# START BOOK CONVERSION
# =========================================================

@app.post("/api/convert-book")
async def convert_book(
    request: BookConversionRequest,
):

    clean_text = request.text.strip()

    if not clean_text:
        raise HTTPException(
            status_code=400,
            detail="Book text cannot be empty.",
        )

    voice = request.voice.strip()

    if not voice:
        voice = DEFAULT_VOICE

    book_title = (
        request.book_title.strip()
        or "Untitled Audiobook"
    )

    chapters = split_into_chapters(
        clean_text
    )

    if not chapters:
        raise HTTPException(
            status_code=400,
            detail=(
                "No readable book content was found."
            ),
        )

    job_id = str(
        uuid.uuid4()
    )

    chapter_states = []

    for chapter in chapters:

        chapter_states.append(
            {
                "number": chapter[
                    "number"
                ],
                "title": chapter[
                    "title"
                ],
                "status": "queued",
                "audio_url": None,
                "error": None,
            }
        )

    BOOK_JOBS[job_id] = {
        "job_id": job_id,
        "book_title": book_title,
        "status": "queued",
        "total": len(chapters),
        "completed": 0,
        "errors": 0,
        "chapters": chapter_states,
    }

    asyncio.create_task(
        run_book_generation(
            job_id,
            chapters,
            voice,
        )
    )

    return {
        "message": (
            "Book generation started."
        ),
        "job_id": job_id,
        "book_title": book_title,
        "total_chapters": len(
            chapters
        ),
        "chapters": chapter_states,
    }


# =========================================================
# BOOK JOB STATUS
# =========================================================

@app.get(
    "/api/convert-book/{job_id}"
)
async def get_book_conversion_status(
    job_id: str,
):

    job = BOOK_JOBS.get(
        job_id
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail=(
                "Conversion job not found."
            ),
        )

    return {
        "job_id": job[
            "job_id"
        ],
        "book_title": job[
            "book_title"
        ],
        "status": job[
            "status"
        ],
        "total": job[
            "total"
        ],
        "completed": job[
            "completed"
        ],
        "errors": job[
            "errors"
        ],
        "chapters": job[
            "chapters"
        ],
    }