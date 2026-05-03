import type { CharacterId } from "@/types";
import { getDb } from "./db";

const LOCAL_KEY = (characterId: CharacterId) => `memory_${characterId}`;

// ── Local storage (unauthenticated users) ────────────────────────────────────

export function getLocalMemory(characterId: CharacterId): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LOCAL_KEY(characterId)) ?? "";
}

export function setLocalMemory(characterId: CharacterId, summary: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY(characterId), summary);
}

// ── Neon database (authenticated users) ──────────────────────────────────────

export async function getMemoryFromDb(
  userId: string,
  characterId: CharacterId
): Promise<string> {
  const sql = getDb();
  const rows = await sql`
    SELECT summary FROM memories
    WHERE user_id = ${userId} AND character_id = ${characterId}
    LIMIT 1
  `;
  return rows[0]?.summary ?? "";
}

export async function upsertMemoryToDb(
  userId: string,
  characterId: CharacterId,
  summary: string
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO memories (user_id, character_id, summary, updated_at)
    VALUES (${userId}, ${characterId}, ${summary}, now())
    ON CONFLICT (user_id, character_id)
    DO UPDATE SET summary = ${summary}, updated_at = now()
  `;
}

// ── AI memory extraction ─────────────────────────────────────────────────────
export async function extractMemoryStub(
  existingSummary: string,
  recentMessages: { role: string; content: string }[]
): Promise<string> {
  if (recentMessages.length === 0) return existingSummary;

  const conversation = recentMessages
    .map((m) => `${m.role === "user" ? "用户" : "男友"}: ${m.content}`)
    .join("\n");

  const prompt = `你是一个记忆提取助手。根据下面的对话，提炼出关于"用户"的重要信息（喜好、情绪、生活状态、提到的事件等），与已有记忆合并，生成简洁的记忆摘要（不超过200字）。只输出摘要本身，不要有任何解释。

已有记忆：
${existingSummary || "（暂无）"}

最新对话：
${conversation}

更新后的记忆摘要：`;

  try {
    const res = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });
    if (!res.ok) return existingSummary;
    const data = await res.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();
    return newSummary || existingSummary;
  } catch {
    return existingSummary;
  }
}
