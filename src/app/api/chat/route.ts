import { auth } from "@/lib/auth";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/systemPrompts";
import { getMemoryFromDb } from "@/lib/memory";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

export async function POST(request: Request) {
  const { characterId, messages } = await request.json();

  const character = getCharacter(characterId);
  if (!character) {
    return new Response(JSON.stringify({ error: "Character not found" }), { status: 400 });
  }

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
