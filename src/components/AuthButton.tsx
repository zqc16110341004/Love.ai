"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden border"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          )}
        </div>
        <span className="text-[11px] max-w-[80px] truncate" style={{ color: "var(--text-secondary)" }}>
          {session.user.name ?? session.user.email}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-[11px] flex items-center gap-1 transition-colors duration-300 cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <LogOut className="w-3 h-3" />
          退出
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push("/login")}
      className="flex items-center gap-1.5 text-[11px] transition-all duration-300 rounded-full px-3.5 py-1.5 cursor-pointer"
      style={{
        color: "var(--text-secondary)",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,169,110,0.3)";
        e.currentTarget.style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      <LogIn className="w-3 h-3" />
      登录保存
    </button>
  );
}
