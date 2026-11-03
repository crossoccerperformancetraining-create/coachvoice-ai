/* Test button lives in profile; it uses exactly the same server route as the Mentor. */
(()=>{
 'use strict';
 window.coach511TestVoice=async function(){
  const status=document.getElementById('cv511VoiceTestStatus'),audio=document.getElementById('cv511VoiceTestPlayer');
  if(!status||!audio)return;
  const pref=localStorage.getItem('coachvoice-voice')||'auto';
  status.textContent=`Preparando teste ${pref==='male'?'masculino (Orus)':pref==='female'?'feminino (Kore)':'automático (Gacrux)'}…`;
  try{await window.mentor531PlayAudio('Olá! Esta é a voz que você escolheu no CoachVoice. Vamos conversar com tranquilidade e clareza.',{player:audio,box:document.getElementById('cv511VoiceTestBox'),language:'pt-BR',onStatus:s=>status.textContent=s,onBlocked:()=>status.textContent='No Safari, toque no botão ▶ abaixo para ouvir.',onEnded:()=>status.textContent='Teste de voz concluído.'});}
  catch(e){status.textContent='Teste indisponível: '+(e.message||'Confira conexão e cota Gemini.')+' A preferência continua salva.';}
 };
})();
