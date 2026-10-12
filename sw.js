/* عامل الخدمة: يفتح الدفتر دون إنترنت، ويجلب أحدث نسخة كلما توفر الاتصال */
const V='ledger-cache-v2';
const FILES=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>
    fetch(new Request(f,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error('bad');return c.put(f,r)})
  ))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(V);
    const fromNet=fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{if(res&&res.ok)cache.put(r,res.clone());return res});
    fromNet.catch(()=>{});
    const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('slow')),4000));
    try{return await Promise.race([fromNet,timeout])}
    catch(_){
      const hit=(await cache.match(r,{ignoreSearch:true}))||(await cache.match('./index.html'));
      return hit||fromNet.catch(()=>new Response('غير متاح دون إنترنت',{status:503}));
    }
  })());
});
