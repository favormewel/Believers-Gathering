(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function visible(id){var s=$(id);return !!s&&!s.hidden}
function toast(m){var t=$("hx-toast");if(!t){t=document.createElement("div");t.id="hx-toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");document.body.appendChild(t)}
  t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove("on")},3400)}
var BACK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>';
function sec(id,title,back,body){
  var s=document.createElement("section");s.id=id;s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="'+back+'">'+BACK+'</button><h1 style="font-size:20px">'+esc(title)+'</h1></div></header><div class="hx-scroll" data-scroll>'+body+'</div></div>';
  $("app").appendChild(s)}
function fmtDate(d){try{return new Date(d).toLocaleDateString([],{day:"numeric",month:"short"})}catch(e){return ""}}
function fmtDT(d){try{return new Date(d).toLocaleString([],{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}catch(e){return ""}}
function errText(e,fallback){var m=(e&&e.message)||"";return /admins only/i.test(m)?"Only admins can do this.":/function|schema cache|could not find|relation/i.test(m)?"This is not set up yet. Run the admin SQL in Supabase first.":(fallback||"Something went wrong. Please try again.")}
var ST={};

/* ============ ANNOUNCEMENTS (everyone) ============ */
var BC=[];
function seenKey(){var u=me();return u?"fl-bc-seen-"+u.id:""}
function seenAt(){try{return localStorage.getItem(seenKey())||""}catch(e){return ""}}
function markSeen(){if(!BC.length)return;try{localStorage.setItem(seenKey(),BC[0].sent_at)}catch(e){}paintBc()}
function unread(){var s=seenAt(),u=me();return BC.filter(function(b){return (!s||b.sent_at>s)&&b.sender_id!==(u&&u.id)})}
function audLabel(b){return b.audience==="group"?(b.group_name||"A group"):b.audience==="leaders"?"Verified leaders":"Everyone"}
function loadBc(){
  if(!db()||!me())return;ST.bc=Date.now();
  db().rpc("my_broadcasts").then(function(r){if(r.error)return;BC=r.data||[];paintBc()},function(){})}
function paintBc(){
  var n=unread().length,b=$("mn-ann");
  if(b){b.hidden=!n;b.textContent=n>9?"9+":n}
  var list=$("an-list");
  if(list)list.innerHTML=BC.length?BC.map(function(x){return '<article class="an-item"><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p><small>'+esc(x.sender_name||"Admin")+' &middot; '+esc(fmtDate(x.sent_at))+' &middot; for '+esc(audLabel(x))+'</small></article>'}).join(""):'<div class="hx-empty">No announcements yet. Messages from your church leaders will show up here.</div>';
  /* Home card */
  var home=$("home"),sc=home&&home.querySelector(".hx-scroll");if(!sc)return;
  var el=$("bc-home");if(!el){el=document.createElement("div");el.id="bc-home";var lv=$("lv-box");if(lv)lv.insertAdjacentElement("afterend",el);else sc.insertBefore(el,sc.firstChild)}
  var un=unread()[0];
  if(!un||Date.now()-new Date(un.sent_at)>3*864e5){el.innerHTML="";return}
  el.innerHTML='<section class="bc-card" aria-label="Announcement"><div class="bc-h"><b>Announcement</b><button type="button" id="bc-x" aria-label="Dismiss announcement">&times;</button></div><h3>'+esc(un.title)+'</h3><p>'+esc(un.body)+'</p><button type="button" class="bc-go" data-go="announcements">Read all</button></section>'}

/* ============ VERIFIED BADGE + SUSPENDED NOTICE ============ */
var VER={},VERLOADED=false,SUSP=false;
window.CHEN_ISV=function(id){return !!VER[id]};
var VF='<svg class="vf" viewBox="0 0 24 24" role="img" aria-label="Verified leader"><title>Verified leader</title><circle cx="12" cy="12" r="11" fill="#6544D8"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function loadVer(){
  if(!db()||!me())return;ST.ver=Date.now();
  db().from("verified_leaders").select("user_id").then(function(r){if(r.error)return;VER={};(r.data||[]).forEach(function(x){VER[x.user_id]=1});VERLOADED=true;decorate()},function(){});
  db().from("profiles").select("suspended").eq("id",me().id).then(function(r){var x=r.data&&r.data[0];SUSP=!!(x&&x.suspended);susBanner()},function(){})}
window.CHEN_SETVER=function(arr){VER={};(arr||[]).forEach(function(i){VER[i]=1});VERLOADED=true;ST.ver=Date.now();decorate()};
function decorate(){
  if(!VERLOADED)return;
  document.querySelectorAll(".hx-post[data-uid] .hd b, .cmrow[data-uid] .cb b").forEach(function(b){
    var id=b.closest("[data-uid]").dataset.uid;
    if(VER[id]&&!(b.nextElementSibling&&b.nextElementSibling.classList.contains("vf")))b.insertAdjacentHTML("afterend",VF)})}
function susBanner(){
  var home=$("home"),sc=home&&home.querySelector(".hx-scroll");if(!sc)return;
  var el=$("sus-box");if(!el){el=document.createElement("div");el.id="sus-box";sc.insertBefore(el,sc.firstChild)}
  el.innerHTML=SUSP?'<div class="sus-card" role="alert"><b>Your account is suspended</b><span>You can read, but you cannot post, comment or send messages. Please contact an admin.</span></div>':""}
var dT=null;function soonDec(){clearTimeout(dT);dT=setTimeout(decorate,150)}

/* ============ ADMIN: ANNOUNCEMENT FORM ============ */
function loadGroups(){
  if(!db()||ST.groupsLoaded)return;
  db().from("groups").select("id,name").order("name",{ascending:true}).limit(100).then(function(r){
    if(r.error)return;ST.groupsLoaded=1;
    var s=$("ab-group");if(s)s.innerHTML=(r.data||[]).map(function(g){return '<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>'}).join("")||'<option value="">No groups yet</option>'},function(){})}
function audience(){var r=document.querySelector('input[name="ab-aud"]:checked');return r?r.value:"all"}
function sendBroadcast(){
  var t=($("ab-title").value||"").trim(),b=($("ab-body").value||"").trim(),a=audience(),g=($("ab-group")||{}).value||null,m=$("ab-msg");m.textContent="";
  if(t.length<2){m.textContent="Add a short title.";return}
  if(!b){m.textContent="Write your message.";return}
  if(a==="group"&&!g){m.textContent="Choose a group.";return}
  var who=a==="all"?"all members":a==="leaders"?"verified leaders":"this group";
  if(!confirm("Send this announcement to "+who+"? Their phones will get a notification."))return;
  var btn=$("ab-send");btn.disabled=true;
  db().rpc("send_broadcast",{p_title:t,p_body:b,p_audience:a,p_group:a==="group"?g:null}).then(function(r){
    btn.disabled=false;
    if(r.error){m.textContent=errText(r.error,"Could not send. Please try again.");return}
    $("ab-title").value="";$("ab-body").value="";$("ab-n").textContent="0";toast("Sent to "+(+r.data||0)+" member"+((+r.data||0)===1?"":"s"));loadBc()},function(){btn.disabled=false;m.textContent="Could not send. Please try again."})}

/* ============ ADMIN: SCHEDULED POSTS ============ */
var KINDS=[["","No label"],["prayer","Prayer request"],["testimony","Testimony"],["verse","Verse of the day"],["encourage","Encouragement"],["thanks","Gratitude"],["question","Question"]];
function localMin(){var d=new Date(Date.now()+6*60000),p=function(n){return String(n).padStart(2,"0")};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes())}
function loadSched(){
  var box=$("sp-list");if(!box||!db()||!me())return;ST.sched=Date.now();
  db().rpc("list_scheduled").then(function(r){
    if(r.error){box.innerHTML='<div class="hx-empty">'+esc(errText(r.error))+'</div>';return}
    var rows=r.data||[];
    box.innerHTML=rows.length?rows.map(function(x){
      return '<article class="sp-item"><div class="sp-h"><b>'+esc(fmtDT(x.publish_at))+'</b><span class="sp-st s-'+esc(x.status)+'">'+esc(x.status==="pending"?"Scheduled":x.status==="published"?"Published":"Cancelled")+'</span></div><p>'+esc(x.body)+'</p>'+(x.status==="pending"?'<button type="button" class="sp-x" data-spx="'+esc(x.id)+'">Cancel</button>':"")+'</article>'}).join(""):'<div class="hx-empty">Nothing scheduled yet.</div>'},function(){})}
