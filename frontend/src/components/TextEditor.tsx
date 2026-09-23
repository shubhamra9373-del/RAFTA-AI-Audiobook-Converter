"use client";

import {
ChangeEvent,
ClipboardEvent,
KeyboardEvent,
useEffect,
useMemo,
useRef,
useState,
} from "react";

interface TextEditorProps {
value?: string;
onChange?: (value: string) => void;
defaultValue?: string;
placeholder?: string;
minHeight?: number;
maxLength?: number;
disabled?: boolean;
readOnly?: boolean;
showToolbar?: boolean;
showStats?: boolean;
showClearButton?: boolean;
showPasteButton?: boolean;
showFullscreenButton?: boolean;
label?: string;
helperText?: string;
error?: string;
title?: string;
className?: string;
autoFocus?: boolean;
onFocus?: () => void;
onBlur?: () => void;
onPasteText?: (text: string) => void;
}

export default function TextEditor({
value,
onChange,
defaultValue = "",
placeholder = "Write or paste your text here...",
minHeight = 320,
maxLength,
disabled = false,
readOnly = false,
showToolbar = true,
showStats = true,
showClearButton = true,
showPasteButton = true,
showFullscreenButton = true,
label = "Your Text",
helperText,
error,
title = "Audiobook Script",
className = "",
autoFocus = false,
onFocus,
onBlur,
onPasteText,
}: TextEditorProps) {
const textareaRef =
useRef<HTMLTextAreaElement | null>(null);

const [internalValue, setInternalValue] =
useState(defaultValue);

const [fullscreen, setFullscreen] =
useState(false);

const [copied, setCopied] =
useState(false);

const [pasteMessage, setPasteMessage] =
useState("");

const [isFocused, setIsFocused] =
useState(false);

const isControlled =
value !== undefined;

const text = isControlled
? value
: internalValue;

/*

* Keep uncontrolled editor synchronized with
* a new default value when it changes.
  */
  useEffect(() => {
  if (!isControlled) {
  setInternalValue(defaultValue);
  }
  }, [defaultValue, isControlled]);

/*

* Auto focus.
  */
  useEffect(() => {
  if (autoFocus) {
  textareaRef.current?.focus();
  }
  }, [autoFocus]);

/*

* Lock body scrolling in fullscreen mode.
  */
  useEffect(() => {
  if (!fullscreen) {
  return;
  }

```
const previousOverflow =
```

```
  document.body.style.overflow;

document.body.style.overflow =
  "hidden";

return () => {
  document.body.style.overflow =
    previousOverflow;
};
```

}, [fullscreen]);

/*

* Character count.
  */
  const characterCount = useMemo(
  () => text.length,
  [text]
  );

/*

* Word count.
  */
  const wordCount = useMemo(() => {
  const trimmed = text.trim();

```
if (!trimmed) {
```

```
  return 0;
}

return trimmed.split(/\s+/).length;
```

}, [text]);

/*

* Paragraph count.
  */
  const paragraphCount = useMemo(() => {
  const trimmed = text.trim();

```
if (!trimmed) {
```

```
  return 0;
}

return trimmed
  .split(/\n\s*\n/)
  .filter(Boolean)
  .length;
```

}, [text]);

/*

* Estimate audiobook duration.
*
* Average spoken speed is approximately
* 150 words per minute for this UI estimate.
  */
  const estimatedMinutes = useMemo(() => {
  if (wordCount === 0) {
  return 0;
  }

```
return wordCount / 150;
```

}, [wordCount]);

const formattedEstimatedDuration =
useMemo(() => {
if (estimatedMinutes <= 0) {
return "00:00";
}

```
  const totalSeconds = Math.round(
    estimatedMinutes * 60
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}, [estimatedMinutes]);
```

/*

* Update value.
  */
  const updateValue = (
  nextValue: string
  ) => {
  if (
  maxLength !== undefined &&
  nextValue.length > maxLength
  ) {
  nextValue =
  nextValue.slice(0, maxLength);
  }

```
if (!isControlled) {
```

```
  setInternalValue(nextValue);
}

onChange?.(nextValue);
```

};

/*

* Handle typing.
  */
  const handleChange = (
  event: ChangeEvent<HTMLTextAreaElement>
  ) => {
  updateValue(event.target.value);
  };

/*

* Handle paste.
  */
  const handlePaste = (
  event: ClipboardEvent<HTMLTextAreaElement>
  ) => {
  const pastedText =
  event.clipboardData.getData("text");

```
if (!pastedText) {
```

```
  return;
}

onPasteText?.(pastedText);
```

};

/*

* Select all content.
  */
  const selectAll = () => {
  const textarea =
  textareaRef.current;

```
if (!textarea) {
```

```
  return;
}

textarea.focus();
textarea.select();
```

};

/*

* Copy all content.
  */
  const copyText = async () => {
  if (!text.trim()) {
  return;
  }

```
try {
```

```
  await navigator.clipboard.writeText(
    text
  );

  setCopied(true);

  window.setTimeout(() => {
    setCopied(false);
  }, 1800);
} catch (error) {
  console.error(
    "Could not copy text:",
    error
  );
}
```

};

/*

* Clear content.
  */
  const clearText = () => {
  updateValue("");
  textareaRef.current?.focus();
  };

/*

* Paste from clipboard.
  */
  const pasteFromClipboard =
  async () => {
  try {
  const clipboardText =
  await navigator.clipboard.readText();

  if (!clipboardText) {
  setPasteMessage(
  "Clipboard is empty"
  );

  ```
   window.setTimeout(() => {
     setPasteMessage("");
   }, 1800);

   return;
  ```

  }

  const textarea =
  textareaRef.current;

  if (!textarea) {
  updateValue(clipboardText);
  return;
  }

  const selectionStart =
  textarea.selectionStart;

  const selectionEnd =
  textarea.selectionEnd;

  const before = text.slice(
  0,
  selectionStart
  );

  const after = text.slice(
  selectionEnd
  );

  const nextValue =
  before +
  clipboardText +
  after;

  updateValue(nextValue);

  setPasteMessage(
  "Text pasted"
  );

  window.setTimeout(() => {
  setPasteMessage("");
  }, 1800);

  window.setTimeout(() => {
  const newCursorPosition =
  selectionStart +
  clipboardText.length;

  ```
   textarea.focus();

   textarea.setSelectionRange(
     newCursorPosition,
     newCursorPosition
   );
  ```

  }, 0);
  } catch (error) {
  console.error(
  "Clipboard paste failed:",
  error
  );

  setPasteMessage(
  "Paste permission denied"
  );

  window.setTimeout(() => {
  setPasteMessage("");
  }, 2000);
  }
  };

/*

* Insert text at cursor.
  */
  const insertText = (
  insertedText: string
  ) => {
  const textarea =
  textareaRef.current;

```
if (!textarea) {
```

```
  updateValue(
    `${text}${insertedText}`
  );

  return;
}

const start =
  textarea.selectionStart;

const end =
  textarea.selectionEnd;

const nextValue =
  text.slice(0, start) +
  insertedText +
  text.slice(end);

updateValue(nextValue);

window.setTimeout(() => {
  const cursorPosition =
    start + insertedText.length;

  textarea.focus();

  textarea.setSelectionRange(
    cursorPosition,
    cursorPosition
  );
}, 0);
```

};

/*

* Insert a new paragraph.
  */
  const insertParagraph = () => {
  insertText("\n\n");
  };

/*

* Keyboard shortcuts.
  */
  const handleKeyDown = (
  event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
  /*

  * Ctrl/Cmd + Enter:
  * keep available for Create page actions.
    */
    if (
    (event.ctrlKey ||
    event.metaKey) &&
    event.key === "Enter"
    ) {
    event.preventDefault();

  textareaRef.current?.blur();

  return;
  }

```
/*
```

```
 * Tab inserts spaces rather than moving
 * focus away from the editor.
 */
if (event.key === "Tab") {
  event.preventDefault();

  insertText("  ");
}
```

};

/*

* Focus.
  */
  const handleFocus = () => {
  setIsFocused(true);
  onFocus?.();
  };

/*

* Blur.
  */
  const handleBlur = () => {
  setIsFocused(false);
  onBlur?.();
  };

/*

* Calculate character percentage.
  */
  const characterPercentage =
  maxLength && maxLength > 0
  ? Math.min(
  100,
  (characterCount / maxLength) *
  100
  )
  : 0;

/*

* Prevent close when clicking the editor itself.
  */
  const stopPropagation = (
  event: React.MouseEvent
  ) => {
  event.stopPropagation();
  };

const editorClasses = [
"rafta-text-editor",
fullscreen
? "rafta-text-editor-fullscreen"
: "",
isFocused
? "rafta-text-editor-focused"
: "",
error
? "rafta-text-editor-has-error"
: "",
disabled
? "rafta-text-editor-disabled"
: "",
readOnly
? "rafta-text-editor-readonly"
: "",
className,
]
.filter(Boolean)
.join(" ");

return (
<>
<section
className={editorClasses}
onMouseDown={
fullscreen
? stopPropagation
: undefined
}
> <div className="rafta-text-editor-header"> <div className="rafta-text-editor-heading"> <div className="rafta-text-editor-icon">
✎ </div>

```
        <div>
          {label && (
            <span className="rafta-text-editor-label">
              {label}
            </span>
          )}

          <h2 className="rafta-text-editor-title">
            {title}
          </h2>
        </div>
      </div>

      <div className="rafta-text-editor-header-actions">
        {showFullscreenButton && (
          <button
            type="button"
            className="rafta-text-editor-tool-button"
            onClick={() =>
              setFullscreen(
                (current) =>
                  !current
              )
            }
            disabled={disabled}
            title={
              fullscreen
                ? "Exit fullscreen"
                : "Fullscreen editor"
            }
            aria-label={
              fullscreen
                ? "Exit fullscreen"
                : "Open fullscreen editor"
            }
          >
            {fullscreen
              ? "⤢"
              : "⛶"}
          </button>
        )}
      </div>
    </div>

    {showToolbar && (
      <div className="rafta-text-editor-toolbar">
        <div className="rafta-text-editor-toolbar-left">
          <button
            type="button"
            className="rafta-text-editor-toolbar-button"
            onClick={selectAll}
            disabled={
              disabled ||
              readOnly ||
              !text
            }
            title="Select all"
          >
            Select All
          </button>

          {showPasteButton && (
            <button
              type="button"
              className="rafta-text-editor-toolbar-button"
              onClick={() => {
                void pasteFromClipboard();
              }}
              disabled={
                disabled ||
                readOnly
              }
              title="Paste from clipboard"
            >
              📋 Paste
            </button>
          )}

          <button
            type="button"
            className="rafta-text-editor-toolbar-button"
            onClick={insertParagraph}
            disabled={
              disabled ||
              readOnly
            }
            title="Insert paragraph"
          >
            ¶ Paragraph
          </button>
        </div>

        <div className="rafta-text-editor-toolbar-right">
          {copied && (
            <span className="rafta-text-editor-toolbar-message">
              ✓ Copied
            </span>
          )}

          {pasteMessage && (
            <span className="rafta-text-editor-toolbar-message">
              {pasteMessage}
            </span>
          )}

          <button
            type="button"
            className="rafta-text-editor-toolbar-button"
            onClick={() => {
              void copyText();
            }}
            disabled={
              disabled ||
              !text.trim()
            }
            title="Copy text"
          >
            {copied
              ? "✓ Copied"
              : "Copy"}
          </button>

          {showClearButton && (
            <button
              type="button"
              className="rafta-text-editor-toolbar-button rafta-text-editor-clear-button"
              onClick={clearText}
              disabled={
                disabled ||
                readOnly ||
                !text
              }
              title="Clear editor"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    )}

    <div
      className="rafta-text-editor-body"
      style={{
        minHeight: `${minHeight}px`,
      }}
    >
      <div className="rafta-text-editor-line">
        <span>1</span>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        spellCheck
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        className="rafta-text-editor-textarea"
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={
          helperText || error
            ? "rafta-text-editor-helper"
            : undefined
        }
      />

      {!text && !disabled && (
        <div className="rafta-text-editor-empty">
          <div className="rafta-text-editor-empty-icon">
            🎙
          </div>

          <strong>
            Start writing your audiobook
          </strong>

          <span>
            Type your story, article, script,
            or paste existing text here.
          </span>

          {showPasteButton && (
            <button
              type="button"
              onClick={() => {
                void pasteFromClipboard();
              }}
            >
              Paste from Clipboard
            </button>
          )}
        </div>
      )}
    </div>

    {showStats && (
      <div className="rafta-text-editor-footer">
        <div className="rafta-text-editor-stats">
          <span>
            <strong>
              {wordCount.toLocaleString()}
            </strong>{" "}
            words
          </span>

          <span className="rafta-text-editor-separator">
            •
          </span>

          <span>
            <strong>
              {characterCount.toLocaleString()}
            </strong>{" "}
            characters
          </span>

          <span className="rafta-text-editor-separator">
            •
          </span>

          <span>
            <strong>
              {paragraphCount}
            </strong>{" "}
            paragraphs
          </span>

          <span className="rafta-text-editor-separator">
            •
          </span>

          <span>
            Est. audio{" "}
            <strong>
              {formattedEstimatedDuration}
            </strong>
          </span>
        </div>

        {maxLength !==
          undefined && (
          <div className="rafta-text-editor-limit">
            <div className="rafta-text-editor-limit-track">
              <div
                className={`rafta-text-editor-limit-fill ${
                  characterPercentage >=
                  90
                    ? "warning"
                    : ""
                } ${
                  characterPercentage >=
                  100
                    ? "danger"
                    : ""
                }`}
                style={{
                  width: `${characterPercentage}%`,
                }}
              />
            </div>

            <span>
              {characterCount.toLocaleString()}
              /
              {maxLength.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    )}

    {(helperText || error) && (
      <div
        id="rafta-text-editor-helper"
        className={`rafta-text-editor-helper ${
          error
            ? "rafta-text-editor-helper-error"
            : ""
        }`}
      >
        <span>
          {error ? "!" : "i"}
        </span>

        <p>
          {error || helperText}
        </p>
      </div>
    )}
  </section>

  {fullscreen && (
    <div
      className="rafta-text-editor-fullscreen-backdrop"
      aria-hidden="true"
    />
  )}
</>
```

);
}

/* -------------------------------------------------
Simple Editor Wrapper
-------------------------------------------------- */

interface SimpleTextEditorProps {
value: string;
onChange: (value: string) => void;
placeholder?: string;
className?: string;
}

export function SimpleTextEditor({
value,
onChange,
placeholder = "Write something...",
className = "",
}: SimpleTextEditorProps) {
return ( <TextEditor
   value={value}
   onChange={onChange}
   placeholder={placeholder}
   showToolbar={false}
   showStats={false}
   showClearButton={false}
   showPasteButton={false}
   showFullscreenButton={false}
   className={className}
 />
);
}

/* -------------------------------------------------
Read Only Text Preview
-------------------------------------------------- */

interface TextPreviewProps {
text: string;
maxHeight?: number;
className?: string;
}

export function TextPreview({
text,
maxHeight = 300,
className = "",
}: TextPreviewProps) {
return (
<div
className={`rafta-text-preview ${className}`.trim()}
style={{
maxHeight: `${maxHeight}px`,
}}
>
{text ? (
text
.split(/\n/)
.map((paragraph, index) => ( <p key={index}>
{paragraph ||
"\u00A0"} </p>
))
) : ( <span className="rafta-text-preview-empty">
No text available. </span>
)} </div>
);
}
