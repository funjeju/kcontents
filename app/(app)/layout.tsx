import Link from "next/link";
import { Home, BookOpen, User } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <main className="pb-20">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg/95 backdrop-blur-sm border-t border-text/5 safe-area-bottom">
        <div className="max-w-game mx-auto flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-text-caption hover:text-text transition-colors"
            >
              <item.icon size={22} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/scenarios/recommended", label: "시나리오", icon: Home },
  { href: "/scenarios",             label: "전체 보기", icon: BookOpen },
  { href: "/me",                    label: "내 인생들", icon: User },
];
