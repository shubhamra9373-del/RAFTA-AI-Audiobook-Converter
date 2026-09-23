"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setError(false);

    if (!name.trim()) {
      setMessage("Please enter your name.");
      setError(true);
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setError(true);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      setError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setError(true);
      return;
    }

    if (!agree) {
      setMessage("Please accept the terms and privacy policy.");
      setError(true);
      return;
    }

    const user = {
      name: name.trim(),
      email: email.trim(),
      password,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("rafta_user", JSON.stringify(user));

      // A newly created account is not logged in yet.
      localStorage.removeItem("rafta_session");
      localStorage.removeItem("rafta_login");

      setMessage("Account created successfully.");

      window.setTimeout(() => {
        window.location.href = "/login";
      }, 700);
    } catch (storageError) {
      console.error("Signup storage error:", storageError);
      setMessage("Unable to create your account.");
      setError(true);
    }
  };

  return (
    <main className="signup-page">
      <div className="signup-background-glow signup-glow-one"></div>
      <div className="signup-background-glow signup-glow-two"></div>

      <Link href="/" className="signup-brand">
        <span className="signup-brand-icon">♫</span>

        <span>
          <strong>RAFTA</strong>
          <small>AI AUDIOBOOK</small>
        </span>
      </Link>

      <div className="signup-shell">
        <section className="signup-intro">
          <span className="signup-intro-label">
            START YOUR WORKSPACE
          </span>

          <h1>
            Create Your
            <br />
            <strong>RAFTA Account.</strong>
          </h1>

          <p>
            Build your audiobook workspace, save your books,
            generate natural AI audio, and manage your
            listening library from one place.
          </p>

          <div className="signup-benefits">
            <div className="signup-benefit">
              <span>📚</span>

              <div>
                <strong>Organize Your Books</strong>

                <p>
                  Keep your uploaded books together in your
                  personal Book Library.
                </p>
              </div>
            </div>

            <div className="signup-benefit">
              <span>🎙</span>

              <div>
                <strong>Generate AI Audiobooks</strong>

                <p>
                  Convert text into natural-sounding audio
                  with your selected voice.
                </p>
              </div>
            </div>

            <div className="signup-benefit">
              <span>🎧</span>

              <div>
                <strong>Listen & Download</strong>

                <p>
                  Keep generated MP3 audiobooks separate and
                  ready for playback.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="signup-card">
          <div className="signup-card-header">
            <span>CREATE ACCOUNT</span>

            <h2>Join RAFTA AI</h2>

            <p>
              Create your account to start building audiobooks.
            </p>
          </div>

          {message && (
            <div
              className={`signup-message ${
                error
                  ? "signup-message-error"
                  : "signup-message-success"
              }`}
            >
              <span>{error ? "!" : "✓"}</span>
              <p>{message}</p>
            </div>
          )}

          <form
            className="signup-form"
            onSubmit={handleSubmit}
          >
            <div className="signup-field">
              <label htmlFor="signup-name">
                FULL NAME
              </label>

              <div className="signup-input-wrap">
                <span>◉</span>

                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-email">
                EMAIL ADDRESS
              </label>

              <div className="signup-input-wrap">
                <span>@</span>

                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-password">
                PASSWORD
              </label>

              <div className="signup-input-wrap">
                <span>▣</span>

                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                >
                  {showPassword ? "◉" : "○"}
                </button>
              </div>

              <small>
                Use at least 6 characters.
              </small>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-confirm-password">
                CONFIRM PASSWORD
              </label>

              <div className="signup-input-wrap">
                <span>▣</span>

                <input
                  id="signup-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                >
                  {showConfirmPassword ? "◉" : "○"}
                </button>
              </div>
            </div>

            <label className="signup-check-row">
              <input
                type="checkbox"
                checked={agree}
                onChange={(event) =>
                  setAgree(event.target.checked)
                }
              />

              <span>
                I agree to the RAFTA AI terms and privacy policy.
              </span>
            </label>

            <button
              type="submit"
              className="signup-submit"
            >
              Create Account
              <span>→</span>
            </button>
          </form>

          <div className="signup-divider">
            <span>ALREADY HAVE AN ACCOUNT?</span>
          </div>

          <Link
            href="/login"
            className="signup-login-link"
          >
            Login to RAFTA AI
          </Link>
        </section>
      </div>

      <footer className="signup-footer">
        <span>RAFTA AI</span>
        <p>AI Audiobook Workspace</p>
      </footer>
    </main>
  );
}