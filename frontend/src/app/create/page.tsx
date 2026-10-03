"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import Sidebar from "../../components/Sidebar";

import AuthGuard from "../../components/AuthGuard";

const LOCAL_API_URL =
  "http://127.0.0.1:8000";

const PUBLIC_API_URL =
  "https://rafta-ai-audiobook-converter.onrender.com";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/+$/,
    ""
  ) ||
  (typeof window !== "undefined" &&
  (window.location.hostname ===
    "localhost" ||
    window.location.hostname ===
      "127.0.0.1")
    ? LOCAL_API_URL
    : PUBLIC_API_URL);

type VoiceOption = {
  value: string;
  name: string;
  language: string;
};

type SavedSettings = {
  defaultVoice?: string;
};

type BackgroundStatus = {
  active: boolean;
  type: "book" | "single" | null;
  title: string;
  completed: number;
  total: number;
  message: string;
  audioUrl?: string;
  error?: boolean;
};

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

const STATUS_EVENT =
  "rafta-background-generation-status";

const STATUS_KEY =
  "rafta_background_generation_status";

export default function CreatePage() {
  const [text, setText] =
    useState("");

  const [voice, setVoice] =
    useState(
      "en-IN-NeerjaNeural"
    );

  const [audioUrl, setAudioUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [sourceFileName, setSourceFileName] =
    useState("");

  const [showAllVoices, setShowAllVoices] =
    useState(false);

  const [backgroundStatus, setBackgroundStatus] =
    useState<BackgroundStatus | null>(
      null
    );

  const normalizeAudioUrl = (
    url: string
  ) => {
    if (!url) {
      return "";
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }

    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
  };

  const getTitle = () => {
    if (sourceFileName) {
      return (
        sourceFileName
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .trim() ||
        "Untitled Audiobook"
      );
    }

    const firstLine =
      text
        .split("\n")
        .map((line) =>
          line.trim()
        )
        .find(Boolean);

    return (
      firstLine?.slice(
        0,
        40
      ).trim() ||
      "Untitled Audiobook"
    );
  };

  useEffect(() => {
    try {
      const savedSettings =
        localStorage.getItem(
          "rafta_settings"
        );

      if (savedSettings) {
        const settings =
          JSON.parse(
            savedSettings
          ) as SavedSettings;

        if (
          typeof settings.defaultVoice ===
            "string" &&
          VOICES.some(
            (item) =>
              item.value ===
              settings.defaultVoice
          )
        ) {
          setVoice(
            settings.defaultVoice
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load voice settings:",
        error
      );
    }

    try {
      const pendingText =
        sessionStorage.getItem(
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
        setSourceFileName(
          pendingFileName
        );

        sessionStorage.removeItem(
          "rafta_pending_filename"
        );
      }
    } catch (error) {
      console.error(
        "Could not restore pending content:",
        error
      );
    }

    try {
      const savedStatus =
        localStorage.getItem(
          STATUS_KEY
        );

      if (savedStatus) {
        const parsed =
          JSON.parse(
            savedStatus
          ) as BackgroundStatus;

        setBackgroundStatus(
          parsed
        );

        if (
          parsed.type ===
            "single" &&
          parsed.audioUrl
        ) {
          setAudioUrl(
            parsed.audioUrl
          );
        }

        if (
          parsed.active
        ) {
          setLoading(
            false
          );
          setMessage(
            parsed.message
          );
        }
      }
    } catch (error) {
      console.error(
        "Could not restore generation status:",
        error
      );
    }

    const handleStatus =
      (event: Event) => {
        const customEvent =
          event as CustomEvent<BackgroundStatus>;

        const nextStatus =
          customEvent.detail;

        if (!nextStatus) {
          return;
        }

        setBackgroundStatus(
          nextStatus
        );

        setLoading(false);

        if (
          nextStatus.audioUrl
        ) {
          setAudioUrl(
            nextStatus.audioUrl
          );
        }

        setMessage(
          nextStatus.message
        );
      };

    window.addEventListener(
      STATUS_EVENT,
      handleStatus
    );

    return () => {
      window.removeEventListener(
        STATUS_EVENT,
        handleStatus
      );
    };
  }, []);

  const handleTextChange =
    (
      event: ChangeEvent<HTMLTextAreaElement>
    ) => {
      setText(
        event.target.value
      );

      setAudioUrl("");

      if (message) {
        setMessage("");
      }

      if (!sourceFileName) {
        setBackgroundStatus(
          null
        );
      }
    };

  const handleFileUpload =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const extension =
        file.name
          .substring(
            file.name.lastIndexOf(
              "."
            )
          )
          .toLowerCase();

      const allowedExtensions = [
        ".txt",
        ".pdf",
        ".epub",
      ];

      if (
        !allowedExtensions.includes(
          extension
        )
      ) {
        setMessage(
          "Please upload a TXT, PDF, or EPUB file."
        );

        event.target.value =
          "";

        return;
      }

      try {
        setLoading(true);

        setMessage(
          "Reading your book and detecting chapters..."
        );

        setAudioUrl("");

        let fileText = "";

        if (
          extension ===
          ".txt"
        ) {
          fileText =
            await file.text();
        } else {
          const formData =
            new FormData();

          formData.append(
            "file",
            file
          );

          let response: Response;

          try {
            response =
              await fetch(
                `${API_URL}/api/extract`,
                {
                  method:
                    "POST",
                  body: formData,
                }
              );
          } catch (error) {
            console.error(
              "Book extraction request failed:",
              error
            );

            throw new Error(
              `Unable to connect to the RAFTA backend at ${API_URL}.`
            );
          }

          let data: {
            detail?: string;
            text?: string;
          } = {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }

          if (
            !response.ok
          ) {
            throw new Error(
              data.detail ||
                `Unable to extract text from the ${extension} file.`
            );
          }

          fileText =
            typeof data.text ===
            "string"
              ? data.text
              : "";
        }

        if (
          !fileText.trim()
        ) {
          throw new Error(
            "No readable text was found in this file."
          );
        }

        setText(
          fileText.trim()
        );

        setSourceFileName(
          file.name
        );

        setMessage(
          `${file.name} loaded. Click "Generate Audiobook" to generate the book chapter by chapter.`
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
        setLoading(
          false
        );
      }

      event.target.value =
        "";
    };

  const startBackgroundGeneration =
    () => {
      const cleanText =
        text.trim();

      if (!cleanText) {
        setMessage(
          "Please enter some text or upload a book first."
        );

        return;
      }

      const title =
        getTitle();

      const generationType =
        sourceFileName
          ? "book"
          : "single";

      setLoading(true);

      setAudioUrl("");

      const event =
        new CustomEvent(
          "rafta-start-background-generation",
          {
            detail: {
              type:
                generationType,
              text: cleanText,
              title,
              voice,
            },
          }
        );

      window.dispatchEvent(
        event
      );

      setMessage(
        sourceFileName
          ? "Book generation started in the background. You can safely open Library, Dashboard, Player, or any other page."
          : "Audiobook generation started in the background. You can safely open Library, Dashboard, Player, or any other page."
      );

      setLoading(
        false
      );
    };

  const clearEditor = () => {
    setText("");

    setSourceFileName("");

    setAudioUrl("");

    setMessage("");

    setBackgroundStatus(
      null
    );
  };

  const visibleVoices =
    showAllVoices
      ? VOICES
      : VOICES.slice(0, 4);

  const total =
    backgroundStatus?.total ||
    0;

  const completed =
    backgroundStatus?.completed ||
    0;

  const generationProgress =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (completed /
              total) *
              100
          )
        )
      : 0;

  const isBackgroundActive =
    Boolean(
      backgroundStatus?.active
    );

  const isBookGeneration =
    sourceFileName ||
    backgroundStatus?.type ===
      "book";

  return (
    <AuthGuard>
      <main className="create-page">
        <Sidebar />

        <section className="create-content">
          <header className="create-header">
            <div>
              <div className="breadcrumb">
                <span>
                  RAFTA
                </span>

                <b>/</b>

                <span>
                  Generate
                </span>
              </div>

              <h1>
                Create Your Audiobook
              </h1>

              <p>
                Add your text, choose
                an AI voice, and
                transform it into a
                natural-sounding
                audiobook.
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
              <section className="create-card">
                <div className="create-card-heading">
                  <div className="create-card-heading-icon">
                    ✎
                  </div>

                  <div>
                    <span>
                      STEP 01
                    </span>

                    <h2>
                      Add Your Content
                    </h2>

                    <p>
                      Paste text or
                      load a TXT,
                      PDF, or EPUB
                      book.
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
                    onChange={
                      handleTextChange
                    }
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
                    <span>
                      ↑
                    </span>

                    Load Book File
                  </label>

                  <input
                    id="create-book-upload"
                    type="file"
                    accept=".txt,.pdf,.epub"
                    onChange={
                      handleFileUpload
                    }
                    disabled={
                      loading ||
                      isBackgroundActive
                    }
                    hidden
                  />

                  <span className="create-upload-note">
                    TXT, PDF,
                    and EPUB files
                    are supported.
                  </span>
                </div>
              </section>

              <section className="create-card">
                <div className="create-card-heading">
                  <div className="create-card-heading-icon">
                    🎙
                  </div>

                  <div>
                    <span>
                      STEP 02
                    </span>

                    <h2>
                      Select AI Voice
                    </h2>

                    <p>
                      Choose the voice
                      that fits your
                      audiobook.
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
                          disabled={
                            isBackgroundActive
                          }
                        >
                          <div className="create-voice-icon">
                            🎙
                          </div>

                          <div className="create-voice-info">
                            <strong>
                              {
                                item.name
                              }
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
              <section className="create-side-card create-summary-card">
                <div className="create-side-heading">
                  <span>
                    03
                  </span>

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
                      ? `${text.trim().length.toLocaleString()} chars`
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
                  onClick={
                    startBackgroundGeneration
                  }
                  disabled={
                    loading ||
                    isBackgroundActive ||
                    !text.trim()
                  }
                  className="create-generate-btn"
                >
                  {isBackgroundActive ? (
                    <>
                      <span className="create-spinner"></span>

                      Generating...
                    </>
                  ) : (
                    <>
                      <span>
                        ✦
                      </span>

                      Generate Audiobook
                    </>
                  )}
                </button>

                {isBackgroundActive &&
                  total > 0 && (
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
                          {completed}
                          {" / "}
                          {total}
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
                            width:
                              `${generationProgress}%`,
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
                        {
                          generationProgress
                        }
                        % complete
                      </div>
                    </div>
                  )}
              </section>

              <section className="create-side-card">
                <div className="create-side-simple-heading">
                  <span>
                    ♫
                  </span>

                  <div>
                    <small>
                      OUTPUT
                    </small>

                    <h3>
                      Generated Audio
                    </h3>
                  </div>
                </div>

                {audioUrl ? (
                  <div className="create-generated-box">
                    <div className="create-generated-success">
                      <span>
                        ✓
                      </span>

                      Audiobook ready
                    </div>

                    <h4>
                      {getTitle()}
                    </h4>

                    <audio
                      controls
                      preload="metadata"
                      src={
                        audioUrl
                      }
                      className="create-audio-player"
                    >
                      Your browser does not
                      support audio.
                    </audio>

                    <div className="create-output-actions">
                      <a
                        href={
                          audioUrl
                        }
                        download={`${getTitle()}.mp3`}
                        className="create-download-btn"
                      >
                        ↓ Download
                      </a>

                      <a
                        href={
                          audioUrl
                        }
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
                ) : isBookGeneration &&
                  isBackgroundActive ? (
                  <div className="create-generated-box">
                    <div className="create-generated-success">
                      <span>
                        ⟳
                      </span>

                      Background generation
                    </div>

                    <h4>
                      {getTitle()}
                    </h4>

                    <div className="create-audio-empty">
                      <div className="create-audio-empty-icon">
                        ♫
                      </div>

                      <h4>
                        {total >
                        0
                          ? `${completed}/${total} chapters generated`
                          : "Preparing chapters"}
                      </h4>

                      <p>
                        You can leave this page.
                        RAFTA will continue
                        generating your
                        audiobook in the
                        background.
                      </p>
                    </div>

                    <Link
                      href="/library"
                      className="create-library-audio-btn"
                    >
                      🎧 View Generated Audio
                    </Link>
                  </div>
                ) : (
                  <div className="create-audio-empty">
                    <div className="create-audio-empty-icon">
                      ♫
                    </div>

                    <h4>
                      No audio generated yet
                    </h4>

                    <p>
                      Your finished
                      audiobook will appear
                      here after successful
                      generation.
                    </p>
                  </div>
                )}

                {message && (
                  <p
                    style={{
                      margin:
                        "14px 0 0",
                      fontSize:
                        "12px",
                      lineHeight:
                        1.5,
                      opacity:
                        0.75,
                    }}
                  >
                    {message}
                  </p>
                )}
              </section>

              <section className="create-tip-card">
                <div className="create-tip-icon">
                  ✦
                </div>

                <div>
                  <strong>
                    Background Generation
                  </strong>

                  <p>
                    Once generation starts,
                    you can open other RAFTA
                    pages without cancelling
                    the audiobook process.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <section className="create-bottom-info">
            <div>
              <span>
                📚
              </span>

              <div>
                <strong>
                  Books stay separate
                </strong>

                <p>
                  Your uploaded books belong
                  in the Book Library.
                </p>
              </div>
            </div>

            <div>
              <span>
                🎧
              </span>

              <div>
                <strong>
                  Audio stays separate
                </strong>

                <p>
                  Your finished MP3 files belong
                  in Generated Audio.
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