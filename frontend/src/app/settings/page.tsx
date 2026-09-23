"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import AuthGuard from "../../components/AuthGuard";

interface Settings {
  displayName: string;
  email: string;
  defaultVoice: string;
  autoplay: boolean;
}

const SETTINGS_KEY = "rafta_settings";

const DEFAULT_SETTINGS: Settings = {
  displayName: "User",
  email: "user@rafta.ai",
  defaultVoice: "en-IN-NeerjaNeural",
  autoplay: true,
};

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState(
    DEFAULT_SETTINGS.displayName
  );

  const [email, setEmail] = useState(
    DEFAULT_SETTINGS.email
  );

  const [defaultVoice, setDefaultVoice] = useState(
    DEFAULT_SETTINGS.defaultVoice
  );

  const [autoplay, setAutoplay] = useState(
    DEFAULT_SETTINGS.autoplay
  );

  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      const savedSettings =
        localStorage.getItem(SETTINGS_KEY);

      if (!savedSettings) {
        return;
      }

      const settings: Partial<Settings> =
        JSON.parse(savedSettings);

      if (
        typeof settings.displayName === "string"
      ) {
        setDisplayName(settings.displayName);
      }

      if (typeof settings.email === "string") {
        setEmail(settings.email);
      }

      if (
        typeof settings.defaultVoice === "string"
      ) {
        setDefaultVoice(settings.defaultVoice);
      }

      if (
        typeof settings.autoplay === "boolean"
      ) {
        setAutoplay(settings.autoplay);
      }
    } catch (error) {
      console.error(
        "Settings load error:",
        error
      );
    }
  }, []);

  const saveSettings = () => {
    const settings: Settings = {
      displayName: displayName.trim() || "User",
      email: email.trim() || "user@rafta.ai",
      defaultVoice,
      autoplay,
    };

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );

      setDisplayName(settings.displayName);
      setEmail(settings.email);

      setSaveMessage(
        "Settings saved successfully."
      );

      window.setTimeout(() => {
        setSaveMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );

      setSaveMessage(
        "Unable to save settings."
      );
    }
  };

  const resetSettings = () => {
    const confirmed = window.confirm(
      "Reset all RAFTA settings to their default values?"
    );

    if (!confirmed) {
      return;
    }

    setDisplayName(
      DEFAULT_SETTINGS.displayName
    );

    setEmail(DEFAULT_SETTINGS.email);

    setDefaultVoice(
      DEFAULT_SETTINGS.defaultVoice
    );

    setAutoplay(DEFAULT_SETTINGS.autoplay);

    try {
      localStorage.removeItem(SETTINGS_KEY);
      setSaveMessage(
        "Settings restored to default."
      );
    } catch (error) {
      console.error(
        "Settings reset error:",
        error
      );

      setSaveMessage(
        "Unable to reset settings."
      );
    }
  };

  return (
    <AuthGuard>
      <main className="settings-page">
        <Sidebar />

        <section className="settings-content">
          <header className="settings-header">
            <div>
              <div className="breadcrumb">
                <span>RAFTA</span>
                <b>/</b>
                <span>Settings</span>
              </div>

              <h1>Settings</h1>

              <p>
                Manage your profile, audiobook preferences,
                and listening experience.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="settings-dashboard-btn"
            >
              ← Dashboard
            </Link>
          </header>

          {saveMessage && (
            <div className="settings-message">
              <span>✓</span>

              <p>{saveMessage}</p>

              <button
                type="button"
                onClick={() => setSaveMessage("")}
              >
                ×
              </button>
            </div>
          )}

          <div className="settings-layout">
            <div className="settings-main">
              <section className="settings-card">
                <div className="settings-card-heading">
                  <div className="settings-card-icon">
                    ◉
                  </div>

                  <div>
                    <span>ACCOUNT</span>

                    <h2>
                      Profile Information
                    </h2>

                    <p>
                      Update the basic information used in
                      your RAFTA workspace.
                    </p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label htmlFor="display-name">
                      DISPLAY NAME
                    </label>

                    <input
                      id="display-name"
                      type="text"
                      value={displayName}
                      onChange={(event) =>
                        setDisplayName(
                          event.target.value
                        )
                      }
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="settings-field">
                    <label htmlFor="email">
                      EMAIL ADDRESS
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card-heading">
                  <div className="settings-card-icon">
                    🎧
                  </div>

                  <div>
                    <span>AUDIOBOOK</span>

                    <h2>
                      Audio Preferences
                    </h2>

                    <p>
                      Choose the default settings for your
                      audiobook experience.
                    </p>
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="default-voice">
                    DEFAULT AI VOICE
                  </label>

                  <select
                    id="default-voice"
                    value={defaultVoice}
                    onChange={(event) =>
                      setDefaultVoice(
                        event.target.value
                      )
                    }
                  >
                    <option value="en-IN-NeerjaNeural">
                      Neerja — English (India)
                    </option>

                    <option value="en-IN-PrabhatNeural">
                      Prabhat — English (India)
                    </option>

                    <option value="en-US-JennyNeural">
                      Jenny — English (US)
                    </option>

                    <option value="en-US-GuyNeural">
                      Guy — English (US)
                    </option>

                    <option value="en-GB-SoniaNeural">
                      Sonia — English (UK)
                    </option>

                    <option value="en-GB-RyanNeural">
                      Ryan — English (UK)
                    </option>
                  </select>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-icon">
                    ▶
                  </div>

                  <div className="settings-toggle-content">
                    <strong>
                      Autoplay generated audio
                    </strong>

                    <p>
                      Start playback automatically when supported
                      by the browser.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={`settings-toggle ${
                      autoplay ? "active" : ""
                    }`}
                    onClick={() =>
                      setAutoplay(
                        (current) => !current
                      )
                    }
                    aria-label="Toggle autoplay"
                    aria-pressed={autoplay}
                  >
                    <span></span>
                  </button>
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card-heading">
                  <div className="settings-card-icon">
                    ◈
                  </div>

                  <div>
                    <span>WORKSPACE</span>

                    <h2>
                      Your RAFTA Data
                    </h2>

                    <p>
                      Your current books and generated audio
                      are stored locally in this browser.
                    </p>
                  </div>
                </div>

                <div className="settings-data-grid">
                  <div className="settings-data-item">
                    <span>BOOK LIBRARY</span>

                    <strong>
                      Saved locally
                    </strong>

                    <small>
                      rafta_books
                    </small>
                  </div>

                  <div className="settings-data-item">
                    <span>GENERATED AUDIO</span>

                    <strong>
                      Saved locally
                    </strong>

                    <small>
                      rafta_audiobooks
                    </small>
                  </div>
                </div>
              </section>

              <div className="settings-actions">
                <button
                  type="button"
                  className="settings-save-btn"
                  onClick={saveSettings}
                >
                  ✓ Save Settings
                </button>

                <button
                  type="button"
                  className="settings-reset-btn"
                  onClick={resetSettings}
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <aside className="settings-side">
              <section className="settings-side-card">
                <div className="settings-side-top">
                  <div className="settings-avatar">
                    {displayName
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "U"}
                  </div>

                  <div>
                    <span>PROFILE</span>

                    <h2>
                      {displayName || "User"}
                    </h2>

                    <small>{email}</small>
                  </div>
                </div>

                <div className="settings-status">
                  <span></span>
                  RAFTA AI System Online
                </div>
              </section>

              <section className="settings-side-card">
                <div className="settings-side-heading">
                  <span>✦</span>

                  <div>
                    <small>CURRENT VOICE</small>

                    <h3>
                      {defaultVoice
                        .replace("en-IN-", "")
                        .replace("en-US-", "")
                        .replace("en-GB-", "")
                        .replace("Neural", "")}
                    </h3>
                  </div>
                </div>

                <p className="settings-side-description">
                  This voice will be selected as the default
                  preference for your audiobook workspace.
                </p>

                <Link
                  href="/create"
                  className="settings-generate-link"
                >
                  ✦ Open Generate
                </Link>
              </section>

              <section className="settings-side-card">
                <div className="settings-side-heading">
                  <span>⇄</span>

                  <div>
                    <small>WORKSPACE FLOW</small>

                    <h3>
                      Organized Storage
                    </h3>
                  </div>
                </div>

                <div className="settings-flow">
                  <div>
                    <b>01</b>
                    <span>Upload</span>
                  </div>

                  <i>↓</i>

                  <div>
                    <b>02</b>
                    <span>Library</span>
                  </div>

                  <i>↓</i>

                  <div>
                    <b>03</b>
                    <span>Generate</span>
                  </div>

                  <i>↓</i>

                  <div>
                    <b>04</b>
                    <span>Audio</span>
                  </div>
                </div>
              </section>

              <section className="settings-help-card">
                <div className="settings-help-icon">
                  i
                </div>

                <div>
                  <strong>
                    Local workspace
                  </strong>

                  <p>
                    Settings, saved books, and generated audio
                    are currently managed in your browser.
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <footer className="settings-footer">
            <span>RAFTA AI</span>

            <p>
              Settings · Audiobook Workspace
            </p>
          </footer>
        </section>
      </main>
    </AuthGuard>
  );
}