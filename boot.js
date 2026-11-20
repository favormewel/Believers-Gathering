(function(){
function $(i){return document.getElementById(i)}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
var C=window.FAITHLINK_CONFIG||{},dbmode=!!(C.SUPABASE_URL&&C.SUPABASE_URL.indexOf("YOUR_")!==0&&window.FL_DBC);
function cached(){try{for(var i=0;i<localStorage.length;i++){if(/^sb-.+-auth-token$/.test(localStorage.key(i)))return true}}catch(e){}return false}
var opt=dbmode&&cached()&&!!ls("fl-welcomed");
var t0=Date.now(),known=!dbmode,has=false,done=false,SAVE=["home","messages","explore","updates","menu","groups","nearby","bible","profile","chat","reader"];
var raw=window.show;
window.show=function(id){raw(id);if(done&&SAVE.indexOf(id)>=0)ls("fl-screen",id)};
window.FL_AUTHED=function(h){has=h;known=true;if(done&&opt&&!h){opt=false;raw("login");return}go()};
if(window.FL_KNOWN){known=true;has=!!window.FL_HAS}
function go(){if(done)return;var w=Date.now()-t0;if(w<450){setTimeout(go,450-w);return}if(!known&&!opt&&w<4000){setTimeout(go,4000-w);return}done=true;route()}
function restore(){var l=ls("fl-screen");
  if(l==="chat"){if(dbmode){var g0=ls("fl-gid");raw("groups");if(window.FL_RESUME)window.FL_RESUME(g0);else window.FL_RESUME_GID=g0}else raw("chat")}
  else if(l==="reader"&&window.FLB&&window.FLB.resume)window.FLB.resume();
  else if(l&&["home","messages","explore","updates","menu","nearby","bible","profile"].indexOf(l)>=0)raw(l);
  else raw("home")}
function route(){window.FL_BOOTED=true;
  if(!ls("fl-welcomed")){raw("welcome1");return}
  if(dbmode&&!has&&!opt){raw("login");return}
  restore()}
document.addEventListener("click",function(e){if(e.target.closest("[data-fin]")){ls("fl-welcomed",true);if(dbmode&&!has)raw("login");else restore()}});
setTimeout(go,50);
})();
