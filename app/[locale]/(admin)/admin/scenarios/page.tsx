export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/firebase-admin";
import { Link } from "@/i18n/navigation";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  published: "출시",
  archived: "보관",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-yellow-400 bg-yellow-400/10",
  published: "text-green-400 bg-green-400/10",
  archived: "text-white/30 bg-white/5",
};

export default async function AdminScenariosPage() {
  let scenarios: any[] = [];

  try {
    const snap = await adminDb.collection("scenarios").orderBy("updatedAt", "desc").limit(50).get();
    scenarios = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // Firestore not configured yet
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">시나리오 관리</h1>
          <p className="text-white/40 text-sm mt-1">{scenarios.length}개 등록됨</p>
        </div>
        <Link href="/admin/scenarios/create">
          <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors">
            + AI로 시나리오 생성
          </button>
        </Link>
      </div>

      {scenarios.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center">
          <p className="text-white/40 text-sm mb-4">등록된 시나리오가 없습니다</p>
          <Link href="/admin/scenarios/create">
            <button className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors">
              첫 시나리오 만들기
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((s) => (
            <Link key={s.id} href={`/admin/scenarios/${s.id}`}>
              <div className="border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{s.title?.ko ?? s.id}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? STATUS_COLORS.draft}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </div>
                  <p className="text-white/40 text-sm">{s.subtitle?.ko ?? ""}</p>
                </div>
                <div className="text-right text-xs text-white/30">
                  <p>캐스팅 {s.castingRoles?.length ?? 0}종</p>
                  <p>결말 {s.endings?.length ?? 0}개</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
