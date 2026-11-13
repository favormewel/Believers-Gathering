(function(){
var C=window.FAITHLINK_CONFIG||{},KEY=C.VAPID_PUBLIC_KEY,db=window.FL_DBC;
if(!db||!KEY||String(KEY).indexOf("YOUR_")===0)return;
var SYS="system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif";
function $(i){return document.getElementById(i)}
var ok=("serviceWorker" in navigator)&&("PushManager" in window)&&("Notification" in window);
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function key(s){var p="=".repeat((4-s.length%4)%4),b=(s+p).replace(/-/g,"+").replace(/_/g,"/"),r=atob(b),o=new Uint8Array(r.length);for(var i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}
function me(){var u=window.FL_USER||(window.FLC&&window.FLC.user&&window.FLC.user());return u&&u.id}
function cur(){return navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription().then(function(sub){return{reg:reg,sub:sub}})})}
function label(on){var r=$("push-row");if(!r)return;var s=r.querySelector("span");
  s.textContent=!ok?"Notifications":(Notification.permission==="denied"?"Notifications are blocked":on?"Notifications are on":"Turn on notifications");
  var t=r.querySelector(".st");t.textContent=!ok?"":on?"On":"Off";t.style.color=on?"#1B6B3A":"#6B6055"}
function refresh(){if(!ok){label(false);return}cur().then(function(o){label(!!o.sub);if(o.sub&&me())save(o.sub)}).catch(function(){label(false)})}
function save(sub){var j=sub.toJSON();return db.from("push_subscriptions").upsert({user_id:me(),endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth},{onConflict:"endpoint"})}
function enable(){
  return Notification.requestPermission().then(function(p){
    if(p!=="granted"){alert("Notifications are blocked. Turn them on for this site in your browser or phone settings, then try again.");return}
    return cur().then(function(o){return o.sub||o.reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key(KEY)})}).then(function(sub){return save(sub).then(function(r){if(r&&r.error){alert("Could not save your notification settings. Please try again.");return}label(true)})})})}
function disable(){return cur().then(function(o){if(!o.sub)return;var ep=o.sub.endpoint;return o.sub.unsubscribe().then(function(){return db.from("push_subscriptions").delete().eq("endpoint",ep)})}).then(function(){label(false)})}
function mk(){
  if($("push-row"))return;var so=$("sign-out");if(!so||!so.parentNode)return;
  var r=document.createElement("button");r.id="push-row";
  r.style.cssText="display:flex;justify-content:space-between;align-items:center;width:100%;min-height:56px;padding:0 20px;border:0;border-bottom:1px solid #F0E2C8;background:#FFFAF2;font:600 15px "+SYS+";color:#222;text-align:left";
  r.innerHTML='<span></span><span class="st" style="font-size:13px;font-weight:700"></span>';so.parentNode.insertBefore(r,so);label(false)}
document.addEventListener("click",function(e){
  if(!e.target.closest("#push-row"))return;
  if(!ok){alert(ios?"On iPhone, first install the app: tap Share in Safari, then Add to Home Screen. Open Chen Network from your home screen and turn on notifications there.":"This browser does not support notifications.");return}
  cur().then(function(o){return o.sub?disable():enable()}).catch(function(){alert("Could not change notifications. Please try again.")})});
if(ok)navigator.serviceWorker.addEventListener("message",function(e){if(e.data&&e.data.open&&window.FLS&&window.FLS.openById)window.FLS.openById(e.data.open)});
mk();refresh();
var iv=setInterval(function(){if(me()){clearInterval(iv);refresh()}},1500);setTimeout(function(){clearInterval(iv)},30000);
})();
