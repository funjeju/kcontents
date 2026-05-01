# 08. 위치 기반 카드 시스템

게임의 핵심 차별화 — **사용자가 실제 장소에 가서 드라마 속 시대 경험을 해보도록 유도하는 장치**.

---

## 1. 시스템 개요

### 1.1 목적

K-Drama Life의 위치 시스템은 단순한 "GPS 체크인 게임"이 아니다. 다음을 노린다:

1. **한국 거주자**: 게임 안에서 만난 시대의 장소를 *실제로 찾아가게* 만든다.
2. **외국인**: 게임 안의 경험이 *한국 여행 욕망*으로 이어지게 만든다.
3. **여행 중 외국인**: 한국에 와서 *위치 카드를 줍는 새로운 여행 동기*가 된다.

### 1.2 라이브 풍경 옵션

특정 장소에 실시간 영상 스트림 URL이 등록되어 있으면, 위치 카드 화면에서 *"지금 이 시간 [장소]의 풍경 보기"* 옵션을 표시한다. 이는 외국인 사용자에게 "내가 살아본 시대의 그 장소가 지금 어떤 모습인지" 보여주는 강력한 정서적 연결.

이 라이브 스트림은 카드 데이터 모델의 옵션 필드(`liveCctvUrl`)로, 등록된 위치만 활성화. 등록 없으면 그 옵션은 표시 X.

---

## 2. 위치 카드 메커니즘

### 2.1 카드 데이터 구조

```typescript
interface LocationCardDef {
  id: string;
  name: { ko: string; en: string };
  description: { ko: string; en: string };
  
  // 위치
  location: {
    name: { ko: string; en: string };
    address: { ko: string; en: string };
    coordinates: [number, number];      // [lat, lng]
    radiusMeters: number;                // 인증 반경 (보통 200m)
    countryCode: string;
    region: string;                      // "Seoul-Jung-gu"
  };
  
  // 매핑
  triggerScenarios: string[];            // 어느 시나리오에서 등장
  triggerMomentIds: string[];            // 어느 명장면에서 트리거
  
  // 보상
  reward: {
    type: "stat_boost" | "quality_boost" | "hero_card" | "narrative_unlock";
    statBoosts?: Partial<Stats>;
    qualityBoosts?: { [key: string]: number };
    heroCardId?: string;
    narrativeUnlockId?: string;          // 특별 명장면 잠금 해제
  };
  
  // 미디어
  imageUrl: string;                      // 카드 일러스트
  realPhotoUrl?: string;                 // 실제 사진 (참고)
  
  // 외부 링크
  googleMapsUrl: string;
  streetViewUrl?: string;
  liveCctvUrl?: string;                  // 실시간 풍경 스트림 URL (옵션)
  
  // 시간 제한 (옵션)
  availableSeasons?: ("spring" | "summer" | "fall" | "winter")[];
  availableHours?: { start: string; end: string };
  
  // 가이드
  visitGuide?: {
    transportation: { ko: string; en: string };
    nearbyAttractions: string[];
    bestTimeToVisit: string;
    safetyNotes: string;
  };
  
  // 통계
  totalAcquisitions: number;             // 글로벌 획득 수
  isActive: boolean;
}
```

### 2.2 카드 트리거 시점

위치 카드는 다음 시점에 사용자에게 알림:

1. **명장면 종료 직후** — 그 명장면이 실제 장소에 매핑된 경우
2. **챕터 종료 시** — 그 챕터의 시대 배경이 특정 장소들과 연결된 경우 (모음 카드)
3. **결말 직후** — 그 결말이 시대 정서가 깊은 장소와 연관된 경우

---

## 3. 사용자 분기

위치 카드 UX는 사용자 위치에 따라 분기된다.

### 3.1 분기 결정 알고리즘

```typescript
async function determineLocationUX(
  userId: string,
  cardDef: LocationCardDef
): Promise<LocationUXType> {
  
  const userLocation = await getUserCurrentLocation(); // GPS 또는 IP
  
  // 1. 카드 위치 근처에 있는가?
  if (isNearLocation(userLocation, cardDef.location, cardDef.location.radiusMeters)) {
    return "VERIFY_NOW";  // 즉시 인증 가능
  }
  
  // 2. 같은 도시/지역에 있는가?
  if (isInSameRegion(userLocation, cardDef.location.region)) {
    return "NEARBY_SUGGEST";  // 근처에 있다고 알림
  }
  
  // 3. 같은 나라(한국)에 있는가?
  if (userLocation.countryCode === "KR") {
    return "DOMESTIC_SUGGEST";  // 한국 안에서 갈 수 있다 알림
  }
  
  // 4. 외국인
  return "WISHLIST_SUGGEST";  // 한국 여행 위시리스트
}
```

