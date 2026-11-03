(() => {
'use strict';

const CACHE='coachvoice-reflection-v57-today';
const JOURNAL='coachvoice-reflection-v57-journal';
const HISTORY='coachvoice-reflection-v57-history';

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const fallback=[
  {
    title:'Você não precisa resolver tudo hoje',
    theme:'Calma & presença',
    message:'Há dias em que a melhor decisão não é avançar mais rápido, mas diminuir o ruído. Nem tudo que está aberto precisa ser resolvido agora. Você pode reconhecer o que sente, cuidar do que depende de você e deixar o restante amadurecer sem transformar incerteza em urgência.',
    faith:'Na fé cristã, confiar também é aceitar que nem todo caminho será compreendido de uma vez. Há espaço para oração, prudência, descanso e próximo passo.',
    question:'O que realmente precisa da sua atenção hoje — e o que pode esperar sem culpa?',
    practice:'Escolha uma única coisa importante para cuidar bem hoje e permita que o restante fique para outro momento.'
  },
  {
    title:'Sua história continua aberta',
    theme:'Esperança & recomeços',
    message:'Um capítulo difícil não resume uma vida inteira. Aquilo que aconteceu merece ser reconhecido, mas não precisa se tornar a única explicação para o que vem depois. Recomeçar não apaga o passado; significa não entregar a ele todo o espaço do futuro.',
    faith:'Esperança não é fingir que tudo será fácil. É continuar caminhando com fé, responsabilidade e abertura para novos caminhos.',
    question:'Que parte da sua vida você está tratando como conclusão quando talvez seja apenas uma passagem?',
    practice:'Escreva uma pequena atitude que represente continuidade, mesmo que você ainda não saiba como será o resto do caminho.'
  },
  {
    title:'Nem todo pensamento merece virar verdade',
    theme:'Clareza & autocuidado',
    message:'Pensamentos podem chegar com força e ainda assim não serem fatos. Em dias de cobrança, a mente pode repetir cenários, antecipar problemas e transformar possibilidades em certezas. Uma pausa ajuda a separar o que aconteceu do que você imagina que pode acontecer.',
    faith:'A fé pode ser um lugar de entrega e honestidade: reconhecer o que preocupa sem precisar alimentar cada medo.',
    question:'O que você sabe de fato e o que está apenas supondo?',
    practice:'Divida uma folha em duas partes: “fatos” e “interpretações”. Coloque cada pensamento no lugar certo.'
  },
  {
    title:'Gratidão não nega o que dói',
    theme:'Gratidão',
    message:'Ser grato não exige dizer que tudo está bem. É possível reconhecer perdas, frustrações e cansaço enquanto também percebe pessoas, oportunidades e pequenos sinais de cuidado que continuam presentes. Gratidão madura não mascara a realidade; amplia o olhar.',
    faith:'Na vida cristã, agradecer pode ser uma forma de lembrar que o valor de um dia não depende apenas do que deu certo.',
    question:'Mesmo com o que está difícil, o que hoje ainda merece ser reconhecido como bom?',
    practice:'Anote três coisas concretas pelas quais você é grato, sem precisar transformá-las em grandes acontecimentos.'
  },
  {
    title:'Limite também pode ser cuidado',
    theme:'Relacionamentos',
    message:'Cuidar de alguém não significa aceitar tudo, resolver tudo ou permanecer disponível para qualquer situação. Relações saudáveis precisam de respeito, honestidade e limites claros. Às vezes, dizer “não” com serenidade protege mais a relação do que acumular ressentimento em silêncio.',
    faith:'Perdão e reconciliação não são a mesma coisa que ausência de limite. É possível buscar paz sem abandonar discernimento.',
    question:'Existe algum “sim” que você tem dado por medo de decepcionar, quando precisaria de um limite mais claro?',
    practice:'Pense em uma frase simples, respeitosa e objetiva para comunicar um limite necessário.'
  }
];

async function ai(mode,payload={}){
  if(typeof window.callCoachAI==='function')return window.callCoachAI(mode,payload);
  const r=await fetch('/api/coach-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,payload})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)return {__error:true,__message:d.error||'A IA não respondeu.'};
  return d;
}
function dailyFallback(){
  const seed=Number(dayKey().replaceAll('-',''));
  return {...fallback[seed%fallback.length]};
}
function renderCard(data){
  const t=document.getElementById('reflection57CardTitle');
  const p=document.getElementById('reflection57CardPreview');
  if(t)t.textContent=data?.title||'Uma pausa boa para o dia';
  if(p)p.textContent=data?.theme?`${data.theme} · 3–5 minutos`:'Fé, esperança, calma e clareza.';
}
async function getToday(force=false,theme=''){
  const cached=read(CACHE,null);
  if(!force && !theme && cached?.date===dayKey() && cached?.data)return cached.data;
  const recent=read(HISTORY,[]).slice(0,7).map(x=>x.theme).filter(Boolean);
  const result=await ai('growth-reflection',{date:dayKey(),theme:theme||'livre',avoidRecentThemes:recent,style:'cristã, acolhedora, prática, sem linguagem clínica'});
  const data=result?.__error?dailyFallback():result;
  if(!theme)save(CACHE,{date:dayKey(),data,source:result?.__error?'fallback':'ai'});
  return data;
}
function speak(text){
  const value=String(text||'').trim();
  if(!value)return;
  window.voice573?.unlock?.();
  if(window.voice573?.speak){
    window.voice573.speak(value,{
      lang:'pt-BR',rate:.90,profile:'reflection',sectionPause:600,
      onError:()=>{if(typeof window.toast==='function')toast('O iPhone não iniciou a voz. Toque em Ouvir novamente e confira o volume do aparelho.');}
    });
    return;
  }
  if(!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel();}catch{}
  const u=new SpeechSynthesisUtterance(value);u.lang='pt-BR';u.rate=.94;speechSynthesis.speak(u);
}
function reflectionText(d){
  return [
    `Reflexão de hoje. ${d.title||''}`,
    d.message?`Para pensar. ${d.message}`:'',
    d.faith?`Fé. ${d.faith}`:'',
    d.question?`Uma pergunta. ${d.question}`:'',
    d.practice?`Para hoje. ${d.practice}`:''
  ].filter(Boolean).join('\n\n');
}
function viewHTML(d){
  return `<article class="reflection57-reading" id="reflection57Readable">
    <span>${esc(d.theme||'REFLEXÃO')}</span>
    <h3>${esc(d.title||'Reflexão de hoje')}</h3>
    <section><b>PARA PENSAR</b><p>${esc(d.message||'')}</p></section>
    ${d.faith?`<section class="faith"><b>FÉ</b><p>${esc(d.faith)}</p></section>`:''}
    <section><b>UMA PERGUNTA</b><p>${esc(d.question||'')}</p></section>
    <section class="practice"><b>PARA HOJE</b><p>${esc(d.practice||'')}</p></section>
    <div class="reflection57-note">Conteúdo de reflexão e bem-estar. Não substitui psicoterapia, atendimento médico ou suporte profissional quando necessário.</div>
    <div class="reflection57-actions">
      <button onclick="reflection57Speak()">Ouvir</button>
      <button onclick="reflection57ToJournal()">Escrever sobre isso</button>
      <button onclick="reflection57TalkMentor()">Conversar</button>
      <button class="primary" onclick="reflection57Complete()">Guardar</button>
    </div>
  </article>`;
}

window.reflection57GetToday=getToday;
window.reflection57Text=reflectionText;

window.reflection57Open=async function(tab='today'){
  document.getElementById('reflection57Overlay')?.classList.remove('hidden');
  document.body.classList.add('reflection57-open');
  reflection57Tab(tab);
  if(tab==='today'){
    const host=document.getElementById('reflection57TodayContent');
    host.innerHTML='<div class="reflection57-loading">Preparando sua reflexão de hoje…</div>';
    const d=await getToday();
    host.innerHTML=viewHTML(d);renderCard(d);
  }
  renderJournal();
};
window.reflection57Close=function(){
  try{speechSynthesis.cancel();}catch{}
  document.getElementById('reflection57Overlay')?.classList.add('hidden');
  document.body.classList.remove('reflection57-open');
};
window.reflection57Tab=function(tab){
  document.querySelectorAll('[data-reflection57-tab]').forEach(b=>b.classList.toggle('active',b.dataset.reflection57Tab===tab));
  document.querySelectorAll('.reflection57-view').forEach(v=>v.classList.remove('active'));
  const id=`reflection57View${tab[0].toUpperCase()+tab.slice(1)}`;
  document.getElementById(id)?.classList.add('active');
  if(tab==='journal')renderJournal();
};
window.reflection57Generate=async function(theme){
  const host=document.getElementById('reflection57ThemeResult');
  host.innerHTML='<div class="reflection57-loading">Criando uma reflexão para este momento…</div>';
  const d=await getToday(true,theme);
  host.innerHTML=viewHTML(d);
  window.reflection57Active=d;
};
window.reflection57Speak=async function(){
  // Libera a voz imediatamente no toque, antes de qualquer await.
  window.voice573?.unlock?.();
  let d=window.reflection57Active||read(CACHE,null)?.data||null;
  if(!d)d=await getToday();
  speak(reflectionText(d));
};
window.reflection57ToJournal=async function(){
  let d=window.reflection57Active;
  if(!d)d=await getToday();
  reflection57Tab('journal');
  const input=document.getElementById('reflection57JournalInput');
  if(input){
    input.value=`Reflexão: ${d.title}\n\nPergunta: ${d.question}\n\nMinha resposta: `;
    setTimeout(()=>input.focus(),80);
  }
};
window.reflection57Complete=async function(){
  let d=window.reflection57Active;
  if(!d)d=await getToday();
  const h=read(HISTORY,[]);
  h.unshift({id:`reflection-${Date.now()}`,date:dayKey(),title:d.title||'',theme:d.theme||'',question:d.question||'',practice:d.practice||'',createdAt:Date.now()});
  save(HISTORY,h.slice(0,100));
  if(typeof window.toast==='function')toast('Reflexão guardada.');
};
window.reflection57TalkMentor=async function(){
  let d=window.reflection57Active;
  if(!d)d=await getToday();
  reflection57Close();
  if(typeof window.go==='function')go('mentor');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({
      kind:'reflection',
      title:d.title||'Reflexão',
      reference:d.theme||'Reflexões & Diário',
      body:reflectionText(d)
    });
    setTimeout(()=>window.conversation54Start?.('mentor'),140);
  },120);
};
window.reflection57UsePrompt=function(){
  const prompts=[
    'O que você está carregando hoje que talvez não precise carregar sozinho?',
    'O que aconteceu de verdade — e o que sua mente acrescentou à história?',
    'Qual parte deste momento pede coragem e qual parte pede paciência?',
    'O que você gostaria de entregar a Deus hoje em vez de tentar controlar?',
    'Que atitude pequena deixaria seu dia um pouco mais leve e mais alinhado com quem você quer ser?',
    'Existe algo que você precisa perdoar, aceitar, limitar ou simplesmente deixar descansar por hoje?'
  ];
  const input=document.getElementById('reflection57JournalInput');if(!input)return;
  input.value=`${prompts[Math.floor(Math.random()*prompts.length)]}\n\n`;
  input.focus();
};
window.reflection57SaveJournal=function(){
  const input=document.getElementById('reflection57JournalInput');
  const text=input?.value.trim()||'';if(!text)return;
  const list=read(JOURNAL,[]);
  list.unshift({id:`journal-${Date.now()}`,date:dayKey(),text,createdAt:Date.now()});
  save(JOURNAL,list.slice(0,200));input.value='';renderJournal();
  if(typeof window.toast==='function')toast('Registro salvo no seu diário.');
};
window.reflection57DeleteJournal=function(id){
  save(JOURNAL,read(JOURNAL,[]).filter(x=>x.id!==id));renderJournal();
};
function renderJournal(){
  const host=document.getElementById('reflection57JournalList');if(!host)return;
  const list=read(JOURNAL,[]);
  host.innerHTML=list.length?list.map(x=>`<article><div><span>${esc(new Date(x.createdAt).toLocaleDateString('pt-BR'))}</span><p>${esc(x.text)}</p></div><button onclick="reflection57DeleteJournal('${esc(x.id)}')">Excluir</button></article>`).join(''):'<div class="reflection57-empty">Seu diário ainda está vazio. Escreva apenas quando fizer sentido.</div>';
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('reflection57Overlay')?.classList.contains('hidden'))reflection57Close();});
document.addEventListener('DOMContentLoaded',async()=>{try{const d=await getToday();renderCard(d);}catch{}});
})();