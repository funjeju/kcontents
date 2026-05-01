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

// ─── Card ─────────────────────────────────────────────────────────────────────
export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

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
