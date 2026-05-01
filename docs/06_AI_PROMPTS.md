# 06. AI 프롬프트 라이브러리

모든 LLM 호출 패턴, 프롬프트 템플릿, 비용 관리.

---

## 1. AI 호출 인벤토리

K-Drama Life에서 LLM이 하는 일은 6가지로 정리된다.

| ID | 호출 종류 | 모델 | 빈도 | 비용/호출 | 사용 시점 |
|---|---|---|---|---|---|
| AI-1 | 시나리오 추천 | Gemini Flash | 가입당 1회 | ~₩2 | 온보딩 종료 시 |
| AI-2 | 챕터 시작 narrative | Gemini Flash | 챕터당 1회 | ~₩3 | 챕터 진입 시 |
| AI-3 | 이벤트 narrative + 선택지 | Gemini Flash | 챕터당 5~7회 | ~₩2 | 이벤트 표시 전 |
| AI-4 | 자유 입력 평가 | Gemini Flash | 가변 | ~₩3 | 자유 입력 제출 시 |
| AI-5 | T-0 캐스팅 narrative | Gemini Pro | 인생당 1회 | ~₩15 | 챕터 7 진입 시 |
| AI-6 | 명장면 동적 생성 | Gemini Pro | 인생당 5~10회 | ~₩10 | 명장면 트리거 시 |
| AI-7 | 메타 챕터 사실 narrative | Gemini Flash | 챕터당 0~1회 | ~₩3 | 무거운 사건 후 |
| AI-8 | 챕터 종료 요약 | Gemini Flash | 챕터당 1회 | ~₩3 | 챕터 종료 시 |
| AI-9 | 결말 narrative | Gemini Pro | 인생당 1회 | ~₩30 | Main Story 종료 시 |
| AI-10 | 명대사 추출 | Gemini Flash | 인생당 1회 | ~₩2 | 결말 카드 생성 시 |
| AI-11 | 모더레이션 분류 | Gemini Flash | 자유 입력당 1회 | ~₩1 | 자유 입력 제출 시 |
| AI-12 | 결말 카드 일러스트 | Stable Diffusion | 인생당 1회 | ~₩70 | 결말 카드 생성 시 |

### 1.1 한 인생당 총 비용 추산

```
챕터 진입 narrative (AI-2): 10회 × ₩3 = ₩30
이벤트 narrative (AI-3): 60회 × ₩2 = ₩120
자유 입력 평가 (AI-4): 평균 5회 × ₩3 = ₩15
T-0 캐스팅 (AI-5): 1회 × ₩15 = ₩15
명장면 (AI-6): 평균 5회 × ₩10 = ₩50
메타 챕터 (AI-7): 평균 2회 × ₩3 = ₩6
챕터 요약 (AI-8): 10회 × ₩3 = ₩30
결말 narrative (AI-9): 1회 × ₩30 = ₩30
명대사 추출 (AI-10): 1회 × ₩2 = ₩2
모더레이션 (AI-11): 평균 5회 × ₩1 = ₩5
결말 일러스트 (AI-12): 1회 × ₩70 = ₩70

총: ₩373/인생
```

**비용 최적화 후 목표: ₩200/인생 미만** (캐싱 + 짧은 프롬프트 + Flash-Lite 활용)

---

## 2. 모델 선택 전략

### 2.1 Gemini Flash (빠르고 저렴)

사용:
- 짧은 narrative (200자 미만)
- 단순 평가 (객관식 선택의 결과)
- 모더레이션 분류
- 챕터 요약

특징: 50ms, 토큰당 매우 저렴

### 2.2 Gemini Pro (정성스러움)

사용:
- T-0 캐스팅 narrative (영화 OP 모먼트)
- 명장면 동적 생성 (감정적 무게)
- 결말 narrative (가장 정성)

특징: 200ms, 토큰당 ~6배 비쌈, 결과 품질 명확히 우월

### 2.3 Claude API (Fallback)

사용:
- Gemini가 실패하거나 부적절한 결과 시 백업
- 복잡한 한국어 / 한국 문화적 뉘앙스가 중요한 경우

### 2.4 Stable Diffusion API

사용:
- 결말 카드 일러스트
- 시나리오 카드 일러스트 (사전 생성)

