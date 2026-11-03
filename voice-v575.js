(() => {
'use strict';

let currentToken=0;
let activeUtterances=[];
let audioContext=null;
let audioSource=null;
let unlocked=false;
let voicesLoaded=false;
let lastError='';
let serverState='unknown';
let serverPlaying=false;
let serverPaused=false;
let currentFetchController=null;
let pendingPlaybackResolve=null;
let pendingBrowserResolve=null;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,Number(ms)||0)));

function normalizeText(value){
  return String(value||'')
    .replace(/[ \t]+/g,' ')
    .replace(/\s+([,.!?;:])/g,'$1')
    .trim();
}
function speechBlocks(value){
  const raw=String(value||'').replace(/\r\n?/g,'\n').trim();
  if(!raw)return [];
  return raw.split(/\n\s*\n+/).map(x=>normalizeText(x)).filter(Boolean);
}
function chunks(value,max=210){
  const text=normalizeText(value);
  if(!text)return [];
  const sentences=text.match(/[^.!?;:]+[.!?;:]?|[^.!?;:]+$/g)||[text];
  const out=[];let cur='';
  const push=()=>{if(cur.trim()){out.push(cur.trim());cur='';}};
  for(const raw of sentences){
    const s=raw.trim();if(!s)continue;
    if(s.length>max){
      push();
      const words=s.split(/\s+/);let part='';
      for(const w of words){
        const next=part?`${part} ${w}`:w;
        if(next.length>max&&part){out.push(part);part=w;}else part=next;
      }
      if(part)out.push(part);
      continue;
    }
    const next=cur?`${cur} ${s}`:s;
    if(next.length>max){push();cur=s;}else cur=next;
  }
  push();return out;
}
function isIPhone(){
  return /iPhone/i.test(navigator.userAgent||'');
}
function getVoices(){
  if(!('speechSynthesis' in window))return [];
  try{return speechSynthesis.getVoices()||[];}catch{return [];}
}
function pickVoice(lang='pt-BR'){
  const vs=getVoices();
  return vs.find(v=>String(v.lang).toLowerCase()===String(lang).toLowerCase())
    ||vs.find(v=>String(v.lang).toLowerCase().startsWith('pt-br'))
    ||vs.find(v=>String(v.lang).toLowerCase().startsWith('pt'))
    ||vs.find(v=>v.default)
    ||null;
}
function primeVoices(){
  if(!('speechSynthesis' in window))return;
  const v=getVoices();
  if(v.length)voicesLoaded=true;
  if('onvoiceschanged' in speechSynthesis){
    speechSynthesis.addEventListener?.('voiceschanged',()=>{voicesLoaded=getVoices().length>0;},{once:true});
  }
}
primeVoices();

function getAudioContext(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return null;
  if(!audioContext)audioContext=new AudioCtx();
  return audioContext;
}
function unlock(){
  try{
    const ctx=getAudioContext();
    if(ctx){
      ctx.resume?.();
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      gain.gain.value=0.00001;
      osc.connect(gain);gain.connect(ctx.destination);
      osc.start();osc.stop(ctx.currentTime+0.018);
    }
  }catch{}
  if('speechSynthesis' in window){
    try{
      speechSynthesis.resume?.();
      const warm=new SpeechSynthesisUtterance('\u00A0');
      warm.lang='pt-BR';warm.volume=.01;warm.rate=2;
      const voice=pickVoice('pt-BR');if(voice)warm.voice=voice;
      activeUtterances=[warm];
      speechSynthesis.speak(warm);
    }catch{}
  }
  unlocked=true;
  return true;
}

