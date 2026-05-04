import { auth } from "@/lib/auth";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/systemPrompts";
import { getMemoryFromDb } from "@/lib/memory";
import OpenAI from "openai";

function streamText(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for (const ch of text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: ch })}\n\n`));
          await new Promise((r) => setTimeout(r, 8));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const { characterId, messages } = await request.json();

  const character = getCharacter(characterId);
  if (!character) {
    return new Response(JSON.stringify({ error: "Character not found" }), { status: 400 });
  }

  // Dev-friendly fallback: if AI credentials are missing, reply with a character mock.
  // This keeps local demo flows (memory, TTS UI, etc.) usable without env setup.
  if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL) {
    const fallback =
      character.mockReplies?.[
        Math.floor(Math.random() * Math.max(character.mockReplies.length, 1))
      ] ??
      "我在。你先说说，今天发生了什么？";
    return new Response(streamText(fallback), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  });

  // Load memory for logged-in users
  let memory = "";
  const session = await auth();
  if (session?.user?.id) {
    try {
      memory = await getMemoryFromDb(session.user.id, characterId);
    } catch {
      // Non-fatal — proceed without memory
    }
  }

  const systemPrompt = buildSystemPrompt(character, memory);

  const stream = await client.chat.completions.create({
    model: process.env.AI_MODEL ?? "deepseek-v4-flash",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.9,
    max_tokens: 512,
  });

  // Stream the response as Server-Sent Events
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
