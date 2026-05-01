# 02. 핵심 게임 메커니즘

이 문서는 K-Drama Life의 게임 시스템 전체를 정의한다. 개발자는 이 명세대로 엔진을 구현해야 한다.

---

## 1. 시스템 개요

```
[회원가입] 
    ↓
[시나리오 선택]
    ↓
[Pre-Story Cradle] ─── 누적 변수 형성 (시나리오별 길이)
    ↓
[T-0 캐스팅 결정 모먼트] ─── 5가지 캐스팅 풀 중 자동 배정
    ↓
[Main Story] ─── 드라마와 동행 또는 갈라진 길
    ↓
[엔딩 결정] ─── 6 스탯 + 변수 조합으로 결말 분기
    ↓
[결과 카드 생성 + 공유]
    ↓
[마이페이지 컬렉션 누적]
```

---

## 2. 핵심 데이터 — 캐릭터 상태

각 인생은 다음 데이터를 가진다:

```typescript
interface CharacterState {
  // 기본 정보
  scenarioId: string;        // 어느 시나리오인지
  characterName: string;     // 사용자가 정한 이름
  age: number;               // 현재 나이 (시나리오에 따라 가변)
  
  // 6가지 스탯 (0~20)
  stats: {
    intellect: number;       // 지력
    creativity: number;      // 창의력
    emotion: number;         // 감성
    physique: number;        // 체력
    sociability: number;     // 사회성
    morality: number;        // 도덕성
  };
  
  // 누적 변수 (Quality-based, Failbetter 패턴)
  qualities: {
    [key: string]: number;   // 예: "seohi_bond": 5, "foreign_path": 3
  };
  
  // 캐스팅 (T-0 이후 결정됨)
  castingRole: string | null;  // 예: "the_returner" (유진 격), "the_witness" (목격자)
  
  // 인생 경로 변수
  pathVariables: {
    isStuckOnDramaPath: boolean;   // 드라마 흐름과 같이 가는가
    isDivergent: boolean;          // 갈라진 길에 들어섰는가
    metaChapterCount: number;      // 메타 챕터 본 횟수
  };
  
  // 챕터 진행
  chaptersCompleted: number[];     // 완료한 챕터 번호들
  currentChapterId: string | null;
  
  // 카드
  ownedHeroCards: HeroCard[];
  usedHeroCards: HeroCard[];
  earnedLocationCards: LocationCard[];
  
  // 인연 그래프
  relationships: {
    [npcId: string]: {
      affinity: number;   // -10 ~ +10
      lastInteraction: number; // 챕터 번호
    }
  };
  
  // 메타데이터
  createdAt: Timestamp;
  lastPlayedAt: Timestamp;
  isFinished: boolean;
  endingId: string | null;
}
```

---

## 3. 6가지 스탯 시스템

### 3.1 6 스탯과 즉사

각 스탯은 0~20 범위. **0이 되거나 20이 차면 캐릭터가 극단적 결말로 종료**된다 (Reigns 패턴).

| 스탯 | 0의 결말 (예시) | 20의 결말 (예시) |
|---|---|---|
| 지력 | "무지의 함정에 빠져 사기당함" | "번아웃, 정신적 고립" |
| 창의력 | "관습에 갇힌 평생" | "예술의 광기, 사회와 단절" |
| 감성 | "감정 마비, 인간관계 단절" | "감정 과부하, 정신쇠약" |
| 체력 | "어린 나이에 병사" | "(드물다) 무인의 길로 자기파괴" |
| 사회성 | "은둔, 사회적 죽음" | "타인에게 휘둘림, 자기상실" |
| 도덕성 | "배신과 고립의 결말" | "광신, 융통성 결여로 파멸" |

즉사 결말은 Main Story 종료 전이라도 발생. 사용자에게 *"당신의 인생이 너무 일찍 끝났습니다"* 메시지와 결과 카드 (희귀도 높음).

### 3.2 스탯 변동 규칙

