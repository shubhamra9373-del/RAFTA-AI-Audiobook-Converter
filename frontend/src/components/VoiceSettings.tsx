"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_RAFTA_VOICE,
  RAFTA_VOICES,
  type RaftaVoice,
} from "./voiceCatalog";

interface VoiceSettingsProps {
  value?: string;
  voice?: string;
  selectedVoice?: string;

  onChange?: (voice: string) => void;
  onVoiceChange?: (voice: string) => void;

  defaultVoice?: string;

  disabled?: boolean;
  className?: string;

  showLanguage?: boolean;
  showPreview?: boolean;
}

type LanguageOption = {
  value: "All" | "English" | "Hindi";
  label: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: "All",
    label: "All Voices",
  },
  {
    value: "English",
    label: "Indian English",
  },
  {
    value: "Hindi",
    label: "Hindi",
  },
];

export default function VoiceSettings({
  value,
  voice,
  selectedVoice,
  onChange,
  onVoiceChange,
  defaultVoice = DEFAULT_RAFTA_VOICE,
  disabled = false,
  className = "",
  showLanguage = true,
  showPreview = true,
}: VoiceSettingsProps) {
  const initialVoice =
    value ||
    voice ||
    selectedVoice ||
    defaultVoice;

  const [selectedId, setSelectedId] =
    useState(initialVoice);

  const [language, setLanguage] =
    useState<"All" | "English" | "Hindi">("All");

  const [previewingId, setPreviewingId] =
    useState<string | null>(null);

  /*
   * Keep internal voice synchronized
   * when parent value changes.
   */
  useEffect(() => {
    const next =
      value ||
      voice ||
      selectedVoice ||
      defaultVoice;

    if (next && next !== selectedId) {
      setSelectedId(next);
    }
  }, [
    value,
    voice,
    selectedVoice,
    defaultVoice,
    selectedId,
  ]);

  /*
   * Current selected voice.
   */
  const selectedVoiceData =
    useMemo<RaftaVoice>(() => {
      return (
        RAFTA_VOICES.find(
          (item) => item.id === selectedId
        ) ||
        RAFTA_VOICES.find(
          (item) => item.id === defaultVoice
        ) ||
        RAFTA_VOICES[0]
      );
    }, [selectedId, defaultVoice]);

  /*
   * Filter voices by language.
   */
  const filteredVoices = useMemo(() => {
    if (language === "All") {
      return RAFTA_VOICES;
    }

    return RAFTA_VOICES.filter(
      (item) =>
        item.language === language
    );
  }, [language]);

  /*
   * Group voices for cleaner UI.
   */
  const groupedVoices = useMemo(() => {
    const groups: Record<
      string,
      RaftaVoice[]
    > = {};

    for (const item of filteredVoices) {
      if (!groups[item.language]) {
        groups[item.language] = [];
      }

      groups[item.language].push(item);
    }

    return groups;
  }, [filteredVoices]);

  /*
   * Select voice.
   */
  const handleVoiceChange = (
    voiceId: string
  ) => {
    setSelectedId(voiceId);

    onChange?.(voiceId);
    onVoiceChange?.(voiceId);
  };

  /*
   * Browser speech preview.
   *
   * This is only a UI preview.
   * Actual audiobook generation still
   * happens through the RAFTA backend.
   */
  const previewVoice = (item: RaftaVoice) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        item.language === "Hindi"
          ? "नमस्ते, यह RAFTA AI की आवाज़ का नमूना है।"
          : "Hello, this is a sample voice from RAFTA AI."
      );

    utterance.lang =
      item.language === "Hindi"
        ? "hi-IN"
        : "en-IN";

    utterance.rate = 0.95;

    utterance.onstart = () => {
      setPreviewingId(item.id);
    };

    utterance.onend = () => {
      setPreviewingId(null);
    };

    utterance.onerror = () => {
      setPreviewingId(null);
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  return (
    <section
      className={`rafta-voice-settings ${className}`.trim()}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: 18,
        borderRadius: 18,
        background: "#0b1423",
        border:
          "1px solid rgba(124, 77, 255, 0.18)",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#7f8bad",
              marginBottom: 5,
            }}
          >
            AI VOICE
          </div>

          <h3
            style={{
              margin: 0,
              color: "#edf1fc",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            Voice Settings
          </h3>

          <p
            style={{
              margin:
                "5px 0 0",
              color: "#8290b0",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Choose the language and AI voice
            for your audiobook.
          </p>
        </div>

        <div
          style={{
            padding:
              "7px 10px",
            borderRadius: 10,
            background:
              "rgba(124, 77, 255, 0.12)",
            color: "#a995ff",
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {RAFTA_VOICES.length} voices
        </div>
      </div>

      {/* =================================================
          LANGUAGE
      ================================================= */}

      {showLanguage && (
        <div
          style={{
            marginBottom: 18,
          }}
        >
          <label
            htmlFor="rafta-voice-language"
            style={{
              display: "block",
              marginBottom: 7,
              color: "#dfe5f7",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Language
          </label>

          <select
            id="rafta-voice-language"
            value={language}
            onChange={(event) =>
              setLanguage(
                event.target
                  .value as
                  | "All"
                  | "English"
                  | "Hindi"
              )
            }
            disabled={disabled}
            style={{
              width: "100%",
              boxSizing: "border-box",
              appearance: "none",
              border:
                "1px solid rgba(124, 77, 255, 0.2)",
              borderRadius: 12,
              background: "#07101d",
              color: "#edf1fc",
              padding:
                "11px 13px",
              outline: "none",
              cursor: disabled
                ? "not-allowed"
                : "pointer",
              fontSize: 13,
            }}
          >
            {LANGUAGE_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>
      )}

      {/* =================================================
          SELECTED VOICE
      ================================================= */}

      <div
        style={{
          marginBottom: 18,
          padding: 13,
          borderRadius: 14,
          background:
            "linear-gradient(135deg, rgba(124,77,255,0.14), rgba(34,211,238,0.06))",
          border:
            "1px solid rgba(124, 77, 255, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background:
                selectedVoiceData.gender ===
                "Female"
                  ? "rgba(236, 72, 153, 0.14)"
                  : "rgba(124, 77, 255, 0.14)",
              color:
                selectedVoiceData.gender ===
                "Female"
                  ? "#f472b6"
                  : "#9b7cff",
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            {selectedVoiceData.gender ===
            "Female"
              ? "♀"
              : "♂"}
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {selectedVoiceData.name}
            </div>

            <div
              style={{
                color: "#8d99b7",
                fontSize: 11,
                marginTop: 3,
              }}
            >
              {selectedVoiceData.description}
            </div>

            <div
              style={{
                color: "#687594",
                fontSize: 10,
                marginTop: 2,
              }}
            >
              {selectedVoiceData.id}
            </div>
          </div>

          <div
            style={{
              padding:
                "5px 8px",
              borderRadius: 8,
              background:
                "rgba(34,197,94,0.10)",
              color: "#6ee7a0",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            SELECTED
          </div>
        </div>
      </div>

      {/* =================================================
          VOICE LIST
      ================================================= */}

      <div>
        {Object.entries(
          groupedVoices
        ).map(
          ([groupName, voices]) => (
            <div
              key={groupName}
              style={{
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    color: "#7f8ba9",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing:
                      "0.12em",
                  }}
                >
                  {groupName ===
                  "Hindi"
                    ? "HINDI"
                    : "INDIAN ENGLISH"}
                </span>

                <span
                  style={{
                    color: "#626d89",
                    fontSize: 10,
                  }}
                >
                  {voices.length} voices
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 8,
                }}
              >
                {voices.map(
                  (item) => {
                    const active =
                      item.id ===
                      selectedId;

                    const previewing =
                      item.id ===
                      previewingId;

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: active
                            ? "1px solid rgba(124, 77, 255, 0.55)"
                            : "1px solid rgba(124, 77, 255, 0.11)",
                          background:
                            active
                              ? "rgba(124, 77, 255, 0.10)"
                              : "#07101d",
                          borderRadius: 13,
                          padding: 11,
                          transition:
                            "all 0.2s ease",
                        }}
                      >
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            handleVoiceChange(
                              item.id
                            )
                          }
                          style={{
                            width:
                              "100%",
                            padding: 0,
                            margin: 0,
                            border:
                              "none",
                            background:
                              "transparent",
                            color:
                              "#edf1fc",
                            cursor:
                              disabled
                                ? "not-allowed"
                                : "pointer",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 10,
                            textAlign:
                              "left",
                          }}
                        >
                          <span
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              flexShrink: 0,
                              background:
                                item.gender ===
                                "Female"
                                  ? "rgba(236,72,153,0.12)"
                                  : "rgba(124,77,255,0.12)",
                              color:
                                item.gender ===
                                "Female"
                                  ? "#f472b6"
                                  : "#9b7cff",
                              fontSize: 15,
                            }}
                          >
                            {item.gender ===
                            "Female"
                              ? "♀"
                              : "♂"}
                          </span>

                          <span
                            style={{
                              minWidth:
                                0,
                              flex: 1,
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "block",
                                color:
                                  "#edf1fc",
                                fontSize:
                                  13,
                                fontWeight:
                                  750,
                              }}
                            >
                              {item.name}
                            </span>

                            <span
                              style={{
                                display:
                                  "block",
                                color:
                                  "#818dac",
                                fontSize:
                                  10,
                                marginTop:
                                  2,
                              }}
                            >
                              {item.gender}
                            </span>
                          </span>

                          {active && (
                            <span
                              style={{
                                color:
                                  "#a78bfa",
                                fontSize:
                                  15,
                                fontWeight:
                                  800,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>

                        {showPreview && (
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              previewVoice(
                                item
                              )
                            }
                            style={{
                              width:
                                "100%",
                              marginTop:
                                8,
                              border:
                                "1px solid rgba(124,77,255,0.12)",
                              background:
                                "rgba(255,255,255,0.025)",
                              color:
                                "#969fba",
                              borderRadius:
                                8,
                              padding:
                                "6px 8px",
                              fontSize:
                                10,
                              cursor:
                                disabled
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {previewing
                              ? "Playing..."
                              : "▶ Preview voice"}
                          </button>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* =================================================
          CURRENT VALUE
      ================================================= */}

      <div
        style={{
          marginTop: 5,
          paddingTop: 12,
          borderTop:
            "1px solid rgba(255,255,255,0.06)",
          color: "#64708d",
          fontSize: 10,
          lineHeight: 1.5,
        }}
      >
        Selected voice ID:
        <strong
          style={{
            color: "#8995b4",
            marginLeft: 5,
            fontWeight: 600,
          }}
        >
          {selectedVoiceData.id}
        </strong>
      </div>
    </section>
  );
}

export type { VoiceSettingsProps };