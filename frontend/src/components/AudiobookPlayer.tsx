"use client";

import {
ChangeEvent,
KeyboardEvent,
useCallback,
useEffect,
useMemo,
useRef,
useState,
} from "react";

interface AudiobookPlayerProps {
audioUrl: string;
title?: string;
author?: string;
coverUrl?: string;
autoPlay?: boolean;
className?: string;
onEnded?: () => void;
onPlay?: () => void;
onPause?: () => void;
onTimeUpdate?: (currentTime: number) => void;
}

type SleepOption = "off" | "5" | "10" | "15" | "30" | "45";

const API_URL = "http://127.0.0.1:8000";

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2];

const SLEEP_OPTIONS: Array<{
value: SleepOption;
label: string;
minutes: number;
}> = [
{ value: "off", label: "Off", minutes: 0 },
{ value: "5", label: "5 min", minutes: 5 },
{ value: "10", label: "10 min", minutes: 10 },
{ value: "15", label: "15 min", minutes: 15 },
{ value: "30", label: "30 min", minutes: 30 },
{ value: "45", label: "45 min", minutes: 45 },
];

export default function AudiobookPlayer({
audioUrl,
title = "Untitled Audiobook",
author = "RAFTA AI Creator",
coverUrl,
autoPlay = false,
className = "",
onEnded,
onPlay,
onPause,
onTimeUpdate,
}: AudiobookPlayerProps) {
const audioRef = useRef<HTMLAudioElement | null>(null);
const progressRef = useRef<HTMLInputElement | null>(null);
const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const mountedRef = useRef(true);

const [isPlaying, setIsPlaying] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [isReady, setIsReady] = useState(false);
const [hasError, setHasError] = useState(false);

const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

const [volume, setVolume] = useState(1);
const [previousVolume, setPreviousVolume] = useState(1);
const [isMuted, setIsMuted] = useState(false);

const [playbackRate, setPlaybackRate] = useState(1);

const [sleepOption, setSleepOption] =
useState<SleepOption>("off");
const [sleepRemaining, setSleepRemaining] = useState<number | null>(
null
);

const [isFavorite, setIsFavorite] = useState(false);
const [shareMessage, setShareMessage] = useState("");

const [showSpeedMenu, setShowSpeedMenu] = useState(false);
const [showSleepMenu, setShowSleepMenu] = useState(false);
const [showMoreMenu, setShowMoreMenu] = useState(false);

const [isDragging, setIsDragging] = useState(false);
const [bufferedPercent, setBufferedPercent] = useState(0);

/*

* Convert relative backend paths such as:
* /static/audio/book.mp3
*
* into:
* http://127.0.0.1:8000/static/audio/book.mp3
  */
  const resolvedAudioUrl = useMemo(() => {
  if (!audioUrl) return "";

```
if (
```

```
  audioUrl.startsWith("http://") ||
  audioUrl.startsWith("https://") ||
  audioUrl.startsWith("blob:") ||
  audioUrl.startsWith("data:")
) {
  return audioUrl;
}

if (audioUrl.startsWith("/")) {
  return `${API_URL}${audioUrl}`;
}

return `${API_URL}/${audioUrl}`;
```

}, [audioUrl]);

/*

* Create a safe readable title for browser downloads.
  */
  const safeFileName = useMemo(() => {
  const cleaned = title
  .trim()
  .replace(/[<>:"/\|?*\x00-\x1F]/g, "")
  .replace(/\s+/g, " ");

```
return `${cleaned || "rafta-audiobook"}.mp3`;
```

}, [title]);

/*

* Format seconds as:
* 00:00
* 01:25
* 1:05:30
  */
  const formatTime = useCallback((seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
  return "00:00";
  }

```
const totalSeconds = Math.floor(seconds);
```

```
const hours = Math.floor(totalSeconds / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const remainingSeconds = totalSeconds % 60;

if (hours > 0) {
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    remainingSeconds.toString().padStart(2, "0"),
  ].join(":");
}

return [
  minutes.toString().padStart(2, "0"),
  remainingSeconds.toString().padStart(2, "0"),
].join(":");
```

}, []);

/*

* Read favorite status from localStorage.
  */
  useEffect(() => {
  mountedRef.current = true;

```
try {
```

```
  const storedFavorites =
    localStorage.getItem("rafta_audiobook_favorites");

  if (storedFavorites) {
    const favorites = JSON.parse(storedFavorites);

    if (Array.isArray(favorites)) {
      setIsFavorite(
        favorites.some(
          (item: unknown) =>
            typeof item === "string" && item === title
        )
      );
    }
  }
} catch (error) {
  console.error("Could not read favorites:", error);
}

return () => {
  mountedRef.current = false;

  if (sleepTimerRef.current) {
    clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = null;
  }
};
```

}, [title]);

/*

* Reset the player when audiobook URL changes.
  */
  useEffect(() => {
  const audio = audioRef.current;

```
setIsPlaying(false);
```

```
setCurrentTime(0);
setDuration(0);
setIsReady(false);
setHasError(false);
setIsLoading(false);
setBufferedPercent(0);

if (!audio) return;

audio.pause();
audio.currentTime = 0;
audio.playbackRate = playbackRate;
audio.volume = isMuted ? 0 : volume;
audio.load();
```

}, [resolvedAudioUrl]);

/*

* Apply volume to native audio element.
  */
  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

```
audio.volume = isMuted ? 0 : volume;
```

}, [volume, isMuted]);

