"use client";

import {
ChangeEvent,
useEffect,
useMemo,
useState,
} from "react";

export interface VoiceSettingsValue {
rate: number;
pitch: number;
volume: number;
style: string;
pauseBetweenParagraphs: number;
pronunciation: "normal" | "clear" | "expressive";
}

interface VoiceSettingsProps {
value?: Partial<VoiceSettingsValue>;
onChange?: (settings: VoiceSettingsValue) => void;
disabled?: boolean;
compact?: boolean;
showAdvanced?: boolean;
className?: string;
}

const DEFAULT_SETTINGS: VoiceSettingsValue = {
rate: 1,
pitch: 0,
volume: 1,
style: "Natural",
pauseBetweenParagraphs: 0.8,
pronunciation: "normal",
};

const SPEED_OPTIONS = [
{
value: 0.75,
label: "0.75x",
description: "Slow",
},
{
value: 1,
label: "1x",
description: "Normal",
},
{
value: 1.25,
label: "1.25x",
description: "Faster",
},
{
value: 1.5,
label: "1.5x",
description: "Fast",
},
{
value: 1.75,
label: "1.75x",
description: "Very Fast",
},
{
value: 2,
label: "2x",
description: "Maximum",
},
];

const STYLE_OPTIONS = [
"Natural",
"Narrative",
"Calm",
"Expressive",
"Dramatic",
"Professional",
"Friendly",
];

const PRONUNCIATION_OPTIONS = [
{
value: "normal" as const,
label: "Normal",
description: "Balanced pronunciation",
},
{
value: "clear" as const,
label: "Clear",
description: "Sharper word pronunciation",
},
{
value: "expressive" as const,
label: "Expressive",
description: "More natural expression",
},
];

