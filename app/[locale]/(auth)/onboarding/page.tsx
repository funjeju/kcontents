"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgeBracket, Gender } from "@/lib/types";

const TOTAL_STEPS = 4;

const AGE_OPTIONS: { value: AgeBracket; label: string }[] = [
  { value: "13-17", label: "13~17세" },
  { value: "18-24", label: "18~24세" },
  { value: "25-34", label: "25~34세" },
  { value: "35-44", label: "35~44세" },
  { value: "45+",   label: "45세 이상" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female",    label: "여성" },
  { value: "male",      label: "남성" },
  { value: "nonbinary", label: "논바이너리" },
  { value: "no-answer", label: "답하지 않음" },
];

const GENRE_OPTIONS = [
  { id: "historical", label: "사극" },
  { id: "colonial_era", label: "근현대" },
  { id: "modern_romance", label: "현대 로맨스" },
  { id: "medical", label: "의학" },
  { id: "mystery", label: "추리/스릴러" },
  { id: "fantasy", label: "판타지/SF" },
  { id: "youth", label: "학원/청춘" },
  { id: "chaebol", label: "재벌/회사" },
  { id: "noir", label: "복수/누아르" },
  { id: "idol", label: "아이돌" },
];

const COUNTRY_OPTIONS = [
  { code: "KR", name: "대한민국" },
  { code: "US", name: "미국" },
  { code: "JP", name: "일본" },
  { code: "CN", name: "중국" },
  { code: "TW", name: "대만" },
  { code: "VN", name: "베트남" },
  { code: "TH", name: "태국" },
  { code: "PH", name: "필리핀" },
  { code: "GB", name: "영국" },
  { code: "FR", name: "프랑스" },
  { code: "BR", name: "브라질" },
  { code: "OTHER", name: "기타" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [ageBracket, setAgeBracket] = useState<AgeBracket | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [country, setCountry] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function toggleGenre(id: string) {
    setGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageBracket,
          gender,
          countryCode: country,
          preferredGenres: genres,
          language: "ko",
        }),
      });
      router.push("/scenarios/recommended");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="animate-slide-up">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-text-caption mb-2">
          <span>프로필 설정</span>
          <span>{step}/{TOTAL_STEPS}</span>
        </div>
        <div className="h-1 bg-bg rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-maple rounded-full"
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <Step key="age" title="나이를 알려주세요">
            <RadioGroup
              options={AGE_OPTIONS}
              value={ageBracket}
              onChange={(v) => setAgeBracket(v as AgeBracket)}
            />
            <Button size="lg" fullWidth onClick={next} disabled={!ageBracket} className="mt-6">
              다음 →
            </Button>
          </Step>
        )}

        {step === 2 && (
          <Step key="gender" title="성별">
            <RadioGroup
              options={GENDER_OPTIONS}
              value={gender}
              onChange={(v) => setGender(v as Gender)}
            />
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" size="lg" onClick={back} className="flex-1">← 이전</Button>
              <Button size="lg" onClick={next} disabled={!gender} className="flex-2 flex-1">다음 →</Button>
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step key="country" title="거주 국가">
            <div className="space-y-2">
              {COUNTRY_OPTIONS.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-button border transition-all",
                    country === c.code
                      ? "border-accent-maple bg-accent-maple/5 text-text"
                      : "border-text/10 bg-bg-card text-text-muted hover:border-text/20"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" size="lg" onClick={back} className="flex-1">← 이전</Button>
              <Button size="lg" onClick={next} disabled={!country} className="flex-1">다음 →</Button>
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step key="genres" title="좋아하는 K-드라마 장르는?" subtitle="건너뛸 수 있어요">
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGenre(g.id)}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm border transition-all",
                    genres.includes(g.id)
                      ? "bg-accent-maple text-white border-accent-maple"
                      : "bg-bg-card text-text-muted border-text/10 hover:border-text/20"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" size="lg" onClick={back} className="flex-1">← 이전</Button>
              <Button size="lg" onClick={finish} disabled={saving} className="flex-1">
                {saving ? "저장 중..." : "완료"}
              </Button>
            </div>
          </Step>
        )}
      </AnimatePresence>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="font-serif text-xl font-semibold text-text mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-text-caption mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </motion.div>
  );
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "w-full text-left px-4 py-3.5 rounded-button border transition-all text-base",
            value === opt.value
              ? "border-accent-maple bg-accent-maple/5 text-text font-medium"
              : "border-text/10 bg-bg-card text-text-muted hover:border-text/20"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
