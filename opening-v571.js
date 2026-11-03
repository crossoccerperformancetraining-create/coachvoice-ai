(() => {
'use strict';

const CACHE='coachvoice-opening-v571';
const ROUTINE='coachvoice-opening-v573-routine';
const BOOKS=Array.isArray(window.OPENING571_BOOKS)?window.OPENING571_BOOKS:[];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

let state={opening:null,book:null,lesson:null,reflection:null};
let routine={day:dayKey(),step:0,done:false,dismissed:false};

function identity(){
  if(typeof window.getCoachIdentity==='function')return window.getCoachIdentity();
  return {name:localStorage.getItem('coachvoice-name')||'Coach',teamName:''};
}
function firstName(){return String(identity().name||'Coach').trim().split(/\s+/)[0]||'Coach';}
function greeting(){
  const h=new Date().getHours();
  return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}
function daypart(){
  const h=new Date().getHours();
  return h<12?'morning':h<18?'afternoon':'evening';
}
function daySeed(){return Number(dayKey().replaceAll('-',''))||1;}
function bookToday(){return BOOKS.length?BOOKS[daySeed()%BOOKS.length]:null;}
function nextLesson(){
  try{
    if(typeof allLessons==='function' && typeof completed!=='undefined'){
      const all=allLessons();
      const lesson=all.find(l=>!completed.has(l[0]))||all[0];
      if(!lesson)return null;
      const found=typeof findLesson==='function'?findLesson(lesson[0]):null;
      return {id:lesson[0],title:lesson[1],subtitle:lesson[2],block:found?.block?.title||'Formação',blockNumber:found?.block?.number||'CURSO'};
    }
  }catch{}
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
  const byPart={
    morning:['Começar sem carregar tudo','O que realmente merece sua energia hoje — e o que pode esperar?'],
    afternoon:['Reorganizar o restante do dia','O que ainda é prioridade hoje e o que já pode sair da sua cabeça?'],
    evening:['Fechar o dia com clareza','O que vale guardar como aprendizado e o que pode terminar aqui?']
  };
  const x=byPart[daypart()];
  return {title:x[0],starter:x[1],why:'Uma conversa curta para organizar o momento, sem transformar a abertura em questionário.',source:'local'};
}
async function aiOpening(force=false){
  const cache=read(CACHE,null);
  if(!force&&cache?.day===dayKey()&&cache?.part===daypart()&&cache?.data)return cache.data;
  const ctx=todayContext(),id=identity(),lesson=nextLesson(),book=bookToday();
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
  }catch{}
  if(!data)data=fallbackOpening();
  save(CACHE,{day:dayKey(),part:daypart(),data,ts:Date.now()});
  return data;
}
function loadRoutine(){
  const r=read(ROUTINE,null);
  routine=(r?.day===dayKey())?r:{day:dayKey(),step:0,done:false,dismissed:false};
  return routine;
}
function saveRoutine(){save(ROUTINE,routine);}
function audioStatus(){
  const s=window.voice573?.status?.();
  if(!s?.supported)return '<span class="voice573-status warn">Voz indisponível neste navegador</span>';
  return `<span class="voice573-status ${s.voices?'ok':'warn'}">Áudio ${s.voices?'pronto':'preparando'}</span>`;
}
function speak(text,opts={}){
  const value=String(text||'').trim();if(!value)return;
  window.voice573?.unlock?.();
  if(window.voice573?.speak){
    window.voice573.speak(value,{lang:'pt-BR',rate:Number(opts.rate)||.92,profile:opts.profile||'conversation',sectionPause:Number(opts.sectionPause)||560,onError:()=>toastSafe('Não consegui iniciar a voz. Confira o volume do iPhone e toque em Ouvir novamente.')});
    return;
  }
}
function toastSafe(msg){if(typeof window.toast==='function')toast(msg);}
function reflectionText(d){
  if(!d)return '';
  return [
    `Reflexão do início do dia. ${d.title||''}`,
    d.message?`Para pensar. ${d.message}`:'',
    d.faith?`Fé. ${d.faith}`:'',
    d.question?`Uma pergunta. ${d.question}`:'',
    d.practice?`Para hoje. ${d.practice}`:''
  ].filter(Boolean).join('\n\n');
}
async function ensureReflection(){
  if(state.reflection)return state.reflection;
  try{
    if(typeof window.reflection57GetToday==='function')state.reflection=await window.reflection57GetToday();
  }catch{}
  return state.reflection;
}
function agendaSummary(){
  const ctx=todayContext();
  const rows=[];
  ctx.events.forEach(x=>rows.push({kind:'Compromisso',time:x.time||'',title:x.title}));
  ctx.tasks.forEach(x=>rows.push({kind:'Tarefa',time:x.time||'',title:x.title}));
  return rows.slice(0,5);
}

function mainCards(){
  const o=state.opening||fallbackOpening(),b=state.book||bookToday(),l=state.lesson||nextLesson();
  const r=loadRoutine();
  const label=r.done?'Rotina concluída':r.step>0?`Continuar rotina · ${Math.min(r.step+1,6)}/6`:'Começar minha rotina';
  return `
    <section class="opening571-hero opening573-hero">
      <div class="opening571-greeting">
        <span>${greeting().toUpperCase()}</span>
        <h1>${esc(firstName())}.</h1>
        <p>O CoachVoice pode conduzir seu começo de dia passo a passo — ou você pode ir direto ao que precisa.</p>
      </div>
      <div class="opening571-conversation">
        <span>IDEIA PARA NOSSA CONVERSA</span>
        <h3>${esc(o.title||'Uma conversa para começar')}</h3>
        <p>${esc(o.starter||'O que merece sua atenção hoje?')}</p>
        <div class="opening573-mini-meta">${audioStatus()}<span>•</span><small>${esc(o.why||'')}</small></div>
        <div class="opening571-conversation-actions">
          <button class="primary" onclick="opening571Talk()">Conversar agora</button>
          <button onclick="opening571AnotherIdea()">Outra ideia</button>
        </div>
      </div>
      <button class="opening571-start opening573-start" onclick="opening573StartRoutine()">${esc(label)}</button>
    </section>

    <section class="opening571-today-flow">
      <div class="opening571-flow-head">
        <div><span>HOJE NO COACHVOICE</span><h3>Tudo que você pode usar hoje.</h3></div>
        <small>Sem precisar fazer tudo.</small>
      </div>
      <div class="opening571-flow-grid">
        <button onclick="opening571Talk()"><i>🎧</i><strong>Conversa</strong><small>${esc(o.title||'Tema de hoje')}</small></button>
        <button onclick="opening571Reflection()"><i>♡</i><strong>Reflexão</strong><small>Texto, áudio e diário</small></button>
        <button onclick="opening571ShowBook()"><i>📖</i><strong>Leitura</strong><small>${esc(b?.author||'Sua biblioteca')}</small></button>
        <button onclick="opening571OpenCourse()"><i>🎓</i><strong>Curso</strong><small>${esc(l?.title||'Próxima aula')}</small></button>
        <button onclick="opening571Agenda()"><i>◷</i><strong>Agenda</strong><small>Tarefas e compromissos</small></button>
        <button onclick="opening571StudyCoach()"><i>◇</i><strong>Study Coach</strong><small>Estudar situação real</small></button>
      </div>
    </section>`;
}
async function render(){
  const host=document.getElementById('opening571Today');if(!host)return;
  state.book=bookToday();state.lesson=nextLesson();state.opening=await aiOpening();
  host.innerHTML=mainCards();
}
window.opening571AnotherIdea=async function(){
  window.voice573?.unlock?.();
  state.opening=await aiOpening(true);await render();
};
window.opening571Talk=function(){
  window.voice573?.unlock?.();
  const o=state.opening||fallbackOpening();
  localStorage.setItem('coachvoice-opening-v573-resume','1');
  if(typeof window.go==='function')go('mentor');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({
      kind:'opening',title:o.title||'Conversa de hoje',reference:'Rotina guiada · Hoje',
      body:`Tema sugerido: ${o.starter||''}. ${o.why||''} Responda primeiro ao que o treinador disser. Não transforme em questionário.`
    });
    setTimeout(()=>window.conversation54Start?.('mentor'),120);
  },100);
};
window.opening571Reflection=function(){window.voice573?.unlock?.();window.reflection57Open?.('today');};
window.opening571OpenCourse=function(){
  const l=state.lesson||nextLesson();
  if(l?.id&&typeof openLesson==='function'){openLesson(l.id);return;}
  if(typeof go==='function')go('tracks');
};
window.opening571Agenda=function(){document.querySelector('.today52-agenda-shell')?.scrollIntoView({behavior:'smooth',block:'start'});};
window.opening571StudyCoach=function(){window.study56Open?.('study');};
window.opening571SpeakBook=function(){
  window.voice573?.unlock?.();
  const b=state.book||bookToday();if(!b)return;
  speak(`Leitura da sua biblioteca. ${b.title}, de ${b.author}.\n\nTrecho. ${b.excerpt}.\n\nPara pensar. ${b.prompt}`,{profile:'reading',rate:.91,sectionPause:620});
};
window.opening571BookToMentor=function(){
  window.voice573?.unlock?.();
  const b=state.book||bookToday();if(!b)return;
  localStorage.setItem('coachvoice-opening-v573-resume','1');
  if(typeof window.go==='function')go('mentor');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({
      kind:'study',title:b.title,reference:`${b.author} · trecho curto verificado`,
      body:`Trecho: ${b.excerpt}. Pergunta do CoachVoice: ${b.prompt}. Separe o trecho da sua síntese.`
    });
    setTimeout(()=>window.conversation54Start?.('mentor'),120);
  },100);
};
function bookHtml(b){
  return `<article class="opening573-step-content opening573-book">
    <span>LEITURA DA SUA BIBLIOTECA</span>
    <h3>${esc(b?.title||'Livro do dia')}</h3>
    <small>${esc(b?.author||'')}</small>
    <blockquote>“${esc(b?.excerpt||'')}”</blockquote>
    <p>${esc(b?.prompt||'')}</p>
    <small class="opening573-book-source">Fonte: ${esc(b?.title||'')} — ${esc(b?.author||'')} · ${esc(b?.kind||'Trecho verificado da sua biblioteca')}</small>
    <div class="opening573-inline-actions">
      <button onclick="opening571SpeakBook()">🔊 Ouvir trecho</button>
      <button onclick="opening571BookToMentor()">Conversar sobre isso</button>
      ${b?.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener">Abrir livro</a>`:''}
    </div>
  </article>`;
}
window.opening571ShowBook=function(){
  state.book=state.book||bookToday();
  const root=document.getElementById('opening571Overlay'),body=document.getElementById('opening571RoutineBody');
  if(!root||!body)return;
  window.voice573?.unlock?.();
  document.getElementById('opening571OverlayTitle').textContent='Leitura da biblioteca';
  body.innerHTML=bookHtml(state.book);
  root.classList.remove('hidden');document.body.classList.add('opening571-open');
};

/* ---------- Rotina realmente guiada ---------- */
const STEP_LABELS=['Saudação','Reflexão','Livro','Conversa','Curso','Agenda'];

function progressHtml(step){
  return `<div class="opening573-progress">
    <div><span>PASSO ${step+1} DE 6</span><strong>${esc(STEP_LABELS[step])}</strong></div>
    <div class="opening573-progress-track"><i style="width:${((step+1)/6)*100}%"></i></div>
  </div>`;
}
function navHtml(step,{back=true,next=true,nextLabel='Próximo',skip=true}={}){
  return `<div class="opening573-nav">
    ${back&&step>0?'<button onclick="opening573Prev()">Voltar</button>':'<span></span>'}
    <div>
      ${skip&&step<5?'<button class="ghost" onclick="opening573Next(false)">Pular</button>':''}
      ${next?`<button class="primary" onclick="opening573Next(true)">${esc(nextLabel)}</button>`:''}
    </div>
  </div>`;
}
async function renderRoutineStep(autoSpeak=false){
  const body=document.getElementById('opening571RoutineBody');if(!body)return;
  const step=Math.max(0,Math.min(5,Number(routine.step)||0));
  state.book=state.book||bookToday();state.lesson=state.lesson||nextLesson();state.opening=state.opening||fallbackOpening();
  let content='',speech='',speechProfile='conversation';

  if(step===0){
    const o=state.opening;
    content=`<article class="opening573-step-content">
      <span>${greeting().toUpperCase()}, ${esc(firstName()).toUpperCase()}</span>
      <h3>Vamos começar com calma.</h3>
      <p>Antes da agenda, eu quero te deixar uma única ideia para o dia.</p>
      <blockquote>${esc(o.starter||'O que merece sua atenção hoje?')}</blockquote>
      <small>${esc(o.why||'')}</small>
      <div class="opening573-inline-actions">
        <button onclick="opening573SpeakCurrent()">🔊 Ouvir</button>
        <button onclick="opening571Talk()">Conversar agora</button>
      </div>
    </article>`;
    speech=`${greeting()}, ${firstName()}. Vamos começar com calma. ${o.starter||''}`;
  }

  if(step===1){
    speechProfile='reflection';
    const d=await ensureReflection();
    content=`<article class="opening573-step-content opening573-reflection">
      <span>REFLEXÃO DO INÍCIO DO DIA</span>
      <h3>${esc(d?.title||'Uma pausa para começar')}</h3>
      <p>${esc(d?.message||'Respire um pouco e escolha com atenção o que merece sua energia hoje.')}</p>
      ${d?.faith?`<div class="opening573-faith"><b>FÉ</b><p>${esc(d.faith)}</p></div>`:''}
      <div class="opening573-question"><b>PARA PENSAR</b><p>${esc(d?.question||'O que você quer levar deste momento para o restante do dia?')}</p></div>
      <div class="opening573-inline-actions">
        <button onclick="opening573SpeakCurrent()">🔊 Ouvir reflexão</button>
        <button onclick="opening571Reflection()">Abrir diário</button>
      </div>
    </article>`;
    speech=reflectionText(d);
  }

  if(step===2){
    speechProfile='reading';
    content=bookHtml(state.book);
    speech=`Leitura da sua biblioteca. ${state.book?.title||''}, de ${state.book?.author||''}.\n\nTrecho. ${state.book?.excerpt||''}.\n\nPara pensar. ${state.book?.prompt||''}`;
  }

  if(step===3){
    const o=state.opening,b=state.book;
    content=`<article class="opening573-step-content">
      <span>CONVERSA COM A IA</span>
      <h3>Agora, podemos conversar.</h3>
      <p>Você pode falar do seu dia, da reflexão ou do trecho do livro. O CoachVoice responde em voz e depois espera você tocar no microfone novamente.</p>
      <div class="opening573-context-box">
        <small>Se quiser um ponto de partida:</small>
        <strong>${esc(o?.starter||b?.prompt||'O que mais chamou sua atenção até aqui?')}</strong>
      </div>
      <button class="opening573-big-action" onclick="opening573TalkAndResume()">🎙 Conversar com o CoachVoice</button>
      <small class="opening573-help">Ao encerrar a conversa, a rotina fica pronta para continuar no passo do curso.</small>
    </article>`;
    speech=`Agora podemos conversar. Você pode falar do seu dia, da reflexão ou do trecho do livro. Quando terminar sua fala, envie. Eu respondo e você escuta.`;
  }

  if(step===4){
    const l=state.lesson;
    content=`<article class="opening573-step-content opening573-course">
      <span>CURSO DE HOJE</span>
      <h3>${esc(l?.title||'Continuar sua formação')}</h3>
      <small>${esc(l?.blockNumber||'CURSO')} · ${esc(l?.block||'Formação')}</small>
      <p>${esc(l?.subtitle||'Continue de onde parou.')}</p>
      <button class="opening573-big-action" onclick="opening573OpenCourseAndKeep()">🎓 Iniciar módulo</button>
      <small class="opening573-help">Se não quiser estudar agora, pule e continue para sua agenda.</small>
    </article>`;
    speech=`Curso de hoje. ${l?.title||'Continuar sua formação'}. ${l?.subtitle||''}`;
  }

  if(step===5){
    const items=agendaSummary();
    content=`<article class="opening573-step-content">
      <span>AGENDA & PRIORIDADES</span>
      <h3>Agora sim: o que precisa acontecer?</h3>
      ${items.length?`<div class="opening573-agenda">${items.map(x=>`<div><span>${esc(x.time||x.kind)}</span><strong>${esc(x.title)}</strong></div>`).join('')}</div>`:'<p>Não encontrei compromissos ou tarefas pendentes registrados para hoje.</p>'}
      <div class="opening573-inline-actions">
        <button onclick="opening571Agenda();opening571CloseRoutine()">Ver agenda completa</button>
        <button onclick="opening573Finish()">✓ Encerrar rotina</button>
      </div>
    </article>`;
    speech=`Chegamos à agenda. ${items.length?`Você tem ${items.length} item ou itens principais registrados.`:'Você não tem itens principais registrados para hoje.'} Escolha agora o que precisa realmente acontecer.`;
  }

  window.opening573CurrentSpeech=speech;
  window.opening573CurrentProfile=speechProfile;
  body.innerHTML=progressHtml(step)+content+navHtml(step,{
    back:step>0,
    next:step<5,
    nextLabel:step===3?'Seguir para o curso':'Próximo',
    skip:step<5
  });
  if(autoSpeak&&speech){
    window.voice573?.speak?.(speech,{lang:'pt-BR',rate:speechProfile==='reflection' ? .90 : .92,profile:speechProfile,sectionPause:600,onError:()=>toastSafe('O áudio não iniciou. Toque em Ouvir para tentar novamente.')});
  }
}
window.opening573StartRoutine=async function(){
  window.voice573?.unlock?.();
  loadRoutine();
  if(routine.done)routine={day:dayKey(),step:0,done:false,dismissed:false};
  const root=document.getElementById('opening571Overlay');
  document.getElementById('opening571OverlayTitle').textContent='Sua rotina no CoachVoice';
  root?.classList.remove('hidden');document.body.classList.add('opening571-open');
  await renderRoutineStep(true);
};
window.opening573SpeakCurrent=function(){
  window.voice573?.unlock?.();
  speak(window.opening573CurrentSpeech||'',{profile:window.opening573CurrentProfile||'conversation',rate:window.opening573CurrentProfile==='reflection' ? .90 : .92,sectionPause:600});
};
window.opening573Next=async function(autoSpeak=true){
  window.voice573?.unlock?.();
  routine.step=Math.min(5,(Number(routine.step)||0)+1);saveRoutine();
  await renderRoutineStep(autoSpeak);
  await render();
};
window.opening573Prev=async function(){
  window.voice573?.unlock?.();
  routine.step=Math.max(0,(Number(routine.step)||0)-1);saveRoutine();
  await renderRoutineStep(false);await render();
};
window.opening573TalkAndResume=function(){
  window.voice573?.unlock?.();
  routine.step=4;saveRoutine();
  localStorage.setItem('coachvoice-opening-v573-resume','1');
  opening571Talk();
};
window.opening573OpenCourseAndKeep=function(){
  routine.step=5;saveRoutine();
  opening571OpenCourse();
};
window.opening573Finish=function(){
  routine.done=true;routine.step=5;saveRoutine();
  opening571CloseRoutine();render();
  toastSafe('Rotina de hoje concluída.');
};
window.opening573ResumeRoutine=function(){
  loadRoutine();
  if(routine.done)return;
  if(typeof window.go==='function')go('dashboard');
  setTimeout(()=>opening573StartRoutine(),180);
};
window.opening571StartRoutine=window.opening573StartRoutine;
window.opening571CloseRoutine=function(){
  window.voice573?.cancel?.();
  document.getElementById('opening571Overlay')?.classList.add('hidden');
  document.body.classList.remove('opening571-open');
};

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('opening571Overlay')?.classList.contains('hidden'))opening571CloseRoutine();});
document.addEventListener('DOMContentLoaded',async()=>{
  loadRoutine();await render();
  // Na primeira entrada do dia, mostramos a rotina como proposta, sem tocar áudio sozinho.
  if(!routine.done&&!routine.dismissed){
    setTimeout(()=>{
      const host=document.getElementById('opening571Today');
      host?.classList.add('opening573-ready');
    },700);
  }
});
window.addEventListener('storage',()=>setTimeout(render,120));
})();