추천 모델: Stable Diffusion 3 / Korean-style finetuned LoRA

---

## 3. 시스템 프롬프트 (공통)

모든 호출에 공통으로 들어가는 base 시스템 프롬프트:

```
당신은 K-Drama Life의 내러티브 엔진입니다.

원칙:
1. 한국 시대 정서와 K-드라마 톤을 정확히 담아냅니다.
2. 역사적 사실을 왜곡하지 않습니다. 픽션은 사실 위에서만 자유롭습니다.
3. 특정 드라마 제목, 캐릭터명, 명대사를 직접 인용하지 않습니다.
4. 대신 그 드라마들이 그리는 시대 정서, 갈등 구조, 인간상을 담아냅니다.
5. 선악을 단순하게 그리지 않습니다. 회색 인물, 시대의 압력, 복잡한 동기를 보여줍니다.
6. 무거운 역사적 사건(일제강점, 학살, 전쟁 등)을 다룰 때는 피해자에 대한 존엄을 잃지 않습니다.
7. 사용자의 선택을 존중합니다. 도덕적 판단을 강요하지 않습니다.
8. 한국어로 작성 시 자연스러운 시대극 톤. 영어 작성 시 시청자에게 친숙한 K-drama subtitle 톤.

금기:
- 실존 인물의 사적 영역 묘사
- 미성년자 대상 부적절 콘텐츠
- 특정 정치 입장 강요
- 종교적/인종적 차별
- 폭력의 미화
```

이 프롬프트는 모든 호출에 prepend된다.

---

## 4. 프롬프트 템플릿

### AI-1: 시나리오 추천

```
[시스템: 공통 프롬프트]

사용자 정보:
- 나이대: {ageBracket}
- 성별: {gender}
- 거주국: {countryCode}
- 관심 장르: {preferredGenres}

가용 시나리오 (30개):
{scenariosList}  ← id, title, era, heaviness, genre

다음 조건으로 5개 시나리오를 추천해주세요:
1. 사용자 선호 장르 1개 이상 매칭
2. 시대 다양성 (사극, 근현대, 현대 골고루)
3. 무게 다양성 (가벼움 ~ 무거움 골고루)
4. 13~17세는 heaviness ≥ 4 시나리오 제외

JSON 형식으로 답하세요:
{
  "recommendations": [
    { "scenarioId": "...", "reason": "..." },
    ...
  ]
}
```

**모델:** Gemini Flash
**비용:** ~₩2

### AI-2: 챕터 시작 narrative

```
[시스템: 공통 프롬프트]

당신은 {scenarioTitle}의 챕터 시작 narrative를 작성합니다.

캐릭터 컨텍스트:
- 이름: {characterName}
- 나이: {age}
- 가족 배경: {familyBackground}
- 현재 스탯: {stats}
- 주요 변수: {keyQualities}
- 캐스팅 (T-0 후): {castingRole or "미정"}

이전 챕터 요약:
{previousChapterSummary}

이 챕터의 시대 컨텍스트:
- 연도: {year}
- 계절: {season}
- 시대 사건: {historicalEvents}

작성 지침:
- 200자 이내
- 시대극 톤 (한국어) 또는 K-drama subtitle 톤 (영어)
- 사용자가 그 해의 분위기를 즉시 느낄 수 있도록
- 챕터에서 일어날 일을 살짝 암시 (스포일러는 X)

언어: {language}

narrative만 출력하세요. 설명 X.
```

**모델:** Gemini Flash
**비용:** ~₩3

**예시 출력:**

```
12세, 1897년 봄.
한성에 새 칙명이 내렸다. 대한제국. 그 이름이 거리에 떠돈다.
당신은 한약방 일을 익히고 있고, 이웃의 양반가 따님은 
요즘 부쩍 자주 약을 사러 온다. 한문 책을 들고서.
변하는 것은 나라의 이름만이 아닌 듯하다.
```

### AI-3: 이벤트 narrative + 선택지

