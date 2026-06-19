export type Engine = 'cloud' | 'offline' | 'piper';

export interface PiperModelSpec {
  onnx: string;
  config: string;
  filename: string;
}

export const PIPER_MODEL_URLS: Record<string, PiperModelSpec> = {
  'en-piper': {
    onnx: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx?download=true',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json?download=true',
    filename: 'en_US-lessac-medium',
  },
  'fr-piper': {
    onnx: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx?download=true',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json?download=true',
    filename: 'fr_FR-siwis-medium',
  },
  'ar-piper': {
    onnx: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx?download=true',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ar/ar_JO/kareem/medium/ar_JO-kareem-medium.onnx.json?download=true',
    filename: 'ar_JO-kareem-medium',
  },
  'sw-piper': {
    onnx: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx?download=true',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/sw/sw_CD/lanfrica/medium/sw_CD-lanfrica-medium.onnx.json?download=true',
    filename: 'sw_CD-lanfrica-medium',
  },
  // Tigrinya: custom-trained model — update URL once published to a release
  'ti-piper': {
    onnx: 'https://github.com/TigrinyaNLP/tigrinya-nlp/releases/download/v1.0/tiPiper.onnx',
    config: 'https://github.com/TigrinyaNLP/tigrinya-nlp/releases/download/v1.0/tiPiper.onnx.json',
    filename: 'ti-piper',
  },
};

export interface Language {
  code: string;
  iso: string;          // ISO 3166-1 alpha-2 (lowercase) for the flag
  name: string;         // English name
  nativeName: string;   // Native script
  engine: Engine;       // 'cloud' = Husika API, 'offline' = eSpeak NG
  voice: string;        // offline: eSpeak voice tag; cloud: API lang_code
  samples: string[];
}

export const LANGUAGES: Language[] = [
  {
    code: 'en',
    iso: 'gb',
    name: 'English',
    nativeName: 'English',
    engine: 'cloud',
    voice: 'en',
    samples: [
      'Hello, how are you today?',
      'Welcome to the Husika TTS experimentation app.',
      'The weather is beautiful this morning.',
    ],
  },
  {
    code: 'fr',
    iso: 'fr',
    name: 'French',
    nativeName: 'Français',
    engine: 'cloud',
    voice: 'fr',
    samples: [
      'Bonjour, comment allez-vous?',
      'Bienvenue dans l’application Husika.',
      'Le temps est magnifique aujourd’hui.',
    ],
  },
  {
    code: 'ar',
    iso: 'sa',
    name: 'Arabic',
    nativeName: 'العربية',
    engine: 'cloud',
    voice: 'ara',
    samples: [
      'مرحبًا، كيف حالك اليوم؟',
      'أهلاً بك في تطبيق هوسيكا للتجارب.',
      'الطقس جميل هذا الصباح.',
    ],
  },
  {
    code: 'sw',
    iso: 'ke',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    engine: 'cloud',
    voice: 'swa',
    samples: [
      'Habari, hujambo leo?',
      'Karibu kwenye programu ya Husika.',
      'Hali ya hewa ni nzuri asubuhi hii.',
    ],
  },
  {
    code: 'am',
    iso: 'et',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    engine: 'cloud',
    voice: 'amh',
    samples: [
      'ሰላም፣ ዛሬ እንዴት ነህ?',
      'ወደ ሁሲካ መተግበሪያ እንኳን በደህና መጡ።',
      'ዛሬ ጠዋት የአየር ሁኔታ ቆንጆ ነው።',
    ],
  },
  {
    code: 'nue',
    iso: 'ss',
    name: 'Nuer',
    nativeName: 'Thok Naath',
    engine: 'cloud',
    voice: 'nue',
    samples: [
      'Malo, i jäl dɔ?',
      'Bi ɣa röödä kɔc Husika.',
      'Kɔc ciɛŋ bäär cï jäŋ piëth.',
    ],
  },
  {
    code: 'din',
    iso: 'ss',
    name: 'Dinka',
    nativeName: 'Thuɔŋjäŋ',
    engine: 'cloud',
    voice: 'din',
    samples: [
      'Acin, yïn abï ŋot?',
      'Yin adhiëk bï Husika.',
      'Wëi bï lɔŋ yen.',
    ],
  },
  {
    code: 'pko',
    iso: 'ke',
    name: 'Pokoot',
    nativeName: 'Pökoot',
    engine: 'cloud',
    voice: 'pko',
    samples: [
      'Chamuge, kono in?',
      'Akwany Husika.',
      'Akitabach asis.',
    ],
  },
  {
    code: 'tuv',
    iso: 'ke',
    name: 'Turkana',
    nativeName: 'Ng\'aturkana',
    engine: 'cloud',
    voice: 'tuv',
    samples: [
      'Ejok, idio ekitóm?',
      'Awuono Husika.',
      'Esioi kijiji.',
    ],
  },
  {
    code: 'kdj',
    iso: 'ug',
    name: 'Karamojong',
    nativeName: 'Ngakarimojong',
    engine: 'cloud',
    voice: 'kdj',
    samples: [
      'Ejok, bo iyong?',
      'Akweet Husika.',
      'Eyalama noi.',
    ],
  },
  {
    code: 'so',
    iso: 'so',
    name: 'Somali',
    nativeName: 'Soomaali',
    engine: 'offline',
    voice: 'espeak-so',
    samples: [
      'Salaan, sidee tahay maanta?',
      'Ku soo dhowow barnaamijka Husika.',
      'Cimilada subaxnimadan way qurux badan tahay.',
    ],
  },
  {
    code: 'om',
    iso: 'et',
    name: 'Oromo',
    nativeName: 'Afaan Oromoo',
    engine: 'offline',
    voice: 'espeak-om',
    samples: [
      'Akkam jirta har’a?',
      'Baga gara appii Husika dhuftan.',
      'Ganama har’aa haalli qilleensaa bareedaa dha.',
    ],
  },
  {
    code: 'ti',
    iso: 'er',
    name: 'Tigrinya',
    nativeName: 'ትግርኛ',
    engine: 'offline',
    voice: 'espeak-ti',
    samples: [
      'ሰላም፣ ሎሚ ከመይ ኣለኻ?',
      'ናብ ኣፕልኬሽን ሁሲካ ብደሓን ምጻእ።',
      'ሎሚ ንግሆ ኩነታት ኣየር ጽቡቕ እዩ።',
    ],
  },
  {
    code: 'rw',
    iso: 'rw',
    name: 'Kinyarwanda',
    nativeName: 'Ikinyarwanda',
    engine: 'offline',
    voice: 'espeak-rw',
    samples: [
      'Muraho, amakuru y’uyu munsi?',
      'Murakaza neza kuri porogaramu ya Husika.',
      'Iki gitondo ikirere ni cyiza cyane.',
    ],
  },
  {
    code: 'rn',
    iso: 'bi',
    name: 'Kirundi',
    nativeName: 'Ikirundi',
    engine: 'offline',
    voice: 'espeak-rn',
    samples: [
      'Amahoro, amakuru y’uno musi?',
      'Ikaze kuri porogaramu ya Husika.',
      'Uyu mugoroba ikirere ni ciza.',
    ],
  },
  {
    code: 'lg',
    iso: 'ug',
    name: 'Luganda',
    nativeName: 'Oluganda',
    engine: 'offline',
    voice: 'espeak-lg',
    samples: [
      'Oli otya leero?',
      'Tukwaniriza ku app ya Husika.',
      'Embeera y’obudde nnungi nnyo ku makya.',
    ],
  },
];

