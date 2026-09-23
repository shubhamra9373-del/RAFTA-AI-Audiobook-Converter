"use client";

import { CSSProperties, useEffect, useState } from "react";

export type LoaderSize = "small" | "medium" | "large";
export type LoaderVariant =
| "spinner"
| "dots"
| "pulse"
| "bars"
| "ring";

interface LoaderProps {
size?: LoaderSize;
variant?: LoaderVariant;
text?: string;
fullscreen?: boolean;
overlay?: boolean;
showLogo?: boolean;
color?: string;
className?: string;
}

export default function Loader({
size = "medium",
variant = "spinner",
text = "Loading...",
fullscreen = false,
overlay = false,
showLogo = false,
color,
className = "",
}: LoaderProps) {
const [mounted, setMounted] = useState(false);

useEffect(() => {
setMounted(true);
}, []);

const classes = [
"rafta-loader",
`rafta-loader-${size}`,
`rafta-loader-${variant}`,
fullscreen ? "rafta-loader-fullscreen" : "",
overlay ? "rafta-loader-overlay" : "",
className,
]
.filter(Boolean)
.join(" ");

const loaderStyle: CSSProperties = color
? ({
"--rafta-loader-color": color,
} as CSSProperties)
: {};

if (!mounted) {
return null;
}

return (
<div
className={classes}
style={loaderStyle}
role="status"
aria-live="polite"
aria-label={text || "Loading"}
> <div className="rafta-loader-container">
{showLogo && ( <div className="rafta-loader-logo"> <span className="rafta-loader-logo-mark">
R </span>

```
        <span className="rafta-loader-logo-text">
          RAFTA <strong>AI</strong>
        </span>
      </div>
    )}

    <LoaderAnimation variant={variant} />

    {text && (
      <p className="rafta-loader-text">
        {text}
      </p>
    )}
  </div>
</div>
```

);
}

interface LoaderAnimationProps {
variant: LoaderVariant;
}

function LoaderAnimation({
variant,
}: LoaderAnimationProps) {
if (variant === "dots") {
return ( <div
     className="rafta-loader-animation rafta-loader-dots-animation"
     aria-hidden="true"
   > <span /> <span /> <span /> </div>
);
}

if (variant === "pulse") {
return ( <div
     className="rafta-loader-animation rafta-loader-pulse-animation"
     aria-hidden="true"
   > <span /> </div>
);
}

if (variant === "bars") {
return ( <div
     className="rafta-loader-animation rafta-loader-bars-animation"
     aria-hidden="true"
   > <span /> <span /> <span /> <span /> <span /> </div>
);
}

if (variant === "ring") {
return ( <div
     className="rafta-loader-animation rafta-loader-ring-animation"
     aria-hidden="true"
   > <span /> </div>
);
}

return ( <div
   className="rafta-loader-animation rafta-loader-spinner-animation"
   aria-hidden="true"
 > <span /> </div>
);
}

/*

* Full-page loading helper.
  */
  export function FullPageLoader({
  text = "Loading RAFTA AI...",
  showLogo = true,
  variant = "spinner",
  className = "",
  }: {
  text?: string;
  showLogo?: boolean;
  variant?: LoaderVariant;
  className?: string;
  }) {
  return ( <Loader
  text={text}
  showLogo={showLogo}
  variant={variant}
  fullscreen
  className={className}
  />
  );
  }

/*

* Small inline loading helper.
  */
  export function InlineLoader({
  text = "",
  size = "small",
  variant = "spinner",
  className = "",
  }: {
  text?: string;
  size?: LoaderSize;
  variant?: LoaderVariant;
  className?: string;
  }) {
  return ( <Loader
  text={text}
  size={size}
  variant={variant}
  className={className}
  />
  );
  }