- 한 이벤트의 선택은 1~3개 스탯에 영향
- 변동 폭은 보통 ±1~3, 분기점은 ±5
- 매 챕터 종료 시 자동 변동 (자연 노화) — 예: 18세 이후 체력 -1/년

---

## 4. Pre-Story Cradle (전사 요람)

이 메커니즘이 본 게임의 핵심 차별화다.

### 4.1 작동 원리

드라마가 시작되는 시점을 T-0이라 하면, 사용자는 T-0 이전의 일정 기간을 시대 안에서 산다. 이 기간 동안 누적된 결정이 *T-0 시점에 어떤 인물이 될 수 있는가*를 자동 결정한다.

**Cradle은 시나리오마다 길이와 구조가 다르다.** 두 가지 패턴이 존재한다.

#### 패턴 A: `self_youth` — 사용자 본인의 어린 시절

주인공이 청소년/성인 나이부터 등장하는 드라마에 적용 (예: *Mr. Sunshine 정서* 15세 시작).

```
[T-N ~ T-0]  사용자가 본인의 어린 시절을 산다
              └ 자기 결정으로 캐릭터성 형성
              └ NPC 인연, 변수 누적
[T-0]        캐스팅 결정 — 주인공 / 주변 인물
[T+0 이후]   드라마와 동행, 본인 시점 유지
```

#### 패턴 B: `parent_raising` — 사용자가 부모로서 양육

주인공이 어린 나이부터 등장하는 드라마에 적용 (예: *Reply 1988* 8세 시작, 사극 어린 시절부터).

```
[T-N ~ T-0]  사용자가 부모로 아이를 양육
              └ 임신/출산부터 시작 가능
              └ 양육 결정으로 *아이*의 캐릭터성 형성
              └ 동네/이웃 아이들과의 관계도 결정
[T-0]        캐스팅 결정 — 내 아이가 주인공? 옆집 아이가 주인공? 
             내 아이는 주변 인물?
[T+0 이후]   시점 결정:
              - 부모 시점 계속 (어른의 시대극)
              - 아이 시점으로 전환 (아이 성장기)
              - 양쪽 교차 (드라마 형식, 프리미엄)
```

#### 시나리오별 Cradle 설정

각 시나리오 정의에 다음 구성이 들어간다:

```typescript
interface CradleConfig {
  type: "self_youth" | "parent_raising";
  cradleStartAge: number;     // 사용자가 시작하는 나이
                              //  - self_youth: 사용자 캐릭터 나이
                              //  - parent_raising: 아이의 나이 (0 = 임신/출산)
  cradleEndAge: number;       // T-0 시점 (드라마 시작 나이)
  
  // parent_raising 전용
  perspectiveTransition?: {
    transitionAge: number;    // 부모 → 아이 시점 전환 나이
    keepParentPerspective: boolean;  // 끝까지 부모 시점 가능?
    crossPerspective: boolean;       // 교차 시점 가능? (프리미엄)
  };
}
```

**시나리오별 적용 예시:**

| 시나리오 | type | start → end (years) |
|---|---|---|
| Mr. Sunshine 정서 | self_youth | 9 → 15 (6) |
| Hidden Court | self_youth | 11 → 14 (3) |
| Liberation | self_youth | 7 → 13 (6) |
| Reply 1988 | parent_raising | 0(임신) → 8 (8) |
| Idol Trainee | self_youth | 13 → 16 (3) |
| Iron Empress (사극) | parent_raising | 0(출산) → 6 (6) |

### 4.1.1 패턴 A 누적 항목

이 N년 동안:
- 사용자 본인의 스탯이 누적됨
- 본인이 NPC와 직접 인연을 형성함
- 본인의 가치관 변수가 결정됨

### 4.1.2 패턴 B 누적 항목

이 N년 동안:
- *아이*의 스탯이 누적됨 (부모의 양육 결정에 따라)
- *아이*가 만나는 동네 친구들 (이웃 NPC) 인연 결정
- *부모*의 가족 분위기 변수 (love_in_family, sibling_dynamics 등)
- 가정환경 변수 (양반가/평민, 도시/시골, 유복/가난)

