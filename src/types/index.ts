export type CharacterId = "wenyi" | "zhinan" | "tianzui" | "badao";

export interface Character {
  id: CharacterId;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  // Visual theme
  accentVar: string;         // CSS variable name for this character's accent (e.g. "wenyi")
  avatarEmoji: string;
  avatarUrl?: string;        // Character portrait image path (public/avatars/xxx.jpg)
  coverLine: string;         // Poetic one-liner for homepage card
  relationship: string;      // Short context, e.g. "大学文学社学长"
  cardGradient: string;      // CSS gradient for card background (fallback when no image)
  openingMessage: string;    // First message user sees when entering chat
  mockReplies: string[];     // Placeholder replies used before real API
  systemPromptHint: string;  // Placeholder — real prompt injected later
  ttsVoice: string;          // SiliconFlow preset voice
  ttsSpeed: number;          // Speech speed: 0.25–4.0, default 1.0

  // Legacy compat
  gradient: string;
  accentColor: string;
  bubbleColor: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  audioUrl?: string;
}

export interface Memory {
  userId: string;
  characterId: CharacterId;
  summary: string;
  updatedAt: Date;
}
