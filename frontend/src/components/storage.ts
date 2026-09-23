"use client";

/* =========================================================
   BOOK STORAGE
========================================================= */

export interface Book {
  id: string;
  title: string;

  fileName?: string;
  filename?: string;
  fileType?: string;
  type?: string;

  text?: string;
  content?: string;

  size?: number;

  createdAt: string;
  updatedAt?: string;

  author?: string;
  description?: string;

  progress?: number;
  status?: string;

  [key: string]: unknown;
}

/*
 * Compatibility name used by the Book Library pages.
 */
export type SavedBook = Book;

const BOOK_STORAGE_KEY = "rafta_books";

export function getBooks(): Book[] {
  try {
    const saved =
      localStorage.getItem(
        BOOK_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is Book =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Book).id ===
          "string" &&
        typeof (item as Book).title ===
          "string"
    );
  } catch (error) {
    console.error(
      "Failed to load books:",
      error
    );

    return [];
  }
}

export function saveBooks(
  books: Book[]
): void {
  try {
    localStorage.setItem(
      BOOK_STORAGE_KEY,
      JSON.stringify(books)
    );
  } catch (error) {
    console.error(
      "Failed to save books:",
      error
    );
  }
}

export function addBook(
  book: Book
): Book[] {
  const existing = getBooks();

  const updated = [
    book,
    ...existing.filter(
      (item) =>
        item.id !== book.id
    ),
  ];

  saveBooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-books-updated"
      )
    );
  }

  return updated;
}

export function addBooks(
  books: Book[]
): Book[] {
  const existing = getBooks();

  const existingIds = new Set(
    existing.map(
      (book) => book.id
    )
  );

  const newBooks =
    books.filter(
      (book) =>
        !existingIds.has(book.id)
    );

  const updated = [
    ...newBooks,
    ...existing,
  ];

  saveBooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-books-updated"
      )
    );
  }

  return updated;
}

export function updateBook(
  book: Book
): Book[] {
  const existing =
    getBooks();

  const updated =
    existing.map(
      (item) =>
        item.id === book.id
          ? {
              ...item,
              ...book,
              updatedAt:
                new Date().toISOString(),
            }
          : item
    );

  saveBooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-books-updated"
      )
    );
  }

  return updated;
}

export function deleteBook(
  bookId: string
): Book[] {
  const existing =
    getBooks();

  const updated =
    existing.filter(
      (book) =>
        book.id !== bookId
    );

  saveBooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-books-updated"
      )
    );
  }

  return updated;
}

export function clearBooks():
  void {
  saveBooks([]);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-books-updated"
      )
    );
  }
}

export const BOOKS_KEY =
  BOOK_STORAGE_KEY;


/* =========================================================
   AUDIOBOOK STORAGE
========================================================= */

export type AudiobookStatus =
  | "queued"
  | "processing"
  | "running"
  | "completed"
  | "success"
  | "done"
  | "failed"
  | "error"
  | string;

export interface AudiobookChapter {
  id: string;

  bookId: string;
  bookTitle: string;

  chapterNumber: number;
  chapterTitle: string;

  voice: string;
  audioUrl: string;
  createdAt: string;

  status?: AudiobookStatus;

  error?: string;

  [key: string]: unknown;
}

export interface Audiobook {
  id: string;

  title: string;
  voice: string;
  audioUrl: string;
  createdAt: string;

  bookId?: string;
  bookTitle?: string;

  chapterNumber?: number;
  chapterTitle?: string;

  status?: AudiobookStatus;

  error?: string;

  author?: string;
  creator?: string;
  posterUrl?: string;

  [key: string]: unknown;
}

const AUDIOBOOK_STORAGE_KEY =
  "rafta_audiobooks";

export function getAudiobooks():
  Audiobook[] {
  try {
    const saved =
      localStorage.getItem(
        AUDIOBOOK_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is Audiobook =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Audiobook)
          .id === "string" &&
        typeof (item as Audiobook)
          .title === "string" &&
        typeof (item as Audiobook)
          .voice === "string" &&
        typeof (item as Audiobook)
          .audioUrl === "string"
    );
  } catch (error) {
    console.error(
      "Failed to load audiobooks:",
      error
    );

    return [];
  }
}

export function saveAudiobooks(
  audiobooks: Audiobook[]
): void {
  try {
    localStorage.setItem(
      AUDIOBOOK_STORAGE_KEY,
      JSON.stringify(audiobooks)
    );
  } catch (error) {
    console.error(
      "Failed to save audiobooks:",
      error
    );
  }
}

export function addAudiobook(
  audiobook: Audiobook
): Audiobook[] {
  const existing =
    getAudiobooks();

  const updated = [
    audiobook,
    ...existing.filter(
      (item) =>
        item.id !==
        audiobook.id
    ),
  ];

  saveAudiobooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  }

  return updated;
}

export function addAudiobooks(
  audiobooks: Audiobook[]
): Audiobook[] {
  const existing =
    getAudiobooks();

  const existingIds =
    new Set(
      existing.map(
        (book) => book.id
      )
    );

  const newAudiobooks =
    audiobooks.filter(
      (book) =>
        !existingIds.has(
          book.id
        )
    );

  const updated = [
    ...newAudiobooks,
    ...existing,
  ];

  saveAudiobooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  }

  return updated;
}

