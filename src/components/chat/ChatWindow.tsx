"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, Volume2, VolumeX, Loader2 } from "lucide-react";
import type { Character, Message, CharacterId } from "@/types";
import { getLocalMemory, setLocalMemory, extractMemoryStub } from "@/lib/memory";

interface ChatWindowProps {
  character: Character;
  initialMessages?: { role: "user" | "assistant"; content: string; createdAt: string }[];
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatBeijingTime(date: Date): string {
  const beijing = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));

  const hh = String(beijing.getHours()).padStart(2, "0");
  const mm = String(beijing.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  const isToday =
    beijing.getFullYear() === now.getFullYear() &&
    beijing.getMonth() === now.getMonth() &&
    beijing.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    beijing.getFullYear() === yesterday.getFullYear() &&
    beijing.getMonth() === yesterday.getMonth() &&
    beijing.getDate() === yesterday.getDate();

  if (isToday) return timeStr;
  if (isYesterday) return `昨天 ${timeStr}`;
  return `${beijing.getMonth() + 1}月${beijing.getDate()}日 ${timeStr}`;
}

const MEMORY_TRIGGER_EVERY = 6;

export default function ChatWindow({ character, initialMessages = [] }: ChatWindowProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Use server-provided history if available, otherwise show opening message
  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages.length > 0) {
      return initialMessages.map((m) => ({
        id: generateId(),
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      }));
    }
    return [{
      id: "opening",
      role: "assistant" as const,
      content: character.openingMessage,
      createdAt: new Date(),
    }];
  });

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [memory, setMemory] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userMessageCountRef = useRef(0);
  const conversationRef = useRef<{ role: "user" | "assistant"; content: string }[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content }))
  );

  // CSS variable names for this character's accent
  const av = character.accentVar;

  // Load memory only (history is already loaded server-side)
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/memory?characterId=${character.id}`)
        .then((r) => r.json())
        .then((d) => setMemory(d.summary ?? ""))
        .catch(() => {});
    } else {
      setMemory(getLocalMemory(character.id as CharacterId));
    }
  }, [character.id, session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const saveMemory = useCallback(
    async (newSummary: string) => {
      setMemory(newSummary);
      if (session?.user) {
        await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId: character.id, summary: newSummary }),
        }).catch(() => {});
      } else {
        setLocalMemory(character.id as CharacterId, newSummary);
      }
    },
    [session, character.id]
  );

  const saveMessages = useCallback(
    async (msgs: { role: "user" | "assistant"; content: string }[]) => {
      if (!session?.user) return;
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, messages: msgs }),
      }).catch(() => {});
    },
    [session, character.id]
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking || streamingId) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };

    conversationRef.current = [
      ...conversationRef.current,
      { role: "user", content: text },
    ];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    const assistantId = generateId();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          messages: conversationRef.current,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error ${res.status}`);
      }

      setIsThinking(false);
      setStreamingId(assistantId);
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const { text } = JSON.parse(payload);
            if (text) {
              assistantContent += text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + text } : m
                )
              );
            }
          } catch {
            // Malformed SSE chunk — skip
          }
        }
      }

      conversationRef.current = [
        ...conversationRef.current,
        { role: "assistant", content: assistantContent },
      ];

      setStreamingId(null);

      // Persist this exchange to the database for logged-in users
      saveMessages([
        { role: "user", content: text },
        { role: "assistant", content: assistantContent },
      ]);

      userMessageCountRef.current += 1;
      if (userMessageCountRef.current % MEMORY_TRIGGER_EVERY === 0) {
        const recent = conversationRef.current.slice(-MEMORY_TRIGGER_EVERY * 2);
        extractMemoryStub(memory, recent).then((newSummary) => {
          if (newSummary !== memory) saveMemory(newSummary);
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setIsThinking(false);
      setStreamingId(null);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "抱歉，好像出了一点问题，稍后再试试？",
          createdAt: new Date(),
        },
      ]);
    }
  }, [input, isThinking, streamingId, character.id, memory, saveMemory, saveMessages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioPlaying === messageId) {
      setAudioPlaying(null);
      return;
    }

    setAudioLoading(messageId);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, text }),
      });

      if (!res.ok) throw new Error(`TTS error ${res.status}`);

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setAudioLoading(null);
      setAudioPlaying(messageId);

      audio.play();
      audio.onended = () => {
        setAudioPlaying(null);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setAudioPlaying(null);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (err) {
      console.error("TTS failed:", err);
      setAudioLoading(null);
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-full max-w-lg mx-auto relative"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* ─── Header ─── */}
      <header
        className="relative flex items-center gap-3 px-4 py-3.5 flex-shrink-0 z-10"
        style={{
          background: "rgba(14, 14, 26, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="p-1.5 rounded-full transition-colors cursor-pointer"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 border overflow-hidden"
          style={{
            borderColor: `var(--${av}-accent-soft)`,
            boxShadow: `0 0 12px var(--${av}-glow)`,
          }}
        >
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 15%" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-semibold leading-tight text-[15px]"
            style={{ color: "var(--text-primary)" }}
          >
            {character.name}
          </div>
          <div
            className="text-[11px] mt-0.5"
            style={{ color: `var(--${av}-accent)` }}
          >
            {character.tagline}
          </div>
        </div>

        {/* Subtle accent line at bottom of header */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-24"
          style={{
            background: `linear-gradient(90deg, transparent, var(--${av}-accent-soft), transparent)`,
          }}
        />
      </header>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5 ${
                isUser ? "msg-in-right" : "msg-in-left"
              }`}
            >
              {/* Assistant avatar */}
              {!isUser && (
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 border overflow-hidden"
                  style={{
                    borderColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <img
                    src={character.avatarUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 15%" }}
                  />
                </div>
              )}

              <div className="max-w-[78%] flex flex-col gap-1.5">
                {/* Message bubble */}
                <div
                  className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={
                    isUser
                      ? {
                          background: "rgba(255,255,255,0.08)",
                          color: "var(--text-primary)",
                          borderRadius: "18px 18px 4px 18px",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }
                      : {
                          background: `var(--${av}-accent-soft)`,
                          color: "var(--text-primary)",
                          borderRadius: "18px 18px 18px 4px",
                          border: `1px solid rgba(255,255,255,0.04)`,
                        }
                  }
                >
                  {msg.content}
                  {streamingId === msg.id && (
                    <span
                      className="inline-block w-0.5 h-4 ml-0.5 rounded-sm animate-pulse"
                      style={{ background: `var(--${av}-accent)` }}
                    />
                  )}
                </div>

                {/* Timestamp */}
                {streamingId !== msg.id && (
                  <span
                    className={`text-[10px] ${isUser ? "self-end" : "self-start"}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatBeijingTime(msg.createdAt)}
                  </span>
                )}

                {/* TTS button */}
                {!isUser && msg.content && streamingId !== msg.id && (
                  <button
                    onClick={() => handlePlayAudio(msg.id, msg.content)}
                    disabled={audioLoading === msg.id}
                    className={`self-start flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-all duration-300 disabled:opacity-40 cursor-pointer ${
                      audioPlaying === msg.id ? "pulse-ring" : ""
                    }`}
                    style={
                      audioPlaying === msg.id
                        ? {
                            color: `var(--${av}-accent)`,
                            background: `var(--${av}-accent-soft)`,
                            border: `1px solid var(--${av}-accent-soft)`,
                          }
                        : {
                            color: "var(--text-muted)",
                            background: "transparent",
                            border: "1px solid transparent",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (audioPlaying !== msg.id) {
                        e.currentTarget.style.color = `var(--${av}-accent)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (audioPlaying !== msg.id) {
                        e.currentTarget.style.color = "var(--text-muted)";
                      }
                    }}
                  >
                    {audioLoading === msg.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> 生成中...
                      </>
                    ) : audioPlaying === msg.id ? (
                      <>
                        <Volume2 className="w-3 h-3" /> 播放中
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3 h-3" /> 听他说
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex items-start gap-2.5 msg-in-left">
            <div
              className="w-8 h-8 rounded-lg border overflow-hidden flex-shrink-0"
              style={{
                borderColor: "rgba(255,255,255,0.04)",
              }}
            >
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 15%" }}
              />
            </div>
            <div
              className="px-4 py-3 flex gap-1.5"
              style={{
                background: `var(--${av}-accent-soft)`,
                borderRadius: "18px 18px 18px 4px",
                border: "1px solid rgba(255,255,255,0.04)",
                color: `var(--${av}-accent)`,
              }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Input Area ─── */}
      <div
        className="flex-shrink-0 px-4 py-3 relative z-10"
        style={{
          background: "rgba(14, 14, 26, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`和 ${character.name} 说点什么...`}
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm max-h-32 overflow-y-auto leading-relaxed transition-colors duration-300"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--text-primary)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `var(--${av}-accent-soft)`;
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isThinking || !!streamingId}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer disabled:opacity-20"
            style={{
              background: `var(--${av}-accent)`,
              color: "var(--bg-deep)",
              boxShadow: input.trim()
                ? `0 0 20px var(--${av}-glow)`
                : "none",
            }}
            aria-label="发送"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p
          className="text-center text-[10px] mt-2"
          style={{ color: "var(--text-muted)" }}
        >
          Enter 发送 · Shift+Enter 换行
        </p>
      </div>
    </div>
  );
}
