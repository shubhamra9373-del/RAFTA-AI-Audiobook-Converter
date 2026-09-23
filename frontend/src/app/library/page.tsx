"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";
import {
  getAudiobooks,
  saveAudiobooks,
  type Audiobook,
} from "../../components/storage";

interface GeneratedBook {
  id: string;
  title: string;
  voice: string;
  createdAt: string;
  chapters: Audiobook[];
}

const getChapterNumberFromTitle = (
  title: string
): number | null => {
  const match = title.match(
    /(?:chapter|part)\s+(\d+)/i
  );

  if (!match) {
    return null;
  }

  const number = Number(match[1]);

  return Number.isFinite(number)
    ? number
    : null;
};

const getChapterTitleFromTitle = (
  title: string
): string => {
  if (!title.includes(" — ")) {
    return title;
  }

  const parts = title
    .split(" — ")
    .map((part) => part.trim());

  if (parts.length < 2) {
    return title;
  }

  return parts
    .slice(1)
    .join(" — ")
    .trim();
};

const isChapterAudio = (
  audio: Audiobook
): boolean => {
  if (
    audio.bookId ||
    audio.chapterNumber ||
    audio.chapterTitle
  ) {
    return true;
  }

  return (
    audio.title.includes(" — ") &&
    Boolean(
      getChapterNumberFromTitle(
        getChapterTitleFromTitle(
          audio.title
        )
      )
    )
  );
};

