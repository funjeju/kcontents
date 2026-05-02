# GLOBAL — 외국인 전용 K-Content 한국어 학습 & Custom Scenario Builder

K-Drama Life의 글로벌 전용 트랙. 한국 K-드라마 / 영화 / 음악을 매개로 외국인이 한국어를 배우면서, 동시에 자기 최애 작품으로 자기만의 게임을 만드는 통합 모델. 한국 시장과는 별개의 포지셔닝과 마케팅 전략으로 운영.

---

## 1. 포지셔닝

한국 시장에서는 *시대 인생 시뮬레이션 게임*으로 포지셔닝되지만, 글로벌(특히 영어권)에서는 다음 세 가지가 결합된 정체성으로 진입한다.

**(1) Live inside your favorite K-drama** — 좋아하는 K-드라마 시대·정서 안으로 들어가서 한 인생을 산다.
**(2) Learn Korean naturally** — 그 인생을 살면서 한국어를 자연스럽게 배운다.
**(3) Create your own** — 자기 최애 작품으로 자기만의 시나리오를 만든다.

이 세 가지는 분리된 기능이 아니라 **하나의 흐름**이다. 사용자는 K-드라마에 빠져서 게임에 들어왔다가, 한국어를 배우게 되고, 결국 자기가 직접 시나리오를 만드는 단계까지 자연스럽게 진화한다.

---

## 2. 한국어 학습 트랙 — *Korean Through Stories*

### 2.1 핵심 발상

기존 한국어 학습 앱(Duolingo, Talk To Me In Korean, Lingodeer 등)은 *어휘·문법 중심*이거나 *짧은 회화 중심*이다. K-Drama Life는 다른 영역을 친다 — **서사 안의 한국어**.

사용자가 1900년대 한성의 한 인물로 살면서 마주치는 narrative, NPC 대사, 자기 답변 — 이 모든 것이 한국어 학습 콘텐츠가 된다. 그러나 학습 앱처럼 *공부 모드*로 진입하지 않고, 게임 안에서 자연스럽게 노출된다.

### 2.2 작동 방식 — 듀얼 언어 토글

게임 내 모든 narrative와 선택지에 *언어 토글* 버튼이 있다. 기본은 영어. 토글을 켜면 같은 화면이 한국어로 전환된다. 사용자는 이해 안 되는 부분만 영어로 잠깐 보고, 다시 한국어로 돌아간다. *학습 모드*가 별도로 존재하는 게 아니라 게임 자체가 학습이 된다.

세 가지 토글 모드:
- *English Only* — 영어만 (Korean 0%)
- *Mixed* — 한국어 narrative + 영어 보조 자막 (대사·시대 어휘는 한국어, 상황 묘사는 영어)
- *Korean Only* — 모두 한국어, 단어 탭하면 영어 의미 팝업 (Korean 100%)

레벨이 오르면서 사용자가 *Mixed → Korean Only*로 자연 진화한다.

### 2.3 어휘 / 문법 트래킹

게임이 사용자가 마주친 한국어 단어와 문법 패턴을 백그라운드에서 추적한다. 마이페이지에 *Words You've Lived With* 컬렉션 — 게임 안에서 만난 단어들이 시대 / 시나리오별로 정리된다. 1900년대 한성에서는 *공사관*, *전차*, *단발령* 같은 시대 어휘. 1988에서는 *동네*, *골목*, *연탄*. 사용자는 자기가 *살면서 만난* 단어들이라 정서적 애착이 강해 암기율이 높다.

### 2.4 한국어 자유 입력 (고급 사용자)

영어 자유 입력만 가능한 기본 모드 외에, 한국어 입력 모드가 있다. 사용자가 직접 한국어로 답변을 작성하면 AI가 평가하고 자연스러운 표현으로 첨삭. *너의 답을 이렇게 다듬어 봤어요* 형식으로 보여줘 부담 없이. 이게 외국인에게 가장 강력한 학습 효과 — 한국어를 *쓰는* 경험.

### 2.5 시대 어휘의 매력

