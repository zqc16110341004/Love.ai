import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/characters";
import ChatWindow from "@/components/chat/ChatWindow";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ characterId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { characterId } = await params;
  const character = getCharacter(characterId);
  if (!character) notFound();

  const session = await auth();
  let initialMessages: { role: "user" | "assistant"; content: string; createdAt: string }[] = [];

  if (session?.user?.id) {
    try {
      const sql = getDb();
      const rows = await sql`
        SELECT role, content, created_at
        FROM messages
        WHERE user_id = ${session.user.id} AND character_id = ${characterId}
        ORDER BY created_at ASC
        LIMIT 200
      `;
      initialMessages = rows.map((r) => ({
        role: r.role as "user" | "assistant",
        content: r.content,
        createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch {
      // Non-fatal — show opening message instead
    }
  }

  return <ChatWindow character={character} initialMessages={initialMessages} />;
}
