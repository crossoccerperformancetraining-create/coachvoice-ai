/* Test button lives in profile; it uses exactly the same server route as the Mentor. */
(()=>{
 'use strict';
 window.coach5112ChooseMode=function(mode){window.coach5112Voice?.setMode(mode);const status=document.getElementById('cv511VoiceTestStatus');if(status)status.textContent=mode==='stable'?'Modo estável ativo: usa a voz instalada no iPhone.':'Modo Gemini ativo: a voz escolhida será gerada pela API.';};
 window.addEventListener('coachvoice:voice-mode',()=>{const el=document.getElementById('cv5112VoiceMode');if(el)el.value=window.coach5112Voice?.getMode()||'stable';});
 const sync=()=>{const el=document.getElementById('cv5112VoiceMode');if(el)el.value=window.coach5112Voice?.getMode()||'stable';};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
 window.coach511TestVoice=async function(){
  const status=document.getElementById('cv511VoiceTestStatus'),audio=document.getElementById('cv511VoiceTestPlayer');
  if(!status||!audio)return;
  const pref=localStorage.getItem('coachvoice-voice')||'auto';
  if(window.coach5112Voice?.getMode()==='stable'){
   status.textContent='Testando voz do iPhone…';
   const result=await window.coach5112Voice.speak('Olá, Coach! Esta é a voz estável do seu iPhone. Estou pronto para conversar.',{lang:'pt-BR',rate:.93});
   status.textContent=result==='completed'?'Áudio do iPhone concluído.':result==='blocked'?'Safari bloqueou o som. Toque em Testar voz novamente.':'Sem reprodução. Verifique o volume e a configuração de áudio do aparelho.';
   return;
  }
  status.textContent=`Preparando teste ${pref==='male'?'masculino (Orus)':pref==='female'?'feminino (Kore)':'automático (Gacrux)'}…`;
  try{await window.mentor531PlayAudio('Olá! Esta é a voz que você escolheu no CoachVoice. Vamos conversar com tranquilidade e clareza.',{player:audio,box:document.getElementById('cv511VoiceTestBox'),language:'pt-BR',onStatus:s=>status.textContent=s,onBlocked:()=>status.textContent='No Safari, toque no botão ▶ abaixo para ouvir.',onEnded:()=>status.textContent='Teste de voz concluído.'});}
  catch(e){status.textContent='Teste indisponível: '+(e.message||'Confira conexão e cota Gemini.')+' A preferência continua salva.';}
 };
})();