### 3.2 UX 패턴 4종

#### Pattern 1: VERIFY_NOW (현장에 있음)

```
┌───────────────────────────────────────┐
│   🎴 지금 여기에 있어요!                │
│                                       │
│   [장면 일러스트]                       │
│                                       │
│   "정동의 봄"                          │
│   서울 중구 정동길                      │
│                                       │
│   사진을 찍어 카드를 받으세요.          │
│   [📷 카메라 열기]                     │
│                                       │
│   카드 효과:                            │
│   • 다음 분기점에서 호감도 +5           │
│   • "한국과의 인연" 변수 +3             │
│                                       │
│   [지금 받기]  [나중에]                │
└───────────────────────────────────────┘
```

#### Pattern 2: NEARBY_SUGGEST (근처에 있음)

```
┌───────────────────────────────────────┐
│   🎴 근처에 있어요!                     │
│                                       │
│   "정동의 봄"                          │
│   서울 중구 정동길                      │
│                                       │
│   현재 위치에서 약 1.2km                │
│   걸어서 약 15분                       │
│                                       │
│   [지도 보기 →]                        │
│   [위시리스트에 저장]                   │
│   [나중에]                             │
│                                       │
│   * 방문해서 사진 찍으면 카드 획득       │
└───────────────────────────────────────┘
```

#### Pattern 3: DOMESTIC_SUGGEST (한국 내 다른 지역)

```
┌───────────────────────────────────────┐
│   🎴 한국에 가면 들러보세요               │
│                                       │
│   "안동 하회의 가을"                    │
│   경상북도 안동시 풍천면                 │
│                                       │
│   현재 위치 (서울)에서                  │
│   KTX + 버스 약 3시간                  │
│                                       │
│   [길 찾기]                             │
│   [위시리스트]                          │
│                                       │
│   [📺 지금 풍경 보기] (등록된 경우)      │
└───────────────────────────────────────┘
```

#### Pattern 4: WISHLIST_SUGGEST (외국인)

```
┌───────────────────────────────────────┐
│   📍 Korean Travel Wishlist            │
│                                       │
│   "Spring at Jeongdong-gil"            │
│   Jeongdong-gil, Jung-gu, Seoul        │
│                                       │
│   This historic walking path is        │
│   located near Deoksugung Palace.      │
│   Famous for its romantic atmosphere   │
│   and cultural significance during     │
│   the late Joseon era.                │
│                                       │
│   [Add to Wishlist]                    │
│   [Explore (Street View)]              │
│   [📺 Live View Now] (if available)    │
│                                       │
│   When you visit Korea, unlock this    │
│   card by visiting the actual place.   │
└───────────────────────────────────────┘
```

---

## 4. GPS 인증 (현장 방문)

### 4.1 인증 흐름

```
1. 사용자가 [📷 카메라 열기] 클릭
   ↓
2. GPS 권한 요청 (이미 받았으면 skip)
   ↓
3. 카메라 권한 요청
   ↓
4. 카메라 + GPS 시작
   ↓
5. 사용자가 그 장소의 사진 촬영
   ↓
6. 검증:
   - GPS 좌표가 카드 좌표 + radius 안에 있는가
   - 사진 EXIF의 GPS 좌표와 일치하는가
   - 사진 EXIF의 timestamp가 최근 10분 안인가
   - (옵션) 사진 콘텐츠 분석 (AI Vision으로 장소 일치 확인)
   ↓
7. 통과 시: 카드 획득 애니메이션
   불통과 시: 친절한 안내 + 재시도
```

### 4.2 검증 코드 흐름

