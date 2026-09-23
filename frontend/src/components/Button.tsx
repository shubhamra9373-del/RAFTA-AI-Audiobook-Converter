"use client";

import {
ButtonHTMLAttributes,
ReactNode,
forwardRef,
} from "react";

export type ButtonVariant =
| "primary"
| "secondary"
| "outline"
| "ghost"
| "danger"
| "success"
| "link";

export type ButtonSize =
| "small"
| "medium"
| "large"
| "icon";

interface ButtonProps
extends ButtonHTMLAttributes<HTMLButtonElement> {
children?: ReactNode;
variant?: ButtonVariant;
size?: ButtonSize;
loading?: boolean;
loadingText?: string;
fullWidth?: boolean;
icon?: ReactNode;
iconPosition?: "left" | "right";
rounded?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
(
{
children,
variant = "primary",
size = "medium",
loading = false,
loadingText = "Loading...",
fullWidth = false,
icon,
iconPosition = "left",
rounded = true,
disabled,
type = "button",
className = "",
onClick,
...props
},
ref
) => {
const isDisabled = disabled || loading;

```
const buttonClasses = [
  "rafta-button",
  `rafta-button-${variant}`,
  `rafta-button-${size}`,
  rounded ? "rafta-button-rounded" : "",
  fullWidth ? "rafta-button-full" : "",
  loading ? "rafta-button-loading" : "",
  isDisabled ? "rafta-button-disabled" : "",
  className,
]
  .filter(Boolean)
  .join(" ");

const handleClick = (
  event: React.MouseEvent<HTMLButtonElement>
) => {
  if (isDisabled) {
    event.preventDefault();
    return;
  }

  onClick?.(event);
};

return (
  <button
    ref={ref}
    type={type}
    className={buttonClasses}
    disabled={isDisabled}
    aria-disabled={isDisabled}
    aria-busy={loading}
    onClick={handleClick}
    {...props}
  >
    {loading ? (
      <>
        <span
          className="rafta-button-spinner"
          aria-hidden="true"
        />

        <span className="rafta-button-loading-text">
          {loadingText}
        </span>
      </>
    ) : (
      <>
        {icon && iconPosition === "left" && (
          <span
            className="rafta-button-icon rafta-button-icon-left"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        <span className="rafta-button-content">
          {children}
        </span>

        {icon && iconPosition === "right" && (
          <span
            className="rafta-button-icon rafta-button-icon-right"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </>
    )}
  </button>
);
```

}
);

Button.displayName = "Button";

export default Button;
