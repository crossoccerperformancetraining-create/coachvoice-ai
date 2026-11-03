(() => {
'use strict';

const STORE='coachvoice-daily-v574-records';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const key=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function previousKey(){
  const d=new Date(); d.setDate(d.getDate()-1); return key(d);
}
function readAll(){
  try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{return {};}
}
function writeAll(v){localStorage.setItem(STORE,JSON.stringify(v));}
function todayRecord(){
  const all=readAll(); return all[key()]||{};
}
function saveToday(patch){
  const all=readAll();
  all[key()]={...(all[key()]||{}),...patch,updatedAt:Date.now()};
  writeAll(all);
  inject(true);
}
function toastSafe(msg){if(typeof window.toast==='function')window.toast(msg);}
function firstName(){
  try{
    const i=typeof window.getCoachIdentity==='function'?window.getCoachIdentity():null;
    return String(i?.name||localStorage.getItem('coachvoice-name')||'Coach').trim().split(/\s+/)[0]||'Coach';
  }catch{return 'Coach';}
}
function moodLabel(v){return ({good:'Bem',neutral:'Mais ou menos',heavy:'Dia pesado'})[v]||'';}

function checkinHtml(rec){
  return `<article class="daily574-card">
    <div class="daily574-kicker">CHECK-IN RÁPIDO</div>
    <h3>Como você está chegando hoje?</h3>
    <p>Uma resposta curta já ajuda o CoachVoice a ajustar o tom da conversa e da reflexão.</p>
    <div class="daily574-moods">
      <button class="${rec.mood==='good'?'active':''}" onclick="daily574SetMood('good')">Bem</button>
      <button class="${rec.mood==='neutral'?'active':''}" onclick="daily574SetMood('neutral')">Mais ou menos</button>
      <button class="${rec.mood==='heavy'?'active':''}" onclick="daily574SetMood('heavy')">Dia pesado</button>
    </div>
    ${rec.mood?`<small>Registrado hoje: <b>${esc(moodLabel(rec.mood))}</b>.</small>`:''}
  </article>`;
}
function continuityHtml(){
  const y=readAll()[previousKey()]||{};
  const text=String(y.closing||'').trim();
  if(!text)return '';
  return `<article class="daily574-card daily574-continuity">
    <div class="daily574-kicker">CONTINUIDADE</div>
    <h3>Ontem ficou uma ideia para hoje.</h3>
    <blockquote>${esc(text.slice(0,280))}${text.length>280?'…':''}</blockquote>
    <button class="daily574-action" onclick="daily574Talk('continuity')">Retomar com o Mentor</button>
  </article>`;
}
function closeHtml(rec){
  return `<article class="daily574-card daily574-close">
    <div class="daily574-kicker">FECHAMENTO DO DIA</div>
    <h3>O que vale levar para amanhã?</h3>
    <p>Registre um aprendizado, uma decisão ou algo que precisa continuar. Amanhã o CoachVoice pode retomar daqui.</p>
    <textarea id="daily574CloseText" placeholder="Ex.: A conversa com o jogador foi boa. Amanhã preciso revisar o papel dele no treino.">${esc(rec.closing||'')}</textarea>
    <div class="daily574-row">
      <button class="daily574-action" onclick="daily574SaveClose()">Salvar fechamento</button>
      <button onclick="daily574Talk('closing')">Conversar sobre o dia</button>
    </div>
    ${rec.closing?'<small>Fechamento de hoje salvo.</small>':''}
  </article>`;
}
function helpHtml(){
  return `<article class="daily574-card daily574-help">
    <div class="daily574-kicker">ATALHO</div>
    <h3>Precisa organizar alguma coisa agora?</h3>
    <p>O Mentor pode receber o contexto do seu check-in e ajudar sem você procurar outra função.</p>
    <button onclick="daily574Talk('help')">Conversar agora</button>
  </article>`;
}
function panelHtml(){
  const rec=todayRecord(),h=new Date().getHours();
  let cards='';
  if(h<18)cards+=checkinHtml(rec);
  cards+=continuityHtml();
  if(h>=18)cards+=closeHtml(rec);
  cards+=helpHtml();
  return `<section id="daily574Panel" class="daily574-panel">
    <div class="daily574-head"><span>ACOMPANHAMENTO DO DIA</span><small>${esc(firstName())}, sem transformar sua rotina em questionário.</small></div>
    <div class="daily574-grid">${cards}</div>
  </section>`;
}
function inject(force=false){
  const host=document.getElementById('opening571Today'); if(!host)return;
  const old=document.getElementById('daily574Panel');
  if(old && !force)return;
  if(old)old.remove();
  const hero=host.querySelector('.opening571-hero');
  if(!hero)return;
  hero.insertAdjacentHTML('afterend',panelHtml());
}
window.daily574SetMood=function(v){
  const allowed=['good','neutral','heavy']; if(!allowed.includes(v))return;
  saveToday({mood:v,moodAt:Date.now()});
  toastSafe(`Check-in salvo: ${moodLabel(v)}.`);
};
window.daily574SaveClose=function(){
  const text=String(document.getElementById('daily574CloseText')?.value||'').trim();
  if(!text){toastSafe('Escreva uma frase antes de salvar.');return;}
  saveToday({closing:text,closingAt:Date.now()});
  toastSafe('Fechamento salvo para retomar amanhã.');
};
window.daily574Talk=function(kind){
  window.voice573?.unlock?.();
  const rec=todayRecord();
  const y=readAll()[previousKey()]||{};
  let title='Conversa do dia',body='Ajude o treinador a organizar o que está acontecendo agora.';
  if(kind==='continuity'){
    title='Retomar o que ficou de ontem';
    body=`Ontem o treinador registrou: ${String(y.closing||'').trim()}. Comece retomando isso de forma natural e pergunte apenas se for necessário.`;
  }else if(kind==='closing'){
    title='Fechamento do dia';
    body=`Faça um fechamento curto do dia. Check-in de hoje: ${moodLabel(rec.mood)||'não registrado'}. Ajude a identificar aprendizado, pendência e próximo passo, sem virar interrogatório.`;
  }else if(kind==='help'){
    title='Preciso organizar isso agora';
    body=`O treinador abriu um atalho de ajuda. Check-in de hoje: ${moodLabel(rec.mood)||'não registrado'}. Responda primeiro ao que ele disser e escolha a ferramenta mental mais útil: organizar, refletir, decidir ou preparar uma conversa.`;
  }
  if(typeof window.go==='function')window.go('mentor');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({kind:'daily',title,reference:'Hoje · acompanhamento diário',body});
    setTimeout(()=>window.conversation54Start?.('mentor'),120);
  },100);
};

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>inject(false),450);
  const host=document.getElementById('opening571Today');
  if(host){
    let pending=false;
    new MutationObserver(()=>{
      if(pending)return;
      pending=true;
      setTimeout(()=>{pending=false;inject(false);},40);
    }).observe(host,{childList:true});
  }
});
window.addEventListener('storage',()=>setTimeout(()=>inject(true),80));
})();