```
[시스템: 공통 프롬프트]

이벤트 정의 (작가가 큐레이션):
- 이벤트 ID: {eventId}
- 이벤트 종류: {eventType}      ← narrative, branch, etc.
- 게이트 종류: {gateType}        ← knowledge, philosophy, etc.
- 작가 지시문: {sceneDirective}
- 등장 NPC: {npcs}

캐릭터 컨텍스트:
- 이름: {characterName}, 나이: {age}
- 스탯: {stats}
- 변수: {qualities}
- 인연: {relationships}

가능한 결과 (작가 정의):
- 옵션 A: {outcomeA.label}
- 옵션 B: {outcomeB.label}
- 옵션 C: 자유 입력

작성 지침:
1. 장면 narrative: 100~150자, 1~2문단
2. 옵션 A 텍스트: 자연스럽게, "..." 형식
3. 옵션 B 텍스트: 옵션 A와 구분되는 결
4. 옵션 C: 항상 "(자유롭게 답하기)" 또는 영어 버전

JSON 형식:
{
  "narrative": "...",
  "choices": [
    { "id": "A", "text": "..." },
    { "id": "B", "text": "..." },
    { "id": "C", "text": "(자유롭게 답하기)" }
  ]
}

언어: {language}
```

**모델:** Gemini Flash
**비용:** ~₩2

### AI-4: 자유 입력 평가

```
[시스템: 공통 프롬프트]

상황:
{eventNarrative}

질문/이벤트:
{eventQuestion}

학생 답변:
{userInput}

게이트 종류: {gateType}
평가 기준 (gateType별):
- knowledge: 자기 언어로 풀어낸 정확성
- philosophy: 사고의 깊이, 일관성, 진정성 (정답 X)
- creation: 창의성, 형식 충족
- 기타: 답변의 시대 적합성, 자기 캐릭터다움

평가 + 결과 narrative 생성:
1. 통과 여부 (passed: boolean)
2. 스탯 변화 추천 (Partial<Stats>, 변동 폭 ±1~3)
3. 변수 변화 추천 (Partial<Qualities>)
4. 결과 narrative (50~100자, 답변에 자연스럽게 반응)
5. 짧은 격려/피드백 (선택)

JSON:
{
  "passed": true,
  "statChanges": { "morality": 2, "sociability": -1 },
  "qualityChanges": { "uigi": 1 },
  "resultNarrative": "...",
  "feedback": "..."
}

언어: {language}
```

**모델:** Gemini Flash
**비용:** ~₩3

### AI-5: T-0 캐스팅 narrative

가장 중요한 모먼트. **Gemini Pro 사용.**

```
[시스템: 공통 프롬프트 + 추가]

당신은 K-Drama Life의 가장 중요한 모먼트 — 
T-0 캐스팅 알림 narrative를 작성합니다.

이 글은 사용자가 게임 안에서 *영화 OP 같은* 충격을 받는 순간입니다.
6년간 평범한 어린아이로 살아온 사용자에게,
이제 자신이 어떤 인물이 되었는지를 알리는 글입니다.

캐릭터 컨텍스트:
- 이름: {characterName}
- 6년간의 누적 narrative: {pastChaptersSummary}
- 결정된 캐스팅: {castingRoleId} ({castingRoleName})
- 캐스팅의 결: {castingDescription}
- 시나리오: {scenarioTitle}
- 현재 시점: {year}, {season}

작성 지침:
1. 200~300자
2. 시대극 OP 같은 분위기 (영화적 톤)
3. 사용자가 *알아채는* 형식 — 직접적 통보 X
   ❌ "당신은 이방인의 길을 갑니다"
   ✅ "3년 전 떠난 곳에 다시 왔다. 당신은 이제 미국 해병대 군복을 입고 있다."
4. 시대의 변화를 느끼게 (배경 분위기)
5. 마지막 줄: 살짝 무게 있는 한 줄 ("당신의 이야기는 이제 시작된다." 같은)

JSON:
{
  "narrative": "...",
  "subtitle": "이 캐스팅의 결을 한 줄로",      ← 언어별
  "musicMood": "epic" | "melancholy" | "hopeful" | "tense"  ← UI 음악 선택
}

언어: {language}
```

**모델:** Gemini Pro
**비용:** ~₩15

### AI-6: 명장면 동적 생성

