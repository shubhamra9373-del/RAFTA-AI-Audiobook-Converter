"use client";

import {
useEffect,
useState,
} from "react";

type Theme = "dark" | "light";

interface ThemeToggleProps {
className?: string;
showLabel?: boolean;
size?: "small" | "medium" | "large";
}

export default function ThemeToggle({
className = "",
showLabel = false,
size = "medium",
}: ThemeToggleProps) {
const [theme, setTheme] =
useState<Theme>("dark");

const [mounted, setMounted] =
useState(false);

/*

* Load saved theme.
  */
  useEffect(() => {
  setMounted(true);

```
try {
```

```
  const savedTheme =
    localStorage.getItem(
      "rafta_theme"
    );

  if (
    savedTheme === "light" ||
    savedTheme === "dark"
  ) {
    setTheme(savedTheme);
    applyTheme(savedTheme);
    return;
  }

  /*
   * Detect system preference.
   */
  const prefersLight =
    window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;

  const initialTheme: Theme =
    prefersLight ? "light" : "dark";

  setTheme(initialTheme);
  applyTheme(initialTheme);
} catch (error) {
  console.error(
    "Could not load theme:",
    error
  );

  applyTheme("dark");
}
```

}, []);

/*

* Apply theme to document.
  */
  const applyTheme = (nextTheme: Theme) => {
  const root =
  document.documentElement;

```
root.setAttribute(
```

```
  "data-theme",
  nextTheme
);

root.classList.remove(
  "dark-theme",
  "light-theme"
);

root.classList.add(
  `${nextTheme}-theme`
);

root.style.colorScheme =
  nextTheme;
```

};

/*

* Toggle theme.
  */
  const toggleTheme = () => {
  const nextTheme: Theme =
  theme === "dark"
  ? "light"
  : "dark";

```
setTheme(nextTheme);
```

```
try {
  localStorage.setItem(
    "rafta_theme",
    nextTheme
  );
} catch (error) {
  console.error(
    "Could not save theme:",
    error
  );
}

applyTheme(nextTheme);

window.dispatchEvent(
  new CustomEvent(
    "rafta-theme-change",
    {
      detail: {
        theme: nextTheme,
      },
    }
  )
);
```

};

if (!mounted) {
return (
<button
type="button"
className={[
"rafta-theme-toggle",
`rafta-theme-toggle-${size}`,
className,
]
.filter(Boolean)
.join(" ")}
aria-label="Toggle theme"
disabled
> <span className="rafta-theme-toggle-track"> <span className="rafta-theme-toggle-thumb">
◐ </span> </span>

```
    {showLabel && (
      <span className="rafta-theme-toggle-label">
        Theme
      </span>
    )}
  </button>
);
```

}

const isDark = theme === "dark";

return (
<button
type="button"
className={[
"rafta-theme-toggle",
`rafta-theme-toggle-${size}`,
isDark
? "rafta-theme-dark"
: "rafta-theme-light",
className,
]
.filter(Boolean)
.join(" ")}
onClick={toggleTheme}
aria-label={
isDark
? "Switch to light theme"
: "Switch to dark theme"
}
aria-pressed={isDark}
title={
isDark
? "Switch to light theme"
: "Switch to dark theme"
}
> <span className="rafta-theme-toggle-track"> <span className="rafta-theme-toggle-icons"> <span className="rafta-theme-icon-moon">
☾ </span>

```
      <span className="rafta-theme-icon-sun">
        ☀
      </span>
    </span>

    <span className="rafta-theme-toggle-thumb">
      {isDark ? "☾" : "☀"}
    </span>
  </span>

  {showLabel && (
    <span className="rafta-theme-toggle-label">
      {isDark
        ? "Dark Mode"
        : "Light Mode"}
    </span>
  )}
</button>
```

);
}

/* -------------------------------------------------
Theme Provider Helper
-------------------------------------------------- */

interface ThemeProviderProps {
children: React.ReactNode;
}

export function ThemeProvider({
children,
}: ThemeProviderProps) {
useEffect(() => {
try {
const savedTheme =
localStorage.getItem(
"rafta_theme"
);

```
  if (
    savedTheme === "light" ||
    savedTheme === "dark"
  ) {
    applyGlobalTheme(savedTheme);
    return;
  }

  const prefersLight =
    window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;

  applyGlobalTheme(
    prefersLight ? "light" : "dark"
  );
} catch (error) {
  console.error(
    "Theme initialization failed:",
    error
  );

  applyGlobalTheme("dark");
}
```

}, []);

return <>{children}</>;
}

function applyGlobalTheme(
theme: Theme
) {
const root =
document.documentElement;

root.setAttribute(
"data-theme",
theme
);

root.classList.remove(
"dark-theme",
"light-theme"
);

root.classList.add(
`${theme}-theme`
);

root.style.colorScheme = theme;
}

/* -------------------------------------------------
Theme Status
-------------------------------------------------- */

export function ThemeStatus() {
const [theme, setTheme] =
useState<Theme>("dark");

useEffect(() => {
const updateTheme = () => {
const currentTheme =
document.documentElement.getAttribute(
"data-theme"
);

```
  if (
    currentTheme === "light" ||
    currentTheme === "dark"
  ) {
    setTheme(currentTheme);
  }
};

updateTheme();

window.addEventListener(
  "rafta-theme-change",
  updateTheme
);

return () => {
  window.removeEventListener(
    "rafta-theme-change",
    updateTheme
  );
};
```

}, []);

return ( <span className="rafta-theme-status">
{theme === "dark"
? "Dark"
: "Light"} </span>
);
}
