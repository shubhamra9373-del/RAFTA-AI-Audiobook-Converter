"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";
import {
  getBooks,
  saveBooks,
  getAudiobooks,
  saveAudiobooks,
  type SavedBook,
  type Audiobook,
} from "../../components/storage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const DEFAULT_VOICE = "en-IN-NeerjaNeural";

interface ChapterProgress {
  chapter_number?: number;
  number?: number;
  title?: string;
  chapter_title?: string;
  status?: string;
  audio_url?: string;
  error?: string;
}

interface BookJob {
  jobId: string;
  bookId: string;
  bookTitle: string;
  voice: string;
  totalChapters: number;
  completedChapters: number;
  failedChapters: number;
  progress: number;
  status: string;
  chapters: ChapterProgress[];
}

export default function BooksPage() {
  const [books, setBooks] = useState<SavedBook[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [selectedVoice, setSelectedVoice] =
    useState(DEFAULT_VOICE);

  const [activeJob, setActiveJob] =
    useState<BookJob | null>(null);

  const [generatingBookId, setGeneratingBookId] =
    useState<string | null>(null);

  /* =====================================================
     LOAD BOOKS
  ===================================================== */

  const loadBooks = () => {
    try {
      setBooks(getBooks());
    } catch (error) {
      console.error(
        "Library load error:",
        error
      );

      setBooks([]);
      setMessage(
        "Unable to load your books."
      );
    }
  };

  useEffect(() => {
    loadBooks();

    const handleStorageChange = () => {
      loadBooks();
    };

    const handleFocus = () => {
      loadBooks();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatSize = (bytes?: number) => {
    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    try {
      const parsedDate = new Date(date);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return "Unknown date";
      }

      return parsedDate.toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "Unknown date";
    }
  };

  const normalizeAudioUrl = (
    url: string
  ) => {
    if (!url) {
      return "";
    }

    if (url.startsWith("/")) {
      return `${API_URL}${url}`;
    }

    return url;
  };

  const getChapterNumber = (
    chapter: ChapterProgress,
    fallback: number
  ) => {
    const number =
      chapter.chapter_number ??
      chapter.number;

    if (
      typeof number === "number" &&
      Number.isFinite(number)
    ) {
      return number;
    }

    return fallback;
  };

  const getChapterTitle = (
    chapter: ChapterProgress,
    chapterNumber: number
  ) => {
    return (
      chapter.chapter_title?.trim() ||
      chapter.title?.trim() ||
      `Chapter ${chapterNumber}`
    );
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredBooks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return books;
    }

    return books.filter((book) => {
      const title = String(
        book.title ?? ""
      ).toLowerCase();

      const fileName = String(
        book.fileName ?? ""
      ).toLowerCase();

      const fileType = String(
        book.fileType ?? ""
      ).toLowerCase();

      return (
        title.includes(query) ||
        fileName.includes(query) ||
        fileType.includes(query)
      );
    });
  }, [books, search]);

  /* =====================================================
     DELETE BOOK
  ===================================================== */

  const deleteBook = (id: string) => {
    const confirmed =
      window.confirm(
        "Do you want to remove this book from your library?"
      );

    if (!confirmed) {
      return;
    }

    const updated =
      books.filter(
        (book) => book.id !== id
      );

    setBooks(updated);
    saveBooks(updated);

    setMessage(
      "Book removed from your library."
    );
  };

  /* =====================================================
     CLEAR BOOKS
  ===================================================== */

  const clearAllBooks = () => {
    if (books.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Do you want to remove all books from your library?"
      );

    if (!confirmed) {
      return;
    }

    saveBooks([]);
    setBooks([]);

    setMessage(
      "All books have been removed."
    );
  };

  /* =====================================================
     SAVE COMPLETED CHAPTERS
  ===================================================== */

  const saveCompletedChapters = (
    job: BookJob
  ) => {
    try {
      const existing =
        getAudiobooks();

      const completed =
        job.chapters
          .map(
            (
              chapter,
              index
            ) => {
              const chapterNumber =
                getChapterNumber(
                  chapter,
                  index + 1
                );

              return {
                chapter,
                chapterNumber,
              };
            }
          )
          .filter(
            ({
              chapter,
            }) => {
              const status =
                chapter.status
                  ?.toLowerCase() ||
                "";

              return (
                Boolean(
                  chapter.audio_url
                ) &&
                status !==
                  "failed" &&
                status !==
                  "error"
              );
            }
          );

      if (
        completed.length === 0
      ) {
        return;
      }

      const generated =
        completed.map(
          ({
            chapter,
            chapterNumber,
          }) => {
            const chapterTitle =
              getChapterTitle(
                chapter,
                chapterNumber
              );

            const audioUrl =
              normalizeAudioUrl(
                chapter.audio_url ||
                  ""
              );

            const id =
              `${job.jobId}-chapter-${chapterNumber}`;

            const audiobook: Audiobook =
              {
                id,
                title: `${job.bookTitle} — ${chapterTitle}`,
                voice: job.voice,
                audioUrl,
                createdAt:
                  new Date().toISOString(),
                bookId:
                  job.bookId,
                bookTitle:
                  job.bookTitle,
                chapterNumber,
                chapterTitle,
                status:
                  "completed",
              };

            return audiobook;
          }
        );

      const generatedMap =
        new Map(
          generated.map(
            (audio) => [
              audio.id,
              audio,
            ]
          )
        );

      const existingIds =
        new Set(
          generated.map(
            (audio) => audio.id
          )
        );

      const updatedExisting =
        existing.map(
          (audio) => {
            if (
              !existingIds.has(
                audio.id
              )
            ) {
              return audio;
            }

            return (
              generatedMap.get(
                audio.id
              ) || audio
            );
          }
        );

      const newAudio =
        generated.filter(
          (audio) =>
            !existing.some(
              (item) =>
                item.id ===
                audio.id
            )
        );

      const updated = [
        ...newAudio,
        ...updatedExisting,
      ];

      saveAudiobooks(updated);

      window.dispatchEvent(
        new Event(
          "rafta-audiobooks-updated"
        )
      );
    } catch (error) {
      console.error(
        "Failed to save generated chapters:",
        error
      );
    }
  };

  /* =====================================================
     POLL GENERATION
  ===================================================== */

  const pollJob = useCallback(
    async (
      jobId: string,
      bookId: string,
      bookTitle: string,
      voice: string
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/convert-book/${jobId}`,
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to read audiobook generation progress."
          );
        }

        const data =
          await response.json();

        const chapters: ChapterProgress[] =
          Array.isArray(
            data.chapters
          )
            ? data.chapters
            : [];

        const totalChapters =
          Number(
            data.total_chapters ??
              data.chapter_count ??
              data.total ??
              chapters.length
          ) ||
          chapters.length;

        const completedChapters =
          Number(
            data.completed_chapters ??
              data.completed
          ) ||
          chapters.filter(
            (chapter) => {
              const status =
                chapter.status
                  ?.toLowerCase() ||
                "";

              return (
                status ===
                  "completed" ||
                status ===
                  "success" ||
                status ===
                  "done"
              );
            }
          ).length;

        const failedChapters =
          Number(
            data.failed_chapters ??
              data.errors
          ) ||
          chapters.filter(
            (chapter) => {
              const status =
                chapter.status
                  ?.toLowerCase() ||
                "";

              return (
                status ===
                  "failed" ||
                status ===
                  "error"
              );
            }
          ).length;

        let progress =
          Number(
            data.progress
          );

        if (
          !Number.isFinite(
            progress
          )
        ) {
          progress =
            totalChapters > 0
              ? Math.round(
                  (completedChapters /
                    totalChapters) *
                    100
                )
              : 0;
        }

        if (
          progress > 0 &&
          progress <= 1
        ) {
          progress =
            Math.round(
              progress * 100
            );
        }

        progress =
          Math.max(
            0,
            Math.min(
              100,
              Math.round(
                progress
              )
            )
          );

        const currentJob: BookJob =
          {
            jobId,
            bookId,
            bookTitle,
            voice,
            totalChapters,
            completedChapters,
            failedChapters,
            progress,
            status:
              data.status ||
              "processing",
            chapters,
          };

        setActiveJob(
          currentJob
        );

        saveCompletedChapters(
          currentJob
        );

        const status =
          String(
            data.status ||
              ""
          ).toLowerCase();

        const finished =
          status ===
            "completed" ||
          status ===
            "completed_with_errors" ||
          status ===
            "failed";

        if (finished) {
          setGeneratingBookId(
            null
          );

          if (
            status ===
            "completed_with_errors"
          ) {
            setMessage(
              `Generation finished. ${completedChapters} chapter${
                completedChapters === 1
                  ? ""
                  : "s"
              } completed and ${failedChapters} failed.`
            );
          } else if (
            status ===
            "failed"
          ) {
            setMessage(
              "Audiobook generation failed."
            );
          } else {
            setMessage(
              `${completedChapters} chapter${
                completedChapters === 1
                  ? ""
                  : "s"
              } generated successfully.`
            );
          }

          return;
        }

        window.setTimeout(
          () => {
            pollJob(
              jobId,
              bookId,
              bookTitle,
              voice
            );
          },
          1000
        );
      } catch (error) {
        console.error(
          "Generation polling error:",
          error
        );

        setGeneratingBookId(
          null
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to track audiobook generation."
        );
      }
    },
    []
  );

  /* =====================================================
     START GENERATION
  ===================================================== */

  const generateBook = async (
    book: SavedBook
  ) => {
    if (generatingBookId) {
      setMessage(
        "Another audiobook is currently being generated."
      );
      return;
    }

    if (
      !book.content ||
      !book.content.trim()
    ) {
      setMessage(
        `${String(book.fileType ?? "Book")} file has no extracted text available. Please upload it again so RAFTA can extract the text.`
      );
      return;
    }

    try {
      setGeneratingBookId(
        book.id
      );

      setActiveJob(
        null
      );

      setMessage(
        "Starting audiobook generation..."
      );

      const response =
        await fetch(
          `${API_URL}/api/convert-book`,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                {
                  text:
                    book.content.trim(),

                  book_title:
                    String(
                      book.title ??
                        book.fileName ??
                        "Untitled Book"
                    ),

                  voice:
                    selectedVoice,
                }
              ),
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(
              () => null
            );

        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            "Failed to start audiobook generation."
        );
      }

      const data =
        await response.json();

      const jobId =
        data.job_id ||
        data.jobId ||
        data.id;

      if (!jobId) {
        throw new Error(
          "Generation job ID was not received from the backend."
        );
      }

      const initialChapters: ChapterProgress[] =
        Array.isArray(
          data.chapters
        )
          ? data.chapters
          : [];

      const totalChapters =
        Number(
          data.chapter_count ??
            data.total_chapters ??
            data.total ??
            initialChapters.length
        ) ||
        initialChapters.length;

      const bookTitle =
        String(
          book.title ??
            book.fileName ??
            "Untitled Book"
        );

      const initialJob: BookJob =
        {
          jobId,
          bookId:
            book.id,
          bookTitle,
          voice:
            selectedVoice,
          totalChapters,
          completedChapters:
            0,
          failedChapters:
            0,
          progress: 0,
          status:
            data.status ||
            "processing",
          chapters:
            initialChapters,
        };

      setActiveJob(
        initialJob
      );

      setMessage(
        `Generation started. RAFTA detected ${totalChapters} chapter${
          totalChapters === 1
            ? ""
            : "s"
        }. Audio is generating in the background.`
      );

      pollJob(
        jobId,
        book.id,
        bookTitle,
        selectedVoice
      );
    } catch (error) {
      console.error(
        "Book generation error:",
        error
      );

      setGeneratingBookId(
        null
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to start audiobook generation."
      );
    }
  };

  /* =====================================================
     OPEN CREATE PAGE
  ===================================================== */

  const openGeneratePage = (
    book: SavedBook
  ) => {
    if (
      !book.content ||
      !book.content.trim()
    ) {
      setMessage(
        "This book does not contain extracted text."
      );
      return;
    }

    try {
      sessionStorage.setItem(
        "rafta_pending_text",
        book.content
      );

      sessionStorage.setItem(
        "rafta_pending_filename",
        String(
          book.fileName ??
            book.title ??
            "Untitled Book"
        )
      );

      window.location.href =
        "/create";
    } catch (error) {
      console.error(
        "Failed to prepare book:",
        error
      );

      setMessage(
        "Unable to prepare this book for generation."
      );
    }
  };

  /* =====================================================
     JOB STATUS
  ===================================================== */

  const getJobStatusText = () => {
    if (!activeJob) {
      return "";
    }

    const status =
      activeJob.status.toLowerCase();

    if (
      status === "completed"
    ) {
      return "Completed";
    }

    if (
      status ===
      "completed_with_errors"
    ) {
      return "Completed with errors";
    }

    if (
      status === "failed"
    ) {
      return "Generation failed";
    }

    if (
      activeJob.totalChapters >
      0
    ) {
      return `Generating chapter ${
        Math.min(
          activeJob.completedChapters +
            1,
          activeJob.totalChapters
        )
      } of ${
        activeJob.totalChapters
      }`;
    }

    return "Detecting chapters...";
  };

  /* =====================================================
     TEXT STATUS
  ===================================================== */

  const getReadableTextStatus = (
    book: SavedBook
  ) => {
    if (
      book.content &&
      book.content.trim()
    ) {
      return "Text ready";
    }

    return "Text unavailable";
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <AuthGuard>
      <main className="books-page">
        <Sidebar />

        <section className="books-content">
          <header className="books-header">
            <div>
              <div className="breadcrumb">
                <span>
                  RAFTA
                </span>

                <b>/</b>

                <span>
                  Library
                </span>
              </div>

              <h1>
                Book Library
              </h1>

              <p>
                Your uploaded books are
                stored here separately
                from generated
                audiobooks.
              </p>
            </div>

            <div className="books-header-actions">
              <Link
                href="/upload"
                className="books-upload-btn"
              >
                ↑ Upload Book
              </Link>

              {books.length >
                0 && (
                <button
                  type="button"
                  className="books-clear-btn"
                  onClick={
                    clearAllBooks
                  }
                >
                  🗑 Clear
                </button>
              )}
            </div>
          </header>

          {/* STATS */}

          <section className="books-stats">
            <div className="books-stat-card">
              <div className="books-stat-icon">
                📚
              </div>

              <div>
                <span>
                  TOTAL BOOKS
                </span>

                <strong>
                  {books.length}
                </strong>

                <small>
                  Saved books
                </small>
              </div>
            </div>

            <div className="books-stat-card">
              <div className="books-stat-icon">
                TXT
              </div>

              <div>
                <span>
                  TXT
                </span>

                <strong>
                  {
                    books.filter(
                      (book) =>
                        book.fileType ===
                        "TXT"
                    ).length
                  }
                </strong>

                <small>
                  Text books
                </small>
              </div>
            </div>

            <div className="books-stat-card">
              <div className="books-stat-icon">
                💾
              </div>

              <div>
                <span>
                  STORAGE
                </span>

                <strong>
                  {formatSize(
                    books.reduce(
                      (
                        total,
                        book
                      ) =>
                        total +
                        (book.size ||
                          0),
                      0
                    )
                  )}
                </strong>

                <small>
                  Book files
                </small>
              </div>
            </div>
          </section>

          {/* TOOLBAR */}

          <section className="books-toolbar">
            <div className="books-search">
              <span>
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search books..."
              />
            </div>

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "10px",
                flexWrap:
                  "wrap",
              }}
            >
              <label
                htmlFor="book-voice"
                style={{
                  fontSize:
                    "12px",
                  opacity:
                    0.7,
                }}
              >
                Voice
              </label>

              <select
                id="book-voice"
                value={
                  selectedVoice
                }
                onChange={(
                  event
                ) =>
                  setSelectedVoice(
                    event.target
                      .value
                  )
                }
                disabled={
                  !!generatingBookId
                }
                style={{
                  minHeight:
                    "40px",
                  padding:
                    "0 12px",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(255,255,255,0.05)",
                  color:
                    "inherit",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <option value="en-IN-NeerjaNeural">
                  Neerja — Indian Female
                </option>

                <option value="en-IN-PrabhatNeural">
                  Prabhat — Indian Male
                </option>
              </select>

              <span className="books-count">
                {
                  filteredBooks.length
                }{" "}
                book
                {filteredBooks.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>
          </section>

          {/* MESSAGE */}

          {message && (
            <div className="books-message">
              <span>
                i
              </span>

              <p>
                {message}
              </p>

              <button
                type="button"
                onClick={() =>
                  setMessage("")
                }
              >
                ×
              </button>
            </div>
          )}

          {/* GENERATION PROGRESS */}

          {activeJob && (
            <section
              style={{
                marginBottom:
                  "24px",
                padding:
                  "22px",
                borderRadius:
                  "16px",
                border:
                  "1px solid rgba(124,77,255,0.25)",
                background:
                  "rgba(124,77,255,0.07)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                  alignItems:
                    "flex-start",
                  marginBottom:
                    "14px",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <span
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      letterSpacing:
                        "0.12em",
                      opacity:
                        0.6,
                      marginBottom:
                        "6px",
                    }}
                  >
                    AUDIOBOOK GENERATION
                  </span>

                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "20px",
                    }}
                  >
                    {
                      activeJob.bookTitle
                    }
                  </h2>

                  <p
                    style={{
                      margin:
                        "7px 0 0",
                      opacity:
                        0.7,
                    }}
                  >
                    {
                      getJobStatusText()
                    }
                  </p>
                </div>

                <strong
                  style={{
                    fontSize:
                      "22px",
                  }}
                >
                  {
                    activeJob.progress
                  }
                  %
                </strong>
              </div>

              <div
                style={{
                  width:
                    "100%",
                  height:
                    "9px",
                  borderRadius:
                    "999px",
                  overflow:
                    "hidden",
                  background:
                    "rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    width: `${activeJob.progress}%`,
                    height:
                      "100%",
                    borderRadius:
                      "999px",
                    background:
                      "linear-gradient(90deg,#7c4dff,#a855f7)",
                    transition:
                      "width 0.3s ease",
                  }}
                />
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginTop:
                    "12px",
                  fontSize:
                    "13px",
                  opacity:
                    0.75,
                  gap:
                    "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <span>
                  ✓{" "}
                  {
                    activeJob.completedChapters
                  }{" "}
                  completed
                </span>

                <span>
                  Total{" "}
                  {
                    activeJob.totalChapters
                  }
                </span>

                {activeJob.failedChapters >
                  0 && (
                  <span>
                    ✕{" "}
                    {
                      activeJob.failedChapters
                    }{" "}
                    failed
                  </span>
                )}
              </div>

              {activeJob.chapters
                .length >
                0 && (
                <div
                  style={{
                    marginTop:
                      "18px",
                    display:
                      "grid",
                    gap:
                      "7px",
                    maxHeight:
                      "300px",
                    overflowY:
                      "auto",
                  }}
                >
                  {activeJob.chapters.map(
                    (
                      chapter,
                      index
                    ) => {
                      const number =
                        getChapterNumber(
                          chapter,
                          index +
                            1
                        );

                      const status =
                        chapter.status?.toLowerCase() ||
                        "pending";

                      const done =
                        status ===
                          "completed" ||
                        status ===
                          "success" ||
                        status ===
                          "done";

                      const failed =
                        status ===
                          "failed" ||
                        status ===
                          "error";

                      return (
                        <div
                          key={`${activeJob.jobId}-${number}`}
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "10px",
                            padding:
                              "9px 12px",
                            borderRadius:
                              "9px",
                            background:
                              "rgba(255,255,255,0.035)",
                            fontSize:
                              "13px",
                          }}
                        >
                          <span>
                            {done
                              ? "✓"
                              : failed
                              ? "✕"
                              : status ===
                                "processing"
                              ? "⏳"
                              : "○"}
                          </span>

                          <span
                            style={{
                              flex:
                                1,
                              minWidth:
                                0,
                            }}
                          >
                            Chapter{" "}
                            {
                              number
                            }
                            {chapter.title
                              ? ` — ${chapter.title}`
                              : ""}
                          </span>

                          <span
                            style={{
                              opacity:
                                0.55,
                              fontSize:
                                "11px",
                              textTransform:
                                "capitalize",
                            }}
                          >
                            {
                              status
                            }
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {activeJob.status !==
                "processing" &&
                activeJob.status !==
                  "running" &&
                activeJob.status !==
                  "queued" &&
                !generatingBookId && (
                  <div
                    style={{
                      marginTop:
                        "16px",
                      display:
                        "flex",
                      gap:
                        "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <Link
                      href="/library"
                      className="books-details-btn"
                    >
                      🎧 Open Generated Audio
                    </Link>

                    <button
                      type="button"
                      className="books-details-btn"
                      onClick={() =>
                        setActiveJob(
                          null
                        )
                      }
                    >
                      Close
                    </button>
                  </div>
                )}
            </section>
          )}

          {/* EMPTY */}

          {books.length ===
          0 ? (
            <section className="books-empty">
              <div className="books-empty-icon">
                📚
              </div>

              <div className="books-empty-label">
                BOOK LIBRARY
              </div>

              <h2>
                No Books Yet
              </h2>

              <p>
                Upload your first
                TXT, PDF, or EPUB
                book and it will
                appear here.
              </p>

              <div className="books-empty-actions">
                <Link
                  href="/upload"
                  className="primary-btn"
                >
                  ↑ Upload Book
                </Link>

                <Link
                  href="/create"
                  className="secondary-btn"
                >
                  ✦ Start With Text
                </Link>
              </div>
            </section>
          ) : filteredBooks.length ===
            0 ? (
            <section className="books-no-results">
              <div>
                ⌕
              </div>

              <h2>
                No Matching
                Books
              </h2>

              <p>
                Nothing matches "
                {search}".
              </p>

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                Clear Search
              </button>
            </section>
          ) : (
            <section className="books-grid">
              {filteredBooks.map(
                (book) => {
                  const isGenerating =
                    generatingBookId ===
                    book.id;

                  return (
                    <article
                      key={
                        book.id
                      }
                      className="books-card"
                    >
                      <div className="books-cover">
                        <span className="books-cover-icon">
                          📖
                        </span>

                        <small>
                          RAFTA AI
                        </small>

                        <strong>
                          {
                            book.title
                          }
                        </strong>

                        <span className="books-cover-type">
                          {
                            book.fileType
                          }
                        </span>
                      </div>

                      <div className="books-card-body">
                        <div className="books-card-top">
                          <div>
                            <span className="books-file-badge">
                              {
                                book.fileType
                              }
                            </span>

                            <h2>
                              {
                                book.title
                              }
                            </h2>
                          </div>

                          <button
                            type="button"
                            className="books-delete-btn"
                            onClick={() =>
                              deleteBook(
                                book.id
                              )
                            }
                            disabled={
                              !!generatingBookId
                            }
                          >
                            🗑
                          </button>
                        </div>

                        <p className="books-file-name">
                          {
                            book.fileName
                          }
                        </p>

                        <div className="books-metadata">
                          <span>
                            {formatSize(
                              book.size
                            )}
                          </span>

                          <span>
                            {formatDate(
                              book.createdAt
                            )}
                          </span>

                          <span>
                            {getReadableTextStatus(
                              book
                            )}
                          </span>
                        </div>

                        <div className="books-card-divider"></div>

                        <div className="books-card-actions">
                          <button
                            type="button"
                            className="books-details-btn"
                            onClick={() =>
                              openGeneratePage(
                                book
                              )
                            }
                            disabled={
                              isGenerating ||
                              !!generatingBookId ||
                              !book.content ||
                              !book.content.trim()
                            }
                          >
                            Open Generate
                          </button>

                          <button
                            type="button"
                            className="books-generate-btn"
                            onClick={() =>
                              generateBook(
                                book
                              )
                            }
                            disabled={
                              isGenerating ||
                              !!generatingBookId ||
                              !book.content ||
                              !book.content.trim()
                            }
                          >
                            {isGenerating
                              ? "⏳ Generating..."
                              : "✦ Generate"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}

          {/* SEPARATION */}

          <section className="books-separation-card">
            <div className="books-separation-icon">
              ⇄
            </div>

            <div>
              <span>
                RAFTA WORKSPACE
              </span>

              <h2>
                Books and Generated
                Audio Are Separate
              </h2>

              <p>
                Your uploaded books
                stay inside this
                Library. Each
                finished chapter MP3
                is stored separately
                in Generated Audio.
              </p>
            </div>

            <Link href="/library">
              🎧 Generated Audio →
            </Link>
          </section>

          {/* FOOTER */}

          <footer className="books-footer">
            <span>
              RAFTA AI
            </span>

            <p>
              Book Library ·
              Upload · Generate
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}