**중요:** 두 패턴 모두 사용자는 *자신이 누구가 될지* 명시적으로 모른다 ❌. 시스템도 미리 알리지 않는다. Cradle 종료 시점에 자동 결정된다.

### 4.2 캐스팅 풀 (시나리오마다 5명)

각 시나리오는 5개의 캐스팅 후보를 가진다. 예시 (*Mr. Sunshine 정서*, self_youth 패턴):

```
Casting Pool: 1900s_hanseong

A. THE RETURNER (이방인)
   조건: stats.intellect ≥ 15 + qualities.foreign_path ≥ 3 
         + qualities.morality_for_independence ≥ 5
   인물 결: 미국에서 돌아온 군관
   결말 풀: 의병의 길, 망명, 미국 정착, 익명의 영웅...

B. THE GENTLEMAN (도련님)  
   조건: stats.morality ≥ 15 + 양반가 출신 + qualities.father_pro_japan ≥ 3
   인물 결: 친일가 아들, 양심 있는 도련님
   결말 풀: 비밀 독립자금책, 가문과의 결별, 자결, 위장 친일...

C. THE LADY (의기 있는 처녀)
   조건: 양반가 처녀 출신 + stats.intellect ≥ 12 + qualities.uigi ≥ 5
   인물 결: 양반가 의병 활동가
   결말 풀: 의병 지도자, 만주 망명, 옥사, 위장 결혼...

D. THE BLADE (백정)
   조건: 백정/하층 출신 + stats.physique ≥ 14 + qualities.rage ≥ 5
   인물 결: 일본 야쿠자 조직원
   결말 풀: 조직 보스, 배신 후 의병 합류, 의문의 죽음...


E. THE WITNESS (목격자)
   조건: 위 4개 조건 모두 미충족 (기본값)
   인물 결: 종로 거리의 평범한 사람
   결말 풀: 한약방 주인, 거리의 노래꾼, 은퇴 농부, 일기 작가...
```

**parent_raising 패턴 캐스팅 풀 예시 (*Reply 1988 정서*):**

```
Casting Pool: 1988_alley

캐스팅 결정 시 평가 대상:
- "내 아이"의 누적 스탯/변수
- 동네 다른 아이들의 변수 (옆집 정환, 택, 동룡 격)
- 가족 분위기 변수

A. MY_CHILD_AS_PROTAGONIST (내 아이가 주인공)
   조건: my_child.sociability ≥ 14 + my_child.warmth ≥ 12 
         + family_warmth ≥ 8
   인물 결: 동네의 중심에 선 평범하지만 사랑받는 아이
   시점: 부모 → 아이 시점 전환 가능

B. MY_CHILD_AS_QUIET_OBSERVER (내 아이는 조용한 관찰자)
   조건: my_child.intellect ≥ 14 + my_child.sociability ≤ 8
         + neighbor_kid_jung.bond ≥ 5
   인물 결: 옆집 친구를 조용히 좋아하는 아이
   시점: 부모 또는 아이 시점

C. MY_CHILD_AS_GENIUS (내 아이가 특별한 재능)
   조건: my_child.creativity ≥ 16 (음악/바둑/예술 중 하나)
   인물 결: 어린 나이에 두각을 나타내는 아이
   시점: 양쪽

D. STAYS_PARENT_PERSPECTIVE (부모 시점 계속)
   조건: family_drama_qualities ≥ 10
         + 사용자가 시점 전환 시 부모 유지 선택
   인물 결: 골목 어른의 시대극 (어른들의 인생)
   시점: 부모 끝까지

E. MY_CHILD_AS_NEIGHBOR (내 아이는 주변 인물)
   조건: 위 4개 미충족 (기본값)
   인물 결: 주인공은 옆집 아이, 내 아이는 그 옆에서 자람
   시점: 부모 또는 아이 시점
```

### 4.3 T-0 캐스팅 결정 알고리즘

