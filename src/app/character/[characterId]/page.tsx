"use client";

import { useParams, useRouter } from "next/navigation";
import { getCharacter } from "@/lib/characters";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function CharacterPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const router = useRouter();
  const character = getCharacter(characterId);

  if (!character) {
    router.push("/");
    return null;
  }

  const av = character.accentVar;

  return (
    <div
      className="min-h-screen w-full max-w-lg mx-auto flex flex-col relative overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* Full-bleed portrait */}
      <div className="relative h-[60vh] flex-shrink-0">
        <img
          src={character.avatarUrl}
          alt={character.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 15%" }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,8,15,0.3) 0%, rgba(8,8,15,0) 40%, rgba(8,8,15,0.7) 75%, rgba(8,8,15,1) 100%)",
          }}
        />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-10">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.8)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {/* Online badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#ff4757", boxShadow: "0 0 6px rgba(255,71,87,0.6)" }}
            />
            在线
          </div>
        </div>
        {/* Name over image */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h1
            className="text-4xl font-bold leading-tight"
            style={{
              fontFamily: "var(--font-display), 'Songti SC', serif",
              color: "#fff",
            }}
          >
            {character.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: `var(--${av}-accent)` }}>
            {character.tags.join(" · ")}
          </p>
        </div>
      </div>

      {/* Info section */}
      <div className="flex-1 px-5 pt-5 pb-8 flex flex-col gap-5">
        {/* Relationship badge */}
        <div
          className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{
            background: `var(--${av}-accent-soft)`,
            color: `var(--${av}-accent)`,
            border: `1px solid rgba(255,255,255,0.06)`,
          }}
        >
          {character.relationship}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {character.description}
        </p>

        {/* Quote */}
        <div
          className="px-4 py-3.5 rounded-2xl"
          style={{
            background: `var(--${av}-accent-soft)`,
            borderLeft: `2px solid var(--${av}-accent)`,
          }}
        >
          <p
            className="text-sm leading-relaxed italic"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-display), 'Songti SC', serif",
            }}
          >
            「{character.coverLine}」
          </p>
        </div>

        {/* Traits */}
        <div className="flex flex-wrap gap-2">
          {character.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => router.push(`/chat/${character.id}`)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 text-base font-semibold transition-all duration-300"
            style={{
              background: `var(--${av}-accent)`,
              color: "var(--bg-deep)",
              boxShadow: `0 8px 32px var(--${av}-glow)`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <MessageCircle className="w-5 h-5" />
            开始聊天
          </button>
        </div>
      </div>
    </div>
  );
}
