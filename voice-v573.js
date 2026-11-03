(() => {
'use strict';

let currentToken=0;
let activeUtterances=[];
let audioContext=null;
let unlocked=false;
let voicesLoaded=false;
let lastError='';

function normalizeText(value){
  return String(value||'')
    .replace(/\s+/g,' ')
    .replace(/\s+([,.!?;:])/g,'$1')
    .trim();
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

function unlock(){
  // Deve ser chamado diretamente dentro de um clique/toque quando possível.
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(AudioCtx){
      audioContext=audioContext||new AudioCtx();
      audioContext.resume?.();
      const osc=audioContext.createOscillator();
      const gain=audioContext.createGain();
      gain.gain.value=0.00001;
      osc.connect(gain);gain.connect(audioContext.destination);
      osc.start();osc.stop(audioContext.currentTime+0.018);
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

function cancel(){
  currentToken++;
  activeUtterances=[];
  try{speechSynthesis?.cancel();}catch{}
}

function speak(text,opts={}){
  const value=normalizeText(text);
  const token=++currentToken;
  lastError='';
  if(!value){
    opts.onEnd?.();return Promise.resolve({ok:true,empty:true});
  }
  if(!('speechSynthesis' in window)){
    lastError='speech_synthesis_unavailable';
    opts.onError?.(lastError);
    return Promise.resolve({ok:false,error:lastError});
  }

  const parts=chunks(value,Number(opts.chunkSize)||210);
  let idx=0,startedAny=false,retried=false;
  const lang=opts.lang||'pt-BR';
  const rate=Math.max(.72,Math.min(1.25,Number(opts.rate)||.94));
  const pitch=Math.max(.8,Math.min(1.2,Number(opts.pitch)||1));

  try{
    speechSynthesis.cancel();
    speechSynthesis.resume?.();
  }catch{}

  return new Promise(resolve=>{
    const fail=(error)=>{
      if(token!==currentToken)return;
      lastError=String(error||'speech_error');
      activeUtterances=[];
      opts.onError?.(lastError);
      resolve({ok:false,error:lastError});
    };
    const done=()=>{
      if(token!==currentToken)return;
      activeUtterances=[];
      opts.onEnd?.();
      resolve({ok:true});
    };
    const next=()=>{
      if(token!==currentToken)return;
      if(idx>=parts.length){done();return;}

      const u=new SpeechSynthesisUtterance(parts[idx]);
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
          }else{
            fail('speech_did_not_start');
          }
        },300);
      },1100);

      u.onstart=()=>{
        if(token!==currentToken)return;
        began=true;startedAny=true;
        clearTimeout(watchdog);
        opts.onStart?.({index:idx,total:parts.length,text:value});
        opts.onChunk?.({index:idx,total:parts.length});
      };
      u.onend=()=>{
        if(token!==currentToken)return;
        clearTimeout(watchdog);
        idx++;retried=false;
        setTimeout(next,55);
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

      try{
        speechSynthesis.resume?.();
        speechSynthesis.speak(u);
      }catch(e){fail(e?.message||'speech_exception');}
    };
    setTimeout(next,opts.delay===0?0:(Number(opts.delay)||70));
  });
}

window.voice573={
  unlock,cancel,speak,
  supported:()=>('speechSynthesis' in window),
  status:()=>({supported:'speechSynthesis' in window,unlocked,voices:getVoices().length,voicesLoaded,lastError})
};
})();