# 05. 데이터 모델

Firestore 컬렉션 구조, 스키마, 보안 규칙, 데이터 흐름.

---

## 1. 컬렉션 개요

```
firestore/
├── users/{uid}                       # 사용자 프로필
│   ├── profile (subcollection)
│   ├── lives/{lifeId}                # 한 인생 (캐릭터)
│   │   ├── chapters/{chapterId}      # 챕터별 진행 데이터
│   │   ├── events/{eventId}          # 이벤트 응답 로그
│   ├── inventory                     # 카드 인벤토리
│   ├── streaks                       # 데일리 스트릭
│   ├── billing                       # 결제 정보
│   ├── locationCards                 # 획득한 위치 카드
│
├── scenarios/{scenarioId}            # 시나리오 정의 (정적 콘텐츠)
│   ├── chapters/{chapterId}
│   ├── castingRoles/{roleId}
│   ├── iconicMoments/{momentId}
│   ├── endings/{endingId}
│   ├── locationCards/{cardId}
│
├── globalStats                       # 글로벌 통계 (결말 발견율 등)
│   ├── endingDiscovery/{endingId}
│
├── moderation                        # 모더레이션 대기열
│   ├── userInputs/{inputId}
│
├── analytics                         # 분석용 (로그 형태)
│
└── system                            # 시스템 설정
    └── config
```

**중요:** 시나리오 콘텐츠 자산(`/scenarios`)은 **Cloud Storage**에도 백업 (JSON 형태). Firestore는 운영 DB, Cloud Storage는 콘텐츠 source of truth.

---

## 2. 사용자 프로필

### 2.1 `/users/{uid}`

```typescript
interface User {
  // Firebase Auth 자동 동기화
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  
  // 메타데이터
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  
  // 가입 출처
  source: "direct" | "tiktok" | "youtube" | "instagram" | "referral" | "search";
  referralCode?: string;
  
  // 언어 / 지역
  language: "ko" | "en";
  countryCode: string;            // ISO 3166-1 alpha-2
  
  // 결제 상태
  subscriptionStatus: "free" | "plus" | "expired";
  subscriptionExpiresAt?: Timestamp;
}
```

### 2.2 `/users/{uid}/profile/main`

서브컬렉션으로 분리 (자주 안 바뀜):

```typescript
interface Profile {
  ageBracket: "13-17" | "18-24" | "25-34" | "35-44" | "45+";
  gender: "female" | "male" | "nonbinary" | "no-answer";
  preferredGenres: string[];      // 온보딩 4단계
  
  // 14세 미만 보호 (한국)
  isMinor: boolean;
  parentalConsent?: {
    given: boolean;
    method: "phone" | "school" | "form";
    timestamp: Timestamp;
  };
  
  // 콘텐츠 필터 설정
  heavyContentEnabled: boolean;    // 13~17세 기본 false
  
  onboardedAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. 인생 (Life) — 가장 핵심 데이터

### 3.1 `/users/{uid}/lives/{lifeId}`

```typescript
interface Life {
  // 기본
  scenarioId: string;
  characterName: string;
  familyBackground: string;        // 시작 시 결정
  
  // 6 스탯
  stats: {
    intellect: number;             // 0~20
    creativity: number;
    emotion: number;
    physique: number;
    sociability: number;
    morality: number;
  };
  
  // Quality 변수 (Failbetter 패턴)
  qualities: {
    [key: string]: number;
  };
  // 예시:
  // {
  //   "seohi_bond": 5,
  //   "foreign_path": 3,
  //   "uigi": 2,
  //   "rage": 1,
  //   "father_pro_japan": 0,
  //   "drama_path_consistent": true
  // }
  
  // NPC 인연
  relationships: {
    [npcId: string]: {
      affinity: number;            // -10 ~ +10
      lastInteraction: number;     // 챕터 번호
      tags: string[];              // ["friend", "rival", "mentor"]
    }
  };
  
