(() => {
  'use strict';

  const MK = {
    settings:'mentor42-settings',
    memory:'mentor42-memory',
    active:'mentor42-active',
    criticism:'mentor42-criticism',
    daily:'mentor47-daily-archive',
    daylog:'mentor47-daylog',
    profile:'mentor47-profile'
  };

  const modeLabels = {
    free:'Conversa livre',
    daylife:'Dia a Dia',
    mentor:'Modo Mentor',
    questions:'Só perguntas',
    simulation:'Simulação',
    avoid:'Estou evitando essa conversa',
    challenge:'Questione minha decisão',
    five:'Me prepare em 5 minutos',
    organize:'Só organizar — sem conselho',
    unload:'Desabafar / organizar a cabeça',
    decide:'Preciso decidir agora',
    proscons:'Prós e contras',
    hardtalk:'Conversa difícil',
    unhappy:'Jogador insatisfeito',
    captainmode:'Conversa com capitão',
    pretraining:'Preparar pré-treino',
    pregame:'Preparar pré-jogo',
    boardmeeting:'Reunião com diretoria',
    pressprep:'Preparar entrevista',
    reflectday:'Como foi meu dia?',
    improve:'O que eu poderia ter feito melhor?',
    closeday:'Fechar o dia'
  };

  const modeHints = {
    free:'Conversa aberta. O Mentor responde ao que você disser e só pergunta quando isso realmente ajudar.',
    daylife:'Conversa do cotidiano. Pode falar de horários, prioridades, estudo, viagem, cansaço ou qualquer assunto do dia. Não é preciso transformar tudo em futebol.',
    mentor:'O Mentor conversa, orienta e pode testar seu critério sem transformar tudo em interrogatório.',
    questions:'O Mentor não entrega a solução. Ele faz uma pergunta de cada vez para você construir a resposta.',
    simulation:'A IA assume o papel escolhido e reage ao que você realmente fala.',
    avoid:'Conte qual conversa você está adiando. Vamos definir fato, objetivo, abertura e o que não deve ser prometido.',
    challenge:'Explique sua decisão. O Mentor procurará critério, coerência, possível ponto cego e alternativa.',
    five:'Diga o que vai acontecer nos próximos minutos. O Mentor ajuda a reduzir sua preparação ao essencial.',
    organize:'O Mentor separa fatos, interpretações, decisões e pendências sem aconselhar.',
    unload:'Fale livremente. O Mentor ajuda a colocar as ideias em ordem sem transformar seu relato em uma lista de perguntas.',
    decide:'Diga a decisão que precisa tomar. O Mentor organiza o que é fato, o que pesa mais e qual é a próxima decisão possível.',
    proscons:'Compare duas ou mais opções com vantagens, riscos, critérios e o que ainda falta saber.',
    hardtalk:'Prepare uma conversa difícil com abertura clara, fato observável, escuta e fechamento — sem roteiro artificial.',
    unhappy:'Converse sobre um jogador insatisfeito sem presumir o que ele sente. Foque no que foi dito, no critério e no próximo passo.',
    captainmode:'Prepare uma conversa com o capitão equilibrando escuta, responsabilidade e papel de liderança.',
    pretraining:'Organize uma fala pré-treino curta e útil, evitando discurso por obrigação.',
    pregame:'Prepare uma mensagem pré-jogo com poucas ideias, comportamento esperado e foco no que está sob controle.',
    boardmeeting:'Organize uma conversa com a diretoria: fatos, decisões, riscos, necessidades e o que não deve ser prometido.',
    pressprep:'Prepare respostas para imprensa com objetividade, proteção do grupo e próximo passo.',
    reflectday:'Revise o dia sem sermão. Identifique o que aconteceu, uma decisão importante e algo que merece atenção.',
    improve:'Escolha uma melhoria concreta e observável, sem transformar o dia inteiro em crítica.',
    closeday:'Feche o dia com um resumo curto, pendências reais e o que vale salvar. Não planeje amanhã sem o treinador pedir.'
  };

  const preClubScenarios = [
    'Primeira conversa com um jogador experiente que não iniciará como titular.',
    'Apresentação de 5 minutos ao elenco: relação de trabalho, critérios e primeiro passo.',
    'Diretoria pergunta o que você pretende mudar imediatamente.',
    'Jogador jovem comete um erro importante no primeiro treino.',
    'Capitão procura você para falar sobre uma preocupação do grupo.',
    'Primeira coletiva com pressão por resultado imediato.',
    'Primeiro pós-jogo: separar resultado, desempenho e decisões para o dia seguinte.'
  ];

  let state = {
    mode:'free',
    turns:[],
    review:null,
    isCallOpen:false,
    callMode:'voice',
    cameraEnabled:false,
    autoConversation:false,
    specialContext:'',
    contextSourceDay:'',
    day:todayKey(),
    startedAt:Date.now(),
    conversationEnded:false,
    closureDraft:null,
    dashboardTaskId:'',
    dashboardTaskTitle:'',
    dashboardTaskCompleted:false,
    agendaEventId:'',
    agendaEventTitle:''
  };

  function getJSON(key,fallback){
    try{
      const raw=localStorage.getItem(key);
      return raw?JSON.parse(raw):fallback;
    }catch{return fallback;}
  }
  function setJSON(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function esc(value){
    return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function formatMentorText(value){
    let safe=esc(value);
    safe=safe
      .replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>')
      .replace(/^#{1,3}\s+(.+)$/gm,'<strong>$1</strong>')
      .replace(/\n/g,'<br>');
    return safe;
  }

  function normalizePhrase(value){
    return String(value||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function mentor512TranscriptLooksSuspicious(value){
    const normalized=normalizePhrase(value);
    const words=normalized.split(' ').filter(Boolean);
    if(words.length<20)return false;

    // Se a mesma sequência de 4 palavras aparecer 3x ou mais,
    // provavelmente houve looping/repetição na transcrição.
    const counts=new Map();
    for(let i=0;i<=words.length-4;i++){
      const gram=words.slice(i,i+4).join(' ');
      const next=(counts.get(gram)||0)+1;
      counts.set(gram,next);
      if(next>=3)return true;
    }

    // Também sinaliza textos longos com diversidade de palavras muito baixa.
    const unique=new Set(words);
    return words.length>=35 && (unique.size/words.length)<0.34;
  }

  function phraseSimilarity(a,b){
    const aa=normalizePhrase(a), bb=normalizePhrase(b);
    if(!aa||!bb)return 0;
    if(aa===bb)return 1;
    if(aa.includes(bb)||bb.includes(aa))return Math.min(1,Math.min(aa.length,bb.length)/Math.max(aa.length,bb.length)+0.25);
    const A=new Set(aa.split(' ').filter(x=>x.length>2));
    const B=new Set(bb.split(' ').filter(x=>x.length>2));
    if(!A.size||!B.size)return 0;
    let inter=0; A.forEach(x=>{if(B.has(x))inter++;});
    const union=new Set([...A,...B]).size;
    return union?inter/union:0;
  }

  function questionLooksRepeated(question,spoken=''){
    const q=String(question||'').trim();
    if(!q)return true;
    if(phraseSimilarity(q,spoken)>=0.72)return true;
    const recent=state.turns
      .filter(t=>t.role==='assistant')
      .slice(-5)
      .map(t=>t.text||'');
    return recent.some(text=>phraseSimilarity(q,text)>=0.67);
  }
  function todayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function autoVoice(){
    return getJSON(MK.settings,{autoVoice:true}).autoVoice!==false;
  }
  function saveActive(){
    state.day=state.day||todayKey();
    setJSON(MK.active,{...state,savedAt:Date.now()});
  }
  function memory(){return getJSON(MK.memory,[]);}
  function setMemory(list){setJSON(MK.memory,list.slice(0,120));}

  function dayLabel(key){
    if(!key)return '';
    const [y,m,d]=String(key).split('-').map(Number);
    if(!y||!m||!d)return String(key);
    return new Date(y,m-1,d).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
  }

  function offsetDayKey(offset){
    const d=new Date();
    d.setHours(12,0,0,0);
    d.setDate(d.getDate()+offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function dailyArchive(){return getJSON(MK.daily,[]);}
  function setDailyArchive(list){setJSON(MK.daily,list.slice(0,180));}

  function localDaySummary(turns=[]){
    const userTurns=turns.filter(t=>t.role==='user').map(t=>t.text).filter(Boolean);
    const first=userTurns[0]||'';
    const last=userTurns[userTurns.length-1]||'';
    return {
      summary:userTurns.length
        ? `Dia registrado com ${userTurns.length} participação${userTurns.length===1?'':'ões'} sua${userTurns.length===1?'':'s'}. ${first.slice(0,220)}${last&&last!==first?' / '+last.slice(0,180):''}`
        : 'Dia registrado no CoachVoice.',
      highlights:userTurns.slice(-4).map(x=>x.slice(0,180)),
      decisions:[],
      people:[],
      pending:[],
      learning:[]
    };
  }

  function upsertDailyArchive(item){
    const list=dailyArchive();
    const idx=list.findIndex(x=>x.day===item.day);
    if(idx>=0){
      const old=list[idx];
      const preserveAI=old.aiSummary && !item.aiSummary;
      list[idx]=preserveAI
        ? {...old,...item,summary:old.summary,highlights:old.highlights,decisions:old.decisions,people:old.people,pending:old.pending,learning:old.learning,aiSummary:true}
        : {...old,...item};
    }else list.unshift(item);
    list.sort((a,b)=>String(b.day).localeCompare(String(a.day)));
    setDailyArchive(list);
    return list.find(x=>x.day===item.day);
  }

  function archiveLogLocally(log){
    if(!log?.day || !Array.isArray(log.turns) || !log.turns.length)return null;
    const local=localDaySummary(log.turns);
    return upsertDailyArchive({
      id:'day-'+log.day,
      day:log.day,
      date:dayLabel(log.day),
      title:(log.turns.find(t=>t.role==='user')?.text||'Dia do treinador').slice(0,90),
      ...local,
      turns:log.turns.slice(-180),
      coachDay:log.coachDay||null,
      aiSummary:false,
      autoArchived:true,
      savedAt:Date.now()
    });
  }

  function currentDayLog(){
    let log=getJSON(MK.daylog,null);
    const today=todayKey();
    if(log?.day && log.day!==today){
      archiveLogLocally(log);
      log=null;
    }
    if(!log || !Array.isArray(log.turns)){
      log={day:today,turns:[],startedAt:Date.now(),updatedAt:Date.now()};
      setJSON(MK.daylog,log);
    }
    return log;
  }

  function appendDayTurn(turn){
    if(!turn?.text)return;
    const log=currentDayLog();
    log.turns.push({...turn,ts:turn.ts||Date.now()});
    log.turns=log.turns.slice(-180);
    log.updatedAt=Date.now();
    setJSON(MK.daylog,log);
  }

  function seedDayLogFromActive(stored){
    const existing=getJSON(MK.daylog,null);
    if(existing?.day===todayKey() && existing.turns?.length)return;
    if(stored?.day===todayKey() && Array.isArray(stored.turns) && stored.turns.length){
      setJSON(MK.daylog,{day:todayKey(),turns:stored.turns.map((t,i)=>({...t,ts:t.ts||Date.now()+i})),startedAt:stored.startedAt||Date.now(),updatedAt:Date.now()});
    }else currentDayLog();
  }

  function coachDaySnapshot(day=todayKey()){
    try{return getJSON('coachday-days-v40',{})?.[day]||null;}catch{return null;}
  }

  function transcriptForSummary(turns=[]){
    const lines=turns.map(t=>`${t.role==='user'?'TREINADOR':'MENTOR'}: ${String(t.text||'').replace(/\s+/g,' ').trim()}`);
    let text=lines.join('\n');
    if(text.length<=9000)return text;
    return text.slice(0,3200)+'\n...[trecho intermediário omitido]...\n'+text.slice(-5600);
  }

  function earlierTodayContext(){
    const log=currentDayLog();
    const start=Number(state.startedAt||0);
    return log.turns
      .filter(t=>Number(t.ts||0)<start)
      .slice(-8)
      .map(t=>({role:t.role,text:String(t.text||'').slice(0,450)}));
  }

  function migrateLegacyDailyMemory(){
    if(dailyArchive().length)return;
    const legacy=memory();
    if(!legacy.length)return;
    const grouped={};
    legacy.forEach(item=>{
      if(!item.day)return;
      (grouped[item.day] ||= []).push(item);
    });
    const list=Object.entries(grouped).map(([day,items])=>({
      id:'legacy-'+day,day,date:dayLabel(day),
      title:'Memória anterior',
      summary:items.map(x=>x.summary).filter(Boolean).join(' / ').slice(0,900),
      highlights:items.map(x=>x.learning).filter(Boolean).slice(0,6),
      decisions:[],
      people:[],
      pending:items.filter(x=>!x.resolved).map(x=>x.nextAction).filter(Boolean).slice(0,6),
      learning:items.map(x=>x.learning).filter(Boolean).slice(0,6),
      turns:[],aiSummary:false,legacy:true,savedAt:Date.now()
    }));
    if(list.length)setDailyArchive(list);
  }

  function profileText(){
    const base=String(localStorage.getItem(MK.profile)||'').trim();
    let prefs={};
    try{prefs=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}');}catch{}
    const toneMap={direct:'direto e objetivo',balanced:'equilibrado, humano e prático',reflective:'reflexivo sem ser interrogatório'};
    const lengthMap={short:'curtas',normal:'médias e naturais',detailed:'mais detalhadas quando necessário'};
    let identity={};
    try{identity=JSON.parse(localStorage.getItem('coachvoice-profile-v521')||'{}')||{};}catch{}
    const identityContext=[
      identity.name?`Nome de exibição do treinador: ${String(identity.name).slice(0,80)}.`:'',
      identity.teamName?`Equipe atual: ${String(identity.teamName).slice(0,120)}.`:'',
      'Use nome e equipe apenas quando isso deixar a conversa mais natural ou evitar ambiguidade; não repita essas informações em toda resposta.'
    ].filter(Boolean).join(' ');

    const extra=[
      identityContext,
      `Preferência de tom: ${toneMap[prefs.mentorTone]||'equilibrado, humano e prático'}.`,
      `Preferência de tamanho: respostas ${lengthMap[prefs.responseLength]||'médias e naturais'}.`,
      'Evite perguntas por hábito; responda primeiro e só pergunte se isso realmente mudar a orientação.'
    ].filter(Boolean).join(' ');
    return [base,extra].filter(Boolean).join('\n');
  }


  window.mentor42SaveVoiceSetting=function mentor42SaveVoiceSetting(){
    const checked=document.getElementById('mentor42AutoVoice')?.checked!==false;
    const settings=getJSON(MK.settings,{});
    settings.autoVoice=checked;setJSON(MK.settings,settings);
  };

  function mentor43SetSpeaking(active,text=''){
    document.getElementById('mentor43Avatar')?.classList.toggle('speaking',Boolean(active));
    document.getElementById('mentor43Wave')?.classList.toggle('speaking',Boolean(active));
    const c=document.getElementById('mentor43Caption');if(c&&text)c.textContent=text;
  }

  function mentor44PickVoice(){
    try{
      const voices=speechSynthesis.getVoices()||[];
      return voices.find(v=>/^pt-BR$/i.test(v.lang))
        || voices.find(v=>/^pt/i.test(v.lang))
        || null;
    }catch{return null;}
  }

  let mentor461SpeechPrimed=false;
  let mentor461SpeechSeq=0;
  let mentor461CurrentUtterance=null;

  function mentor461PrimeSpeech(){
    if(mentor461SpeechPrimed || !('speechSynthesis' in window))return;
    try{
      speechSynthesis.cancel();
      speechSynthesis.resume?.();
      const warmup=new SpeechSynthesisUtterance(' ');
      warmup.lang='pt-BR';
      warmup.volume=0.01;
      warmup.rate=2;
      speechSynthesis.speak(warmup);
      mentor461SpeechPrimed=true;
    }catch{}
  }

  function speak(text,options={}){
    const force=Boolean(options.force);
    if(!text || (!force && !autoVoice())){
      mentor43SetSpeaking(false);
      mentor44AfterMentorSpeech();
      return;
    }
    if(!('speechSynthesis' in window)){
      setCallStatus('Resposta pronta em texto. A voz não está disponível neste navegador.');
      mentor44AfterMentorSpeech();
      return;
    }

    const seq=++mentor461SpeechSeq;
    let started=false;
    let finished=false;
    let startTimer=null;

    try{
      speechSynthesis.cancel();
      speechSynthesis.resume?.();

      const u=new SpeechSynthesisUtterance(String(text));
      mentor461CurrentUtterance=u;
      u.lang='pt-BR';
      let rate=.92;
      try{
        const v52=JSON.parse(localStorage.getItem('coachvoice-v52-settings')||'{}');
        if(Number.isFinite(Number(v52.voiceRate)))rate=Math.min(1.2,Math.max(.75,Number(v52.voiceRate)));
      }catch{}
      u.rate=rate;
      u.pitch=1;
      u.volume=1;

      const voice=mentor44PickVoice();
      if(voice)u.voice=voice;

      const finish=(message)=>{
        if(finished || seq!==mentor461SpeechSeq)return;
        finished=true;
        if(startTimer)clearTimeout(startTimer);
        mentor43SetSpeaking(false);
        if(message)setCallStatus(message);
        mentor44AfterMentorSpeech();
      };

      u.onstart=()=>{
        if(seq!==mentor461SpeechSeq)return;
        started=true;
        if(startTimer)clearTimeout(startTimer);
        mentor43SetSpeaking(true,text);
        setCallStatus('Mentor falando...');
      };

      u.onend=()=>{
        finish('Sua vez. Toque no microfone para continuar.');
      };

      u.onerror=(event)=>{
        const blocked=String(event?.error||'').toLowerCase();
        finish(
          blocked.includes('not-allowed') || blocked.includes('interrupted')
            ? 'Resposta pronta. Toque em 🔊 Ouvir / repetir resposta para liberar o áudio no iPhone.'
            : 'A resposta está no texto. Toque em 🔊 Ouvir / repetir resposta para escutar.'
        );
      };

      speechSynthesis.speak(u);

      // Safari/iOS can accept speak() but not actually start it after an async API response.
      // In that case keep the text and give the user a one-tap, user-gesture fallback.
      startTimer=setTimeout(()=>{
        if(seq!==mentor461SpeechSeq || started || finished)return;
        try{speechSynthesis.resume?.();}catch{}
        setCallStatus('Resposta pronta. Se o iPhone não falar automaticamente, toque em 🔊 Ouvir / repetir resposta.');
      },2200);
    }catch{
      mentor43SetSpeaking(false);
      setCallStatus('Resposta pronta. Toque em 🔊 Ouvir / repetir resposta para escutar.');
      mentor44AfterMentorSpeech();
    }
  }

  window.mentor42StopVoice=function mentor42StopVoice(){
    mentor461SpeechSeq++;
    mentor461CurrentUtterance=null;
    try{speechSynthesis?.cancel();}catch{}
    mentor43SetSpeaking(false);
    setCallStatus('Voz interrompida. Toque no microfone quando quiser continuar.');
  };

  function setCallStatus(text){
    const el=document.getElementById('mentor42CallStatus');
    if(!el)return;
    el.textContent=text;
    const value=String(text||'').toLowerCase();
    let stateName='ready';
    if(/gravando|estou ouvindo|ouvindo\.\.\.|continue falando/.test(value))stateName='recording';
    else if(/transcrev|process|enviando|finalizando sua fala/.test(value))stateName='processing';
    else if(/mentor falando|mentor vai responder|respondendo|resposta pronta/.test(value))stateName='ai';
    else if(/falh|erro|não consegui|bloqueado|indisponível/.test(value))stateName='error';
    el.dataset.state=stateName;
  }

  function setMode(mode){
    state.mode=modeLabels[mode]?mode:'free';
    const select=document.getElementById('mentor42Mode');
    if(select)select.value=state.mode;
    const title=document.getElementById('mentor42ModeTitle');
    if(title)title.textContent=modeLabels[state.mode];
    const callTitle=document.getElementById('mentor42CallTitle');
    if(callTitle)callTitle.textContent=modeLabels[state.mode];
    const hint=document.getElementById('mentor42ModeHint');
    if(hint)hint.textContent=modeHints[state.mode];
    saveActive();
  }

  window.mentor42ModeChanged=function mentor42ModeChanged(){
    setMode(document.getElementById('mentor42Mode')?.value||'free');
  };

  function addTurn(role,text,meta={}){
    if(!text)return;
    const turn={
      role,text,
      time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
      ts:Date.now(),
      ...meta
    };
    state.turns.push(turn);
    state.turns=state.turns.slice(-60);
    appendDayTurn(turn);
    saveActive();
    renderChat();
  }

  function renderChat(){
    const html=state.turns.length
      ? state.turns.map(turn=>`
        <div class="mentor42-bubble ${turn.role==='user'?'user':'ai'}">
          ${turn.role==='assistant'?formatMentorText(turn.text):esc(turn.text).replace(/\n/g,'<br>')}
          ${turn.apiError?'<button class="mentor512-retry-ai" onclick="mentor512RetryLastAI()">↻ Tentar resposta novamente</button>':''}
          <small>${turn.role==='user'?'Você':'Mentor'} · ${esc(turn.time||'')}</small>
        </div>`).join('')
      : `<div class="mentor42-bubble ai">Estou aqui. Conte a situação do seu jeito. Não precisamos começar pela solução.</div>`;
    const main=document.getElementById('mentor42Chat');
    const call=document.getElementById('mentor42CallChat');
    if(main){main.innerHTML=html;main.scrollTop=main.scrollHeight;}
    if(call){call.innerHTML=html;call.scrollTop=call.scrollHeight;}
    renderClosurePanel();
    applyConversationEndedState();
  }

  function compactHistory(){
    return state.turns.slice(-18).map(t=>({role:t.role,text:t.text.slice(0,700)}));
  }

  function lastUserText(){
    return [...state.turns].reverse().find(t=>t.role==='user')?.text||'';
  }

  function lastAssistantText(){
    return [...state.turns].reverse().find(t=>t.role==='assistant')?.text||'';
  }

  function localDialogue(mode,text){
    const common={
      reflection:'Procure separar o que aconteceu do significado que você está atribuindo ao episódio.',
      savePoint:'Fato, critério e próximo passo.'
    };
    if(mode==='questions'){
      return {...common,spoken:'Entendi. Antes de pensar em uma solução, quero fazer uma pergunta.',nextQuestion:'Qual é o fato observável, sem interpretar a intenção da outra pessoa?'};
    }
    if(mode==='simulation'){
      return {...common,spoken:'Professor, eu entendo sua posição, mas quero saber de forma concreta o que você espera de mim daqui para frente.',nextQuestion:'Como você responderia sem prometer uma decisão futura?'};
    }
    if(mode==='avoid'){
      return {...common,spoken:'Se você está evitando a conversa, primeiro vamos diminuir o tamanho dela. Não precisa resolver toda a relação de uma vez.',nextQuestion:'Qual é o único objetivo que essa conversa precisa cumprir hoje?'};
    }
    if(mode==='challenge'){
      return {...common,spoken:'Seu argumento pode fazer sentido, mas quero testar uma coisa antes de aceitá-lo.',nextQuestion:'Você aplicaria exatamente o mesmo critério se fosse outro jogador, especialmente um titular importante?'};
    }
    if(mode==='five'){
      return {...common,spoken:'Certo. Vamos reduzir isso ao essencial para os próximos cinco minutos.',nextQuestion:'Qual comportamento você quer que as pessoas consigam repetir depois da sua fala?'};
    }
    if(mode==='organize'){
      return {...common,spoken:'Vou apenas organizar, sem aconselhar: existe o fato que aconteceu, a sua interpretação sobre ele e uma decisão que ainda pode estar pendente.',nextQuestion:'O que você sabe com certeza e o que ainda está supondo?'};
    }
    if(mode==='daylife'){
      return {...common,spoken:'Entendi. Vamos organizar seu dia de um jeito simples, sem transformar tudo em futebol. Posso ajudar com horários, prioridades, energia ou apenas conversar.',nextQuestion:''};
    }
    if(mode==='unload'){
      return {...common,spoken:'Pode colocar tudo aqui do jeito que estiver vindo. Eu organizo com você sem tentar resolver cada ponto imediatamente.',nextQuestion:''};
    }
    if(mode==='decide'){
      return {...common,spoken:'Vamos reduzir a decisão ao que realmente pesa agora: fato, opções, risco e o que pode ser revisto depois.',nextQuestion:'Qual parte dessa decisão é irreversível hoje?'};
    }
    if(mode==='proscons'){
      return {...common,spoken:'Podemos comparar as opções sem procurar uma resposta perfeita. Vou separar benefício, risco, custo e informação que ainda falta.',nextQuestion:'Quais são as duas opções principais que você está considerando?'};
    }
    if(mode==='hardtalk'){
      return {...common,spoken:'Vamos preparar essa conversa para que ela seja clara e humana: abrir o assunto, dizer o fato, ouvir e fechar com um próximo passo.',nextQuestion:'O que precisa ficar claro ao final, mesmo que vocês não concordem em tudo?'};
    }
    if(mode==='unhappy'){
      return {...common,spoken:'Vamos trabalhar apenas com o que o jogador disse ou fez, sem presumir o que ele está sentindo. A conversa precisa preservar critério e espaço para escuta.',nextQuestion:'O que ele disse ou fez de forma concreta?'};
    }
    if(mode==='captainmode'){
      return {...common,spoken:'Com o capitão, eu separaria o que ele traz como voz do grupo do que é responsabilidade dele como liderança.',nextQuestion:'Qual é o assunto concreto que você precisa alinhar com ele?'};
    }
    if(mode==='pretraining'){
      return {...common,spoken:'Antes do treino, a fala só vale a pena se ajudar a equipe a reconhecer uma prioridade. Vamos manter curto e aplicável.',nextQuestion:'Qual comportamento você quer ver já nos primeiros minutos do treino?'};
    }
    if(mode==='pregame'){
      return {...common,spoken:'No pré-jogo, eu reduziria a mensagem a poucas referências: intenção, comportamento-chave e reação aos momentos difíceis.',nextQuestion:'Qual é a ideia que não pode se perder quando o jogo ficar caótico?'};
    }
    if(mode==='boardmeeting'){
      return {...common,spoken:'Para a diretoria, organize fatos, decisões, necessidades e riscos. Evite transformar a reunião em defesa pessoal.',nextQuestion:'Qual decisão ou alinhamento você precisa obter nessa reunião?'};
    }
    if(mode==='pressprep'){
      return {...common,spoken:'Vamos preparar respostas curtas: responder primeiro, proteger o grupo, explicar um ponto e terminar com o próximo passo.',nextQuestion:'Qual é a pergunta que você mais espera receber?'};
    }
    if(mode==='reflectday'){
      return {...common,spoken:'Podemos revisar o dia sem transformá-lo em avaliação total. Primeiro, vamos reconhecer o que realmente aconteceu e o que merece ser guardado.',nextQuestion:'Qual foi o momento mais importante do seu dia?'};
    }
    if(mode==='improve'){
      return {...common,spoken:'Vamos escolher uma melhoria pequena e observável, não uma crítica geral sobre você ou sobre o dia inteiro.',nextQuestion:'Qual situação de hoje você gostaria de repetir de outra forma?'};
    }
    if(mode==='closeday'){
      return {...common,spoken:'Vamos fechar o dia de forma simples: o que aconteceu, o que ficou pendente e o que vale salvar. Amanhã começa limpo, a menos que você queira retomar algo.',nextQuestion:'Tem alguma coisa importante que ainda não entrou no registro de hoje?'};
    }
    if(mode==='mentor'){
      return {...common,spoken:'Entendi seu raciocínio. Quero ajudar sem simplesmente confirmar sua primeira leitura.',nextQuestion:'Qual parte da sua decisão é critério e qual parte pode ser reação ao episódio mais recente?'};
    }
    return {...common,spoken:'Entendi. Podemos conversar sobre isso do jeito que fizer mais sentido para você.',nextQuestion:''};
  }

  async function askDialogue(text){
    const role=document.getElementById('mentor42Role')?.value||'player';
    const difficulty=document.getElementById('mentor42Difficulty')?.value||'realistic';
    const local=localDialogue(state.mode,text);
    const payload={
      dialogueMode:state.mode,
      role,difficulty,
      message:text,
      history:compactHistory(),
      todayEarlierContext:earlierTodayContext(),
      specialContext:state.specialContext||'',
      previousDayContext:state.contextSourceDay||'',
      coachProfile:profileText(),
      coachPrep:state.mode==='five'?preClubContext():null,
      local
    };
    if(typeof callCoachAI!=='function'){
      return {__error:true,__message:'A função da IA não está disponível nesta versão.'};
    }

    const ai=await callCoachAI('mentor-dialogue',payload);

    if(ai?.__error){
      return ai;
    }

    return ai;
  }

  function mentor45FriendlyError(error){
    const code=String(error?.__code||'').toLowerCase();
    const message=String(error?.__message||'A IA não respondeu.');

    if(code.includes('resource_exhausted') || /quota|rate limit|resource exhausted/i.test(message)){
      return '⚠️ O Gemini está conectado, mas o limite gratuito do projeto foi atingido. Aguarde a renovação da cota ou confira os limites no Google AI Studio.';
    }

    if(code.includes('api_key_invalid') || code.includes('permission_denied') || code.includes('unauthenticated') || /api key|invalid key|permission denied|authentication credentials/i.test(message)){
      return '⚠️ A GEMINI_API_KEY foi encontrada, mas o Google recusou a chave. Gere uma nova chave no Google AI Studio, substitua na Vercel e faça Redeploy.';
    }

    if(code.includes('model') || /model/i.test(message)){
      return '⚠️ A chave do Gemini funcionou, mas o modelo configurado não pôde ser usado. Erro recebido: '+message;
    }

    if(code==='invalid_json'){
      return '⚠️ O Gemini respondeu, mas o servidor não conseguiu interpretar a resposta. Tente novamente. Se persistir, abra os Logs da Vercel.';
    }

    if(error?.__status===503){
      return '⚠️ A Vercel ainda não está enxergando GEMINI_API_KEY neste deployment. Confira Environment Variables e faça um novo Redeploy.';
    }

    return '⚠️ A IA real não respondeu. Erro: '+message+(error?.__code?' ['+error.__code+']':'');
  }

  function responseToText(result){
    const spoken=String(result?.spoken||'').trim();
    let next=String(result?.nextQuestion||'').trim();

    // Evita a mesma pergunta duas vezes: uma em spoken e outra em nextQuestion,
    // ou a repetição de uma pergunta recente da conversa.
    if(next && questionLooksRepeated(next,spoken))next='';

    // Conversa livre e Dia a Dia não precisam terminar com pergunta por hábito.
    // A API já decide quando perguntar; aqui apenas removemos duplicações.
    return [spoken,next].filter(Boolean).join('\n\n').trim();
  }

  window.mentor42Send=async function mentor42Send(fromCall=false){
    if(state.conversationEnded){
      if(typeof toast==='function')toast('Esta conversa já foi encerrada. Inicie uma nova conversa para continuar.');
      return;
    }
    const input=document.getElementById('mentor42Input');
    const text=input?.value.trim()||'';
    if(!text){
      if(typeof toast==='function')toast('Fale ou escreva uma situação primeiro.');
      return;
    }
    addTurn('user',text);
    if(input)input.value='';
    window.coach522ClearDraft?.('mentor42Input');
    window.coach522SetVoiceState?.('responding','Mentor respondendo');
    setCallStatus('Mentor pensando na sua resposta...');
    const result=await askDialogue(text);

    if(result?.__error){
      const message=mentor45FriendlyError(result);
      addTurn('assistant',message,{apiError:true,failedUserText:text});
      state.review=null;
      saveActive();
      setCallStatus('A IA não conseguiu responder. Veja o erro na conversa.');
      const live=document.getElementById('mentor44LiveTranscript');
      if(live)live.textContent='Erro de conexão com a IA.';
      window.coach522InteractionComplete?.('mentor');
      window.coach522SetVoiceState?.('error','Falhou — tentar novamente');
      return;
    }

    const full=responseToText(result);
    addTurn('assistant',full,{savePoint:result.savePoint||''});
    state.review=null;
    saveActive();
    setCallStatus('Resposta pronta. O Mentor vai falar agora.');
    const live=document.getElementById('mentor44LiveTranscript');if(live)live.textContent='Mentor respondendo...';
    speak(full,{force:Boolean(state.isCallOpen)});
    if(!fromCall && typeof toast==='function')toast('O Mentor respondeu. Você pode continuar a conversa.');
  };

  window.mentor512RetryLastAI=async function mentor512RetryLastAI(){
    if(state.conversationEnded){
      if(typeof toast==='function')toast('Esta conversa já foi encerrada.');
      return;
    }

    const errorIndex=[...state.turns].map((t,i)=>({t,i})).reverse()
      .find(x=>x.t?.role==='assistant'&&x.t?.apiError)?.i;

    if(errorIndex===undefined){
      if(typeof toast==='function')toast('Não encontrei uma resposta com erro para tentar novamente.');
      return;
    }

    const errorTurn=state.turns[errorIndex];
    const text=String(
      errorTurn.failedUserText ||
      [...state.turns.slice(0,errorIndex)].reverse().find(t=>t.role==='user')?.text ||
      ''
    ).trim();

    if(!text){
      if(typeof toast==='function')toast('Não encontrei sua última fala para reenviar.');
      return;
    }

    state.turns.splice(errorIndex,1);
    saveActive();
    renderChat();
    setCallStatus('Tentando a mesma resposta novamente...');
    const live=document.getElementById('mentor44LiveTranscript');
    if(live)live.textContent='Reenviando sua última mensagem ao Mentor...';

    const result=await askDialogue(text);

    if(result?.__error){
      const message=mentor45FriendlyError(result);
      addTurn('assistant',message,{apiError:true,failedUserText:text});
      setCallStatus('A IA ainda não conseguiu responder. Você pode tentar novamente.');
      if(live)live.textContent='A resposta da IA falhou novamente.';
      return;
    }

    const full=responseToText(result);
    addTurn('assistant',full,{savePoint:result.savePoint||''});
    state.review=null;
    saveActive();
    setCallStatus('Resposta recuperada. O Mentor vai falar agora.');
    if(live)live.textContent='Mentor respondendo...';
    speak(full,{force:Boolean(state.isCallOpen)});
    if(typeof toast==='function')toast('Resposta recuperada sem repetir sua fala.');
  };

  // v5.1.3 — segurança contra interrupção por pausa.
  // O modo automático nunca é carregado de uma conversa anterior.
  let mentor513AutoSession=false;

  // v5.6.1 — Automático assistido:
  // após o Mentor terminar de falar, o microfone reabre sozinho.
  // Pausas NÃO encerram a fala. O treinador toca uma vez para finalizar o turno.
  let mentor561AutoAssistSession=false;
  let mentor561AutoStartTimer=null;
  let mentor561AutoHoldUntil=0;

  function mentor561ClearAutoStart(){
    if(mentor561AutoStartTimer){
      clearTimeout(mentor561AutoStartTimer);
      mentor561AutoStartTimer=null;
    }
  }

  function mentor561NormalizeCommand(value=''){
    return String(value||'')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function mentor561IsEndCommand(value=''){
    const t=mentor561NormalizeCommand(value);
    return /^(quero )?(encerrar|finalizar|terminar|parar) (a )?conversa$/.test(t)
      || /^(encerrar|finalizar|terminar) agora$/.test(t);
  }

  function mentor561UpdateAssistUI(){
    const toggle=document.getElementById('conv561AutoAssist');
    if(toggle)toggle.checked=mentor561AutoAssistSession;
    const badge=document.getElementById('mentor513ManualBadge');
    if(badge){
      badge.classList.toggle('auto',mentor561AutoAssistSession);
      badge.textContent=mentor561AutoAssistSession
        ? '⚡ Automático assistido'
        : '🛡️ Manual protegido';
    }
  }

  window.mentor561SetAutoAssist=function mentor561SetAutoAssist(enabled=true,options={}){
    mentor561AutoAssistSession=Boolean(enabled);
    mentor561ClearAutoStart();
    mentor561UpdateAssistUI();
    if(!options.quiet && state.isCallOpen){
      setCallStatus(mentor561AutoAssistSession
        ? 'Automático assistido ligado. Depois de cada resposta, o microfone abre sozinho; toque em ⏹ apenas quando terminar sua fala.'
        : 'Automático assistido desligado. Toque 🎙 para iniciar cada fala.');
    }
    return mentor561AutoAssistSession;
  };

  window.mentor561HoldAutoAssist=function mentor561HoldAutoAssist(ms=1400){
    mentor561AutoHoldUntil=Math.max(mentor561AutoHoldUntil,Date.now()+Math.max(0,Number(ms)||0));
    mentor561ClearAutoStart();
  };

  function mentor561ScheduleAutoMic(delay=850){
    mentor561ClearAutoStart();
    if(!mentor561AutoAssistSession || !state.isCallOpen || state.conversationEnded)return;
    mentor561AutoStartTimer=setTimeout(()=>{
      mentor561AutoStartTimer=null;
      if(!mentor561AutoAssistSession || !state.isCallOpen || state.conversationEnded)return;
      if(Date.now()<mentor561AutoHoldUntil){
        mentor561ScheduleAutoMic(Math.max(250,mentor561AutoHoldUntil-Date.now()+80));
        return;
      }
      if(mentor481Recording || mentor481Processing || mentor44Listening)return;
      if(window.speechSynthesis && (speechSynthesis.speaking||speechSynthesis.paused)){
        mentor561ScheduleAutoMic(400);
        return;
      }
      setCallStatus('Sua vez. Abrindo o microfone automaticamente...');
      mentor481StartPushToTalk(true);
    },Math.max(100,Number(delay)||850));
  }
  window.mentor561ScheduleAutoMic=mentor561ScheduleAutoMic;

  window.mentor561EndConversation=async function mentor561EndConversation(){
    if(state.conversationEnded){
      try{window.mentor42EndCall?.();}catch{}
      return;
    }
    mentor561AutoAssistSession=false;
    mentor561ClearAutoStart();
    mentor561UpdateAssistUI();
    try{mentor481CancelPushToTalk();}catch{}
    try{speechSynthesis?.cancel();}catch{}
    setCallStatus('Encerrando a conversa, preparando o resumo e salvando...');
    try{
      await window.mentor49PrepareEndConversation?.(true);
      await window.mentor49ConfirmEndConversation?.();
      setTimeout(()=>window.mentor42EndCall?.(),350);
    }catch(error){
      console.info('Falha ao encerrar automaticamente:',error);
      setCallStatus('Não consegui finalizar automaticamente. Use Encerrar novamente.');
    }
  };

  function mentor513ApplyProtectedManualMode(message=true){
    mentor513AutoSession=false;
    state.autoConversation=false;

    const auto=document.getElementById('mentor44AutoConversation');
    if(auto)auto.checked=false;

    const badge=document.getElementById('mentor513ManualBadge');
    if(badge){
      badge.classList.remove('auto');
      badge.textContent='🛡️ Modo manual protegido';
    }

    if(message){
      setCallStatus('Modo manual protegido. Toque 🎙 para começar e ⏹ somente quando você terminar.');
    }
  }

  let mentor44Recognition=null;
  let mentor44Listening=false;
  let mentor44ShouldAutoSend=true;
  let mentor44LastTranscript='';

  // v4.8.1 — push-to-talk manual.
  // O áudio NÃO é enviado ao Mentor ao detectar uma pausa.
  // Primeiro toque: começa a gravação.
  // Segundo toque: finaliza, transcreve e só então envia.
  let mentor481Recorder=null;
  let mentor481Stream=null;
  let mentor481Chunks=[];
  let mentor481Recording=false;
  let mentor481Processing=false;
  let mentor481StartedAt=0;
  let mentor481Timer=null;
  let mentor481AutoSend=true;
  let mentor481CancelRequested=false;

  // v5.1.1 — preserva a última gravação se a transcrição falhar.
  let mentor511LastAudioBlob=null;
  let mentor511LastAutoSend=true;
  let mentor511Retrying=false;
  let mentor522LastPersistAt=0;

  function mentor481PreferredMime(){
    const types=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
    try{
      return types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t))||'';
    }catch{return '';}
  }

  function mentor481Time(seconds){
    const value=Math.max(0,Number(seconds)||0);
    const min=Math.floor(value/60);
    const sec=value%60;
    return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  function mentor481SetMicUI(mode='idle'){
    const main=document.getElementById('mentor481MainMicBtn');
    const mic=document.getElementById('mentor42BigMic');

    if(main){
      main.disabled=mode==='processing';
      main.textContent=mode==='recording'
        ? '⏹ Finalizar minha fala e enviar'
        : mode==='processing'
          ? '⏳ Transcrevendo minha fala...'
          : '🎙 Iniciar minha fala';
      main.classList.toggle('mentor481-recording',mode==='recording');
    }

    if(mic){
      mic.disabled=mode==='processing';
      mic.innerHTML=mode==='recording'?'⏹':mode==='processing'?'…':'🎙';
      mic.classList.toggle('listening',mode==='recording');
      mic.classList.toggle('processing',mode==='processing');
      mic.setAttribute('aria-label',
        mode==='recording'
          ? 'Finalizar minha fala e enviar'
          : mode==='processing'
            ? 'Transcrevendo minha fala'
            : 'Iniciar minha fala'
      );
      mic.title=mode==='recording'
        ? 'Toque somente quando terminar sua fala'
        : 'Toque para começar a falar';
    }

    const label=document.getElementById('mentor513MicLabel');
    if(label){
      label.textContent=mode==='recording'
        ? 'Finalizar e enviar'
        : mode==='processing'
          ? 'Transcrevendo...'
          : 'Iniciar fala';
      label.classList.toggle('recording',mode==='recording');
    }
  }

  function mentor481StopTracks(){
    if(mentor481Stream){
      mentor481Stream.getTracks().forEach(track=>track.stop());
      mentor481Stream=null;
    }
  }

  function mentor481ClearTimer(){
    if(mentor481Timer){
      clearInterval(mentor481Timer);
      mentor481Timer=null;
    }
  }

  function mentor481CancelPushToTalk(){
    mentor481CancelRequested=true;
    window.coach522ClearRecording?.('mentor');
    window.coach522InteractionComplete?.('mentor');
    window.coach522SetVoiceState?.('ready','Pronto para falar');
    mentor481ClearTimer();
    try{
      if(mentor481Recorder&&mentor481Recorder.state==='recording'){
        mentor481Recorder.onstop=null;
        mentor481Recorder.stop();
      }
    }catch{}
    mentor481StopTracks();
    mentor481Recorder=null;
    mentor481Chunks=[];
    mentor481Recording=false;
    mentor481Processing=false;
    mentor481SetMicUI('idle');
  }

  function mentor511ShowRetry(show){
    ['mentor511RetryMain','mentor511RetryCall'].forEach(id=>{
      const el=document.getElementById(id);
      if(el)el.classList.toggle('hidden',!show);
    });
  }

  async function mentor511TranscribeBlob(blob){
    if(!blob?.size)throw new Error('A gravação ficou vazia.');

    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),45000);
    try{
      const response=await fetch('/api/transcribe?lang=pt-BR',{
        method:'POST',
        headers:{'Content-Type':blob.type||'application/octet-stream'},
        body:blob,
        signal:controller.signal
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok||!String(payload.text||'').trim()){
        const error=new Error(payload.error||'Não foi possível transcrever a fala.');
        error.detail=payload.detail||'';
        throw error;
      }
      return String(payload.text).trim();
    }finally{
      clearTimeout(timeout);
    }
  }

  async function mentor511DeliverTranscript(text,autoSend){
    const input=document.getElementById('mentor42Input');
    const live=document.getElementById('mentor44LiveTranscript');
    if(input)input.value=text;

    mentor481Processing=false;
    mentor481SetMicUI('idle');
    mentor511ShowRetry(false);
    mentor511LastAudioBlob=null;
    window.coach522ClearRecording?.('mentor');

    if(mentor561IsEndCommand(text)){
      if(input)input.value='';
      if(live)live.textContent='✓ Comando recebido: encerrar conversa.';
      await window.mentor561EndConversation?.();
      return;
    }

    const suspicious=mentor512TranscriptLooksSuspicious(text);
    if(suspicious){
      if(live)live.textContent='A transcrição parece ter repetido trechos. Revise o texto antes de enviar.';
      setCallStatus('Detectei repetição anormal na transcrição. Revise o texto e toque em Enviar; não vou mandar automaticamente.');
      if(typeof toast==='function')toast('A transcrição parece repetitiva. Revise antes de enviar.');
      input?.focus();
      window.coach522InteractionComplete?.('mentor');
      window.coach522SetVoiceState?.('ready','Pronto para falar');
      return;
    }

    if(live)live.textContent=`Entendi sua fala completa: ${text}`;

    if(autoSend){
      window.coach522SetVoiceState?.('responding','Mentor respondendo');
      setCallStatus('Fala completa recebida. Agora o Mentor vai responder...');
      await mentor42Send(true);
    }else{
      window.coach522InteractionComplete?.('mentor');
      window.coach522SetVoiceState?.('ready','Pronto para falar');
      setCallStatus('Fala completa recebida. Revise o texto e toque em Enviar quando quiser.');
    }
  }

  window.mentor511RetryTranscription=async function mentor511RetryTranscription(){
    if(mentor511Retrying||!mentor511LastAudioBlob?.size){
      if(typeof toast==='function')toast('Não há uma gravação pendente para reenviar.');
      return;
    }

    mentor511Retrying=true;
    mentor481Processing=true;
    mentor481SetMicUI('processing');
    mentor511ShowRetry(false);

    const live=document.getElementById('mentor44LiveTranscript');
    if(live)live.textContent='⏳ Tentando transcrever a mesma gravação novamente...';
    setCallStatus('Reenviando a gravação. Você não precisa falar de novo.');

    try{
      const text=await mentor511TranscribeBlob(mentor511LastAudioBlob);
      await mentor511DeliverTranscript(text,mentor511LastAutoSend);
    }catch(error){
      console.info('Mentor retry transcription error:',error);
      mentor481Processing=false;
      mentor481SetMicUI('idle');
      mentor511ShowRetry(true);
      setCallStatus('Ainda não consegui transcrever. O áudio continua preservado para outra tentativa.');
      if(live)live.textContent='Áudio preservado. Tente novamente ou escreva a mensagem.';
      if(typeof toast==='function')toast('O áudio continua salvo. Você pode tentar transcrever novamente.');
    }finally{
      mentor511Retrying=false;
    }
  };

  async function mentor481FinalizeRecording(){
    mentor481ClearTimer();
    mentor481Recording=false;

    if(mentor481CancelRequested){
      mentor481StopTracks();
      mentor481Recorder=null;
      mentor481Chunks=[];
      mentor481Processing=false;
      mentor481SetMicUI('idle');
      return;
    }

    mentor481Processing=true;
    mentor481SetMicUI('processing');
    setCallStatus('Fala finalizada. Transcrevendo antes de enviar ao Mentor...');
    const live=document.getElementById('mentor44LiveTranscript');
    if(live){
      live.classList.remove('listening');
      live.textContent='⏳ Transcrevendo sua fala completa...';
    }

    const mime=mentor481Recorder?.mimeType||mentor481Chunks[0]?.type||'audio/webm';
    const blob=new Blob(mentor481Chunks,{type:mime});
    try{
      await window.coach522PersistRecordingBlob?.('mentor',blob,{label:'Conversa com o Mentor',lang:'pt-BR',page:'mentor'});
    }catch{}
    window.coach522SetVoiceState?.('transcribing','Transcrevendo sua fala');
    mentor481StopTracks();
    mentor481Recorder=null;
    mentor481Chunks=[];

    mentor511LastAudioBlob=blob;
    mentor511LastAutoSend=mentor481AutoSend;
    mentor511ShowRetry(false);

    try{
      const text=await mentor511TranscribeBlob(blob);
      await mentor511DeliverTranscript(text,mentor481AutoSend);
    }catch(error){
      console.info('Push-to-talk transcription error:',error);
      mentor481Processing=false;
      mentor481SetMicUI('idle');
      mentor511ShowRetry(true);
      window.coach522RecordingFailed?.('mentor');
      window.coach522SetVoiceState?.('error','Falhou — áudio preservado');
      setCallStatus('O áudio foi preservado. Toque em “Tentar transcrever novamente” sem precisar repetir sua fala.');
      if(live)live.textContent='Áudio preservado. A transcrição falhou, mas você pode reenviar a mesma gravação.';
      if(typeof toast==='function')toast('Não perdi seu áudio. Toque em “Tentar transcrever novamente”.');
    }
  }

  async function mentor481StartPushToTalk(autoSend=true){
    mentor561ClearAutoStart();
    // Um toque manual sempre assume controle total do turno.
    // Nenhuma pausa pode enviar a mensagem.
    if(mentor513AutoSession){
      mentor513ApplyProtectedManualMode(false);
    }

    if(state.conversationEnded){
      if(typeof toast==='function')toast('Esta conversa já foi encerrada. Toque em Nova conversa para falar novamente.');
      return;
    }
    if(mentor481Processing)return;

    if(mentor481Recording){
      setCallStatus('Finalizando sua fala...');
      try{
        if(mentor481Recorder?.state==='recording')mentor481Recorder.stop();
      }catch{
        await mentor481FinalizeRecording();
      }
      return;
    }

    // Não deixa a voz do próprio Mentor entrar na gravação.
    try{speechSynthesis?.cancel();}catch{}
    mentor43SetSpeaking(false);

    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      // Navegadores sem MediaRecorder mantêm o reconhecimento antigo como alternativa.
      mentor44StartListening(autoSend);
      return;
    }

    mentor481AutoSend=autoSend;
    mentor481CancelRequested=false;
    mentor481Chunks=[];
    mentor511LastAudioBlob=null;
    mentor511ShowRetry(false);

    const live=document.getElementById('mentor44LiveTranscript');
    try{
      setCallStatus('Abrindo microfone...');
      mentor481Stream=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
      });

      const mime=mentor481PreferredMime();
      try{
        mentor481Recorder=new MediaRecorder(
          mentor481Stream,
          mime?{mimeType:mime,audioBitsPerSecond:64000}:{audioBitsPerSecond:64000}
        );
      }catch{
        mentor481Recorder=new MediaRecorder(mentor481Stream,mime?{mimeType:mime}:{});
      }
      mentor481Recorder.ondataavailable=e=>{
        if(e.data&&e.data.size){
          mentor481Chunks.push(e.data);
          const now=Date.now();
          if(now-mentor522LastPersistAt>4000){
            mentor522LastPersistAt=now;
            try{
              const draftBlob=new Blob(mentor481Chunks,{type:mentor481Recorder?.mimeType||e.data.type||'audio/webm'});
              window.coach522PersistRecordingBlob?.('mentor',draftBlob,{
                label:'Conversa com o Mentor',
                lang:'pt-BR',
                page:'mentor'
              });
            }catch{}
          }
        }
      };
      mentor481Recorder.onstop=mentor481FinalizeRecording;
      mentor481Recorder.onerror=()=>{
        setCallStatus('A gravação do microfone falhou. Toque novamente para tentar.');
        mentor481CancelPushToTalk();
      };

      mentor481Recorder.start(750);
      mentor522LastPersistAt=0;
      window.coach522RecordingStarted?.('mentor',{label:'Conversa com o Mentor',lang:'pt-BR',page:'mentor'});
      window.coach522SetVoiceState?.('recording','Gravando — toque para finalizar');
      mentor481Recording=true;
      mentor481StartedAt=Date.now();
      mentor481SetMicUI('recording');

      if(live){
        live.classList.add('listening');
        live.textContent=mentor561AutoAssistSession
          ? '🔴 Estou ouvindo. Pode fazer pausas. Toque em ⏹ quando terminar; depois envio e resposta são automáticos.'
          : '🔴 Estou ouvindo. Fale com calma; suas pausas NÃO enviam a mensagem.';
      }
      setCallStatus(mentor561AutoAssistSession
        ? 'Estou ouvindo. Pode pensar e fazer pausas. Toque em ⏹ Enviar fala quando terminar.'
        : 'Estou ouvindo. Pode pensar e fazer pausas. Nada será enviado até você tocar em ⏹ Finalizar.');

      mentor481Timer=setInterval(()=>{
        const elapsed=Math.floor((Date.now()-mentor481StartedAt)/1000);
        if(live){
          live.textContent=`🔴 Gravando ${mentor481Time(elapsed)} · Pode pausar e continuar. Só o botão ⏹ encerra sua fala.`;
        }
        // Limite de segurança de 3 minutos, muito acima de uma resposta normal.
        if(elapsed>=180 && mentor481Recording){
          setCallStatus('3 minutos de gravação atingidos. Finalizando para transcrever...');
          try{mentor481Recorder.stop();}catch{}
        }
      },500);
    }catch(error){
      console.info('Push-to-talk unavailable:',error);
      mentor481StopTracks();
      mentor481Recording=false;
      mentor481SetMicUI('idle');

      const name=String(error?.name||'');
      if(name==='NotAllowedError'||name==='PermissionDeniedError'){
        setCallStatus('O microfone foi bloqueado. Nas permissões do site, selecione Microfone → Permitir.');
        if(live)live.textContent='Microfone bloqueado pelo navegador.';
      }else{
        setCallStatus('Não consegui abrir a gravação manual. Tentando reconhecimento de fala...');
        mentor44StartListening(autoSend);
      }
    }
  }

  window.mentor522RecoverAudioBlob=function mentor522RecoverAudioBlob(blob,meta={}){
    if(!blob?.size)return;
    mentor511LastAudioBlob=blob;
    mentor511LastAutoSend=true;
    mentor511ShowRetry(true);
    window.coach522SetVoiceState?.('error','Gravação recuperada — transcrever');
    setCallStatus('Recuperamos uma gravação interrompida. Toque em “Tentar transcrever novamente”.');
    const live=document.getElementById('mentor44LiveTranscript');
    if(live)live.textContent='✓ Áudio recuperado. Você não precisa falar de novo.';
  };

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden' && mentor481Recording && mentor481Chunks.length){
      try{
        const blob=new Blob(mentor481Chunks,{type:mentor481Recorder?.mimeType||mentor481Chunks[0]?.type||'audio/webm'});
        window.coach522PersistRecordingBlob?.('mentor',blob,{label:'Conversa com o Mentor',lang:'pt-BR',page:'mentor'});
      }catch{}
    }
  });

  window.mentor42Capture=function mentor42Capture(autoSend=false){
    mentor481StartPushToTalk(autoSend);
  };

  // Modo automático antigo permanece disponível apenas como opção.
  function mentor44StartListening(autoSend=true){
    if(mentor44Listening){
      try{mentor44Recognition?.stop();}catch{}
      return;
    }

    try{speechSynthesis?.cancel();}catch{}
    mentor43SetSpeaking(false);

    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){
      mentor44FallbackVoiceCapture(autoSend);
      return;
    }

    mentor44ShouldAutoSend=autoSend;
    mentor44LastTranscript='';
    const input=document.getElementById('mentor42Input');
    const live=document.getElementById('mentor44LiveTranscript');
    const mic=document.getElementById('mentor42BigMic');

    try{
      mentor44Recognition=new Recognition();
      mentor44Recognition.lang='pt-BR';
      mentor44Recognition.continuous=false;
      mentor44Recognition.interimResults=true;
      mentor44Recognition.maxAlternatives=1;

      mentor44Recognition.onstart=()=>{
        mentor44Listening=true;
        if(mic){mic.classList.add('listening');mic.classList.remove('processing');}
        if(live){live.classList.add('listening');live.textContent='Modo automático ouvindo...';}
        setCallStatus('Modo automático ouvindo...');
      };

      mentor44Recognition.onresult=(event)=>{
        let finalText='', interimText='';
        for(let i=0;i<event.results.length;i++){
          const text=event.results[i][0]?.transcript||'';
          if(event.results[i].isFinal)finalText+=(finalText?' ':'')+text;
          else interimText+=(interimText?' ':'')+text;
        }
        mentor44LastTranscript=(finalText||interimText).trim();
        if(live)live.textContent=mentor44LastTranscript||'Ouvindo...';
      };

      mentor44Recognition.onerror=(event)=>{
        const err=event?.error||'unknown';
        if(err==='aborted')return;
        if(err==='not-allowed'||err==='service-not-allowed'){
          setCallStatus('O navegador bloqueou o reconhecimento de fala.');
          if(live)live.textContent='Reconhecimento bloqueado.';
        }else if(err==='no-speech'){
          setCallStatus('Não ouvi uma frase. Toque no microfone e tente novamente.');
        }else{
          setCallStatus(`Reconhecimento automático falhou (${err}).`);
        }
      };

      mentor44Recognition.onend=async ()=>{
        mentor44Listening=false;
        if(mic)mic.classList.remove('listening');
        if(live)live.classList.remove('listening');
        const text=(mentor44LastTranscript||'').trim();
        if(text){
          if(input)input.value=text;
          if(live)live.textContent=`Entendi: ${text}`;
          if(autoSend){
            setCallStatus('Modo automático detectou o fim da fala. Enviando...');
            if(mic)mic.classList.add('processing');
            await mentor42Send(true);
            if(mic)mic.classList.remove('processing');
          }
        }
      };

      mentor44Recognition.start();
    }catch(error){
      console.info('Mentor recognition fallback:',error);
      mentor44Listening=false;
      if(mic)mic.classList.remove('listening');
      mentor44FallbackVoiceCapture(autoSend);
    }
  }

  function mentor44FallbackVoiceCapture(autoSend=true){
    if(typeof startUniversalVoiceCapture!=='function'){
      setCallStatus('Este navegador não oferece captura de voz. Você pode digitar e enviar normalmente.');
      return;
    }
    setCallStatus('Abrindo gravação manual...');
    startUniversalVoiceCapture({
      lang:'pt-BR',
      maxSeconds:180,
      label:'Falar com o Mentor — toque em Parar quando terminar',
      onText:async text=>{
        const input=document.getElementById('mentor42Input');
        const live=document.getElementById('mentor44LiveTranscript');
        if(input)input.value=text;
        if(live)live.textContent=`Entendi sua fala completa: ${text}`;
        if(autoSend)await mentor42Send(true);
      }
    });
  }

  window.mentor42CaptureCriticism=function mentor42CaptureCriticism(){
    if(typeof startUniversalVoiceCapture!=='function')return;
    startUniversalVoiceCapture({
      lang:'pt-BR',maxSeconds:60,label:'Contar uma crítica',
      onText:text=>{const el=document.getElementById('mentor42CriticismInput');if(el)el.value=text;}
    });
  };

  window.mentor42Quick=function mentor42Quick(mode){
    setMode(mode);
    state.specialContext='';
    const prompts={
      free:'Fale comigo normalmente. Pode contar um fato, uma dúvida, uma ideia ou simplesmente começar a conversar.',
      daylife:'Pode falar do seu dia normalmente: horários, prioridades, estudo, viagem, cansaço ou qualquer outra coisa.',
      mentor:'Conte a situação e também o que você está pensando em fazer.',
      questions:'Conte o problema. Eu vou trabalhar apenas com perguntas, uma de cada vez.',
      simulation:'Descreva a conversa que quer simular e escolha quem a IA deve interpretar.',
      avoid:'Qual conversa você está evitando? Diga com quem é, o que aconteceu e o que torna essa conversa difícil.',
      challenge:'Qual decisão você quer que eu questione? Explique o fato e o seu critério.',
      decide:'Qual decisão precisa ser tomada agora? Conte as opções e o que está pesando para você.',
      proscons:'Quais opções você quer comparar? Eu vou organizar benefícios, riscos e o que ainda falta saber.',
      hardtalk:'Com quem é a conversa difícil e o que precisa ficar claro ao final?',
      unhappy:'O que o jogador disse ou fez de forma concreta? Vamos preparar a conversa sem presumir o que ele sente.',
      captainmode:'Qual assunto você precisa alinhar com o capitão?',
      five:'O que vai acontecer nos próximos minutos? Diga se é treino, reunião, vestiário, diretoria ou imprensa.',
      pretraining:'Qual é o foco do treino de hoje e o que você quer que a equipe reconheça logo no início?',
      pregame:'Qual é o contexto do jogo e a ideia que não pode se perder quando a partida apertar?',
      boardmeeting:'O que você precisa alinhar ou decidir com a diretoria?',
      pressprep:'Qual pergunta da imprensa você mais espera receber?',
      organize:'Conte tudo. Eu vou apenas separar fato, interpretação, decisão e pendência, sem tentar resolver.',
      unload:'Pode falar livremente. Eu vou ajudar a organizar sem tentar resolver tudo de uma vez.',
      reflectday:'Como foi seu dia? Comece pelo momento que mais ficou na sua cabeça.',
      improve:'Qual situação de hoje você gostaria de repetir de outra forma?',
      closeday:'Conte o que ainda precisa entrar no registro de hoje antes de salvarmos o dia.'
    };
    const input=document.getElementById('mentor42Input');
    if(input){input.value='';input.placeholder=prompts[mode]||prompts.free;}
    const chat=document.getElementById('mentor42Chat');
    chat?.scrollIntoView({behavior:'smooth',block:'center'});
    if(typeof toast==='function')toast(modeLabels[mode]+' ativado.');
  };

  window.mentor42StartCall=function mentor42StartCall(mode){
    if(state.conversationEnded)window.mentor47NewConversation(true);
    mentor513ApplyProtectedManualMode(false);
    mentor461PrimeSpeech();
    if(mode)setMode(mode);
    document.getElementById('mentor42CallOverlay')?.classList.remove('hidden');
    state.isCallOpen=true;if(!state.callMode)state.callMode='voice';
    saveActive();renderChat();mentor43ApplyCallMode();
    setCallStatus(state.callMode==='video'
      ?'Videochamada pronta. Modo manual protegido: toque 🎙 para falar e ⏹ quando terminar.'
      :'Modo manual protegido: toque 🎙 para começar; pausas não encerram sua fala.');
    const greeting=callGreeting();
    if(state.turns.length===0){
      addTurn('assistant',greeting);
      speak(greeting,{force:true});
    }else if(mentor561AutoAssistSession){
      mentor561ScheduleAutoMic(650);
    }
  };

  function callGreeting(){
    if(state.specialContext && state.contextSourceDay){
      return `Contexto escolhido carregado. Podemos continuar a partir dele sem repetir tudo. O que você quer me contar agora?`;
    }
    if(state.mode==='free')return 'Estou aqui. Pode falar comigo normalmente. O que está passando pela sua cabeça agora?';
    return `Estou aqui no modo ${modeLabels[state.mode]}. ${modeHints[state.mode]} Pode começar.`;
  }

  window.mentor42EndCall=function mentor42EndCall(){
    mentor561AutoAssistSession=false;
    mentor561ClearAutoStart();
    mentor561UpdateAssistUI();
    mentor513ApplyProtectedManualMode(false);
    mentor481CancelPushToTalk();
    document.getElementById('mentor42CallOverlay')?.classList.add('hidden');
    state.isCallOpen=false;saveActive();mentor42StopVoice();mentor43StopCamera();
  };

  function localReview(answer){
    return {
      didWell:'Você colocou sua posição de forma direta.',
      improve:'Inclua uma pergunta de escuta antes de explicar todo o critério.',
      retryPrompt:'Tente novamente em menos palavras: ouça, diga o critério em uma frase e deixe um próximo passo.',
      model:'Eu quero primeiro entender como você está vendo a situação. Depois eu te explico o critério da decisão de hoje e o que eu preciso ver daqui para frente.'
    };
  }

  window.mentor42ReviewLastAnswer=async function mentor42ReviewLastAnswer(){
    const answer=lastUserText();
    if(!answer){if(typeof toast==='function')toast('Ainda não existe uma resposta sua para corrigir.');return;}
    const local=localReview(answer);
    const ai=typeof callCoachAI==='function'
      ? await callCoachAI('mentor-review-answer',{
          mode:state.mode,
          answer,
          previousPrompt:lastAssistantText(),
          history:compactHistory(),
          local
        })
      : {};
    state.review={...local,...ai};
    saveActive();
    const box=document.getElementById('mentor42Review');
    if(box){
      box.classList.remove('hidden');
      box.innerHTML=`
        <div class="mentor42-result-section"><h4>Você fez bem</h4><p>${esc(state.review.didWell||'')}</p></div>
        <div class="mentor42-result-section"><h4>Melhore agora</h4><p>${esc(state.review.improve||'')}</p></div>
        <div class="mentor42-result-section"><h4>Refaça desta forma</h4><p>${esc(state.review.retryPrompt||'')}</p></div>
        <div class="mentor42-result-section"><h4>Uma alternativa do Mentor</h4><p>${esc(state.review.model||'')}</p></div>`;
    }
    speak(`Uma melhoria por vez. ${state.review.improve||''} ${state.review.retryPrompt||''}`);
  };

  window.mentor42Retry=function mentor42Retry(){
    const input=document.getElementById('mentor42Input');
    if(!input)return;
    input.value='';
    input.placeholder=state.review?.retryPrompt||'Refaça sua resposta tentando ser mais claro e breve.';
    input.focus();
    if(typeof toast==='function')toast('Pronto para uma nova tentativa.');
  };

  window.mentor42HearModel=function mentor42HearModel(){
    const model=state.review?.model;
    if(!model){
      if(typeof toast==='function')toast('Use “Corrigir minha resposta” primeiro.');
      return;
    }
    if(typeof speakText==='function')speakText(model,'pt-BR',.84);
  };


  function closureLocalFallback(){
    const last=lastUserText();
    return {
      spoken:last
        ? 'Entendi. Vou fechar esta conversa sem abrir outra pergunta. O que você trouxe ficou registrado; agora você pode encerrar e salvar o dia.'
        : 'Podemos encerrar por aqui. O conteúdo da conversa pode ser salvo no registro de hoje.',
      summary:last?`Tema final: ${last.slice(0,220)}`:'Conversa com o Mentor.',
      decision:'',
      pending:'',
      nextStep:''
    };
  }

  async function requestConversationConclusion(purpose='conclude'){
    const local=closureLocalFallback();
    if(typeof callCoachAI!=='function')return {...local,__error:true,__message:'IA indisponível'};
    const result=await callCoachAI('mentor-conclusion',{
      purpose,
      dialogueMode:state.mode,
      history:compactHistory(),
      transcript:transcriptForSummary(state.turns),
      todayEarlierContext:earlierTodayContext(),
      specialContext:state.specialContext||'',
      coachProfile:profileText()
    });
    if(result?.__error)return {...local,__error:true,__message:result.__message||'Não foi possível gerar o fechamento.'};
    return {
      spoken:String(result.spoken||local.spoken).trim(),
      summary:String(result.summary||'').trim(),
      decision:String(result.decision||'').trim(),
      pending:String(result.pending||'').trim(),
      nextStep:String(result.nextStep||'').trim()
    };
  }

  function closureSection(label,value){
    const text=String(value||'').trim();
    return text?`<div class="mentor49-close-row"><strong>${esc(label)}</strong><p>${formatMentorText(text)}</p></div>`:'';
  }

  function closureHtml(){
    const c=state.closureDraft;
    if(!c)return '';
    if(c.stage==='loading'){
      return `<div class="mentor49-close-card">
        <strong>Fechando a conversa...</strong>
        <p>Estou organizando uma conclusão curta, sem abrir novas perguntas.</p>
      </div>`;
    }
    if(c.stage==='ended'){
      const linked=state.dashboardTaskId?`
        <div class="mentor51-dashboard-link">
          <strong>✅ Tarefa vinculada ao Dashboard</strong>
          <p>${esc(state.dashboardTaskTitle||'Tarefa do dia')}</p>
          <div class="mentor49-close-actions">
            ${state.dashboardTaskCompleted
              ? '<span class="mentor51-completed">✓ Marcada como concluída</span>'
              : '<button class="secondary" onclick="mentor51CompleteLinkedTask()">✓ Marcar tarefa como concluída</button>'}
            <button class="outline" onclick="mentor51ReturnDashboard()">↩ Dashboard</button>
          </div>
        </div>`:'';
      const agendaLinked=state.agendaEventId?`
        <div class="mentor51-dashboard-link">
          <strong>🗓 Compromisso vinculado à agenda</strong>
          <p>${esc(state.agendaEventTitle||'Compromisso')}</p>
          <div class="mentor49-close-actions">
            <button class="outline" onclick="mentor51ReturnDashboard()">↩ Voltar para Hoje</button>
          </div>
        </div>`:'';
      const pendingAction=c.pending?`
        <div class="mentor51-pending-action">
          ${c.pendingAdded
            ? '<span>✓ Pendência adicionada ao Dashboard de amanhã</span>'
            : '<button class="outline" onclick="mentor51AddPendingTomorrow()">＋ Adicionar pendência ao Dashboard de amanhã</button>'}
        </div>`:'';
      return `<div class="mentor49-close-card ended">
        <span class="mentor49-close-badge">✓ CONVERSA ENCERRADA E SALVA</span>
        ${closureSection('Fechamento',c.spoken)}
        ${closureSection('Decisão',c.decision)}
        ${closureSection('Pendente',c.pending)}
        ${closureSection('Próximo passo',c.nextStep)}
        ${linked}
        ${agendaLinked}
        ${pendingAction}
        <button class="primary" onclick="mentor47NewConversation()">＋ Nova conversa</button>
      </div>`;
    }
    return `<div class="mentor49-close-card">
      <span class="mentor49-close-badge">ENCERRAR CONVERSA</span>
      ${c.__error?`<p class="mentor49-close-warning">Não consegui gerar o fechamento com IA, mas você ainda pode encerrar e salvar a conversa.</p>`:''}
      ${closureSection('Fechamento',c.spoken)}
      ${closureSection('Decisão',c.decision)}
      ${closureSection('Pendente',c.pending)}
      ${closureSection('Próximo passo',c.nextStep)}
      <div class="mentor49-close-actions">
        <button class="primary" onclick="mentor49ConfirmEndConversation()">💾 Encerrar e salvar</button>
        <button class="outline" onclick="mentor49CancelEndConversation()">↩ Continuar conversa</button>
      </div>
    </div>`;
  }

  function renderClosurePanel(){
    const html=closureHtml();
    ['mentor49ClosurePanel','mentor49CallClosurePanel'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      el.innerHTML=html;
      el.classList.toggle('hidden',!html);
    });
  }

  function applyConversationEndedState(){
    const ended=Boolean(state.conversationEnded);
    const input=document.getElementById('mentor42Input');
    const send=document.getElementById('mentor49SendBtn');
    const mic=document.getElementById('mentor481MainMicBtn');
    const bigMic=document.getElementById('mentor42BigMic');
    if(input){
      input.disabled=ended;
      if(ended)input.placeholder='Conversa encerrada. Inicie uma nova conversa para continuar.';
    }
    if(send)send.disabled=ended;
    if(mic)mic.disabled=ended;
    if(bigMic)bigMic.disabled=ended;
  }

  window.mentor49Conclude=async function mentor49Conclude(fromCall=false){
    if(state.conversationEnded){
      if(typeof toast==='function')toast('Esta conversa já foi encerrada.');
      return;
    }
    if(!state.turns.some(t=>t.role==='user')){
      if(typeof toast==='function')toast('Conte alguma coisa antes de pedir uma conclusão.');
      return;
    }
    setCallStatus('Organizando uma conclusão sem novas perguntas...');
    const result=await requestConversationConclusion('conclude');
    if(result.__error){
      const message='Não consegui gerar a conclusão com a IA agora. A conversa continua aberta.';
      if(typeof toast==='function')toast(message);
      setCallStatus(message);
      return;
    }
    const text=[result.spoken,result.decision?`Decisão: ${result.decision}`:'',result.nextStep?`Próximo passo: ${result.nextStep}`:'']
      .filter(Boolean).join('\n\n');
    addTurn('assistant',text,{conclusion:true});
    setCallStatus('Conclusão pronta. Você pode continuar ou encerrar a conversa.');
    speak(text,{force:Boolean(state.isCallOpen)});
    if(!fromCall && typeof toast==='function')toast('Conclusão pronta. Sem abrir outra pergunta.');
  };

  window.mentor49PrepareEndConversation=async function mentor49PrepareEndConversation(fromCall=false){
    if(state.conversationEnded){
      if(typeof toast==='function')toast('Esta conversa já foi encerrada e salva.');
      return;
    }
    if(!state.turns.some(t=>t.role==='user')){
      if(typeof toast==='function')toast('Ainda não há conversa sua para encerrar.');
      return;
    }
    try{mentor481CancelPushToTalk();}catch{}
    try{speechSynthesis?.cancel();}catch{}
    state.closureDraft={stage:'loading'};
    saveActive();
    renderClosurePanel();
    setCallStatus('Preparando o fechamento...');
    const result=await requestConversationConclusion('end');
    state.closureDraft={...result,stage:'review'};
    saveActive();
    renderClosurePanel();
    setCallStatus('Fechamento pronto. Toque em Encerrar e salvar ou continue a conversa.');
  };

  window.mentor49CancelEndConversation=function mentor49CancelEndConversation(){
    state.closureDraft=null;
    saveActive();
    renderClosurePanel();
    setCallStatus('Conversa aberta. Pode continuar normalmente.');
  };

  window.mentor49ConfirmEndConversation=async function mentor49ConfirmEndConversation(){
    if(state.conversationEnded)return;
    const draft=state.closureDraft && state.closureDraft.stage!=='loading'
      ? state.closureDraft
      : await requestConversationConclusion('end');

    // O fechamento entra na conversa uma única vez.
    if(draft?.spoken && phraseSimilarity(lastAssistantText(),draft.spoken)<0.75){
      addTurn('assistant',draft.spoken,{closure:true});
    }

    state.conversationEnded=true;
    state.closureDraft={...draft,stage:'ended'};
    saveActive();
    renderChat();
    applyConversationEndedState();

    try{
      await window.mentor47SaveDay(false);
    }catch(error){
      console.info('Falha ao salvar o dia após encerrar:',error);
    }

    if(state.dashboardTaskId && typeof window.dashboardSaveMentorOutcome==='function'){
      try{window.dashboardSaveMentorOutcome(state.dashboardTaskId,draft);}catch(error){console.info('Falha ao vincular resumo ao Dashboard:',error);}
    }
    if(state.agendaEventId && typeof window.today52SaveMentorEventOutcome==='function'){
      try{window.today52SaveMentorEventOutcome(state.agendaEventId,draft);}catch(error){console.info('Falha ao vincular resumo à Agenda:',error);}
    }

    state.closureDraft={...draft,stage:'ended'};
    saveActive();
    renderClosurePanel();
    applyConversationEndedState();
    setCallStatus('Conversa encerrada e salva. Quando quiser, inicie uma nova conversa.');
    if(typeof toast==='function')toast('Conversa encerrada e dia salvo.');
  };

  function localClose(){
    const user=lastUserText();
    return {
      summary:user?`Situação trabalhada: ${user.slice(0,220)}`:'Conversa de desenvolvimento com o Mentor.',
      learning:'Manter fato, critério, escuta e próximo passo separados.',
      nextAction:'Revisar se existe uma conversa ou decisão que precisa de acompanhamento.',
      carryForward:'Na próxima conversa, verificar o que aconteceu depois desta decisão.'
    };
  }

  window.mentor42SaveSession=async function mentor42SaveSession(fromCall=false){
    return window.mentor47SaveDay(fromCall);
  };

  window.mentor42ClearConversation=function mentor42ClearConversation(){
    return window.mentor47NewConversation();
  };


  function normalizeList(value){
    return Array.isArray(value)?value.map(x=>String(x||'').trim()).filter(Boolean).slice(0,10):[];
  }

  function normalizePeople(value){
    return Array.isArray(value)?value.map(x=>({
      name:String(x?.name||'').trim(),
      context:String(x?.context||'').trim()
    })).filter(x=>x.name||x.context).slice(0,10):[];
  }

  async function summarizeDailyItem(base){
    const local=localDaySummary(base.turns||[]);
    if(typeof callCoachAI!=='function')return {...local,aiSummary:false};
    const result=await callCoachAI('mentor-daily-summary',{
      day:base.day,
      transcript:transcriptForSummary(base.turns||[]),
      coachDay:base.coachDay?JSON.stringify(base.coachDay).slice(0,3000):null
    });
    if(result?.__error)return {...local,aiSummary:false,summaryError:result.__message||''};
    return {
      summary:String(result.summary||local.summary).trim(),
      highlights:normalizeList(result.highlights),
      decisions:normalizeList(result.decisions),
      people:normalizePeople(result.people),
      pending:normalizeList(result.pending),
      learning:normalizeList(result.learning),
      aiSummary:true
    };
  }

  window.mentor47SaveDay=async function mentor47SaveDay(fromCall=false){
    const log=currentDayLog();
    const userTurns=log.turns.filter(t=>t.role==='user');
    if(!userTurns.length){
      if(typeof toast==='function')toast('Ainda não há conversa sua para salvar hoje.');
      return;
    }
    setCallStatus('Salvando e resumindo o dia...');
    const base={
      id:'day-'+log.day,
      day:log.day,
      date:dayLabel(log.day),
      title:(userTurns[0]?.text||'Dia do treinador').slice(0,90),
      turns:log.turns.slice(-180),
      coachDay:coachDaySnapshot(log.day),
      dashboardTask:state.dashboardTaskId?{id:state.dashboardTaskId,title:state.dashboardTaskTitle||''}:null,
      savedAt:Date.now(),
      autoArchived:false
    };
    const summary=await summarizeDailyItem(base);
    const item=upsertDailyArchive({...base,...summary});
    renderDailyHistory();
    showDailyItem(item,false);
    if(typeof toast==='function')toast('Dia salvo. A conversa pode continuar normalmente.');
    if(fromCall)setCallStatus('Dia salvo. Pode continuar a conversa.');
    return item;
  };

  window.mentor47NewConversation=function mentor47NewConversation(silent=false){
    mentor513ApplyProtectedManualMode(false);
    const keepCall=Boolean(state.isCallOpen);
    const callMode=state.callMode||'voice';
    const autoConversation=false;
    try{mentor42StopVoice();}catch{}
    state={
      mode:'free',turns:[],review:null,isCallOpen:keepCall,callMode,
      cameraEnabled:Boolean(state.cameraEnabled),autoConversation,
      specialContext:'',contextSourceDay:'',day:todayKey(),startedAt:Date.now(),
      conversationEnded:false,closureDraft:null,
      dashboardTaskId:'',dashboardTaskTitle:'',dashboardTaskCompleted:false,
      agendaEventId:'',agendaEventTitle:''
    };
    saveActive();
    setMode('free');
    renderChat();
    renderClosurePanel();
    applyConversationEndedState();
    const review=document.getElementById('mentor42Review');if(review)review.classList.add('hidden');
    if(!silent && typeof toast==='function')toast('Nova conversa iniciada. O registro do dia continua guardado.');
    if(keepCall)setCallStatus('Nova conversa. Pode falar quando quiser.');
    const input=document.getElementById('mentor42Input');
    if(input)input.placeholder='Fale comigo normalmente. Pode começar por qualquer assunto do seu dia.';
  };

  function dailyResultSection(title,content){
    if(!content || (Array.isArray(content)&&!content.length))return '';
    const body=Array.isArray(content)
      ? `<ul>${content.map(x=>`<li>${esc(typeof x==='string'?x:(x.name?`${x.name}: ${x.context}`:JSON.stringify(x)))}</li>`).join('')}</ul>`
      : `<p>${esc(content)}</p>`;
    return `<div class="mentor47-summary-section"><h4>${esc(title)}</h4>${body}</div>`;
  }

  function showDailyItem(item,full=false,note=''){
    const panel=document.getElementById('mentor47DailyPanel');
    const body=document.getElementById('mentor47DailyPanelBody');
    if(!panel||!body||!item)return;
    panel.classList.remove('hidden');
    const fullConversation=full && item.turns?.length
      ? `<div class="mentor47-full-conversation">${item.turns.map(t=>`
          <div class="mentor42-bubble ${t.role==='user'?'user':'ai'}">
            ${esc(t.text||'')}<small>${t.role==='user'?'Você':'Mentor'} · ${esc(t.time||'')}</small>
          </div>`).join('')}</div>`
      : '';
    body.innerHTML=`
      ${note?`<div class="mentor47-note">${esc(note)}</div>`:''}
      <div class="mentor47-summary-head">
        <div><span class="label">${esc(dayLabel(item.day))}</span><h3>${esc(item.title||'Resumo do dia')}</h3></div>
        <div class="mentor47-summary-actions">
          <button class="outline" onclick="mentor47ShowDay('${item.day}',${full?'false':'true'})">${full?'Ver resumo':'Ver conversa'}</button>
          <button class="secondary" onclick="mentor47ResumeDay('${item.day}')">🧠 Retomar contexto</button>
        </div>
      </div>
      ${dailyResultSection('Resumo',item.summary)}
      ${dailyResultSection('Destaques',item.highlights)}
      ${dailyResultSection('Decisões / critérios',item.decisions)}
      ${dailyResultSection('Pessoas citadas',item.people)}
      ${dailyResultSection('Pendências',item.pending)}
      ${dailyResultSection('Aprendizados',item.learning)}
      ${fullConversation}
    `;
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  window.mentor47ShowDay=async function mentor47ShowDay(day,full=false){
    let item=dailyArchive().find(x=>x.day===day);
    if(!item)return;
    if(!item.aiSummary && item.turns?.length && !full){
      const panel=document.getElementById('mentor47DailyPanel');
      const body=document.getElementById('mentor47DailyPanelBody');
      if(panel&&body){panel.classList.remove('hidden');body.innerHTML='<p class="intro">Preparando o resumo deste dia...</p>';}
      const summary=await summarizeDailyItem(item);
      item=upsertDailyArchive({...item,...summary,savedAt:Date.now()});
      renderDailyHistory();
    }
    showDailyItem(item,Boolean(full));
  };

  window.mentor47ShowYesterday=async function mentor47ShowYesterday(){
    currentDayLog();
    const yesterday=offsetDayKey(-1);
    let item=dailyArchive().find(x=>x.day===yesterday);
    let note='';
    if(!item){
      item=dailyArchive().find(x=>x.day<todayKey());
      if(item)note=`Não encontrei um registro exatamente de ontem. Mostrando o último dia salvo: ${dayLabel(item.day)}.`;
    }
    if(!item){
      const panel=document.getElementById('mentor47DailyPanel');
      const body=document.getElementById('mentor47DailyPanelBody');
      if(panel&&body){
        panel.classList.remove('hidden');
        body.innerHTML='<h3>Ainda não existe um dia anterior salvo</h3><p class="intro">A partir desta versão, use “Salvar o dia”. Amanhã o resumo ficará disponível aqui.</p>';
        panel.scrollIntoView({behavior:'smooth'});
      }
      return;
    }
    if(!item.aiSummary && item.turns?.length){
      const summary=await summarizeDailyItem(item);
      item=upsertDailyArchive({...item,...summary,savedAt:Date.now()});
    }
    showDailyItem(item,false,note);
  };

  window.mentor47CloseDailyPanel=function mentor47CloseDailyPanel(){
    document.getElementById('mentor47DailyPanel')?.classList.add('hidden');
  };

  window.mentor47OpenHistory=function mentor47OpenHistory(){
    renderDailyHistory();
    document.getElementById('mentor47HistoryCard')?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.mentor47UsePreviousContext=function mentor47UsePreviousContext(){
    window.mentor47OpenHistory();
    const input=document.getElementById('mentor47HistorySearch');
    if(input){input.focus();input.placeholder='Busque por nome, assunto ou palavra e escolha “Retomar contexto”.';}
    if(typeof toast==='function')toast('Escolha um dia e toque em “Retomar contexto”. Nada anterior é usado sem você pedir.');
  };

  window.mentor47ResumeDay=function mentor47ResumeDay(day){
    const item=dailyArchive().find(x=>x.day===day);if(!item)return;
    window.mentor47NewConversation(true);
    state.contextSourceDay=day;
    state.specialContext=`O treinador escolheu explicitamente retomar o dia ${dayLabel(day)}. Resumo: ${item.summary||''}. Decisões: ${(item.decisions||[]).join(' | ')}. Pendências: ${(item.pending||[]).join(' | ')}.`;
    saveActive();
    addTurn('assistant',`Contexto de ${dayLabel(day)} carregado. Podemos continuar dali ou olhar a situação de outro ângulo. O que você quer me contar agora?`);
    document.getElementById('mentor42Chat')?.scrollIntoView({behavior:'smooth',block:'center'});
    if(typeof toast==='function')toast('Contexto anterior carregado somente para esta conversa.');
  };

  function historyMatches(item,q,date){
    if(date && item.day!==date)return false;
    if(!q)return true;
    const hay=[
      item.day,item.title,item.summary,
      ...(item.highlights||[]),...(item.decisions||[]),...(item.pending||[]),...(item.learning||[]),
      ...(item.people||[]).flatMap(p=>[p.name,p.context]),
      ...(item.turns||[]).map(t=>t.text)
    ].join(' ').toLowerCase();
    return hay.includes(q);
  }

  function renderDailyHistory(){
    const wrap=document.getElementById('mentor47HistoryList');if(!wrap)return;
    const q=String(document.getElementById('mentor47HistorySearch')?.value||'').trim().toLowerCase();
    const date=String(document.getElementById('mentor47HistoryDate')?.value||'').trim();
    const list=dailyArchive().filter(item=>historyMatches(item,q,date));
    if(!list.length){
      wrap.innerHTML='<p class="intro">Nenhum dia encontrado com esse filtro.</p>';return;
    }
    wrap.innerHTML=list.slice(0,80).map(item=>`
      <div class="mentor47-history-item">
        <div>
          <strong>${esc(dayLabel(item.day))}</strong>
          <small>${esc(item.title||'Dia do treinador')}</small>
          <p>${esc(String(item.summary||'Registro salvo.').slice(0,260))}</p>
        </div>
        <div class="mentor47-history-actions">
          <button class="outline" onclick="mentor47ShowDay('${item.day}',false)">Resumo</button>
          ${item.turns?.length?`<button class="outline" onclick="mentor47ShowDay('${item.day}',true)">Conversa</button>`:''}
          <button class="secondary" onclick="mentor47ResumeDay('${item.day}')">Retomar</button>
        </div>
      </div>`).join('');
  }

  window.mentor47HistorySearch=function mentor47HistorySearch(){renderDailyHistory();};
  window.mentor47ClearHistory=function mentor47ClearHistory(){
    const q=document.getElementById('mentor47HistorySearch');if(q)q.value='';
    const d=document.getElementById('mentor47HistoryDate');if(d)d.value='';
    renderDailyHistory();
    window.mentor48UpdateDayToDayGreeting?.();
  };

  window.mentor47SaveProfile=function mentor47SaveProfile(){
    const text=String(document.getElementById('mentor47ProfileText')?.value||'').trim();
    localStorage.setItem(MK.profile,text);
    if(typeof toast==='function')toast(text?'Perfil permanente salvo neste aparelho.':'Perfil permanente limpo.');
  };

  window.mentor47ExportHistory=function mentor47ExportHistory(){
    const data={
      version:'4.7',
      exportedAt:new Date().toISOString(),
      profile:profileText(),
      daily:dailyArchive(),
      currentDay:currentDayLog(),
      criticism:getJSON(MK.criticism,[])
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`coachvoice-historico-${todayKey()}.json`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  function getPending(){
    return memory().find(x=>!x.resolved && x.nextAction);
  }

  function renderPending(){
    const item=getPending();
    const card=document.getElementById('mentor42PendingCard');
    const text=document.getElementById('mentor42PendingText');
    if(!card||!text)return;
    if(!item){card.classList.add('hidden');return;}
    card.classList.remove('hidden');
    text.textContent=`${item.nextAction} — ${item.carryForward||'Retome o contexto antes de decidir o próximo passo.'}`;
  }

  window.mentor42ResumePending=function mentor42ResumePending(){
    const item=getPending();if(!item)return;
    mentor42ClearConversation();
    setMode('mentor');
    state.specialContext=`Pendência anterior: ${item.nextAction}. Contexto: ${item.summary}`;
    addTurn('assistant',`Na última conversa ficou pendente: ${item.nextAction}. O que aconteceu depois?`);
    mentor42StartCall();
  };

  window.mentor42ResolvePending=function mentor42ResolvePending(){
    const list=memory();
    const item=list.find(x=>!x.resolved && x.nextAction);
    if(item)item.resolved=true;
    setMemory(list);renderPending();renderMemory();
    if(typeof toast==='function')toast('Pendência marcada como resolvida.');
  };

  function renderMemory(){
    const wrap=document.getElementById('mentor42Memory');if(!wrap)return;
    const list=memory();
    if(!list.length){
      wrap.innerHTML='<p class="intro">As sessões salvas aparecerão aqui com aprendizado e próximo passo.</p>';
      return;
    }
    wrap.innerHTML=list.slice(0,50).map(item=>`
      <div class="mentor42-memory">
        <strong>${esc(modeLabels[item.mode]||'Mentor')} · ${esc(item.date)}</strong>
        <small><b>Resumo:</b> ${esc(item.summary||'')}</small>
        <small><b>Aprendizado:</b> ${esc(item.learning||'')}</small>
        <small><b>Próximo:</b> ${esc(item.nextAction||'')}</small>
        <div class="mentor42-memory-actions">
          ${item.resolved?'<span class="coachday-mini-badge ok">resolvida</span>':`<button class="outline" onclick="mentor42ResolveMemory('${item.id}')">Marcar resolvida</button>`}
        </div>
      </div>`).join('');
  }

  window.mentor42ResolveMemory=function mentor42ResolveMemory(id){
    const list=memory();const item=list.find(x=>x.id===id);if(item)item.resolved=true;
    setMemory(list);renderMemory();renderPending();
  };

  function localCriticism(text){
    const hasSpecific=/intens|transi|press|comunica|treino|escala|substit|bola|bloco|resultado|critério|criterio/i.test(text);
    return {
      actionable:hasSpecific,
      actionableWhy:hasSpecific?'Existe pelo menos uma afirmação que pode ser traduzida em comportamento observável.':'A crítica está ampla demais para virar ação sem mais evidência.',
      usefulPart:hasSpecific?'Procure o comportamento concreto que pode ser verificado em treino ou jogo.':'Pergunte se existe algum exemplo concreto antes de tirar conclusão.',
      outsideControl:'Você não controla a opinião final de imprensa, torcida, dirigentes ou atletas.',
      noise:'Ataques genéricos sobre sua identidade ou valor profissional não oferecem uma ação técnica específica.',
      respondNow:false,
      action:hasSpecific?'Escolha um comportamento observável e verifique com vídeo, comissão ou treino antes de reagir publicamente.':'Não construa uma resposta completa ainda. Primeiro procure fatos.',
      blindSpot:'Você aplicou o mesmo critério aos jogadores mais importantes e aos que têm menos espaço?'
    };
  }

  window.mentor42AnalyzeCriticism=async function mentor42AnalyzeCriticism(){
    const text=document.getElementById('mentor42CriticismInput')?.value.trim()||'';
    if(!text){if(typeof toast==='function')toast('Conte a crítica primeiro.');return;}
    const challenge=document.getElementById('mentor42CriticChallenge')?.checked!==false;
    const local=localCriticism(text);
    const box=document.getElementById('mentor42CriticismResult');
    box.classList.remove('hidden');box.textContent='Separando o que merece atenção do que é ruído...';
    const ai=typeof callCoachAI==='function'
      ? await callCoachAI('mentor-filter-criticism',{criticism:text,challenge,local})
      : {};
    const r={...local,...ai};
    box.innerHTML=`
      ${xRow(r.actionable,'Posso agir sobre isso',r.actionableWhy||'')}
      ${xRow(Boolean(r.usefulPart),'Existe uma parte útil',r.usefulPart||'')}
      ${xRow(false,'Não depende totalmente de mim',r.outsideControl||'')}
      ${xRow(false,'Ruído / opinião sem ação específica',r.noise||'')}
      ${xRow(Boolean(r.respondNow),'Exige resposta agora',r.respondNow?'Há motivo para resposta imediata.':'Não reaja apenas para aliviar o desconforto da crítica.')}
      <div class="mentor42-result-section"><h4>Ação escolhida</h4><p>${esc(r.action||'')}</p></div>
      ${challenge?`<div class="mentor42-result-section"><h4>Ponto cego para testar</h4><p>${esc(r.blindSpot||'')}</p></div>`:''}
      <div class="mentor42-result-section"><h4>Princípio</h4><p>Eu não controlo toda crítica. Eu escolho o que merece minha atenção.</p></div>`;
    const hist=getJSON(MK.criticism,[]);
    hist.unshift({date:new Date().toLocaleString('pt-BR'),day:todayKey(),text,result:r});
    setJSON(MK.criticism,hist.slice(0,80));
    if(autoVoice())speak(`Filtro concluído. ${r.action||''} ${challenge?r.blindSpot||'':''}`);
  };

  function xRow(active,title,text){
    return `<div class="mentor42-xrow">
      <span class="mentor42-x ${active?'active':'inactive'}">${active?'X':'—'}</span>
      <div><strong>${esc(title)}</strong><small>${esc(text)}</small></div>
    </div>`;
  }

  window.mentor42FocusCriticism=function mentor42FocusCriticism(){
    document.getElementById('mentor42CriticismCard')?.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>document.getElementById('mentor42CriticismInput')?.focus(),350);
  };

  window.mentor42FridayCriticism=function mentor42FridayCriticism(){
    const hist=memory();
    const recent=hist.find(x=>!x.resolved)||hist[0];
    const input=document.getElementById('mentor42CriticismInput');
    if(input && !input.value){
      input.value=recent
        ? `Quero revisar criticamente esta situação da semana: ${recent.summary}. Próximo passo que eu tinha definido: ${recent.nextAction}.`
        : 'Quero fazer a Crítica da Sexta. Questione uma decisão ou conversa importante que tive nesta semana.';
    }
    mentor42FocusCriticism();
  };

  window.openMentorCriticismFromCoachPrep=function openMentorCriticismFromCoachPrep(){
    if(typeof go==='function')go('mentor');
    setTimeout(()=>mentor42FridayCriticism(),120);
  };

  function preClubContext(){
    let cfg=getJSON('coachprep-config-v41',null);
    if(!cfg)cfg=getJSON('coachprep-config-v42',null);
    if(!cfg?.startDate)return {active:false};
    const start=new Date(cfg.startDate+'T12:00:00');
    const now=new Date();now.setHours(12,0,0,0);
    const days=Math.ceil((start-now)/86400000);
    if(days<0||days>14)return {active:false,days};
    const idx=Math.abs(days)%preClubScenarios.length;
    return {active:true,days,scenario:preClubScenarios[idx],startDate:cfg.startDate};
  }

  function renderPreClub(){
    const box=document.getElementById('mentor42PreClubBanner');if(!box)return;
    const pre=preClubContext();
    if(!pre.active){box.classList.add('hidden');return;}
    box.classList.remove('hidden');
    box.innerHTML=`<strong>Modo Pré‑Clube — faltam ${pre.days} dias</strong><br>
      Treino sugerido: ${esc(pre.scenario)}
      <div class="mentor42-actions" style="margin-top:8px">
        <button class="secondary" onclick="mentor42StartPreClub()">Treinar agora</button>
      </div>`;
  }

  window.mentor42StartPreClub=function mentor42StartPreClub(){
    const pre=preClubContext();if(!pre.active)return;
    mentor42ClearConversation();
    setMode('simulation');
    state.specialContext=`Modo Pré-Clube. Faltam ${pre.days} dias. Situação de hoje: ${pre.scenario}`;
    addTurn('assistant',`Modo Pré‑Clube. Situação de hoje: ${pre.scenario} Comece como você faria na situação real.`);
    mentor42StartCall();
  };

  function loadLegacyInput(){
    const legacy=document.getElementById('mentorSituation');
    const value=legacy?.value.trim()||'';
    if(!value)return;
    const input=document.getElementById('mentor42Input');
    if(input && !input.value)input.value=value;
    legacy.value='';
    setMode('mentor');
  }

  window.mentor42LoadSituation=function mentor42LoadSituation(data={}){
    if(typeof go==='function')go('mentor');
    setTimeout(()=>{
      const input=document.getElementById('mentor42Input');
      if(input)input.value=data.situation||data.context||'';
      setMode(data.mode||'mentor');
    },80);
  };

  window.mentor42ExportMemory=function mentor42ExportMemory(){ return mentor47ExportHistory(); };


  let mentor43CameraStream=null;
  window.mentor43StartVideoCall=function(){
    state.callMode='video';saveActive();mentor42StartCall();setTimeout(()=>mentor43StartCamera(),100);
  };
  window.mentor43SetCallMode=function(mode){
    state.callMode=mode==='video'?'video':'voice';saveActive();mentor43ApplyCallMode();
    if(state.callMode==='video')mentor43StartCamera();else mentor43StopCamera();
  };
  function mentor43ApplyCallMode(){
    const v=state.callMode==='video';
    document.getElementById('mentor43VideoStage')?.classList.toggle('hidden',!v);
    document.getElementById('mentor43CameraBtn')?.classList.toggle('hidden',!v);
    document.getElementById('mentor43AvatarNote')?.classList.toggle('hidden',!v);
    document.getElementById('mentor43VoiceModeBtn')?.classList.toggle('active',!v);
    document.getElementById('mentor43VideoModeBtn')?.classList.toggle('active',v);
    const t=document.getElementById('mentor42CallTitle');if(t)t.textContent=v?`${modeLabels[state.mode]} · Vídeo`:modeLabels[state.mode];
  }
  async function mentor43StartCamera(){
    if(state.callMode!=='video')return;
    try{
      if(!mentor43CameraStream)mentor43CameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
      const v=document.getElementById('mentor43SelfVideo');if(v){v.srcObject=mentor43CameraStream;await v.play().catch(()=>{});}
      state.cameraEnabled=true;mentor43UpdateCameraUI();
    }catch{state.cameraEnabled=false;mentor43UpdateCameraUI();setCallStatus('A câmera não abriu. A conversa por voz continua funcionando.');}
  }
  function mentor43StopCamera(){
    if(mentor43CameraStream){mentor43CameraStream.getTracks().forEach(t=>t.stop());mentor43CameraStream=null;}
    const v=document.getElementById('mentor43SelfVideo');if(v)v.srcObject=null;
    state.cameraEnabled=false;mentor43UpdateCameraUI();
  }
  window.mentor43ToggleCamera=function(){mentor43CameraStream?mentor43StopCamera():mentor43StartCamera();};
  function mentor43UpdateCameraUI(){
    const p=document.getElementById('mentor43CameraPlaceholder');if(p)p.style.display=mentor43CameraStream?'none':'grid';
    const b=document.getElementById('mentor43CameraBtn');if(b)b.innerHTML=mentor43CameraStream?'📷<small>Desligar</small>':'🚫<small>Ligar câmera</small>';
  }


  function mentor44AfterMentorSpeech(){
    if(mentor561AutoAssistSession && state.isCallOpen && !state.conversationEnded){
      window.coach522InteractionComplete?.('mentor');
      window.coach522SetVoiceState?.('ready','Sua vez — microfone automático');
      setCallStatus('Sua vez. Toque no microfone quando quiser responder.');
      mentor561ScheduleAutoMic(850);
      return;
    }

    if(mentor513AutoSession && state.isCallOpen){
      setTimeout(()=>{
        if(state.isCallOpen && mentor513AutoSession && !mentor44Listening && !mentor481Recording){
          mentor44StartListening(true);
        }
      },900);
    }else if(state.isCallOpen){
      window.coach522InteractionComplete?.('mentor');
      window.coach522SetVoiceState?.('ready','Pronto para falar');
      setCallStatus('Sua vez. Toque 🎙 quando quiser falar; o Mentor vai esperar seu comando.');
    }
  }

  window.mentor44SaveAutoConversation=function mentor44SaveAutoConversation(){
    const enabled=Boolean(document.getElementById('mentor44AutoConversation')?.checked);
    mentor513AutoSession=enabled;
    state.autoConversation=enabled;

    const badge=document.getElementById('mentor513ManualBadge');
    if(badge){
      badge.classList.toggle('auto',enabled);
      badge.textContent=enabled
        ? '⚡ Modo automático experimental'
        : '🛡️ Modo manual protegido';
    }

    saveActive();

    if(enabled){
      setCallStatus('Modo automático experimental ligado apenas nesta conversa. Uma pausa pode ser entendida como fim da fala.');
      if(typeof toast==='function')toast('Automático experimental: para respostas longas, prefira o modo manual protegido.');
    }else{
      mentor513ApplyProtectedManualMode(true);
    }
  };

  window.mentor44RepeatLastAnswer=function mentor44RepeatLastAnswer(){
    const text=lastAssistantText();
    if(!text){
      if(typeof toast==='function')toast('Ainda não há resposta do Mentor para repetir.');
      return;
    }
    mentor461PrimeSpeech();
    setCallStatus('Iniciando voz do Mentor...');
    speak(text,{force:true,userInitiated:true});
  };

  function mentor44DiagnosticRow(level,title,detail){
    const icon=level==='ok'?'✓':level==='warn'?'!':'×';
    return `<div class="mentor44-diagnostic-row ${level}">
      <span>${icon}</span><div><strong>${esc(title)}</strong><small>${esc(detail)}</small></div>
    </div>`;
  }

  window.mentor44RunDiagnostic=async function mentor44RunDiagnostic(){
    const box=document.getElementById('mentor44DiagnosticResult');
    if(!box)return;
    box.classList.remove('hidden');
    box.innerHTML=mentor44DiagnosticRow('warn','Teste em andamento','Verificando recursos deste aparelho...');

    const rows=[];

    // Microfone
    if(navigator.mediaDevices?.getUserMedia){
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        stream.getTracks().forEach(t=>t.stop());
        rows.push(mentor44DiagnosticRow('ok','Microfone','Permissão e captura de áudio funcionando.'));
      }catch(error){
        rows.push(mentor44DiagnosticRow('bad','Microfone','O navegador não conseguiu abrir o microfone. Verifique a permissão do site.'));
      }
    }else{
      rows.push(mentor44DiagnosticRow('bad','Microfone','Este navegador não expõe captura de áudio para a página.'));
    }

    // Reconhecimento direto
    const recognition=Boolean(window.SpeechRecognition||window.webkitSpeechRecognition);
    rows.push(mentor44DiagnosticRow(
      recognition?'ok':'warn',
      'Fala → texto',
      recognition
        ?'Reconhecimento direto disponível. O Mentor usará este modo primeiro.'
        :'Reconhecimento direto não existe neste navegador; será usado o modo alternativo de gravação/transcrição.'
    ));

    // Voz de resposta
    const hasVoice='speechSynthesis' in window;
    rows.push(mentor44DiagnosticRow(
      hasVoice?'ok':'warn',
      'Resposta em voz',
      hasVoice?'O aparelho pode ler a resposta do Mentor em voz alta.':'A conversa continuará em texto porque a síntese de voz não está disponível.'
    ));

    // Transcrição de servidor
    try{
      const r=await fetch('/api/transcribe',{method:'GET',cache:'no-store'});
      const data=await r.json().catch(()=>({}));
      rows.push(mentor44DiagnosticRow(
        data.configured?'ok':'warn',
        'Transcrição alternativa',
        data.configured
          ?'A transcrição por IA está configurada para servir como fallback.'
          :'Não está configurada. Isso não impede o reconhecimento direto, mas o fallback de áudio não poderá transcrever.'
      ));
    }catch{
      rows.push(mentor44DiagnosticRow('warn','Transcrição alternativa','A rota /api/transcribe não respondeu.'));
    }

    // IA
    try{
      const result=typeof callCoachAI==='function'?await callCoachAI('health',{message:'diagnostico-v45'}):{__error:true,__message:'callCoachAI indisponível'};
      rows.push(mentor44DiagnosticRow(
        result?.ok?'ok':'bad',
        'Mentor IA · Gemini',
        result?.ok
          ?'O Gemini respondeu corretamente. As conversas estão usando IA real.'
          :mentor45FriendlyError(result)
      ));
    }catch{
      rows.push(mentor44DiagnosticRow('warn','Mentor IA','A conexão com /api/coach-ai não respondeu.'));
    }

    box.innerHTML=rows.join('');
  };


  const mentor48DayPrompts = {
    organize:'Hoje quero organizar meu dia. Vou te contar meus compromissos, horários e o que não pode ficar para depois. Me ajude a montar uma ordem realista.',
    headfull:'Estou com muita coisa na cabeça hoje. Quero colocar tudo para fora e depois organizar em poucas prioridades, sem transformar isso em um interrogatório.',
    priority:'Tenho várias coisas para fazer e preciso decidir o que vem primeiro. Me ajude a separar urgente, importante, adiável e o que posso simplesmente deixar para outro momento.',
    travel:'Hoje é dia de viagem. Quero organizar horários, energia, alimentação, estudo, trabalho e pendências sem deixar o dia pesado demais.',
    tired:'Hoje estou cansado e meu plano ficou grande demais. Quero reorganizar o dia de forma realista e preservar o que realmente importa.',
    decision:'Preciso tomar uma decisão hoje. Quero conversar livremente e depois organizar critérios, opções, riscos e o que pode ser revisto.',
    unload:'Hoje eu só quero conversar um pouco e organizar as ideias. Não precisa transformar tudo em futebol nem me fazer muitas perguntas.',
    close:'Quero fechar meu dia. Vamos fazer um resumo curto do que aconteceu, do que ficou pendente e do que vale salvar. Não precisa planejar amanhã se eu não pedir.'
  };

  window.mentor48UpdateDayToDayGreeting=function mentor48UpdateDayToDayGreeting(){
    const el=document.getElementById('mentor48DayGreeting');
    if(!el)return;
    const hour=new Date().getHours();
    const hello=hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
    el.textContent=`${hello}, Coach. Como está seu dia?`;
  };

  window.mentor48OpenDayToDay=function mentor48OpenDayToDay(){
    setMode('daylife');
    state.specialContext='Conversa de Dia a Dia escolhida pelo treinador. Não force conexão com futebol. Ajude com rotina, horários, prioridades, estudos, viagem, cansaço ou conversa aberta, conforme o assunto.';
    saveActive();
    if(typeof go==='function')go('mentor');
    const input=document.getElementById('mentor42Input');
    if(input){input.value='';input.placeholder='Pode falar de qualquer assunto do seu dia. Não precisa ser futebol.';setTimeout(()=>input.focus(),80);}
    if(typeof toast==='function')toast('Dia a Dia aberto. Pode conversar normalmente.');
  };

  window.mentor48StartDayPrompt=function mentor48StartDayPrompt(kind){
    const prompt=mentor48DayPrompts[kind]||mentor48DayPrompts.unload;
    const mode=kind==='decision'?'decide':kind==='close'?'closeday':kind==='unload'?'unload':'daylife';
    setMode(mode);
    state.specialContext='Conversa de Dia a Dia iniciada pelo treinador. Não force conexão com futebol. Responda ao assunto do cotidiano primeiro.';
    saveActive();
    if(typeof go==='function')go('mentor');
    const input=document.getElementById('mentor42Input');
    if(input){input.value=prompt;input.placeholder='Continue do seu jeito...';setTimeout(()=>input.focus(),80);}
    if(typeof toast==='function')toast('Conversa preparada. Edite se quiser e envie.');
  };

  window.mentor48SendDailyInput=function mentor48SendDailyInput(){
    const source=document.getElementById('mentor48DailyInput');
    const text=source?.value.trim()||'';
    setMode('daylife');
    state.specialContext='Conversa de Dia a Dia escolhida pelo treinador. Não force conexão com futebol. Ajude com o que ele trouxer.';
    saveActive();
    if(typeof go==='function')go('mentor');
    const input=document.getElementById('mentor42Input');
    if(input){input.value=text;input.placeholder='Pode continuar falando normalmente.';setTimeout(()=>input.focus(),80);}
    if(!text && typeof toast==='function')toast('Pode falar ou escrever diretamente na conversa.');
  };

  window.mentor48ShowYesterdayFromDay=function mentor48ShowYesterdayFromDay(){
    if(typeof go==='function')go('mentor');
    setTimeout(()=>window.mentor47ShowYesterday?.(),80);
  };


  window.mentor55OpenGrowthContext=function mentor55OpenGrowthContext(context={}){
    window.mentor47NewConversation(true);
    const kind=String(context.kind||'growth');
    const title=String(context.title||'Reflexão de hoje');
    const body=String(context.body||'').slice(0,5000);
    const reference=String(context.reference||'').slice(0,160);
    state.mode='mentor';
    state.specialContext=[
      kind==='devotional'
        ?'O treinador escolheu conversar sobre o devocional diário. Trate o tema com respeito à fé cristã, sem transformar automaticamente a reflexão em futebol.'
        :'O treinador escolheu conversar sobre um aprendizado de desenvolvimento profissional.',
      `Tema: ${title}.`,
      reference?`Referência: ${reference}.`:'',
      body?`Conteúdo que ele acabou de ler: ${body}.`:'',
      kind==='devotional'
        ?'Acompanhe a reflexão de forma humana. Não pregue, não imponha interpretação, não force aplicação profissional e não faça perguntas por hábito.'
        :'Ajude a transformar a ideia em compreensão, exemplo, decisão ou prática. Diferencie claramente o que veio do material e o que é sua síntese.'
    ].filter(Boolean).join(' ');
    setMode('mentor');
    addTurn('assistant',kind==='devotional'
      ?`Podemos conversar sobre “${title}”. Fale do que mais chamou sua atenção ou de alguma situação da sua vida que isso trouxe à mente.`
      :`Vamos conversar sobre “${title}”. Pode me dizer o que fez sentido, o que você questiona ou onde gostaria de aplicar essa ideia.`
    );
    saveActive();renderChat();
    const input=document.getElementById('mentor42Input');
    if(input){input.value='';input.placeholder='Pode falar normalmente.';}
    setCallStatus(`Contexto vinculado: ${title}`);
  };

  window.mentor52OpenAgendaEvent=function mentor52OpenAgendaEvent(event={}){
    window.mentor47NewConversation(true);
    state.agendaEventId=String(event.id||'');
    state.agendaEventTitle=String(event.title||'Compromisso da agenda');
    state.mode='mentor';
    state.specialContext=[
      'Conversa vinculada a um compromisso da Agenda do treinador.',
      `Compromisso: ${state.agendaEventTitle}.`,
      event.date?`Data: ${event.date}.`:'',
      event.time?`Horário: ${event.time}.`:'',
      event.duration?`Duração prevista: ${event.duration} minutos.`:'',
      event.person?`Pessoa relacionada: ${event.person}.`:'',
      event.note?`Registro: ${event.note}.`:'',
      'Ajude o treinador a se preparar com naturalidade. Não transforme a preparação em questionário. Responda primeiro; se já houver contexto suficiente, dê uma orientação concreta e pare.'
    ].filter(Boolean).join(' ');
    setMode('mentor');
    addTurn('assistant',`Vamos preparar “${state.agendaEventTitle}”. Me diga o que você precisa alinhar, ou simplesmente fale do jeito que está pensando.`);
    saveActive();renderChat();
    const input=document.getElementById('mentor42Input');
    if(input){input.value='';input.placeholder=`Preparar: ${state.agendaEventTitle}`;input.focus();}
    setCallStatus(`Agenda vinculada: ${state.agendaEventTitle}`);
  };

  window.mentor51OpenDashboardTask=function mentor51OpenDashboardTask(task={}){
    window.mentor47NewConversation(true);
    state.dashboardTaskId=String(task.id||'');
    state.dashboardTaskTitle=String(task.title||'Tarefa do Dashboard');
    state.dashboardTaskCompleted=false;
    state.mode='mentor';
    state.specialContext=[
      'Conversa vinculada a uma tarefa do Dashboard de hoje.',
      `Tarefa: ${state.dashboardTaskTitle}.`,
      task.time?`Horário: ${task.time}.`:'',
      task.category?`Categoria: ${task.category}.`:'',
      task.priority?`Prioridade: ${task.priority}.`:'',
      task.note?`Registro anterior: ${task.note}.`:'',
      'Ajude a preparar ou executar esta tarefa de forma prática. Responda primeiro e evite sequência de perguntas.'
    ].filter(Boolean).join(' ');
    setMode('mentor');
    addTurn('assistant',`Vamos trabalhar diretamente na tarefa “${state.dashboardTaskTitle}”. Pode me contar o contexto ou tocar no microfone e falar normalmente.`);
    saveActive();
    renderChat();
    const input=document.getElementById('mentor42Input');
    if(input){
      input.value='';
      input.placeholder=`Contexto da tarefa: ${state.dashboardTaskTitle}`;
      input.focus();
    }
    setCallStatus(`Tarefa vinculada: ${state.dashboardTaskTitle}`);
  };

  window.mentor51CompleteLinkedTask=function mentor51CompleteLinkedTask(){
    if(!state.dashboardTaskId)return;
    const draft=state.closureDraft||{};
    if(typeof window.dashboardCompleteTaskFromMentor!=='function'){
      if(typeof toast==='function')toast('Dashboard ainda não está disponível.');
      return;
    }
    const ok=window.dashboardCompleteTaskFromMentor(state.dashboardTaskId,draft);
    if(ok){
      state.dashboardTaskCompleted=true;
      saveActive();
      renderClosurePanel();
      if(typeof toast==='function')toast('Tarefa marcada como concluída no Dashboard.');
    }
  };

  window.mentor51AddPendingTomorrow=function mentor51AddPendingTomorrow(){
    const draft=state.closureDraft||{};
    const pending=String(draft.pending||'').trim();
    if(!pending){
      if(typeof toast==='function')toast('Este fechamento não tem pendência para levar a amanhã.');
      return;
    }
    if(typeof window.dashboardAddPendingTomorrow!=='function'){
      if(typeof toast==='function')toast('Dashboard ainda não está disponível.');
      return;
    }
    const count=window.dashboardAddPendingTomorrow(
      pending,
      String(draft.summary||draft.spoken||'').trim()
    );
    if(count){
      state.closureDraft={...draft,pendingAdded:true};
      saveActive();
      renderClosurePanel();
      if(typeof toast==='function')toast(`${count} pendência(s) adicionada(s) ao Dashboard de amanhã.`);
    }else if(typeof toast==='function'){
      toast('Essa pendência já está no Dashboard de amanhã.');
    }
  };

  window.mentor51ReturnDashboard=function mentor51ReturnDashboard(){
    if(typeof go==='function')go('dashboard');
    setTimeout(()=>window.dashboardRender?.(),80);
  };

  window.initializeMentorV42=function initializeMentorV42(){
    const root=document.getElementById('mentor42Chat');if(!root)return;
    migrateLegacyDailyMemory();
    const stored=getJSON(MK.active,null);
    currentDayLog();
    if(stored?.turns && Array.isArray(stored.turns) && (!stored.day || stored.day===todayKey())){
      state={...state,...stored,day:todayKey(),isCallOpen:false};
      seedDayLogFromActive(state);
    }else{
      if(stored?.turns?.length && stored.day && stored.day!==todayKey()){
        archiveLogLocally({day:stored.day,turns:stored.turns});
      }
      state={...state,mode:'free',turns:[],specialContext:'',contextSourceDay:'',day:todayKey(),startedAt:Date.now(),isCallOpen:false,conversationEnded:false,closureDraft:null,dashboardTaskId:'',dashboardTaskTitle:'',dashboardTaskCompleted:false,agendaEventId:'',agendaEventTitle:''};
      saveActive();
    }
    const voice=document.getElementById('mentor42AutoVoice');
    if(voice)voice.checked=autoVoice();
    const settings=getJSON(MK.settings,{});
    // Migração v5.1.3: qualquer preferência automática antiga é ignorada.
    settings.autoConversation=false;
    setJSON(MK.settings,settings);
    mentor513AutoSession=false;
    mentor561AutoAssistSession=false;
    mentor561ClearAutoStart();
    mentor561UpdateAssistUI();
    const auto=document.getElementById('mentor44AutoConversation');
    if(auto)auto.checked=false;
    state.autoConversation=false;
    mentor481SetMicUI('idle');
    mentor513ApplyProtectedManualMode(false);
    setMode(state.mode||'free');
    if(!state.callMode)state.callMode='voice';
    renderChat();renderMemory();renderPending();renderPreClub();loadLegacyInput();mentor43ApplyCallMode();
    const profile=document.getElementById('mentor47ProfileText');if(profile)profile.value=profileText();
    renderDailyHistory();
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',window.initializeMentorV42,{once:true});
  }else{
    window.initializeMentorV42();
  }
})();
