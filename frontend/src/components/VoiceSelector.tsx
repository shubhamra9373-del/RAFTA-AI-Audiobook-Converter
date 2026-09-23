"use client";

import { useMemo } from "react";

/* =========================================================
   RAFTA VOICE SELECTOR + DUBBING
========================================================= */

export interface RaftaVoice {
  id: string;
  name: string;
  language: string;
  languageCode: string;
  gender: "Male" | "Female";
  region: string;
}

export interface RaftaDubLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  voice: string;
}

interface VoiceSelectorProps {
  value?: string;
  selectedVoice?: string;

  onChange?: (voice: string) => void;
  onVoiceChange?: (voice: string) => void;

  dubEnabled?: boolean;
  onDubEnabledChange?: (enabled: boolean) => void;

  dubLanguage?: string;
  selectedDubLanguage?: string;

  onDubLanguageChange?: (
    language: string
  ) => void;

  disabled?: boolean;
}


/* =========================================================
   INDIAN VOICES
========================================================= */

export const RAFTA_INDIAN_VOICES: RaftaVoice[] = [
  /* English - India */
  {
    id: "en-IN-NeerjaNeural",
    name: "Neerja",
    language: "English",
    languageCode: "en-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "en-IN-PrabhatNeural",
    name: "Prabhat",
    language: "English",
    languageCode: "en-IN",
    gender: "Male",
    region: "India",
  },

  /* Hindi */
  {
    id: "hi-IN-SwaraNeural",
    name: "Swara",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "hi-IN-AartiNeural",
    name: "Aarti",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "hi-IN-AnanyaNeural",
    name: "Ananya",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "hi-IN-KavyaNeural",
    name: "Kavya",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "hi-IN-MadhurNeural",
    name: "Madhur",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Male",
    region: "India",
  },
  {
    id: "hi-IN-AaravNeural",
    name: "Aarav",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Male",
    region: "India",
  },
  {
    id: "hi-IN-ArjunNeural",
    name: "Arjun",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Male",
    region: "India",
  },
  {
    id: "hi-IN-KunalNeural",
    name: "Kunal",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Male",
    region: "India",
  },
  {
    id: "hi-IN-RehaanNeural",
    name: "Rehaan",
    language: "Hindi",
    languageCode: "hi-IN",
    gender: "Male",
    region: "India",
  },

  /* Marathi */
  {
    id: "mr-IN-AarohiNeural",
    name: "Aarohi",
    language: "Marathi",
    languageCode: "mr-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "mr-IN-ManoharNeural",
    name: "Manohar",
    language: "Marathi",
    languageCode: "mr-IN",
    gender: "Male",
    region: "India",
  },

  /* Telugu */
  {
    id: "te-IN-ShrutiNeural",
    name: "Shruti",
    language: "Telugu",
    languageCode: "te-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "te-IN-MohanNeural",
    name: "Mohan",
    language: "Telugu",
    languageCode: "te-IN",
    gender: "Male",
    region: "India",
  },

  /* Tamil */
  {
    id: "ta-IN-PallaviNeural",
    name: "Pallavi",
    language: "Tamil",
    languageCode: "ta-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "ta-IN-ValluvarNeural",
    name: "Valluvar",
    language: "Tamil",
    languageCode: "ta-IN",
    gender: "Male",
    region: "India",
  },

  /* Malayalam */
  {
    id: "ml-IN-SobhanaNeural",
    name: "Sobhana",
    language: "Malayalam",
    languageCode: "ml-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "ml-IN-MidhunNeural",
    name: "Midhun",
    language: "Malayalam",
    languageCode: "ml-IN",
    gender: "Male",
    region: "India",
  },

  /* Gujarati */
  {
    id: "gu-IN-DhwaniNeural",
    name: "Dhwani",
    language: "Gujarati",
    languageCode: "gu-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "gu-IN-NiranjanNeural",
    name: "Niranjan",
    language: "Gujarati",
    languageCode: "gu-IN",
    gender: "Male",
    region: "India",
  },

  /* Kannada */
  {
    id: "kn-IN-SapnaNeural",
    name: "Sapna",
    language: "Kannada",
    languageCode: "kn-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "kn-IN-GaganNeural",
    name: "Gagan",
    language: "Kannada",
    languageCode: "kn-IN",
    gender: "Male",
    region: "India",
  },

  /* Bengali */
  {
    id: "bn-IN-TanishaaNeural",
    name: "Tanishaa",
    language: "Bengali",
    languageCode: "bn-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "bn-IN-BashkarNeural",
    name: "Bashkar",
    language: "Bengali",
    languageCode: "bn-IN",
    gender: "Male",
    region: "India",
  },

  /* Punjabi */
  {
    id: "pa-IN-VaaniNeural",
    name: "Vaani",
    language: "Punjabi",
    languageCode: "pa-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "pa-IN-OjasNeural",
    name: "Ojas",
    language: "Punjabi",
    languageCode: "pa-IN",
    gender: "Male",
    region: "India",
  },

  /* Odia */
  {
    id: "or-IN-SubhasiniNeural",
    name: "Subhasini",
    language: "Odia",
    languageCode: "or-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "or-IN-SukantNeural",
    name: "Sukant",
    language: "Odia",
    languageCode: "or-IN",
    gender: "Male",
    region: "India",
  },

  /* Assamese */
  {
    id: "as-IN-YashicaNeural",
    name: "Yashica",
    language: "Assamese",
    languageCode: "as-IN",
    gender: "Female",
    region: "India",
  },
  {
    id: "as-IN-PriyomNeural",
    name: "Priyom",
    language: "Assamese",
    languageCode: "as-IN",
    gender: "Male",
    region: "India",
  },
];


