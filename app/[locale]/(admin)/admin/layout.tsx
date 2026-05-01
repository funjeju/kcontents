import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = cookies().get("session")?.value;

  if (!session) redirect("/login");

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const isAdmin = userDoc.data()?.isAdmin === true;
    if (!isAdmin) redirect("/");
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      {/* Admin top bar */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Admin</span>
        <nav className="flex gap-4">
          <a href="/admin/scenarios" className="text-sm text-white/70 hover:text-white transition-colors">시나리오</a>
          <a href="/admin/scenarios/create" className="text-sm text-white/70 hover:text-white transition-colors">+ 새 시나리오</a>
        </nav>
        <a href="/" className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors">← 게임으로</a>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