```typescript
function determineCasting(state: CharacterState, scenario: Scenario): string {
  const { stats, qualities } = state;
  
  // 우선순위 순서대로 평가 (먼저 매칭되는 것이 결정)
  for (const role of scenario.castingPool) {
    if (role.id === "the_witness") continue; // 기본값은 마지막
    
    if (evaluateConditions(role.conditions, stats, qualities)) {
      return role.id;
    }
  }
  
  return "the_witness"; // 기본값
}
```

### 4.4 T-0 모먼트 사용자 경험

캐스팅이 결정되면 사용자에게 영화 OP 같은 narrative가 출력된다.

#### 4.4.1 self_youth 패턴

```
[Chapter 7 시작 시 (15세, T-0)]

[애니메이션: 시간이 흐르는 effect, 1900년 한성 배경]

15세, 1900년 가을.

당신은 미국에서 돌아왔다.
3년 전 떠난 곳에 다시 왔다.
당신은 이제 미국 해병대 군복을 입고 있다.

한성의 거리는 변했다.
변하지 않은 것은 — 일본인 상점이 더 늘어났다는 것이다.

(당신의 이야기는 이제 시작된다.)

▼ 계속하기
```

시스템은 캐스팅 이름을 명시하지 않는다. 사용자가 알아채게 한다.

#### 4.4.2 parent_raising 패턴 — 시점 전환 모먼트

부모 시점에서 아이 시점으로 전환되는 결정적 모먼트. 영화에서 카메라가 부모에서 자식으로 이동하는 장면과 같은 연출.

```
[T-0 모먼트, 1988년 봄, 아이 8세]

[narrative — 부모 시점 마지막]
"덕희가 아침에 가방을 메고 학교 첫 등교를 간다.
당신은 문 앞에서 그 작은 등을 바라본다.

아이는 한 번 뒤돌아 손을 흔들고는,
다시는 뒤돌아보지 않는다.

이제 이 이야기는 그 아이의 것이다."

[전환 옵션 표시]

이제 이야기를 어떻게 따라갈까요?

[A] 덕희의 시점으로 — 8세부터 18세까지의 성장
[B] 어머니로 계속 — 40대 어른의 시대극
[C] 양쪽 교차 — 두 시점 모두 (프리미엄)
```

선택에 따라:
- A: 사용자 컨트롤 시점이 자녀로 전환, 자녀의 챕터로 이어짐
- B: 부모 시점 유지, 어른의 인생/관계/시대를 계속 살아감
- C: 챕터마다 두 시점 교차 (프리미엄 결제 트리거)

자녀 시점 전환 시 누적 변수 처리:
- 자녀의 스탯/변수는 그대로 이어짐 (Cradle 누적)
- 부모와의 관계 변수는 *NPC*로 보존됨 (인연으로 등장)

### 4.5 캐스팅 다시 굴리기 (히어로 카드)

사용자가 캐스팅 결과를 마음에 들어하지 않으면 [Casting Re-roll] 카드를 사용해 다른 캐스팅을 시도할 수 있다 (단, T-0 이전 데이터는 그대로). 이 카드는 프리미엄 결제 또는 데일리 스트릭 보상으로 획득.

---

## 5. 챕터 시스템

### 5.1 챕터 구조

한 인생 = 시나리오의 Cradle 길이 + Main Story 길이.
- Cradle 길이는 시나리오마다 다름 (3~8년)
- Main Story 길이도 시나리오마다 다름 (3~10년)
- 평균 한 인생: 8~14챕터, 약 40~60분 플레이

각 챕터:
- 챕터 시작 narrative (AI 생성, 약 200자)
- 5~7개 이벤트
- 챕터 종료 narrative + 스탯 변화 시각화

**Pre-Story Cradle 단계 (시나리오의 cradleConfig에 정의된 만큼)**
- self_youth: 사용자 본인의 어린 시절
- parent_raising: 사용자가 부모로 양육
- 캐스팅 결정 변수 누적

**T-0 모먼트 (Cradle 종료 시점)**
- 캐스팅 자동 결정
- 특별한 OP 시퀀스
- parent_raising은 시점 전환 결정 추가

