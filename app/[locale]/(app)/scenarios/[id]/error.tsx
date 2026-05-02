"use client";

import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";

export default function ScenarioError() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-5xl mb-4">🏯</p>
      <h1 className="font-serif text-xl font-bold text-text mb-2">시나리오를 불러올 수 없습니다</h1>
      <p className="text-sm text-text-muted mb-6">잠시 후 다시 시도해 주세요</p>
      <Link
        href="/scenarios/recommended"
        className="flex items-center gap-1.5 text-sm text-accent-maple hover:underline"
      >
        <ChevronLeft size={16} />
        목록으로 돌아가기
      </Link>
    </div>
  );
}
