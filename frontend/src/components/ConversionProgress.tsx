"use client";

import { useEffect, useMemo, useState } from "react";

export type ConversionStatus =
| "idle"
| "uploading"
| "processing"
| "generating"
| "finalizing"
| "completed"
| "error";

interface ConversionProgressProps {
status?: ConversionStatus;
progress?: number;
title?: string;
fileName?: string;
message?: string;
error?: string;
showPercentage?: boolean;
showSteps?: boolean;
animated?: boolean;
autoComplete?: boolean;
onComplete?: () => void;
onCancel?: () => void;
onRetry?: () => void;
className?: string;
}

interface Step {
id: ConversionStatus;
label: string;
description: string;
minimumProgress: number;
}

const STEPS: Step[] = [
{
id: "uploading",
label: "Uploading",
description: "Preparing your file",
minimumProgress: 0,
},
{
id: "processing",
label: "Processing",
description: "Reading and preparing text",
minimumProgress: 20,
},
{
id: "generating",
label: "Generating Audio",
description: "Creating your audiobook",
minimumProgress: 45,
},
{
id: "finalizing",
label: "Finalizing",
description: "Preparing the finished audio",
minimumProgress: 85,
},
{
id: "completed",
label: "Completed",
description: "Your audiobook is ready",
minimumProgress: 100,
},
];

const STATUS_INDEX: Record<ConversionStatus, number> = {
idle: 0,
uploading: 0,
processing: 1,
generating: 2,
finalizing: 3,
completed: 4,
error: -1,
};