**Main Story 단계 (T-0 이후 ~ 인생 종료)**
- 드라마 명장면 등장
- 정해진 길 vs 갈라진 길 분기
- 결말 변수 결정
- 사용자 시점에 따라 narrative 톤 다름

**시나리오별 챕터 구성 예시:**

| 시나리오 | Cradle | Main | 총 챕터 |
|---|---|---|---|
| Mr. Sunshine 정서 | 9→15 (6챕터) | 15→19 (4챕터) | 10 |
| Hidden Court | 11→14 (3챕터) | 14→22 (8챕터) | 11 |
| Reply 1988 (parent) | 0→8 (8챕터) | 8→18 (10챕터) | 18 ※시점 전환 옵션 |
| Idol Trainee | 13→16 (3챕터) | 16→22 (6챕터) | 9 |

### 5.2 이벤트 종류

각 이벤트는 다음 중 하나:

| 종류 | 설명 | 빈도 |
|---|---|---|
| **일상 narrative** | 작은 선택 + 미세 스탯 변동 | 챕터당 2~3개 |
| **분기점** | 큰 선택 + 변수 활성화 | 챕터당 1~2개 |
| **명장면 (Iconic)** | 드라마 정서를 담은 특별 모먼트 | 챕터당 0~1개 |
| **메타 챕터** | 무거운 사건 후 회고 | 무거운 챕터에 1번 |
| **위치 게이트** | 실제 장소 방문 보너스 | 챕터당 0~1개 (옵션) |

### 5.3 게이트 5종

각 이벤트는 5가지 게이트 중 하나로 평가된다:

```typescript
type GateType = 
  | "knowledge"   // 지식 게이트: 자기 언어로 설명
  | "search"      // 검색 게이트: 외부 정보 찾기 (자율)
  | "philosophy"  // 철학 게이트: 정답 없는 가치판단
  | "location"    // 위치 게이트: GPS 인증
  | "creation";   // 창작 게이트: 결과물 제작
```

상세 평가 프롬프트는 [06_AI_PROMPTS.md](06_AI_PROMPTS.md) 참조.

---

## 6. Quality-based Narrative

이벤트 풀은 정적이지 않다. 사용자의 현재 스탯 + 변수에 따라 **마주칠 수 있는 이벤트가 동적으로 결정**된다 (Failbetter 패턴).

### 6.1 작동 방식

```typescript
function selectChapterEvents(
  state: CharacterState, 
  chapterId: string
): Event[] {
  const allEvents = getEventsForChapter(chapterId);
  
  // 조건 충족 이벤트만 필터
  const eligibleEvents = allEvents.filter(event => 
    evaluateConditions(event.conditions, state.stats, state.qualities)
  );
  
  // 우선순위로 5~7개 선택
  return prioritizeEvents(eligibleEvents, state, 5, 7);
}
```

### 6.2 효과

- 도덕성 18+ 캐릭터 → "윤리위원회 초대장" 같은 이벤트 등장
- 창의력+감성 ≥ 30 → "전국 청년 작가 대회" 분기
- 지력 18+ ∧ 사회성 6- → "고립된 천재" 분기 (위험)

같은 챕터라도 캐릭터에 따라 마주치는 사건이 완전히 달라진다. **이게 다회차 동기의 핵심이다.**

---

## 7. 명장면 (Iconic Moments) 시스템

### 7.1 정의

각 시나리오의 특정 캐스팅에는 **드라마 명장면 정서를 담은 특별 이벤트**가 있다. 이 이벤트는 작가가 큐레이션한 *형식*에 AI가 *변형*을 더해 생성한다.

### 7.2 명장면 데이터 구조

