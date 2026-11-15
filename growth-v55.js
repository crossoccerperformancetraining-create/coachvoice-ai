(() => {
'use strict';

const DEV_KEY='coachvoice-growth-devotional-v55';
const INSIGHT_KEY='coachvoice-growth-insight-v55';
const HISTORY_KEY='coachvoice-growth-history-v55';
const LIBRARY_KEY='coachvoice-growth-library-v55';
const currentDisplayed={devotional:null,insight:null};

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

const fallbackDevotionals=[
 {title:'Confiança antes da resposta',reference:'Provérbios 3:5–6',passage:'A passagem convida a confiar em Deus de todo o coração, sem tratar a própria compreensão como única referência, e a reconhecê-lo no caminho.',reflection:'Nem toda decisão precisa nascer da pressa de ter certeza. Há momentos em que sabedoria é reconhecer o limite da própria visão, agir com responsabilidade e deixar espaço para a direção de Deus. Confiar não significa abandonar critérios ou deixar de pensar. Significa não transformar controle em segurança. Hoje, diante do que ainda não está claro, você pode fazer sua parte com honestidade e não carregar a obrigação de prever tudo. Uma decisão madura pode juntar reflexão, escuta, oração e coragem para avançar sem ter todas as respostas.',prayer:'Deus, dá-me sabedoria para fazer minha parte com clareza e humildade. Ajuda-me a confiar em Ti sem agir por ansiedade e a escolher o que é correto mesmo quando eu não consigo enxergar todo o caminho. Amém.',practice:'Antes de uma decisão importante hoje, reserve dois minutos: reconheça o que você sabe, o que ainda não sabe e entregue a Deus aquilo que não está sob seu controle.'},
 {title:'Força que não precisa provar nada',reference:'Isaías 40:31',passage:'O texto aponta para uma esperança renovada em Deus, capaz de sustentar quem precisa continuar caminhando mesmo quando as próprias forças diminuem.',reflection:'Existem dias em que perseverar não parece heroico. É apenas continuar com fidelidade, sem espetáculo. A esperança bíblica não exige fingir que você nunca se cansa; ela permite admitir limites sem entregar o rumo. Renovar forças pode significar parar um pouco, reorganizar prioridades, pedir ajuda ou simplesmente fazer com atenção o próximo passo possível. A confiança em Deus não elimina o peso do dia, mas muda a forma de carregá-lo: você não precisa provar valor pela quantidade de coisas que consegue suportar sozinho.',prayer:'Senhor, quando minhas forças forem pequenas, sustenta meu coração. Ensina-me a não confundir pressa com compromisso e a caminhar com constância, confiança e humildade. Amém.',practice:'Escolha hoje uma coisa importante para fazer com presença e constância, sem tentar resolver tudo de uma vez.'},
 {title:'Paz para o que ainda está aberto',reference:'Filipenses 4:6–9',passage:'Paulo orienta a levar preocupações a Deus em oração e a dirigir a mente ao que é verdadeiro, justo e digno, em vez de alimentar continuamente a ansiedade.',reflection:'Preocupação costuma pedir repetição: pensar outra vez, imaginar outra possibilidade, revisar a mesma conversa. A passagem não trata oração como técnica para controlar o resultado. Ela aponta para uma forma diferente de permanecer diante da incerteza. Você pode apresentar a Deus aquilo que pesa e, depois, escolher conscientemente onde colocar sua atenção. Nem todo pensamento merece permanência. Nem toda possibilidade precisa ser ensaiada. A mente também precisa de direção. Hoje, talvez a prática de fé seja simples: reconhecer a preocupação, orar com sinceridade e voltar ao que é verdadeiro e necessário agora.',prayer:'Deus, recebe aquilo que hoje ocupa minha mente. Dá-me discernimento para não alimentar medos sem base e serenidade para cuidar do que está diante de mim. Guarda meus pensamentos e minhas decisões. Amém.',practice:'Quando perceber que voltou pela terceira vez ao mesmo pensamento, pare, faça uma oração curta e escolha uma ação concreta que pertence ao presente.'}
];
const fallbackInsights=[
 {title:'Critério antes da conversa',topic:'Gestão de grupo',idea:'Conversas difíceis ficam mais claras quando o treinador separa três coisas: o fato observado, o critério usado e o próximo passo esperado.',why:'Sem essa separação, a conversa pode virar opinião sobre a pessoa. Com um critério claro, o foco volta ao comportamento e à decisão.',example:'Em vez de “você não está comprometido”, é mais útil partir de algo observável, explicar o padrão esperado e combinar o que precisa acontecer a seguir.',practice:'Antes de uma conversa importante hoje, escreva em uma linha: fato → critério → próximo passo.'},
 {title:'Nem toda informação precisa chegar hoje',topic:'Comunicação',idea:'Uma equipe pode receber melhor uma mensagem quando a informação é distribuída de acordo com o momento em que será usada.',why:'Acumular orientação cedo demais aumenta ruído e reduz o que realmente será lembrado perto da ação.',example:'Em uma semana de jogo, alguns princípios podem aparecer no primeiro treino, enquanto detalhes de bola parada ou gatilhos específicos ficam mais próximos do momento em que serão executados.',practice:'Revise uma comunicação de hoje e retire tudo que não precisa ser usado ainda.'},
 {title:'Decisão forte, porta aberta para revisão',topic:'Tomada de decisão',idea:'Coerência não significa nunca revisar uma decisão. Significa saber por que ela foi tomada e quais evidências justificariam mudá-la.',why:'Quando o critério é explícito, revisar deixa de parecer fraqueza e passa a ser parte do processo.',example:'Uma escolha de função ou estratégia pode permanecer enquanto o comportamento esperado aparece; se os sinais definidos mudarem, a decisão também pode mudar.',practice:'Pegue uma decisão atual e escreva: “Eu mantenho enquanto…” e “Eu reviso se…”.'}
];

function dailyFallback(list){
  const d=new Date();
  const seed=Number(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
  return {...list[seed%list.length]};
}
function history(){return read(HISTORY_KEY,[])}
function setHistory(items){save(HISTORY_KEY,items.slice(0,120))}
function record(type,data,extra={}){
  const h=history();
  const id=`${type}:${dayKey()}`;
  const existing=h.find(x=>x.id===id);
  const item={id,type,date:dayKey(),title:data.title||'',topic:data.topic||'',reference:data.reference||'',completed:true,important:existing?.important||false,application:data.practice||data.application||'',...extra,updatedAt:Date.now()};
  setHistory([item,...h.filter(x=>x.id!==id)]);
  renderToday();renderEvolutionPreview();
  return item;
}

async function ai(mode,payload={}){
  if(typeof window.callCoachAI==='function')return window.callCoachAI(mode,payload);
  const r=await fetch('/api/coach-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,payload})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)return {__error:true,__message:data.error||'A IA não respondeu.'};
  return data;
}

function cacheForToday(key){
  const x=read(key,null);return x?.date===dayKey()?x:null;
}
async function getDevotional(force=false){
  if(!force){const c=cacheForToday(DEV_KEY);if(c)return c.data;}
  const identity=typeof window.getCoachIdentity==='function'?window.getCoachIdentity():{};
  const result=await ai('growth-devotional',{date:dayKey(),coachName:identity.name||'',language:'pt-BR'});
  const data=result?.__error?{...dailyFallback(fallbackDevotionals),__localExample:true,__quota:result.__status===429||/quota|limite/i.test(String(result.__message||''))}:result;
  // Um exemplo local não é uma resposta gerada; não gravar no cache como nova consulta bem-sucedida.
  if(!result?.__error)save(DEV_KEY,{date:dayKey(),data,source:'ai'});
  return data;
}
async function getInsight(force=false){
  if(!force){const c=cacheForToday(INSIGHT_KEY);if(c)return c.data;}
  const recent=history().filter(x=>x.type==='insight').slice(0,7).map(x=>x.topic).filter(Boolean);
  const result=await ai('growth-daily-insight',{date:dayKey(),avoidRecentTopics:recent,libraryConnected:false,libraryMode:'catalog-only'});
  const data=result?.__error?{...dailyFallback(fallbackInsights),__localExample:true,__quota:result.__status===429||/quota|limite/i.test(String(result.__message||''))}:result;
  if(!result?.__error)save(INSIGHT_KEY,{date:dayKey(),data,source:'ai'});
  return data;
}

function modal(title,eyebrow,body){
  const root=document.getElementById('growth55Modal');if(!root)return;
  document.getElementById('growth55ModalTitle').textContent=title;
  document.getElementById('growth55ModalEyebrow').textContent=eyebrow;
  document.getElementById('growth55ModalBody').innerHTML=body;
  root.classList.remove('hidden');document.body.classList.add('growth55-modal-open');
}
window.growth55CloseModal=function(){document.getElementById('growth55Modal')?.classList.add('hidden');document.body.classList.remove('growth55-modal-open');try{speechSynthesis.cancel();}catch{}};

function speak(text){
  if(window.cvUnifiedRead){
    const article=document.getElementById('growth55Readable');
    cvUnifiedRead(text,{container:article,language:'pt-BR'});
    return;
  }
  if(window.coach5112Voice?.speak){window.coach5112Voice.speak(text,{lang:'pt-BR'});return;}
  if(!('speechSynthesis' in window))return;
  try{speechSynthesis.cancel();}catch{}
  const u=new SpeechSynthesisUtterance(String(text||''));u.lang='pt-BR';
  try{const p=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}');u.rate=Number(p.voiceRate)||1;}catch{u.rate=1;}
  speechSynthesis.speak(u);
}
window.growth55SpeakCurrent=function(){const el=document.getElementById('growth55Readable');if(el)speak(el.textContent)};

window.growth55OpenDevotional=async function(force=false){
  modal('Preparando seu momento…','DEVOCIONAL','<div class="growth55-loading"><span></span><p>Preparando uma leitura curta para hoje.</p></div>');
  const d=await getDevotional(force);currentDisplayed.devotional=d;
  modal(d.title||'Devocional de hoje','DEVOCIONAL · 3–5 MIN',`
    ${d.__localExample?`<div class="growth55-source-note" role="status">${d.__quota?"Limite temporário da IA atingido.":"IA temporariamente indisponível."} Este é um exemplo local, não uma nova resposta do Gemini. Tente novamente quando o serviço estiver disponível.</div>`:""}
    <article id="growth55Readable" class="growth55-reading devotional-reading">
      <div class="growth55-reference"><span>PASSAGEM</span><strong>${esc(d.reference||'')}</strong><p>${esc(d.passage||'')}</p></div>
      <section><span>REFLEXÃO</span><p>${esc(d.reflection||'')}</p></section>
      <section class="prayer"><span>ORAÇÃO</span><p>${esc(d.prayer||'')}</p></section>
      <section class="practice"><span>ATITUDE PARA HOJE</span><strong>${esc(d.practice||'')}</strong></section>
    </article>
    <div class="growth55-actions">
      <button onclick="growth55SpeakCurrent()">Ouvir tudo</button>
      <button onclick="growth55Talk('devotional')">Conversar sobre isso</button>
      <button class="primary" onclick="growth55Complete('devotional')">Concluir</button>
    </div>
    <button class="growth55-regenerate" onclick="growth55OpenDevotional(true)">Gerar outro devocional hoje</button>`);
  window.coach5115Stages?.growth();
};

window.growth55OpenInsight=async function(force=false){
  modal('Preparando insight…','INSIGHT DO TREINADOR','<div class="growth55-loading"><span></span><p>Escolhendo uma ideia curta para desenvolver hoje.</p></div>');
  const d=await getInsight(force);currentDisplayed.insight=d;
  modal(d.title||'Insight do treinador','INSIGHT DO TREINADOR · 3–5 MIN',`
    ${d.__localExample?`<div class="growth55-source-note" role="status">${d.__quota?"Limite temporário da IA atingido.":"IA temporariamente indisponível."} Este é um exemplo local, não uma nova resposta do Gemini.</div>`:""}
    <article id="growth55Readable" class="growth55-reading insight-reading">
      <div class="growth55-reference"><span>TEMA</span><strong>${esc(d.topic||'Desenvolvimento')}</strong></div>
      <section><span>IDEIA CENTRAL</span><p>${esc(d.idea||'')}</p></section>
      <section><span>POR QUE IMPORTA</span><p>${esc(d.why||'')}</p></section>
      <section><span>EXEMPLO</span><p>${esc(d.example||'')}</p></section>
      <section class="practice"><span>PRÁTICA</span><strong>${esc(d.practice||'')}</strong></section>
      <div class="growth55-source-note">Este insight é desenvolvimento geral. Para estudar com suas referências catalogadas, abra o Study Coach.</div>
    </article>
    <div class="growth55-actions">
      <button onclick="growth55SpeakCurrent()">Ouvir tudo</button>
      <button onclick="growth55Talk('insight')">Discutir com Mentor</button>
      <button class="primary" onclick="growth55Complete('insight')">Aprendi</button>
    </div>
    <button class="growth55-regenerate" onclick="growth55OpenInsight(true)">Gerar outro insight hoje</button>`);
  window.coach5115Stages?.growth();
};

window.growth55Complete=async function(type){
  const data=currentDisplayed[type]||(type==='devotional'?await getDevotional():await getInsight());
  record(type,data,{source:data.__localExample?'exemplo-local':'ia'});
  if(typeof window.toast==='function')toast(type==='devotional'?'Devocional concluído.':'Insight registrado no seu aprendizado.');
  growth55CloseModal();
};

window.growth55Talk=async function(type){
  const data=currentDisplayed[type]||(type==='devotional'?await getDevotional():await getInsight());
  const body=type==='devotional'
    ?[data.passage,data.reflection,data.practice].filter(Boolean).join(' ')
    :[data.idea,data.why,data.example,data.practice].filter(Boolean).join(' ');
  growth55CloseModal();
  if(typeof window.go==='function')go('mentor');
  window.coach54OpenSession?.('mentor',{scenario:data.title||'Reflexão',goal:'Conversar sobre a reflexão selecionada.',useTeam:false,studyContext:{purpose:'reflection',title:data.title,body:body.slice(0,3500)}});
};

window.growth55OpenLibrarySetup=function(){
  growth55CloseModal();
  setTimeout(()=>window.study56Open?.('library'),80);
};
window.growth55SetLibraryOrganized=function(value){save(LIBRARY_KEY,{...read(LIBRARY_KEY,{}),organized:Boolean(value),updatedAt:Date.now()});renderToday();};

window.growth55OpenLearning=function(){
  const h=history();
  const dev=h.filter(x=>x.type==='devotional').length;
  const ins=h.filter(x=>x.type==='insight').length;
  const important=h.filter(x=>x.important).length;
  const recent=h.slice(0,20);
  modal('Revisar aprendizados','MEMÓRIA DE APRENDIZADO',`
    <div class="growth55-learning-metrics"><div><strong>${dev}</strong><span>devocionais</span></div><div><strong>${ins}</strong><span>insights</span></div><div><strong>${important}</strong><span>importantes</span></div></div>
    <div class="growth55-learning-list">${recent.length?recent.map(x=>`<article><button onclick="growth55ToggleImportant('${esc(x.id)}')">${x.important?'★':'☆'}</button><div><span>${x.type==='devotional'?'DEVOCIONAL':'INSIGHT'} · ${esc(x.date)}</span><strong>${esc(x.title)}</strong><small>${esc(x.reference||x.topic||x.application||'')}</small></div></article>`).join(''):'<p class="growth55-empty">Conclua seu primeiro devocional ou insight para começar esta memória.</p>'}</div>`);
};
window.growth55ToggleImportant=function(id){const h=history();const x=h.find(i=>i.id===id);if(x)x.important=!x.important;setHistory(h);growth55OpenLearning();};

function renderToday(){
  const host=document.getElementById('growth55TodayCards');if(!host)return;
  const d=cacheForToday(DEV_KEY)?.data;
  const i=cacheForToday(INSIGHT_KEY)?.data;
  const h=history();
  const doneDev=h.some(x=>x.id===`devotional:${dayKey()}`);
  const doneIns=h.some(x=>x.id===`insight:${dayKey()}`);
  host.innerHTML=`
    <button class="growth55-today-card devotional ${doneDev?'done':''}" onclick="growth55OpenDevotional()"><i>♡</i><div><span>DEVOCIONAL · 3–5 MIN</span><strong>${esc(d?.title||'Seu momento de hoje')}</strong><small>${doneDev?'Concluído hoje':'Passagem, reflexão, oração e atitude'}</small></div><b>${doneDev?'✓':'›'}</b></button>
    <button class="growth55-today-card insight ${doneIns?'done':''}" onclick="growth55OpenInsight()"><i>✦</i><div><span>INSIGHT DO TREINADOR</span><strong>${esc(i?.title||'Uma ideia para desenvolver')}</strong><small>${doneIns?'Registrado no aprendizado':'3–5 minutos de estudo'}</small></div><b>${doneIns?'✓':'›'}</b></button>`;
}
function renderEvolutionPreview(){
  const h=history();
  const el=document.getElementById('growth55LearningPreview');
  if(el)el.textContent=h.length?`${h.length} momento(s) registrados · ${h.filter(x=>x.important).length} marcado(s) como importante.`:'Devocionais, insights e ideias importantes ficam organizados para revisão.';
  const d=cacheForToday(DEV_KEY)?.data;if(d){const t=document.getElementById('growth55DevotionalTitle');const p=document.getElementById('growth55DevotionalPreview');if(t)t.textContent=d.title||'Seu momento de hoje';if(p)p.textContent=d.reference?`${d.reference} · pronto para ler.`:'Pronto para ler.';}
  const i=cacheForToday(INSIGHT_KEY)?.data;if(i){const t=document.getElementById('growth55InsightTitle');const p=document.getElementById('growth55InsightPreview');if(t)t.textContent=i.title||'Insight do treinador';if(p)p.textContent=i.topic?`${i.topic} · pronto para estudar.`:'Pronto para estudar.';}
}

// Warm the daily cache only after page load; failure falls back locally.
document.addEventListener('DOMContentLoaded',()=>{renderToday();renderEvolutionPreview();;});
window.addEventListener('storage',()=>{renderToday();renderEvolutionPreview();});
})();
