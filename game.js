/*
 * 개미 키우기 MVP v0.4
 * 데이터: balance.js / 화면: index.html / 스타일: style.css
 * 플레이어 데이터는 LocalStorage에 저장됩니다. 서버와 로그인은 없습니다.
 */
(() => {
  'use strict';
  const B = window.ANT_BALANCE;
  if (!B) { window.alert('balance.js를 불러오지 못했습니다. 게임 파일을 같은 폴더에 두세요.'); return; }

  const KEY = 'little-ant-game-mvp-v1';
  // 게임 데이터와 별도 보관하는, 마지막으로 확인한 패치 버전입니다.
  // v0.1/v0.2의 저장 키와 schemaVersion은 절대 변경하지 않습니다.
  const PATCH_SEEN_KEY = 'little-ant-game-last-patch-seen';
  const ANALYTICS_CONSENT_KEY = 'little-ant-game-analytics-consent';
  const analyticsMeasurementId = typeof B.analytics?.measurementId === 'string' &&
    /^G-[A-Z0-9]{5,16}$/i.test(B.analytics.measurementId.trim()) ? B.analytics.measurementId.trim() : '';
  let analyticsStarted = false;
  let trackedGameStartThisVisit = false;
  function analyticsChoice() {
    try { return localStorage.getItem(ANALYTICS_CONSENT_KEY); }
    catch (_error) { return null; }
  }
  // 기본 동의 방식: 동의하기 전에는 Google 스크립트를 불러오지 않습니다.
  function startAnalytics() {
    if(!analyticsMeasurementId || analyticsStarted || analyticsChoice() !== 'yes') return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{
      analytics_storage:'granted', ad_storage:'denied',
      ad_user_data:'denied', ad_personalization:'denied'
    });
    window.gtag('js',new Date());
    window.gtag('config', analyticsMeasurementId, {
      send_page_view:true, allow_google_signals:false,
      allow_ad_personalization_signals:false
    });
    const script=document.createElement('script');
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsMeasurementId)}`;
    document.head.appendChild(script);
    analyticsStarted=true;
  }
  function trackAnalytics(eventName, properties={}) {
    if(!analyticsStarted || analyticsChoice() !== 'yes') return;
    window.gtag('event',eventName,properties);
  }
  function setAnalyticsChoice(granted) {
    try {localStorage.setItem(ANALYTICS_CONSENT_KEY,granted?'yes':'no');}
    catch (_error) {return;}
    if(granted) startAnalytics();
    else if(analyticsStarted) {
      // 동의 철회 시 기존에 로드된 통계 스크립트까지 제거하도록 페이지를 다시 엽니다.
      window.gtag('consent','update',{analytics_storage:'denied'});
      window.location.reload();
      return;
    }
    renderAnalyticsUI();
  }
  function renderAnalyticsUI() {
    const configured=Boolean(analyticsMeasurementId);
    qs('analytics-not-configured').hidden=configured;
    qs('analytics-controls').hidden=!configured;
    qs('analytics-consent').checked=analyticsChoice()==='yes';
    const banner=qs('analytics-consent-banner');
    banner.hidden=!configured || !game.tutorialCompleted || game.finished ||
      analyticsChoice()!==null || modalOpen || Boolean(game.pendingChoice);
  }
  const hadExistingSaveAtLaunch = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      return !!raw && JSON.parse(raw)?.schemaVersion === 1;
    } catch (_error) { return false; }
  })();
  const qs = id => document.getElementById(id);
  const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
  const choose = values => values[Math.floor(Math.random() * values.length)];
  const percent = n => `${(n * 100).toFixed(1).replace(/\.0$/, '')}%`;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const portraitEmoji = { easy: '🍀', genius: '💡', diligent: '🛠️' };
  const tutorial = [
    { title:'먼저 당근을 주세요!', description:'당근은 의욕을 높이고 스트레스를 줄여 줍니다. 대신 나태함은 조금 올라가요.', button:null },
    { title:'이제 채찍으로 훈련!', description:'채찍은 경험치를 주지만 스트레스도 높여요. 실제 개미를 때리는 것이 아닌 훈련을 뜻합니다.', button:null },
    { title:'세 가지 상태를 확인하세요!', description:'의욕이 높고 스트레스·나태함이 낮을수록 훈련에 유리해요. 돌발 이벤트 확률도 상태에 따라 달라져요.', button:'이해했어요' },
    { title:'LV.10에서 첫 진화!', description:'당근과 채찍을 사용한 누적 비율과 진화 시점의 상태가 성장에 영향을 줘요. 지금부터 자유롭게 키워 보세요!', button:'육성 시작' }
  ];
  const dialogue = {
    idle: ['오늘도 한 뼘 자라 볼까?', '조금씩, 차근차근!', '오늘은 무얼 해 볼까?', '이 개미집, 꽤 포근한걸.'],
    carrot: ['당근이다! 신난다!', '기운이 나는 것 같아!', '잘 먹겠습니다!', '이렇게 맛있는 보상이라니!'],
    whip: ['더 강해질 거야!', '하나, 둘! 훈련 시작!', '조금씩 성장하고 있어!', '오늘의 노력이 내일의 나를 만든다!'],
    stress: ['잠깐만 쉬어 가고 싶어…', '조금 힘든 하루야…', '너무 무리한 건 아닐까?'],
    lazy: ['조금만 더 누워 있을래…', '후아암, 쉬는 것도 좋지.', '당근 하나 더 먹을까?'],
    event: {
      focus: '집중! 지금이 기회야!',
      carrotJoy: '최고의 당근이야!',
      refresh: '오, 마음이 가벼워졌어!',
      refusal: '오늘 훈련은 잠깐 쉬고 싶어!',
      nap: '깜빡 잠들었네…',
      complain: '오늘은 영 내키지 않아…'
    }
  };

  function freshState() {
    return {
      schemaVersion: 1,
      level: B.initial.level, exp: B.initial.exp,
      stats: { motivation:B.initial.motivation, stress:B.initial.stress, laziness:B.initial.laziness },
      carrotCount:0, whipCount:0, totalExp:0, eventCount:0, eventsByType:{},
      recentEvents:[], records:[], finished:false, finishedRecordId:null, evolution:null,
      pendingChoice:null, unlockedAchievements:[],
      decor:{unlocked:[],equipped:{floor:null,wall:null,light:null}},
      lastSpeech: choose(dialogue.idle), lastFeedback:'작은 선택이 개미의 내일을 바꿉니다.', lastReaction:'idle',
      tutorialCompleted:false, tutorialStep:0,
      settings:{ soundEnabled:true, volume:65 }
    };
  }

  let storageWorks = true;
  let storageCorrupt = false; // 손상되거나 다른 스키마의 저장 데이터를 자동 덮어쓰지 않습니다.
  function loadState() {
    const base = freshState();
    try {
      const text = localStorage.getItem(KEY);
      if (!text) return base;
      const prev = JSON.parse(text);
      if (!prev || prev.schemaVersion !== 1 || typeof prev !== 'object') { storageCorrupt=true; return base; }
      const stats = prev.stats && typeof prev.stats === 'object' ? prev.stats : {};
      const num = (v, fallback, max=Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0,Math.min(max,Math.floor(v))) : fallback;
      const validTypes = Object.keys(B.types);
      const records = Array.isArray(prev.records) ? prev.records.filter(r => r && validTypes.includes(r.type) && typeof r.id === 'string').map(r=>({
        id:r.id.slice(0,96),type:r.type,
        timestamp:num(r.timestamp,Date.now()),level:10,
        stats: {motivation:clamp(r.stats?.motivation ?? 60),stress:clamp(r.stats?.stress ?? 20),laziness:clamp(r.stats?.laziness ?? 10)},
        carrotCount:num(r.carrotCount,0),whipCount:num(r.whipCount,0),
        totalExp:num(r.totalExp,0),eventCount:num(r.eventCount,0),
        balanceVersion:typeof r.balanceVersion==='string'?r.balanceVersion.slice(0,24):'0.1.0',
        eventsByType:r.eventsByType&&typeof r.eventsByType==='object'?r.eventsByType:{}
      })) : [];
      return {
        ...base,
        level: Math.max(1,num(prev.level,1,B.maxLevel)), exp:num(prev.exp,0,10000000),
        stats:{ motivation:clamp(stats.motivation ?? 60), stress:clamp(stats.stress ?? 20), laziness:clamp(stats.laziness ?? 10) },
        carrotCount:num(prev.carrotCount,0), whipCount:num(prev.whipCount,0), totalExp:num(prev.totalExp,0),eventCount:num(prev.eventCount,0),
        eventsByType: prev.eventsByType && typeof prev.eventsByType === 'object' ? prev.eventsByType : {},
        recentEvents: Array.isArray(prev.recentEvents)?prev.recentEvents.slice(0,25):[],
        // 기존 schemaVersion 1을 그대로 유지하고, 신규 선택 상태만 선택적으로 복원합니다.
        pendingChoice:!prev.finished && prev.pendingChoice &&
          B.events[prev.pendingChoice.eventId]?.choices?.length &&
          ['carrot','whip'].includes(prev.pendingChoice.action) &&
          typeof prev.pendingChoice.gained==='number' && Number.isFinite(prev.pendingChoice.gained) &&
          typeof prev.pendingChoice.recoveryBonus==='boolean' ? {
            eventId:prev.pendingChoice.eventId,
            action:prev.pendingChoice.action,
            gained:num(prev.pendingChoice.gained,0,1000000),
            recoveryBonus:prev.pendingChoice.recoveryBonus
          } : null,
        unlockedAchievements:Array.isArray(prev.unlockedAchievements) ?
          [...new Set(prev.unlockedAchievements)].filter(id=>B.achievements.some(a=>a.id===id)) : [],
        decor: {
          unlocked:Array.isArray(prev.decor?.unlocked) ?
            [...new Set(prev.decor.unlocked.filter(id=>typeof id==='string' && B.decorations.some(d=>d.id===id)))]:[],
          equipped:Object.fromEntries(['floor','wall','light'].map(slot=>[
            slot, B.decorations.some(d=>d.id===prev.decor?.equipped?.[slot] && d.slot===slot) ? prev.decor.equipped[slot] : null
          ]))
        },
        records,
        finished: Boolean(prev.finished), finishedRecordId: prev.finishedRecordId ?? null,
        evolution:validTypes.includes(prev.evolution)?prev.evolution:null,
        lastSpeech:typeof prev.lastSpeech==='string'?prev.lastSpeech.slice(0,120):base.lastSpeech,
        lastFeedback:typeof prev.lastFeedback==='string'?prev.lastFeedback.slice(0,180):base.lastFeedback,
        lastReaction:'idle',
        tutorialCompleted:Boolean(prev.tutorialCompleted),tutorialStep: num(prev.tutorialStep,0,3),
        settings: {soundEnabled:prev.settings?.soundEnabled!==false,volume:num(prev.settings?.volume,65,100)}
      };
    } catch (error) {
      console.warn('자동 저장을 불러올 수 없습니다.',error);
      storageWorks = false;
      storageCorrupt = true;
      return base;
    }
  }

  let game = loadState();
  // 과거 육성 기록을 이용해 첫 접속 시 도전과제를 소급 인정하되 알림은 발생시키지 않습니다.
  // reconcileAchievements는 선언식 함수이므로 초기화 시점에서 참조 가능합니다.
  reconcileAchievements();
  reconcileDecorations(); // 구버전 저장 데이터의 과거 육성 기록을 소급 인정
  let activeScreen = 'game';
  let modalOpen = false;
  let modalKind = null;
  let previousFocus = null;
  let toastTimer = 0;
  let reactionTimer = 0;
  let audioCtx = null;
  let queuedPatchOnLaunch = false;
  let achievementNoticeQueue = [];
  let achievementToastScheduled = false;
  // 메인 이벤트·레벨업·진화 팝업을 방해하지 않고 배지 달성 소식을 순서대로 안내합니다.
  function scheduleAchievementNotices() {
    if(achievementToastScheduled || !achievementNoticeQueue.length) return;
    achievementToastScheduled=true;
    setTimeout(()=>{
      achievementToastScheduled=false;
      if(modalOpen || game.pendingChoice) return; // 팝업 종료 시 재개
      const title=achievementNoticeQueue.shift();
      if(title) toast(title.startsWith('장식 해금 · ')?`✿ ${title}`:`🏅 도전과제 달성 · ${title}`);
      if(achievementNoticeQueue.length) scheduleAchievementNotices();
    },2000);
  }

  function saveState() {
    if(storageCorrupt) {storageWorks=false;renderStorageStatus();return;}
    try { localStorage.setItem(KEY,JSON.stringify(game)); storageWorks = true; }
    catch(error) {storageWorks=false; console.warn('자동 저장 실패:',error);}
    renderStorageStatus();
  }

  function efficiency(stats) {
    const e=B.efficiency;
    const raw = 1 + (stats.motivation-e.motivationBaseline)*e.motivationWeight
      - stats.stress*e.stressWeight - stats.laziness*e.lazinessWeight;
    return Math.max(e.min,Math.min(e.max,raw));
  }
  function statusTier(stats) {
    const {motivation:m,stress:s,laziness:l}=stats;
    const t=B.thresholds;
    if(s>=t.danger.stressAtLeast || l>=t.danger.lazinessAtLeast || m<=t.danger.motivationAtMost) return 'danger';
    if(s>=t.warn.stressAtLeast || l>=t.warn.lazinessAtLeast || m<=t.warn.motivationAtMost) return 'warn';
    if(m>=t.good.motivationAtLeast && s<=t.good.stressAtMost && l<=t.good.lazinessAtMost) return 'good';
    return 'normal';
  }
  function pickEvent(action, stats) {
    const tier=B.eventTiers[statusTier(stats)];
    if(Math.random()>=tier.rate) return null;
    const kind=Math.random()<tier.positiveShare?'positive':'negative';
    const pool=Object.entries(B.events).filter(([,e])=>e.kind===kind && (e.action==='both'||e.action===action));
    return choose(pool).at(0);
  }
  function evolutionType() {
    const count=game.carrotCount+game.whipCount;
    const ratio=count?game.whipCount/count:0;
    if(ratio<=B.evolution.easyMaxWhipRatio) return 'easy';
    if(ratio<B.evolution.geniusMaxWhipRatio) return 'genius';
    return 'diligent';
  }
  function getRatio() {
    const total=game.carrotCount+game.whipCount;
    return total?game.whipCount/total:0;
  }

  // 이벤트는 기존 확률을 유지하며 행동 직전 상태에서 단 한 번 추첨합니다.
  // 선택 이벤트의 경우 행동/기본 이벤트 효과만 먼저 저장하고 경험치·진화를 보류합니다.
  function playAction(action) {
    if(game.finished || game.pendingChoice || modalOpen) return;
    const before={...game.stats};
    const eventId=pickEvent(action,before);
    const changes=B.actions[action];
    const recovery=B.conditionalRecovery?.[action];
    const recoveryBonus=Boolean(recovery && before[recovery.stat]>=recovery.threshold);
    let gained=action==='whip' ? Math.max(1,Math.round(changes.baseExp*efficiency(before))) : 0;
    for(const key of ['motivation','stress','laziness']) game.stats[key]=clamp(game.stats[key]+changes[key]);
    if(recoveryBonus) game.stats[recovery.stat]=clamp(game.stats[recovery.stat]+recovery.extra);
    if(action==='carrot') game.carrotCount++; else game.whipCount++;

    if(eventId) {
      const event=B.events[eventId];
      if(event.expMultiplier && action==='whip') gained=Math.max(1,Math.round(gained*event.expMultiplier));
      if(event.cancelExp) gained=0;
      for(const key of ['motivation','stress','laziness']) if(event[key]) game.stats[key]=clamp(game.stats[key]+event[key]);
      game.eventCount++;
      game.eventsByType[eventId]=(game.eventsByType[eventId]||0)+1;
      game.recentEvents.unshift({id:eventId,name:event.name,action,at:Date.now()});
      game.recentEvents=game.recentEvents.slice(0,25);
      game.lastSpeech=dialogue.event[eventId];
      game.lastReaction='event';
      if(event.choices?.length) {
        game.pendingChoice={eventId,action,gained,recoveryBonus};
        game.lastFeedback=`돌발 이벤트 · ${event.name} · 대응 방법을 골라 주세요.`;
        saveState();render();animateAnt('event',false);
        playSound(event.kind==='positive'?'positive':'negative');
        showChoiceEvent();
        return;
      }
    }
    completeAction({action,gained,recoveryBonus,eventId});
  }

  function completeAction({action,gained,recoveryBonus,eventId,choiceLabel}) {
    // 선택 이벤트의 행동 횟수와 기본 효과는 여기서 다시 적용하지 않습니다.
    if(!trackedGameStartThisVisit) {
      trackedGameStartThisVisit=true;
      trackAnalytics('game_start',{game_version:B.version});
    }
    game.totalExp+=gained;
    game.exp+=gained;
    const priorLevel=game.level;
    while(game.level<B.maxLevel && game.exp>=B.expRequired(game.level)) {
      game.exp-=B.expRequired(game.level);
      game.level++;
    }
    const didLevelUp=game.level>priorLevel;
    if(game.level>=B.maxLevel) {
      game.exp=0;
      finishEvolution();
    }
    if(eventId) {
      game.lastReaction='event';
      if(!choiceLabel) game.lastSpeech=dialogue.event[eventId];
    } else if(action==='carrot') {
      game.lastSpeech=choose(dialogue.carrot);
      game.lastReaction='carrot';
    } else {
      game.lastSpeech=choose(dialogue.whip);
      game.lastReaction='whip';
    }
    if(!eventId && game.stats.stress>=85) game.lastSpeech=choose(dialogue.stress);
    else if(!eventId && game.stats.laziness>=85) game.lastSpeech=choose(dialogue.lazy);
    if(didLevelUp && !game.finished) game.lastSpeech=`야호! LV.${game.level} 달성!`;

    let feedback=action==='carrot'?'당근: 의욕 ↑ · 스트레스 ↓ · 나태함 ↑':`채찍: EXP +${gained} · 스트레스 ↑`;
    if(recoveryBonus) feedback+=action==='carrot'?' · 스트레스 집중 회복(-10 추가)':' · 나태함 집중 교정(-5 추가)';
    if(eventId) feedback+=` · 돌발 이벤트 · ${B.events[eventId].name}`;
    if(choiceLabel) feedback+=` · ${choiceLabel}`;
    if(didLevelUp && !game.finished) feedback+=` · LV.${game.level} 레벨업!`;
    if(game.finished) feedback='첫 진화 달성! 결과를 확인해 보세요.';
    game.lastFeedback=feedback;
    updateTutorial(action);
    const gainedAchievements=reconcileAchievements();
    const gainedDecorations=reconcileDecorations();
    if(gainedAchievements.length) {
      achievementNoticeQueue.push(...gainedAchievements);
      for(const title of gainedAchievements) {
        const match=B.achievements.find(a=>a.title===title);
        if(match)trackAnalytics('achievement_unlocked',{achievement_id:match.id});
      }
    }
    if(gainedDecorations.length) {
      // 선택형 이벤트 및 진화 결과보다 뒤에 간단한 해금 알림을 표시합니다.
      for(const name of gainedDecorations) achievementNoticeQueue.push(`장식 해금 · ${name}`);
    }
    if(game.finished) trackAnalytics('ant_evolved',{
      ant_type:game.evolution, completed_level:game.level,
      action_count:game.carrotCount+game.whipCount
    });
    saveState();render();animateAnt(eventId?'event':action,didLevelUp);
    scheduleAchievementNotices();
    if(game.finished) {
      playSound('evolution');
      showEvolutionResult(findFinishRecord());
    } else if(didLevelUp) {
      playSound('level');toast(`레벨 업! LV.${game.level}`);
    } else if(eventId) {
      playSound(B.events[eventId].kind==='positive'?'positive':'negative');
      toast(`돌발 이벤트 · ${B.events[eventId].name}${choiceLabel?' · '+choiceLabel:''}`);
    } else {
      playSound(action);
    }
  }

  function showChoiceEvent() {
    const pending=game.pendingChoice;
    if(!pending || game.finished) return;
    const event=B.events[pending.eventId];
    const options=event.choices.map((choice,index)=>`<button class="choice-option" type="button" data-choice="${escapeHTML(choice.id)}">
      <span class="choice-number">${index===0?'A':'B'}</span><span class="choice-content"><strong>${escapeHTML(choice.label)}</strong><small>${escapeHTML(choice.details)}</small></span><span class="choice-arrow">›</span>
    </button>`).join('');
    showModal(`<p class="modal-eyebrow">A LITTLE CHOICE</p><h2 id="modal-title">${escapeHTML(event.name)}</h2>
      <p class="modal-subtitle">${escapeHTML(event.prompt)}</p><div class="choice-options">${options}</div>
      <p class="choice-caption">기존 이벤트 효과가 먼저 적용됩니다. 선택지는 행동 횟수에 포함되지 않습니다.</p>`, 'choice');
    qs('modal-body').querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>resolveChoice(button.dataset.choice)));
  }

  function resolveChoice(choiceId) {
    const pending=game.pendingChoice;
    if(!pending) return; // 연속 클릭, 복원 중복 처리 차단
    const choice=B.events[pending.eventId]?.choices?.find(option=>option.id===choiceId);
    if(!choice) return;
    game.pendingChoice=null; // 같은 이벤트를 두 번 확정할 수 없음
    for(const [stat,delta] of Object.entries(choice.effects)) game.stats[stat]=clamp(game.stats[stat]+delta);
    game.lastSpeech=choice.response;
    closeModal();
    trackAnalytics('event_choice',{event_id:pending.eventId,choice_id:choiceId});
    completeAction({...pending,choiceLabel:choice.label});
  }

  // 저장된 과거 완료 기록 + 현재 진행 중인 개미만 합산합니다.
  // 진화 완료 직후 game의 행동 횟수는 이미 records에 포함되므로 이중 집계하지 않습니다.
  function achievementProgress() {
    const records=game.records;
    const activeActions=game.finished?0:game.carrotCount+game.whipCount;
    const activeEvents=game.finished?0:game.eventCount;
    const totalActions=records.reduce((sum,r)=>sum+r.carrotCount+r.whipCount,activeActions);
    const totalEvents=records.reduce((sum,r)=>sum+r.eventCount,activeEvents);
    const types=new Set(records.map(r=>r.type));
    return {
      ACH01:totalActions>=1, ACH02:records.length>0,
      ACH03:types.has('easy'), ACH04:types.has('genius'), ACH05:types.has('diligent'),
      ACH06:types.size===3, ACH07:totalActions>=300, ACH08:totalEvents>=30
    };
  }
  function reconcileAchievements() {
    const progress=achievementProgress();
    const unlocked=new Set(game.unlockedAchievements);
    const newly=[];
    for(const achievement of B.achievements) {
      if(progress[achievement.id] && !unlocked.has(achievement.id)) {
        unlocked.add(achievement.id); newly.push(achievement.title);
      }
    }
    game.unlockedAchievements=[...unlocked];
    return newly;
  }


  // 현재 진행 개미 + 완료 기록을 중복 없이 합산해 장식 해금 조건을 검사합니다.
  function decorProgress() {
    const career=game.records.reduce((acc,r)=>{
      acc.carrots+=r.carrotCount;
      acc.whips+=r.whipCount;
      acc.events+=r.eventCount;
      acc.evolutions++;
      if(r.type==='genius')acc.genius++;
      return acc;
    },{carrots:0,whips:0,events:0,evolutions:0,genius:0});
    if(!game.finished) {
      career.carrots+=game.carrotCount;
      career.whips+=game.whipCount;
      career.events+=game.eventCount;
    }
    career.actions=career.carrots+career.whips;
    return career;
  }
  function reconcileDecorations() {
    const progress=decorProgress();
    const unlocked=new Set(game.decor.unlocked);
    const newly=[];
    for(const item of B.decorations) {
      if(progress[item.req.kind] >= item.req.min && !unlocked.has(item.id)) {
        unlocked.add(item.id); newly.push(item.name);
      }
    }
    game.decor.unlocked=[...unlocked];
    // 깨진 저장 상태에 고정된 잠금 장식이 남아 있을 경우 화면에 나타내지 않습니다.
    for(const slot of ['floor','wall','light']) {
      if(!unlocked.has(game.decor.equipped[slot])) game.decor.equipped[slot]=null;
    }
    return newly;
  }
  function nestTheme() {
    const total=game.carrotCount+game.whipCount;
    if(!total)return {id:'neutral',label:'포근한 흙집'};
    const ratio=getRatio();
    if(ratio<=B.evolution.easyMaxWhipRatio)return {id:'cozy',label:'초록빛 휴식처'};
    if(ratio<B.evolution.geniusMaxWhipRatio)return {id:'balanced',label:'반짝이는 연구실'};
    return {id:'workshop',label:'성실한 공방'};
  }
  function renderNestScene() {
    const theme=nestTheme();
    qs('habitat').dataset.theme=theme.id;
    qs('scene-location').textContent=`⌂  ${theme.label}`;
    for(const slot of ['floor','wall','light']) {
      const item=B.decorations.find(d=>d.id===game.decor.equipped[slot] && d.slot===slot);
      const el=qs(`nest-${slot}-display`);
      el.textContent=item?.icon||'';
      el.title=item?.name||'';
    }
  }
  function renderDecorations() {
    const owned=new Set(game.decor.unlocked);
    qs('decor-count').textContent=`${owned.size} / ${B.decorations.length}`;
    qs('decor-progress').style.width=`${Math.round(100*owned.size/B.decorations.length)}%`;
    qs('nest-theme-caption').textContent=`현재 개미집 분위기: ${nestTheme().label}`;
    qs('decorations-grid').innerHTML=B.decorations.map(item=>{
      const unlocked=owned.has(item.id);
      const equipped=game.decor.equipped[item.slot]===item.id;
      return `<article class="decor-card ${unlocked?'':'locked'} ${equipped?'equipped':''}">
        <span class="decor-icon" aria-hidden="true">${unlocked?escapeHTML(item.icon):'🔒'}</span>
        <div class="decor-info"><strong>${escapeHTML(item.name)}</strong>
          <small>${unlocked?escapeHTML(item.desc):`해금 조건 · ${escapeHTML(item.hint)}`}</small>
          <span class="decor-slot">${{floor:'바닥',wall:'벽',light:'조명'}[item.slot]}</span></div>
        <button class="decor-action" type="button" data-decor-id="${escapeHTML(item.id)}" ${unlocked?'':'disabled'} aria-label="${escapeHTML(item.name)} ${equipped?'해제':unlocked?'배치':'잠김'}">${equipped?'해제':unlocked?'배치':'미해금'}</button>
      </article>`;
    }).join('');
  }
  function toggleDecoration(id) {
    if(modalOpen || game.pendingChoice || !game.decor.unlocked.includes(id))return;
    const item=B.decorations.find(d=>d.id===id);
    if(!item)return;
    const equipped=game.decor.equipped[item.slot]===id;
    game.decor.equipped[item.slot]=equipped?null:id;
    saveState();render();
    toast(equipped?`${item.name} 장식을 해제했어요.`:`${item.name}을(를) 개미집에 배치했어요!`);
  }

  function finishEvolution() {
    if(game.finished) return;
    const type=evolutionType();
    const record={
      id:`ant-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp:Date.now(), type, level:10,
      stats:{...game.stats}, carrotCount:game.carrotCount, whipCount:game.whipCount,
      totalExp:game.totalExp, eventCount:game.eventCount, balanceVersion:B.version, eventsByType:{...game.eventsByType}
    };
    game.finished=true;
    game.evolution=type;
    game.finishedRecordId=record.id;
    game.records.unshift(record);
    game.tutorialCompleted=true;
  }
  function findFinishRecord() {return game.records.find(r=>r.id===game.finishedRecordId)||game.records[0]||null;}

  function updateTutorial(action) {
    if(game.tutorialCompleted) return;
    if(game.tutorialStep===0 && action==='carrot') game.tutorialStep=1;
    else if(game.tutorialStep===1 && action==='whip') game.tutorialStep=2;
  }
  function advanceTutorial() {
    if(game.tutorialCompleted)return;
    if(game.tutorialStep===2) game.tutorialStep=3;
    else if(game.tutorialStep===3){
      game.tutorialCompleted=true;
      trackAnalytics('tutorial_complete',{game_version:B.version});
      toast('이제 자유롭게 개미를 키워 보세요!');
    }
    saveState(); render();
  }
  function skipTutorial() {game.tutorialCompleted=true;saveState();render();toast('튜토리얼을 건너뛰었습니다.');}

  function reactionMood() {
    if(game.finished) return 'happy';
    if(game.stats.stress>=85 || game.stats.motivation<=15) return 'sad';
    if(game.stats.laziness>=85) return 'sleepy';
    if(game.lastReaction==='carrot')return 'happy';
    if(game.lastReaction==='whip')return 'training';
    return 'normal';
  }
  function moodLabel(){
    if(game.finished)return '✧ 첫 진화 완료';
    const tier=statusTier(game.stats);
    return {good:'☘ 기분 최고',normal:'☘ 평온한 상태',warn:'◈ 관리 필요',danger:'● 지친 상태'}[tier];
  }
  function render() {
    qs('ant-name').textContent=game.finished?B.types[game.evolution]?.name||'진화 개미':'신입 개미';
    qs('evolution-stage').textContent=game.finished?'첫 진화 달성':'첫 번째 여정';
    qs('level-badge').textContent=`LV. ${game.level}`;
    const required=game.finished?0:B.expRequired(game.level);
    qs('xp-text').textContent=game.finished?'MAX LEVEL':`${game.exp} / ${required} EXP`;
    qs('xp-fill').style.width=`${game.finished?100:Math.min(100,(game.exp/required)*100)}%`;
    qs('xp-progress').setAttribute('aria-valuenow',String(game.finished?100:Math.round(game.exp/required*100)));
    qs('evolution-hint').textContent=game.finished?'첫 진화 완료':'LV.10 첫 진화';
    qs('progress-narration').textContent=game.finished?'첫 성장의 완성!':`진화까지 ${B.maxLevel-game.level}레벨`;
    qs('scene-status').textContent=`● ${B.eventTiers[statusTier(game.stats)].label} 상태`;
    qs('scene-action-text').textContent=game.finished?'새로운 가능성 발견':`${game.carrotCount+game.whipCount}번의 작은 선택`;
    qs('speech-bubble').textContent=game.lastSpeech;
    qs('mood-label').textContent=moodLabel();
    const ant=qs('ant-figure');
    ant.dataset.evolution=game.evolution||'newbie';
    ant.dataset.mood=reactionMood();
    ant.setAttribute('aria-label',`${game.finished?B.types[game.evolution]?.name:'신입 개미'} 캐릭터`);
    for(const stat of ['motivation','stress','laziness']) {
      qs(`${stat}-value`).textContent=game.stats[stat];
      qs(`${stat}-fill`).style.width=`${game.stats[stat]}%`;
    }
    qs('efficiency-label').textContent=`훈련 효율 ${Math.round(efficiency(game.stats)*100)}%`;
    qs('action-count').textContent=`총 ${game.carrotCount+game.whipCount}회 행동`;
    qs('action-feedback').textContent=game.lastFeedback;
    qs('count-carrot').textContent=game.carrotCount;
    qs('count-whip').textContent=game.whipCount;
    qs('whip-ratio').textContent=percent(getRatio());
    qs('count-event').textContent=game.eventCount;
    qs('carrot-button').disabled=game.finished||Boolean(game.pendingChoice);
    qs('whip-button').disabled=game.finished||Boolean(game.pendingChoice);
    renderEvolutionGuide();
    renderNestScene();
    renderDecorations();
    qs('finished-panel').hidden=!game.finished;
    if(game.finished)qs('finished-name').textContent=B.types[game.evolution].name;
    renderTutorial();
    renderRecords();
    renderAchievements();
    renderSettings();
    showScreen(activeScreen,false);
  }
  function renderEvolutionGuide() {
    const count=game.carrotCount+game.whipCount;
    const ratio=getRatio();
    const type=count?evolutionType():null;
    qs('guide-prediction').textContent=game.finished?`${B.types[game.evolution].name} · 확정`:type?B.types[type].name:'아직 미정';
    qs('guide-ratio').textContent=count?`채찍 ${percent(ratio)}`:'행동 기록 없음';
    qs('guide-note').textContent=game.finished?'진화가 확정되었습니다. 다음 개미를 만나 새로운 길을 찾아보세요.':
      '예상 진화는 누적 행동 비율로 계산되며 LV.10까지 달라질 수 있습니다.';
    const marker=qs('guide-marker');
    marker.hidden=!count;
    if(count)marker.style.left=`${Math.min(98,Math.max(2,ratio*100))}%`;
    qs('guide-bar').setAttribute('aria-label',count?`현재 채찍 비율 ${percent(ratio)}, 예상 진화 ${B.types[type].name}`:'아직 행동하지 않아 진화를 예측할 수 없습니다');
  }
  function renderAchievements() {
    const unlocked=new Set(game.unlockedAchievements);
    qs('achievement-count').textContent=`${unlocked.size} / ${B.achievements.length}`;
    qs('achievement-fill').style.width=`${unlocked.size/B.achievements.length*100}%`;
    qs('achievements-grid').innerHTML=B.achievements.map(a=>{
      const found=unlocked.has(a.id);
      return `<div class="achievement-item ${found?'unlocked':'locked'}">
        <span class="achievement-icon" aria-hidden="true">${found?escapeHTML(a.icon):'🔒'}</span>
        <span class="achievement-content"><strong>${escapeHTML(a.title)}</strong><small>${escapeHTML(a.description)}</small></span>
        <span class="achievement-status">${found?'달성':'진행 중'}</span>
      </div>`;
    }).join('');
  }
  function renderTutorial() {
    const visible=!game.tutorialCompleted&&!game.finished;
    qs('tutorial-panel').hidden=!visible;
    if(!visible)return;
    const step=tutorial[game.tutorialStep];
    qs('tutorial-progress').textContent=`${game.tutorialStep+1} / 4`;
    qs('tutorial-title').textContent=step.title;
    qs('tutorial-description').textContent=step.description;
    qs('tutorial-next').hidden=!step.button;
    qs('tutorial-next').textContent=step.button||'';
  }
  function renderRecords() {
    const unlocked=Object.keys(B.types).filter(type=>game.records.some(r=>r.type===type));
    qs('collection-count').textContent=`${unlocked.length} / 3`;
    qs('collection-fill').style.width=`${100*unlocked.length/3}%`;
    qs('record-count').textContent=`${game.records.length}개의 기록`;
    const collection=qs('collection-grid');
    collection.innerHTML=Object.entries(B.types).map(([type,info])=>{
      const count=game.records.filter(r=>r.type===type).length;
      return `<div class="collection-item ${count?'':'locked'}"><div class="collection-portrait">${count?portraitEmoji[type]:'?'}</div><h3>${count?info.name:'??? 개미'}</h3><p>${count?`${count}번 진화`:'미발견'}</p></div>`;
    }).join('');
    const list=qs('record-list');
    if(!game.records.length){list.innerHTML='<div class="empty-records">아직 진화한 개미가 없어요.<br>LV.10까지 육성해 첫 기록을 만들어 보세요!</div>';return;}
    list.innerHTML=game.records.map((r,i)=>`<button type="button" class="record-row" data-record-id="${escapeHTML(r.id)}"><span class="record-icon">${portraitEmoji[r.type]}</span><span class="record-info"><strong>${escapeHTML(B.types[r.type].name)}</strong><small>${dateLabel(r.timestamp)} · 채찍 비율 ${percent(r.whipCount/Math.max(1,r.whipCount+r.carrotCount))} · ${r.carrotCount+r.whipCount}회 행동</small></span><span class="record-arrow">›</span></button>`).join('');
  }
  function renderSettings() {
    qs('sound-toggle').checked=game.settings.soundEnabled;
    qs('sound-volume').value=game.settings.volume;
    qs('sound-volume').disabled=!game.settings.soundEnabled;
    qs('sound-volume-text').textContent=`${game.settings.volume}%`;
    renderStorageStatus();
    renderAnalyticsUI();
  }
  function renderStorageStatus() {
    const el=qs('save-status');
    if(!el)return;
    el.innerHTML=storageWorks?'<span class="save-dot"></span> 자동 저장 사용 중':'<span aria-hidden="true">!</span> 저장 불가 · 기존 데이터가 손상되었거나 브라우저 저장이 제한됨';
  }
  function dateLabel(timestamp) {
    const value=typeof timestamp==='number'?timestamp:Date.now();
    return new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
  }
  function animateAnt(action,didLevelUp) {
    const figure=qs('ant-figure');
    const scene=qs('habitat');
    clearTimeout(reactionTimer);
    figure.classList.remove('reaction-carrot','reaction-whip','reaction-event');
    scene.classList.remove('level-celebrate');
    void figure.offsetWidth;
    figure.classList.add(`reaction-${action}`);
    if(didLevelUp)scene.classList.add('level-celebrate');
    reactionTimer=setTimeout(()=>{figure.classList.remove('reaction-carrot','reaction-whip','reaction-event');scene.classList.remove('level-celebrate');},650);
  }
  function toast(message) {
    const element=qs('toast');
    clearTimeout(toastTimer);
    element.textContent=message;
    element.hidden=false;
    requestAnimationFrame(()=>element.classList.add('visible'));
    toastTimer=setTimeout(()=>{element.classList.remove('visible');setTimeout(()=>{if(!element.classList.contains('visible'))element.hidden=true;},210);},1800);
  }

  // 별도 음원 파일 없이 Web Audio API로 간단한 오리지널 UI 효과음을 합성합니다.
  function playSound(kind) {
    if(!game.settings.soundEnabled || game.settings.volume<=0)return;
    try {
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)return;
      if(!audioCtx)audioCtx=new Context();
      if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
      const patterns={
        carrot:[[550,0,.10],[740,.09,.13]], whip:[[255,0,.07],[350,.1,.08]],
        positive:[[660,0,.11],[880,.11,.16]],negative:[[370,0,.12],[260,.12,.18]],
        level:[[523,0,.10],[659,.11,.1],[784,.22,.17]],
        evolution:[[392,0,.11],[523,.13,.11],[659,.26,.15],[784,.43,.14],[1047,.58,.38]]
      };
      const volume=game.settings.volume/100*.12;
      for(const [frequency,delay,duration] of patterns[kind]||patterns.carrot){
        const oscillator=audioCtx.createOscillator();
        const gain=audioCtx.createGain();
        oscillator.type=kind==='whip'||kind==='negative'?'triangle':'sine';
        oscillator.frequency.setValueAtTime(frequency,audioCtx.currentTime+delay);
        gain.gain.setValueAtTime(.0001,audioCtx.currentTime+delay);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),audioCtx.currentTime+delay+.018);
        gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+delay+duration);
        oscillator.connect(gain);gain.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime+delay);
        oscillator.stop(audioCtx.currentTime+delay+duration+.02);
      }
    } catch(error){console.warn('효과음 재생 불가',error);}
  }

  function showScreen(name,scroll=true) {
    activeScreen=name;
    for(const screen of ['game','records','nest','settings'])qs(`screen-${screen}`).hidden=screen!==name;
    document.querySelectorAll('[data-screen]').forEach(button=>{
      const active=button.dataset.screen===name;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    if(scroll)window.scrollTo({top:0,behavior:'instant'});
  }
  function showModal(content, kind = null) {
    modalKind = kind;
    qs('modal-close').hidden=kind==='choice';
    previousFocus=document.activeElement;
    qs('modal-body').innerHTML=content;
    qs('modal-backdrop').hidden=false;
    modalOpen=true;
    document.body.style.overflow='hidden';
    qs('modal-close').focus();
    renderAnalyticsUI();
  }
  function closeModal() {
    if(!modalOpen || (modalKind==='choice' && game.pendingChoice))return;
    // 닫기 / 바깥 클릭 / ESC / 확인 버튼 모두 '확인한 버전'으로 처리합니다.
    if(modalKind==='patch-notes') markPatchSeen();
    modalKind=null;
    qs('modal-backdrop').hidden=true;
    document.body.style.overflow='';
    modalOpen=false;
    qs('modal-body').innerHTML='';
    qs('modal-close').hidden=false;
    if(previousFocus && typeof previousFocus.focus==='function')previousFocus.focus();
    renderAnalyticsUI();
    // 선택형 이벤트/진화 팝업 종료 후, 대기 중인 업데이트 안내를 보여 줍니다.
    queueMicrotask(()=>{
      if(queuedPatchOnLaunch && !modalOpen && !game.pendingChoice) {
        queuedPatchOnLaunch=false;showPatchNotes();
      }
      if(!modalOpen) scheduleAchievementNotices();
    });
  }
  function markPatchSeen() {
    try { localStorage.setItem(PATCH_SEEN_KEY, B.version); }
    catch(error) { console.warn('패치노트 확인 기록 저장 실패:',error); }
  }

  function allReleaseNotes() {
    const versions=[B.releaseNotes,...(B.releaseNotesHistory||[])].filter(note=>note && note.version);
    const unique=new Map();
    for(const note of versions) if(!unique.has(note.version))unique.set(note.version,note);
    return [...unique.values()].sort((a,b)=>{
      const av=a.version.split('.').map(Number),bv=b.version.split('.').map(Number);
      for(let i=0;i<3;i++)if((bv[i]||0)!==(av[i]||0))return (bv[i]||0)-(av[i]||0);
      return 0;
    });
  }
  function showPatchNotes(notes=B.releaseNotes, fromArchive=false) {
    if(!notes || !notes.version)return;
    const sections=(notes.sections||[]).map(section=>
      `<section class="patch-section"><h3>${escapeHTML(section.heading)}</h3><ul>${(section.items||[]).map(item=>`<li>${escapeHTML(item)}</li>`).join('')}</ul></section>`
    ).join('');
    showModal(`<p class="modal-eyebrow">${fromArchive?'UPDATE HISTORY':"WHAT'S NEW"}</p>
      <div class="patch-version-pill">v${escapeHTML(notes.version)} 업데이트</div>
      <h2 id="modal-title">${escapeHTML(notes.title)}</h2>
      <span class="patch-date">${escapeHTML(notes.date||'출시일 미기록')}</span>
      <p class="patch-summary">${escapeHTML(notes.summary)}</p>
      <div class="patch-notes-list">${sections}</div>
      <div class="modal-buttons">${fromArchive?'<button type="button" class="modal-secondary" id="patch-back-history">전체 업데이트 기록으로</button>':''}<button type="button" class="modal-primary" id="patch-notes-confirm">확인하고 게임하기</button></div>`, fromArchive?'patch-history-detail':'patch-notes');
    qs('patch-notes-confirm').addEventListener('click',closeModal);
    if(fromArchive)qs('patch-back-history').addEventListener('click',showPatchNotesArchive);
  }
  function showPatchNotesArchive() {
    if(game.pendingChoice)return;
    const cards=allReleaseNotes().map(note=>`<button class="patch-archive-item" type="button" data-patch-version="${escapeHTML(note.version)}">
      <span><strong>v${escapeHTML(note.version)} · ${escapeHTML(note.title)}</strong><span>${escapeHTML(note.summary)}</span></span>
      <span class="patch-archive-arrow" aria-hidden="true">›</span>
    </button>`).join('');
    showModal(`<p class="modal-eyebrow">ANT NEST ARCHIVE</p><h2 id="modal-title">전체 업데이트 기록</h2>
      <p class="modal-subtitle">가장 최근 업데이트부터 이전 패치노트까지 확인할 수 있습니다.</p>
      <div class="patch-archive">${cards}</div>
      <div class="modal-buttons"><button class="modal-secondary" type="button" id="patch-archive-close">닫기</button></div>`, 'patch-history');
    qs('modal-body').querySelectorAll('[data-patch-version]').forEach(button=>button.addEventListener('click',()=>{
      const note=allReleaseNotes().find(n=>n.version===button.dataset.patchVersion);
      if(note)showPatchNotes(note,true);
    }));
    qs('patch-archive-close').addEventListener('click',closeModal);
  }

  function showPatchNotesOnLaunch() {
    try {
      const seen=localStorage.getItem(PATCH_SEEN_KEY);
      if(seen===B.version) return;
      // 완전 신규 이용자에겐 패치노트 대신 튜토리얼을 먼저 보여줍니다.
      if(!hadExistingSaveAtLaunch) { markPatchSeen(); return; }
      if(game.pendingChoice || modalOpen) { queuedPatchOnLaunch=true; return; }
      showPatchNotes();
    } catch(error) { console.warn('패치노트 자동 표시 확인 실패:',error); }
  }

  function recordSummary(r){
    return `<div class="result-stats">
      <div class="result-stat"><small>당근 사용</small><strong>${r.carrotCount}회</strong></div>
      <div class="result-stat"><small>채찍 사용</small><strong>${r.whipCount}회</strong></div>
      <div class="result-stat"><small>채찍 비율</small><strong>${percent(r.whipCount/Math.max(1,r.carrotCount+r.whipCount))}</strong></div>
      <div class="result-stat"><small>돌발 이벤트</small><strong>${r.eventCount}회</strong></div>
      <div class="result-stat"><small>최종 의욕</small><strong>${r.stats.motivation}</strong></div>
      <div class="result-stat"><small>최종 스트레스 / 나태함</small><strong>${r.stats.stress} / ${r.stats.laziness}</strong></div>
    </div>`;
  }
  function showEvolutionResult(record) {
    if(!record)return;
    const type=B.types[record.type];
    showModal(`<p class="modal-eyebrow">✦ FIRST EVOLUTION ✦</p><h2 id="modal-title">${type.name}</h2><p class="modal-subtitle">LV.10 최초 진화에 성공했어요!</p>
      <div class="evolution-portrait" id="modal-portrait"></div>
      <div class="evolution-quote">“${type.quote}”</div>
      <div class="passive-chip"><strong>✦ 고유 패시브 · ${type.passive}</strong><br>${type.description}<br><small>패시브 효과는 LV.20 확장 버전부터 적용 예정</small></div>
      ${recordSummary(record)}
      <div class="modal-buttons"><button class="modal-primary" id="modal-new-ant" type="button">새로운 개미 키우기</button><button class="modal-secondary" id="modal-keep" type="button">지금 결과 더 살펴보기</button></div>`);
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    clone.dataset.evolution=record.type;
    clone.dataset.mood='happy';
    qs('modal-portrait').appendChild(clone);
    qs('modal-new-ant').addEventListener('click',()=>{closeModal();confirmNewAnt();});
    qs('modal-keep').addEventListener('click',closeModal);
  }
  function showRecordDetails(id) {
    const record=game.records.find(r=>r.id===id);
    if(!record)return;
    const type=B.types[record.type];
    showModal(`<p class="modal-eyebrow">ANT NEST ARCHIVE</p><h2 id="modal-title">${type.name}</h2><p class="modal-subtitle">${dateLabel(record.timestamp)} · LV.${record.level} 진화 완료</p>
      <div class="evolution-portrait" id="modal-portrait"></div><div class="passive-chip"><strong>✦ ${type.passive}</strong><br>${type.description}</div>
      ${recordSummary(record)}<p class="modal-subtitle">총 획득 경험치 ${record.totalExp} EXP · 누적 행동 ${record.carrotCount+record.whipCount}회 · 밸런스 v${escapeHTML(record.balanceVersion||'0.1.0')}</p>
      <div class="modal-buttons"><button type="button" class="modal-primary" id="record-close">기록 닫기</button></div>`);
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    clone.dataset.evolution=record.type;clone.dataset.mood='happy';
    qs('modal-portrait').appendChild(clone);
    qs('record-close').addEventListener('click',closeModal);
  }
  function confirmNewAnt() {
    showModal(`<p class="modal-eyebrow">A NEW BEGINNING</p><h2 id="modal-title">새 개미를 키울까요?</h2><p class="modal-subtitle">현재 진화 결과는 이미 기록에 저장되었습니다. 새 개미는 LV.1에서 출발하며 이전 육성 기록은 그대로 남습니다.</p>
      <div class="modal-info">이전에 모은 개미 기록: <strong>${game.records.length}개</strong><br>시작 능력치: 의욕 60 · 스트레스 20 · 나태함 10</div>
      <div class="modal-buttons"><button class="modal-primary" id="confirm-new-ant" type="button">새 개미 만나기</button><button class="modal-secondary" id="cancel-new-ant" type="button">취소</button></div>`);
    qs('confirm-new-ant').addEventListener('click',()=>{
      const records=game.records;
      const settings=game.settings;
      const unlockedAchievements=game.unlockedAchievements;
      const decor={unlocked:[...game.decor.unlocked],equipped:{...game.decor.equipped}};
      game=freshState();game.records=records;game.settings=settings;game.unlockedAchievements=unlockedAchievements;game.decor=decor;game.tutorialCompleted=true;
      saveState();closeModal();showScreen('game');render();toast('새로운 신입 개미가 찾아왔어요!');
    });
    qs('cancel-new-ant').addEventListener('click',closeModal);
  }
  function showTutorialReview() {
    showModal(`<p class="modal-eyebrow">HOW TO PLAY</p><h2 id="modal-title">개미 키우기 안내</h2>
      <p class="modal-subtitle">현재 개미는 진화를 마쳤기 때문에 체험 행동 대신 안내 내용을 보여드립니다. 새 개미로 시작하면 다시 육성할 수 있습니다.</p>
      <div class="modal-info"><strong>1. 당근</strong> · 의욕 +15, 스트레스 −10, 나태함 +5<br>
      <strong>2. 채찍</strong> · 경험치 획득, 의욕 −5, 스트레스 +15, 나태함 −5<br>
      <strong>3. 상태 관리</strong> · 의욕·스트레스·나태함이 성장 효율 및 이벤트 확률에 영향<br>
      <strong>추가 회복</strong> · 행동 직전 스트레스 60 이상: 당근 스트레스 −10 추가 / 나태함 60 이상: 채찍 나태함 −5 추가<br>
      <strong>4. 최초 진화</strong> · LV.10에서 당근/채찍의 누적 비율로 3종 진화</div>
      <div class="modal-buttons"><button class="modal-primary" id="tutorial-review-close" type="button">확인</button></div>`);
    qs('tutorial-review-close').addEventListener('click',closeModal);
  }

  function confirmReset() {
    showModal(`<p class="modal-eyebrow">DATA RESET</p><h2 id="modal-title">정말 초기화할까요?</h2>
      <p class="modal-subtitle">현재 육성과 모든 진화 기록을 완전히 지웁니다. 삭제한 내용은 복구할 수 없습니다.</p>
      <div class="modal-buttons"><button type="button" class="modal-primary danger" id="confirm-reset">모든 기록 삭제</button><button type="button" class="modal-secondary" id="cancel-reset">취소</button></div>`);
    qs('confirm-reset').addEventListener('click',()=>{
      try{localStorage.removeItem(KEY);storageCorrupt=false;}catch(error){console.warn(error);}
      game=freshState();achievementNoticeQueue=[];saveState();closeModal();showScreen('game');render();toast('게임이 초기화되었습니다.');
    });
    qs('cancel-reset').addEventListener('click',closeModal);
  }

  function bindEvents() {
    qs('carrot-button').addEventListener('click',()=>playAction('carrot'));
    qs('whip-button').addEventListener('click',()=>playAction('whip'));
    qs('view-finish').addEventListener('click',()=>showEvolutionResult(findFinishRecord()));
    qs('new-ant-button').addEventListener('click',confirmNewAnt);
    qs('tutorial-skip').addEventListener('click',skipTutorial);
    qs('tutorial-next').addEventListener('click',advanceTutorial);
    qs('header-settings').addEventListener('click',()=>{if(!game.pendingChoice)showScreen('settings');});
    document.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>{if(!game.pendingChoice) showScreen(button.dataset.screen);}));
    qs('decorations-grid').addEventListener('click',event=>{
      const button=event.target.closest('[data-decor-id]');
      if(button)toggleDecoration(button.dataset.decorId);
    });
    qs('record-list').addEventListener('click',event=>{
      const button=event.target.closest('[data-record-id]');
      if(button)showRecordDetails(button.dataset.recordId);
    });
    qs('sound-toggle').addEventListener('change',event=>{
      game.settings.soundEnabled=event.target.checked;
      saveState();renderSettings();if(game.settings.soundEnabled)playSound('positive');
    });
    qs('sound-volume').addEventListener('input',event=>{
      game.settings.volume=Number(event.target.value);
      qs('sound-volume-text').textContent=`${game.settings.volume}%`;
      saveState();
    });
    qs('replay-tutorial').addEventListener('click',()=>{
      if(game.finished) {
        showTutorialReview();
        return;
      }
      game.tutorialCompleted=false;game.tutorialStep=0;
      saveState();render();showScreen('game');toast('튜토리얼을 다시 시작합니다.');
    });
    qs('view-patch-notes').addEventListener('click',()=>showPatchNotes());
    qs('view-patch-history').addEventListener('click',showPatchNotesArchive);
    qs('analytics-consent').addEventListener('change',event=>setAnalyticsChoice(event.target.checked));
    qs('analytics-allow').addEventListener('click',()=>setAnalyticsChoice(true));
    qs('analytics-deny').addEventListener('click',()=>setAnalyticsChoice(false));
    qs('reset-button').addEventListener('click',confirmReset);
    qs('modal-close').addEventListener('click',closeModal);
    qs('modal-backdrop').addEventListener('click',e=>{if(e.target===qs('modal-backdrop'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)closeModal();});
    window.addEventListener('storage',e=>{if(e.key!==KEY)return;game=loadState();render();toast('다른 탭에서 변경된 저장 데이터를 불러왔습니다.');});
  }
  bindEvents();
  startAnalytics();
  render();
  saveState();
  // 미완료 선택이 있으면 제일 먼저 복구합니다. 패치노트는 선택 종료 이후로 미룹니다.
  if(game.pendingChoice) showChoiceEvent();
  showPatchNotesOnLaunch();
})();