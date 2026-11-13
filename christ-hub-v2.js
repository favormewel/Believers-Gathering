(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML}
function ls(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var COL=["#3F5FB0","#7657D6","#2F8F6B","#C2641F","#3F8279","#B8636F","#7A7637"];
function col(s){var n=0;s=s||"";for(var i=0;i<s.length;i++)n+=s.charCodeAt(i);return COL[n%COL.length]}
function ini(n){return (n||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase()}
function visible(id){var s=$(id);return s&&!s.hidden}

/* Read a group row (original markup from chat.js / index.html) into plain data */
function parse(row){
  var kids=row.children,tx=kids[1]||row,t=row.dataset.title||(tx.children[0]&&tx.children[0].textContent)||"",
      sub=(tx.children[1]&&tx.children[1].textContent)||"",last=kids[kids.length-1],badge="";
  if(last&&last!==tx&&/^\d+\+?$/.test((last.textContent||"").trim()))badge=last.textContent.trim();
  var av=kids[0],bg=(av&&av.style&&av.style.background)||col(t);
  return{title:t.trim(),sub:sub.trim(),badge:badge,bg:bg,row:row}
}
function groupRows(){return Array.prototype.slice.call(document.querySelectorAll("#group-list [data-group]")).filter(function(r){return r.style.display!=="none"})}
function nearbyRows(){return Array.prototype.slice.call(document.querySelectorAll("#nearby-list [data-nb]"))}

function rowHTML(p,opts){
  opts=opts||{};
  return '<button class="hx-row'+(opts.round?" round":"")+'" data-idx="'+opts.i+'" type="button"><span class="av" style="background:'+esc(p.bg)+'">'+esc(ini(p.title))+'</span><span class="tx"><b>'+esc(p.title)+'</b><small>'+esc(p.sub)+'</small></span>'+
    (p.badge?'<span class="bd">'+esc(p.badge)+'</span>':'')+(opts.go?'<span class="go">'+esc(opts.go)+'</span>':'')+'</button>'}

var cache={home:[],messages:[],explore:[]};
function fill(listId,items,opts,empty){
  var el=$(listId);if(!el)return;
  if(!items.length){el.innerHTML='<div class="hx-empty">'+esc(empty)+'</div>';return}
  el.innerHTML=items.map(function(p,i){return rowHTML(p,Object.assign({i:i},opts))}).join("");
}

function greet(){
  var h=new Date().getHours(),g=h<12?"Good morning":h<18?"Good afternoon":"Good evening";
  var n=($("me-name")||{}).textContent||"",first=(n&&n!=="Guest")?n.split(/\s+/)[0]:"";
  var e=$("hx-greet");if(e)e.textContent=g+(first?",":"!");
  var f=$("hx-first");if(f)f.textContent=first?first+"!":"";
  var a=$("hx-av"),m=$("me-avatar");if(a&&m)a.textContent=(m.textContent||"G").trim()
}

function refreshHome(){
  greet();
  var rows=groupRows().slice(0,3).map(parse);cache.home=rows;
  fill("hx-home-groups",rows,{go:"Open"},"Your groups will show up here. Tap Groups to find or start one.");
}
function refreshMessages(){
  var q=(($("hx-msg-q")||{}).value||"").trim().toLowerCase();
  var rows=groupRows().map(parse).filter(function(p){return !q||(p.title+" "+p.sub).toLowerCase().indexOf(q)>-1});
  cache.messages=rows;
  fill("hx-msg-list",rows,{round:true},q?"No chats match your search.":"No conversations yet. Join a group to start chatting.");
}
function refreshExplore(){
  var rows=nearbyRows().map(parse);cache.explore=rows;
  fill("hx-near-list",rows,{go:"Join"},"No nearby groups yet.");
  fill("hx-trend-list",groupRows().map(parse),{},"Nothing trending yet.")
}
function refreshProfile(){
  var ss=document.querySelectorAll("#profile [data-scroll]");
  var nums=document.querySelectorAll("#profile div[style*='font-size:15px;font-weight:700;color:#A06A0E']");
  nums.forEach(function(n){if(/^\[\d+\]$/.test(n.textContent.trim()))n.textContent=n.textContent.replace(/[\[\]]/g,"")});
  if(nums[0]&&groupRows().length)nums[0].textContent=groupRows().length
}
function refresh(){
  if(visible("profile"))refreshProfile();
  if(visible("home"))refreshHome();
  if(visible("messages"))refreshMessages();
  if(visible("explore"))refreshExplore();
}

/* Re-run when sections are shown or when group/nearby lists finish loading */
var t=null;function soon(){clearTimeout(t);t=setTimeout(refresh,60)}
var app=$("app");
if(app&&window.MutationObserver){
  new MutationObserver(soon).observe(app,{attributes:true,attributeFilter:["hidden"],subtree:true});
  ["group-list","nearby-list"].forEach(function(id){var e=$(id);if(e)new MutationObserver(soon).observe(e,{childList:true})});
  var me=$("me-name");if(me)new MutationObserver(soon).observe(me,{childList:true,characterData:true,subtree:true});
}

document.addEventListener("input",function(e){if(e.target.id==="hx-msg-q")refreshMessages()});

document.addEventListener("click",function(e){
  var T=e.target;
  /* continue as guest */
  if(T.closest("[data-guest]")){ls("fl-welcomed",true);window.show("home");return}
  /* open a chat / nearby group by forwarding the tap to the original row */
  var r=T.closest(".hx-row");
  if(r){
    var host=r.parentNode.id,list=host==="hx-near-list"?cache.explore:host==="hx-home-groups"?cache.home:cache.messages;
    if(host==="hx-trend-list")list=groupRows().map(parse);
    var p=list[+r.dataset.idx];
    if(p&&p.row){
      if(T.closest(".go")&&host==="hx-near-list"){p.row.querySelector("[data-join]")&&p.row.querySelector("[data-join]").click();T.closest(".go").textContent="Joined";return}
      p.row.click()}
    return}
  /* explore tabs */
  var tb=T.closest("[data-extab]");
  if(tb){
    document.querySelectorAll("[data-extab]").forEach(function(b){b.classList.toggle("on",b===tb)});
    ["near","trend","events"].forEach(function(k){var p=$("hx-ex-"+k);if(p)p.hidden=k!==tb.dataset.extab});
    return}
  /* log out reuses the original sign-out button */
  if(T.closest("#hx-logout")){var so=$("sign-out");if(so)so.click();else window.show("login");return}
  /* blocked people row only if that screen exists */
  if(T.closest('[data-go="blocked"]')&&!$("blocked"))return;
});

/* hide the Blocked row in Settings until social.js has created that screen */
setTimeout(function(){var b=$("hx-blocked");if(b&&!$("blocked"))b.hidden=true},1500);
greet();
})();
