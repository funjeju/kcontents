export const dynamic = "force-dynamic";
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeft, LogOut, ChevronRight, Moon, Bell, type LucideIcon } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function SettingsPage() {
  const t = useTranslations("settings");
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
        <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-sm border-b border-text/5">
          <div className="px-screen-x h-14 flex items-center gap-3">
            <Link href="/me">
              <button className="text-text-muted">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <h1 className="font-serif font-semibold text-text">{t("title")}</h1>
          </div>
        </div>

        <div className="px-screen-x py-6 space-y-6">
          <section>
            <p className="text-xs text-text-caption uppercase tracking-wider mb-2">
              {t("language")}
            </p>
            <LocaleSwitcher />
          </section>

          <section>
            <p className="text-xs text-text-caption uppercase tracking-wider mb-2">
              {t("accountSection")}
            </p>
            <div className="hanji-card divide-y divide-text/5">
              <SettingRow icon={Bell} label={t("notifications")} value={t("notificationsValue")} />
              <SettingRow icon={Moon} label={t("darkMode")} value={t("darkModeValue")} />
            </div>
          </section>

          <section>
            <p className="text-xs text-text-caption uppercase tracking-wider mb-2">
              {t("infoSection")}
            </p>
            <div className="hanji-card divide-y divide-text/5">
              <SettingRow label={t("version")} value="1.0.0" />
              <SettingRow label={t("privacy")} />
              <SettingRow label={t("terms")} />
              <SettingRow label={t("contact")} />
            </div>
          </section>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            {loading ? t("loggingOut") : t("logout")}
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
