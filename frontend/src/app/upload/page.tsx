"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";

import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";

import {
  getBooks,
  saveBooks,
  type SavedBook,
} from "../../components/storage";

const API_URL = "http://127.0.0.1:8000";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");
  const [saving, setSaving] = useState(false);
  const [bookCount, setBookCount] = useState(0);

  useEffect(() => {
    setBookCount(getBooks().length);
  }, []);

  const handleFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
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
      setSelectedFile(null);
      setMessage(
        "Please select a TXT, PDF, or EPUB file."
      );
      setMessageType("error");
      return;
    }

    setSelectedFile(file);
    setMessage(
      `${file.name} is ready to add to your Book Library.`
    );
    setMessageType("success");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (fileName: string) => {
    const extension = fileName
      .substring(fileName.lastIndexOf("."))
      .toUpperCase();

    return extension.replace(".", "");
  };

  const getBookTitle = (fileName: string) => {
    return (
      fileName.replace(/\.[^/.]+$/, "").trim() ||
      "Untitled Book"
    );
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setMessage("");
    setMessageType("");

    const input = document.getElementById(
      "book-upload"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  const extractBookText = async (
    file: File
  ): Promise<string> => {
    const extension = getFileType(file.name);

    if (extension === "TXT") {
      const text = await file.text();

      if (!text.trim()) {
        throw new Error(
          "The TXT file does not contain readable text."
        );
      }

      return text.trim();
    }

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
    } = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.detail ||
          `Unable to extract text from the ${extension} file.`
      );
    }

    if (
      typeof data.text !== "string" ||
      !data.text.trim()
    ) {
      throw new Error(
        "No readable text was found in this book."
      );
    }

    return data.text.trim();
  };

  const handleSaveBook = async () => {
    if (!selectedFile) {
      setMessage(
        "Please select a book before adding it to your library."
      );
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage(
      "Reading your book and extracting text..."
    );
    setMessageType("success");

    try {
      const extension = getFileType(selectedFile.name);

      const existingBooks = getBooks();

      const alreadyExists = existingBooks.some(
  (book) =>
    book.fileName?.toLowerCase() ===
    selectedFile.name.toLowerCase()
);

      if (alreadyExists) {
        setMessage(
          "This book is already in your Book Library."
        );
        setMessageType("error");
        return;
      }

      const content =
        await extractBookText(selectedFile);

      if (!content) {
        throw new Error(
          "No readable text was found in this book."
        );
      }

      const newBook: SavedBook = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        title: getBookTitle(selectedFile.name),
        fileName: selectedFile.name,
        fileType: extension,
        content,
        size: selectedFile.size,
        createdAt: new Date().toISOString(),
      };

      const updatedBooks = [
        newBook,
        ...existingBooks,
      ];

      saveBooks(updatedBooks);

      setBookCount(updatedBooks.length);

      setMessage(
        `"${newBook.title}" has been added to your Book Library with extracted text ready for audiobook generation.`
      );
      setMessageType("success");

      clearSelectedFile();
    } catch (error) {
      console.error(
        "Failed to save book:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save this book. Please try again."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <main className="upload-page">
        <Sidebar />

        <section className="upload-content">
          <header className="upload-header">
            <div>
              <div className="breadcrumb">
                <span>RAFTA</span>
                <b>/</b>
                <span>Upload</span>
              </div>

              <h1>Upload Your Book</h1>

              <p>
                Add your books to the RAFTA Book Library.
                Your saved books and generated audiobooks
                stay completely separate.
              </p>
            </div>

            <Link
              href="/books"
              className="upload-header-btn"
            >
              📚 Open Library
            </Link>
          </header>

          <section className="upload-stats">
            <div className="upload-stat-card">
              <div className="upload-stat-icon">
                📚
              </div>

              <div>
                <span>BOOKS IN LIBRARY</span>
                <strong>{bookCount}</strong>
                <small>Saved books</small>
              </div>
            </div>

            <div className="upload-stat-card">
              <div className="upload-stat-icon">
                📄
              </div>

              <div>
                <span>SUPPORTED FILES</span>
                <strong>3</strong>
                <small>TXT · PDF · EPUB</small>
              </div>
            </div>

            <div className="upload-stat-card">
              <div className="upload-stat-icon">
                🎧
              </div>

              <div>
                <span>AUDIO STORAGE</span>
                <strong>Separate</strong>
                <small>Generated Audio area</small>
              </div>
            </div>
          </section>

          <div className="upload-layout">
            <section className="upload-main-card">
              <div className="upload-card-heading">
                <div className="upload-heading-icon">
                  ↑
                </div>

                <div>
                  <span>STEP 01</span>

                  <h2>Select a Book</h2>

                  <p>
                    Choose a supported book file from your
                    computer.
                  </p>
                </div>
              </div>

              <label
                htmlFor="book-upload"
                className={`upload-dropzone-large ${
                  selectedFile
                    ? "upload-dropzone-selected"
                    : ""
                }`}
              >
                <div className="upload-cloud-large">
                  {selectedFile ? "✓" : "↑"}
                </div>

                <strong>
                  {selectedFile
                    ? "Book selected"
                    : "Choose your book file"}
                </strong>

                <span>
                  {selectedFile
                    ? selectedFile.name
                    : "Drag and drop or click to browse"}
                </span>

                <small>
                  Supported formats: TXT, PDF, EPUB
                </small>

                <input
                  id="book-upload"
                  type="file"
                  accept=".txt,.pdf,.epub"
                  onChange={handleFile}
                  disabled={saving}
                />
              </label>

              {selectedFile && (
                <div className="upload-selected-file">
                  <div className="upload-selected-icon">
                    📖
                  </div>

                  <div className="upload-selected-content">
                    <strong>
                      {selectedFile.name}
                    </strong>

                    <div>
                      <span>
                        {getFileType(
                          selectedFile.name
                        )}
                      </span>

                      <span>
                        {formatFileSize(
                          selectedFile.size
                        )}
                      </span>

                      <span>
                        {saving
                          ? "Processing..."
                          : "Ready"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="upload-remove-btn"
                    onClick={clearSelectedFile}
                    disabled={saving}
                  >
                    ×
                  </button>
                </div>
              )}

              {message && (
                <div
                  className={`upload-message ${
                    messageType === "error"
                      ? "upload-message-error"
                      : "upload-message-success"
                  }`}
                >
                  <span>
                    {messageType === "error"
                      ? "!"
                      : "✓"}
                  </span>

                  <p>{message}</p>
                </div>
              )}

              <div className="upload-main-actions">
                <button
                  type="button"
                  className="upload-save-btn"
                  onClick={handleSaveBook}
                  disabled={
                    saving || !selectedFile
                  }
                >
                  {saving ? (
                    <>
                      <span className="upload-spinner"></span>
                      Processing Book...
                    </>
                  ) : (
                    <>
                      <span>＋</span>
                      Add to Book Library
                    </>
                  )}
                </button>

                <Link
                  href="/books"
                  className="upload-secondary-btn"
                >
                  View Saved Books
                </Link>
              </div>
            </section>

            <aside className="upload-side">
              <section className="upload-side-card">
                <div className="upload-side-heading">
                  <span>01</span>

                  <div>
                    <small>BOOK STORAGE</small>
                    <h3>Your Books</h3>
                  </div>
                </div>

                <div className="upload-storage-visual">
                  <div className="upload-storage-ring">
                    <span>{bookCount}</span>
                  </div>

                  <div>
                    <strong>
                      {bookCount === 1
                        ? "1 book"
                        : `${bookCount} books`}
                    </strong>

                    <small>currently saved</small>
                  </div>
                </div>

                <div className="upload-storage-line">
                  <span>Book Library</span>
                  <strong>Separate</strong>
                </div>

                <div className="upload-storage-line">
                  <span>Generated Audio</span>
                  <strong>Separate</strong>
                </div>
              </section>

              <section className="upload-side-card">
                <div className="upload-side-heading">
                  <span>02</span>

                  <div>
                    <small>NEXT STEP</small>
                    <h3>Generate Audio</h3>
                  </div>
                </div>

                <div className="upload-next-step">
                  <div className="upload-next-icon">
                    ✦
                  </div>

                  <p>
                    After saving your book, open the Library
                    and select it whenever you want to create
                    an audiobook.
                  </p>
                </div>

                <Link
                  href="/create"
                  className="upload-generate-link"
                >
                  ✦ Open Generate
                </Link>
              </section>

              <section className="upload-side-card upload-help-card">
                <div className="upload-help-icon">
                  i
                </div>

                <div>
                  <strong>
                    Keep your files organized
                  </strong>

                  <p>
                    Books are stored in Book Library while
                    finished MP3 audiobooks are stored in
                    Generated Audio.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <section className="upload-format-section">
            <div className="upload-format-heading">
              <div>
                <span>SUPPORTED FORMATS</span>
                <h2>Bring Your Content</h2>
              </div>

              <p>
                Choose the format that matches your book.
              </p>
            </div>

            <div className="upload-format-grid">
              <article className="upload-format-card">
                <div className="upload-format-icon">
                  TXT
                </div>

                <div>
                  <h3>Plain Text</h3>

                  <p>
                    Text files are loaded directly into the
                    audiobook generator.
                  </p>
                </div>

                <span>Supported</span>
              </article>

              <article className="upload-format-card">
                <div className="upload-format-icon">
                  PDF
                </div>

                <div>
                  <h3>PDF Document</h3>

                  <p>
                    Text is extracted from your PDF and
                    stored with the book for audiobook
                    generation.
                  </p>
                </div>

                <span>Supported</span>
              </article>

              <article className="upload-format-card">
                <div className="upload-format-icon">
                  EPUB
                </div>

                <div>
                  <h3>EPUB Book</h3>

                  <p>
                    Chapter text is extracted from your EPUB
                    and saved for audiobook generation.
                  </p>
                </div>

                <span>Supported</span>
              </article>
            </div>
          </section>

          <footer className="upload-footer">
            <span>RAFTA AI</span>

            <p>
              Upload → Library → Generate → Generated Audio
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}