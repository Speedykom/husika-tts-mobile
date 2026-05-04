export type Engine = 'cloud' | 'offline';

export interface Language {
  code: string;
  iso: string;          // ISO 3166-1 alpha-2 (lowercase) for the flag
  name: string;         // English name
  nativeName: string;   // Native script
  engine: Engine;       // 'cloud' = Speedykom, 'offline' = eSpeak NG
  voice: string;        // mock voice tag
  samples: string[];
}

export const LANGUAGES: Language[] = [
  {
    code: 'en',
    iso: 'gb',
    name: 'English',
    nativeName: 'English',
    engine: 'cloud',
    voice: 'speedykom-en-v2',
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
    voice: 'speedykom-fr-v1',
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
    voice: 'speedykom-ar-v1',
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
    voice: 'speedykom-sw-v1',
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
    voice: 'speedykom-am-v1',
    samples: [
      'ሰላም፣ ዛሬ እንዴት ነህ?',
      'ወደ ሁሲካ መተግበሪያ እንኳን በደህና መጡ።',
      'ዛሬ ጠዋት የአየር ሁኔታ ቆንጆ ነው።',
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

export const getLanguage = (code: string) =>
  LANGUAGES.find((l) => l.code === code);