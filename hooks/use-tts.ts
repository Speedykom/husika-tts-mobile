import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { getLanguage } from '@/data/languages';
import { synthesizeSpeech } from '@/services/husika-api';
import ExpoEspeak from 'expo-espeak';

// ExpoEspeak only works inside a native Android development build.
// On web and in Expo Go it throws — we surface a friendly message instead.
const isNativeTTSAvailable = Platform.OS === 'android';

export type TTSStatus = 'idle' | 'loading' | 'playing' | 'error';

interface UseTTSOptions {
  languageCode: string;
  speed?: number;
  pitch?: number;
}

export function useTTS({ languageCode, speed = 175, pitch = 50 }: UseTTSOptions) {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeText, setActiveText] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const language = getLanguage(languageCode);

  const stop = useCallback(async () => {
    const snd = soundRef.current;
    if (snd) {
      soundRef.current = null;
      await snd.stopAsync().catch(() => null);
      await snd.unloadAsync().catch(() => null);
    }
    setStatus('idle');
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim() || !language) return;

    setError(null);
    setStatus('loading');
    setActiveText(text);

    try {
      await stop();

      if (language.engine === 'offline') {
        if (!isNativeTTSAvailable) {
          throw new Error('Offline TTS requires an Android development build. Not available in Expo Go or on web.');
        }

        await ExpoEspeak.initializeAsync();

        const { wavPath } = await ExpoEspeak.synthesizeAsync(
          text,
          language.voice,
          speed,
          pitch
        );

        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
          { uri: `file://${wavPath}` },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setStatus('playing');

        sound.setOnPlaybackStatusUpdate((ps) => {
          if (!ps.isLoaded) return;
          if (ps.didJustFinish) {
            soundRef.current = null;
            sound.unloadAsync().catch(() => null);
            setStatus('idle');
            setActiveText(null);
          }
        });
      } else {
        const audioBase64 = await synthesizeSpeech(text, language.voice);
        const tempPath = `${FileSystem.cacheDirectory}husika_tts_${Date.now()}.wav`;
        await FileSystem.writeAsStringAsync(tempPath, audioBase64, {
          encoding: 'base64',
        });

        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const { sound } = await Audio.Sound.createAsync(
          { uri: tempPath },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setStatus('playing');

        sound.setOnPlaybackStatusUpdate((ps) => {
          if (!ps.isLoaded) return;
          if (ps.didJustFinish) {
            soundRef.current = null;
            sound.unloadAsync().catch(() => null);
            FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => null);
            setStatus('idle');
            setActiveText(null);
          }
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
      setActiveText(null);
    }
  }, [language, speed, pitch, stop]);

  return { speak, stop, status, error, activeText };
}
