# 10. 기술 스택 & 인프라

K-Drama Life의 기술 선택, 인프라 구성, 비용 추산.

---

## 1. 기술 스택 한눈에

```
┌─────────────────────────────────────────────────────┐
│  Frontend                                            │
│  Next.js 14 (App Router) + TypeScript               │
│  + Tailwind CSS + shadcn/ui                         │
│  + Framer Motion (애니메이션)                         │
│  + next-intl (i18n)                                 │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│  Backend (Next.js API Routes + Cloud Functions)     │
│  + Firebase Admin SDK                               │
│  + Vercel Edge Functions (글로벌 빠른 응답)          │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│  Data                                                │
│  Firestore (asia-northeast3, 서울)                   │
│  Cloud Storage (시나리오 콘텐츠, 결말 카드)           │
│  Firebase Auth (인증)                                │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│  AI / Generation                                     │
│  Google Gemini 2.0 Flash (routine)                  │
│  Google Gemini 2.0 Pro (T-0, 명장면, 결말)          │
│  Stable Diffusion API (Replicate or Stability)      │
│  (Fallback) Anthropic Claude API                     │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│  Integrations                                        │
│  Stripe (글로벌 결제)                                 │
│  토스페이먼츠 (한국 결제)                             │
│  Google Maps API (위치)                              │
│  Kakao SDK (한국 공유)                               │
│  Sentry (에러 모니터링)                              │
│  Mixpanel (분석)                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Frontend 상세

### 2.1 Next.js 14 App Router

선택 이유:
- SSR + 이미지 최적화 + i18n 라우팅 기본 제공
- Vercel 배포 1-click
- 한국/글로벌 동시 서비스에 적합한 Edge runtime

### 2.2 라우팅 구조

```
app/
├── (marketing)/
│   ├── page.tsx                    # S01 랜딩
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (auth)/
│   ├── signup/page.tsx             # S02
│   ├── login/page.tsx              # S03
│   └── onboarding/
│       └── [step]/page.tsx         # S04
├── (app)/
│   ├── scenarios/
│   │   ├── page.tsx                # S06
│   │   ├── recommended/page.tsx    # S05
│   │   └── [id]/
│   │       ├── page.tsx            # S07
│   │       └── play/page.tsx       # S08
│   ├── play/
│   │   └── [lifeId]/
│   │       ├── chapter/[n]/
│   │       │   ├── intro/page.tsx  # S09
│   │       │   ├── event/[m]/page.tsx # S10
│   │       │   ├── freeform/page.tsx  # S11
│   │       │   └── end/page.tsx       # S15
│   │       ├── casting/page.tsx       # S12
│   │       ├── meta/[n]/page.tsx      # S13
│   │       ├── location-card/page.tsx # S14
│   │       ├── ending/page.tsx        # S16
│   │       ├── card/page.tsx          # S17
│   │       └── share/page.tsx         # S18
│   ├── me/
│   │   ├── page.tsx                # S19
│   │   ├── lives/[lifeId]/page.tsx # S20
│   │   ├── collection/page.tsx     # S21
│   │   └── cards/page.tsx          # S22
│   ├── billing/page.tsx            # S23
│   ├── settings/page.tsx           # S24
│   └── location/verify/page.tsx    # S25
├── api/
│   ├── lives/
│   ├── events/
│   ├── ai/
│   ├── moderation/
│   └── webhooks/
└── admin/
    ├── scenarios/
    ├── moderation/
    └── locations/
```

### 2.3 핵심 라이브러리

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.4.0",
    
    "tailwindcss": "^3.4.0",
    "@tailwindcss/typography": "^0.5.0",
    
    "@radix-ui/react-*": "shadcn/ui 의존",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.380.0",
    
    "firebase": "^10.12.0",
    "firebase-admin": "^12.1.0",
    
    "next-intl": "^3.13.0",
    
    "@google/generative-ai": "^0.13.0",
    "@anthropic-ai/sdk": "^0.21.0",
    "replicate": "^0.30.0",
    
    "stripe": "^15.0.0",
    "@tosspayments/payment-sdk": "^1.7.0",
    
    "@react-google-maps/api": "^2.19.0",
    "exifr": "^7.1.0",
    
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    
    "@sentry/nextjs": "^8.0.0",
    "mixpanel-browser": "^2.50.0"
  }
}
```

