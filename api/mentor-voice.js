// Audio uses the existing Gemini project key. No credential is sent to the client.
function json(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
function wave(pcm,rate=24000){
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);return Buffer.concat([header,pcm]);
}
export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Use POST para gerar a voz.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return json(res,400,{error:'Pedido de áudio inválido.'});}
  const text=String(body?.text||'').trim();
  if(!text||text.length>3000)return json(res,400,{error:'Envie uma resposta entre 1 e 3000 caracteres.'});
  const apiKey=process.env.GEMINI_API_KEY;
  if(!apiKey)return json(res,503,{error:'A geração de voz não está configurada.'});
  const voice=body?.voice==='male'?'Puck':'Kore';
  const language=({'pt-BR':'Português brasileiro','en-US':'Inglês americano','en-GB':'Inglês britânico','es-ES':'Espanhol da Espanha','es-MX':'Espanhol latino-americano'})[body?.language]||'Português brasileiro';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),40000);
  try{
    const configured=String(process.env.GEMINI_TTS_MODEL||'gemini-3.8-flash-lite-tts');
    const modern=/^gemini-3\.8-/.test(configured);
    let response=await fetch(modern?'https://generativelanguage.googleapis.com/v1beta/interactions':`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(configured)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:controller.signal,
      body:JSON.stringify(modern?{
        model:configured,store:false,input:[{type:'user_input',content:[{type:'text',text,annotations:[{type:'speech_metadata',style:`${language}, claro, natural e acolhedor. Leia o texto exatamente como está.`}]}]}],response_format:{type:'audio',mime_type:'audio/wav'},generation_config:{speech_config:[{voice}]}
      }:{contents:[{parts:[{text:`Leia em ${language}, naturalmente, somente este texto:\n${text}`}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}})
    });
    let data=await response.json().catch(()=>({}));
    // Some projects have not enabled the newest model yet.
    if(modern&&(response.status===404||response.status===400)){
      response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent',{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},signal:controller.signal,
        body:JSON.stringify({contents:[{parts:[{text:`Leia em ${language}, naturalmente, somente este texto:\n${text}`}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}})
      });data=await response.json().catch(()=>({}));
    }
    if(!response.ok)return json(res,response.status===429?429:502,{error:'Não foi possível gerar o áudio agora. Tente novamente.',code:data?.error?.status||'voice_unavailable'});
    const chunks=(data.steps||[]).filter(s=>s.type==='model_output').flatMap(s=>s.content||[]).filter(p=>p.type==='audio'&&p.data);
    const part=chunks.at(-1)||data.output_audio||data.candidates?.flatMap(c=>c.content?.parts||[]).find(p=>p.inlineData?.data)?.inlineData;
    if(!part?.data)return json(res,502,{error:'A IA não devolveu um áudio válido.'});
    let audio=Buffer.from(part.data,'base64');
    const mime=String(part.mime_type||part.mimeType||'');
    if(mime.includes('L16')||mime.toLowerCase().includes('l16'))audio=wave(audio,Number(mime.match(/rate=(\d+)/)?.[1])||24000);
    if(audio.length<44||audio.length>4*1024*1024||audio.toString('ascii',0,4)!=='RIFF')return json(res,502,{error:'O formato ou tamanho do áudio não é compatível.'});
    res.statusCode=200;res.setHeader('Content-Type','audio/wav');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Length',String(audio.length));res.end(audio);
  }catch{return json(res,504,{error:'A geração de voz demorou. Você pode tentar novamente.'});}
  finally{clearTimeout(timer);}
}
