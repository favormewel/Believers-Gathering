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
mkScr("about","About CHEN NETWORK",'<div class="ab"><div class="ab-logo">CHEN</div><b>NETWORK</b><p>Faith. Fellowship. Connection.</p><p>CHEN NETWORK is a Christian community app to connect, pray, and grow together.</p><ul class="ab-ul"><li><b>Connect</b> with believers in groups and chats</li><li><b>Pray</b> together with shared prayer requests</li><li><b>Grow</b> in the Word with the Bible in your pocket</li></ul><small>Version 48</small></div>')}
function svTile(id,label,path){var g=document.getElementById("mn-grid");if(!g||g.querySelector('[data-go="'+id+'"]'))return;
var b=document.createElement("button");b.type="button";b.className="mn-t";b.setAttribute("data-go",id);
b.innerHTML='<i><svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg></i><span class="lb">'+label+'</span>';g.appendChild(b)}
function loadSaved(cb){var db=window.FL_DBC,u=window.FL_USER;if(!db||!u||SOFF||Date.now()-SLOAD<15000){if(cb)cb();return}
SLOAD=Date.now();db.from("saved_posts").select("post_id").then(function(r){
if(r.error){SOFF=true}else{SAVED={};(r.data||[]).forEach(function(x){SAVED[x.post_id]=1})}if(cb)cb()},function(){SOFF=true;if(cb)cb()})}
var BM='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
function decorate(){if(SOFF)return;document.querySelectorAll(".hx-post").forEach(function(post){
if(post.querySelector(".bm"))return;var a=post.querySelector("[data-like],[data-share]");if(!a||!a.parentElement)return;
var id=a.getAttribute("data-like")||a.getAttribute("data-share");
var b=document.createElement("button");b.type="button";b.className="bm"+(SAVED[id]?" on":"");b.setAttribute("data-save",id);
b.setAttribute("aria-label","Save post");b.setAttribute("aria-pressed",SAVED[id]?"true":"false");b.innerHTML=BM;a.parentElement.appendChild(b)})}
document.addEventListener("click",function(e){var t=e.target.closest("[data-to]");if(t&&window.show){e.preventDefault();window.show(t.getAttribute("data-to"))}});
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

/* Social sign-in: turn on after enabling each provider in Supabase (Authentication, Providers). */
var SOCIAL=[]; /* for example ["google","facebook","apple"] */
var SNAME={google:"Google",facebook:"Facebook",apple:"Apple"};
function social(){if(!SOCIAL.length)return;
[["li-btn","login"],["su-btn","signup"]].forEach(function(x){var b=document.getElementById(x[0]);
if(!b||document.getElementById("so-"+x[1]))return;
var d=document.createElement("div");d.id="so-"+x[1];d.className="so-row";
d.innerHTML='<div class="so-or"><span>or</span></div>'+SOCIAL.map(function(k){return '<button type="button" class="so-b so-'+k+'" data-prov="'+k+'">Continue with '+SNAME[k]+'</button>'}).join("");
b.parentNode.insertBefore(d,b.nextSibling)})}
document.addEventListener("click",function(e){var b=e.target.closest("[data-prov]");if(!b||!window.FL_DBC)return;
b.disabled=true;window.FL_DBC.auth.signInWithOAuth({provider:b.getAttribute("data-prov"),options:{redirectTo:location.origin+location.pathname}}).then(function(r){
if(r&&r.error){b.disabled=false;var m=document.getElementById("li-msg")||document.getElementById("su-msg");if(m)m.textContent="Could not sign in with "+SNAME[b.getAttribute("data-prov")]+". Try again."}},function(){b.disabled=false})});

