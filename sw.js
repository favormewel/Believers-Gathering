// CHRIST HUB service worker: opens the app offline and keeps files fresh.
var V="fl-v10";
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(["./","index.html","manifest.webmanifest","icons/icon-192.png"])}).catch(function(){}));self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET")return;
  var u=new URL(r.url);if(u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){
    return caches.match(r).then(function(m){return m||(r.mode==="navigate"?caches.match("index.html"):Response.error())})}))});
