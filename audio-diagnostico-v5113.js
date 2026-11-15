/* CoachVoice v5.11.3 — diagnóstico local do áudio; sem recolher transcrições, chaves ou gravações. */
(()=>{
 'use strict';
 const entries=[];
 const MAX=35;
 const $=id=>document.getElementById(id);
 const record=(event,detail='')=>{
   const safe=String(detail||'').replace(/https?:\/\/\S+/g,'[url]').slice(0,90);
   entries.push({hora:new Date().toISOString().slice(11,19),evento:String(event).slice(0,50),detalhe:safe});
   if(entries.length>MAX)entries.shift();
   renderStatus();
 };
 const isPhone=()=>/iPhone|iPod/i.test(navigator.userAgent||'');
 function platform(){
   let voices=0;try{voices=window.speechSynthesis?.getVoices?.().length||0;}catch{}
   return {
     aparelho:isPhone()?'iPhone':/iPad/i.test(navigator.userAgent||'')?'iPad':'outro',
     ios:(navigator.userAgent||'').match(/OS\s+([\d_]+)/)?.[1]?.replaceAll('_','.')||'não identificado',
     instalado:window.matchMedia?.('(display-mode: standalone)')?.matches||Boolean(navigator.standalone),
     speechSynthesis:!!window.speechSynthesis,
     vozesDisponiveis:voices,
     audioSession:navigator.audioSession?.type||'indisponível',
     motor:window.coach5112Voice?.getMode?.()||'indisponível',
     audioMedia:typeof window.Audio==='function'
   };
 }
 function renderStatus(){
   const output=$('cv5113DiagnosticsOutput');if(!output)return;
   const p=platform();output.textContent=`Dispositivo: ${p.aparelho} · iOS ${p.ios} · ${p.instalado?'Tela inicial':'Navegador'} · Vozes: ${p.vozesDisponiveis} · Saída: ${p.audioSession}`;
 }
 function setMessage(message){const out=$('cv5113Result');if(out)out.textContent=message;}
 function init(){
   const anchor=$('cv511VoiceTestStatus');if(!anchor||$('cv5113Diagnostics'))return;
   const block=document.createElement('section');block.id='cv5113Diagnostics';block.className='cv5113-diagnostics';
   block.innerHTML=`<h4>🔈 Diagnóstico de áudio do iPhone</h4><p>Teste o som sem iniciar a IA. Os resultados ficam neste aparelho; nenhuma conversa é copiada.</p><div id="cv5113DiagnosticsOutput" class="cv5113-metadata"></div><div class="cv5113-buttons"><button type="button" class="secondary" id="cv5113TestSound">1 · Testar som do iPhone</button><button type="button" class="secondary" id="cv5113TestSpeech">2 · Testar voz do aparelho</button><button type="button" class="secondary" id="cv5113TestGemini">3 · Testar Gemini</button><button type="button" class="secondary" id="cv5113Copy">Copiar diagnóstico</button></div><audio id="cv5113TestPlayer" controls playsinline preload="metadata" src="/audio-teste-v5113.wav" style="display:block;width:100%;margin-top:10px"></audio><p id="cv5113Result" role="status" aria-live="polite">Faça o teste 1 e confira se ouviu o sinal.</p>`;
   anchor.after(block);
   const player=$('cv5113TestPlayer');let currentTest='wav';
   player.onplaying=()=>{if(currentTest==='wav'){record('wav-reproduzindo');setMessage('O arquivo de teste começou a tocar. Se não ouviu, verifique a saída de som e o volume do iPhone.');}else{record('gemini-reproduzindo');setMessage('Áudio Gemini reproduzindo.');}};
   player.onerror=()=>{record('wav-erro',player.error?.code);setMessage('O arquivo não pôde ser reproduzido. Verifique atualização/cache ou conexão.');};
   $('cv5113TestSound').onclick=()=>{
     currentTest='wav';record('wav-toque');window.mentor531StopAudioPlayback?.();player.src='/audio-teste-v5113.wav';player.currentTime=0;player.muted=false;player.volume=1;
     const played=player.play();played?.catch?.(error=>{record('wav-bloqueado',error?.name);setMessage('Som bloqueado: '+(error?.name||'erro')+'. Toque em ▶ no reprodutor.');});
   };
   $('cv5113TestSpeech').onclick=async()=>{
     record('voz-toque');setMessage('Testando a voz nativa…');
     try{const result=await window.coach5112Voice?.speak('Olá, Coach. Este é um teste de som do iPhone.',{lang:'pt-BR',rate:1});record('voz-resultado',result);setMessage(result==='completed'?'A voz informou conclusão. Você realmente ouviu a frase? Se não, teste o áudio do Gemini.':'Voz nativa: '+(result||'indisponível')+'. Faça o teste 3.');}
     catch(error){record('voz-erro',error?.name);setMessage('Erro de voz: '+(error?.name||'desconhecido'));}
   };
   $('cv5113TestGemini').onclick=async()=>{
     currentTest='gemini';record('gemini-toque');setMessage('Preparando áudio Gemini…');
     try{
       await window.mentor531PlayAudio('Olá, Coach. Este áudio foi gerado pela inteligência artificial.',{
         player,box:block,language:'pt-BR',onStatus:setMessage,
         onBlocked:()=>{record('gemini-play-bloqueado');setMessage('Áudio carregado. Toque em ▶ no reprodutor para liberar a voz no iPhone.');},
         onEnded:()=>{record('gemini-terminou');setMessage('Teste Gemini concluído.');}
       });
     }catch(error){record('gemini-erro',error?.message||error?.name);setMessage('Gemini falhou: '+(error?.message||'indisponível')+'. Não é uma falha do alto-falante.');}
   };
   $('cv5113Copy').onclick=()=>{
     const report='CoachVoice 5.11.3 · Diagnóstico de Áudio\n'+JSON.stringify({sistema:platform(),eventos:entries},null,2);
     const copy=()=>{const area=document.createElement('textarea');area.value=report;area.setAttribute('readonly','');block.append(area);area.select();try{document.execCommand('copy');setMessage('Diagnóstico copiado.');}catch{setMessage('Selecione o texto para copiar.');}area.remove();};
     if(navigator.clipboard?.writeText)navigator.clipboard.writeText(report).then(()=>setMessage('Diagnóstico copiado.')).catch(copy);else copy();
   };
   window.speechSynthesis?.addEventListener?.('voiceschanged',()=>{record('vozes-carregadas');renderStatus();});
   renderStatus();
 }
 window.coach5113Diagnostics={record,platform,report:()=>({sistema:platform(),eventos:entries.slice()})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
