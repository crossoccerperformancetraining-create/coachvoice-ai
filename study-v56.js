(() => {
'use strict';

const LIB=Array.isArray(window.STUDY56_LIBRARY)?window.STUDY56_LIBRARY:[];
const SESSIONS='coachvoice-study-v56-sessions';
const NOTES='coachvoice-study-v56-notes';
const SOURCES='coachvoice-study-v56-verified-sources';
const MODEL='coachvoice-study-v56-work-model';
const SETTINGS='coachvoice-study-v56-settings';

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const now=()=>Date.now();
const dateBR=t=>new Date(t||Date.now()).toLocaleDateString('pt-BR');
const dayMs=86400000;
let activeTab='study';
let sourceMode=read(SETTINGS,{sourceMode:'compare'}).sourceMode||'compare';
let lastStudy=null;
let lastCase=null;

const MODEL_SECTIONS=[
 ['principles','Princípios do treinador','O que orienta suas decisões mesmo sob pressão?'],
 ['leadership','Liderança e cultura','Como você lidera, cobra, escuta e protege o grupo?'],
 ['communication','Comunicação','Como você fala com elenco, indivíduo, comissão, diretoria e imprensa?'],
 ['gameModel','Modelo de jogo','Quais princípios dão identidade ao seu time?'],
 ['methodology','Metodologia de treino','Como o treino traduz o jogo que você quer?'],
 ['staff','Comissão técnica','Como distribui responsabilidade, debate e decisão?'],
 ['squad','Gestão de elenco','Como trata papel, mérito, insatisfação e confiança?'],
 ['analysis','Análise e decisão','Que evidências você usa e como evita decidir só por impressão?'],
 ['matchday','Matchday','Como organiza preparação, comunicação e leitura durante o jogo?'],
 ['crisis','Crise e adversidade','Como reage a sequência ruim, pressão externa e conflito?']
];

async function ai(mode,payload={}){
  if(typeof window.callCoachAI==='function') return window.callCoachAI(mode,payload);
  const r=await fetch('/api/coach-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,payload})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) return {__error:true,__message:data.error||'A IA não respondeu.'};
  return data;
}
function showToast(msg){ if(typeof window.toast==='function')window.toast(msg); }
function busy(el,on,label='Pensando…'){
  if(!el)return;
  if(on){el.dataset.old=el.textContent;el.disabled=true;el.textContent=label;}
  else{el.disabled=false;el.textContent=el.dataset.old||el.textContent;}
}
function catalogPayload(){
  return LIB.map(x=>({id:x.id,title:x.title,author:x.author,priority:x.priority,status:x.status,themes:x.themes,bestUse:x.bestUse}));
}
function verifiedSources(){
  return read(SOURCES,[]).filter(x=>x.text&&x.bookId);
}
function notes(){return read(NOTES,[])}
function sessions(){return read(SESSIONS,[])}
function model(){return read(MODEL,{})}

function scoreBooks(query,limit=5){
  const q=String(query||'').toLowerCase();
  const words=q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(x=>x.length>2);
  const thematic={
    lideranca:['liderança','gestão','cultura','valores','jogador','grupo'],
    jogador:['liderança','psicologia','gestão','escuta','grupo'],
    crise:['liderança','psicologia','decisão','adversidade','crises'],
    modelo:['modelo de jogo','tática','organização','transições','espaço','posse'],
    comissao:['comissão técnica','staff','segundo treinador','delegação'],
    diretoria:['gestão','comunicação','liderança','dirigentes','mercado'],
    dados:['dados','estatística','análise','probabilidade','decisão'],
    treino:['treinamento','metodologia','treino','formação']
  };
  const enriched=[...words];
  Object.entries(thematic).forEach(([k,vals])=>{if(q.includes(k))enriched.push(...vals.map(v=>v.toLowerCase()));});
  return LIB.map(b=>{
    const hay=[b.title,b.author,...(b.themes||[]),b.bestUse||''].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let score=b.priority==='A'?3:b.priority==='B'?1:0;
    enriched.forEach(w=>{const ww=w.normalize('NFD').replace(/[\u0300-\u036f]/g,''); if(hay.includes(ww))score+=2;});
    if(b.status!=='searchable')score-=2;
    return {...b,_score:score};
  }).sort((a,b)=>b._score-a._score).slice(0,limit);
}

window.study56Open=function(tab='study'){
  document.getElementById('study56Overlay')?.classList.remove('hidden');
  document.body.classList.add('study56-open');
  study56SourceMode(sourceMode);
  populateBooks();
  renderNotebook();renderModel();renderReview();study56RenderLibrary('');
  study56Tab(tab);
};
window.study56Close=function(){
  try{speechSynthesis.cancel();}catch{}
  document.getElementById('study56Overlay')?.classList.add('hidden');
  document.body.classList.remove('study56-open');
};
window.study56Tab=function(tab){
  activeTab=tab;
  document.querySelectorAll('[data-study-tab]').forEach(b=>b.classList.toggle('active',b.dataset.studyTab===tab));
  document.querySelectorAll('.study56-view').forEach(v=>v.classList.toggle('active',v.id===`study56View${tab[0].toUpperCase()+tab.slice(1)}`));
  if(tab==='review')renderReview();
  if(tab==='notebook')renderNotebook();
  if(tab==='model')renderModel();
  if(tab==='library'){populateBooks();study56RenderLibrary('');renderVerified();}
};

window.study56SourceMode=function(mode){
  if(!['library','ai','compare'].includes(mode))mode='compare';
  sourceMode=mode;save(SETTINGS,{...read(SETTINGS,{}),sourceMode});
  document.querySelectorAll('[data-source-mode]').forEach(b=>b.classList.toggle('active',b.dataset.sourceMode===mode));
  const label=document.getElementById('study56SourceLabel');
  const note=document.getElementById('study56SourceNote');
  if(label)label.textContent=mode==='library'?'Somente minha biblioteca':mode==='ai'?'Conhecimento geral da IA':'Comparar biblioteca + IA';
  if(note)note.textContent=
    mode==='library'
      ?'Sem trecho verificado, o CoachVoice apenas indica quais livros do seu catálogo estudar; não atribui ideias específicas ao autor.'
      :mode==='ai'
      ?'A resposta usa conhecimento geral da IA e não apresenta afirmações como se tivessem vindo dos seus PDFs.'
      :'O catálogo aponta fontes relevantes e a IA faz uma análise separada. Ideia de autor e síntese do CoachVoice não são misturadas.';
};

window.study56Preset=function(kind){
  const examples={
    lideranca:'Preciso cobrar mais intensidade do grupo sem transformar a semana em tensão constante. Como estruturar essa liderança?',
    jogador:'Um jogador importante perdeu espaço, está insatisfeito e procurou um dirigente. Quero conversar com ele com clareza e sem fechar a porta.',
    crise:'Estamos em uma sequência ruim de resultados e o ambiente externo aumentou a pressão. O que devo preservar e o que devo revisar?',
    modelo:'Quero deixar meu modelo de jogo mais claro para os atletas sem transformar a comunicação em excesso de conceitos.',
    comissao:'Minha comissão tem opiniões diferentes sobre uma decisão importante. Como conduzir o debate e sair com responsabilidade clara?',
    diretoria:'Tenho uma reunião com a diretoria depois de resultados ruins. Quero explicar cenário, decisões e próximos passos sem parecer defensivo.'
  };
  const el=document.getElementById('study56Situation');if(el){el.value=examples[kind]||'';el.focus();}
};

function sourceCards(books){
  return books.map(b=>`<article class="study56-source-card">
    <div><span>${esc(b.priority)} · ${b.status==='searchable'?'CATALOGADO':'PENDENTE'}</span><strong>${esc(b.title)}</strong><small>${esc(b.author)}</small></div>
    <p>${esc(b.bestUse)}</p>
    <div class="study56-tags">${(b.themes||[]).slice(0,4).map(t=>`<i>${esc(t)}</i>`).join('')}</div>
  </article>`).join('');
}
function studyLoading(host,msg){
  host.innerHTML=`<div class="study56-loading"><span></span><strong>${esc(msg)}</strong><small>O CoachVoice está organizando a resposta.</small></div>`;
}
function renderStudy(data,situation,mode){
  const refs=(data.libraryRefs||[]).length?data.libraryRefs:scoreBooks(situation,4).map(b=>({title:b.title,author:b.author,why:b.bestUse,status:b.status}));
  const sourceLabel=mode==='library'?'Biblioteca catalogada':mode==='ai'?'IA geral':'Biblioteca + IA';
  const host=document.getElementById('study56StudyResult');
  host.innerHTML=`<section class="study56-output">
    <div class="study56-output-head"><span>${esc(sourceLabel)}</span><h3>${esc(data.title||'Plano de estudo da situação')}</h3><p>${esc(data.reading||data.summary||'')}</p></div>

    ${data.libraryBoundary?`<div class="study56-boundary">${esc(data.libraryBoundary)}</div>`:''}

    <div class="study56-flow-grid">
      <article><b>1</b><span>ESTUDO</span><strong>${esc(data.studyFocus||'')}</strong><p>${esc(data.studyReason||'')}</p></article>
      <article><b>2</b><span>DECISÃO</span><strong>${esc(data.decision||'')}</strong><p>${esc(data.decisionCriterion||'')}</p></article>
      <article><b>3</b><span>APLICAÇÃO</span><strong>${esc(data.application||'')}</strong><p>${esc(data.tomorrow||'')}</p></article>
    </div>

    ${refs.length?`<section class="study56-output-section"><span>REFERÊNCIAS DA SUA BIBLIOTECA</span><div class="study56-ref-list">${refs.map(r=>`<div><strong>${esc(r.title||'')}</strong><small>${esc(r.author||'')}</small><p>${esc(r.why||r.reason||'')}</p></div>`).join('')}</div></section>`:''}

    ${data.aiSynthesis?`<section class="study56-output-section ai"><span>SÍNTESE DO COACHVOICE</span><p>${esc(data.aiSynthesis)}</p></section>`:''}
    ${Array.isArray(data.tensions)&&data.tensions.length?`<section class="study56-output-section"><span>TENSÕES / PONTOS PARA NÃO SIMPLIFICAR</span>${data.tensions.map(x=>`<p>• ${esc(x)}</p>`).join('')}</section>`:''}
    ${Array.isArray(data.questions)&&data.questions.length?`<section class="study56-output-section"><span>PERGUNTAS ANTES DE AGIR</span>${data.questions.map(x=>`<p>• ${esc(x)}</p>`).join('')}</section>`:''}

    <div class="study56-output-actions">
      <button onclick="study56SaveFromStudy()">Isso é meu</button>
      <button onclick="study56Podcast()">Ouvir como podcast</button>
      <button onclick="study56Simulate()">Simular no Mentor</button>
      <button class="primary" onclick="study56MarkApplied()">Registrar decisão</button>
    </div>
  </section>`;
  lastStudy={...data,situation,mode,refs,createdAt:now()};
}

window.study56RunStudy=async function(){
  const situation=document.getElementById('study56Situation')?.value.trim()||'';
  if(situation.length<12){showToast('Descreva um pouco mais a situação.');return;}
  const host=document.getElementById('study56StudyResult');
  studyLoading(host,'Buscando o melhor caminho de estudo…');
  const refs=scoreBooks(situation,6);
  const verified=verifiedSources().filter(v=>refs.some(r=>r.id===v.bookId)).slice(0,5);

  let mode='study-coach-compare';
  let payload={situation,catalog:refs.map(({id,title,author,priority,status,themes,bestUse})=>({id,title,author,priority,status,themes,bestUse}))};

  if(sourceMode==='library'){
    if(verified.length){
      const result=await ai('growth-study-sources',{
        question:situation,
        sources:verified.map(v=>({title:v.title,location:v.location||'Nota verificada',text:v.text.slice(0,6000)}))
      });
      if(!result?.__error){
        const shaped={
          title:'Estudo fundamentado nas fontes verificadas',
          reading:result.answer,
          studyFocus:result.synthesis,
          studyReason:'As ideias atribuídas aos livros abaixo vieram somente dos trechos/notas verificadas salvas neste aparelho.',
          decision:'Defina sua decisão depois de confrontar o contexto real com os critérios das fontes.',
          decisionCriterion:result.application,
          application:result.application,
          tomorrow:'Transforme a síntese em uma ação observável.',
          libraryBoundary:'Modo “Só biblioteca”: nenhuma ideia específica foi atribuída a uma fonte fora dos trechos verificados.',
          libraryRefs:(result.sources||[]).map(x=>({title:x.title,why:x.idea,author:x.location})),
          questions:[result.question].filter(Boolean)
        };
        renderStudy(shaped,situation,'library');return;
      }
    }
    mode='study-coach-catalog';
    payload.verifiedAvailable=verified.length;
  } else if(sourceMode==='ai'){
    mode='study-coach-general';
  }

  const result=await ai(mode,payload);
  if(result?.__error){
    host.innerHTML=`<div class="study56-error"><strong>Não consegui gerar o estudo agora.</strong><p>${esc(result.__message||'Tente novamente em instantes.')}</p></div>`;
    return;
  }
  renderStudy(result,situation,sourceMode);
};

window.study56SaveFromStudy=function(){
  if(!lastStudy)return;
  const n=notes();
  const text=lastStudy.aiSynthesis||lastStudy.studyFocus||lastStudy.reading||lastStudy.summary||'';
  n.unshift({id:`note-${now()}`,createdAt:now(),title:lastStudy.title||'Aprendizado',text,context:lastStudy.situation,kind:'study',sourceMode:lastStudy.mode});
  save(NOTES,n.slice(0,250));renderNotebook();showToast('Aprendizado salvo no seu caderno.');
};
window.study56MarkApplied=function(){
  if(!lastStudy)return;
  const list=sessions();
  const item={
    id:`study-${now()}`,createdAt:now(),situation:lastStudy.situation,title:lastStudy.title||'Estudo',
    decision:lastStudy.decision||'',application:lastStudy.application||'',summary:lastStudy.aiSynthesis||lastStudy.studyFocus||'',
    refs:(lastStudy.refs||[]).map(r=>r.title),sourceMode:lastStudy.mode,
    reviewStage:0,nextReviewAt:now()+2*dayMs
  };
  save(SESSIONS,[item,...list].slice(0,200));
  renderReview();showToast('Decisão registrada. Revisão programada.');
};
window.study56Simulate=function(){
  if(!lastStudy)return;
  study56Close();
  if(typeof window.go==='function')go('mentor');
  const body=[
    `Situação real: ${lastStudy.situation}`,
    lastStudy.decision?`Decisão em avaliação: ${lastStudy.decision}`:'',
    lastStudy.application?`Aplicação proposta: ${lastStudy.application}`:'',
    'Faça uma simulação realista. Não imite um treinador famoso. Assuma apenas o papel necessário à situação e confronte a decisão com profissionalismo.'
  ].filter(Boolean).join(' ');
  setTimeout(()=>{
    window.mentor55OpenGrowthContext?.({kind:'study',title:'Simulação do Study Coach',reference:'Study Coach v5.6',body});
    setTimeout(()=>window.conversation54Start?.('mentor'),140);
  },120);
};
window.study56Podcast=async function(){
  if(!lastStudy)return;
  const result=await ai('study-podcast',{situation:lastStudy.situation,study:lastStudy,minutes:6});
  const script=result?.__error
    ?[lastStudy.reading,lastStudy.aiSynthesis,lastStudy.application].filter(Boolean).join(' ')
    :result.script;
  if(!script)return;
  if(!('speechSynthesis' in window)){showToast('Leitura em voz não disponível neste navegador.');return;}
  try{speechSynthesis.cancel();}catch{}
  const u=new SpeechSynthesisUtterance(script);u.lang='pt-BR';
  try{const s=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}');u.rate=Number(s.voiceRate)||1;}catch{u.rate=1;}
  speechSynthesis.speak(u);showToast('Áudio iniciado. Você pode fechar o Study Coach e continuar ouvindo.');
};

window.study56RunTable=async function(){
  const s=document.getElementById('study56TableSituation')?.value.trim()||document.getElementById('study56Situation')?.value.trim()||'';
  if(s.length<10){showToast('Descreva uma situação para montar a mesa.');return;}
  const host=document.getElementById('study56TableResult');studyLoading(host,'Montando diferentes lentes…');
  const refs=scoreBooks(s,5);
  const result=await ai('study-reference-table',{situation:s,catalog:refs.map(({title,author,themes,bestUse,status})=>({title,author,themes,bestUse,status}))});
  if(result?.__error){host.innerHTML=`<div class="study56-error"><strong>Não consegui montar a mesa.</strong><p>${esc(result.__message||'')}</p></div>`;return;}
  host.innerHTML=`<section class="study56-table-output">
    <div class="study56-boundary">Estas são lentes de estudo associadas ao perfil temático das obras — não falas nem opiniões simuladas dos autores.</div>
    ${(result.lenses||[]).map(x=>`<article><span>${esc(x.reference||'REFERÊNCIA')}</span><h4>${esc(x.lens||'')}</h4><p>${esc(x.question||'')}</p><small>${esc(x.use||'')}</small></article>`).join('')}
    ${result.commonGround?`<section><span>PONTO DE ENCONTRO</span><p>${esc(result.commonGround)}</p></section>`:''}
    ${result.tension?`<section><span>TENSÃO ÚTIL</span><p>${esc(result.tension)}</p></section>`:''}
  </section>`;
};

window.study56GenerateCase=async function(topic){
  const host=document.getElementById('study56CaseResult');studyLoading(host,'Criando um caso realista…');
  const result=await ai('study-case',{topic,catalog:scoreBooks(topic,4).map(({title,author,themes,bestUse})=>({title,author,themes,bestUse}))});
  if(result?.__error){host.innerHTML=`<div class="study56-error"><strong>Não consegui gerar o caso.</strong></div>`;return;}
  lastCase=result;
  host.innerHTML=`<article class="study56-case">
    <span>${esc(result.topic||topic)}</span><h3>${esc(result.title||'Caso para resolver')}</h3>
    <p>${esc(result.scenario||'')}</p>
    <div class="study56-case-facts">${(result.facts||[]).map(x=>`<i>${esc(x)}</i>`).join('')}</div>
    <strong>Qual é sua decisão?</strong>
    <textarea id="study56CaseAnswer" maxlength="2200" placeholder="Responda como treinador: o que você faz, por quê e qual é o próximo passo?"></textarea>
    <div class="study56-output-actions"><button onclick="study56EvaluateCase()">Comparar minha decisão</button><button onclick="study56CaseToMentor()">Simular este caso</button></div>
    <div id="study56CaseEvaluation"></div>
  </article>`;
};
window.study56EvaluateCase=async function(){
  const answer=document.getElementById('study56CaseAnswer')?.value.trim()||'';
  if(answer.length<8){showToast('Explique sua decisão primeiro.');return;}
  const host=document.getElementById('study56CaseEvaluation');studyLoading(host,'Analisando sua decisão…');
  const result=await ai('study-case-evaluate',{case:lastCase,answer,catalog:scoreBooks(`${lastCase?.topic||''} ${answer}`,4).map(({title,author,themes,bestUse})=>({title,author,themes,bestUse}))});
  if(result?.__error){host.innerHTML='<p>Não consegui avaliar agora.</p>';return;}
  host.innerHTML=`<section class="study56-case-eval"><span>LEITURA DA SUA DECISÃO</span><p>${esc(result.feedback||'')}</p><strong>Critério forte</strong><p>${esc(result.strength||'')}</p><strong>Ponto a testar</strong><p>${esc(result.challenge||'')}</p><strong>Próximo passo</strong><p>${esc(result.nextStep||'')}</p></section>`;
  const n=notes();n.unshift({id:`case-${now()}`,createdAt:now(),title:lastCase.title||'Caso',text:answer,context:lastCase.scenario||'',kind:'case'});save(NOTES,n.slice(0,250));renderNotebook();
};
window.study56CaseToMentor=function(){
  if(!lastCase)return;
  lastStudy={title:lastCase.title,situation:lastCase.scenario,decision:'',application:'Simular o caso com pressão realista',refs:[],mode:'case'};
  study56Simulate();
};

function dueSessions(){return sessions().filter(x=>Number(x.nextReviewAt||0)<=now()).sort((a,b)=>a.nextReviewAt-b.nextReviewAt);}
function renderReview(){
  const due=dueSessions();
  const count=document.getElementById('study56ReviewCount');if(count)count.textContent=due.length?`${due.length} revisão(ões) pronta(s) para hoje.`:'Nenhuma revisão pendente agora.';
  const host=document.getElementById('study56ReviewResult');if(!host)return;
  if(!due.length){host.innerHTML='<div class="study56-empty">Estudos registrados reaparecem aqui depois de 2, 7 e 21 dias.</div>';return;}
  const x=due[0];
  host.innerHTML=`<article class="study56-review-card"><span>RECUPERE SEM CONSULTAR</span><h3>${esc(x.title)}</h3><p>${esc(x.situation)}</p><textarea id="study56ReviewAnswer" maxlength="1800" placeholder="O que você lembra? Que decisão tomou? O que aplicaria hoje?"></textarea><button class="study56-main-action" onclick="study56EvaluateReview('${esc(x.id)}')">Verificar revisão</button><div id="study56ReviewEval"></div></article>`;
}
window.study56EvaluateReview=async function(id){
  const list=sessions();const x=list.find(i=>i.id===id);if(!x)return;
  const answer=document.getElementById('study56ReviewAnswer')?.value.trim()||'';
  if(answer.length<8){showToast('Tente recuperar a ideia antes de consultar.');return;}
  const host=document.getElementById('study56ReviewEval');studyLoading(host,'Comparando com seu registro anterior…');
  const result=await ai('study-review',{original:{situation:x.situation,decision:x.decision,application:x.application,summary:x.summary},recall:answer});
  if(result?.__error){host.innerHTML='<p>Não consegui avaliar a revisão agora.</p>';return;}
  host.innerHTML=`<section class="study56-case-eval"><span>REVISÃO</span><p>${esc(result.feedback||'')}</p><strong>O que ficou</strong><p>${esc(result.retained||'')}</p><strong>O que merece voltar</strong><p>${esc(result.revisit||'')}</p></section>`;
  const stages=[7,21,60];x.reviewStage=Number(x.reviewStage||0)+1;x.lastReviewAt=now();x.nextReviewAt=now()+(stages[Math.min(x.reviewStage-1,stages.length-1)]*dayMs);save(SESSIONS,list);setTimeout(renderReview,1200);
};

function renderNotebook(){
  const host=document.getElementById('study56NotebookList');if(!host)return;
  const items=notes();
  host.innerHTML=items.length?items.map(n=>`<article><div><span>${esc((n.kind||'nota').toUpperCase())} · ${dateBR(n.createdAt)}</span><strong>${esc(n.title||'Nota')}</strong><p>${esc(n.text||'')}</p>${n.context?`<small>${esc(n.context)}</small>`:''}</div><button onclick="study56DeleteNote('${esc(n.id)}')">Excluir</button></article>`).join(''):'<div class="study56-empty">Seu caderno ainda está vazio. Use “Isso é meu” depois de um estudo ou escreva uma nota acima.</div>';
}
window.study56SaveManualNote=function(){
  const el=document.getElementById('study56NoteInput');const text=el?.value.trim()||'';if(!text)return;
  const n=notes();n.unshift({id:`manual-${now()}`,createdAt:now(),title:'Reflexão pessoal',text,kind:'pessoal'});save(NOTES,n.slice(0,250));el.value='';renderNotebook();showToast('Nota salva.');
};
window.study56DeleteNote=function(id){save(NOTES,notes().filter(n=>n.id!==id));renderNotebook();};

function renderModel(){
  const host=document.getElementById('study56ModelGrid');if(!host)return;
  const data=model();
  host.innerHTML=MODEL_SECTIONS.map(([id,title,question])=>`<article class="study56-model-card">
    <div><span>${esc(title)}</span><small>${esc(question)}</small></div>
    <textarea id="study56Model-${id}" maxlength="4500" placeholder="Escreva sua posição atual...">${esc(data[id]?.text||'')}</textarea>
    <div><button onclick="study56ModelFromNotes('${id}')">Organizar com minhas notas</button><button onclick="study56SaveModel('${id}')">Salvar</button></div>
  </article>`).join('');
}
window.study56SaveModel=function(id){
  const el=document.getElementById(`study56Model-${id}`);if(!el)return;
  const data=model();data[id]={text:el.value.trim(),updatedAt:now(),confirmed:true};save(MODEL,data);showToast('Parte do seu Modelo de Trabalho salva.');
};
window.study56ModelFromNotes=async function(id){
  const spec=MODEL_SECTIONS.find(x=>x[0]===id);if(!spec)return;
  const relevant=notes().slice(0,60);
  const saved=model()[id]?.text||'';
  const el=document.getElementById(`study56Model-${id}`);if(!el)return;
  el.value='Organizando suas notas…';
  const result=await ai('study-work-model',{section:spec[1],question:spec[2],current:saved,personalNotes:relevant.map(n=>({title:n.title,text:n.text,context:n.context||''}))});
  if(result?.__error){el.value=saved;showToast('Não consegui organizar agora.');return;}
  el.value=result.draft||saved;
};

function populateBooks(){
  const sel=document.getElementById('study56SourceBook');if(!sel)return;
  const current=sel.value;
  sel.innerHTML=LIB.map(b=>`<option value="${esc(b.id)}">${esc(b.title)} — ${esc(b.author)}</option>`).join('');
  if(LIB.some(b=>b.id===current))sel.value=current;
}
window.study56RenderLibrary=function(q=''){
  const host=document.getElementById('study56LibraryList');if(!host)return;
  const query=String(q||'').trim().toLowerCase();
  const filtered=LIB.filter(b=>!query||[b.title,b.author,...(b.themes||[])].join(' ').toLowerCase().includes(query));
  host.innerHTML=filtered.map(b=>`<article class="${b.status==='searchable'?'ready':'pending'}">
    <div><span>${esc(b.priority)} · ${b.status==='searchable'?'PESQUISÁVEL':'PENDENTE'}</span><strong>${esc(b.title)}</strong><small>${esc(b.author)}</small></div>
    <p>${esc(b.bestUse)}</p>
    <div class="study56-tags">${(b.themes||[]).map(t=>`<i>${esc(t)}</i>`).join('')}</div>
    <a href="${esc(b.url)}" target="_blank" rel="noopener">Abrir referência</a>
  </article>`).join('');
};
window.study56SaveVerifiedSource=function(){
  const id=document.getElementById('study56SourceBook')?.value;const book=LIB.find(b=>b.id===id);if(!book)return;
  const location=document.getElementById('study56SourceLocation')?.value.trim()||'';
  const text=document.getElementById('study56SourceText')?.value.trim()||'';
  if(text.length<20){showToast('Adicione um trecho ou nota verificada um pouco maior.');return;}
  const list=verifiedSources();list.unshift({id:`src-${now()}`,bookId:id,title:`${book.title} — ${book.author}`,location,text,createdAt:now()});save(SOURCES,list.slice(0,80));
  document.getElementById('study56SourceLocation').value='';document.getElementById('study56SourceText').value='';renderVerified();showToast('Fonte verificada salva neste aparelho.');
};
function renderVerified(){
  const host=document.getElementById('study56VerifiedSources');if(!host)return;
  const list=verifiedSources();
  host.innerHTML=list.length?`<strong>${list.length} fonte(s) verificada(s) salva(s)</strong>`:'<span>Nenhuma fonte verificada adicionada ainda.</span>';
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('study56Overlay')?.classList.contains('hidden'))study56Close();});
document.addEventListener('DOMContentLoaded',()=>{populateBooks();renderReview();renderNotebook();});
})();