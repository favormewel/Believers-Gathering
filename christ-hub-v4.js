(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function visible(id){var s=$(id);return !!s&&!s.hidden}
var COL=["#3F5FB0","#7657D6","#2F8F6B","#C2641F","#3F8279","#B8636F","#7A7637"];
function col(s){var n=0;s=s||"";for(var i=0;i<s.length;i++)n+=s.charCodeAt(i);return COL[n%COL.length]}
function ini(n){return (n||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase()}
function tm(d){try{return new Date(d).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}catch(e){return ""}}
function sameDay(a,b){return a.toDateString()===b.toDateString()}
function dayLabel(d){var t=new Date(d),n=new Date();if(sameDay(t,n))return "Today";if(sameDay(t,new Date(n-864e5)))return "Yesterday";return t.toLocaleDateString([],{day:"numeric",month:"short",year:t.getFullYear()!==n.getFullYear()?"numeric":undefined})}
function stamp(d){if(!d)return "";var t=new Date(d),n=new Date();if(sameDay(t,n))return tm(d);if(sameDay(t,new Date(n-864e5)))return "Yesterday";if(n-t<6*864e5)return t.toLocaleDateString([],{weekday:"short"});return t.toLocaleDateString([],{day:"numeric",month:"short"})}
function toast(m){var t=$("hx-toast");if(!t){t=document.createElement("div");t.id="hx-toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");document.body.appendChild(t)}
  t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove("on")},3200)}
function safeUrl(u){var b=((window.FAITHLINK_CONFIG||{}).SUPABASE_URL||"").replace(/\/$/,"")+"/storage/v1/object/public/";return(typeof u==="string"&&b.length>40&&u.indexOf(b)===0)?u:""}
var AV={};
function loadAvatars(ids,cb){
  ids=ids.filter(function(i,k){return i&&ids.indexOf(i)===k&&AV[i]===undefined});
  if(!ids.length||!db())return cb();
  db().from("member_avatars").select("user_id,avatar_url").in("user_id",ids).then(function(r){
    ids.forEach(function(i){AV[i]=""});if(!r.error)(r.data||[]).forEach(function(x){AV[x.user_id]=x.avatar_url||""});cb()},function(){cb()})}
function avHTML(uid,name,cls){var u=safeUrl(AV[uid]);return '<span class="av'+(cls?" "+cls:"")+'" style="background:'+col(uid)+'">'+(u?'<img src="'+esc(u)+'" alt="" decoding="async">':esc(ini(name)))+'</span>'}
function okPath(p){return typeof p==="string"&&/^[0-9a-f-]{36}\/[0-9]+\.jpg$/i.test(p)}

