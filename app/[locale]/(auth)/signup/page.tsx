"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"google" | "apple" | "email" | null>(null);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading("google");
    setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      await createSession(idToken);
      router.push("/onboarding");
    } catch (e: unknown) {
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
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await createSession(idToken);
      router.push("/onboarding");
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl font-bold text-text mb-2">
          K-Drama Life에 오신 것을 환영합니다
        </h1>
        <p className="text-sm text-text-muted">첫 인생을 시작하세요</p>
      </div>

      {/* OAuth */}
      <div className="space-y-3 mb-6">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleGoogle}
          disabled={!!loading}
          className="relative"
        >
          {loading === "google" ? (
            <span className="animate-pulse">연결 중...</span>
          ) : (
            <>
              <svg className="absolute left-4" width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </>
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-text/10" />
        <span className="text-xs text-text-caption">또는</span>
        <div className="flex-1 h-px bg-text/10" />
      </div>

      {/* Email form */}
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
            placeholder="6자 이상"
            required
            minLength={6}
          />
        </div>

        {error && (
          <p className="text-sm text-accent-maple text-center">{error}</p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={!!loading}>
          {loading === "email" ? "가입 중..." : "이메일로 가입하기"}
        </Button>
      </form>

      {/* 약관 */}
      <p className="text-xs text-text-caption text-center mt-5 leading-relaxed">
        가입 시{" "}
        <Link href="/terms" className="underline underline-offset-2">이용약관</Link>과{" "}
        <Link href="/privacy" className="underline underline-offset-2">개인정보 처리방침</Link>에
        동의하게 됩니다.
      </p>

      <p className="text-sm text-center text-text-muted mt-4">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-accent-maple hover:underline">
          로그인
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
