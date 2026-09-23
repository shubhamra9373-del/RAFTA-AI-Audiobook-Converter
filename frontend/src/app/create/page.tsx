"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";

import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";
import {
  getAudiobooks,
  saveAudiobooks,
  type Audiobook,
} from "../../components/storage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface VoiceOption {
  value: string;
  name: string;
  language: string;
}

interface SavedSettings {
  defaultVoice?: string;
}

interface ChapterStatus {
  id?: string;
  number: number;
  title: string;
  status: "queued" | "processing" | "completed" | "error";
  audio_url?: string;
  error?: string;
}

interface BookJobResponse {
  job_id: string;
  book_title: string;
  status: string;
  total: number;
  completed: number;
  errors: number;
  chapters: ChapterStatus[];
}

const VOICES: VoiceOption[] = [
  {
    value: "en-IN-NeerjaNeural",
    name: "Neerja",
    language: "English (India)",
  },
  {
    value: "en-IN-PrabhatNeural",
    name: "Prabhat",
    language: "English (India)",
  },
  {
    value: "en-US-JennyNeural",
    name: "Jenny",
    language: "English (US)",
  },
  {
    value: "en-US-GuyNeural",
    name: "Guy",
    language: "English (US)",
  },
  {
    value: "en-GB-SoniaNeural",
    name: "Sonia",
    language: "English (UK)",
  },
  {
    value: "en-GB-RyanNeural",
    name: "Ryan",
    language: "English (UK)",
  },
];

