"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";

export interface UploadedBook {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface UploadBookProps {
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  onRemove?: () => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  ".txt",
  ".pdf",
  ".epub",
  ".doc",
  ".docx",
];

export default function UploadBook({
  onFileSelect,
  onFilesSelect,
  onRemove,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = 25,
  multiple = false,
  disabled = false,
  title = "Upload Your Book",
  description = "Drag and drop your book file here, or browse from your computer.",
  className = "",
}: UploadBookProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<UploadedBook[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const maxBytes = maxSizeMB * 1024 * 1024;
  const acceptString = acceptedTypes.join(",");

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return "0 Bytes";
    }

    const units = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const index = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    const safeIndex = Math.min(
      index,
      units.length - 1
    );

    return `${(
      bytes / Math.pow(1024, safeIndex)
    ).toFixed(
      safeIndex === 0 ? 0 : 1
    )} ${units[safeIndex]}`;
  };

  const getExtension = (fileName: string) => {
    const parts = fileName
      .toLowerCase()
      .split(".");

    return parts.length > 1
      ? `.${parts.pop()}`
      : "";
  };

  const isFileTypeAllowed = (file: File) => {
    const extension = getExtension(
      file.name
    );

    const normalizedTypes =
      acceptedTypes.map((type) =>
        type.trim().toLowerCase()
      );

    if (
      normalizedTypes.includes(
        extension
      )
    ) {
      return true;
    }

    const mimeType =
      file.type.toLowerCase();

    if (
      mimeType &&
      normalizedTypes.includes(
        mimeType
      )
    ) {
      return true;
    }

    return false;
  };

  const validateFile = (file: File) => {
    if (!isFileTypeAllowed(file)) {
      return `Unsupported file type: ${file.name}`;
    }

    if (file.size > maxBytes) {
      return `${file.name} is too large. Maximum size is ${maxSizeMB} MB.`;
    }

    if (file.size === 0) {
      return `${file.name} is empty.`;
    }

    return null;
  };

  const processFiles = (files: File[]) => {
    setError("");
    setSuccessMessage("");

    if (files.length === 0) {
      return;
    }

    const incomingFiles = multiple
      ? files
      : [files[0]];

    const validFiles: File[] = [];

    for (const file of incomingFiles) {
      const validationError =
        validateFile(file);

      if (validationError) {
        setError(validationError);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    const uploadedBooks =
      validFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));

    setSelectedFiles(
      multiple
        ? uploadedBooks
        : [uploadedBooks[0]]
    );

    if (multiple) {
      onFilesSelect?.(validFiles);
    } else {
      onFileSelect?.(validFiles[0]);
    }

    setSuccessMessage(
      validFiles.length === 1
        ? "Book selected successfully."
        : `${validFiles.length} files selected successfully.`
    );
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files) {
      return;
    }

    processFiles(
      Array.from(files)
    );

    event.target.value = "";
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) {
      return;
    }

    setIsDragging(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget.contains(
        event.relatedTarget as Node
      )
    ) {
      return;
    }

    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (disabled) {
      return;
    }

    const files =
      event.dataTransfer.files;

    if (
      !files ||
      files.length === 0
    ) {
      return;
    }

    processFiles(
      Array.from(files)
    );
  };

  const openFilePicker = () => {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  };

  const handleBrowseKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openFilePicker();
    }
  };

  const removeFile = (
    index: number
  ) => {
    const nextFiles =
      selectedFiles.filter(
        (_, fileIndex) =>
          fileIndex !== index
      );

    setSelectedFiles(nextFiles);
    setError("");
    setSuccessMessage("");

    onRemove?.();
  };

  const getFileIcon = (
    fileName: string
  ) => {
    const extension =
      getExtension(fileName);

    switch (extension) {
      case ".pdf":
        return "PDF";

      case ".doc":
      case ".docx":
        return "DOC";

      case ".epub":
        return "EPUB";

      case ".txt":
        return "TXT";

      default:
        return "FILE";
    }
  };

  const uploadClasses = [
    "rafta-upload-book",
    isDragging
      ? "rafta-upload-book-dragging"
      : "",
    selectedFiles.length > 0
      ? "rafta-upload-book-selected"
      : "",
    disabled
      ? "rafta-upload-book-disabled"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={uploadClasses}
    >
      {/* HEADER */}
      <div className="rafta-upload-book-header">
        <div className="rafta-upload-book-heading">
          <div className="rafta-upload-book-main-icon">
            📚
          </div>

          <div>
            <h2>{title}</h2>

            <p>{description}</p>
          </div>
        </div>

        <span className="rafta-upload-book-size">
          Max {maxSizeMB} MB
        </span>
      </div>

      {/* FILE INPUT */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        disabled={disabled}
        onChange={handleInputChange}
        className="rafta-upload-book-input"
        aria-label="Upload book file"
      />

      {/* DROPZONE */}
      <div
        className="rafta-upload-book-dropzone"
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={handleBrowseKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <div className="rafta-upload-book-upload-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 16V4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="m7.5 8.5 4.5-4.5 4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="rafta-upload-book-drop-title">
          {isDragging
            ? "Drop your book here"
            : "Drag & drop your book here"}
        </div>

        <div className="rafta-upload-book-drop-description">
          or click to browse files
        </div>

        <button
          type="button"
          className="rafta-upload-book-browse"
          onClick={(event) => {
            event.stopPropagation();
            openFilePicker();
          }}
          disabled={disabled}
        >
          Browse Files
        </button>

        <div className="rafta-upload-book-formats">
          Supported:{" "}
          {acceptedTypes
            .map((type) =>
              type
                .replace(".", "")
                .toUpperCase()
            )
            .join(", ")}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rafta-upload-book-message rafta-upload-book-error">
          <span>!</span>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {successMessage &&
        !error && (
          <div className="rafta-upload-book-message rafta-upload-book-success">
            <span>✓</span>

            <p>
              {successMessage}
            </p>
          </div>
        )}

      {/* SELECTED FILES */}
      {selectedFiles.length > 0 && (
        <div className="rafta-upload-book-files">
          <div className="rafta-upload-book-files-header">
            <h3>
              Selected{" "}
              {selectedFiles.length === 1
                ? "Book"
                : "Files"}
            </h3>

            <span>
              {selectedFiles.length}
            </span>
          </div>

          <div className="rafta-upload-book-file-list">
            {selectedFiles.map(
              (
                uploadedBook,
                index
              ) => (
                <div
                  key={`${uploadedBook.name}-${uploadedBook.size}-${index}`}
                  className="rafta-upload-book-file"
                >
                  <div className="rafta-upload-book-file-icon">
                    <span>
                      {getFileIcon(
                        uploadedBook.name
                      )}
                    </span>
                  </div>

                  <div className="rafta-upload-book-file-info">
                    <strong
                      title={
                        uploadedBook.name
                      }
                    >
                      {uploadedBook.name}
                    </strong>

                    <span>
                      {formatFileSize(
                        uploadedBook.size
                      )}
                    </span>
                  </div>

                  <div className="rafta-upload-book-file-status">
                    ✓
                  </div>

                  <button
                    type="button"
                    className="rafta-upload-book-remove"
                    onClick={() =>
                      removeFile(index)
                    }
                    aria-label={`Remove ${uploadedBook.name}`}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="rafta-upload-book-footer">
        <div>
          <span className="rafta-upload-book-footer-icon">
            🔒
          </span>

          <span>
            Your file stays on your device until
            you start conversion.
          </span>
        </div>

        <span>
          {multiple
            ? "Multiple files supported"
            : "One book at a time"}
        </span>
      </div>
    </section>
  );
}