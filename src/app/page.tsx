import Link from "next/link";
import { characters } from "@/lib/characters";
import AuthButtonWrapper from "@/components/AuthButtonWrapper";
import StarField from "@/components/StarField";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden">
      <StarField />

      {/* Ambient glow */}
      <div
        className="glow-orb"
        style={{
          width: 500,
          height: 500,
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)",
        }}
      />

      {/* ─── Header ─── */}
      <header className="relative z-10 pt-8 pb-2 px-5 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="fade-up" style={{ animationDelay: "0.1s" }}>
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{
                fontFamily: "var(--font-display), 'Songti SC', serif",
                color: "var(--text-primary)",
              }}
            >
              纸片人男友
            </h1>
            <p
              className="text-[10px] tracking-[0.25em] uppercase mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Love.ai
            </p>
          </div>
          <div className="fade-up" style={{ animationDelay: "0.2s" }}>
            <AuthButtonWrapper />
          </div>
        </div>
      </header>

      {/* ─── Subtitle ─── */}
      <section className="relative z-10 px-5 pt-4 pb-5 max-w-lg mx-auto w-full">
        <p
          className="fade-up text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)", animationDelay: "0.3s" }}
        >
          选一个你心动的他，开始你们的故事
        </p>
      </section>

      {/* ─── Character Cards Grid ─── */}
      <section className="relative z-10 flex-1 px-4 pb-10 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {characters.map((character, i) => (
            <Link
              key={character.id}
              href={`/character/${character.id}`}
              className="stagger-in character-card group relative rounded-2xl overflow-hidden"
              style={{
                animationDelay: `${0.35 + i * 0.1}s`,
                height: 280,
              }}
            >
              {/* Background: portrait image or gradient fallback */}
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ background: character.cardGradient }}
              />

              {/* Portrait image overlay (when available) */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-out group-hover:scale-105"
                style={{
                  backgroundImage: `url(${character.avatarUrl})`,
                }}
              />

              {/* Bottom gradient overlay for text readability */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(8,8,15,0) 20%, rgba(8,8,15,0.4) 45%, rgba(8,8,15,0.88) 70%, rgba(8,8,15,0.98) 100%)",
                }}
              />

              {/* ── Top bar ── */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10">
                {/* Online badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "#fff",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{
                      background: "#ff4757",
                      boxShadow: "0 0 6px rgba(255,71,87,0.6)",
                    }}
                  />
                  在线
                </div>

                {/* Number */}
                <span
                  className="text-sm font-medium"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "var(--font-display), serif",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* ── Bottom info ── */}
              <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
                {/* Character name */}
                <h2
                  className="font-bold leading-none mb-1"
                  style={{
                    fontSize: 22,
                    color: "#fff",
                    fontFamily: "var(--font-display), 'Songti SC', serif",
                    textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                  }}
                >
                  {character.name}
                </h2>

                {/* Tags */}
                <p
                  className="text-xs mb-1.5"
                  style={{
                    color: `var(--${character.accentVar}-accent)`,
                    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                >
                  {character.tags.join(" · ")}
                </p>

                {/* Description */}
                <p
                  className="text-[12px] leading-relaxed line-clamp-2"
                  style={{
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {character.description}
                </p>
              </div>

              {/* Hover border glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 1px var(--${character.accentVar}-accent-soft), 0 0 25px var(--${character.accentVar}-glow)`,
                }}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        className="relative z-10 text-center pb-8 text-[11px] fade-up"
        style={{ color: "var(--text-muted)", animationDelay: "0.8s" }}
      >
        聊天记录仅保存在本设备 · 登录后可跨设备同步
      </footer>
    </main>
  );
}
