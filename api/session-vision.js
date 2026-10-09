const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
export default async function handler(req,res){
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  const key=process.env.GEMINI_API_KEY;if(!key)return send(res,503,{error:'A análise visual não está configurada.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return send(res,400,{error:'Pedido inválido.'});}
  const frames=body?.frames;
  if(!Array.isArray(frames)||!frames.length||frames.length>4||frames.some(f=>typeof f?.data!=='string'||f.data.length>260000||!/^[-+/=A-Za-z0-9]+$/.test(f.data)))return send(res,400,{error:'Envie de 1 a 4 imagens JPEG pequenas.'});
  const context=String(body.context||'').slice(0,3000),transcript=String(body.transcript||'').slice(0,5000);
  const prompt=`Você é orientador de comunicação de um treinador. Analise SOMENTE os quadros JPEG enviados e a transcrição. Retorne JSON {"observations":[{"evidence":"...","suggestion":"..."}],"limits":"...","nextAttempt":"..."}. Máximo 3 observações visuais concretas: enquadramento, posição do corpo, mãos visíveis, direção aparente da cabeça/olhar. Cite quais quadros sustentam a observação. Não infira emoções, personalidade, saúde ou competência; não afirme ouvir a voz ou assistir ao vídeo completo. Não avalie gestos em movimento a partir de quadros estáticos. Se algo não estiver visível, diga que não é possível avaliar. Separe conteúdo verbal de observação visual. Português brasileiro. Contexto: ${context}\nTranscrição: ${transcript}`;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),40000);
  try{
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL||'gemini-3.1-flash-lite')}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:controller.signal,body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},...frames.flatMap((f,i)=>[{text:`Quadro ${i+1}, ${Number(f.seconds)||0} segundos.`},{inlineData:{mimeType:'image/jpeg',data:f.data}}])]}],generationConfig:{responseMimeType:'application/json',temperature:.2,maxOutputTokens:1500}})});
    const data=await response.json();if(!response.ok)return send(res,response.status===429?429:502,{error:'A análise visual não respondeu. Seu vídeo continua salvo.'});
    const text=data.candidates?.flatMap(c=>c.content?.parts||[]).filter(p=>p.text).map(p=>p.text).join('')||'';
    const result=JSON.parse(text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
    if(!Array.isArray(result.observations))throw new Error('shape');
    return send(res,200,{observations:result.observations.slice(0,3).map(o=>({evidence:String(o.evidence||'').slice(0,700),suggestion:String(o.suggestion||'').slice(0,700)})),limits:String(result.limits||'Análise de quadros estáticos; movimentos e voz não foram avaliados.').slice(0,1500),nextAttempt:String(result.nextAttempt||'').slice(0,700)});
  }catch{return send(res,502,{error:'A análise visual não pôde ser concluída. Seu vídeo continua disponível.'});}finally{clearTimeout(timer);}
}
