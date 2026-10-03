"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_RAFTA_VOICE,
  RAFTA_VOICES,
  type RaftaVoice,
} from "./voiceCatalog";

interface VoiceSelectorProps {
  value?: string;
  selectedVoice?: string;
  voice?: string;

  onChange?: (voiceId: string) => void;
  onVoiceChange?: (voiceId: string) => void;
  onSelect?: (voiceId: string) => void;

  label?: string;
  disabled?: boolean;
  className?: string;

  [key: string]: any;
}

function VoiceIcon({
  gender,
}: {
  gender: "Male" | "Female";
}) {
  return (
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          gender === "Female"
            ? "rgba(236, 72, 153, 0.14)"
            : "rgba(124, 77, 255, 0.14)",
        color:
          gender === "Female"
            ? "#f472b6"
            : "#9b7cff",
        flexShrink: 0,
        fontSize: 16,
      }}
    >
      {gender === "Female" ? "♀" : "♂"}
    </span>
  );
}

export default function VoiceSelector({
  value,
  selectedVoice,
  voice,
  onChange,
  onVoiceChange,
  onSelect,
  label = "AI Voice",
  disabled = false,
  className = "",
}: VoiceSelectorProps) {
  const currentValue =
    value ??
    selectedVoice ??
    voice ??
    DEFAULT_RAFTA_VOICE;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo<RaftaVoice>(() => {
    return (
      RAFTA_VOICES.find(
        (item) => item.id === currentValue
      ) ?? RAFTA_VOICES[0]
    );
  }, [currentValue]);

  const filteredVoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return RAFTA_VOICES;
    }

    return RAFTA_VOICES.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.language.toLowerCase().includes(query) ||
        item.gender.toLowerCase().includes(query)
      );
    });
  }, [search]);

  const hindiVoices = filteredVoices.filter(
    (item) => item.language === "Hindi"
  );

  const englishVoices = filteredVoices.filter(
    (item) => item.language === "English"
  );

  const selectVoice = (voiceId: string) => {
    onChange?.(voiceId);
    onVoiceChange?.(voiceId);
    onSelect?.(voiceId);

    setOpen(false);
    setSearch("");
  };

  const renderVoice = (item: RaftaVoice) => {
    const active = item.id === currentValue;

    return (
      <button
        key={item.id}
        type="button"
        disabled={disabled}
        onClick={() => selectVoice(item.id)}
        style={{
          width: "100%",
          border: "none",
          background: active
            ? "rgba(124, 77, 255, 0.13)"
            : "transparent",
          color: "#edf1fc",
          padding: "10px 11px",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 11,
          cursor: disabled
            ? "not-allowed"
            : "pointer",
          textAlign: "left",
          marginBottom: 4,
        }}
      >
        <VoiceIcon gender={item.gender} />

        <span
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {item.name}
          </span>

          <span
            style={{
              display: "block",
              marginTop: 2,
              fontSize: 11,
              color: "#8d98b8",
            }}
          >
            {item.description}
          </span>
        </span>

        {active && (
          <span
            style={{
              color: "#9b7cff",
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            ✓
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className={`rafta-voice-selector ${className}`.trim()}
      style={{
        width: "100%",
        position: "relative",
      }}
    >
      <label
        style={{
          display: "block",
          marginBottom: 8,
          color: "#edf1fc",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        style={{
          width: "100%",
          minHeight: 60,
          border: "1px solid rgba(124, 77, 255, 0.25)",
          borderRadius: 14,
          background: "#0b1423",
          color: "#edf1fc",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "10px 12px",
          cursor: disabled
            ? "not-allowed"
            : "pointer",
          textAlign: "left",
        }}
      >
        <VoiceIcon gender={selected.gender} />

        <span
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: "block",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {selected.name}
          </span>

          <span
            style={{
              display: "block",
              marginTop: 2,
              color: "#8995b5",
              fontSize: 11,
            }}
          >
            {selected.language} • {selected.gender}
          </span>
        </span>

        <span
          style={{
            color: "#9b7cff",
            fontSize: 18,
            transform: open
              ? "rotate(180deg)"
              : "none",
            transition: "transform 0.2s ease",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 1000,
            background: "#0b1423",
            border:
              "1px solid rgba(124, 77, 255, 0.24)",
            borderRadius: 16,
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.45)",
            padding: 10,
          }}
        >
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search voice..."
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              border:
                "1px solid rgba(124, 77, 255, 0.18)",
              outline: "none",
              background: "#07101d",
              color: "#edf1fc",
              borderRadius: 11,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 10,
            }}
          />

          {englishVoices.length > 0 && (
            <div style={{ marginBottom: 9 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "#6f7a9a",
                  padding:
                    "4px 8px 7px",
                }}
              >
                INDIAN ENGLISH
              </div>

              {englishVoices.map(renderVoice)}
            </div>
          )}

          {hindiVoices.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: "#6f7a9a",
                  padding:
                    "4px 8px 7px",
                }}
              >
                HINDI • 9 VOICES
              </div>

              {hindiVoices.map(renderVoice)}
            </div>
          )}

          {filteredVoices.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "#7f8ba9",
                fontSize: 13,
              }}
            >
              No voices found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type {
  VoiceSelectorProps,
};