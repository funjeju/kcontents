import { Timestamp } from "firebase/firestore";

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface Stats {
  intellect: number;    // 지력
  creativity: number;   // 창의력
  emotion: number;      // 감성
  physique: number;     // 체력
  sociability: number;  // 사회성
  morality: number;     // 도덕성
}

export type StatKey = keyof Stats;

export const STAT_LABELS: Record<StatKey, { ko: string; en: string; icon: string }> = {
  intellect:   { ko: "지력",   en: "Intellect",   icon: "📖" },
  creativity:  { ko: "창의력", en: "Creativity",  icon: "🎨" },
  emotion:     { ko: "감성",   en: "Emotion",     icon: "💙" },
  physique:    { ko: "체력",   en: "Physique",    icon: "⚔️" },
  sociability: { ko: "사회성", en: "Sociability", icon: "🤝" },
  morality:    { ko: "도덕성", en: "Morality",    icon: "⚖️" },
};

// ─── Character ───────────────────────────────────────────────────────────────
export interface Qualities {
  [key: string]: number | boolean;
}

export interface Relationship {
  affinity: number;         // -10 ~ +10
  lastInteraction: number;
  tags: string[];
}

export interface PathVariables {
  isOnDramaPath: boolean;
  isDivergent: boolean;
  metaChaptersSeen: number;
  iconicMomentsSeen: string[];
}

// ─── Life ─────────────────────────────────────────────────────────────────────
export interface Life {
  id: string;
  scenarioId: string;
  characterName: string;
  familyBackground: string;
  stats: Stats;
  qualities: Qualities;
  relationships: Record<string, Relationship>;
  castingRole: string | null;
  castedAt: Timestamp | null;
  perspective: "self" | "parent" | "child_after_transition" | "cross";
  raisedChild?: {
    name: string;
    stats: Stats;
    qualities: Qualities;
    relationships: Record<string, { affinity: number; tags: string[] }>;
    age: number;
  };
  pathVariables: PathVariables;
  age: number;
  currentChapterId: string | null;
  currentEventIndex: number | null;
  completedChapters: number[];
  selectedHeroCardSlots: string[];
  usedHeroCards: { cardId: string; usedAtChapter: number }[];
  earnedLocationCardIds: string[];
  isFinished: boolean;
  endingId: string | null;
  endingNarrative: string | null;
  endingCardImageUrl: string | null;
  finishedAt: Timestamp | null;
  createdAt: Timestamp;
  lastPlayedAt: Timestamp;
  totalPlayTimeSeconds: number;
  diedEarlyOfStat: StatKey | null;
  diedAtAge: number | null;
}

// ─── Event ────────────────────────────────────────────────────────────────────
export type GateType = "knowledge" | "search" | "philosophy" | "location" | "creation";
export type EventType = "narrative" | "branch" | "iconic" | "meta" | "location";

export interface Choice {
  id: string;
  text: string;
}

export interface Event {
  id: string;
  chapterId: string;
  type: EventType;
  gate: GateType | null;
  conditions?: {
    requiredStats?: Partial<Stats>;
    requiredQualities?: Record<string, number>;
  };
  outcomes: {
    A: { statChanges: Partial<Stats>; qualityChanges: Qualities; narrativeKey: string };
    B: { statChanges: Partial<Stats>; qualityChanges: Qualities; narrativeKey: string };
  };
  sceneDirective: string;
  npcs: string[];
  heavyHistory?: boolean;
}

export interface EventResponse {
  eventId: string;
  chapterId: string;
  age: number;
  eventType: EventType;
  gateType: GateType | null;
  narrative: string;
  choices: Choice[];
  selectedChoiceId: string | null;
  freeformInput: string | null;
  aiEvaluation: {
    statChanges: Partial<Stats>;
    qualityChanges: Qualities;
    feedback: string;
  } | null;
  resultNarrative: string;
  moderationResult: "passed" | "flagged" | "blocked" | null;
  respondedAt: Timestamp;
}

// ─── Chapter ──────────────────────────────────────────────────────────────────
export interface ChapterProgress {
  chapterId: string;
  age: number;
  startedAt: Timestamp;
  finishedAt: Timestamp | null;
  compiledEvents: string[];
  completedEventIds: string[];
  currentEventId: string | null;
  introNarrative: string;
  endNarrative: string | null;
  statsAtStart: Stats;
  statsAtEnd: Stats | null;
}

// ─── Scenario ─────────────────────────────────────────────────────────────────
export interface LocalizedText {
  ko: string;
  en: string;
}

export interface CradleConfig {
  type: "self_youth" | "parent_raising";
  cradleStartAge: number;
  cradleEndAge: number;
  perspectiveTransition?: {
    defaultTransitionAge: number;
    keepParentAllowed: boolean;
    crossPerspectiveAllowed: boolean;
  };
}

export interface CastingConditions {
  requiredStats?: Partial<Stats>;
  requiredQualities?: Record<string, number>;
  requiredFamilyBackground?: string[];
  forbiddenQualities?: Record<string, number>;
}

