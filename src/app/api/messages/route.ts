import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ messages: [] });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");
  if (!characterId) {
    return NextResponse.json({ error: "Missing characterId" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT role, content, created_at
    FROM messages
    WHERE user_id = ${session.user.id} AND character_id = ${characterId}
    ORDER BY created_at ASC
    LIMIT 200
  `;

  return NextResponse.json({
    messages: rows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId, messages } = await request.json();
  if (!characterId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sql = getDb();
  for (const msg of messages) {
    await sql`
      INSERT INTO messages (user_id, character_id, role, content)
      VALUES (${session.user.id}, ${characterId}, ${msg.role}, ${msg.content})
    `;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");
  if (!characterId) {
    return NextResponse.json({ error: "Missing characterId" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    DELETE FROM messages
    WHERE user_id = ${session.user.id} AND character_id = ${characterId}
  `;

  return NextResponse.json({ ok: true });
}
