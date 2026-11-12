"""Quick preflight checks before opening Chromium."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
required = ('index.html', 'style.css', 'balance.js', 'game.js')
for filename in required:
    path = root / filename
    assert path.is_file() and path.stat().st_size > 1000, f'Missing or empty {filename}'

html = (root / 'index.html').read_text(encoding='utf-8')
balance = (root / 'balance.js').read_text(encoding='utf-8')
script = (root / 'game.js').read_text(encoding='utf-8')
assert '<script src="balance.js" defer></script>' in html
assert '<script src="game.js" defer></script>' in html
assert '<link rel="stylesheet" href="style.css">' in html
assert re.search(r"version:\s*'\d+\.\d+\.\d+'", balance), 'Missing semantic game version'
assert "measurementId: ''" in balance, 'Analytics must remain disabled'
for selector in ('auto-toggle', 'carrot-button', 'whip-button', 'expedition-level-notice', 'record-list', 'inspect-save'):
    assert f'id="{selector}"' in html, f'Missing element #{selector}'
assert 'function resolveChoice(' in script
assert 'function finishFinalEvolution(' in script
print('PASS static preflight checks')

import json
from PIL import Image
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
assert manifest['display'] == 'standalone'
assert manifest['start_url'] == './' and manifest['scope'] == './'
assert manifest.get('prefer_related_applications') is False
assert {'192x192','512x512'} <= {entry['sizes'] for entry in manifest['icons']}
assert 'rel="manifest"' not in html
assert 'https://garu-arcade-hub.snugbrink3.chatgpt.site/#install-guide' in html
assert 'id="install-app"' in html
assert 'pwa.js' in html and (root/'pwa.js').exists() and (root/'sw.js').exists()
for filename,wh in [('ant-192.png',192),('ant-512.png',512),('ant-maskable-512.png',512)]:
    with Image.open(root/'icons'/filename) as img:
        assert img.size == (wh,wh), f'Invalid icon {filename}'
print('PASS PWA manifest, install UI, icon and service-worker preflight')
