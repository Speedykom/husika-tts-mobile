import { requireNativeModule } from 'expo-modules-core';

export interface SynthesizeResult {
  wavPath: string;
  durationMs: number;
}

interface EspeakNativeModule {
  initializeAsync(): Promise<void>;
  synthesizeAsync(
    text: string,
    voice: string,
    speed: number,
    pitch: number
  ): Promise<SynthesizeResult>;
}

const ExpoEspeak = requireNativeModule<EspeakNativeModule>('ExpoEspeak');

export default ExpoEspeak;
