# 개미 키우기 · 자동 검증 안내

게임 본체는 v1.0.1 그대로 두고, GitHub Actions 자동 검증 및 테스트 통과 후 Pages 배포를 추가합니다.

## 최초 한 번만 설정

**GitHub 저장소 → Settings → Pages → Build and deployment → Source → GitHub Actions**로 변경하세요.

이 변경은 저장소 설정 권한이 필요합니다. 현재 게시 소스가 브랜치라면 소스 파일을 main에 올리자마자 바로 게시될 수 있으며, CI 검사가 배포를 차단하지 못합니다. 따라서 **GitHub Actions 소스로 전환해야 실패 시 배포 차단이 완성됩니다.**

Actions가 꺼져 있다면 저장소 Settings → Actions에서 활성화해야 합니다. `github-pages` Environment 배포 허용 브랜치는 `main`으로 제한하는 것이 좋습니다.

## 이후 자동 실행

- `main`에 push 또는 수동 `Run workflow` → 브라우저 검증 → 통과 시 Pages 배포 → 공개 주소의 HTML/CSS/JS 4개 파일 바이트 비교.
- Pull request → 브라우저 검증만 실행; 배포하지 않음.
- 테스트 실패 → `publish` 단계는 실행되지 않음.
- 배포 이후 공개 페이지 확인 실패 → `smoke` 단계에서 실패로 표시.
- `Actions → Ant Game · Automated Browser Verification and Pages`에서 로그와 `ant-game-browser-report`를 내려받을 수 있습니다.

## 현재 자동 검증 항목

- 신규 게임 저장 구조 및 게임 버전
- 자동 육성 이벤트 일시정지/선택 후 재개, 정해진 횟수 종료
- 위험 상태·저장 실패·브라우저 백그라운드 상황에서 안전 중지
- LV.10 첫 진화와 저장된 LV.20 외형 6종, LV.10 진화 외형 3종
- 과거 기록에서 진화 복장 표시, 장식·재료 보존
- LV.10 미만 원정권 미지급, LV.10 진입 시 시작, 지역 잠금 안내
- 원정권 차감 및 자원 보상
- 저장 실패 시 행동·EXP 롤백
- 화면 너비 320/360/390/430px에 대한 수평 넘침
- 배포된 4개 게임 소스가 테스트된 소스와 정확히 일치하는지 비교

게임 업그레이드로 규칙이나 HTML 구조가 변경될 경우, 검증 스크립트도 그 변경 사항에 맞게 갱신해야 합니다. 실제 Android 기기별 성능·터치 예외는 자동 에뮬레이션만으로 완전히 대체할 수 없습니다.

## 로컬 실행 (Python 3.12 이상)

```bash
python -m pip install -r requirements-test.txt
python -m playwright install chromium
node --check balance.js
node --check game.js
python tests/structure.py
python tests/regression.py
```

실패 스크린샷과 일부 외형 화면은 `test-results/`에 생성됩니다.
