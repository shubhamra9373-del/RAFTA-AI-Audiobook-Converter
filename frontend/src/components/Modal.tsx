"use client";

import {
CSSProperties,
KeyboardEvent,
ReactNode,
useEffect,
useRef,
} from "react";
import { createPortal } from "react-dom";

export type ModalSize =
| "small"
| "medium"
| "large"
| "xlarge"
| "fullscreen";

export type ModalVariant =
| "default"
| "success"
| "warning"
| "danger"
| "info";

interface ModalProps {
isOpen: boolean;
onClose: () => void;
children?: ReactNode;
title?: string;
description?: string;
size?: ModalSize;
variant?: ModalVariant;
showCloseButton?: boolean;
closeOnOverlayClick?: boolean;
closeOnEscape?: boolean;
preventBodyScroll?: boolean;
showOverlay?: boolean;
footer?: ReactNode;
header?: ReactNode;
className?: string;
contentClassName?: string;
overlayClassName?: string;
centered?: boolean;
persistent?: boolean;
ariaLabel?: string;
ariaDescribedBy?: string;
zIndex?: number;
}

const ICONS: Record<ModalVariant, string> = {
default: "",
success: "✓",
warning: "!",
danger: "!",
info: "i",
};

export default function Modal({
isOpen,
onClose,
children,
title,
description,
size = "medium",
variant = "default",
showCloseButton = true,
closeOnOverlayClick = true,
closeOnEscape = true,
preventBodyScroll = true,
showOverlay = true,
footer,
header,
className = "",
contentClassName = "",
overlayClassName = "",
centered = true,
persistent = false,
ariaLabel,
ariaDescribedBy,
zIndex = 1000,
}: ModalProps) {
const modalRef = useRef<HTMLDivElement | null>(null);
const previousActiveElementRef =
useRef<HTMLElement | null>(null);
const portalRootRef = useRef<HTMLDivElement | null>(
null
);

/*

* Create the portal root on the client.
  */
  useEffect(() => {
  const existingRoot = document.getElementById(
  "rafta-modal-root"
  ) as HTMLDivElement | null;

```
if (existingRoot) {
```

```
  portalRootRef.current = existingRoot;
  return;
}

const root = document.createElement("div");
root.id = "rafta-modal-root";
document.body.appendChild(root);
portalRootRef.current = root;

return () => {
  if (
    root.parentNode &&
    root.childNodes.length === 0
  ) {
    root.parentNode.removeChild(root);
  }
};
```

}, []);

/*

* Lock body scrolling while modal is open.
  */
  useEffect(() => {
  if (!isOpen || !preventBodyScroll) {
  return;
  }

```
const body = document.body;
```

```
const html = document.documentElement;

const previousBodyOverflow =
  body.style.overflow;
const previousHtmlOverflow =
  html.style.overflow;

body.style.overflow = "hidden";
html.style.overflow = "hidden";

return () => {
  body.style.overflow =
    previousBodyOverflow;
  html.style.overflow =
    previousHtmlOverflow;
};
```

}, [isOpen, preventBodyScroll]);

/*

* Escape key.
  */
  useEffect(() => {
  if (!isOpen || !closeOnEscape || persistent) {
  return;
  }

```
const handleKeyDown = (event: globalThis.KeyboardEvent) => {
```

```
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
  }
};

document.addEventListener(
  "keydown",
  handleKeyDown
);

return () => {
  document.removeEventListener(
    "keydown",
    handleKeyDown
  );
};
```

}, [
isOpen,
closeOnEscape,
persistent,
onClose,
]);

/*

* Focus modal when opened and restore focus when closed.
  */
  useEffect(() => {
  if (!isOpen) {
  return;
  }

```
previousActiveElementRef.current =
```

```
  document.activeElement as HTMLElement | null;

const focusTimer = window.setTimeout(() => {
  const closeButton = modalRef.current?.querySelector(
    ".rafta-modal-close"
  ) as HTMLButtonElement | null;

  const firstFocusable =
    modalRef.current?.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement | null;

  if (closeButton) {
    closeButton.focus();
  } else if (firstFocusable) {
    firstFocusable.focus();
  } else {
    modalRef.current?.focus();
  }
}, 0);

return () => {
  window.clearTimeout(focusTimer);

  previousActiveElementRef.current?.focus?.();
};
```

}, [isOpen]);

/*

* Keep keyboard focus inside modal.
  */
  useEffect(() => {
  if (!isOpen) {
  return;
  }

```
const handleTabKey = (event: globalThis.KeyboardEvent) => {
```

```
  if (event.key !== "Tab") {
    return;
  }

  const modal = modalRef.current;

  if (!modal) {
    return;
  }

  const focusable = Array.from(
    modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (element) =>
      !element.hasAttribute("aria-hidden")
  );

  if (focusable.length === 0) {
    event.preventDefault();
    modal.focus();
    return;
  }

  const first = focusable[0];
  const last =
    focusable[focusable.length - 1];

  if (
    event.shiftKey &&
    document.activeElement === first
  ) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (
    !event.shiftKey &&
    document.activeElement === last
  ) {
    event.preventDefault();
    first.focus();
  }
};

document.addEventListener(
  "keydown",
  handleTabKey
);

return () => {
  document.removeEventListener(
    "keydown",
    handleTabKey
  );
};
```

}, [isOpen]);

/*

* Close when the dark overlay is clicked.
  */
  const handleOverlayClick = (
  event: React.MouseEvent<HTMLDivElement>
  ) => {
  if (
  !closeOnOverlayClick ||
  persistent
  ) {
  return;
  }

```
if (event.target === event.currentTarget) {
```

```
  onClose();
}
```

};

/*

* Prevent clicks inside modal from reaching overlay.
  */
  const handleModalClick = (
  event: React.MouseEvent<HTMLDivElement>
  ) => {
  event.stopPropagation();
  };

/*

* Keyboard handling for modal container.
  */
  const handleModalKeyDown = (
  event: KeyboardEvent<HTMLDivElement>
  ) => {
  if (
  event.key === "Escape" &&
  !closeOnEscape &&
  persistent
  ) {
  event.preventDefault();
  }
  };

/*

* Don't render on server or while closed.
  */
  if (
  !isOpen ||
  typeof document === "undefined" ||
  !portalRootRef.current
  ) {
  return null;
  }

const modalClasses = [
"rafta-modal",
`rafta-modal-${size}`,
`rafta-modal-${variant}`,
centered
? "rafta-modal-centered"
: "rafta-modal-top",
persistent
? "rafta-modal-persistent"
: "",
className,
]
.filter(Boolean)
.join(" ");

const contentClasses = [
"rafta-modal-content",
contentClassName,
]
.filter(Boolean)
.join(" ");

const overlayClasses = [
"rafta-modal-overlay",
showOverlay
? "rafta-modal-overlay-visible"
: "rafta-modal-overlay-transparent",
overlayClassName,
]
.filter(Boolean)
.join(" ");

const style: CSSProperties = {
zIndex,
};

const variantIcon = ICONS[variant];

return createPortal( <div
   className={overlayClasses}
   style={style}
   role="presentation"
   onMouseDown={handleOverlayClick}
 >
<div
ref={modalRef}
className={modalClasses}
role="dialog"
aria-modal="true"
aria-label={
ariaLabel || title || "RAFTA dialog"
}
aria-describedby={
ariaDescribedBy ||
(description
? "rafta-modal-description"
: undefined)
}
tabIndex={-1}
onClick={handleModalClick}
onKeyDown={handleModalKeyDown}
> <div className="rafta-modal-inner">
{header ? ( <div className="rafta-modal-header-custom">
{header}

```
          {showCloseButton &&
            !persistent && (
              <button
                type="button"
                className="rafta-modal-close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                ×
              </button>
            )}
        </div>
      ) : (
        (title ||
          description ||
          showCloseButton) && (
          <div className="rafta-modal-header">
            <div className="rafta-modal-heading">
              {variantIcon && (
                <div
                  className={`rafta-modal-variant-icon rafta-modal-variant-icon-${variant}`}
                >
                  {variantIcon}
                </div>
              )}

              <div className="rafta-modal-heading-text">
                {title && (
                  <h2 className="rafta-modal-title">
                    {title}
                  </h2>
                )}

                {description && (
                  <p
                    id="rafta-modal-description"
                    className="rafta-modal-description"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton &&
              !persistent && (
                <button
                  type="button"
                  className="rafta-modal-close"
                  onClick={onClose}
                  aria-label="Close dialog"
                  title="Close"
                >
                  ×
                </button>
              )}
          </div>
        )
      )}

      <div className={contentClasses}>
        {children}
      </div>

      {footer && (
        <div className="rafta-modal-footer">
          {footer}
        </div>
      )}
    </div>
  </div>
</div>,
portalRootRef.current
```

);
}

/* -------------------------------------------------
Modal Body
-------------------------------------------------- */

interface ModalBodyProps {
children?: ReactNode;
className?: string;
}

export function ModalBody({
children,
className = "",
}: ModalBodyProps) {
return (
<div
className={`rafta-modal-body ${className}`.trim()}
>
{children} </div>
);
}

/* -------------------------------------------------
Modal Footer
-------------------------------------------------- */

interface ModalFooterProps {
children?: ReactNode;
align?: "left" | "center" | "right" | "between";
className?: string;
}

export function ModalFooter({
children,
align = "right",
className = "",
}: ModalFooterProps) {
return (
<div
className={[
"rafta-modal-footer-actions",
`rafta-modal-footer-${align}`,
className,
]
.filter(Boolean)
.join(" ")}
>
{children} </div>
);
}

/* -------------------------------------------------
Confirm Modal
-------------------------------------------------- */

interface ConfirmModalProps {
isOpen: boolean;
onClose: () => void;
onConfirm: () => void | Promise<void>;
title?: string;
description?: string;
confirmText?: string;
cancelText?: string;
variant?: "default" | "danger" | "warning";
loading?: boolean;
}

export function ConfirmModal({
isOpen,
onClose,
onConfirm,
title = "Are you sure?",
description = "This action cannot be undone.",
confirmText = "Confirm",
cancelText = "Cancel",
variant = "danger",
loading = false,
}: ConfirmModalProps) {
return (
<Modal
isOpen={isOpen}
onClose={onClose}
title={title}
description={description}
size="small"
variant={variant}
closeOnOverlayClick={!loading}
closeOnEscape={!loading}
persistent={loading}
footer={ <ModalFooter> <button
         type="button"
         className="rafta-modal-button rafta-modal-button-secondary"
         onClick={onClose}
         disabled={loading}
       >
{cancelText} </button>

```
      <button
        type="button"
        className={`rafta-modal-button rafta-modal-button-${variant}`}
        onClick={() => {
          void onConfirm();
        }}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="rafta-modal-button-spinner" />
            Processing...
          </>
        ) : (
          confirmText
        )}
      </button>
    </ModalFooter>
  }
>
  <ModalBody>
    <p className="rafta-modal-confirm-text">
      {description}
    </p>
  </ModalBody>
</Modal>
```

);
}

/* -------------------------------------------------
Alert Modal
-------------------------------------------------- */

interface AlertModalProps {
isOpen: boolean;
onClose: () => void;
title?: string;
message: string;
buttonText?: string;
variant?: ModalVariant;
}

export function AlertModal({
isOpen,
onClose,
title = "Notice",
message,
buttonText = "OK",
variant = "info",
}: AlertModalProps) {
return (
<Modal
isOpen={isOpen}
onClose={onClose}
title={title}
variant={variant}
size="small"
footer={ <ModalFooter> <button
         type="button"
         className="rafta-modal-button rafta-modal-button-primary"
         onClick={onClose}
       >
{buttonText} </button> </ModalFooter>
}
> <ModalBody> <p className="rafta-modal-alert-message">
{message} </p> </ModalBody> </Modal>
);
}

/* -------------------------------------------------
Loading Modal
-------------------------------------------------- */

interface LoadingModalProps {
isOpen: boolean;
title?: string;
message?: string;
progress?: number;
}

export function LoadingModal({
isOpen,
title = "Please wait",
message = "Processing...",
progress,
}: LoadingModalProps) {
const hasProgress =
typeof progress === "number" &&
Number.isFinite(progress);

const safeProgress = hasProgress
? Math.min(100, Math.max(0, progress))
: 0;

return (
<Modal
isOpen={isOpen}
onClose={() => undefined}
title={title}
description={message}
size="small"
showCloseButton={false}
closeOnOverlayClick={false}
closeOnEscape={false}
persistent
> <ModalBody> <div className="rafta-modal-loading"> <div className="rafta-modal-loading-spinner"> <span /> </div>

```
      {hasProgress && (
        <div className="rafta-modal-loading-progress">
          <div className="rafta-modal-loading-progress-track">
            <div
              className="rafta-modal-loading-progress-fill"
              style={{
                width: `${safeProgress}%`,
              }}
            />
          </div>

          <span>
            {Math.round(safeProgress)}%
          </span>
        </div>
      )}
    </div>
  </ModalBody>
</Modal>
```

);
}
