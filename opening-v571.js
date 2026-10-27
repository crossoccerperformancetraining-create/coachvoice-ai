(() => {
'use strict';

const CACHE='coachvoice-opening-v571';
const BOOKS=Array.isArray(window.OPENING571_BOOKS)?window.OPENING571_BOOKS:[];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

let state={opening:null,book:null,lesson:null};

function identity(){
  if(typeof window.getCoachIdentity==='function')return window.getCoachIdentity();
  return {name:localStorage.getItem('coachvoice-name')||'Coach',teamName:''};
}
function firstName(){
  const n=String(identity().name||'Coach').trim();
  return n.split(/\s+/)[0]||'Coach';
}
function greeting(){
  const h=new Date().getHours();
  return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}
function daypart(){
  const h=new Date().getHours();
  return h<12?'morning':h<18?'afternoon':'evening';
}
function daySeed(){
  return Number(dayKey().replaceAll('-',''))||1;
}
function bookToday(){
  if(!BOOKS.length)return null;
  return BOOKS[daySeed()%BOOKS.length];
}
function nextLesson(){
  try{
    if(typeof allLessons==='function' && typeof completed!=='undefined'){
      const all=allLessons();
      const lesson=all.find(l=>!completed.has(l[0]))||all[0];
      if(!lesson)return null;
      const found=typeof findLesson==='function'?findLesson(lesson[0]):null;
      return {
        id:lesson[0],
        title:lesson[1],
        subtitle:lesson[2],
        block:found?.block?.title||'Formação',
        blockNumber:found?.block?.number||'CURSO'
      };
    }
  }catch(e){}
  return {id:'',title:'Continuar sua formação',subtitle:'Abra a Formação e escolha a próxima aula.',block:'Formação completa',blockNumber:'CURSO'};
}
function todayContext(){
  const tasks=read('coachvoice-dashboard-tasks-v50',[]).filter(x=>x.day===dayKey()&&!x.done).slice(0,5);
  const events=read('coachvoice-agenda-v52',[]).filter(x=>x.date===dayKey()&&!x.done).slice(0,5);
  const yesterday=read('coachvoice-dashboard-days-v50',[]).slice(-3).reverse().find(x=>x.day!==dayKey());
  return {
    tasks:tasks.map(x=>({title:x.title,time:x.time||'',category:x.category||'',priority:x.priority||'normal'})),
    events:events.map(x=>({title:x.title,time:x.time||'',category:x.category||'',person:x.person||''})),
    yesterday:yesterday?.summary||''
  };
}
function fallbackOpening(){
  const options={
    morning:[
      ['Começar o dia sem carregar tudo','O que realmente merece sua energia hoje — e o que pode esperar?'],
      ['Critério antes da pressa','Qual decisão de hoje merece alguns minutos de clareza antes de virar ação?'],
      ['Presença no começo do dia','Que tipo de treinador e de pessoa você quer ser nas conversas de hoje?']
    ],
    afternoon:[
      ['Reorganizar sem recomeçar do zero','O que mudou desde a manhã e precisa de um ajuste simples agora?'],
      ['Energia bem colocada','O que ainda é prioridade hoje e o que já pode sair da sua cabeça?'],
      ['Uma conversa que vale a pena','Existe alguém com quem uma conversa curta e clara faria diferença hoje?']
    ],
    evening:[
      ['Fechar sem levar tudo para amanhã','O que vale guardar como aprendizado e o que pode terminar aqui?'],
      ['O dia como informação','O que hoje revelou sobre suas escolhas, sua energia ou suas relações?'],
      ['Preparar o amanhã com leveza','Qual é uma coisa que você gostaria de deixar mais simples para amanhã?']
    ]
  };
  const list=options[daypart()];
  const item=list[daySeed()%list.length];
  return {title:item[0],starter:item[1],why:'Uma conversa curta para organizar o momento sem transformar o início do app em questionário.',source:'local'};
}
async function aiOpening(force=false){
  const cache=read(CACHE,null);
  if(!force && cache?.day===dayKey() && cache?.part===daypart() && cache?.data)return cache.data;

  const ctx=todayContext(), id=identity(), lesson=nextLesson(), book=bookToday();
  let data=null;
  try{
    if(typeof window.callCoachAI==='function'){
      const r=await window.callCoachAI('today-opening',{
        date:dayKey(),daypart:daypart(),coachName:id.name||'',teamName:id.teamName||'',
        tasks:ctx.tasks,events:ctx.events,yesterday:ctx.yesterday,
        nextCourse:lesson?{title:lesson.title,block:lesson.block,subtitle:lesson.subtitle}:null,
        dailyBook:book?{title:book.title,author:book.author,prompt:book.prompt}:null
      });
      if(!r?.__error)data=r;
    }
  }catch(e){}
  if(!data)data=fallbackOpening();
  save(CACHE,{day:dayKey(),part:daypart(),data,ts:Date.now()});
  return data;
}
function speak(text){
  if(!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel();}catch{}
  const u=new SpeechSynthesisUtterance(String(text||''));u.lang='pt-BR';
  try{const p=read('coachvoice-v52-settings',{});u.rate=Number(p.voiceRate)||.92;}catch{u.rate=.92;}
  speechSynthesis.speak(u);
}
function bookCard(book,compact=false){
  if(!book)return '';
  return `<article class="opening571-book ${compact?'compact':''}">
    <span>LEITURA DA BIBLIOTECA</span>
    <h4>${esc(book.title)}</h4>
    <small>${esc(book.author)} · ${esc(book.kind)}</small>
    <blockquote>“${esc(book.excerpt)}”</blockquote>
    <p>${esc(book.prompt)}</p>
    <div>
      <button onclick="opening571SpeakBook()">Ouvir</button>
      <button onclick="opening571BookToMentor()">Conversar</button>
      <a href="${esc(book.url)}" target="_blank" rel="noopener">Abrir livro</a>
    </div>
  </article>`;
}
function courseCard(lesson,compact=false){
  if(!lesson)return '';
  return `<article class="opening571-course ${compact?'compact':''}">
    <span>CURSO DE HOJE</span>
    <h4>${esc(lesson.title)}</h4>
    <small>${esc(lesson.blockNumber)} · ${esc(lesson.block)}</small>
    <p>${esc(lesson.subtitle)}</p>
    <button onclick="opening571OpenCourse()">Iniciar módulo</button>
  </article>`;
}
async function render(){
  const host=document.getElementById('opening571Today');if(!host)return;
  state.book=bookToday();state.lesson=nextLesson();
  const opening=await aiOpening();state.opening=opening;
  const ctx=todayContext();
  const pending=ctx.tasks.length+ctx.events.length;
  host.innerHTML=`
    <section class="opening571-hero">
      <div class="opening571-greeting">
        <span>${greeting().toUpperCase()}</span>
        <h1>${esc(firstName())}.</h1>
        <p>${pending?`Você tem ${pending} item(ns) registrado(s) para hoje. Antes de entrar na agenda, podemos começar por uma ideia.`:'Seu dia está aberto. Podemos começar por uma ideia, uma reflexão ou uma leitura curta.'}</p>
      </div>
      <div class="opening571-conversation">
        <span>IDEIA PARA NOSSA CONVERSA</span>
        <h3>${esc(opening.title||'Uma conversa para começar')}</h3>
        <p>${esc(opening.starter||'O que merece sua atenção hoje?')}</p>
        <small>${esc(opening.why||'')}</small>
        <div class="opening571-conversation-actions">
          <button class="primary" onclick="opening571Talk()">Conversar agora</button>
          <button onclick="opening571AnotherIdea()">Outra ideia</button>
        </div>
      </div>
      <button class="opening571-start" onclick="opening571StartRoutine()">Começar minha rotina</button>
    </section>

    <section class="opening571-today-flow">
      <div class="opening571-flow-head">
        <div><span>HOJE NO COACHVOICE</span><h3>Escolha por onde começar.</h3></div>
        <small>Você não precisa fazer tudo.</small>
      </div>
      <div class="opening571-flow-grid">
        <button onclick="opening571Talk()"><i>🎧</i><strong>Conversa</strong><small>${esc(opening.title||'Tema de hoje')}</small></button>
        <button onclick="opening571Reflection()"><i>♡</i><strong>Reflexão</strong><small>Fé, clareza e presença</small></button>
        <button onclick="opening571ShowBook()"><i>📖</i><strong>Leitura</strong><small>${esc(state.book?.author||'Sua biblioteca')}</small></button>
        <button onclick="opening571OpenCourse()"><i>🎓</i><strong>Curso</strong><small>${esc(state.lesson?.title||'Próxima aula')}</small></button>
        <button onclick="opening571Agenda()"><i>◷</i><strong>Agenda</strong><small>Tarefas e compromissos</small></button>
        <button onclick="opening571StudyCoach()"><i>◇</i><strong>Study Coach</strong><small>Estudar uma situação real</small></button>
      </div>
    </section>

    <section class="opening571-daily-pair">
      ${bookCard(state.book,true)}
      ${courseCard(state.lesson,true)}
    </section>`;
}
window.opening571AnotherIdea=async function(){
  const host=document.getElementById('opening571Today');
  if(host)host.classList.add('loading');
  state.opening=await aiOpening(true);
  await render();
  host?.classList.remove('loading');
};
window.opening571Talk=function(){
  const o=state.opening||fallbackOpening();
  if(typeof window.go==='function')go('mentor');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({
      kind:'opening',
      title:o.title||'Conversa de hoje',
      reference:'Abertura inteligente · Hoje',
      body:`Tema sugerido: ${o.starter||''}. ${o.why||''} Responda primeiro ao que o treinador disser. Não transforme a conversa em questionário e não force futebol se o assunto for pessoal.`
    });
    setTimeout(()=>window.conversation54Start?.('mentor'),120);
  },100);
};
window.opening571Reflection=function(){window.reflection57Open?.('today');};
window.opening571OpenCourse=function(){
  const l=state.lesson||nextLesson();
  if(l?.id && typeof openLesson==='function'){openLesson(l.id);return;}
  if(typeof go==='function')go('tracks');
};
window.opening571Agenda=function(){
  document.querySelector('.today52-agenda-shell')?.scrollIntoView({behavior:'smooth',block:'start'});
};
window.opening571StudyCoach=function(){window.study56Open?.('study');};
window.opening571SpeakBook=function(){
  const b=state.book||bookToday();if(!b)return;
  speak(`${b.title}, de ${b.author}. ${b.excerpt} Pergunta para levar: ${b.prompt}`);
};
window.opening571BookToMentor=function(){
  const b=state.book||bookToday();if(!b)return;
  if(typeof window.go==='function')go('mentor');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({
      kind:'study',title:b.title,reference:`${b.author} · trecho verificado do seu Google Drive`,
      body:`Trecho curto: ${b.excerpt}. Pergunta do CoachVoice: ${b.prompt}. Diferencie claramente o trecho original da sua síntese.`
    });
    setTimeout(()=>window.conversation54Start?.('mentor'),120);
  },100);
};
window.opening571ShowBook=function(){
  state.book=state.book||bookToday();
  const root=document.getElementById('opening571Overlay');
  const body=document.getElementById('opening571RoutineBody');
  if(!root||!body)return;
  document.getElementById('opening571OverlayTitle').textContent='Leitura da biblioteca';
  body.innerHTML=bookCard(state.book,false);
  root.classList.remove('hidden');document.body.classList.add('opening571-open');
};
window.opening571StartRoutine=function(){
  const root=document.getElementById('opening571Overlay'),body=document.getElementById('opening571RoutineBody');
  if(!root||!body)return;
  const o=state.opening||fallbackOpening(),b=state.book||bookToday(),l=state.lesson||nextLesson();
  document.getElementById('opening571OverlayTitle').textContent=`${greeting()}, ${firstName()}`;
  body.innerHTML=`
    <div class="opening571-routine-intro">
      <span>ROTEIRO SUGERIDO</span>
      <h3>Comece pelo que fizer sentido hoje.</h3>
      <p>Conversa, reflexão, leitura e curso são portas diferentes. Você pode fazer uma só e seguir para sua agenda.</p>
    </div>
    <article class="opening571-routine-step">
      <b>1</b><div><span>CONVERSA</span><h4>${esc(o.title||'Conversa de hoje')}</h4><p>${esc(o.starter||'')}</p></div>
      <button onclick="opening571CloseRoutine();opening571Talk()">Conversar</button>
    </article>
    <article class="opening571-routine-step">
      <b>2</b><div><span>REFLEXÃO</span><h4>Reflexão do início do dia</h4><p>Leia ou ouça o texto de hoje e guarde apenas o que fizer sentido.</p></div>
      <button onclick="opening571CloseRoutine();opening571Reflection()">Ler reflexão</button>
    </article>
    ${bookCard(b,false)}
    ${courseCard(l,false)}
    <article class="opening571-routine-step">
      <b>5</b><div><span>AGENDA</span><h4>Agora, o que precisa acontecer?</h4><p>Veja compromissos, prioridades e tarefas depois de cuidar do seu ponto de partida.</p></div>
      <button onclick="opening571CloseRoutine();opening571Agenda()">Ver agenda</button>
    </article>`;
  root.classList.remove('hidden');document.body.classList.add('opening571-open');
};
window.opening571CloseRoutine=function(){
  try{speechSynthesis.cancel();}catch{}
  document.getElementById('opening571Overlay')?.classList.add('hidden');
  document.body.classList.remove('opening571-open');
};

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('opening571Overlay')?.classList.contains('hidden'))opening571CloseRoutine();});
document.addEventListener('DOMContentLoaded',()=>setTimeout(render,500));
window.addEventListener('storage',()=>setTimeout(render,120));
})();