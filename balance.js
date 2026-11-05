/*
 * 개미 키우기 · MVP 밸런스 설정
 * Q1~Q31에서 확정한 규칙은 유지하며, 미확정 세부 계수는 별도로 관리합니다.
 * 이 파일의 숫자를 변경한 후 새로 고침하면 다음 행동부터 새 설정이 적용됩니다.
 */
window.ANT_BALANCE = Object.freeze({
  version: '1.0.0',
  // 각 업데이트의 소식은 이 항목에 작성합니다. version은 위 게임 버전과 일치해야 합니다.
  releaseNotes: {
    version:'1.0.0',date:'2026-11-06',title:'개미 왕국의 새로운 시작',
    summary:'정식 출시 안정화: 육성 저장 실패 복구, 안전한 초기화, 저장 상태 점검, 모바일 접근성과 이용 안내를 보강했습니다.',
    sections:[
      {heading:'저장 데이터 안정성',items:[
        '육성 행동·선택 이벤트 저장이 실패하면 능력치·경험치·원정권·진화 기록을 이전 상태로 되돌립니다.',
        '초기화 전 현재 저장 데이터를 별도 복구 슬롯에 백업하고, 실제 저장 성공을 확인합니다.',
        '설정에서 저장 상태와 공간 사용량·완료 기록을 점검할 수 있습니다.'
      ]},
      {heading:'정식 출시 사용성',items:[
        '자동 육성은 저장 오류 발생 시 즉시 중단합니다.',
        '모바일 및 키보드 접근성을 보완하고 애니메이션 감소 설정을 지원합니다.',
        '게임 내 시작 안내·데이터 보관 도움말과 기존 패치 이력을 보완했습니다.'
      ]},
      {heading:'콘텐츠 및 데이터 유지',items:[
        'LV.20과 진화 9종, 원정 지역 6곳, 희귀 발견물 6종, 시설 성장·원정대·주간 목표를 유지합니다.',
        'v0.1~v0.9 저장 데이터와 기존 원정권·자원·장식품을 보존합니다.',
        '원정권은 LV.10 이상 완료 행동 6회마다 획득하는 규칙을 유지합니다.',
        '익명 통계 수집은 계속 비활성화합니다.'
      ]}
    ]
  },
  // 과거 배포 버전을 순서대로 보관합니다. 미배포 v0.2.1은 목록에 포함하지 않습니다.
  // 현재 버전 내용은 releaseNotes에 있으므로 여기에는 이전 배포 기록만 추가합니다.
  releaseNotesHistory: [
    {
    version: '0.9.0',
    date: '2026-11-05',
    title: '원정대의 발자취',
    summary: 'LV.10부터 원정권이 적립됩니다. 원정대 3인 편성, 신규 지역 3곳, 희귀 발견물 6종과 주간 목표가 열렸습니다.',
    sections: [
      {heading:'원정권 규칙 개선',items:[
        'LV.1~9에는 원정권이 적립되지 않으며 LV.10 달성 후 완료한 육성 행동부터 6회마다 1장씩 지급합니다.',
        '원정 화면에 LV.10 해금 안내를 추가했습니다. 기존에 보유한 원정권은 보존합니다.'
      ]},
      {heading:'새로운 원정 콘텐츠',items:[
        '기존 완료 개미 최대 3마리를 원정대로 편성하고 지역 특화 보너스를 받습니다.',
        '깊은 숲, 고대 유적, 수정 심연 지역과 희귀 발견물 도감 6종을 추가했습니다.',
        '원정 횟수, 자원 획득, 원정대 참가에 따른 주간 목표 3종을 추가했습니다.'
      ]},
      {heading:'데이터 보호',items:[
        '기존 v0.1~0.8 기록·시설·장식·자원·원정권은 그대로 보존하고 새 정보만 추가합니다.',
        'GA4 플레이 통계는 계속 비활성화합니다.'
      ]}
    ]
  },
    {
      version: '0.8.0',date:'2026-11-05',title:'개미 왕국의 일꾼들',
      summary:'완료 개미 역할 배치, 왕국 시설 성장, 저장 데이터 안전 복원 기능을 추가했습니다.',
      sections:[{heading:'왕국 운영',items:['시설 3종을 LV.5까지 성장시킬 수 있습니다.','완료 개미를 시설에 배치해 원정 자원을 추가로 획득합니다.']},
        {heading:'데이터 보호',items:['JSON 백업 파일 가져오기, 사전 검증 및 복원 전 백업을 지원합니다.']}]
    },
    {
    version: '0.7.0',
    date: '2026-11-05',
    title: '편안한 성장',
    summary: '당근으로도 소량의 경험치를 얻고, 자동 육성을 내 방식에 맞춰 설정할 수 있습니다.',
    sections: [
      { heading:'당근 경험치', items:[
        'LV.1~9 당근 사용 시 EXP +2, LV.10~19에서는 EXP +3을 획득합니다.',
        '당근 경험치는 훈련 효율에 영향받지 않으며, 기존 당근·채찍 진화 비율은 그대로 유지됩니다.'
      ]},
      { heading:'자동 육성 편의 개선', items:[
        '자동 육성 횟수를 10·25·50·100회 중 선택할 수 있습니다.',
        '자동 진행 속도 3단계, 육성 방식, 위험 상태 자동 정지 여부를 선택할 수 있습니다.',
        '자동 설정은 저장되며, 선택형 이벤트와 첫 진화 중단 후에는 수동으로 남은 횟수를 재개할 수 있습니다.',
        '다음 예상 행동과 진행 횟수를 미리 볼 수 있습니다. 화면 이탈·새로고침 시 자동으로 중지합니다.'
      ]},
      { heading:'기록 및 기존 콘텐츠', items:[
        '기존 LV.20 성장·패시브·탐험·제작·꾸미기·저장 데이터를 그대로 유지합니다.',
        '통계 수집은 계속 비활성화합니다.'
      ]}
    ]
    },
    {
      version:'0.6.0', date:'2026-11-05', title:'개미 왕국의 첫 원정',
      summary:'탐험 지역 3곳, 자원 3종, 제작 장식 6종, 자동 돌봄 3모드를 추가했습니다.',
      sections:[
        {heading:'탐험과 제작',items:['지역 3곳에서 식량·목재·수정을 수집합니다.','육성 6회마다 원정권을 획득해 장식 6종을 제작합니다.']},
        {heading:'자동 돌봄',items:['균형·성장·회복 세 모드, 최대 25회 자동 행동을 도입했습니다.']}
      ]
    },
    {
      version: '0.5.0', date: '2026-11-05', title: '두 번째 진화',
      summary: 'LV.20 성장, 고유 패시브 3종, 2차 진화 6종이 추가되었습니다.',
      sections: [{heading:'성장 확장',items:[
        'LV.10 이후 고유 패시브가 활성화되며 LV.20까지 육성할 수 있습니다.',
        '6종의 두 번째 진화가 도감에 추가되고 구버전 진화 기록은 유지됩니다.'
      ]}]
    },
    {
      version:'0.4.0', date:'2026-11-05', title:'나만의 개미집',
      summary:'개미집 꾸미기, 장식품 9종과 육성 성향에 따른 배경이 추가되었습니다.',
      sections:[
        { heading:'나만의 개미집', items:[
          '바닥·벽·조명 세 위치에 장식품을 배치할 수 있습니다.',
          '육성 누적 기록으로 장식품 9종을 해금합니다.',
          '이전 패치노트의 전체 이력을 열람할 수 있습니다.'
        ]}
      ]
    },
    {
      version: '0.3.0', date: '2026-11-05', title: '개미의 선택',
      summary: '선택형 돌발 이벤트, 진화 예상 가이드, 도전과제 8종과 자동 패치노트가 추가되었습니다.',
      sections: [
        { heading: '새로운 기능', items: [
          '몰래 낮잠과 기분 전환 이벤트의 대응을 선택할 수 있습니다.',
          '예상 진화 분기를 실시간으로 확인할 수 있습니다.',
          '도전과제 8종이 추가되었습니다.'
        ] },
        { heading: '데이터 보호', items: [
          '선택형 이벤트를 새로고침해도 복원하고 기존 육성 기록을 유지합니다.'
        ] }
      ]
    },
    {
      version: '0.2.0', title: '육성 밸런스 개선',
      summary: '위험한 상태에서도 회복과 훈련 사이의 선택이 의미 있게 작동하도록 조정했습니다.',
      sections: [
        { heading: '상태 대응 회복', items: [
          '행동 직전 스트레스가 60 이상일 때 당근의 스트레스 감소량이 총 -20으로 증가합니다.',
          '행동 직전 나태함이 60 이상일 때 채찍의 나태함 감소량이 총 -10으로 증가합니다.'
        ] },
        { heading: '기존 규칙', items: [
          'LV.10 성장, 경험치 공식, 이벤트 확률, 세 진화 분기는 유지됩니다.'
        ] }
      ]
    },
    {
      version: '0.1.0', title: '첫 번째 개미',
      summary: '당근과 채찍으로 육성하고 LV.10에서 첫 번째 진화를 발견하는 개미집이 열렸습니다.',
      sections: [
        { heading: '최초 출시', items: [
          '당근과 채찍으로 의욕·스트레스·나태함을 관리하며 개미를 성장시킵니다.',
          '태평·천재·근면 개미 3종의 진화와 육성 일지를 제공합니다.',
          '게임 기록을 현재 브라우저에 자동 저장합니다.'
        ] }
      ]
    }
  ],
  // GA4 측정 ID(G-...) 발급 후 이 값을 설정해야 통계 전송 기능이 준비됩니다.
  // 미입력 상태에서는 외부 통계 스크립트와 네트워크 요청을 발생시키지 않습니다.
  analytics: { measurementId: '' },
  expeditions: {
    actionsPerTicket: 6,
    maxTickets: 5,
    regions: [
      { id:'meadow', name:'풀잎 초원', icon:'🌿', minLevel:10, main:'food', facilityId:'pantry', specialty:'easy', reward:6, bonusChance:0.20, bonus:3, description:'햇살 아래 씨앗과 식량을 발견합니다.' },
      { id:'forest', name:'오래된 숲', icon:'🌳', minLevel:14, main:'wood', facilityId:'workshop', specialty:'diligent', reward:4, bonusChance:0.20, bonus:2, description:'오래된 나무 사이에서 목재를 수집합니다.' },
      { id:'cave', name:'빛나는 동굴', icon:'💎', minLevel:18, main:'crystal', facilityId:'laboratory', specialty:'genius', reward:2, bonusChance:0.20, bonus:1, description:'깊은 굴 속에서 빛나는 수정을 찾습니다.' },
      { id:'deep_forest', name:'깊은 숲', icon:'🌲', minLevel:16, main:'wood', facilityId:'workshop', specialty:'diligent', reward:6, bonusChance:0.25, bonus:3, description:'오래된 숲 너머에서 튼튼한 목재를 발견합니다.' },
      { id:'ancient_ruins', name:'고대 유적', icon:'🏛️', minLevel:18, main:'food', facilityId:'pantry', specialty:'easy', reward:8, bonusChance:0.25, bonus:4, description:'옛 개미 왕국이 남긴 식량 창고를 발견합니다.' },
      { id:'crystal_abyss', name:'수정 심연', icon:'🌀', minLevel:20, main:'crystal', facilityId:'laboratory', specialty:'genius', reward:4, bonusChance:0.25, bonus:2, description:'심연의 희귀 수정을 찾아 깊은 원정을 떠납니다.' }
    ]
  },
  expeditionSquad: { maxMembers:3, memberBonus:1, specialtyBonus:1 },
  rareFinds: [
    {id:'amber_seed',region:'meadow',name:'호박빛 씨앗',icon:'🌰',chance:0.12,description:'햇살을 머금은 신비로운 씨앗'},
    {id:'ancient_acorn',region:'forest',name:'고목의 도토리',icon:'🌳',chance:0.12,description:'수백 해의 흔적이 깃든 도토리'},
    {id:'moon_stone',region:'cave',name:'달빛 조약돌',icon:'🌙',chance:0.12,description:'동굴 벽을 밝히는 작은 돌'},
    {id:'forest_crest',region:'deep_forest',name:'푸른 숲의 문장',icon:'🍃',chance:0.10,description:'오래된 나무에 새겨진 문장'},
    {id:'royal_tablet',region:'ancient_ruins',name:'옛 왕국의 서판',icon:'📜',chance:0.10,description:'사라진 왕국의 이야기를 담은 서판'},
    {id:'abyss_prism',region:'crystal_abyss',name:'심연의 프리즘',icon:'🔷',chance:0.08,description:'깊은 곳에서 발견한 투명한 결정'}
  ],
  weeklyGoals: [
    {id:'trips',name:'이번 주의 발걸음',target:4,description:'이번 주 원정 4회',reward:{food:8}},
    {id:'resources',name:'왕국의 보급',target:24,description:'이번 주 자원 24개 획득',reward:{wood:6}},
    {id:'squadTrips',name:'함께 떠나는 원정',target:2,description:'2마리 이상 편성하여 원정 2회',reward:{crystal:4}}
  ],
  resources: [
    { id:'food', name:'식량', icon:'🌾' },
    { id:'wood', name:'목재', icon:'🪵' },
    { id:'crystal', name:'수정', icon:'🔮' }
  ],
  craftingItems: [
    { id:'seed-pile', slot:'floor', name:'씨앗 보따리', icon:'🌰', desc:'탐험에서 모은 식량으로 만든 보따리', cost:{food:10} },
    { id:'wooden-bench', slot:'floor', name:'숲속 나무 의자', icon:'🪑', desc:'튼튼한 나무 의자', cost:{wood:8,food:5} },
    { id:'moss-banner', slot:'wall', name:'초록 깃발', icon:'🍀', desc:'개미집의 자랑스러운 깃발', cost:{food:14,wood:4} },
    { id:'carved-board', slot:'wall', name:'나무 문패', icon:'🪧', desc:'원정의 기록이 새겨진 문패', cost:{wood:14} },
    { id:'crystal-lamp', slot:'light', name:'수정 등불', icon:'💠', desc:'신비한 광석으로 만든 조명', cost:{crystal:6,wood:4} },
    { id:'glow-lantern', slot:'light', name:'빛나는 등롱', icon:'🏮', desc:'깊은 동굴의 빛을 담은 등롱', cost:{crystal:12,food:8} }
  ],
  // v0.7: 당근은 훈련 효율과 무관하게 고정 EXP를 획득합니다.
  carrotExp: { phase1: 2, phase2: 3 },
  kingdomFacilities: [
    {id:'pantry',name:'식량 창고',role:'식량 채집가',icon:'🌾',resource:'food',region:'meadow',specialty:'easy',levelBonus:[0,0,1,2,3,4],costs:{
      2:{food:12,wood:4},3:{food:24,wood:8},4:{food:40,wood:14,crystal:2},5:{food:60,wood:24,crystal:5}
    }},
    {id:'workshop',name:'운반 작업장',role:'자원 운반가',icon:'🪵',resource:'wood',region:'forest',specialty:'diligent',levelBonus:[0,0,1,2,3,4],costs:{
      1:{food:8,wood:12},2:{food:16,wood:20},3:{food:28,wood:36,crystal:2},4:{food:44,wood:56,crystal:5},5:{food:64,wood:84,crystal:10}
    }},
    {id:'laboratory',name:'수정 연구실',role:'수정 연구가',icon:'🔮',resource:'crystal',region:'cave',specialty:'genius',levelBonus:[0,0,0,1,2,2],costs:{
      1:{food:12,wood:12,crystal:6},2:{food:20,wood:18,crystal:12},3:{food:32,wood:30,crystal:20},4:{food:48,wood:44,crystal:30},5:{food:72,wood:64,crystal:45}
    }}
  ],
  autoCare: {
    defaultMode: 'balanced', defaultBatch: 25, defaultSpeed: 'normal', defaultSafeStop: true,
    batches: [10, 25, 50, 100],
    speeds: { relaxed: 2200, normal: 1250, fast: 650 }
  },
  maxLevel: 20, // v0.5: LV.10은 체크포인트, LV.20이 완료. 정식 목표 LV.50.
  initial: { level: 1, exp: 0, motivation: 60, stress: 20, laziness: 10 },
  actions: {
    carrot: { motivation: +15, stress: -10, laziness: +5 },
    whip:   { motivation:  -5, stress: +15, laziness: -5, baseExp: 10 }
  },
  // v0.2 상태 대응 회복 보너스: 반드시 행동 직전 능력치로 판정.
  // 기본 행동 효과와 별도로 적용되며, 이벤트 확률·경험치·진화 비율은 변경하지 않습니다.
  conditionalRecovery: {
    carrot: { stat: 'stress', threshold: 60, extra: -10 },
    whip: { stat: 'laziness', threshold: 60, extra: -5 }
  },
  phaseTwoBaseExp: 14,
  passive: {
    easy: { extraCarrotStressRecovery: -5 },
    genius: { positiveEventBenefitMultiplier: 1.2 },
    diligent: { whipExpMultiplier: 1.15 }
  },
  secondEvolution: {
    threshold: 0.55,
    types: {
      garden_keeper: { parent:'easy', branch:'A', name:'꽃정원 개미', icon:'🌺', label:'돌봄의 달인', quote:'꽃 한 송이에도 온 정성을 담아!' },
      meadow_explorer: { parent:'easy', branch:'B', name:'초원 개척 개미', icon:'🧭', label:'초원의 개척자', quote:'쉬엄쉬엄 가도 새로운 길은 열리지!' },
      star_scholar: { parent:'genius', branch:'A', name:'별빛 학자 개미', icon:'🔭', label:'별의 연구자', quote:'작은 별에도 세상의 비밀이 있어!' },
      clockwork_inventor: { parent:'genius', branch:'B', name:'태엽 발명 개미', icon:'⚙️', label:'발명의 달인', quote:'고장 난 세상도 다시 움직이게!' },
      workshop_artisan: { parent:'diligent', branch:'A', name:'공방 장인 개미', icon:'🛠️', label:'정성의 장인', quote:'작은 손끝에 큰 꿈을 새긴다!' },
      steel_guardian: { parent:'diligent', branch:'B', name:'강철 수호 개미', icon:'🛡️', label:'개미집의 수호자', quote:'우리의 집은 우리가 지킨다!' }
    }
  },
  expRequired(level) { return 50 + 10 * (level - 1); },
  efficiency: {
    min: 0.5, max: 1.5,
    motivationBaseline: 50,
    motivationWeight: 0.01, // 임시 계수 · Q18 후속 밸런싱 대상
    stressWeight: 0.008,   // 임시 계수
    lazinessWeight: 0.006 // 임시 계수
  },
  // Q20: 상태 판정 우선순위 위험 → 주의 → 양호 → 보통.
  eventTiers: {
    good:   { rate: 0.12, positiveShare: 0.70, label: '양호' },
    normal: { rate: 0.10, positiveShare: 0.50, label: '보통' },
    warn:   { rate: 0.22, positiveShare: 0.20, label: '주의' },
    danger: { rate: 0.35, positiveShare: 0.05, label: '위험' }
  },
  thresholds: {
    danger: { stressAtLeast: 85, lazinessAtLeast: 85, motivationAtMost: 15 },
    warn:   { stressAtLeast: 60, lazinessAtLeast: 60, motivationAtMost: 30 },
    good:   { motivationAtLeast: 70, stressAtMost: 30, lazinessAtMost: 30 }
  },
  // Q20: 한 행동에는 이벤트 최대 1개. 당근/채찍에 따라 가능한 이벤트만 추첨.
  events: {
    focus:    { name: '집중력 폭발', kind: 'positive', action: 'whip', expMultiplier: 1.5 },
    carrotJoy:{ name: '당근 대만족', kind: 'positive', action: 'carrot', motivation: +5 },
    refresh:  { name: '기분 전환', kind: 'positive', action: 'both', stress: -5,
      prompt: '개미가 새로운 기분 전환 방법을 발견했습니다. 어떻게 해 볼까요?',
      choices: [
        { id:'snack', label:'작은 간식을 준다', details:'의욕 +5 · 나태함 +3', effects:{motivation:5,laziness:3}, response:'맛있는 간식 덕분에 기운이 생겼어!' },
        { id:'walk', label:'산책을 나간다', details:'나태함 -5 · 의욕 -3', effects:{laziness:-5,motivation:-3}, response:'가볍게 걸으니 몸이 개운해졌어!' }
      ]
    },
    refusal:  { name: '훈련 거부', kind: 'negative', action: 'whip', cancelExp: true },
    nap:      { name: '몰래 낮잠', kind: 'negative', action: 'both', laziness: +10,
      prompt: '개미가 훈련 도중 꾸벅꾸벅 졸고 있습니다. 어떻게 대응할까요?',
      choices: [
        { id:'rest', label:'잠시 쉬게 한다', details:'스트레스 -8 · 나태함 +5', effects:{stress:-8,laziness:5}, response:'잠시 쉬니 긴장이 풀렸지만 조금 느긋해졌어.' },
        { id:'focus', label:'다시 집중하도록 돕는다', details:'나태함 -5 · 스트레스 +8', effects:{laziness:-5,stress:8}, response:'다시 집중했지만 조금 긴장됐어.' }
      ]
    },
    complain: { name: '불평 폭발', kind: 'negative', action: 'both', motivation: -10 }
  },
  achievements: [
    { id:'ACH01', title:'첫 발걸음', description:'당근 또는 채찍을 1회 사용', icon:'🌱' },
    { id:'ACH02', title:'첫 번째 진화', description:'LV.10 진화를 1회 완료', icon:'✨' },
    { id:'ACH03', title:'느긋한 개척자', description:'태평 개미 발견', icon:'🍀' },
    { id:'ACH04', title:'반짝이는 발상', description:'천재 개미 발견', icon:'💡' },
    { id:'ACH05', title:'묵묵한 노력', description:'근면 개미 발견', icon:'🛠️' },
    { id:'ACH06', title:'세 갈래의 길', description:'세 가지 진화를 모두 발견', icon:'🏆' },
    { id:'ACH07', title:'개미 돌봄 전문가', description:'누적 육성 행동 300회', icon:'📜' },
    { id:'ACH08', title:'사건의 목격자', description:'누적 돌발 이벤트 30회', icon:'🔎' }
  ],
  // v0.4 개미집 꾸미기: 오직 누적 기록에 따라 해금하는 외형 장식입니다.
  // 슬롯당 하나만 장착합니다. 기존 능력치·EXP·진화 계산에는 관여하지 않습니다.
  decorations: [
    { id:'carrot-basket', slot:'floor', name:'당근 바구니', icon:'🥕', desc:'수확한 당근을 모아 두는 바구니', req:{kind:'carrots',min:5}, hint:'누적 당근 5회' },
    { id:'leaf-bed', slot:'floor', name:'잎사귀 침대', icon:'🍃', desc:'말랑하고 푹신한 휴식 공간', req:{kind:'carrots',min:30}, hint:'누적 당근 30회' },
    { id:'toolbox', slot:'floor', name:'훈련 도구함', icon:'🧰', desc:'성실한 개미의 작은 도구함', req:{kind:'whips',min:30}, hint:'누적 채찍 30회' },
    { id:'growth-chart', slot:'wall', name:'성장 기록판', icon:'📜', desc:'매일의 선택을 적어 두는 기록판', req:{kind:'actions',min:15}, hint:'누적 행동 15회' },
    { id:'flower-garland', slot:'wall', name:'꽃 덩굴 장식', icon:'🌸', desc:'개미집에 봄을 데려오는 꽃 장식', req:{kind:'carrots',min:20}, hint:'누적 당근 20회' },
    { id:'trophy-shelf', slot:'wall', name:'진화 기념장', icon:'🏆', desc:'첫 진화를 기리는 작은 기념품', req:{kind:'evolutions',min:1}, hint:'진화 1회 완료' },
    { id:'mushroom-light', slot:'light', name:'버섯 등불', icon:'🍄', desc:'따스한 빛의 버섯 조명', req:{kind:'events',min:5}, hint:'누적 돌발 이벤트 5회' },
    { id:'firefly-jar', slot:'light', name:'반딧불 유리병', icon:'✨', desc:'어두운 굴을 밝히는 작은 별빛', req:{kind:'actions',min:60}, hint:'누적 행동 60회' },
    { id:'star-lantern', slot:'light', name:'별빛 수정등', icon:'💎', desc:'천재 개미의 기발한 발상이 깃든 장식', req:{kind:'genius',min:1}, hint:'천재 개미 1회 진화' }
  ],
  // Q21 엄격한 균형 판정: <=45% 태평, (45%,55%) 천재, >=55% 근면.
  evolution: { easyMaxWhipRatio: 0.45, geniusMaxWhipRatio: 0.55 },
  types: {
    easy: { name: '태평 개미', passive: '여유로운 마음', description: '당근의 스트레스 감소 효과 강화', quote: '느긋하게 가도, 결국 도착하니까!' },
    genius: { name: '천재 개미', passive: '기발한 발상', description: '긍정적인 돌발 이벤트 효과 강화', quote: '방법은 하나가 아니지!' },
    diligent: { name: '근면 개미', passive: '성실한 훈련', description: '채찍의 경험치 획득량 강화', quote: '작은 노력이 큰 성장을 만든다!' }
  },
  // LV.10 이후 패시브를 활성화합니다. 우수 진화는 향후 확장 대상입니다.
  superiorEvolutionEnabled: false,
  passiveEffectsEnabled: true
});
