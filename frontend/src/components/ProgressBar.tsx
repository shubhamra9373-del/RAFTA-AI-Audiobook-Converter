"use client";

import {
CSSProperties,
ReactNode,
useEffect,
useMemo,
useState,
} from "react";

export type ProgressBarSize =
| "small"
| "medium"
| "large";

export type ProgressBarVariant =
| "purple"
| "blue"
| "green"
| "orange"
| "red"
| "gradient";

interface ProgressBarProps {
value?: number;
max?: number;
min?: number;
size?: ProgressBarSize;
variant?: ProgressBarVariant;
label?: string;
showPercentage?: boolean;
showValue?: boolean;
animated?: boolean;
striped?: boolean;
indeterminate?: boolean;
showTrack?: boolean;
rounded?: boolean;
transition?: boolean;
startLabel?: string;
endLabel?: string;
status?: string;
statusIcon?: ReactNode;
className?: string;
style?: CSSProperties;
onComplete?: () => void;
}

export default function ProgressBar({
value = 0,
max = 100,
min = 0,
size = "medium",
variant = "gradient",
label,
showPercentage = true,
showValue = false,
animated = true,
striped = false,
indeterminate = false,
showTrack = true,
rounded = true,
transition = true,
startLabel,
endLabel,
status,
statusIcon,
className = "",
style,
onComplete,
}: ProgressBarProps) {
const [displayValue, setDisplayValue] =
useState(0);

const safeMin = Number.isFinite(min)
? min
: 0;

const safeMax =
Number.isFinite(max) && max > safeMin
? max
: 100;

const safeValue = Number.isFinite(value)
? Math.min(
safeMax,
Math.max(safeMin, value)
)
: safeMin;

const percentage = useMemo(() => {
const range = safeMax - safeMin;

```
if (range <= 0) {
  return 0;
}

return Math.min(
  100,
  Math.max(
    0,
    ((safeValue - safeMin) / range) *
      100
  )
);
```

}, [safeValue, safeMin, safeMax]);

/*

* Smooth value animation.
  */
  useEffect(() => {
  if (!transition || indeterminate) {
  setDisplayValue(percentage);
  return;
  }

```
let frame = 0;
```

```
const animate = () => {
  setDisplayValue((current) => {
    const difference =
      percentage - current;

    if (Math.abs(difference) < 0.15) {
      return percentage;
    }

    return (
      current + difference * 0.18
    );
  });

  frame =
    window.requestAnimationFrame(
      animate
    );
};

frame =
  window.requestAnimationFrame(
    animate
  );

return () => {
  window.cancelAnimationFrame(frame);
};
```

}, [
percentage,
transition,
indeterminate,
]);

/*

* Completion callback.
  */
  useEffect(() => {
  if (
  !indeterminate &&
  percentage >= 100
  ) {
  onComplete?.();
  }
  }, [
  percentage,
  indeterminate,
  onComplete,
  ]);

const classes = [
"rafta-progress",
`rafta-progress-${size}`,
`rafta-progress-${variant}`,
rounded
? "rafta-progress-rounded"
: "",
animated
? "rafta-progress-animated"
: "",
striped
? "rafta-progress-striped"
: "",
!showTrack
? "rafta-progress-no-track"
: "",
className,
]
.filter(Boolean)
.join(" ");

const progressStyle: CSSProperties = {
...style,
};

const fillStyle: CSSProperties =
indeterminate
? {}
: {
width: `${displayValue}%`,
};

return ( <div
   className={classes}
   style={progressStyle}
 >
{(label ||
showValue ||
startLabel ||
endLabel) && ( <div className="rafta-progress-header"> <div className="rafta-progress-left">
{label && ( <span className="rafta-progress-label">
{label} </span>
)}

```
        {startLabel && (
          <span className="rafta-progress-start-label">
            {startLabel}
          </span>
        )}
      </div>

      <div className="rafta-progress-right">
        {status && (
          <span className="rafta-progress-status">
            {statusIcon && (
              <span className="rafta-progress-status-icon">
                {statusIcon}
              </span>
            )}

            {status}
          </span>
        )}

        {endLabel && (
          <span className="rafta-progress-end-label">
            {endLabel}
          </span>
        )}

        {showValue && (
          <span className="rafta-progress-value">
            {Math.round(
              safeValue
            )}{" "}
            / {Math.round(safeMax)}
          </span>
        )}

        {showPercentage && (
          <span className="rafta-progress-percentage">
            {Math.round(
              displayValue
            )}
            %
          </span>
        )}
      </div>
    </div>
  )}

  <div
    className="rafta-progress-track"
    role="progressbar"
    aria-valuemin={safeMin}
    aria-valuemax={safeMax}
    aria-valuenow={
      indeterminate
        ? undefined
        : safeValue
    }
    aria-label={
      label || "Progress"
    }
  >
    <div
      className={[
        "rafta-progress-fill",
        indeterminate
          ? "rafta-progress-indeterminate"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={fillStyle}
    >
      {animated &&
        !indeterminate && (
          <span className="rafta-progress-shine" />
        )}

      {striped && (
        <span className="rafta-progress-stripe-layer" />
      )}
    </div>
  </div>
</div>
```

);
}

/* -------------------------------------------------
Simple ProgressBar
-------------------------------------------------- */

interface SimpleProgressProps {
value: number;
label?: string;
className?: string;
}

export function SimpleProgressBar({
value,
label,
className = "",
}: SimpleProgressProps) {
return ( <ProgressBar
   value={value}
   label={label}
   showPercentage
   className={className}
 />
);
}

/* -------------------------------------------------
Upload Progress
-------------------------------------------------- */

interface UploadProgressProps {
progress: number;
fileName?: string;
status?: string;
className?: string;
}

export function UploadProgress({
progress,
fileName,
status = "Uploading",
className = "",
}: UploadProgressProps) {
return (
<div
className={`rafta-upload-progress ${className}`.trim()}
> <div className="rafta-upload-progress-top"> <div className="rafta-upload-progress-file"> <span className="rafta-upload-progress-icon">
📄 </span>

```
      <div>
        <strong>
          {fileName ||
            "Uploading file..."}
        </strong>

        <small>{status}</small>
      </div>
    </div>

    <span className="rafta-upload-progress-percent">
      {Math.round(progress)}%
    </span>
  </div>

  <ProgressBar
    value={progress}
    size="small"
    variant="gradient"
    showPercentage={false}
  />
</div>
```

);
}

/* -------------------------------------------------
Conversion Progress
-------------------------------------------------- */

interface ConversionBarProps {
progress: number;
status?: string;
className?: string;
}

export function ConversionProgressBar({
progress,
status = "Generating audiobook...",
className = "",
}: ConversionBarProps) {
return (
<div
className={`rafta-conversion-bar ${className}`.trim()}
> <div className="rafta-conversion-bar-header"> <span>{status}</span> <strong>
{Math.round(progress)}% </strong> </div>

```
  <ProgressBar
    value={progress}
    size="medium"
    variant="gradient"
    showPercentage={false}
    animated
  />
</div>
```

);
}

/* -------------------------------------------------
Circular Progress
-------------------------------------------------- */

interface CircularProgressProps {
value?: number;
size?: number;
strokeWidth?: number;
label?: string;
subLabel?: string;
variant?: ProgressBarVariant;
className?: string;
}

export function CircularProgress({
value = 0,
size = 110,
strokeWidth = 8,
label,
subLabel,
variant = "gradient",
className = "",
}: CircularProgressProps) {
const safeValue = Math.min(
100,
Math.max(0, Number.isFinite(value) ? value : 0)
);

const center = size / 2;
const radius =
(size - strokeWidth) / 2;

const circumference =
2 * Math.PI * radius;

const offset =
circumference -
(safeValue / 100) *
circumference;

return (
<div
className={`rafta-circular-progress rafta-circular-progress-${variant} ${className}`.trim()}
style={{
width: size,
height: size,
}}
>
<svg
width={size}
height={size}
viewBox={`0 0 ${size} ${size}`}
className="rafta-circular-progress-svg"
aria-label={`${Math.round(
          safeValue
        )}% progress`}
> <circle
       className="rafta-circular-progress-track"
       cx={center}
       cy={center}
       r={radius}
       fill="none"
       strokeWidth={strokeWidth}
     />

```
    <circle
      className="rafta-circular-progress-fill"
      cx={center}
      cy={center}
      r={radius}
      fill="none"
      strokeWidth={strokeWidth}
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      strokeLinecap="round"
      transform={`rotate(-90 ${center} ${center})`}
    />
  </svg>

  <div className="rafta-circular-progress-content">
    <strong>
      {Math.round(safeValue)}%
    </strong>

    {label && (
      <span>{label}</span>
    )}

    {subLabel && (
      <small>{subLabel}</small>
    )}
  </div>
</div>
```

);
}
