# 개미 키우기 MVP v0.2 — 조건부 회복 밸런스 패치

기준 저장소: https://github.com/dreamingchick/ant-game (main)

## 변경 사항
- 기존 Q1~Q31에서 확정한 기본 행동 변화량·레벨 요구 EXP·돌발 이벤트 확률·진화 비율 유지
- **당근:** 행동 직전 스트레스가 **60 이상**이라면 기존 스트레스 -10 외에 -10 추가 (총 -20)
- **채찍:** 행동 직전 나태함이 **60 이상**이라면 기존 나태함 -5 외에 -5 추가 (총 -10)
- 행동 전 상태로 조건을 판단하고, 기본 행동→회복 보너스→돌발 이벤트 순으로 능력치 반영
- 회복 보너스가 적용되면 행동 피드백에 표시
- 설정 도움말에 새로운 규칙 안내, UI 버전을 v0.2로 표시
- 새로운 진화 기록에 `balanceVersion: "0.2.0"` 기록, 기존 기록은 내부적으로 v0.1로 분류

## 저장 데이터 호환성
- **기존 localStorage 키를 유지합니다:** `little-ant-game-mvp-v1`
- **기존 schemaVersion: 1을 유지합니다.**
- 기존 진행 중 육성과 과거 진화 기록을 로드하며, 새 게임을 시작하도록 강제하지 않습니다.
- 구버전 진화 기록의 `balanceVersion` 속성이 없으면 **v0.1.0**으로 분류합니다.
- 기존 저장 기록을 유지하려면 **현재 사용하던 동일한 GitHub Pages URL / 동일 브라우저**에서 접속하세요.
- 저장 데이터 자체를 지우는 '전체 데이터 초기화' 버튼은 누르지 마세요.

## GitHub Pages 업데이트
1. https://github.com/dreamingchick/ant-game/upload/main 에 접속
2. `index.html`, `style.css`, `balance.js`, `game.js` 4개 업로드 (기존 파일 덮어쓰기)
3. `Commit changes`로 저장. 저장소 최상위(root)에 배치.
4. https://dreamingchick.github.io/ant-game/ 접속. 업데이트 후 브라우저에서 새로고침.
5. 설정의 하단 표기가 **MVP v0.2**인지 확인.

## 수치 조정
`balance.js`의 `conditionalRecovery`에서 `threshold`와 `extra`를 조정할 수 있습니다.

## 파일
- index.html: 게임 화면, v0.2 안내
- style.css: v0.1 디자인 그대로 유지 (변경 없음)
- balance.js: 새 조건부 회복 수치
- game.js: 조건부 회복 판정, 기록 버전, 저장 호환 처리
