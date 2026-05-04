import { NextResponse } from "next/server";
import type { CharacterId } from "@/types";
import { extractMemoryStub } from "@/lib/memory";

function heuristicSummary(localSummary: string, recentMessages: { role: "user" | "assistant"; content: string }[]) {
  const userLines = recentMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);

  const joined = userLines.join("；");
  const base = localSummary.trim();
  const next = base ? `${base}；${joined}` : joined;
  return next.slice(0, 200);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | null
    | {
        characterId?: CharacterId;
        recentMessages?: { role: "user" | "assistant"; content: string }[];
        localSummary?: string;
      };

  const characterId = body?.characterId;
  const recentMessages = Array.isArray(body?.recentMessages) ? body?.recentMessages : [];
  const localSummary = typeof body?.localSummary === "string" ? body.localSummary : "";

  if (!characterId) {
    return NextResponse.json({ error: "Missing characterId" }, { status: 400 });
  }

  const hasAi = Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY);
  const summary = hasAi
    ? await extractMemoryStub(localSummary, recentMessages)
    : heuristicSummary(localSummary, recentMessages);
  return NextResponse.json({ summary });
}