### 2.4 i18n 구조

```
locales/
├── ko/
│   ├── common.json
│   ├── auth.json
│   ├── play.json
│   ├── me.json
│   └── billing.json
├── en/
│   ├── common.json
│   └── ...
```

Phase 1: 한국어 + 영어
Phase 2 추가: 일본어, 중국어, 베트남어, 인도네시아어 (한류 시장)

---

## 3. Backend 상세

### 3.1 API Routes vs Cloud Functions

```
Next.js API Routes (Vercel Edge):
- 빠른 응답 필요한 엔드포인트
- 인증 검증
- 캐시 가능한 GET
- 클라이언트 직접 호출

Firebase Cloud Functions:
- 무거운 작업 (LLM 호출, 결말 카드 생성)
- 백그라운드 작업 (스트릭 업데이트, 분석)
- Firestore 트리거 (이벤트 기반)
- 보안 작업 (모더레이션, 결제 검증)
```

### 3.2 주요 API 엔드포인트

```
인증:
POST /api/auth/signup
POST /api/auth/login (Firebase가 처리, 우리 endpoint X)
POST /api/auth/onboard

시나리오:
GET  /api/scenarios
GET  /api/scenarios/recommended
GET  /api/scenarios/[id]

인생:
POST /api/lives                       # 새 인생 생성
GET  /api/lives/[lifeId]
GET  /api/lives/[lifeId]/chapters/current
POST /api/lives/[lifeId]/events/[eventId]/respond
POST /api/lives/[lifeId]/freeform     # 자유 입력
POST /api/lives/[lifeId]/use-card     # 히어로 카드 사용
GET  /api/lives/[lifeId]/casting      # T-0 캐스팅 알림 트리거
GET  /api/lives/[lifeId]/ending       # 결말 narrative + 카드

위치:
GET  /api/location/cards/nearby       # 주변 카드들
POST /api/location/verify             # 위치 인증
GET  /api/location/wishlist
POST /api/location/wishlist

마이페이지:
GET  /api/me
GET  /api/me/lives
GET  /api/me/collection
GET  /api/me/cards
DELETE /api/me/account

결제:
POST /api/billing/checkout
POST /api/billing/cancel
POST /api/webhooks/stripe
POST /api/webhooks/toss

어드민 (admin role 필요):
GET  /api/admin/moderation/queue
POST /api/admin/moderation/decision
POST /api/admin/scenarios               # 시나리오 추가
PATCH /api/admin/scenarios/[id]
```

### 3.3 인증 흐름

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { auth } from './lib/firebase-admin';

export async function middleware(req) {
  const token = req.cookies.get('session')?.value;
  
  if (!token && isProtectedRoute(req.nextUrl)) {
    return NextResponse.redirect('/login');
  }
  
  if (token) {
    const decoded = await auth.verifySessionCookie(token, true);
    req.headers.set('x-user-id', decoded.uid);
  }
  
  return NextResponse.next();
}
```

---

## 4. AI 인프라

### 4.1 LLM 호출 패턴

```typescript
// lib/ai/router.ts

export async function callLLM(
  callType: AICallType,
  context: any,
  options?: { 
    forceModel?: 'flash' | 'pro' | 'claude';
    cacheKey?: string;
  }
): Promise<AIResponse> {
  
  // 1. 캐시 확인
  if (options?.cacheKey) {
    const cached = await getFromCache(options.cacheKey);
    if (cached) return cached;
  }
  
  // 2. 모델 선택
  const model = options?.forceModel || getDefaultModel(callType);
  
  // 3. 비용 한도 체크
  await checkBudget(context.userId);
  
  // 4. 프롬프트 구성
  const prompt = buildPrompt(callType, context);
  
  // 5. 호출 + Fallback
  let response;
  try {
    response = await primaryCall(model, prompt);
  } catch (e) {
    response = await fallbackChain(callType, prompt);
  }
  
  // 6. 캐시 저장
  if (options?.cacheKey) {
    await saveToCache(options.cacheKey, response);
  }
  
  // 7. 비용 로그
  await logCost(context.userId, callType, response.tokenUsage);
  
  return response;
}
```

### 4.2 Stable Diffusion 인프라

선택지:
- **Replicate API**: 호출당 약 ₩70, 빠른 시작
- **Stability AI Direct API**: 더 저렴 (~₩40), 모델 선택 자유
- **자체 호스팅 (RunPod GPU)**: 월 ~₩300만 + 본격 운영 시 저렴

Phase 1: Replicate API
Phase 2 (월 카드 1만 장 이상): 자체 호스팅 검토

### 4.3 RAG 인프라

[06_AI_PROMPTS.md 6장](06_AI_PROMPTS.md) 참조.

```
RAG Stack:
- Vector DB: Pinecone (managed) 또는 Firestore 자체 인덱스
- Embedding: text-embedding-004 (Google) or bge-m3 (오픈소스)
- 시대 데이터: 직접 큐레이션 (학술 자료 + Wikipedia)