```
[시스템: 공통 프롬프트 + 추가]

당신은 K-Drama Life의 명장면을 작성합니다.
명장면은 그 시대 K-드라마의 정서를 담은 핵심 모먼트입니다.

작가가 정의한 setup:
- 장면 위치: {setup.location}
- 등장 NPC: {setup.npcInvolved}
- 장면 지시문: {setup.sceneDirective}
- 정서 톤: {setup.emotionalTone}

캐릭터 컨텍스트:
- 이름: {characterName}, 나이: {age}, 캐스팅: {castingRole}
- 현재 스탯: {stats}
- 핵심 인연: {relationships}
- 드라마 길 따라가는 정도: {qualities.drama_path_consistent}

가능한 결과 (작가 정의):
- 드라마 일치 옵션: {outcomes.dramaConsistent.labelKo}
- 갈라진 옵션: {outcomes.divergent.labelKo}
- 자유 입력 옵션

작성 지침:
1. narrative 150~200자 (긴 명장면은 250자까지)
2. 시대극 톤, 인물의 감정 동사 자제 (사용자가 느끼게)
3. NPC의 행동/대사를 통해 긴장 만들기
4. 옵션 A는 "드라마 그대로의 답" 정서로
5. 옵션 B는 "갈라진 길" — 사용자가 다르게 갈 수 있다는 가능성

JSON:
{
  "narrative": "...",
  "choices": [
    { "id": "A", "text": "(드라마 일치 텍스트)" },
    { "id": "B", "text": "(갈라진 텍스트)" },
    { "id": "C", "text": "(자유롭게 답하기)" }
  ]
}

언어: {language}
```

**모델:** Gemini Pro
**비용:** ~₩10

### AI-7: 메타 챕터 사실 narrative

```
[시스템: 공통 프롬프트]

이 메타 챕터는 무거운 역사 사건 후 사용자가 
사실을 학습하고 회고하도록 돕는 안전 장치입니다.

이번 챕터에서 등장한 무거운 사건:
{heavyEventTags}        ← 예: ["1923_kanto_massacre"]

각 사건에 대해 다음을 작성하세요:
1. 사건명 (정확)
2. 발생 일시 (정확)
3. 사건 요약 3~4줄 (사실에 기반)
4. 학술/Wikipedia 출처 (URL)

마지막에 사용자에게 던질 회고 질문 1개 작성.

JSON:
{
  "events": [
    {
      "name": "관동대지진과 조선인 학살",
      "date": "1923년 9월 1일~",
      "summary": "...",
      "sources": [
        { "name": "Wikipedia (한국어)", "url": "..." },
        { "name": "한국학중앙연구원", "url": "..." }
      ]
    }
  ],
  "reflectionQuestion": "당신의 캐릭터는 이 사건을 어떻게 기억할까요?"
}

언어: {language}
```

**모델:** Gemini Flash (사실 정확성 중요 → RAG로 보강 가능)
**비용:** ~₩3

**중요:** 이 호출은 RAG(Retrieval Augmented Generation)로 보강해야 한다. 신뢰할 수 있는 사료 데이터베이스(한국사·일본사·세계사)에서 검색 후 LLM에 전달.

### AI-8: 챕터 종료 요약

```
[시스템: 공통 프롬프트]

챕터 진행 데이터:
- 캐릭터: {characterName}, {age}세
- 챕터 시작 스탯: {statsBefore}
- 챕터 종료 스탯: {statsAfter}
- 사용자 선택들 (순서대로): {choicesLog}
- 시대 사건: {historicalContext}

작성:
1. 한 해의 narrative 압축 (3~5문장, ~150자)
2. 핵심 사건 3개 bullet (각 한 줄)
3. (옵션) 새로운 인연/변수 변화 알림

JSON:
{
  "narrativeRecap": "...",
  "keyMoments": ["...", "...", "..."],
  "newRelationships": [...]
}

언어: {language}
```

**모델:** Gemini Flash
**비용:** ~₩3

### AI-9: 결말 narrative

가장 정성스럽게. **Gemini Pro 사용.**

