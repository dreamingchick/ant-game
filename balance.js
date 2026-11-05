/*
 * 개미 키우기 · MVP 밸런스 설정
 * Q1~Q31에서 확정한 규칙은 유지하며, 미확정 세부 계수는 별도로 관리합니다.
 * 이 파일의 숫자를 변경한 후 새로 고침하면 다음 행동부터 새 설정이 적용됩니다.
 */
window.ANT_BALANCE = Object.freeze({
  version: '0.1.0',
  maxLevel: 10, // MVP 상한. 정식 버전 목표는 LV.50.
  initial: { level: 1, exp: 0, motivation: 60, stress: 20, laziness: 10 },
  actions: {
    carrot: { motivation: +15, stress: -10, laziness: +5 },
    whip:   { motivation:  -5, stress: +15, laziness: -5, baseExp: 10 }
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
    refresh:  { name: '기분 전환', kind: 'positive', action: 'both', stress: -5 },
    refusal:  { name: '훈련 거부', kind: 'negative', action: 'whip', cancelExp: true },
    nap:      { name: '몰래 낮잠', kind: 'negative', action: 'both', laziness: +10 },
    complain: { name: '불평 폭발', kind: 'negative', action: 'both', motivation: -10 }
  },
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