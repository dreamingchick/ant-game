"""Separate inherited trait effects, second-stage effects, event policy and held-out seeds.
Numeric overrides apply only inside the in-memory test harness and are restored afterward.
"""
from v11_harness import ROOT, BALANCE, sync_playwright, page_make, os, json, statistics, re
import argparse

def summarize(groups):
    rows=[]
    for group in groups:
        samples=group['samples']; typ=group['type']
        assert all(s['finished'] for s in samples),f'Incomplete growth: {typ}'
        rows.append({'type':typ,'ratio':group['ratio'],'runs':len(samples),
          'medianActions':statistics.median(s['actions'] for s in samples),
          'meanActions':round(statistics.mean(s['actions'] for s in samples),2),
          'meanStats':{k:round(statistics.mean(s['stats'][k] for s in samples),2) for k in ['motivation','stress','laziness']},
          'meanEvents':round(statistics.mean(s['events'] for s in samples),2),
          'meanPassiveOpportunities':round(statistics.mean(s['procs'] for s in samples),2),
          'meanDirectStatBenefitActions':round(statistics.mean(s['directBenefitActions'] for s in samples),2) if typ not in ['star_scholar','workshop_artisan'] else None})
    gaps=[]
    for ratio in [.4,.5,.6]:
        vals=[r['medianActions'] for r in rows if r['ratio']==ratio]
        gap=round((max(vals)/min(vals)-1)*100,2)
        gaps.append({'whipRatio':ratio,'medianSpreadPercent':gap,'within10Percent':gap<=10})
    return {'strategies':gaps,'results':rows}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--runs',type=int,default=100);args=parser.parse_args()
    assert 1<=args.runs<=1000
    variants=[
      ('no_passives',{'first':False,'second':False}),
      ('first_only',{'second':False}),
      ('approved_current',{}),
      ('state_aware_choices',{'choicePolicy':'state'}),
      ('candidate_second_only',{'secondValues':{'star_scholar':.3,'meadow_explorer':-1,'clockwork_inventor':-1}}),
      ('held_out_seeds',{'seedOffset':10000}),
      ('stressed_start',{'stats':{'motivation':40,'stress':60,'laziness':60}})
    ]
    report={'version':re.search(r"version:\s*'([^']+)'",BALANCE).group(1),'runsPerCondition':args.runs,
      'totalRuns':args.runs*18*len(variants),'changesAppliedToGame':False,
      'method':'Actual production engine. 20->30, paired independent event/action RNG, fixed ratio per shuffled ten-action block. Default stats 60/20/10, first event option. Counterfactuals restore every config. State-aware choices maximize efficiency minus 40 for danger or 15 for warning; ties use first option. Held-out seeds add 10000. Direct-stat benefit counts detect a nonzero immediate clamped delta in the action phase for four stat passives; they exclude later event effects, EXP and event-amplifier passives (null).','variants':{}}
    out=ROOT/'test-results/balance-analysis.json';out.parent.mkdir(exist_ok=True)
    with sync_playwright() as pw:
      browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),args=['--no-sandbox'])
      p,errors=page_make(browser)
      original=p.evaluate('JSON.stringify({passive:ANT_BALANCE.passive,second:ANT_BALANCE.secondPassives,efficiency:ANT_BALANCE.efficiency})')
      for name,options in variants:
        groups=p.evaluate('([runs,opts])=>__v11.simulate(runs,opts)',[args.runs,options])
        report['variants'][name]={'options':options,**summarize(groups)}
        assert p.evaluate('JSON.stringify({passive:ANT_BALANCE.passive,second:ANT_BALANCE.secondPassives,efficiency:ANT_BALANCE.efficiency})')==original,'Diagnostic changed game configuration'
        assert not errors,errors
        out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(name,json.dumps(report['variants'][name]['strategies']),flush=True)
      browser.close()
    print(f'PASS {report["totalRuns"]} diagnostic runs; production configuration preserved')

if __name__=='__main__':main()
