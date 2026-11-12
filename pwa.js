(() => {
  'use strict';
  function cameFromArcade() {
    let entered = new URLSearchParams(location.search).get('from') === 'garu-arcade';
    try { entered = entered || (document.referrer && new URL(document.referrer).origin === 'https://garu-arcade-hub.snugbrink3.chatgpt.site'); } catch {}
    try {
      if (entered) sessionStorage.setItem('garu-arcade-entry', '1');
      return Boolean(entered || sessionStorage.getItem('garu-arcade-entry') === '1');
    } catch { return Boolean(entered); }
  }
  if (true) {
    const link = document.getElementById('install-app');
    if (link) {
      link.href = 'https://garu-arcade-hub.snugbrink3.chatgpt.site/';
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.textContent = '← 대문 홈으로';
      link.setAttribute('aria-label', '가루 오락실 대문 홈으로 돌아가기');
      const section = document.getElementById('pwa-install-section');
      const title = section?.querySelector('h3');
      const description = section?.querySelector('p');
      if (title) title.textContent = '가루 오락실 대문';
      if (description) description.textContent = '다른 게임을 선택하려면 대문 홈으로 돌아가세요.';
    }
    const settings = document.getElementById('header-settings');
    if (settings?.parentNode) {
      const actions = document.createElement('div');
      actions.className = 'arcade-header-actions';
      settings.parentNode.insertBefore(actions, settings);
      const home = document.createElement('a');
      home.className = 'round-button arcade-home-button';
      home.href = 'https://garu-arcade-hub.snugbrink3.chatgpt.site/';
      home.textContent = '⌂';
      home.title = '대문 홈으로';
      home.setAttribute('aria-label', '가루 오락실 대문 홈으로 돌아가기');
      actions.append(home, settings);
    }
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        // Online game remains playable if offline support cannot be enabled.
      });
    });
  }
})();
