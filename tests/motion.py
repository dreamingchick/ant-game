"""Non-graphic SVG character interaction and mood regression checks."""
from pathlib import Path
import json
import os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
CSS=(ROOT/'style.css').read_text(encoding='utf-8')
BALANCE=(ROOT/'balance.js').read_text(encoding='utf-8')
GAME=(ROOT/'game.js').read_text(encoding='utf-8')
KEY='little-ant-game-mvp-v1'
results=[]
def chk(name,okay):
    assert okay,name
    results.append(name)

def page_make(browser,seed=None):
    p=browser.new_page(viewport={'width':390,'height':844})
    p.set_content(HTML)
    p.add_style_tag(content=CSS)
    p.evaluate('''({key,seed})=>{
      const data=Object.create(null);
      data['little-ant-game-last-patch-seen']='1.0.3';
      if(seed) data[key]=JSON.stringify(seed);
      window.__gameStore=data;
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>Object.hasOwn(data,k)?data[k]:null,
        setItem:(k,v)=>{data[k]=String(v)},
        removeItem:k=>{delete data[k]}
      }});
      Math.random=()=>0.99;
    }''',{'key':KEY,'seed':seed})
    p.add_script_tag(content=BALANCE)
    p.add_script_tag(content=GAME)
    return p

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),args=['--no-sandbox'])
    page=page_make(browser)
    starter=json.loads(page.evaluate('window.__gameStore["little-ant-game-mvp-v1"]'))
    page.close()
    starter['tutorialCompleted']=True
    starter['tutorialStep']=3
    starter['level']=2
    starter['stats']={'motivation':60,'stress':20,'laziness':10}
    page=page_make(browser,starter)
    chk('default state uses neutral face',page.locator('#ant-figure').get_attribute('data-mood')=='normal')
    chk('feeding actor SVG available',page.locator('.motion-eat-prop').count()==1)
    chk('training reaction SVG available',page.locator('.motion-whip-prop').count()==1)
    page.locator('#carrot-button').click()
    chk('reward reaction gives happy eating mood',page.locator('#ant-figure').get_attribute('data-mood')=='eating')
    chk('feeding prop visible',page.locator('.motion-eat-prop').evaluate('(el)=>getComputedStyle(el).display')!='none')
    page.wait_for_timeout(900)
    chk('face returns to status after feeding',page.locator('#ant-figure').get_attribute('data-mood')!='eating')
    page.locator('#whip-button').click()
    chk('training reaction gives discomfort mood',page.locator('#ant-figure').get_attribute('data-mood')=='ouch')
    chk('training effect visible',page.locator('.motion-whip-prop').evaluate('(el)=>getComputedStyle(el).display')!='none')
    page.wait_for_timeout(900)
    chk('face returns to status after training',page.locator('#ant-figure').get_attribute('data-mood')!='ouch')
    page.close()
    browser.close()
print(f'PASS {len(results)} animation and mood browser checks')
for result in results: print('OK '+result)
