"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import StarField from "@/components/StarField";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("邮箱或密码不正确，请重试");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 800);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirm) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: regPassword, name: regName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "注册失败，请稍后重试");
      return;
    }
    const result = await signIn("credentials", {
      email: regEmail,
      password: regPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("注册成功，但登录时出了点问题，请手动登录");
      setTab("login");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 800);
    }
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      <StarField />

      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed"
        style={{
          width: 480,
          height: 480,
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="fixed top-6 left-5 z-20 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <span style={{ fontSize: 16 }}>←</span>
        <span>返回</span>
      </button>

      {/* Card */}
      <div
        className="relative z-10 w-full mx-4"
        style={{ maxWidth: 360 }}
      >
        {/* Logo */}
        <div className="text-center mb-7">
          <p
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-display), 'Songti SC', serif",
              color: "var(--text-primary)",
            }}
          >
            纸片人男友
          </p>
          <p
            className="text-[10px] tracking-[0.25em] uppercase mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            Love.ai
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex mb-6 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  tab === t
                    ? {
                        background: "rgba(201,169,110,0.15)",
                        color: "var(--accent)",
                        border: "1px solid rgba(201,169,110,0.2)",
                      }
                    : { color: "var(--text-muted)", border: "1px solid transparent" }
                }
              >
                {t === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          {/* Success state */}
          {success ? (
            <div className="py-8 text-center">
              <div
                className="text-3xl mb-3"
                style={{ filter: "drop-shadow(0 0 12px rgba(201,169,110,0.5))" }}
              >
                ✓
              </div>
              <p style={{ color: "var(--accent)", fontSize: 14 }}>
                {tab === "login" ? "登录成功，跳转中…" : "注册成功，跳转中…"}
              </p>
            </div>
          ) : tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field
                label="邮箱"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="your@email.com"
                required
              />
              <Field
                label="密码"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="请输入密码"
                required
              />
              {error && <ErrorMsg text={error} />}
              <SubmitButton loading={loading} label="登录" />
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field
                label="昵称（选填）"
                type="text"
                value={regName}
                onChange={setRegName}
                placeholder="你想叫什么名字"
              />
              <Field
                label="邮箱"
                type="email"
                value={regEmail}
                onChange={setRegEmail}
                placeholder="your@email.com"
                required
              />
              <Field
                label="密码"
                type="password"
                value={regPassword}
                onChange={setRegPassword}
                placeholder="至少 6 位"
                required
              />
              <Field
                label="确认密码"
                type="password"
                value={regConfirm}
                onChange={setRegConfirm}
                placeholder="再输一次"
                required
              />
              {error && <ErrorMsg text={error} />}
              <SubmitButton loading={loading} label="注册" />
            </form>
          )}
        </div>

        <p
          className="text-center text-[11px] mt-5"
          style={{ color: "var(--text-muted)" }}
        >
          登录后聊天记录将跨设备同步
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-xs mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(201,169,110,0.4)";
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
      />
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <p className="text-xs px-1" style={{ color: "#f87171" }}>
      {text}
    </p>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-1"
      style={{
        background: loading
          ? "rgba(201,169,110,0.3)"
          : "rgba(201,169,110,0.85)",
        color: loading ? "rgba(8,8,15,0.5)" : "#08080f",
        cursor: loading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loading) e.currentTarget.style.background = "rgba(201,169,110,1)";
      }}
      onMouseLeave={(e) => {
        if (!loading) e.currentTarget.style.background = "rgba(201,169,110,0.85)";
      }}
    >
      {loading ? "请稍候…" : label}
    </button>
  );
}
