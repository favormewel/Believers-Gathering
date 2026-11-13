var V="fl-v18";
self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET")return;
  var u=new URL(r.url);if(u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){
    return caches.match(r).then(function(m){return m||(r.mode==="navigate"?caches.match("index.html"):Response.error())})}))});
// ---- push notifications
self.addEventListener("push",function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:"Chen Network",body:e.data?e.data.text():""}}
  e.waitUntil(self.registration.showNotification(d.title||"Chen Network",{body:d.body||"",tag:d.tag||undefined,icon:"icons/icon-192.png",badge:"icons/favicon-48.png",data:{open:d.open||""}}))});
self.addEventListener("notificationclick",function(e){
  e.notification.close();var d=e.notification.data||{};
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if("focus" in cs[i]){cs[i].postMessage({open:d.open});return cs[i].focus()}}
    return clients.openWindow("./"+(d.open?"?open="+encodeURIComponent(d.open):""))}))});
