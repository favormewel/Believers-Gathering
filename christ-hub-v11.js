/* v11: showcase-style 6-tab bar (Home, Discover, Create, Bible, Groups, Profile). Routing still uses data-go + window.show. */
(function(){
var MAP={home:"home",updates:"home",
messages:"messages",dm:"messages",newdm:"messages",
newpost:"create",myposts:"create",
bible:"bible",chapters:"bible",reader:"bible",
profile:"profile",editprofile:"profile",settings:"profile",appsettings:"profile",
explore:"x",nearby:"x",newevent:"x",groups:"x",chat:"x",info:"x",newgroup:"x",members:"x",pinned:"x",notifications:"x",menu:"x",prayers:"x"};
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
function sync(){var pr=document.getElementById("prayers");if(pr&&!pr.hidden)loadPrayers();busy=0;var t=cur();if(!t)return;
document.querySelectorAll("nav.hx-nav button").forEach(function(b){var on=b.dataset.tab===t;b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
function queue(){if(!busy){busy=1;requestAnimationFrame(sync)}}
new MutationObserver(queue).observe(document.getElementById("app")||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["hidden"]});
document.addEventListener("click",function(e){if(e.target.closest("nav.hx-nav"))setTimeout(sync,60)});
function place(){var f=document.getElementById("hx-feed"),c=document.querySelector("#home .hx-cmp");
if(!f||!c||f.dataset.moved)return;var h=f.previousElementSibling;
if(h&&h.classList.contains("hx-sec")){c.after(h);h.after(f)}else c.after(f);f.dataset.moved="1"}
function lab(){var m={groups:"My Communities",myposts:"My Posts",appsettings:"Settings"};
Object.keys(m).forEach(function(k){var l=document.querySelector('#menu .mn-t[data-go="'+k+'"] .lb');if(l&&l.textContent!==m[k])l.textContent=m[k]})}
function av(){mkPrayers();tile();place();lab();var a=document.getElementById("hx-av"),c=document.getElementById("cmp-av");if(a&&c&&a.textContent)c.textContent=a.textContent}
setInterval(av,1500);av();place();sync();
})();