```
[시스템: 공통 프롬프트 + 추가]

당신은 한 인생의 마지막 페이지를 씁니다.
이 글이 사용자가 SNS에 자랑할 결말 카드의 텍스트가 됩니다.

캐릭터 일대기:
- 시나리오: {scenarioTitle}
- 이름: {characterName}
- 캐스팅: {castingRoleName} ({castingDescription})
- Cradle ~ Main Story 핵심 결정 5~10개: {keyChoices}
- 최종 스탯: {finalStats}
- 최종 변수: {finalQualities}
- 결말 ID: {endingId} ({endingName})
- 결말의 narrative 컨텍스트: {ending.narrativeContext}
- 종료 나이: {endAge}

작성 지침:
1. 1~2문단, 150~250자
2. 시대극 회고 톤 — 종료 나이 시점에서 인생 전체를 돌아보는 느낌
3. 마지막 한 줄: 명대사 후보가 될 만한 무게 있는 문장
4. 사용자의 선택이 만든 운명임을 느끼게
5. 결말이 비극이든 희극이든 *존엄*을 잃지 않게
6. 즉사 결말 시: 더 짧게(100자), 강한 정서로

JSON:
{
  "endingNarrative": "...",
  "iconicQuote": "마지막 한 줄, 카드에 새길 명대사",
  "finalAge": {endAge} | (즉사 시 사망 나이),
  "epitaph": "(선택) 후대가 그를 기억하는 방식"
}

언어: {language}
```

**모델:** Gemini Pro
**비용:** ~₩30

### AI-10: 명대사 추출

```
[시스템: 공통 프롬프트]

다음 결말 narrative에서 가장 무게 있는 한 줄을 추출하세요.
이 한 줄이 결말 카드에 새겨집니다.

narrative:
{endingNarrative}

추출 기준:
- 시대극 명대사 같은 무게
- 캐릭터 자신의 말이거나 그를 평가하는 후대의 말
- 30자 이내

JSON:
{
  "iconicQuote": "...",
  "alternativeQuotes": ["...", "..."]    ← 후보 2개
}

언어: {language}
```

**모델:** Gemini Flash
**비용:** ~₩2

### AI-11: 모더레이션 분류

```
[시스템 프롬프트는 모더레이션 전용 별도]

당신은 K-Drama Life의 안전 분류기입니다.
사용자 자유 입력을 평가합니다.

입력:
{userInput}

컨텍스트:
- 캐릭터 나이: {age}
- 사용자 나이대: {ageBracket}
- 시나리오: {scenarioTitle}
- 이벤트 종류: {eventType}

다음 카테고리로 분류:
- ALLOW: 일반적, 시대 적합, 안전
- REVIEW: 모호함, 사람 검토 필요
- BLOCK: 명백히 부적절

위험 태그 (해당 시):
- violence (폭력 묘사)
- sexual (성적 표현)
- self-harm (자해)
- real-person (실존 인물 사적 언급)
- recent-tragedy (50년 미만 비극의 미화)
- extremism (극단주의)
- minor-inappropriate (미성년자에게 부적절)

JSON:
{
  "decision": "ALLOW" | "REVIEW" | "BLOCK",
  "tags": [...],
  "reason": "(짧게)"
}
```

**모델:** Gemini Flash (또는 자체 안전 분류기)
**비용:** ~₩1

### AI-12: 결말 카드 일러스트

```
[Stable Diffusion 프롬프트]

Positive prompt:
{ending.cardArtStyle.composition}, 
{characterName} as {castingRoleName}, 
{ending.cardArtStyle.moodKeywords},
Korean traditional art style, {era_specific_style}, 
detailed face, period-accurate clothing,
soft lighting, cinematic composition, K-drama aesthetic

Negative prompt:
modern clothing, anachronistic, low quality, distorted face, 
text, watermark, signature

Style LoRA: korean_kdrama_style_v2
Aspect ratio: 4:5 (카드용)
Steps: 30
CFG: 7
```

**모델:** Stable Diffusion 3 + Korean LoRA
**비용:** ~₩70 ($0.05)

---

## 5. 캐싱 전략

### 5.1 캐시 가능

- **챕터 시작 narrative (AI-2):** 같은 시나리오 + 같은 캐스팅 + 같은 챕터 → 캐시. 단, 캐릭터 컨텍스트 약간 변형해서 다양성 유지.
- **시나리오 추천 (AI-1):** 같은 프로필 토큰 → 24시간 캐시
- **결말 일러스트 (AI-12):** 같은 캐스팅 + 비슷한 스탯 분포 → 일러스트 풀에서 선택

### 5.2 캐시 불가

- 자유 입력 평가 (사용자 마다 다름)
- 명장면 (사용자 컨텍스트 강하게 반영)
- 결말 narrative (개인화 필수)

