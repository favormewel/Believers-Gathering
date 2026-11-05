(function(){
function $(i){return document.getElementById(i)}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
var C=window.FAITHLINK_CONFIG||{},dbmode=!!(C.SUPABASE_URL&&C.SUPABASE_URL.indexOf("YOUR_")!==0&&window.FL_DBC);
var t0=Date.now(),known=!dbmode,has=false,done=false,SAVE=["groups","prayer","nearby","bible","profile","chat","reader"];
var raw=window.show;
window.show=function(id){raw(id);if(done&&SAVE.indexOf(id)>=0)ls("fl-screen",id)};
window.FL_AUTHED=function(h){has=h;known=true;go()};
function go(){if(done)return;var w=Date.now()-t0;if(w<1100){setTimeout(go,1100-w);return}if(!known&&w<4000){setTimeout(go,4000-w);return}done=true;route()}
function restore(){var l=ls("fl-screen");
  if(l==="chat"){if(dbmode){window.FL_RESUME_GID=ls("fl-gid");raw("groups")}else raw("chat")}
  else if(l==="reader"&&window.FLB&&window.FLB.resume)window.FLB.resume();
  else if(l&&["prayer","nearby","bible","profile"].indexOf(l)>=0)raw(l);
  else raw("groups")}
function route(){
  if(!ls("fl-welcomed")){raw("welcome1");return}
  if(dbmode&&!has){raw("login");return}
  restore()}
document.addEventListener("click",function(e){if(e.target.closest("[data-fin]")){ls("fl-welcomed",true);if(dbmode&&!has)raw("login");else restore()}});
setTimeout(go,50);
})();