```typescript
async function verifyLocationCard(
  userId: string,
  cardId: string,
  photoFile: File,
  currentGps: [number, number]
): Promise<VerificationResult> {
  
  const card = await getLocationCard(cardId);
  
  // 1. 현재 GPS가 카드 좌표 안인가
  const gpsDistance = haversineDistance(currentGps, card.location.coordinates);
  if (gpsDistance > card.location.radiusMeters) {
    return { 
      success: false, 
      reason: "TOO_FAR",
      distance: gpsDistance 
    };
  }
  
  // 2. 사진 EXIF 분석
  const exif = await extractExif(photoFile);
  if (!exif.gps) {
    return { success: false, reason: "NO_GPS_IN_PHOTO" };
  }
  
  // 3. EXIF GPS도 카드 좌표 안인가
  const exifDistance = haversineDistance(
    [exif.gps.latitude, exif.gps.longitude],
    card.location.coordinates
  );
  if (exifDistance > card.location.radiusMeters) {
    return { success: false, reason: "PHOTO_TOO_FAR" };
  }
  
  // 4. 사진 timestamp가 최근인가
  const photoAge = Date.now() - new Date(exif.timestamp).getTime();
  if (photoAge > 10 * 60 * 1000) { // 10분
    return { success: false, reason: "PHOTO_TOO_OLD" };
  }
  
  // 5. (옵션) AI Vision 검증
  if (card.visualVerification) {
    const isMatch = await visionAPI.verifyLocation(
      photoFile,
      card.visualVerification.referenceFeatures
    );
    if (!isMatch) {
      return { 
        success: false, 
        reason: "PHOTO_CONTENT_MISMATCH"
      };
    }
  }
  
  // 6. 통과 — 카드 획득
  await grantLocationCard(userId, cardId);
  await logAcquisition(userId, cardId, currentGps);
  
  return { success: true, card };
}
```

### 4.3 EXIF 분석 라이브러리

- 클라이언트: `exifr` npm 패키지
- 서버: 동일 패키지 또는 ImageMagick

### 4.4 사진 데이터 처리

- 인증 후 **사진 파일은 즉시 삭제** (개인정보 보호)
- 메타데이터만 보존 (timestamp, hash, 좌표)
- 사용자 갤러리에는 저장됨 (사용자 디바이스)

---

## 5. 라이브 풍경 스트림 (옵션 기능)

### 5.1 작동 방식

특정 위치 카드에 라이브 스트림 URL이 등록되어 있을 때만 활성화:

```typescript
interface LiveStreamLink {
  cardId: string;
  streamUrl: string;
  
  type: "live" | "snapshot" | "highlights";
  // live: 실시간 스트림 (m3u8 또는 webrtc)
  // snapshot: 5분마다 자동 업데이트되는 스냅샷
  // highlights: 24시간 베스트 모먼트 컴파일
  
  attributionRequired?: boolean;
  attributionText?: string;
}
```

### 5.2 사용자 화면

위치 카드 뷰에 [📺 지금 풍경 보기] 버튼:

```
[📺 Live View - 정동길]
   ↓
[작은 영상 플레이어 표시]
"지금 이 시간의 정동길"

영상 옆 정보:
- 현재 시간: KST
- 날씨 (외부 API)
- (필요시) 출처 attribution
```

### 5.3 스트림 데이터 소스

스트림 URL은 다음에서 등록:
- 자체 운영 카메라
- 공개 라이브캠 임베드 가능 소스 (라이선스 검증 후)
- 파트너십 콘텐츠 (개별 협상 시)

스트림이 없는 카드는 [📺 지금 풍경 보기] 버튼 비표시. 게임 동작에는 영향 X.

---

## 6. 위치 카드 UX 디테일

### 6.1 지도 뷰

```
[지도 (Google Maps API)]
- 사용자 현재 위치 (파란 점)
- 카드 위치 (단풍색 핀)
- 인증 반경 (반투명 원)
- 길 찾기 (도보/대중교통/택시)

[카드 정보 오버레이]
- 카드명
- 거리 / 도착 예상 시간
- [길 찾기 시작] 버튼
```

### 6.2 위시리스트

사용자가 *나중에 가고 싶은 카드*를 모은다:

```
[마이페이지 → 위시리스트]

지도 뷰:
- 모든 위시 카드 핀

리스트 뷰:
- 카드 미니 + 거리 + 추가일

기능:
- 카드 → 캘린더 (이 날 갈 거예요)
- 카드 → 친구 공유 (같이 가요)
- 카드 → 일괄 길찾기 (이 카드들을 한 번에)
```

### 6.3 한국 여행 모드 (외국인 전용)

외국인 사용자가 한국 도착 시 자동 활성화 (IP/GPS 변경 감지):

