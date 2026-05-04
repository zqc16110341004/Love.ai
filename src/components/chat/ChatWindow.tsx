"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, Volume2, VolumeX, Loader2, RotateCcw, BookHeart, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Character, Message, CharacterId } from "@/types";
import { getLocalMemory, setLocalMemory } from "@/lib/memory";

/* ─── 入场过场画面 ─── */
function ChatIntro({ character, onComplete }: { character: Character; onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2200);
    return () => clearTimeout(t);
  }, [onComplete]);

  const av = character.accentVar;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      style={{ background: "var(--bg-deep)" }}
    >
      {/* 模糊背景 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${character.avatarUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center 15%",
          filter: "blur(24px)",
          opacity: 0.18,
          transform: "scale(1.12)",
        }}
      />
      {/* 渐变遮罩 */}
      <div className="absolute inset-0" style={{ background: character.cardGradient, opacity: 0.55 }} />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(8,8,15,0.7) 100%)",
        }}
      />

      {/* 中心内容 */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* 头像光圈 */}
        <motion.div
          className="relative"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* 脉冲光晕 */}
          <motion.div
            className="absolute -inset-3 rounded-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: `radial-gradient(circle, var(--${av}-glow) 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
          <div
            className="w-28 h-28 rounded-2xl overflow-hidden border-2"
            style={{
              borderColor: `var(--${av}-accent-soft)`,
              boxShadow: `0 0 32px var(--${av}-glow), 0 8px 32px rgba(0,0,0,0.4)`,
            }}
          >
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 15%" }}
            />
          </div>
        </motion.div>

        {/* 名字 + 标语 */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2
            className="text-3xl font-bold tracking-wide"
            style={{
              color: "#fff",
              fontFamily: "var(--font-display), 'Songti SC', serif",
              textShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            {character.name}
          </h2>
          <p className="text-sm mt-1.5" style={{ color: `var(--${av}-accent)` }}>
            {character.relationship}
          </p>
        </motion.div>

        {/* 连接状态 */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ background: `var(--${av}-accent)` }}
          />
          <span className="text-xs tracking-widest" style={{ color: "var(--text-muted)" }}>
            正在连接
          </span>
          <motion.span
            className="text-xs tracking-widest"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            style={{ color: "var(--text-muted)" }}
          >
            · · ·
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── 记忆面板 ─── */
function MemoryPanel({
  character,
  memory,
  onClose,
}: {
  character: Character;
  memory: string;
  onClose: () => void;
}) {
  const av = character.accentVar;

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* 半透明背景 */}
      <div className="absolute inset-0" style={{ background: "rgba(8,8,15,0.7)", backdropFilter: "blur(4px)" }} />

      {/* 面板主体 */}
      <motion.div
        className="relative rounded-t-3xl overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-deep)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none" }}
      >
        {/* 顶部渐变装饰 */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: `linear-gradient(180deg, var(--${av}-accent-soft) 0%, transparent 100%)`, opacity: 0.5 }}
        />

        <div className="relative z-10 px-5 pt-5 pb-8">
          {/* 拖动条 */}
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "rgba(255,255,255,0.15)" }} />

          {/* 标题行 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden border flex-shrink-0"
                style={{ borderColor: `var(--${av}-accent-soft)`, boxShadow: `0 0 12px var(--${av}-glow)` }}
              >
                <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" style={{ objectPosition: "center 15%" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>他记得关于你的</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{character.name} 的记忆</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 记忆内容 */}
          {memory ? (
            <div
              className="rounded-2xl p-4 text-sm leading-relaxed"
              style={{
                background: `var(--${av}-accent-soft)`,
                border: `1px solid rgba(255,255,255,0.05)`,
                color: "var(--text-secondary)",
              }}
            >
              <div className="flex items-start gap-2">
                <BookHeart className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: `var(--${av}-accent)` }} />
                <p>{memory}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `var(--${av}-accent-soft)` }}
              >
                <BookHeart className="w-6 h-6" style={{ color: `var(--${av}-accent)` }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>还没有记忆</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>多聊一会儿，他会慢慢了解你</p>
              </div>
            </div>
          )}

          <p className="text-center text-[11px] mt-4" style={{ color: "var(--text-muted)" }}>
            每隔几条消息，记忆会自动更新
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── 记忆更新 Toast ─── */
function MemoryToast({
  character,
  onDone,
  onClick,
}: {
  character: Character;
  onDone: () => void;
  onClick: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute top-16 left-0 right-0 z-30 flex justify-center px-4"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs cursor-pointer"
        onClick={onClick}
        style={{
          background: `var(--${character.accentVar}-accent-soft)`,
          border: `1px solid rgba(255,255,255,0.08)`,
          color: `var(--${character.accentVar}-accent)`,
          backdropFilter: "blur(12px)",
        }}
      >
        <BookHeart className="w-3.5 h-3.5" />
        <span>他好像记住了你说的话 · 点我查看</span>
      </button>
    </motion.div>
  );
}

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

  const hasHistory = initialMessages.length > 0;
  const shouldShowIntro = !hasHistory;

  // "intro" → 过场动画中；"chat" → 正常聊天
  const [phase, setPhase] = useState<"intro" | "chat">(() =>
    shouldShowIntro ? "intro" : "chat"
  );

  // 开场白打字机进度（仅新对话用）
  const [typingDone, setTypingDone] = useState(!shouldShowIntro);

  // Use server-provided history if available, otherwise show opening message
  const [messages, setMessages] = useState<Message[]>(() => {
    if (hasHistory) {
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
      content: "",          // 过场结束后再打字
      createdAt: new Date(),
    }];
  });

  // 过场结束 → 打字机效果打出开场白
  useEffect(() => {
    if (phase !== "chat" || !shouldShowIntro) return;
    const text = character.openingMessage;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      const slice = text.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.id === "opening" ? { ...m, content: slice } : m))
      );
      if (i >= text.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 38);
    return () => clearInterval(interval);
  }, [phase, character.openingMessage, shouldShowIntro]);

  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showMemoryToast, setShowMemoryToast] = useState(false);

  const [input, setInput] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [memory, setMemory] = useState("");
  const memoryRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userMessageCountRef = useRef(0);
  const lastSuggestionSetRef = useRef<string>(""); // used to avoid showing the exact same chips repeatedly
  const lastSuggestionKeyRef = useRef<string>("");
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
    memoryRef.current = memory;
  }, [memory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const saveMemory = useCallback(
    async (newSummary: string) => {
      const hadMemoryBefore = Boolean(memoryRef.current.trim());
      setMemory(newSummary);
      setShowMemoryToast(true);

      if (!hadMemoryBefore && newSummary.trim()) {
        window.setTimeout(() => setShowMemoryPanel(true), 550);
      }

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

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
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

      // Prompt non-logged-in users to sign in after 5 messages
      if (!session?.user && userMessageCountRef.current === 5) {
        setShowLoginPrompt(true);
      }

      if (userMessageCountRef.current % MEMORY_TRIGGER_EVERY === 0) {
        const recent = conversationRef.current.slice(-MEMORY_TRIGGER_EVERY * 2);
        fetch("/api/memory/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            characterId: character.id,
            recentMessages: recent,
            localSummary: memory,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.summary && d.summary !== memory) saveMemory(d.summary);
          })
          .catch(() => {});
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

  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const refreshSuggestions = useCallback(async () => {
    // Keep requests bounded + avoid re-asking for the exact same context.
    const recent = conversationRef.current.slice(-12);
    const key = JSON.stringify({
      c: character.id,
      m: memoryRef.current,
      r: recent,
    });
    if (key === lastSuggestionKeyRef.current) return;
    lastSuggestionKeyRef.current = key;

    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          recentMessages: recent,
          memorySummary: memoryRef.current,
        }),
      });
      const data = await res.json();
      const list = Array.isArray(data?.suggestions) ? data.suggestions.filter((s: unknown) => typeof s === "string") : [];
      const normalized = list.map((s: string) => s.trim()).filter(Boolean).slice(0, 5);
      const signature = normalized.join("|");
      if (normalized.length > 0 && signature !== lastSuggestionSetRef.current) {
        lastSuggestionSetRef.current = signature;
        setReplySuggestions(normalized);
      }
    } catch {
      // ignore — keep existing suggestions
    } finally {
      setSuggestionsLoading(false);
    }
  }, [character.id]);

  // Re-roll suggestions after each assistant reply completes (stream ends)
  useEffect(() => {
    if (streamingId) return;
    // When thinking, we don't want to distract; wait until the assistant message is done.
    if (isThinking) return;
    refreshSuggestions();
  }, [messages.length, streamingId, isThinking, refreshSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearChat = useCallback(async () => {
    if (session?.user) {
      await fetch(`/api/messages?characterId=${character.id}`, { method: "DELETE" }).catch(() => {});
    } else {
      // Clear local memory too
      setLocalMemory(character.id as CharacterId, "");
    }
    setMessages([{
      id: generateId(),
      role: "assistant",
      content: character.openingMessage,
      createdAt: new Date(),
    }]);
    conversationRef.current = [];
    userMessageCountRef.current = 0;
    setMemory("");
    setShowClearConfirm(false);
    setShowLoginPrompt(false);
  }, [session, character.id, character.openingMessage]);

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
      {/* ─── 入场过场画面 ─── */}
      <AnimatePresence>
        {phase === "intro" && (
          <ChatIntro character={character} onComplete={() => setPhase("chat")} />
        )}
      </AnimatePresence>

      {/* ─── 记忆面板 ─── */}
      <AnimatePresence>
        {showMemoryPanel && (
          <MemoryPanel character={character} memory={memory} onClose={() => setShowMemoryPanel(false)} />
        )}
      </AnimatePresence>

      {/* ─── 记忆更新 Toast ─── */}
      <AnimatePresence>
        {showMemoryToast && (
          <MemoryToast
            character={character}
            onDone={() => setShowMemoryToast(false)}
            onClick={() => {
              setShowMemoryToast(false);
              setShowMemoryPanel(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <motion.header
        className="relative flex items-center gap-3 px-4 py-3.5 flex-shrink-0 z-10"
        initial={shouldShowIntro ? { opacity: 0, y: -14 } : false}
        animate={phase === "chat" ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
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

        {/* 记忆入口 */}
        <button
          onClick={() => setShowMemoryPanel(true)}
          className="p-1.5 rounded-full transition-colors cursor-pointer flex-shrink-0 relative"
          style={{ color: memory ? `var(--${av}-accent)` : "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = `var(--${av}-accent)`)}
          onMouseLeave={(e) => (e.currentTarget.style.color = memory ? `var(--${av}-accent)` : "var(--text-muted)")}
          aria-label="查看记忆"
        >
          <BookHeart className="w-4 h-4" />
          {memory && (
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{ background: `var(--${av}-accent)` }}
            />
          )}
        </button>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="p-1.5 rounded-full transition-colors cursor-pointer flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          aria-label="重新开始"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-24"
          style={{
            background: `linear-gradient(90deg, transparent, var(--${av}-accent-soft), transparent)`,
          }}
        />
      </motion.header>

      {/* ─── Messages ─── */}
      <motion.div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
        initial={shouldShowIntro ? { opacity: 0 } : false}
        animate={phase === "chat" ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isOpeningTyping = msg.id === "opening" && !typingDone;
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5 ${
                isUser ? "msg-in-right" : "msg-in-left"
              }`}
            >
              {!isUser && (
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 border overflow-hidden"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
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
                  {/* 流式输出光标 */}
                  {streamingId === msg.id && (
                    <span
                      className="inline-block w-0.5 h-4 ml-0.5 rounded-sm animate-pulse"
                      style={{ background: `var(--${av}-accent)` }}
                    />
                  )}
                  {/* 打字机光标（开场白） */}
                  {isOpeningTyping && (
                    <span
                      className="inline-block w-0.5 h-4 ml-0.5 rounded-sm animate-pulse"
                      style={{ background: `var(--${av}-accent)` }}
                    />
                  )}
                </div>

                {streamingId !== msg.id && !isOpeningTyping && (
                  <span
                    className={`text-[10px] ${isUser ? "self-end" : "self-start"}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatBeijingTime(msg.createdAt)}
                  </span>
                )}

                {!isUser && msg.content && streamingId !== msg.id && !isOpeningTyping && (
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
                      if (audioPlaying !== msg.id)
                        e.currentTarget.style.color = `var(--${av}-accent)`;
                    }}
                    onMouseLeave={(e) => {
                      if (audioPlaying !== msg.id)
                        e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    {audioLoading === msg.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> 生成中...</>
                    ) : audioPlaying === msg.id ? (
                      <><Volume2 className="w-3 h-3" /> 播放中</>
                    ) : (
                      <><VolumeX className="w-3 h-3" /> 听他说</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-start gap-2.5 msg-in-left">
            <div
              className="w-8 h-8 rounded-lg border overflow-hidden flex-shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
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

        {showLoginPrompt && (
          <div
            className="mx-2 mb-2 rounded-2xl p-4 flex flex-col gap-3 msg-in-left"
            style={{
              background: `var(--${av}-accent-soft)`,
              border: `1px solid rgba(255,255,255,0.08)`,
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                登录后保存这段对话 💌
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                不登录的话，关掉页面这段聊天记录就消失了。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/login")}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ background: `var(--${av}-accent)`, color: "var(--bg-deep)" }}
              >
                立即登录 / 注册
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="px-3 py-2 rounded-xl text-xs transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
              >
                稍后再说
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </motion.div>

      {/* ─── Clear Confirm Dialog ─── */}
      {showClearConfirm && (
        <div
          className="flex-shrink-0 px-4 py-3 z-20"
          style={{
            background: "rgba(14,14,26,0.95)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-sm text-center mb-3" style={{ color: "var(--text-secondary)" }}>
            清空后无法恢复，确定重置这段对话吗？
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearChat}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.25)" }}
            >
              确认清空
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* ─── Input Area ─── */}
      <motion.div
        className="flex-shrink-0 px-4 py-3 relative z-10"
        initial={shouldShowIntro ? { opacity: 0, y: 14 } : false}
        animate={phase === "chat" ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: "rgba(14, 14, 26, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* ─── First-time reply suggestions ─── */}
        {phase === "chat" && typingDone && !isThinking && !streamingId && input.trim().length === 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--text-muted)" }}>
                不知道怎么回？试试这些
              </span>
              <button
                type="button"
                className="text-[10px] px-2 py-1 rounded-full transition-colors cursor-pointer"
                style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                onClick={() => {
                  inputRef.current?.focus();
                }}
              >
                自己输入
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestionsLoading && replySuggestions.length === 0 && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 px-3 py-2 rounded-full text-xs"
                      style={{
                        background: "rgba(255,255,255,0.035)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "transparent",
                        minWidth: 82,
                      }}
                    >
                      占位
                    </div>
                  ))}
                </>
              )}

              {replySuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  disabled={isThinking || !!streamingId}
                  className="flex-shrink-0 px-3 py-2 rounded-full text-xs transition-all cursor-pointer disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--${av}-accent-soft)`;
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

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
              boxShadow: input.trim() ? `0 0 20px var(--${av}-glow)` : "none",
            }}
            aria-label="发送"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
          Enter 发送 · Shift+Enter 换行
        </p>
      </motion.div>
    </div>
  );
}
