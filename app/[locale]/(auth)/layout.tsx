import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <header className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={16} />
          <span className="font-serif font-medium">K-Drama Life</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col justify-center px-screen-x pb-8 max-w-game mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