```typescript
interface IconicMoment {
  id: string;
  scenarioId: string;
  chapterAge: number;          // 어느 챕터에 등장하는지
  applicableCastings: string[]; // 어느 캐스팅에 등장하는지
  
  // 트리거 조건
  conditions: {
    requiredQualities?: { [key: string]: number };
    requiredStats?: Partial<Stats>;
    requiredRelationships?: { [npcId: string]: number };
  };
  
  // 작가가 큐레이션한 형식
  setup: {
    location: string;          // 예: "1902년 봄, 한성 어느 카페"
    npcInvolved: string;       // 예: "yangban_lady"
    sceneDirective: string;    // AI에게 줄 지시문
    emotionalTone: string;     // 예: "차가운 첫 만남, 호감도 분기"
  };
  
  // AI가 동적 생성 (자세한 narrative + 선택지 텍스트)
  // 호출 시점에 LLM이 만듦
  
  // 선택의 결과 (작가가 미리 정의한 변수 효과)
  outcomes: {
    dramaConsistent: {         // 드라마 정해진 길
      qualityChanges: { [key: string]: number };
      relationshipChanges: { [npcId: string]: number };
    };
    divergent: {               // 갈라진 길
      qualityChanges: { [key: string]: number };
      relationshipChanges: { [npcId: string]: number };
      activatesPath: string;   // 새로운 분기 활성화
    };
  };
}
```

### 7.3 명장면 생성 흐름 (개발자용)

```
1. 챕터 진입 시
2. 사용자 상태 + 캐스팅 + 변수로 후보 명장면 필터
3. 후보가 있으면 그 중 1개 선택
4. AI에 setup.sceneDirective + 사용자 컨텍스트 + 톤 전달
5. AI가 narrative + 선택지 3개 생성
6. 사용자에게 표시
7. 사용자 선택에 따라 outcomes 적용
```

### 7.4 명장면 자산 — AI가 만든다

**핵심: 명장면 *narrative 텍스트는 AI가 동적 생성*한다.** 사람이 작성하는 것은:
- setup (장면 배경, 등장 NPC, 톤)
- outcomes (선택의 결과 변수)

이 둘만 큐레이터가 정의하면, 매번 사용자마다 다른 narrative가 나온다. 

**시나리오당 명장면 개수: 5~10개**
시나리오 30개 × 7개 = 210개의 *setup + outcomes* 정의. 각 정의 약 30분 작업 = 약 100시간 = 큐레이터 1명 풀타임 1개월 분량.

상세는 [07_SCENARIO_AUTHORING.md](07_SCENARIO_AUTHORING.md) 참조.

---

## 8. 메타 챕터 시스템

### 8.1 목적

무거운 역사적 사건(일제강점기 만행, 6·25, 5·18 등)을 다룰 때 사용자가 트라우마 없이 학습하도록 보조.

### 8.2 트리거

다음 조건에서 메타 챕터가 자동 등장:
- 챕터 안에 *"heavy_history": true* 플래그 이벤트가 1개 이상 발생
- 챕터 종료 후, 다음 챕터 시작 전에 끼어 들어감

### 8.3 메타 챕터 구성

```
1. 사실 명시 (AI 생성, 출처 포함)
   "이 챕터에서 등장한 역사적 사건들:
   • 1923년 9월 1일 관동대지진
   • 그 직후 일본인들이 '조선인이 우물에 독을 넣었다'는 
     유언비어를 퍼뜨림
   • 일본 군경과 자경단에 의해 약 6,000명의 조선인이 학살됨
   • 이 사건은 일본에서 오랫동안 부정·축소되었음
   
   출처: [Wikipedia 링크], [학술 자료 링크]"

2. 사용자의 회고 입력
   "당신의 캐릭터는 이 사건을 어떻게 기억할까요?"
   [자유 입력 — 짧은 회고]

3. AI 평가 + 격려 코멘트
   (사용자 답변에 따라 가벼운 피드백)

4. 다음 챕터로 진행
```

### 8.4 효과

- 트라우마 안전 장치
- 학습 효과 강화
- *"I learned about Kanto Massacre through this game"* 같은 SNS 공유 자연 발생 → 글로벌 바이럴 자산

---

## 9. 히어로 카드 시스템

### 9.1 카드 종류

