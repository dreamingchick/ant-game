"""Confirm adopted production values on held-out seeds, prior growth and natural growth.
No configuration overrides or fast search mode are used for release evidence.
"""
from v11_harness import ROOT,BALANCE,sync_playwright,page_make,os,json,re
from balance_analysis import summarize
import hashlib,statistics,collections

CASES={
  'held_out':{'seedOffset':10000},
  'state_aware':{'choicePolicy':'state'},
  'stressed':{'stats':{'motivation':40,'stress':60,'laziness':60}},
  'first_growth':{'startLevel':10,'endLevel':20,'types':['garden_keeper','star_scholar','workshop_artisan']},
  'first_growth_held_out':{'startLevel':10,'endLevel':20,'types':['garden_keeper','star_scholar','workshop_artisan'],'seedOffset':10000}
}
NATURAL={.4:('easy','garden_keeper','life_gardener'),.5:('genius','star_scholar','galaxy_archivist'),.6:('diligent','steel_guardian','royal_captain')}

def main():
    report={'version':re.search(r"version:\s*'([^']+)'",BALANCE).group(1),
      'sourceDigest':hashlib.sha256((ROOT/'game.js').read_bytes()+b'\0'+(ROOT/'balance.js').read_bytes()).hexdigest(),
      'runsPerCondition':100,'totalRuns':7500,'cases':{},'wholeGrowth':[],
      'method':'Actual adopted production configuration, no overrides or cosmetic bypass. 100 paired seeds per condition, 20->30 held-out/state-aware/stressed; 10->20 three parents on original/held-out seeds; 1->30 natural evolution. Separate event/action RNG, exact ratio per shuffled ten-action block.'}
    out=ROOT/'test-results/balance-validation.json';out.parent.mkdir(exist_ok=True)
    with sync_playwright() as pw:
      browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),args=['--no-sandbox'])
      p,errors=page_make(browser)
      for name,options in CASES.items():
        groups=p.evaluate('o=>__v11.simulate(100,o)',options)
        report['cases'][name]={'options':options,**summarize(groups)}
        assert not errors,errors
        out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(name,report['cases'][name]['strategies'],flush=True)
      groups=p.evaluate('__v11.simulate(100,{startLevel:1,endLevel:30,types:["garden_keeper"]})')
      for group in groups:
        samples=group['samples'];ratio=group['ratio'];first,second,third=NATURAL[ratio]
        assert all(s['finished'] and s['firstType']==first and s['secondType']==second and s['finalType']==third for s in samples),'Natural evolution path failed'
        report['wholeGrowth'].append({'ratio':ratio,'runs':100,'completed':sum(s['finished'] for s in samples),
          'firstTypes':dict(collections.Counter(s['firstType'] for s in samples)),
          'secondTypes':dict(collections.Counter(s['secondType'] for s in samples)),
          'thirdTypes':dict(collections.Counter(s['finalType'] for s in samples)),
          'medianActions':statistics.median(s['actions'] for s in samples)})
      assert not errors,errors
      out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
      browser.close()
    print('PASS 7500 release-validation runs; all natural growth paths completed')

if __name__=='__main__':main()