var TH=[],CUR=null,SEEN={},LAST="",LASTDAY="",MODE="dm",DMOFF=false,CHAN=null,PENDING="",TMP=0,STAMPT=0,URLS={};
var SVG={
 back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>',
 img:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',
 send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>'};

/* ---------- build screens ---------- */
function build(){
  if($("dm"))return;
  var app=$("app");if(!app)return;
  var s=document.createElement("section");s.id="dm";s.hidden=true;
  s.innerHTML='<div class="hx-screen dm"><header class="hx-top dmh"><button class="hx-icon" aria-label="Back to messages" data-go="messages">'+SVG.back+'</button><button type="button" class="dmwho" id="dm-who" aria-label="View member"><span id="dm-av"></span><span id="dm-name"></span></button></header>'+
   '<div class="dmlist" id="dm-list" role="log" aria-live="polite" aria-label="Conversation"></div>'+
   '<div class="dmbar"><input type="file" id="dm-file" accept="image/*" hidden><button type="button" id="dm-att" aria-label="Send a photo">'+SVG.img+'</button><textarea id="dm-text" rows="1" placeholder="Message" aria-label="Type a message"></textarea><button type="button" id="dm-send" aria-label="Send message">'+SVG.send+'</button></div></div>';
  app.appendChild(s);
  var n=document.createElement("section");n.id="newdm";n.hidden=true;
  n.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="messages">'+SVG.back+'</button><h1 style="font-size:20px">New message</h1></div></header>'+
   '<label class="hx-search"><span style="position:absolute;left:-9999px">Search members</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="newdm-q" placeholder="Search members by name" autocomplete="off"></label>'+
   '<div class="hx-scroll" data-scroll style="padding-top:2px"><div id="newdm-list"><div class="hx-empty">Type at least 2 letters of a member\u2019s name.</div></div></div></div>';
  app.appendChild(n);
  /* Messages screen: Direct | Groups */
  var ms=$("messages");
  if(ms&&!$("hx-dm-list")){
    var sr=ms.querySelector(".hx-search");
    if(sr)sr.insertAdjacentHTML("beforebegin",'<div class="hx-umode" id="hx-msgmode" role="tablist" style="margin:0 18px 10px"><button class="on" data-msgmode="dm" role="tab" aria-selected="true">Direct</button><button data-msgmode="grp" role="tab" aria-selected="false">Groups</button></div>');
    var gl=$("hx-msg-list");if(gl)gl.insertAdjacentHTML("beforebegin",'<div id="hx-dm-list"></div>');
    applyMode()}
  /* unread badge on the Home Messages tile */
  var tile=document.querySelector('#home .hx-quick [data-go="messages"]');
  if(tile&&!tile.querySelector(".bdg"))tile.insertAdjacentHTML("beforeend",'<em class="bdg" hidden></em>')}

function applyMode(){
  var d=$("hx-dm-list"),g=$("hx-msg-list"),q=$("hx-msg-q");
  if(d)d.hidden=MODE!=="dm";if(g)g.hidden=MODE!=="grp";
  if(q)q.placeholder=MODE==="dm"?"Search messages...":"Search chats...";
  document.querySelectorAll("[data-msgmode]").forEach(function(b){var on=b.dataset.msgmode===MODE;b.classList.toggle("on",on);b.setAttribute("aria-selected",on?"true":"false")});
  var ic=document.querySelector("#messages header .hx-icon");if(ic)ic.setAttribute("aria-label",MODE==="dm"?"New message":"New group")}

/* ---------- conversation list ---------- */
function note(t){return '<div class="hx-empty">'+esc(t)+'</div>'}
function renderList(){
  var box=$("hx-dm-list");if(!box)return;
  if(!db()||!me()){box.innerHTML=note("Sign in to send and receive messages.");return}
  if(DMOFF){box.innerHTML=note("Direct messages are not set up yet. Run the messages SQL in Supabase first.");return}
  var q=(($("hx-msg-q")||{}).value||"").trim().toLowerCase(),uid=me().id;
  var rows=TH.filter(function(t){return !q||(t.name+" "+(t.body||"")).toLowerCase().indexOf(q)>-1});
  if(!rows.length){box.innerHTML=note(q?"No messages match your search.":"No direct messages yet. Tap the pencil to message someone, or tap a member\u2019s picture on Updates.");return}
  box.innerHTML=rows.map(function(t){
    var pv=(t.sender===uid?"You: ":"")+(t.body==="Photo"?"Photo":(t.body||""));
    return '<button class="hx-row round" type="button" data-dmid="'+esc(t.id)+'">'+avHTML(t.otherId,t.name)+'<span class="tx"><b>'+esc(t.name)+'</b><small>'+esc(pv)+'</small></span><span class="tm">'+esc(stamp(t.at))+'</span>'+(t.unread?'<span class="bd">'+(t.unread>99?"99+":t.unread)+'</span>':"")+'</button>'}).join("")}
function badge(){
  var n=TH.reduce(function(a,t){return a+(t.unread||0)},0);
  var b=document.querySelector('#home .hx-quick [data-go="messages"] .bdg');
  if(b){b.hidden=!n;b.textContent=n>99?"99+":n}
  var tile=document.querySelector('#home .hx-quick [data-go="messages"]');if(tile)tile.setAttribute("aria-label","Messages"+(n?", "+n+" unread":""))}
function loadThreads(cb){
  if(!db()||!me()){TH=[];renderList();badge();if(cb)cb();return}
  STAMPT=Date.now();
  db().rpc("my_dms").then(function(r){
    if(r.error){DMOFF=true;TH=[];renderList();badge();if(cb)cb();return}
    DMOFF=false;
    TH=(r.data||[]).map(function(x){return{id:x.thread_id,otherId:x.other_id,name:x.other_name||"Member",body:x.last_body,at:x.last_at,sender:x.last_sender,unread:+x.unread||0}});
    loadAvatars(TH.map(function(t){return t.otherId}),function(){renderList();badge();if(cb)cb()})},function(){DMOFF=true;renderList();if(cb)cb()})}

/* ---------- conversation ---------- */
function lb(url){
  var o=$("hx-lb");
  if(!o){o=document.createElement("div");o.id="hx-lb";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label","Photo");o.innerHTML='<button type="button" id="hx-lb-x" aria-label="Close photo">&times;</button><img alt="">';document.body.appendChild(o)}
  o.querySelector("img").src=url;o.classList.add("on");$("hx-lb-x").focus()}
function signImgs(){
  var imgs=Array.prototype.slice.call(document.querySelectorAll('#dm-list img[data-path]:not([src])'));
  var need=imgs.map(function(i){return i.dataset.path}).filter(function(p,k,a){return a.indexOf(p)===k&&!(URLS[p]&&URLS[p].exp>Date.now())});
  function paint(){imgs.forEach(function(i){var u=URLS[i.dataset.path];if(u&&u.exp>Date.now())i.src=u.url})}
  if(!need.length||!db())return paint();
  db().storage.from("dm-images").createSignedUrls(need,3600).then(function(r){
    (r.data||[]).forEach(function(x){if(x&&x.signedUrl)URLS[x.path]={url:x.signedUrl,exp:Date.now()+3300000}});paint()},function(){})}
function addMsg(m,tmp){
  var box=$("dm-list");if(!box||!m)return null;
  if(m.id&&!tmp){if(SEEN[m.id])return null;SEEN[m.id]=1}
  var n0=box.querySelector(".dm-note");if(n0)n0.remove();
  var dl=dayLabel(m.created_at||new Date());
  if(dl!==LASTDAY){LASTDAY=dl;var s=document.createElement("div");s.className="dmday";s.textContent=dl;box.appendChild(s)}
  var mine=me()&&m.sender_id===me().id;
  var d=document.createElement("div");d.className="dmb "+(mine?"mine":"their")+(tmp?" pending":"");if(m.id)d.dataset.mid=m.id;
  var im="";
  if(m.local_url)im='<img class="dmi" src="'+esc(m.local_url)+'" alt="Photo" data-full="'+esc(m.local_url)+'">';
  else if(okPath(m.image_path))im='<img class="dmi" data-path="'+esc(m.image_path)+'" alt="Photo">';
  d.innerHTML=im+(m.body?'<div class="dmt">'+esc(m.body)+'</div>':"")+'<div class="dmm">'+esc(tm(m.created_at||new Date()))+'</div>';
  box.appendChild(d);
  if(m.created_at&&(!LAST||m.created_at>LAST)&&!tmp)LAST=m.created_at;
  box.scrollTop=box.scrollHeight;signImgs();return d}
function markRead(id){
  if(!db())return;db().rpc("dm_mark_read",{p_thread:id}).then(function(){},function(){});
  var t=TH.filter(function(x){return x.id===id})[0];if(t){t.unread=0;renderList();badge()}}
function fetchMsgs(initial){
  if(!CUR||!db())return;var id=CUR.id,box=$("dm-list");
  var q=db().from("dm_messages").select("*").eq("thread_id",id);
  if(!initial&&LAST)q=q.gt("created_at",LAST);
  q.order("created_at",{ascending:false}).limit(initial?60:30).then(function(r){
    if(!CUR||CUR.id!==id)return;
    if(r.error){box.innerHTML='<div class="dm-note">Could not load messages. Run the messages SQL in Supabase if this is new.</div>';return}
    var rows=(r.data||[]).slice().reverse();
    if(initial){box.innerHTML="";LASTDAY="";SEEN={};LAST=""}
    var added=0,fromOther=false;
    rows.forEach(function(m){if(addMsg(m)){added++;if(m.sender_id!==me().id)fromOther=true}});
    if(initial&&!rows.length)box.innerHTML='<div class="dm-note">No messages yet. Say hello!</div>';
    if(initial||fromOther)markRead(id)})}
function openDm(t){
  if(!t)return;CUR={id:t.id,otherId:t.otherId,name:t.name};
  $("dm-name").textContent=t.name;$("dm-av").innerHTML=avHTML(t.otherId,t.name);
  $("dm-list").innerHTML='<div class="dm-note">Loading...</div>';$("dm-text").value="";autoGrow();
  window.show("dm");
  loadAvatars([t.otherId],function(){if(CUR&&CUR.id===t.id)$("dm-av").innerHTML=avHTML(t.otherId,t.name)});
  fetchMsgs(true)}
function autoGrow(){var t=$("dm-text");if(!t)return;t.style.height="auto";t.style.height=Math.min(120,t.scrollHeight)+"px"}
function afterSent(tmpEl,row){
  if(!tmpEl)return;
  if(row&&row.id){
    if(SEEN[row.id]){tmpEl.remove()}else{SEEN[row.id]=1;tmpEl.dataset.mid=row.id;tmpEl.classList.remove("pending");if(row.created_at&&(!LAST||row.created_at>LAST))LAST=row.created_at}}
  loadThreads()}
function failed(tmpEl,retryText){
  if(!tmpEl)return;tmpEl.classList.remove("pending");tmpEl.classList.add("failed");
  var m=tmpEl.querySelector(".dmm");if(m)m.textContent="Not sent. Tap to retry";
  tmpEl.dataset.retry=retryText}
function sendText(t,tmpEl){
  if(!CUR)return;var id=CUR.id;
  db().from("dm_messages").insert({thread_id:id,body:t}).select().then(function(r){
    var row=r.data&&(Array.isArray(r.data)?r.data[0]:r.data);
    if(r.error||!row){failed(tmpEl,t);if(r.error&&/blocked|policy|row-level/i.test(r.error.message||""))toast("You can\u2019t message this person.");return}
    afterSent(tmpEl,row)},function(){failed(tmpEl,t)})}
function send(){
  if(!CUR||!db()||!me())return;var ta=$("dm-text"),t=ta.value.trim();if(!t)return;
  ta.value="";autoGrow();
  var el=addMsg({sender_id:me().id,body:t,created_at:new Date().toISOString()},true);
  sendText(t,el)}
function shrink(file,max,cb){
  if(!file||String(file.type).indexOf("image/")!==0||file.size>25*1048576)return cb(null);
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,max/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));
    var x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(function(b){cb(b)},"image/jpeg",.82)};
  img.onerror=function(){URL.revokeObjectURL(url);cb(null)};img.src=url}
