"""Release gate: recompute the approved <=10% objective from an actual CI report.
Exit 1 = valid report, balance objective failed. Exit 2 = missing/invalid evidence.
"""
from pathlib import Path
import argparse,hashlib,json,math,re,sys
TYPES={'garden_keeper','meadow_explorer','star_scholar','clockwork_inventor','workshop_artisan','steel_guardian'}
RATIOS={.4,.5,.6}

def inspect(report,version,source_digest):
    if not isinstance(report,dict) or report.get('version')!=version:raise ValueError('Missing report or version mismatch')
    if report.get('sourceDigest')!=source_digest:raise ValueError('Evidence does not match current game source')
    if report.get('runs')!=1800 or not isinstance(report.get('checksPassed'),int) or report['checksPassed']<1:raise ValueError('Missing validated run evidence')
    rows=report.get('results')
    if not isinstance(rows,list) or len(rows)!=18:raise ValueError('Expected six types x three strategies')
    expected={(t,r) for t in TYPES for r in RATIOS};seen=set()
    for row in rows:
        if not isinstance(row,dict):raise ValueError('Invalid result row')
        key=(row.get('type'),row.get('ratio'))
        if key not in expected or key in seen:raise ValueError('Duplicate or unknown condition')
        seen.add(key)
        median=row.get('medianActions')
        if row.get('runs')!=100 or isinstance(median,bool) or not isinstance(median,(int,float)) or not math.isfinite(median) or median<=0:raise ValueError('Invalid run count or median')
    gaps=[]
    for ratio in sorted(RATIOS):
        values=[r['medianActions'] for r in rows if r['ratio']==ratio]
        actual=(max(values)/min(values)-1)*100
        gaps.append({'whipRatio':ratio,'medianSpreadPercent':round(actual,2),'passed':actual<=10+1e-9})
    return gaps

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--report',type=Path,default=Path('test-results/v11-balance.json'));args=ap.parse_args()
    try:
        balance=(Path(__file__).resolve().parents[1]/'balance.js').read_text()
        version=re.search(r"version:\s*'([^']+)'",balance).group(1)
        root=Path(__file__).resolve().parents[1]
        source_digest=hashlib.sha256((root/'game.js').read_bytes()+b'\0'+(root/'balance.js').read_bytes()).hexdigest()
        gaps=inspect(json.loads(args.report.read_text()),version,source_digest)
    except (OSError,ValueError,TypeError,KeyError) as exc:
        print(f'BALANCE EVIDENCE ERROR: {exc}',file=sys.stderr);return 2
    for row in gaps:print(f"whip {row['whipRatio']:.0%}: {row['medianSpreadPercent']:.2f}% / <=10% -> {'PASS' if row['passed'] else 'FAIL'}")
    if all(r['passed'] for r in gaps):print('PASS growth-balance release objective');return 0
    print('BLOCKED: growth-balance objective not met. Functional checks do not approve release.');return 1

if __name__=='__main__':sys.exit(main())