K-Drama Life의 한국어는 *교과서 한국어*가 아니다. 사극에서는 *소인 / 마님 / 대감*, 1900년대에서는 *공사관 / 전차 / 양복*, 1988에서는 *동네 / 골목 / 라떼*. 각 시대의 결이 다르다. 외국인 학습자에게 이건 *살아있는 한국어*다. K-드라마 보면서 *왜 저 시대는 다르게 말해?* 라고 궁금해했던 부분이 게임 안에서 풀린다.

### 2.6 발음 / 듣기 (Phase 2)

일부 핵심 narrative에 한국어 음성 더빙 추가. 사용자가 텍스트만 읽지 않고 *그 시대 사람의 목소리*로 듣는 경험. 시대극 톤의 한국어 듣기는 어떤 학습 앱도 제공하지 않는 영역. AI 음성 합성 + 시대 톤 finetuning으로 비용 통제.

---

## 3. Custom Scenario Builder — 외국인 특화 확장

### 3.1 핵심 발상

ADMIN.md에 정의된 Custom Scenario Builder의 글로벌 확장판. 외국인 사용자가 자기 최애 K-드라마 / 영화 / 책을 입력하면 자기만의 시나리오가 자동 생성된다.

이 기능이 외국 시장에서 가장 강력한 이유는, **K-드라마 팬덤은 단순히 보는 게 아니라 *깊이 빠지는* 문화**이기 때문이다. Reddit r/KDRAMA, Tumblr, Twitter K-drama 트위터, TikTok #kdrama — 이 팬덤들은 자기가 좋아하는 작품에 대해 끝없이 글 쓰고, 분석하고, fan fiction 만든다. *내 최애 드라마로 내 게임 만들기*는 이들의 충동을 정확히 친다.

### 3.2 외국인 사용자가 만들 시나리오 예상

- *Squid Game* 정서 — 게임 안의 인물 중 하나로 살기
- *Crash Landing on You* 정서 — 군관 또는 마을 사람으로 살기
- *Goblin* 정서 — 도깨비의 검을 뽑은 자가 아닌 그 시대의 다른 인물로 살기
- *Reply 1988* — 외국인이 1988년 쌍문동 한 가족의 옆집 친구로 살기
- *Pachinko* — 이 작품은 책 + 드라마 둘 다 입력 가능, 더 깊은 RAG
- 자국 작품도 가능 (Phase 4) — 일본 사극, 중국 무협, 미국 시대극 등

### 3.3 한국어 학습과의 결합

외국인이 자기 최애 작품으로 시나리오를 만들면, 그 시나리오는 자동으로 듀얼 언어로 작동한다. 사용자가 *내 최애 드라마 안에서 내가 한국어로 살아본다*는 경험. 이 결합이 다른 어떤 한국어 학습 도구도 줄 수 없는 깊이.

예시: 미국 사용자가 *Reply 1988*로 자기 시나리오를 만들면, 1988년 쌍문동 골목에서 한국어로 살아본다. 시대 어휘(*떡볶이 / 골목 / 라떼 / 형아*)가 자기 시나리오 안에서 자연스럽게 등장. 영어 모드로 뜻 확인하고 다시 한국어로 돌아가 산다.

### 3.4 결제 모델 — 글로벌 가격 정책

- *Single Scenario Creation* — $9.99 단발 결제, 영구 본인 소유
- *Creator Pass* — 월 $14.99 무제한 시나리오 생성 + 모든 어드민 시나리오 무료 플레이
- *Public Listing* — 자기 시나리오 공개, $4.99 추가 (큐레이션 후보 진입)
- *Korean Coach Add-on* — 월 $4.99, 한국어 자유 입력 + 첨삭 + 발음 / 듣기 무제한
- *Bundle (Creator + Korean Coach)* — 월 $19.99, 두 기능 합본

기본 게임플레이(어드민 시나리오 일부 무료 + 한정 한국어 토글)는 무료로 열어두고, 깊이 들어가는 사용자에게만 결제 진입.

### 3.5 공유 / 발견 흐름

사용자가 *Public Listing*하면 다른 사용자가 검색·플레이 가능. 외국인이 만든 시나리오가 다른 외국인에게 도달하면서 *세계관 큐레이션*이 자생적으로 만들어진다. 미국 *Reply 1988* 팬이 만든 시나리오를 브라질 팬이 발견하고 플레이 — 한국 팬덤의 자체 콘텐츠 경제가 글로벌하게 형성된다.

