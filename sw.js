const CACHE='coachvoice-v5.11.2-voz-estavel';
const FILES=['/','/index.html','/manifest.webmanifest','/icon-192.png','/icon-512.png','/studio.css','/studio.js','/studio-framing.js','/coachvoice-v33.js','/coachday.css','/coachday-v40.js','/coachprep.css','/coachprep-v42.js','/mentor-v52.css','/mentor-v52.js','/dashboard-v51.css','/dashboard-v51.js','/languages-v50.css','/languages-v50.js','/today-v52.js','/ui-v52.css','/mobile-v522.css','/mobile-v522.js','/pro-v53.css','/pro-v53.js','/mentor-audio-v531.js','/session-v54.js','/session-v54.css','/voice-unlock.wav','/central-v55.css','/central-v55.js','/conversation-merge-v56.js','/conversation-merge-v56.css','/competitions-v58.js','/competitions-v58.css','/data/competition-a4-2027.json','/study-v56.js','/study-v56.css','/study-library-v56.js','/study-library-v56.json','/growth-v55.js','/growth-v55.css','/study-library-private-v510.js','/market-v511.js','/market-v511.css','/voice-test-v511.js','/stable-speech-v5112.js','/news-nav-v5111.css'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
  event.respondWith(
    fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(async()=>{
      const cached=await caches.match(event.request) || await caches.match(url.pathname);
      if(cached)return cached;
      if(event.request.mode==='navigate')return caches.match('/index.html');
      return new Response('Offline',{status:503,statusText:'Offline'});
    })
  );
});
