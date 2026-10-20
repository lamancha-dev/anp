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
