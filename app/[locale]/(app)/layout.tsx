"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/scenarios/recommended", label: t("scenarios"), icon: Home },
    { href: "/scenarios",             label: t("browse"),    icon: BookOpen },
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
