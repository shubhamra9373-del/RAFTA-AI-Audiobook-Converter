"use client";

import Link from "next/link";
import {
FormEvent,
useEffect,
useRef,
useState,
} from "react";

interface NavItem {
label: string;
href: string;
}

interface NavbarProps {
transparent?: boolean;
sticky?: boolean;
showSearch?: boolean;
showAuthButtons?: boolean;
className?: string;
}

const navItems: NavItem[] = [
{
label: "Home",
href: "/",
},
{
label: "Create",
href: "/create",
},
{
label: "Library",
href: "/library",
},
{
label: "Pricing",
href: "/pricing",
},
];

export default function Navbar({
transparent = false,
sticky = true,
showSearch = true,
showAuthButtons = true,
className = "",
}: NavbarProps) {
const [menuOpen, setMenuOpen] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [scrolled, setScrolled] = useState(false);

const searchInputRef =
useRef<HTMLInputElement | null>(null);

/*

* Detect page scroll.
  */
  useEffect(() => {
  const handleScroll = () => {
  setScrolled(window.scrollY > 10);
  };

```
handleScroll();
```

```
window.addEventListener(
  "scroll",
  handleScroll,
  { passive: true }
);

return () => {
  window.removeEventListener(
    "scroll",
    handleScroll
  );
};
```

}, []);

/*

* Prevent body scroll when mobile menu is open.
  */
  useEffect(() => {
  if (!menuOpen) {
  return;
  }

```
const previousOverflow =
```

```
  document.body.style.overflow;

document.body.style.overflow = "hidden";

return () => {
  document.body.style.overflow =
    previousOverflow;
};
```

}, [menuOpen]);

/*

* Focus search field.
  */
  useEffect(() => {
  if (!searchOpen) {
  return;
  }

```
const timer = window.setTimeout(() => {
```

```
  searchInputRef.current?.focus();
}, 50);

return () => {
  window.clearTimeout(timer);
};
```

}, [searchOpen]);

/*

* Close mobile navigation on larger screens.
  */
  useEffect(() => {
  const handleResize = () => {
  if (window.innerWidth > 900) {
  setMenuOpen(false);
  }
  };

```
window.addEventListener(
```

```
  "resize",
  handleResize
);

return () => {
  window.removeEventListener(
    "resize",
    handleResize
  );
};
```

}, []);

/*

* Handle search.
  */
  const handleSearch = (
  event: FormEvent<HTMLFormElement>
  ) => {
  event.preventDefault();

```
const query = searchQuery.trim();
```

```
if (!query) {
  return;
}

const encodedQuery =
  encodeURIComponent(query);

window.location.href = `/library?search=${encodedQuery}`;
```

};

/*

* Close everything.
  */
  const closeMenus = () => {
  setMenuOpen(false);
  setSearchOpen(false);
  };

const navbarClasses = [
"rafta-navbar",
sticky ? "rafta-navbar-sticky" : "",
transparent
? "rafta-navbar-transparent"
: "",
scrolled ? "rafta-navbar-scrolled" : "",
className,
]
.filter(Boolean)
.join(" ");

return (
<> <header className={navbarClasses}> <div className="rafta-navbar-container">
{/* Logo */}

```
      <Link
        href="/"
        className="rafta-navbar-logo"
        onClick={closeMenus}
        aria-label="RAFTA AI Home"
      >
        <span className="rafta-navbar-logo-mark">
          R
        </span>

        <span className="rafta-navbar-logo-name">
          RAFTA <strong>AI</strong>
        </span>
      </Link>

      {/* Desktop Navigation */}

      <nav
        className="rafta-navbar-links"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rafta-navbar-link"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right Side */}

      <div className="rafta-navbar-actions">
        {showSearch && (
          <div className="rafta-navbar-search-wrapper">
            {searchOpen && (
              <form
                className="rafta-navbar-search-form"
                onSubmit={handleSearch}
              >
                <span className="rafta-navbar-search-icon">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search audiobooks..."
                  aria-label="Search audiobooks"
                />

                <button
                  type="button"
                  className="rafta-navbar-search-close"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  aria-label="Close search"
                >
                  ×
                </button>
              </form>
            )}

            {!searchOpen && (
              <button
                type="button"
                className="rafta-navbar-icon-button"
                onClick={() =>
                  setSearchOpen(true)
                }
                aria-label="Open search"
                title="Search"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {showAuthButtons && (
          <div className="rafta-navbar-auth">
            <Link
              href="/login"
              className="rafta-navbar-login"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rafta-navbar-signup"
            >
              Get Started
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}

        <button
          type="button"
          className={`rafta-navbar-menu-button ${
            menuOpen ? "active" : ""
          }`}
          onClick={() =>
            setMenuOpen((current) => !current)
          }
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="rafta-mobile-navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>

    {/* Mobile Navigation */}

    <div
      id="rafta-mobile-navigation"
      className={`rafta-navbar-mobile ${
        menuOpen ? "open" : ""
      }`}
    >
      <div className="rafta-navbar-mobile-inner">
        <nav
          className="rafta-navbar-mobile-links"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rafta-navbar-mobile-link"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              <span>{item.label}</span>
              <span>→</span>
            </Link>
          ))}
        </nav>

        {showAuthButtons && (
          <div className="rafta-navbar-mobile-auth">
            <Link
              href="/login"
              className="rafta-navbar-mobile-login"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rafta-navbar-mobile-signup"
              onClick={() =>
                setMenuOpen(false)
              }
            >
              Get Started
            </Link>
          </div>
        )}

        <div className="rafta-navbar-mobile-brand">
          <span>
            Turn your words into audio.
          </span>

          <strong>
            Powered by RAFTA AI
          </strong>
        </div>
      </div>
    </div>
  </header>

  {/* Mobile overlay */}

  {menuOpen && (
    <button
      type="button"
      className="rafta-navbar-mobile-overlay"
      onClick={() => setMenuOpen(false)}
      aria-label="Close navigation menu"
    />
  )}
</>
```

);
}
