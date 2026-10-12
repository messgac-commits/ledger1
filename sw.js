/* عامل الخدمة: يحفظ الدفتر على الجهاز ليعمل دون إنترنت بعد أول فتح */
const V='ledger-cache-v1';
const FILES=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(V);
    const hit=await cache.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res&&res.ok)cache.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const res=await net;
    return res||(await cache.match('./index.html'))||new Response('غير متاح دون إنترنت',{status:503});
  })());
});