function sendPhoto(file){
  if(!CUR||!db()||!me())return;var id=CUR.id;
  shrink(file,1280,function(bl){
    if(!bl){toast("That photo could not be read.");return}
    var local=URL.createObjectURL(bl),el=addMsg({sender_id:me().id,body:"",created_at:new Date().toISOString(),local_url:local},true);
    var path=id+"/"+Date.now()+".jpg";
    db().storage.from("dm-images").upload(path,bl,{contentType:"image/jpeg",upsert:false,cacheControl:"3600"}).then(function(r){
      if(r.error){if(el)el.remove();toast("Photo could not be sent. Run the messages SQL in Supabase first.");return}
      db().from("dm_messages").insert({thread_id:id,image_path:path}).select().then(function(q){
        var row=q.data&&(Array.isArray(q.data)?q.data[0]:q.data);
        if(q.error||!row){if(el)el.remove();toast("Photo could not be sent.");return}
        if(el){var im=el.querySelector("img");if(im){im.dataset.path=path;URLS[path]={url:local,exp:Date.now()+3300000}}}
        afterSent(el,row)})},function(){if(el)el.remove();toast("Photo could not be sent.")})})}

/* ---------- start a conversation ---------- */
function startDm(otherId,name,prefill){
  if(!db()||!me()){toast("Please sign in first.");return}
  if(otherId===me().id)return;
  db().rpc("start_dm",{p_other:otherId}).then(function(r){
    if(r.error||!r.data){
      var m=(r.error&&r.error.message)||"";
      toast(/blocked/i.test(m)?"You can\u2019t message this person.":/function|schema cache|could not find/i.test(m)?"Direct messages are not set up yet. Run the messages SQL in Supabase.":"Could not start the chat. Please try again.");return}
    var t=TH.filter(function(x){return x.id===r.data})[0]||{id:r.data,otherId:otherId,name:name||"Member"};
    openDm(t);if(prefill){var tb=$("dm-text");if(tb){tb.value=prefill;autoGrow()}}},function(){toast("Could not start the chat. Please try again.")})}
