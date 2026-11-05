from pathlib import Path
import os, json, time, sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
css=(root/'style.css').read_text()
balance=(root/'balance.js').read_text()
game=(root/'game.js').read_text()
KEY='little-ant-game-mvp-v1'
import re
GAME_VERSION=re.search(r"version:\s*'([^']+)'", balance).group(1)
passes=[]
def chk(name,condition):
    if not condition:
        try:
            page=globals().get('p') or globals().get('base')
            if page is not None and not page.is_closed():
                page.screenshot(path=str(root/'test-results'/'failed-check.png'),full_page=True)
        except Exception:
            pass
        raise AssertionError(name)
    passes.append(name)

def page_make(browser,seed=None,rand=None,mode='normal',viewport=None):
    p=browser.new_page(viewport=viewport or {"width":390,"height":844})
    p.on('pageerror',lambda error: print('JS ERROR',error))
    p.set_content(html)
    p.add_style_tag(content=css)
    p.evaluate('''({key,seed,version})=>{
      const store=Object.create(null);
      store['little-ant-game-last-patch-seen']=version;
      if(seed)store[key]=JSON.stringify(seed);
      window.__store=store;
      window.__failWrites=false;
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:k=>Object.hasOwn(store,k)?store[k]:null,
        setItem:(k,v)=>{if(window.__failWrites)throw new Error('storage write blocked');store[k]=String(v);},
        removeItem:k=>{delete store[k];}
      }});
    }''',{"key":KEY,"seed":seed,"version":GAME_VERSION})
    p.add_script_tag(content=balance)
    if rand is not None:
      p.evaluate('''v=>{Math.random=()=>v;window.ANT_BALANCE.events.carrotJoy.action='whip';}''',rand)
    p.add_script_tag(content=game)
    return p

