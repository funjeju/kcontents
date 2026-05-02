"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <TopHeader />
      <main className="pb-20">{children}</main>
      <BottomNav />
      <GuestWall />
    </div>
  );
}

function TopHeader() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();
  const isPlay = pathname.includes("/play/");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setLoggedIn(d.loggedIn));
  }, []);

  // 게임 플레이 중엔 헤더 숨김 (GameHeader가 대신함)
  if (isPlay) return null;
  // 로딩 중엔 공간만 확보
  if (loggedIn === null) return <div className="h-12" />;
  // 로그인 상태면 헤더 불필요
  if (loggedIn) return null;

  return (
    <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-text/5">
      <div className="max-w-game mx-auto px-4 h-12 flex items-center justify-between">
        <span className="font-serif text-base font-bold text-text">🏯 K-Drama Life</span>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <button className="text-xs text-text-muted hover:text-text px-3 py-1.5 rounded-full border border-text/10 transition-colors">
              로그인
            </button>
          </Link>
          <Link href="/signup">
            <button className="text-xs text-white px-3 py-1.5 rounded-full bg-accent-maple hover:bg-accent-maple/90 transition-colors">
              회원가입
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function GuestWall() {
  const [show, setShow] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setLoggedIn(d.loggedIn);
    });
  }, []);

  useEffect(() => {
    if (loggedIn === false && pathname.includes("/play/")) {
      const count = parseInt(sessionStorage.getItem("guestEventCount") ?? "0") + 1;
      sessionStorage.setItem("guestEventCount", String(count));
      if (count >= 5) setShow(true);
    }
  }, [pathname, loggedIn]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-bg rounded-t-2xl sm:rounded-2xl p-6 max-w-sm w-full mx-4 mb-0 sm:mb-0 shadow-xl animate-slide-up">
        <div className="text-center mb-5">
          <p className="text-3xl mb-3">🏯</p>
          <h2 className="font-serif text-xl font-bold text-text mb-2">
            이야기를 계속하려면
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            무료 계정을 만들면 선택의 결과를 저장하고<br />
            모든 결말을 경험할 수 있어요.
          </p>
        </div>
        <div className="space-y-2">
          <Link href="/signup" onClick={() => sessionStorage.setItem("guestEventCount", "0")}>
            <Button size="lg" fullWidth>
              ▶ 무료로 시작하기
            </Button>
          </Link>
          <Link href="/login" onClick={() => sessionStorage.setItem("guestEventCount", "0")}>
            <button className="w-full py-2.5 text-sm text-text-muted hover:text-text transition-colors">
              이미 계정이 있어요 →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/scenarios/recommended", label: t("scenarios"), icon: Home },
    { href: "/me",                    label: t("myLives"),   icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-bg/95 backdrop-blur-sm border-t border-text/5 safe-area-bottom">
      <div className="max-w-game mx-auto flex">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
                active ? "text-accent-maple" : "text-text-caption hover:text-text"
              )}
            >
              <item.icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