  // 캐스팅 (T-0 후 결정)
  castingRole: string | null;      // 예: "the_returner"
  castedAt: Timestamp | null;
  
  // 시점 — Cradle 타입에 따라 결정
  perspective: "self" | "parent" | "child_after_transition" | "cross";
  // self: self_youth 패턴
  // parent: parent_raising 패턴, 부모 시점
  // child_after_transition: parent_raising에서 아이 시점으로 전환됨
  // cross: 양쪽 교차 (프리미엄)
  
  // parent_raising 전용 — "키우는 아이" 데이터
  raisedChild?: {
    name: string;
    stats: Stats;                   // 아이의 스탯
    qualities: { [key: string]: number };
    relationships: { [npcId: string]: { affinity: number; tags: string[] } };
    age: number;
  };
  
  // 인생 경로 변수
  pathVariables: {
    isOnDramaPath: boolean;        // 드라마 흐름과 같이 가는가
    isDivergent: boolean;          // 갈라진 길에 들어섰는가
    metaChaptersSeen: number;
    iconicMomentsSeen: string[];
  };
  
  // 챕터 진행
  age: number;                     // 현재 나이 (시나리오에 따라 가변)
  currentChapterId: string | null;
  currentEventIndex: number | null;
  completedChapters: number[];
  
  // 카드 사용
  selectedHeroCardSlots: HeroCardId[]; // 시작 시 3장
  usedHeroCards: { cardId: string; usedAtChapter: number; }[];
  earnedLocationCardIds: string[];
  
  // 종료
  isFinished: boolean;
  endingId: string | null;
  endingNarrative: string | null;
  endingCardImageUrl: string | null;
  finishedAt: Timestamp | null;
  
  // 메타데이터
  createdAt: Timestamp;
  lastPlayedAt: Timestamp;
  totalPlayTimeSeconds: number;
  
  // 즉사 처리
  diedEarlyOfStat: keyof Life["stats"] | null;
  diedAtAge: number | null;
}
```

### 3.2 `/users/{uid}/lives/{lifeId}/chapters/{chapterId}`

각 챕터 진행 상세:

```typescript
interface ChapterProgress {
  chapterId: string;
  age: number;
  startedAt: Timestamp;
  finishedAt: Timestamp | null;
  
  // 챕터 시작 시 컴파일된 이벤트 풀 (Quality-based 결과)
  compiledEvents: string[];       // event IDs in order
  
  // 진행
  completedEventIds: string[];
  currentEventId: string | null;
  
  // AI 생성 챕터 시작 narrative
  introNarrative: string;
  
  // 챕터 종료 narrative
  endNarrative: string | null;
  
  // 변화
  statsAtStart: Stats;
  statsAtEnd: Stats | null;
}
```

### 3.3 `/users/{uid}/lives/{lifeId}/events/{eventId}`

각 이벤트 응답 로그 (감사용 + 다시보기용):

```typescript
interface EventResponse {
  eventId: string;
  chapterId: string;
  age: number;
  
  // 이벤트 메타
  eventType: "narrative" | "branch" | "iconic" | "meta" | "location";
  gateType: "knowledge" | "search" | "philosophy" | "location" | "creation" | null;
  
  // AI 생성 컨텐츠
  narrative: string;
  choices: { id: string; text: string; }[];
  
  // 사용자 응답
  selectedChoiceId: string | null;
  freeformInput: string | null;
  
  // AI 평가 (자유 입력 시)
  aiEvaluation: {
    statChanges: Partial<Stats>;
    qualityChanges: { [key: string]: number };
    feedback: string;
  } | null;
  
  // 결과
  resultNarrative: string;
  
  // 모더레이션 (자유 입력 시)
  moderationResult: "passed" | "flagged" | "blocked" | null;
  
  respondedAt: Timestamp;
}
```

---

## 4. 시나리오 (정적 콘텐츠)

### 4.1 `/scenarios/{scenarioId}`

```typescript
interface Scenario {
  // 메타
  id: string;
  title: { ko: string; en: string };
  subtitle: { ko: string; en: string };
  description: { ko: string; en: string };
  
