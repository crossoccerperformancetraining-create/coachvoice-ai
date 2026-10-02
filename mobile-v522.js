(() => {
  'use strict';

  const DB_NAME='coachvoice-resilience-v522';
  const DB_VERSION=1;
  const STORE='recordings';
  const DRAFT_PREFIX='coachvoice-draft-v522:';
  const LAST_PAGE_KEY='coachvoice-last-activity-v522';
  let wakeLock=null;
  let activeInteraction='';
  let focusMode=false;

  function openDB(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){resolve(null);return;}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'kind'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function putRecording(kind,blob,meta={}){
    if(!blob?.size)return;
    const db=await openDB(); if(!db)return;
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put({kind,blob,meta,updatedAt:Date.now()});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
    db.close();
    renderResumeCard();
  }

  async function getRecording(kind){
    const db=await openDB();if(!db)return null;
    const result=await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const req=tx.objectStore(STORE).get(kind);
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
    });
    db.close();return result;
  }

  async function getAllRecordings(){
    const db=await openDB();if(!db)return [];
    const result=await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const req=tx.objectStore(STORE).getAll();
      req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
    });
    db.close();return result;
  }

  async function clearRecording(kind){
    const db=await openDB();if(!db)return;
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(kind);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
    db.close();renderResumeCard();
  }

  function wakeState(show,text='🔒 Tela ativa durante a gravação'){
    const el=document.getElementById('mentor522WakeState');
    if(!el)return;
    el.textContent=text;
    el.classList.toggle('hidden',!show);
  }

  async function requestWakeLock(){
    if(!('wakeLock' in navigator)){
      wakeState(true,'⚠️ Este navegador pode apagar a tela durante gravações longas');
      return false;
    }
    try{
      if(wakeLock && !wakeLock.released)return true;
      wakeLock=await navigator.wakeLock.request('screen');
      wakeState(true);
      wakeLock.addEventListener('release',()=>{wakeLock=null;});
      return true;
    }catch(error){
      console.info('Wake Lock indisponível:',error);
      wakeState(true,'⚠️ Não consegui bloquear o repouso da tela');
      return false;
    }
  }

  async function releaseWakeLock(){
    try{if(wakeLock && !wakeLock.released)await wakeLock.release();}catch{}
    wakeLock=null;wakeState(false);
  }

  window.coach522PersistRecordingBlob=(kind,blob,meta)=>putRecording(kind,blob,meta);
  window.coach522ClearRecording=kind=>clearRecording(kind);

  window.coach522RecordingStarted=async function(kind,meta={}){
    activeInteraction=kind;
    setVoiceState('recording','Gravando — toque para finalizar');
    await requestWakeLock();
  };

  window.coach522RecordingFailed=function(){
    releaseWakeLock();
  };

  window.coach522InteractionComplete=function(){
    activeInteraction='';
    releaseWakeLock();
  };

  function setVoiceState(state,label){
    const el=document.getElementById('mentor522VoiceState');
    if(!el)return;
    const map={
      ready:'🟢',recording:'🔴',transcribing:'🟡',responding:'🔵',error:'⚠️'
    };
    el.className=`mentor522-voice-state ${state||'ready'}`;
    el.innerHTML=`<span>${map[state]||'🟢'}</span><strong>${label||'Pronto para falar'}</strong>`;
  }
  window.coach522SetVoiceState=setVoiceState;

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible' && activeInteraction)requestWakeLock();
  });

  // ---------- Recuperação de gravações ----------
  function recoveryBanner(){
    let el=document.getElementById('coach522RecoveryBanner');
    if(el)return el;
    el=document.createElement('div');
    el.id='coach522RecoveryBanner';
    el.className='coach522-recovery-banner hidden';
    document.body.appendChild(el);
    return el;
  }

  async function refreshRecoveryBanner(){
    const all=(await getAllRecordings())
      .filter(x=>x?.blob?.size && Date.now()-Number(x.updatedAt||0)<12*60*60*1000)
      .sort((a,b)=>b.updatedAt-a.updatedAt);
    const el=recoveryBanner();
    if(!all.length){el.classList.add('hidden');el.innerHTML='';return;}
    const rec=all[0];
    const label=rec.meta?.label||'gravação interrompida';
    el.innerHTML=`
      <div><strong>🎙️ Encontramos uma gravação interrompida</strong><small>${escapeHtml(label)} · seu áudio foi preservado.</small></div>
      <button onclick="coach522RecoverRecording('${rec.kind}')">Recuperar</button>
      <button class="discard" onclick="coach522DiscardRecording('${rec.kind}')">Descartar</button>`;
    el.classList.remove('hidden');
  }

  window.coach522RecoverRecording=async function(kind){
    const rec=await getRecording(kind);if(!rec?.blob?.size)return;
    recoveryBanner().classList.add('hidden');
    if(kind==='mentor'){
      if(typeof window.go==='function')window.go('mentor');
      setTimeout(()=>window.mentor522RecoverAudioBlob?.(rec.blob,rec.meta||{}),180);
    }else{
      window.coach522RecoverUniversalAudio?.(rec.blob,rec.meta||{});
    }
  };

  window.coach522DiscardRecording=async function(kind){
    await clearRecording(kind);
    refreshRecoveryBanner();
  };

  // ---------- Rascunhos ----------
  function draftKey(id){return DRAFT_PREFIX+id;}
  function eligibleDraftTarget(el){
    return el && el.matches?.('textarea[id]') &&
      !el.closest('[aria-hidden="true"]') &&
      !['feedbackNote','voiceFallbackText'].includes(el.id);
  }

  window.coach522ClearDraft=function(id){
    if(id)localStorage.removeItem(draftKey(id));
    renderResumeCard();
  };

  document.addEventListener('input',event=>{
    const el=event.target;if(!eligibleDraftTarget(el))return;
    const value=String(el.value||'');
    if(!value.trim()){localStorage.removeItem(draftKey(el.id));return;}
    localStorage.setItem(draftKey(el.id),JSON.stringify({
      value,updatedAt:Date.now(),page:el.closest('.page')?.id||''
    }));
    renderResumeCard();
  },{passive:true});

  function restoreDrafts(){
    let restored=0;
    document.querySelectorAll('textarea[id]').forEach(el=>{
      if(!eligibleDraftTarget(el)||String(el.value||'').trim())return;
      try{
        const data=JSON.parse(localStorage.getItem(draftKey(el.id))||'null');
        if(!data)return;
        if(Date.now()-Number(data.updatedAt||0)>24*60*60*1000){
          localStorage.removeItem(draftKey(el.id));return;
        }
        el.value=String(data.value||'');
        if(el.value.trim())restored++;
      }catch{}
    });
    return restored;
  }

  function recentDrafts(){
    const items=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(!key?.startsWith(DRAFT_PREFIX))continue;
      try{
        const d=JSON.parse(localStorage.getItem(key)||'null');
        if(d && Date.now()-Number(d.updatedAt||0)<24*60*60*1000)items.push(d);
      }catch{}
    }
    return items.sort((a,b)=>b.updatedAt-a.updatedAt);
  }

  // ---------- Continuar de onde parei ----------
  function saveLastPage(page){
    if(!page||['dashboard','home','profile'].includes(page))return;
    localStorage.setItem(LAST_PAGE_KEY,JSON.stringify({page,updatedAt:Date.now()}));
    renderResumeCard();
  }

  function pageLabel(page){
    const map={
      mentor:'Mentor',interviews:'Entrevistas',daily:'CoachDay',daytoday:'Dia a Dia',
      languages:'Idiomas',english:'Inglês',spanish:'Espanhol',leadership:'Liderança',
      gamemodel:'Modelo de jogo',oratory:'Oratória',studio:'Estúdio',coachprep:'CoachPrep',
      practice:'Treinar',matchday:'Dia de jogo'
    };
    return map[page]||'atividade anterior';
  }

  function renderResumeCard(){
    const host=document.getElementById('today52Morning');
    if(!host)return;
    let card=document.getElementById('coach522ResumeCard');
    if(!card){
      card=document.createElement('div');
      card.id='coach522ResumeCard';
      card.className='coach522-resume-card hidden';
      host.insertAdjacentElement('afterend',card);
    }

    let last=null;
    try{last=JSON.parse(localStorage.getItem(LAST_PAGE_KEY)||'null');}catch{}
    const drafts=recentDrafts();
    if(!last || Date.now()-Number(last.updatedAt||0)>24*60*60*1000){
      if(!drafts.length){card.classList.add('hidden');return;}
      last={page:drafts[0].page||'mentor',updatedAt:drafts[0].updatedAt};
    }

    card.innerHTML=`
      <div><span>CONTINUAR</span><strong>Retomar ${escapeHtml(pageLabel(last.page))}</strong><small>${drafts.length?`${drafts.length} rascunho(s) preservado(s)`:'Você parou aqui recentemente.'}</small></div>
      <button onclick="go('${String(last.page).replace(/[^a-z0-9_-]/gi,'')}')">Continuar</button>`;
    card.classList.remove('hidden');
  }

  // Envolve go() sem alterar as demais rotas.
  function wrapGo(){
    if(typeof window.go!=='function'||window.go.__coach522Wrapped)return;
    const original=window.go;
    const wrapped=function(page,...args){
      saveLastPage(page);
      return original.call(this,page,...args);
    };
    wrapped.__coach522Wrapped=true;
    window.go=wrapped;
  }

  // ---------- Modo foco ----------
  window.coach522ToggleFocus=function(force){
    focusMode=typeof force==='boolean'?force:!focusMode;
    document.body.classList.toggle('coach522-focus',focusMode);
    const btn=document.getElementById('coach522FocusBtn');
    if(btn){
      btn.textContent=focusMode?'×':'◎';
      btn.title=focusMode?'Sair do modo foco':'Modo foco';
      btn.setAttribute('aria-label',btn.title);
    }
    let exit=document.getElementById('coach522FocusExit');
    if(focusMode){
      if(!exit){
        exit=document.createElement('button');
        exit.id='coach522FocusExit';
        exit.className='coach522-focus-exit';
        exit.textContent='× Sair do foco';
        exit.onclick=()=>window.coach522ToggleFocus(false);
        document.body.appendChild(exit);
      }
      exit.classList.remove('hidden');
    }else if(exit)exit.classList.add('hidden');
  };

  // ---------- Estado online/offline ----------
  function offlineBanner(){
    let el=document.getElementById('coach522Offline');
    if(!el){
      el=document.createElement('div');
      el.id='coach522Offline';
      el.className='coach522-offline hidden';
      document.body.appendChild(el);
    }
    if(navigator.onLine){
      el.classList.add('hidden');
    }else{
      el.textContent='📴 Sem conexão — seus rascunhos continuam salvos. A IA poderá ser tentada novamente quando a internet voltar.';
      el.classList.remove('hidden');
    }
  }
  window.addEventListener('online',offlineBanner);
  window.addEventListener('offline',offlineBanner);

  function escapeHtml(value){
    return String(value??'')
      .replaceAll('&','&amp;').replaceAll('<','&lt;')
      .replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    wrapGo();
    restoreDrafts();
    offlineBanner();
    setVoiceState('ready','Pronto para falar');
    setTimeout(()=>{renderResumeCard();refreshRecoveryBanner();},250);
  });

  // Scripts externos são carregados depois do script principal; garante o wrap.
  setTimeout(wrapGo,400);
})();