---

## 4. Reddit 전략 — 글로벌 진입의 1차 무기

### 4.1 왜 Reddit인가

K-드라마 글로벌 팬덤의 가장 깊은 토론장이 Reddit이다. r/KDRAMA(140만+ 구독자), r/koreanvariety, r/Korean(한국어 학습), r/LearnKorean, r/koreanlanguage 등이 핵심 서브레딧. 이들은 *광고에 강한 거부감*을 갖지만, *진짜 좋은 콘텐츠*에는 폭발적으로 반응한다.

TikTok이 임팩트는 강해도 깊이가 얕다면, Reddit은 임팩트는 느려도 *팬덤 깊이를 정확히 친다*. 한 번 cult 만들어지면 1년 이상 유지된다.

### 4.2 Reddit 진입 원칙

**(1) 광고처럼 보이면 즉시 배척된다.** 마케터가 들어가서 *"우리 게임 좋아요"* 글 올리면 1시간 내 다운보트 + 밴. Reddit 진입은 마케터가 아니라 *진짜 K-드라마 팬*이 자기 경험을 공유하는 형태여야 한다.

**(2) 가치를 먼저 주고 나중에 회수한다.** 첫 6개월은 K-드라마 / 한국어 / 한국 역사에 대한 좋은 콘텐츠를 무료로 뿌린다. 이름을 알리지 않는다. 신뢰 누적 후 자연스럽게 우리 도구를 언급한다.

**(3) AMA(Ask Me Anything)를 활용한다.** Reddit의 핵심 콘텐츠 형식. 적절한 시점에 운영자가 AMA 진행 — *"AI로 K-드라마 시대를 게임화하는 한국 인디 개발자"* 정체성으로.

### 4.3 단계별 Reddit 전략

**Phase 1 (출시 전 3개월) — 신뢰 구축**

K-드라마 / 한국 역사 / 한국어 관련 좋은 콘텐츠를 r/KDRAMA, r/Korean에 자연스럽게 올린다. 우리 게임 언급 X. 운영자 본인 계정으로:
- *"1900s Korea historical context that Mr. Sunshine doesn't fully explain"* 같은 글
- *"Words you'll only hear in 사극 (historical K-dramas) explained"* 같은 글
- *"Why Reply 1988's 골목 culture matters — a Korean's perspective"*

이런 글이 좋은 반응 받으면 운영자 계정의 신뢰도가 쌓인다.

**Phase 2 (출시 직후 1개월) — 자연스러운 등장**

Phase 1에서 쌓인 신뢰 위에 우리 게임을 자연스럽게 등장시킨다.
- *"I made a game where you live inside K-drama eras to learn Korean — feedback wanted"* (자작 공유 형식)
- 정직하게 *나는 만든 사람이고, 무료 베타에 100명 초대한다, 솔직한 피드백 원한다* 라고 명시
- Reddit은 *솔직한 자작 공유*에는 관대하다. 숨기는 게 가장 위험.

**Phase 3 (출시 후 1~3개월) — AMA 진행**

화제성이 어느 정도 형성되면 r/KDRAMA, r/Korean, r/learnprogramming 등에서 AMA. 주제:
- *"I'm a Korean indie dev who built an AI-powered K-drama era simulator. AMA"*
- *"Building a Korean language learning game using K-drama eras — AMA on language learning + game design"*

AMA 후 트래픽 급증, Reddit cult 형성.

**Phase 4 (출시 후 3~6개월) — 사용자 콘텐츠 자생**

Custom Scenario Builder가 활성화되면 사용자들이 자기가 만든 시나리오를 r/KDRAMA에 자랑하기 시작한다. *"I made a Squid Game scenario in K-Drama Life and got this ending — 0.3% rarity"* 같은 글. 이게 최고의 마케팅. 우리는 손 안 대도 자생적으로 확산.

**Phase 5 (출시 후 6개월+) — 글로벌 K-팬덤 cult 정착**

r/KDRAMA에 *주간 결말 카드 공유 thread*가 자생적으로 만들어진다. 사용자들이 매주 자기 인생 카드를 공유. 우리는 가끔 댓글로 등장 — *"잘 만드셨네요! 다음 시즌에 이런 거 추가될 예정입니다"*. 이 단계가 되면 Reddit이 자체 마케팅 채널.