```
[알림] "한국에 오셨네요! 위시리스트의 카드들이 활성화되었어요."

[한국 여행 모드 화면]
- 위시리스트 카드들의 지도
- 추천 일정 (AI 생성: "이 카드들을 효율적으로 도는 3일 코스")
- 각 카드 인증 후 인증 카드 컬렉션 자동 정리
- 여행 종료 후: "Travel Memoir" 자동 생성 (이번 여행 카드 모음 결과 카드)
```

---

## 7. 위치 카드 첫 출시 라인업

Phase 1 (출시 시): 시나리오 5개 × 평균 8개 위치 카드 = 약 40개

### Mr. Sunshine 정서 (한성 1900s) — 8개

1. 정동길 (덕수궁 돌담)
2. 명동성당
3. 종로 보신각
4. 광화문 광장
5. 운현궁
6. 서대문형무소 역사관
7. 안중근 의사 기념관
8. 효창공원 (백범 김구 묘소)

### Hidden Court (조선 궁중) — 8개

1. 경복궁 근정전
2. 창덕궁 후원
3. 종묘
4. 안동 하회마을
5. 안동 도산서원
6. 전주 한옥마을
7. 수원 화성
8. 경주 양동마을

### Liberation (일제강점기) — 8개

1. 서울 효창공원
2. 천안 독립기념관
3. 부산 임시정부청사
4. 인천 차이나타운
5. 광주 학생독립운동기념관
6. 일제강제동원역사관 (부산)
7. 군산 (일본식 가옥)
8. 한산 충무공 유적지

### Reply 1988 (1980s 골목) — 8개

1. 서울 도봉구 쌍문동
2. 동대문 평화시장
3. 미아리 텍사스
4. 인사동 골목
5. 광장시장
6. 청계천
7. 서울대공원
8. 남산타워

### Idol Trainee (K-pop 시대) — 8개

1. 성수동 (엔터 사옥 거리)
2. 강동 (엔터 사옥 거리)
3. 용산 (엔터 사옥 거리)
4. 홍대 거리
5. 가로수길
6. 압구정 로데오
7. 서울 코엑스
8. 부산 BIFF 광장

---

## 8. 위치 데이터 관리

### 8.1 GeoJSON 자산

```
/scenarios-content/locations/
├── seoul.geojson           # 서울 모든 카드
├── busan.geojson           # 부산
├── gyeongbuk.geojson       # 경상북도
├── ...
```

각 카드 정보 + 좌표.

### 8.2 어드민 도구

지도 기반 카드 추가 도구:

```
/admin/locations

지도 위에 마우스로 카드 위치 핀 → 클릭 → 정보 입력 폼:
- 카드명 (한/영)
- 설명 (한/영)
- 매핑 시나리오
- 매핑 명장면
- 보상 정의
- 인증 반경 (기본 200m, 조정 가능)
- 외부 링크
- 일러스트 업로드
- 라이브 스트림 URL (옵션)
```

큐레이터가 직접 카드 추가 가능. 시나리오 추가 어드민과 통합.

---

## 9. 분석 / 통계

추적할 지표:

```
/analytics/location-cards

- 카드별 알림 노출 횟수
- 카드별 위시리스트 추가 횟수
- 카드별 실제 인증 횟수 (전환율)
- 카드별 평균 알림 → 인증 시간 (체크인까지 며칠)
- 외국인 카드 인증 비율
- 라이브 뷰 클릭률
- 카드 인증 후 게임 잔존율 (참여 효과)
```

---

## 10. 위험 / 안전

### 10.1 사용자 안전

- 위치 카드 알림 시 *"안전한 시간/안전한 동행과 함께 방문하세요"* 안내
- 24시 운영지 아닌 곳은 운영시간 표기
- 야간 방문 비추천 명소는 그렇게 표기

### 10.2 GPS 스푸핑 방지

- EXIF + 현재 GPS 이중 검증
- 비정상 패턴 (5분 안에 서울 → 부산 인증) 자동 차단
- 의심 사례는 모더레이션 큐로

### 10.3 사진 모더레이션

- 사용자가 부적절한 사진 업로드 시도 가능 → AI Vision으로 자동 차단
- 인증 사진은 인증 후 즉시 삭제 (저장 X)

---

## 11. 다음 문서

- 모더레이션: [09_MODERATION.md](09_MODERATION.md)
- 기술 스택: [10_TECH_STACK.md](10_TECH_STACK.md)
