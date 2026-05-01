import type { Scenario } from "@/lib/types";

export const MR_SUNSHINE_SCENARIO: Scenario = {
  id: "mr_sunshine",
  title: { ko: "Mr. Sunshine 정서", en: "Echoes of Sunshine" },
  subtitle: { ko: "1894~1907 한성", en: "Hanseong, 1894–1907" },
  description: {
    ko: "격동의 대한제국 말기. 당신은 한성의 작은 골목에서 태어나 시대의 흐름 속에 자신의 길을 찾아가야 합니다. 주인공이 될지, 그 옆에서 시대를 견딜지 — 당신의 선택이 결정합니다.",
    en: "The twilight of Joseon. Born in a narrow alley of Hanseong, you must find your own path amid the tides of history. Will you be the one history remembers, or the witness who endures beside them?",
  },
  era: "1900s_hanseong",
  genre: ["historical", "action", "romance"],
  heaviness: 4,
  recommendedAgeMin: 15,
  coverImageUrl: "/images/scenarios/mr-sunshine-cover.jpg",
  cradleConfig: {
    type: "self_youth",
    cradleStartAge: 9,
    cradleEndAge: 15,
  },
  mainStoryEndAge: 19,
  isPremium: false,
  status: "published",
  totalPlays: 1247,
  averageRating: 4.7,

  familyBackgrounds: [
    {
      id: "hanyak_house",
      nameKo: "청계천 변 한약방 집안",
      nameEn: "Herb Medicine Family near Cheonggyecheon",
      descriptionKo: "부친은 한약을 짓는 의원입니다. 학식은 있으나 재산은 넉넉지 않습니다.",
      initialStats: { intellect: 2, creativity: 1, emotion: 1 },
      initialQualities: { scholar_path: 1 },
    },
    {
      id: "merchant_family",
      nameKo: "종로 포목전 상인 가문",
      nameEn: "Jongno Cloth Merchant Family",
      descriptionKo: "장사 수완이 뛰어난 부친 덕에 중산층을 유지합니다.",
      initialStats: { sociability: 2, intellect: 1 },
      initialQualities: { merchant_path: 1 },
    },
    {
      id: "rural_family",
      nameKo: "경기도 외곽 농가",
      nameEn: "Rural Farming Family near Gyeonggi",
      descriptionKo: "땅을 일구는 평민 가정. 몸은 강하지만 배움이 부족합니다.",
      initialStats: { physique: 3, emotion: 1 },
      initialQualities: {},
    },
    {
      id: "yangban_minor",
      nameKo: "한양 하급 양반 가문",
      nameEn: "Minor Yangban Family in Hanyang",
      descriptionKo: "양반 신분이지만 재산은 많지 않습니다. 체면을 중시합니다.",
      initialStats: { morality: 2, sociability: 1 },
      initialQualities: { yangban_birth: 1 },
    },
    {
      id: "chunmin_labor",
      nameKo: "종로 노동자 가정",
      nameEn: "Working-Class Family in Jongno",
      descriptionKo: "하층민 가정. 강인한 생존 의지를 가지고 있습니다.",
      initialStats: { physique: 2, emotion: 2 },
      initialQualities: { chunmin_birth: 1, rage: 1 },
    },
  ],

  castingRoles: [
    {
      id: "the_returner",
      scenarioId: "mr_sunshine",
      name: { ko: "이방인의 길", en: "The Returner" },
      shortDescription: {
        ko: "미국에서 돌아온 군관. 두 세계 사이에서 자신의 길을 찾는다.",
        en: "A soldier returned from America. Caught between two worlds.",
      },
      conditions: {
        requiredStats: { intellect: 14, morality: 12 },
        requiredQualities: { foreign_path: 2 },
      },
      priority: 1,
      t0NarrativeTemplate: {
        ko: "15세, 1900년 가을.\n\n당신은 미국에서 돌아왔다.\n3년 전 떠난 곳에 다시 왔다.\n당신은 이제 미국 해병대 군복을 입고 있다.\n\n한성의 거리는 변했다.\n변하지 않은 것은 — 일본인 상점이 더 늘어났다는 것이다.\n\n당신의 이야기는 이제 시작된다.",
        en: "Age 15, autumn 1900.\n\nYou have returned from America.\nBack to where you once fled.\nYou now wear the uniform of the U.S. Marine Corps.\n\nThe streets of Hanseong have changed.\nWhat hasn't — more Japanese shops line every corner.\n\nYour story begins now.",
      },
      endingIds: [
        "returner_independence_fighter",
        "returner_exile",
        "returner_martyr",
        "returner_diplomat",
        "returner_witness",
      ],
      iconicMomentIds: ["first_meeting_seohi", "american_flag_scene"],
    },
    {
      id: "the_gentleman",
      scenarioId: "mr_sunshine",
      name: { ko: "양심의 도련님", en: "The Gentleman" },
      shortDescription: {
        ko: "친일가 아들로 태어났지만 양심을 버리지 못한 도련님.",
        en: "Born into a pro-Japanese family, yet unable to abandon his conscience.",
      },
      conditions: {
        requiredStats: { morality: 14 },
        requiredQualities: { yangban_birth: 1, father_pro_japan: 2 },
      },
      priority: 2,
      t0NarrativeTemplate: {
        ko: "15세, 1900년.\n\n부친은 일본의 뜻에 따르는 것이 살 길이라 말한다.\n당신은 그 말이 옳다고 생각하지 않는다.\n그러나 아직, 아무것도 하지 못했다.\n\n당신의 이야기는 이제 시작된다.",
        en: "Age 15, 1900.\n\nYour father says following Japan's will is the only way to survive.\nYou don't believe him.\nBut so far, you've done nothing.\n\nYour story begins now.",
      },
      endingIds: [
        "gentleman_secret_sponsor",
        "gentleman_exile",
        "gentleman_seppuku",
        "gentleman_betrayal",
      ],
      iconicMomentIds: ["father_confrontation", "secret_meeting"],
    },
    {
      id: "the_lady",
      scenarioId: "mr_sunshine",
      name: { ko: "의기 있는 처녀", en: "The Lady" },
      shortDescription: {
        ko: "양반가 처녀이지만 의병을 품은 여인.",
        en: "A noblewomen who secretly harbors revolutionary ideals.",
      },
      conditions: {
        requiredStats: { intellect: 12, morality: 12 },
        requiredQualities: { yangban_birth: 1, uigi: 4 },
      },
      priority: 3,
      t0NarrativeTemplate: {
        ko: "15세, 1900년.\n\n당신은 궁중에 들어가기 위해 배움을 쌓아왔다.\n그러나 배울수록, 더 많은 것이 보이기 시작했다.\n이 나라가 지금 어디로 가고 있는지를.\n\n당신의 이야기는 이제 시작된다.",
        en: "Age 15, 1900.\n\nYou've studied to enter the royal court.\nBut the more you've learned, the more you've seen — where this country is truly headed.\n\nYour story begins now.",
      },
      endingIds: [
        "lady_independence_leader",
        "lady_manchuria_exile",
        "lady_prison_death",
        "lady_disguised_marriage",
      ],
      iconicMomentIds: ["first_meeting_seohi", "secret_meeting"],
    },
    {
      id: "the_blade",
      scenarioId: "mr_sunshine",
      name: { ko: "백정의 분노", en: "The Blade" },
      shortDescription: {
        ko: "하층민 출신, 일본 조직원이 된 사내. 분노가 그를 만들었다.",
        en: "Born in the lowest caste, became an enforcer. Rage forged him.",
      },
      conditions: {
        requiredStats: { physique: 13 },
        requiredQualities: { chunmin_birth: 1, rage: 4 },
      },
      priority: 4,
      t0NarrativeTemplate: {
        ko: "15세, 1900년.\n\n당신은 이제 칼을 품고 다닌다.\n누군가의 심부름을 하며 먹고 산다.\n그 누군가가 일본인이라는 것이, 아직은 크게 걸리지 않는다.\n\n당신의 이야기는 이제 시작된다.",
        en: "Age 15, 1900.\n\nYou now carry a blade.\nYou run errands for someone — for pay.\nThe fact that someone is Japanese doesn't bother you yet.\n\nYour story begins now.",
      },
      endingIds: [
        "blade_organization_boss",
        "blade_betrayal_independence",
        "blade_mysterious_death",
      ],
      iconicMomentIds: ["alley_confrontation"],
    },
    {
      id: "the_witness",
      scenarioId: "mr_sunshine",
      name: { ko: "거리의 목격자", en: "The Witness" },
      shortDescription: {
        ko: "종로 거리의 평범한 사람. 역사는 곁을 스쳐갔고, 당신은 그것을 보았다.",
        en: "An ordinary person on Jongno street. History passed you by — and you watched it.",
      },
      conditions: {},
      priority: 99,
      t0NarrativeTemplate: {
        ko: "15세, 1900년.\n\n세상이 변하고 있다.\n당신은 그저 살아가고 있다.\n그러나 살아가는 것만으로도, 때로는 충분하다.\n\n당신의 이야기는 이제 시작된다.",
        en: "Age 15, 1900.\n\nThe world is changing.\nYou are simply living through it.\nBut sometimes, simply living is enough.\n\nYour story begins now.",
      },
      endingIds: [
        "witness_herb_merchant",
        "witness_street_singer",
        "witness_diary_writer",
        "witness_farmer",
      ],
      iconicMomentIds: [],
    },
  ],

  iconicMoments: [
    {
      id: "first_meeting_seohi",
      scenarioId: "mr_sunshine",
      applicableCastings: ["the_returner", "the_lady", "the_gentleman"],
      chapterAge: 12,
      conditions: { requiredQualities: { seohi_bond: 0 } },
      setup: {
        location: "한성 어느 한약방 앞, 봄",
        npcInvolved: ["seohi"],
        sceneDirective:
          "양반가 따님 서희가 한문 책을 들고 한약방에 들렀다. 처음 만나는 순간. 차가운 첫 인상, 호기심 혹은 경계.",
        emotionalTone: "차가운 첫 만남, 호기심과 경계",
        expectedNarrativeLength: "medium",
      },
      outcomes: {
        dramaConsistent: {
          labelKo: "한문을 묻는다",
          labelEn: "Ask about the book",
          qualityChanges: { seohi_bond: 2 },
          relationshipChanges: { seohi: 3 },
          statChanges: { intellect: 1 },
          pathFlag: "seohi_met",
        },
        divergent: {
          labelKo: "무시하고 일에 집중한다",
          labelEn: "Ignore and focus on work",
          qualityChanges: { seohi_bond: 0, independent_path: 1 },
          relationshipChanges: { seohi: -1 },
          statChanges: { sociability: -1, morality: 1 },
          activatesPath: "solitary_path",
        },
        custom: {
          evaluatorPrompt:
            "사용자 답변이 처음 만나는 양반가 따님에게 적절한 반응인지 평가. 호기심, 무시, 호의 중 어느 쪽에 가까운지 판단.",
        },
      },
    },
    {
      id: "american_flag_scene",
      scenarioId: "mr_sunshine",
      applicableCastings: ["the_returner"],
      chapterAge: 16,
      conditions: { requiredQualities: { foreign_path: 2 } },
      setup: {
        location: "한성 주재 미국 공사관 앞, 가을",
        npcInvolved: ["us_consul"],
        sceneDirective:
          "미국 공사관에 성조기가 펄럭인다. 군복을 입은 당신 앞에 선택이 놓인다: 미국의 이익을 따를 것인가, 조선을 위해 움직일 것인가.",
        emotionalTone: "정체성의 갈림길, 긴장과 선택",
        expectedNarrativeLength: "long",
      },
      outcomes: {
        dramaConsistent: {
          labelKo: "조선을 위해 움직이기로 결심한다",
          labelEn: "Decide to act for Joseon",
          qualityChanges: { morality_for_independence: 3, foreign_path: 1 },
          relationshipChanges: {},
          statChanges: { morality: 2, sociability: -1 },
          pathFlag: "drama_path_consistent",
        },
        divergent: {
          labelKo: "미국의 명령을 따른다",
          labelEn: "Follow American orders",
          qualityChanges: { foreign_path: 2, drama_path_consistent: 0 },
          relationshipChanges: {},
          statChanges: { intellect: 1, morality: -1 },
          activatesPath: "american_path",
        },
        custom: {
          evaluatorPrompt:
            "사용자가 미국 군인으로서 조선에서의 정체성에 대해 어떻게 생각하는지 평가.",
        },
      },
    },
  ],

  endings: [
    {
      id: "returner_independence_fighter",
      scenarioId: "mr_sunshine",
      castingRoleId: "the_returner",
      title: { ko: "독립의 불꽃", en: "Flame of Independence" },
      shortDescription: {
        ko: "당신은 의병의 길을 택했고, 그 이름은 역사에 남지 않았지만 그 행동은 남았다.",
        en: "You chose the path of the independence fighters. Your name may be forgotten, but your actions were not.",
      },
      conditions: {
        requiredStats: { morality: 15 },
        requiredQualities: { morality_for_independence: 4, drama_path_consistent: 1 },
      },
      priority: 1,
      narrativeContext: {
        historicalEvents: ["을사조약 1905", "정미의병 1907"],
        keyMotifs: ["희생", "선택", "이름 없는 영웅"],
        suggestedQuoteThemes: ["조국", "불꽃", "기억"],
      },
      cardArtStyle: {
        palette: "1900s_modern",
        composition: "portrait",
        moodKeywords: ["resolute", "twilight", "soldier"],
      },
      totalDiscoveries: 89,
      rarityPercentage: 7.1,
    },
    {
      id: "returner_exile",
      scenarioId: "mr_sunshine",
      castingRoleId: "the_returner",
      title: { ko: "망명의 땅에서", en: "The Exile" },
      shortDescription: {
        ko: "당신은 끝내 나라를 떠났고, 이국의 땅에서 조선을 그리워하며 살았다.",
        en: "You left the country at last, spending your remaining years longing for a Joseon that no longer existed.",
      },
      conditions: {
        requiredQualities: { foreign_path: 5 },
      },
      priority: 2,
      narrativeContext: {
        historicalEvents: ["경술국치 1910"],
        keyMotifs: ["그리움", "타향", "나라 잃은 슬픔"],
        suggestedQuoteThemes: ["고향", "달", "잊혀진 이름"],
      },
      cardArtStyle: {
        palette: "1900s_modern",
        composition: "landscape",
        moodKeywords: ["melancholy", "distant", "longing"],
      },
      totalDiscoveries: 124,
      rarityPercentage: 9.9,
    },
    {
      id: "returner_martyr",
      scenarioId: "mr_sunshine",
      castingRoleId: "the_returner",
      title: { ko: "의거의 마지막", en: "The Martyr" },
      shortDescription: {
        ko: "당신은 마지막 한 발을 쐈다. 그리고 다시는 돌아오지 않았다.",
        en: "You fired the last shot. And you never came back.",
      },
      conditions: {
        requiredStats: { morality: 17, physique: 14 },
        requiredPathVariables: { isOnDramaPath: true },
      },
      priority: 3,
      narrativeContext: {
        historicalEvents: ["안중근 1909", "의병 항쟁"],
        keyMotifs: ["희생", "총성", "마지막 선택"],
        suggestedQuoteThemes: ["나라", "죽음", "자유"],
      },
      cardArtStyle: {
        palette: "1900s_modern",
        composition: "scene",
        moodKeywords: ["tragic", "brave", "solitary"],
      },
      totalDiscoveries: 43,
      rarityPercentage: 3.4,
    },
    {
      id: "witness_herb_merchant",
      scenarioId: "mr_sunshine",
      castingRoleId: "the_witness",
      title: { ko: "청계천 변 한약방", en: "The Herbalist of Cheonggyecheon" },
      shortDescription: {
        ko: "당신은 부친의 뒤를 이어 한약방을 지켰다. 많은 이들의 이야기가 당신의 약방을 거쳐 갔다.",
        en: "You inherited your father's herb shop. Many stories passed through your door.",
      },
      conditions: {},
      priority: 99,
      narrativeContext: {
        historicalEvents: ["일제강점기 시작", "경성으로의 전환"],
        keyMotifs: ["평범함의 가치", "이웃", "생존"],
        suggestedQuoteThemes: ["삶", "평화", "약"],
      },
      cardArtStyle: {
        palette: "1900s_hanseong",
        composition: "scene",
        moodKeywords: ["warm", "humble", "enduring"],
      },
      totalDiscoveries: 312,
      rarityPercentage: 24.9,
    },
    {
      id: "witness_diary_writer",
      scenarioId: "mr_sunshine",
      castingRoleId: "the_witness",
      title: { ko: "시대를 기록한 사람", en: "The Chronicler" },
      shortDescription: {
        ko: "당신은 자신이 본 것을 모두 기록했다. 그 일기가 훗날 역사가 되었다.",
        en: "You recorded everything you witnessed. Those diaries became history.",
      },
      conditions: {
        requiredStats: { intellect: 13, creativity: 12 },
      },
      priority: 10,
      narrativeContext: {
        historicalEvents: ["을사조약", "경술국치"],
        keyMotifs: ["기록", "관찰", "후대"],
        suggestedQuoteThemes: ["기억", "글", "시대"],
      },
      cardArtStyle: {
        palette: "1900s_hanseong",
        composition: "portrait",
        moodKeywords: ["contemplative", "historical", "quiet"],
      },
      totalDiscoveries: 178,
      rarityPercentage: 14.2,
    },
  ],
};

export default MR_SUNSHINE_SCENARIO;
