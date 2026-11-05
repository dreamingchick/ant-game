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