export default function GeneratedAudioPage() {
  const [audiobooks, setAudiobooks] =
    useState<Audiobook[]>([]);

  const [search, setSearch] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [playingId, setPlayingId] =
    useState<string | null>(null);

  const [expandedBooks, setExpandedBooks] =
    useState<Set<string>>(new Set());

  /* =====================================================
     LOAD AUDIO
  ===================================================== */

  const loadAudiobooks = () => {
    try {
      setAudiobooks(getAudiobooks());
    } catch (error) {
      console.error(
        "Generated audio load error:",
        error
      );

      setAudiobooks([]);

      setMessage(
        "Unable to load your generated audiobooks."
      );
    }
  };

  useEffect(() => {
    loadAudiobooks();

    const handleStorageUpdate = () => {
      loadAudiobooks();
    };

    const handleFocus = () => {
      loadAudiobooks();
    };

    window.addEventListener(
      "rafta-audiobooks-updated",
      handleStorageUpdate
    );

    window.addEventListener(
      "storage",
      handleStorageUpdate
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "rafta-audiobooks-updated",
        handleStorageUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorageUpdate
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  /* =====================================================
     GROUP BOOKS + CHAPTERS
  ===================================================== */

  const generatedBooks =
    useMemo<GeneratedBook[]>(() => {
      const grouped = new Map<
        string,
        GeneratedBook
      >();

      for (const audio of audiobooks) {
        /*
         * NEW FORMAT
         */
        if (audio.bookId) {
          const bookKey = String(
            audio.bookId
          );

          if (!grouped.has(bookKey)) {
            grouped.set(bookKey, {
              id: bookKey,
              title:
                audio.bookTitle ||
                audio.title
                  .split(" — ")[0] ||
                "Untitled Audiobook",
              voice: audio.voice,
              createdAt:
                audio.createdAt,
              chapters: [],
            });
          }

          const group =
            grouped.get(bookKey)!;

          group.chapters.push(audio);

          if (
            new Date(
              audio.createdAt
            ).getTime() >
            new Date(
              group.createdAt
            ).getTime()
          ) {
            group.createdAt =
              audio.createdAt;
          }

          continue;
        }

        /*
         * COMPATIBILITY FORMAT
         *
         * Supports records created as:
         *
         * Book Title — Chapter 1
         * Book Title — Chapter 2
         */
        if (isChapterAudio(audio)) {
          const parts =
            audio.title.split(" — ");

          const derivedBookTitle =
            parts[0]?.trim() ||
            "Untitled Audiobook";

          const derivedChapterTitle =
            parts
              .slice(1)
              .join(" — ")
              .trim() ||
            audio.title;

          const chapterNumber =
            audio.chapterNumber ??
            getChapterNumberFromTitle(
              derivedChapterTitle
            );

          const bookKey =
            audio.bookId ||
            `legacy-book-${derivedBookTitle
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                "-"
              )
              .replace(
                /^-+|-+$/g,
                ""
              )}-${audio.voice}`;

          const normalizedAudio: Audiobook =
            {
              ...audio,
              chapterNumber:
                chapterNumber ??
                undefined,
              chapterTitle:
                audio.chapterTitle ||
                derivedChapterTitle,
              bookTitle:
                audio.bookTitle ||
                derivedBookTitle,
              bookId:
                audio.bookId ||
                bookKey,
            };

          if (!grouped.has(bookKey)) {
            grouped.set(bookKey, {
              id: bookKey,
              title:
                normalizedAudio.bookTitle ||
                derivedBookTitle,
              voice:
                normalizedAudio.voice,
              createdAt:
                normalizedAudio.createdAt,
              chapters: [],
            });
          }

          const group =
            grouped.get(bookKey)!;

          group.chapters.push(
            normalizedAudio
          );

          if (
            new Date(
              normalizedAudio.createdAt
            ).getTime() >
            new Date(
              group.createdAt
            ).getTime()
          ) {
            group.createdAt =
              normalizedAudio.createdAt;
          }

          continue;
        }

        /*
         * OLD SINGLE-AUDIO FORMAT
         */
        grouped.set(audio.id, {
          id: audio.id,
          title: audio.title,
          voice: audio.voice,
          createdAt: audio.createdAt,
          chapters: [audio],
        });
      }

      return Array.from(
        grouped.values()
      )
        .map((book) => ({
          ...book,

          chapters: [
            ...book.chapters,
          ].sort((a, b) => {
            const numberA =
              a.chapterNumber ??
              getChapterNumberFromTitle(
                getChapterTitle(a)
              ) ??
              999999;

            const numberB =
              b.chapterNumber ??
              getChapterNumberFromTitle(
                getChapterTitle(b)
              ) ??
              999999;

            if (
              numberA !== numberB
            ) {
              return numberA - numberB;
            }

            return (
              new Date(
                a.createdAt
              ).getTime() -
              new Date(
                b.createdAt
              ).getTime()
            );
          }),
        }))
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        );
    }, [audiobooks]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredBooks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return generatedBooks;
    }

    return generatedBooks.filter(
      (book) => {
        if (
          book.title
            .toLowerCase()
            .includes(query)
        ) {
          return true;
        }

        if (
          book.voice
            .toLowerCase()
            .includes(query)
        ) {
          return true;
        }

        return book.chapters.some(
          (chapter) => {
            return (
              chapter.title
                .toLowerCase()
                .includes(query) ||
              Boolean(
                chapter.chapterTitle
                  ?.toLowerCase()
                  .includes(query)
              )
            );
          }
        );
      }
    );
  }, [generatedBooks, search]);

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatDate = (
    date: string
  ) => {
    try {
      const parsed =
        new Date(date);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return "Unknown date";
      }

      return parsed.toLocaleDateString(
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

  const getVoiceName = (
    voice: string
  ) => {
    return voice
      .replace("Neural", "")
      .replace("en-IN-", "")
      .replace("en-US-", "")
      .replace("en-GB-", "")
      .trim();
  };

  function getChapterTitle(
    chapter: Audiobook
  ) {
    if (
      chapter.chapterTitle &&
      chapter.chapterTitle.trim()
    ) {
      return chapter.chapterTitle;
    }

    return getChapterTitleFromTitle(
      chapter.title
    );
  }

  const getChapterLabel = (
    chapter: Audiobook,
    index: number
  ) => {
    const chapterNumber =
      chapter.chapterNumber ??
      getChapterNumberFromTitle(
        getChapterTitle(chapter)
      );

    if (
      typeof chapterNumber ===
      "number"
    ) {
      return `Chapter ${chapterNumber}`;
    }

    return `Audio ${index + 1}`;
  };

  const toggleBook = (
    bookId: string
  ) => {
    setExpandedBooks((current) => {
      const next = new Set(
        current
      );

      if (
        next.has(bookId)
      ) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }

      return next;
    });
  };

  const isReady = (
    chapter: Audiobook
  ) => {
    if (!chapter.audioUrl) {
      return false;
    }

    if (
      chapter.status === "error" ||
      chapter.status === "failed"
    ) {
      return false;
    }

    return true;
  };

  /* =====================================================
     DELETE CHAPTER
  ===================================================== */

  const deleteChapter = (
    chapter: Audiobook
  ) => {
    const chapterName =
      getChapterTitle(chapter);

    const confirmed =
      window.confirm(
        `Do you want to delete "${chapterName}"?`
      );

    if (!confirmed) {
      return;
    }

    const updated =
      audiobooks.filter(
        (audio) =>
          audio.id !== chapter.id
      );

    saveAudiobooks(updated);

    setAudiobooks(updated);

    if (
      playingId === chapter.id
    ) {
      setPlayingId(null);
    }

    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );

    setMessage(
      `"${chapterName}" deleted.`
    );
  };

  /* =====================================================
     DELETE COMPLETE BOOK
  ===================================================== */

  const deleteBook = (
    book: GeneratedBook
  ) => {
    const confirmed =
      window.confirm(
        `Do you want to delete the complete audiobook "${book.title}" and all ${book.chapters.length} chapter(s)?`
      );

    if (!confirmed) {
      return;
    }

    const chapterIds =
      new Set(
        book.chapters.map(
          (chapter) =>
            chapter.id
        )
      );

    const updated =
      audiobooks.filter(
        (audio) =>
          !chapterIds.has(
            audio.id
          )
      );

    saveAudiobooks(updated);

    setAudiobooks(updated);

    setPlayingId(null);

    setExpandedBooks(
      (current) => {
        const next =
          new Set(current);

        next.delete(book.id);

        return next;
      }
    );

    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );

    setMessage(
      `"${book.title}" and its chapters were deleted.`
    );
  };

  /* =====================================================
     CLEAR ALL
  ===================================================== */

  const clearAllAudio = () => {
    if (
      audiobooks.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Do you want to delete all generated audiobooks and chapters?"
      );

    if (!confirmed) {
      return;
    }

    saveAudiobooks([]);

    setAudiobooks([]);

    setPlayingId(null);

    setExpandedBooks(
      new Set()
    );

    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );

    setMessage(
      "All generated audio has been removed."
    );
  };

  /* =====================================================
     STATS
  ===================================================== */

  const totalBooks =
    generatedBooks.length;

  const totalChapters =
    generatedBooks.reduce(
      (total, book) =>
        total +
        book.chapters.length,
      0
    );

  const readyChapters =
    audiobooks.filter(
      (audio) =>
        isReady(audio)
    ).length;

  const totalVoices =
    new Set(
      audiobooks.map(
        (book) =>
          book.voice
      )
    ).size;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <AuthGuard>
      <main className="library-page generated-audio-page">
        <Sidebar />

        <section className="library-content">
          {/* HEADER */}

          <header className="generated-header">
            <div>
              <div className="breadcrumb">
                <span>
                  RAFTA
                </span>

                <b>/</b>

                <span>
                  Generated Audio
                </span>
              </div>

              <h1>
                Generated Audio
              </h1>

              <p>
                Your generated
                audiobooks are
                organized by book
                and chapter,
                separately from
                your original
                books.
              </p>
            </div>

            <div className="generated-header-actions">
              <Link
                href="/create"
                className="generated-create-btn"
              >
                <span>
                  ✦
                </span>

                Generate Audio
              </Link>

              {audiobooks.length >
                0 && (
                <button
                  type="button"
                  className="generated-clear-btn"
                  onClick={
                    clearAllAudio
                  }
                >
                  🗑 Clear Audio
                </button>
              )}
            </div>
          </header>

          {/* STATS */}

          <section className="generated-stats">
            <article className="generated-stat-card">
              <div className="generated-stat-icon">
                🎧
              </div>

              <div>
                <span>
                  TOTAL BOOKS
                </span>

                <strong>
                  {totalBooks}
                </strong>

                <small>
                  Generated
                  audiobooks
                </small>
              </div>
            </article>

            <article className="generated-stat-card">
              <div className="generated-stat-icon">
                ▶
              </div>

              <div>
                <span>
                  CHAPTERS
                </span>

                <strong>
                  {totalChapters}
                </strong>

                <small>
                  Audio files
                </small>
              </div>
            </article>

            <article className="generated-stat-card">
              <div className="generated-stat-icon">
                🎙
              </div>

              <div>
                <span>
                  READY TO PLAY
                </span>

                <strong>
                  {readyChapters}
                </strong>

                <small>
                  Available now
                </small>
              </div>
            </article>

            <article className="generated-stat-card">
              <div className="generated-stat-icon">
                🎤
              </div>

              <div>
                <span>
                  AI VOICES
                </span>

                <strong>
                  {totalVoices}
                </strong>

                <small>
                  Voices used
                </small>
              </div>
            </article>
          </section>

          {/* SEARCH */}

          <section className="generated-toolbar">
            <div className="generated-search">
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
                placeholder="Search books or chapters..."
              />
            </div>

            <span className="generated-count">
              Showing{" "}
              <strong>
                {
                  filteredBooks.length
                }
              </strong>{" "}
              book
              {filteredBooks.length ===
              1
                ? ""
                : "s"}
            </span>
          </section>

          {/* MESSAGE */}

          {message && (
            <div className="generated-message">
              <span>
                ✓
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

          {/* EMPTY */}

          {audiobooks.length ===
          0 ? (
            <section className="generated-empty">
              <div className="generated-empty-glow"></div>

              <div className="generated-empty-icon">
                ♫
              </div>

              <span className="generated-empty-label">
                AUDIO WORKSPACE
              </span>

              <h2>
                No Generated
                Audio Yet
              </h2>

              <p>
                Create your first
                audiobook and your
                generated chapters
                will automatically
                appear here.
              </p>

              <div className="generated-empty-actions">
                <Link
                  href="/create"
                  className="primary-btn"
                >
                  <span>
                    ✦
                  </span>

                  Generate Your
                  First Audiobook
                </Link>

                <Link
                  href="/books"
                  className="secondary-btn"
                >
                  📚 Open Book
                  Library
                </Link>
              </div>
            </section>
          ) : filteredBooks.length ===
            0 ? (
            <section className="generated-no-results">
              <div>
                ⌕
              </div>

              <h2>
                No Matching
                Audio
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
            <section className="generated-grid">
              {filteredBooks.map(
                (book) => {
                  const expanded =
                    expandedBooks.has(
                      book.id
                    );

                  const readyCount =
                    book.chapters.filter(
                      (chapter) =>
                        isReady(
                          chapter
                        )
                    ).length;

                  return (
                    <article
                      key={book.id}
                      className="generated-card"
                    >
                      {/* BOOK COVER */}

                      <div className="generated-cover">
                        <div className="generated-cover-glow"></div>

                        <div className="generated-cover-icon">
                          ♫
                        </div>

                        <small>
                          RAFTA AI
                        </small>

                        <strong>
                          {
                            book.title
                          }
                        </strong>

                        <span>
                          AUDIOBOOK
                        </span>
                      </div>

                      {/* BOOK BODY */}

                      <div className="generated-card-body">
                        <div className="generated-card-header">
                          <div>
                            <span className="generated-badge">
                              {book
                                .chapters
                                .length ===
                              1
                                ? "MP3"
                                : "PLAYLIST"}
                            </span>

                            <h2>
                              {
                                book.title
                              }
                            </h2>
                          </div>

                          <button
                            type="button"
                            className="generated-delete-btn"
                            onClick={() =>
                              deleteBook(
                                book
                              )
                            }
                            aria-label={`Delete ${book.title}`}
                          >
                            🗑
                          </button>
                        </div>

                        {/* BOOK META */}

                        <div className="generated-meta">
                          <span>
                            🎙{" "}
                            {getVoiceName(
                              book.voice
                            )}
                          </span>

                          <span>
                            📚{" "}
                            {
                              book
                                .chapters
                                .length
                            }{" "}
                            chapter
                            {book
                              .chapters
                              .length ===
                            1
                              ? ""
                              : "s"}
                          </span>

                          <span>
                            ✓{" "}
                            {
                              readyCount
                            }{" "}
                            ready
                          </span>

                          <span>
                            {formatDate(
                              book.createdAt
                            )}
                          </span>
                        </div>

                        {/* PLAYLIST TOGGLE */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleBook(
                              book.id
                            )
                          }
                          style={{
                            width:
                              "100%",
                            border:
                              "1px solid rgba(255,255,255,0.08)",
                            borderRadius:
                              "12px",
                            background:
                              "rgba(255,255,255,0.03)",
                            color:
                              "inherit",
                            padding:
                              "12px 14px",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap:
                              "12px",
                            cursor:
                              "pointer",
                            marginTop:
                              "14px",
                          }}
                        >
                          <span>
                            {expanded
                              ? "▾ Hide Chapters"
                              : "▸ Show Chapters"}
                          </span>

                          <strong>
                            {
                              book
                                .chapters
                                .length
                            }
                          </strong>
                        </button>

                        {/* CHAPTER PLAYLIST */}

                        {expanded && (
                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              gap:
                                "10px",
                              marginTop:
                                "12px",
                            }}
                          >
                            {book.chapters.map(
                              (
                                chapter,
                                index
                              ) => {
                                const chapterTitle =
                                  getChapterTitle(
                                    chapter
                                  );

                                const ready =
                                  isReady(
                                    chapter
                                  );

                                const active =
                                  playingId ===
                                  chapter.id;

                                const chapterNumber =
                                  chapter.chapterNumber ??
                                  getChapterNumberFromTitle(
                                    chapterTitle
                                  );

                                return (
                                  <div
                                    key={
                                      chapter.id
                                    }
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
                                        justifyContent:
                                          "space-between",
                                        alignItems:
                                          "flex-start",
                                        gap:
                                          "10px",
                                        marginBottom:
                                          ready
                                            ? "10px"
                                            : "0",
                                      }}
                                    >
                                      <div
                                        style={{
                                          minWidth:
                                            0,
                                        }}
                                      >
                                        <strong
                                          style={{
                                            display:
                                              "block",
                                            fontSize:
                                              "14px",
                                          }}
                                        >
                                          {chapterNumber
                                            ? `Chapter ${chapterNumber}`
                                            : getChapterLabel(
                                                chapter,
                                                index
                                              )}
                                        </strong>

                                        <span
                                          style={{
                                            display:
                                              "block",
                                            marginTop:
                                              "3px",
                                            fontSize:
                                              "12px",
                                            opacity:
                                              0.72,
                                            wordBreak:
                                              "break-word",
                                          }}
                                        >
                                          {
                                            chapterTitle
                                          }
                                        </span>
                                      </div>

                                      <span
                                        style={{
                                          flexShrink:
                                            0,
                                          fontSize:
                                            "10px",
                                          textTransform:
                                            "uppercase",
                                          letterSpacing:
                                            "0.06em",
                                          opacity:
                                            0.8,
                                        }}
                                      >
                                        {chapter.status ===
                                          "error" ||
                                        chapter.status ===
                                          "failed"
                                          ? "Error"
                                          : ready
                                          ? active
                                            ? "Playing"
                                            : "Ready"
                                          : chapter.status ===
                                              "processing" ||
                                            chapter.status ===
                                              "running"
                                          ? "Processing"
                                          : "Queued"}
                                      </span>
                                    </div>

                                    {ready && (
                                      <audio
                                        controls
                                        preload="metadata"
                                        src={
                                          chapter.audioUrl
                                        }
                                        className="generated-audio-player"
                                        onPlay={() =>
                                          setPlayingId(
                                            chapter.id
                                          )
                                        }
                                        onPause={() =>
                                          setPlayingId(
                                            null
                                          )
                                        }
                                        onEnded={() =>
                                          setPlayingId(
                                            null
                                          )
                                        }
                                      >
                                        Your browser
                                        does not
                                        support
                                        audio.
                                      </audio>
                                    )}

                                    {!ready &&
                                      chapter.status !==
                                        "error" &&
                                      chapter.status !==
                                        "failed" && (
                                        <div
                                          style={{
                                            marginTop:
                                              "8px",
                                            fontSize:
                                              "12px",
                                            opacity:
                                              0.65,
                                          }}
                                        >
                                          ⏳ Audio is
                                          being
                                          generated...
                                        </div>
                                      )}

                                    {(chapter.status ===
                                      "error" ||
                                      chapter.status ===
                                        "failed") && (
                                      <div
                                        style={{
                                          fontSize:
                                            "12px",
                                          opacity:
                                            0.75,
                                          marginTop:
                                            "8px",
                                        }}
                                      >
                                        {chapter.error ||
                                          "Chapter generation failed."}
                                      </div>
                                    )}

                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        flexWrap:
                                          "wrap",
                                        gap:
                                          "8px",
                                        marginTop:
                                          "10px",
                                      }}
                                    >
                                      {ready && (
                                        <>
                                          <a
                                            href={
                                              chapter.audioUrl
                                            }
                                            download={`${book.title} - ${chapterTitle}.mp3`}
                                            className="generated-download-btn"
                                          >
                                            ↓ Download
                                          </a>

                                          <a
                                            href={
                                              chapter.audioUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="generated-open-btn"
                                          >
                                            ↗ Open
                                          </a>

                                          <Link
                                            href={`/player?id=${encodeURIComponent(
                                              chapter.id
                                            )}`}
                                            className="generated-player-btn"
                                          >
                                            ▶ Player
                                          </Link>
                                        </>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteChapter(
                                            chapter
                                          )
                                        }
                                        style={{
                                          border:
                                            "1px solid rgba(255,255,255,0.08)",
                                          borderRadius:
                                            "8px",
                                          padding:
                                            "7px 10px",
                                          background:
                                            "rgba(255,255,255,0.03)",
                                          color:
                                            "inherit",
                                          cursor:
                                            "pointer",
                                          fontSize:
                                            "12px",
                                        }}
                                      >
                                        🗑 Delete
                                      </button>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                        {/* FOOT ACTIONS */}

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "10px",
                            marginTop:
                              "14px",
                          }}
                        >
                          <button
                            type="button"
                            className="generated-player-btn"
                            onClick={() =>
                              toggleBook(
                                book.id
                              )
                            }
                            style={{
                              flex:
                                "1",
                            }}
                          >
                            {expanded
                              ? "Hide Playlist"
                              : "Open Playlist"}
                          </button>

                          {book
                            .chapters
                            .length >
                            0 && (
                            <Link
                              href={`/player?id=${encodeURIComponent(
                                book
                                  .chapters[0]
                                  .id
                              )}`}
                              className="generated-open-btn"
                              style={{
                                flex:
                                  "1",
                                textAlign:
                                  "center",
                              }}
                            >
                              ▶ Play Book
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </section>
          )}

          {/* INFORMATION */}

          <section className="generated-info">
            <div className="generated-info-icon">
              ⇄
            </div>

            <div className="generated-info-content">
              <span>
                RAFTA WORKSPACE
              </span>

              <h2>
                Books and Audio Stay Separate
              </h2>

              <p>
                Original TXT, PDF, and EPUB
                files remain in Book Library.
                Generated MP3 chapters are
                organized here as book
                playlists.
              </p>
            </div>

            <div className="generated-info-links">
              <Link href="/books">
                📚 Book Library →
              </Link>

              <Link href="/create">
                ✦ Generate →
              </Link>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="generated-footer">
            <span>
              RAFTA AI
            </span>

            <p>
              Generated Audio ·
              Book Chapter Playlists
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}