function stopServer(){
  if(audioSource){
    try{audioSource.onended=null;audioSource.stop(0);}catch{}
    audioSource=null;
  }
  // Libera a promessa de reprodução interrompida, inclusive quando pausada.
  const resolvePlayback=pendingPlaybackResolve;
  pendingPlaybackResolve=null;
  if(resolvePlayback)resolvePlayback();
  serverPlaying=false;
  serverPaused=false;
}
function cancel(){
  currentToken++;
  if(currentFetchController){
    currentFetchController.abort();
    currentFetchController=null;
  }
  const resolveBrowser=pendingBrowserResolve;
  pendingBrowserResolve=null;
  if(resolveBrowser)resolveBrowser({ok:false,error:'cancelled',engine:'browser'});
  activeUtterances=[];
  stopServer();
  try{speechSynthesis?.cancel();}catch{}
}
function base64ToArrayBuffer(base64){
  const binary=atob(String(base64||''));
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}
async function fetchTts(text,opts={}){
  const controller=new AbortController();
  currentFetchController=controller;
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch('/api/tts',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      cache:'no-store',
      signal:controller.signal,
      body:JSON.stringify({text,voice:opts.voice||'Gacrux',profile:opts.profile||'conversation'})
    });
    const data=await response.json().catch(()=>({}));
    if(controller.signal.aborted)throw new Error('tts_request_timeout');
    if(!response.ok||!data.audio){
      const err=new Error(data.error||'server_tts_failed');
      err.code=data.code||String(response.status);
      throw err;
    }
    serverState='ready';
    return base64ToArrayBuffer(data.audio);
  }finally{
    clearTimeout(timeout);
    if(currentFetchController===controller)currentFetchController=null;
  }
}
async function playBuffer(arrayBuffer,token,opts,meta){
  const ctx=getAudioContext();
  if(!ctx)throw new Error('audio_context_unavailable');
  if(ctx.state!=='running')await ctx.resume();
  if(token!==currentToken)throw new Error('speech_cancelled');
  const decoded=await ctx.decodeAudioData(arrayBuffer.slice(0));
  if(token!==currentToken)throw new Error('speech_cancelled');

  stopServer();
  const source=ctx.createBufferSource();
  audioSource=source;
  source.buffer=decoded;
  source.connect(ctx.destination);
  serverPlaying=true;serverPaused=false;

  return new Promise((resolve,reject)=>{
    const finish=()=>{
      if(pendingPlaybackResolve===finish)pendingPlaybackResolve=null;
      resolve();
    };
    pendingPlaybackResolve=finish;
    source.onended=()=>{
      if(audioSource===source)audioSource=null;
      serverPlaying=false;serverPaused=false;
      finish();
    };
    try{
      source.start(0);
      opts.onStart?.(meta);
      opts.onChunk?.(meta);
    }catch(error){
      if(pendingPlaybackResolve===finish)pendingPlaybackResolve=null;
      stopServer();
      reject(error);
    }
  });
}
async function serverSpeak(value,opts,token){
  const blocks=speechBlocks(value);
  const parts=[];
  for(let b=0;b<blocks.length;b++){
    const blockParts=chunks(blocks[b],400);
    blockParts.forEach((text,i)=>parts.push({text,pauseAfter:(i===blockParts.length-1&&b<blocks.length-1)?(Number(opts.sectionPause)||520):(Number(opts.chunkPause)||90)}));
  }
  if(!parts.length)return {ok:true,empty:true};
  for(let i=0;i<parts.length;i++){
    if(token!==currentToken)throw new Error('speech_cancelled');
    const buffer=await fetchTts(parts[i].text,opts);
    await playBuffer(buffer,token,opts,{index:i,total:parts.length,text:value});
    if(parts[i].pauseAfter && i<parts.length-1)await sleep(parts[i].pauseAfter);
  }
  if(token!==currentToken)throw new Error('speech_cancelled');
  opts.onEnd?.();
  return {ok:true,engine:'gemini-tts'};
}

