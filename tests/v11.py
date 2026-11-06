"""v1.1 production-engine behavior and compatibility verification."""
import hashlib
from v11_harness import ROOT, VERSION, check, checks, sync_playwright, page_make, stage3, state, seed, os, json, statistics

(ROOT/'test-results').mkdir(exist_ok=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_EXECUTABLE'),args=['--no-sandbox','--disable-dev-shm-usage'])
    p,errors=page_make(browser);initial=state(p)
    check('v1.1 cap and unchanged EXP formula',p.evaluate('ANT_BALANCE.maxLevel===30 && ANT_BALANCE.expRequired(29)===330'))
    specs=p.evaluate('ANT_BALANCE.thirdEvolution.types')
    check('12 third / six second definitions',len(specs)==12 and p.evaluate('Object.keys(ANT_BALANCE.secondPassives).length')==6)
    for parent in set(x['parent'] for x in specs.values()):
        for ratio,branch in [(0,'A'),(.549999,'A'),(.55,'B'),(1,'B')]:
            found=p.evaluate('([p,r])=>__v11.thirdTypeFor(p,r)',[parent,ratio]);check(f'{parent} {ratio} boundary',specs[found]['branch']==branch)
    cases=[('garden_keeper','carrot',{'motivation':77,'stress':5,'laziness':15}),
           ('meadow_explorer','carrot',{'motivation':75,'stress':5,'laziness':13}),
           ('clockwork_inventor','whip',{'motivation':55,'stress':35,'laziness':3}),
           ('steel_guardian','whip',{'motivation':55,'stress':33,'laziness':5})]
    for typ,action,expected in cases:
        s=stage3(initial,typ);seed(p,s);p.evaluate('a=>__v11.action(a)',action)
        check('exact stacked delta '+typ,state(p)['stats']==expected)
    s=stage3(initial,'workshop_artisan');s['stats']={'motivation':50,'stress':0,'laziness':0};seed(p,s)
    p.evaluate('__v11.action("whip")');check('base EXP -> efficiency -> diligent rounding =17',state(p)['totalExp']==17)
    s=stage3(initial,'star_scholar');seed(p,s)
    check('scholar beneficial +5 -> +7',p.evaluate('__v11.eventStatDelta({kind:"positive"},"motivation",5)')==7)
    check('scholar positive event adverse stress not amplified',p.evaluate('__v11.eventStatDelta({kind:"positive"},"stress",5)')==5)
    check('negative event recovery not amplified',p.evaluate('__v11.eventStatDelta({kind:"negative"},"stress",-5)')==-5)
    invalid=stage3(initial,'garden_keeper');invalid.update(thirdEvolution='life_gardener',finished=True)
    check('reject premature third evolution import',len(p.evaluate('s=>__v11.validateImportedState(s)',invalid))>0)
    # New level20 checkpoint: no final record and no LV20 action in stage3 counter.
    s=stage3(initial,'garden_keeper');s.update(level=19,phase='phase2',secondEvolution=None,exp=229);s['stage2Counters']={'carrot':90,'whip':10};seed(p,s)
    p.evaluate('__v11.action("carrot")');out=state(p)
    check('LV20 checkpoint continues',out['level']==20 and out['phase']=='phase3' and not out['finished'] and not out['records'])
    check('LV20 action belongs to stage2',out['stage3Counters']=={'carrot':0,'whip':0} and out['stage2Counters']['carrot']==91)
    # All twelve completion paths + reload/import validation + exclusive outfits.
    record_samples=[]
    for typ,info in specs.items():
        s=stage3(initial,info['parent']);s.update(level=29,exp=329)
        s['stage3Counters']={'carrot':100,'whip':100} if info['branch']=='A' else {'carrot':90,'whip':110}
        seed(p,s);p.evaluate('__v11.action("whip")');out=state(p)
        check('completion '+typ,out['thirdEvolution']==typ and out['level']==30 and out['finished'] and len(out['records'])==1)
        record_samples+=out['records']
        check('one independent outfit '+typ,p.locator('#ant-figure .ant-third-outfit:visible').count()==1 and p.locator('#ant-figure .ant-job-outfit:visible').count()==0)
        check('valid v1.1 export '+typ,p.evaluate('s=>__v11.validateImportedState(s)',out)==[])
        p.evaluate('__v11.reload()');check('reload third result '+typ,state(p)['records'][0]['thirdEvolution']==typ and state(p)['thirdEvolution']==typ)
        if typ=='grand_architect':p.screenshot(path=str(ROOT/'test-results/v11-third-mobile.png'),full_page=True)
    # Preserve historical LV20 records, explicitly resume and upgrade same id.
    s=stage3(initial,'garden_keeper');old=dict(record_samples[0]);old.update(id='legacy20',level=20,thirdEvolution=None,balanceVersion='1.0.3');old.pop('legacyLevel20',None)
    s.update(level=20,phase='completed',finished=True,records=[old],finishedRecordId='legacy20');seed(p,s);p.evaluate('__v11.reload()')
    check('LV20 remains completed until explicit resume',state(p)['finished'] and state(p)['records'][0]['level']==20)
    p.evaluate('__v11.resumeLevel20()');out=state(p)
    check('resume retains historical record',out['phase']=='phase3' and len(out['records'])==1 and out['records'][0]['level']==20)
    check('resumed ant not double counted',p.evaluate('__v11.decorProgress().carrots')==out['carrotCount'])
    out.update(level=29,exp=329);seed(p,out);p.evaluate('__v11.action("whip")');out=state(p)
    check('resume upgrades existing id without duplicate worker',len(out['records'])==1 and out['records'][0]['id']=='legacy20' and out['records'][0]['legacyLevel20']['level']==20)
    # Actual expedition 5% accumulates, survives reload, uses only selected leader.
    s=stage3(initial,'garden_keeper');s.update(level=30,phase='completed',finished=True,thirdEvolution='life_gardener',records=record_samples)
    s['expedition'].update(tickets=5,passiveRecordId=record_samples[0]['id'])
    seed(p,s)
    for i in range(4):
        p.evaluate('__v11.explore("meadow")');p.evaluate('__v11.reload()')
    out=state(p)
    check('four food rewards 24+1 cumulative bonus',out['expedition']['inventory']['food']==25)
    check('remaining fractional credit =20 hundredths',out['expedition']['bonusRemainders']['life_gardener:food']==20)
    check('weekly resources include passive bonus',out['weekly']['resources']==25)
    check('multiple owned ants do not stack',out['expedition']['trips'][0]['passiveBonus']==1)
    for tid,region,resource,expected,remainder in [('earth_pioneer','forest','wood',16,80),('precision_mechanic','cave','crystal',8,40)]:
        extra=stage3(initial,'garden_keeper');extra.update(level=30,phase='completed',finished=True,thirdEvolution='life_gardener',records=record_samples)
        rec=next(r for r in record_samples if r['thirdEvolution']==tid);extra['expedition'].update(tickets=5,passiveRecordId=rec['id']);seed(p,extra)
        for _ in range(4):p.evaluate('region=>__v11.explore(region)',region)
        check('supported resource bonus '+tid,state(p)['expedition']['inventory'][resource]==expected and state(p)['expedition']['bonusRemainders'][tid+':'+resource]==remainder)
    seed(p,out)
    # Transaction write failure must preserve resources, ticket and remainder.
    p.evaluate('window.__failWrites=true');before=state(p);p.evaluate('__v11.explore("meadow")')
    check('failed expedition atomic rollback',state(p)==before);p.evaluate('window.__failWrites=false')
    p.evaluate('__v11.reload()');out=state(p)
    check('roundtrip of accumulated fractions',p.evaluate('s=>__v11.validateImportedState(s)',out)==[])
    for tid in ['thorn_warden','wind_guide','astral_oracle','spacetime_inventor','gold_sculptor','unyielding_warden','royal_captain']:
        rec=next(r for r in record_samples if r['thirdEvolution']==tid)
        p.evaluate('id=>{let s=__v11.state();s.expedition.passiveRecordId=id;__v11.seed(s)}',rec['id'])
        check('inactive reason '+tid,'미활성' in p.locator('#passive-leader-status').inner_text())
    # Home slot is one additional slot even with several builders; selectors must persist.
    p.locator('[data-screen="nest"]').click()
    check('builder unlocks additional decoration slot',not p.locator('#extra-decor-slot').is_hidden())
    check('all third cosmetic pennants unlocked',len([x for x in state(p)['decor']['unlocked'] if x.startswith('third-')])==12)
    p.select_option('#extra-decoration','third-grand_architect');p.evaluate('__v11.reload()')
    check('additional slot survives reload',state(p)['decor']['equipped']['extra']=='third-grand_architect')
    p.locator('[data-screen="expedition"]').click()
    archive=next(r for r in record_samples if r['thirdEvolution']=='galaxy_archivist')
    p.select_option('#passive-leader',archive['id']);check('detailed existing history visible',p.locator('.trip-details').count()>0)
    inactive=next(r for r in record_samples if r['thirdEvolution']=='wind_guide');p.select_option('#passive-leader',inactive['id'])
    check('unsupported time passive explicit', '미활성' in p.locator('#passive-leader-status').inner_text() and '즉시' in p.locator('#passive-leader-status').inner_text())
    check('mobile no horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    p.screenshot(path=str(ROOT/'test-results/v11-expedition-mobile.png'),full_page=True)
    check('no JS runtime errors',not errors)
    simulations=p.evaluate('__v11.simulate(100)')
    rows=[]
    for group in simulations:
        samples=group.pop('samples');check('simulation completes '+group['type']+str(group['ratio']),all(s['finished'] for s in samples))
        rows.append({**group,'runs':len(samples),'medianActions':statistics.median(s['actions'] for s in samples),
          'meanActions':round(statistics.mean(s['actions'] for s in samples),2),
          'meanStats':{k:round(statistics.mean(s['stats'][k] for s in samples),2) for k in ['motivation','stress','laziness']},
          'meanEvents':round(statistics.mean(s['events'] for s in samples),2),'meanPassiveTriggers':round(statistics.mean(s['procs'] for s in samples),2)})
    gaps=[]
    for ratio in [.4,.5,.6]:
        values=[r['medianActions'] for r in rows if r['ratio']==ratio];gap=round((max(values)/min(values)-1)*100,2)
        gaps.append({'whipRatio':ratio,'medianSpreadPercent':gap,'within10Percent':gap<=10})
    report={'version':VERSION,'sourceDigest':hashlib.sha256((ROOT/'game.js').read_bytes()+b'\0'+(ROOT/'balance.js').read_bytes()).hexdigest(),'checksPassed':len(checks),'runs':1800,'method':'LV20 same initial stats 60/20/10; exact ratio per shuffled ten-action block; paired seed, independent event/action RNG; first event option; production engine, presentation and storage stubbed only during simulation. Trigger count means eligible action/positive event, including clamped stats. Gaps compare all six lineages and include inherited first passives.','strategies':gaps,'results':rows}
    (ROOT/'test-results/v11-balance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(f'PASS {len(checks)} v1.1 checks; 1800 production-engine simulations')
    print(json.dumps(gaps,ensure_ascii=False))
    p.close();browser.close()
