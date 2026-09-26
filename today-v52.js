(() => {
'use strict';

const K={
  tasks:'coachvoice-dashboard-tasks-v50',
  notes:'coachvoice-dashboard-notes-v50',
  days:'coachvoice-dashboard-days-v50',
  weekly:'coachvoice-dashboard-weekly-v51',
  agenda:'coachvoice-agenda-v52',
  people:'coachvoice-people-v52',
  prefs:'coachvoice-v52-settings',
  morning:'coachvoice-morning-v52',
  reminders:'coachvoice-reminders-v52'
};

const read=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateFromKey=k=>{const [y,m,d]=String(k).split('-').map(Number);return new Date(y,m-1,d,12,0,0,0)};
const fmtDate=(k,opt={weekday:'short',day:'2-digit',month:'short'})=>new Intl.DateTimeFormat('pt-BR',opt).format(dateFromKey(k));
const todayKey=()=>dayKey(new Date());
const tomorrowKey=()=>{const d=new Date();d.setDate(d.getDate()+1);return dayKey(d)};
const toMin=t=>{if(!/^\d{2}:\d{2}$/.test(t||''))return 9999;const [h,m]=t.split(':').map(Number);return h*60+m};
const prefs=()=>({mentorTone:'balanced',responseLength:'normal',voiceRate:.92,workStart:'07:00',workEnd:'21:00',mainLanguage:'pt-BR',notifications:false,...read(K.prefs,{})});
const toastSafe=t=>typeof toast==='function'&&toast(t);

let agendaView='today';
let selectedDate=todayKey();
let calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let quickType='task';
let searchIndex=[];

function tasks(){return read(K.tasks,[])}
function notes(){return read(K.notes,[])}
function events(){return read(K.agenda,[])}
function people(){return read(K.people,[])}
function mentorArchive(){return read('mentor47-daily-archive',[])}
function saveEvents(v){write(K.agenda,v.slice(-1600))}
function savePeople(v){write(K.people,v.slice(-500))}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function isToday(k){return k===todayKey()}

function todayEvents(key=selectedDate){
  return events().filter(e=>e.date===key).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
}
function dayTasks(key=selectedDate){
  return tasks().filter(t=>t.day===key).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
}
function nextPriorities(){
  const t=dayTasks(todayKey()).filter(x=>!x.done);
  const e=todayEvents(todayKey()).filter(x=>!x.done);
  return [...t.map(x=>({...x,_kind:'task'})),...e.map(x=>({...x,_kind:'event'}))]
    .sort((a,b)=>{
      const pa=a.priority==='high'?0:1,pb=b.priority==='high'?0:1;
      return pa-pb||toMin(a.time)-toMin(b.time);
    }).slice(0,3);
}
function greeting(){
  const h=new Date().getHours();
  return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}

function renderMorning(){
  const box=document.getElementById('today52Morning');if(!box)return;
  const p=nextPriorities(),ev=todayEvents(todayKey()).filter(e=>!e.done),tk=dayTasks(todayKey()).filter(t=>!t.done);
  const name=(document.getElementById('coachName')?.value||localStorage.getItem('coachvoice-coach-name')||'Coach').trim();
  box.innerHTML=`
    <div class="today52-morning-copy">
      <span>${greeting().toUpperCase()}</span>
      <h2>${esc(name)}. Hoje tem ${ev.length} compromisso(s) e ${tk.length} tarefa(s) pendente(s).</h2>
      <p>${p.length?'Suas prioridades agora: '+p.map(x=>esc(x.title)).join(' · '):'Nenhuma prioridade crítica registrada. Você pode começar o dia com calma.'}</p>
    </div>
    <div class="today52-morning-actions">
      <button class="primary" onclick="today52GenerateBrief()">✨ Organizar meu dia com IA</button>
      <button class="secondary" onclick="go('daytoday')">☕ Conversar</button>
      <button class="outline" onclick="today52ShowYesterday()">↩ Ver ontem</button>
    </div>
    <div id="today52BriefResult"></div>`;
  const saved=read(K.morning,{});
  if(saved.day===todayKey()&&saved.text){
    const r=document.getElementById('today52BriefResult');
    if(r)r.innerHTML=`<div class="today52-brief">${esc(saved.text)}</div>`;
  }
}
window.today52GenerateBrief=async function(){
  const result=document.getElementById('today52BriefResult');
  if(result)result.innerHTML='<div class="today52-brief loading">Organizando o essencial do seu dia...</div>';
  const payload={
    date:todayKey(),
    tasks:dayTasks(todayKey()).map(t=>({title:t.title,time:t.time,priority:t.priority,done:t.done,category:t.category})),
    events:todayEvents(todayKey()).map(e=>({title:e.title,time:e.time,duration:e.duration,done:e.done,category:e.category,person:e.person||''})),
    workWindow:{start:prefs().workStart,end:prefs().workEnd}
  };
  let text='';
  if(typeof callCoachAI==='function'){
    const ai=await callCoachAI('today-brief',payload);
    if(!ai?.__error)text=ai.brief||'';
  }
  if(!text){
    const p=nextPriorities();
    text=p.length?`Comece por ${p[0].title}. Proteja os horários já marcados e deixe o que não é prioridade para depois.`:'Seu dia está leve. Escolha uma prioridade real e preserve espaço para imprevistos.';
  }
  write(K.morning,{day:todayKey(),text,ts:Date.now()});
  if(result)result.innerHTML=`<div class="today52-brief">${esc(text)}</div>`;
};
window.today52ShowYesterday=function(){
  const d=new Date();d.setDate(d.getDate()-1);const k=dayKey(d);
  const closed=read(K.days,[]).find(x=>x.day===k);
  const mentor=mentorArchive().find(x=>x.day===k);
  const text=closed?.summary||mentor?.summary||'Não há resumo salvo para ontem.';
  today52OpenInfo('Resumo de ontem',text);
};

function itemIcon(category=''){
  const n=norm(category);
  if(n.includes('jogador'))return '👤';
  if(n.includes('treino'))return '⚽';
  if(n.includes('idioma')||n.includes('ingles')||n.includes('espanhol'))return '🌎';
  if(n.includes('reuniao'))return '🤝';
  if(n.includes('viagem'))return '✈️';
  if(n.includes('lembrete'))return '🔔';
  return '•';
}
function timelineHtml(key){
  const merged=[
    ...dayTasks(key).map(x=>({...x,_kind:'task'})),
    ...todayEvents(key).map(x=>({...x,_kind:'event'}))
  ].sort((a,b)=>toMin(a.time)-toMin(b.time));
  if(!merged.length)return '<div class="today52-empty">Nenhum compromisso ou tarefa com horário neste dia.</div>';
  return merged.map(x=>`
    <div class="today52-timeline-item ${x.done?'done':''}">
      <div class="today52-time">${x.time||'—'}</div>
      <div class="today52-dot">${itemIcon(x.category)}</div>
      <div class="today52-item-main">
        <strong>${esc(x.title)}</strong>
        <small>${esc(x.category|| (x._kind==='task'?'Tarefa':'Compromisso'))}${x.duration?` · ${esc(String(x.duration))} min`:''}${x.person?` · ${esc(x.person)}`:''}</small>
        ${x.note?`<p>${esc(x.note)}</p>`:''}
      </div>
      <div class="today52-item-actions">
        ${x._kind==='event'?`<button onclick="today52PrepareEvent('${x.id}')" title="Preparar no Mentor">🤖</button>`:''}
        ${x._kind==='event'&&x.done?`<button onclick="today52OpenEventFeedback('${x.id}')" title="Registrar como foi">📝</button>`:''}
        <button onclick="${x._kind==='event'?`today52ToggleEvent('${x.id}')`:`today52ToggleTask('${x.id}')`}">${x.done?'↶':'✓'}</button>
      </div>
    </div>`).join('');
}
function renderTodayAgenda(){
  const content=document.getElementById('today52AgendaContent');if(!content)return;
  content.innerHTML=`
    <div class="today52-agenda-head">
      <div><span>LINHA DO TEMPO</span><strong>${esc(fmtDate(todayKey(),{weekday:'long',day:'2-digit',month:'long'}))}</strong></div>
      <button class="secondary compact" onclick="today52OpenQuickCreate('event')">＋ Compromisso</button>
    </div>
    <div class="today52-timeline">${timelineHtml(todayKey())}</div>`;
}
function addDays(base,n){const d=new Date(base);d.setDate(d.getDate()+n);return d}
function renderWeekAgenda(){
  const content=document.getElementById('today52AgendaContent');if(!content)return;
  const start=new Date();start.setHours(12,0,0,0);
  const days=Array.from({length:7},(_,i)=>dayKey(addDays(start,i)));
  content.innerHTML=`<div class="today52-week">${days.map(k=>{
    const e=todayEvents(k),t=dayTasks(k);
    return `<button class="today52-week-day ${isToday(k)?'today':''}" onclick="today52SelectDate('${k}')">
      <span>${esc(fmtDate(k,{weekday:'short'}))}</span><strong>${dateFromKey(k).getDate()}</strong>
      <small>${e.length} agenda · ${t.filter(x=>!x.done).length} tarefas</small>
    </button>`;
  }).join('')}</div>
  <div class="today52-week-detail">
    <h3>${esc(fmtDate(selectedDate,{weekday:'long',day:'2-digit',month:'long'}))}</h3>
    <div class="today52-timeline">${timelineHtml(selectedDate)}</div>
  </div>`;
}
function monthLabel(d){return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(d)}
function renderCalendar(){
  const content=document.getElementById('today52AgendaContent');if(!content)return;
  const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth();
  const first=new Date(y,m,1),last=new Date(y,m+1,0);
  const cells=[];
  const mondayOffset=(first.getDay()+6)%7;
  for(let i=0;i<mondayOffset;i++)cells.push(null);
  for(let d=1;d<=last.getDate();d++)cells.push(new Date(y,m,d,12));
  while(cells.length%7)cells.push(null);
  content.innerHTML=`
    <div class="today52-calendar-head">
      <button onclick="today52MoveMonth(-1)">‹</button><strong>${esc(monthLabel(calendarMonth))}</strong><button onclick="today52MoveMonth(1)">›</button>
    </div>
    <div class="today52-calendar-weekdays">${['seg','ter','qua','qui','sex','sáb','dom'].map(x=>`<span>${x}</span>`).join('')}</div>
    <div class="today52-calendar-grid">${cells.map(d=>{
      if(!d)return '<span class="empty"></span>';
      const k=dayKey(d),count=todayEvents(k).length+dayTasks(k).length;
      return `<button class="${k===selectedDate?'selected':''} ${k===todayKey()?'today':''}" onclick="today52SelectDate('${k}')"><b>${d.getDate()}</b>${count?`<small>${count}</small>`:''}</button>`;
    }).join('')}</div>
    <div class="today52-week-detail"><h3>${esc(fmtDate(selectedDate,{weekday:'long',day:'2-digit',month:'long'}))}</h3><div class="today52-timeline">${timelineHtml(selectedDate)}</div></div>`;
}
window.today52SetView=function(v){
  agendaView=v;
  document.querySelectorAll('[data-today52-view]').forEach(b=>b.classList.toggle('active',b.dataset.today52View===v));
  renderAgenda();
};
window.today52SelectDate=function(k){selectedDate=k;renderAgenda()};
window.today52MoveMonth=function(delta){calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+delta,1);renderCalendar()};
function renderAgenda(){
  if(agendaView==='week')renderWeekAgenda();
  else if(agendaView==='calendar')renderCalendar();
  else renderTodayAgenda();
}

window.today52ToggleTask=function(id){
  if(typeof window.dashboardToggleTask==='function')window.dashboardToggleTask(id);
  setTimeout(()=>{renderMorning();renderAgenda();},0);
};
window.today52ToggleEvent=function(id){
  const list=events(),e=list.find(x=>x.id===id);if(!e)return;
  e.done=!e.done;e.doneAt=e.done?Date.now():null;saveEvents(list);renderAll();
};
window.today52DeleteEvent=function(id){
  saveEvents(events().filter(e=>e.id!==id));renderAll();toastSafe('Compromisso removido.');
};
window.today52OpenEventFeedback=function(id){
  const e=events().find(x=>x.id===id);if(!e)return;
  window.__today52FeedbackEvent=id;
  setText('today52FeedbackTitle',`Como foi: ${e.title}`);
  const area=document.getElementById('today52FeedbackText');if(area)area.value=e.note||'';
  document.getElementById('today52FeedbackModal')?.classList.add('open');
  document.getElementById('today52ModalOverlay')?.classList.add('show');
};
window.today52CloseEventFeedback=function(){
  document.getElementById('today52FeedbackModal')?.classList.remove('open');
  document.getElementById('today52ModalOverlay')?.classList.remove('show');
  window.__today52FeedbackEvent='';
};
window.today52SaveEventFeedback=function(){
  const id=window.__today52FeedbackEvent,eList=events(),e=eList.find(x=>x.id===id);if(!e)return;
  e.note=document.getElementById('today52FeedbackText')?.value.trim()||'';
  e.updatedAt=Date.now();saveEvents(eList);today52CloseEventFeedback();renderAll();toastSafe('Registro do compromisso salvo.');
};
window.today52PrepareEvent=function(id){
  const e=events().find(x=>x.id===id);if(!e)return;
  if(typeof go==='function')go('mentor');
  setTimeout(()=>{
    if(typeof window.mentor52OpenAgendaEvent==='function')window.mentor52OpenAgendaEvent(e);
    else{
      const input=document.getElementById('mentor42Input');
      if(input)input.value=`Tenho este compromisso: ${e.title}${e.time?' às '+e.time:''}. Quero me preparar de forma objetiva.`;
    }
  },120);
};
window.today52SaveMentorEventOutcome=function(id,closure={}){
  const list=events(),e=list.find(x=>x.id===id);if(!e)return false;
  e.mentorSummary=String(closure.summary||closure.spoken||'').slice(0,700);
  e.mentorDecision=String(closure.decision||'').slice(0,400);
  e.updatedAt=Date.now();saveEvents(list);renderAll();return true;
};

function quickTypeCopy(type){
  return {
    task:['Tarefa','Ex.: revisar vídeo do adversário'],
    event:['Compromisso','Ex.: reunião com diretoria'],
    note:['Nota rápida','Ex.: observar comportamento no treino'],
    conversation:['Conversa','Ex.: falar sobre a reunião de amanhã'],
    reminder:['Lembrete','Ex.: enviar relatório']
  }[type]||['Item','O que você precisa registrar?'];
}
window.today52OpenQuickCreate=function(type='task'){
  quickType=type;
  const modal=document.getElementById('today52QuickModal');if(!modal)return;
  modal.classList.add('open');document.getElementById('today52ModalOverlay')?.classList.add('show');
  document.querySelectorAll('[data-quick-type]').forEach(b=>b.classList.toggle('active',b.dataset.quickType===type));
  const [label,ph]=quickTypeCopy(type);
  setText('today52QuickTitleLabel',label);
  const title=document.getElementById('today52QuickTitle');if(title){title.placeholder=ph;title.value='';}
  const showSchedule=['event','reminder'].includes(type);
  document.getElementById('today52QuickSchedule')?.classList.toggle('hidden',!showSchedule);
  const save=document.getElementById('today52QuickSave');if(save)save.textContent=type==='conversation'?'Abrir conversa':`Salvar ${label.toLowerCase()}`;
};
window.today52SelectQuickType=function(type){today52OpenQuickCreate(type)};
window.today52CloseQuick=function(){
  document.getElementById('today52QuickModal')?.classList.remove('open');
  document.getElementById('today52ModalOverlay')?.classList.remove('show');
};
window.today52VoiceQuick=function(){
  if(typeof startUniversalVoiceCapture!=='function'){toastSafe('Microfone indisponível.');return;}
  startUniversalVoiceCapture({lang:'pt-BR',maxSeconds:45,label:'Novo item',onText:text=>{const e=document.getElementById('today52QuickTitle');if(e)e.value=text;}});
};
window.today52SaveQuick=function(){
  const title=document.getElementById('today52QuickTitle')?.value.trim();
  if(!title){toastSafe('Digite ou fale o que deseja registrar.');return;}
  const date=document.getElementById('today52QuickDate')?.value||todayKey();
  const time=document.getElementById('today52QuickTime')?.value||'';
  const duration=Number(document.getElementById('today52QuickDuration')?.value||30);
  const category=document.getElementById('today52QuickCategory')?.value||'Trabalho';
  const reminder=Number(document.getElementById('today52QuickReminder')?.value||0);
  const person=document.getElementById('today52QuickPerson')?.value.trim()||'';

  if(quickType==='task'){
    const list=tasks();list.push({id:uid('task'),day:todayKey(),title,time:'',category,priority:'normal',done:false,note:'',createdAt:Date.now()});write(K.tasks,list);
  }else if(quickType==='note'){
    const list=notes();list.unshift({id:uid('note'),day:todayKey(),text:title,createdAt:Date.now()});write(K.notes,list);
  }else if(quickType==='conversation'){
    today52CloseQuick();go('mentor');setTimeout(()=>{const input=document.getElementById('mentor42Input');if(input){input.value=title;input.focus();}},120);return;
  }else{
    const list=events();list.push({
      id:uid(quickType==='reminder'?'reminder':'event'),title,date,time,duration,
      category:quickType==='reminder'?'Lembrete':category,priority:'normal',done:false,person,
      reminderMinutes:quickType==='reminder'?(reminder||0):reminder,createdAt:Date.now()
    });saveEvents(list);
  }
  today52CloseQuick();renderAll();toastSafe('Salvo.');
};
window.today52CreateAgendaEvent=function(){
  today52OpenQuickCreate('event');
  const d=document.getElementById('today52QuickDate');if(d)d.value=selectedDate;
};

function buildSearchIndex(){
  const out=[];
  tasks().forEach(x=>out.push({type:'Tarefa',title:x.title,meta:`${x.day} ${x.category||''}`,action:()=>{go('dashboard');selectedDate=x.day;today52SetView('week')}}));
  events().forEach(x=>out.push({type:'Agenda',title:x.title,meta:`${x.date} ${x.time||''} ${x.category||''}`,action:()=>{go('dashboard');selectedDate=x.date;today52SetView('week')}}));
  notes().forEach(x=>out.push({type:'Nota',title:x.text,meta:x.day||'',action:()=>go('dashboard')}));
  mentorArchive().forEach(x=>{
    out.push({type:'Conversa',title:x.title||'Conversa do Mentor',meta:`${x.day} ${x.summary||''}`,action:()=>{go('mentor');setTimeout(()=>window.mentor47ShowDay?.(x.day,true),120)}});
    (x.people||[]).forEach(p=>out.push({type:'Pessoa',title:p.name||'',meta:`${x.day} ${p.context||''}`,action:()=>{go('progress');setTimeout(()=>today52FilterPeople(p.name||''),100)}}));
  });
  people().forEach(p=>out.push({type:'Pessoa',title:p.name,meta:`${p.role||''} ${p.notes||''}`,action:()=>{go('progress');setTimeout(()=>today52FilterPeople(p.name),100)}}));
  searchIndex=out;
}
window.today52OpenSearch=function(){
  buildSearchIndex();
  document.getElementById('today52SearchModal')?.classList.add('open');
  document.getElementById('today52ModalOverlay')?.classList.add('show');
  const q=document.getElementById('today52SearchInput');if(q){q.value='';setTimeout(()=>q.focus(),80);}
  today52Search('');
};
window.today52CloseSearch=function(){
  document.getElementById('today52SearchModal')?.classList.remove('open');
  document.getElementById('today52ModalOverlay')?.classList.remove('show');
};
window.today52Search=function(q){
  const box=document.getElementById('today52SearchResults');if(!box)return;
  const n=norm(q);
  const list=(n?searchIndex.filter(x=>norm(`${x.title} ${x.meta} ${x.type}`).includes(n)):searchIndex.slice(0,12)).slice(0,50);
  box.innerHTML=list.length?list.map((x,i)=>`
    <button class="today52-search-result" onclick="today52OpenSearchResult(${i})">
      <span>${esc(x.type)}</span><strong>${esc(x.title)}</strong><small>${esc(String(x.meta||'').slice(0,150))}</small>
    </button>`).join(''):'<div class="today52-empty">Nenhum resultado.</div>';
  window.__today52SearchList=list;
};
window.today52OpenSearchResult=function(i){
  const x=window.__today52SearchList?.[i];if(!x)return;today52CloseSearch();x.action?.();
};

function syncPeople(){
  const list=people();
  const by=new Map(list.map(p=>[norm(p.name),p]));
  mentorArchive().forEach(day=>(day.people||[]).forEach(p=>{
    if(!p?.name)return;
    const key=norm(p.name);
    if(!by.has(key)){
      const obj={id:uid('person'),name:p.name,role:'',notes:'',contexts:[],createdAt:Date.now()};
      list.push(obj);by.set(key,obj);
    }
    const obj=by.get(key);obj.contexts=obj.contexts||[];
    const c={day:day.day,context:p.context||day.summary||''};
    if(!obj.contexts.some(x=>x.day===c.day&&x.context===c.context))obj.contexts.unshift(c);
    obj.contexts=obj.contexts.slice(0,30);
  }));
  savePeople(list);
}
function renderPeople(filter=''){
  syncPeople();
  const box=document.getElementById('today52PeopleList');if(!box)return;
  const n=norm(filter);
  const list=people().filter(p=>!n||norm(`${p.name} ${p.role} ${p.notes}`).includes(n));
  box.innerHTML=list.length?list.map(p=>`
    <div class="today52-person">
      <div class="today52-person-avatar">${esc((p.name||'?').slice(0,1).toUpperCase())}</div>
      <div><strong>${esc(p.name)}</strong><small>${esc(p.role||'Pessoa acompanhada')}</small>
        ${p.notes?`<p>${esc(p.notes)}</p>`:''}
        ${(p.contexts||[])[0]?`<p class="context">${esc((p.contexts||[])[0].context||'')}</p>`:''}
      </div>
      <button onclick="today52TalkAboutPerson('${p.id}')">🤖</button>
    </div>`).join(''):'<div class="today52-empty">Nenhuma pessoa cadastrada ainda.</div>';
}
window.today52FilterPeople=function(v){
  const inp=document.getElementById('today52PeopleSearch');if(inp&&inp.value!==v)inp.value=v;
  renderPeople(v||'');
};
window.today52AddPerson=function(){
  const name=document.getElementById('today52PersonName')?.value.trim();if(!name){toastSafe('Digite o nome.');return;}
  const role=document.getElementById('today52PersonRole')?.value.trim()||'';
  const notesV=document.getElementById('today52PersonNotes')?.value.trim()||'';
  const list=people();list.push({id:uid('person'),name,role,notes:notesV,contexts:[],createdAt:Date.now()});savePeople(list);
  ['today52PersonName','today52PersonRole','today52PersonNotes'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  renderPeople();toastSafe('Pessoa adicionada.');
};
window.today52TalkAboutPerson=function(id){
  const p=people().find(x=>x.id===id);if(!p)return;go('mentor');
  setTimeout(()=>{const input=document.getElementById('mentor42Input');if(input){input.value=`Quero conversar sobre ${p.name}${p.role?' ('+p.role+')':''}. ${p.notes||''}`;input.focus();}},100);
};

function renderEvolutionCards(){
  const week=document.getElementById('today52EvolutionWeek');
  if(week){
    const review=read(K.weekly,[])[0];
    week.innerHTML=review?`
      <div class="today52-review-grid">
        <div><span>RESUMO</span><p>${esc(review.summary||'')}</p></div>
        <div><span>FOCO</span><p>${esc(review.nextWeekFocus||'Sem foco definido.')}</p></div>
        <div><span>PENDÊNCIAS</span><p>${esc((review.pending||[]).slice(0,3).join(' · ')||'Nenhuma registrada.')}</p></div>
        <div><span>IDIOMAS</span><p>${esc(review.languageFocus||'Sem dados suficientes.')}</p></div>
      </div>`:'<div class="today52-empty">Gere a revisão semanal em Hoje para ver os cards aqui.</div>';
  }
  renderPeople(document.getElementById('today52PeopleSearch')?.value||'');
}

function settingsFromForm(){
  return {
    ...prefs(),
    mentorTone:document.getElementById('today52MentorTone')?.value||'balanced',
    responseLength:document.getElementById('today52ResponseLength')?.value||'normal',
    voiceRate:Number(document.getElementById('today52VoiceRate')?.value||.92),
    workStart:document.getElementById('today52WorkStart')?.value||'07:00',
    workEnd:document.getElementById('today52WorkEnd')?.value||'21:00',
    mainLanguage:document.getElementById('today52MainLanguage')?.value||'pt-BR',
    notifications:Boolean(document.getElementById('today52Notifications')?.checked)
  };
}
function fillSettings(){
  const p=prefs();
  const map={today52MentorTone:p.mentorTone,today52ResponseLength:p.responseLength,today52VoiceRate:String(p.voiceRate),today52WorkStart:p.workStart,today52WorkEnd:p.workEnd,today52MainLanguage:p.mainLanguage};
  Object.entries(map).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.value=v});
  const n=document.getElementById('today52Notifications');if(n)n.checked=Boolean(p.notifications);
}
window.today52SaveSettings=function(){
  const p=settingsFromForm();write(K.prefs,p);
  window.dispatchEvent(new CustomEvent('coachvoice:v52settings',{detail:p}));
  toastSafe('Meu CoachVoice atualizado.');
};
window.today52RequestNotifications=async function(){
  if(!('Notification'in window)){toastSafe('Este navegador não oferece notificações.');return;}
  const r=await Notification.requestPermission();
  toastSafe(r==='granted'?'Notificações liberadas neste navegador.':'Notificações não foram liberadas.');
};
window.today52ExportBackup=function(){
  const data={version:'5.2',exportedAt:new Date().toISOString(),storage:{}};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&(k.startsWith('coachvoice')||k.startsWith('mentor')))data.storage[k]=localStorage.getItem(k);
  }
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`coachvoice-backup-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
};
window.today52ImportBackup=function(input){
  const file=input?.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!data?.storage)throw new Error('backup');
      if(!confirm('Importar este backup e substituir dados locais com as mesmas chaves?'))return;
      Object.entries(data.storage).forEach(([k,v])=>localStorage.setItem(k,String(v)));
      toastSafe('Backup importado. Recarregando...');
      setTimeout(()=>location.reload(),500);
    }catch{toastSafe('Arquivo de backup inválido.');}
  };
  reader.readAsText(file);
};

function reminderDate(e){
  if(!e.date||!e.time)return null;
  const [y,m,d]=e.date.split('-').map(Number),[h,min]=e.time.split(':').map(Number);
  return new Date(y,m-1,d,h,min,0,0);
}
function checkReminders(){
  const p=prefs();if(!p.notifications)return;
  const now=Date.now(),list=events(),sent=read(K.reminders,{});
  list.forEach(e=>{
    if(e.done||!e.time)return;
    const dt=reminderDate(e);if(!dt)return;
    const mins=Number(e.reminderMinutes||0);
    const trigger=dt.getTime()-mins*60000;
    if(now>=trigger&&now<dt.getTime()+20*60000&&!sent[e.id]){
      const msg=`${e.time} · ${e.title}`;
      toastSafe(`🔔 ${msg}`);
      if('Notification'in window&&Notification.permission==='granted')new Notification('CoachVoice — Agenda',{body:msg});
      sent[e.id]=Date.now();
    }
  });
  write(K.reminders,sent);
}

window.today52OpenInfo=function(title,text){
  const modal=document.getElementById('today52InfoModal');if(!modal)return;
  setText('today52InfoTitle',title);setText('today52InfoText',text);
  modal.classList.add('open');document.getElementById('today52ModalOverlay')?.classList.add('show');
};
window.today52CloseInfo=function(){
  document.getElementById('today52InfoModal')?.classList.remove('open');document.getElementById('today52ModalOverlay')?.classList.remove('show');
};

function renderAll(){
  renderMorning();renderAgenda();renderEvolutionCards();fillSettings();
}
window.today52Open=function(){renderAll()};
window.today52Render=renderAll;

document.addEventListener('DOMContentLoaded',()=>{
  selectedDate=todayKey();
  const qd=document.getElementById('today52QuickDate');if(qd)qd.value=todayKey();

  // Mantém a tela Hoje sincronizada quando as funções antigas do Dashboard alteram tarefas.
  ['dashboardAddTask','dashboardDeleteTask','dashboardSaveTaskNote','dashboardNoteToTask','dashboardAddPendingTomorrow','dashboardCompleteTaskFromMentor'].forEach(name=>{
    const original=window[name];
    if(typeof original!=='function'||original.__v52wrapped)return;
    const wrapped=function(...args){
      const result=original.apply(this,args);
      Promise.resolve(result).finally(()=>setTimeout(()=>{renderMorning();renderAgenda();},0));
      return result;
    };
    wrapped.__v52wrapped=true;
    window[name]=wrapped;
  });

  renderAll();
  setInterval(checkReminders,30000);
  checkReminders();
});
setTimeout(renderAll,0);
})();