(() => {
  'use strict';
  let sequence=0,request=null,cachedKey='',cachedUrl='',status=()=>{},activePlayer=null;const audioCache=new Map();
  const player=()=>document.getElementById('mentor531Player');
  window.mentor531StopAudioPlayback=()=>{
    sequence++;request?.abort();request=null;activePlayer?.pause();player()?.pause();
  };
  window.mentor531PlayAudio=async(text,options={})=>{
    window.mentor531StopAudioPlayback();
    const turn=sequence,audio=options.player||player();activePlayer=audio;
    if(!audio)throw new Error('Audio player unavailable');
    status=options.onStatus||(()=>{});
    const voice=localStorage.getItem('coachvoice-voice')||'auto';
    const language=options.language||'pt-BR';
    const key=JSON.stringify([text,voice,language]);const hit=audioCache.get(key);if(hit){cachedKey=key;cachedUrl=hit;audioCache.delete(key);audioCache.set(key,hit);}
    try{
      if(key!==cachedKey||!cachedUrl){
        status('Preparando o áudio da resposta…');
        request=new AbortController();const activeRequest=request;const timer=setTimeout(()=>activeRequest.abort(),44000);
        let response;
        try{response=await fetch('/api/mentor-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice,language}),signal:request.signal});}
        finally{clearTimeout(timer);}
        if(!response.ok){const detail=await response.json().catch(()=>({}));const error=new Error(`${detail.error||'Não foi possível gerar a voz.'} (${response.status}${detail.code?', '+detail.code:''})`);error.status=response.status;throw error;}
        const blob=await response.blob();
        if(turn!==sequence)return;
        if(!blob.type.startsWith('audio/')||!blob.size)throw new Error('Áudio inválido.');
        cachedUrl=URL.createObjectURL(blob);cachedKey=key;audioCache.set(key,cachedUrl);if(audioCache.size>8){const oldest=audioCache.keys().next().value;URL.revokeObjectURL(audioCache.get(oldest));audioCache.delete(oldest);}
      }
      if(turn!==sequence)return;
      request=null;audio.src=cachedUrl;
      let prefs={};try{prefs=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}');}catch{}
      audio.playbackRate=Math.min(1.25,Math.max(.75,Number(prefs.voiceRate)||.92));
      const box=options.box||document.getElementById('mentor531PlayerBox');
      if(box){box.hidden=false;box.classList.remove('hidden');}
      audio.onplay=()=>{status('Mentor falando…');options.onStart?.();};
      audio.onended=()=>{status('Sua vez. Toque em Iniciar áudio para continuar.');options.onEnded?.();};
      audio.onerror=()=>{status('Não foi possível reproduzir. Toque em Ouvir resposta para tentar novamente.');options.onError?.();};
      try{await audio.play();}catch{status('Áudio pronto. Toque no botão de reprodução ou em Ouvir resposta.');options.onBlocked?.();}
    }catch(error){
      if(turn!==sequence)return;
      request=null;throw error;
    }
  };
})();
