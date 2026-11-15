/* CoachVoice 5.11.6 — Resposta do Coach em etapas, sem novas chamadas à IA.
 * As três partes são obtidas do MESMO texto que já chegou ao navegador.
 * O histórico mantém a resposta completa; a voz reproduz as partes em sequência.
 */
(()=>{
  'use strict';
  let state={parts:[],current:0,all:false,panel:null};
  function split(text){
    const source=String(text||'').trim();
    if(!source)return [];
    if(source.length<360)return [source];
    const targetCount=source.length>950?3:2;
    const parts=[];let rest=source;
    for(let i=0;i<targetCount-1;i++){
      const remaining=targetCount-i;
      const aim=Math.floor(rest.length/remaining);
      const lo=Math.max(1,Math.floor(aim*.65));
      const hi=Math.min(rest.length-1,Math.ceil(aim*1.3));
      let best=0,score=Infinity;
      for(let j=lo;j<=hi;j++){
        if(!/\s/.test(rest[j]||''))continue;
        const before=rest.slice(Math.max(0,j-2),j);
        const sentence=/[.!?]\s?$/.test(before);
        const penalty=sentence?0:aim*.2;
        const delta=Math.abs(j-aim)+penalty;
        if(delta<score){score=delta;best=j;}
      }
      if(!best)best=aim;
      const first=rest.slice(0,best).trim();
      if(!first)break;
      parts.push(first);rest=rest.slice(best).trim();
    }
    if(rest)parts.push(rest);
    return parts;
  }
  function ensure(){
    const parent=document.getElementById('cv57VoicePanel');
    if(!parent)return null;
    let panel=document.getElementById('cv5116CoachStages');
    if(panel)return panel;
    panel=document.createElement('section');panel.id='cv5116CoachStages';panel.className='cv5116-stages';panel.hidden=true;
    const head=document.createElement('strong');head.id='cv5116StageTitle';head.setAttribute('role','status');
    const content=document.createElement('p');content.id='cv5116StageText';
    const controls=document.createElement('div');controls.className='cv5116-stage-actions';
    const next=document.createElement('button');next.id='cv5116NextStage';next.type='button';next.textContent='Próxima parte';
    const all=document.createElement('button');all.id='cv5116AllStages';all.type='button';all.textContent='Ver resposta completa';
    next.addEventListener('click',()=>{state.current=Math.min(state.parts.length-1,state.current+1);state.all=false;render();});
    all.addEventListener('click',()=>{state.all=true;render();});
    controls.append(next,all);panel.append(head,content,controls);parent.append(panel);return panel;
  }
  function render(){
    const panel=ensure();if(!panel)return;
    if(state.parts.length<2){panel.hidden=true;return;}
    panel.hidden=false;
    document.getElementById('cv5116StageTitle').textContent=state.all?'Resposta completa do Coach':`Resposta do Coach · parte ${state.current+1} de ${state.parts.length}`;
    document.getElementById('cv5116StageText').textContent=state.all?state.parts.join(' '):state.parts[state.current];
    document.getElementById('cv5116NextStage').hidden=state.all||state.current>=state.parts.length-1;
    document.getElementById('cv5116AllStages').hidden=state.all;
  }
  function present(text){state={parts:split(text),current:0,all:false};render();return state.parts.slice();}
  function onAudioSegment(text,audioIndex){
    if(state.all||state.parts.length<2)return;
    const segment=String(text||'').trim();
    const index=Number.isInteger(audioIndex)&&state.parts[audioIndex]===segment?audioIndex:state.parts.indexOf(segment);
    if(index>=0){state.current=index;render();}
  }
  function revealAll(){if(state.parts.length>1){state.all=true;render();}}
  function reset(){state={parts:[],current:0,all:false};const p=document.getElementById('cv5116CoachStages');if(p)p.hidden=true;}
  window.coach5116Stages={split,present,onAudioSegment,revealAll,reset};
})();