| 카드 | 효과 | 희귀도 | 획득 방식 |
|---|---|---|---|
| 시간의 귀환 | 한 챕터를 되돌려 다시 진행 | 레어 | 결말 보상, 결제 |
| 운명의 책 | 다음 분기점의 결과 미리보기 | 언커먼 | 챕터 보상 |
| 두 번째 기회 | 한 미션을 다시 시도 (다른 답으로) | 커먼 | 데일리 스트릭 |
| 현인의 조언 | 철학 게이트 답변에 AI 멘토 코멘트 | 커먼 | 일반 보상 |
| 수호천사 | 스탯 즉사를 1회 막음 | 에픽 | 결제, 결말 보상 |
| 숨은 재능 | 한 스탯 영구 +3 | 레어 | 위치 게이트, 결제 |
| Casting Re-roll | T-0 시점 캐스팅 다시 굴리기 | 에픽 | 결제 |
| 영감의 순간 | 다음 챕터에 희귀 이벤트 등장 확률↑ | 언커먼 | 결말 보상 |

### 9.2 카드 사용 슬롯 제한

한 인생당 사용 가능 카드 슬롯: **3장**. 영구 컬렉션은 무한이지만, 이 인생에서 쓸 카드는 시작 시 3장 선택. 이게 전략적 긴장을 만든다.

### 9.3 결제 모델

- 카드팩 1팩 ₩1,000 (커먼 3 + 언커먼 1 보장)
- 카드팩 10팩 ₩8,000 (할인)
- 시간의 귀환 단품 ₩2,000

상세 결제는 [05_DATA_MODEL.md](05_DATA_MODEL.md)와 [10_TECH_STACK.md](10_TECH_STACK.md).

---

## 10. 위치 카드 시스템

### 10.1 작동 방식

각 시나리오의 명장면에는 *실제 장소*가 매핑되어 있다 (있으면).

```typescript
interface LocationCard {
  id: string;
  name: string;              // "정동길의 봄"
  location: {
    address: string;         // "서울 중구 정동길"
    coordinates: [number, number];
    radius: number;          // 인증 반경 (m)
  };
  triggerScenario: string;   // 어느 시나리오에서 트리거되는지
  triggerMoment: string;     // 어느 명장면에서 트리거되는지
  reward: {
    type: "hero_card" | "stat_boost" | "quality_boost";
    value: any;
  };
}
```

### 10.2 사용자 경험 (한국 거주자)

```
[명장면 종료 후]

🎴 위치 보너스 가능!

이 장면의 배경은 "정동길"입니다.
서울 중구 정동길의 덕수궁 돌담길을 직접 방문해서 
사진을 찍으면 [정동의 봄] 카드 획득.

"정동의 봄" 카드 효과:
- 다음 분기점에서 호감도 +5
- "한국과의 인연" 변수 +3

[지도 보기 (구글 지도)]  [위시리스트 추가]  [나중에]
```

### 10.3 사용자 경험 (외국인, 한국 여행 미예정)

```
🎴 한국 여행 위시리스트

이 장면의 배경은 "Jeongdong-gil, Seoul"입니다.
실제로 방문할 계획이 있다면 위시리스트에 추가하세요.
방문 시 게임 내 카드를 획득할 수 있어요.

[위시리스트 추가]  [구경하기 (스트리트뷰)]  [나중에]
```

상세는 [08_LOCATION_SYSTEM.md](08_LOCATION_SYSTEM.md).

---

## 11. 결말 시스템

### 11.1 결말 결정 알고리즘

Main Story 종료 시점 (시나리오의 mainStoryEndAge 도달) 또는 즉사 트리거 시:

```typescript
function determineEnding(state: CharacterState, scenario: Scenario): string {
  const { stats, qualities, castingRole, pathVariables } = state;
  
  // 캐스팅별 결말 풀에서 검색
  const role = scenario.castingPool.find(r => r.id === castingRole);
  const endingPool = role.endings;
  
  // 조건 매칭, 우선순위 순서
  for (const ending of endingPool) {
    if (evaluateConditions(ending.conditions, stats, qualities, pathVariables)) {
      return ending.id;
    }
  }
  
  return endingPool[endingPool.length - 1].id; // 기본값
}
```

