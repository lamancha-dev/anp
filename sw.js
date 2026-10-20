self.addEventListener('push', event => {
  let data={};
  try { data=event.data?.json() || {}; } catch { data={body:event.data?.text()||'Nova mensagem da ANP'}; }
  const title=typeof data.title==='string'?data.title:'ANP — Nova notificação';
  const options={body:typeof data.body==='string'?data.body:'Tens uma novidade na ANP.',tag:'anp-'+Date.now(),data:{url:'./index.html'}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async()=>{
    const url=new URL('./index.html',self.registration.scope).href;
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){ if(client.url.startsWith(self.location.origin)){await client.focus();return;} }
    await clients.openWindow(url);
  })());
});

// Cache limitado aos ficheiros da aplicação, sem guardar dados privados nem pedidos.
const ANP_CACHE='anp-shell-v1';
const ANP_SHELL=['./index.html','./manifest.webmanifest','./favicon.png','./anp-192.png','./anp-512.png','./anp-maskable-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(ANP_CACHE).then(cache=>cache.addAll(ANP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('anp-shell-')&&key!==ANP_CACHE).map(key=>caches.delete(key))))]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('./index.html')));
  } else if(ANP_SHELL.some(path=>new URL(path,self.registration.scope).pathname===url.pathname)){
    event.respondWith(fetch(request).catch(()=>caches.match(request,{ignoreSearch:true})));
  }
});
