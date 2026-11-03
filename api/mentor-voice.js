/* CoachVoice v5.11 — server-only Gemini TTS with explicit voice selection.
   GEMINI_API_KEY is read only on the server; no secrets enter the client bundle. */
const VOICES=Object.freeze({male:'Orus',female:'Kore',auto:'Gacrux'});
function respond(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
function wav(pcm,rate=24000){const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);return Buffer.concat([header,pcm]);}
function selectVoice(value){return VOICES[value]||VOICES.auto;}
function candidates(){return [...new Set([process.env.GEMINI_TTS_MODEL,'gemini-3.1-flash-tts-preview','gemini-2.5-flash-preview-tts'].filter(Boolean))].slice(0,3);}
function extract(d){
 const fromSteps=(d?.steps||[]).flatMap(s=>s?.content||[]).filter(p=>p?.type==='audio'&&p?.data);
 const fromCandidates=(d?.candidates||[]).flatMap(c=>c?.content?.parts||[]).map(p=>p?.inlineData||p?.inline_data).filter(p=>p?.data);
 return fromSteps.at(-1)||d?.output_audio||fromCandidates[0]||null;
}
function audioBuffer(part){
 if(!part?.data||!/^[-A-Za-z0-9+/=\s]+$/.test(part.data))return null;
 let b=Buffer.from(part.data,'base64');const mime=String(part.mime_type||part.mimeType||'').toLowerCase();
 if(b.length<64||b.length>4*1024*1024)return null;
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE')return b;
 if(/l16|pcm|audio\/raw/.test(mime)||(!mime&&b.length%2===0)){
   if(b.length%2!==0)return null;let rate=Number(mime.match(/rate=(\d+)/)?.[1])||24000;
   if(!Number.isFinite(rate)||rate<8000||rate>96000)rate=24000;
   b=wav(b,rate);return b;
 }
 return null;
}
async function callGoogle(apiKey,model,text,voice,language,signal){
 const newApi=/^gemini-3\./.test(model);
 const url=newApi?'https://generativelanguage.googleapis.com/v1beta/interactions':`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
 const body=newApi?{
   model,store:false,input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style:`Leia exatamente o texto em ${language}, com voz natural, clara e pausas profissionais. Não acrescente palavras.`}]}]}],response_format:{type:'audio',mime_type:'audio/wav'},generation_config:{speech_config:[{voice}]}
 }:{contents:[{parts:[{text:`Leia exatamente em ${language} o texto a seguir, sem acrescentar palavras. Fale naturalmente.\n${text}`}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}};
 const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify(body),signal});
 const d=await r.json().catch(()=>({}));return {status:r.status,ok:r.ok,data:d};
}
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return respond(res,405,{error:'Método não permitido.'});}
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return respond(res,400,{error:'JSON inválido.'});}
 const text=String(body?.text||'').trim();if(!text||text.length>3000)return respond(res,400,{error:'O trecho deve ter de 1 a 3000 caracteres.'});
 const apiKey=process.env.GEMINI_API_KEY;if(!apiKey)return respond(res,503,{error:'GEMINI_API_KEY não configurada no servidor.'});
 const voice=selectVoice(body?.voice),language=({'pt-BR':'português brasileiro','en-US':'inglês americano','en-GB':'inglês britânico','es-ES':'espanhol','es-MX':'espanhol latino-americano'})[body?.language]||'português brasileiro';
 let last={status:502,code:'voice_unavailable'};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),46000);
 try{
  for(const model of candidates()){
   let x;try{x=await callGoogle(apiKey,model,text,voice,language,controller.signal);}catch(e){last={status:504,code:e.name==='AbortError'?'timeout':'provider_error'};break;}
   if(x.ok){const audio=audioBuffer(extract(x.data));if(audio){res.statusCode=200;res.setHeader('Content-Type','audio/wav');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Length',String(audio.length));res.setHeader('X-CoachVoice-Voice',voice);res.end(audio);return;}last={status:502,code:'invalid_audio'};}
   else{last={status:x.status===429?429:502,code:x.data?.error?.status||`gemini_${x.status}`};}
   // Retry only unsupported/missing models; permissions, quota, and invalid voice aren't helped by cycling models.
   if(![400,404,422].includes(x.status))break;
  }
  return respond(res,last.status,{error:last.status===429?'Limite temporário de voz. Tente mais tarde.':'A voz selecionada não pôde ser gerada. Confira sua configuração e tente novamente.',code:last.code,requestedVoice:voice});
 }catch{return respond(res,502,{error:'Falha na geração de voz. A resposta permanece disponível em texto.'});}
 finally{clearTimeout(timer);}
}
export const voiceInternals={selectVoice,audioBuffer,extract,candidates};
