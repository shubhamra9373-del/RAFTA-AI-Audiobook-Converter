"use client";

import {
HTMLAttributes,
ReactNode,
forwardRef,
} from "react";

export type CardVariant =
| "default"
| "elevated"
| "outlined"
| "glass"
| "interactive";

export type CardPadding =
| "none"
| "small"
| "medium"
| "large";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
children?: ReactNode;
variant?: CardVariant;
padding?: CardPadding;
hoverable?: boolean;
clickable?: boolean;
fullWidth?: boolean;
onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
(
{
children,
variant = "default",
padding = "medium",
hoverable = false,
clickable = false,
fullWidth = false,
className = "",
onClick,
...props
},
ref
) => {
const isInteractive = hoverable || clickable || !!onClick;

```
const cardClasses = [
  "rafta-card",
  `rafta-card-${variant}`,
  `rafta-card-padding-${padding}`,
  isInteractive ? "rafta-card-hoverable" : "",
  clickable || onClick ? "rafta-card-clickable" : "",
  fullWidth ? "rafta-card-full" : "",
  className,
]
  .filter(Boolean)
  .join(" ");

const handleKeyDown = (
  event: React.KeyboardEvent<HTMLDivElement>
) => {
  if (!onClick) return;

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick(
      event as unknown as React.MouseEvent<HTMLDivElement>
    );
  }
};

return (
  <div
    ref={ref}
    className={cardClasses}
    onClick={onClick}
    onKeyDown={handleKeyDown}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    {...props}
  >
    {children}
  </div>
);
```

}
);

Card.displayName = "Card";

export default Card;

/* -------------------------------------------------
Card Header
-------------------------------------------------- */

interface CardHeaderProps
extends HTMLAttributes<HTMLDivElement> {
children?: ReactNode;
title?: string;
description?: string;
icon?: ReactNode;
action?: ReactNode;
}

export function CardHeader({
children,
title,
description,
icon,
action,
className = "",
...props
}: CardHeaderProps) {
return (
<div
className={`rafta-card-header ${className}`.trim()}
{...props}
> <div className="rafta-card-header-main">
{icon && ( <div className="rafta-card-header-icon">
{icon} </div>
)}

```
    <div className="rafta-card-header-text">
      {title && (
        <h3 className="rafta-card-title">
          {title}
        </h3>
      )}

      {description && (
        <p className="rafta-card-description">
          {description}
        </p>
      )}

      {children}
    </div>
  </div>

  {action && (
    <div className="rafta-card-header-action">
      {action}
    </div>
  )}
</div>
```

);
}

/* -------------------------------------------------
Card Content
-------------------------------------------------- */

interface CardContentProps
extends HTMLAttributes<HTMLDivElement> {
children?: ReactNode;
}

export function CardContent({
children,
className = "",
...props
}: CardContentProps) {
return (
<div
className={`rafta-card-content ${className}`.trim()}
{...props}
>
{children} </div>
);
}

/* -------------------------------------------------
Card Footer
-------------------------------------------------- */

interface CardFooterProps
extends HTMLAttributes<HTMLDivElement> {
children?: ReactNode;
justify?:
| "start"
| "center"
| "end"
| "between";
}

export function CardFooter({
children,
justify = "end",
className = "",
...props
}: CardFooterProps) {
return (
<div
className={[
"rafta-card-footer",
`rafta-card-footer-${justify}`,
className,
]
.filter(Boolean)
.join(" ")}
{...props}
>
{children} </div>
);
}

/* -------------------------------------------------
Card Media
-------------------------------------------------- */

interface CardMediaProps
extends HTMLAttributes<HTMLDivElement> {
children?: ReactNode;
src?: string;
alt?: string;
height?: number | string;
}

export function CardMedia({
children,
src,
alt = "",
height,
className = "",
style,
...props
}: CardMediaProps) {
const mediaStyle = {
...style,
...(height !== undefined
? {
height:
typeof height === "number"
? `${height}px`
: height,
}
: {}),
};

return (
<div
className={`rafta-card-media ${className}`.trim()}
style={mediaStyle}
{...props}
>
{src ? ( <img
       src={src}
       alt={alt}
       className="rafta-card-media-image"
     />
) : (
children
)} </div>
);
}

/* -------------------------------------------------
Card Badge
-------------------------------------------------- */

interface CardBadgeProps
extends HTMLAttributes<HTMLSpanElement> {
children?: ReactNode;
variant?:
| "purple"
| "blue"
| "green"
| "red"
| "orange"
| "gray";
}

export function CardBadge({
children,
variant = "purple",
className = "",
...props
}: CardBadgeProps) {
return (
<span
className={[
"rafta-card-badge",
`rafta-card-badge-${variant}`,
className,
]
.filter(Boolean)
.join(" ")}
{...props}
>
{children} </span>
);
}

/* -------------------------------------------------
Card Divider
-------------------------------------------------- */

export function CardDivider({
className = "",
...props
}: HTMLAttributes<HTMLDivElement>) {
return (
<div
className={`rafta-card-divider ${className}`.trim()}
{...props}
/>
);
}
