"use client";

import Link from "next/link";
import { useMemo } from "react";

interface FooterLink {
label: string;
href: string;
external?: boolean;
}

interface FooterSection {
title: string;
links: FooterLink[];
}

interface FooterProps {
showNewsletter?: boolean;
showSocial?: boolean;
compact?: boolean;
className?: string;
}

const footerSections: FooterSection[] = [
{
title: "Product",
links: [
{
label: "Create Audiobook",
href: "/create",
},
{
label: "Library",
href: "/library",
},
{
label: "Player",
href: "/player",
},
{
label: "Pricing",
href: "/pricing",
},
],
},
{
title: "Account",
links: [
{
label: "Dashboard",
href: "/dashboard",
},
{
label: "Settings",
href: "/settings",
},
{
label: "Login",
href: "/login",
},
{
label: "Sign Up",
href: "/signup",
},
],
},
{
title: "Resources",
links: [
{
label: "How It Works",
href: "/create",
},
{
label: "Audio Library",
href: "/library",
},
{
label: "Support",
href: "/settings",
},
{
label: "Documentation",
href: "/settings",
},
],
},
];

function scrollToTop() {
if (typeof window !== "undefined") {
window.scrollTo({
top: 0,
behavior: "smooth",
});
}
}

export default function Footer({
showNewsletter = true,
showSocial = true,
compact = false,
className = "",
}: FooterProps) {
const year = useMemo(
() => new Date().getFullYear(),
[]
);

const handleNewsletterSubmit = (
event: React.FormEvent<HTMLFormElement>
) => {
event.preventDefault();

```
const form = event.currentTarget;
const emailInput =
  form.elements.namedItem(
    "footer-email"
  ) as HTMLInputElement | null;

if (!emailInput) {
  return;
}

const email = emailInput.value.trim();

if (!email) {
  return;
}

console.log(
  "RAFTA newsletter subscription:",
  email
);

emailInput.value = "";

window.alert(
  "Thank you for subscribing to RAFTA AI."
);
```

};

const footerClasses = [
"rafta-footer",
compact ? "rafta-footer-compact" : "",
className,
]
.filter(Boolean)
.join(" ");

return ( <footer className={footerClasses}> <div className="rafta-footer-glow rafta-footer-glow-one" /> <div className="rafta-footer-glow rafta-footer-glow-two" />

```
  <div className="rafta-footer-container">
    {!compact && (
      <div className="rafta-footer-top">
        <div className="rafta-footer-brand">
          <Link
            href="/"
            className="rafta-footer-logo"
            aria-label="RAFTA AI home"
          >
            <span className="rafta-footer-logo-mark">
              R
            </span>

            <span className="rafta-footer-logo-text">
              RAFTA <strong>AI</strong>
            </span>
          </Link>

          <p className="rafta-footer-tagline">
            Turn your words into immersive
            audiobooks with AI-powered voices.
          </p>

          <p className="rafta-footer-description">
            Create, manage, and enjoy your
            audiobooks with the RAFTA AI Audiobook
            Converter.
          </p>

          {showSocial && (
            <div className="rafta-footer-socials">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rafta-footer-social"
                aria-label="GitHub"
                title="GitHub"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 .7a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.13-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.13 3.17.76.84 1.22 1.91 1.22 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .7Z"
                  />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rafta-footer-social"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.68H9.35V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM3.56 20.45h3.56V8.99H3.56v11.46ZM22.22 0H1.78C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.78 24h20.44c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z"
                  />
                </svg>
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rafta-footer-social"
                aria-label="X"
                title="X"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.24-8.28L.8 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.86h1.72L6.48 4.03H4.64L17.8 19.86Z"
                  />
                </svg>
              </a>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rafta-footer-social"
                aria-label="YouTube"
                title="YouTube"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.52 3.57 12 3.57 12 3.57s-7.52 0-9.39.51A3 3 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3 3 0 0 0 2.11 2.12c1.87.51 9.39.51 9.39.51s7.52 0 9.39-.51a3 3 0 0 0 2.11-2.12c.5-1.88.5-5.8.5-5.8s0-3.92-.5-5.8ZM9.55 15.59V8.41L15.82 12l-6.27 3.59Z"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>

        <div className="rafta-footer-links-wrapper">
          {footerSections.map(
            (section) => (
              <div
                key={section.title}
                className="rafta-footer-column"
              >
                <h3 className="rafta-footer-column-title">
                  {section.title}
                </h3>

                <nav
                  className="rafta-footer-links"
                  aria-label={
                    section.title
                  }
                >
                  {section.links.map(
                    (link) =>
                      link.external ? (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rafta-footer-link"
                        >
                          {link.label}
                          <span className="rafta-footer-external">
                            ↗
                          </span>
                        </a>
                      ) : (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="rafta-footer-link"
                        >
                          {link.label}
                        </Link>
                      )
                  )}
                </nav>
              </div>
            )
          )}
        </div>

        {showNewsletter && (
          <div className="rafta-footer-newsletter">
            <div className="rafta-footer-newsletter-icon">
              ✦
            </div>

            <h3>
              Stay in the loop
            </h3>

            <p>
              Get product updates, audiobook tips,
              and RAFTA AI news.
            </p>

            <form
              className="rafta-footer-newsletter-form"
              onSubmit={
                handleNewsletterSubmit
              }
            >
              <label
                htmlFor="footer-email"
                className="rafta-footer-sr-only"
              >
                Email address
              </label>

              <input
                id="footer-email"
                name="footer-email"
                type="email"
                placeholder="Your email address"
                autoComplete="email"
                required
              />

              <button
                type="submit"
                aria-label="Subscribe to newsletter"
              >
                →
              </button>
            </form>

            <span className="rafta-footer-newsletter-note">
              No spam. Unsubscribe anytime.
            </span>
          </div>
        )}
      </div>
    )}

    <div className="rafta-footer-divider" />

    <div className="rafta-footer-bottom">
      <div className="rafta-footer-copyright">
        <span className="rafta-footer-copyright-mark">
          ©
        </span>

        <span>
          {year} RAFTA AI. All rights
          reserved.
        </span>
      </div>

      <div className="rafta-footer-legal">
        <Link
          href="/privacy"
          className="rafta-footer-legal-link"
        >
          Privacy
        </Link>

        <Link
          href="/terms"
          className="rafta-footer-legal-link"
        >
          Terms
        </Link>

        <Link
          href="/cookies"
          className="rafta-footer-legal-link"
        >
          Cookies
        </Link>

        <button
          type="button"
          className="rafta-footer-top-button"
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      </div>
    </div>
  </div>
</footer>
```

);
}
