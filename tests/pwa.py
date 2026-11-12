"""Local browser install/offline verification over an HTTP localhost origin."""
from __future__ import annotations
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import os

ROOT=Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args): pass

server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
thread=Thread(target=server.serve_forever,daemon=True)
thread.start()
checks=[]

def chk(name,ok):
    assert ok, name
    checks.append(name)

def main():
    origin=f'http://127.0.0.1:{server.server_port}'
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),args=['--no-sandbox'])
        context=browser.new_context(viewport={'width':390,'height':844},service_workers='allow')
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda exc: errors.append(str(exc)))
        try:
            page.goto(origin+'/',wait_until='load')
        except Exception as exc:
            # Some hosted sandboxes block all localhost browser navigation. The
            # GitHub Actions runner must execute the full HTTP/ServiceWorker test.
            if os.environ.get('ANT_GAME_ALLOW_LOCAL_FALLBACK') != '1' or 'ERR_BLOCKED_BY_ADMINISTRATOR' not in str(exc):
                raise
            page.set_content((ROOT/'index.html').read_text(encoding='utf-8'))
            page.add_script_tag(content=(ROOT/'pwa.js').read_text(encoding='utf-8'))
            manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
            chk('manifest standalone',manifest['display']=='standalone')
            chk('relative project start and scope',manifest['scope']=='./' and manifest['start_url']=='./')
            chk('install section available',page.locator('#pwa-install-section').count()==1)
            chk('game returns to arcade home',page.locator('#install-app').get_attribute('href')=='https://garu-arcade-hub.snugbrink3.chatgpt.site/' and '대문 홈으로' in page.locator('#install-app').inner_text())
            context.close();browser.close()
            print(f'PASS {len(checks)} local UI checks; full SW/offline check requires unrestricted localhost in GitHub Actions')
            return
        page.wait_for_function("navigator.serviceWorker?.controller || !!navigator.serviceWorker?.ready")
        manifest=json.loads(page.request.get(origin+'/manifest.json').text())
        chk('manifest standalone',manifest['display']=='standalone')
        chk('relative project start and scope',manifest['scope']=='./' and manifest['start_url']=='./')
        for icon in manifest['icons']:
            resp=page.request.get(origin+'/'+icon['src'].lstrip('./'))
            chk('icon present '+icon['sizes']+' '+icon['purpose'], resp.status==200 and resp.headers.get('content-type','').startswith('image/png'))
        chk('install section available',page.locator('#pwa-install-section').count()==1)
        chk('game returns to arcade home',page.locator('#install-app').get_attribute('href')=='https://garu-arcade-hub.snugbrink3.chatgpt.site/' and '대문 홈으로' in page.locator('#install-app').inner_text())
        chk('game page does not advertise a separate install',page.locator('link[rel=manifest]').count()==0)
        # The service worker must be registered and control a subsequent navigation.
        page.wait_for_function("navigator.serviceWorker.ready.then(reg => !!reg.active)")
        page.reload(wait_until='load')
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        chk('service worker controls page',True)
        # Offline re-open is possible because the app shell is cached; game records remain in localStorage.
        page.evaluate("localStorage.setItem('ant-game-pwa-test','saved')")
        context.set_offline(True)
        page.reload(wait_until='domcontentloaded')
        chk('offline game screen available',page.locator('#ant-figure').count()==1)
        chk('saved browser data survives offline reopen',page.evaluate("localStorage.getItem('ant-game-pwa-test')")=='saved')
        chk('no JS errors',not errors)
        context.close();browser.close()
    print(f'PASS {len(checks)} PWA browser checks')
    for check in checks: print('OK '+check)

try:main()
finally:
    server.shutdown()
    server.server_close()
