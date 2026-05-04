import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { CharacterId } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId") as CharacterId | null;
  if (!characterId) {
    return NextResponse.json({ error: "Missing characterId" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    // Unauthenticated: client uses localStorage; return empty so UI stays consistent.
    return NextResponse.json({ summary: "" });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT summary FROM memories
      WHERE user_id = ${session.user.id} AND character_id = ${characterId}
      LIMIT 1
    `;
    return NextResponse.json({ summary: rows[0]?.summary ?? "" });
  } catch {
    return NextResponse.json({ summary: "" });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as null | { characterId?: CharacterId; summary?: string };
  const characterId = body?.characterId;
  const summary = typeof body?.summary === "string" ? body.summary : "";
  if (!characterId) {
    return NextResponse.json({ error: "Missing characterId" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO memories (user_id, character_id, summary, updated_at)
    VALUES (${session.user.id}, ${characterId}, ${summary}, now())
    ON CONFLICT (user_id, character_id)
    DO UPDATE SET summary = ${summary}, updated_at = now()
  `;

  return NextResponse.json({ ok: true });
}
