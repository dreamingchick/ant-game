/*
 * 개미 키우기 MVP v0.1
 * 데이터: balance.js / 화면: index.html / 스타일: style.css
 * 플레이어 데이터는 LocalStorage에 저장됩니다. 서버와 로그인은 없습니다.
 */
(() => {
  'use strict';
  const B = window.ANT_BALANCE;
  if (!B) { window.alert('balance.js를 불러오지 못했습니다. 게임 파일을 같은 폴더에 두세요.'); return; }

  const KEY = 'little-ant-game-mvp-v1';
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
      lastSpeech: choose(dialogue.idle), lastFeedback:'작은 선택이 개미의 내일을 바꿉니다.', lastReaction:'idle',
      tutorialCompleted:false, tutorialStep:0,
      settings:{ soundEnabled:true, volume:65 }
    };
  }

  let storageWorks = true;
  function loadState() {
    const base = freshState();
    try {
      const text = localStorage.getItem(KEY);
      if (!text) return base;
      const prev = JSON.parse(text);
      if (!prev || prev.schemaVersion !== 1 || typeof prev !== 'object') return base;
      const stats = prev.stats && typeof prev.stats === 'object' ? prev.stats : {};
      const num = (v, fallback, max=Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0,Math.min(max,Math.floor(v))) : fallback;
      const validTypes = Object.keys(B.types);
      const records = Array.isArray(prev.records) ? prev.records.filter(r => r && validTypes.includes(r.type) && typeof r.id === 'string').map(r=>({
        id:r.id.slice(0,96),type:r.type,
        timestamp:num(r.timestamp,Date.now()),level:10,
        stats: {motivation:clamp(r.stats?.motivation ?? 60),stress:clamp(r.stats?.stress ?? 20),laziness:clamp(r.stats?.laziness ?? 10)},
        carrotCount:num(r.carrotCount,0),whipCount:num(r.whipCount,0),
        totalExp:num(r.totalExp,0),eventCount:num(r.eventCount,0),
        eventsByType:r.eventsByType&&typeof r.eventsByType==='object'?r.eventsByType:{}
      })) : [];
      return {
        ...base,
        level: Math.max(1,num(prev.level,1,B.maxLevel)), exp:num(prev.exp,0,10000000),
        stats:{ motivation:clamp(stats.motivation ?? 60), stress:clamp(stats.stress ?? 20), laziness:clamp(stats.laziness ?? 10) },
        carrotCount:num(prev.carrotCount,0), whipCount:num(prev.whipCount,0), totalExp:num(prev.totalExp,0),eventCount:num(prev.eventCount,0),
        eventsByType: prev.eventsByType && typeof prev.eventsByType === 'object' ? prev.eventsByType : {},
        recentEvents: Array.isArray(prev.recentEvents)?prev.recentEvents.slice(0,25):[],
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
      return base;
    }
  }

  let game = loadState();
  let activeScreen = 'game';
  let modalOpen = false;
  let previousFocus = null;
  let toastTimer = 0;
  let reactionTimer = 0;
  let audioCtx = null;

  function saveState() {
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

  function playAction(action) {
    if(game.finished) return;
    const before={...game.stats};
    const eventId=pickEvent(action,before); // Q20: 행동 직전 능력치로 판정
    const changes=B.actions[action];
    let gained=action==='whip' ? Math.max(1,Math.round(changes.baseExp*efficiency(before))) : 0;
    for(const key of ['motivation','stress','laziness']) game.stats[key]=clamp(game.stats[key]+changes[key]);
    if(action==='carrot') game.carrotCount++; else game.whipCount++;

    let eventMessage='';
    if(eventId) {
      const event=B.events[eventId];
      if(event.expMultiplier && action==='whip') gained=Math.max(1,Math.round(gained*event.expMultiplier));
      if(event.cancelExp) gained=0;
      for(const key of ['motivation','stress','laziness']) if(event[key]) game.stats[key]=clamp(game.stats[key]+event[key]);
      game.eventCount++;
      game.eventsByType[eventId]=(game.eventsByType[eventId]||0)+1;
      eventMessage=`돌발 이벤트 · ${event.name}`;
      game.recentEvents.unshift({id:eventId,name:event.name,action,at:Date.now()});
      game.recentEvents=game.recentEvents.slice(0,25);
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
      game.lastSpeech=dialogue.event[eventId];
      game.lastReaction='event';
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
    if(eventId) feedback+=` · ${eventMessage}`;
    if(didLevelUp && !game.finished) feedback+=` · LV.${game.level} 레벨업!`;
    if(game.finished) feedback='첫 진화 달성! 결과를 확인해 보세요.';
    game.lastFeedback=feedback;
    updateTutorial(action);
    saveState();
    render();
    animateAnt(eventId?'event':action,didLevelUp);
    if(game.finished) {
      playSound('evolution');
      showEvolutionResult(findFinishRecord());
    } else if(didLevelUp) {
      playSound('level');
      toast(`레벨 업! LV.${game.level}`);
    } else if(eventId) {
      playSound(B.events[eventId].kind==='positive'?'positive':'negative');
      toast(eventMessage);
    } else playSound(action);
  }

  function finishEvolution() {
    if(game.finished) return;
    const type=evolutionType();
    const record={
      id:`ant-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp:Date.now(), type, level:10,
      stats:{...game.stats}, carrotCount:game.carrotCount, whipCount:game.whipCount,
      totalExp:game.totalExp, eventCount:game.eventCount, eventsByType:{...game.eventsByType}
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
    else if(game.tutorialStep===3){ game.tutorialCompleted=true; toast('이제 자유롭게 개미를 키워 보세요!'); }
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
    qs('carrot-button').disabled=game.finished;
    qs('whip-button').disabled=game.finished;
    qs('finished-panel').hidden=!game.finished;
    if(game.finished)qs('finished-name').textContent=B.types[game.evolution].name;
    renderTutorial();
    renderRecords();
    renderSettings();
    showScreen(activeScreen,false);
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
  }
  function renderStorageStatus() {
    const el=qs('save-status');
    if(!el)return;
    el.innerHTML=storageWorks?'<span class="save-dot"></span> 자동 저장 사용 중':'<span aria-hidden="true">!</span> 저장할 수 없음 · 브라우저 설정 확인';
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
    for(const screen of ['game','records','settings'])qs(`screen-${screen}`).hidden=screen!==name;
    document.querySelectorAll('[data-screen]').forEach(button=>{
      const active=button.dataset.screen===name;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    if(scroll)window.scrollTo({top:0,behavior:'instant'});
  }
  function showModal(content) {
    previousFocus=document.activeElement;
    qs('modal-body').innerHTML=content;
    qs('modal-backdrop').hidden=false;
    modalOpen=true;
    document.body.style.overflow='hidden';
    qs('modal-close').focus();
  }
  function closeModal() {
    if(!modalOpen)return;
    qs('modal-backdrop').hidden=true;
    document.body.style.overflow='';
    modalOpen=false;
    qs('modal-body').innerHTML='';
    if(previousFocus && typeof previousFocus.focus==='function')previousFocus.focus();
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
      ${recordSummary(record)}<p class="modal-subtitle">총 획득 경험치 ${record.totalExp} EXP · 누적 행동 ${record.carrotCount+record.whipCount}회</p>
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
      game=freshState();game.records=records;game.settings=settings;game.tutorialCompleted=true;
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
      <strong>4. 최초 진화</strong> · LV.10에서 당근/채찍의 누적 비율로 3종 진화</div>
      <div class="modal-buttons"><button class="modal-primary" id="tutorial-review-close" type="button">확인</button></div>`);
    qs('tutorial-review-close').addEventListener('click',closeModal);
  }

  function confirmReset() {
    showModal(`<p class="modal-eyebrow">DATA RESET</p><h2 id="modal-title">정말 초기화할까요?</h2>
      <p class="modal-subtitle">현재 육성과 모든 진화 기록을 완전히 지웁니다. 삭제한 내용은 복구할 수 없습니다.</p>
      <div class="modal-buttons"><button type="button" class="modal-primary danger" id="confirm-reset">모든 기록 삭제</button><button type="button" class="modal-secondary" id="cancel-reset">취소</button></div>`);
    qs('confirm-reset').addEventListener('click',()=>{
      try{localStorage.removeItem(KEY);}catch(error){console.warn(error);}
      game=freshState();saveState();closeModal();showScreen('game');render();toast('게임이 초기화되었습니다.');
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
    qs('header-settings').addEventListener('click',()=>showScreen('settings'));
    document.querySelectorAll('[data-screen]').forEach(button=>button.addEventListener('click',()=>showScreen(button.dataset.screen)));
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
    qs('reset-button').addEventListener('click',confirmReset);
    qs('modal-close').addEventListener('click',closeModal);
    qs('modal-backdrop').addEventListener('click',e=>{if(e.target===qs('modal-backdrop'))closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOpen)closeModal();});
    window.addEventListener('storage',e=>{if(e.key!==KEY)return;game=loadState();render();toast('다른 탭에서 변경된 저장 데이터를 불러왔습니다.');});
  }
  bindEvents();
  render();
  saveState();
})();