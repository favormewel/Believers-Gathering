(function(){
var SYS="system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif";
function $(i){return document.getElementById(i)}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
var standalone=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
var deferred=null,banner=null,sheet=null;
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}
function btn(id,t,css,label){return '<button id="'+id+'"'+(label?' aria-label="'+label+'"':'')+' style="'+css+'">'+t+'</button>'}
function mkBanner(){
  var b=document.createElement("div");b.id="install-banner";b.hidden=true;
  b.style.cssText="position:fixed;left:12px;right:12px;bottom:72px;max-width:406px;margin:0 auto;padding:10px 6px 10px 12px;border-radius:16px;background:#2B2118;color:#fff;display:flex;gap:10px;align-items:center;box-shadow:0 6px 20px rgba(43,33,24,.35);z-index:40;font-family:"+SYS;
  b.innerHTML='<svg width="36" height="36" viewBox="0 0 44 44" aria-hidden="true" style="flex:none"><rect width="44" height="44" rx="12" fill="#E2B04E"/><rect x="19" y="9" width="6" height="26" rx="1.5" fill="#fff"/><rect x="12" y="16" width="20" height="6" rx="1.5" fill="#fff"/></svg><div style="flex:1;min-width:0"><b style="font-size:13px">Install CHRIST HUB</b><div style="font-size:12px;color:#E4D9CC">Open it like an app from your home screen.</div></div>'
   +btn("install-go","Install","min-height:44px;padding:0 16px;border:0;border-radius:22px;background:#E2B04E;color:#222;font:700 13px "+SYS)
   +btn("install-x","&times;","width:44px;height:44px;border:0;background:none;color:#fff;font-size:20px","Dismiss");
  document.body.appendChild(b);banner=b}
function mkSheet(){
  var s=document.createElement("div");s.id="install-sheet";s.hidden=true;
  s.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(43,33,24,.45);display:flex;align-items:flex-end;justify-content:center;z-index:60";
  s.innerHTML='<div style="width:100%;max-width:430px;background:#fff;border-radius:24px 24px 0 0;padding:12px 20px 24px;box-sizing:border-box;font-family:'+SYS+';color:#222"><div style="width:40px;height:4px;border-radius:2px;background:#D5CCBE;margin:0 auto 12px"></div><b style="font-size:16px">Install CHRIST HUB</b><div id="install-steps" style="font-size:14px;line-height:1.5;margin:10px 0 14px"></div>'
   +btn("install-close","Got it","width:100%;min-height:48px;border:0;border-radius:24px;background:#E2B04E;color:#222;font:700 14px "+SYS)+'</div>';
  document.body.appendChild(s);sheet=s}
function steps(){
  return ios?'<ol style="margin:0;padding-left:20px"><li>Tap the <b>Share</b> button at the bottom of Safari (a square with an arrow).</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. The CHRIST HUB icon appears on your home screen.</li></ol><p style="margin:8px 0 0;color:#6B6055">This works in Safari. In other iPhone browsers, open this page in Safari first.</p>'
   :'<ol style="margin:0;padding-left:20px"><li>Open your browser menu (the three dots).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Tap <b>Install</b>. The CHRIST HUB icon appears on your home screen.</li></ol>'}
function install(){
  if(deferred){var d=deferred;deferred=null;d.prompt();if(d.userChoice)d.userChoice.then(hide,hide);return}
  if(!sheet)mkSheet();$("install-steps").innerHTML=steps();sheet.hidden=false}
function hide(){if(banner)banner.hidden=true;var r=$("install-row");if(r&&(standalone||false))r.hidden=true}
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferred=e});
window.addEventListener("appinstalled",function(){standalone=true;if(banner)banner.hidden=true;var r=$("install-row");if(r)r.hidden=true});
document.addEventListener("click",function(e){var t=e.target;
  if(t.closest("#install-row")||t.closest("#install-go")){install();return}
  if(t.closest("#install-x")){banner.hidden=true;ls("fl-install-x",Date.now());return}
  if(t.closest("#install-close")||t.id==="install-sheet"){sheet.hidden=true}});
var row=$("install-row");if(row&&!standalone)row.hidden=false;
function mainVisible(){return["groups","prayer","bible","nearby","profile"].some(function(i){var s=$(i);return s&&!s.hidden})}
if(!standalone){mkBanner();
  setTimeout(function tick(){var x=ls("fl-install-x");if(x&&Date.now()-x<7*864e5)return;
    if(mainVisible()&&(deferred||ios)){banner.hidden=false}else setTimeout(tick,4000)},7000)}
})();