export default function ConversionProgress({
status = "idle",
progress = 0,
title = "Converting to Audiobook",
fileName,
message,
error,
showPercentage = true,
showSteps = true,
animated = true,
autoComplete = true,
onComplete,
onCancel,
onRetry,
className = "",
}: ConversionProgressProps) {
const [displayProgress, setDisplayProgress] = useState(0);
const [elapsedSeconds, setElapsedSeconds] = useState(0);

const normalizedProgress = useMemo(() => {
const numericProgress = Number(progress);

```
if (!Number.isFinite(numericProgress)) {
  return 0;
}

return Math.min(100, Math.max(0, numericProgress));
```

}, [progress]);

const currentStatus =
status === "idle" && normalizedProgress > 0
? "processing"
: status;

/*

* Smooth the visible progress so the UI does not jump
* dramatically when backend progress updates arrive.
  */
  useEffect(() => {
  if (!animated) {
  setDisplayProgress(normalizedProgress);
  return;
  }

```
let frame = 0;
```

```
const animate = () => {
  setDisplayProgress((current) => {
    const difference = normalizedProgress - current;

    if (Math.abs(difference) < 0.2) {
      return normalizedProgress;
    }

    return current + difference * 0.16;
  });

  frame = window.requestAnimationFrame(animate);
};

frame = window.requestAnimationFrame(animate);

return () => {
  window.cancelAnimationFrame(frame);
};
```

}, [normalizedProgress, animated]);

/*

* Conversion timer.
  */
  useEffect(() => {
  if (
  currentStatus === "completed" ||
  currentStatus === "error" ||
  currentStatus === "idle"
  ) {
  return;
  }

```
const timer = window.setInterval(() => {
```

```
  setElapsedSeconds((current) => current + 1);
}, 1000);

return () => {
  window.clearInterval(timer);
};
```

}, [currentStatus]);

/*

* Reset the timer when a new conversion starts.
  */
  useEffect(() => {
  if (
  currentStatus === "uploading" &&
  normalizedProgress <= 1
  ) {
  setElapsedSeconds(0);
  }
  }, [currentStatus, normalizedProgress]);

/*

* Call completion callback when completed.
  */
  useEffect(() => {
  if (
  autoComplete &&
  currentStatus === "completed"
  ) {
  onComplete?.();
  }
  }, [currentStatus, autoComplete, onComplete]);

const formatElapsed = (seconds: number) => {
const minutes = Math.floor(seconds / 60);
const remainingSeconds = seconds % 60;

```
return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
  .toString()
  .padStart(2, "0")}`;
```

};

const getStatusLabel = () => {
switch (currentStatus) {
case "uploading":
return "Uploading file...";
case "processing":
return "Processing text...";
case "generating":
return "Generating audiobook...";
case "finalizing":
return "Finalizing audiobook...";
case "completed":
return "Audiobook created successfully";
case "error":
return "Conversion failed";
default:
return "Ready to convert";
}
};

const getDefaultMessage = () => {
switch (currentStatus) {
case "uploading":
return "Uploading your file to RAFTA AI.";
case "processing":
return "Analyzing your content and preparing it for voice conversion.";
case "generating":
return "Your audiobook audio is being generated. This may take some time for longer text.";
case "finalizing":
return "Almost finished. Preparing your audiobook for playback.";
case "completed":
return "Your audiobook is ready to play and download.";
case "error":
return "Something went wrong while creating your audiobook.";
default:
return "Your conversion status will appear here.";
}
};

const getCurrentStepIndex = () => {
if (currentStatus === "error") {
return -1;
}

```
if (currentStatus === "idle") {
  return -1;
}

return STATUS_INDEX[currentStatus];
```

};

const currentStepIndex = getCurrentStepIndex();

const isActive =
currentStatus !== "idle" &&
currentStatus !== "completed" &&
currentStatus !== "error";

const isCompleted = currentStatus === "completed";
const isError = currentStatus === "error";

const cardClasses = [
"rafta-conversion-progress",
isActive
? "rafta-conversion-active"
: "",
isCompleted
? "rafta-conversion-completed"
: "",
isError
? "rafta-conversion-error"
: "",
className,
]
.filter(Boolean)
.join(" ");

return ( <section className={cardClasses}> <div className="rafta-conversion-header"> <div className="rafta-conversion-header-text"> <p className="rafta-conversion-eyebrow">
RAFTA AI </p>

```
      <h2 className="rafta-conversion-title">
        {title}
      </h2>

      {fileName && (
        <p className="rafta-conversion-file-name">
          <span className="rafta-conversion-file-icon">
            📄
          </span>
          {fileName}
        </p>
      )}
    </div>

    <div
      className={[
        "rafta-conversion-status-badge",
        isCompleted
          ? "success"
          : isError
          ? "error"
          : isActive
          ? "working"
          : "idle",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isCompleted ? (
        <>
          <span>✓</span>
          Ready
        </>
      ) : isError ? (
        <>
          <span>!</span>
          Error
        </>
      ) : isActive ? (
        <>
          <span className="rafta-conversion-status-dot" />
          Working
        </>
      ) : (
        "Waiting"
      )}
    </div>
  </div>

  <div className="rafta-conversion-main">
    <div className="rafta-conversion-progress-top">
      <div>
        <p className="rafta-conversion-current-status">
          {getStatusLabel()}
        </p>

        <p className="rafta-conversion-message">
          {message || getDefaultMessage()}
        </p>
      </div>

      {showPercentage && (
        <div className="rafta-conversion-percentage">
          {Math.round(displayProgress)}%
        </div>
      )}
    </div>

    <div className="rafta-conversion-progress-track">
      <div
        className={`rafta-conversion-progress-fill ${
          animated
            ? "animated"
            : ""
        }`}
        style={{
          width: `${displayProgress}%`,
        }}
      >
        {animated &&
          isActive && (
            <span className="rafta-conversion-shimmer" />
          )}
      </div>
    </div>

    <div className="rafta-conversion-meta">
      <span>
        {isCompleted
          ? "Conversion complete"
          : isError
          ? "Conversion stopped"
          : "Conversion in progress"}
      </span>

      <span>
        {formatElapsed(elapsedSeconds)}
      </span>
    </div>
  </div>

  {showSteps && (
    <div className="rafta-conversion-steps">
      {STEPS.map((step, index) => {
        const isStepCompleted =
          isCompleted ||
          currentStepIndex > index;

        const isCurrentStep =
          currentStepIndex === index &&
          !isCompleted &&
          !isError;

        const isStepError =
          isError &&
          currentStepIndex === index;

        return (
          <div
            key={step.id}
            className={[
              "rafta-conversion-step",
              isStepCompleted
                ? "completed"
                : "",
              isCurrentStep
                ? "current"
                : "",
              isStepError
                ? "error"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="rafta-conversion-step-line">
              <div className="rafta-conversion-step-icon">
                {isStepCompleted ? (
                  "✓"
                ) : isStepError ? (
                  "!"
                ) : isCurrentStep ? (
                  <span className="rafta-conversion-step-spinner" />
                ) : (
                  index + 1
                )}
              </div>

              {index < STEPS.length - 1 && (
                <div className="rafta-conversion-step-connector">
                  <span
                    className={
                      isStepCompleted
                        ? "filled"
                        : ""
                    }
                  />
                </div>
              )}
            </div>

            <div className="rafta-conversion-step-content">
              <h3>{step.label}</h3>

              <p>
                {isStepError
                  ? error ||
                    "The conversion could not continue."
                  : step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  )}

  {isCompleted && (
    <div className="rafta-conversion-success-box">
      <div className="rafta-conversion-success-icon">
        ✓
      </div>

      <div>
        <h3>
          Audiobook generated successfully
        </h3>

        <p>
          Your audio is ready. You can now open it
          in the player or save it to your library.
        </p>
      </div>
    </div>
  )}

  {isError && (
    <div className="rafta-conversion-error-box">
      <div className="rafta-conversion-error-icon">
        !
      </div>

      <div className="rafta-conversion-error-content">
        <h3>Conversion failed</h3>

        <p>
          {error ||
            "We could not complete the audiobook conversion."}
        </p>

        {onRetry && (
          <button
            type="button"
            className="rafta-conversion-retry"
            onClick={onRetry}
          >
            ↻ Try Again
          </button>
        )}
      </div>
    </div>
  )}

  <div className="rafta-conversion-footer">
    <div className="rafta-conversion-footer-info">
      <span className="rafta-conversion-footer-dot" />

      <span>
        {isCompleted
          ? "Audio generation finished"
          : isError
          ? "Please check the file and try again"
          : "Please keep this page open while converting"}
      </span>
    </div>

    {onCancel &&
      isActive && (
        <button
          type="button"
          className="rafta-conversion-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      )}
  </div>
</section>
```

);
}
