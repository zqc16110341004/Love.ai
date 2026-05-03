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

// ── Stub: AI memory extraction ───────────────────────────────────────────────
export async function extractMemoryStub(
  existingSummary: string,
  _recentMessages: { role: string; content: string }[]
): Promise<string> {
  // TODO: call AI API to extract facts and merge with existing summary
  return existingSummary;
}
