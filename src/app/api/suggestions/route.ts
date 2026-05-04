import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt } from "@/lib/systemPrompts";
import type { CharacterId } from "@/types";

function fallbackSuggestions(characterId: CharacterId, lastAssistant: string, lastUser: string) {
  const base: Record<CharacterId, string[]> = {
    wenyi: ["你刚刚那句话很戳我。", "我想把今天讲给你听。", "我有点难过，你抱抱我。", "你现在在做什么？", "你会怎么安慰我？", "我们聊聊你吧。"],
    zhinan: ["我有点累。", "我需要你陪我一会儿。", "你在吗？", "给我一句话就行。", "你觉得我该怎么做？", "今天不太顺。"],
    tianzui: ["我也想你了～", "抱抱我嘛。", "夸夸我！", "你今天有没有想我？", "我们玩个小游戏？", "给我讲个甜甜的。"],
    badao: ["我不开心。", "你哄我。", "今天有人让我委屈了。", "你在等我吗？", "你说，我该怎么办。", "我想听你叫我名字。"],
  };

  // tiny keyword adaptation
  const ctx = `${lastAssistant}\n${lastUser}`;
  if (/累|困|加班|睡/.test(ctx)) return base[characterId].slice(0, 5).map((s) => s.replace("陪我一会儿", "陪我到睡着"));
  if (/难过|委屈|哭|崩溃|烦/.test(ctx)) return ["我有点撑不住了。", "你先抱抱我。", "我需要你安慰我。", "你别走，好吗？", "我想听你说我没事。"];
  if (/开心|好消息|顺利/.test(ctx)) return ["我想和你分享一件事！", "你夸夸我嘛。", "我现在心情很好。", "你也说说你的好事。", "今晚我们庆祝一下？"];

  return base[characterId].slice(0, 5);
}

function normalizeList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .map((s) => s.replace(/^["“”]+|["“”]+$/g, ""))
    .slice(0, 5);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | null
    | {
        characterId?: CharacterId;
        recentMessages?: { role: "user" | "assistant"; content: string }[];
        memorySummary?: string;
      };

  const characterId = body?.characterId;
  const recentMessages = Array.isArray(body?.recentMessages) ? body?.recentMessages : [];
  const memorySummary = typeof body?.memorySummary === "string" ? body.memorySummary : "";

  if (!characterId) {
    return NextResponse.json({ error: "Missing characterId" }, { status: 400 });
  }

  const character = getCharacter(characterId);
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 400 });
  }

  const lastUser = [...recentMessages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistant = [...recentMessages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  const hasAi = Boolean(process.env.AI_API_KEY && process.env.AI_BASE_URL);
  if (!hasAi) {
    return NextResponse.json({ suggestions: fallbackSuggestions(characterId, lastAssistant, lastUser) });
  }

  const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
  });

  const systemPrompt = buildSystemPrompt(character, memorySummary);
  const context = recentMessages
    .slice(-12)
    .map((m) => `${m.role === "user" ? "用户" : "男友"}: ${m.content}`)
    .join("\n");

  const prompt = `你要为“用户”生成下一步可直接发送的回复建议，帮助她在当下语境里自然接话。

要求：
- 输出严格的 JSON 数组（例如 ["...","..."]），不要任何额外文字
- 生成 5 条中文短句（每条 6-18 字左右），适合手机一键点击发送
- 5 条彼此差异明显：至少包含 1 条追问、1 条表达情绪/需求、1 条轻松互动/玩笑
- 贴合男友的人设与当前对话，不要像模板
- 不要出现“作为AI/模型/系统”等出戏措辞

最近对话：
${context}

请输出 JSON 数组：`;

  try {
    const resp = await client.chat.completions.create({
      model: process.env.AI_MODEL ?? "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw);
    const suggestions = normalizeList(parsed);
    if (suggestions.length >= 3) {
      return NextResponse.json({ suggestions });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ suggestions: fallbackSuggestions(characterId, lastAssistant, lastUser) });
}

