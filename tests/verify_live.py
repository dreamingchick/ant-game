"""Check that GitHub Pages actually serves the four exact tested game files.

Runs *after* actions/deploy-pages; never makes claims about successful publishing
based only on a successful GitHub content upload.
"""
from __future__ import annotations
import hashlib
import os
import sys
import time
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = os.environ.get('PAGES_URL', 'https://dreamingchick.github.io/ant-game/').rstrip('/') + '/'
COMMIT = os.environ.get('GITHUB_SHA', 'manual')
FILES = ('index.html', 'style.css', 'balance.js', 'game.js')


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def check_live_once() -> list[str]:
    errors: list[str] = []
    for name in FILES:
        url = urljoin(BASE_URL, name) + f'?verify={COMMIT}'
        try:
            request = Request(url, headers={'User-Agent': 'ant-game-ci/1.0', 'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=15) as response:
                if response.status != 200:
                    errors.append(f'{name}: HTTP {response.status}')
                    continue
                remote_bytes = response.read()
            expected = (ROOT / name).read_bytes()
            if sha256(remote_bytes) != sha256(expected):
                errors.append(f'{name}: deployed bytes do not match tested source')
        except Exception as exc:
            errors.append(f'{name}: {type(exc).__name__}: {exc}')
    return errors


def main() -> int:
    print(f'Verifying deployed Pages assets: {BASE_URL}', flush=True)
    # GitHub Pages may take time to update its edge caches after a successful deployment.
    for attempt in range(1, 13):
        failures = check_live_once()
        if not failures:
            print(f'PASS: {len(FILES)} live files exactly match GitHub Actions-tested source', flush=True)
            return 0
        print(f'Attempt {attempt}/12: {" | ".join(failures)}', flush=True)
        if attempt < 12:
            time.sleep(10)
    print('FAIL: site publication could not be verified. Do not mark the release as deployed.', file=sys.stderr)
    return 1

if __name__ == '__main__':
    raise SystemExit(main())
