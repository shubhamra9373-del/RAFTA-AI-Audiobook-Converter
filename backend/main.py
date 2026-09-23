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
    version="2.0.0",
)


# =========================================================
# CORS + PUBLIC URL
# =========================================================

FRONTEND_URLS = os.getenv(
    "FRONTEND_URLS",
    "http://localhost:3000,http://127.0.0.1:3000"
)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in FRONTEND_URLS.split(",")
    if origin.strip()
]

PUBLIC_BASE_URL = os.getenv(
    "PUBLIC_BASE_URL",
    "https://rafta-ai-audiobook-converter.onrender.com"
).rstrip("/")


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# FOLDERS
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
    StaticFiles(directory=AUDIO_FOLDER),
    name="generated_audio",
)


# =========================================================
# MODELS
# =========================================================

class AudioRequest(BaseModel):
    text: str
    voice: str


class BookConversionRequest(BaseModel):
    text: str
    book_title: str
    voice: str


# =========================================================
# IN-MEMORY JOB STORAGE
# =========================================================

BOOK_JOBS = {}

# Generate 6 chapters simultaneously.
TTS_CONCURRENCY = 6


# =========================================================
# EPUB TEXT PARSER
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

        clean = " ".join(data.split())

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
                lines.append(
                    clean
                )

        return "\n\n".join(lines)


# =========================================================
# CLEAN TEXT
# =========================================================

def clean_extracted_text(text: str) -> str:

    if not text:
        return ""

    lines = []

    for line in text.splitlines():

        clean_line = " ".join(
            line.split()
        )

        if clean_line:
            lines.append(
                clean_line
            )

    return "\n\n".join(
        lines
    ).strip()


# =========================================================
# SMART CHAPTER DETECTION
# =========================================================

FRONT_MATTER_TITLES = {
    "copyright",
    "copyright page",
    "contents",
    "table of contents",
    "toc",
    "index",
    "dedication",
    "acknowledgements",
    "acknowledgments",
    "foreword",
    "preface",
    "introduction",
    "prologue",
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


def normalize_line(line: str) -> str:

    return " ".join(
        line.split()
    ).strip()


def is_front_matter_title(line: str) -> bool:

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


def is_contents_heading(line: str) -> bool:

    clean = normalize_line(
        line
    ).lower()

    return clean in {
        "contents",
        "table of contents",
        "contents page",
        "toc",
    }


def looks_like_toc_entry(line: str) -> bool:

    clean = normalize_line(
        line
    )

    if not clean:
        return False

    # Chapter 1 ............ 12
    if re.search(
        r"\.{2,}\s*\d{1,4}\s*$",
        clean,
    ):
        return True

    # Chapter 1 ----------- 12
    if re.search(
        r"[-–—]{3,}\s*\d{1,4}\s*$",
        clean,
    ):
        return True

    # Chapter 1       12
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


def is_page_number_line(line: str) -> bool:

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


def parse_number_value(value: str):

    value = value.lower().strip()

    if value.isdigit():
        return int(value)

    if value in NUMBER_WORDS:
        return NUMBER_WORDS[value]

    if value in ROMAN_NUMBERS:
        return ROMAN_NUMBERS[value]

    return None


def get_chapter_number(line: str):

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
        r"(\d{1,3}|[IVXLCDM]+|one|two|three|four|five|six|seven|"
        r"eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|"
        r"sixteen|seventeen|eighteen|nineteen|twenty)",
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
    number: int,
) -> str:

    clean = normalize_line(
        line
    )

    match = CHAPTER_PATTERNS[0].match(
        clean
    )

    if match:

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

        detected_number = (
            get_chapter_number(clean)
        )

        if detected_number is not None:
            return f"Chapter {detected_number}"

        return f"Chapter {number}"

    match = CHAPTER_PATTERNS[1].match(
        clean
    )

    if match:

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

        return f"Part {number}"

    return f"Chapter {number}"


def looks_like_prose(line: str) -> bool:

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


