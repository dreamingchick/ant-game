"""v1.1 behavior contracts and paired-seed balance simulations using the production engine.
The test-only lexical bridge is injected into an in-memory copy, never shipped to players.
"""
from pathlib import Path
import json, os, re, statistics
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text();CSS=(ROOT/'style.css').read_text()
BALANCE=(ROOT/'balance.js').read_text();GAME=(ROOT/'game.js').read_text()
VERSION=re.search(r"version:\s*'([^']+)'",BALANCE).group(1)
KEY='little-ant-game-mvp-v1'
checks=[]
def check(name,okay):
    assert okay,name
    checks.append(name)
BRIDGE=r'''
  window.__v11={
    state:()=>JSON.parse(JSON.stringify(game)),
    seed:s=>{game=s;modalOpen=false;storageWorks=true;storageCorrupt=false;qs('modal-backdrop').hidden=true;render();saveState();},
    reload:()=>{game=loadState();reconcileAchievements();reconcileDecorations();render();saveState();},
    thirdTypeFor,secondTypeFor,eventStatDelta,validateImportedState,achievementProgress,decorProgress,
    action:playAction,resumeLevel20,
    explore:id=>{lastExploreClick=0;exploreRegion(id)},
    render,saveState,
    simulate:(runs=100,options={})=>{
      const originalConfig=JSON.parse(JSON.stringify({passive:B.passive,second:B.secondPassives,efficiency:B.efficiency}));
      if(options.first===false){B.passive.easy.extraCarrotStressRecovery=0;B.passive.genius.positiveEventBenefitMultiplier=1;B.passive.diligent.whipExpMultiplier=1;}
      if(options.second===false)for(const id of secondEvolutionIds)B.secondPassives[id].value=0;
      if(options.secondValues)for(const [id,value] of Object.entries(options.secondValues))B.secondPassives[id].value=value;
      if(options.efficiency)Object.assign(B.efficiency,options.efficiency);
      const originals={render,saveState,animateAnt,playSound,toast,scheduleAchievementNotices,showEvolutionResult,showChoiceEvent,closeModal};
      const originalGame=game,originalRandom=Math.random;
      render=()=>{};saveState=()=>true;animateAnt=()=>{};playSound=()=>{};toast=()=>{};
      scheduleAchievementNotices=()=>{};showEvolutionResult=()=>{};showChoiceEvent=()=>{};closeModal=()=>{modalOpen=false;};
      const output=[];
      const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      try{
        for(const type of secondEvolutionIds)for(const ratio of [.4,.5,.6]){
          const samples=[];
          for(let run=1;run<=runs;run++){
            game=freshState();game.level=20;game.phase='phase3';game.secondEvolution=type;game.evolution=SECOND_TYPES[type].parent;
            game.firstEvolution={type:game.evolution,acknowledged:true,statsAtFirst:{...game.stats}};
            if(options.stats)game.stats={...options.stats};
            game.tutorialCompleted=true;modalOpen=false;storageWorks=true;storageCorrupt=false;
            const actionRandom=rng(run+(options.seedOffset||0)),eventsRandom=rng(run+314159+(options.seedOffset||0));
            // Exact 40/50/60% per shuffled block of ten. Action and event streams are independent.
            Math.random=eventsRandom;
            let actions=0,stats={motivation:0,stress:0,laziness:0},procs=0,directBenefitActions=0,block=[];
            while(!game.finished && actions<3000){
              if(!block.length){block=Array.from({length:10},(_,i)=>i<ratio*10?'whip':'carrot');
                for(let i=9;i>0;i--){const j=Math.floor(actionRandom()*(i+1));[block[i],block[j]]=[block[j],block[i]];}}
              const action=block.pop(),beforeEvents=game.eventCount,beforeStats={...game.stats};
              const sp=B.secondPassives[type];
              const deltaStat={carrotMotivation:'motivation',carrotLaziness:'laziness',whipLaziness:'laziness',whipStress:'stress'}[sp.effect];
              const eligibleAction=sp.effect.startsWith(action);
              const directDelta=deltaStat && eligibleAction ? Math.abs(clamp(beforeStats[deltaStat]+B.actions[action][deltaStat]+sp.value)-clamp(beforeStats[deltaStat]+B.actions[action][deltaStat])):0;
              playAction(action);
              if(game.pendingChoice){
                const ev=B.events[game.pendingChoice.eventId];
                const choices=ev.choices;
                const chosen=options.choicePolicy==='state' ? choices.reduce((best,choice)=>{
                  const score=c=>{const st={...game.stats};for(const [key,value] of Object.entries(c.effects))st[key]=clamp(st[key]+eventStatDelta(ev,key,value));
                    return efficiency(st)*100-({danger:40,warn:15,normal:0,good:0}[statusTier(st)]);};
                  return score(choice)>score(best)?choice:best;
                },choices[0]):choices[0];
                resolveChoice(chosen.id);
              }
              if(directDelta>0)directBenefitActions++;
              actions++;
              const positive=game.eventCount>beforeEvents && B.events[game.recentEvents[0]?.id]?.kind==='positive';
              if((['garden_keeper','meadow_explorer'].includes(type)&&action==='carrot') ||
                (['clockwork_inventor','workshop_artisan','steel_guardian'].includes(type)&&action==='whip') ||
                (type==='star_scholar'&&positive))procs++;
              for(const stat of Object.keys(stats))stats[stat]+=game.stats[stat];
            }
            samples.push({actions,finished:game.finished,stats:Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,v/actions])),events:game.eventCount,procs,directBenefitActions,totalExp:game.totalExp});
          }
          output.push({type,ratio,samples});
        }
      }finally{Object.assign(B.passive.easy,originalConfig.passive.easy);Object.assign(B.passive.genius,originalConfig.passive.genius);Object.assign(B.passive.diligent,originalConfig.passive.diligent);for(const id of secondEvolutionIds)Object.assign(B.secondPassives[id],originalConfig.second[id]);Object.assign(B.efficiency,originalConfig.efficiency);({render,saveState,animateAnt,playSound,toast,scheduleAchievementNotices,showEvolutionResult,showChoiceEvent,closeModal}=originals);game=originalGame;Math.random=originalRandom;achievementNoticeQueue.length=0;modalOpen=false;}
      return output;
    }
  };
'''
GAME_BRIDGED=GAME[:GAME.rfind('})();')]+BRIDGE+GAME[GAME.rfind('})();'):]

