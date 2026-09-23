"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";
import {
  getAudiobooks,
  saveAudiobooks,
  type Audiobook,
} from "../../components/storage";

export default function PlayerPage() {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const [audiobooks, setAudiobooks] =
    useState<Audiobook[]>([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolume] =
    useState(1);

  const [message, setMessage] =
    useState("");

  /* =====================================================
     LOAD AUDIO + URL SELECTION
  ===================================================== */

  const loadAudiobooks = () => {
    try {
      const savedAudiobooks =
        getAudiobooks();

      setAudiobooks(savedAudiobooks);

      if (typeof window !== "undefined") {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const requestedId =
          params.get("id");

        if (
          requestedId &&
          savedAudiobooks.some(
            (book) =>
              book.id === requestedId
          )
        ) {
          setSelectedId(
            requestedId
          );
        } else if (
          savedAudiobooks.length > 0 &&
          !selectedId
        ) {
          setSelectedId(
            savedAudiobooks[0].id
          );
        }
      }
    } catch (error) {
      console.error(
        "Player load error:",
        error
      );

      setAudiobooks([]);
      setMessage(
        "Unable to load generated audio."
      );
    }
  };

  useEffect(() => {
    loadAudiobooks();

    const handleAudioUpdate = () => {
      loadAudiobooks();
    };

    const handleStorage = () => {
      loadAudiobooks();
    };

    const handleFocus = () => {
      loadAudiobooks();
    };

    window.addEventListener(
      "rafta-audiobooks-updated",
      handleAudioUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "rafta-audiobooks-updated",
        handleAudioUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, []);

  /* =====================================================
     SELECTED AUDIO
  ===================================================== */

  const selectedAudio = useMemo(() => {
    return (
      audiobooks.find(
        (book) =>
          book.id === selectedId
      ) || null
    );
  }, [
    audiobooks,
    selectedId,
  ]);

  /* =====================================================
     CURRENT BOOK CHAPTERS
  ===================================================== */

  const currentBookChapters =
    useMemo(() => {
      if (!selectedAudio) {
        return [];
      }

      if (!selectedAudio.bookId) {
        return [selectedAudio];
      }

      return audiobooks
        .filter(
          (book) =>
            book.bookId ===
              selectedAudio.bookId &&
            Boolean(book.audioUrl)
        )
        .sort(
          (a, b) =>
            (a.chapterNumber ?? 0) -
            (b.chapterNumber ?? 0)
        );
    }, [
      audiobooks,
      selectedAudio,
    ]);

  const currentChapterIndex =
    currentBookChapters.findIndex(
      (book) =>
        book.id === selectedId
    );

  const previousChapter =
    currentChapterIndex > 0
      ? currentBookChapters[
          currentChapterIndex - 1
        ]
      : null;

  const nextChapter =
    currentChapterIndex >= 0 &&
    currentChapterIndex <
      currentBookChapters.length - 1
      ? currentBookChapters[
          currentChapterIndex + 1
        ]
      : null;

  /* =====================================================
     RESET PLAYER WHEN AUDIO CHANGES
  ===================================================== */

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [selectedId]);

  /* =====================================================
     KEEP URL IN SYNC
  ===================================================== */

  useEffect(() => {
    if (
      !selectedId ||
      typeof window === "undefined"
    ) {
      return;
    }

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.set(
      "id",
      selectedId
    );

    window.history.replaceState(
      {},
      "",
      `${url.pathname}?${url.searchParams.toString()}`
    );
  }, [selectedId]);

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = (
    seconds: number
  ) => {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      return "00:00";
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    const remainingSeconds =
      Math.floor(
        seconds % 60
      );

    return `${minutes
      .toString()
      .padStart(
        2,
        "0"
      )}:${remainingSeconds
      .toString()
      .padStart(
        2,
        "0"
      )}`;
  };

  /* =====================================================
     PLAY / PAUSE
  ===================================================== */

  const togglePlay = async () => {
    if (
      !audioRef.current ||
      !selectedAudio
    ) {
      return;
    }

    try {
      if (
        audioRef.current.paused
      ) {
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error(
        "Playback error:",
        error
      );

      setMessage(
        "Unable to play this audio file."
      );
    }
  };

  /* =====================================================
     SEEK
  ===================================================== */

  const handleSeek = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      Number(
        event.target.value
      );

    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime =
      value;

    setCurrentTime(value);
  };

  /* =====================================================
     VOLUME
  ===================================================== */

  const handleVolume = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      Number(
        event.target.value
      );

    setVolume(value);

    if (audioRef.current) {
      audioRef.current.volume =
        value;
    }
  };

  /* =====================================================
     SKIP
  ===================================================== */

  const skip = (
    seconds: number
  ) => {
    if (!audioRef.current) {
      return;
    }

    const nextTime =
      Math.max(
        0,
        Math.min(
          audioRef.current
            .currentTime +
            seconds,
          audioRef.current
            .duration || 0
        )
      );

    audioRef.current.currentTime =
      nextTime;

    setCurrentTime(
      nextTime
    );
  };

  /* =====================================================
     SELECT AUDIO
  ===================================================== */

  const selectAudio = (
    id: string
  ) => {
    const exists =
      audiobooks.some(
        (book) =>
          book.id === id
      );

    if (!exists) {
      return;
    }

    setSelectedId(id);
    setMessage("");
  };

  /* =====================================================
     PREVIOUS CHAPTER
  ===================================================== */

  const playPreviousChapter = () => {
    if (!previousChapter) {
      return;
    }

    selectAudio(
      previousChapter.id
    );
  };

  /* =====================================================
     NEXT CHAPTER
  ===================================================== */

  const playNextChapter = () => {
    if (!nextChapter) {
      return;
    }

    selectAudio(
      nextChapter.id
    );
  };

  /* =====================================================
     AUTO PLAY NEXT CHAPTER
  ===================================================== */

  const handleAudioEnded = () => {
    setIsPlaying(false);

    if (nextChapter) {
      selectAudio(
        nextChapter.id
      );
    }
  };

  /* =====================================================
     DELETE CURRENT AUDIO
  ===================================================== */

  const removeAudio = () => {
    if (!selectedAudio) {
      return;
    }

    const isChapter =
      Boolean(
        selectedAudio.bookId
      );

    const deleteMessage =
      isChapter
        ? `Do you want to delete "${selectedAudio.chapterTitle || selectedAudio.title}"?`
        : `Do you want to delete "${selectedAudio.title}"?`;

    const confirmed =
      window.confirm(
        deleteMessage
      );

    if (!confirmed) {
      return;
    }

    const updated =
      audiobooks.filter(
        (book) =>
          book.id !==
          selectedAudio.id
      );

    saveAudiobooks(updated);
    setAudiobooks(updated);

    const nextSelected =
      updated.length > 0
        ? updated[0].id
        : "";

    setSelectedId(
      nextSelected
    );

    setMessage(
      "Audio deleted."
    );

    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  };

  /* =====================================================
     DISPLAY HELPERS
  ===================================================== */

  const getVoiceName = (
    voice: string
  ) => {
    return voice
      .replace(
        "Neural",
        ""
      )
      .replace(
        "en-IN-",
        ""
      )
      .replace(
        "en-US-",
        ""
      )
      .replace(
        "en-GB-",
        ""
      )
      .trim();
  };

  const getBookTitle = (
    audio: Audiobook
  ) => {
    return (
      audio.bookTitle ||
      audio.title
        .split(" — ")[0] ||
      audio.title
    );
  };

  const getChapterTitle = (
    audio: Audiobook
  ) => {
    return (
      audio.chapterTitle ||
      (audio.title.includes(
        " — "
      )
        ? audio.title
            .split(" — ")
            .slice(1)
            .join(" — ")
        : audio.title)
    );
  };

  /* =====================================================
     EMPTY STATE
  ===================================================== */

  return (
    <AuthGuard>
      <main className="player-page">
        <Sidebar />

        <section className="player-content">
          {/* HEADER */}

          <header className="player-header">
            <div>
              <div className="breadcrumb">
                <span>
                  RAFTA
                </span>

                <b>/</b>

                <span>
                  Player
                </span>
              </div>

              <h1>
                Audio Player
              </h1>

              <p>
                Listen to your generated
                audiobooks and move through
                chapters from one dedicated
                player.
              </p>
            </div>

            <div className="player-header-actions">
              <Link
                href="/library"
                className="player-library-btn"
              >
                🎧 Generated Audio
              </Link>

              <Link
                href="/create"
                className="player-create-btn"
              >
                ✦ Generate
              </Link>
            </div>
          </header>

          {/* MESSAGE */}

          {message && (
            <div className="player-message">
              <span>✓</span>

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
            <section className="player-empty">
              <div className="player-empty-icon">
                ▶
              </div>

              <span>
                AUDIO PLAYER
              </span>

              <h2>
                No Audiobook Available
              </h2>

              <p>
                Generate an audiobook first.
                Your generated MP3 chapters
                will automatically appear here.
              </p>

              <div className="player-empty-actions">
                <Link
                  href="/create"
                  className="primary-btn"
                >
                  ✦ Generate Audiobook
                </Link>

                <Link
                  href="/library"
                  className="secondary-btn"
                >
                  🎧 Generated Audio
                </Link>
              </div>
            </section>
          ) : (
            <div className="player-layout">
              {/* MAIN PLAYER */}

              <section className="player-main-card">
                <div className="player-main-top">
                  <span className="player-label">
                    NOW PLAYING
                  </span>

                  <span className="player-format">
                    MP3
                  </span>
                </div>

                <div className="player-cover">
                  <div className="player-cover-glow"></div>

                  <div className="player-cover-icon">
                    ♫
                  </div>

                  <small>
                    RAFTA AI
                  </small>

                  <h2>
                    {selectedAudio
                      ? selectedAudio.bookId
                        ? getChapterTitle(
                            selectedAudio
                          )
                        : selectedAudio.title
                      : "No Audiobook Selected"}
                  </h2>

                  {selectedAudio && (
                    <p>
                      {selectedAudio.bookId
                        ? `Book: ${getBookTitle(
                            selectedAudio
                          )}`
                        : `Voice: ${getVoiceName(
                            selectedAudio.voice
                          )}`}
                    </p>
                  )}

                  {selectedAudio?.bookId && (
                    <div
                      style={{
                        marginTop:
                          "8px",
                        fontSize:
                          "12px",
                        opacity:
                          0.7,
                      }}
                    >
                      {typeof selectedAudio.chapterNumber ===
                      "number"
                        ? `Chapter ${selectedAudio.chapterNumber}`
                        : "Chapter"}
                      {" · "}
                      Voice:{" "}
                      {getVoiceName(
                        selectedAudio.voice
                      )}
                    </div>
                  )}
                </div>

                {selectedAudio && (
                  <>
                    <audio
                      ref={audioRef}
                      src={
                        selectedAudio.audioUrl
                      }
                      preload="metadata"
                      onLoadedMetadata={(
                        event
                      ) => {
                        const loadedDuration =
                          event
                            .currentTarget
                            .duration;

                        setDuration(
                          Number.isFinite(
                            loadedDuration
                          )
                            ? loadedDuration
                            : 0
                        );

                        event.currentTarget.volume =
                          volume;
                      }}
                      onTimeUpdate={(
                        event
                      ) => {
                        setCurrentTime(
                          event
                            .currentTarget
                            .currentTime
                        );
                      }}
                      onPlay={() =>
                        setIsPlaying(
                          true
                        )
                      }
                      onPause={() =>
                        setIsPlaying(
                          false
                        )
                      }
                      onEnded={
                        handleAudioEnded
                      }
                      onError={() =>
                        setMessage(
                          "Unable to load this audio file."
                        )
                      }
                    />

                    <div className="player-progress-area">
                      <div className="player-time-row">
                        <span>
                          {formatTime(
                            currentTime
                          )}
                        </span>

                        <span>
                          {formatTime(
                            duration
                          )}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max={
                          duration > 0
                            ? duration
                            : 0
                        }
                        step="0.1"
                        value={
                          duration > 0
                            ? Math.min(
                                currentTime,
                                duration
                              )
                            : 0
                        }
                        onChange={
                          handleSeek
                        }
                        className="player-progress-range"
                      />
                    </div>

                    {/* CHAPTER NAVIGATION */}

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap:
                          "10px",
                        margin:
                          "14px 0",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={
                          playPreviousChapter
                        }
                        disabled={
                          !previousChapter
                        }
                        className="player-skip-btn"
                        style={{
                          opacity:
                            previousChapter
                              ? 1
                              : 0.4,
                        }}
                      >
                        ‹ Prev
                      </button>

                      <span
                        style={{
                          fontSize:
                            "12px",
                          opacity:
                            0.7,
                          minWidth:
                            "120px",
                          textAlign:
                            "center",
                        }}
                      >
                        {currentBookChapters.length >
                        1
                          ? `Chapter ${
                              currentChapterIndex +
                              1
                            } of ${
                              currentBookChapters.length
                            }`
                          : "Single Audio"}
                      </span>

                      <button
                        type="button"
                        onClick={
                          playNextChapter
                        }
                        disabled={
                          !nextChapter
                        }
                        className="player-skip-btn"
                        style={{
                          opacity:
                            nextChapter
                              ? 1
                              : 0.4,
                        }}
                      >
                        Next ›
                      </button>
                    </div>

                    <div className="player-controls">
                      <button
                        type="button"
                        onClick={() =>
                          skip(-10)
                        }
                        className="player-skip-btn"
                        aria-label="Skip backward 10 seconds"
                      >
                        ↶
                        <small>
                          10
                        </small>
                      </button>

                      <button
                        type="button"
                        onClick={
                          togglePlay
                        }
                        className="player-play-main"
                        aria-label={
                          isPlaying
                            ? "Pause"
                            : "Play"
                        }
                      >
                        {isPlaying
                          ? "Ⅱ"
                          : "▶"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          skip(10)
                        }
                        className="player-skip-btn"
                        aria-label="Skip forward 10 seconds"
                      >
                        ↷
                        <small>
                          10
                        </small>
                      </button>
                    </div>

                    <div className="player-bottom-controls">
                      <div className="player-volume">
                        <span>
                          {volume === 0
                            ? "🔇"
                            : "🔊"}
                        </span>

                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={
                            volume
                          }
                          onChange={
                            handleVolume
                          }
                        />
                      </div>

                      <div className="player-action-links">
                        <a
                          href={
                            selectedAudio.audioUrl
                          }
                          download={`${getChapterTitle(
                            selectedAudio
                          )}.mp3`}
                          className="player-download-btn"
                        >
                          ↓ Download
                        </a>

                        <a
                          href={
                            selectedAudio.audioUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="player-open-btn"
                        >
                          ↗ Open
                        </a>

                        <button
                          type="button"
                          onClick={
                            removeAudio
                          }
                          className="player-delete-btn"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* PLAYLIST */}

              <aside className="player-playlist-card">
                <div className="player-playlist-header">
                  <div>
                    <span>
                      YOUR AUDIO
                    </span>

                    <h2>
                      Playlist
                    </h2>
                  </div>

                  <strong>
                    {audiobooks.length}
                  </strong>
                </div>

                <div className="player-playlist">
                  {selectedAudio?.bookId ? (
                    <>
                      <div
                        style={{
                          padding:
                            "12px",
                          marginBottom:
                            "8px",
                          borderRadius:
                            "12px",
                          background:
                            "rgba(255,255,255,0.04)",
                          border:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            fontSize:
                              "10px",
                            letterSpacing:
                              "0.08em",
                            opacity:
                              0.55,
                          }}
                        >
                          BOOK
                        </span>

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            fontSize:
                              "14px",
                          }}
                        >
                          {getBookTitle(
                            selectedAudio
                          )}
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            marginTop:
                              "4px",
                            fontSize:
                              "11px",
                            opacity:
                              0.65,
                          }}
                        >
                          {
                            currentBookChapters.length
                          }{" "}
                          chapter
                          {currentBookChapters.length ===
                          1
                            ? ""
                            : "s"}
                        </span>
                      </div>

                      {currentBookChapters.map(
                        (
                          book,
                          index
                        ) => {
                          const active =
                            book.id ===
                            selectedId;

                          return (
                            <button
                              type="button"
                              key={
                                book.id
                              }
                              className={`player-playlist-item ${
                                active
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                selectAudio(
                                  book.id
                                )
                              }
                            >
                              <div className="player-playlist-number">
                                {active
                                  ? "▶"
                                  : String(
                                      index +
                                        1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                              </div>

                              <div className="player-playlist-info">
                                <strong>
                                  {typeof book.chapterNumber ===
                                  "number"
                                    ? `Chapter ${book.chapterNumber}`
                                    : `Audio ${
                                        index +
                                        1
                                      }`}
                                </strong>

                                <span>
                                  {getChapterTitle(
                                    book
                                  )}
                                </span>
                              </div>

                              <span className="player-playlist-arrow">
                                →
                              </span>
                            </button>
                          );
                        }
                      )}
                    </>
                  ) : (
                    audiobooks.map(
                      (
                        book,
                        index
                      ) => {
                        const active =
                          book.id ===
                          selectedId;

                        return (
                          <button
                            type="button"
                            key={
                              book.id
                            }
                            className={`player-playlist-item ${
                              active
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              selectAudio(
                                book.id
                              )
                            }
                          >
                            <div className="player-playlist-number">
                              {active
                                ? "▶"
                                : String(
                                    index +
                                      1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                            </div>

                            <div className="player-playlist-info">
                              <strong>
                                {
                                  book.title
                                }
                              </strong>

                              <span>
                                {getVoiceName(
                                  book.voice
                                )}
                              </span>
                            </div>

                            <span className="player-playlist-arrow">
                              →
                            </span>
                          </button>
                        );
                      }
                    )
                  )}
                </div>

                <Link
                  href="/library"
                  className="player-playlist-link"
                >
                  View All Generated Audio →
                </Link>
              </aside>
            </div>
          )}

          {/* INFO */}

          <section className="player-info-grid">
            <article className="player-info-card">
              <div className="player-info-icon">
                ♫
              </div>

              <div>
                <span>
                  PLAYBACK
                </span>

                <h3>
                  Dedicated Audio
                  Experience
                </h3>

                <p>
                  Select any generated
                  audiobook and control
                  playback from one place.
                </p>
              </div>
            </article>

            <article className="player-info-card">
              <div className="player-info-icon">
                ↓
              </div>

              <div>
                <span>
                  OUTPUT
                </span>

                <h3>
                  Download Your MP3
                </h3>

                <p>
                  Download individual
                  audiobook chapters whenever
                  you need them.
                </p>
              </div>
            </article>

            <article className="player-info-card">
              <div className="player-info-icon">
                📚
              </div>

              <div>
                <span>
                  LIBRARY
                </span>

                <h3>
                  Book Chapters Stay
                  Organized
                </h3>

                <p>
                  Generated chapters remain
                  grouped under their original
                  audiobook.
                </p>
              </div>
            </article>
          </section>

          {/* FOOTER */}

          <footer className="player-footer">
            <span>
              RAFTA AI
            </span>

            <p>
              Audio Player · Generated
              Audiobook Chapters
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";