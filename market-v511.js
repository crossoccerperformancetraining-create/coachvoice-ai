/* CoachVoice AI v5.11 — Radar de Mercado integrado à base v5.10. */
(() => {
  'use strict';
  const KEY='coachvoice-market-v511', CURRENT='coachvoice-market-filter-v511';
  const STATES={AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'};
  // Lista da reunião oficial da FPF em 06/10/2026, não escalação/elenco da temporada.
  const A4=['América','Barretos','Comercial','Grêmio São-Carlense','Lemense','Tanabi','Taquaritinga','Vocem','Colorado Caieiras','Desportivo Brasil','Ecus','Jabaquara','Jacareí','Independente','São Caetano','União Suzano'];
  const COMPS={a:'Brasileirão Série A',b:'Brasileirão Série B',c:'Brasileirão Série C',d:'Brasileirão Série D',a4:'Paulista A4 · 2027',estadual:'Estaduais'};
  const SOURCES=[['FPF · Paulista A4','https://futebolpaulista.com.br/Noticias/Detalhe.aspx?Noticia=33388'],['FPF · Clubes','https://futebolpaulista.com.br/clubes/'],['CBF · Registros e notícias','https://www.cbf.com.br/'],['ge · Futebol','https://ge.globo.com/futebol/'],['Futebol Interior','https://www.futebolinterior.com.br/'],['Transfermarkt · Mercado','https://www.transfermarkt.com.br/'],['oGol · Futebol','https://www.ogol.com.br/']];
  const $=id=>document.getElementById(id), node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const opt=(value,text)=>{const el=node('option',null,text);el.value=value;return el;};
  const read=(key,defaultValue)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||defaultValue;}catch{return defaultValue;}};
  let state=read(KEY,{favorites:[],saved:[],feeds:{}}),filter=read(CURRENT,{competition:'a4',state:'SP',club:''}),articles=[],busy=false,req=null,showSaved=false,onlyFav=false;
  if(!COMPS[filter.competition]||!STATES[filter.state])filter={competition:'a4',state:'SP',club:''};
  if(!Array.isArray(state.favorites))state.favorites=[];
  if(!Array.isArray(state.saved))state.saved=[];
  if(!state.feeds||typeof state.feeds!=='object')state.feeds={};
  const safeUrl=value=>{try{const x=new URL(String(value));return x.protocol==='https:'&&!x.username&&!x.password?x.href:'';}catch{return '';}};
  const key=()=>JSON.stringify([filter.competition,filter.state,filter.club.trim().toLowerCase()]);
  const favoriteKey=x=>JSON.stringify([x.competition,x.state,(x.club||'').trim().toLowerCase()]);
  const currentFavorite=()=>({competition:filter.competition,state:filter.state,club:filter.club});
  const isFav=()=>state.favorites.some(x=>favoriteKey(x)===favoriteKey(currentFavorite()));
  const uniqueArticles=(rows)=>{const seen=new Set();return rows.filter(x=>{if(!x||!safeUrl(x.url)||!x.title)return false;const k=x.url;if(seen.has(k))return false;seen.add(k);return true;});};
  const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(CURRENT,JSON.stringify(filter));return true;}catch{status('Armazenamento cheio. Exporte seus dados do perfil antes de liberar espaço.');return false;}};
  const status=text=>{const e=$('cv511Status');if(e)e.textContent=text;};
  const date=s=>s&&!Number.isNaN(Date.parse(s))?new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'sem data';
  function button(label,cls,handler){const b=node('button',cls,label);b.type='button';b.addEventListener('click',handler);return b;}
  function link(label,url,cls=''){const a=node('a',cls,label);a.href=safeUrl(url)||'https://www.cbf.com.br/';a.target='_blank';a.rel='noopener noreferrer';return a;}
  function selectionHeading(x=filter){return `${COMPS[x.competition]||'Mercado'}${x.competition==='estadual'?' · '+(STATES[x.state]||x.state):''}${x.club?' · '+x.club:''}`;}
  function renderFilters(){
    const comp=$('cv511Competition'),stateSelect=$('cv511State'),club=$('cv511Club'),free=$('cv511FreeClub');if(!comp)return;
    comp.replaceChildren(...Object.entries(COMPS).map(([id,label])=>opt(id,label)));comp.value=filter.competition;
    stateSelect.replaceChildren(...Object.entries(STATES).map(([id,label])=>opt(id,label)));stateSelect.value=filter.state;
    $('cv511StateBox').hidden=filter.competition!=='estadual';$('cv511ClubBox').hidden=filter.competition!=='a4';$('cv511FreeBox').hidden=filter.competition==='a4';
    club.replaceChildren(opt('','Todas as 16 equipes'),...A4.map(c=>opt(c,c)));club.value=A4.includes(filter.club)?filter.club:'';
    free.value=filter.competition==='a4'?'':filter.club;$('cv511Favorite').textContent=isFav()?'★ Remover dos favoritos':'☆ Acompanhar esta seleção';
    $('cv511Current').textContent=selectionHeading();
  }
  function renderFavorites(){
    const root=$('cv511Favorites');if(!root)return;root.replaceChildren();
    if(!state.favorites.length){root.append(node('p','cv511-muted','Nenhum clube ou competição favorito salvo.'));return;}
    state.favorites.slice(0,30).forEach(f=>{
      const line=node('div','cv511-row');line.append(button(selectionHeading(f),'cv511-soft',()=>{filter={...f};articles=state.feeds[key()]?.articles||[];showSaved=false;store();renderFilters();renderArticles();status('Favorito selecionado. Toque em Atualizar para novas manchetes.');}));
      line.append(button('Remover','cv511-secondary',()=>{state.favorites=state.favorites.filter(x=>favoriteKey(x)!==favoriteKey(f));store();renderFavorites();renderFilters();}));root.append(line);
    });
  }
  function renderArticles(){
    const root=$('cv511Articles');if(!root)return;root.replaceChildren();
    const rows=showSaved?state.saved:articles;
    $('cv511ShowSaved').textContent=showSaved?'Ver manchetes da consulta':`Salvas (${state.saved.length})`;
    if(!rows.length){root.append(node('p','cv511-muted',showSaved?'Nenhuma notícia salva neste aparelho.':'Nenhuma manchete para esta seleção. Consulte os sites ao final ou atualize.'));return;}
    uniqueArticles(rows).slice(0,30).forEach(a=>{
      const article=node('article','cv511-result');article.append(node('small','',`${a.source||'Fonte não identificada'} · ${date(a.publishedAt)} · Reportagem, não confirmada pelo CoachVoice`));
      const title=node('h3');title.append(link(a.title,a.url));article.append(title);
      const tags=node('div','cv511-tags');tags.append(node('span','cv511-tag','Conferir na fonte'));article.append(tags);
      const row=node('div','cv511-row');
      const isSaved=state.saved.some(s=>s.url===a.url);
      row.append(button(isSaved?'✓ Salva':'☆ Salvar','cv511-secondary',()=>{state.saved=isSaved?state.saved.filter(x=>x.url!==a.url):[{...a,scope:selectionHeading()},...state.saved].slice(0,150);store();renderArticles();}));
      row.append(button('🎧 Conversar com Mentor','cv511-soft',()=>discuss(a)));
      article.append(row);root.append(article);
    });
  }
  async function load(){
    if(busy)req?.abort();req=new AbortController();const current=req,before=key();busy=true;
    status('Consultando as manchetes públicas do mercado…');$('cv511Refresh').disabled=true;
    const params=new URLSearchParams({competition:filter.competition,state:filter.state,club:filter.club});
    try{
      const r=await fetch('/api/market?'+params,{signal:current.signal,cache:'no-store'});
      const data=await r.json();if(!r.ok||!data.ok)throw Error(data.error||'Consulta indisponível.');
      if(before!==key()||current!==req)return;
      articles=uniqueArticles(Array.isArray(data.articles)?data.articles:[]);
      state.feeds[before]={articles:articles.slice(0,30),at:data.queriedAt};
      // bounded local cache so updates do not endlessly grow
      const entries=Object.entries(state.feeds).sort((a,b)=>(Date.parse(b[1].at)||0)-(Date.parse(a[1].at)||0));state.feeds=Object.fromEntries(entries.slice(0,20));
      store();showSaved=false;renderArticles();status(`${articles.length} manchetes · consulta ${date(data.queriedAt)} · Google Notícias RSS. Notícias NÃO confirmam transferências.`);
    }catch(e){if(e.name==='AbortError')return;status(`Consulta indisponível: ${e.message}. Use as fontes abaixo. Dados salvos continuam acessíveis.`);}finally{if(current===req){busy=false;$('cv511Refresh').disabled=false;}}
  }
  function discuss(a){
    const context=`Matéria publicada: ${a.title}. Fonte: ${safeUrl(a.url)}. Data: ${a.publishedAt||'não informada'}. É uma manchete não verificada pelo CoachVoice, não um anúncio oficial. Analise contexto, impacto no elenco e perguntas que precisam de confirmação.`;
    if(typeof window.coach54OpenSession==='function'){
      window.coach54OpenSession('mentor',{scenario:'Football Intelligence · '+selectionHeading(),goal:context.slice(0,700),useTeam:false,prompt:'Vamos analisar esta notícia criticamente. O que está confirmado? O que ainda precisamos verificar?',competitionContext:{competition:selectionHeading(),source:safeUrl(a.url),status:'noticia-nao-verificada'}});
    }else{window.go?.('mentor');status('Abra uma conversa com o Mentor e informe a notícia selecionada.');}
  }
  function bulletinText(){
    // Include only cached or retrieved headlines, with data provenance explicitly stated.
    const sources=[...articles];let count=0;
    for(const f of state.favorites){const cached=state.feeds[favoriteKey(f)]||null;if(cached?.articles){sources.push(...cached.articles);count++;}}
    const selected=uniqueArticles(sources).sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)).slice(0,7);
    if(!selected.length)return '';
    const newest=[...new Set([key(),...state.favorites.map(favoriteKey)])].map(k=>state.feeds[k]?.at).filter(Boolean);
    const dateText=newest.length?`Últimas consultas guardadas: ${newest.map(date).join('; ').slice(0,260)}.`:'As manchetes disponíveis podem estar desatualizadas.';
    return `Boletim do mercado de futebol do CoachVoice. ${dateText} As manchetes são notícias publicadas por veículos de informação, e não comprovação de contratação. ${selected.map((x,i)=>`Notícia ${i+1}: ${x.title}. Publicada em ${date(x.publishedAt)}.`).join(' ')} Para confirmar inscrições, confira as fontes oficiais e o registro do atleta.`.slice(0,2800);
  }
  async function speakBulletin(){
    const text=bulletinText(),el=$('cv511AudioStatus');
    if(!text){el.textContent='Consulte pelo menos uma notícia para montar o boletim.';return;}
    if(typeof window.mentor531PlayAudio!=='function'){el.textContent='Reprodutor indisponível. Atualize a página.';return;}
    el.textContent='Preparando boletim por voz…';
    try{await window.mentor531PlayAudio(text,{player:$('cv511Audio'),box:$('cv511AudioBox'),language:'pt-BR',onStatus:s=>el.textContent=s,onBlocked:()=>el.textContent='Toque em ▶ no reprodutor para liberar o áudio no iPhone.',onEnded:()=>el.textContent='Boletim encerrado.',onError:()=>el.textContent='Falha de reprodução. O texto continua disponível.'});}
    catch(e){el.textContent='Não foi possível gerar a voz agora: '+(e.message||'Confira a conexão.');}
  }
  function buildPage(){
    if($('market'))return;
    const page=node('section','page cv55-page');page.id='market';
    page.innerHTML=`<header class="cv511-header"><small>COACHVOICE AI · FOOTBALL INTELLIGENCE</small><h2>⚽ Radar de Mercado</h2><p>Movimentações, reforços, saídas, renovações, elencos e treinadores. Paulista A4, Séries A–D e estaduais — notícias com origem, sem confundir rumor com confirmação.</p></header>
    <div class="cv511-box cv511-form"><h3>Pesquisar campeonato e clube</h3><div class="cv511-grid"><label>Competição<select id="cv511Competition"></select></label><label id="cv511StateBox">Estado<select id="cv511State"></select></label><label id="cv511ClubBox">Equipe da Paulista A4<select id="cv511Club"></select></label><label id="cv511FreeBox">Equipe (digite o nome)<input id="cv511FreeClub" type="search" maxlength="65" placeholder="Ex.: Náutico, Sport, Guarani…"></label></div><div class="cv511-row"><button id="cv511Refresh" class="cv511-primary" type="button">↻ Atualizar movimentações</button><button id="cv511Favorite" class="cv511-secondary" type="button">☆ Favoritar</button><button id="cv511OpenCompetitions" class="cv511-soft" type="button">Ver Competições</button></div><p id="cv511Current" class="cv511-muted"></p><p id="cv511Status" class="cv511-status" role="status" aria-live="polite">Selecione campeonato e clube e atualize para consultar.</p></div>
    <div class="cv511-box"><h3>🎧 Boletim do mercado</h3><p class="cv511-muted">Ouça até sete manchetes da consulta e dos favoritos salvos. A leitura não comprova contratos e pode incluir manchetes antigas.</p><div class="cv511-row"><button id="cv511Listen" class="cv511-primary" type="button">🔊 Ouvir boletim</button><button id="cv511Stop" class="cv511-secondary" type="button">⏹ Parar voz</button></div><div id="cv511AudioBox" hidden><audio id="cv511Audio" class="cv511-audio" controls playsinline preload="metadata" aria-label="Boletim do mercado"></audio></div><p id="cv511AudioStatus" class="cv511-status" role="status"></p></div>
    <div class="cv511-grid"><div class="cv511-box"><h3>★ Meus favoritos</h3><p class="cv511-muted">Clube ou competição salvos neste aparelho, sem atualizações em segundo plano.</p><div id="cv511Favorites"></div></div><div class="cv511-box" style="grid-column:span 2"><div class="cv511-row"><h3 style="flex:1">Manchetes e movimentações</h3><button id="cv511ShowSaved" class="cv511-soft" type="button">Salvas (0)</button></div><div id="cv511Articles"></div></div></div>
    <div class="cv511-box"><h3>Fontes para conferir os registros</h3><p class="cv511-muted">A origem é indispensável. Confira anúncios de clubes e federações, registros oficiais e a data de cada matéria antes de utilizar um dado profissionalmente.</p><div id="cv511Sources" class="cv511-source-links"></div><p class="cv511-muted">O CoachVoice consulta manchetes do Google Notícias RSS somente quando solicitado. Não utiliza scraping de elencos protegidos, não tem integração com BID e não garante cobertura completa de todas as transações. Notícias não são confirmação de inscrição.</p></div>`;
    document.querySelector('main').insertBefore(page,document.querySelector('.bottom-nav'));
    const sources=$('cv511Sources');for(const [name,url] of SOURCES)sources.append(link(name,url));
    $('cv511Competition').addEventListener('change',e=>{filter.competition=e.target.value;filter.club='';if(filter.competition==='a4')filter.state='SP';selectionChanged();});
    $('cv511State').addEventListener('change',e=>{filter.state=e.target.value;selectionChanged();});
    $('cv511Club').addEventListener('change',e=>{filter.club=e.target.value;selectionChanged();});
    $('cv511FreeClub').addEventListener('change',e=>{filter.club=e.target.value.trim().slice(0,65);selectionChanged();});
    $('cv511FreeClub').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();filter.club=e.target.value.trim().slice(0,65);selectionChanged();load();}});
    $('cv511Refresh').addEventListener('click',()=>{if(filter.competition!=='a4'){filter.club=$('cv511FreeClub').value.trim().slice(0,65);store();}load();});
    $('cv511Favorite').addEventListener('click',()=>{if(filter.competition!=='a4')filter.club=$('cv511FreeClub').value.trim().slice(0,65);const f=currentFavorite();state.favorites=isFav()?state.favorites.filter(x=>favoriteKey(x)!==favoriteKey(f)):[f,...state.favorites].slice(0,30);store();renderFilters();renderFavorites();});
    $('cv511OpenCompetitions').addEventListener('click',()=>window.go?.('competitions'));
    $('cv511ShowSaved').addEventListener('click',()=>{showSaved=!showSaved;renderArticles();});
    $('cv511Listen').addEventListener('click',speakBulletin);
    $('cv511Stop').addEventListener('click',()=>{window.mentor531StopAudioPlayback?.();$('cv511AudioStatus').textContent='Boletim interrompido.';});
    renderFilters();articles=state.feeds[key()]?.articles||[];renderFavorites();renderArticles();
  }
  function selectionChanged(){req?.abort();articles=state.feeds[key()]?.articles||[];store();renderFilters();showSaved=false;renderArticles();status('Seleção alterada. Toque em Atualizar para buscar notícias deste clube.');}
  function mount(){
    buildPage();const nav=[...document.querySelectorAll('.cv55-drawer-main .drawer-link,.drawer-scroll .drawer-link')].find(x=>/Competições e notícias/i.test(x.textContent||''));
    if(nav&&!$('cv511NavEntry')){const b=button('⚽ Mercado da Bola','drawer-link cv511-entry',()=>window.go('market'));b.id='cv511NavEntry';b.dataset.page='market';nav.insertAdjacentElement('afterend',b);}
    // Link in the competitions area after the Noticias section, not replacing that module.
    const addHome=()=>{if($('cv511HomeShortcut'))return;const card=node('div','cv511-mini');card.id='cv511HomeShortcut';card.append(node('strong',null,'⚽ Radar de Mercado'));card.append(node('p','cv511-muted','Paulista A4 2027, Séries A–D, estaduais e clubes favoritos.'));card.append(button('Abrir Mercado da Bola','cv511-primary cv511-home-link',()=>window.go('market')));const host=$('central')||$('dashboard');if(host)host.append(card);};addHome();const home=$('central');if(home)new MutationObserver(addHome).observe(home,{childList:true});
    document.getElementById('competitions')?.addEventListener('click',e=>{if(e.target.closest('[data-cv511-go-market]'))window.go('market');});
    const originalGo=window.go;if(typeof originalGo==='function')window.go=function(id){originalGo(id);if(id==='market'){$('topSubtitle').textContent='Football Intelligence · Mercado';const cached=state.feeds[key()];if(cached){articles=cached.articles||[];renderArticles();status(`Consulta armazenada em ${date(cached.at)}. Atualize para novas manchetes.`);}}};
  }
  window.coach511Market={open:()=>window.go('market'),load,selection:()=>({...filter}),snapshot:()=>({favorites:state.favorites.length,saved:state.saved.length,articles:articles.length})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
