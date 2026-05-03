import { getCharacter } from "@/lib/characters";
import { NextResponse } from "next/server";

const TTS_BASE = process.env.TTS_BASE_URL ?? "https://api.siliconflow.cn";
const TTS_KEY = process.env.TTS_API_KEY!;
const TTS_MODEL = process.env.TTS_MODEL ?? "fnlp/MOSS-TTSD-v0.5";

export async function POST(request: Request) {
  const { characterId, text } = await request.json();

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const character = getCharacter(characterId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 400 });
  }

  // SiliconFlow supports up to 128k chars; trim to reasonable length for chat
  const trimmedText = text.slice(0, 500);

  const res = await fetch(`${TTS_BASE}/v1/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TTS_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: trimmedText,
      voice: `${TTS_MODEL}:${character.ttsVoice}`,
      response_format: "mp3",
      stream: false,
      speed: character.ttsSpeed ?? 1.0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[TTS] SiliconFlow error ${res.status}:`, err);
    return NextResponse.json(
      { error: `TTS failed: ${res.status}` },
      { status: 500 }
    );
  }

  // Proxy binary audio directly to the client
  const audioBuffer = await res.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