/* ---- Stories: short text stories that disappear after 24 hours ---- */
var STB={purple:"linear-gradient(150deg,#3A12A8,#7A3BFF)",sunset:"linear-gradient(150deg,#c0398b,#ff9a3c)",ocean:"linear-gradient(150deg,#0f4c81,#1f9d8f)",gold:"linear-gradient(150deg,#b8860b,#ffc21a)"};
var STR=[],stAt=0,stBy={};
function renderStories(){var row=document.getElementById("st-row");if(!row)return;
stBy={};var order=[];STR.forEach(function(x){if(window.FLC_BLOCKED&&window.FLC_BLOCKED[x.user_id])return;if(!stBy[x.user_id]){stBy[x.user_id]=[];order.push(x.user_id)}stBy[x.user_id].push(x)});
var h='<button type="button" class="st-b" data-st-add><span class="st-c st-add">+</span><small>Your story</small></button>';
order.forEach(function(id){var n=stBy[id][0].author_name||"Member";h+='<button type="button" class="st-b" data-st-view="'+esc(id)+'" aria-label="View story by '+esc(n)+'"><span class="st-c st-ring">'+esc(n.charAt(0).toUpperCase())+'</span><small>'+esc(n.split(" ")[0])+'</small></button>'});
row.innerHTML=h}
function loadStories(){var db=window.FL_DBC;if(!db||!window.FL_USER||Date.now()<stAt)return;
stAt=Date.now()+20000;var since=new Date(Date.now()-864e5).toISOString();
db.from("stories").select("*").gte("created_at",since).order("created_at",{ascending:false}).limit(60).then(function(r){
if(r.error){stAt=Date.now()+240000;return}STR=r.data||[];renderStories()},function(){stAt=Date.now()+240000})}
function closeSt(){document.querySelectorAll(".st-ov").forEach(function(o){o.remove()})}
function openStory(list,i){closeSt();var x=list[i],o=document.createElement("div");o.className="st-ov";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label","Story");
o.style.background=STB[x.bg]||STB.purple;
o.innerHTML='<div class="st-bars">'+list.map(function(_,k){return '<i class="'+(k<=i?"on":"")+'"></i>'}).join("")+'</div><div class="st-who">'+esc(x.author_name||"Member")+' &middot; '+ago(x.created_at)+'</div><button type="button" class="st-x" aria-label="Close">&times;</button><p>'+esc(x.body)+'</p>';
document.body.appendChild(o);var t=setTimeout(nx,6000);
function nx(){clearTimeout(t);o.remove();if(i+1<list.length)openStory(list,i+1)}
o.addEventListener("click",function(e){if(e.target.closest(".st-x")){clearTimeout(t);o.remove();return}nx()});
o.querySelector(".st-x").focus()}
function openNewStory(){closeSt();var bg="purple",o=document.createElement("div");o.className="st-ov st-new";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label","New story");o.style.background=STB.purple;
o.innerHTML='<button type="button" class="st-x" aria-label="Close">&times;</button><textarea id="st-t" maxlength="280" placeholder="Share an encouragement, a verse, or a praise report" aria-label="Story text"></textarea><div class="st-sw">'+Object.keys(STB).map(function(k){return '<button type="button" data-bg="'+k+'" aria-label="'+k+' background" style="background:'+STB[k]+'"></button>'}).join("")+'</div><p id="st-e" role="alert"></p><button type="button" class="st-go">Share story</button>';
document.body.appendChild(o);var ta=o.querySelector("#st-t");ta.focus();
o.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;
if(b.classList.contains("st-x")){o.remove();return}
if(b.dataset.bg){bg=b.dataset.bg;o.style.background=STB[bg];return}
if(b.classList.contains("st-go")){var v=ta.value.trim(),er=o.querySelector("#st-e"),db=window.FL_DBC,u=window.FL_USER;
if(!v){er.textContent="Write something first.";return}
if(!db||!u){er.textContent="Sign in to share a story.";return}
b.disabled=true;var nm=((document.getElementById("me-name")||{}).textContent||"").trim();
db.from("stories").insert({user_id:u.id,author_name:nm||null,body:v,bg:bg}).then(function(r){
if(r.error){b.disabled=false;er.textContent="Stories are not set up yet.";return}
o.remove();stAt=0;loadStories()},function(){b.disabled=false;er.textContent="Could not share. Try again."})}})}
document.addEventListener("click",function(e){var a=e.target.closest("[data-st-add]");if(a){openNewStory();return}
var v=e.target.closest("[data-st-view]");if(v){var l=(stBy[v.getAttribute("data-st-view")]||[]).slice().reverse();if(l.length)openStory(l,0)}});
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeSt()});

function npHead(){var sc=document.querySelector("#newpost [data-scroll]");if(!sc)return;
var nm=((document.getElementById("me-name")||{}).textContent||"").trim()||"Member";
var w=document.getElementById("np-who");
if(!w){w=document.createElement("div");w.id="np-who";w.className="np-who";w.innerHTML='<span class="cmp-av"></span><div><b></b><small>Public</small></div>';sc.insertBefore(w,sc.firstChild)}
w.querySelector("b").textContent=nm;w.querySelector(".cmp-av").textContent=nm.charAt(0).toUpperCase();
var h=document.querySelector("#newpost header h1");if(h&&h.textContent!=="Create Post")h.textContent="Create Post"}
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
function av(){npHead();loadStories();social();mkPrayers();mkMore();tile();svTile("saved","Saved Posts",'<path d="M6 3h12v18l-6-4-6 4z"/>');svTile("help","Help &amp; Support",'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>');svTile("about","About CHEN NETWORK",'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>');if(!SLOAD)loadSaved(decorate);place();lab();var a=document.getElementById("hx-av"),c=document.getElementById("cmp-av");if(a&&c&&a.textContent)c.textContent=a.textContent}
setInterval(av,1500);av();place();sync();
})();
