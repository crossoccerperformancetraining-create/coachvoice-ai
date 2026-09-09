(() => {
  'use strict';
  const K={tasks:'coachvoice-dashboard-tasks-v50',routines:'coachvoice-dashboard-routines-v50',notes:'coachvoice-dashboard-notes-v50',days:'coachvoice-dashboard-days-v50'};
  const read=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayLabel=d=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(d);
  const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  function tomorrowKey(){const d=new Date();d.setDate(d.getDate()+1);return dayKey(d)}
  function taskStore(){return read(K.tasks,[])}
  function saveTasks(v){write(K.tasks,v.slice(-1200));}
  function routineStore(){return read(K.routines,[])}
  function shouldRun(r,d=new Date()){if(r.repeat==='daily')return true;if(r.repeat==='weekdays')return d.getDay()>=1&&d.getDay()<=5;return false;}
  function materializeRoutines(){
    const today=dayKey(), tasks=taskStore(); let changed=false;
    routineStore().forEach(r=>{
      if(!shouldRun(r))return;
      const id=`${r.id}-${today}`;
      if(tasks.some(t=>t.id===id))return;
      tasks.push({id,day:today,title:r.title,time:r.time||'',category:r.category||'Trabalho',priority:r.priority||'normal',done:false,note:'',createdAt:Date.now(),routineId:r.id});changed=true;
    });
    if(changed)saveTasks(tasks);
  }
  function todayTasks(){materializeRoutines();return taskStore().filter(t=>t.day===dayKey()).sort((a,b)=>Number(a.done)-Number(b.done)||(a.time||'99:99').localeCompare(b.time||'99:99')||({high:0,normal:1,low:2}[a.priority]-({high:0,normal:1,low:2}[b.priority])));}
  function todayNotes(){return read(K.notes,[]).filter(n=>n.day===dayKey())}
  function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
  function currentTimeMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()}
  function timeMinutes(s){if(!/^\d{2}:\d{2}$/.test(s||''))return 9999;const [h,m]=s.split(':').map(Number);return h*60+m}
  function attentionTasks(tasks){return tasks.filter(t=>!t.done).sort((a,b)=>{const ao=a.priority==='high'?0:1,bo=b.priority==='high'?0:1;return ao-bo||timeMinutes(a.time)-timeMinutes(b.time)}).slice(0,3)}
  function renderAttention(tasks){
    const box=document.getElementById('dashboardAttention');if(!box)return;
    const items=attentionTasks(tasks);
    if(!items.length){box.innerHTML='<div class="dashboard-empty">Nada urgente agora. Continue no seu ritmo.</div>';return;}
    const now=currentTimeMinutes();
    box.innerHTML=items.map(t=>`<div class="dashboard-attention-item ${t.priority==='high'?'high':''}"><strong>${esc(t.title)}</strong><small>${t.time?esc(t.time)+' · ':''}${esc(t.category)}${timeMinutes(t.time)<now?' · horário já passou':''}</small></div>`).join('');
  }
  function taskHtml(t){
    const label=t.priority==='high'?'Alta':t.priority==='low'?'Baixa':'Normal';
    return `<div class="dashboard-task ${t.done?'done':''}">
      <div class="dashboard-task-top">
        <button class="dashboard-task-check" onclick="dashboardToggleTask('${t.id}')">${t.done?'✓':''}</button>
        <div><div class="dashboard-task-title">${esc(t.title)}</div><div class="dashboard-task-meta">${t.time?`<span class="dashboard-chip">🕒 ${esc(t.time)}</span>`:''}<span class="dashboard-chip">${esc(t.category)}</span><span class="dashboard-chip ${t.priority}">${label}</span>${t.routineId?'<span class="dashboard-chip">↻ rotina</span>':''}</div></div>
        <button class="icon-btn" style="width:34px;height:34px;color:#516173;background:#f5f7fa" onclick="dashboardDeleteTask('${t.id}')">×</button>
      </div>
      <div class="dashboard-task-actions"><button onclick="dashboardDiscussTask('${t.id}')">🤖 Preparar no Mentor</button></div>
      ${t.done?`<div class="dashboard-task-note"><textarea id="task-note-${t.id}" placeholder="Como foi? O que vale registrar?">${esc(t.note||'')}</textarea><div class="dashboard-task-actions"><button onclick="dashboardSaveTaskNote('${t.id}')">💾 Salvar feedback</button></div></div>`:''}
    </div>`;
  }
  function renderWeek(){
    const box=document.getElementById('dashboardWeek');if(!box)return;
    const tasks=taskStore(); const since=new Date();since.setDate(since.getDate()-6);const keys=new Set();for(let i=0;i<7;i++){const d=new Date(since);d.setDate(since.getDate()+i);keys.add(dayKey(d));}
    const week=tasks.filter(t=>keys.has(t.day)), done=week.filter(t=>t.done).length;
    const english=read('coachvoice-english-history',[]).filter(x=>{const raw=x.day||'';return keys.has(raw)}).length+read('coachvoice-beginner-history',[]).length;
    const spanish=read('coachvoice-spanish-history-v50',[]).filter(x=>keys.has(x.day)).length;
    box.innerHTML=`<div><strong>${done}/${week.length}</strong><small>tarefas</small></div><div><strong>${english}</strong><small>inglês*</small></div><div><strong>${spanish}</strong><small>espanhol</small></div>`;
  }
  function renderClosedDay(){
    const box=document.getElementById('dashboardClosedDay');if(!box)return;
    const item=read(K.days,[]).find(x=>x.day===dayKey());
    if(!item){box.classList.add('hidden');box.innerHTML='';return;}
    box.classList.remove('hidden');
    const row=(l,v)=>v?`<div class="dashboard-close-row"><strong>${l}</strong>${esc(Array.isArray(v)?v.join(' · '):v)}</div>`:'';
    box.innerHTML=`<div class="dashboard-close-box"><h4>🌙 Dia finalizado</h4>${row('Resumo',item.summary)}${row('Concluído',item.doneHighlights)}${row('Pendente',item.pending)}${row('Prioridade de amanhã',item.tomorrowPriority)}<button class="outline" style="margin-top:10px" onclick="dashboardReopenDay()">Reabrir o dia</button></div>`;
  }
  function render(){
    materializeRoutines();const tasks=todayTasks(),done=tasks.filter(t=>t.done).length,total=tasks.length,pct=total?Math.round(done/total*100):0;
    setText('dashboardDate',dayLabel(new Date()));setText('dashboardDone',String(done));setText('dashboardPending',String(total-done));setText('dashboardTotal',String(total));
    const bar=document.getElementById('dashboardProgress');if(bar)bar.style.width=pct+'%';
    const list=document.getElementById('dashboardTaskList');if(list)list.innerHTML=tasks.length?tasks.map(taskHtml).join(''):'<div class="dashboard-empty">Nenhuma tarefa para hoje. Adicione só o que realmente precisa da sua atenção.</div>';
    renderAttention(tasks);renderWeek();renderClosedDay();renderNotes();
    const home=document.getElementById('homeDailyDone');if(home)home.textContent=`${done} de ${total} tarefas concluídas`;
  }
  function renderNotes(){const box=document.getElementById('dashboardNotes');if(!box)return;const notes=todayNotes();box.innerHTML=notes.length?notes.map(n=>`<div class="dashboard-task"><div class="dashboard-task-title">📝 ${esc(n.text)}</div><div class="dashboard-task-actions"><button onclick="dashboardNoteToTask('${n.id}')">Virar tarefa</button><button onclick="dashboardDeleteNote('${n.id}')">Excluir</button></div></div>`).join(''):'<div class="dashboard-empty">Sem notas rápidas hoje.</div>'}
  window.dashboardAddTask=function(){
    const title=document.getElementById('dashboardTaskTitle')?.value.trim();if(!title){toast('Digite uma tarefa.');return;}
    const time=document.getElementById('dashboardTaskTime')?.value||'',category=document.getElementById('dashboardTaskCategory')?.value||'Trabalho',priority=document.getElementById('dashboardTaskPriority')?.value||'normal',repeat=document.getElementById('dashboardTaskRepeat')?.value||'none';
    const tasks=taskStore();
    if(repeat==='none')tasks.push({id:uid('task'),day:dayKey(),title,time,category,priority,done:false,note:'',createdAt:Date.now()});
    else{const routines=routineStore(),r={id:uid('routine'),title,time,category,priority,repeat,createdAt:Date.now()};routines.push(r);write(K.routines,routines);tasks.push({id:`${r.id}-${dayKey()}`,day:dayKey(),title,time,category,priority,done:false,note:'',createdAt:Date.now(),routineId:r.id});}
    saveTasks(tasks);document.getElementById('dashboardTaskTitle').value='';render();toast('Tarefa adicionada ao Dashboard.');
  };
  window.dashboardToggleTask=function(id){const tasks=taskStore(),t=tasks.find(x=>x.id===id);if(!t)return;t.done=!t.done;t.doneAt=t.done?Date.now():null;saveTasks(tasks);render();};
  window.dashboardDiscussTask=function(id){const t=taskStore().find(x=>x.id===id);if(!t)return;if(typeof go==='function')go('mentor');setTimeout(()=>{const input=document.getElementById('mentor42Input');if(input){input.value=`Quero me preparar para esta tarefa de hoje: ${t.title}${t.time?' às '+t.time:''}. Me ajude de forma prática e sem fazer muitas perguntas.`;input.focus();}if(typeof toast==='function')toast('Tarefa levada ao Mentor. Revise e envie quando quiser.');},120);};
  window.dashboardDeleteTask=function(id){let tasks=taskStore();const t=tasks.find(x=>x.id===id);tasks=tasks.filter(x=>x.id!==id);saveTasks(tasks);if(t?.routineId){const keep=confirm('Esta tarefa faz parte de uma rotina. Deseja manter as próximas repetições?');if(!keep)write(K.routines,routineStore().filter(r=>r.id!==t.routineId));}render();};
  window.dashboardSaveTaskNote=function(id){const tasks=taskStore(),t=tasks.find(x=>x.id===id);if(!t)return;t.note=document.getElementById(`task-note-${id}`)?.value.trim()||'';saveTasks(tasks);render();toast('Feedback salvo na tarefa.');};
  window.dashboardVoiceTask=function(){if(typeof startUniversalVoiceCapture!=='function'){toast('Microfone indisponível.');return;}startUniversalVoiceCapture({lang:'pt-BR',maxSeconds:45,label:'Nova tarefa do Dashboard',onText:text=>{const e=document.getElementById('dashboardTaskTitle');if(e)e.value=text;}})};
  window.dashboardAddNote=function(){const input=document.getElementById('dashboardQuickNote'),text=input?.value.trim();if(!text){toast('Escreva uma nota.');return;}const notes=read(K.notes,[]);notes.unshift({id:uid('note'),day:dayKey(),text,createdAt:Date.now()});write(K.notes,notes.slice(0,400));input.value='';render();};
  window.dashboardVoiceNote=function(){if(typeof startUniversalVoiceCapture!=='function'){toast('Microfone indisponível.');return;}startUniversalVoiceCapture({lang:'pt-BR',maxSeconds:60,label:'Nota rápida',onText:text=>{const e=document.getElementById('dashboardQuickNote');if(e)e.value=text;}})};
  window.dashboardDeleteNote=function(id){write(K.notes,read(K.notes,[]).filter(n=>n.id!==id));render();};
  window.dashboardNoteToTask=function(id){const notes=read(K.notes,[]),n=notes.find(x=>x.id===id);if(!n)return;const tasks=taskStore();tasks.push({id:uid('task'),day:dayKey(),title:n.text,time:'',category:'Pessoal',priority:'normal',done:false,note:'',createdAt:Date.now()});saveTasks(tasks);write(K.notes,notes.filter(x=>x.id!==id));render();toast('Nota transformada em tarefa.');};
  function mentorToday(){const item=read('mentor47-daily-archive',[]).find(x=>x.day===dayKey());return item?{summary:item.summary,decisions:item.decisions,pending:item.pending,learning:item.learning}:null;}
  function localSummary(tasks,notes){const done=tasks.filter(t=>t.done),pending=tasks.filter(t=>!t.done);return {summary:`Hoje você concluiu ${done.length} de ${tasks.length} tarefas.${notes.length?' Também deixou '+notes.length+' nota(s) rápida(s).':''}`,doneHighlights:done.slice(0,5).map(t=>t.title),pending:pending.slice(0,5).map(t=>t.title),tomorrowPriority:pending.find(t=>t.priority==='high')?.title||pending[0]?.title||''};}
  window.dashboardCloseDay=async function(){
    const tasks=todayTasks(),notes=todayNotes(),local=localSummary(tasks,notes),btn=document.getElementById('dashboardCloseDayBtn');if(btn){btn.disabled=true;btn.textContent='⏳ Finalizando...';}
    let result=local;
    if(typeof callCoachAI==='function'){
      const ai=await callCoachAI('dashboard-day-summary',{day:dayKey(),tasks:tasks.map(t=>({title:t.title,time:t.time,category:t.category,priority:t.priority,done:t.done,note:t.note})),notes:notes.map(n=>n.text),mentor:mentorToday()});
      if(!ai?.__error)result={summary:ai.summary||local.summary,doneHighlights:Array.isArray(ai.doneHighlights)?ai.doneHighlights:local.doneHighlights,pending:Array.isArray(ai.pending)?ai.pending:local.pending,tomorrowPriority:ai.tomorrowPriority||local.tomorrowPriority};
    }
    const carry=document.getElementById('dashboardCarryPending')?.checked!==false;
    if(carry){const tomorrow=tomorrowKey(),store=taskStore();tasks.filter(t=>!t.done&&!t.routineId).forEach(t=>{if(!store.some(x=>x.day===tomorrow&&x.title===t.title))store.push({...t,id:uid('carry'),day:tomorrow,done:false,doneAt:null,note:'',carriedFrom:dayKey()});});saveTasks(store);}
    const days=read(K.days,[]).filter(x=>x.day!==dayKey());days.unshift({id:uid('day'),day:dayKey(),closedAt:Date.now(),...result});write(K.days,days.slice(0,180));render();if(btn){btn.disabled=false;btn.textContent='🌙 Finalizar o dia';}toast('Dia finalizado e salvo.');
  };
  window.dashboardReopenDay=function(){write(K.days,read(K.days,[]).filter(x=>x.day!==dayKey()));render();toast('Dia reaberto.');};
  window.dashboardOpen=function(){render();};
  window.dashboardRender=render;
  document.addEventListener('DOMContentLoaded',render);
  setTimeout(render,0);
})();