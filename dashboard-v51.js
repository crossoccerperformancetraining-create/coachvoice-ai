(() => {
  'use strict';

  // Mantemos as chaves v5.0 para não perder tarefas, rotinas, notas ou dias já salvos.
  const K={
    tasks:'coachvoice-dashboard-tasks-v50',
    routines:'coachvoice-dashboard-routines-v50',
    notes:'coachvoice-dashboard-notes-v50',
    days:'coachvoice-dashboard-days-v50',
    weekly:'coachvoice-dashboard-weekly-v51'
  };

  const read=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dayLabel=d=>new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(d);
  const uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function toastSafe(text){if(typeof toast==='function')toast(text);}
  function tomorrowKey(){const d=new Date();d.setDate(d.getDate()+1);return dayKey(d)}
  function taskStore(){return read(K.tasks,[])}
  function saveTasks(v){write(K.tasks,v.slice(-1600));}
  function routineStore(){return read(K.routines,[])}
  function todayNotes(){return read(K.notes,[]).filter(n=>n.day===dayKey())}
  function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v}
  function currentTimeMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()}
  function timeMinutes(s){if(!/^\d{2}:\d{2}$/.test(s||''))return 9999;const [h,m]=s.split(':').map(Number);return h*60+m}

  function shouldRun(r,d=new Date()){
    if(r.repeat==='daily')return true;
    if(r.repeat==='weekdays')return d.getDay()>=1&&d.getDay()<=5;
    return false;
  }

  function materializeRoutines(){
    const today=dayKey(),tasks=taskStore();let changed=false;
    routineStore().forEach(r=>{
      if(!shouldRun(r))return;
      const id=`${r.id}-${today}`;
      if(tasks.some(t=>t.id===id))return;
      tasks.push({
        id,day:today,title:r.title,time:r.time||'',category:r.category||'Trabalho',
        priority:r.priority||'normal',done:false,note:'',createdAt:Date.now(),routineId:r.id
      });
      changed=true;
    });
    if(changed)saveTasks(tasks);
  }

  function todayTasks(){
    materializeRoutines();
    return taskStore()
      .filter(t=>t.day===dayKey())
      .sort((a,b)=>Number(a.done)-Number(b.done)
        ||(a.time||'99:99').localeCompare(b.time||'99:99')
        ||(({high:0,normal:1,low:2}[a.priority]??1)-({high:0,normal:1,low:2}[b.priority]??1)));
  }

  function attentionTasks(tasks){
    return tasks.filter(t=>!t.done).sort((a,b)=>{
      const ao=a.priority==='high'?0:1,bo=b.priority==='high'?0:1;
      return ao-bo||timeMinutes(a.time)-timeMinutes(b.time);
    }).slice(0,3);
  }

  function renderAttention(tasks){
    const box=document.getElementById('dashboardAttention');if(!box)return;
    const items=attentionTasks(tasks);
    if(!items.length){
      box.innerHTML='<div class="dashboard-empty">Nada urgente agora. Continue no seu ritmo.</div>';
      return;
    }
    const now=currentTimeMinutes();
    box.innerHTML=items.map(t=>`
      <div class="dashboard-attention-item ${t.priority==='high'?'high':''}">
        <strong>${esc(t.title)}</strong>
        <small>${t.time?esc(t.time)+' · ':''}${esc(t.category)}${timeMinutes(t.time)<now?' · horário já passou':''}</small>
      </div>`).join('');
  }

  function moduleForTask(t){
    const text=norm(`${t.title} ${t.category}`);
    if(/\b(espanol|espanhol|spanish)\b/.test(text))return {page:'spanish',label:'🇪🇸 Abrir espanhol'};
    if(/\b(ingles|english)\b/.test(text))return {page:'english',label:'🇬🇧 Abrir inglês'};
    if(/\b(entrevista|imprensa|coletiva|jornalista)\b/.test(text))return {page:'interviews',label:'🎤 Abrir entrevistas'};
    if(/\b(oratoria|apresentacao|discurso)\b/.test(text))return {page:'oratory',label:'🗣 Abrir oratória'};
    if(/\b(modelo de jogo|tatico|tatica|organizacao ofensiva|organizacao defensiva)\b/.test(text))return {page:'gamemodel',label:'⚽ Abrir modelo de jogo'};
    if(t.category==='Treino'||/\b(treino|sessao)\b/.test(text))return {page:'daily',label:'📋 Abrir CoachDay'};
    return {page:'mentor',label:'🤖 Abrir Mentor'};
  }

  function taskHtml(t){
    const label=t.priority==='high'?'Alta':t.priority==='low'?'Baixa':'Normal';
    const mod=moduleForTask(t);
    const mentorChip=t.mentorPreparedAt?'<span class="dashboard-chip mentor">🤖 preparado no Mentor</span>':'';
    const sourceChip=t.sourceMentor?'<span class="dashboard-chip mentor">↗ veio do Mentor</span>':'';
    return `<div class="dashboard-task ${t.done?'done':''}">
      <div class="dashboard-task-top">
        <button class="dashboard-task-check" onclick="dashboardToggleTask('${t.id}')" aria-label="${t.done?'Reabrir tarefa':'Concluir tarefa'}">${t.done?'✓':''}</button>
        <div>
          <div class="dashboard-task-title">${esc(t.title)}</div>
          <div class="dashboard-task-meta">
            ${t.time?`<span class="dashboard-chip">🕒 ${esc(t.time)}</span>`:''}
            <span class="dashboard-chip">${esc(t.category)}</span>
            <span class="dashboard-chip ${t.priority}">${label}</span>
            ${t.routineId?'<span class="dashboard-chip">↻ rotina</span>':''}
            ${mentorChip}${sourceChip}
          </div>
        </div>
        <button class="icon-btn" style="width:34px;height:34px;color:#516173;background:#f5f7fa" onclick="dashboardDeleteTask('${t.id}')">×</button>
      </div>

      ${t.mentorSummary?`
        <div class="dashboard-mentor-outcome">
          <strong>Resumo do Mentor</strong>
          <p>${esc(t.mentorSummary)}</p>
          ${t.mentorDecision?`<small><b>Decisão:</b> ${esc(t.mentorDecision)}</small>`:''}
        </div>`:''}

      <div class="dashboard-task-actions">
        <button onclick="dashboardDiscussTask('${t.id}')">🤖 Preparar no Mentor</button>
        <button onclick="dashboardOpenTaskModule('${t.id}')">${mod.label}</button>
      </div>

      ${t.done?`
        <div class="dashboard-task-note">
          <textarea id="task-note-${t.id}" placeholder="Como foi? O que vale registrar?">${esc(t.note||'')}</textarea>
          <div class="dashboard-task-actions"><button onclick="dashboardSaveTaskNote('${t.id}')">💾 Salvar feedback</button></div>
        </div>`:''}
    </div>`;
  }

  function weekKeys(days=7){
    const set=new Set();
    const start=new Date();start.setHours(12,0,0,0);start.setDate(start.getDate()-(days-1));
    for(let i=0;i<days;i++){
      const d=new Date(start);d.setDate(start.getDate()+i);set.add(dayKey(d));
    }
    return set;
  }

  function weeklyData(){
    const keys=weekKeys(7);
    const tasks=taskStore().filter(t=>keys.has(t.day));
    const closed=read(K.days,[]).filter(d=>keys.has(d.day));
    const mentor=read('mentor47-daily-archive',[]).filter(d=>keys.has(d.day));
    const spanish=read('coachvoice-spanish-history-v50',[]).filter(x=>keys.has(x.day));
    const englishDated=read('coachvoice-english-history',[]).filter(x=>keys.has(x.day||''));
    return {
      period:[...keys],
      tasks:tasks.map(t=>({
        day:t.day,title:t.title,category:t.category,priority:t.priority,done:Boolean(t.done),
        note:t.note||'',mentorSummary:t.mentorSummary||''
      })),
      closedDays:closed.map(d=>({
        day:d.day,summary:d.summary||'',doneHighlights:d.doneHighlights||[],
        pending:d.pending||[],tomorrowPriority:d.tomorrowPriority||''
      })),
      mentorDays:mentor.map(d=>({
        day:d.day,summary:d.summary||'',decisions:d.decisions||[],pending:d.pending||[],learning:d.learning||[]
      })),
      language:{english:englishDated.length,spanish:spanish.length}
    };
  }

  function localWeeklyReview(data){
    const done=data.tasks.filter(t=>t.done),pending=data.tasks.filter(t=>!t.done);
    const categories={};
    done.forEach(t=>categories[t.category]=(categories[t.category]||0)+1);
    const best=Object.entries(categories).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
    return {
      summary:`Nos últimos 7 dias, você concluiu ${done.length} de ${data.tasks.length} tarefas.${best?` A maior concentração foi em ${best}.`:''}`,
      wins:done.slice(0,4).map(t=>t.title),
      patterns:[],
      pending:pending.slice(0,4).map(t=>t.title),
      nextWeekFocus:pending.find(t=>t.priority==='high')?.title||pending[0]?.title||'',
      languageFocus:data.language.spanish||data.language.english?'Manter uma prática curta e consistente do idioma escolhido.':''
    };
  }

  function reviewSection(label,value){
    if(!value||(Array.isArray(value)&&!value.length))return '';
    const content=Array.isArray(value)
      ? `<ul>${value.slice(0,6).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
      : `<p>${esc(value)}</p>`;
    return `<div class="dashboard-review-section"><strong>${esc(label)}</strong>${content}</div>`;
  }

  function renderWeeklyReview(){
    const box=document.getElementById('dashboardWeeklyReview');if(!box)return;
    const item=read(K.weekly,[])[0];
    if(!item){
      box.innerHTML='<div class="dashboard-empty">Quando quiser, gere uma revisão dos últimos 7 dias. Ela usa tarefas, fechamentos e registros do Mentor.</div>';
      return;
    }
    box.innerHTML=`<div class="dashboard-weekly-review">
      <div class="dashboard-weekly-head">
        <div><span>REVISÃO SEMANAL</span><strong>${esc(item.generatedLabel||'Últimos 7 dias')}</strong></div>
        <button class="outline" onclick="dashboardGenerateWeeklyReview()">Atualizar</button>
      </div>
      ${reviewSection('Resumo',item.summary)}
      ${reviewSection('O que avançou',item.wins)}
      ${reviewSection('Padrões observáveis',item.patterns)}
      ${reviewSection('Ainda pendente',item.pending)}
      ${reviewSection('Foco da próxima semana',item.nextWeekFocus)}
      ${reviewSection('Idiomas',item.languageFocus)}
    </div>`;
  }

  function renderWeek(){
    const box=document.getElementById('dashboardWeek');if(!box)return;
    const data=weeklyData(),done=data.tasks.filter(t=>t.done).length;
    box.innerHTML=`
      <div><strong>${done}/${data.tasks.length}</strong><small>tarefas</small></div>
      <div><strong>${data.language.english}</strong><small>inglês*</small></div>
      <div><strong>${data.language.spanish}</strong><small>espanhol</small></div>`;
    renderWeeklyReview();
  }

  function renderClosedDay(){
    const box=document.getElementById('dashboardClosedDay');if(!box)return;
    const item=read(K.days,[]).find(x=>x.day===dayKey());
    if(!item){box.classList.add('hidden');box.innerHTML='';return;}
    box.classList.remove('hidden');
    const row=(l,v)=>v?`<div class="dashboard-close-row"><strong>${l}</strong>${esc(Array.isArray(v)?v.join(' · '):v)}</div>`:'';
    box.innerHTML=`<div class="dashboard-close-box">
      <h4>🌙 Dia finalizado</h4>
      ${row('Resumo',item.summary)}
      ${row('Concluído',item.doneHighlights)}
      ${row('Pendente',item.pending)}
      ${row('Prioridade de amanhã',item.tomorrowPriority)}
      <button class="outline" style="margin-top:10px" onclick="dashboardReopenDay()">Reabrir o dia</button>
    </div>`;
  }

  function renderNotes(){
    const box=document.getElementById('dashboardNotes');if(!box)return;
    const notes=todayNotes();
    box.innerHTML=notes.length?notes.map(n=>`
      <div class="dashboard-task">
        <div class="dashboard-task-title">📝 ${esc(n.text)}</div>
        <div class="dashboard-task-actions">
          <button onclick="dashboardNoteToTask('${n.id}')">Virar tarefa</button>
          <button onclick="dashboardDeleteNote('${n.id}')">Excluir</button>
        </div>
      </div>`).join(''):'<div class="dashboard-empty">Sem notas rápidas hoje.</div>';
  }

  function render(){
    materializeRoutines();
    const tasks=todayTasks(),done=tasks.filter(t=>t.done).length,total=tasks.length,pct=total?Math.round(done/total*100):0;
    setText('dashboardDate',dayLabel(new Date()));
    setText('dashboardDone',String(done));setText('dashboardPending',String(total-done));setText('dashboardTotal',String(total));
    const bar=document.getElementById('dashboardProgress');if(bar)bar.style.width=pct+'%';
    const list=document.getElementById('dashboardTaskList');
    if(list)list.innerHTML=tasks.length?tasks.map(taskHtml).join(''):'<div class="dashboard-empty">Nenhuma tarefa para hoje. Adicione só o que realmente precisa da sua atenção.</div>';
    renderAttention(tasks);renderWeek();renderClosedDay();renderNotes();
    const home=document.getElementById('homeDailyDone');if(home)home.textContent=`${done} de ${total} tarefas concluídas`;
  }

  window.dashboardAddTask=function(){
    const title=document.getElementById('dashboardTaskTitle')?.value.trim();
    if(!title){toastSafe('Digite uma tarefa.');return;}
    const time=document.getElementById('dashboardTaskTime')?.value||'';
    const category=document.getElementById('dashboardTaskCategory')?.value||'Trabalho';
    const priority=document.getElementById('dashboardTaskPriority')?.value||'normal';
    const repeat=document.getElementById('dashboardTaskRepeat')?.value||'none';
    const tasks=taskStore();

    if(repeat==='none'){
      tasks.push({id:uid('task'),day:dayKey(),title,time,category,priority,done:false,note:'',createdAt:Date.now()});
    }else{
      const routines=routineStore();
      const r={id:uid('routine'),title,time,category,priority,repeat,createdAt:Date.now()};
      routines.push(r);write(K.routines,routines);
      tasks.push({id:`${r.id}-${dayKey()}`,day:dayKey(),title,time,category,priority,done:false,note:'',createdAt:Date.now(),routineId:r.id});
    }
    saveTasks(tasks);
    document.getElementById('dashboardTaskTitle').value='';
    render();toastSafe('Tarefa adicionada ao Dashboard.');
  };

  window.dashboardToggleTask=function(id){
    const tasks=taskStore(),t=tasks.find(x=>x.id===id);if(!t)return;
    t.done=!t.done;t.doneAt=t.done?Date.now():null;
    saveTasks(tasks);render();
  };

  window.dashboardDiscussTask=function(id){
    const t=taskStore().find(x=>x.id===id);if(!t)return;
    if(typeof go==='function')go('mentor');
    setTimeout(()=>{
      if(typeof window.mentor51OpenDashboardTask==='function'){
        window.mentor51OpenDashboardTask({
          id:t.id,title:t.title,time:t.time||'',category:t.category||'Trabalho',
          priority:t.priority||'normal',day:t.day,note:t.note||''
        });
      }else{
        const input=document.getElementById('mentor42Input');
        if(input){
          input.value=`Quero me preparar para esta tarefa de hoje: ${t.title}${t.time?' às '+t.time:''}. Me ajude de forma prática e sem fazer muitas perguntas.`;
          input.focus();
        }
      }
      toastSafe('Tarefa conectada ao Mentor.');
    },120);
  };

  window.dashboardOpenTaskModule=function(id){
    const t=taskStore().find(x=>x.id===id);if(!t)return;
    const mod=moduleForTask(t);
    if(mod.page==='mentor'){window.dashboardDiscussTask(id);return;}
    if(typeof go==='function')go(mod.page);
    setTimeout(()=>{
      const message=`Tarefa de hoje: ${t.title}${t.time?' às '+t.time:''}.`;
      if(mod.page==='interviews')toastSafe(`${message} Escolha o cenário mais próximo e comece.`);
      else if(mod.page==='spanish'||mod.page==='english')toastSafe(`${message} Pratique no idioma escolhido.`);
      else toastSafe(message);
    },80);
  };

  window.dashboardDeleteTask=function(id){
    let tasks=taskStore();const t=tasks.find(x=>x.id===id);
    tasks=tasks.filter(x=>x.id!==id);saveTasks(tasks);
    if(t?.routineId){
      const keep=confirm('Esta tarefa faz parte de uma rotina. Deseja manter as próximas repetições?');
      if(!keep)write(K.routines,routineStore().filter(r=>r.id!==t.routineId));
    }
    render();
  };

  window.dashboardSaveTaskNote=function(id){
    const tasks=taskStore(),t=tasks.find(x=>x.id===id);if(!t)return;
    t.note=document.getElementById(`task-note-${id}`)?.value.trim()||'';
    saveTasks(tasks);render();toastSafe('Feedback salvo na tarefa.');
  };

  window.dashboardSaveMentorOutcome=function(id,closure={}){
    const tasks=taskStore(),t=tasks.find(x=>x.id===id);if(!t)return false;
    t.mentorPreparedAt=Date.now();
    t.mentorSummary=String(closure.summary||closure.spoken||'').trim().slice(0,700);
    t.mentorDecision=String(closure.decision||'').trim().slice(0,400);
    t.mentorPending=String(closure.pending||'').trim().slice(0,400);
    t.mentorNextStep=String(closure.nextStep||'').trim().slice(0,400);
    saveTasks(tasks);render();return true;
  };

  window.dashboardCompleteTaskFromMentor=function(id,closure={}){
    const tasks=taskStore(),t=tasks.find(x=>x.id===id);if(!t)return false;
    t.mentorPreparedAt=Date.now();
    t.mentorSummary=String(closure.summary||closure.spoken||t.mentorSummary||'').trim().slice(0,700);
    t.mentorDecision=String(closure.decision||t.mentorDecision||'').trim().slice(0,400);
    t.done=true;t.doneAt=Date.now();
    if(!t.note && closure.nextStep)t.note=`Mentor — próximo passo: ${closure.nextStep}`;
    saveTasks(tasks);render();return true;
  };

  function splitPending(text){
    const raw=String(text||'').trim();
    if(!raw)return [];
    return raw
      .split(/\n+|(?:\s*[•]\s*)|(?:\s*;\s*)/)
      .map(x=>x.replace(/^[-–—•\d.)\s]+/,'').trim())
      .filter(Boolean)
      .slice(0,4);
  }

  window.dashboardAddPendingTomorrow=function(text,context=''){
    const items=splitPending(text);if(!items.length)return 0;
    const tomorrow=tomorrowKey(),tasks=taskStore();
    let added=0;
    items.forEach(title=>{
      if(tasks.some(t=>t.day===tomorrow&&norm(t.title)===norm(title)))return;
      tasks.push({
        id:uid('mentor-pending'),day:tomorrow,title: title.slice(0,180),time:'',
        category:'Trabalho',priority:'normal',done:false,
        note:context?`Origem: Mentor. ${String(context).slice(0,350)}`:'Origem: Mentor.',
        createdAt:Date.now(),sourceMentor:true
      });
      added++;
    });
    if(added)saveTasks(tasks);
    render();
    return added;
  };

  window.dashboardVoiceTask=function(){
    if(typeof startUniversalVoiceCapture!=='function'){toastSafe('Microfone indisponível.');return;}
    startUniversalVoiceCapture({lang:'pt-BR',maxSeconds:45,label:'Nova tarefa do Dashboard',onText:text=>{
      const e=document.getElementById('dashboardTaskTitle');if(e)e.value=text;
    }});
  };

  window.dashboardAddNote=function(){
    const input=document.getElementById('dashboardQuickNote'),text=input?.value.trim();
    if(!text){toastSafe('Escreva uma nota.');return;}
    const notes=read(K.notes,[]);
    notes.unshift({id:uid('note'),day:dayKey(),text,createdAt:Date.now()});
    write(K.notes,notes.slice(0,400));input.value='';render();
  };

  window.dashboardVoiceNote=function(){
    if(typeof startUniversalVoiceCapture!=='function'){toastSafe('Microfone indisponível.');return;}
    startUniversalVoiceCapture({lang:'pt-BR',maxSeconds:60,label:'Nota rápida',onText:text=>{
      const e=document.getElementById('dashboardQuickNote');if(e)e.value=text;
    }});
  };

  window.dashboardDeleteNote=function(id){
    write(K.notes,read(K.notes,[]).filter(n=>n.id!==id));render();
  };

  window.dashboardNoteToTask=function(id){
    const notes=read(K.notes,[]),n=notes.find(x=>x.id===id);if(!n)return;
    const tasks=taskStore();
    tasks.push({id:uid('task'),day:dayKey(),title:n.text,time:'',category:'Pessoal',priority:'normal',done:false,note:'',createdAt:Date.now()});
    saveTasks(tasks);write(K.notes,notes.filter(x=>x.id!==id));render();toastSafe('Nota transformada em tarefa.');
  };

  function mentorToday(){
    const item=read('mentor47-daily-archive',[]).find(x=>x.day===dayKey());
    return item?{summary:item.summary,decisions:item.decisions,pending:item.pending,learning:item.learning}:null;
  }

  function localSummary(tasks,notes){
    const done=tasks.filter(t=>t.done),pending=tasks.filter(t=>!t.done);
    return {
      summary:`Hoje você concluiu ${done.length} de ${tasks.length} tarefas.${notes.length?' Também deixou '+notes.length+' nota(s) rápida(s).':''}`,
      doneHighlights:done.slice(0,5).map(t=>t.title),
      pending:pending.slice(0,5).map(t=>t.title),
      tomorrowPriority:pending.find(t=>t.priority==='high')?.title||pending[0]?.title||''
    };
  }

  window.dashboardCloseDay=async function(){
    const tasks=todayTasks(),notes=todayNotes(),local=localSummary(tasks,notes);
    const btn=document.getElementById('dashboardCloseDayBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ Finalizando...';}
    let result=local;

    if(typeof callCoachAI==='function'){
      const ai=await callCoachAI('dashboard-day-summary',{
        day:dayKey(),
        tasks:tasks.map(t=>({
          title:t.title,time:t.time,category:t.category,priority:t.priority,done:t.done,
          note:t.note,mentorSummary:t.mentorSummary||''
        })),
        notes:notes.map(n=>n.text),
        mentor:mentorToday()
      });
      if(!ai?.__error){
        result={
          summary:ai.summary||local.summary,
          doneHighlights:Array.isArray(ai.doneHighlights)?ai.doneHighlights:local.doneHighlights,
          pending:Array.isArray(ai.pending)?ai.pending:local.pending,
          tomorrowPriority:ai.tomorrowPriority||local.tomorrowPriority
        };
      }
    }

    const carry=document.getElementById('dashboardCarryPending')?.checked!==false;
    if(carry){
      const tomorrow=tomorrowKey(),store=taskStore();
      tasks.filter(t=>!t.done&&!t.routineId).forEach(t=>{
        if(!store.some(x=>x.day===tomorrow&&norm(x.title)===norm(t.title))){
          store.push({...t,id:uid('carry'),day:tomorrow,done:false,doneAt:null,note:'',carriedFrom:dayKey()});
        }
      });
      saveTasks(store);
    }

    const days=read(K.days,[]).filter(x=>x.day!==dayKey());
    days.unshift({id:uid('day'),day:dayKey(),closedAt:Date.now(),...result});
    write(K.days,days.slice(0,180));
    render();
    if(btn){btn.disabled=false;btn.textContent='🌙 Finalizar o dia';}
    toastSafe('Dia finalizado e salvo.');
  };

  window.dashboardGenerateWeeklyReview=async function(){
    const btn=document.getElementById('dashboardWeeklyBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ Gerando revisão...';}
    const data=weeklyData(),local=localWeeklyReview(data);
    let result=local;

    if(typeof callCoachAI==='function'){
      const ai=await callCoachAI('dashboard-weekly-review',data);
      if(!ai?.__error){
        result={
          summary:ai.summary||local.summary,
          wins:Array.isArray(ai.wins)?ai.wins:local.wins,
          patterns:Array.isArray(ai.patterns)?ai.patterns:local.patterns,
          pending:Array.isArray(ai.pending)?ai.pending:local.pending,
          nextWeekFocus:ai.nextWeekFocus||local.nextWeekFocus,
          languageFocus:ai.languageFocus||local.languageFocus
        };
      }
    }

    const reviews=read(K.weekly,[]);
    reviews.unshift({
      id:uid('week'),generatedAt:Date.now(),
      generatedLabel:`até ${new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date())}`,
      ...result
    });
    write(K.weekly,reviews.slice(0,30));
    renderWeeklyReview();
    if(btn){btn.disabled=false;btn.textContent='📊 Gerar revisão semanal';}
    toastSafe('Revisão semanal pronta.');
  };

  window.dashboardReopenDay=function(){
    write(K.days,read(K.days,[]).filter(x=>x.day!==dayKey()));
    render();toastSafe('Dia reaberto.');
  };

  window.dashboardOpen=function(){render();};
  window.dashboardRender=render;
  document.addEventListener('DOMContentLoaded',render);
  setTimeout(render,0);
})();