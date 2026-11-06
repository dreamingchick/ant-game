# 개미 키우기 v1.0.3

당근 먹기와 채찍 훈련의 **개미 캐릭터 행동 애니메이션**을 추가한 연출 패치입니다.

- 당근: 손에 든 당근을 입으로 가져가는 동작, 씹는 입 모양과 밝은 눈, 작은 부스러기
- 채찍: 채찍 곡선의 휘두름, 맞는 순간의 짧은 움찔 동작, 눈을 찡그리는 아픈 표정
- 행동이 끝나면 기존 의욕·스트레스·나태함 기반 기본 표정으로 복귀
- 선택 이벤트·자동 육성에서도 행동 연출을 표시하며, 감소된 모션 선호 설정을 존중
- v1.0.2의 개미굴 배경·장식 배치, LV.10 원정권 규칙, 진화 의상 9종 유지
- `localStorage` 저장 키와 `schemaVersion: 1` 유지, 통계 수집 비활성화

## 개발 및 검증

GitHub Actions는 `tests/regression.py`, `tests/motion.py`, `tests/pwa.py`를 실행하고, 통과한 경우에만 Pages 배포 단계로 진행합니다. 브라우저 엔진이 검증하는 것은 실제 Android 하드웨어 전체를 대신하지 않습니다.

## Chrome 설치형 웹앱(PWA)

- `manifest.json`에서 `start_url`, `scope`, `display: standalone`, 앱 이름과 192/512px 아이콘을 정의합니다.
- Chrome의 `beforeinstallprompt` 이벤트가 발생하면 설정 → **앱으로 설치하기** 버튼이 활성화됩니다. 메뉴에서 **앱 설치**를 선택할 수도 있습니다.
- `sw.js`는 같은 출처의 정적 게임 자산만 저장하여 오프라인 재실행을 지원합니다. 업데이트 시 네트워크를 우선해 오래된 게임 파일을 표시하지 않도록 했습니다.
- 저장 기록은 기존 `localStorage` 키에만 보관합니다. 앱 설치/삭제는 JSON 데이터를 자동으로 이동시키지 않습니다.
- `python scripts/build_icons.py`로 앱 아이콘 PNG를 생성합니다. GitHub Actions는 자동 검증과 배포 단계에서 같은 스크립트를 실행합니다.
- GitHub Pages의 **Settings → Pages → Source → GitHub Actions**를 선택해야 테스트 통과 후 배포 및 PNG 아이콘 게시가 가능합니다.