export function updateAudiobook(
  audiobook: Audiobook
): Audiobook[] {
  const existing =
    getAudiobooks();

  const updated =
    existing.map(
      (item) =>
        item.id === audiobook.id
          ? {
              ...item,
              ...audiobook,
            }
          : item
    );

  saveAudiobooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  }

  return updated;
}

export function deleteAudiobook(
  id: string
): Audiobook[] {
  const existing =
    getAudiobooks();

  const updated =
    existing.filter(
      (book) =>
        book.id !== id
    );

  saveAudiobooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  }

  return updated;
}


/* =========================================================
   AUDIOBOOK BOOK / CHAPTER HELPERS
========================================================= */

export function getBookChapters(
  bookId: string
): Audiobook[] {
  return getAudiobooks()
    .filter(
      (book) =>
        book.bookId === bookId
    )
    .sort(
      (a, b) =>
        (a.chapterNumber ?? 0) -
        (b.chapterNumber ?? 0)
    );
}

export function deleteAudiobookBook(
  bookId: string
): Audiobook[] {
  const existing =
    getAudiobooks();

  const updated =
    existing.filter(
      (book) =>
        book.bookId !== bookId
    );

  saveAudiobooks(updated);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  }

  return updated;
}

export interface AudiobookBook {
  id: string;

  title: string;
  voice: string;
  createdAt: string;

  chapterCount: number;
  readyChapterCount: number;

  chapters: Audiobook[];
}

export function getAudiobookBooks():
  AudiobookBook[] {
  const audiobooks =
    getAudiobooks();

  const grouped = new Map<
    string,
    AudiobookBook
  >();

  for (
    const audiobook of audiobooks
  ) {
    /*
     * Chapter-based audiobook
     */
    if (audiobook.bookId) {
      const bookId =
        audiobook.bookId;

      if (
        !grouped.has(bookId)
      ) {
        grouped.set(
          bookId,
          {
            id: bookId,

            title:
              audiobook.bookTitle ||
              audiobook.title
                .split(" — ")[0] ||
              "Untitled Audiobook",

            voice:
              audiobook.voice,

            createdAt:
              audiobook.createdAt,

            chapterCount: 0,
            readyChapterCount: 0,

            chapters: [],
          }
        );
      }

      const book =
        grouped.get(
          bookId
        )!;

      book.chapters.push(
        audiobook
      );

      continue;
    }

    /*
     * Old single MP3 audiobook
     */
    grouped.set(
      audiobook.id,
      {
        id: audiobook.id,

        title:
          audiobook.title ||
          "Untitled Audiobook",

        voice:
          audiobook.voice,

        createdAt:
          audiobook.createdAt,

        chapterCount: 1,

        readyChapterCount:
          audiobook.audioUrl
            ? 1
            : 0,

        chapters: [
          audiobook,
        ],
      }
    );
  }

  return Array.from(
    grouped.values()
  )
    .map((book) => {
      const chapters =
        [...book.chapters].sort(
          (a, b) => {
            const numberA =
              a.chapterNumber ??
              999999;

            const numberB =
              b.chapterNumber ??
              999999;

            return (
              numberA -
              numberB
            );
          }
        );

      const ready =
        chapters.filter(
          (chapter) => {
            const status =
              chapter.status
                ?.toLowerCase() ||
              "";

            return (
              Boolean(
                chapter.audioUrl
              ) &&
              status !==
                "error" &&
              status !==
                "failed"
            );
          }
        ).length;

      return {
        ...book,
        chapters,
        chapterCount:
          chapters.length,
        readyChapterCount:
          ready,
      };
    })
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    );
}


/* =========================================================
   CLEAR AUDIO
========================================================= */

export function clearAudiobooks():
  void {
  saveAudiobooks([]);

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-audiobooks-updated"
      )
    );
  }
}

export const AUDIOBOOKS_KEY =
  AUDIOBOOK_STORAGE_KEY;


/* =========================================================
   USER / AUTH STORAGE
========================================================= */

export interface CurrentUser {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;

  [key: string]: unknown;
}

const USER_STORAGE_KEYS = [
  "rafta_current_user",
  "rafta_user",
  "currentUser",
  "user",
];

export function getCurrentUser():
  CurrentUser | null {
  for (
    const key of USER_STORAGE_KEYS
  ) {
    try {
      const saved =
        localStorage.getItem(
          key
        );

      if (!saved) {
        continue;
      }

      const parsed: unknown =
        JSON.parse(saved);

      if (
        typeof parsed ===
          "object" &&
        parsed !== null
      ) {
        return parsed as CurrentUser;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function saveCurrentUser(
  user: CurrentUser
): void {
  try {
    localStorage.setItem(
      "rafta_current_user",
      JSON.stringify(user)
    );

    if (
      typeof window !==
      "undefined"
    ) {
      window.dispatchEvent(
        new Event(
          "rafta-user-updated"
        )
      );
    }
  } catch (error) {
    console.error(
      "Failed to save current user:",
      error
    );
  }
}

export function setCurrentUser(
  user: CurrentUser
): void {
  saveCurrentUser(user);
}

export function clearCurrentUser():
  void {
  for (
    const key of USER_STORAGE_KEYS
  ) {
    localStorage.removeItem(key);
  }

  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "rafta-user-updated"
      )
    );
  }
}

export function isLoggedIn():
  boolean {
  return (
    getCurrentUser() !== null
  );
}