"use client";

import {
  useMemo,
  useState,
  type MouseEvent,
} from "react";

/* =========================================================
   RAFTA CHAPTER LIST
========================================================= */

export interface ChapterListItem {
  id: string;

  chapterNumber?: number;
  chapterTitle?: string;
  title?: string;

  content?: string;
  text?: string;
  description?: string;

  audioUrl?: string;

  status?:
    | "queued"
    | "processing"
    | "running"
    | "completed"
    | "success"
    | "done"
    | "failed"
    | "error"
    | string;

  duration?: number | string;

  [key: string]: unknown;
}

interface ChapterListProps {
  chapters: ChapterListItem[];

  title?: string;
  eyebrow?: string;
  subtitle?: string;

  currentChapterId?: string | null;

  completedChapterIds?: string[];

  onSelectChapter?: (
    chapter: ChapterListItem
  ) => void;

  onPlayChapter?: (
    chapter: ChapterListItem
  ) => void;

  onToggleComplete?: (
    chapter: ChapterListItem,
    completed: boolean
  ) => void;

  showSearch?: boolean;
}

export default function ChapterList({
  chapters,
  title = "Chapters",
  eyebrow = "BOOK CONTENT",
  subtitle,
  currentChapterId = null,
  completedChapterIds = [],
  onSelectChapter,
  onPlayChapter,
  onToggleComplete,
  showSearch = true,
}: ChapterListProps) {
  const [search, setSearch] =
    useState("");

  const [expandedIds, setExpandedIds] =
    useState<string[]>([]);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort(
      (a, b) => {
        const numberA =
          typeof a.chapterNumber ===
          "number"
            ? a.chapterNumber
            : 999999;

        const numberB =
          typeof b.chapterNumber ===
          "number"
            ? b.chapterNumber
            : 999999;

        return numberA - numberB;
      }
    );
  }, [chapters]);

  const filteredChapters =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return sortedChapters;
      }

      return sortedChapters.filter(
        (chapter) => {
          const chapterTitle =
            getChapterTitle(chapter);

          const content =
            getChapterDescription(
              chapter
            );

          return (
            chapterTitle
              .toLowerCase()
              .includes(query) ||
            content
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [search, sortedChapters]);

  const completedCount =
    sortedChapters.filter(
      (chapter) =>
        isCompleted(
          chapter,
          completedChapterIds
        )
    ).length;

  const totalCount =
    sortedChapters.length;

  const progress =
    totalCount > 0
      ? Math.round(
          (completedCount /
            totalCount) *
            100
        )
      : 0;

  function toggleExpanded(
    id: string
  ) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  }

  function handleMainClick(
    chapter: ChapterListItem
  ) {
    onSelectChapter?.(chapter);
  }

  function handlePlayClick(
    event: MouseEvent<HTMLButtonElement>,
    chapter: ChapterListItem
  ) {
    event.stopPropagation();

    if (!chapter.audioUrl) {
      return;
    }

    onPlayChapter?.(chapter);
  }

  function handleCompleteClick(
    event: MouseEvent<HTMLButtonElement>,
    chapter: ChapterListItem
  ) {
    event.stopPropagation();

    const completed = isCompleted(
      chapter,
      completedChapterIds
    );

    onToggleComplete?.(
      chapter,
      !completed
    );
  }

  return (
    <section className="rafta-chapter-list">
      <div className="rafta-chapter-list-header">
        <div>
          <p className="rafta-chapter-list-eyebrow">
            {eyebrow}
          </p>

          <h2 className="rafta-chapter-list-title">
            {title}
          </h2>

          <p className="rafta-chapter-list-count">
            {subtitle ||
              `${totalCount} ${
                totalCount === 1
                  ? "chapter"
                  : "chapters"
              }`}
          </p>
        </div>

        <div className="rafta-chapter-progress-summary">
          <div className="rafta-chapter-progress-label">
            <span>
              Reading progress
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div className="rafta-chapter-progress-track">
            <div
              className="rafta-chapter-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {showSearch &&
        totalCount > 0 && (
          <div className="rafta-chapter-search">
            <span className="rafta-chapter-search-icon">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search chapters..."
              aria-label="Search chapters"
            />

            {search && (
              <button
                type="button"
                className="rafta-chapter-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}

      {totalCount === 0 ? (
        <div className="rafta-chapter-empty">
          <div className="rafta-chapter-empty-icon">
            📚
          </div>

          <h3>
            No chapters found
          </h3>

          <p>
            Chapter information will
            appear here after your book
            has been analyzed.
          </p>
        </div>
      ) : filteredChapters.length ===
        0 ? (
        <div className="rafta-chapter-no-results">
          <span>🔎</span>

          <p>
            No chapters match "
            {search}"
          </p>

          <button
            type="button"
            onClick={() =>
              setSearch("")
            }
          >
            Clear Search
          </button>
        </div>
      ) : (
        <>
          <div className="rafta-chapter-items">
            {filteredChapters.map(
              (chapter, index) => {
                const completed =
                  isCompleted(
                    chapter,
                    completedChapterIds
                  );

                const current =
                  chapter.id ===
                  currentChapterId;

                const expanded =
                  expandedIds.includes(
                    chapter.id
                  );

                const chapterNumber =
                  getChapterNumber(
                    chapter,
                    index
                  );

                const chapterTitle =
                  getChapterTitle(
                    chapter
                  );

                const description =
                  getChapterDescription(
                    chapter
                  );

                const status =
                  getStatus(chapter);

                const isProcessing =
                  status ===
                    "processing" ||
                  status ===
                    "running" ||
                  status ===
                    "queued";

                return (
                  <article
                    key={chapter.id}
                    className={[
                      "rafta-chapter-item",
                      current
                        ? "rafta-chapter-current"
                        : "",
                      completed
                        ? "rafta-chapter-completed"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <button
                      type="button"
                      className="rafta-chapter-main"
                      onClick={() =>
                        handleMainClick(
                          chapter
                        )
                      }
                    >
                      <div className="rafta-chapter-number">
                        {current ? (
                          <div className="rafta-chapter-playing">
                            <i />
                            <i />
                            <i />
                          </div>
                        ) : completed ? (
                          <span className="rafta-chapter-check">
                            ✓
                          </span>
                        ) : (
                          String(
                            chapterNumber
                          ).padStart(
                            2,
                            "0"
                          )
                        )}
                      </div>

                      <div className="rafta-chapter-information">
                        <h3 className="rafta-chapter-title">
                          {chapterTitle}
                        </h3>

                        {description && (
                          <>
                            <p
                              className={
                                expanded
                                  ? "expanded"
                                  : ""
                              }
                            >
                              {description}
                            </p>

                            {description.length >
                              140 && (
                              <button
                                type="button"
                                className="rafta-chapter-expand"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();
                                  toggleExpanded(
                                    chapter.id
                                  );
                                }}
                              >
                                {expanded
                                  ? "Show less"
                                  : "Read more"}
                              </button>
                            )}
                          </>
                        )}

                        <div className="rafta-chapter-meta">
                          <span>
                            Chapter{" "}
                            {
                              chapterNumber
                            }
                          </span>

                          {chapter.audioUrl && (
                            <>
                              <span className="rafta-chapter-dot">
                                •
                              </span>

                              <span>
                                Audio ready
                              </span>
                            </>
                          )}

                          {isProcessing && (
                            <>
                              <span className="rafta-chapter-dot">
                                •
                              </span>

                              <span>
                                {formatStatus(
                                  status
                                )}
                              </span>
                            </>
                          )}

                          {current && (
                            <>
                              <span className="rafta-chapter-dot">
                                •
                              </span>

                              <span className="rafta-chapter-now-playing">
                                Now playing
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="rafta-chapter-actions">
                        <button
                          type="button"
                          className={[
                            "rafta-chapter-complete",
                            completed
                              ? "active"
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(" ")}
                          onClick={(
                            event
                          ) =>
                            handleCompleteClick(
                              event,
                              chapter
                            )
                          }
                          aria-label={
                            completed
                              ? "Mark chapter incomplete"
                              : "Mark chapter complete"
                          }
                        >
                          {completed
                            ? "✓"
                            : "○"}
                        </button>

                        <button
                          type="button"
                          className={[
                            "rafta-chapter-play",
                            current
                              ? "active"
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(" ")}
                          disabled={
                            !chapter.audioUrl
                          }
                          onClick={(
                            event
                          ) =>
                            handlePlayClick(
                              event,
                              chapter
                            )
                          }
                          aria-label={
                            chapter.audioUrl
                              ? `Play ${chapterTitle}`
                              : "Audio not ready"
                          }
                        >
                          {current
                            ? "❚❚"
                            : "▶"}
                        </button>
                      </div>
                    </button>
                  </article>
                );
              }
            )}
          </div>

          {search && (
            <p className="rafta-chapter-search-result">
              Showing{" "}
              {
                filteredChapters.length
              }{" "}
              of {totalCount} chapters
            </p>
          )}
        </>
      )}
    </section>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getChapterNumber(
  chapter: ChapterListItem,
  fallbackIndex: number
): number {
  if (
    typeof chapter.chapterNumber ===
    "number"
  ) {
    return chapter.chapterNumber;
  }

  const source =
    chapter.chapterTitle ||
    chapter.title ||
    "";

  const match =
    source.match(
      /chapter[\s_-]*(\d+)/i
    );

  if (match) {
    const number = Number(
      match[1]
    );

    if (
      Number.isFinite(number)
    ) {
      return number;
    }
  }

  return fallbackIndex + 1;
}

function getChapterTitle(
  chapter: ChapterListItem
): string {
  return (
    chapter.chapterTitle ||
    chapter.title ||
    `Chapter ${
      chapter.chapterNumber ??
      "Untitled"
    }`
  );
}

function getChapterDescription(
  chapter: ChapterListItem
): string {
  const value =
    chapter.description ||
    chapter.content ||
    chapter.text ||
    "";

  return String(value);
}

function getStatus(
  chapter: ChapterListItem
): string {
  return String(
    chapter.status || ""
  ).toLowerCase();
}

function isCompleted(
  chapter: ChapterListItem,
  completedChapterIds: string[]
): boolean {
  if (
    completedChapterIds.includes(
      chapter.id
    )
  ) {
    return true;
  }

  const status =
    getStatus(chapter);

  return (
    status === "completed" ||
    status === "success" ||
    status === "done"
  );
}

function formatStatus(
  status: string
): string {
  switch (status) {
    case "queued":
      return "Waiting";
    case "processing":
      return "Generating";
    case "running":
      return "Generating";
    case "completed":
      return "Completed";
    case "success":
      return "Completed";
    case "done":
      return "Completed";
    case "failed":
      return "Failed";
    case "error":
      return "Error";
    default:
      return status || "Pending";
  }
}