def save(p): return p.evaluate('JSON.parse(window.__store["little-ant-game-mvp-v1"])')

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),args=['--no-sandbox'])
 base=page_make(browser)
 initial=save(base)
 chk('new game schema1',initial['schemaVersion']==1)
 chk('update version',base.evaluate('window.ANT_BALANCE.version')==GAME_VERSION)
 chk('analytics unchanged',base.evaluate('window.ANT_BALANCE.analytics.measurementId')=='')
 chk('old patch preserved',base.evaluate("window.ANT_BALANCE.releaseNotesHistory.some(r=>r.version==='1.0.0')"))
 chk('fresh ant outfit none visible',base.locator('.ant-figure .ant-job-outfit:visible').count()==0)
 base.close()

 types={
 'easy':['garden_keeper','meadow_explorer'],
 'genius':['star_scholar','clockwork_inventor'],
 'diligent':['workshop_artisan','steel_guardian']}
 css_first={'easy':'ant-job-easy','genius':'ant-job-genius','diligent':'ant-job-diligent'}
 css_second={'garden_keeper':'ant-job-garden','meadow_explorer':'ant-job-explorer',
 'star_scholar':'ant-job-scholar','clockwork_inventor':'ant-job-inventor',
 'workshop_artisan':'ant-job-artisan','steel_guardian':'ant-job-guardian'}

 for typ in types:
   seed=json.loads(json.dumps(initial));seed.update(level=12,phase='phase2',evolution=typ,finished=False,secondEvolution=None,
     firstEvolution={'type':typ,'acknowledged':True,'reachedAt':1760000000000,'carrotCountAtFirst':10,'whipCountAtFirst':10,'statsAtFirst':dict(seed['stats'])},tutorialCompleted=True)
   p=page_make(browser,seed)
   chk('first class '+typ,p.locator('.ant-figure').get_attribute('data-evolution')==typ)
   chk('first outfit '+typ,p.locator('.ant-figure .'+css_first[typ]+':visible').count()==1)
   chk('single first outfit '+typ,p.locator('.ant-figure .ant-job-outfit:visible').count()==1)
   if typ=='easy':p.screenshot(path=str(root/'test-results'/'first-evolution.png'),full_page=True)
   p.close()

 for typ,seconds in types.items():
   for second in seconds:
     seed=json.loads(json.dumps(initial));seed.update(level=20,phase='completed',evolution=typ,secondEvolution=second,finished=True,tutorialCompleted=True)
     p=page_make(browser,seed)
     chk('second type '+second,p.locator('.ant-figure').get_attribute('data-second-evolution')==second)
     chk('second outfit '+second,p.locator('.ant-figure .'+css_second[second]+':visible').count()==1)
     chk('single second outfit '+second,p.locator('.ant-figure .ant-job-outfit:visible').count()==1)
     if second=='steel_guardian':p.screenshot(path=str(root/'test-results'/'second-evolution.png'),full_page=True)
     p.close()

 # Historical record exact costume in modal
 seed=json.loads(json.dumps(initial));seed.update(level=1,tutorialCompleted=True)
 seed['records']=[{'id':'demo-record-1','type':'genius','secondEvolution':'clockwork_inventor','level':20,
  'timestamp':1760000000000,'stats':dict(initial['stats']),'carrotCount':100,'whipCount':120,
  'totalExp':2000,'eventCount':5,'balanceVersion':'1.0.0','eventsByType':{},'stage2Counters':{'carrot':20,'whip':25},'firstEvolution':None}]
 p=page_make(browser,seed)
 p.locator('[data-screen="records"]').click()
 p.locator('[data-record-id="demo-record-1"]').click()
 chk('record modal shows unique outfit',p.locator('#modal-portrait .ant-job-inventor:visible').count()==1)
 p.close()

 # Automatic choice -> continue, until chosen batch ends
 seed=json.loads(json.dumps(initial));seed.update(level=2,exp=0,tutorialCompleted=True)
 seed['stats'].update(motivation=30,stress=50,laziness=5)
 seed['settings']['autoCare'].update(mode='recover',speed='fast',batch=10,safeStop=False)
 p=page_make(browser,seed,rand=0)
 p.locator('#auto-toggle').click()
 p.locator('.choice-option').first.wait_for(timeout=6500)
 chk('choice modal pauses auto',p.locator('#auto-toggle').inner_text()!='자동 육성 중지')
 chk('choice event persisted',save(p)['pendingChoice'] is not None)
 chk('pending auto run progress',p.locator('#auto-status').inner_text().find('1/10')>=0)
 p.evaluate('Math.random=()=>0.99')
 p.locator('.choice-option').first.click()
 p.wait_for_timeout(220)
 chk('choice resolution clears pending',save(p)['pendingChoice'] is None)
 chk('auto resumed without click',p.locator('#auto-toggle').inner_text()=='자동 육성 중지')
 p.wait_for_function('''()=>document.querySelector('#auto-status').textContent.includes('10회 완료')''',timeout=16000)
 chk('batch stops after exact 10 actions',save(p)['carrotCount']+save(p)['whipCount']==10)
 chk('no double counted event action',len(save(p)['recentActions'])==10)
 chk('auto completes and stops',p.locator('#auto-toggle').inner_text()=='자동 육성 시작')
 p.close()

 # When dangerous, never automatically resume
 seed=json.loads(json.dumps(initial));seed.update(level=2,tutorialCompleted=True)
 seed['stats'].update(motivation=20,stress=85,laziness=90)
 seed['settings']['autoCare'].update(mode='recover',speed='fast',batch=10,safeStop=True)
 p=page_make(browser,seed,rand=0)
 p.locator('#auto-toggle').click()
 p.locator('.choice-option').first.wait_for(timeout=6500)
 p.evaluate('Math.random=()=>0.99')
 p.locator('.choice-option').first.click()
 p.wait_for_timeout(850)
 chk('danger auto not resumed',p.locator('#auto-toggle').inner_text()!='자동 육성 중지')
 chk('danger message',('위험' in p.locator('#auto-status').inner_text()))
 p.close()

 # First evolution auto confirmation should continue
 seed=json.loads(json.dumps(initial));seed.update(level=9,exp=128,tutorialCompleted=True)
 seed['stats'].update(motivation=31,stress=48,laziness=5)
 seed['settings']['autoCare'].update(mode='recover',speed='fast',batch=10,safeStop=False)
 p=page_make(browser,seed,rand=.99)
 p.locator('#auto-toggle').click()
 p.locator('#first-continue').wait_for(timeout=6500)
 chk('first evolution reached',save(p)['phase']=='phase2')
 p.locator('#first-continue').click()
 p.wait_for_timeout(200)
 chk('auto resumes after first evolution confirmation',p.locator('#auto-toggle').inner_text()=='자동 육성 중지')
 p.close()

 # Manual choice never starts auto spontaneously
 seed=json.loads(json.dumps(initial));seed.update(level=2,tutorialCompleted=True)
 seed['stats'].update(motivation=20,stress=65,laziness=10)
 p=page_make(browser,seed,rand=0)
 p.locator('#carrot-button').click()
 p.locator('.choice-option').first.wait_for(timeout=2000)
 p.evaluate('Math.random=()=>0.99')
 p.locator('.choice-option').first.click()
 p.wait_for_timeout(200)
 chk('manual choice does not start automation',p.locator('#auto-toggle').inner_text()=='자동 육성 시작')
 p.close()

 # Save failure during choice resolution shouldn't resume
 seed=json.loads(json.dumps(initial));seed.update(level=2,tutorialCompleted=True)
 seed['stats'].update(motivation=20,stress=65,laziness=10)
 seed['settings']['autoCare'].update(mode='recover',speed='fast',batch=10,safeStop=False)
 p=page_make(browser,seed,rand=0)
 p.locator('#auto-toggle').click()
 p.locator('.choice-option').first.wait_for(timeout=6500)
 p.evaluate('window.__failWrites=true;Math.random=()=>0.99;')
 p.locator('.choice-option').first.click()
 p.wait_for_timeout(200)
 chk('write failure halts auto',p.locator('#auto-toggle').inner_text()!='자동 육성 중지')
 chk('write failure preserves pending choice',save(p)['pendingChoice'] is not None)
 p.close()

 # Backgrounding the tab during a choice cancels pending automatic resume.
 seed=json.loads(json.dumps(initial));seed.update(level=2,tutorialCompleted=True)
 seed['stats'].update(motivation=20,stress=65,laziness=10)
 seed['settings']['autoCare'].update(mode='recover',speed='fast',batch=10,safeStop=False)
 p=page_make(browser,seed,rand=0)
 p.locator('#auto-toggle').click()
 p.locator('.choice-option').first.wait_for(timeout=6500)
 p.evaluate("Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));Math.random=()=>0.99")
 p.locator('.choice-option').first.click()
 p.wait_for_timeout(240)
 chk('hidden tab cancels auto resume',p.locator('#auto-toggle').inner_text()!='자동 육성 중지')
 p.close()

 # A persisted choice restored on a fresh page must not auto-resume a previous session.
 seed=json.loads(json.dumps(initial));seed.update(level=2,tutorialCompleted=True)
 seed['stats'].update(motivation=20,stress=65,laziness=10)
 seed['settings']['autoCare'].update(mode='recover',speed='fast',batch=10,safeStop=False)
 p=page_make(browser,seed,rand=0)
 p.locator('#auto-toggle').click()
 p.locator('.choice-option').first.wait_for(timeout=6500)
 pending_saved=save(p)
 p.close()
 p=page_make(browser,pending_saved,rand=.99)
 p.locator('.choice-option').first.wait_for(timeout=1500)
 p.locator('.choice-option').first.click()
 p.wait_for_timeout(230)
 chk('reload does not restore running auto loop',p.locator('#auto-toggle').inner_text()=='자동 육성 시작')
 chk('reload choice still resolves safely',save(p)['pendingChoice'] is None)
 p.close()

 # Existing inventory, achievements and decor persist across the compatibility patch.
 seed=json.loads(json.dumps(initial));seed.update(level=12,phase='phase2',evolution='diligent',tutorialCompleted=True)
 seed['firstEvolution']={'type':'diligent','acknowledged':True,'reachedAt':1760000000000,'carrotCountAtFirst':20,'whipCountAtFirst':35,'statsAtFirst':dict(seed['stats'])}
 seed['expedition']['inventory'].update(food=87,wood=32,crystal=11)
 seed['decor']['unlocked']=['carrot-basket']
 p=page_make(browser,seed)
 stored=save(p)
 chk('inventory unchanged after migration',stored['expedition']['inventory']==seed['expedition']['inventory'])
 chk('decoration remains unlocked', 'carrot-basket' in stored['decor']['unlocked'])
 chk('evolution preserved',stored['evolution']=='diligent' and stored['phase']=='phase2')
 p.close()

 # narrow and standard mobile widths, no overflow
 for width in (320,360,390,430):
   p=page_make(browser,viewport={'width':width,'height':800})
   chk(f'no horizontal overflow {width}',p.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
   p.close()

 # v0.9 regression: no expedition tickets below LV.10, including carrots that earn EXP.
 seed=json.loads(json.dumps(initial));seed.update(level=9,exp=0,tutorialCompleted=True)
 seed['expedition']['tickets']=0;seed['expedition']['ticks']=0
 p=page_make(browser,seed,rand=.99)
 for _ in range(3):p.locator('#carrot-button').click()
 record=save(p)
 chk('LV9 actions never earn expedition ticket progress',record['expedition']['ticks']==0 and record['expedition']['tickets']==0)
 chk('LV9 expedition lock notice', 'LV.10' in p.locator('#expedition-level-notice').inner_text())
 p.close()
 seed=json.loads(json.dumps(initial));seed.update(level=9,exp=128,tutorialCompleted=True)
 seed['expedition']['ticks']=0;seed['expedition']['tickets']=0
 p=page_make(browser,seed,rand=.99)
 p.locator('#carrot-button').click()
 record=save(p)
 chk('action reaching LV10 starts ticket counter once',record['level']==10 and record['expedition']['ticks']==1)
 p.close()

 # Existing stocks / recipes and expedition resources survive save restoration.
 seed=json.loads(json.dumps(initial));seed.update(level=12,phase='phase2',evolution='easy',tutorialCompleted=True)
 seed['firstEvolution']={'type':'easy','acknowledged':True,'reachedAt':1760000000000,'carrotCountAtFirst':5,'whipCountAtFirst':0,'statsAtFirst':dict(seed['stats'])}
 seed['expedition']['tickets']=2;seed['expedition']['ticks']=4
 seed['expedition']['inventory']={'food':15,'wood':14,'crystal':7}
 p=page_make(browser,seed,rand=.99)
 p.locator('[data-screen="expedition"]').click()
 p.locator('[data-expedition="meadow"]').click()
 post=save(p)
 chk('expedition spends exactly one ticket',post['expedition']['tickets']==1)
 chk('expedition rewards resource',post['expedition']['inventory']['food']>15)
 chk('expedition ticket ticks preserved',post['expedition']['ticks']==4)
 p.close()

 # Save write error cannot consume food or leave an uncommitted action.
 seed=json.loads(json.dumps(initial));seed.update(level=2,tutorialCompleted=True)
 p=page_make(browser,seed,rand=.99)
 before=save(p)
 p.evaluate('window.__failWrites=true')
 p.locator('#carrot-button').click()
 after=save(p)
 chk('save failure does not mutate persisted counts',before['carrotCount']==after['carrotCount'])
 chk('save failure does not mutate persisted exp',before['exp']==after['exp'])
 p.close()


 browser.close()
print('PASS',len(passes), 'checks')
for x in passes:print('OK',x)