function browserSpeak(value,opts,token){
  if(!('speechSynthesis' in window)){
    lastError='speech_synthesis_unavailable';
    opts.onError?.(lastError);
    return Promise.resolve({ok:false,error:lastError});
  }
  const blocks=speechBlocks(value);
  const parts=[];
  for(let b=0;b<blocks.length;b++){
    const blockParts=chunks(blocks[b],Number(opts.chunkSize)||210);
    blockParts.forEach((text,i)=>parts.push({text,pauseAfter:(i===blockParts.length-1&&b<blocks.length-1)?(Number(opts.sectionPause)||520):(Number(opts.chunkPause)||80)}));
  }
  let idx=0,retried=false;
  const lang=opts.lang||'pt-BR';
  const defaultRate=(opts.profile==='devotional'||opts.profile==='reflection') ? .90 : .94;
  const rate=Math.max(.72,Math.min(1.25,Number(opts.rate)||defaultRate));
  const pitch=Math.max(.8,Math.min(1.2,Number(opts.pitch)||1));
  try{speechSynthesis.cancel();speechSynthesis.resume?.();}catch{}

  return new Promise(resolve=>{
    const settle=payload=>{
      if(pendingBrowserResolve===settle)pendingBrowserResolve=null;
      resolve(payload);
    };
    pendingBrowserResolve=settle;
    const fail=(error)=>{
      if(token!==currentToken)return;
      lastError=String(error||'speech_error');
      activeUtterances=[];
      opts.onError?.(lastError);
      settle({ok:false,error:lastError,engine:'browser'});
    };
    const done=()=>{
      if(token!==currentToken)return;
      activeUtterances=[];
      opts.onEnd?.();
      settle({ok:true,engine:'browser'});
    };
    const next=()=>{
      if(token!==currentToken)return;
      if(idx>=parts.length){done();return;}
      const part=parts[idx];
      const u=new SpeechSynthesisUtterance(part.text);
      activeUtterances=[u];
      u.lang=lang;u.rate=rate;u.pitch=pitch;u.volume=1;
      if(!retried){
        const v=pickVoice(lang);if(v)u.voice=v;
      }
      let began=false;
      let watchdog=setTimeout(()=>{
        if(token!==currentToken||began)return;
        try{speechSynthesis.resume?.();}catch{}
        setTimeout(()=>{
          if(token!==currentToken||began)return;
          if(!retried){
            retried=true;
            try{speechSynthesis.cancel();}catch{}
            setTimeout(next,80);
          }else fail('speech_did_not_start');
        },300);
      },1100);

      u.onstart=()=>{
        if(token!==currentToken)return;
        began=true;clearTimeout(watchdog);
        opts.onStart?.({index:idx,total:parts.length,text:value});
        opts.onChunk?.({index:idx,total:parts.length});
      };
      u.onend=()=>{
        if(token!==currentToken)return;
        clearTimeout(watchdog);
        const pause=part.pauseAfter||55;
        idx++;retried=false;
        setTimeout(next,pause);
      };
      u.onerror=e=>{
        if(token!==currentToken)return;
        clearTimeout(watchdog);
        const err=String(e?.error||'speech_error');
        if(!began&&!retried&&!/not-allowed/i.test(err)){
          retried=true;
          try{speechSynthesis.cancel();speechSynthesis.resume?.();}catch{}
          setTimeout(next,80);
          return;
        }
        fail(err);
      };
      try{speechSynthesis.resume?.();speechSynthesis.speak(u);}
      catch(e){fail(e?.message||'speech_exception');}
    };
    setTimeout(next,opts.delay===0?0:(Number(opts.delay)||70));
  });
}

async function speak(text,opts={}){
  const value=String(text||'').replace(/\r\n?/g,'\n').trim();
  // Evita que resposta anterior inicie depois que o usuário tocou no microfone.
  cancel();
  const token=currentToken;
  lastError='';
  if(!value){
    opts.onEnd?.();return {ok:true,empty:true};
  }

  // iPad e demais aparelhos mantêm o mecanismo já aprovado.
  // iPhone usa primeiro TTS por áudio real; se falhar, retorna automaticamente ao Web Speech.
  if(isIPhone() && opts.server!==false){
    try{
      return await serverSpeak(value,opts,token);
    }catch(error){
      if(token!==currentToken || String(error?.message||'')==='speech_cancelled')return {ok:false,error:'cancelled'};
      serverState='fallback';
      lastError=String(error?.code||error?.message||'server_tts_failed');
      try{
        const ctx=getAudioContext();
        if(ctx?.state==='suspended')await ctx.resume();
      }catch{}
      return browserSpeak(value,opts,token);
    }
  }
  return browserSpeak(value,opts,token);
}

async function togglePause(){
  if(serverPlaying){
    const ctx=getAudioContext();
    if(!ctx)return false;
    try{
      if(ctx.state==='running'){
        await ctx.suspend();serverPaused=true;
      }else{
        await ctx.resume();serverPaused=false;
      }
      return true;
    }catch{return false;}
  }
  if('speechSynthesis' in window){
    try{
      if(speechSynthesis.paused){speechSynthesis.resume();return true;}
      if(speechSynthesis.speaking){speechSynthesis.pause();return true;}
    }catch{}
  }
  return false;
}

window.voice574={
  unlock,cancel,speak,togglePause,
  stopServer,
  supported:()=>Boolean(getAudioContext() || ('speechSynthesis' in window)),
  isIPhone,
  isServerPlaying:()=>serverPlaying,
  isServerPaused:()=>serverPaused,
  status:()=>({
    supported:Boolean(getAudioContext() || ('speechSynthesis' in window)),
    unlocked,
    iphone:isIPhone(),
    engine:isIPhone()?'gemini-tts→browser':'browser',
    serverState,
    serverPlaying,
    serverPaused,
    voices:getVoices().length,
    voicesLoaded,
    lastError
  })
};
// Alias para preservar todas as chamadas existentes sem alterar outras funções do app.
window.voice573=window.voice574;
})();
