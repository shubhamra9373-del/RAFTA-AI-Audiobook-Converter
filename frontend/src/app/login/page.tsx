"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setError(false);

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setError(true);
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      setError(true);
      return;
    }

    try {
      const savedUser = localStorage.getItem("rafta_user");

      if (!savedUser) {
        setMessage(
          "No account found. Please create an account first."
        );
        setError(true);
        return;
      }

      const user = JSON.parse(savedUser);

      if (
        user.email?.toLowerCase() !==
          email.trim().toLowerCase() ||
        user.password !== password
      ) {
        setMessage("Invalid email or password.");
        setError(true);
        return;
      }

      localStorage.setItem("rafta_session", "active");

      if (remember) {
        localStorage.setItem(
          "rafta_login",
          JSON.stringify({
            email: user.email,
            remember: true,
          })
        );
      } else {
        localStorage.removeItem("rafta_login");
      }

      setMessage("Login successful.");

      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (storageError) {
      console.error("Login error:", storageError);
      setMessage("Unable to login. Please try again.");
      setError(true);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background-glow login-glow-one"></div>
      <div className="login-background-glow login-glow-two"></div>

      <Link href="/" className="login-brand">
        <span className="login-brand-icon">♫</span>

        <span>
          <strong>RAFTA</strong>
          <small>AI AUDIOBOOK</small>
        </span>
      </Link>

      <div className="login-shell">
        <section className="login-intro">
          <span className="login-intro-label">
            WELCOME BACK
          </span>

          <h1>
            Continue Your
            <br />
            <strong>Audio Journey.</strong>
          </h1>

          <p>
            Sign in to access your books, generated
            audiobooks, AI voices, and personal workspace.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span>📚</span>
              <div>
                <strong>Your Book Library</strong>
                <p>
                  Access your saved books and continue where
                  you left off.
                </p>
              </div>
            </div>

            <div className="login-feature">
              <span>🎙</span>
              <div>
                <strong>AI Audiobook Generator</strong>
                <p>
                  Create natural-sounding audiobooks using
                  your preferred AI voice.
                </p>
              </div>
            </div>

            <div className="login-feature">
              <span>🎧</span>
              <div>
                <strong>Your Audio Collection</strong>
                <p>
                  Play, download, and manage your generated
                  audiobook files.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <span>ACCOUNT LOGIN</span>

            <h2>Welcome Back</h2>

            <p>
              Login to continue to your RAFTA AI workspace.
            </p>
          </div>

          {message && (
            <div
              className={`login-message ${
                error
                  ? "login-message-error"
                  : "login-message-success"
              }`}
            >
              <span>{error ? "!" : "✓"}</span>

              <p>{message}</p>
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-field">
              <label htmlFor="login-email">
                EMAIL ADDRESS
              </label>

              <div className="login-input-wrap">
                <span>@</span>

                <input
                  id="login-email"
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

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">
                  PASSWORD
                </label>

                <button
                  type="button"
                  className="login-forgot"
                  onClick={() => {
                    setMessage(
                      "Password recovery will be available soon."
                    );
                    setError(false);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="login-input-wrap">
                <span>▣</span>

                <input
                  id="login-password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "○"}
                </button>
              </div>
            </div>

            <label className="login-check-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) =>
                  setRemember(event.target.checked)
                }
              />

              <span>
                Remember me on this device
              </span>
            </label>

            <button
              type="submit"
              className="login-submit"
            >
              Login to RAFTA
              <span>→</span>
            </button>
          </form>

          <div className="login-divider">
            <span>NEW TO RAFTA AI?</span>
          </div>

          <Link
            href="/signup"
            className="login-signup-link"
          >
            Create a New Account
          </Link>
        </section>
      </div>

      <footer className="login-footer">
        <span>RAFTA AI</span>
        <p>AI Audiobook Workspace</p>
      </footer>
    </main>
  );
}