비용 추산:
- 1만 문서 × 임베딩 = ₩50만 (1회)
- 검색 호출 = 호출당 ₩0.5
- 매월 ~₩30만 (활성 1만 기준)
```

---

## 5. Firebase 구성

### 5.1 프로젝트 구조

```
Firebase Project: kdramalife-prod
- 위치: asia-northeast3 (서울)

Firestore:
- 위치: asia-northeast3
- 모드: Native
- 백업: 매일 (Cloud Storage)

Cloud Storage:
- 버킷 1: kdramalife-content (시나리오, 일러스트)
- 버킷 2: kdramalife-user-cards (결말 카드)
- 버킷 3: kdramalife-temp (임시 업로드, 24시간 후 자동 삭제)

Firebase Auth:
- Provider: Google, Apple, Email/Password
- 13~17세 한국 거주자 부모 동의 추가 단계

Cloud Functions:
- Region: asia-northeast3
- Runtime: Node.js 20
```

### 5.2 보안 규칙

[05_DATA_MODEL.md 9장](05_DATA_MODEL.md)

### 5.3 환경 변수 / 시크릿

```
.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=

GOOGLE_AI_API_KEY=                    # Gemini
ANTHROPIC_API_KEY=                    # Claude (fallback)
REPLICATE_API_TOKEN=                  # Stable Diffusion

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TOSS_SECRET_KEY=

GOOGLE_MAPS_API_KEY=
KAKAO_JS_KEY=

SENTRY_DSN=
MIXPANEL_TOKEN=

REDIS_URL=                            # 캐시
```

시크릿은 Vercel Environment Variables + Google Secret Manager.

---

## 6. 호스팅 / 배포

### 6.1 Vercel

```
Project: kdramalife
Plan: Pro (Phase 1) → Enterprise (Phase 2 트래픽 폭증 시)

설정:
- Region: 글로벌 (Edge Functions)
- Build: pnpm build
- Output: Standalone

도메인:
- kdramalife.app (메인)
- www.kdramalife.app → 메인 리다이렉트
- api.kdramalife.app (API 서브도메인, 옵션)
```

### 6.2 CI/CD

```
GitHub Actions:
- main 브랜치 → 자동 production 배포
- staging 브랜치 → staging 환경
- PR → Preview 환경 자동 생성

테스트:
- Unit: Vitest
- E2E: Playwright (핵심 플로우)
- Lighthouse CI (성능 측정)
```

### 6.3 모니터링

```
Sentry: 에러 모니터링
- 모든 5xx 에러 알림
- 사용자 영향도 추적

Mixpanel: 사용자 행동 분석
- 회원가입 conversion funnel
- 인생 완주율
- 시나리오별 인기도
- 결말 발견 분포

Vercel Analytics: 페이지 성능
- Core Web Vitals
- 페이지별 로드 시간