/*

* Apply playback speed.
  */
  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

```
audio.playbackRate = playbackRate;
```

}, [playbackRate]);

/*

* Notify parent when time changes.
  */
  useEffect(() => {
  onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

/*

* Update native buffered progress.
  */
  const updateBufferedProgress = useCallback(() => {
  const audio = audioRef.current;

```
if (!audio || !Number.isFinite(audio.duration)) {
```

```
  return;
}

try {
  if (audio.buffered.length > 0) {
    const bufferedEnd =
      audio.buffered.end(audio.buffered.length - 1);

    const percent =
      audio.duration > 0
        ? (bufferedEnd / audio.duration) * 100
        : 0;

    setBufferedPercent(Math.min(100, Math.max(0, percent)));
  }
} catch {
  // Browser may throw when buffered ranges change.
}
```

}, []);

/*

* Main play/pause controller.
  */
  const togglePlay = useCallback(async () => {
  const audio = audioRef.current;

```
if (!audio || !resolvedAudioUrl) {
```

```
  return;
}

try {
  setHasError(false);

  if (audio.paused) {
    setIsLoading(true);

    await audio.play();

    if (mountedRef.current) {
      setIsPlaying(true);
      setIsLoading(false);
    }

    onPlay?.();
  } else {
    audio.pause();

    if (mountedRef.current) {
      setIsPlaying(false);
      setIsLoading(false);
    }

    onPause?.();
  }
} catch (error) {
  console.error("Audio playback failed:", error);

  if (mountedRef.current) {
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(true);
  }
}
```

}, [resolvedAudioUrl, onPause, onPlay]);

/*

* Seek to a specific point.
  */
  const seekTo = useCallback(
  (time: number) => {
  const audio = audioRef.current;

  if (!audio || !Number.isFinite(time)) {
  return;
  }

  const maximum =
  Number.isFinite(audio.duration) && audio.duration > 0
  ? audio.duration
  : duration;

  const nextTime = Math.max(
  0,
  Math.min(time, maximum || 0)
  );

  audio.currentTime = nextTime;
  setCurrentTime(nextTime);
  },
  [duration]
  );

/*

* Skip backward/forward.
  */
  const skip = useCallback(
  (seconds: number) => {
  const audio = audioRef.current;

  if (!audio) {
  return;
  }

  seekTo(audio.currentTime + seconds);
  },
  [seekTo]
  );

/*

* Progress slider.
  */
  const handleProgressChange = (
  event: ChangeEvent<HTMLInputElement>
  ) => {
  const value = Number(event.target.value);

```
if (!Number.isFinite(value)) {
```

```
  return;
}

seekTo(value);
```

};

/*

* Volume.
  */
  const handleVolumeChange = (
  event: ChangeEvent<HTMLInputElement>
  ) => {
  const value = Number(event.target.value);

```
if (!Number.isFinite(value)) {
```

```
  return;
}

const nextVolume = Math.max(0, Math.min(1, value));

setVolume(nextVolume);

if (nextVolume > 0) {
  setPreviousVolume(nextVolume);
  setIsMuted(false);
} else {
  setIsMuted(true);
}
```

};

/*

* Mute / unmute.
  */
  const toggleMute = () => {
  const audio = audioRef.current;

```
if (!audio) {
```

```
  return;
}

if (isMuted || audio.volume === 0) {
  const restoredVolume =
    previousVolume > 0 ? previousVolume : 1;

  audio.volume = restoredVolume;

  setVolume(restoredVolume);
  setIsMuted(false);
} else {
  setPreviousVolume(volume || 1);

  audio.volume = 0;

  setVolume(0);
  setIsMuted(true);
}
```

};

/*

* Change playback speed.
  */
  const changeSpeed = (speed: number) => {
  if (!SPEED_OPTIONS.includes(speed)) {
  return;
  }

```
const audio = audioRef.current;
```

```
if (audio) {
  audio.playbackRate = speed;
}

setPlaybackRate(speed);
setShowSpeedMenu(false);
```

};

/*

* Clear currently active sleep timer.
  */
  const clearSleepTimer = useCallback(() => {
  if (sleepTimerRef.current) {
  clearTimeout(sleepTimerRef.current);
  sleepTimerRef.current = null;
  }

```
setSleepRemaining(null);
```

}, []);

/*

* Start sleep timer.
  */
  const startSleepTimer = useCallback(
  (option: SleepOption) => {
  clearSleepTimer();

  setSleepOption(option);

  if (option === "off") {
  setShowSleepMenu(false);
  return;
  }

  const selected = SLEEP_OPTIONS.find(
  (item) => item.value === option
  );

  if (!selected) {
  setShowSleepMenu(false);
  return;
  }

  const totalMilliseconds =
  selected.minutes * 60 * 1000;

  setSleepRemaining(totalMilliseconds);

  sleepTimerRef.current = setTimeout(() => {
  const audio = audioRef.current;

  if (audio) {
  audio.pause();
  audio.currentTime = Math.min(
  audio.currentTime,
  audio.duration || audio.currentTime
  );
  }

  if (mountedRef.current) {
  setIsPlaying(false);
  setSleepRemaining(null);
  setSleepOption("off");
  }

  sleepTimerRef.current = null;
  }, totalMilliseconds);

  setShowSleepMenu(false);
  },
  [clearSleepTimer]
  );

/*

* Countdown display for sleep timer.
  */
  useEffect(() => {
  if (!sleepRemaining) {
  return;
  }

```
const interval = window.setInterval(() => {
```

```
  setSleepRemaining((current) => {
    if (current === null) {
      return null;
    }

    const next = current - 1000;

    if (next <= 0) {
      window.clearInterval(interval);
      return null;
    }

    return next;
  });
}, 1000);

return () => {
  window.clearInterval(interval);
};
```

}, [sleepOption]);

/*

* Human-readable sleep timer.
  */
  const formattedSleepRemaining = useMemo(() => {
  if (
  sleepRemaining === null ||
  !Number.isFinite(sleepRemaining)
  ) {
  return "";
  }

```
const totalSeconds = Math.ceil(
```

```
  sleepRemaining / 1000
);

const minutes = Math.floor(totalSeconds / 60);
const seconds = totalSeconds % 60;

return `${minutes}:${seconds
  .toString()
  .padStart(2, "0")}`;
```

}, [sleepRemaining]);

/*

* Favorite handling.
  */
  const toggleFavorite = () => {
  try {
  const stored =
  localStorage.getItem(
  "rafta_audiobook_favorites"
  );

  let favorites: string[] = [];

  if (stored) {
  const parsed = JSON.parse(stored);

  if (Array.isArray(parsed)) {
  favorites = parsed.filter(
  (item): item is string =>
  typeof item === "string"
  );
  }
  }

  if (favorites.includes(title)) {
  favorites = favorites.filter(
  (item) => item !== title
  );

  setIsFavorite(false);
  } else {
  favorites.push(title);
  setIsFavorite(true);
  }

  localStorage.setItem(
  "rafta_audiobook_favorites",
  JSON.stringify(favorites)
  );
  } catch (error) {
  console.error(
  "Could not save favorite:",
  error
  );
  }
  };

/*

* Share audiobook.
  */
  const handleShare = async () => {
  try {
  const shareUrl =
  typeof window !== "undefined"
  ? window.location.href
  : resolvedAudioUrl;

  if (
  navigator.share &&
  typeof navigator.share === "function"
  ) {
  await navigator.share({
  title,
  text: `Listen to "${title}" on RAFTA AI Audiobook Converter.`,
  url: shareUrl,
  });

  setShareMessage("Shared");
  } else if (
  navigator.clipboard &&
  typeof navigator.clipboard.writeText ===
  "function"
  ) {
  await navigator.clipboard.writeText(shareUrl);
  setShareMessage("Link copied");
  } else {
  setShareMessage("Sharing unavailable");
  }
  } catch (error) {
  if (
  error instanceof DOMException &&
  error.name === "AbortError"
  ) {
  return;
  }

  console.error("Share failed:", error);
  setShareMessage("Share failed");
  }

```
window.setTimeout(() => {
```

```
  if (mountedRef.current) {
    setShareMessage("");
  }
}, 2500);
```

};

/*

* Download audio.
*
* For local FastAPI files we first try fetch + Blob.
* If that fails, we fall back to a normal browser download.
  */
  const handleDownload = async () => {
  if (!resolvedAudioUrl) {
  return;
  }

```
try {
```

```
  const response = await fetch(resolvedAudioUrl);

  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status}`
    );
  }

  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
} catch (error) {
  console.warn(
    "Blob download failed, using direct download:",
    error
  );

  const link = document.createElement("a");
  link.href = resolvedAudioUrl;
  link.download = safeFileName;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

setShowMoreMenu(false);
```

};

/*

* Audio events.
  */
  const handleLoadedMetadata = () => {
  const audio = audioRef.current;

```
if (!audio) {
```

```
  return;
}

const nextDuration = Number.isFinite(audio.duration)
  ? audio.duration
  : 0;

setDuration(nextDuration);
setIsReady(true);
setIsLoading(false);
setHasError(false);

audio.playbackRate = playbackRate;
audio.volume = isMuted ? 0 : volume;

updateBufferedProgress();

if (autoPlay) {
  audio
    .play()
    .then(() => {
      if (mountedRef.current) {
        setIsPlaying(true);
      }

      onPlay?.();
    })
    .catch((error) => {
      console.warn(
        "Autoplay was blocked by browser:",
        error
      );

      if (mountedRef.current) {
        setIsPlaying(false);
      }
    });
}
```

};

const handleLoadStart = () => {
setIsLoading(true);
setHasError(false);
};

const handleCanPlay = () => {
setIsLoading(false);
setIsReady(true);
};

const handleWaiting = () => {
setIsLoading(true);
};

const handlePlaying = () => {
setIsLoading(false);
setIsPlaying(true);
};

const handlePause = () => {
setIsLoading(false);
setIsPlaying(false);
onPause?.();
};

const handleEnded = () => {
setIsPlaying(false);
setCurrentTime(duration);
onEnded?.();
};

const handleTimeUpdate = () => {
const audio = audioRef.current;

```
if (!audio) {
  return;
}

const time = audio.currentTime;

setCurrentTime(time);
updateBufferedProgress();
```

};

const handleProgress = () => {
updateBufferedProgress();
};

const handleAudioError = () => {
setIsPlaying(false);
setIsLoading(false);
setHasError(true);
};

/*

* Keyboard shortcuts:
*
* Space = play/pause
* Left  = -10 seconds
* Right = +10 seconds
* Up    = volume up
* Down  = volume down
* M     = mute
  */
  const handleKeyboard = (
  event: KeyboardEvent<HTMLDivElement>
  ) => {
  const target = event.target as HTMLElement | null;

```
if (
```

```
  target?.tagName === "INPUT" ||
  target?.tagName === "SELECT" ||
  target?.tagName === "TEXTAREA"
) {
  return;
}

switch (event.key) {
  case " ":
    event.preventDefault();
    void togglePlay();
    break;

  case "ArrowLeft":
    event.preventDefault();
    skip(-10);
    break;

  case "ArrowRight":
    event.preventDefault();
    skip(10);
    break;

  case "ArrowUp":
    event.preventDefault();
    setVolume((current) => {
      const next = Math.min(1, current + 0.05);
      setIsMuted(next === 0);
      return next;
    });
    break;

  case "ArrowDown":
    event.preventDefault();
    setVolume((current) => {
      const next = Math.max(0, current - 0.05);
      setIsMuted(next === 0);
      return next;
    });
    break;

  case "m":
  case "M":
    event.preventDefault();
    toggleMute();
    break;

  default:
    break;
}
```

};

/*

* Progress percentage used for CSS.
  */
  const progressPercent =
  duration > 0
  ? Math.min(
  100,
  Math.max(
  0,
  (currentTime / duration) * 100
  )
  )
  : 0;

/*

* Current speed button text.
  */
  const speedLabel = `${playbackRate}x`;

/*

* Current sleep button text.
  */
  const sleepLabel =
  sleepRemaining !== null
  ? formattedSleepRemaining
  : "Sleep";

return (
<div
className={`audiobook-player ${className}`.trim()}
tabIndex={0}
onKeyDown={handleKeyboard}
role="region"
aria-label="Audiobook player"
>
<audio
ref={audioRef}
src={resolvedAudioUrl}
preload="metadata"
onLoadStart={handleLoadStart}
onLoadedMetadata={handleLoadedMetadata}
onCanPlay={handleCanPlay}
onWaiting={handleWaiting}
onPlaying={handlePlaying}
onPlay={() => {
setIsPlaying(true);
onPlay?.();
}}
onPause={handlePause}
onEnded={handleEnded}
onTimeUpdate={handleTimeUpdate}
onProgress={handleProgress}
onError={handleAudioError}
/>

```
  <div className="audiobook-player-header">
    <div className="audiobook-player-cover-wrapper">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`${title} cover`}
          className="audiobook-player-cover"
        />
      ) : (
        <div
          className="audiobook-player-cover audiobook-player-cover-placeholder"
          aria-hidden="true"
        >
          <span>🎧</span>
        </div>
      )}
    </div>

    <div className="audiobook-player-details">
      <p className="audiobook-player-label">
        NOW PLAYING
      </p>

      <h2 className="audiobook-player-title">
        {title}
      </h2>

      <p className="audiobook-player-author">
        {author}
      </p>

      {hasError && (
        <p className="audiobook-player-error">
          Unable to load this audio file.
        </p>
      )}

      {!hasError &&
        !isReady &&
        resolvedAudioUrl && (
          <p className="audiobook-player-status">
            Loading audio...
          </p>
        )}
    </div>

    <button
      type="button"
      className={`audiobook-player-favorite ${
        isFavorite ? "active" : ""
      }`}
      onClick={toggleFavorite}
      aria-label={
        isFavorite
          ? "Remove from favorites"
          : "Add to favorites"
      }
      title={
        isFavorite
          ? "Remove from favorites"
          : "Add to favorites"
      }
    >
      {isFavorite ? "♥" : "♡"}
    </button>
  </div>

  <div className="audiobook-player-progress-wrapper">
    <div className="audiobook-player-buffer">
      <div
        className="audiobook-player-buffered"
        style={{
          width: `${bufferedPercent}%`,
        }}
      />
    </div>

    <input
      ref={progressRef}
      className={`audiobook-player-progress ${
        isDragging ? "dragging" : ""
      }`}
      type="range"
      min="0"
      max={duration || 0}
      step="0.1"
      value={Math.min(currentTime, duration || 0)}
      disabled={!isReady || duration <= 0}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onChange={handleProgressChange}
      aria-label="Audiobook progress"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={currentTime}
    />

    <div className="audiobook-player-time">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(duration)}</span>
    </div>
  </div>

  <div className="audiobook-player-main-controls">
    <button
      type="button"
      className="audiobook-player-skip"
      onClick={() => skip(-30)}
      disabled={!isReady}
      title="Back 30 seconds"
      aria-label="Back 30 seconds"
    >
      <span>↶</span>
      <small>30</small>
    </button>

    <button
      type="button"
      className="audiobook-player-skip"
      onClick={() => skip(-10)}
      disabled={!isReady}
      title="Back 10 seconds"
      aria-label="Back 10 seconds"
    >
      <span>↶</span>
      <small>10</small>
    </button>

    <button
      type="button"
      className="audiobook-player-play-button"
      onClick={() => void togglePlay()}
      disabled={!resolvedAudioUrl || hasError}
      aria-label={isPlaying ? "Pause audiobook" : "Play audiobook"}
      title={isPlaying ? "Pause" : "Play"}
    >
      {isLoading ? (
        <span className="audiobook-player-spinner" />
      ) : isPlaying ? (
        "❚❚"
      ) : (
        "▶"
      )}
    </button>

    <button
      type="button"
      className="audiobook-player-skip"
      onClick={() => skip(10)}
      disabled={!isReady}
      title="Forward 10 seconds"
      aria-label="Forward 10 seconds"
    >
      <span>↷</span>
      <small>10</small>
    </button>

    <button
      type="button"
      className="audiobook-player-skip"
      onClick={() => skip(30)}
      disabled={!isReady}
      title="Forward 30 seconds"
      aria-label="Forward 30 seconds"
    >
      <span>↷</span>
      <small>30</small>
    </button>
  </div>

  <div className="audiobook-player-toolbar">
    <div className="audiobook-player-volume">
      <button
        type="button"
        className="audiobook-player-tool-button"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0
          ? "🔇"
          : volume < 0.5
          ? "🔉"
          : "🔊"}
      </button>

      <input
        className="audiobook-player-volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
        aria-label="Volume"
      />

      <span className="audiobook-player-volume-value">
        {Math.round(
          (isMuted ? 0 : volume) * 100
        )}
        %
      </span>
    </div>

    <div className="audiobook-player-actions">
      <div className="audiobook-player-dropdown">
        <button
          type="button"
          className="audiobook-player-tool-button"
          onClick={() => {
            setShowSpeedMenu((current) => !current);
            setShowSleepMenu(false);
            setShowMoreMenu(false);
          }}
          aria-expanded={showSpeedMenu}
          aria-haspopup="menu"
          title="Playback speed"
        >
          {speedLabel}
        </button>

        {showSpeedMenu && (
          <div
            className="audiobook-player-menu"
            role="menu"
          >
            <div className="audiobook-player-menu-title">
              Playback Speed
            </div>

            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                className={
                  speed === playbackRate
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  changeSpeed(speed)
                }
                role="menuitem"
              >
                {speed}x
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="audiobook-player-dropdown">
        <button
          type="button"
          className="audiobook-player-tool-button"
          onClick={() => {
            setShowSleepMenu((current) => !current);
            setShowSpeedMenu(false);
            setShowMoreMenu(false);
          }}
          aria-expanded={showSleepMenu}
          aria-haspopup="menu"
          title="Sleep timer"
        >
          🌙 {sleepLabel}
        </button>

        {showSleepMenu && (
          <div
            className="audiobook-player-menu"
            role="menu"
          >
            <div className="audiobook-player-menu-title">
              Sleep Timer
            </div>

            {SLEEP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  option.value === sleepOption
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  startSleepTimer(
                    option.value
                  )
                }
                role="menuitem"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="audiobook-player-tool-button"
        onClick={() => void handleShare()}
        title="Share audiobook"
        aria-label="Share audiobook"
      >
        ↗
        {shareMessage && (
          <span className="audiobook-player-share-message">
            {shareMessage}
          </span>
        )}
      </button>

      <div className="audiobook-player-dropdown">
        <button
          type="button"
          className="audiobook-player-tool-button"
          onClick={() => {
            setShowMoreMenu((current) => !current);
            setShowSpeedMenu(false);
            setShowSleepMenu(false);
          }}
          aria-expanded={showMoreMenu}
          aria-haspopup="menu"
          title="More options"
        >
          ⋮
        </button>

        {showMoreMenu && (
          <div
            className="audiobook-player-menu audiobook-player-more-menu"
            role="menu"
          >
            <button
              type="button"
              onClick={() => {
                void handleDownload();
              }}
              role="menuitem"
            >
              ↓ Download MP3
            </button>

            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(resolvedAudioUrl);
                setShareMessage("Audio URL copied");
                setShowMoreMenu(false);

                window.setTimeout(() => {
                  if (mountedRef.current) {
                    setShareMessage("");
                  }
                }, 2500);
              }}
              role="menuitem"
            >
              🔗 Copy Audio URL
            </button>

            {sleepOption !== "off" && (
              <button
                type="button"
                onClick={() => {
                  clearSleepTimer();
                  setSleepOption("off");
                  setShowMoreMenu(false);
                }}
                role="menuitem"
              >
                ✕ Cancel Sleep Timer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

  {sleepRemaining !== null && (
    <div className="audiobook-player-sleep-status">
      <span>🌙 Sleep timer</span>
      <strong>
        {formattedSleepRemaining}
      </strong>

      <button
        type="button"
        onClick={() => {
          clearSleepTimer();
          setSleepOption("off");
        }}
      >
        Cancel
      </button>
    </div>
  )}

  <div className="audiobook-player-footer">
    <span>
      {isPlaying
        ? "Playing"
        : hasError
        ? "Audio error"
        : "Paused"}
    </span>

    <span>
      Keyboard: Space play/pause · ←/→ seek · M mute
    </span>
  </div>
</div>
```

);
}
