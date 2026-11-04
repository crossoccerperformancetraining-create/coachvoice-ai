/* CoachVoice v5.11: reliable playback, cancel-safe callbacks and selection-aware cache. */
(()=>{
 'use strict';
 let sequence=0,controller=null,active=null;
 const cache=new Map();
 const defaultPlayer=()=>document.getElementById('mentor531Player');
 const recovery=()=>{let button=document.getElementById('cv5111GlobalHear');if(button)return button;
   button=document.createElement('button');button.type='button';button.id='cv5111GlobalHear';button.className='cv5111-voice-recovery';button.textContent='🔊 Ouvir resposta (toque para liberar no iPhone)';
   button.setAttribute('aria-label','Ouvir resposta do Mentor');button.onclick=()=>active?.play().catch(()=>{});
   document.body.append(button);return button;};
 const showRecovery=visible=>{const b=visible?recovery():document.getElementById('cv5111GlobalHear');b?.classList.toggle('is-visible',Boolean(visible));};
 const stop=()=>{
   sequence++;controller?.abort();controller=null;showRecovery(false);
   for(const a of [active,defaultPlayer()])if(a){try{a.pause();a.currentTime=0;}catch{}a.onended=null;a.onerror=null;a.onplay=null;}
 };
 window.mentor531StopAudioPlayback=stop;
 window.mentor531PlayAudio=async(text,options={})=>{
   stop();const thisTurn=sequence,audio=options.player||defaultPlayer();active=audio;
   if(!audio)throw Error('Reprodutor indisponível.');
   const value=String(text||'').trim().slice(0,3000);if(!value)throw Error('Resposta vazia.');
   const voice=localStorage.getItem('coachvoice-voice')||'auto',language=options.language||'pt-BR';
   const id=JSON.stringify([voice,language,value]);const notify=options.onStatus||(()=>{});
   try{
     let url=cache.get(id);
     if(url){cache.delete(id);cache.set(id,url);}else{
       notify('Gerando voz '+(voice==='male'?'masculina':voice==='female'?'feminina':'selecionada')+'…');
       const request=new AbortController();controller=request;
       const timeout=setTimeout(()=>request.abort(),42000);
       let response;
       try{response=await fetch('/api/mentor-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:value,voice,language}),signal:request.signal});}
       finally{clearTimeout(timeout);}
       if(!response.ok){const data=await response.json().catch(()=>({}));const error=Error(data.error||'Falha do Gemini TTS ('+response.status+').');error.status=response.status;throw error;}
       const blob=await response.blob();if(thisTurn!==sequence)return;
       if(!blob.size||!/^audio\//.test(blob.type))throw Error('Resposta de áudio inválida.');
       url=URL.createObjectURL(blob);cache.set(id,url);
       while(cache.size>8){const first=cache.keys().next().value;const old=cache.get(first);cache.delete(first);URL.revokeObjectURL(old);}
     }
     if(thisTurn!==sequence)return;
     controller=null;audio.src=url;
     let speed=.92;try{const prefs=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}');speed=Number(prefs.voiceRate)||.92;}catch{}
     audio.playbackRate=Math.min(1.25,Math.max(.75,speed));
     const box=options.box||document.getElementById('mentor531PlayerBox');if(box){box.hidden=false;box.classList.remove('hidden');}
     audio.onplay=()=>{if(thisTurn!==sequence)return;showRecovery(false);notify('Reproduzindo voz…');options.onStart?.();};
     audio.onended=()=>{if(thisTurn!==sequence)return;showRecovery(false);notify('Resposta concluída.');options.onEnded?.();};
     audio.onerror=()=>{if(thisTurn!==sequence)return;if(!options.player)showRecovery(true);notify('Erro de reprodução. Toque em ouvir novamente.');options.onError?.();};
     try{await audio.play();}catch{if(thisTurn===sequence){if(!options.player)showRecovery(true);notify('Toque em ▶ para ouvir a resposta no iPhone.');options.onBlocked?.();}}
   }catch(e){if(thisTurn!==sequence)return;controller=null;notify(e.message||'Áudio indisponível.');throw e;}
 };
})();