Firebase Performance: 클라이언트 성능
- 화면별 렌더링 시간
- API 응답 시간
```

---

## 7. 비용 추산

### 7.1 초기 (활성 1,000)

| 항목 | 월 비용 |
|---|---|
| Vercel Pro | ₩30만 |
| Firebase (Firestore + Functions + Storage) | ₩20만 |
| Gemini API | ₩50만 |
| Replicate (SD) | ₩70만 (월 1,000장) |
| 도메인 / 인증서 | ₩2만 |
| Sentry / Mixpanel | ₩10만 |
| Maps + 외부 API | ₩5만 |
| **합계** | **약 ₩190만/월** |

### 7.2 성장 (활성 1만)

| 항목 | 월 비용 |
|---|---|
| Vercel Enterprise | ₩100만 |
| Firebase | ₩100만 |
| Gemini API | ₩200만 |
| Replicate | ₩350만 |
| RAG (Pinecone) | ₩30만 |
| 모더레이션 (사람 1명 파트타임) | ₩150만 |
| 도구 + 모니터링 | ₩30만 |
| Maps + 외부 API | ₩20만 |
| **합계** | **약 ₩980만/월** |

활성 1만 시 매출 약 ₩1,500~3,000만/월 → BEP 가시.

### 7.3 스케일 (활성 10만)

| 항목 | 월 비용 |
|---|---|
| Vercel | ₩300만 |
| Firebase | ₩600만 |
| Gemini API | ₩1,500만 |
| Stable Diffusion 자체 호스팅 (GPU) | ₩600만 |
| RAG | ₩100만 |
| 모더레이션 (사람 2명) | ₩400만 |
| 인프라 엔지니어 (외주) | ₩300만 |
| **합계** | **약 ₩3,800만/월** |

활성 10만 시 매출 약 ₩1.5~2.5억/월 → 충분한 마진.

---

## 8. 보안

### 8.1 OWASP Top 10 대응

- SQL Injection: Firestore (NoSQL) → 자연스럽게 회피, 단 보안 규칙 엄격
- XSS: React 자동 escape + DOMPurify (자유 입력 표시 시)
- CSRF: Next.js 기본 + 동일 출처 정책
- 인증/권한: Firebase Auth + 보안 규칙 + middleware
- 민감 데이터 노출: HTTPS only, 민감 키는 서버사이드만

### 8.2 GDPR / PIPL 대응

[09_MODERATION.md 8장](09_MODERATION.md)

### 8.3 결제 보안

- 카드 정보 절대 저장 X (Stripe/토스가 처리)
- 웹훅 서명 검증
- 결제 ID + 사용자 ID 양방 검증

---

## 9. 성능 목표

### 9.1 Core Web Vitals

- LCP: < 2.5초 (Largest Contentful Paint)
- FID: < 100ms (First Input Delay)
- CLS: < 0.1 (Cumulative Layout Shift)

### 9.2 게임 특화 지표

- 챕터 시작 narrative 로드: < 3초 (LLM 호출 포함)
- 이벤트 → 다음 이벤트 전환: < 1초
- 자유 입력 평가: < 5초
- 결말 카드 생성: < 8초 (SD 호출 포함, 로딩 화면)

---

## 10. 개발 환경

### 10.1 로컬 개발

```bash
# 셋업
pnpm install
firebase emulators:start  # Firestore + Auth + Functions 로컬

# 개발 서버
pnpm dev

# 환경 변수
.env.local (개발용 Firebase 프로젝트 키)
```

### 10.2 환경 분리

```
- Local: 개발자 머신 + Firebase 에뮬레이터
- Staging: 별도 Firebase 프로젝트 + Vercel preview
- Production: kdramalife-prod
```

### 10.3 데이터베이스 시드

```
scripts/seed-scenarios.ts
- 5개 첫 출시 시나리오를 staging/local에 자동 추가
- production은 admin 페이지에서 수동 추가
```

---

## 11. 외부 의존성 / 위험

| 의존성 | 위험 | 대응 |
|---|---|---|
| Google Gemini | API 인상/제거 | Claude 백업 + 자체 평가 LLM 검토 |
| Vercel | 비용 폭증 / 지역 제한 | AWS / Cloudflare 마이그레이션 가능하게 설계 |
| Stripe | 한국 결제 제한 | 토스페이먼츠 동시 운영 |
| Firebase | 사용량 폭증 비용 | Firestore 쿼리 최적화 + 캐싱 적극 |
| Stable Diffusion | 모델 정책 변경 | 자체 호스팅 옵션 |

---

## 12. 다음 문서

- 로드맵: [11_ROADMAP.md](11_ROADMAP.md)