  // 분류
  era: string;                     // "1900s_hanseong"
  genre: string[];                 // ["historical", "modern_drama"]
  heaviness: 1 | 2 | 3 | 4 | 5;    // 1=가벼움, 5=무거움
  recommendedAgeMin: number;       // 13
  
  // 일러스트
  coverImageUrl: string;
  
  // Cradle 구성 — Pre-Story 단계 정의
  cradleConfig: {
    type: "self_youth" | "parent_raising";
    cradleStartAge: number;          // 시작 나이
                                     //  - self_youth: 사용자 캐릭터의 나이
                                     //  - parent_raising: 아이의 나이 (0=임신/출산)
    cradleEndAge: number;            // T-0 시점 (드라마 시작 나이)
    
    // parent_raising 전용
    perspectiveTransition?: {
      defaultTransitionAge: number;  // 기본 전환 나이 (T-0)
      keepParentAllowed: boolean;    // 부모 시점 유지 가능 여부
      crossPerspectiveAllowed: boolean; // 교차 시점 가능 여부 (프리미엄)
    };
  };
  
  // Main Story 종료 나이
  mainStoryEndAge: number;           // 인생이 끝나는 나이 (보통 19~25)
  
  // 챕터 구조 (참조)
  chapterIds: string[];
  
  // 캐스팅 풀 (참조)
  castingRoleIds: string[];
  
  // 결말 풀 (참조)
  endingIds: string[];
  
  // 명장면 (참조)
  iconicMomentIds: string[];
  
  // 위치 카드 (참조)
  locationCardIds: string[];
  
  // 프리미엄 여부
  isPremium: boolean;
  
  // 상태
  status: "draft" | "published" | "archived";
  
  // 통계 (자동 계산)
  totalPlays: number;
  averageRating: number;
  
  publishedAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.2 `/scenarios/{scenarioId}/castingRoles/{roleId}`

```typescript
interface CastingRole {
  id: string;
  scenarioId: string;
  
  // 다국어
  name: { ko: string; en: string };          // "이방인의 길"
  shortDescription: { ko: string; en: string };
  
  // 캐스팅 결정 조건
  conditions: {
    requiredStats?: Partial<Stats>;          // { intellect: 15 }
    requiredQualities?: { [key: string]: number }; // { foreign_path: 3 }
    requiredFamilyBackground?: string[];
    forbiddenQualities?: { [key: string]: number };
  };
  priority: number;                          // 매칭 우선순위
  
  // T-0 narrative 템플릿
  t0NarrativeTemplate: { ko: string; en: string };
  
  // 결말 풀 참조
  endingIds: string[];
  
  // 명장면 풀 참조
  iconicMomentIds: string[];
}
```

### 4.3 `/scenarios/{scenarioId}/iconicMoments/{momentId}`

```typescript
interface IconicMoment {
  id: string;
  scenarioId: string;
  applicableCastings: string[];      // 어느 캐스팅에 등장 가능
  chapterAge: number;                // 어느 챕터에 등장
  
  // 트리거 조건
  conditions: {
    requiredQualities?: { [key: string]: number };
    requiredStats?: Partial<Stats>;
    requiredRelationships?: { [npcId: string]: number };
    cooldown?: number;               // 한 인생당 N회 이상 등장 금지
  };
  
  // 작가가 큐레이션한 setup
  setup: {
    location: string;
    locationCardId?: string;
    npcInvolved: string[];
    sceneDirective: string;          // AI에게 줄 지시문
    emotionalTone: string;
    expectedNarrativeLength: "short" | "medium" | "long";
  };
  
  // 선택의 결과 (작가가 미리 정의)
  outcomes: {
    dramaConsistent: {                // 드라마 정해진 길
      labelKo: string;
      labelEn: string;
      qualityChanges: { [key: string]: number };
      relationshipChanges: { [npcId: string]: number };
      statChanges: Partial<Stats>;
      pathFlag?: string;
    };
    divergent: {                      // 갈라진 길
      labelKo: string;
      labelEn: string;
      qualityChanges: { [key: string]: number };
      relationshipChanges: { [npcId: string]: number };
      statChanges: Partial<Stats>;
      activatesPath: string;
    };
    custom: {                          // 자유 입력 시
      evaluatorPrompt: string;        // AI에 줄 평가 프롬프트
    };
  };
}
```

### 4.4 `/scenarios/{scenarioId}/endings/{endingId}`

```typescript
interface Ending {
  id: string;
  scenarioId: string;
  castingRoleId: string;
  
  // 다국어
  title: { ko: string; en: string };          // "도화서 보조 화원"
  shortDescription: { ko: string; en: string };
  
  // 결정 조건
  conditions: {
    requiredStats?: Partial<Stats>;
    requiredQualities?: { [key: string]: number };
    requiredPathVariables?: Partial<PathVariables>;
  };
  priority: number;
  
  // narrative 생성용 컨텍스트
  narrativeContext: {
    historicalEvents: string[];                // 결말 시점 역사 사건
    keyMotifs: string[];                       // narrative 모티프
    suggestedQuoteThemes: string[];            // 명대사 주제 후보
  };
  
  // 카드 디자인 힌트
  cardArtStyle: {
    palette: string;                           // "joseon_classical" | "1900s_modern"
    composition: string;                       // "portrait" | "landscape" | "scene"
    moodKeywords: string[];
  };
  
  // 통계
  totalDiscoveries: number;                    // 글로벌 발견 횟수
  rarityPercentage: number;                    // 자동 계산
}
```

### 4.5 `/scenarios/{scenarioId}/locationCards/{cardId}`

```typescript
interface LocationCardDef {
  id: string;
  scenarioId: string;
  
  // 다국어
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  
  // 위치
  location: {
    name: { ko: string; en: string };          // "정동길"
    address: { ko: string; en: string };
    coordinates: [number, number];             // [lat, lng]
    radiusMeters: number;                      // 인증 반경
    countryCode: string;
  };
  
  // 트리거
  triggerScenario: string;
  triggerMomentId?: string;
  triggerChapterAge?: number;
  
  // 보상
  reward: {
    type: "stat_boost" | "quality_boost" | "hero_card";
    statBoosts?: Partial<Stats>;
    qualityBoosts?: { [key: string]: number };
    heroCardId?: string;
  };
  
  // 외부 링크
  googleMapsUrl?: string;
  streetViewUrl?: string;
  liveCctvUrl?: string;                        // 실시간 CCTV/풍경 스트림 (옵션)
  
  // 일러스트
  imageUrl: string;
  
  // 상태
  isActive: boolean;
}
```

---

## 5. 카드 시스템

### 5.1 `/users/{uid}/inventory`

```typescript
interface Inventory {
  uid: string;
  
  // 영구 컬렉션
  ownedCards: {
    [cardDefId: string]: number;     // 카드 종류별 보유 수량
  };
  // 예: { "time_return": 3, "guardian_angel": 1 }
  
  // 사용 통계
  totalPacksOpened: number;
  totalCardsUsed: number;
  
  updatedAt: Timestamp;
}
```

### 5.2 `/cardDefinitions/{cardId}` (글로벌)

```typescript
interface CardDefinition {
  id: string;
  
  // 다국어
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  effectDescription: { ko: string; en: string };
  
  // 분류
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  category: "rewind" | "preview" | "boost" | "shield" | "casting" | "narrative";
  
  // 사용 시점
  usageContext: ("event" | "chapter_start" | "chapter_end" | "casting" | "ending")[];
  
  // 효과
  effect: {
    type: string;
    parameters: any;
  };
  
  // 일러스트
  imageUrl: string;
  
  // 획득 방법
  acquisition: {
    fromPack: boolean;
    fromEnding: boolean;
    fromStreak: boolean;
    fromPurchase: boolean;
    purchasePriceKrw?: number;
  };
}
```

---

## 6. 스트릭 시스템

### 6.1 `/users/{uid}/streaks`

```typescript
interface Streak {
  uid: string;
  
  currentStreak: number;             // 현재 연속 일수
  longestStreak: number;
  lastPlayedDate: string;            // YYYY-MM-DD
  
  // Streak Freeze (휴식 보호)
  freezesAvailable: number;          // 0~3
  freezesUsed: { date: string }[];
  
  // 마일스톤 보상
  milestonesReached: number[];       // [7, 30, 100]
  
  updatedAt: Timestamp;
}
```

---

## 7. 결제

### 7.1 `/users/{uid}/billing`

```typescript
interface Billing {
  uid: string;
  
  // 구독
  subscription: {
    status: "active" | "canceled" | "expired" | "none";
    plan: "monthly" | "yearly" | null;
    startedAt: Timestamp;
    expiresAt: Timestamp;
    autoRenew: boolean;
    provider: "stripe" | "tosspay" | "apple" | "google";
    providerSubscriptionId: string;
  } | null;
  
  // 결제 이력
  totalSpentKrw: number;
  paymentHistory: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    timestamp: Timestamp;
  }[];
}
```

---

## 8. 글로벌 통계

### 8.1 `/globalStats/endingDiscovery/{endingId}`

```typescript
interface EndingStats {
  endingId: string;
  totalDiscoveries: number;
  
  // 결말 카드의 "0.7%" 같은 통계 계산용
  totalAttempts: number;             // 해당 시나리오 플레이 횟수
  rarityPercentage: number;
  
  lastDiscoveredAt: Timestamp;
}
```

---

## 9. Firestore 보안 규칙

### 9.1 `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 데이터 — 본인만 읽기/쓰기
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      
      match /{subCollection}/{docId} {
        allow read, write: if request.auth.uid == uid;
      }
    }
    
    // 시나리오 — 모두 읽기 가능, 쓰기는 admin만
    match /scenarios/{scenarioId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
      
      match /{subCollection}/{docId} {
        allow read: if true;
        allow write: if request.auth.token.admin == true;
      }
    }
    
    // 카드 정의 — 모두 읽기, 쓰기 admin
    match /cardDefinitions/{cardId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // 글로벌 통계 — 모두 읽기, 쓰기 시스템(Cloud Functions)만
    match /globalStats/{statId}/{subCol}/{docId} {
      allow read: if true;
      allow write: if false;        // Cloud Functions만 (admin SDK)
    }
    
    // 모더레이션 — admin 전용
    match /moderation/{anyPath=**} {
      allow read, write: if request.auth.token.admin == true;
    }
    
    // 분석 로그 — 시스템만
    match /analytics/{anyPath=**} {
      allow read, write: if false;
    }
    
    // 시스템 설정 — 모두 읽기
    match /system/{configId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### 9.2 미성년자 (14세 미만) 추가 규칙

미성년자 계정은 다음 추가 제약:
- 무거운 시나리오 (`heaviness >= 4`) 접근 차단
- 자유 입력 비활성화 (객관식만)
- 결제 차단

이는 클라이언트 + Cloud Functions에서 enforce.

---

## 10. Cloud Storage 구조

```
/scenarios-content/
├── {scenarioId}/
│   ├── manifest.json              # 시나리오 정의 (Firestore와 동일 구조)
│   ├── chapters/{chapterId}.json  # 챕터별 이벤트 풀 (정적)
│   ├── icons/                     # 일러스트들
│   ├── audio/                     # 음악 (옵션)
│
/user-cards/
├── {uid}/
│   ├── {lifeId}.png               # 결말 카드 이미지
│
/temp-uploads/
├── {uid}/
│   ├── location-photos/           # 위치 게이트 사진 (검증 후 삭제)
```

---

## 11. 데이터 흐름 (주요 시나리오)

### 11.1 새 인생 시작

```
1. 클라이언트: POST /api/lives/new
   { scenarioId, characterName, familyBackground }

2. Cloud Function:
   - 사용자 인증 검증
   - 미성년자면 시나리오 적합성 검증
   - 시나리오 정의 로드 (/scenarios/{id})
   - Life 객체 생성 (/users/{uid}/lives/{lifeId})
   - Chapter 1 생성 + Quality-based 이벤트 풀 컴파일
   - AI에 챕터 시작 narrative 요청 (Gemini Flash)
   - Chapter 데이터 저장
   - lifeId 반환

3. 클라이언트:
   - /play/{lifeId}/chapter/1/intro 으로 라우팅
```

### 11.2 이벤트 응답

```
1. 클라이언트: POST /api/lives/{lifeId}/events/{eventId}/respond
   { choiceId | freeformInput }

2. Cloud Function:
   - 자유 입력이면 → 모더레이션 체크
   - 자유 입력이면 → AI 평가 (Gemini Flash)
   - 객관식이면 → 미리 정의된 결과 적용
   - Stats / qualities / relationships 업데이트
   - 다음 이벤트 결정 또는 챕터 종료 판정
   - 즉사 체크 (스탯 0/20)
   - EventResponse 저장
   - 클라이언트에 결과 반환

3. 클라이언트:
   - 결과 narrative 표시 + 스탯 변화 애니메이션
   - 다음 이벤트로
```

### 11.3 T-0 캐스팅 결정

```
1. 챕터 7 (15세) 시작 트리거

2. Cloud Function:
   - 현재 stats + qualities + family 컨텍스트 평가
   - 시나리오의 castingPool 우선순위 순서로 매칭
   - 첫 매칭되는 role을 castingRole로 설정
   - 매칭 안 되면 "the_witness" (기본값)
   - T-0 narrative AI 생성 (Gemini Pro, 더 정성스럽게)
   - Life.castingRole 업데이트

3. 클라이언트:
   - S12 T-0 화면 (특별 연출)
   - 캐스팅 알림
   - Main Story 시작
```

### 11.4 엔딩

```
1. Main Story 종료 (시나리오의 mainStoryEndAge 도달) 또는 즉사 트리거

2. Cloud Function:
   - 현재 stats + qualities + path 평가
   - 캐스팅의 endingPool에서 매칭
   - 결말 narrative AI 생성 (Gemini Pro, 가장 정성스럽게)
   - 결말 카드 이미지 생성 (Stable Diffusion)
   - Life.isFinished = true, endingId 저장
   - 글로벌 통계 업데이트 (totalDiscoveries++)
   - 사용자 컬렉션에 추가

3. 클라이언트:
   - S16 엔딩 → S17 카드 → S18 공유
```

---

## 12. 인덱스

Firestore 복합 인덱스 (자주 쿼리되는 패턴):

```
/users/{uid}/lives:
- isFinished, finishedAt DESC
- scenarioId, finishedAt DESC

/scenarios:
- status, totalPlays DESC
- genre, status, totalPlays DESC

/globalStats/endingDiscovery:
- scenarioId, totalDiscoveries DESC
```

---

## 13. 데이터 마이그레이션 / 백업

- Firestore → Cloud Storage 매일 백업 (Cloud Scheduler + Cloud Function)
- 사용자 데이터 GDPR/PIPL 대응: 삭제 요청 시 `/users/{uid}` 전체 cascade 삭제 (Cloud Function)
- 시나리오 콘텐츠는 Cloud Storage 버전 관리 (Git-like)

---

## 14. 다음 문서

- AI 프롬프트: [06_AI_PROMPTS.md](06_AI_PROMPTS.md)
- 시나리오 작성: [07_SCENARIO_AUTHORING.md](07_SCENARIO_AUTHORING.md)
