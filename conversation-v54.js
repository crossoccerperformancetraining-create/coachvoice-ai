(() => {
'use strict';

const V54_SETTINGS='coachvoice-conversation-v54';
let wakeLock=null;
let paused=false;
let transcriptVisible=false;
let currentState='ready';
let callOpen=false;

const stateCopy={
  ready:['PRONTO','Sua vez','Toque no microfone quando quiser responder.'],
  recording:['OUVINDO','Estou ouvindo você','Pode falar com calma e fazer pausas. Só você decide quando termina.'],
  transcribing:['PROCESSANDO','Entendendo sua fala','Aguarde um instante. Sua mensagem será enviada automaticamente.'],
  responding:['MENTOR','Mentor respondendo','A resposta começa automaticamente assim que ficar pronta.'],
  paused:['PAUSADO','Resposta pausada','Toque em continuar para retomar de onde parou.'],
  error:['ATENÇÃO','Algo não saiu como esperado','Seu conteúdo foi preservado. Você pode tentar novamente.']
};

function settings(){
  try{return {...{speed:1,handsFree:false},...(JSON.parse(localStorage.getItem(V54_SETTINGS)||'{}')||{})};}
  catch{return {speed:1,handsFree:false};}
}
function saveSettings(patch){
  localStorage.setItem(V54_SETTINGS,JSON.stringify({...settings(),...patch}));
}
function setVoiceRate(rate){
  let v52={};
  try{v52=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}')||{};}catch{}
  v52.voiceRate=rate;
  localStorage.setItem('coachvoice-v52-settings',JSON.stringify(v52));
}

function setState(name){
  name=stateCopy[name]?name:'ready';
  currentState=name;
  const copy=stateCopy[name];
  const el=document.getElementById('conv54State');
  const orb=document.getElementById('conv54Orb');
  if(el){
    el.className=`conv54-state ${name}`;
    el.innerHTML=`<span>${copy[0]}</span><strong>${copy[1]}</strong><p>${copy[2]}</p>`;
  }
  if(orb)orb.className=`conv54-orb ${name}`;

  const player=document.getElementById('conv54Player');
  if(player)player.classList.toggle('active',['responding','paused'].includes(name));

  const mic=document.getElementById('mentor42BigMic');
  const micLabel=document.getElementById('mentor513MicLabel');
  if(mic){
    mic.classList.toggle('is-recording',name==='recording');
    mic.classList.toggle('interrupt',name==='responding'||name==='paused');
    mic.setAttribute('aria-label',
      name==='recording'?'Finalizar minha fala':
      name==='responding'||name==='paused'?'Interromper e falar':'Falar'
    );
  }
  if(micLabel){
    micLabel.textContent=
      name==='recording'?'Enviar fala':
      name==='responding'||name==='paused'?'Interromper e falar':
      name==='transcribing'?'Transcrevendo…':'Falar';
  }
}

function inferState(text=''){
  const value=String(text).toLowerCase();
  if(/gravando|estou ouvindo|ouvindo|continue falando|só o botão/.test(value))return 'recording';
  if(/transcrev|process|finalizando sua fala|enviando a gravação/.test(value))return 'transcribing';
  if(/mentor falando|mentor vai responder|mentor respondendo|pensando na sua resposta|iniciando voz/.test(value))return 'responding';
  if(/falh|erro|não consegui|bloqueado|indisponível|recusou/.test(value))return 'error';
  if(/pausad/.test(value))return 'paused';
  return 'ready';
}

async function acquireWake(){
  const badge=document.getElementById('conv54Wake');
  if(!('wakeLock' in navigator)){
    if(badge){badge.textContent='Proteção de tela indisponível';badge.classList.remove('hidden');}
    return;
  }
  try{
    if(wakeLock && !wakeLock.released)return;
    wakeLock=await navigator.wakeLock.request('screen');
    if(badge){badge.textContent='Tela ativa';badge.classList.remove('hidden');}
    wakeLock.addEventListener('release',()=>{wakeLock=null;});
  }catch{
    if(badge){badge.textContent='A tela pode apagar neste navegador';badge.classList.remove('hidden');}
  }
}
async function releaseWake(){
  try{if(wakeLock && !wakeLock.released)await wakeLock.release();}catch{}
  wakeLock=null;
  document.getElementById('conv54Wake')?.classList.add('hidden');
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'&&callOpen)acquireWake();
});

function modeName(mode){
  return mode==='mentor'?'Mentor':mode==='questions'?'Só perguntas':'Conversa livre';
}
window.conversation54SetMode=function(mode){
  const allowed=['free','mentor','questions'];
  if(!allowed.includes(mode))mode='free';
  const select=document.getElementById('mentor42Mode');
  if(select){
    select.value=mode;
    window.mentor42ModeChanged?.();
  }
  ['free','mentor','questions'].forEach(m=>{
    document.getElementById(`conv54Mode${m[0].toUpperCase()+m.slice(1)}`)?.classList.toggle('active',m===mode);
  });
  const title=document.getElementById('mentor42CallTitle');
  if(title)title.textContent=modeName(mode);
};

function syncMode(){
  const mode=document.getElementById('mentor42Mode')?.value||'free';
  window.conversation54SetMode(['free','mentor','questions'].includes(mode)?mode:'free');
}

window.conversation54Start=function(mode='free'){
  if(!['free','mentor','questions'].includes(mode))mode='free';
  const select=document.getElementById('mentor42Mode');
  if(select){select.value=mode;window.mentor42ModeChanged?.();}
  // v5.6.2: o treinador controla o início de cada fala.
  // Depois de enviar, resposta e áudio continuam automáticos.
  window.mentor561SetAutoAssist?.(false,{quiet:true});
  const assisted=document.getElementById('conv561AutoAssist');
  if(assisted)assisted.checked=false;
  window.mentor42StartCall?.(mode);
};

window.conversation54Mic=function(){
  window.mentor561HoldAutoAssist?.(1500);
  // Se o Mentor ainda estiver falando, tocar no mic interrompe a voz primeiro.
  if(window.speechSynthesis && (speechSynthesis.speaking||speechSynthesis.paused)){
    try{speechSynthesis.cancel();}catch{}
    paused=false;
  }
  setTimeout(()=>window.mentor42Capture?.(true),40);
};

window.conversation54TogglePause=function(){
  if(!('speechSynthesis' in window))return;
  const btn=document.getElementById('conv54PauseBtn');
  if(speechSynthesis.paused){
    try{speechSynthesis.resume();paused=false;setState('responding');}catch{}
    if(btn){btn.innerHTML=`<svg class="conv54-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 5v14M16 5v14"/></svg><small>Pausar</small>`;}
  }else if(speechSynthesis.speaking){
    try{speechSynthesis.pause();paused=true;setState('paused');}catch{}
    if(btn){btn.innerHTML=`<svg class="conv54-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="m8 5 11 7-11 7z"/></svg><small>Continuar</small>`;}
  }else{
    window.mentor44RepeatLastAnswer?.();
  }
};

window.conversation54Repeat=function(){
  paused=false;
  try{speechSynthesis.cancel();}catch{}
  setState('responding');
  setTimeout(()=>window.mentor44RepeatLastAnswer?.(),80);
};

window.conversation561ToggleAutoAssist=function(input){
  const enabled=Boolean(input?.checked);
  window.mentor561SetAutoAssist?.(enabled);
  if(enabled && currentState==='ready'){
    window.mentor561ScheduleAutoMic?.(500);
  }
};

window.conversation54StopSpeech=function(){
  paused=false;
  try{speechSynthesis.cancel();}catch{}
  window.mentor42StopVoice?.();
  setState('ready');
};

window.conversation54CycleSpeed=function(){
  const speeds=[1,1.15,1.25];
  const current=Number(settings().speed)||1;
  const next=speeds[(speeds.findIndex(v=>Math.abs(v-current)<.01)+1)%speeds.length];
  saveSettings({speed:next});
  setVoiceRate(next);
  const btn=document.getElementById('conv54SpeedBtn');
  if(btn)btn.textContent=`${next}x`;
  if(speechSynthesis?.speaking||speechSynthesis?.paused){
    try{speechSynthesis.cancel();}catch{}
    setTimeout(()=>window.mentor44RepeatLastAnswer?.(),100);
  }
};

window.conversation54ToggleTranscript=function(force){
  transcriptVisible=typeof force==='boolean'?force:!transcriptVisible;
  document.getElementById('conv54TranscriptPanel')?.classList.toggle('hidden',!transcriptVisible);
  if(transcriptVisible){
    const chat=document.getElementById('mentor42CallChat');
    if(chat)chat.scrollTop=chat.scrollHeight;
  }
};

function updateHandsFreeLabel(){
  const input=document.getElementById('mentor44AutoConversation');
  if(input)input.checked=false; // hands-free por pausa continua desligado.
  const assisted=document.getElementById('conv561AutoAssist');
  if(assisted)assisted.checked=false;
  window.mentor561SetAutoAssist?.(false,{quiet:true});
}

function observeStatus(){
  const status=document.getElementById('mentor42CallStatus');
  if(!status||status.__conv54Observed)return;
  status.__conv54Observed=true;
  const apply=()=>setState(inferState(status.textContent));
  new MutationObserver(apply).observe(status,{childList:true,subtree:true,characterData:true});
  apply();
}

function wrapCalls(){
  if(window.mentor42StartCall && !window.mentor42StartCall.__conv54){
    const original=window.mentor42StartCall;
    const wrapped=function(...args){
      const result=original.apply(this,args);
      callOpen=true;
      transcriptVisible=false;
      paused=false;
      document.getElementById('conv54TranscriptPanel')?.classList.add('hidden');
      setTimeout(()=>{
        syncMode();
        observeStatus();
        acquireWake();
        const speed=Number(settings().speed)||1;
        setVoiceRate(speed);
        const btn=document.getElementById('conv54SpeedBtn');
        if(btn)btn.textContent=`${speed}x`;
        updateHandsFreeLabel();
      },50);
      return result;
    };
    wrapped.__conv54=true;
    window.mentor42StartCall=wrapped;
  }

  if(window.mentor42EndCall && !window.mentor42EndCall.__conv54){
    const originalEnd=window.mentor42EndCall;
    const wrappedEnd=function(...args){
      callOpen=false;
      paused=false;
      window.mentor561SetAutoAssist?.(false,{quiet:true});
      releaseWake();
      return originalEnd.apply(this,args);
    };
    wrappedEnd.__conv54=true;
    window.mentor42EndCall=wrappedEnd;
  }
}

function autoSaveIndicator(){
  const status=document.getElementById('mentor42CallStatus');
  if(!status)return;
  // saveActive já persiste cada turno; esta UI apenas deixa isso explícito.
  const head=document.querySelector('.conv54-head');
  if(head && !head.querySelector('.conv54-saved')){
    const saved=document.createElement('span');
    saved.className='conv54-saved';
    saved.textContent='Salvamento automático';
    head.querySelector('div')?.appendChild(saved);
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  wrapCalls();
  observeStatus();
  autoSaveIndicator();
  setVoiceRate(Number(settings().speed)||1);
});
setTimeout(()=>{wrapCalls();observeStatus();autoSaveIndicator();},450);
})();