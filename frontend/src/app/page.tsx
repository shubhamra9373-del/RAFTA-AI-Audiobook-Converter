"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      {/* =========================================
          TOP NAVBAR
      ========================================= */}
      <header className="home-navbar">
        <div className="home-navbar-inner">

          <Link href="/" className="home-logo">
            <span className="home-logo-icon">♫</span>

            <span className="home-logo-text">
              <strong>RAFTA</strong>
              <small>AI AUDIOBOOK</small>
            </span>
          </Link>

          <nav className="home-nav">
            <Link href="/dashboard">
              Dashboard
            </Link>

            <Link href="/create">
              Generate
            </Link>

            <Link href="/upload">
              Upload
            </Link>

            <Link href="/books">
              Library
            </Link>

            <Link href="/library">
              Generated Audio
            </Link>

            <Link href="/player">
              Player
            </Link>

            <Link href="/settings">
              Settings
            </Link>

            <Link href="/pricing">
              Pricing
            </Link>
          </nav>

          <div className="home-navbar-actions">
            <Link
              href="/login"
              className="home-login-btn"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="home-signup-btn"
            >
              Get Started
            </Link>
          </div>

        </div>
      </header>

      {/* =========================================
          HERO
      ========================================= */}
      <section className="home-hero">

        <div className="home-hero-glow home-glow-one"></div>
        <div className="home-hero-glow home-glow-two"></div>

        <div className="home-hero-content">

          <div className="home-badge">
            <span></span>
            AI AUDIOBOOK WORKSPACE
          </div>

          <h1>
            Turn Your Books Into
            <span> Audiobooks.</span>
          </h1>

          <p className="home-hero-description">
            Convert books, documents, and text into natural-sounding
            AI audiobooks. Upload your content, choose a voice, and
            listen to your finished audio in one beautiful workspace.
          </p>

          <div className="home-hero-actions">

            <Link
              href="/create"
              className="home-primary-btn"
            >
              <span>✦</span>
              Create Audiobook
            </Link>

            <Link
              href="/upload"
              className="home-secondary-btn"
            >
              <span>↑</span>
              Upload Book
            </Link>

          </div>

          <div className="home-trust-row">

            <span>
              <b>✓</b>
              TXT support
            </span>

            <span>
              <b>✓</b>
              PDF & EPUB workflow
            </span>

            <span>
              <b>✓</b>
              Natural AI voices
            </span>

            <span>
              <b>✓</b>
              MP3 output
            </span>

          </div>

        </div>

        {/* =====================================
            HERO VISUAL
        ===================================== */}
        <div className="home-hero-visual">

          <div className="home-orbit home-orbit-one"></div>
          <div className="home-orbit home-orbit-two"></div>

          <div className="home-audiobook-device">

            <div className="home-device-header">

              <span>
                RAFTA AI
              </span>

              <small>
                <i></i>
                READY
              </small>

            </div>

            <div className="home-book-cover">

              <div className="home-book-glow"></div>

              <div className="home-book-icon">
                📖
              </div>

              <small>
                AI AUDIOBOOK
              </small>

              <strong>
                YOUR
                <br />
                STORY
              </strong>

              <span className="home-book-line"></span>

            </div>

            <div className="home-device-info">

              <div>
                <span>
                  CURRENT PROJECT
                </span>

                <strong>
                  Your Audiobook
                </strong>
              </div>

              <div className="home-mini-wave">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>

            </div>

            <div className="home-device-progress">

              <div className="home-progress-time">
                <span>
                  04:28
                </span>

                <span>
                  18:42
                </span>
              </div>

              <div className="home-progress-bar">
                <span></span>
              </div>

            </div>

            <div className="home-device-controls">

              <button type="button">
                ↶
              </button>

              <button
                type="button"
                className="home-device-play"
              >
                ▶
              </button>

              <button type="button">
                ↷
              </button>

            </div>

          </div>

          <div className="home-floating-card home-float-left">

            <div className="home-floating-icon">
              🎙
            </div>

            <div>
              <span>
                AI VOICE
              </span>

              <strong>
                Natural & Clear
              </strong>
            </div>

          </div>

          <div className="home-floating-card home-float-right">

            <div className="home-floating-icon">
              🎧
            </div>

            <div>
              <span>
                AUDIO
              </span>

              <strong>
                Ready to Listen
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* =========================================
          STATS
      ========================================= */}
      <section className="home-stats">

        <div className="home-stats-inner">

          <div className="home-stat-card">
            <strong>
              TXT
            </strong>

            <span>
              Text Input
            </span>
          </div>

          <div className="home-stat-card">
            <strong>
              PDF
            </strong>

            <span>
              Book Documents
            </span>
          </div>

          <div className="home-stat-card">
            <strong>
              EPUB
            </strong>

            <span>
              Digital Books
            </span>
          </div>

          <div className="home-stat-card">
            <strong>
              MP3
            </strong>

            <span>
              Audio Output
            </span>
          </div>

        </div>

      </section>

      {/* =========================================
          FEATURES
      ========================================= */}
      <section className="home-section">

        <div className="home-section-heading">

          <span>
            RAFTA WORKSPACE
          </span>

          <h2>
            Everything You Need
            <br />
            <b>For Your Audiobooks</b>
          </h2>

          <p>
            Keep your books, generated audio, and listening
            workflow organized in one place.
          </p>

        </div>

        <div className="home-feature-grid">

          {/* FEATURE 1 */}
          <article className="home-feature-card">

            <div className="home-feature-top">
              <div className="home-feature-icon">
                📚
              </div>

              <span>
                LIBRARY
              </span>
            </div>

            <h3>
              Keep Your Books Organized
            </h3>

            <p>
              Upload your books once and keep them safely
              inside your personal Book Library.
            </p>

            <Link
              href="/books"
              className="home-feature-link"
            >
              Open Library →
            </Link>

          </article>

          {/* FEATURE 2 */}
          <article className="home-feature-card">

            <div className="home-feature-top">
              <div className="home-feature-icon">
                🎙
              </div>

              <span>
                AI VOICES
              </span>
            </div>

            <h3>
              Choose Your Voice
            </h3>

            <p>
              Select from available AI voices and create
              a comfortable narration experience.
            </p>

            <Link
              href="/create"
              className="home-feature-link"
            >
              Choose Voice →
            </Link>

          </article>

          {/* FEATURE 3 */}
          <article className="home-feature-card">

            <div className="home-feature-top">
              <div className="home-feature-icon">
                ✦
              </div>

              <span>
                GENERATION
              </span>
            </div>

            <h3>
              Generate Audiobooks
            </h3>

            <p>
              Turn your text or saved book into a finished
              audiobook with a simple workflow.
            </p>

            <Link
              href="/create"
              className="home-feature-link"
            >
              Start Generating →
            </Link>

          </article>

          {/* FEATURE 4 */}
          <article className="home-feature-card">

            <div className="home-feature-top">
              <div className="home-feature-icon">
                🎧
              </div>

              <span>
                AUDIO
              </span>
            </div>

            <h3>
              Dedicated Generated Audio
            </h3>

            <p>
              Finished MP3 audiobooks stay separate from your
              original books for easier management.
            </p>

            <Link
              href="/library"
              className="home-feature-link"
            >
              View Generated Audio →
            </Link>

          </article>

          {/* FEATURE 5 */}
          <article className="home-feature-card home-feature-wide">

            <div className="home-feature-top">

              <div className="home-feature-icon">
                ▶
              </div>

              <span>
                PLAYER
              </span>

            </div>

            <div className="home-feature-wide-content">

              <h3>
                Listen From One Dedicated Player
              </h3>

              <p>
                Select any generated audiobook and use the
                dedicated player to listen, pause, seek,
                adjust volume, or download your MP3.
              </p>

              <Link
                href="/player"
                className="home-feature-link"
              >
                Open Player →
              </Link>

            </div>

            <div className="home-mini-player">

              <div className="home-mini-play">
                ▶
              </div>

              <div className="home-mini-player-content">

                <strong>
                  Generated Audiobook
                </strong>

                <div>
                  <span></span>
                </div>

                <small>
                  12:48 / 38:20
                </small>

              </div>

            </div>

          </article>

        </div>

      </section>

      {/* =========================================
          HOW IT WORKS
      ========================================= */}
      <section className="home-section home-how">

        <div className="home-section-heading">

          <span>
            SIMPLE WORKFLOW
          </span>

          <h2>
            From Book To Audio
            <br />
            <b>In Four Steps</b>
          </h2>

          <p>
            RAFTA keeps the entire audiobook workflow simple
            and organized.
          </p>

        </div>

        <div className="home-step-grid">

          <article className="home-step-card">

            <div className="home-step-number">
              01
            </div>

            <div className="home-step-icon">
              ↑
            </div>

            <h3>
              Upload
            </h3>

            <p>
              Upload your TXT, PDF, or EPUB book.
            </p>

          </article>

          <div className="home-step-arrow">
            →
          </div>

          <article className="home-step-card">

            <div className="home-step-number">
              02
            </div>

            <div className="home-step-icon">
              📚
            </div>

            <h3>
              Organize
            </h3>

            <p>
              Keep your original book inside your Library.
            </p>

          </article>

          <div className="home-step-arrow">
            →
          </div>

          <article className="home-step-card">

            <div className="home-step-number">
              03
            </div>

            <div className="home-step-icon">
              ✦
            </div>

            <h3>
              Generate
            </h3>

            <p>
              Choose an AI voice and create the audiobook.
            </p>

          </article>

          <div className="home-step-arrow">
            →
          </div>

          <article className="home-step-card">

            <div className="home-step-number">
              04
            </div>

            <div className="home-step-icon">
              🎧
            </div>

            <h3>
              Listen
            </h3>

            <p>
              Play, download, and manage the finished audio.
            </p>

          </article>

        </div>

      </section>

      {/* =========================================
          WORKSPACE PREVIEW
      ========================================= */}
      <section className="home-section home-preview-section">

        <div className="home-preview-card">

          <div className="home-preview-copy">

            <span>
              YOUR WORKSPACE
            </span>

            <h2>
              Everything
              <br />
              <b>In One Place.</b>
            </h2>

            <p>
              Move between Dashboard, Library, Generate,
              Generated Audio, and Player without losing
              your workflow.
            </p>

            <div className="home-preview-actions">

              <Link
                href="/dashboard"
                className="home-primary-btn"
              >
                Open Dashboard
              </Link>

              <Link
                href="/library"
                className="home-secondary-btn"
              >
                Generated Audio
              </Link>

            </div>

          </div>

          <div className="home-dashboard-preview">

            <div className="home-preview-sidebar">

              <div className="home-preview-brand">
                <span>
                  ♫
                </span>

                <strong>
                  RAFTA
                </strong>
              </div>

              <div className="home-preview-nav active">
                <span>⌂</span>
                Dashboard
              </div>

              <div className="home-preview-nav">
                <span>✦</span>
                Generate
              </div>

              <div className="home-preview-nav">
                <span>↑</span>
                Upload
              </div>

              <div className="home-preview-nav">
                <span>▣</span>
                Library
              </div>

              <div className="home-preview-nav">
                <span>♫</span>
                Generated Audio
              </div>

              <div className="home-preview-nav">
                <span>▶</span>
                Player
              </div>

            </div>

            <div className="home-preview-main">

              <div className="home-preview-top">
                <span>
                  RAFTA / Dashboard
                </span>

                <strong>
                  Your Audiobooks
                </strong>
              </div>

              <div className="home-preview-stat-grid">

                <div>
                  <span>
                    BOOKS
                  </span>

                  <strong>
                    08
                  </strong>
                </div>

                <div>
                  <span>
                    AUDIO
                  </span>

                  <strong>
                    05
                  </strong>
                </div>

                <div>
                  <span>
                    PLAYING
                  </span>

                  <strong>
                    02
                  </strong>
                </div>

              </div>

              <div className="home-preview-audio">

                <div className="home-preview-audio-icon">
                  ▶
                </div>

                <div>
                  <span>
                    RECENT AUDIO
                  </span>

                  <strong>
                    Your Generated Audiobook
                  </strong>
                </div>

                <div className="home-preview-bars">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================
          CTA
      ========================================= */}
      <section className="home-cta">

        <div className="home-cta-glow"></div>

        <div className="home-cta-content">

          <span>
            START CREATING
          </span>

          <h2>
            Your Next Audiobook
            <br />
            <b>Starts Here.</b>
          </h2>

          <p>
            Upload a book or start with your own text and
            create your first RAFTA AI audiobook.
          </p>

          <div className="home-cta-actions">

            <Link
              href="/create"
              className="home-primary-btn"
            >
              ✦ Create Audiobook
            </Link>

            <Link
              href="/upload"
              className="home-secondary-btn"
            >
              ↑ Upload Book
            </Link>

          </div>

        </div>

      </section>

      {/* =========================================
          FOOTER
      ========================================= */}
      <footer className="home-footer">

        <div className="home-footer-inner">

          <div className="home-footer-brand">

            <Link
              href="/"
              className="home-logo"
            >
              <span className="home-logo-icon">
                ♫
              </span>

              <span className="home-logo-text">
                <strong>
                  RAFTA
                </strong>

                <small>
                  AI AUDIOBOOK
                </small>
              </span>
            </Link>

            <p>
              Create, organize, and listen to AI-generated
              audiobooks from one powerful workspace.
            </p>

          </div>

          <div className="home-footer-column">

            <h4>
              WORKSPACE
            </h4>

            <Link href="/dashboard">
              Dashboard
            </Link>

            <Link href="/create">
              Generate
            </Link>

            <Link href="/upload">
              Upload
            </Link>

          </div>

          <div className="home-footer-column">

            <h4>
              LIBRARY
            </h4>

            <Link href="/books">
              Book Library
            </Link>

            <Link href="/library">
              Generated Audio
            </Link>

            <Link href="/player">
              Player
            </Link>

          </div>

          <div className="home-footer-column">

            <h4>
              ACCOUNT
            </h4>

            <Link href="/settings">
              Settings
            </Link>

            <Link href="/pricing">
              Pricing
            </Link>

            <Link href="/login">
              Login
            </Link>

          </div>

        </div>

        <div className="home-footer-bottom">

          <span>
            © {new Date().getFullYear()} RAFTA AI
          </span>

          <span>
            AI AUDIOBOOK WORKSPACE
          </span>

        </div>

      </footer>

    </main>
  );
}