### 5.3 캐시 구현

- Redis 또는 Firestore `/cache/` 컬렉션
- TTL 7일 ~ 30일
- Hit rate 목표: 30% (캐시 가능한 호출 중)

---

## 6. RAG 데이터셋

다음 호출은 RAG로 보강:

### 6.1 시대 사실 RAG (AI-2, AI-7, AI-9용)

```
/rag-data/
├── korean-history/
│   ├── joseon-eras/
│   │   ├── 1696.json    ← 그 해의 정치/사회/일상 데이터
│   │   ├── 1697.json
│   │   └── ...
│   ├── colonial-era/
│   │   ├── 1907.json
│   │   ├── ...
│   ├── modern/
│   │   ├── 1988-seoul.json
│   │   └── ...
├── world-history/
│   ├── 1900s-meiji-japan.json
│   ├── ...
```

각 JSON:
```json
{
  "year": 1897,
  "season_events": {
    "spring": "갑오개혁 마무리 단계, 단발령 강제",
    "summer": "...",
    "fall": "...",
    "winter": "10월 12일 대한제국 선포, 환구단 건립"
  },
  "social_changes": ["...", "..."],
  "everyday_life": {
    "clothing": "...",
    "food": "...",
    "transportation": "...",
    "communication": "..."
  },
  "key_locations": [...],
  "iconic_objects": [...],
  "vocabulary": {...},
  "sources": ["...", "..."]
}
```

이 RAG가 LLM의 시대 정확성을 보장하는 핵심.

### 6.2 K-드라마 정서 풀 (시나리오 작가용)

```
/rag-data/kdrama-essence/
├── miss-sunshine-essence.json  ← 시대 정서, 갈등 구조 추상화
├── reply-1988-essence.json
├── ...
```

특정 드라마 IP를 직접 인용하지 않고, **그 드라마가 그리는 *시대의 결*을 추상화**한 데이터. 시나리오 작성 시 참고.

---

## 7. 에러 처리 / Fallback

### 7.1 LLM 실패 시

```typescript
async function callLLM(prompt: string): Promise<string> {
  try {
    return await geminiFlash(prompt);
  } catch (e) {
    // Fallback 1: Gemini Pro
    try {
      return await geminiPro(prompt);
    } catch (e) {
      // Fallback 2: Claude API
      try {
        return await claudeAPI(prompt);
      } catch (e) {
        // Fallback 3: 사전 작성된 generic narrative
        return getFallbackNarrative(context);
      }
    }
  }
}
```

### 7.2 Generic Narrative 풀

각 챕터/이벤트마다 **하드코딩된 백업 narrative 5종** 미리 작성. LLM 완전 실패 시 사용.

### 7.3 사용자 알림

LLM 실패가 길어지면 (10초+) 사용자에게:
> "잠시 시간이 걸리고 있어요. 차 한 잔 하시겠어요?"

이런 톤으로 부담 줄임.

---

## 8. 비용 모니터링

### 8.1 사용자별 비용 한도

```typescript
interface CostBudget {
  userId: string;
  
  daily: {
    aiCallsCount: number;
    estimatedCostKrw: number;
    limit: number;        // 무료 사용자 ₩100/day
  };
  
  monthly: {
    aiCallsCount: number;
    estimatedCostKrw: number;
    limit: number;        // 무료 ₩1,000/month
  };
}
```

한도 초과 시:
- 무료 사용자: *"오늘은 충분히 살았어요. 내일 다시 만나요."* 또는 결제 안내
- 프리미엄: 한도 X

### 8.2 글로벌 비용 추적

```
/analytics/ai-cost/{date}
{
  date: "2026-05-01",
  totalCalls: 1543,
  totalCostKrw: 4500,
  byModel: { ... },
  byCallType: { ... }
}
```

매일 모니터링. 월 비용이 매출의 30% 초과 시 알림.

---

## 9. 다음 문서

- 시나리오 작성: [07_SCENARIO_AUTHORING.md](07_SCENARIO_AUTHORING.md)
- 위치 시스템: [08_LOCATION_SYSTEM.md](08_LOCATION_SYSTEM.md)
- 모더레이션: [09_MODERATION.md](09_MODERATION.md)