export interface CastingRole {
  id: string;
  scenarioId: string;
  name: LocalizedText;
  shortDescription: LocalizedText;
  conditions: CastingConditions;
  priority: number;
  t0NarrativeTemplate: LocalizedText;
  endingIds: string[];
  iconicMomentIds: string[];
}

export interface IconicMoment {
  id: string;
  scenarioId: string;
  applicableCastings: string[];
  chapterAge: number;
  conditions: {
    requiredQualities?: Record<string, number>;
    requiredStats?: Partial<Stats>;
    requiredRelationships?: Record<string, number>;
    cooldown?: number;
  };
  setup: {
    location: string;
    locationCardId?: string;
    npcInvolved: string[];
    sceneDirective: string;
    emotionalTone: string;
    expectedNarrativeLength: "short" | "medium" | "long";
  };
  outcomes: {
    dramaConsistent: {
      labelKo: string;
      labelEn: string;
      qualityChanges: Qualities;
      relationshipChanges: Record<string, number>;
      statChanges: Partial<Stats>;
      pathFlag?: string;
    };
    divergent: {
      labelKo: string;
      labelEn: string;
      qualityChanges: Qualities;
      relationshipChanges: Record<string, number>;
      statChanges: Partial<Stats>;
      activatesPath: string;
    };
    custom: {
      evaluatorPrompt: string;
    };
  };
}

export interface EndingConditions {
  requiredStats?: Partial<Stats>;
  requiredQualities?: Record<string, number>;
  requiredPathVariables?: Partial<PathVariables>;
}

export interface Ending {
  id: string;
  scenarioId: string;
  castingRoleId: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  conditions: EndingConditions;
  priority: number;
  narrativeContext: {
    historicalEvents: string[];
    keyMotifs: string[];
    suggestedQuoteThemes: string[];
  };
  cardArtStyle: {
    palette: string;
    composition: string;
    moodKeywords: string[];
  };
  totalDiscoveries: number;
  rarityPercentage: number;
}

export interface FamilyBackground {
  id: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  initialStats: Partial<Stats>;
  initialQualities: Qualities;
}

export interface Scenario {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  era: string;
  genre: string[];
  heaviness: 1 | 2 | 3 | 4 | 5;
  recommendedAgeMin: number;
  coverImageUrl: string;
  cradleConfig: CradleConfig;
  mainStoryEndAge: number;
  castingRoles: CastingRole[];
  iconicMoments: IconicMoment[];
  endings: Ending[];
  familyBackgrounds: FamilyBackground[];
  isPremium: boolean;
  status: "draft" | "published" | "archived";
  totalPlays: number;
  averageRating: number;
  publishedAt?: string;
  updatedAt?: string;
}

// ─── User ──────────────────────────────────────────────────────────────────────
export type AgeBracket = "13-17" | "18-24" | "25-34" | "35-44" | "45+";
export type Gender = "female" | "male" | "nonbinary" | "no-answer";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  source: string;
  language: "ko" | "en";
  countryCode: string;
  subscriptionStatus: "free" | "plus" | "expired";
  ageBracket: AgeBracket;
  gender: Gender;
  preferredGenres: string[];
  heavyContentEnabled: boolean;
  onboardedAt: Timestamp;
}

// ─── API Response types ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StartLifeRequest {
  scenarioId: string;
  characterName: string;
  familyBackground: string;
}

export interface RespondEventRequest {
  choiceId?: string;
  freeformInput?: string;
}

export interface OnboardRequest {
  ageBracket: AgeBracket;
  gender: Gender;
  countryCode: string;
  preferredGenres?: string[];
  language: "ko" | "en";
}

// ─── Location Card ────────────────────────────────────────────────────────────
export interface LocationCard {
  id: string;
  scenarioId: string;
  nameKo: string;                  // 장소 이름 (예: "정동길")
  nameEn: string;
  address: string;                 // 실제 주소
  lat: number;                     // 위도
  lng: number;                     // 경도
  chapterAge?: number;             // 이 장소가 등장하는 나이 (선택)
  castingRoleIds?: string[];       // 해당 캐스팅에만 등장 (없으면 공통)
  inGameMeaning: string;           // 작품 안에서의 의미 (1~2문장)
  sensoryDescription: string;      // 감각적 장소 묘사 가이드 (AI 프롬프트 주입용, 80~120자)
  guideNote: string;               // 실제 방문 가이드 한 줄
  imageUrl?: string;
}

// ─── BGM ─────────────────────────────────────────────────────────────────────
export type BgmContext =
  | "everyday"          // 평상시
  | "spring" | "summer" | "autumn" | "winter"
  | "t0_casting"        // T-0 캐스팅 모먼트
  | "milestone"         // 이정표
  | "iconic_moment"     // 명장면
  | "stat_warning"      // 스탯 위험 경고
  | "death"             // 즉사 결말
  | "ending_happy"      // 행복한 결말
  | "ending_tragic"     // 비극적 결말
  | "ending_bittersweet"// 씁쓸한 결말
  | "cradle"            // Cradle 단계 전반
  | "chapter_end";      // 챕터 마무리

