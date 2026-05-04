import AuthButtonWrapper from "@/components/AuthButtonWrapper";
import StarField from "@/components/StarField";
import { CharacterGrid } from "@/components/CharacterGrid";

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
        <CharacterGrid />
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
