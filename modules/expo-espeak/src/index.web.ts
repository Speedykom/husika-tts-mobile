import type { SynthesizeResult } from './index';

// Web stub — eSpeak NG is Android-only; this prevents the native module
// lookup from crashing on web and in the Expo Go simulator.
const ExpoEspeakWebStub = {
  initializeAsync: async (): Promise<void> => {
    throw new Error('eSpeak NG offline TTS is not supported on web.');
  },
  synthesizeAsync: async (
    _text: string,
    _voice: string,
    _speed: number,
    _pitch: number
  ): Promise<SynthesizeResult> => {
    throw new Error('eSpeak NG offline TTS is not supported on web.');
  },
};

export default ExpoEspeakWebStub;
