"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut, ChevronRight, Moon, Globe, Bell, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/");
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg pb-10">
      <div className="max-w-game mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-text/5">
          <div className="px-screen-x h-14 flex items-center gap-3">
            <Link href="/me">
              <button className="text-text-muted">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <h1 className="font-serif font-semibold text-text">설정</h1>
          </div>
        </div>

        <div className="px-screen-x py-6 space-y-6">
          {/* Account */}
          <section>
            <p className="text-xs text-text-caption uppercase tracking-wider mb-2">계정</p>
            <div className="hanji-card divide-y divide-text/5">
              <SettingRow icon={Globe} label="언어" value="한국어" />
              <SettingRow icon={Bell} label="알림" value="켜짐" />
              <SettingRow icon={Moon} label="다크모드" value="시스템" />
            </div>
          </section>

          {/* Info */}
          <section>
            <p className="text-xs text-text-caption uppercase tracking-wider mb-2">정보</p>
            <div className="hanji-card divide-y divide-text/5">
              <SettingRow label="버전" value="1.0.0" />
              <SettingRow label="개인정보처리방침" />
              <SettingRow label="이용약관" />
              <SettingRow label="문의하기" />
            </div>
          </section>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            {loading ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-card/50 transition-colors first:rounded-t-card last:rounded-b-card">
      {Icon && <Icon size={16} className="text-text-caption shrink-0" />}
      <span className="flex-1 text-sm text-text">{label}</span>
      {value && <span className="text-sm text-text-caption">{value}</span>}
      <ChevronRight size={14} className="text-text-caption/60" />
    </button>
  );
}