export interface BgmTrack {
  id: string;
  context: BgmContext;
  nameKo: string;                  // 트랙 이름/분위기 설명
  mood: string;                    // 감정 키워드 (예: "고요한 긴장, 먼 곳을 바라보는")
  instruments: string[];           // 주요 악기 (예: ["가야금", "첼로", "피아노"])
  tempo: "slow" | "moderate" | "fast";
  referenceTrackHint: string;      // AI가 이 분위기를 만들어낼 때 참고할 음악 묘사
  fileUrl?: string;                // 실제 파일 URL (출시 후 연결)
}

// ─── Entry Questions ──────────────────────────────────────────────────────────
export interface EntryQuestionChoice {
  id: string;          // "A" | "B" | "C"
  text: string;
  castingHint: string; // 어느 캐스팅 방향으로 수렴하는지 내부 힌트 (어드민용)
}

export interface EntryQuestion {
  id: string;          // "q1" ~ "q10"
  order: number;
  text: string;        // 질문 본문 (간접적, 시대극 톤)
  subtext?: string;    // 보조 설명 (선택)
  choices: EntryQuestionChoice[];
}

export interface EntryAnswers {
  [questionId: string]: string; // questionId → choiceId
}

// ─── Safety Rules ─────────────────────────────────────────────────────────────
export type SafetySourceType = "drama" | "book" | "history" | "script";

export interface SafetyRules {
  scenarioId: string;
  sourceType: SafetySourceType;
  // 소스 A·B (드라마/책) — IP 보호
  forbiddenCharacterNames: string[];    // 실명 사용 금지 인물
  forbiddenQuotes: string[];            // 직접 인용 금지 명대사
  forbiddenScenePatterns: string[];     // 묘사 금지 명장면 패턴
  // 소스 C (역사) — 역사 왜곡 방지
  confirmedHistoricalFacts: string[];   // 반드시 지켜야 할 역사적 사실
  forbiddenHistoricalDistortions: string[]; // 왜곡 금지 항목
  realPersonPrivacyRules: string[];     // 실존 인물 사적 영역 창작 금지 규칙
  dignityRules: string[];               // 피해자/희생자 존엄 보존 규칙
  // 공통
  generalRules: string[];               // 소스 무관 공통 안전 규칙
  updatedAt?: string;
}

// ─── Milestone ───────────────────────────────────────────────────────────────
export interface MilestoneOutcome {
  castingRoleId: string;
  decisionPrompt: string;        // 이 캐스팅이 직면하는 결정 모먼트 설명
  dramaticPathFlag?: string;     // 드라마 흐름 선택 시 설정되는 flag
  divergentPathFlag?: string;    // 갈라진 길 선택 시 설정되는 flag
}

export interface Milestone {
  id: string;
  scenarioId: string;
  age: number;                   // 이 이정표가 발생하는 나이
  year?: number;                 // 절대 연도 (역사 시나리오용)
  title: string;                 // 이정표 이름 (예: "한산도 대첩", "T-0 모먼트")
  description: string;           // 이정표 상황 설명
  isHistoricalFact: boolean;     // true = 역사적 사실 (플레이어가 막을 수 없음)
  isT0: boolean;                 // T-0 캐스팅 순간인지
  aiDirective: string;           // AI가 이 이정표에서 따라야 할 지시문
  castingOutcomes: MilestoneOutcome[]; // 캐스팅별 결정 모먼트
  order: number;                 // 정렬 순서
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CardCategory = "flow" | "encounter" | "growth" | "threshold" | "custom";
export type CardUsageTiming = "chapter_start" | "chapter_end" | "stat_warning" | "anytime";

export interface GameCard {
  id: string;
  scenarioId?: string;           // 커스텀 카드만 존재
  category: CardCategory;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  effectKo: string;              // 실제 효과 설명 (간결)
  usageTiming: CardUsageTiming;
  usageCondition?: string;       // 사용 조건 (예: "스탯 19 도달 시")
  statEffect?: Partial<Stats>;   // Growth/Threshold 카드용
  statCondition?: {              // Threshold 카드용: 이 스탯이 임계값일 때만 사용 가능
    key: StatKey;
    min?: number;
    max?: number;
  };
  rarity: CardRarity;
  isStandard: boolean;           // false = 시나리오 커스텀 카드
}

export interface HeroCardDefinition {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  effectDescription: LocalizedText;
  rarity: CardRarity;
  imageUrl: string;
  acquisition: {
    fromPack: boolean;
    fromEnding: boolean;
    fromStreak: boolean;
    fromPurchase: boolean;
    purchasePriceKrw?: number;
  };
}

// ─── AI ──────────────────────────────────────────────────────────────────────
export type AICallType =
  | "scenario_recommend"
  | "chapter_intro"
  | "event_narrative"
  | "freeform_eval"
  | "t0_casting"
  | "iconic_moment"
  | "meta_chapter"
  | "chapter_end"
  | "ending_narrative"
  | "quote_extract"
  | "moderation";

export interface AIResponse {
  text: string;
  data?: Record<string, unknown>;
  tokenUsage?: { input: number; output: number };
  model?: string;
  cached?: boolean;
}