/* =========================================================
   DUBBING LANGUAGES
========================================================= */

export const RAFTA_DUB_LANGUAGES:
  RaftaDubLanguage[] = [
    {
      code: "hi",
      name: "Hindi",
      nativeName: "हिन्दी",
      flag: "🇮🇳",
      voice: "hi-IN-SwaraNeural",
    },
    {
      code: "mr",
      name: "Marathi",
      nativeName: "मराठी",
      flag: "🇮🇳",
      voice: "mr-IN-AarohiNeural",
    },
    {
      code: "te",
      name: "Telugu",
      nativeName: "తెలుగు",
      flag: "🇮🇳",
      voice: "te-IN-ShrutiNeural",
    },
    {
      code: "ta",
      name: "Tamil",
      nativeName: "தமிழ்",
      flag: "🇮🇳",
      voice: "ta-IN-PallaviNeural",
    },
    {
      code: "ml",
      name: "Malayalam",
      nativeName: "മലയാളം",
      flag: "🇮🇳",
      voice: "ml-IN-SobhanaNeural",
    },
    {
      code: "gu",
      name: "Gujarati",
      nativeName: "ગુજરાતી",
      flag: "🇮🇳",
      voice: "gu-IN-DhwaniNeural",
    },
    {
      code: "kn",
      name: "Kannada",
      nativeName: "ಕನ್ನಡ",
      flag: "🇮🇳",
      voice: "kn-IN-SapnaNeural",
    },
    {
      code: "bn",
      name: "Bengali",
      nativeName: "বাংলা",
      flag: "🇮🇳",
      voice: "bn-IN-TanishaaNeural",
    },
    {
      code: "pa",
      name: "Punjabi",
      nativeName: "ਪੰਜਾਬੀ",
      flag: "🇮🇳",
      voice: "pa-IN-VaaniNeural",
    },
    {
      code: "or",
      name: "Odia",
      nativeName: "ଓଡ଼ିଆ",
      flag: "🇮🇳",
      voice: "or-IN-SubhasiniNeural",
    },
    {
      code: "as",
      name: "Assamese",
      nativeName: "অসমীয়া",
      flag: "🇮🇳",
      voice: "as-IN-YashicaNeural",
    },
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🌐",
      voice: "en-IN-NeerjaNeural",
    },
    {
      code: "ur",
      name: "Urdu",
      nativeName: "اردو",
      flag: "🌐",
      voice: "hi-IN-MadhurNeural",
    },
  ];


/* =========================================================
   COMPONENT
========================================================= */