def page_make(browser,seed=None):
    p=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    errors=[];p.on('pageerror',lambda error:errors.append(str(error)))
    p.set_content(HTML);p.add_style_tag(content=CSS)
    p.evaluate('''({seed,key,version})=>{
      const store={};store['little-ant-game-last-patch-seen']=version;if(seed)store[key]=JSON.stringify(seed);
      window.__store=store;window.__failWrites=false;
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>store[k]??null,setItem:(k,v)=>{if(window.__failWrites)throw Error('blocked');store[k]=String(v)},removeItem:k=>delete store[k]}});
      Math.random=()=>.99;
    }''',{'seed':seed,'key':KEY,'version':VERSION})
    p.add_script_tag(content=BALANCE);p.add_script_tag(content=GAME_BRIDGED)
    assert not errors,errors
    return p,errors

def state(p):return p.evaluate('__v11.state()')
def seed(p,s):p.evaluate('s=>__v11.seed(s)',s)
def stage3(initial,typ):
    s=json.loads(json.dumps(initial));s.update(level=20,phase='phase3',secondEvolution=typ,finished=False,tutorialCompleted=True)
    s['evolution']={'garden_keeper':'easy','meadow_explorer':'easy','star_scholar':'genius','clockwork_inventor':'genius','workshop_artisan':'diligent','steel_guardian':'diligent'}[typ]
    s['firstEvolution']={'type':s['evolution'],'acknowledged':True,'statsAtFirst':dict(s['stats'])}
    return s
