/*
 * 개미 키우기 정식 출시 v1.0
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
  const PRE_V07_BACKUP_KEY = 'little-ant-game-before-v0.7';
  const PRE_V08_BACKUP_KEY = 'little-ant-game-before-v0.8';
  const PRE_V09_BACKUP_KEY = 'little-ant-game-before-v0.9';
  const PRE_V10_BACKUP_KEY = 'little-ant-game-before-v1.0';
  const PRE_RESET_KEY = 'little-ant-game-before-reset-v1.0';
  // 정식 출시 전 저장 원문을 최초 1회 보존합니다. 기존 백업 키는 변경하지 않습니다.
  try {
    const raw=localStorage.getItem(KEY);
    if(raw && !localStorage.getItem(PRE_V10_BACKUP_KEY)) {
      const candidate=JSON.parse(raw);
      if(candidate?.schemaVersion===1) localStorage.setItem(PRE_V10_BACKUP_KEY,raw);
    }
  }catch(_error){ /* 데이터가 손상되어도 원문을 덮어쓰지 않습니다. */ }
  // 과거 원정권·자원·완료 기록은 삭제하지 않고 v0.9 규칙만 적용합니다.
  try {
    const raw=localStorage.getItem(KEY);
    if(raw && !localStorage.getItem(PRE_V09_BACKUP_KEY)){
      const previous=JSON.parse(raw);
      if(previous?.schemaVersion===1 && !previous.expedition?.ticketRuleVersion)
        localStorage.setItem(PRE_V09_BACKUP_KEY,raw);
    }
  }catch(_error){ /* 백업 오류로 원본 저장을 변경하지 않습니다. */ }
  const PRE_IMPORT_KEY = 'little-ant-game-before-import-v0.8';
  // v0.8 첫 실행: 이전 버전 원문을 별도 슬롯에 1회만 보존합니다.
  try {
    const raw=localStorage.getItem(KEY);
    if(raw && !localStorage.getItem(PRE_V08_BACKUP_KEY)) {
      const prev=JSON.parse(raw);
      if(prev?.schemaVersion===1 && !Object.prototype.hasOwnProperty.call(prev,'kingdom'))
        localStorage.setItem(PRE_V08_BACKUP_KEY,raw);
    }
  } catch(_error) { /* 백업 오류라도 기존 저장 내용을 손대지 않습니다. */ }
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
  // v0.7 마이그레이션 전에 구버전 원본을 1회 보관합니다.
  try {
    const raw=localStorage.getItem(KEY);
    if(raw && !localStorage.getItem(PRE_V07_BACKUP_KEY)) {
      const obj=JSON.parse(raw);
      if(obj?.schemaVersion===1 && !obj.settings?.autoCare)
        localStorage.setItem(PRE_V07_BACKUP_KEY,raw);
    }
  } catch(_error) { /* 백업 실패 시 원본 저장을 변경하지 않습니다. */ }
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
  const ALL_DECOR = [...B.decorations,...B.craftingItems,...B.thirdRewards];
  const RESOURCE_IDS = B.resources.map(item=>item.id);
  const FACILITY_IDS = B.kingdomFacilities.map(item=>item.id);
  const FACILITY_BY_REGION = Object.fromEntries(B.expeditions.regions.map(region=>[
    region.id,B.kingdomFacilities.find(facility=>facility.id===region.facilityId)
  ]));
  const RARE_BY_REGION=Object.fromEntries(B.rareFinds.map(item=>[item.region,item]));
  const RARE_IDS=new Set(B.rareFinds.map(item=>item.id));
  // 서울 기준 월요일~일요일 주간 미션, 로컬 브라우저만 사용합니다.
  function currentWeekKey(now=Date.now()){
    const date=new Date(now+9*3600000);
    date.setUTCHours(0,0,0,0);
    const day=date.getUTCDay()||7;
    date.setUTCDate(date.getUTCDate()+4-day);
    const year=date.getUTCFullYear();
    const yearStart=new Date(Date.UTC(year,0,1));
    const week=Math.ceil((((date-yearStart)/86400000)+1)/7);
    return `${year}-W${String(week).padStart(2,'0')}`;
  }
  const freshWeekly = () => ({key:currentWeekKey(),trips:0,resources:0,squadTrips:0,claimed:[]});
  function normalizeWeekly(raw){
    if(!raw || raw.key!==currentWeekKey())return freshWeekly();
    const n=v=>Number.isInteger(v)&&v>=0&&v<=999999?v:0;
    return {key:raw.key,trips:n(raw.trips),resources:n(raw.resources),squadTrips:n(raw.squadTrips),
      claimed:[...new Set(Array.isArray(raw.claimed)?raw.claimed:[])].filter(id=>B.weeklyGoals.some(g=>g.id===id))};
  }
  const FACILITY_BY_ID = Object.fromEntries(B.kingdomFacilities.map(item=>[item.id,item]));
  const maximumResource = 999999;
  const KINGDOM_MAX_LEVEL = 5;
  const defaultKingdom = () => ({
    dataVersion:1,facilities:{pantry:1,workshop:0,laboratory:0},
    assignments:{pantry:null,workshop:null,laboratory:null},upgradeLedger:[]
  });
  // 완료 기록의 ID만 참조하며 record 객체 자체는 절대 수정하지 않습니다.
  function normalizeKingdom(raw,records) {
    const base=defaultKingdom();
    if(raw===undefined || raw===null)return base;
    if(!raw || typeof raw!=='object' || Array.isArray(raw) || raw.dataVersion!==1)
      throw new Error('지원하지 않는 왕국 데이터 형식');
    if(!raw.facilities || typeof raw.facilities!=='object' || !raw.assignments || typeof raw.assignments!=='object')
      throw new Error('왕국 시설·배치 데이터가 누락됐습니다.');
    const assignments=new Set();
    const idCounts=records.reduce((acc,record)=>(acc[record.id]=(acc[record.id]||0)+1,acc),Object.create(null));
    for(const id of FACILITY_IDS){
      const level=raw.facilities[id];
      if(!Number.isInteger(level) || level<0 || level>KINGDOM_MAX_LEVEL || (id==='pantry' && level<1))
        throw new Error('시설 레벨에 올바르지 않은 값이 있습니다.');
      base.facilities[id]=level;
      const worker=raw.assignments[id]??null;
      if(worker!==null) {
        if(typeof worker!=='string' || idCounts[worker]!==1 || level===0 || assignments.has(worker))
          throw new Error('일꾼 배치에 중복 또는 없는 개미가 있습니다.');
        assignments.add(worker);
      }
      base.assignments[id]=worker;
    }
    if(raw.upgradeLedger!==undefined) {
      if(!Array.isArray(raw.upgradeLedger))throw new Error('시설 강화 기록 형식이 잘못됐습니다.');
      base.upgradeLedger=raw.upgradeLedger.slice(0,30).filter(entry=>
        entry && FACILITY_IDS.includes(entry.facilityId) &&
        Number.isInteger(entry.fromLevel) && Number.isInteger(entry.toLevel) &&
        entry.fromLevel>=0 && entry.toLevel===entry.fromLevel+1 && entry.toLevel<=5 &&
        entry.cost && typeof entry.cost==='object' && Number.isFinite(entry.at)
      ).map(entry=>({facilityId:entry.facilityId,fromLevel:entry.fromLevel,toLevel:entry.toLevel,
        cost:Object.fromEntries(RESOURCE_IDS.map(id=>[id,Math.max(0,Math.floor(Number(entry.cost[id]||0)))])),at:entry.at}));
    }
    return base;
  }
  const validCraft = id => B.craftingItems.some(item=>item.id===id);
  const SECOND_TYPES = B.secondEvolution.types;
  const THIRD_TYPES = B.thirdEvolution.types;
  const validThird = (type,parent) => Boolean(THIRD_TYPES[type] && THIRD_TYPES[type].parent===parent);
  const hasFirstPassive = () => ['phase2','phase3'].includes(game.phase);
  const eventBenefitMultiplier = () => B.passive.genius.positiveEventBenefitMultiplier +
    (game.secondEvolution==='star_scholar' ? B.secondPassives.star_scholar.value : 0);
  const thirdTypeFor = (parent,ratio) => Object.keys(THIRD_TYPES).find(id=>
    THIRD_TYPES[id].parent===parent && THIRD_TYPES[id].branch===(ratio<B.thirdEvolution.threshold?'A':'B'))||null;
  const stage3Ratio = () => game.stage3Counters.whip/Math.max(1,game.stage3Counters.carrot+game.stage3Counters.whip);
  const finalInfo = record => THIRD_TYPES[record.thirdEvolution] || SECOND_TYPES[record.secondEvolution] || B.types[record.type];
  function thirdStatus(id) {
    const info=THIRD_TYPES[id]; if(!info)return '';
    const reason={risk:'위험 이벤트 시스템 없음',time:'현재 탐험은 즉시 완료',riskInfo:'위험도 시스템 없음',
      rare:'희귀 발견물은 수량 없는 일회성 수집품',loss:'자원 손실 시스템 없음'}[info.effect];
    return `${info.passive} · ${info.description}${info.effect==='craft'?' (현재 제작 재료: 식량·목재·수정)':''} · ${reason?'미활성: '+reason:'활성'}`;
  }
  function passiveLeader(state=game) {
    return state.records.find(r=>r.id===state.expedition.passiveRecordId && validThird(r.thirdEvolution,r.secondEvolution))||null;
  }
  function hasExtraSlot(state=game) {return state.records.some(r=>r.thirdEvolution==='grand_architect');}
  function resumeLevel20() {
    if(!game.finished || game.level!==20 || !validSecond(game.secondEvolution,game.evolution))return;
    const before=JSON.parse(JSON.stringify(game));
    game.finished=false;game.phase='phase3';game.exp=0;game.stage3Counters={carrot:0,whip:0};
    game.lastFeedback='LV.20 기록을 보존하고 세 번째 성장을 시작합니다.';
    if(!saveState()){game=before;render();return;}
    render();toast('LV.30을 향한 여정을 시작합니다.');
  }
  const SECOND_THRESH = B.secondEvolution.threshold;
  const secondEvolutionIds = Object.keys(SECOND_TYPES);
  const validFirst = type => Boolean(B.types[type]);
  const validSecond = (type,parent) => Boolean(SECOND_TYPES[type] && SECOND_TYPES[type].parent===parent);
  const tutorial = [
    { title:'먼저 당근을 주세요!', description:'당근은 의욕을 높이고 스트레스를 줄여 줍니다. 대신 나태함은 조금 올라가요.', button:null },
    { title:'이제 채찍으로 훈련!', description:'채찍은 경험치를 주지만 스트레스도 높여요. 실제 개미를 때리는 것이 아닌 훈련을 뜻합니다.', button:null },
    { title:'세 가지 상태를 확인하세요!', description:'의욕이 높고 스트레스·나태함이 낮을수록 훈련에 유리해요. 돌발 이벤트 확률도 상태에 따라 달라져요.', button:'이해했어요' },
    { title:'LV.10·20·30, 세 번의 진화!', description:'LV.10에서 첫 진화와 고유 패시브를 얻고, LV.20에서 두 번째, LV.30에서 세 번째 진화를 완성해요. 계속 키워 보세요!', button:'육성 시작' }
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
      phase:'phase1', firstEvolution:null, stage2Counters:{carrot:0,whip:0}, secondEvolution:null, thirdEvolution:null, stage3Counters:{carrot:0,whip:0}, secondReachedAt:null,
      pendingChoice:null, unlockedAchievements:[],
      decor:{unlocked:[],equipped:{floor:null,wall:null,light:null,extra:null}},
      expedition:{tickets:0,ticks:0,ticketRuleVersion:2,inventory:{food:0,wood:0,crystal:0},crafted:[],trips:[],totalTrips:0,squad:[],discoveries:[],passiveRecordId:null,bonusRemainders:{}},
      weekly:freshWeekly(),
      recentActions:[],
      kingdom:defaultKingdom(),
      lastSpeech: choose(dialogue.idle), lastFeedback:'작은 선택이 개미의 내일을 바꿉니다.', lastReaction:'idle',
      tutorialCompleted:false, tutorialStep:0,
      settings:{ soundEnabled:true, volume:65, autoCare:{mode:B.autoCare.defaultMode,batch:B.autoCare.defaultBatch,speed:B.autoCare.defaultSpeed,safeStop:B.autoCare.defaultSafeStop} }
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
        legacyLevel20:r.legacyLevel20 && r.legacyLevel20.level===20 && validFirst(r.legacyLevel20.type) && validSecond(r.legacyLevel20.secondEvolution,r.legacyLevel20.type) ? {
          ...r.legacyLevel20,carrotCount:num(r.legacyLevel20.carrotCount,0),whipCount:num(r.legacyLevel20.whipCount,0),
          balanceVersion:typeof r.legacyLevel20.balanceVersion==='string'?r.legacyLevel20.balanceVersion.slice(0,24):'1.0.3'
        } : undefined,
        timestamp:num(r.timestamp,Date.now()),
        level:r.level===30 && validThird(r.thirdEvolution,r.secondEvolution) && validSecond(r.secondEvolution,r.type) ? 30 : r.level===20 && validSecond(r.secondEvolution,r.type) ? 20 : 10,
        thirdEvolution:r.level===30 && validSecond(r.secondEvolution,r.type) && validThird(r.thirdEvolution,r.secondEvolution) ? r.thirdEvolution : null,
        stage3Counters:{carrot:num(r.stage3Counters?.carrot,0),whip:num(r.stage3Counters?.whip,0)},
        secondReachedAt:num(r.secondReachedAt,0),
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
          (validSecond(prev.secondEvolution,prev.evolution) && prev.level>=20 ? 'phase3':validFirst(prev.firstEvolution?.type) && prev.level>=10 ? 'phase2':'phase1'),
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
        thirdEvolution:prev.level===30 && prev.finished && validThird(prev.thirdEvolution,prev.secondEvolution) && validSecond(prev.secondEvolution,prev.evolution)?prev.thirdEvolution:null,
        stage3Counters:{carrot:num(prev.stage3Counters?.carrot,0),whip:num(prev.stage3Counters?.whip,0)},
        secondReachedAt:num(prev.secondReachedAt,0),
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
          equipped:{extra:ALL_DECOR.some(d=>d.id===prev.decor?.equipped?.extra) ? prev.decor.equipped.extra:null,...Object.fromEntries(['floor','wall','light'].map(slot=>[
            slot, ALL_DECOR.some(d=>d.id===prev.decor?.equipped?.[slot] && d.slot===slot) ? prev.decor.equipped[slot] : null
          ]))}
        },
        expedition: {
          // 구버전 원정권은 보존하고, LV.10 미만의 누적 진행도와 과거 미완료 행동은 소급 지급하지 않습니다.
          tickets: prev.expedition ? num(prev.expedition.tickets,0,B.expeditions.maxTickets) : 0,
          ticks:prev.level>=10 && prev.expedition?.ticketRuleVersion===2 ?
            num(prev.expedition.ticks,0,B.expeditions.actionsPerTicket-1):0,
          ticketRuleVersion:2,
          inventory:Object.fromEntries(RESOURCE_IDS.map(id=>[id,num(prev.expedition?.inventory?.[id],0,999999)])),
          crafted:Array.isArray(prev.expedition?.crafted) ?
            [...new Set(prev.expedition.crafted)].filter(validCraft):[],
          trips:Array.isArray(prev.expedition?.trips) ? prev.expedition.trips.slice(0,12).filter(t=>
            t && B.expeditions.regions.some(region=>region.id===t.region) && RESOURCE_IDS.includes(t.resource) &&
            Number.isFinite(t.amount) && t.amount>0).map(t=>({
              region:t.region,resource:t.resource,amount:num(t.amount,1,1000),at:num(t.at,Date.now()),
              rareId:RARE_IDS.has(t.rareId)?t.rareId:null,
              squadBonus:num(t.squadBonus,0,10),
              base:Number.isFinite(t.base)?num(t.base,0):null,randomBonus:Number.isFinite(t.randomBonus)?num(t.randomBonus,0):null,
              facilityBonus:Number.isFinite(t.facilityBonus)?num(t.facilityBonus,0):null,workerBonus:Number.isFinite(t.workerBonus)?num(t.workerBonus,0):null,
              passiveBonus:num(t.passiveBonus,0),passiveType:Object.hasOwn(THIRD_TYPES,t.passiveType)?t.passiveType:null
            })):[],
          totalTrips:num(prev.expedition?.totalTrips,0),
          passiveRecordId:records.some(r=>r.id===prev.expedition?.passiveRecordId && validThird(r.thirdEvolution,r.secondEvolution))?prev.expedition.passiveRecordId:null,
          bonusRemainders:Object.fromEntries(Object.keys(THIRD_TYPES).flatMap(type=>RESOURCE_IDS.map(resource=>{
            const key=type+':'+resource,v=prev.expedition?.bonusRemainders?.[key];
            return [key,Number.isInteger(v)&&v>=0&&v<100?v:0];
          }))),
          squad:Array.isArray(prev.expedition?.squad) ? [...new Set(prev.expedition.squad)]
            .filter(id=>typeof id==='string' && records.some(record=>record.id===id)).slice(0,B.expeditionSquad.maxMembers):[],
          discoveries:Array.isArray(prev.expedition?.discoveries) ?
            [...new Set(prev.expedition.discoveries)].filter(id=>RARE_IDS.has(id)):[]
        },
        weekly:normalizeWeekly(prev.weekly),
        recentActions:Array.isArray(prev.recentActions) ? prev.recentActions.slice(0,12).filter(item=>
          item && ['carrot','whip'].includes(item.action) && Number.isFinite(item.gained)).map(item=>({
            action:item.action,gained:num(item.gained,0,100000),at:num(item.at,Date.now()),eventId: B.events[item.eventId]?item.eventId:null
          })):[],
        records,
        kingdom:normalizeKingdom(prev.kingdom,records),
        finished: Boolean(prev.finished), finishedRecordId: prev.finishedRecordId ?? null,
        evolution:validTypes.includes(prev.evolution)?prev.evolution:null,
        lastSpeech:typeof prev.lastSpeech==='string'?prev.lastSpeech.slice(0,120):base.lastSpeech,
        lastFeedback:typeof prev.lastFeedback==='string'?prev.lastFeedback.slice(0,180):base.lastFeedback,
        lastReaction:'idle',
        tutorialCompleted:Boolean(prev.tutorialCompleted),tutorialStep: num(prev.tutorialStep,0,3),
        settings: {
          soundEnabled:prev.settings?.soundEnabled!==false,volume:num(prev.settings?.volume,65,100),
          autoCare:{
            mode:['balanced','growth','recover'].includes(prev.settings?.autoCare?.mode) ? prev.settings.autoCare.mode : B.autoCare.defaultMode,
            batch:B.autoCare.batches.includes(prev.settings?.autoCare?.batch) ? prev.settings.autoCare.batch : B.autoCare.defaultBatch,
            speed:Object.hasOwn(B.autoCare.speeds,prev.settings?.autoCare?.speed) ? prev.settings.autoCare.speed : B.autoCare.defaultSpeed,
            safeStop:prev.settings?.autoCare?.safeStop!==false
          }
        }
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
  let autoMode = game.settings.autoCare.mode;
  let autoTarget = game.settings.autoCare.batch;
  let autoResumeAvailable = false;
  // 실행 중 발생한 선택형 이벤트/첫 진화 확인을 마치면 남은 자동 육성을 이어갑니다.
  // 이 값은 세션 메모리에만 보관하며 새로고침 이후 자동 실행하지 않습니다.
  let autoResumeAfterDecision = false;
  let autoStatusMessage = '설정을 선택하고 자동 육성을 시작하세요.';
  let lastExploreClick = 0;
  let modalOpen = false;
  let modalKind = null;
  let previousFocus = null;
  let toastTimer = 0;
  let reactionTimer = 0;
  let temporaryMood = null;
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
    if(storageCorrupt) {storageWorks=false;renderStorageStatus();return false;}
    try {
      const raw=JSON.stringify(game);
      localStorage.setItem(KEY,raw);
      if(localStorage.getItem(KEY)!==raw)throw new Error('저장 내용 확인 실패');
      storageWorks=true;
      renderStorageStatus();
      return true;
    } catch(error) {
      storageWorks=false;
      console.warn('자동 저장 실패:',error);
      renderStorageStatus();
      return false;
    }
  }

  // v0.8 자원 소비/원정/배치 트랜잭션: 저장이 실패하면 메모리와 UI도 바뀌지 않습니다.
  function applyKingdomTransaction(mutator) {
    if(storageCorrupt)return false;
    try {
      const draft=JSON.parse(JSON.stringify(game));
      if(mutator(draft)===false)return false;
      const raw=JSON.stringify(draft);
      localStorage.setItem(KEY,raw);
      if(localStorage.getItem(KEY)!==raw)throw new Error('저장 확인 실패');
      game=draft;
      storageWorks=true;
      render();
      return true;
    } catch(error) {
      console.warn('왕국 작업 저장 실패:',error);
      storageWorks=false;
      renderStorageStatus();
      toast('저장에 실패하여 작업을 적용하지 않았습니다.');
      return false;
    }
  }
  function getFacilityBonus(regionId,kingdom=game.kingdom,records=game.records) {
    const facility=FACILITY_BY_REGION[regionId];
    if(!facility)return {facilityBonus:0,workerBonus:0,total:0,worker:null};
    const level=kingdom.facilities[facility.id]||0;
    const facilityBonus=facility.levelBonus[level]||0;
    const workerId=level>0?kingdom.assignments[facility.id]:null;
    const matches=records.filter(record=>record.id===workerId);
    const worker=matches.length===1?matches[0]:null;
    const workerBonus=worker?1+(worker.type===facility.specialty?1:0):0;
    return {facilityBonus,workerBonus,total:facilityBonus+workerBonus,worker};
  }
  function resourceCostLabel(cost){
    return RESOURCE_IDS.filter(id=>cost[id]>0).map(id=>{
      const name=B.resources.find(item=>item.id===id);
      return `${name.icon} ${name.name} ${cost[id]}`;
    }).join(' · ')||'무료';
  }
  function facilityById(id){return FACILITY_BY_ID[id]||null;}
  function upgradeFacility(id, expectedLevel) {
    const facility=facilityById(id);
    if(!facility || game.pendingChoice || game.kingdom.facilities[id]!==expectedLevel || expectedLevel>=5)return false;
    const nextLevel=expectedLevel+1;
    const cost=facility.costs[nextLevel]||{};
    const success=applyKingdomTransaction(draft=>{
      if(draft.kingdom.facilities[id]!==expectedLevel ||
         !Object.entries(cost).every(([key,count])=>draft.expedition.inventory[key]>=count))return false;
      for(const [key,count] of Object.entries(cost))draft.expedition.inventory[key]-=count;
      draft.kingdom.facilities[id]=nextLevel;
      draft.kingdom.upgradeLedger.unshift({facilityId:id,fromLevel:expectedLevel,toLevel:nextLevel,cost:{...cost},at:Date.now()});
      draft.kingdom.upgradeLedger=draft.kingdom.upgradeLedger.slice(0,30);
      return true;
    });
    if(success)toast(`${facility.name} LV.${nextLevel} ${expectedLevel?'강화':'건설'} 완료!`);
    return success;
  }
  function confirmUpgradeFacility(id){
    const facility=facilityById(id);
    if(!facility || modalOpen || game.pendingChoice)return;
    const level=game.kingdom.facilities[id];
    if(level>=5)return;
    const cost=facility.costs[level+1]||{};
    if(!Object.entries(cost).every(([key,count])=>resourceCount(key)>=count)){
      toast('건설·강화에 필요한 자원이 부족합니다.');return;
    }
    showModal(`<p class="modal-eyebrow">KINGDOM BUILD</p><h2 id="modal-title">${escapeHTML(facility.name)} ${level?'강화':'건설'}</h2>
      <p class="modal-subtitle">LV.${level} → LV.${level+1}</p>
      <div class="modal-info">소모: ${escapeHTML(resourceCostLabel(cost))}<br>기본 원정 보너스: +${facility.levelBonus[level]} → +${facility.levelBonus[level+1]}</div>
      <p class="import-warning">확인하면 자원은 한 번만 소비되며 되돌릴 수 없습니다.</p>
      <div class="modal-buttons"><button class="modal-primary" type="button" id="confirm-facility-upgrade">${level?'강화':'건설'} 확정</button><button class="modal-secondary" type="button" id="cancel-facility-upgrade">취소</button></div>`);
    qs('confirm-facility-upgrade').addEventListener('click',()=>{const ok=upgradeFacility(id,level);if(ok)closeModal();});
    qs('cancel-facility-upgrade').addEventListener('click',closeModal);
  }
  function assignedFacilityFor(recordId,kingdom=game.kingdom){
    return FACILITY_IDS.find(id=>kingdom.assignments[id]===recordId)||null;
  }
  function assignWorker(id,recordId){
    const facility=facilityById(id);
    if(!facility || game.kingdom.facilities[id]===0 || game.pendingChoice)return false;
    const idMatches=game.records.filter(record=>record.id===recordId);
    if(idMatches.length!==1)return false;
    const success=applyKingdomTransaction(draft=>{
      if(!draft.kingdom.facilities[id] || draft.records.filter(r=>r.id===recordId).length!==1)return false;
      for(const fid of FACILITY_IDS)if(draft.kingdom.assignments[fid]===recordId)draft.kingdom.assignments[fid]=null;
      draft.kingdom.assignments[id]=recordId;
      return true;
    });
    if(success)toast(`${facility.role} 배치 완료!`);
    return success;
  }
  function unassignWorker(id){
    if(!facilityById(id) || !game.kingdom.assignments[id] || game.pendingChoice)return;
    if(applyKingdomTransaction(draft=>{draft.kingdom.assignments[id]=null;return true;}))toast('일꾼 배치를 해제했습니다.');
  }
  function chooseWorker(id,filter='all') {
    const facility=facilityById(id);
    if(!facility || !game.kingdom.facilities[id] || game.pendingChoice)return;
    const candidates=game.records.filter(record=>game.records.filter(r=>r.id===record.id).length===1)
      .filter(record=>filter==='free'?!assignedFacilityFor(record.id):filter==='assigned'?!!assignedFacilityFor(record.id):true);
    const filters=[['all','전체'],['free','미배치'],['assigned','배치 중']];
    const cards=candidates.map(record=>{
      const origin=assignedFacilityFor(record.id);
      return `<button class="kingdom-picker-item" type="button" data-pick-worker="${escapeHTML(record.id)}"><span><strong>${escapeHTML(B.types[record.type].name)} · LV.${record.level}</strong>
        <small>${escapeHTML(dateLabel(record.timestamp))} · ${record.type===facility.specialty?'특화 역할 · 추가 +1':'기본 역할 · +1'}${origin?' · '+escapeHTML(FACILITY_BY_ID[origin].name)+' 배치 중':''}</small></span><span>선택</span></button>`;
    }).join('')||'<p class="modal-subtitle">해당 조건의 완료 개미가 없습니다.</p>';
    showModal(`<p class="modal-eyebrow">WORKER ASSIGNMENT</p><h2 id="modal-title">${escapeHTML(facility.role)} 선택</h2>
      <p class="modal-subtitle">완료한 개미 1마리를 ${escapeHTML(facility.name)}에 배치합니다. 같은 개미는 여러 시설에 배치할 수 없습니다.</p>
      <div class="kingdom-picker-filters">${filters.map(([value,label])=>`<button type="button" class="${value===filter?'active':''}" data-worker-filter="${value}">${label}</button>`).join('')}</div>
      <div class="kingdom-picker-list">${cards}</div><div class="modal-buttons"><button class="modal-secondary" type="button" id="cancel-worker-picker">닫기</button></div>`,'worker-picker');
    qs('cancel-worker-picker').addEventListener('click',closeModal);
    qs('modal-body').querySelectorAll('[data-worker-filter]').forEach(btn=>btn.addEventListener('click',()=>{closeModal();chooseWorker(id,btn.dataset.workerFilter);}));
    qs('modal-body').querySelectorAll('[data-pick-worker]').forEach(btn=>btn.addEventListener('click',()=>{
      const worker=game.records.find(rec=>rec.id===btn.dataset.pickWorker);
      if(!worker)return;
      const old=assignedFacilityFor(worker.id);
      const oldFacility=game.kingdom.assignments[id];
      closeModal();
      showModal(`<p class="modal-eyebrow">WORKER ASSIGNMENT</p><h2 id="modal-title">일꾼 배치 확인</h2>
        <p class="modal-subtitle">${escapeHTML(B.types[worker.type].name)} → ${escapeHTML(facility.name)}</p>
        <div class="modal-info">${old && old!==id?`${escapeHTML(FACILITY_BY_ID[old].name)}에서 자동 해제 후 이동합니다.<br>`:''}${oldFacility && oldFacility!==worker.id?'기존 일꾼은 미배치 상태로 전환됩니다.<br>':''}원정 보너스: +${1+(worker.type===facility.specialty?1:0)}</div>
        <div class="modal-buttons"><button class="modal-primary" type="button" id="confirm-worker">배치 확정</button><button class="modal-secondary" type="button" id="cancel-worker">취소</button></div>`);
      qs('confirm-worker').addEventListener('click',()=>{if(assignWorker(id,worker.id))closeModal();});
      qs('cancel-worker').addEventListener('click',closeModal);
    }));
  }
  let activeNestTab='decor';
  function switchNestTab(tab){
    if(!['decor','facilities','workers'].includes(tab))return;
    activeNestTab=tab;
    for(const name of ['decor','facilities','workers']){
      qs(`nest-${name}-panel`).hidden=name!==tab;
      const btn=qs(`nest-tab-${name}`);
      btn.classList.toggle('active',name===tab);
      btn.setAttribute('aria-selected',String(name===tab));
      btn.tabIndex=name===tab?0:-1;
    }
  }
  function renderKingdom(){
    const k=game.kingdom;
    qs('kingdom-summary').textContent=`건설 시설 ${FACILITY_IDS.filter(id=>k.facilities[id]>0).length}/3 · 배치 일꾼 ${FACILITY_IDS.filter(id=>!!k.assignments[id]).length}/3`;
    qs('kingdom-facilities').innerHTML=B.kingdomFacilities.map(f=>{
      const level=k.facilities[f.id],next=level+1;
      const bonus=getFacilityBonus(f.region);
      const cost=level<5?f.costs[next]||{}:{};
      const affordable=Object.entries(cost).every(([id,n])=>resourceCount(id)>=n);
      return `<article class="kingdom-facility-card"><div class="kingdom-card-heading"><span class="kingdom-facility-icon">${escapeHTML(f.icon)}</span>
        <div><strong>${escapeHTML(f.name)}</strong><small>${level?'LV.'+level+' / LV.5':'미건설 · LV.0 / LV.5'} · ${escapeHTML(f.role)}</small></div></div>
        <div class="kingdom-facility-progress"><span style="width:${level/5*100}%"></span></div>
        <p class="kingdom-facility-description">${escapeHTML(B.resources.find(r=>r.id===f.resource).name)} 원정 보너스: 시설 +${bonus.facilityBonus}, 일꾼 +${bonus.workerBonus} (총 +${bonus.total})</p>
        <p class="kingdom-resource-cost">${level>=5?'최고 레벨 달성':`다음 LV.${next} 비용 · ${escapeHTML(resourceCostLabel(cost))}`}</p>
        <div class="kingdom-facility-action-row"><small>${level>=5?'더 이상 강화할 수 없습니다.':affordable?'건설·강화 가능':'자원이 부족합니다.'}</small>
          <button type="button" data-upgrade-facility="${f.id}" ${level>=5||!affordable||game.pendingChoice?'disabled':''}>${level>=5?'MAX':level===0?'건설하기':'강화하기'}</button></div></article>`;
    }).join('');
    qs('kingdom-worker-summary').textContent=`완료 개미 ${game.records.length}마리 · 배치 일꾼 ${FACILITY_IDS.filter(id=>!!k.assignments[id]).length}마리`;
    qs('kingdom-workers').innerHTML=B.kingdomFacilities.map(f=>{
      const level=k.facilities[f.id],id=k.assignments[f.id];
      const worker=game.records.find(record=>record.id===id);
      const roleBonus=getFacilityBonus(f.region).workerBonus;
      return `<article class="kingdom-worker-card"><div class="kingdom-card-heading"><span class="kingdom-facility-icon">${escapeHTML(f.icon)}</span><div><strong>${escapeHTML(f.role)}</strong><small>${escapeHTML(f.name)} · ${level?'LV.'+level:'미건설'}</small></div></div>
        <div class="kingdom-worker-status">${!level?'먼저 시설을 건설하세요.':worker?`${escapeHTML(B.types[worker.type].name)} · LV.${worker.level} · ${worker.type===f.specialty?'특화':'일반'} (보너스 +${roleBonus})`:'미배치 · 원정 보너스 없음'}</div>
        <div class="kingdom-worker-actions"><button type="button" data-choose-facility="${f.id}" ${!level||!game.records.length||game.pendingChoice?'disabled':''}>${worker?'일꾼 교체':'일꾼 배치'}</button>
          ${worker?`<button type="button" class="secondary" data-unassign-facility="${f.id}" ${game.pendingChoice?'disabled':''}>배치 해제</button>`:''}</div></article>`;
    }).join('');
    const ledger=k.upgradeLedger.slice(0,3).map(entry=>`${dateLabel(entry.at)} · ${escapeHTML(FACILITY_BY_ID[entry.facilityId].name)} LV.${entry.toLevel}`).join(' / ');
    qs('kingdom-ledger').textContent=ledger?`최근 건설·강화: ${ledger}`:'아직 시설 강화 기록이 없습니다.';
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
    return value<0 ? Math.round(value*eventBenefitMultiplier()) : value>0 ? Math.round(value*eventBenefitMultiplier()) : value;
  }
  // 오직 긍정 이벤트에서 유익한 변화만 강화합니다.
  function eventStatDelta(event,stat,raw) {
    if(!hasFirstPassive() || game.evolution!=='genius' || event.kind!=='positive')return raw;
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
  function stopAuto(reason='',allowResume=false) {
    const wasActive=autoTimer!==null || autoResumeAvailable;
    if(autoTimer!==null){clearInterval(autoTimer);autoTimer=null;}
    autoResumeAvailable=Boolean(allowResume && !game.finished && autoActions<autoTarget);
    if(!autoResumeAvailable)autoResumeAfterDecision=false;
    if(reason)autoStatusMessage=reason;
    else if(wasActive)autoStatusMessage='수동 행동으로 자동 육성을 중지했습니다.';
    renderAutoCare();
  }
  function runAutoTick() {
    if(!storageWorks || storageCorrupt) {
      stopAuto('저장 오류로 자동 육성을 중단했습니다. 설정에서 저장 상태를 확인하세요.');return;
    }
    if(document.hidden || activeScreen!=='game' || game.finished || game.pendingChoice || modalOpen || !game.tutorialCompleted) {
      stopAuto('자동 육성 중단 · 게임 화면 또는 이벤트 상태를 확인하세요.');return;
    }
    if(autoActions>=autoTarget){stopAuto(`자동 육성 ${autoTarget}회 완료 · 다시 시작할 수 있습니다.`);return;}
    const before=game.carrotCount+game.whipCount;
    playAction(autoChoice());
    if(game.carrotCount+game.whipCount>before)autoActions++;
    if(autoActions>=autoTarget)stopAuto(`자동 육성 ${autoTarget}회 완료 · 다시 시작할 수 있습니다.`);
    else if(autoTimer!==null && game.settings.autoCare.safeStop && statusTier(game.stats)==='danger')
      stopAuto('위험 상태에 도달해 자동 육성을 중지했습니다. 상태를 확인한 뒤 재시작하세요.');
    else renderAutoCare();
  }
  function toggleAutoCare() {
    if(autoTimer!==null){stopAuto('사용자가 자동 육성을 중지했습니다.');return;}
    if(game.finished || game.pendingChoice || modalOpen || !game.tutorialCompleted || document.hidden || activeScreen!=='game') {
      autoStatusMessage='튜토리얼·진화·이벤트가 끝난 뒤 육성 화면에서 시작할 수 있습니다.';
      renderAutoCare();return;
    }
    if(!autoResumeAvailable) {
      autoActions=0;
      autoTarget=game.settings.autoCare.batch;
    }
    autoResumeAvailable=false;
    autoResumeAfterDecision=false;
    autoMode=game.settings.autoCare.mode;
    autoStatusMessage='자동 육성을 진행 중입니다.';
    autoTimer=setInterval(runAutoTick,B.autoCare.speeds[game.settings.autoCare.speed]);
    renderAutoCare();
  }
  function updateAutoPreference(field,value) {
    if(autoTimer!==null)return;
    const pref=game.settings.autoCare;
    if(field==='mode' && ['balanced','growth','recover'].includes(value))pref.mode=value;
    else if(field==='batch' && B.autoCare.batches.includes(Number(value)))pref.batch=Number(value);
    else if(field==='speed' && Object.hasOwn(B.autoCare.speeds,value))pref.speed=value;
    else if(field==='safeStop')pref.safeStop=Boolean(value);
    else return;
    autoMode=pref.mode;
    autoResumeAvailable=false;
    autoResumeAfterDecision=false;
    autoActions=0;
    autoTarget=pref.batch;
    autoStatusMessage='자동 육성 설정을 저장했습니다.';
    saveState();
    renderAutoCare();
  }
  function renderAutoCare() {
    const pref=game.settings.autoCare;
    const running=autoTimer!==null;
    const resumable=autoResumeAvailable && !game.pendingChoice && !modalOpen && !game.finished;
    const blocked=game.finished || Boolean(game.pendingChoice) || !game.tutorialCompleted || modalOpen;
    qs('auto-mode').value=pref.mode;
    qs('auto-batch').value=String(pref.batch);
    qs('auto-speed').value=pref.speed;
    qs('auto-safe-stop').checked=pref.safeStop;
    qs('auto-toggle').textContent=running?'자동 육성 중지':resumable?`남은 ${autoTarget-autoActions}회 재개`:'자동 육성 시작';
    qs('auto-toggle').disabled=!running && blocked;
    for(const id of ['auto-mode','auto-batch','auto-speed','auto-safe-stop'])qs(id).disabled=running;
    qs('auto-progress-fill').style.width=`${Math.round(100*Math.min(autoActions,autoTarget)/autoTarget)}%`;
    const next=game.finished?'육성 완료':game.pendingChoice?'선택 이벤트 처리 필요':
      game.tutorialCompleted?(autoChoice()==='carrot'?'당근':'채찍'):'튜토리얼 완료 후 이용';
    qs('auto-next-action').textContent=`다음 예상 행동: ${next}`;
    if(running)qs('auto-status').textContent=`자동 육성 중 · ${autoActions}/${autoTarget}회 · ${autoMode==='balanced'?'균형 관리':autoMode==='growth'?'성장 집중':'안정 회복'}`;
    else if(autoResumeAvailable)qs('auto-status').textContent=`${autoStatusMessage} · 진행 ${autoActions}/${autoTarget}회. 확인 후 재개하세요.`;
    else qs('auto-status').textContent=autoStatusMessage;
  }
  function renderRecentActions() {
    qs('recent-action-list').innerHTML=game.recentActions.length ? game.recentActions.slice(0,8).map(item=>
      `<div class="recent-action-row"><span>${item.action==='carrot'?'🥕 당근':'⚡ 채찍'}</span><span>${`EXP +${item.gained}`}${item.eventId?' · '+escapeHTML(B.events[item.eventId]?.name||'이벤트'):''}</span></div>`
    ).join(''):'아직 기록이 없습니다.';
  }

  // 이벤트는 기존 확률을 유지하며 행동 직전 상태에서 단 한 번 추첨합니다.
  // 선택 이벤트의 경우 행동/기본 이벤트 효과만 먼저 저장하고 경험치·진화를 보류합니다.
  function playAction(action) {
    if(game.finished || game.pendingChoice || modalOpen) return;
    if(!storageWorks || storageCorrupt){toast('저장 문제를 해결하기 전에는 육성을 진행할 수 없습니다.');return;}
    const rollbackState=JSON.parse(JSON.stringify(game));
    const before={...game.stats};
    const eventId=pickEvent(action,before);
    const changes=B.actions[action];
    const recovery=B.conditionalRecovery?.[action];
    const recoveryBonus=Boolean(recovery && before[recovery.stat]>=recovery.threshold);
    const stage2=hasFirstPassive();
    const second=B.secondPassives[game.secondEvolution];
    const baseExp=action==='carrot' ? (stage2?B.carrotExp.phase2:B.carrotExp.phase1) :
      (stage2 ? (second?.effect==='baseExp'?Math.round(B.phaseTwoBaseExp*(1+second.value)):B.phaseTwoBaseExp) : changes.baseExp);
    // 당근: 소량 고정 경험치. 기존 채찍의 훈련 효율·패시브와 별도로 계산합니다.
    let gained=action==='carrot' ? baseExp : Math.max(1,Math.round(baseExp*efficiency(before)));
    if(stage2 && game.evolution==='diligent' && action==='whip') {
      gained=Math.max(1,Math.round(gained*B.passive.diligent.whipExpMultiplier));
    }
    const secondDeltas={motivation:0,stress:0,laziness:0};
    if(action==='carrot' && second?.effect==='carrotMotivation')secondDeltas.motivation=second.value;
    if(action==='carrot' && second?.effect==='carrotLaziness')secondDeltas.laziness=second.value;
    if(action==='whip' && second?.effect==='whipLaziness')secondDeltas.laziness=second.value;
    if(action==='whip' && second?.effect==='whipStress')secondDeltas.stress=second.value;
    for(const key of ['motivation','stress','laziness'])game.stats[key]=clamp(game.stats[key]+changes[key]+secondDeltas[key]);
    if(recoveryBonus) game.stats[recovery.stat]=clamp(game.stats[recovery.stat]+recovery.extra);
    if(stage2 && game.evolution==='easy' && action==='carrot')
      game.stats.stress=clamp(game.stats.stress+B.passive.easy.extraCarrotStressRecovery);
    if(action==='carrot') game.carrotCount++; else game.whipCount++;
    if(game.phase==='phase2') game.stage2Counters[action]++;
    if(game.phase==='phase3') game.stage3Counters[action]++;

    if(eventId) {
      const event=B.events[eventId];
      if(event.expMultiplier && action==='whip') {
        const multiplier=(stage2 && game.evolution==='genius' && event.kind==='positive') ?
          1+(event.expMultiplier-1)*eventBenefitMultiplier() : event.expMultiplier;
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
        if(!saveState()){
          game=rollbackState;
          stopAuto('저장 오류로 자동 육성을 중단했습니다.');
          render();toast('저장 실패: 육성 행동을 되돌렸습니다.');return;
        }
        render();animateAnt(action,false,true);
        playSound(event.kind==='positive'?'positive':'negative');
        showChoiceEvent();
        return;
      }
    }
    completeAction({action,gained,recoveryBonus,eventId,rollbackState});
  }

  function completeAction({action,gained,recoveryBonus,eventId,choiceLabel,rollbackState}) {
    const beforeAction=rollbackState||JSON.parse(JSON.stringify(game));
    const noticeCount=achievementNoticeQueue.length;
    // 선택 이벤트의 행동 횟수와 기본 효과는 여기서 다시 적용하지 않습니다.
    if(!trackedGameStartThisVisit) {
      trackedGameStartThisVisit=true;
      trackAnalytics('game_start',{game_version:B.version});
    }
    game.totalExp+=gained;
    game.exp+=gained;
    const priorLevel=game.level;
    let firstEvolutionReached=false;
    let secondEvolutionReached=false;
    while(game.level<B.maxLevel && game.exp>=B.expRequired(game.level)) {
      game.exp-=B.expRequired(game.level);
      game.level++;
      if(game.level===10 && game.phase==='phase1') {
        finishFirstEvolution(); firstEvolutionReached=true;
      }
      if(game.level===20 && game.phase==='phase2') {finishSecondEvolution();secondEvolutionReached=true;}
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

    let feedback=action==='carrot'?`당근: EXP +${gained} · 의욕 ↑ · 스트레스 ↓ · 나태함 ↑`:`채찍: EXP +${gained} · 스트레스 ↑`;
    if(recoveryBonus) feedback+=action==='carrot'?' · 스트레스 집중 회복(-10 추가)':' · 나태함 집중 교정(-5 추가)';
    if(eventId) feedback+=` · 돌발 이벤트 · ${B.events[eventId].name}`;
    if(choiceLabel) feedback+=` · ${choiceLabel}`;
    if(didLevelUp && !game.finished) feedback+=firstEvolutionReached?' · LV.10 첫 진화 달성!':` · LV.${game.level} 레벨업!`;
    if(game.finished) feedback='LV.30 세 번째 진화 달성! 결과를 확인해 보세요.';
    game.lastFeedback=feedback;
    game.recentActions.unshift({action,gained,eventId:eventId||null,at:Date.now()});
    game.recentActions=game.recentActions.slice(0,12);
    // v0.9: LV.10 이후 완료한 행동만 원정권 진행도에 반영합니다.
    // LV.10 도달 행동은 포함합니다. 미완료 선택 이벤트는 완료 시점에만 한 번 계산합니다.
    if(game.level>=10 && game.expedition.tickets<B.expeditions.maxTickets) {
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
    if(!saveState()) {
      game=beforeAction;
      achievementNoticeQueue.length=noticeCount;
      stopAuto('저장 오류로 자동 육성을 중단했습니다.');
      render();toast('저장 실패: 육성 결과를 되돌렸습니다.');
      if(game.pendingChoice && !modalOpen)showChoiceEvent();
      return false;
    }
    render();animateAnt(action,didLevelUp,Boolean(eventId));
    scheduleAchievementNotices();
    if(game.finished) {
      playSound('evolution');
      showEvolutionResult(findFinishRecord());
    } else if(firstEvolutionReached) {
      playSound('evolution');
      showFirstEvolutionResult();
    } else if(secondEvolutionReached) {
      playSound('evolution');toast(`LV.20 ${SECOND_TYPES[game.secondEvolution].name} · LV.30까지 계속 키울 수 있어요!`);
    } else if(didLevelUp) {
      playSound('level');toast(`레벨 업! LV.${game.level}`);
    } else if(eventId) {
      playSound(B.events[eventId].kind==='positive'?'positive':'negative');
      toast(`돌발 이벤트 · ${B.events[eventId].name}${choiceLabel?' · '+choiceLabel:''}`);
    } else {
      playSound(action);
    }
    return true;
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
    const rollbackState=JSON.parse(JSON.stringify(game));
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
    completeAction({...pending,choiceLabel:choice.label,rollbackState});
  }

  // 저장된 과거 완료 기록 + 현재 진행 중인 개미만 합산합니다.
  // 진화 완료 직후 game의 행동 횟수는 이미 records에 포함되므로 이중 집계하지 않습니다.
  function achievementProgress() {
    const records=game.records.filter(r=>game.finished || r.id!==game.finishedRecordId);
    const activeActions=game.finished?0:game.carrotCount+game.whipCount;
    const activeEvents=game.finished?0:game.eventCount;
    const totalActions=records.reduce((sum,r)=>sum+r.carrotCount+r.whipCount,activeActions);
    const totalEvents=records.reduce((sum,r)=>sum+r.eventCount,activeEvents);
    const types=new Set(records.map(r=>r.type));
    if(hasFirstPassive() && validFirst(game.evolution))types.add(game.evolution);
    return {
      ACH01:totalActions>=1, ACH02:records.length>0 || hasFirstPassive(),
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
    const career=game.records.filter(r=>game.finished || r.id!==game.finishedRecordId).reduce((acc,r)=>{
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
      if(hasFirstPassive() && validFirst(game.evolution)) {
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
    for(const item of B.thirdRewards)if(game.records.some(r=>r.thirdEvolution===item.third) && !unlocked.has(item.id)){unlocked.add(item.id);newly.push(item.name);}
    for(const id of game.expedition.crafted)unlocked.add(id);
    game.decor.unlocked=[...unlocked];
    if(!hasExtraSlot())game.decor.equipped.extra=null;
    if(!unlocked.has(game.decor.equipped.extra) || ['floor','wall','light'].some(slot=>game.decor.equipped[slot]===game.decor.equipped.extra))game.decor.equipped.extra=null;
    // 깨진 저장 상태에 고정된 잠금 장식이 남아 있을 경우 화면에 나타내지 않습니다.
    for(const slot of ['floor','wall','light']) {
      if(!unlocked.has(game.decor.equipped[slot])) game.decor.equipped[slot]=null;
    }
    return newly;
  }
  const resourceCount = id => game.expedition.inventory[id]||0;
  function currentSquad(state=game){
    return state.expedition.squad.map(id=>state.records.find(r=>r.id===id)).filter(Boolean);
  }
  function getSquadBonus(region,squad=currentSquad()){
    const size=Math.min(squad.length,B.expeditionSquad.maxMembers);
    const matching=squad.some(record=>record.type===region.specialty);
    return {size,memberBonus:size*B.expeditionSquad.memberBonus,
      specialtyBonus:matching?B.expeditionSquad.specialtyBonus:0};
  }
  function selectSquadMember(recordId){
    const exists=game.records.some(r=>r.id===recordId);
    if(!exists || !modalOpen || modalKind!=='expedition-squad')return;
    const ok=applyKingdomTransaction(draft=>{
      const current=draft.expedition.squad;
      if(current.includes(recordId))draft.expedition.squad=current.filter(x=>x!==recordId);
      else {
        if(current.length>=B.expeditionSquad.maxMembers)return false;
        draft.expedition.squad=[...current,recordId];
      }
      return true;
    });
    if(ok)renderSquadPicker();
  }
  function renderSquadPicker(){
    const list=qs('expedition-squad-picker');if(!list)return;
    const selected=new Set(game.expedition.squad);
    list.innerHTML=game.records.map(record=>{
      const name=finalInfo(record).name;
      const active=selected.has(record.id);
      const disabled=!active && selected.size>=B.expeditionSquad.maxMembers;
      return `<button type="button" class="expedition-squad-item ${active?'selected':''}" data-squad-record="${escapeHTML(record.id)}" ${disabled?'disabled':''}>
        <span><strong>${escapeHTML(name)}</strong><small>LV.${record.level} · ${dateLabel(record.timestamp)}</small></span>
        <span class="squad-status">${active?'✓ 편성됨':disabled?'정원 초과':'편성'}</span></button>`;
    }).join('')||'<p>아직 완료한 개미가 없습니다. LV.20까지 육성하거나 과거 완료 기록을 불러오세요.</p>';
    qs('expedition-squad-selected').textContent=`${selected.size} / ${B.expeditionSquad.maxMembers}마리 편성`;
  }
  function showSquadPicker(){
    if(game.pendingChoice)return;
    showModal(`<p class="modal-eyebrow">ANT EXPEDITION TEAM</p><h2 id="modal-title">원정대 편성</h2>
      <p class="modal-subtitle">완료한 개미 최대 ${B.expeditionSquad.maxMembers}마리를 편성하세요. 선택 즉시 저장됩니다.</p>
      <p id="expedition-squad-selected" class="expedition-squad-summary"></p>
      <div id="expedition-squad-picker" class="expedition-squad-list"></div>
      <div class="modal-buttons"><button id="expedition-squad-close" type="button" class="modal-primary">편성 완료</button></div>`,'expedition-squad');
    qs('expedition-squad-picker').addEventListener('click',e=>{
      const target=e.target.closest('[data-squad-record]');if(target)selectSquadMember(target.dataset.squadRecord);
    });
    qs('expedition-squad-close').addEventListener('click',closeModal);
    renderSquadPicker();
  }
  function renderSquad(){
    const members=currentSquad();
    qs('expedition-squad-summary').textContent=`${members.length} / ${B.expeditionSquad.maxMembers}마리 · 현재 원정대 보너스 기본 +${members.length}${members.length?' · 지역 특화 시 +1':''}`;
    qs('expedition-squad-roster').innerHTML=Array.from({length:B.expeditionSquad.maxMembers},(_,i)=>{
      const member=members[i];
      if(!member)return '<div class="expedition-squad-member empty"><span class="squad-portrait">＋</span><strong>빈 자리</strong></div>';
      const name=finalInfo(member).name;
      return `<div class="expedition-squad-member"><span class="squad-portrait">${portraitEmoji[member.type]}</span><strong>${escapeHTML(name)}</strong><small>LV.${member.level}</small></div>`;
    }).join('');
  }
  function weeklyForDisplay(){return game.weekly.key===currentWeekKey()?game.weekly:freshWeekly();}
  function weeklyCounter(weekly,id){return id==='trips'?weekly.trips:id==='resources'?weekly.resources:weekly.squadTrips;}
  function syncWeeklyForTransaction(draft){
    if(draft.weekly.key!==currentWeekKey())draft.weekly=freshWeekly();
  }
  function claimWeeklyGoal(goalId){
    const goal=B.weeklyGoals.find(x=>x.id===goalId);
    if(!goal || modalOpen || game.pendingChoice)return;
    const ok=applyKingdomTransaction(draft=>{
      syncWeeklyForTransaction(draft);
      if(draft.weekly.claimed.includes(goalId)||weeklyCounter(draft.weekly,goalId)<goal.target)return false;
      for(const [resource,amount] of Object.entries(goal.reward)){
        if(draft.expedition.inventory[resource]+amount>maximumResource)return false;
      }
      for(const [resource,amount] of Object.entries(goal.reward))draft.expedition.inventory[resource]+=amount;
      draft.weekly.claimed.push(goalId);
      return true;
    });
    if(ok)toast(`주간 목표 완료 · ${goal.name} 보상을 수령했습니다!`);
  }
  function renderWeekly(){
    const weekly=weeklyForDisplay();
    qs('weekly-goal-label').textContent=weekly.key+' (KST)';
    qs('weekly-goals-grid').innerHTML=B.weeklyGoals.map(goal=>{
      const count=weeklyCounter(weekly,goal.id),completed=weekly.claimed.includes(goal.id);
      const reward=resourceCostLabel(goal.reward),canClaim=count>=goal.target&&!completed;
      return `<article class="weekly-goal-card"><div class="weekly-goal-top"><strong>${escapeHTML(goal.name)}</strong><small>${Math.min(count,goal.target)} / ${goal.target}</small></div>
        <small>${escapeHTML(goal.description)}</small><div class="weekly-goal-track"><span style="width:${Math.min(100,100*count/goal.target)}%"></span></div>
        <div class="weekly-goal-actions"><span class="weekly-goal-reward">보상 ${reward}</span>
        <button class="mini-button" type="button" data-claim-weekly="${goal.id}" ${canClaim?'':'disabled'}>${completed?'수령 완료':canClaim?'보상 받기':'진행 중'}</button></div></article>`;
    }).join('');
  }
  function renderRareFinds(){
    const found=new Set(game.expedition.discoveries);
    qs('rare-find-count').textContent=`${found.size} / ${B.rareFinds.length}`;
    qs('rare-finds-grid').innerHTML=B.rareFinds.map(item=>{
      const unlocked=found.has(item.id);
      const region=B.expeditions.regions.find(r=>r.id===item.region);
      return `<article class="rare-find-card ${unlocked?'':'locked'}"><span class="rare-find-icon">${unlocked?item.icon:'❔'}</span>
        <span><strong>${unlocked?escapeHTML(item.name):'아직 발견하지 못함'}</strong><small>${escapeHTML(region.name)}${unlocked?' · '+escapeHTML(item.description):' · 탐험으로 발견'}</small></span></article>`;
    }).join('');
  }
  const canExplore = region => game.level>=region.minLevel && game.level>=10 && game.expedition.tickets>0 &&
    resourceCount(region.main)<maximumResource && !game.pendingChoice && !modalOpen && !storageCorrupt;
  function exploreRegion(regionId) {
    const region=B.expeditions.regions.find(r=>r.id===regionId);
    if(!region || !canExplore(region))return;
    if(Date.now()-lastExploreClick<450)return;
    const randomBonus=Math.random()<region.bonusChance?region.bonus:0;
    const b=getFacilityBonus(region.id);
    const squad=getSquadBonus(region);
    const available=maximumResource-resourceCount(region.main);
    const amount=Math.min(available,region.reward+randomBonus+b.total+squad.memberBonus+squad.specialtyBonus);
    if(amount<=0)return;
    const rare=RARE_BY_REGION[region.id];
    const foundRare=rare && !game.expedition.discoveries.includes(rare.id) && Math.random()<rare.chance ? rare.id:null;
    const succeeded=applyKingdomTransaction(draft=>{
      if(draft.level<region.minLevel || draft.expedition.tickets<=0 || draft.expedition.inventory[region.main]>=maximumResource)return false;
      draft.expedition.tickets--;
      const leader=passiveLeader(draft),type=leader?.thirdEvolution,effect=THIRD_TYPES[type]?.effect;
      const eligible=effect==='general' || (effect==='food' && region.main==='food') ||
        (effect==='craft' && B.craftingItems.some(item=>Object.hasOwn(item.cost,region.main)));
      let passiveBonus=0;
      if(eligible){
        const key=type+':'+region.main,units=(draft.expedition.bonusRemainders[key]||0)+amount*5;
        passiveBonus=Math.min(available-amount,Math.floor(units/100));
        draft.expedition.bonusRemainders[key]=units%100;
      }
      const awarded=amount+passiveBonus;
      draft.expedition.inventory[region.main]+=awarded;
      draft.expedition.totalTrips++;
      if(foundRare && !draft.expedition.discoveries.includes(foundRare))draft.expedition.discoveries.push(foundRare);
      draft.expedition.trips.unshift({region:region.id,resource:region.main,amount:awarded,passiveBonus,passiveType:type||null,at:Date.now(),
        base:region.reward,randomBonus,facilityBonus:b.facilityBonus,workerBonus:b.workerBonus,
        squadBonus:squad.memberBonus+squad.specialtyBonus,rareId:foundRare});
      draft.expedition.trips=draft.expedition.trips.slice(0,12);
      syncWeeklyForTransaction(draft);
      draft.weekly.trips++;
      draft.weekly.resources+=awarded;
      if(squad.size>=2)draft.weekly.squadTrips++;
      return true;
    });
    if(succeeded){lastExploreClick=Date.now();toast(`${region.name} 원정 · ${B.resources.find(r=>r.id===region.main).name} +${game.expedition.trips[0].amount}${foundRare?' · 희귀 발견물 획득!':''}`);}
  }
  function canCraft(item) {
    return !game.expedition.crafted.includes(item.id) && Object.entries(item.cost).every(([id,amount])=>resourceCount(id)>=amount);
  }
  function craftItem(id) {
    const item=B.craftingItems.find(x=>x.id===id);
    if(!item || modalOpen || game.pendingChoice || !canCraft(item))return;
    const ok=applyKingdomTransaction(draft=>{
      if(draft.expedition.crafted.includes(id) ||
        !Object.entries(item.cost).every(([resource,amount])=>draft.expedition.inventory[resource]>=amount))return false;
      for(const [resource,amount] of Object.entries(item.cost))draft.expedition.inventory[resource]-=amount;
      draft.expedition.crafted.push(id);
      if(!draft.decor.unlocked.includes(id))draft.decor.unlocked.push(id);
      return true;
    });
    if(ok)toast(`제작 성공 · ${item.name}! 꾸미기에서 배치하세요.`);
  }
  function renderExpedition() {
    const exp=game.expedition;
    const leaderSelect=qs('passive-leader');
    leaderSelect.innerHTML='<option value="">패시브 대표 없음</option>'+game.records.filter(r=>validThird(r.thirdEvolution,r.secondEvolution)).map(r=>
      `<option value="${escapeHTML(r.id)}">${escapeHTML(finalInfo(r).name)} · ${dateLabel(r.timestamp)}</option>`).join('');
    leaderSelect.value=exp.passiveRecordId||'';
    qs('passive-leader-status').textContent=passiveLeader()?thirdStatus(passiveLeader().thirdEvolution):'LV.30 완료 개미 한 마리를 대표로 선택하세요. 원정대 기본 보너스와 별도로 대표 패시브만 적용됩니다.';
    qs('expedition-tickets').textContent=`${exp.tickets} / ${B.expeditions.maxTickets}`;
    const unlocked=game.level>=10;
    const notice=qs('expedition-level-notice');
    notice.classList.toggle('locked',!unlocked);
    notice.textContent=unlocked?'✅ LV.10 해금 완료 · 완료된 육성 행동 6회마다 원정권 1장 지급':
      `🔒 LV.10부터 원정과 원정권 획득이 활성화됩니다. 현재 LV.${game.level} · LV.1~9 행동은 원정권에 반영되지 않습니다.`;
    qs('expedition-next-ticket').textContent=!unlocked?'LV.10 달성 후 적립 시작 · 기존 원정권은 보존됩니다.':
      exp.tickets===B.expeditions.maxTickets?'원정권 최대 보유 · 더 이상 쌓이지 않습니다.':
      `다음 원정권까지 ${B.expeditions.actionsPerTicket-exp.ticks}회 육성 행동`;
    renderSquad();renderRareFinds();renderWeekly();
    qs('resource-wallet').innerHTML=B.resources.map(r=>
      `<div class="resource-pill"><span>${r.icon} ${r.name}</span><strong>${resourceCount(r.id).toLocaleString('ko-KR')}</strong></div>`
    ).join('');
    qs('expedition-regions').innerHTML=B.expeditions.regions.map(region=>{
      const opened=game.level>=region.minLevel;
      const allowed=opened && canExplore(region);
      const b=getFacilityBonus(region.id);
      const squad=getSquadBonus(region);
      const squadTotal=squad.memberBonus+squad.specialtyBonus;
      const min=region.reward+b.total+squadTotal,max=min+region.bonus;
      return `<article class="region-card ${opened?'':'region-locked'}"><span class="region-icon">${region.icon}</span>
        <div class="region-content"><strong>${escapeHTML(region.name)} <small>LV.${region.minLevel}+</small></strong>
          <p>${escapeHTML(region.description)}</p><small>원정권 1장 · ${escapeHTML(B.resources.find(r=>r.id===region.main).name)} ${min}~${max}개</small>
          <small class="squad-bonus-detail">왕국 +${b.total} · 원정대 +${squadTotal}</small>
          ${THIRD_TYPES[passiveLeader()?.thirdEvolution]?.effect==='details'?`<small>별의 기록 · 추가 보상 확률 ${percent(region.bonusChance)} · 희귀 발견 ${RARE_BY_REGION[region.id]?.name||'없음'} (${percent(RARE_BY_REGION[region.id]?.chance||0)}) · ${exp.discoveries.includes(RARE_BY_REGION[region.id]?.id)?'발견 완료':'미발견'}</small>`:''}
          <details class="kingdom-reward-breakdown"><summary>보너스 상세</summary>기본 ${region.reward} · 시설 +${b.facilityBonus} · 일꾼 +${b.workerBonus} · 원정대 +${squadTotal} · 특별 발견 시 +${region.bonus}</details></div>
        <button class="mini-button" data-expedition="${region.id}" type="button" ${allowed?'':'disabled'}>${!opened?'잠김':!exp.tickets?'원정권 부족':resourceCount(region.main)>=maximumResource?'재고 한도':'탐험'}</button></article>`;
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
      return `<div class="expedition-trip"><span>${region.icon} ${escapeHTML(region.name)}${t.rareId && RARE_IDS.has(t.rareId)?' ✨':''}</span><strong>${resource.icon} +${t.amount}</strong>${THIRD_TYPES[passiveLeader()?.thirdEvolution]?.effect==='details'?`<small class="trip-details">${dateLabel(t.at)} · 기본 ${t.base??'과거 기록 없음'} / 추가 ${t.randomBonus??'?'} / 시설 ${t.facilityBonus??'?'} / 일꾼 ${t.workerBonus??'?'} / 원정대 ${t.squadBonus} / 패시브 ${t.passiveBonus||0}${t.rareId?' · 발견: '+escapeHTML(B.rareFinds.find(r=>r.id===t.rareId)?.name||''):''}</small>`:''}</div>`;
    }).join(''):'아직 원정 기록이 없습니다.';
  }


function renderDecorMarkup(item) {
  if(!item)return '';
  const shell = (inner='') => `<div class="decor-object ${escapeHTML(item.id)}">${inner}</div>`;
  switch(item.id) {
    case 'carrot-basket':
      return shell('<span class="basket-base"></span><span class="carrot-top carrot-a"></span><span class="carrot-top carrot-b"></span><span class="carrot-top carrot-c"></span>');
    case 'leaf-bed':
      return shell('<span class="leaf-mat"></span><span class="leaf-pillows"></span>');
    case 'toolbox':
      return shell('<span class="toolbox-body"></span><span class="toolbox-handle"></span><span class="toolbox-lock"></span>');
    case 'seed-pile':
      return shell('<span class="seed-sack"></span><span class="seed-dot seed-1"></span><span class="seed-dot seed-2"></span><span class="seed-dot seed-3"></span>');
    case 'wooden-bench':
      return shell('<span class="bench-seat"></span><span class="bench-leg leg-a"></span><span class="bench-leg leg-b"></span><span class="bench-back"></span>');
    case 'growth-chart':
      return shell('<span class="chart-board"></span><span class="chart-line line-a"></span><span class="chart-line line-b"></span><span class="chart-line line-c"></span>');
    case 'flower-garland':
      return shell('<span class="garland-rope"></span><span class="garland-flower flower-a"></span><span class="garland-flower flower-b"></span><span class="garland-flower flower-c"></span>');
    case 'trophy-shelf':
      return shell('<span class="shelf-board"></span><span class="mini-trophy"></span><span class="mini-jar"></span>');
    case 'moss-banner':
      return shell('<span class="banner-top"></span><span class="banner-cloth"></span><span class="banner-mark"></span>');
    case 'carved-board':
      return shell('<span class="sign-board"></span><span class="sign-pin"></span><span class="sign-cut"></span>');
    case 'mushroom-light':
      return shell('<span class="mush-cap"></span><span class="mush-glow"></span><span class="mush-stem"></span>');
    case 'firefly-jar':
      return shell('<span class="jar-body"></span><span class="jar-lid"></span><span class="firefly fly-a"></span><span class="firefly fly-b"></span><span class="firefly fly-c"></span>');
    case 'star-lantern':
      return shell('<span class="crystal-core"></span><span class="crystal-frame"></span><span class="crystal-shine"></span>');
    case 'crystal-lamp':
      return shell('<span class="crystal-core"></span><span class="crystal-frame small"></span><span class="lamp-chain"></span>');
    case 'glow-lantern':
      return shell('<span class="lantern-chain"></span><span class="lantern-body"></span><span class="lantern-glow"></span>');
    default:
      return shell(`<span class="decor-fallback">${escapeHTML(item.icon || '•')}</span>`);
  }
}

  function nestTheme() {
    const total=game.carrotCount+game.whipCount;
    if(!total)return {id:'neutral',label:'포근한 개미굴'};
    const ratio=getRatio();
    if(ratio<=B.evolution.easyMaxWhipRatio)return {id:'cozy',label:'이끼 쉼굴'};
    if(ratio<B.evolution.geniusMaxWhipRatio)return {id:'balanced',label:'반짝 연구굴'};
    return {id:'workshop',label:'튼튼 공방굴'};
  }

function renderNestScene() {
  const extra=hasExtraSlot()?ALL_DECOR.find(d=>d.id===game.decor.equipped.extra):null;
  qs('nest-extra-display').innerHTML=extra?renderDecorMarkup(extra):'';
  const theme=nestTheme();
  qs('habitat').dataset.theme=theme.id;
  qs('scene-location').textContent=`⌂  ${theme.label}`;
  for(const slot of ['floor','wall','light']) {
    const item=ALL_DECOR.find(d=>d.id===game.decor.equipped[slot] && d.slot===slot);
    const el=qs(`nest-${slot}-display`);
    el.innerHTML=item?renderDecorMarkup(item):'';
    el.dataset.item=item?.id||'';
    el.title=item?.name||'';
  }
}
function renderDecorations() {

    const owned=new Set(game.decor.unlocked);
    qs('extra-decor-slot').hidden=!hasExtraSlot();
    const extra=qs('extra-decoration');
    extra.innerHTML='<option value="">추가 장식 없음</option>'+ALL_DECOR.filter(d=>owned.has(d.id) && !['floor','wall','light'].some(s=>game.decor.equipped[s]===d.id)).map(d=>`<option value="${d.id}">${escapeHTML(d.name)}</option>`).join('');
    extra.value=game.decor.equipped.extra||'';
    qs('decor-count').textContent=`${owned.size} / ${ALL_DECOR.length}`;
    qs('decor-progress').style.width=`${Math.round(100*owned.size/ALL_DECOR.length)}%`;
    qs('nest-theme-caption').textContent=`현재 개미집 분위기: ${nestTheme().label}`;
    qs('decorations-grid').innerHTML=ALL_DECOR.map(item=>{
      const unlocked=owned.has(item.id);
      const equipped=game.decor.equipped[item.slot]===item.id;
      return `<article class="decor-card ${unlocked?'':'locked'} ${equipped?'equipped':''}">
        <span class="decor-icon" aria-hidden="true">${unlocked?escapeHTML(item.icon):'🔒'}</span>
        <div class="decor-info"><strong>${escapeHTML(item.name)}</strong>
          <small>${unlocked?escapeHTML(item.desc):validCraft(item.id)?'원정에서 재료를 모아 제작하세요':item.third?'해금 조건 · '+escapeHTML(THIRD_TYPES[item.third].name)+' 수집':`해금 조건 · ${escapeHTML(item.hint)}`}</small>
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
    if(!applyKingdomTransaction(draft=>{draft.decor.equipped[item.slot]=equipped?null:id;if(draft.decor.equipped.extra===id)draft.decor.equipped.extra=null;return true;}))return;
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
  function finishSecondEvolution() {
    if(game.phase!=='phase2')return;
    game.secondEvolution=secondEvolutionType();
    game.secondReachedAt=Date.now();game.stage3Counters={carrot:0,whip:0};game.phase='phase3';
  }
  function finishFinalEvolution() {
    if(game.finished || game.phase!=='phase3')return;
    const type=thirdTypeFor(game.secondEvolution,stage3Ratio());
    if(!type)return;
    game.thirdEvolution=type;game.finished=true;game.phase='completed';game.exp=0;
    const record={
      id:game.finishedRecordId||`ant-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp:Date.now(),type:game.evolution,secondEvolution:game.secondEvolution,thirdEvolution:type,level:30,
      firstEvolution:game.firstEvolution?{...game.firstEvolution,statsAtFirst:{...game.firstEvolution.statsAtFirst}}:null,
      stage2Counters:{...game.stage2Counters},stage3Counters:{...game.stage3Counters},secondReachedAt:game.secondReachedAt,
      stats:{...game.stats},carrotCount:game.carrotCount,whipCount:game.whipCount,
      totalExp:game.totalExp,eventCount:game.eventCount,balanceVersion:B.version,eventsByType:{...game.eventsByType}
    };
    // An explicitly resumed legacy ant upgrades its record in place; no duplicate workers or rewards.
    const index=game.records.findIndex(r=>r.id===record.id);
    if(index>=0){record.legacyLevel20=game.records[index];game.records[index]=record;}
    else game.records.unshift(record);
    game.finishedRecordId=record.id;
    if(!game.expedition.passiveRecordId)game.expedition.passiveRecordId=record.id;
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


function stateDrivenMood() {
  if(game.finished) return 'happy';
  const tier=statusTier(game.stats);
  if(game.stats.laziness>=70) return 'sleepy';
  if(game.stats.stress>=82 || game.stats.motivation<=18) return 'sad';
  if(tier==='warn') return 'worried';
  if(tier==='good') return 'happy';
  return 'normal';
}
function reactionMood() {
  return temporaryMood || stateDrivenMood();
}
function moodLabel(){

    if(game.finished)return game.phase==='legacyComplete'?'✧ 첫 진화 완료':'✧ 두 번째 진화 완료';
    const tier=statusTier(game.stats);
    return {good:'☘ 기분 최고',normal:'☘ 평온한 상태',warn:'◈ 살짝 불안한 상태',danger:'● 지친 상태'}[tier];
  }
  function render() {
    const firstName=B.types[game.evolution]?.name||'신입 개미';
    const secondName=SECOND_TYPES[game.secondEvolution]?.name;
    qs('ant-name').textContent=THIRD_TYPES[game.thirdEvolution]?.name || secondName || (game.phase==='phase1'?'신입 개미':firstName);
    qs('evolution-stage').textContent=game.phase==='phase1'?'첫 번째 여정':game.phase==='phase2'?'두 번째 여정':game.phase==='phase3'?'세 번째 여정':game.phase==='legacyComplete'?'첫 진화 달성':game.thirdEvolution?'세 번째 진화 달성':'두 번째 진화 달성';
    qs('growth-stage-label').textContent=game.phase==='phase1'?'첫 번째 성장 · LV.1~10':
      game.phase==='legacyComplete'?'구버전 육성 완료 · LV.10':game.finished && game.level===20?'구버전 육성 완료 · LV.20':game.level>=20?'세 번째 성장 · LV.20~30':'두 번째 성장 · LV.10~20';
    qs('level-badge').textContent=`LV. ${game.level}`;
    const required=game.finished?0:B.expRequired(game.level);
    qs('xp-text').textContent=game.finished?'MAX LEVEL':`${game.exp} / ${required} EXP`;
    qs('xp-fill').style.width=`${game.finished?100:Math.min(100,(game.exp/required)*100)}%`;
    qs('xp-progress').setAttribute('aria-valuenow',String(game.finished?100:Math.round(game.exp/required*100)));
    qs('evolution-hint').textContent=game.finished?'육성 완료':game.phase==='phase1'?'LV.10 첫 진화':game.phase==='phase3'?'LV.30 세 번째 진화':'LV.20 두 번째 진화';
    qs('progress-narration').textContent=game.finished?'성장의 발자국 완성!':
      game.phase==='phase1'?`첫 진화까지 ${10-game.level}레벨`:game.phase==='phase3'?`세 번째 진화까지 ${30-game.level}레벨`:`두 번째 진화까지 ${20-game.level}레벨`;
    qs('scene-status').textContent=`● ${B.eventTiers[statusTier(game.stats)].label} 상태`;
    qs('scene-action-text').textContent=game.finished?'새로운 가능성 발견':`${game.carrotCount+game.whipCount}번의 작은 선택`;
    qs('speech-bubble').textContent=game.lastSpeech;
    qs('mood-label').textContent=moodLabel();
    const ant=qs('ant-figure');
    ant.dataset.evolution=game.evolution||'newbie';
    ant.dataset.secondEvolution=game.secondEvolution||'none';
    ant.dataset.thirdEvolution=game.thirdEvolution||'none';
    const secondMark=qs('second-evolution-mark');
    secondMark.hidden=!game.secondEvolution;
    secondMark.textContent=SECOND_TYPES[game.secondEvolution]?.icon||'';
    secondMark.title=SECOND_TYPES[game.secondEvolution]?.name||'';
    ant.dataset.mood=reactionMood();
    ant.setAttribute('aria-label',`${qs('ant-name').textContent} 캐릭터`);
    const passive=qs('active-passive');
    passive.hidden=!game.evolution;
    if(game.evolution) {
      qs('passive-name').textContent=`${firstName} · ${B.types[game.evolution].passive}`;
      qs('passive-effect').textContent=passiveDescription(game.evolution)+(game.secondEvolution?' · '+B.secondPassives[game.secondEvolution].name+': '+B.secondPassives[game.secondEvolution].description:'')+(game.thirdEvolution?' · '+thirdStatus(game.thirdEvolution):'');
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
    qs('resume-level20').hidden=!(game.finished && game.level===20 && game.secondEvolution);
    renderEvolutionGuide();
    renderAutoCare();
    renderRecentActions();
    renderExpedition();
    renderNestScene();
    renderDecorations();
    renderKingdom();
    qs('finished-panel').hidden=!game.finished;
    if(game.finished) {
      qs('finished-name').textContent=THIRD_TYPES[game.thirdEvolution]?.name || secondName || firstName;
      qs('finished-caption').textContent=game.thirdEvolution?'세 번째 진화 완료 · 탐험과 개미집 활동을 계속할 수 있어요.':game.level===20?'두 번째 진화를 마쳤어요!':'첫 진화를 마쳤어요! (구버전 기록)';
    }
    renderTutorial();
    renderRecords();
    renderAchievements();
    renderSettings();
    showScreen(activeScreen,false);
  }
  function renderEvolutionGuide() {
    const inThird=game.phase==='phase3' || Boolean(game.thirdEvolution);
    const inSecond=game.phase==='phase2' || game.phase==='completed' || inThird;
    const count=inThird ? game.stage3Counters.carrot+game.stage3Counters.whip : inSecond ? game.stage2Counters.carrot+game.stage2Counters.whip : game.carrotCount+game.whipCount;
    const ratio=inThird ? stage3Ratio() : inSecond ? stage2Ratio() : getRatio();
    const type=inThird ? thirdTypeFor(game.secondEvolution,stage3Ratio()) : inSecond ? secondEvolutionType() : evolutionType();
    const prediction=inThird ? THIRD_TYPES[type]?.name : inSecond ? SECOND_TYPES[type]?.name : B.types[type]?.name;
    qs('guide-stage-label').textContent=inThird?'LV.30 세 번째 진화':inSecond?'LV.20 두 번째 진화':'LV.10 첫 진화';
    qs('guide-prediction').textContent=game.finished ?
      (game.phase==='completed'?`${THIRD_TYPES[game.thirdEvolution]?.name||SECOND_TYPES[game.secondEvolution]?.name||'최종 개미'} · 확정`:`${B.types[game.evolution]?.name||'태평 개미'} · 확정`) :
      count ? prediction||'아직 미정' : '아직 미정';
    qs('guide-ratio').textContent=count?`채찍 ${percent(ratio)}`:'행동 기록 없음';
    qs('guide-note').textContent=game.finished?'최종 진화가 확정되었습니다. 새 개미를 만나 또 다른 길을 찾아보세요.':
      inThird?'LV.20 이후 행동 비율만 세 번째 진화에 적용됩니다. 55% 미만 A / 55% 이상 B.':inSecond?'LV.10 이후의 행동 비율만 두 번째 진화에 적용됩니다. 현재 예상은 바뀔 수 있습니다.':
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
    if(hasFirstPassive() && validFirst(game.evolution))discovered.add(game.evolution);
    qs('collection-count').textContent=`${discovered.size} / 3`;
    qs('collection-fill').style.width=`${100*discovered.size/3}%`;
    qs('record-count').textContent=`${game.records.length}개의 완료 기록`;
    qs('collection-grid').innerHTML=Object.entries(B.types).map(([type,info])=>{
      const count=game.records.filter(r=>r.type===type).length;
      const active=game.phase==='phase2' && game.evolution===type;
      return `<div class="collection-item ${count||active?'':'locked'}"><div class="collection-portrait">${count||active?portraitEmoji[type]:'?'}</div><h3>${count||active?info.name:'??? 개미'}</h3><p>${active?'현재 육성 중':count?`${count}번 발견`:'미발견'}</p></div>`;
    }).join('');
    const thirdFound=new Set(game.records.map(r=>r.thirdEvolution).filter(id=>THIRD_TYPES[id]));
    qs('third-collection-count').textContent=`${thirdFound.size} / 12`;
    qs('third-collection-grid').innerHTML=Object.entries(THIRD_TYPES).map(([id,info])=>`<div class="second-ant-card ${thirdFound.has(id)?'':'locked'}"><span class="second-icon">${thirdFound.has(id)?info.icon:'🔒'}</span><span class="second-info"><strong>${thirdFound.has(id)?escapeHTML(info.name):'미발견 개미'}</strong><small>${escapeHTML(SECOND_TYPES[info.parent].name)} · ${info.branch} (${info.branch==='A'?'<55%':'≥55%'})</small>${thirdFound.has(id)?`<small>칭호: ${escapeHTML(info.title)}</small><small>${escapeHTML(thirdStatus(id))}</small>`:''}</span></div>`).join('');
    const secondFound=new Set(game.records.filter(r=>validSecond(r.secondEvolution,r.type)).map(r=>r.secondEvolution));
    if(game.secondEvolution)secondFound.add(game.secondEvolution);
    qs('second-collection-count').textContent=`${secondFound.size} / ${secondEvolutionIds.length}`;
    qs('second-collection-fill').style.width=`${100*secondFound.size/secondEvolutionIds.length}%`;
    qs('second-collection-grid').innerHTML=secondEvolutionIds.map(id=>{
      const info=SECOND_TYPES[id];const found=secondFound.has(id);
      return `<div class="second-ant-card ${found?'':'locked'}"><span class="second-icon">${found?escapeHTML(info.icon):'🔒'}</span><span class="second-info"><strong>${found?escapeHTML(info.name):'미발견 개미'}</strong><small>${found?escapeHTML(B.types[info.parent].name):'두 번째 진화'}</small></span></div>`;
    }).join('');
    const list=qs('record-list');
    if(!game.records.length) {list.innerHTML='<div class="empty-records">아직 완료한 육성 기록이 없어요.<br>LV.20에서 두 번째 진화에 도전해 보세요!</div>';return;}
    list.innerHTML=game.records.map(r=>{
      const next=r.secondEvolution?finalInfo(r):null;
      const third=THIRD_TYPES[r.thirdEvolution];
      return `<button type="button" class="record-row" data-record-id="${escapeHTML(r.id)}"><span class="record-icon">${next?escapeHTML(next.icon):portraitEmoji[r.type]}</span><span class="record-info"><strong>${next?escapeHTML(next.name):escapeHTML(B.types[r.type].name)}</strong><small>LV.${r.level} ${third?'세 번째 진화':next?'두 번째 진화':'첫 번째 진화 · 구버전'} · ${dateLabel(r.timestamp)} · ${r.carrotCount+r.whipCount}회 행동</small></span><span class="record-arrow">›</span></button>`;
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

function animateAnt(action,didLevelUp,eventOccurred=false) {
  const figure=qs('ant-figure');
  const scene=qs('habitat');
  temporaryMood = action==='carrot' ? 'eating' : action==='whip' ? 'ouch' : 'surprised';
  figure.dataset.mood = reactionMood();
  clearTimeout(reactionTimer);
  figure.classList.remove('reaction-carrot','reaction-whip','reaction-event');
  scene.classList.remove('level-celebrate','action-carrot','action-whip','action-event');
  void figure.offsetWidth;
  figure.classList.add(`reaction-${action}`);
  scene.classList.add(`action-${action}`);
  if(eventOccurred)scene.classList.add('action-event');
  if(didLevelUp)scene.classList.add('level-celebrate');
  reactionTimer=setTimeout(()=>{
    figure.classList.remove('reaction-carrot','reaction-whip','reaction-event');
    scene.classList.remove('level-celebrate','action-carrot','action-whip','action-event');
    temporaryMood = null;
    figure.dataset.mood = stateDrivenMood();
  },780);
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
    if(name!=='game' && (autoTimer!==null || autoResumeAvailable))stopAuto('화면 이동으로 자동 육성을 중단했습니다.');
    for(const screen of ['game','expedition','records','nest','settings'])qs(`screen-${screen}`).hidden=screen!==name;
    document.querySelectorAll('[data-screen]').forEach(button=>{
      const active=button.dataset.screen===name;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    if(scroll)window.scrollTo({top:0,behavior:'instant'});
  }
  function showModal(content, kind = null) {
    // 사용자 선택이나 첫 진화 안내가 자동 육성을 막았다면 확인이 끝나는 즉시 재개합니다.
    // 일반 팝업, 수동 행동, 화면 이탈, 저장 오류에서는 자동 재개하지 않습니다.
    if(autoTimer!==null) {
      const resumable=kind==='choice'||kind==='first-evolution';
      stopAuto('이벤트 선택을 완료하면 남은 자동 육성을 이어갑니다.',resumable);
      autoResumeAfterDecision=resumable && autoResumeAvailable;
    }
    modalKind = kind;
    qs('modal-close').hidden=kind==='choice';
    previousFocus=document.activeElement;
    qs('modal-body').innerHTML=content;
    qs('modal-backdrop').hidden=false;
    modalOpen=true;
    document.body.style.overflow='hidden';
    const focusTarget=qs('modal-close').hidden ? qs('modal-body').querySelector('button:not([disabled])') : qs('modal-close');
    focusTarget?.focus();
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
    renderAutoCare();
    renderExpedition();
    renderKingdom();
    // 선택형 이벤트/진화 팝업 종료 후, 대기 중인 업데이트 안내를 보여 줍니다.
    queueMicrotask(()=>{
      if(queuedPatchOnLaunch && !modalOpen && !game.pendingChoice) {
        queuedPatchOnLaunch=false;showPatchNotes();
      }
      if(!modalOpen) scheduleAchievementNotices();
      // 선택 결과와 진화 내용을 저장한 뒤에만 자동 재개합니다. 여기서 재개하면
      // 선택 이벤트가 EXP/행동 횟수에 중복 반영되지 않습니다.
      if(autoResumeAfterDecision && autoResumeAvailable && !modalOpen && !game.pendingChoice) {
        if(game.finished || !storageWorks || storageCorrupt || document.hidden || activeScreen!=='game') {
          stopAuto('자동 육성 재개 조건이 충족되지 않아 중단했습니다.');
        } else if(game.settings.autoCare.safeStop && statusTier(game.stats)==='danger') {
          stopAuto('위험 상태여서 자동 육성을 중단했습니다. 직접 상태를 확인하세요.');
        } else if(autoActions>=autoTarget) {
          stopAuto(`자동 육성 ${autoTarget}회 완료 · 다시 시작할 수 있습니다.`);
        } else {
          autoResumeAfterDecision=false;
          toggleAutoCare();
        }
      }
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
    const third=THIRD_TYPES[record.thirdEvolution];
    const name=third?.name||next?.name||type.name;
    showModal(`<p class="modal-eyebrow">✦ ${third?'THIRD EVOLUTION':next?'SECOND EVOLUTION':'FIRST EVOLUTION · LEGACY'} ✦</p>
      <h2 id="modal-title">${escapeHTML(name)}</h2><p class="modal-subtitle">${third?'LV.30 세 번째 진화를 달성했습니다!':next?'LV.20 두 번째 진화를 달성했습니다!':'구버전 LV.10 진화 기록입니다.'}</p>
      <div class="evolution-portrait" id="modal-portrait"></div>
      <div class="evolution-quote">“${escapeHTML(next?.quote||type.quote)}”</div>
      <div class="passive-chip"><strong>✦ ${escapeHTML(type.passive)}</strong><br>${escapeHTML(passiveDescription(record.type))}${next?`<br><strong>${escapeHTML(next.label)}</strong>`:''}</div>
      ${next?`<div class="second-evolution-badge">${escapeHTML(growthRating(record.stats))}</div>`:''}
      ${third?`<div class="passive-chip"><strong>칭호 · ${escapeHTML(third.title)}</strong><br>${escapeHTML(thirdStatus(record.thirdEvolution))}<br>계보: ${escapeHTML(type.name)} → ${escapeHTML(next.name)} → ${escapeHTML(third.name)}</div>`:''}${recordSummary(record)}
      <div class="modal-buttons"><button class="modal-primary" id="modal-new-ant" type="button">새로운 개미 키우기</button><button class="modal-secondary" id="modal-keep" type="button">지금 결과 더 살펴보기</button></div>`);
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    clone.dataset.thirdEvolution=record.thirdEvolution||'none';
    clone.dataset.evolution=record.type;clone.dataset.secondEvolution=next?record.secondEvolution:'none';clone.dataset.mood='happy';
    qs('modal-portrait').appendChild(clone);
    if(next)qs('modal-portrait').insertAdjacentHTML('beforeend',`<span class="second-emblem" aria-hidden="true">${escapeHTML(third?.icon||next.icon)}</span>`);
    qs('modal-new-ant').addEventListener('click',()=>{closeModal();confirmNewAnt();});
    qs('modal-keep').addEventListener('click',closeModal);
  }
  function showRecordDetails(id) {
    const record=game.records.find(r=>r.id===id);
    if(!record)return;
    const type=B.types[record.type];
    const next=validSecond(record.secondEvolution,record.type)?SECOND_TYPES[record.secondEvolution]:null;
    const third=THIRD_TYPES[record.thirdEvolution];
    showModal(`<p class="modal-eyebrow">ANT NEST ARCHIVE</p><h2 id="modal-title">${escapeHTML(third?.name||next?.name||type.name)}</h2>
      <p class="modal-subtitle">${dateLabel(record.timestamp)} · LV.${record.level} ${third?'세 번째 진화':next?'두 번째 진화':'첫 번째 진화 · 구버전'}</p>
      <div class="evolution-portrait" id="modal-portrait"></div>
      <div class="passive-chip"><strong>✦ ${escapeHTML(type.passive)}</strong><br>${escapeHTML(type.description)}</div>
      ${next?`<div class="second-evolution-badge">${escapeHTML(growthRating(record.stats))}</div>`:''}
      ${third?`<div class="passive-chip"><strong>칭호 · ${escapeHTML(third.title)}</strong><br>${escapeHTML(thirdStatus(record.thirdEvolution))}<br>계보: ${escapeHTML(type.name)} → ${escapeHTML(next.name)} → ${escapeHTML(third.name)}</div>`:''}${recordSummary(record)}${record.legacyLevel20?`<p class="modal-subtitle">보존된 LV.20 기록 · 당근 ${record.legacyLevel20.carrotCount}회 / 채찍 ${record.legacyLevel20.whipCount}회 · v${escapeHTML(record.legacyLevel20.balanceVersion||'구버전')}</p>`:''}<p class="modal-subtitle">총 획득 경험치 ${record.totalExp} EXP · 누적 행동 ${record.carrotCount+record.whipCount}회 · 밸런스 v${escapeHTML(record.balanceVersion||'0.1.0')}</p>
      <div class="modal-buttons"><button type="button" class="modal-primary" id="record-close">기록 닫기</button></div>`);
    const clone=qs('ant-figure').cloneNode(true);
    clone.removeAttribute('id');clone.classList.remove('reaction-whip','reaction-carrot','reaction-event');
    clone.dataset.thirdEvolution=record.thirdEvolution||'none';
    clone.dataset.evolution=record.type;clone.dataset.secondEvolution=next?record.secondEvolution:'none';clone.dataset.mood='happy';
    qs('modal-portrait').appendChild(clone);
    if(next)qs('modal-portrait').insertAdjacentHTML('beforeend',`<span class="second-emblem" aria-hidden="true">${escapeHTML(third?.icon||next.icon)}</span>`);
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
      const expedition={...game.expedition,ticks:0,ticketRuleVersion:2,inventory:{...game.expedition.inventory},crafted:[...game.expedition.crafted],
        trips:[...game.expedition.trips],squad:[...game.expedition.squad],discoveries:[...game.expedition.discoveries]};
      const kingdom=JSON.parse(JSON.stringify(game.kingdom));
      const weekly=JSON.parse(JSON.stringify(game.weekly));
      game=freshState();game.records=records;game.settings=settings;game.unlockedAchievements=unlockedAchievements;game.decor=decor;
      game.expedition=expedition;game.kingdom=kingdom;game.weekly=weekly;game.tutorialCompleted=true;
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
      <strong>4. 세 단계 진화</strong> · LV.10에서 첫 진화와 고유 패시브, LV.20에서 두 번째 진화 6종, LV.30에서 세 번째 진화 12종 중 하나 완성</div>
      <div class="modal-buttons"><button class="modal-primary" id="tutorial-review-close" type="button">확인</button></div>`);
    qs('tutorial-review-close').addEventListener('click',closeModal);
  }

  function exportSaveData() {
    try {
      const raw=localStorage.getItem(KEY);
      if(!raw) {toast('저장된 게임 데이터가 없습니다.');return;}
      const bundle={
        format:'ant-game-save',fileFormatVersion:2,exportVersion:B.version,exportedAt:new Date().toISOString(),
        save:JSON.parse(raw),
        originalBeforeV05:localStorage.getItem(PRE_V05_BACKUP_KEY),
        originalBeforeV06:localStorage.getItem(PRE_V06_BACKUP_KEY),
        originalBeforeV07:localStorage.getItem(PRE_V07_BACKUP_KEY),
        originalBeforeV08:localStorage.getItem(PRE_V08_BACKUP_KEY),
        originalBeforeV09:localStorage.getItem(PRE_V09_BACKUP_KEY),
        originalBeforeV10:localStorage.getItem(PRE_V10_BACKUP_KEY),
        latestBeforeReset:localStorage.getItem(PRE_RESET_KEY)
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

  // 파일 가져오기는 외부 요청 없이 브라우저에서 처리합니다. 현재 세이브를 복원 직전 별도 보관합니다.
  const isCount = (v,max=10000000)=>Number.isInteger(v)&&v>=0&&v<=max;
  const isStats = stats=>stats && typeof stats==='object' && ['motivation','stress','laziness'].every(k=>
    typeof stats[k]==='number'&&Number.isFinite(stats[k])&&stats[k]>=0&&stats[k]<=100);
  function validateImportedState(raw){
    const errors=[];
    const error=message=>{if(errors.length<10)errors.push(message);};
    if(!raw || typeof raw!=='object' || Array.isArray(raw) || raw.schemaVersion!==1)
      return ['지원하지 않는 저장 스키마입니다.'];
    if(!isCount(raw.level,B.maxLevel)||raw.level<1 || !isCount(raw.exp) || !isStats(raw.stats))error('현재 개미의 레벨·경험치·능력치가 잘못됐습니다.');
    for(const name of ['carrotCount','whipCount','totalExp','eventCount'])
      if(raw[name]!==undefined&&!isCount(raw[name],100000000))error(`행동 기록 ${name}이 올바르지 않습니다.`);
    if(typeof raw.finished!=='boolean')error('현재 개미 완료 상태가 잘못됐습니다.');
    if(raw.phase!==undefined && !['phase1','phase2','phase3','completed','legacyComplete'].includes(raw.phase))error('진화 단계가 잘못됐습니다.');
    if(raw.evolution!==null && raw.evolution!==undefined && !validFirst(raw.evolution))error('알 수 없는 1차 진화 유형입니다.');
    if(raw.secondEvolution && !validSecond(raw.secondEvolution,raw.evolution))error('2차 진화 정보가 잘못됐습니다.');
    if(raw.thirdEvolution && (raw.level!==30 || !raw.finished || !validThird(raw.thirdEvolution,raw.secondEvolution)))error('3차 진화 계보가 잘못됐습니다.');
    if(raw.level>=30 && !raw.thirdEvolution)error('LV.30에는 3차 진화 결과가 필요합니다.');
    for(const counts of [raw.stage2Counters,raw.stage3Counters])if(counts && (!isCount(counts.carrot)||!isCount(counts.whip)))error('진화 행동 기록이 잘못됐습니다.');
    if(raw.pendingChoice!==undefined && raw.pendingChoice!==null && (
       !B.events[raw.pendingChoice.eventId]?.choices ||
       !['carrot','whip'].includes(raw.pendingChoice.action) ||
       !isCount(raw.pendingChoice.gained,1000000) || typeof raw.pendingChoice.recoveryBonus!=='boolean'))error('미완료 이벤트 데이터가 잘못됐습니다.');
    if(raw.records!==undefined && !Array.isArray(raw.records))error('완료 개미 기록이 배열이 아닙니다.');
    const records=Array.isArray(raw.records)?raw.records:[];
    if(records.length>10000)error('완료 기록이 너무 많습니다.');
    const ids=new Set();
    for(const rec of records){
      if(!rec || typeof rec.id!=='string' || !rec.id || rec.id.length>96 || ids.has(rec.id) ||
         !validFirst(rec.type) || !isStats(rec.stats) ||
         (rec.level!==undefined && rec.level!==10 && rec.level!==20 && rec.level!==30) ||
         (rec.secondEvolution && !validSecond(rec.secondEvolution,rec.type)) ||
         (rec.thirdEvolution && (rec.level!==30 || !validThird(rec.thirdEvolution,rec.secondEvolution))) ||
         (rec.level===30 && !validThird(rec.thirdEvolution,rec.secondEvolution)) ||
         (rec.carrotCount!==undefined&&!isCount(rec.carrotCount,100000000)) ||
         (rec.whipCount!==undefined&&!isCount(rec.whipCount,100000000))){
        error('완료 개미 기록이 중복되었거나 잘못됐습니다.');break;
      }
      if(rec.legacyLevel20 && (rec.legacyLevel20.level!==20 || !validFirst(rec.legacyLevel20.type) || !validSecond(rec.legacyLevel20.secondEvolution,rec.legacyLevel20.type) || !isCount(rec.legacyLevel20.carrotCount) || !isCount(rec.legacyLevel20.whipCount)))error('보존된 LV.20 기록이 잘못됐습니다.');
      ids.add(rec.id);
    }
    if(raw.expedition!==undefined){
      const ex=raw.expedition;
      if(!ex || typeof ex!=='object'||
         !isCount(ex.tickets,B.expeditions.maxTickets)||
         !isCount(ex.ticks,B.expeditions.actionsPerTicket-1)||
         !ex.inventory || RESOURCE_IDS.some(id=>!isCount(ex.inventory[id],999999)) ||
         (ex.crafted!==undefined&&(!Array.isArray(ex.crafted)||ex.crafted.some(id=>!validCraft(id)))))
        error('원정권·자원·제작 기록이 잘못됐습니다.');
      if(ex.squad!==undefined && (!Array.isArray(ex.squad)||ex.squad.length>B.expeditionSquad.maxMembers||
        new Set(ex.squad).size!==ex.squad.length||ex.squad.some(id=>!ids.has(id))))
        error('원정대에 중복되거나 없는 개미가 있습니다.');
      if(ex.discoveries!==undefined && (!Array.isArray(ex.discoveries)||
        new Set(ex.discoveries).size!==ex.discoveries.length || ex.discoveries.some(id=>!RARE_IDS.has(id))))
        error('희귀 발견물 기록이 올바르지 않습니다.');
      if(ex.passiveRecordId && !records.some(r=>r.id===ex.passiveRecordId && validThird(r.thirdEvolution,r.secondEvolution)))error('원정 대표 개미가 잘못됐습니다.');
      if(ex.bonusRemainders && (typeof ex.bonusRemainders!=='object' || Object.entries(ex.bonusRemainders).some(([key,v])=>!Object.keys(THIRD_TYPES).some(t=>RESOURCE_IDS.some(r=>key===t+':'+r)) || !Number.isInteger(v)||v<0||v>=100)))error('패시브 소수 누적값이 잘못됐습니다.');
      if(ex.ticketRuleVersion!==undefined && ex.ticketRuleVersion!==2)error('원정권 지급 규칙 버전이 올바르지 않습니다.');
    }
    if(raw.weekly!==undefined && (!raw.weekly||typeof raw.weekly.key!=='string'||
      !/^\d{4}-W\d{2}$/.test(raw.weekly.key)||['trips','resources','squadTrips'].some(id=>
        !isCount(raw.weekly[id],999999))|| !Array.isArray(raw.weekly.claimed)||
      new Set(raw.weekly.claimed).size!==raw.weekly.claimed.length||
      raw.weekly.claimed.some(id=>!B.weeklyGoals.some(goal=>goal.id===id))))
      error('주간 목표 진행 기록이 올바르지 않습니다.');
    if(raw.decor!==undefined){
      if(!raw.decor || !Array.isArray(raw.decor.unlocked) ||
         raw.decor.unlocked.some(id=>!ALL_DECOR.some(d=>d.id===id)) ||
         !raw.decor.equipped || ['floor','wall','light'].some(slot=>raw.decor.equipped[slot] &&
           !ALL_DECOR.some(d=>d.id===raw.decor.equipped[slot] && d.slot===slot)))
        error('장식 해금·배치 데이터가 잘못됐습니다.');
      if(raw.decor?.equipped?.extra && (!records.some(r=>r.thirdEvolution==='grand_architect') || !raw.decor.unlocked.includes(raw.decor.equipped.extra) || !ALL_DECOR.some(d=>d.id===raw.decor.equipped.extra) || ['floor','wall','light'].some(s=>raw.decor.equipped[s]===raw.decor.equipped.extra)))error('추가 장식 슬롯 배치가 잘못됐습니다.');
    }
    if(raw.settings?.autoCare){
      const ac=raw.settings.autoCare;
      if(!['balanced','growth','recover'].includes(ac.mode) ||
        !B.autoCare.batches.includes(ac.batch) || !Object.hasOwn(B.autoCare.speeds,ac.speed))
        error('자동 돌봄 설정에 잘못된 값이 있습니다.');
    }
    try{normalizeKingdom(raw.kingdom,records);}catch(e){error(e.message);}
    return errors;
  }
  function versionAhead(candidate){
    if(typeof candidate!=='string')return false;
    const a=candidate.split('.').map(Number),b=B.version.split('.').map(Number);
    if(a.length!==3 || a.some(x=>!Number.isInteger(x)))return false;
    for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false;}
    return false;
  }
  const previewSave = save=>{
    const kingdom=normalizeKingdom(save.kingdom,Array.isArray(save.records)?save.records:[]);
    const inv=save.expedition?.inventory||{};
    return {
      level:save.level,records:(save.records||[]).length,
      phase:save.phase||'구버전',tickets:save.expedition?.tickets||0,
      food:inv.food||0,wood:inv.wood||0,crystal:inv.crystal||0,
      crafted:save.expedition?.crafted?.length||0,
      facilities:FACILITY_IDS.map(id=>kingdom.facilities[id]).join('/'),
      workers:FACILITY_IDS.filter(id=>kingdom.assignments[id]).length,
      squad:save.expedition?.squad?.length||0,rare:save.expedition?.discoveries?.length||0
    };
  };
  function restoreInfoCard(info,title){
    return `<div class="import-preview-card"><strong>${escapeHTML(title)}</strong>LV.${info.level} · ${escapeHTML(info.phase)}<br>
      완료 개미 ${info.records}마리<br>원정권 ${info.tickets}장<br>식량 ${info.food} · 목재 ${info.wood} · 수정 ${info.crystal}<br>
      제작품 ${info.crafted}종 · 시설 ${info.facilities} · 일꾼 ${info.workers}마리<br>
      원정대 ${info.squad}마리 · 희귀 발견물 ${info.rare}종</div>`;
  }
  async function previewImportedSave(file){
    if(!file)return;
    if(file.size>5*1024*1024){toast('파일 크기는 5MB 이하여야 합니다.');return;}
    try{
      const content=await file.text();
      const bundle=JSON.parse(content);
      const isBundle=bundle && bundle.format==='ant-game-save';
      const save=isBundle?bundle.save:bundle;
      if(isBundle && versionAhead(bundle.exportVersion))throw new Error('이 게임보다 새로운 버전에서 만든 백업 파일입니다.');
      const errors=validateImportedState(save);
      if(errors.length)throw new Error(errors.join(' / '));
      // 가져오기 검증을 통과해도 메모리 저장 데이터에는 아직 아무 변경도 하지 않습니다.
      const current=previewSave(game),next=previewSave(save);
      showModal(`<p class="modal-eyebrow">SAFE RESTORE</p><h2 id="modal-title">저장 데이터 복원 미리보기</h2>
        <p class="modal-subtitle">${escapeHTML(file.name)} · ${isBundle?escapeHTML(bundle.exportVersion||'버전 정보 없음'):'원본 JSON 저장 파일'}
          ${isBundle && bundle.exportedAt?' · '+escapeHTML(bundle.exportedAt.slice(0,19)):''}</p>
        <div class="import-preview">${restoreInfoCard(current,'현재 저장 데이터')}${restoreInfoCard(next,'복원할 저장 데이터')}</div>
        <p class="import-warning">복원은 기존 데이터와 병합하지 않고 전부 교체합니다. 확인 시 현재 저장 데이터를 별도 백업합니다.</p>
        <div class="modal-buttons"><button class="modal-primary" id="restore-preview-next" type="button">복원 절차 계속</button><button class="modal-secondary" id="restore-preview-cancel" type="button">취소</button></div>`,'import-preview');
      qs('restore-preview-cancel').addEventListener('click',closeModal);
      qs('restore-preview-next').addEventListener('click',()=>confirmImportedSave(save));
    }catch(error){
      console.warn('백업 파일 검증 실패:',error);
      showModal(`<p class="modal-eyebrow">RESTORE BLOCKED</p><h2 id="modal-title">복원할 수 없습니다</h2>
        <p class="modal-subtitle">${escapeHTML(error.message||'지원하지 않는 파일입니다.')}</p>
        <p class="import-warning">기존 저장 데이터는 변경하지 않았습니다.</p>
        <div class="modal-buttons"><button class="modal-primary" type="button" id="import-error-close">닫기</button></div>`);
      qs('import-error-close').addEventListener('click',closeModal);
    }
  }
  function confirmImportedSave(save){
    closeModal();
    showModal(`<p class="modal-eyebrow">FINAL CONFIRMATION</p><h2 id="modal-title">현재 데이터를 교체할까요?</h2>
      <p class="modal-subtitle">완료 개미 ${game.records.length}마리의 현 저장 데이터를 새 파일의 기록으로 교체합니다.</p>
      <p class="import-warning">이 작업은 현재 데이터를 복원 파일로 덮어씁니다. 기존 데이터는 복원 직전 별도 백업됩니다.</p>
      <div class="modal-buttons"><button class="modal-primary danger" id="confirm-import-save" type="button">백업 후 데이터 교체</button><button class="modal-secondary" id="cancel-import-save" type="button">취소</button></div>`,'import-confirm');
    qs('cancel-import-save').addEventListener('click',closeModal);
    qs('confirm-import-save').addEventListener('click',()=>commitImportedSave(save));
  }
  function commitImportedSave(candidate){
    const errors=validateImportedState(candidate);
    if(errors.length){toast('복원 파일이 올바르지 않습니다.');return false;}
    try{
      const original=localStorage.getItem(KEY);
      // 백업 실패 시 실제 저장 데이터는 변경하지 않습니다.
      if(original!==null){
        localStorage.setItem(PRE_IMPORT_KEY,original);
        if(localStorage.getItem(PRE_IMPORT_KEY)!==original)throw new Error('복원 전 백업 확인 실패');
      }
      const replacement=JSON.stringify(candidate);
      try{
        localStorage.setItem(KEY,replacement);
        if(localStorage.getItem(KEY)!==replacement)throw new Error('복원 저장 검증 실패');
      }catch(e){
        try{if(original!==null)localStorage.setItem(KEY,original);else localStorage.removeItem(KEY);}
        catch(rollbackError){console.error('저장 원복 실패. 별도 백업을 확인하세요.',rollbackError);}
        throw e;
      }
      stopAuto();
      storageCorrupt=false;
      window.location.reload();
      return true;
    }catch(error){console.warn('복원 실패:',error);toast('데이터 복원에 실패했습니다. 기존 데이터와 복원 전 백업을 확인하세요.');return false;}
  }
  function openImportPicker(){
    const input=qs('import-save-file');input.value='';input.click();
  }
  function inspectSaveHealth(){
    let errors=[];
    let byteLength=0;
    let snapshot=null;
    let writeOk=false;
    const probeKey='little-ant-game-v1.0-storage-probe';
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)throw new Error('저장 데이터가 없습니다.');
      byteLength=new Blob([raw]).size;
      snapshot=JSON.parse(raw);
      errors=validateImportedState(snapshot);
      const before=localStorage.getItem(probeKey);
      const mark=`check-${Date.now()}-${Math.random()}`;
      try {
        localStorage.setItem(probeKey,mark);
        writeOk=localStorage.getItem(probeKey)===mark;
      } finally {
        if(before===null)localStorage.removeItem(probeKey);
        else localStorage.setItem(probeKey,before);
      }
    }catch(error){errors.push(error.message||'저장 데이터에 접근할 수 없습니다.');}
    const healthy=errors.length===0 && writeOk;
    storageWorks=healthy;renderStorageStatus();
    const records=Array.isArray(snapshot?.records)?snapshot.records.length:0;
    const size=(byteLength/1024).toFixed(1);
    showModal(`<p class="modal-eyebrow">SAVE HEALTH CHECK</p><h2 id="modal-title">저장 상태 점검</h2>
      <p class="modal-subtitle">${healthy?'저장 데이터 검증 및 브라우저 쓰기 시험 통과':'점검에서 문제가 발견되었습니다.'}</p>
      <div class="modal-info">저장 데이터: ${size} KB<br>저장 스키마: ${escapeHTML(snapshot?.schemaVersion??'알 수 없음')}<br>현재 개미: LV.${escapeHTML(snapshot?.level??'?')}<br>완료 기록: ${records}마리<br>브라우저 쓰기 테스트: ${writeOk?'성공':'실패'}<br>저장 데이터 검사: ${errors.length?'오류 '+errors.length+'건':'통과'}</div>
      ${errors.length?`<p class="import-warning">${escapeHTML(errors.slice(0,3).join(' / '))}</p>`:''}
      <p class="modal-subtitle">점검 내용은 외부에 전송하지 않습니다. 기기 분실에 대비하려면 JSON 백업 파일을 별도로 보관하세요.</p>
      <div class="modal-buttons"><button class="modal-primary" type="button" id="save-health-close">확인</button></div>`);
    qs('save-health-close').addEventListener('click',closeModal);
  }

  function confirmReset() {
    showModal(`<p class="modal-eyebrow">DATA RESET</p><h2 id="modal-title">정말 초기화할까요?</h2>
      <p class="modal-subtitle">현재 육성과 모든 진화 기록을 초기화합니다. 초기화 직전 데이터는 별도 브라우저 슬롯에 보관하지만, 브라우저 데이터 삭제 시 함께 사라질 수 있습니다.</p>
      <div class="modal-buttons"><button type="button" class="modal-primary danger" id="confirm-reset">모든 기록 삭제</button><button type="button" class="modal-secondary" id="cancel-reset">취소</button></div>`);
    qs('confirm-reset').addEventListener('click',()=>{
      try {
        const original=localStorage.getItem(KEY);
        if(original!==null){
          localStorage.setItem(PRE_RESET_KEY,original);
          if(localStorage.getItem(PRE_RESET_KEY)!==original)throw new Error('초기화 전 백업 실패');
        }
        const next=freshState();
        const raw=JSON.stringify(next);
        localStorage.setItem(KEY,raw);
        if(localStorage.getItem(KEY)!==raw){
          if(original!==null)localStorage.setItem(KEY,original);
          throw new Error('초기화 결과 확인 실패');
        }
        storageCorrupt=false;storageWorks=true;
        stopAuto();game=next;achievementNoticeQueue=[];
        closeModal();showScreen('game');render();
        toast('초기화 완료 · 이전 데이터는 브라우저 복구 슬롯에 보관했습니다.');
      } catch(error) {
        storageWorks=false;renderStorageStatus();
        console.warn('안전 초기화 실패',error);
        toast('초기화 중 오류가 발생해 기존 데이터를 유지했습니다.');
      }
    });
    qs('cancel-reset').addEventListener('click',closeModal);
  }

  function bindEvents() {
    qs('resume-level20').addEventListener('click',resumeLevel20);
    qs('passive-leader').addEventListener('change',e=>{
      const id=e.target.value;
      applyKingdomTransaction(draft=>{if(id && !draft.records.some(r=>r.id===id && validThird(r.thirdEvolution,r.secondEvolution)))return false;draft.expedition.passiveRecordId=id||null;return true;});
    });
    qs('extra-decoration').addEventListener('change',e=>{
      const id=e.target.value;
      applyKingdomTransaction(draft=>{if(!hasExtraSlot(draft) || (id && (!draft.decor.unlocked.includes(id) || ['floor','wall','light'].some(s=>draft.decor.equipped[s]===id))))return false;draft.decor.equipped.extra=id||null;return true;});
    });
    qs('carrot-button').addEventListener('click',()=>{stopAuto();playAction('carrot');});
    qs('whip-button').addEventListener('click',()=>{stopAuto();playAction('whip');});
    qs('auto-toggle').addEventListener('click',toggleAutoCare);
    qs('auto-mode').addEventListener('change',e=>updateAutoPreference('mode',e.target.value));
    qs('auto-batch').addEventListener('change',e=>updateAutoPreference('batch',e.target.value));
    qs('auto-speed').addEventListener('change',e=>updateAutoPreference('speed',e.target.value));
    qs('auto-safe-stop').addEventListener('change',e=>updateAutoPreference('safeStop',e.target.checked));
    qs('edit-expedition-squad').addEventListener('click',showSquadPicker);
    qs('weekly-goals-grid').addEventListener('click',e=>{
      const goal=e.target.closest('[data-claim-weekly]');if(goal)claimWeeklyGoal(goal.dataset.claimWeekly);
    });
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
    document.querySelectorAll('[data-nest-tab]').forEach(btn=>btn.addEventListener('click',()=>switchNestTab(btn.dataset.nestTab)));
    qs('kingdom-facilities').addEventListener('click',e=>{
      const btn=e.target.closest('[data-upgrade-facility]');if(btn)confirmUpgradeFacility(btn.dataset.upgradeFacility);
    });
    qs('kingdom-workers').addEventListener('click',e=>{
      const pick=e.target.closest('[data-choose-facility]');
      const unassign=e.target.closest('[data-unassign-facility]');
      if(pick)chooseWorker(pick.dataset.chooseFacility);
      if(unassign)unassignWorker(unassign.dataset.unassignFacility);
    });
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
    qs('import-save').addEventListener('click',openImportPicker);
    qs('inspect-save').addEventListener('click',inspectSaveHealth);
    qs('import-save-file').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)previewImportedSave(file);});
    qs('reset-button').addEventListener('click',confirmReset);
    qs('modal-close').addEventListener('click',closeModal);
    qs('modal-backdrop').addEventListener('click',e=>{if(e.target===qs('modal-backdrop'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)closeModal();});
    window.addEventListener('storage',e=>{
      if(e.key!==KEY)return;
      stopAuto('다른 탭에서 데이터가 변경되어 중지했습니다.');
      if(modalOpen){modalOpen=false;modalKind=null;qs('modal-backdrop').hidden=true;document.body.style.overflow='';}
      game=loadState();reconcileAchievements();reconcileDecorations();render();
      if(game.pendingChoice)showChoiceEvent();
      else if(game.firstEvolution && !game.firstEvolution.acknowledged && game.phase==='phase2')showFirstEvolutionResult();
      toast('다른 탭에서 변경된 저장 데이터를 불러왔습니다.');
    });
  }
  bindEvents();
  switchNestTab('decor');
  startAnalytics();
  render();
  saveState();
  // 미완료 선택이 있으면 제일 먼저 복구합니다. 패치노트는 선택 종료 이후로 미룹니다.
  if(game.pendingChoice) showChoiceEvent();
  else if(game.phase==='phase2' && game.firstEvolution && !game.firstEvolution.acknowledged)showFirstEvolutionResult();
  showPatchNotesOnLaunch();
})();
