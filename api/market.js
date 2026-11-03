// CoachVoice Mercado: agregação de manchetes RSS; nenhum resultado equivale a contratação confirmada.
const VALID=new Set(['a4','a','b','c','d','estadual']);
const STATES={SP:'Paulista',PE:'Pernambucano',RJ:'Carioca',MG:'Mineiro',RS:'Gaúcho',SC:'Catarinense',PR:'Paranaense',BA:'Baiano',CE:'Cearense',GO:'Goiano',PA:'Paraense',AM:'Amazonense',RN:'Potiguar',PB:'Paraibano',AL:'Alagoano',SE:'Sergipano',MA:'Maranhense',PI:'Piauiense',MT:'Mato-grossense',MS:'Sul-mato-grossense',ES:'Capixaba',DF:'Brasiliense',TO:'Tocantinense',RO:'Rondoniense',RR:'Roraimense',AP:'Amapaense',AC:'Acreano'};
const LIMIT=30;
const terms={a4:'"Paulista A4" 2027',a:'"Série A" futebol brasileiro',b:'"Série B" futebol brasileiro',c:'"Série C" futebol brasileiro',d:'"Série D" futebol brasileiro'};
function stripTags(s){return String(s||'').replace(/<[^>]*>/g,'').trim();}
function unescapeXml(s){return stripTags(String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')).replace(/&#(x[0-9a-f]+|[0-9]+);|&([a-z]+);/gi,(_,num,key)=>{
  if(num){let cp=Number.parseInt(num[0].toLowerCase()==='x'?num.slice(1):num,num[0].toLowerCase()==='x'?16:10);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):'';}
  return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[key.toLowerCase()]||'';
}).slice(0,300);}
const extract=(part,tag)=>{const m=String(part).match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?unescapeXml(m[1]):'';};
function parseRSS(xml){
  const items=[...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,LIMIT);
  const seen=new Set(); const result=[];
  for(const [,block] of items){
    const title=extract(block,'title'),url=extract(block,'link'),source=extract(block,'source')||'Google Notícias',date=extract(block,'pubDate');
    if(!title||!/^https:\/\/news\.google\.com\//i.test(url)||seen.has(url))continue;
    seen.add(url); result.push({title,url,source, publishedAt:Number.isFinite(Date.parse(date))?new Date(date).toISOString():null, status:'noticia-nao-verificada'});
  }
  return result;
}
function reply(res,status,obj){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control',status===200?'public, s-maxage=300, stale-while-revalidate=60':'no-store');res.end(JSON.stringify(obj));}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return reply(res,405,{error:'Método não permitido.'});}
  const competition=String(req.query?.competition||'a4').toLowerCase();
  if(!VALID.has(competition))return reply(res,400,{error:'Competição não disponível.'});
  const state=String(req.query?.state||'SP').toUpperCase();
  if(competition==='estadual'&&!STATES[state])return reply(res,400,{error:'Estado inválido.'});
  const club=String(req.query?.club||'').replace(/[^\p{L}\p{N}\s.\-]/gu,'').trim().slice(0,65);
  const topic=competition==='estadual'?`Campeonato ${STATES[state]} futebol`:(terms[competition]);
  const query=`${topic} ${club?`"${club}"`:''} (contratação OR transferências OR renovação OR reforços OR saída OR elenco OR técnico) when:60d`;
  const url='https://news.google.com/rss/search?'+new URLSearchParams({q:query,hl:'pt-BR',gl:'BR',ceid:'BR:pt-419'});
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),9000);
  try{
    const response=await fetch(url,{headers:{'Accept':'application/rss+xml, application/xml;q=0.9'},signal:controller.signal});
    if(!response.ok)throw Error('RSS retornou '+response.status);
    const body=await response.text();
    if(body.length>1000000)throw Error('Feed muito grande');
    return reply(res,200,{ok:true,competition,state,club,queriedAt:new Date().toISOString(),source:'Google Notícias RSS',articles:parseRSS(body),searchUrl:'https://news.google.com/search?'+new URLSearchParams({q:query,hl:'pt-BR',gl:'BR',ceid:'BR:pt-419'})});
  }catch(error){return reply(res,502,{ok:false,error:'Não foi possível consultar as manchetes agora. Utilize os links das fontes.',code:'feed_unavailable'});}
  finally{clearTimeout(timeout);}
}
export const marketInternal={parseRSS,extract,unescapeXml};
