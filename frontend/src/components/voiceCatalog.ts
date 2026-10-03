export type VoiceGender = "Male" | "Female";

export type VoiceLanguage = "Hindi" | "English";

export interface RaftaVoice {
  id: string;
  name: string;
  gender: VoiceGender;
  language: VoiceLanguage;
  locale: string;
  description: string;
}

export const RAFTA_VOICES: RaftaVoice[] = [
  {
    id: "en-IN-NeerjaNeural",
    name: "Neerja",
    gender: "Female",
    language: "English",
    locale: "en-IN",
    description: "Indian English • Female",
  },
  {
    id: "en-IN-PrabhatNeural",
    name: "Prabhat",
    gender: "Male",
    language: "English",
    locale: "en-IN",
    description: "Indian English • Male",
  },

  {
    id: "hi-IN-AaravNeural",
    name: "Aarav",
    gender: "Male",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Male",
  },
  {
    id: "hi-IN-AnanyaNeural",
    name: "Ananya",
    gender: "Female",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Female",
  },
  {
    id: "hi-IN-AartiNeural",
    name: "Aarti",
    gender: "Female",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Female",
  },
  {
    id: "hi-IN-ArjunNeural",
    name: "Arjun",
    gender: "Male",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Male",
  },
  {
    id: "hi-IN-KavyaNeural",
    name: "Kavya",
    gender: "Female",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Female",
  },
  {
    id: "hi-IN-KunalNeural",
    name: "Kunal",
    gender: "Male",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Male",
  },
  {
    id: "hi-IN-RehaanNeural",
    name: "Rehaan",
    gender: "Male",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Male",
  },
  {
    id: "hi-IN-SwaraNeural",
    name: "Swara",
    gender: "Female",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Female",
  },
  {
    id: "hi-IN-MadhurNeural",
    name: "Madhur",
    gender: "Male",
    language: "Hindi",
    locale: "hi-IN",
    description: "Hindi • Male",
  },
];

export const HINDI_VOICES = RAFTA_VOICES.filter(
  (voice) => voice.language === "Hindi"
);

export const ENGLISH_VOICES = RAFTA_VOICES.filter(
  (voice) => voice.language === "English"
);

export const DEFAULT_RAFTA_VOICE = "en-IN-NeerjaNeural";

export const DEFAULT_HINDI_VOICE = "hi-IN-SwaraNeural";