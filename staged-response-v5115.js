/* CoachVoice 5.11.5: apresenta a resposta já recebida em até três etapas.
 * Não faz novas solicitações ao modelo; revelar mais conteúdo não consome cota.
 */
(()=>{
 'use strict';
 function partition(items, requested=3){
   const values=Array.from(items||[]).filter(x=>x&&String(x).trim());
   const n=Math.min(3,Math.max(1,Number(requested)||3),values.length);
   const groups=Array.from({length:n},()=>[]);
   values.forEach((value,i)=>groups[Math.min(n-1,Math.floor(i*n/values.length))].push(value));
   return groups;
 }
 function mount(host, assignments){
   if(!host||!Array.isArray(assignments))return null;
   host.querySelectorAll('.coach5115-stage-controls').forEach(e=>e.remove());
   const items=assignments.filter(x=>x&&x.element&&x.element.isConnected!==false);
   const actual=[...new Set(items.map(x=>x.group))];
   if(actual.length<2){items.forEach(({element})=>element.classList.remove('coach5115-stage-hidden'));return null;}
   let current=0;
   const parent=host.querySelector('.study56-output')||host;
   const bar=document.createElement('div');bar.className='coach5115-stage-controls';
   const label=document.createElement('span');label.className='coach5115-stage-counter';label.setAttribute('role','status');label.setAttribute('aria-live','polite');
   const next=document.createElement('button');next.type='button';next.textContent='Continuar leitura';
   const all=document.createElement('button');all.type='button';all.textContent='Ver resposta completa';
   const read=document.createElement('button');read.type='button';read.textContent='🔊 Ouvir esta parte';
   bar.append(label,next,all,read);parent.append(bar);
   const stageAt=n=>actual.indexOf(n);
   const visible=()=>items.filter(x=>stageAt(x.group)<=current);
   const render=()=>{
     for(const item of items){const hide=stageAt(item.group)>current;item.element.classList.toggle('coach5115-stage-hidden',hide);item.element.setAttribute('aria-hidden',String(hide));}
     label.textContent=`Etapa ${current+1} de ${actual.length} · a resposta completa já foi recebida`;
     next.hidden=current>=actual.length-1;all.hidden=current>=actual.length-1;
     next.textContent=current===actual.length-2?'Ver última parte':'Continuar leitura';
   };
   next.addEventListener('click',()=>{current=Math.min(actual.length-1,current+1);render();});
   all.addEventListener('click',()=>{current=actual.length-1;render();});
   read.addEventListener('click',()=>{
     const text=items.filter(x=>stageAt(x.group)===current).map(x=>x.element.innerText||x.element.textContent||'').join('\n').trim();
     if(!text)return;
     const engine=window.coach5112Voice;
     if(engine?.speak){engine.speak(text,{lang:'pt-BR'}).then(status=>{if(status!=='completed')label.textContent='Não foi possível tocar a voz. Você pode ler o texto acima.';});}
     else if(window.speechSynthesis&&window.SpeechSynthesisUtterance){window.speechSynthesis.cancel();const utterance=new window.SpeechSynthesisUtterance(text);utterance.lang='pt-BR';window.speechSynthesis.speak(utterance);}
   });
   render();return {showAll:()=>{current=actual.length-1;render();},currentText:()=>items.filter(x=>stageAt(x.group)===current).map(x=>x.element.innerText||x.element.textContent||'').join('\n')};
 }
 function growth(){const reading=document.querySelector('#growth55Readable');if(!reading)return;
  const children=Array.from(reading.children),devotional=reading.classList.contains('devotional-reading');
  const buckets=devotional?[0,0,1,2]:[0,0,1,1,2,2];
  mount(document.getElementById('growth55ModalBody'),children.map((element,i)=>({element,group:buckets[Math.min(i,buckets.length-1)]})));
 }
 function study(){const output=document.querySelector('#study56StudyResult .study56-output');if(!output)return;
  const children=Array.from(output.children);
  const grouped=children.map((element,i)=>{
    let group=0;
    if(element.classList.contains('study56-output-actions')||element.querySelector?.('.study56-output-actions'))group=2;
    else if(element.classList.contains('study56-output-section')){
      const text=(element.querySelector('span')?.textContent||'').toLowerCase();
      group=/tensões|perguntas/.test(text)?2:1;
    }
    return {element,group};
  });
  // Se não houver referências nem síntese, não criar uma etapa vazia.
  mount(document.getElementById('study56StudyResult'),grouped);
 }
 window.coach5115Stages={mount,partition,growth,study};
})();
