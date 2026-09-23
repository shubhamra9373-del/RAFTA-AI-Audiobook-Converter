"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";
import {
  getBooks,
  getAudiobooks,
  getCurrentUser,
  type SavedBook,
  type Audiobook,
} from "../../components/storage";

interface SavedSettings {
  defaultVoice?: string;
}

const getVoiceDisplayName = (voice: string) => {
  return voice
    .replace("en-IN-", "")
    .replace("en-US-", "")
    .replace("en-GB-", "")
    .replace("Neural", "");
};

export default function DashboardPage() {
  const [books, setBooks] = useState<SavedBook[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [displayName, setDisplayName] = useState("there");
  const [defaultVoice, setDefaultVoice] = useState("Neerja");

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        setBooks(getBooks());
        setAudiobooks(getAudiobooks());

        const user = getCurrentUser();

        if (
          user &&
          typeof user.name === "string" &&
          user.name.trim()
        ) {
          setDisplayName(user.name.trim());
        }

        const savedSettings =
          localStorage.getItem("rafta_settings");

        if (savedSettings) {
          const settings: SavedSettings =
            JSON.parse(savedSettings);

          if (
            typeof settings.defaultVoice === "string"
          ) {
            setDefaultVoice(
              getVoiceDisplayName(
                settings.defaultVoice
              )
            );
          }
        }
      } catch (error) {
        console.error(
          "Dashboard data load error:",
          error
        );
      }
    };

    loadDashboardData();

    const handleStorageChange = () => {
      loadDashboardData();
    };

    const handleFocus = () => {
      loadDashboardData();
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

  const recentBooks = books.slice(0, 3);

  const totalBooks = books.length;
  const totalAudio = audiobooks.length;

  return (
    <AuthGuard>
      <main className="dashboard-page">
        <Sidebar />

        <section className="dashboard-content">
          <header className="dashboard-header">
            <div>
              <div className="breadcrumb">
                <span>RAFTA</span>
                <b>/</b>
                <span>Dashboard</span>
              </div>

              <h1>
                Welcome back, {displayName} 👋
              </h1>

              <p className="page-description">
                Manage your books, generate audiobooks, and
                continue listening from one clean workspace.
              </p>
            </div>

            <Link
              href="/create"
              className="dashboard-header-btn"
            >
              <span>✦</span>
              Create Audiobook
            </Link>
          </header>

          <section className="dashboard-stats">
            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                📚
              </div>

              <div className="dashboard-stat-content">
                <span>BOOKS</span>

                <strong>{totalBooks}</strong>

                <small>Saved in Library</small>
              </div>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                🎧
              </div>

              <div className="dashboard-stat-content">
                <span>GENERATED AUDIO</span>

                <strong>{totalAudio}</strong>

                <small>Ready to listen</small>
              </div>
            </article>

            <article className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                🎙
              </div>

              <div className="dashboard-stat-content">
                <span>DEFAULT VOICE</span>

                <strong>{defaultVoice}</strong>

                <small>Your preferred AI voice</small>
              </div>
            </article>
          </section>

          <section className="dashboard-hero-card">
            <div className="dashboard-hero-glow"></div>

            <div className="dashboard-hero-content">
              <div className="dashboard-hero-badge">
                <span></span>
                RAFTA AI WORKSPACE
              </div>

              <h2>
                Turn your books into
                <span> natural AI audiobooks.</span>
              </h2>

              <p>
                Start with a saved book, upload new content,
                or paste your own text. Choose an AI voice
                and generate your audiobook in just a few
                steps.
              </p>

              <div className="dashboard-hero-actions">
                <Link
                  href="/create"
                  className="primary-btn"
                >
                  <span>✦</span>
                  Generate Audiobook
                </Link>

                <Link
                  href="/upload"
                  className="secondary-btn"
                >
                  <span>↑</span>
                  Upload Book
                </Link>
              </div>
            </div>

            <div className="dashboard-hero-visual">
              <div className="dashboard-circle dashboard-circle-one"></div>
              <div className="dashboard-circle dashboard-circle-two"></div>

              <div className="dashboard-headphones">
                <div className="dashboard-headphones-arc"></div>

                <div className="dashboard-headphones-left"></div>

                <div className="dashboard-headphones-right"></div>

                <div className="dashboard-headphones-center">
                  ♫
                </div>
              </div>

              <div className="dashboard-mini-status">
                <span className="dashboard-status-dot"></span>

                <div>
                  <strong>AI AUDIO</strong>

                  <small>
                    Voice: {defaultVoice}
                  </small>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-section-label">
                  WORKSPACE
                </span>

                <h2>Quick Actions</h2>

                <p>
                  Jump directly to the area you need.
                </p>
              </div>
            </div>

            <div className="dashboard-action-grid">
              <Link
                href="/create"
                className="dashboard-action-card"
              >
                <div className="dashboard-action-icon">
                  ✦
                </div>

                <div className="dashboard-action-content">
                  <span>GENERATE</span>

                  <h3>Create Audiobook</h3>

                  <p>
                    Convert text or a book into AI-generated
                    audio.
                  </p>
                </div>

                <strong className="dashboard-action-arrow">
                  →
                </strong>
              </Link>

              <Link
                href="/upload"
                className="dashboard-action-card"
              >
                <div className="dashboard-action-icon">
                  ↑
                </div>

                <div className="dashboard-action-content">
                  <span>UPLOAD</span>

                  <h3>Add New Book</h3>

                  <p>
                    Save TXT, PDF, or EPUB books to your
                    library.
                  </p>
                </div>

                <strong className="dashboard-action-arrow">
                  →
                </strong>
              </Link>

              <Link
                href="/books"
                className="dashboard-action-card"
              >
                <div className="dashboard-action-icon">
                  📚
                </div>

                <div className="dashboard-action-content">
                  <span>LIBRARY</span>

                  <h3>Book Library</h3>

                  <p>
                    Browse your saved books and start
                    generating.
                  </p>
                </div>

                <strong className="dashboard-action-arrow">
                  →
                </strong>
              </Link>

              <Link
                href="/library"
                className="dashboard-action-card"
              >
                <div className="dashboard-action-icon">
                  🎧
                </div>

                <div className="dashboard-action-content">
                  <span>AUDIO</span>

                  <h3>Generated Audio</h3>

                  <p>
                    Play, download, and manage generated
                    audiobooks.
                  </p>
                </div>

                <strong className="dashboard-action-arrow">
                  →
                </strong>
              </Link>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading dashboard-section-heading-row">
              <div>
                <span className="dashboard-section-label">
                  YOUR LIBRARY
                </span>

                <h2>Recent Books</h2>

                <p>
                  Continue working with your saved books.
                </p>
              </div>

              <Link
                href="/books"
                className="dashboard-view-link"
              >
                View Library →
              </Link>
            </div>

            {recentBooks.length === 0 ? (
              <div className="dashboard-audio-panel">
                <div className="dashboard-audio-panel-icon">
                  📚
                </div>

                <div className="dashboard-audio-panel-content">
                  <span>NO BOOKS YET</span>

                  <h3>
                    Your uploaded books will appear here
                  </h3>

                  <p>
                    Upload your first TXT, PDF, or EPUB
                    book to start building your library.
                  </p>
                </div>

                <Link
                  href="/upload"
                  className="dashboard-audio-panel-btn"
                >
                  Upload Book
                </Link>
              </div>
            ) : (
              <div className="dashboard-books-grid">
                {recentBooks.map((book) => (
                  <article
                    className="dashboard-book-card"
                    key={book.id}
                  >
                    <div className="dashboard-book-cover">
                      <div className="dashboard-book-cover-glow"></div>

                      <span className="dashboard-book-icon">
                        📖
                      </span>

                      <small>RAFTA AI</small>

                      <strong>
                        {book.title}
                      </strong>
                    </div>

                    <div className="dashboard-book-info">
                      <div className="dashboard-book-top">
                        <div>
                          <h3>
                            {book.title}
                          </h3>

                          <span>
                            {book.fileType}
                          </span>
                        </div>

                        <span className="dashboard-book-percent">
                          Saved
                        </span>
                      </div>

                      <div className="dashboard-progress">
                        <div
                          className="dashboard-progress-fill"
                          style={{
                            width: "100%",
                          }}
                        ></div>
                      </div>

                      <div className="dashboard-book-bottom">
                        <span>
                          Added to library
                        </span>

                        <Link href="/books">
                          Open →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading dashboard-section-heading-row">
              <div>
                <span className="dashboard-section-label">
                  AUDIO WORKSPACE
                </span>

                <h2>Generated Audio</h2>

                <p>
                  Your finished audiobooks are stored
                  separately here.
                </p>
              </div>

              <Link
                href="/library"
                className="dashboard-view-link"
              >
                View Audio →
              </Link>
            </div>

            {audiobooks.length === 0 ? (
              <div className="dashboard-audio-panel">
                <div className="dashboard-audio-panel-icon">
                  ♫
                </div>

                <div className="dashboard-audio-panel-content">
                  <span>NO GENERATED AUDIO</span>

                  <h3>
                    Your generated audiobooks will appear
                    here
                  </h3>

                  <p>
                    Create your first audiobook and it will
                    be available in the Generated Audio
                    section for playback and download.
                  </p>
                </div>

                <Link
                  href="/create"
                  className="dashboard-audio-panel-btn"
                >
                  Generate Now
                </Link>
              </div>
            ) : (
              <div className="dashboard-audio-panel">
                <div className="dashboard-audio-panel-icon">
                  🎧
                </div>

                <div className="dashboard-audio-panel-content">
                  <span>
                    {totalAudio} GENERATED AUDIO
                    {totalAudio === 1 ? "" : " FILES"}
                  </span>

                  <h3>
                    Your audiobooks are ready to listen.
                  </h3>

                  <p>
                    Open Generated Audio to play, download,
                    or manage your finished MP3 files.
                  </p>
                </div>

                <Link
                  href="/library"
                  className="dashboard-audio-panel-btn"
                >
                  Open Audio
                </Link>
              </div>
            )}
          </section>

          <section className="dashboard-final-card">
            <div>
              <span className="dashboard-section-label">
                READY WHEN YOU ARE
              </span>

              <h2>
                Start your next audiobook.
              </h2>

              <p>
                Select a book from your library or start
                with your own text.
              </p>
            </div>

            <div className="dashboard-final-actions">
              <Link
                href="/books"
                className="secondary-btn"
              >
                📚 Open Library
              </Link>

              <Link
                href="/create"
                className="primary-btn"
              >
                ✦ Generate Audio
              </Link>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>RAFTA AI</span>

            <p>
              AI Audiobook Workspace
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}