export default function CreatePage() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("en-IN-NeerjaNeural");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [showAllVoices, setShowAllVoices] = useState(false);

  const [isBookGeneration, setIsBookGeneration] = useState(false);
  const [jobId, setJobId] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [chapterStatuses, setChapterStatuses] = useState<
    ChapterStatus[]
  >([]);
  const [completedChapters, setCompletedChapters] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);

  /* =====================================================
     HELPERS
  ===================================================== */

  const normalizeAudioUrl = (url: string) => {
    if (!url) {
      return "";
    }

    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }

    return url;
  };

  const getTitle = () => {
    if (sourceFileName) {
      return (
        sourceFileName
          .replace(/\.[^/.]+$/, "")
          .trim() || "Untitled Audiobook"
      );
    }

    const firstLine = text
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);

    return firstLine?.slice(0, 40).trim() || "Untitled Audiobook";
  };

  /* =====================================================
     LOAD SETTINGS + PENDING TEXT
  ===================================================== */

  useEffect(() => {
    try {
      const savedSettings =
        localStorage.getItem("rafta_settings");

      if (savedSettings) {
        const settings: SavedSettings =
          JSON.parse(savedSettings);

        if (
          typeof settings.defaultVoice === "string" &&
          VOICES.some(
            (item) =>
              item.value === settings.defaultVoice
          )
        ) {
          setVoice(settings.defaultVoice);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load voice settings:",
        error
      );
    }

    const pendingText = sessionStorage.getItem(
      "rafta_pending_text"
    );

    const pendingFileName =
      sessionStorage.getItem(
        "rafta_pending_filename"
      );

    if (pendingText) {
      setText(pendingText);
      sessionStorage.removeItem(
        "rafta_pending_text"
      );
    }

    if (pendingFileName) {
      setSourceFileName(pendingFileName);
      sessionStorage.removeItem(
        "rafta_pending_filename"
      );
    }
  }, []);

  /* =====================================================
     SAVE NORMAL AUDIO
  ===================================================== */

  const saveSingleAudiobook = (
    generatedAudioUrl: string
  ) => {
    try {
      const existing = getAudiobooks();

      const newAudiobook: Audiobook = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        title: getTitle(),
        voice,
        audioUrl: generatedAudioUrl,
        createdAt: new Date().toISOString(),
      };

      saveAudiobooks([
        newAudiobook,
        ...existing,
      ]);
    } catch (error) {
      console.error(
        "Failed to save audiobook:",
        error
      );
    }
  };

  /* =====================================================
     SAVE COMPLETED CHAPTERS
  ===================================================== */

  const saveCompletedChapters = (
    chapters: ChapterStatus[],
    generatedBookTitle: string
  ) => {
    if (!jobId) {
      return;
    }

    try {
      const existing = getAudiobooks();

      const completed = chapters.filter(
        (chapter) =>
          chapter.status === "completed" &&
          typeof chapter.audio_url === "string" &&
          chapter.audio_url
      );

      if (completed.length === 0) {
        return;
      }

      const existingIds = new Set(
        existing.map((book) => book.id)
      );

      const newAudiobooks: Audiobook[] = [];

      for (const chapter of completed) {
        const chapterId = `${jobId}-chapter-${chapter.number}`;

        if (existingIds.has(chapterId)) {
          continue;
        }

        newAudiobooks.push({
          id: chapterId,
          title: `${generatedBookTitle} — ${chapter.title}`,
          voice,
          audioUrl: normalizeAudioUrl(
            chapter.audio_url || ""
          ),
          createdAt: new Date().toISOString(),

          bookId: jobId,
          bookTitle: generatedBookTitle,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title,
          status: "completed",
        });
      }

      if (newAudiobooks.length > 0) {
        saveAudiobooks([
          ...newAudiobooks,
          ...existing,
        ]);

        window.dispatchEvent(
          new Event("rafta-audiobooks-updated")
        );
      }
    } catch (error) {
      console.error(
        "Failed to save chapter audiobooks:",
        error
      );
    }
  };

  /* =====================================================
     JOB POLLING
  ===================================================== */

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;
    let finished = false;

    const pollJob = async () => {
      if (finished) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/convert-book/${jobId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to read audiobook generation status."
          );
        }

        const data: BookJobResponse =
          await response.json();

        if (cancelled) {
          return;
        }

        const chapters = Array.isArray(
          data.chapters
        )
          ? data.chapters
          : [];

        setChapterStatuses(chapters);
        setCompletedChapters(
          Number(data.completed || 0)
        );
        setTotalChapters(
          Number(data.total || 0)
        );
        setBookTitle(
          data.book_title || getTitle()
        );

        saveCompletedChapters(
          chapters,
          data.book_title || getTitle()
        );

        if (data.status === "completed") {
          finished = true;

          setLoading(false);
          setIsBookGeneration(true);

          setMessage(
            Number(data.errors || 0) > 0
              ? `${data.completed} chapter(s) generated. ${data.errors} chapter(s) failed.`
              : `Book ready! ${data.completed} chapter(s) generated successfully.`
          );

          return;
        }

        setLoading(true);
        setIsBookGeneration(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Chapter job polling error:",
          error
        );

        setLoading(false);

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to check audiobook generation status."
        );
      }
    };

    pollJob();

    const interval = window.setInterval(
      pollJob,
      1500
    );

    return () => {
      cancelled = true;
      finished = true;
      window.clearInterval(interval);
    };
  }, [jobId]);

  /* =====================================================
     SAVE CHAPTERS WHEN JOB UPDATES
  ===================================================== */

  useEffect(() => {
    if (
      !jobId ||
      !bookTitle ||
      chapterStatuses.length === 0 ||
      completedChapters <= 0
    ) {
      return;
    }

    saveCompletedChapters(
      chapterStatuses,
      bookTitle
    );
  }, [
    jobId,
    bookTitle,
    chapterStatuses,
    completedChapters,
  ]);

  /* =====================================================
     TEXT CHANGE
  ===================================================== */

  const handleTextChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setText(event.target.value);

    if (message) {
      setMessage("");
    }

    setAudioUrl("");

    if (!sourceFileName) {
      setIsBookGeneration(false);
    }
  };

  /* =====================================================
     FILE UPLOAD
  ===================================================== */

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    const allowedExtensions = [
      ".txt",
      ".pdf",
      ".epub",
    ];

    if (!allowedExtensions.includes(extension)) {
      setMessage(
        "Please upload a TXT, PDF, or EPUB file."
      );
      event.target.value = "";
      return;
    }

    try {
      setLoading(true);

      setMessage(
        "Reading your book and detecting chapters..."
      );

      setAudioUrl("");
      setJobId("");
      setBookTitle("");
      setChapterStatuses([]);
      setCompletedChapters(0);
      setTotalChapters(0);
      setIsBookGeneration(false);

      let fileText = "";

      if (extension === ".txt") {
        fileText = await file.text();
      } else {
        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch(
          `${API_URL}/api/extract`,
          {
            method: "POST",
            body: formData,
          }
        );

        let data: {
          detail?: string;
          text?: string;
          chapter_count?: number;
          chapters?: {
            number: number;
            title: string;
          }[];
        } = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to extract text from this file."
          );
        }

        fileText =
          typeof data.text === "string"
            ? data.text
            : "";
      }

      if (!fileText.trim()) {
        throw new Error(
          "No readable text was found in this file."
        );
      }

      setText(fileText.trim());
      setSourceFileName(file.name);

      setMessage(
        `${file.name} loaded. Click "Generate Audiobook" to create it chapter by chapter.`
      );
    } catch (error) {
      console.error(
        "Create file upload error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to read the selected file."
      );
    } finally {
      setLoading(false);
    }

    event.target.value = "";
  };

  /* =====================================================
     NORMAL TEXT AUDIO
  ===================================================== */

  const generateSingleAudio = async (
    cleanText: string
  ) => {
    const response = await fetch(
      `${API_URL}/api/convert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          voice,
        }),
      }
    );

    let data: {
      detail?: string;
      audio_url?: string;
      audioUrl?: string;
      url?: string;
    } = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.detail ||
          `Conversion failed with status ${response.status}`
      );
    }

    let generatedUrl =
      data.audio_url ||
      data.audioUrl ||
      data.url;

    if (!generatedUrl) {
      throw new Error(
        "Backend did not return an audio URL."
      );
    }

    generatedUrl =
      normalizeAudioUrl(generatedUrl);

    setAudioUrl(generatedUrl);

    saveSingleAudiobook(generatedUrl);

    window.dispatchEvent(
      new Event("rafta-audiobooks-updated")
    );

    setMessage(
      "Audiobook generated successfully."
    );
  };

  /* =====================================================
     BOOK GENERATION
  ===================================================== */

  const generateBookAudio = async (
    cleanText: string
  ) => {
    const title = getTitle();

    const response = await fetch(
      `${API_URL}/api/convert-book`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          book_title: title,
          voice,
        }),
      }
    );

    let data: {
      detail?: string;
      job_id?: string;
      book_title?: string;
      total_chapters?: number;
      chapters?: {
        number: number;
        title: string;
        status: "queued";
      }[];
    } = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.detail ||
          `Book conversion failed with status ${response.status}`
      );
    }

    if (!data.job_id) {
      throw new Error(
        "Backend did not return a conversion job ID."
      );
    }

    const total = Number(
      data.total_chapters || 0
    );

    const initialChapters: ChapterStatus[] =
      Array.isArray(data.chapters)
        ? data.chapters.map((chapter) => ({
            number: chapter.number,
            title: chapter.title,
            status: "queued",
          }))
        : [];

    setJobId(data.job_id);

    setBookTitle(
      data.book_title || title
    );

    setChapterStatuses(
      initialChapters
    );

    setTotalChapters(total);
    setCompletedChapters(0);
    setIsBookGeneration(true);

    setMessage(
      total > 0
        ? `Book detected with ${total} chapter(s). Audio generation has started in the background.`
        : "Book generation started."
    );
  };

  /* =====================================================
     MAIN GENERATE
  ===================================================== */

  const handleGenerate = async () => {
    const cleanText = text.trim();

    if (!cleanText) {
      setMessage(
        "Please enter some text or upload a book first."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setAudioUrl("");

    try {
      if (sourceFileName) {
        await generateBookAudio(cleanText);
      } else {
        await generateSingleAudio(cleanText);
        setIsBookGeneration(false);
      }
    } catch (error) {
      console.error(
        "Audiobook generation error:",
        error
      );

      setLoading(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate audiobook. Please make sure the backend is running."
      );
    }
  };

  /* =====================================================
     CLEAR
  ===================================================== */

  const clearEditor = () => {
    setText("");
    setSourceFileName("");
    setAudioUrl("");
    setMessage("");

    setJobId("");
    setBookTitle("");
    setChapterStatuses([]);
    setCompletedChapters(0);
    setTotalChapters(0);
    setIsBookGeneration(false);
  };

  /* =====================================================
     VOICES
  ===================================================== */

  const visibleVoices = showAllVoices
    ? VOICES
    : VOICES.slice(0, 4);

  const generationProgress =
    totalChapters > 0
      ? Math.min(
          100,
          Math.round(
            (completedChapters /
              totalChapters) *
              100
          )
        )
      : 0;

  return (
    <AuthGuard>
      <main className="create-page">
        <Sidebar />

        <section className="create-content">
          <header className="create-header">
            <div>
              <div className="breadcrumb">
                <span>RAFTA</span>
                <b>/</b>
                <span>Generate</span>
              </div>

              <h1>
                Create Your Audiobook
              </h1>

              <p>
                Add your text, choose an AI
                voice, and transform it into a
                natural-sounding audiobook.
              </p>
            </div>

            <Link
              href="/books"
              className="create-library-link"
            >
              📚 Book Library
            </Link>
          </header>

          <div className="create-layout">
            <div className="create-main-column">
              {/* CONTENT */}

              <section className="create-card">
                <div className="create-card-heading">
                  <div className="create-card-heading-icon">
                    ✎
                  </div>

                  <div>
                    <span>STEP 01</span>

                    <h2>
                      Add Your Content
                    </h2>

                    <p>
                      Paste text or load a TXT,
                      PDF, or EPUB book.
                    </p>
                  </div>
                </div>

                <div className="create-editor">
                  <div className="create-editor-top">
                    <div>
                      <span className="create-editor-dot">
                        •
                      </span>

                      <span>
                        TEXT EDITOR
                      </span>
                    </div>

                    <span>
                      {text.length.toLocaleString()}{" "}
                      characters
                    </span>
                  </div>

                  <textarea
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Paste your story, article, notes, or book text here..."
                    className="create-textarea"
                  />

                  <div className="create-editor-bottom">
                    <span>
                      {sourceFileName
                        ? `Loaded: ${sourceFileName}`
                        : "Your text stays in this browser until you generate audio."}
                    </span>

                    {text && (
                      <button
                        type="button"
                        onClick={
                          clearEditor
                        }
                        className="create-clear-btn"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="create-upload-row">
                  <label
                    htmlFor="create-book-upload"
                    className="create-upload-btn"
                  >
                    <span>↑</span>
                    Load Book File
                  </label>

                  <input
                    id="create-book-upload"
                    type="file"
                    accept=".txt,.pdf,.epub"
                    onChange={
                      handleFileUpload
                    }
                    disabled={loading}
                    hidden
                  />

                  <span className="create-upload-note">
                    TXT, PDF, and EPUB files are
                    supported.
                  </span>
                </div>
              </section>

              {/* VOICES */}

              <section className="create-card">
                <div className="create-card-heading">
                  <div className="create-card-heading-icon">
                    🎙
                  </div>

                  <div>
                    <span>STEP 02</span>

                    <h2>
                      Select AI Voice
                    </h2>

                    <p>
                      Choose the voice that fits
                      your audiobook.
                    </p>
                  </div>
                </div>

                <div className="create-voice-grid">
                  {visibleVoices.map(
                    (item) => {
                      const selected =
                        voice ===
                        item.value;

                      return (
                        <button
                          key={
                            item.value
                          }
                          type="button"
                          className={`create-voice-card ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            setVoice(
                              item.value
                            )
                          }
                        >
                          <div className="create-voice-icon">
                            🎙
                          </div>

                          <div className="create-voice-info">
                            <strong>
                              {item.name}
                            </strong>

                            <span>
                              {
                                item.language
                              }
                            </span>
                          </div>

                          {selected && (
                            <div className="create-voice-check">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  className="create-more-voices"
                  onClick={() =>
                    setShowAllVoices(
                      (current) =>
                        !current
                    )
                  }
                >
                  {showAllVoices
                    ? "Show fewer voices ↑"
                    : "Show more voices ↓"}
                </button>
              </section>
            </div>

            <aside className="create-side-column">
              {/* SUMMARY */}

              <section className="create-side-card create-summary-card">
                <div className="create-side-heading">
                  <span>03</span>

                  <div>
                    <small>
                      READY TO CREATE
                    </small>

                    <h3>
                      Generation Summary
                    </h3>
                  </div>
                </div>

                <div className="create-summary-row">
                  <span>
                    Content
                  </span>

                  <strong>
                    {text.trim()
                      ? `${text
                          .trim()
                          .length.toLocaleString()} chars`
                      : "Not added"}
                  </strong>
                </div>

                <div className="create-summary-row">
                  <span>
                    Voice
                  </span>

                  <strong>
                    {
                      VOICES.find(
                        (item) =>
                          item.value ===
                          voice
                      )?.name
                    }
                  </strong>
                </div>

                <div className="create-summary-row">
                  <span>
                    Output
                  </span>

                  <strong>
                    MP3
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="create-generate-btn"
                >
                  {loading ? (
                    <>
                      <span className="create-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>✦</span>
                      Generate Audiobook
                    </>
                  )}
                </button>

                {isBookGeneration &&
                  totalChapters > 0 && (
                    <div
                      style={{
                        marginTop:
                          "18px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "8px",
                          fontSize:
                            "13px",
                        }}
                      >
                        <span>
                          Chapter progress
                        </span>

                        <strong>
                          {
                            completedChapters
                          }{" "}
                          /{" "}
                          {
                            totalChapters
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          width:
                            "100%",
                          height:
                            "8px",
                          borderRadius:
                            "999px",
                          background:
                            "rgba(255,255,255,0.08)",
                          overflow:
                            "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${generationProgress}%`,
                            height:
                              "100%",
                            borderRadius:
                              "999px",
                            background:
                              "linear-gradient(90deg, #7c4dff, #00d4ff)",
                            transition:
                              "width 0.3s ease",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop:
                            "10px",
                          fontSize:
                            "12px",
                          opacity:
                            0.75,
                        }}
                      >
                        {generationProgress}%{" "}
                        complete
                      </div>
                    </div>
                  )}
              </section>

              {/* OUTPUT */}

              <section className="create-side-card">
                <div className="create-side-simple-heading">
                  <span>♫</span>

                  <div>
                    <small>
                      OUTPUT
                    </small>

                    <h3>
                      Generated Audio
                    </h3>
                  </div>
                </div>

                {isBookGeneration ? (
                  <div className="create-generated-box">
                    <div className="create-generated-success">
                      <span>✓</span>

                      {bookTitle ||
                        getTitle()}
                    </div>

                    <h4>
                      Chapter Playlist
                    </h4>

                    {chapterStatuses.length ===
                    0 ? (
                      <div className="create-audio-empty">
                        <div className="create-audio-empty-icon">
                          ♫
                        </div>

                        <h4>
                          Preparing chapters
                        </h4>

                        <p>
                          Chapter detection is
                          complete and audio
                          generation has started.
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          gap: "10px",
                        }}
                      >
                        {chapterStatuses.map(
                          (chapter) => {
                            const chapterUrl =
                              normalizeAudioUrl(
                                chapter.audio_url ||
                                  ""
                              );

                            return (
                              <div
                                key={`${jobId}-${chapter.number}`}
                                style={{
                                  padding:
                                    "12px",
                                  border:
                                    "1px solid rgba(255,255,255,0.08)",
                                  borderRadius:
                                    "12px",
                                  background:
                                    "rgba(255,255,255,0.025)",
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "space-between",
                                    gap:
                                      "10px",
                                    marginBottom:
                                      chapterUrl
                                        ? "10px"
                                        : "0",
                                  }}
                                >
                                  <div>
                                    <strong
                                      style={{
                                        display:
                                          "block",
                                      }}
                                    >
                                      Chapter{" "}
                                      {
                                        chapter.number
                                      }
                                    </strong>

                                    <span
                                      style={{
                                        fontSize:
                                          "12px",
                                        opacity:
                                          0.7,
                                      }}
                                    >
                                      {
                                        chapter.title
                                      }
                                    </span>
                                  </div>

                                  <span
                                    style={{
                                      fontSize:
                                        "11px",
                                      textTransform:
                                        "uppercase",
                                      opacity:
                                        0.8,
                                    }}
                                  >
                                    {chapter.status ===
                                    "completed"
                                      ? "Ready"
                                      : chapter.status ===
                                        "processing"
                                      ? "Processing"
                                      : chapter.status ===
                                        "error"
                                      ? "Error"
                                      : "Queued"}
                                  </span>
                                </div>

                                {chapterUrl && (
                                  <audio
                                    controls
                                    preload="metadata"
                                    src={
                                      chapterUrl
                                    }
                                    className="create-audio-player"
                                  >
                                    Your browser
                                    does not
                                    support audio.
                                  </audio>
                                )}

                                {chapter.status ===
                                  "error" &&
                                  chapter.error && (
                                    <p
                                      style={{
                                        margin:
                                          "8px 0 0",
                                        fontSize:
                                          "12px",
                                        opacity:
                                          0.75,
                                      }}
                                    >
                                      {
                                        chapter.error
                                      }
                                    </p>
                                  )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    <Link
                      href="/library"
                      className="create-library-audio-btn"
                      style={{
                        marginTop:
                          "14px",
                        display:
                          "block",
                      }}
                    >
                      🎧 View Generated Audio
                    </Link>
                  </div>
                ) : !audioUrl ? (
                  <div className="create-audio-empty">
                    <div className="create-audio-empty-icon">
                      ♫
                    </div>

                    <h4>
                      No audio generated yet
                    </h4>

                    <p>
                      Your finished audiobook will
                      appear here after successful
                      generation.
                    </p>
                  </div>
                ) : (
                  <div className="create-generated-box">
                    <div className="create-generated-success">
                      <span>✓</span>
                      Audiobook ready
                    </div>

                    <h4>
                      {getTitle()}
                    </h4>

                    <audio
                      controls
                      preload="metadata"
                      src={audioUrl}
                      className="create-audio-player"
                    >
                      Your browser does not
                      support audio.
                    </audio>

                    <div className="create-output-actions">
                      <a
                        href={audioUrl}
                        download={`${getTitle()}.mp3`}
                        className="create-download-btn"
                      >
                        ↓ Download
                      </a>

                      <a
                        href={audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="create-open-btn"
                      >
                        ↗ Open Audio
                      </a>
                    </div>

                    <Link
                      href="/library"
                      className="create-library-audio-btn"
                    >
                      🎧 View Generated Audio
                    </Link>
                  </div>
                )}
              </section>

              {/* TIP */}

              <section className="create-tip-card">
                <div className="create-tip-icon">
                  ✦
                </div>

                <div>
                  <strong>
                    Better Results
                  </strong>

                  <p>
                    Use clear paragraphs and
                    natural punctuation for smoother
                    audiobook narration.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          {/* BOTTOM INFO */}

          <section className="create-bottom-info">
            <div>
              <span>📚</span>

              <div>
                <strong>
                  Books stay separate
                </strong>

                <p>
                  Your uploaded books belong in
                  the Book Library.
                </p>
              </div>
            </div>

            <div>
              <span>🎧</span>

              <div>
                <strong>
                  Audio stays separate
                </strong>

                <p>
                  Your finished MP3 files belong in
                  Generated Audio.
                </p>
              </div>
            </div>

            <Link href="/books">
              Manage Library →
            </Link>
          </section>
        </section>
      </main>
    </AuthGuard>
  );
}
