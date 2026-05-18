const BASE_URL = process.env.EXPO_PUBLIC_HUSIKA_BASE_URL;
const API_KEY = process.env.EXPO_PUBLIC_HUSIKA_API_KEY;

export async function synthesizeSpeech(
  text: string,
  lang_code: string,
  speed = 1,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY!,
    },
    body: JSON.stringify({ text, lang_code, speed }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Husika API error ${res.status}: ${errText}`);
  }

  const raw = await res.text();
  const data = JSON.parse(raw);

  if (!data || !data.audio_base64) {
    throw new Error(`Bad response: ${raw.slice(0, 200)}`);
  }

  return data.audio_base64 as string;
}