var sT=null;
function searchMembers(){
  var q=($("newdm-q").value||"").trim(),box=$("newdm-list");
  if(q.length<2){box.innerHTML='<div class="hx-empty">Type at least 2 letters of a member\u2019s name.</div>';return}
  if(!db()||!me()){box.innerHTML=note("Sign in first.");return}
  db().rpc("find_members",{p_q:q}).then(function(r){
    if(r.error){box.innerHTML=note("Member search is not set up yet. Run the messages SQL in Supabase first.");return}
    var rows=r.data||[];
    if(!rows.length){box.innerHTML=note("No members found for \u201c"+q+"\u201d.");return}
    loadAvatars(rows.map(function(x){return x.id}),function(){
      box.innerHTML=rows.map(function(x){var n=x.full_name||"Member";return '<button class="hx-row round" type="button" data-startdm="'+esc(x.id)+'" data-pname="'+esc(n)+'">'+avHTML(x.id,n)+'<span class="tx"><b>'+esc(n)+'</b><small>Send a message</small></span></button>'}).join("")})},function(){})}

/* ---------- member sheet ---------- */
function closeSheet(){var o=$("hx-ps");if(o)o.classList.remove("on")}
function personSheet(id,name){
  if(!me()||id===me().id)return;
  var o=$("hx-ps");
  if(!o){o=document.createElement("div");o.id="hx-ps";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label","Member");document.body.appendChild(o)}
  loadAvatars([id],function(){
    var f=window.CHEN_ISF&&window.CHEN_ISF(id);
    o.innerHTML='<div class="ps-card"><button type="button" class="ps-x" data-psx aria-label="Close">&times;</button>'+avHTML(id,name,"big")+'<h3>'+esc(name)+'</h3>'+
      '<div class="ps-act"><button type="button" class="fol'+(f?" on":"")+'" data-follow="'+esc(id)+'" data-name="'+esc(name)+'">'+(f?"Following":"Follow")+'</button><button type="button" class="msg" data-psmsg="'+esc(id)+'" data-pname="'+esc(name)+'">Message</button></div>'+
      '<button type="button" class="ps-blk" data-psblock="'+esc(id)+'" data-pname="'+esc(name)+'">Block this person</button></div>';
    o.classList.add("on");var x=o.querySelector(".msg");if(x)x.focus()})}

/* ---------- realtime + refresh ---------- */
function onNew(m){
  if(!m||!me())return;
  if(CUR&&m.thread_id===CUR.id&&visible("dm")){
    if(!SEEN[m.id]){var tmp=document.querySelector('#dm-list .dmb.pending');addMsg(m)}
    if(m.sender_id!==me().id)markRead(m.thread_id);loadThreads()}
  else loadThreads()}
function listen(){
  var d=db();
  if(!me()){if(CHAN&&d&&d.removeChannel){try{d.removeChannel(CHAN)}catch(e){}}CHAN=null;return}
  if(CHAN||!d||!d.channel)return;
  CHAN=d.channel("fl-dm").on("postgres_changes",{event:"INSERT",schema:"public",table:"dm_messages"},function(p){onNew(p.new)}).subscribe()}
function tryPending(){
  if(!PENDING||!me())return;var id=PENDING;
  var t=TH.filter(function(x){return x.id===id})[0];
  if(t){PENDING="";openDm(t);return}
  loadThreads(function(){var t2=TH.filter(function(x){return x.id===id})[0];PENDING="";if(t2)openDm(t2);else window.show("messages")})}
window.CHEN_STARTDM=function(id,name,pre){startDm(id,name,pre)};
window.CHEN_OPENDM=function(id){if(/^[0-9a-f-]{36}$/i.test(String(id))){PENDING=String(id);tryPending()}};
function refresh(){
  build();listen();
  if(me()&&!STAMPT)loadThreads();
  if(visible("messages")&&Date.now()-STAMPT>15000)loadThreads();
  if(visible("home")&&Date.now()-STAMPT>30000)loadThreads();
  if(visible("newdm")){var q=$("newdm-q");if(q&&!q.dataset.f){q.dataset.f=1;setTimeout(function(){q.focus()},150)}}
  else{var q2=$("newdm-q");if(q2)q2.dataset.f=""}
  tryPending()}
var t=null;function soon(){clearTimeout(t);t=setTimeout(refresh,30)}

/* ---------- events ---------- */
document.addEventListener("click",function(e){
  var T=e.target,b;
  if(T.closest&&T.closest("#messages header .hx-icon")&&MODE==="dm"){e.stopPropagation();e.preventDefault();window.show("newdm");return}
},true);
document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest("[data-msgmode]"))){MODE=b.dataset.msgmode;applyMode();if(MODE==="dm")renderList();return}
  if((b=T.closest("[data-dmid]"))){var th=TH.filter(function(x){return x.id===b.dataset.dmid})[0];if(th)openDm(th);return}
  if((b=T.closest("[data-startdm]"))){startDm(b.dataset.startdm,b.dataset.pname);return}
  if((b=T.closest("[data-psmsg]"))){var id=b.dataset.psmsg,nm=b.dataset.pname;closeSheet();startDm(id,nm);return}
  if((b=T.closest("[data-psblock]"))){
    var bid=b.dataset.psblock,bn=b.dataset.pname;
    if(confirm("Block "+bn+"? You will not see each other\u2019s posts or messages.")&&db()){
      db().from("blocks").insert({blocked_id:bid}).then(function(r){
        if(r.error){toast("Could not block. Please try again.");return}
        if(window.FLC_BLOCKED)window.FLC_BLOCKED[bid]=bn;closeSheet();toast(bn+" is blocked");
        if(CUR&&CUR.otherId===bid){CUR=null;window.show("messages")}loadThreads()})}
    return}
  if(T.closest("[data-psx]")||T.id==="hx-ps"){closeSheet();return}
  if((b=T.closest("[data-person]"))){if(!T.closest("[data-follow]"))personSheet(b.dataset.person,b.dataset.pname||"Member");return}
  if(T.closest("#dm-who")&&CUR){personSheet(CUR.otherId,CUR.name);return}
  if(T.closest("#dm-send")){send();return}
  if(T.closest("#dm-att")){$("dm-file").click();return}
  if((b=T.closest("#dm-list .dmb.failed"))){var rt=b.dataset.retry;b.remove();var el=addMsg({sender_id:me().id,body:rt,created_at:new Date().toISOString()},true);sendText(rt,el);return}
  if((b=T.closest("#dm-list .dmi"))){var u=b.dataset.full||b.currentSrc||b.src;if(u)lb(u);return}
  if(T.closest("#hx-lb")){var o=$("hx-lb");if(o)o.classList.remove("on");return}
});
document.addEventListener("input",function(e){
  if(e.target.id==="dm-text")autoGrow();
  if(e.target.id==="newdm-q"){clearTimeout(sT);sT=setTimeout(searchMembers,250)}
  if(e.target.id==="hx-msg-q"&&MODE==="dm")renderList()});