function schedule(){
  var b=($("sp-body").value||"").trim(),w=$("sp-when").value,k=$("sp-kind").value,m=$("sp-msg");m.textContent="";
  if(!b){m.textContent="Write the post first.";return}
  if(!w){m.textContent="Choose a date and time.";return}
  var when=new Date(w);if(isNaN(when)||when.getTime()<Date.now()+60000){m.textContent="Choose a time in the future.";return}
  var btn=$("sp-go");btn.disabled=true;
  db().rpc("schedule_post",{p_body:b,p_kind:k||null,p_publish_at:when.toISOString()}).then(function(r){
    btn.disabled=false;
    if(r.error){m.textContent=errText(r.error,/future/i.test(r.error.message||"")?"Choose a time in the future.":"Could not schedule. Please try again.");return}
    $("sp-body").value="";$("sp-when").value="";toast("Post scheduled");loadSched()},function(){btn.disabled=false;m.textContent="Could not schedule. Please try again."})}

/* ============ ADMIN: MEMBERS ============ */
var mT=null;
function loadMembers(){
  var box=$("mm-list");if(!box||!db()||!me())return;
  var q=($("mm-q").value||"").trim();
  db().rpc("admin_members",{p_q:q,p_limit:30}).then(function(r){
    if(r.error){box.innerHTML='<div class="hx-empty">'+esc(errText(r.error))+'</div>';return}
    var rows=r.data||[];
    box.innerHTML=rows.length?rows.map(function(x){
      var me_=me()&&x.id===me().id;
      return '<article class="mm-item" data-mid="'+esc(x.id)+'"><div class="mm-top"><span class="av" style="background:#6544D8">'+esc((x.full_name||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase())+'</span><div class="tx"><b>'+esc(x.full_name)+(x.verified?VF:"")+'</b><small>Joined '+esc(fmtDate(x.created_at))+(x.last_seen?" &middot; seen "+esc(fmtDate(x.last_seen)):"")+'</small></div>'+(x.is_admin?'<span class="mm-tag">Admin</span>':x.suspended?'<span class="mm-tag bad">Suspended</span>':"")+'</div>'+
        '<div class="mm-act"><button type="button" data-av="'+esc(x.id)+'" data-on="'+(x.verified?"0":"1")+'">'+(x.verified?"Remove badge":"Verify leader")+'</button>'+
        ((x.is_admin||me_)?"":'<button type="button" class="'+(x.suspended?"":"warn")+'" data-as="'+esc(x.id)+'" data-on="'+(x.suspended?"0":"1")+'" data-name="'+esc(x.full_name)+'">'+(x.suspended?"Restore":"Suspend")+'</button>')+'</div></article>'}).join(""):'<div class="hx-empty">No members found.</div>'},function(){})}
function loadActions(){
  var box=$("mm-log");if(!box||!db()||!me())return;
  db().rpc("admin_recent_actions").then(function(r){
    if(r.error){box.innerHTML="";return}
    var rows=r.data||[];
    box.innerHTML=rows.length?'<h2 class="mm-h">Recent admin actions</h2><ul class="mm-ul">'+rows.map(function(x){return '<li><b>'+esc(x.admin_name)+'</b> '+esc(x.action)+(x.target_name&&x.target_name!=="Member"?" &middot; "+esc(x.target_name):"")+' <small>'+esc(fmtDate(x.created_at))+'</small></li>'}).join("")+'</ul>':""},function(){})}
function setVerified(id,on){
  db().rpc("admin_set_verified",{p_user:id,p_on:on}).then(function(r){if(r.error){toast(errText(r.error));return}toast(on?"Verified leader badge added":"Badge removed");loadMembers();loadActions();loadVer()})}
function setSuspended(id,on,name){
  if(on&&!confirm("Suspend "+name+"? They can read but not post, comment or message until you restore them."))return;
  db().rpc("admin_set_suspended",{p_user:id,p_on:on}).then(function(r){if(r.error){toast(errText(r.error,"Could not change this member."));return}toast(on?name+" is suspended":name+" is restored");loadMembers();loadActions()})}

/* ============ build ============ */
function build(){
  if(!$("app")||$("admintools"))return;
  sec("announcements","Announcements","menu",'<div id="an-list"></div>');
  sec("admintools","Admin tools","menu",
    '<p class="v9-sub">Tools for church leaders. Only admins can open these.</p>'+
    '<button class="hx-set" type="button" data-go="broadcast"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg></span><span><b>Send an announcement</b><small>Notify everyone, a group or leaders</small></span><span class="ch">&rsaquo;</span></button>'+
    '<button class="hx-set" type="button" data-go="schedule"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span><b>Schedule a post</b><small>Write now, publish later</small></span><span class="ch">&rsaquo;</span></button>'+
    '<button class="hx-set" type="button" data-go="members"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 6.5a3 3 0 0 1 0 5M18.5 14.5c2 .6 3 2.2 3 5"/></svg></span><span><b>Manage members</b><small>Verify leaders, suspend or restore</small></span><span class="ch">&rsaquo;</span></button>');
  sec("broadcast","Send announcement","admintools",
    '<label class="hx-f"><span>Title</span><input id="ab-title" maxlength="80" placeholder="Sunday service moved to 10am"></label>'+
    '<label class="hx-f"><span>Message</span><textarea id="ab-body" rows="5" maxlength="600" placeholder="Write your message"></textarea></label><div class="hx-count"><span id="ab-n">0</span>/600</div>'+
    '<fieldset class="ab-aud"><legend>Who should get it?</legend>'+
    '<label><input type="radio" name="ab-aud" value="all" checked> Everyone</label><label><input type="radio" name="ab-aud" value="group"> One group</label><label><input type="radio" name="ab-aud" value="leaders"> Verified leaders only</label></fieldset>'+
    '<label class="hx-f" id="ab-gw" hidden><span>Group</span><select id="ab-group"></select></label>'+
    '<div id="ab-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="ab-send" type="button">Send announcement</button>');
  sec("schedule","Schedule a post","admintools",
    '<p class="v9-sub">The post appears in Updates at the time you choose, within about 5 minutes. This needs the scheduler turned on in Supabase.</p>'+
    '<label class="hx-f"><span>Post</span><textarea id="sp-body" rows="5" placeholder="Write the post"></textarea></label>'+
    '<label class="hx-f"><span>Label (optional)</span><select id="sp-kind">'+KINDS.map(function(k){return '<option value="'+k[0]+'">'+k[1]+'</option>'}).join("")+'</select></label>'+
    '<label class="hx-f"><span>Publish on</span><input id="sp-when" type="datetime-local"></label>'+
    '<div id="sp-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="sp-go" type="button">Schedule post</button>'+
    '<h2 class="mm-h">Scheduled</h2><div id="sp-list"></div>');
  sec("members","Manage members","admintools",
    '<label class="hx-search" style="margin:0 0 12px"><span style="position:absolute;left:-9999px">Search members</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="mm-q" placeholder="Search members by name" autocomplete="off"></label>'+
    '<div id="mm-list"></div><div id="mm-log"></div>');
  var sp=$("sp-when");if(sp)sp.min=localMin()}

document.addEventListener("click",function(e){
  var T=e.target,b;
  if(T.closest("#bc-x")){markSeen();return}
  if((b=T.closest("#bc-home [data-go]"))){markSeen();return}
  if(T.closest("#ab-send")){sendBroadcast();return}
  if(T.closest("#sp-go")){schedule();return}
  if((b=T.closest("[data-spx]"))){if(confirm("Cancel this scheduled post?"))db().rpc("cancel_scheduled",{p_id:b.dataset.spx}).then(function(r){if(r.error){toast(errText(r.error));return}toast("Cancelled");loadSched()});return}
  if((b=T.closest("[data-av]"))){setVerified(b.dataset.av,b.dataset.on==="1");return}
  if((b=T.closest("[data-as]"))){setSuspended(b.dataset.as,b.dataset.on==="1",b.dataset.name||"this member");return}
});
document.addEventListener("input",function(e){
  if(e.target.id==="ab-body")$("ab-n").textContent=e.target.value.length;
  if(e.target.id==="mm-q"){clearTimeout(mT);mT=setTimeout(loadMembers,300)}});
document.addEventListener("change",function(e){
  if(e.target.name==="ab-aud"){var g=$("ab-gw");if(g)g.hidden=e.target.value!=="group";if(e.target.value==="group")loadGroups()}});

var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){
  build();soonDec();
  if(me()&&!ST.ver)loadVer();
  if(me()&&(!ST.bc||(visible("home")&&Date.now()-ST.bc>60000)||(visible("announcements")&&Date.now()-ST.bc>10000)))loadBc();
  if(visible("announcements")){paintBc();markSeen()}
  if(visible("home")){paintBc();susBanner()}
  if(visible("schedule")&&Date.now()-(ST.sched||0)>8000){var sp=$("sp-when");if(sp)sp.min=localMin();loadSched()}
  if(visible("members")&&Date.now()-(ST.mm||0)>8000){ST.mm=Date.now();loadMembers();loadActions()}},40)}
function init(){
  build();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);if(!u){ST={};BC=[];VER={};VERLOADED=false;SUSP=false}soon()};
  if(window.MutationObserver){
    if($("app"))new MutationObserver(function(ms){if(ms.some(function(x){return x.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
    new MutationObserver(soonDec).observe(document.body,{childList:true,subtree:true})}
  document.addEventListener("visibilitychange",function(){if(!document.hidden){ST.bc=0;soon()}});
  var pv=setInterval(function(){if(me())soon()},1500);setTimeout(function(){clearInterval(pv)},120000);
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
