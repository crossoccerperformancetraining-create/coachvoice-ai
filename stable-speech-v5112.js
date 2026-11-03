/* CoachVoice 5.11.2 — Web Speech do iPhone como motor padrão de conversação.
 * Sem rede e sem autorização de microfone. Gemini TTS permanece opcional.
 * A fala nunca inicia gravação; o chamador decide quando habilitar o microfone.
 */
(()=>{
 'use strict';
 const KEY='coachvoice-conversation-voice-mode-v5112';
 const canSpeak=()=>typeof window.speechSynthesis!=='undefined' && typeof window.SpeechSynthesisUtterance!=='undefined';
 const getMode=()=>{try{return localStorage.getItem(KEY)==='gemini'?'gemini':'stable';}catch{return 'stable';}};
 const setMode=value=>{const mode=value==='gemini'?'gemini':'stable';try{localStorage.setItem(KEY,mode);}catch{}window.dispatchEvent?.(new Event('coachvoice:voice-mode'));return mode;};
 let active=null,primedAt=0;
 const synth=()=>window.speechSynthesis;
 function chunks(text,max=185){
   const result=[];let remaining=String(text||'').replace(/\s+/g,' ').trim();
   while(remaining){
     if(remaining.length<=max){result.push(remaining);break;}
     let n=Math.max(remaining.lastIndexOf('. ',max),remaining.lastIndexOf('! ',max),remaining.lastIndexOf('? ',max));
     if(n<max*.35)n=remaining.lastIndexOf(' ',max);
     if(n<max*.35)n=max;
     const part=remaining.slice(0,n+((remaining[n]==='.'||remaining[n]==='!'||remaining[n]==='?')?1:0)).trim();
     if(part)result.push(part);
     remaining=remaining.slice(n+((remaining[n]==='.'||remaining[n]==='!'||remaining[n]==='?')?1:0)).trim();
   }
   return result;
 }
 function stop(){
   const old=active;active=null;
   if(old){old.cancelled=true;old.resolveCurrent?.('cancelled');}
   try{synth()?.cancel();}catch{}
 }
 function prime(){
   if(!canSpeak()||active||Date.now()-primedAt<1000)return false;
   try{
     const speech=synth();if(speech.speaking)return false;
     speech.cancel();speech.resume?.();
     const u=new window.SpeechSynthesisUtterance(' ');
     u.lang='pt-BR';u.rate=2;u.volume=0.01;
     speech.speak(u);primedAt=Date.now();return true;
   }catch{return false;}
 }
 function playChunk(job,text,options){
   return new Promise(resolve=>{
     if(job.cancelled||active!==job){resolve('cancelled');return;}
     let finished=false,started=false,startTimeout=null,endTimeout=null;
     const finish=status=>{
       if(finished)return;finished=true;clearTimeout(startTimeout);clearTimeout(endTimeout);
       if(job.resolveCurrent===abort)job.resolveCurrent=null;
       if(status==='blocked'||status==='error'){try{synth().cancel();}catch{}}
       resolve(status);
     };
     const abort=status=>finish(status||'cancelled');job.resolveCurrent=abort;
     try{
       const u=new window.SpeechSynthesisUtterance(text);
       job.utterance=u;u.lang=options.lang||'pt-BR';u.rate=Math.min(1.25,Math.max(.75,Number(options.rate)||.95));u.volume=1;
       // Preferir o timbre escolhido quando instalado, mas nunca silenciar a resposta
       // por falta de voz masculina/feminina no aparelho.
       try{const available=typeof window.pickVoice==='function'?window.pickVoice(u.lang):null;if(available)u.voice=available;}catch{}
       u.onstart=()=>{
         if(job.cancelled||active!==job)return;
         started=true;clearTimeout(startTimeout);
         if(!job.announced){job.announced=true;options.onStart?.();}
         options.onStatus?.('Voz do iPhone reproduzindo…');
       };
       u.onend=()=>finish(job.cancelled?'cancelled':'completed');
       u.onerror=e=>finish(job.cancelled?'cancelled':/not-allowed|audio-busy|interrupted/i.test(String(e?.error||''))?'blocked':'error');
       synth().resume?.();synth().speak(u);
       // Safari pode aceitar speak() sem emitir onstart nem tocar som.
       startTimeout=setTimeout(()=>{if(!started&&!finished)finish('blocked');},3500);
       endTimeout=setTimeout(()=>finish('error'),Math.max(12000,Math.min(42000,text.length*180+5000)));
     }catch{finish('error');}
   });
 }
 async function speak(text,options={}){
   stop();if(!canSpeak())return 'unavailable';
   const parts=chunks(text);if(!parts.length)return 'unavailable';
   const job={cancelled:false,resolveCurrent:null,announced:false,utterance:null};active=job;
   let result='completed';
   try{
     for(const part of parts){
       if(job.cancelled){result='cancelled';break;}
       result=await playChunk(job,part,options);
       if(result!=='completed')break;
     }
   }finally{if(active===job)active=null;}
   if(result==='completed')options.onEnded?.();
   else if(result==='blocked')options.onBlocked?.();
   else if(result==='error'||result==='unavailable')options.onError?.();
   return result;
 }
 const pause=()=>{try{synth()?.pause();return true;}catch{return false;}};
 const resume=()=>{try{synth()?.resume();return true;}catch{return false;}};
 window.coach5112Voice={getMode,setMode,canSpeak,prime,stop,speak,pause,resume,chunks,isSpeaking:()=>!!active};
 // Um toque real em falar/enviar reativa o sintetizador ANTES das chamadas de rede.
 // Fazemos isso no capture, sem chamar a IA ou abrir o microfone.
 const activation='#cv57VoicePanel button, #cv57Options button, #cv56Interrupt, #cv54SendAudio, #cv54SendText, #cv54Repeat, #mentor531StartAudio, #mentor531StopAudio, [onclick*="mentor44RepeatLastAnswer"], [onclick*="mentor42Send"]';
 if(typeof document!=='undefined')document.addEventListener('click',event=>{
   if(!event.isTrusted)return;
   if(event.target?.closest?.(activation))prime();
 },true);
})();
