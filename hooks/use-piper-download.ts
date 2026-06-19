import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";

import { PIPER_MODEL_URLS } from "@/data/languages";

export type PiperDownloadState =
  | "idle"
  | "downloading"
  | "downloaded"
  | "error";

const STORAGE_KEY = (code: string) => `@piper_model_${code}`;

export const PIPER_MODELS_DIR = `${FileSystem.documentDirectory}piper-models/`;

export function getPiperModelPath(filename: string) {
  return `${PIPER_MODELS_DIR}${filename}.onnx`;
}

export function usePiperDownload(languageCode: string) {
  const [state, setState] = useState<PiperDownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeDownload = useRef<FileSystem.DownloadResumable | null>(null);

  const spec = PIPER_MODEL_URLS[languageCode];

  useEffect(() => {
    if (!spec) return;
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY(languageCode)).then(async (val) => {
      if (cancelled || val !== "downloaded") return;
      const info = await FileSystem.getInfoAsync(
        getPiperModelPath(spec.filename),
      );
      if (cancelled) return;
      if (info.exists) {
        setState("downloaded");
        setProgress(1);
      } else {
        // File was deleted externally — clear stale flag
        await AsyncStorage.removeItem(STORAGE_KEY(languageCode));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [languageCode, spec]);

  const startDownload = useCallback(async () => {
    if (!spec || state === "downloading") return;

    setState("downloading");
    setProgress(0);
    setError(null);

    try {
      await FileSystem.makeDirectoryAsync(PIPER_MODELS_DIR, {
        intermediates: true,
      });

      const onnxPath = getPiperModelPath(spec.filename);
      const configPath = `${PIPER_MODELS_DIR}${spec.filename}.onnx.json`;

      await new Promise<void>((resolve, reject) => {
        const dl = FileSystem.createDownloadResumable(
          spec.onnx,
          onnxPath,
          {},
          ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            if (totalBytesExpectedToWrite > 0) {
              setProgress(
                (totalBytesWritten / totalBytesExpectedToWrite) * 0.9,
              );
            }
          },
        );
        activeDownload.current = dl;
        dl.downloadAsync()
          .then(() => resolve())
          .catch(reject);
      });

      activeDownload.current = null;

      const configDl = FileSystem.createDownloadResumable(
        spec.config,
        configPath,
        {},
        () => setProgress(0.95),
      );
      await configDl.downloadAsync();

      setProgress(1);
      await AsyncStorage.setItem(STORAGE_KEY(languageCode), "downloaded");
      setState("downloaded");
    } catch (e) {
      activeDownload.current = null;
      const msg = e instanceof Error ? e.message : "Download failed";
      setError(msg);
      setState("error");
    }
  }, [languageCode, spec, state]);

  const cancelDownload = useCallback(async () => {
    try {
      await activeDownload.current?.pauseAsync();
    } catch {
      /* ignore */
    }
    activeDownload.current = null;
    setState("idle");
    setProgress(0);
  }, []);

  const modelPath =
    state === "downloaded" && spec ? getPiperModelPath(spec.filename) : null;

  return { state, progress, startDownload, cancelDownload, modelPath, error };
}