document.addEventListener("keydown",function(e){
  if(e.key==="Escape")closeSheet();
  if(e.key==="Enter"&&!e.shiftKey&&e.target.id==="dm-text"&&window.matchMedia&&window.matchMedia("(hover:hover) and (pointer:fine)").matches){e.preventDefault();send()}});
document.addEventListener("change",function(e){if(e.target.id==="dm-file"){var f=e.target.files&&e.target.files[0];e.target.value="";if(f)sendPhoto(f)}});
document.addEventListener("visibilitychange",function(){if(!document.hidden){STAMPT=0;soon()}});

function init(){
  build();
  var m=((location.search.match(/[?&]open=([^&]+)/)||[])[1])||"";try{m=decodeURIComponent(m)}catch(x){m=""}
  if(m.indexOf("dm:")===0&&/^[0-9a-f-]{36}$/i.test(m.slice(3)))PENDING=m.slice(3);
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);if(!u){TH=[];CUR=null;STAMPT=0}soon()};
  if(window.MutationObserver&&$("app"))new MutationObserver(function(ms){if(ms.some(function(x){return x.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  var pv=setInterval(function(){if(me()){soon()}},1000);setTimeout(function(){clearInterval(pv)},180000);
  /* fallback while a chat is open (in case live updates are off) */
  setInterval(function(){if(CUR&&visible("dm")&&!document.hidden)fetchMsgs(false)},7000);
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
