/*
 * 개미 키우기 MVP v0.6
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
  const PRE_V05_BACKUP_KEY = 'little-ant-game-before-v0.5';
  const PRE_V06_BACKUP_KEY = 'little-ant-game-before-v0.6';
  // v0.1~v0.4 원본 세이브를 v0.5로 최초 이전하기 전에 딱 한 번 백업합니다.
  function preserveOriginalSave() {
    try {
      const original=localStorage.getItem(KEY);
      if(!original || localStorage.getItem(PRE_V05_BACKUP_KEY))return;
      const parsed=JSON.parse(original);
      if(parsed && parsed.schemaVersion===1 && !Object.prototype.hasOwnProperty.call(parsed,'phase'))
        localStorage.setItem(PRE_V05_BACKUP_KEY,original);
    } catch(_error) { /* 백업 실패 시 원본 데이터는 계속 보호됩니다. */ }
  }
  preserveOriginalSave();
  // v0.6 이전 원본 데이터는 별도 슬롯에 보관합니다. 기존 백업에는 손대지 않습니다.
  try {
    const raw=localStorage.getItem(KEY);
    if(raw && !localStorage.getItem(PRE_V06_BACKUP_KEY)) {
      const obj=JSON.parse(raw);
      if(obj?.schemaVersion===1 && !obj.expedition)localStorage.setItem(PRE_V06_BACKUP_KEY,raw);
    }
  } catch(_error) { /* 백업 실패로 인해 원본 저장을 변경하지 않습니다. */ }
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
  const ALL_DECOR = [...B.decorations,...B.craftingItems];
  const RESOURCE_IDS = B.resources.map(item=>item.id);
  const validCraft = id => B.craftingItems.some(item=>item.id===id);
  const SECOND_TYPES = B.secondEvolution.types;
  const SECOND_THRESH = B.secondEvolution.threshold;
  const secondEvolutionIds = Object.keys(SECOND_TYPES);
  const validFirst = type => Boolean(B.types[type]);
  const validSecond = (type,parent) => Boolean(SECOND_TYPES[type] && SECOND_TYPES[type].parent===parent);
  const tutorial = [
    { title:'먼저 당근을 주세요!', description:'당근은 의욕을 높이고 스트레스를 줄여 줍니다. 대신 나태함은 조금 올라가요.', button:null },
    { title:'이제 채찍으로 훈련!', description:'채찍은 경험치를 주지만 스트레스도 높여요. 실제 개미를 때리는 것이 아닌 훈련을 뜻합니다.', button:null },
    { title:'세 가지 상태를 확인하세요!', description:'의욕이 높고 스트레스·나태함이 낮을수록 훈련에 유리해요. 돌발 이벤트 확률도 상태에 따라 달라져요.', button:'이해했어요' },
    { title:'LV.10과 LV.20, 두 번의 진화!', description:'LV.10에서 첫 진화와 고유 패시브를 얻고, LV.20에서 두 번째 진화를 완성해요. 계속 키워 보세요!', button:'육성 시작' }
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
      phase:'phase1', firstEvolution:null, stage2Counters:{carrot:0,whip:0}, secondEvolution:null,
      pendingChoice:null, unlockedAchievements:[],
      decor:{unlocked:[],equipped:{floor:null,wall:null,light:null}},
      expedition:{tickets:0,ticks:0,inventory:{food:0,wood:0,crystal:0},crafted:[],trips:[],totalTrips:0},
      recentActions:[],
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
      // v0.5 선택 이벤트는 행동 횟수만 먼저 증가하고, 선택 후 완결됩니다.
      // 이전 세이브에서 진행 중인 선택은 원정권으로 아직 환산하지 않습니다.
      const legacyCompletedActions=Math.max(0,num(prev.carrotCount,0)+num(prev.whipCount,0)-
        (prev.pendingChoice && !prev.finished ? 1 : 0));
      const records = Array.isArray(prev.records) ? prev.records.filter(r => r && validTypes.includes(r.type) && typeof r.id === 'string').map(r=>({
        id:r.id.slice(0,96),type:r.type,
        timestamp:num(r.timestamp,Date.now()),
        level:r.level===20 && validSecond(r.secondEvolution,r.type) ? 20 : 10,
        secondEvolution:validSecond(r.secondEvolution,r.type) ? r.secondEvolution : null,
        firstEvolution:r.firstEvolution && r.firstEvolution.type===r.type ? {
          type:r.type,
          reachedAt:num(r.firstEvolution.reachedAt,0),
          carrotCountAtFirst:num(r.firstEvolution.carrotCountAtFirst,0),
          whipCountAtFirst:num(r.firstEvolution.whipCountAtFirst,0),
          statsAtFirst:{motivation:clamp(r.firstEvolution.statsAtFirst?.motivation ?? 60),stress:clamp(r.firstEvolution.statsAtFirst?.stress ?? 20),laziness:clamp(r.firstEvolution.statsAtFirst?.laziness ?? 10)}
        } : null,
        stage2Counters:{carrot:num(r.stage2Counters?.carrot,0),whip:num(r.stage2Counters?.whip,0)},
        stats: {motivation:clamp(r.stats?.motivation ?? 60),stress:clamp(r.stats?.stress ?? 20),laziness:clamp(r.stats?.laziness ?? 10)},
        carrotCount:num(r.carrotCount,0),whipCount:num(r.whipCount,0),
        totalExp:num(r.totalExp,0),eventCount:num(r.eventCount,0),
        balanceVersion:typeof r.balanceVersion==='string'?r.balanceVersion.slice(0,24):'0.1.0',
        eventsByType:r.eventsByType&&typeof r.eventsByType==='object'?r.eventsByType:{}
      })) : [];
      return {
        ...base,
        level: Math.max(1,num(prev.level,1,B.maxLevel)), exp:num(prev.exp,0,10000000),
        // 구버전 LV.10 완료는 확장하지 않고 영구 완료 기록으로 보존합니다.
        phase:prev.finished ? (validSecond(prev.secondEvolution,prev.evolution)?'completed':'legacyComplete') :
          (validFirst(prev.firstEvolution?.type) && prev.level>=10 ? 'phase2':'phase1'),
        firstEvolution:validFirst(prev.firstEvolution?.type) && prev.firstEvolution?.type===prev.evolution ? {
          type:prev.firstEvolution.type,
          reachedAt:num(prev.firstEvolution.reachedAt,0),
          carrotCountAtFirst:num(prev.firstEvolution.carrotCountAtFirst,0),
          whipCountAtFirst:num(prev.firstEvolution.whipCountAtFirst,0),
          statsAtFirst:{motivation:clamp(prev.firstEvolution.statsAtFirst?.motivation ?? 60),stress:clamp(prev.firstEvolution.statsAtFirst?.stress ?? 20),laziness:clamp(prev.firstEvolution.statsAtFirst?.laziness ?? 10)},
          acknowledged:prev.firstEvolution.acknowledged!==false
        } : null,
        stage2Counters:{carrot:num(prev.stage2Counters?.carrot,0),whip:num(prev.stage2Counters?.whip,0)},
        secondEvolution:validSecond(prev.secondEvolution,prev.evolution)?prev.secondEvolution:null,
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
            [...new Set(prev.decor.unlocked.filter(id=>typeof id==='string' && ALL_DECOR.some(d=>d.id===id)))]:[],
          equipped:Object.fromEntries(['floor','wall','light'].map(slot=>[
            slot, ALL_DECOR.some(d=>d.id===prev.decor?.equipped?.[slot] && d.slot===slot) ? prev.decor.equipped[slot] : null
          ]))
        },
        expedition: {
          tickets: prev.expedition ? num(prev.expedition.tickets,0,B.expeditions.maxTickets) :
            Math.min(B.expeditions.maxTickets,Math.floor(legacyCompletedActions/B.expeditions.actionsPerTicket)),
          ticks: prev.expedition ? num(prev.expedition.ticks,0,B.expeditions.actionsPerTicket-1) :
            legacyCompletedActions%B.expeditions.actionsPerTicket,
          inventory:Object.fromEntries(RESOURCE_IDS.map(id=>[id,num(prev.expedition?.inventory?.[id],0,999999)])),
          crafted:Array.isArray(prev.expedition?.crafted) ?
            [...new Set(prev.expedition.crafted)].filter(validCraft):[],
          trips:Array.isArray(prev.expedition?.trips) ? prev.expedition.trips.slice(0,12).filter(t=>
            t && B.expeditions.regions.some(region=>region.id===t.region) && RESOURCE_IDS.includes(t.resource) &&
            Number.isFinite(t.amount) && t.amount>0).map(t=>({
              region:t.region,resource:t.resource,amount:num(t.amount,1,1000),at:num(t.at,Date.now())
            })):[],
          totalTrips:num(prev.expedition?.totalTrips,0)
        },
        recentActions:Array.isArray(prev.recentActions) ? prev.recentActions.slice(0,12).filter(item=>
          item && ['carrot','whip'].includes(item.action) && Number.isFinite(item.gained)).map(item=>({
            action:item.action,gained:num(item.gained,0,100000),at:num(item.at,Date.now()),eventId: B.events[item.eventId]?item.eventId:null
          })):[],
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
  // 제작 상태를 별도 저장하되 기존 장식 슬롯과 호환합니다.
  for(const id of game.expedition.crafted)if(!game.decor.unlocked.includes(id))game.decor.unlocked.push(id);
  let activeScreen = 'game';
  let autoTimer = null;
  let autoActions = 0;
  let autoMode = 'balanced';
  let lastExploreClick = 0;
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
  function stage2Ratio() {
    const total=game.stage2Counters.carrot+game.stage2Counters.whip;
    return total ? game.stage2Counters.whip/total : 0;
  }
  function secondTypeFor(parent,whipRatio) {
    return secondEvolutionIds.find(id=>SECOND_TYPES[id].parent===parent &&
      SECOND_TYPES[id].branch===(whipRatio<SECOND_THRESH?'A':'B'))||null;
  }
  function secondEvolutionType() { return secondTypeFor(game.evolution,stage2Ratio()); }
  function growthRating(stats) {
    if(stats.motivation>=60 && stats.stress<=50 && stats.laziness<=50)return '균형 잡힌 성장을 이뤘습니다.';
    if(stats.stress>=85 || stats.laziness>=85 || stats.motivation<=15)return '험난한 여정 끝에 진화를 달성했습니다.';
    return '꾸준한 선택이 새로운 모습으로 이어졌습니다.';
  }
  function passiveDescription(type) {
    return {easy:'당근 사용 시 스트레스 −5 추가',genius:'긍정 이벤트의 유익한 효과 +20%',diligent:'채찍 EXP +15%'}[type]||'';
  }
  function positiveBenefit(value) {
    return value<0 ? Math.round(value*B.passive.genius.positiveEventBenefitMultiplier) : value>0 ? Math.round(value*B.passive.genius.positiveEventBenefitMultiplier) : value;
  }
  // 오직 긍정 이벤트에서 유익한 변화만 강화합니다.
  function eventStatDelta(event,stat,raw) {
    if(game.phase!=='phase2' || game.evolution!=='genius' || event.kind!=='positive')return raw;
    const beneficial=(stat==='motivation' && raw>0) || ((stat==='stress'||stat==='laziness') && raw<0);
    return beneficial?positiveBenefit(raw):raw;
  }

  function autoChoice() {
    const {motivation,stress,laziness}=game.stats;
    if(autoMode==='growth')return stress>=70 || motivation<=35?'carrot':'whip';
    if(autoMode==='recover')return stress>=38 || motivation<72?'carrot':'whip';
    if(stress>=55 || motivation<=48)return 'carrot';
    if(laziness>=60)return 'whip';
    return stress>=35?'carrot':'whip';
  }
  function stopAuto(reason='') {
    if(autoTimer!==null){clearInterval(autoTimer);autoTimer=null;}
    if(reason)qs('auto-status').textContent=reason;
    renderAutoCare();
  }
  function runAutoTick() {
    if(document.hidden || activeScreen!=='game' || game.finished || game.pendingChoice || modalOpen || !game.tutorialCompleted) {
      stopAuto('자동 육성 중단 · 게임 화면 또는 이벤트 상태를 확인하세요.');return;
    }
    if(autoActions>=B.autoCare.maxActions){stopAuto('자동 육성 25회 완료 · 다시 시작할 수 있습니다.');return;}
    const before=game.carrotCount+game.whipCount;
    playAction(autoChoice());
    if(game.carrotCount+game.whipCount>before)autoActions++;
    if(autoTimer!==null) {
      qs('auto-status').textContent=`자동 육성 중 · ${autoActions}/${B.autoCare.maxActions}회 · 선택 이벤트에서 정지`;
      if(autoActions>=B.autoCare.maxActions)stopAuto('자동 육성 25회 완료 · 다시 시작할 수 있습니다.');
    }
  }
  function toggleAutoCare() {
    if(autoTimer!==null){stopAuto('사용자가 자동 육성을 중지했습니다.');return;}
    if(game.finished || game.pendingChoice || modalOpen || !game.tutorialCompleted){
      qs('auto-status').textContent='튜토리얼·진화·이벤트가 끝난 뒤 시작할 수 있습니다.';return;
    }
    autoMode=qs('auto-mode').value;
    autoActions=0;
    autoTimer=setInterval(runAutoTick,B.autoCare.intervalMs);
    qs('auto-status').textContent='자동 육성 준비 · 다음 행동부터 시작';
    renderAutoCare();
  }
  function renderAutoCare() {
    qs('auto-toggle').textContent=autoTimer!==null?'자동 육성 중지':'자동 육성 시작';
    qs('auto-toggle').disabled=autoTimer===null && (game.finished || Boolean(game.pendingChoice) || !game.tutorialCompleted);
    qs('auto-mode').disabled=autoTimer!==null;
  }
  function renderRecentActions() {
    qs('recent-action-list').innerHTML=game.recentActions.length ? game.recentActions.slice(0,8).map(item=>
      `<div class="recent-action-row"><span>${item.action==='carrot'?'🥕 당근':'⚡ 채찍'}</span><span>${item.action==='whip'?`EXP +${item.gained}`:'상태 회복'}${item.eventId?' · '+escapeHTML(B.events[item.eventId]?.name||'이벤트'):''}</span></div>`
    ).join(''):'아직 기록이 없습니다.';
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
    const stage2=game.phase==='phase2';
    const baseExp=stage2 ? B.phaseTwoBaseExp : changes.baseExp;
    let gained=action==='whip' ? Math.max(1,Math.round(baseExp*efficiency(before))) : 0;
    if(stage2 && game.evolution==='diligent' && action==='whip') {
      gained=Math.max(1,Math.round(gained*B.passive.diligent.whipExpMultiplier));
    }
    for(const key of ['motivation','stress','laziness']) game.stats[key]=clamp(game.stats[key]+changes[key]);
    if(recoveryBonus) game.stats[recovery.stat]=clamp(game.stats[recovery.stat]+recovery.extra);
    if(stage2 && game.evolution==='easy' && action==='carrot')
      game.stats.stress=clamp(game.stats.stress+B.passive.easy.extraCarrotStressRecovery);
    if(action==='carrot') game.carrotCount++; else game.whipCount++;
    if(stage2) game.stage2Counters[action]++;

    if(eventId) {
      const event=B.events[eventId];
      if(event.expMultiplier && action==='whip') {
        const multiplier=(stage2 && game.evolution==='genius' && event.kind==='positive') ?
          1+(event.expMultiplier-1)*B.passive.genius.positiveEventBenefitMultiplier : event.expMultiplier;
        gained=Math.max(1,Math.round(gained*multiplier));
      }
      if(event.cancelExp) gained=0;
      for(const key of ['motivation','stress','laziness']) if(event[key])
        game.stats[key]=clamp(game.stats[key]+eventStatDelta(event,key,event[key]));
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
    let firstEvolutionReached=false;
    while(game.level<B.maxLevel && game.exp>=B.expRequired(game.level)) {
      game.exp-=B.expRequired(game.level);
      game.level++;
      if(game.level===10 && game.phase==='phase1') {
        finishFirstEvolution(); firstEvolutionReached=true;
      }
    }
    const didLevelUp=game.level>priorLevel;
    if(game.level>=B.maxLevel) {
      game.exp=0;
      finishFinalEvolution();
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
    if(didLevelUp && !game.finished) game.lastSpeech=firstEvolutionReached ?
      `LV.10 첫 진화! ${B.types[game.evolution].name}가 되었어!` : `야호! LV.${game.level} 달성!`;

    let feedback=action==='carrot'?'당근: 의욕 ↑ · 스트레스 ↓ · 나태함 ↑':`채찍: EXP +${gained} · 스트레스 ↑`;
    if(recoveryBonus) feedback+=action==='carrot'?' · 스트레스 집중 회복(-10 추가)':' · 나태함 집중 교정(-5 추가)';
    if(eventId) feedback+=` · 돌발 이벤트 · ${B.events[eventId].name}`;
    if(choiceLabel) feedback+=` · ${choiceLabel}`;
    if(didLevelUp && !game.finished) feedback+=firstEvolutionReached?' · LV.10 첫 진화 달성!':` · LV.${game.level} 레벨업!`;
    if(game.finished) feedback='LV.20 두 번째 진화 달성! 결과를 확인해 보세요.';
    game.lastFeedback=feedback;
    game.recentActions.unshift({action,gained,eventId:eventId||null,at:Date.now()});
    game.recentActions=game.recentActions.slice(0,12);
    // 6개의 완료된 육성 행동마다 원정권 하나. 미완료 선택 이벤트는 제외합니다.
    if(game.expedition.tickets<B.expeditions.maxTickets) {
      game.expedition.ticks++;
      if(game.expedition.ticks>=B.expeditions.actionsPerTicket){
        game.expedition.ticks=0;
        game.expedition.tickets++;
      }
    }
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
    } else if(firstEvolutionReached) {
      playSound('evolution');
      showFirstEvolutionResult();
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
    const event=B.events[pending.eventId];
    for(const [stat,delta] of Object.entries(choice.effects))
      game.stats[stat]=clamp(game.stats[stat]+eventStatDelta(event,stat,delta));
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
    if(game.phase==='phase2' && validFirst(game.evolution))types.add(game.evolution);
    return {
      ACH01:totalActions>=1, ACH02:records.length>0 || game.phase==='phase2',
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
      if(game.phase==='phase2' && validFirst(game.evolution)) {
        career.evolutions++;
        if(game.evolution==='genius')career.genius++;
      }
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
    for(const id of game.expedition.crafted)unlocked.add(id);
    game.decor.unlocked=[...unlocked];
    // 깨진 저장 상태에 고정된 잠금 장식이 남아 있을 경우 화면에 나타내지 않습니다.
    for(const slot of ['floor','wall','light']) {
      if(!unlocked.has(game.decor.equipped[slot])) game.decor.equipped[slot]=null;
    }
    return newly;
  }
  const resourceCount = id => game.expedition.inventory[id]||0;
  const canExplore = region => game.level>=region.minLevel && game.expedition.tickets>0 && !game.pendingChoice && !modalOpen;
  function exploreRegion(regionId) {
    const region=B.expeditions.regions.find(r=>r.id===regionId);
    if(!region || !canExplore(region))return;
    // 모바일 연속 탭으로 원정권이 한꺼번에 소모되는 것을 막습니다.
    if(Date.now()-lastExploreClick<450)return;
    lastExploreClick=Date.now();
    const bonus=Math.random()<region.bonusChance?region.bonus:0;
    const amount=region.reward+bonus;
    game.expedition.tickets--;
    game.expedition.inventory[region.main]=Math.min(999999,resourceCount(region.main)+amount);
    game.expedition.totalTrips++;
    game.expedition.trips.unshift({region:region.id,resource:region.main,amount,at:Date.now()});
    game.expedition.trips=game.expedition.trips.slice(0,12);
    saveState();render();
    toast(`${region.name} 원정 완료 · ${B.resources.find(r=>r.id===region.main).name} +${amount}${bonus?' · 특별 발견!':''}`);
  }
  function canCraft(item) {
    return !game.expedition.crafted.includes(item.id) && Object.entries(item.cost).every(([id,amount])=>resourceCount(id)>=amount);
  }
  function craftItem(id) {
    const item=B.craftingItems.find(x=>x.id===id);
    if(!item || modalOpen || game.pendingChoice || !canCraft(item))return;
    for(const [resource,amount] of Object.entries(item.cost))game.expedition.inventory[resource]-=amount;
    game.expedition.crafted.push(id);
    if(!game.decor.unlocked.includes(id))game.decor.unlocked.push(id);
    saveState();render();toast(`제작 성공 · ${item.name}! 꾸미기에서 배치하세요.`);
  }
  function renderExpedition() {
    const exp=game.expedition;
    qs('expedition-tickets').textContent=`${exp.tickets} / ${B.expeditions.maxTickets}`;
    qs('expedition-next-ticket').textContent=exp.tickets===B.expeditions.maxTickets?
      '원정권 최대 보유 · 더 이상 쌓이지 않습니다.':`다음 원정권까지 ${B.expeditions.actionsPerTicket-exp.ticks}회 육성 행동`;
    qs('resource-wallet').innerHTML=B.resources.map(r=>
      `<div class="resource-pill"><span>${r.icon} ${r.name}</span><strong>${resourceCount(r.id).toLocaleString('ko-KR')}</strong></div>`
    ).join('');
    qs('expedition-regions').innerHTML=B.expeditions.regions.map(region=>{
      const opened=game.level>=region.minLevel;
      const allowed=opened && exp.tickets>0 && !game.pendingChoice && !modalOpen;
      return `<article class="region-card ${opened?'':'region-locked'}"><span class="region-icon">${region.icon}</span>
        <div class="region-content"><strong>${escapeHTML(region.name)} <small>LV.${region.minLevel}+</small></strong>
          <p>${escapeHTML(region.description)}</p><small>원정권 1장 · ${escapeHTML(B.resources.find(r=>r.id===region.main).name)} ${region.reward}~${region.reward+region.bonus}개</small></div>
        <button class="mini-button" data-expedition="${region.id}" type="button" ${allowed?'':'disabled'}>${!opened?'잠김':exp.tickets?'탐험':'원정권 부족'}</button></article>`;
    }).join('');
    qs('craft-progress').textContent=`${exp.crafted.length} / ${B.craftingItems.length} 제작`;
    qs('craft-grid').innerHTML=B.craftingItems.map(item=>{
      const crafted=exp.crafted.includes(item.id);
      const costs=Object.entries(item.cost).map(([id,need])=>{
        const resource=B.resources.find(x=>x.id===id);
        return `${resource.icon} ${resource.name} ${resourceCount(id)}/${need}`;
      }).join(' · ');
      return `<article class="craft-card"><span class="craft-icon">${item.icon}</span>
        <div class="craft-content"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.desc)}</small>
          <small class="craft-cost">${costs}</small></div>
        <button class="mini-button" data-craft="${item.id}" type="button" ${!crafted && canCraft(item) && !game.pendingChoice && !modalOpen?'':'disabled'}>${crafted?'제작 완료':'제작'}</button></article>`;
    }).join('');
    qs('expedition-history').innerHTML=exp.trips.length?exp.trips.slice(0,6).map(t=>{
      const region=B.expeditions.regions.find(r=>r.id===t.region);
      const resource=B.resources.find(r=>r.id===t.resource);
      return `<div class="expedition-trip"><span>${region.icon} ${escapeHTML(region.name)}</span><strong>${resource.icon} +${t.amount}</strong></div>`;
    }).join(''):'아직 원정 기록이 없습니다.';
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
      const item=ALL_DECOR.find(d=>d.id===game.decor.equipped[slot] && d.slot===slot);
      const el=qs(`nest-${slot}-display`);
      el.textContent=item?.icon||'';
      el.title=item?.name||'';
    }
  }
  function renderDecorations() {
    const owned=new Set(game.decor.unlocked);
    qs('decor-count').textContent=`${owned.size} / ${ALL_DECOR.length}`;
    qs('decor-progress').style.width=`${Math.round(100*owned.size/ALL_DECOR.length)}%`;
    qs('nest-theme-caption').textContent=`현재 개미집 분위기: ${nestTheme().label}`;
    qs('decorations-grid').innerHTML=ALL_DECOR.map(item=>{
      const unlocked=owned.has(item.id);
      const equipped=game.decor.equipped[item.slot]===item.id;
      return `<article class="decor-card ${unlocked?'':'locked'} ${equipped?'equipped':''}">
        <span class="decor-icon" aria-hidden="true">${unlocked?escapeHTML(item.icon):'🔒'}</span>
        <div class="decor-info"><strong>${escapeHTML(item.name)}</strong>
          <small>${unlocked?escapeHTML(item.desc):validCraft(item.id)?'원정에서 재료를 모아 제작하세요':`해금 조건 · ${escapeHTML(item.hint)}`}</small>
          <span class="decor-slot">${{floor:'바닥',wall:'벽',light:'조명'}[item.slot]}</span></div>
        <button class="decor-action" type="button" data-decor-id="${escapeHTML(item.id)}" ${unlocked?'':'disabled'} aria-label="${escapeHTML(item.name)} ${equipped?'해제':unlocked?'배치':'잠김'}">${equipped?'해제':unlocked?'배치':'미해금'}</button>
      </article>`;
    }).join('');
  }
  function toggleDecoration(id) {
    if(modalOpen || game.pendingChoice || !game.decor.unlocked.includes(id))return;
    const item=ALL_DECOR.find(d=>d.id===id);
    if(!item)return;
    const equipped=game.decor.equipped[item.slot]===id;
    game.decor.equipped[item.slot]=equipped?null:id;
    saveState();render();
    toast(equipped?`${item.name} 장식을 해제했어요.`:`${item.name}을(를) 개미집에 배치했어요!`);
  }

  function finishFirstEvolution() {
    if(game.phase!=='phase1') return;
    const type=evolutionType();
    game.evolution=type;
    game.phase='phase2';
    game.firstEvolution={
      type,reachedAt:Date.now(),carrotCountAtFirst:game.carrotCount,
      whipCountAtFirst:game.whipCount,statsAtFirst:{...game.stats},acknowledged:false
    };
    game.stage2Counters={carrot:0,whip:0};
    game.tutorialCompleted=true;
  }
  function finishFinalEvolution() {
    if(game.finished || game.phase!=='phase2')return;
    const type=secondEvolutionType();
    if(!type)return;
    game.secondEvolution=type;
    game.finished=true;
    game.phase='completed';
    game.exp=0;
    const record={
      id:`ant-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp:Date.now(),type:game.evolution,secondEvolution:type,level:20,
      firstEvolution:{...game.firstEvolution,statsAtFirst:{...game.firstEvolution.statsAtFirst}},
      stage2Counters:{...game.stage2Counters},
      stats:{...game.stats},carrotCount:game.carrotCount,whipCount:game.whipCount,
      totalExp:game.totalExp,eventCount:game.eventCount,balanceVersion:B.version,
      eventsByType:{...game.eventsByType}
    };
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
    if(game.finished)return game.phase==='legacyComplete'?'✧ 첫 진화 완료':'✧ 두 번째 진화 완료';
    const tier=statusTier(game.stats);
    return {good:'☘ 기분 최고',normal:'☘ 평온한 상태',warn:'◈ 관리 필요',danger:'● 지친 상태'}[tier];
  }
  function render() {
    const firstName=B.types[game.evolution]?.name||'신입 개미';
    const secondName=SECOND_TYPES[game.secondEvolution]?.name;
    qs('ant-name').textContent=game.phase==='completed' && secondName ? secondName : game.phase==='phase1' ? '신입 개미' : firstName;
    qs('evolution-stage').textContent=game.phase==='phase1'?'첫 번째 여정':game.phase==='phase2'?'두 번째 여정':game.phase==='legacyComplete'?'첫 진화 달성':'두 번째 진화 달성';
    qs('growth-stage-label').textContent=game.phase==='phase1'?'첫 번째 성장 · LV.1~10':
      game.phase==='legacyComplete'?'구버전 육성 완료 · LV.10':'두 번째 성장 · LV.10~20';
    qs('level-badge').textContent=`LV. ${game.level}`;
    const required=game.finished?0:B.expRequired(game.level);
    qs('xp-text').textContent=game.finished?'MAX LEVEL':`${game.exp} / ${required} EXP`;
    qs('xp-fill').style.width=`${game.finished?100:Math.min(100,(game.exp/required)*100)}%`;
    qs('xp-progress').setAttribute('aria-valuenow',String(game.finished?100:Math.round(game.exp/required*100)));
    qs('evolution-hint').textContent=game.finished?'육성 완료':game.phase==='phase1'?'LV.10 첫 진화':'LV.20 두 번째 진화';
    qs('progress-narration').textContent=game.finished?'성장의 발자국 완성!':
      game.phase==='phase1'?`첫 진화까지 ${10-game.level}레벨`:`두 번째 진화까지 ${20-game.level}레벨`;
    qs('scene-status').textContent=`● ${B.eventTiers[statusTier(game.stats)].label} 상태`;
    qs('scene-action-text').textContent=game.finished?'새로운 가능성 발견':`${game.carrotCount+game.whipCount}번의 작은 선택`;
    qs('speech-bubble').textContent=game.lastSpeech;
    qs('mood-label').textContent=moodLabel();
    const ant=qs('ant-figure');
    ant.dataset.evolution=game.evolution||'newbie';
    ant.dataset.secondEvolution=game.secondEvolution||'none';
    const secondMark=qs('second-evolution-mark');
    secondMark.hidden=!game.secondEvolution;
    secondMark.textContent=SECOND_TYPES[game.secondEvolution]?.icon||'';
    secondMark.title=SECOND_TYPES[game.secondEvolution]?.name||'';
    ant.dataset.mood=reactionMood();
    ant.setAttribute('aria-label',`${qs('ant-name').textContent} 캐릭터`);
    const passive=qs('active-passive');
    passive.hidden=game.phase!=='phase2';
    if(game.phase==='phase2') {
      qs('passive-name').textContent=`${firstName} · ${B.types[game.evolution].passive}`;
      qs('passive-effect').textContent=passiveDescription(game.evolution);
    }
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
    renderAutoCare();
    renderRecentActions();
    renderExpedition();
    renderNestScene();
    renderDecorations();
    qs('finished-panel').hidden=!game.finished;
    if(game.finished) {
      qs('finished-name').textContent=game.phase==='completed'?secondName:firstName;
      qs('finished-caption').textContent=game.phase==='completed'?'두 번째 진화를 마쳤어요!':'첫 진화를 마쳤어요! (구버전 기록)';
    }
    renderTutorial();
    renderRecords();
    renderAchievements();
    renderSettings();
    showScreen(activeScreen,false);
  }
  function renderEvolutionGuide() {
    const inSecond=game.phase==='phase2' || game.phase==='completed';
    const count=inSecond ? game.stage2Counters.carrot+game.stage2Counters.whip : game.carrotCount+game.whipCount;
    const ratio=inSecond ? stage2Ratio() : getRatio();
    const type=inSecond ? secondEvolutionType() : evolutionType();
    const prediction=inSecond ? SECOND_TYPES[type]?.name : B.types[type]?.name;
    qs('guide-stage-label').textContent=inSecond?'LV.20 두 번째 진화':'LV.10 첫 진화';
    qs('guide-prediction').textContent=game.finished ?
      (game.phase==='completed'?`${SECOND_TYPES[game.secondEvolution]?.name||'최종 개미'} · 확정`:`${B.types[game.evolution]?.name||'태평 개미'} · 확정`) :
      count ? prediction||'아직 미정' : '아직 미정';
    qs('guide-ratio').textContent=count?`채찍 ${percent(ratio)}`:'행동 기록 없음';
    qs('guide-note').textContent=game.finished?'최종 진화가 확정되었습니다. 새 개미를 만나 또 다른 길을 찾아보세요.':
      inSecond?'LV.10 이후의 행동 비율만 두 번째 진화에 적용됩니다. 현재 예상은 바뀔 수 있습니다.':
        '첫 진화는 누적 행동 비율로 계산되며 LV.10까지 달라질 수 있습니다.';
    qs('guide-bar').dataset.phase=inSecond?'phase2':'phase1';
    qs('guide-bar').setAttribute('aria-label',count?`현재 채찍 비율 ${percent(ratio)}, 예상 진화 ${prediction}`:'아직 행동하지 않아 진화를 예측할 수 없습니다');
    qs('legend-easy').textContent=inSecond?'A 유형 <55%':'태평 ≤45%';
    qs('legend-genius').textContent=inSecond?'':'천재 45~55%';
    qs('legend-diligent').textContent=inSecond?'B 유형 ≥55%':'근면 ≥55%';
    const marker=qs('guide-marker');
    marker.hidden=!count;
    if(count)marker.style.left=`${Math.min(98,Math.max(2,ratio*100))}%`;
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
    const discovered=new Set(game.records.map(r=>r.type));
    if(game.phase==='phase2' && validFirst(game.evolution))discovered.add(game.evolution);
    qs('collection-count').textContent=`${discovered.size} / 3`;
    qs('collection-fill').style.width=`${100*discovered.size/3}%`;
    qs('record-count').textContent=`${game.records.length}개의 완료 기록`;
    qs('collection-grid').innerHTML=Object.entries(B.types).map(([type,info])=>{
      const count=game.records.filter(r=>r.type===type).length;
      const active=game.phase==='phase2' && game.evolution===type;
      return `<div class="collection-item ${count||active?'':'locked'}"><div class="collection-portrait">${count||active?portraitEmoji[type]:'?'}</div><h3>${count||active?info.name:'??? 개미'}</h3><p>${active?'현재 육성 중':count?`${count}번 발견`:'미발견'}</p></div>`;
    }).join('');
    const secondFound=new Set(game.records.filter(r=>validSecond(r.secondEvolution,r.type)).map(r=>r.secondEvolution));
    qs('second-collection-count').textContent=`${secondFound.size} / ${secondEvolutionIds.length}`;
    qs('second-collection-fill').style.width=`${100*secondFound.size/secondEvolutionIds.length}%`;
    qs('second-collection-grid').innerHTML=secondEvolutionIds.map(id=>{
      const info=SECOND_TYPES[id];const found=secondFound.has(id);
      return `<div class="second-ant-card ${found?'':'locked'}"><span class="second-icon">${found?escapeHTML(info.icon):'🔒'}</span><span class="second-info"><strong>${found?escapeHTML(info.name):'미발견 개미'}</strong><small>${found?escapeHTML(B.types[info.parent].name):'두 번째 진화'}</small></span></div>`;
    }).join('');
    const list=qs('record-list');
    if(!game.records.length) {list.innerHTML='<div class="empty-records">아직 완료한 육성 기록이 없어요.<br>LV.20에서 두 번째 진화에 도전해 보세요!</div>';return;}
    list.innerHTML=game.records.map(r=>{
      const next=r.level===20 && validSecond(r.secondEvolution,r.type)?SECOND_TYPES[r.secondEvolution]:null;
      return `<button type="button" class="record-row" data-record-id="${escapeHTML(r.id)}"><span class="record-icon">${next?escapeHTML(next.icon):portraitEmoji[r.type]}</span><span class="record-info"><strong>${next?escapeHTML(next.name):escapeHTML(B.types[r.type].name)}</strong><small>LV.${r.level} ${next?'두 번째 진화':'첫 번째 진화 · 구버전'} · ${dateLabel(r.timestamp)} · ${r.carrotCount+r.whipCount}회 행동</small></span><span class="record-arrow">›</span></button>`;
    }).join('');
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
      if(!audioCtx)audioCtx=new Context();      if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
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
    if(name!=='game' && autoTimer!==null)stopAuto('화면 이동으로 자동 육성을 중단했습니다.');
    for(const screen of ['game','expedition','records','nest','settings'])qs(`screen-${screen}`).hidden=screen!==name;
    document.querySelectorAll('[data-screen]').forEach(button=>{
      const active=button.dataset.screen===name;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    if(scroll)window.scrollTo({top:0,behavior:'instant'});
  }
  function showModal(content, kind = null) {
    if(autoTimer!==null)stopAuto('팝업이 열려 자동 육성을 중지했습니다.');
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
    if(modalKind==='first-evolution' && game.firstEvolution) {
      game.firstEvolution.acknowledged=true;
      saveState();
    }
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
  function showFirstEvolutionResult() {
    if(!game.firstEvolution || game.phase!=='phase2')return;
    const info=B.types[game.evolution];
    showModal(`<p class="modal-eyebrow">✦ FIRST EVOLUTION ✦</p><h2 id="modal-title">${escapeHTML(info.name)}</h2>
      <p class="modal-subtitle">LV.10 첫 진화! 이제 LV.20을 향한 여정을 계속할 수 있어요.</p>
      <div class="evolution-portrait" id="modal-portrait"></div>
      <div class="evolution-quote">“${escapeHTML(info.quote)}”</div>
      <div class="passive-chip"><strong>✦ 활성 고유 패시브 · ${escapeHTML(info.passive)}</strong><br>${escapeHTML(passiveDescription(game.evolution))}</div>
      <div class="modal-info">두 번째 진화는 지금부터 사용하는 당근·채찍의 비율로 결정됩니다.</div>
      <div class="modal-buttons"><button class="modal-primary" id="first-continue" type="button">LV.20까지 계속 키우기</button></div>`, 'first-evolution');
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');clone.dataset.evolution=game.evolution;clone.dataset.mood='happy';
    clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    qs('modal-portrait').appendChild(clone);
    qs('first-continue').addEventListener('click',closeModal);
  }
  function showEvolutionResult(record) {
    if(!record)return;
    const type=B.types[record.type];
    const next=validSecond(record.secondEvolution,record.type)?SECOND_TYPES[record.secondEvolution]:null;
    const name=next?.name||type.name;
    showModal(`<p class="modal-eyebrow">✦ ${next?'SECOND EVOLUTION':'FIRST EVOLUTION · LEGACY'} ✦</p>
      <h2 id="modal-title">${escapeHTML(name)}</h2><p class="modal-subtitle">${next?'LV.20 두 번째 진화를 달성했습니다!':'구버전 LV.10 진화 기록입니다.'}</p>
      <div class="evolution-portrait" id="modal-portrait"></div>
      <div class="evolution-quote">“${escapeHTML(next?.quote||type.quote)}”</div>
      <div class="passive-chip"><strong>✦ ${escapeHTML(type.passive)}</strong><br>${escapeHTML(passiveDescription(record.type))}${next?`<br><strong>${escapeHTML(next.label)}</strong>`:''}</div>
      ${next?`<div class="second-evolution-badge">${escapeHTML(growthRating(record.stats))}</div>`:''}
      ${recordSummary(record)}
      <div class="modal-buttons"><button class="modal-primary" id="modal-new-ant" type="button">새로운 개미 키우기</button><button class="modal-secondary" id="modal-keep" type="button">지금 결과 더 살펴보기</button></div>`);
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    clone.dataset.evolution=record.type;clone.dataset.secondEvolution=next?record.secondEvolution:'none';clone.dataset.mood='happy';
    qs('modal-portrait').appendChild(clone);
    if(next)qs('modal-portrait').insertAdjacentHTML('beforeend',`<span class="second-emblem" aria-hidden="true">${escapeHTML(next.icon)}</span>`);
    qs('modal-new-ant').addEventListener('click',()=>{closeModal();confirmNewAnt();});
    qs('modal-keep').addEventListener('click',closeModal);
  }
  function showRecordDetails(id) {
    const record=game.records.find(r=>r.id===id);
    if(!record)return;
    const type=B.types[record.type];
    const next=validSecond(record.secondEvolution,record.type)?SECOND_TYPES[record.secondEvolution]:null;
    showModal(`<p class="modal-eyebrow">ANT NEST ARCHIVE</p><h2 id="modal-title">${escapeHTML(next?.name||type.name)}</h2>
      <p class="modal-subtitle">${dateLabel(record.timestamp)} · LV.${record.level} ${next?'두 번째 진화':'첫 번째 진화 · 구버전'}</p>
      <div class="evolution-portrait" id="modal-portrait"></div>
      <div class="passive-chip"><strong>✦ ${escapeHTML(type.passive)}</strong><br>${escapeHTML(type.description)}</div>
      ${next?`<div class="second-evolution-badge">${escapeHTML(growthRating(record.stats))}</div>`:''}
      ${recordSummary(record)}<p class="modal-subtitle">총 획득 경험치 ${record.totalExp} EXP · 누적 행동 ${record.carrotCount+record.whipCount}회 · 밸런스 v${escapeHTML(record.balanceVersion||'0.1.0')}</p>
      <div class="modal-buttons"><button type="button" class="modal-primary" id="record-close">기록 닫기</button></div>`);
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    clone.dataset.evolution=record.type;clone.dataset.secondEvolution=next?record.secondEvolution:'none';clone.dataset.mood='happy';
    qs('modal-portrait').appendChild(clone);
    if(next)qs('modal-portrait').insertAdjacentHTML('beforeend',`<span class="second-emblem" aria-hidden="true">${escapeHTML(next.icon)}</span>`);
    qs('record-close').addEventListener('click',closeModal);
  }
  function confirmNewAnt() {
    showModal(`<p class="modal-eyebrow">A NEW BEGINNING</p><h2 id="modal-title">새 개미를 키울까요?</h2><p class="modal-subtitle">현재 진화 결과는 이미 기록에 저장되었습니다. 새 개미는 LV.1에서 출발하며 이전 육성 기록은 그대로 남습니다.</p>
      <div class="modal-info">이전에 모은 개미 기록: <strong>${game.records.length}개</strong><br>시작 능력치: 의욕 60 · 스트레스 20 · 나태함 10</div>
      <div class="modal-buttons"><button class="modal-primary" id="confirm-new-ant" type="button">새 개미 만나기</button><button class="modal-secondary" id="cancel-new-ant" type="button">취소</button></div>`);
    qs('confirm-new-ant').addEventListener('click',()=>{
      if(!game.finished)return; // 진행 중인 개미를 실수로 버리지 않도록 합니다.
      const records=game.records;
      const settings=game.settings;
      const unlockedAchievements=game.unlockedAchievements;
      const decor={unlocked:[...game.decor.unlocked],equipped:{...game.decor.equipped}};
      const expedition={...game.expedition,inventory:{...game.expedition.inventory},crafted:[...game.expedition.crafted],trips:[...game.expedition.trips]};
      game=freshState();game.records=records;game.settings=settings;game.unlockedAchievements=unlockedAchievements;game.decor=decor;game.expedition=expedition;game.tutorialCompleted=true;
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
      <strong>4. 두 단계 진화</strong> · LV.10에서 첫 진화와 고유 패시브, LV.20에서 두 번째 진화 6종 중 하나 완성</div>
      <div class="modal-buttons"><button class="modal-primary" id="tutorial-review-close" type="button">확인</button></div>`);
    qs('tutorial-review-close').addEventListener('click',closeModal);
  }

  function exportSaveData() {
    try {
      const raw=localStorage.getItem(KEY);
      if(!raw) {toast('저장된 게임 데이터가 없습니다.');return;}
      const bundle={
        format:'ant-game-save',exportVersion:B.version,exportedAt:new Date().toISOString(),
        save:JSON.parse(raw),
        originalBeforeV05:localStorage.getItem(PRE_V05_BACKUP_KEY),
        originalBeforeV06:localStorage.getItem(PRE_V06_BACKUP_KEY)
      };
      const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;
      link.download=`ant-game-save-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast('게임 데이터 백업 파일을 저장했습니다.');
    } catch(error) {console.warn('게임 데이터 내보내기 실패',error);toast('백업 파일을 만들 수 없습니다.');}
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
    qs('carrot-button').addEventListener('click',()=>{stopAuto();playAction('carrot');});
    qs('whip-button').addEventListener('click',()=>{stopAuto();playAction('whip');});
    qs('auto-toggle').addEventListener('click',toggleAutoCare);
    qs('auto-mode').addEventListener('change',e=>{autoMode=e.target.value;});
    qs('expedition-regions').addEventListener('click',e=>{
      const btn=e.target.closest('[data-expedition]');if(btn)exploreRegion(btn.dataset.expedition);
    });
    qs('craft-grid').addEventListener('click',e=>{
      const btn=e.target.closest('[data-craft]');if(btn)craftItem(btn.dataset.craft);
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAuto('화면이 숨겨져 자동 육성이 중지됐습니다.');});
    window.addEventListener('pagehide',()=>stopAuto());
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
    qs('export-save').addEventListener('click',exportSaveData);
    qs('reset-button').addEventListener('click',confirmReset);
    qs('modal-close').addEventListener('click',closeModal);
    qs('modal-backdrop').addEventListener('click',e=>{if(e.target===qs('modal-backdrop'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)closeModal();});
    window.addEventListener('storage',e=>{if(e.key!==KEY)return;stopAuto('다른 탭에서 데이터가 변경되어 중지했습니다.');game=loadState();reconcileDecorations();render();toast('다른 탭에서 변경된 저장 데이터를 불러왔습니다.');});
  }
  bindEvents();
  startAnalytics();
  render();
  saveState();
  // 미완료 선택이 있으면 제일 먼저 복구합니다. 패치노트는 선택 종료 이후로 미룹니다.
  if(game.pendingChoice) showChoiceEvent();
  else if(game.phase==='phase2' && game.firstEvolution && !game.firstEvolution.acknowledged)showFirstEvolutionResult();
  showPatchNotesOnLaunch();
})();