export default function VoiceSelector({
  value,
  selectedVoice,

  onChange,
  onVoiceChange,

  dubEnabled = false,
  onDubEnabledChange,

  dubLanguage = "hi",
  selectedDubLanguage,

  onDubLanguageChange,

  disabled = false,
}: VoiceSelectorProps) {
  const currentVoice =
    value ??
    selectedVoice ??
    "en-IN-NeerjaNeural";

  const currentDubLanguage =
    selectedDubLanguage ??
    dubLanguage;

  const selectedVoiceData =
    useMemo(() => {
      return RAFTA_INDIAN_VOICES.find(
        (voice) =>
          voice.id === currentVoice
      );
    }, [currentVoice]);

  const handleVoiceChange = (
    nextVoice: string
  ) => {
    onChange?.(nextVoice);
    onVoiceChange?.(nextVoice);
  };

  const handleDubChange = (
    enabled: boolean
  ) => {
    onDubEnabledChange?.(
      enabled
    );
  };

  const handleLanguageChange = (
    language: string
  ) => {
    onDubLanguageChange?.(
      language
    );
  };

  return (
    <div className="rafta-voice-selector">
      {/* =================================================
          VOICE HEADER
      ================================================= */}

      <div className="rafta-voice-selector-header">
        <div>
          <span className="rafta-voice-selector-eyebrow">
            AI VOICE
          </span>

          <h3>
            Choose Narrator
          </h3>

          <p>
            Select an Indian male or
            female AI voice for your
            audiobook.
          </p>
        </div>
      </div>

      {/* =================================================
          VOICE SELECT
      ================================================= */}

      <div className="rafta-voice-selector-field">
        <label htmlFor="rafta-voice-select">
          Narrator Voice
        </label>

        <select
          id="rafta-voice-select"
          value={currentVoice}
          disabled={disabled}
          onChange={(event) =>
            handleVoiceChange(
              event.target.value
            )
          }
        >
          {RAFTA_INDIAN_VOICES.map(
            (voice) => (
              <option
                key={voice.id}
                value={voice.id}
              >
                {voice.name} ·{" "}
                {voice.language} ·{" "}
                {voice.gender}
              </option>
            )
          )}
        </select>

        {selectedVoiceData && (
          <div className="rafta-voice-selected-info">
            <span>
              {selectedVoiceData.gender ===
              "Female"
                ? "♀"
                : "♂"}
            </span>

            <strong>
              {selectedVoiceData.name}
            </strong>

            <small>
              {selectedVoiceData.language}
              {" · "}
              {selectedVoiceData.languageCode}
            </small>
          </div>
        )}
      </div>

      {/* =================================================
          DUBBING
      ================================================= */}

      <div className="rafta-dub-section">
        <div className="rafta-dub-header">
          <div>
            <span className="rafta-dub-eyebrow">
              NEW FEATURE
            </span>

            <h3>
              🌐 Dub Audiobook
            </h3>

            <p>
              Translate your uploaded
              book into another language
              and generate a new narrated
              audiobook.
            </p>
          </div>

          <button
            type="button"
            className={`rafta-dub-toggle ${
              dubEnabled
                ? "active"
                : ""
            }`}
            disabled={disabled}
            onClick={() =>
              handleDubChange(
                !dubEnabled
              )
            }
            aria-pressed={
              dubEnabled
            }
          >
            <span className="rafta-dub-toggle-track">
              <span className="rafta-dub-toggle-thumb" />
            </span>

            <strong>
              {dubEnabled
                ? "ON"
                : "OFF"}
            </strong>
          </button>
        </div>

        {dubEnabled && (
          <div className="rafta-dub-options">
            <div className="rafta-dub-language-field">
              <label htmlFor="rafta-dub-language">
                Dub Into
              </label>

              <select
                id="rafta-dub-language"
                value={
                  currentDubLanguage
                }
                disabled={disabled}
                onChange={(
                  event
                ) =>
                  handleLanguageChange(
                    event.target
                      .value
                  )
                }
              >
                {RAFTA_DUB_LANGUAGES.map(
                  (language) => (
                    <option
                      key={
                        language.code
                      }
                      value={
                        language.code
                      }
                    >
                      {language.flag}{" "}
                      {language.name} —{" "}
                      {
                        language.nativeName
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="rafta-dub-preview">
              <div className="rafta-dub-preview-icon">
                🌍
              </div>

              <div>
                <strong>
                  Audiobook dubbing
                </strong>

                <p>
                  Original text → translated
                  text → selected Indian
                  voice → new MP3 chapters
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}