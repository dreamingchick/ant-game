/* Installable PWA: no data collection and no change to game storage. */
(() => {
  'use strict';
  const installButton = document.getElementById('install-app');
  const status = document.getElementById('install-status');
  if (!installButton || !status) return;
  let pendingInstall = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function showStatus(message) { status.textContent = message; }
  function update() {
    if (standalone()) {
      installButton.hidden = true;
      showStatus('설치된 앱으로 실행 중입니다. 개미 키우기를 즐겨 주세요.');
    } else if (pendingInstall) {
      installButton.hidden = false;
      installButton.disabled = false;
      showStatus('앱 설치가 가능합니다. 아래 버튼을 눌러 설치하세요.');
    } else {
      installButton.hidden = true;
      showStatus('Chrome 오른쪽 상단 ⋮ 메뉴에서 「앱 설치」를 선택하세요. 아직 메뉴가 보이지 않으면 페이지를 새로고침한 뒤 다시 확인해 주세요.');
    }
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingInstall = event;
    update();
  });
  installButton.addEventListener('click', async () => {
    if (!pendingInstall) return;
    const request = pendingInstall;
    pendingInstall = null;
    installButton.disabled = true;
    try {
      await request.prompt();
      const choice = await request.userChoice;
      if (choice?.outcome === 'accepted') {
        showStatus('앱 설치 요청을 수락했습니다. Chrome에서 설치가 끝나면 홈 화면에서 실행할 수 있습니다.');
      } else {
        update();
      }
    } catch (_error) {
      showStatus('앱 설치 요청을 열 수 없습니다. Chrome ⋮ 메뉴의 「앱 설치」를 사용해 주세요.');
    }
  });
  window.addEventListener('appinstalled', () => {
    pendingInstall = null;
    installButton.hidden = true;
    showStatus('설치 완료! 홈 화면에서 개미 키우기를 실행할 수 있습니다.');
  });
  try {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    displayMode.addEventListener?.('change', update);
  } catch (_error) { /* Browser does not support change events. */ }
  update();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        // Online game remains playable if offline support cannot be enabled.
      });
    });
  }
})();