### 4.4 다른 외국 채널과의 결합

Reddit 1차 + TikTok 2차 + YouTube 3차 구조.
- **Reddit** — 깊은 팬덤, 신뢰, cult 형성
- **TikTok** — 결말 카드 바이럴, 18~24세 도달
- **YouTube** — 영문 K-drama 채널 협찬, 게임 플레이 영상

Reddit에서 cult가 만들어진 시점에 TikTok에 결말 카드가 폭발한다. 두 채널이 시너지.

### 4.5 한국어 학습 채널 별도 진입

r/Korean, r/LearnKorean은 K-드라마 팬덤과 다른 톤. 여기서는 *K-Drama Life is also a Korean learning tool* 정체성으로 진입.
- *"Learning Korean through historical K-drama scenarios — does anyone else find this works better than Duolingo?"* 같은 글
- 사용자 학습 통계 공유 (예: *180일 사용 후 TOPIK 2급 합격*)

---

## 5. 결말 카드의 글로벌 바이럴 디자인

기본 결말 카드는 한국어 / 영어 듀얼 언어로 자동 생성. 외국인이 SNS에 공유할 때 *그 카드가 결말 narrative + 한국어 명대사 + 영어 번역*을 동시에 담고 있어 언어 보편적으로 읽힌다.

카드 하단 CTA: *Live a life inside your favorite K-drama → kdramalife.app*

해시태그 전략: 영문 채널은 #kdrama #livethekdrama #koreanlearning #aigame를 카드에 자동 삽입.

---

## 6. 외국인 진입 시 첫 화면 분기

기본 / 주요 K-드라마 시나리오는 무료 체험 가능. 사용자가 한 번 살아보고 결말 카드를 받은 후, *Custom Scenario Builder*와 *Korean Coach* 두 결제 트리거가 등장한다.

첫 결말 카드를 SNS에 공유한 외국인 사용자에게는 자동으로 *내 최애 드라마로 내 시나리오 만들기*를 제안. 가장 결제 전환율이 높은 모먼트.

---

## 7. 한국 시장과의 분리 운영

한국 사용자에게는 *시대 인생 시뮬레이션*으로 마케팅. 한국어 학습 기능은 노출 X (한국인은 학습 필요 X).

외국인 사용자에게는 *K-Drama 시대 + 한국어 학습 + 자기 시나리오 만들기* 통합 패키지로 마케팅. 한국어 학습이 핵심 가치 제안.

같은 게임이지만 사용자 국가에 따라 첫 진입 화면 / 결제 화면 / 마케팅 카피가 분기.

---

## 8. Phase별 출시 계획

- **Phase 1 (출시)** — 영어 / 한국어 듀얼 언어 토글, 기본 K-드라마 시나리오 5개. Reddit Phase 1 신뢰 구축 진행 중.
- **Phase 2 (출시 1~3개월)** — Reddit Phase 2 자연 등장 + AMA. 한국어 학습 토글 강화. 시나리오 10개로 확장.
- **Phase 3 (출시 3~6개월)** — Custom Scenario Builder 베타 오픈. Reddit Phase 4 사용자 자생 콘텐츠. 한국어 자유 입력 + 첨삭 출시.
- **Phase 4 (출시 6~12개월)** — Custom Scenario Builder 정식. Korean Coach Add-on 출시. 일본 / 대만 / 동남아 확장. r/KDRAMA cult 정착.
- **Phase 5 (출시 12개월+)** — Creator Revenue Share 도입. World Drama Life 확장 (외국인이 자국 작품으로도 시나리오 생성).

---

## 9. 핵심 정리

외국 전용 트랙은 *K-드라마 + 한국어 학습 + 자기만의 시나리오 만들기*의 통합 패키지로 작동한다. Reddit을 1차 진입 채널로 신뢰부터 쌓고, 결제 모델은 Custom Scenario Builder + Korean Coach 두 축으로 운영한다. 한국 시장과 분리해서, 글로벌은 *Live inside your favorite K-drama, learn Korean, build your own*이라는 한 줄로 포지셔닝한다. 이 트랙이 Phase 6개월 이후 글로벌 매출의 핵심 엔진이 된다.
