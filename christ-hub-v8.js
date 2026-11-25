(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function visible(id){var s=$(id);return !!s&&!s.hidden}
var P={
 updates:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
 messages:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
 posts:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
 groups:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3.5 3-5 6-5s6 1.5 6 5M15 14c3 0 6 1 6 4"/>',
 explore:'<path d="M12 21s-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 events:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
 bell:'<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/>',
 phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
 install:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 verse:'<path d="M10 11H6a4 4 0 0 1 4-4M18 11h-4a4 4 0 0 1 4-4"/><path d="M6 11v4h4v-4M14 11v4h4v-4"/>',
 invite:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M19 8v6M16 11h6"/>',
 megaphone:'<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
 toolbox:'<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
 bookmark:'<path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.6L5 21V4.5a1 1 0 0 1 1-1z"/>',
 live:'<circle cx="12" cy="12" r="2.2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.7 4.7a10.4 10.4 0 0 0 0 14.6M19.3 4.7a10.4 10.4 0 0 1 0 14.6"/>'};
function ico(k,bg){return '<i style="background:'+bg+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+P[k]+'</svg></i>'}
function tile(k,label,attrs,bg,extra){return '<button type="button" class="mn-t" '+attrs+'>'+ico(k,bg)+'<span class="lb">'+esc(label)+'</span>'+(extra||"")+'</button>'}
var G={pu:"linear-gradient(135deg,#9277F5,#6B48D8)",or:"linear-gradient(135deg,#FFA043,#E8730C)",gr:"linear-gradient(135deg,#43CF84,#1FA05B)",bl:"linear-gradient(135deg,#5B9BFF,#2F6DE0)",rd:"linear-gradient(135deg,#FF7A93,#E03659)",tl:"linear-gradient(135deg,#3FC6C0,#1F8F8A)",gy:"linear-gradient(135deg,#8A90B0,#5B6085)",go:"linear-gradient(135deg,#FFD35C,#E8A91B)"};

function build(){
  if($("menu")||!$("app"))return;
  var s=document.createElement("section");s.id="menu";s.hidden=true;
  var tiles=
    tile("updates","Updates",'data-go="updates"',G.or)+
    tile("messages","Messages",'data-go="messages"',G.bl,'<em class="bdg" id="mn-bdg" hidden></em>')+
    tile("posts","My posts",'data-go="myposts"',G.pu)+
    tile("groups","My groups",'data-go="groups"',G.gr)+
    tile("explore","Explore",'data-go="explore"',G.tl)+
    tile("megaphone","Announcements",'data-go="announcements"',G.or,'<em class="bdg" id="mn-ann" hidden></em>')+
    tile("bookmark","Saved posts",'data-go="saved"',G.go)+
    tile("events","Events",'data-mn="events"',G.rd)+
    tile("verse","Verse cards",'data-go="versecard"',G.go)+
    tile("invite","Invite friends",'data-go="invite"',G.pu)+
    tile("bell","Notifications",'data-go="notifications"',G.go)+
    tile("phone","Phone alerts",'data-mn="push" id="mn-push"',G.pu,'<small class="st" id="mn-pst"></small>')+
    tile("gear","Settings",'data-go="appsettings"',G.gy)+
    tile("install","Install app",'data-mn="install" id="mn-install" hidden',G.bl)+
    '<a class="mn-t" href="admin.html" data-adm hidden>'+ico("shield",G.rd)+'<span class="lb">Admin panel</span></a>'+
    tile("chart","Analytics",'data-go="analytics" data-adm hidden',G.gr)+
    tile("live","Go live",'data-go="golive" data-adm hidden',G.rd)+
    tile("toolbox","Admin tools",'data-go="admintools" data-adm hidden',G.pu);
  s.innerHTML='<div class="hx-screen"><header class="hx-top"><h1>Menu</h1></header><div class="hx-scroll" data-scroll>'+
    '<button type="button" class="mn-prof" data-go="profile"><span class="mn-av" id="mn-av" aria-hidden="true">G</span><span class="tx"><b id="mn-name">Guest</b><small id="mn-bio">View your profile</small></span><span class="ch" aria-hidden="true">&rsaquo;</span></button>'+
    '<div class="mn-grid" id="mn-grid" role="list">'+tiles+'</div>'+
    '<button type="button" class="hx-logout" id="mn-out">Log out</button><p class="an-foot">Chen Network &middot; version 38</p></div></div>';
  $("app").appendChild(s);
  var nv=document.querySelector("#groups nav.hx-nav");
  if(nv){var cn=nv.cloneNode(true);cn.querySelectorAll("button").forEach(function(b){var on=b.dataset.tab==="menu";b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});s.firstChild.appendChild(cn)}
  sync()}

function sync(){
  var nm=$("me-name"),bio=$("me-bio"),av=$("me-avatar");
  if($("mn-name")&&nm)$("mn-name").textContent=(nm.textContent||"Guest").trim()||"Guest";
  if($("mn-bio")&&bio){var t=(bio.textContent||"").trim();$("mn-bio").textContent=(!t||/^Tap Edit profile/i.test(t))?"View your profile":t}
  var mav=$("mn-av");
  if(mav&&av){mav.textContent=(av.textContent||"G").trim();
    var ph=av.style.getPropertyValue("--photo");
    if(av.classList.contains("has-photo")&&ph){mav.style.setProperty("--photo",ph);mav.classList.add("has-photo")}else{mav.style.removeProperty("--photo");mav.classList.remove("has-photo")}}
  var ir=$("install-row"),it=$("mn-install");if(it)it.hidden=!ir||ir.hidden;
  var pr=$("push-row"),pt=$("mn-push"),ps=$("mn-pst");
  if(pt)pt.hidden=!pr;
  if(pr&&ps){var x=(pr.querySelector("span")||{}).textContent||"";ps.textContent=/are on/i.test(x)?"On":/blocked/i.test(x)?"Blocked":"Off"}
  document.querySelectorAll("#menu [data-adm]").forEach(function(e){e.hidden=!window.FL_IS_ADMIN});
  /* unread direct messages: dot on the Menu tab and a badge on the Messages tile */
  var hb=document.querySelector('#home .hx-quick .bdg'),n=hb&&!hb.hidden?hb.textContent:"";
  var mb=$("mn-bdg");if(mb){mb.hidden=!n;mb.textContent=n}
  document.querySelectorAll('nav.hx-nav [data-tab="menu"]').forEach(function(b){
    var d=b.querySelector(".nv-dot");if(!d){d=document.createElement("em");d.className="nv-dot";d.hidden=true;b.appendChild(d)}d.hidden=!n})}

document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest&&T.closest("[data-mn]"))){
    var k=b.dataset.mn;
    if(k==="events"){window.show("explore");setTimeout(function(){var t=document.querySelector('[data-extab="events"]');if(t)t.click()},60)}
    if(k==="push"){var pr=$("push-row");if(pr)pr.click()}
    if(k==="install"){var ir=$("install-row");if(ir)ir.click()}
    return}
  if(T.closest&&T.closest("#mn-out")){var so=$("sign-out");if(so)so.click();else window.show("login");return}
});
var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){build();sync()},30)}
function init(){
  build();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);soon()};
  if(window.MutationObserver&&$("app"))new MutationObserver(function(ms){if(ms.some(function(x){return x.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  setInterval(function(){if(!document.hidden)sync()},2000);
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
