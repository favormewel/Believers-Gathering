var V="fl-v40";
self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET")return;
  var u=new URL(r.url),same=u.origin===location.origin;
  var cdn=/(^|\.)(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname);
  if(!same&&!cdn)return;
  var page=r.mode==="navigate"||(same&&/\/(index\.html)?$/.test(u.pathname))||(same&&/\/config\.js$/.test(u.pathname));
  e.respondWith(page?netFirst(r,3500):swr(e))});
function swr(e){var r=e.request;
  return caches.open(V).then(function(c){return c.match(r).then(function(m){
    var net=fetch(r).then(function(res){if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res}).catch(function(){return null});
    if(m){e.waitUntil(net);return m}
    return net.then(function(res){return res||Response.error()})})})}
function netFirst(r,ms){
  return new Promise(function(resolve){
    var done=false;
    var t=setTimeout(function(){caches.match(r).then(function(m){if(m&&!done){done=true;resolve(m)}})},ms);
    fetch(r).then(function(res){clearTimeout(t);if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}if(!done){done=true;resolve(res)}})
    .catch(function(){clearTimeout(t);caches.match(r).then(function(m){return m||(r.mode==="navigate"?caches.match("index.html").then(function(x){return x||caches.match("./")}):null)}).then(function(m){if(!done){done=true;resolve(m||Response.error())}})})})}
// ---- push notifications
self.addEventListener("push",function(e){
  var d={};try{d=e.data?e.data.json():{}}catch(x){d={title:"Chen Network",body:e.data?e.data.text():""}}
  e.waitUntil(self.registration.showNotification(d.title||"Chen Network",{body:d.body||"",tag:d.tag||undefined,icon:"icon-192.png?v=21",badge:"favicon-48.png?v=21",data:{open:d.open||""}}))});
self.addEventListener("notificationclick",function(e){
  e.notification.close();var d=e.notification.data||{};
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++){if("focus" in cs[i]){cs[i].postMessage({open:d.open});return cs[i].focus()}}
    return clients.openWindow("./"+(d.open?"?open="+encodeURIComponent(d.open):""))}))});