export const PIPER_LANGUAGES: Language[] = [
  {
    code: 'en-piper',
    iso: 'gb',
    name: 'English',
    nativeName: 'English',
    engine: 'piper',
    voice: 'piper-en',
    samples: [
      'Hello, how are you today?',
      'Welcome to the Husika TTS experimentation app.',
      'The weather is beautiful this morning.',
    ],
  },
  {
    code: 'fr-piper',
    iso: 'fr',
    name: 'French',
    nativeName: 'Français',
    engine: 'piper',
    voice: 'piper-fr',
    samples: [
      'Bonjour, comment allez-vous?',
      "Bienvenue dans l'application Husika.",
      "Le temps est magnifique aujourd'hui.",
    ],
  },
  {
    code: 'ar-piper',
    iso: 'sa',
    name: 'Arabic',
    nativeName: 'العربية',
    engine: 'piper',
    voice: 'piper-ar',
    samples: [
      'مرحبًا، كيف حالك اليوم؟',
      'أهلاً بك في تطبيق هوسيكا للتجارب.',
      'الطقس جميل هذا الصباح.',
    ],
  },
  {
    code: 'sw-piper',
    iso: 'ke',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    engine: 'piper',
    voice: 'piper-sw',
    samples: [
      'Habari, hujambo leo?',
      'Karibu kwenye programu ya Husika.',
      'Hali ya hewa ni nzuri asubuhi hii.',
    ],
  },
  {
    code: 'ti-piper',
    iso: 'er',
    name: 'Tigrinya',
    nativeName: 'ትግርኛ',
    engine: 'piper',
    voice: 'piper-ti',
    samples: [
      'ሰላም፣ ሎሚ ከመይ ኣለኻ?',
      'ናብ ኣፕልኬሽን ሁሲካ ብደሓን ምጻእ።',
      'ሎሚ ንግሆ ኩነታት ኣየር ጽቡቕ እዩ።',
    ],
  },
];

export const ALL_LANGUAGES = [...LANGUAGES, ...PIPER_LANGUAGES];

export const getLanguage = (code: string) =>
  ALL_LANGUAGES.find((l) => l.code === code);