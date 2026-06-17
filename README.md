# Husika TTS — Mobile App

The mobile app of the **Husika early-warning platform** — preview and play
multilingual text-to-speech voices for the languages of the Greater Horn of Africa.

> **Developed by [Speedykom GmbH](https://speedykom.de)** for the Husika
> early-warning platform operated by **ICPAC** (IGAD Climate Prediction and
> Applications Centre). Produced under the **Peaceful and Resilient Borderlands
> Programme (PRBP)**, implemented by **GIZ** within the **SCIDA III** framework in
> support of **IGAD**, and **co-funded by the European Union and the German Federal
> Ministry for Economic Cooperation and Development (BMZ)**.

<p align="center">
  <img src="assets/logos/eu.png" alt="Co-funded by the European Union" height="52">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/logos/german-cooperation-bmz.png" alt="German Cooperation — BMZ" height="52">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/logos/giz.png" alt="Implemented by GIZ" height="52">
</p>

<p align="center">
  <img src="assets/logos/igad.png" alt="IGAD" height="52">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/logos/icpac.png" alt="ICPAC" height="52">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/logos/speedykom.png" alt="Developed by Speedykom" height="52">
</p>

<p align="center"><sub>
  <b>Co-funded by the European Union</b> and the German Federal Ministry for
  Economic Cooperation and Development (BMZ) &nbsp;·&nbsp; <b>Implemented by GIZ</b>
  &nbsp;·&nbsp; In partnership with IGAD &amp; ICPAC &nbsp;·&nbsp; Developed by Speedykom
</sub></p>



<div align="center">

https://github.com/user-attachments/assets/b4c1a02b-ceba-4eb3-aad6-be5314c64430

</div>


## About

Husika TTS lets you preview TTS voices across 11 languages using two synthesis engines: Speedykom Cloud for high-quality, fine-tuned models and eSpeak NG for lightweight offline fallback. The app adapts its UI based on network connectivity, hiding cloud-only voices when the device is offline.

This project is part of the Husika TTS platform, maintained by [Speedykom Group](https://speedykom.de) -- a Germany-based software company focused on digital public infrastructure and language technology.

## Features

- 11 languages: English, French, Arabic, Swahili, Amharic, Somali, Oromo, Tigrinya, Kinyarwanda, Kirundi, Luganda
- Two TTS engines: Speedykom Cloud (requires network) and eSpeak NG (offline)
- Network-aware UI -- cloud voices are hidden when offline, with status banners and retry
- Search and filter languages by name or engine type (All, Cloud, Offline)
- Per-language detail screen with sample phrases and custom text input
- Material Design 3 theming

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native 0.81, Expo 54 |
| Navigation | Expo Router 6 (file-based routing) |
| UI | React Native Paper (Material Design 3) |
| State | TanStack React Query 5 |
| Networking | @react-native-community/netinfo |
| Language | TypeScript 5.9 |
| Linting | ESLint with eslint-config-expo |

React Compiler and the New Architecture are enabled.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

```bash
git clone <repository-url>
cd husika-tts-mobile
npm install
```

### Running the app

```bash
npx expo start
```

From the dev server, press:
- `a` to open on Android (emulator or device)
- `i` to open on iOS (simulator or device)
- `w` to open in a web browser

You can also run on a physical device using [Expo Go](https://expo.dev/go) or a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

## Project Structure

```
.
├── app/                       # Screens (file-based routing)
│   ├── _layout.tsx            # Root layout with providers
│   ├── index.tsx              # Welcome screen
│   ├── languages.tsx          # Language list with search and filters
│   └── language/
│       └── [code].tsx         # Language detail (samples, custom input)
├── components/                # Reusable UI components
│   └── ui/                    # Low-level UI primitives
├── constants/
│   └── theme.ts               # Color and font constants
├── data/
│   └── languages.ts           # Language definitions and voice mappings
├── hooks/
│   └── use-network-status.ts  # Network connectivity hook
├── theme/
│   └── paper-theme.ts         # Material Design 3 theme config
├── assets/images/             # App icon, logos
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── tsconfig.json              # TypeScript config (uses @/* path alias)
└── package.json
```

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on Web |
| `npm run lint` | Run ESLint |
| `npm run reset-project` | Reset to a blank app directory |

## Credits & License

**Developed by Speedykom GmbH** for the Husika early-warning platform operated by
**ICPAC** (IGAD Climate Prediction and Applications Centre). Produced under the
**Peaceful and Resilient Borderlands Programme (PRBP)**, implemented by **GIZ**
within the **SCIDA III** framework in support of **IGAD**, and **co-funded by the
European Union and the German Federal Ministry for Economic Cooperation and
Development (BMZ)**.

Copyright (c) 2026 Speedykom GmbH and Deutsche Gesellschaft für Internationale
Zusammenarbeit (GIZ) GmbH. Licensed under the Apache License 2.0 — see
[LICENSE](./LICENSE). Attribution that must be preserved in derivative works is
listed in [NOTICE](./NOTICE).

> **Disclaimer.** Views and opinions expressed are those of the authors only and
> do not necessarily reflect those of the European Union, BMZ, GIZ, IGAD or ICPAC.
> Neither the European Union nor any other funding or implementing party can be
> held responsible for them.