### 11.2 결말 분포 (시나리오당)

각 시나리오 평균:
- 캐스팅 5종 × 결말 6~10개 = **30~50개 결말**
- 시나리오 30개 × 평균 40개 = **약 1,200개 총 결말**
- 즉사 결말 (스탯 0/20) 별도 6개

### 11.3 결말 narrative 생성

AI가 결말 narrative를 동적 생성. 입력:
- 캐릭터 일대기 요약 (스탯 변화, 핵심 결정들)
- 캐스팅과 결말 ID
- 시대 컨텍스트

출력: 1~2문단 회고 narrative + 한 줄 명대사 + 발견 통계

---

## 12. 결과 카드 (SNS 공유)

### 12.1 카드 구성

```
┌─────────────────────────────────────┐
│   [시대 일러스트 (Stable Diffusion)]   │  ← 캐릭터 + 시대 분위기
│                                     │
│   AREUM CHOI                        │  ← 캐릭터 이름
│   The Court Painter of Joseon       │  ← 결말 한 줄
│                                     │
│   "내 붓에는 두려움이 없다."           │  ← AI 추출 명대사
│                                     │
│   1696 - 1748                       │  ← 인생 연대
│   Discovered ending: 0.7%           │  ← 희귀도
│                                     │
│   ┌───────┬───────┬───────┐         │
│   │ INT 18│ CRE 19│ EMO 14│         │  ← 최종 스탯
│   │ PHY 11│ SOC 9 │ MOR 16│         │
│   └───────┴───────┴───────┘         │
│                                     │
│   Live your own — kdramalife.app    │  ← CTA
└─────────────────────────────────────┘
```

### 12.2 공유 채널

- 카카오톡 / 네이버 (한국)
- TikTok / Instagram / X / Threads (글로벌)
- Threads / 디스코드 (서양)
- 다운로드 (저장)

### 12.3 카드 생성 기술

- Canvas API 또는 React server component (정적 PNG 생성)
- 일러스트는 Stable Diffusion API (한국적 스타일 finetuned 모델)
- 한국어/영어 두 언어 동시 생성

---

## 13. 마이페이지 — 컬렉션 시스템

### 13.1 화면 구성

```
[마이페이지]

   인생 살기: 7번
   결말 발견: 7 / 200
   히어로 카드 보유: 23장
   
   [이번 달 스트릭: 12일 🔥]
   
   ─────────────────────────────────
   
   <지난 인생들>
   
   [Areum Choi - The Court Painter of Joseon]   [공유] [다시보기]
   [Min-jun Park - The Returner of Hanseong]    [공유] [다시보기]  
   ...
   
   <발견하지 못한 결말>
   
   [???] [???] [???] ... (그림자만 표시)
   
   <히어로 카드 컬렉션>
   
   [시간의 귀환 x3]  [수호천사 x1]  [Casting Re-roll x2] ...
```

### 13.2 컬렉션의 정신

- 발견한 결말은 그 인생을 다시 볼 수 있음 (Read-only)
- 발견 못한 결말은 그림자로만 표시 (호기심 유발)
- 다회차 동기 강화

---

## 14. 다음 문서

- 사용자 여정 상세: [03_USER_FLOWS.md](03_USER_FLOWS.md)
- 화면 구성 상세: [04_SCREENS.md](04_SCREENS.md)
- 데이터 모델: [05_DATA_MODEL.md](05_DATA_MODEL.md)
- AI 프롬프트: [06_AI_PROMPTS.md](06_AI_PROMPTS.md)
- 시나리오 작성법: [07_SCENARIO_AUTHORING.md](07_SCENARIO_AUTHORING.md)
- 위치 시스템: [08_LOCATION_SYSTEM.md](08_LOCATION_SYSTEM.md)
- 모더레이션: [09_MODERATION.md](09_MODERATION.md)