export default function VoiceSettings({
value,
onChange,
disabled = false,
compact = false,
showAdvanced = true,
className = "",
}: VoiceSettingsProps) {
const [settings, setSettings] =
useState<VoiceSettingsValue>({
...DEFAULT_SETTINGS,
...value,
});

const [showMore, setShowMore] =
useState(showAdvanced);

const [previewing, setPreviewing] =
useState(false);

useEffect(() => {
if (!value) {
return;
}

```
setSettings((current) => ({
  ...current,
  ...value,
}));
```

}, [value]);

useEffect(() => {
onChange?.(settings);
}, [settings, onChange]);

const updateSetting = <
K extends keyof VoiceSettingsValue

> (
> key: K,
> nextValue: VoiceSettingsValue[K]
> ) => {
> setSettings((current) => ({
> ...current,
> [key]: nextValue,
> }));
> };

const resetSettings = () => {
setSettings({
...DEFAULT_SETTINGS,
});
};

const formattedPause = useMemo(() => {
return `${settings.pauseBetweenParagraphs.toFixed(1)}s`;
}, [settings.pauseBetweenParagraphs]);

const describeSpeed = useMemo(() => {
const match = SPEED_OPTIONS.find(
(item) =>
item.value === settings.rate
);

```
return match?.description || "Custom";
```

}, [settings.rate]);

const previewVoice = () => {
if (
disabled ||
typeof window === "undefined" ||
!("speechSynthesis" in window)
) {
return;
}

```
window.speechSynthesis.cancel();

if (previewing) {
  setPreviewing(false);
  return;
}

const utterance =
  new SpeechSynthesisUtterance(
    "Hello, this is a preview of your selected voice settings. RAFTA AI can turn your text into an engaging audiobook."
  );

utterance.rate = settings.rate;
utterance.pitch =
  1 + settings.pitch / 100;
utterance.volume = settings.volume;

utterance.onstart = () => {
  setPreviewing(true);
};

utterance.onend = () => {
  setPreviewing(false);
};

utterance.onerror = () => {
  setPreviewing(false);
};

window.speechSynthesis.speak(
  utterance
);
```

};

const stopPreview = () => {
if (
typeof window !== "undefined" &&
"speechSynthesis" in window
) {
window.speechSynthesis.cancel();
}

```
setPreviewing(false);
```

};

useEffect(() => {
return () => {
if (
typeof window !== "undefined" &&
"speechSynthesis" in window
) {
window.speechSynthesis.cancel();
}
};
}, []);

const classes = [
"rafta-voice-settings",
compact
? "rafta-voice-settings-compact"
: "",
disabled
? "rafta-voice-settings-disabled"
: "",
className,
]
.filter(Boolean)
.join(" ");

return ( <section className={classes}> <div className="rafta-voice-settings-header"> <div className="rafta-voice-settings-heading"> <div className="rafta-voice-settings-icon">
⚙ </div>

```
      <div>
        <span className="rafta-voice-settings-label">
          AUDIO SETTINGS
        </span>

        <h2>Voice Settings</h2>

        <p>
          Fine-tune the sound and delivery of your
          audiobook voice.
        </p>
      </div>
    </div>

    <button
      type="button"
      className="rafta-voice-settings-reset"
      onClick={resetSettings}
      disabled={disabled}
    >
      Reset
    </button>
  </div>

  <div className="rafta-voice-settings-grid">
    {/* Speed */}

    <div className="rafta-voice-setting-card">
      <div className="rafta-voice-setting-top">
        <div>
          <h3>Speaking Speed</h3>
          <p>{describeSpeed}</p>
        </div>

        <span className="rafta-voice-setting-value">
          {settings.rate}x
        </span>
      </div>

      <div className="rafta-speed-options">
        {SPEED_OPTIONS.map((option) => {
          const selected =
            option.value === settings.rate;

          return (
            <button
              key={option.value}
              type="button"
              className={
                selected
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateSetting(
                  "rate",
                  option.value
                )
              }
              disabled={disabled}
            >
              <strong>
                {option.label}
              </strong>
              <small>
                {option.description}
              </small>
            </button>
          );
        })}
      </div>
    </div>

    {/* Pitch */}

    <div className="rafta-voice-setting-card">
      <div className="rafta-voice-setting-top">
        <div>
          <h3>Pitch</h3>
          <p>Adjust voice tone</p>
        </div>

        <span className="rafta-voice-setting-value">
          {settings.pitch > 0
            ? `+${settings.pitch}`
            : settings.pitch}
        </span>
      </div>

      <div className="rafta-range-wrapper">
        <div className="rafta-range-labels">
          <span>Low</span>
          <span>Natural</span>
          <span>High</span>
        </div>

        <input
          type="range"
          min="-30"
          max="30"
          step="1"
          value={settings.pitch}
          onChange={(
            event: ChangeEvent<HTMLInputElement>
          ) =>
            updateSetting(
              "pitch",
              Number(event.target.value)
            )
          }
          disabled={disabled}
          className="rafta-range"
          aria-label="Voice pitch"
        />
      </div>
    </div>

    {/* Volume */}

    <div className="rafta-voice-setting-card">
      <div className="rafta-voice-setting-top">
        <div>
          <h3>Volume</h3>
          <p>Audio output level</p>
        </div>

        <span className="rafta-voice-setting-value">
          {Math.round(
            settings.volume * 100
          )}
          %
        </span>
      </div>

      <div className="rafta-volume-control">
        <span>
          {settings.volume === 0
            ? "🔇"
            : settings.volume < 0.5
            ? "🔉"
            : "🔊"}
        </span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.volume}
          onChange={(
            event: ChangeEvent<HTMLInputElement>
          ) =>
            updateSetting(
              "volume",
              Number(event.target.value)
            )
          }
          disabled={disabled}
          className="rafta-range"
          aria-label="Voice volume"
        />

        <span className="rafta-volume-number">
          {Math.round(
            settings.volume * 100
          )}
        </span>
      </div>
    </div>

    {/* Style */}

    <div className="rafta-voice-setting-card">
      <div className="rafta-voice-setting-top">
        <div>
          <h3>Narration Style</h3>
          <p>Overall delivery style</p>
        </div>
      </div>

      <select
        className="rafta-voice-style-select"
        value={settings.style}
        onChange={(
          event
        ) =>
          updateSetting(
            "style",
            event.target.value
          )
        }
        disabled={disabled}
      >
        {STYLE_OPTIONS.map(
          (style) => (
            <option
              key={style}
              value={style}
            >
              {style}
            </option>
          )
        )}
      </select>
    </div>
  </div>

  {showAdvanced && (
    <div className="rafta-voice-settings-advanced">
      <button
        type="button"
        className="rafta-voice-settings-advanced-toggle"
        onClick={() =>
          setShowMore(
            (current) => !current
          )
        }
        aria-expanded={showMore}
      >
        <span>
          Advanced Voice Settings
        </span>

        <span
          className={
            showMore
              ? "open"
              : ""
          }
        >
          ˅
        </span>
      </button>

      {showMore && (
        <div className="rafta-voice-advanced-content">
          {/* Paragraph pause */}

          <div className="rafta-voice-advanced-card">
            <div className="rafta-voice-advanced-header">
              <div>
                <h3>
                  Paragraph Pause
                </h3>

                <p>
                  Pause duration between
                  paragraphs
                </p>
              </div>

              <strong>
                {formattedPause}
              </strong>
            </div>

            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={
                settings.pauseBetweenParagraphs
              }
              onChange={(
                event
              ) =>
                updateSetting(
                  "pauseBetweenParagraphs",
                  Number(
                    event.target.value
                  )
                )
              }
              disabled={disabled}
              className="rafta-range"
              aria-label="Paragraph pause"
            />

            <div className="rafta-range-labels">
              <span>None</span>
              <span>1.5s</span>
              <span>3s</span>
            </div>
          </div>

          {/* Pronunciation */}

          <div className="rafta-voice-advanced-card">
            <div className="rafta-voice-advanced-header">
              <div>
                <h3>
                  Pronunciation
                </h3>

                <p>
                  How clearly words should
                  be spoken
                </p>
              </div>
            </div>

            <div className="rafta-pronunciation-options">
              {PRONUNCIATION_OPTIONS.map(
                (option) => {
                  const selected =
                    settings.pronunciation ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={
                        selected
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        updateSetting(
                          "pronunciation",
                          option.value
                        )
                      }
                      disabled={disabled}
                    >
                      <span className="rafta-pronunciation-radio">
                        {selected
                          ? "●"
                          : "○"}
                      </span>

                      <span>
                        <strong>
                          {option.label}
                        </strong>

                        <small>
                          {
                            option.description
                          }
                        </small>
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Preset summary */}

          <div className="rafta-voice-settings-summary">
            <div className="rafta-voice-summary-title">
              Current Settings
            </div>

            <div className="rafta-voice-summary-grid">
              <div>
                <span>Speed</span>
                <strong>
                  {settings.rate}x
                </strong>
              </div>

              <div>
                <span>Pitch</span>
                <strong>
                  {settings.pitch > 0
                    ? `+${settings.pitch}`
                    : settings.pitch}
                </strong>
              </div>

              <div>
                <span>Volume</span>
                <strong>
                  {Math.round(
                    settings.volume *
                      100
                  )}
                  %
                </strong>
              </div>

              <div>
                <span>Style</span>
                <strong>
                  {settings.style}
                </strong>
              </div>

              <div>
                <span>Pause</span>
                <strong>
                  {formattedPause}
                </strong>
              </div>

              <div>
                <span>Pronunciation</span>
                <strong>
                  {
                    settings.pronunciation
                  }
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {/* Preview */}

  <div className="rafta-voice-settings-preview">
    <div className="rafta-voice-settings-preview-info">
      <div className="rafta-preview-icon">
        {previewing
          ? "🔊"
          : "🎧"}
      </div>

      <div>
        <strong>
          Voice Preview
        </strong>

        <p>
          Listen to an example with your
          current settings.
        </p>
      </div>
    </div>

    <button
      type="button"
      className="rafta-voice-preview-button"
      onClick={
        previewing
          ? stopPreview
          : previewVoice
      }
      disabled={disabled}
    >
      {previewing ? (
        <>
          <span className="rafta-preview-bars">
            <i />
            <i />
            <i />
          </span>
          Stop Preview
        </>
      ) : (
        <>
          ▶ Preview
        </>
      )}
    </button>
  </div>
</section>
```

);
}
