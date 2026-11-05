/*
 * 개미 키우기 · MVP 밸런스 설정
 * Q1~Q31에서 확정한 규칙은 유지하며, 미확정 세부 계수는 별도로 관리합니다.
 * 이 파일의 숫자를 변경한 후 새로 고침하면 다음 행동부터 새 설정이 적용됩니다.
 */
window.ANT_BALANCE = Object.freeze({
  version: '0.4.0',
  // 각 업데이트의 소식은 이 항목에 작성합니다. version은 위 게임 버전과 일치해야 합니다.
  releaseNotes: {
    version: '0.4.0',
    date: '2026-11-05',
    title: '나만의 개미집',
    summary: '개미의 성장 기록이 개미집을 채웁니다. 장식 9종을 발견하고 원하는 곳에 꾸며 보세요.',
    sections: [
      { heading: '새로운 개미집', items: [
        '장식품 9종이 추가되었습니다. 누적 당근·채찍·이벤트·진화 기록으로 해금합니다.',
        '바닥, 벽, 조명에 각 1개씩 장식을 배치하거나 해제할 수 있습니다.',
        '당근과 채찍의 누적 비율에 따라 개미집의 배경 분위기가 바뀝니다.'
      ] },
      { heading: '기록 및 편의성', items: [
        'v0.1부터의 육성·진화 기록으로 달성한 장식은 자동으로 열립니다.',
        '꾸미기 배치는 새 개미를 키워도 유지되고 이전 패치노트도 계속 열람할 수 있습니다.',
        '통계 수집은 요청에 따라 계속 비활성화합니다.'
      ] },
      { heading: '밸런스 유지', items: [
        '장식은 외형 전용이며 경험치·돌발 이벤트·진화 확률에 영향을 주지 않습니다.',
        'v0.2 조건부 회복과 v0.3 선택형 이벤트, 도전과제 8종을 유지합니다.'
      ] }
    ]
  },
  // 과거 배포 버전을 순서대로 보관합니다. 미배포 v0.2.1은 목록에 포함하지 않습니다.
  // 현재 버전 내용은 releaseNotes에 있으므로 여기에는 이전 배포 기록만 추가합니다.
  releaseNotesHistory: [
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
  maxLevel: 10, // MVP 상한. 정식 버전 목표는 LV.50.
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
  // LV.10 MVP는 진화 시점에 육성이 끝나므로 패시브는 표시만 합니다.
  // 우수 진화의 구체 조건 또한 향후 밸런싱 대상으로 비활성화합니다.
  superiorEvolutionEnabled: false,
  passiveEffectsEnabled: false
});