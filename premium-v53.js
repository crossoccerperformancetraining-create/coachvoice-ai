(() => {
'use strict';

const TASKS='coachvoice-dashboard-tasks-v50';
const AGENDA='coachvoice-agenda-v52';

const read=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f;}};
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const toMin=t=>{if(!/^\d{2}:\d{2}$/.test(t||''))return 9999;const [h,m]=t.split(':').map(Number);return h*60+m};

function identity(){
  if(typeof window.getCoachIdentity==='function')return window.getCoachIdentity();
  return {name:localStorage.getItem('coachvoice-name')||'Coach',teamName:'',photo:'',crest:''};
}
function safeImage(v){return /^data:image\//i.test(String(v||''))?String(v):''}
function initials(name){
  const p=String(name||'Coach').trim().split(/\s+/).filter(Boolean);
  return (p.length>1?p[0][0]+p[p.length-1][0]:(p[0]||'C').slice(0,2)).toUpperCase();
}
function setImage(el,image,fallback,contain=false){
  if(!el)return;
  const src=safeImage(image);
  el.innerHTML=src?`<img src="${src}" alt="" style="object-fit:${contain?'contain':'cover'}">`:esc(fallback||'');
}

function refreshTopIdentity(){
  const i=identity();
  setImage(document.getElementById('premium53TopAvatar'),i.photo,initials(i.name));
  setImage(document.getElementById('premium53TopCrest'),i.crest,i.teamName?'CV':'',true);
}

window.premium53OpenAccount=function(){
  if(matchMedia('(min-width: 980px)').matches){
    go('profile');
    return;
  }
  openDrawer();
};

window.premium53OpenSearch=function(){
  closeDrawer();
  setTimeout(()=>window.today52OpenSearch?.(),80);
};
window.premium53OpenPeople=function(){
  closeDrawer();
  go('progress');
  setTimeout(()=>document.getElementById('premium53PeopleSection')?.scrollIntoView({behavior:'smooth',block:'start'}),180);
};
window.premium53OpenBackup=function(){
  closeDrawer();
  go('profile');
  setTimeout(()=>document.getElementById('premium53BackupSection')?.scrollIntoView({behavior:'smooth',block:'start'}),180);
};

function todayData(){
  const today=dayKey();
  const tasks=read(TASKS,[]).filter(x=>x.day===today&&!x.done);
  const events=read(AGENDA,[]).filter(x=>x.date===today&&!x.done).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  return {tasks,events};
}

function focusItem(tasks,events){
  const now=new Date().getHours()*60+new Date().getMinutes();
  const upcoming=events.filter(e=>toMin(e.time)>=now).sort((a,b)=>toMin(a.time)-toMin(b.time))[0];
  if(upcoming && toMin(upcoming.time)-now<=180)return {...upcoming,_kind:'event'};
  const high=tasks.filter(t=>t.priority==='high').sort((a,b)=>toMin(a.time)-toMin(b.time))[0];
  if(high)return {...high,_kind:'task'};
  if(upcoming)return {...upcoming,_kind:'event'};
  const timedTask=tasks.sort((a,b)=>toMin(a.time)-toMin(b.time))[0];
  return timedTask?{...timedTask,_kind:'task'}:null;
}

function formatDate(){
  return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date());
}
function greeting(){
  const h=new Date().getHours();
  return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}

function renderTodayPremium(){
  const host=document.getElementById('premium53TodayOverview');
  if(!host)return;
  const {tasks,events}=todayData();
  const i=identity();
  const item=focusItem(tasks,events);
  const high=tasks.filter(t=>t.priority==='high').length;
  const next=events.find(e=>toMin(e.time)>=new Date().getHours()*60+new Date().getMinutes())||events[0];

  let action='';
  if(item?._kind==='event'){
    action=`<button class="premium53-focus-primary" onclick="today52PrepareEvent('${String(item.id).replaceAll("'","")}')">Preparar com Mentor</button>`;
  }else if(item?._kind==='task'){
    action=`<button class="premium53-focus-primary" onclick="dashboardDiscussTask('${String(item.id).replaceAll("'","")}')">Preparar com Mentor</button>`;
  }else{
    action=`<button class="premium53-focus-primary" onclick="today52OpenQuickCreate('task')">Criar prioridade</button>`;
  }

  host.innerHTML=`
    <div class="premium53-today-head">
      <div>
        <span>${esc(greeting())}</span>
        <h2>${esc(i.name||'Coach')}</h2>
        <p>${esc(formatDate())}${i.teamName?` · ${esc(i.teamName)}`:''}</p>
      </div>
      <div class="premium53-today-crest" id="premium53TodayCrest"></div>
    </div>

    <div class="premium53-today-metrics">
      <div><strong>${events.length}</strong><span>compromissos</span></div>
      <div><strong>${tasks.length}</strong><span>tarefas</span></div>
      <div><strong>${high}</strong><span>alta prioridade</span></div>
    </div>

    <article class="premium53-focus-card">
      <div class="premium53-focus-copy">
        <span>PRIORIDADE AGORA</span>
        <h3>${esc(item?.title||'Seu dia está sob controle')}</h3>
        <p>${
          item
            ? `${item.time?`${esc(item.time)} · `:''}${esc(item.category||item._kind==='event'?'Compromisso':'Tarefa')}`
            : 'Nenhuma prioridade crítica registrada. Preserve espaço para o que realmente importa.'
        }</p>
      </div>
      <div class="premium53-focus-actions">
        ${action}
        <button class="premium53-focus-secondary" onclick="conversation54Start('free')">Conversa rápida</button>
      </div>
    </article>`;
  setImage(document.getElementById('premium53TodayCrest'),i.crest,i.teamName?'CV':'',true);
}

function makeAdminDrawerAccessible(){
  const drawer=document.getElementById('drawer');
  if(!drawer)return;
  if(matchMedia('(min-width: 980px)').matches){
    drawer.classList.add('open');
    document.getElementById('overlay')?.classList.remove('show');
  }else{
    drawer.classList.remove('open');
  }
}

function wrapGo(){
  if(typeof window.go!=='function'||window.go.__premium53Wrapped)return;
  const original=window.go;
  const wrapped=function(page,...args){
    const result=original.call(this,page,...args);
    setTimeout(()=>{
      refreshTopIdentity();
      if(page==='dashboard')renderTodayPremium();
      if(matchMedia('(min-width:980px)').matches){
        document.getElementById('drawer')?.classList.add('open');
      }
    },30);
    return result;
  };
  wrapped.__premium53Wrapped=true;
  window.go=wrapped;
}

function cleanMobileDrawerAfterNavigation(){
  if(!matchMedia('(max-width:979px)').matches)return;
  document.getElementById('drawer')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('show');
}

window.addEventListener('coachvoice:identity',()=>{
  refreshTopIdentity();
  renderTodayPremium();
});
window.addEventListener('resize',makeAdminDrawerAccessible);
window.addEventListener('storage',()=>{refreshTopIdentity();renderTodayPremium();});

document.addEventListener('click',event=>{
  if(event.target.closest('.premium53-mobile-admin button'))setTimeout(cleanMobileDrawerAfterNavigation,40);
});

document.addEventListener('DOMContentLoaded',()=>{
  wrapGo();
  refreshTopIdentity();
  renderTodayPremium();
  makeAdminDrawerAccessible();
  setTimeout(()=>{wrapGo();refreshTopIdentity();renderTodayPremium();},300);
});
})();