/* v11: showcase-style 6-tab bar (Home, Discover, Create, Bible, Groups, Profile). Routing still uses data-go + window.show. */
(function(){
var MAP={home:"home",updates:"home",
messages:"messages",dm:"messages",newdm:"messages",
newpost:"create",myposts:"create",
bible:"bible",chapters:"bible",reader:"bible",
profile:"profile",editprofile:"profile",settings:"profile",appsettings:"profile",
explore:"x",nearby:"x",newevent:"x",groups:"x",chat:"x",info:"x",newgroup:"x",members:"x",pinned:"x",notifications:"x",menu:"x",prayers:"x",saved:"x",help:"x",about:"x"};
function cur(){var s=document.querySelectorAll("#app section");for(var i=0;i<s.length;i++){if(!s[i].hidden&&MAP[s[i].id])return MAP[s[i].id]}return ""}
var busy=0;

function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML}
function ago(s){var m=Math.max(1,Math.round((Date.now()-new Date(s))/60000));if(m<60)return m+"m ago";var h=Math.round(m/60);return h<24?h+"h ago":Math.round(h/24)+"d ago"}
function mkPrayers(){var app=document.getElementById("app"),g=document.querySelector("#groups nav.hx-nav");
if(!app||!g||document.getElementById("prayers"))return;
var s=document.createElement("section");s.id="prayers";s.hidden=true;
s.innerHTML='<div class="hx-screen"><header class="hx-top"><div style="display:flex;align-items:center;gap:4px"><button class="hx-icon" aria-label="Back" data-go="menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><h1 style="font-size:20px">Prayer Requests</h1></div></header><div class="hx-scroll" data-scroll><button type="button" class="pr-new" data-go="newpost" data-pre="prayer">Share a prayer request</button><div id="pr-list"></div></div></div>';
app.appendChild(s);s.firstChild.appendChild(g.cloneNode(true))}
var prAt=0;
function loadPrayers(){var box=document.getElementById("pr-list"),db=window.FL_DBC;if(!box||Date.now()-prAt<20000)return;
if(!db){box.innerHTML='<p class="pr-note">Sign in to see prayer requests.</p>';return}
prAt=Date.now();
db.from("posts").select("*").eq("kind","prayer").order("created_at",{ascending:false}).limit(40).then(function(r){
if(r.error){prAt=0;box.innerHTML='<p class="pr-note">Prayer requests could not load right now.</p>';return}
var rows=(r.data||[]).filter(function(p){return !(window.FLC_BLOCKED&&window.FLC_BLOCKED[p.user_id])});
box.innerHTML=rows.length?rows.map(function(p){var n=p.author_name||"Member";return '<article class="pr-card"><div class="pr-hd"><span class="pr-av">'+esc(n.charAt(0).toUpperCase())+'</span><div><b>'+esc(n)+'</b><small>'+ago(p.created_at)+'</small></div></div><p>'+esc(p.body||"")+'</p></article>'}).join(""):'<p class="pr-note">No prayer requests yet. Be the first to share one.</p>'},function(){prAt=0;box.innerHTML='<p class="pr-note">Prayer requests could not load right now.</p>'})}
function tile(){var g=document.getElementById("mn-grid");if(!g||g.querySelector('[data-go="prayers"]'))return;
var b=document.createElement("button");b.type="button";b.className="mn-t";b.setAttribute("data-go","prayers");
b.innerHTML='<i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/></svg></i><span class="lb">Prayer Requests</span>';g.appendChild(b)}
document.addEventListener("click",function(e){var b=e.target.closest("[data-pre]");if(!b)return;
setTimeout(function(){var t=document.querySelector('#np-tpls [data-tpl="'+b.dataset.pre+'"]');if(t)t.click()},150)});

var SAVED={},SOFF=false,SLOAD=0;
function mkScr(id,title,html){var app=document.getElementById("app"),g=document.querySelector("#groups nav.hx-nav");
if(!app||!g||document.getElementById(id))return;
var s=document.createElement("section");s.id=id;s.hidden=true;
s.innerHTML='<div class="hx-screen"><header class="hx-top"><div style="display:flex;align-items:center;gap:4px"><button class="hx-icon" aria-label="Back" data-go="menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><h1 style="font-size:20px">'+title+'</h1></div></header><div class="hx-scroll" data-scroll>'+html+'</div></div>';
app.appendChild(s);s.firstChild.appendChild(g.cloneNode(true))}
function mkMore(){
mkScr("saved","Saved Posts",'<div id="sv-list"></div>');
mkScr("help","Help &amp; Support",'<div class="hp"><details open><summary>How do I join a community?</summary><p>Open Communities, tap Nearby to find groups, or ask a leader to invite you.</p></details><details><summary>How do I share a prayer request?</summary><p>Tap the + button or Prayer on Home, write your request, then tap Post.</p></details><details><summary>How do I let someone know I am praying?</summary><p>Tap Praying on their prayer request.</p></details><details><summary>How do I save a post?</summary><p>Tap the bookmark on any post. Find it later under More, Saved Posts.</p></details><details><summary>How do I change my photo or name?</summary><p>Open Profile, then Edit profile.</p></details><details><summary>How do I manage notifications and blocked members?</summary><p>Open More, then Settings.</p></details><p class="pr-note">Still stuck? Ask your group leader or message the CHEN NETWORK team.</p></div>');
mkScr("about","About CHEN NETWORK",'<div class="ab"><div class="ab-logo">CHEN</div><b>NETWORK</b><p>Faith. Fellowship. Connection.</p><p>A Christian community app to connect, pray, and grow together.</p><small>Version 41</small></div>')}
function svTile(id,label,path){var g=document.getElementById("mn-grid");if(!g||g.querySelector('[data-go="'+id+'"]'))return;
var b=document.createElement("button");b.type="button";b.className="mn-t";b.setAttribute("data-go",id);
b.innerHTML='<i><svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg></i><span class="lb">'+label+'</span>';g.appendChild(b)}
function loadSaved(cb){var db=window.FL_DBC,u=window.FL_USER;if(!db||!u||SOFF||Date.now()-SLOAD<15000){if(cb)cb();return}
SLOAD=Date.now();db.from("saved_posts").select("post_id").then(function(r){
if(r.error){SOFF=true}else{SAVED={};(r.data||[]).forEach(function(x){SAVED[x.post_id]=1})}if(cb)cb()},function(){SOFF=true;if(cb)cb()})}
var BM='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
function decorate(){if(SOFF)return;document.querySelectorAll(".hx-post .pf").forEach(function(pf){
if(pf.querySelector(".bm"))return;var a=pf.querySelector("[data-like],[data-share]");if(!a)return;
var id=a.getAttribute("data-like")||a.getAttribute("data-share");
var b=document.createElement("button");b.type="button";b.className="bm"+(SAVED[id]?" on":"");b.setAttribute("data-save",id);
b.setAttribute("aria-label","Save post");b.setAttribute("aria-pressed",SAVED[id]?"true":"false");b.innerHTML=BM;pf.appendChild(b)})}
function toggleSave(b){var db=window.FL_DBC,u=window.FL_USER,id=b.getAttribute("data-save");if(!db||!u)return;
var on=!SAVED[id];if(on)SAVED[id]=1;else delete SAVED[id];
document.querySelectorAll('[data-save="'+id+'"]').forEach(function(x){x.classList.toggle("on",on);x.setAttribute("aria-pressed",on?"true":"false")});
var q=on?db.from("saved_posts").insert({user_id:u.id,post_id:id}):db.from("saved_posts").delete().eq("post_id",id).eq("user_id",u.id);
q.then(function(r){if(r&&r.error){if(on)delete SAVED[id];else SAVED[id]=1;document.querySelectorAll('[data-save="'+id+'"]').forEach(function(x){x.classList.toggle("on",!on)})}else{var c=b.closest(".pr-card");if(c&&!on)c.remove()}},function(){})}
document.addEventListener("click",function(e){var b=e.target.closest("[data-save]");if(b){e.preventDefault();toggleSave(b)}});
var svAt=0;
function showSaved(){var box=document.getElementById("sv-list"),db=window.FL_DBC;if(!box||Date.now()-svAt<8000)return;
if(!db||!window.FL_USER){box.innerHTML='<p class="pr-note">Sign in to see saved posts.</p>';return}
svAt=Date.now();SLOAD=0;loadSaved(function(){
if(SOFF){box.innerHTML='<p class="pr-note">Saved posts are not set up yet. Run the saved posts SQL in Supabase first.</p>';return}
var ids=Object.keys(SAVED);if(!ids.length){box.innerHTML='<p class="pr-note">Nothing saved yet. Tap the bookmark on a post to keep it here.</p>';return}
db.from("posts").select("*").in("id",ids).order("created_at",{ascending:false}).then(function(r){
var rows=(r.data||[]).filter(function(p){return !(window.FLC_BLOCKED&&window.FLC_BLOCKED[p.user_id])});
box.innerHTML=rows.length?rows.map(function(p){var n=p.author_name||"Member";return '<article class="pr-card"><div class="pr-hd"><span class="pr-av">'+esc(n.charAt(0).toUpperCase())+'</span><div style="flex:1"><b>'+esc(n)+'</b><small>'+ago(p.created_at)+'</small></div><button type="button" class="bm on" data-save="'+esc(p.id)+'" aria-pressed="true" aria-label="Remove from saved">'+BM+'</button></div><p>'+esc(p.body||"")+'</p></article>'}).join(""):'<p class="pr-note">Nothing saved yet.</p>'},function(){})})}
function sync(){var sv=document.getElementById("saved");if(sv&&!sv.hidden)showSaved();decorate();var pr=document.getElementById("prayers");if(pr&&!pr.hidden)loadPrayers();busy=0;var t=cur();if(!t)return;
document.querySelectorAll("nav.hx-nav button").forEach(function(b){var on=b.dataset.tab===t;b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
function queue(){if(!busy){busy=1;requestAnimationFrame(sync)}}
new MutationObserver(queue).observe(document.getElementById("app")||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["hidden"]});
document.addEventListener("click",function(e){if(e.target.closest("nav.hx-nav"))setTimeout(sync,60)});
function place(){var f=document.getElementById("hx-feed"),c=document.querySelector("#home .hx-cmp");
if(!f||!c||f.dataset.moved)return;var h=f.previousElementSibling;
if(h&&h.classList.contains("hx-sec")){c.after(h);h.after(f)}else c.after(f);f.dataset.moved="1"}
function lab(){var m={groups:"My Communities",myposts:"My Posts",appsettings:"Settings"};
Object.keys(m).forEach(function(k){var l=document.querySelector('#menu .mn-t[data-go="'+k+'"] .lb');if(l&&l.textContent!==m[k])l.textContent=m[k]})}
function av(){mkPrayers();mkMore();tile();svTile("saved","Saved Posts",'<path d="M6 3h12v18l-6-4-6 4z"/>');svTile("help","Help &amp; Support",'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>');svTile("about","About CHEN NETWORK",'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>');if(!SLOAD)loadSaved(decorate);place();lab();var a=document.getElementById("hx-av"),c=document.getElementById("cmp-av");if(a&&c&&a.textContent)c.textContent=a.textContent}
setInterval(av,1500);av();place();sync();
})();