def has_real_body(
    lines,
    heading_index: int,
) -> bool:

    prose_words = 0
    checked_lines = 0

    max_scan = min(
        heading_index + 20,
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

        if checked_lines >= 12:
            break

    return False


def is_chapter_heading(line: str) -> bool:

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

    for pattern in CHAPTER_PATTERNS:

        if pattern.match(clean):
            return True

    return False


def find_real_chapter_candidates(
    lines,
):

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
                "chapter_number": get_chapter_number(
                    clean_line
                ),
                "line": clean_line,
            }
        )

    return candidates


def remove_duplicate_chapter_candidates(
    candidates,
):

    if not candidates:
        return []

    result = []
    last_number = None

    for candidate in candidates:

        current_number = candidate[
            "chapter_number"
        ]

        if (
            current_number is not None
            and last_number is not None
            and current_number <= last_number
        ):
            continue

        result.append(
            candidate
        )

        if current_number is not None:
            last_number = current_number

    return result


def split_into_chapters(text: str):

    clean_text = text.strip()

    if not clean_text:
        return []

    lines = clean_text.splitlines()

    candidates = find_real_chapter_candidates(
        lines
    )

    candidates = remove_duplicate_chapter_candidates(
        candidates
    )

    if not candidates:

        return [
            {
                "number": 1,
                "title": "Full Audiobook",
                "text": clean_text,
            }
        ]

    chapters = []

    for position, candidate in enumerate(
        candidates
    ):

        start_index = candidate[
            "index"
        ]

        if position + 1 < len(candidates):

            end_index = candidates[
                position + 1
            ]["index"]

        else:

            end_index = len(lines)

        heading = candidate[
            "line"
        ]

        body_lines = lines[
            start_index + 1:
            end_index
        ]

        body = "\n".join(
            body_lines
        ).strip()

        if not body:
            continue

        chapter_number = (
            len(chapters) + 1
        )

        title = get_heading_title(
            heading,
            chapter_number,
        )

        chapter_text = (
            f"{title}\n\n{body}"
        )

        chapters.append(
            {
                "number": chapter_number,
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
# EPUB HELPERS
# =========================================================

def normalize_epub_path(
    base_path: str,
    href: str,
) -> str:

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


def find_epub_rootfile(
    epub_zip,
):

    try:

        container_xml = epub_zip.read(
            "META-INF/container.xml"
        )

        root = ET.fromstring(
            container_xml
        )

        namespaces = {
            "container": (
                "urn:oasis:names:tc:opendocument:"
                "xmlns:container"
            )
        }

        rootfile = root.find(
            ".//container:rootfile",
            namespaces,
        )

        if rootfile is not None:

            full_path = rootfile.attrib.get(
                "full-path"
            )

            if full_path:
                return full_path

    except Exception:
        pass

    return None


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

        ns_match = re.match(
            r"\{(.+)\}",
            root.tag,
        )

        namespace = (
            ns_match.group(1)
            if ns_match
            else ""
        )

        if namespace:

            manifest_tag = (
                f"{{{namespace}}}manifest"
            )

            item_tag = (
                f"{{{namespace}}}item"
            )

            spine_tag = (
                f"{{{namespace}}}spine"
            )

            itemref_tag = (
                f"{{{namespace}}}itemref"
            )

        else:

            manifest_tag = "manifest"
            item_tag = "item"
            spine_tag = "spine"
            itemref_tag = "itemref"

        manifest = {}

        manifest_element = root.find(
            manifest_tag
        )

        if manifest_element is not None:

            for item in manifest_element.findall(
                item_tag
            ):

                item_id = item.attrib.get(
                    "id"
                )

                href = item.attrib.get(
                    "href"
                )

                media_type = item.attrib.get(
                    "media-type",
                    "",
                )

                properties = item.attrib.get(
                    "properties",
                    "",
                )

                if (
                    item_id
                    and href
                ):

                    if (
                        "html"
                        in media_type.lower()
                        or "xhtml"
                        in media_type.lower()
                    ):

                        if "nav" not in properties.lower():

                            manifest[item_id] = (
                                normalize_epub_path(
                                    opf_path,
                                    href,
                                )
                            )

        spine = root.find(
            spine_tag
        )

        result = []

        if spine is not None:

            for itemref in spine.findall(
                itemref_tag
            ):

                item_id = itemref.attrib.get(
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


# =========================================================
# FILE EXTRACTION - EPUB
# =========================================================

def extract_epub_text(
    file_bytes: bytes,
) -> str:

    try:

        with zipfile.ZipFile(
            io.BytesIO(file_bytes),
            "r",
        ) as epub_zip:

            all_names = epub_zip.namelist()

            spine_files = get_epub_spine_files(
                epub_zip
            )

            html_files = []

            for path in spine_files:

                if path in all_names:
                    html_files.append(path)

            if not html_files:

                for name in all_names:

                    lower_name = name.lower()

                    if lower_name.endswith(
                        (
                            ".html",
                            ".xhtml",
                            ".htm",
                        )
                    ):

                        simple_name = os.path.basename(
                            lower_name
                        )

                        if simple_name in {
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
                    "No readable EPUB chapters were found."
                )

            all_text = []

            for html_file in html_files:

                try:

                    raw_data = epub_zip.read(
                        html_file
                    )

                    content = raw_data.decode(
                        "utf-8",
                        errors="ignore",
                    )

                    parser = EPUBTextParser()

                    parser.feed(
                        content
                    )

                    chapter_text = parser.get_text()

                    if chapter_text.strip():

                        all_text.append(
                            chapter_text.strip()
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
# FILE EXTRACTION - PDF
# =========================================================

def extract_pdf_text(
    file_bytes: bytes,
) -> str:

    try:

        from pypdf import PdfReader

    except ImportError:

        raise RuntimeError(
            "PDF support requires pypdf. "
            "Install it with: pip install pypdf"
        )

    try:

        pdf_file = io.BytesIO(
            file_bytes
        )

        reader = PdfReader(
            pdf_file
        )

        pages = []

        for page in reader.pages:

            page_text = page.extract_text()

            if page_text:

                clean_text = page_text.strip()

                if clean_text:

                    pages.append(
                        clean_text
                    )

        final_text = "\n\n".join(
            pages
        ).strip()

        if not final_text:

            raise ValueError(
                "No readable text was found in this PDF. "
                "Scanned/image-only PDFs need OCR support."
            )

        return final_text

    except Exception as error:

        raise ValueError(
            f"PDF text extraction failed: {str(error)}"
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
        )
    }


# =========================================================
# NORMAL TEXT -> SINGLE MP3
# =========================================================

@app.post("/api/convert")
async def convert_text_to_audio(
    request: AudioRequest,
):

    try:

        clean_text = request.text.strip()

        if not clean_text:

            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty.",
            )

        if not request.voice.strip():

            raise HTTPException(
                status_code=400,
                detail="Voice cannot be empty.",
            )

        filename = (
            f"{uuid.uuid4()}.mp3"
        )

        file_path = os.path.join(
            AUDIO_FOLDER,
            filename,
        )

        communicate = edge_tts.Communicate(
            clean_text,
            request.voice,
        )

        await communicate.save(
            file_path
        )

        if not os.path.exists(
            file_path
        ):

            raise HTTPException(
                status_code=500,
                detail="Audio file was not created.",
            )

        audio_url = build_audio_url(filename)

        return {
            "message": (
                "Audiobook generated successfully"
            ),
            "audio_url": audio_url,
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# UPLOAD + EXTRACT TXT / PDF / EPUB
# =========================================================

@app.post("/api/extract")
async def extract_text_from_file(
    file: UploadFile = File(...),
):

    try:

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
            ).strip()

        elif filename.endswith(
            ".epub"
        ):

            text = extract_epub_text(
                file_bytes
            ).strip()

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported file type. "
                    "Use TXT, PDF, or EPUB."
                ),
            )

        if not text:

            raise HTTPException(
                status_code=400,
                detail=(
                    "No readable text was found "
                    "in the uploaded file."
                ),
            )

        cleaned_text = clean_extracted_text(
            text
        )

        chapters = split_into_chapters(
            cleaned_text
        )

        chapter_preview = [

            {
                "number": chapter["number"],
                "title": chapter["title"],
            }

            for chapter in chapters
        ]

        return {
            "message": (
                "Text extracted successfully."
            ),
            "text": cleaned_text,
            "chapter_count": len(chapters),
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
# GENERATE ONE CHAPTER
# =========================================================

async def generate_chapter_audio(
    job_id: str,
    chapter: dict,
    voice: str,
    semaphore: asyncio.Semaphore,
):

    async with semaphore:

        chapter_number = chapter[
            "number"
        ]

        file_name = (
            f"{job_id}_chapter_"
            f"{chapter_number}.mp3"
        )

        file_path = os.path.join(
            AUDIO_FOLDER,
            file_name,
        )

        chapter_state = (
            BOOK_JOBS[job_id]["chapters"][
                chapter_number - 1
            ]
        )

        chapter_state["status"] = (
            "processing"
        )

        try:

            communicate = edge_tts.Communicate(
                chapter["text"],
                voice,
            )

            await communicate.save(
                file_path
            )

            if not os.path.exists(
                file_path
            ):

                raise RuntimeError(
                    "Audio file was not created."
                )

            audio_url = build_audio_url(file_name)

            chapter_state["status"] = (
                "completed"
            )

            chapter_state[
                "audio_url"
            ] = audio_url

            BOOK_JOBS[job_id][
                "completed"
            ] += 1

        except Exception as error:

            chapter_state["status"] = (
                "error"
            )

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

    # Start showing PROCESSING immediately.
    if job_id in BOOK_JOBS:

        BOOK_JOBS[job_id][
            "status"
        ] = "processing"

    semaphore = asyncio.Semaphore(
        TTS_CONCURRENCY
    )

    tasks = []

    for chapter in chapters:

        tasks.append(
            asyncio.create_task(
                generate_chapter_audio(
                    job_id,
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

    if job_id in BOOK_JOBS:

        if BOOK_JOBS[job_id][
            "errors"
        ] > 0:

            BOOK_JOBS[job_id][
                "status"
            ] = "completed_with_errors"

        else:

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

    try:

        clean_text = request.text.strip()

        if not clean_text:

            raise HTTPException(
                status_code=400,
                detail="Book text cannot be empty.",
            )

        book_title = (
            request.book_title.strip()
            or "Untitled Audiobook"
        )

        voice = request.voice.strip()

        if not voice:

            raise HTTPException(
                status_code=400,
                detail="Voice cannot be empty.",
            )

        chapters = split_into_chapters(
            clean_text
        )

        if not chapters:

            raise HTTPException(
                status_code=400,
                detail=(
                    "No readable chapters were found."
                ),
            )

        job_id = str(
            uuid.uuid4()
        )

        chapter_states = []

        for chapter in chapters:

            chapter_states.append(
                {
                    "number": chapter["number"],
                    "title": chapter["title"],
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

        # IMPORTANT:
        # This starts generation in the background.
        # The API immediately returns the job ID.
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

            "total_chapters": len(chapters),

            "chapters": chapter_states,

        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


# =========================================================
# BOOK CONVERSION STATUS
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
            detail="Conversion job not found.",
        )

    return {

        "job_id": job["job_id"],

        "book_title": job["book_title"],

        "status": job["status"],

        "total": job["total"],

        "completed": job["completed"],

        "errors": job["errors"],

        "chapters": job["chapters"],

    }


# =========================================================
# OPTIONAL HEALTH CHECK
# =========================================================

@app.get("/api/health")
async def health():

    return {

        "status": "ok",

        "generated_audio_folder": AUDIO_FOLDER,

        "active_jobs": len(BOOK_JOBS),

    }

def build_audio_url(filename: str) -> str:
    return f"{PUBLIC_BASE_URL}/generated_audio/{filename}"