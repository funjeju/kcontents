"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading("google");
    setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      await createSession(idToken);
      router.push("/scenarios/recommended");
    } catch {
      setError("Google 로그인에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await createSession(idToken);
      router.push("/scenarios/recommended");
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl font-bold text-text mb-2">돌아오셨군요</h1>
        <p className="text-sm text-text-muted">당신의 인생이 기다리고 있어요</p>
      </div>

      <div className="space-y-3 mb-6">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleGoogle}
          disabled={!!loading}
        >
          {loading === "google" ? "연결 중..." : "Google로 로그인"}
        </Button>
      </div>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-text/10" />
        <span className="text-xs text-text-caption">또는</span>
        <div className="flex-1 h-px bg-text/10" />
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
        <div>
          <label className="text-sm text-text-muted block mb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-button bg-bg-card border border-text/10 text-text placeholder:text-text-caption focus:outline-none focus:border-accent-maple/50 transition-colors"
            placeholder="email@example.com"
            required
          />
        </div>
        <div>
          <label className="text-sm text-text-muted block mb-1.5">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-4 rounded-button bg-bg-card border border-text/10 text-text placeholder:text-text-caption focus:outline-none focus:border-accent-maple/50 transition-colors"
            placeholder="비밀번호"
            required
          />
        </div>

        {error && <p className="text-sm text-accent-maple text-center">{error}</p>}

        <Button type="submit" size="lg" fullWidth disabled={!!loading}>
          {loading === "email" ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <p className="text-sm text-center text-text-muted mt-4">
        아직 계정이 없나요?{" "}
        <Link href="/signup" className="text-accent-maple hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

async function createSession(idToken: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}
