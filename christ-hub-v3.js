(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function ini(n){return (n||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase()}
var COL=["#3F5FB0","#7657D6","#2F8F6B","#C2641F","#3F8279","#B8636F","#7A7637"];
function col(s){var n=0;s=s||"";for(var i=0;i<s.length;i++)n+=s.charCodeAt(i);return COL[n%COL.length]}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function myName(){var u=me();return (u&&u.user_metadata&&u.user_metadata.full_name)||(u&&u.email&&u.email.split("@")[0])||"Member"}
function visible(id){var s=$(id);return s&&!s.hidden}
function ago(d){var s=(Date.now()-new Date(d))/1000;if(s<60)return "just now";if(s<3600)return Math.floor(s/60)+" min ago";if(s<86400)return Math.floor(s/3600)+" hr ago";if(s<604800)return Math.floor(s/86400)+" d ago";return new Date(d).toLocaleDateString([],{day:"numeric",month:"short"})}
function when(d){try{return new Date(d).toLocaleString([],{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}catch(e){return ""}}
function note(msg){return '<div class="hx-empty">'+esc(msg)+'</div>'}
var NEED="Sign in to see this. Guests can browse groups and the Bible.";
function safeUrl(u){var b=((window.FAITHLINK_CONFIG||{}).SUPABASE_URL||"").replace(/\/$/,"")+"/storage/v1/object/public/";return(typeof u==="string"&&b.length>40&&u.indexOf(b)===0)?u:""}
var AV={},mineDone="";
function avInner(uid,name){var u=safeUrl(AV[uid]);return u?'<img src="'+esc(u)+'" alt="" decoding="async">':esc(ini(name))}
function loadAvatars(ids,cb){
  ids=ids.filter(function(i,k){return i&&ids.indexOf(i)===k&&AV[i]===undefined});
  if(!ids.length||!db())return cb();
  db().from("member_avatars").select("user_id,avatar_url").in("user_id",ids).then(function(r){
    ids.forEach(function(i){AV[i]=""});if(!r.error)(r.data||[]).forEach(function(x){AV[x.user_id]=x.avatar_url||""});cb()},function(){cb()})}
function applyMine(){
  var u=me();if(!u)return;var url=safeUrl(AV[u.id]);
  [$("me-avatar"),$("hx-av")].forEach(function(el){if(!el)return;
    if(url){el.style.setProperty("--photo",'url("'+url.replace(/"/g,"%22")+'")');el.classList.add("has-photo")}else{el.style.removeProperty("--photo");el.classList.remove("has-photo")}});
  var rm=$("hx-av-rm");if(rm)rm.hidden=!url}
function loadMine(){var u=me();if(!u||!db()||mineDone===u.id)return;mineDone=u.id;loadAvatars([u.id],applyMine)}
function toast(m){var t=$("hx-toast");if(!t){t=document.createElement("div");t.id="hx-toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");document.body.appendChild(t)}
  t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove("on")},3200)}
/* shrink a photo in the browser: smaller upload, and the phone's location data is dropped */
function shrink(file,max,square,cb){
  if(!file||String(file.type).indexOf("image/")!==0||file.size>25*1048576)return cb(null);
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){
    var w=img.naturalWidth,h=img.naturalHeight,sx=0,sy=0,sw=w,sh=h,cw,ch;
    if(square){var m=Math.min(w,h);sx=(w-m)/2;sy=(h-m)/2;sw=sh=m;cw=ch=Math.min(max,m)}else{var s=Math.min(1,max/Math.max(w,h));cw=Math.max(1,Math.round(w*s));ch=Math.max(1,Math.round(h*s))}
    var c=document.createElement("canvas");c.width=cw;c.height=ch;var x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cw,ch);x.drawImage(img,sx,sy,sw,sh,0,0,cw,ch);
    URL.revokeObjectURL(url);c.toBlob(function(b){cb(b)},"image/jpeg",.82)};
  img.onerror=function(){URL.revokeObjectURL(url);cb(null)};img.src=url}
var STAMP={};function fresh(k,ms){return Date.now()-(STAMP[k]||0)<ms}
function snapKey(n){var u=me();return u?"fl-snap-"+n+"-"+u.id:""}
function snapGet(n){try{var k=snapKey(n);return k?(localStorage.getItem(k)||""):""}catch(e){return ""}}
function snapSet(n,h){try{var k=snapKey(n);if(!k)return;if(h.length<60000)localStorage.setItem(k,h);else localStorage.removeItem(k)}catch(e){}}
function skel(n){var s="";for(var i=0;i<(n||3);i++)s+='<div class="hx-skel"><i class="a"></i><div><i class="l1"></i><i class="l2"></i><i class="l3"></i></div></div>';return '<div role="status" aria-label="Loading updates">'+s+'</div>'}
var PH=[],VID=null,MAXV=50*1048576;
function renderVID(){
  var b=$("np-video");if(!b)return;
  b.innerHTML=VID?'<div class="vprev"><video src="'+VID.url+'" muted playsinline preload="metadata" aria-label="Selected video"></video><button type="button" data-vrm aria-label="Remove video">&times;</button><small>'+esc(VID.file.name||"video")+' &middot; '+(VID.file.size/1048576).toFixed(1)+' MB</small></div>':"";
  var a=$("np-addv");if(a){a.hidden=!!VID||PH.length>0;if(a.parentNode)a.parentNode.hidden=PH.length>0}
  var p=$("np-add");if(p){p.hidden=PH.length>=4||!!VID;if(p.parentNode)p.parentNode.hidden=!!VID}}
function makePoster(file,cb){
  var url=URL.createObjectURL(file),v=document.createElement("video"),done=false;
  function fin(b){if(done)return;done=true;URL.revokeObjectURL(url);cb(b)}
  v.muted=true;v.playsInline=true;v.preload="metadata";
  v.onloadedmetadata=function(){try{v.currentTime=Math.min(1,(v.duration||2)/2)}catch(e){fin(null)}};
  v.onseeked=function(){try{var w=v.videoWidth,h=v.videoHeight;if(!w||!h)return fin(null);var s=Math.min(1,720/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.round(w*s);c.height=Math.round(h*s);c.getContext("2d").drawImage(v,0,0,c.width,c.height);c.toBlob(function(b){fin(b)},"image/jpeg",.8)}catch(e){fin(null)}};
  v.onerror=function(){fin(null)};setTimeout(function(){fin(null)},6000);v.src=url}
function xhrUpload(bucket,path,file,onp,cb){
  var C=window.FAITHLINK_CONFIG||{},base=(C.SUPABASE_URL||"").replace(/\/$/,"");
  function sdk(){db().storage.from(bucket).upload(path,file,{contentType:file.type||"video/mp4",upsert:false}).then(function(r){cb(r.error||null)},function(e){cb(e||true)})}
  if(!db().auth||!db().auth.getSession||!base)return sdk();
  db().auth.getSession().then(function(s){
    var tok=s&&s.data&&s.data.session&&s.data.session.access_token;if(!tok)return sdk();
    var x=new XMLHttpRequest();x.open("POST",base+"/storage/v1/object/"+bucket+"/"+path);
    x.setRequestHeader("Authorization","Bearer "+tok);if(C.SUPABASE_ANON_KEY)x.setRequestHeader("apikey",C.SUPABASE_ANON_KEY);
    x.setRequestHeader("Content-Type",file.type||"video/mp4");x.setRequestHeader("x-upsert","false");x.setRequestHeader("cache-control","max-age=31536000");
    x.upload.onprogress=function(e){if(e.lengthComputable)onp(Math.round(e.loaded/e.total*100))};
    x.onload=function(){cb(x.status>=200&&x.status<300?null:"status "+x.status)};x.onerror=function(){cb("network")};x.send(file)},function(){sdk()})}
function uploadVid(cb){
  var f=VID.file,uid=me().id,ext=((f.name||"").split(".").pop()||"mp4").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,5)||"mp4",path=uid+"/"+Date.now()+"."+ext,m=$("np-msg");
  m.className="hx-msg ok";m.textContent="Uploading video 0%...";
  xhrUpload("post-videos",path,f,function(pc){m.textContent="Uploading video "+pc+"%..."},function(err){
    if(err)return cb(err);
    var vurl=db().storage.from("post-videos").getPublicUrl(path).data.publicUrl;
    if(!VID.poster)return cb(null,vurl,"");
    var pp=uid+"/"+Date.now()+"-poster.jpg";
    db().storage.from("post-images").upload(pp,VID.poster,{contentType:"image/jpeg",upsert:false,cacheControl:"31536000"}).then(function(r){cb(null,vurl,r.error?"":db().storage.from("post-images").getPublicUrl(pp).data.publicUrl)},function(){cb(null,vurl,"")})})}
function vidHTML(p){
  var u=safeUrl(p.video_url);if(!u)return "";var po=safeUrl(p.video_poster);
  return '<div class="hx-vid"><video controls playsinline preload="'+(po?"none":"metadata")+'"'+(po?' poster="'+esc(po)+'"':"")+' src="'+esc(u)+(po?"":"#t=0.1")+'" aria-label="Video shared by '+esc(p.author_name||"a member")+'"></video></div>'}
function renderPH(){var b=$("np-photos");if(!b)return;
  b.innerHTML=PH.map(function(p,i){return '<div class="phx"><img src="'+p.url+'" alt="Selected photo '+(i+1)+'"><button type="button" data-phrm="'+i+'" aria-label="Remove photo '+(i+1)+'">&times;</button></div>'}).join("");
  var a=$("np-add");if(a){a.hidden=PH.length>=4||!!VID;if(a.parentNode)a.parentNode.hidden=!!VID}var v=$("np-addv");if(v){v.hidden=!!VID||PH.length>0;if(v.parentNode)v.parentNode.hidden=PH.length>0}}
function uploadPhotos(cb){
  var urls=[],i=0,uid=me().id,m=$("np-msg");
  (function next(){
    if(i>=PH.length)return cb(null,urls);
    m.className="hx-msg ok";m.textContent="Uploading photo "+(i+1)+" of "+PH.length+"...";
    var path=uid+"/"+Date.now()+"-"+i+".jpg";
    db().storage.from("post-images").upload(path,PH[i].blob,{contentType:"image/jpeg",upsert:false,cacheControl:"31536000"}).then(function(r){
      if(r.error)return cb(r.error);
      urls.push(db().storage.from("post-images").getPublicUrl(path).data.publicUrl);i++;next()},function(e){cb(e||true)})})()}
function lightbox(url){
  var o=$("hx-lb");
  if(!o){o=document.createElement("div");o.id="hx-lb";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.setAttribute("aria-label","Photo");o.innerHTML='<button type="button" id="hx-lb-x" aria-label="Close photo">&times;</button><img alt="">';document.body.appendChild(o)}
  o.querySelector("img").src=url;o.classList.add("on");$("hx-lb-x").focus()}
function closeLb(){var o=$("hx-lb");if(o)o.classList.remove("on")}

/* ---------- screens added once ---------- */
var SVGBACK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>';
function sec(id,title,back,body){
  var s=document.createElement("section");s.id=id;s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="'+back+'">'+SVGBACK+'</button><h1 style="font-size:20px">'+title+'</h1></div></header><div class="hx-scroll" data-scroll>'+body+'</div></div>';
  $("app").appendChild(s)}
function build(){
  buildUpdates();
  if($("newevent"))return;
  sec("newevent","Create Event","explore",
   '<label class="hx-f"><span>Event name</span><input id="ne-title" maxlength="120" placeholder="Sunday Worship Service"></label>'+
   '<label class="hx-f"><span>Date and time</span><input id="ne-when" type="datetime-local"></label>'+
   '<label class="hx-f"><span>Where</span><input id="ne-where" maxlength="160" placeholder="Church hall, Gulu"></label>'+
   '<label class="hx-f"><span>Details (optional)</span><textarea id="ne-desc" maxlength="600" rows="4" placeholder="What should people know?"></textarea></label>'+
   '<div id="ne-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="ne-btn" type="button">Publish Event</button>');
  sec("newpost","Share an Update","home",
   '<div class="hx-f"><span>Choose a template (optional)</span><div class="hx-tpls" id="np-tpls">'+tplChips("")+'</div></div>'+
   '<label class="hx-f"><span>What is on your heart?</span><textarea id="np-text" rows="7" placeholder="Share a testimony, a verse, or encouragement..."></textarea></label>'+
   '<div class="hx-count"><span id="np-n">0</span> characters</div>'+
   '<div class="hx-f"><span>Photos (optional, up to 4)</span><div id="np-photos" class="hx-photos"></div><button type="button" class="hx-addph" id="np-add">Add photos</button><input type="file" id="np-file" accept="image/*" multiple hidden></div>'+
   '<div class="hx-f"><span>Video (optional, up to 50 MB)</span><div id="np-video"></div><button type="button" class="hx-addph" id="np-addv">Add a video</button><input type="file" id="np-vfile" accept="video/*" hidden></div>'+
   '<div id="np-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="np-btn" type="button">Post</button>');
  sec("myposts","My Posts","profile",'<div id="hx-myposts"></div>');
  /* events tab content */
  var ev=$("hx-ex-events");
  if(ev)ev.innerHTML='<button class="hx-cta slim" data-go="newevent" type="button">+ Create Event</button><div id="hx-ev-list" style="margin-top:14px"></div>';
  /* community feed on Home, before Verse of the Day */
  var hs=document.querySelectorAll("#home .hx-sec"),vd=null;
  hs.forEach(function(h){if(/Verse of the Day/.test(h.textContent))vd=h});
  if(vd){var w=document.createElement("div");w.innerHTML='<div class="hx-sec"><h2>Community</h2><button data-go="newpost" type="button">Share update</button></div><div id="hx-feed"></div>';
    while(w.firstChild)vd.parentNode.insertBefore(w.firstChild,vd)}
  /* profile photo controls */
  var av=$("me-avatar");
  if(av&&!$("hx-av-change")){av.setAttribute("role","button");av.setAttribute("tabindex","0");av.setAttribute("aria-label","Change profile photo");
    av.insertAdjacentHTML("afterend",'<div class="hx-avact"><button type="button" id="hx-av-change">Change photo</button><button type="button" id="hx-av-rm" hidden>Remove</button><input type="file" id="av-file" accept="image/*" hidden></div>')}
  /* My posts row on Profile */
  var ep=document.querySelector('#profile button[data-go="editprofile"]');
  if(ep&&!$("hx-myposts-row")){var r=ep.cloneNode(true);r.id="hx-myposts-row";r.setAttribute("data-go","myposts");r.querySelector("span").textContent="My posts";ep.parentNode.insertBefore(r,ep.nextSibling)}
}

/* ---------- UPDATES TAB ---------- */
var UM="all",FOCUS="",HASHID=((location.hash.match(/^#post-([0-9a-f-]{36})$/i))||[])[1]||"";
function buildUpdates(){
  if($("updates"))return;
  var s=document.createElement("section");s.id="updates";s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top"><h1>Updates</h1><button class="hx-icon" aria-label="Share an update" data-go="newpost"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></header>'+
   '<div class="hx-scroll" data-scroll style="padding-top:0"><div class="hx-sec" style="margin:4px 0 8px"><h2 style="font-size:15px">Share something</h2></div><div class="hx-tpls scroll">'+tplChips("")+'</div><div class="hx-umode" role="tablist"><button class="on" data-umode="all" role="tab">Everyone</button><button data-umode="following" role="tab">Following</button></div><div class="hx-ustats" id="hx-ustats"></div><div id="hx-ppl"></div><div id="hx-updates-feed"></div></div></div>';
  var nv=document.querySelector("#groups nav.hx-nav");if(nv){var cn=nv.cloneNode(true);cn.querySelectorAll("button").forEach(function(b){var on=b.dataset.tab==="updates";b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});s.firstChild.appendChild(cn)}
  $("app").appendChild(s)}
function loadUpdates(){
  var box=$("hx-updates-feed"),ppl=$("hx-ppl"),st=$("hx-ustats");if(!box)return;
  document.querySelectorAll("[data-umode]").forEach(function(b){var on=b.dataset.umode===UM;b.classList.toggle("on",on);b.setAttribute("aria-selected",on?"true":"false")});
  if(!db()||!me()){if(db()&&!window.FL_KNOWN){if(!box.dataset.loaded)box.innerHTML=skel(3);return}box.innerHTML=note("Sign in to see updates from people.");ppl.innerHTML="";st.innerHTML="";return}
  STAMP.upd=Date.now();
  if(!box.dataset.loaded)box.innerHTML=snapGet("upd-"+UM)||skel(3);
  var uid=me().id,mode=UM;
  function postsQ(ids){var q=db().from("posts").select("*").order("created_at",{ascending:false}).limit(40);return ids?q.in("user_id",ids):q}
  function actsQ(ids){var q=db().from("activities").select("*").order("created_at",{ascending:false}).limit(25);return ids?q.in("user_id",ids):q}
  var first=[db().from("follows").select("following_id").eq("follower_id",uid),db().from("follows").select("follower_id",{count:"exact",head:true}).eq("following_id",uid)];
  if(mode==="all"){first.push(postsQ(null));first.push(actsQ(null))}
  Promise.all(first).then(function(a){
    if(mode!==UM)return;
    var f=a[0],fc=a[1];following={};(f.data||[]).forEach(function(x){following[x.following_id]=1});
    var ids=Object.keys(following);
    st.innerHTML='<span><b>'+ids.length+'</b> Following</span><span><b>'+((fc&&fc.count)||0)+'</b> Followers</span>';
    if(mode==="following"){
      if(!ids.length){ppl.innerHTML="";box.innerHTML=note("You are not following anyone yet. Tap Follow on a post under Everyone and their updates will show here.");box.dataset.loaded="1";return}
      return Promise.all([postsQ(ids),actsQ(ids)]).then(function(b){if(mode===UM)render(b[0],b[1],ids)})}
    render(a[2],a[3],ids)},function(){box.dataset.loaded="1"});
  function render(r,ar,ids){
    if(r.error){box.innerHTML=note("Updates are not set up yet. Run the posts SQL in Supabase first.");return}
    var rows=(r.data||[]).filter(function(p){return !blocked(p.user_id)});
    var acts=(ar&&!ar.error?ar.data||[]:[]).filter(function(a){return !blocked(a.user_id)});
    var names={};
    if(mode==="following"){rows.forEach(function(p){if(!names[p.user_id])names[p.user_id]=p.author_name});acts.forEach(function(a){if(!names[a.user_id])names[a.user_id]=a.actor_name})}
    var items=rows.map(function(p){return{k:"p",d:p,t:p.created_at}}).concat(acts.map(function(a){return{k:"a",d:a,t:a.created_at}}));
    items.sort(function(x,y){return new Date(y.t)-new Date(x.t)});items=items.slice(0,45);
    var extra=(mode==="following"?ids:[]).concat(acts.map(function(a){return a.user_id}));
    enrich(rows,function(){
      if(mode!==UM)return;
      ppl.innerHTML=mode==="following"?'<div class="hx-sec" style="margin:6px 0 8px"><h2 style="font-size:15px">People you follow</h2></div><div class="hx-chips">'+ids.map(function(i){var n=names[i]||"Member";return '<div class="chip"><span class="av" style="background:'+col(i)+'">'+avInner(i,n)+'</span><b>'+esc(n)+'</b><button type="button" class="fol on" data-follow="'+esc(i)+'">Following</button></div>'}).join("")+'</div>':"";
      box.innerHTML=items.length?items.map(function(it){return it.k==="p"?postHTML(it.d,uid):actHTML(it.d)}).join(""):note(mode==="following"?"The people you follow have not posted yet.":"No updates yet. Be the first to share one.");
      box.dataset.loaded="1";snapSet("upd-"+mode,box.innerHTML);
      showFocus(uid)},extra)}
}
function showFocus(uid){
  if(!FOCUS)return;var id=FOCUS;
  db().from("posts").select("*").eq("id",id).then(function(r){
    var p=r.data&&r.data[0];var box=$("hx-updates-feed");if(!p||blocked(p.user_id)||!box){toast("That post is no longer available.");return}
    enrich([p],function(){
      var old=$("hx-shared");if(old)old.parentNode.removeChild(old);
      box.insertAdjacentHTML("afterbegin",'<div class="hx-shared" id="hx-shared"><div class="lbl">Shared with you</div>'+postHTML(p,uid)+'</div>');
      var el=$("hx-shared");if(el&&el.scrollIntoView)el.scrollIntoView({block:"start"})},[],true)})}

/* ---------- EVENTS ---------- */
function loadEvents(){
  var box=$("hx-ev-list");if(!box)return;
  if(!db()||!me()){box.innerHTML=note(NEED);return}
  var from=new Date(Date.now()-36e5).toISOString();
  db().from("events").select("*").gte("starts_at",from).order("starts_at",{ascending:true}).limit(30).then(function(r){
    if(r.error){box.innerHTML=note("Events are not set up yet. Run the events SQL in Supabase first.");return}
    var list=r.data||[];if(!list.length){box.innerHTML=note("No upcoming events yet. Tap Create Event to add the first one.");return}
    var ids=list.map(function(e){return e.id});
    db().from("event_rsvps").select("event_id,user_id").in("event_id",ids).then(function(g){
      var cnt={},mine={},uid=me().id;(g.data||[]).forEach(function(x){cnt[x.event_id]=(cnt[x.event_id]||0)+1;if(x.user_id===uid)mine[x.event_id]=1});
      box.innerHTML=list.map(function(e){
        var d=new Date(e.starts_at),on=!!mine[e.id],n=cnt[e.id]||0,own=e.created_by===uid;
        return '<article class="hx-ev" data-eid="'+esc(e.id)+'"><div class="date"><b>'+d.getDate()+'</b><span>'+esc(d.toLocaleString([],{month:"short"}))+'</span></div><div class="tx"><h3>'+esc(e.title)+'</h3><small>'+esc(when(e.starts_at))+(e.location?" &middot; "+esc(e.location):"")+'</small>'+(e.description?'<p>'+esc(e.description)+'</p>':"")+'<div class="act"><button type="button" class="rsvp'+(on?" on":"")+'" data-rsvp="'+esc(e.id)+'">'+(on?"Going":"I\u2019m going")+'</button><span>'+n+' going</span>'+(own?'<button type="button" class="del" data-evdel="'+esc(e.id)+'">Delete</button>':"")+'</div></div></article>'}).join("")})})
}
function toggleRsvp(btn){
  var id=btn.dataset.rsvp,on=btn.classList.contains("on"),uid=me()&&me().id;if(!uid||btn.dataset.busy)return;btn.dataset.busy=1;
  var q=on?db().from("event_rsvps").delete().eq("event_id",id).eq("user_id",uid):db().from("event_rsvps").insert({event_id:id,user_id:uid});
  q.then(function(r){delete btn.dataset.busy;if(r.error){alert("Could not update. Please try again.");return}
    if(!on){var h=btn.closest(".hx-ev"),t=h&&h.querySelector("h3");logAct("rsvp","is going to "+(t?t.textContent:"an event"),id)}loadEvents()})
}
function createEvent(){
  var m=$("ne-msg"),t=$("ne-title").value.trim(),w=$("ne-when").value;m.textContent="";
  if(!db()||!me()){m.textContent="Please sign in to create events.";return}
  if(t.length<2){m.textContent="Give your event a name.";return}
  if(!w){m.textContent="Choose a date and time.";return}
  var btn=$("ne-btn");btn.disabled=true;
  db().from("events").insert({title:t,description:$("ne-desc").value.trim()||null,location:$("ne-where").value.trim()||null,starts_at:new Date(w).toISOString(),creator_name:myName()}).then(function(r){
    btn.disabled=false;if(r.error){m.textContent="Could not publish the event. Please try again.";return}
    ["ne-title","ne-when","ne-where","ne-desc"].forEach(function(i){$(i).value=""});
    logAct("event","created an event: "+t);
    window.show("explore");var tab=document.querySelector('[data-extab="events"]');if(tab)tab.click();loadEvents()})
}

/* ---------- POSTS + FOLLOWS ---------- */
var following={};
function blocked(id){return window.FLC_BLOCKED&&window.FLC_BLOCKED[id]}
var TPL=[
 {k:"prayer",l:"Prayer request",t:"Please pray for "},
 {k:"testimony",l:"Testimony",t:"God did something wonderful: "},
 {k:"verse",l:"Verse of the day",t:"Today\u2019s verse:\n\u2014 "},
 {k:"encourage",l:"Encouragement",t:"Be encouraged! "},
 {k:"thanks",l:"Gratitude",t:"I thank God for "},
 {k:"question",l:"Question",t:"I would love your thoughts: "}];
var KIND="",KL={};TPL.forEach(function(x){KL[x.k]=x.l});
function tplChips(sel){return TPL.map(function(x){return '<button type="button" class="tp k-'+x.k+(sel===x.k?" on":"")+'" data-tpl="'+x.k+'">'+esc(x.l)+'</button>'}).join("")}
function logAct(type,text,ref){
  if(!db()||!me())return;
  db().from("activities").insert({type:type,text:String(text).slice(0,160),actor_name:myName(),ref_id:ref||null}).then(function(){},function(){})}
var AICON={follow:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',rsvp:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/>',event:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'};
function actHTML(a){
  return '<article class="hx-act"><span class="ai"><svg viewBox="0 0 24 24" aria-hidden="true">'+(AICON[a.type]||AICON.event)+'</svg></span><p><b>'+esc(a.actor_name||"Member")+'</b> '+esc(a.text)+'</p><small>'+esc(ago(a.created_at))+'</small></article>'}
var S={like:{},mine:{},cm:{},off:false};
var SHARE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>';
var HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg>';
var BUBBLE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
function actions(p){
  var sh='<button type="button" class="shb" data-share="'+esc(p.id)+'" aria-label="Share post">'+SHARE+'</button>';
  if(S.off)return '<div class="pf">'+sh+'</div>';
  var on=S.mine[p.id],l=S.like[p.id]||0,c=S.cm[p.id]||0;
  return '<div class="pf"><button type="button" class="lk'+(on?" on":"")+'" data-like="'+esc(p.id)+'" aria-pressed="'+(on?"true":"false")+'" aria-label="Like">'+HEART+'<span>'+l+'</span>'+(p.kind==="prayer"?'<em>Praying</em>':"")+'</button><button type="button" class="cmb" data-cm="'+esc(p.id)+'" data-owner="'+esc(p.user_id)+'" aria-label="Comments">'+BUBBLE+'<span>'+c+'</span></button>'+sh+'</div><div class="cmbox" id="cm-'+esc(p.id)+'" hidden></div>'}
function enrich(rows,done0,extra,keep){
  var ids=rows.map(function(p){return p.id});if(!keep){S.like={};S.mine={};S.cm={};S.off=false}
  var avP=new Promise(function(res){loadAvatars(rows.map(function(p){return p.user_id}).concat(extra||[]),res)});
  if(!ids.length||!db()||!me()){avP.then(function(){done0()});return}
  var uid=me().id;
  Promise.all([
    db().from("post_likes").select("post_id,user_id").in("post_id",ids),
    db().from("post_comments").select("post_id,user_id").in("post_id",ids),
    avP
  ]).then(function(a){
    var l=a[0],c=a[1];
    if(l.error||c.error){S.off=true;return done0()}
    (l.data||[]).forEach(function(x){S.like[x.post_id]=(S.like[x.post_id]||0)+1;if(x.user_id===uid)S.mine[x.post_id]=1});
    (c.data||[]).forEach(function(x){if(!blocked(x.user_id))S.cm[x.post_id]=(S.cm[x.post_id]||0)+1});
    done0()},function(){S.off=true;done0()})}
function toggleLike(btn){
  var id=btn.dataset.like,uid=me()&&me().id;if(!uid||btn.dataset.busy)return;btn.dataset.busy=1;
  var on=btn.classList.contains("on"),n=(S.like[id]||0)+(on?-1:1);
  btn.classList.toggle("on",!on);btn.setAttribute("aria-pressed",on?"false":"true");btn.querySelector("span").textContent=n;S.like[id]=n;S.mine[id]=on?0:1;
  var q=on?db().from("post_likes").delete().eq("post_id",id).eq("user_id",uid):db().from("post_likes").insert({post_id:id,user_id:uid});
  q.then(function(r){delete btn.dataset.busy;if(r.error){btn.classList.toggle("on",on);S.like[id]=n+(on?1:-1);btn.querySelector("span").textContent=S.like[id];S.mine[id]=on?1:0}})}
function loadComments(id,owner){
  var box=$("cm-"+id);if(!box)return;
  box.innerHTML='<div class="cmrow note">Loading...</div>';
  db().from("post_comments").select("*").eq("post_id",id).order("created_at",{ascending:true}).limit(100).then(function(r){
    var uid=me().id,rows=(r.data||[]).filter(function(c){return !blocked(c.user_id)});
    loadAvatars(rows.map(function(c){return c.user_id}),function(){
    box.innerHTML=(r.error?'<div class="cmrow note">Comments could not load.</div>':rows.length?rows.map(function(c){
      return '<div class="cmrow"><span class="av sm" style="background:'+col(c.user_id)+'">'+avInner(c.user_id,c.author_name)+'</span><div class="cb"><b>'+esc(c.author_name||"Member")+'</b> <small>'+esc(ago(c.created_at))+'</small>'+((c.user_id===uid||owner===uid)?'<button type="button" class="cmdel" data-cmdel="'+esc(c.id)+'" data-post="'+esc(id)+'" data-owner="'+esc(owner)+'">Delete</button>':'')+'<p>'+esc(c.body)+'</p></div></div>'}).join(""):'<div class="cmrow note">No comments yet.</div>')+
      '<div class="cmform"><textarea rows="2" placeholder="Write a comment..." aria-label="Write a comment"></textarea><button type="button" data-cmsend="'+esc(id)+'" data-owner="'+esc(owner)+'">Send</button></div>'})})}
function sendComment(btn){
  var id=btn.dataset.cmsend,inp=btn.parentNode.querySelector("textarea"),t=inp.value.trim();
  if(!t||btn.disabled)return;btn.disabled=true;
  db().from("post_comments").insert({post_id:id,body:t,author_name:myName()}).then(function(r){
    btn.disabled=false;if(r.error){alert("Could not post your comment. Please try again.");return}
    S.cm[id]=(S.cm[id]||0)+1;var c=document.querySelector('[data-cm="'+id+'"] span');if(c)c.textContent=S.cm[id];loadComments(id,btn.dataset.owner)})}
function bodyHTML(p){
  var b=p.body||"",long=b.length>320||(b.match(/\n/g)||[]).length>5;
  return b?'<p class="pb'+(long?" clamp":"")+'">'+esc(b)+'</p>'+(long?'<button type="button" class="more" data-more aria-expanded="false">Read more</button>':""):""}
function imgsHTML(p){
  var u=(p.image_urls||[]).map(safeUrl).filter(Boolean).slice(0,4);if(!u.length)return "";
  return '<div class="hx-imgs n'+u.length+'">'+u.map(function(x,i){return '<button type="button" class="ph" data-ph="'+esc(x)+'" aria-label="View photo '+(i+1)+' of '+u.length+'"><img src="'+esc(x)+'" alt="Photo shared by '+esc(p.author_name||"a member")+'" loading="lazy" decoding="async"></button>'}).join("")+'</div>'}
function postHTML(p,uid,opts){
  var mine=p.user_id===uid;
  return '<article class="hx-post" data-imgs="'+esc(JSON.stringify(p.image_urls||[]))+'" data-vids="'+esc(JSON.stringify([p.video_url||"",p.video_poster||""]))+'"><span class="av" style="background:'+col(p.user_id)+'">'+avInner(p.user_id,p.author_name)+'</span><div class="tx"><div class="hd"><b>'+esc(p.author_name||"Member")+'</b><small>'+esc(ago(p.created_at))+'</small>'+
   (mine?(opts&&opts.del?'<button type="button" class="fol" data-postdel="'+esc(p.id)+'">Delete</button>':""):'<button type="button" class="fol'+(following[p.user_id]?" on":"")+'" data-follow="'+esc(p.user_id)+'">'+(following[p.user_id]?"Following":"Follow")+'</button>')+
   '</div>'+(p.kind&&KL[p.kind]?'<span class="kd k-'+esc(p.kind)+'">'+esc(KL[p.kind])+'</span>':"")+bodyHTML(p)+imgsHTML(p)+vidHTML(p)+actions(p)+'</div></article>'}
function loadFeed(){
  var box=$("hx-feed");if(!box)return;
  if(!db()||!me()){if(db()&&!window.FL_KNOWN){if(!box.dataset.loaded)box.innerHTML=skel(3);return}box.innerHTML=note("Sign in to see updates from the community.");return}
  STAMP.feed=Date.now();
  if(!box.dataset.loaded)box.innerHTML=snapGet("feed")||skel(3);
  var uid=me().id;
  Promise.all([
    db().from("follows").select("following_id").eq("follower_id",uid),
    db().from("posts").select("*").order("created_at",{ascending:false}).limit(15)
  ]).then(function(a){
    var f=a[0],r=a[1];following={};(f.data||[]).forEach(function(x){following[x.following_id]=1});
    if(r.error){box.innerHTML=note("Community updates are not set up yet. Run the posts SQL in Supabase first.");return}
    var rows=(r.data||[]).filter(function(p){return !blocked(p.user_id)});
    enrich(rows,function(){
      box.innerHTML=rows.length?rows.map(function(p){return postHTML(p,uid)}).join(""):note("No updates yet. Be the first to share one.");
      box.dataset.loaded="1";snapSet("feed",box.innerHTML)})},function(){box.dataset.loaded="1"})
}
function loadMyPosts(){
  var box=$("hx-myposts");if(!box)return;
  if(!db()||!me()){box.innerHTML=note(NEED);return}
  db().from("posts").select("*").eq("user_id",me().id).order("created_at",{ascending:false}).limit(50).then(function(r){
    if(r.error){box.innerHTML=note("Posts are not set up yet.");return}
    var rows=r.data||[];enrich(rows,function(){box.innerHTML=rows.length?rows.map(function(p){return postHTML(p,me().id,{del:true})}).join(""):note("You have not posted yet. Share an update from Home.")})})
}
function setStat(label,val){
  document.querySelectorAll("#profile div").forEach(function(d){
    if(d.children.length===0&&d.textContent.trim()===label.old){d.textContent=label.neu;var n=d.previousElementSibling;if(n&&val!=null)n.textContent=val}})
}
function loadStats(){
  setStat({old:"Prayers",neu:"Posts"},null);setStat({old:"Day streak",neu:"Followers"},null);
  if(!db()||!me())return;var uid=me().id;
  db().from("posts").select("id",{count:"exact",head:true}).eq("user_id",uid).then(function(r){if(r.error)return;setStat({old:"Posts",neu:"Posts"},r.count||0)});
  db().from("follows").select("follower_id",{count:"exact",head:true}).eq("following_id",uid).then(function(r){if(r.error)return;setStat({old:"Followers",neu:"Followers"},r.count||0)})
}
function toggleFollow(btn){
  var id=btn.dataset.follow,uid=me()&&me().id;if(!uid||btn.dataset.busy)return;btn.dataset.busy=1;
  var on=!!following[id];
  var q=on?db().from("follows").delete().eq("follower_id",uid).eq("following_id",id):db().from("follows").insert({follower_id:uid,following_id:id});
  q.then(function(r){delete btn.dataset.busy;if(r.error)return;if(on)delete following[id];else{following[id]=1;var nb=btn.closest(".chip")||btn.closest(".hx-post"),nm=nb&&nb.querySelector("b");logAct("follow","started following "+(nm?nm.textContent:"someone"),id)}
    document.querySelectorAll('[data-follow="'+id+'"]').forEach(function(b){b.classList.toggle("on",!on);b.textContent=on?"Follow":"Following"})})
}
function createPost(){
  var m=$("np-msg"),t=$("np-text").value.trim();m.className="hx-msg";m.textContent="";
  if(!db()||!me()){m.textContent="Please sign in to post.";return}
  if(!t&&!PH.length&&!VID){m.textContent="Write something, or add a photo or video.";return}
  var btn=$("np-btn");btn.disabled=true;
  function fail(msg){btn.disabled=false;m.className="hx-msg";m.textContent=msg}
  function save(urls,vurl,purl){
    var row={body:t,author_name:myName()};if(KIND)row.kind=KIND;if(urls.length)row.image_urls=urls;if(vurl){row.video_url=vurl;if(purl)row.video_poster=purl}
    function fin(r){
      if(r.error)return fail(vurl?"Could not post the video. Run the video SQL in Supabase, then try again.":urls.length?"Could not post. Run the photo SQL in Supabase, then try again.":"Could not post. Please try again.");
      PH.forEach(function(p){URL.revokeObjectURL(p.url)});PH=[];renderPH();if(VID){URL.revokeObjectURL(VID.url);VID=null;renderVID()}
      m.textContent="";btn.disabled=false;$("np-text").value="";$("np-n").textContent="0";KIND="";STAMP={};$("np-tpls").innerHTML=tplChips("");var ub=$("hx-updates-feed");if(ub)ub.dataset.loaded="";window.show("updates");loadUpdates()}
    db().from("posts").insert(row).then(function(r){
      if(r.error&&row.kind){delete row.kind;return db().from("posts").insert(row).then(fin)}
      fin(r)})}
  if(VID)return uploadVid(function(err,vurl,purl){if(err)return fail("Video upload failed. Check the video SQL ran in Supabase and the file is under 50 MB, then try again.");save([],vurl,purl)});
  if(!PH.length)return save([]);
  uploadPhotos(function(err,urls){if(err)return fail("Photo upload failed. Run the photo SQL in Supabase, then try again.");save(urls)})
}
function sharePost(b){
  var a=b.closest(".hx-post"),id=b.dataset.share,nm=a&&a.querySelector(".hd b"),pb=a&&a.querySelector(".pb"),tx=pb?pb.textContent:"";
  var txt=(nm?nm.textContent:"A member")+" on Chen Network: "+(tx?tx.slice(0,180)+(tx.length>180?"\u2026":""):(a&&a.querySelector("video")?"shared a video":"shared a photo"));
  var url=location.href.split("#")[0].split("?")[0]+"#post-"+id;
  if(navigator.share){navigator.share({title:"Chen Network",text:txt,url:url}).catch(function(){})}
  else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){toast("Link copied")},function(){window.prompt("Copy this link",url)})}
  else window.prompt("Copy this link",url)}
function setAvatar(file){
  var u=me();if(!u||!db())return;
  shrink(file,480,true,function(bl){
    if(!bl){toast("That photo could not be read.");return}
    var path=u.id+"/avatar.jpg";toast("Uploading photo...");
    db().storage.from("avatars").upload(path,bl,{contentType:"image/jpeg",upsert:true,cacheControl:"31536000"}).then(function(r){
      if(r.error){toast("Upload failed. Run the photo SQL in Supabase first.");return}
      var url=db().storage.from("avatars").getPublicUrl(path).data.publicUrl+"?v="+Date.now();
      db().from("member_avatars").upsert({user_id:u.id,avatar_url:url,updated_at:new Date().toISOString()},{onConflict:"user_id"}).then(function(q){
        if(q.error){toast("Could not save your photo.");return}
        AV[u.id]=url;applyMine();toast("Profile photo updated")})})})}
function removeAvatar(){
  var u=me();if(!u||!db())return;
  db().from("member_avatars").delete().eq("user_id",u.id).then(function(){db().storage.from("avatars").remove([u.id+"/avatar.jpg"]);AV[u.id]="";applyMine();toast("Profile photo removed")})}

/* ---------- wiring ---------- */
document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest("[data-rsvp]")))return toggleRsvp(b);
  if((b=T.closest("[data-evdel]"))){if(confirm("Delete this event?"))db().from("events").delete().eq("id",b.dataset.evdel).then(loadEvents);return}
  if((b=T.closest("[data-tpl]"))){
    var k=b.dataset.tpl,tx=TPL.filter(function(x){return x.k===k})[0],inComposer=!!b.closest("#newpost");
    if(inComposer&&KIND===k){KIND="";$("np-tpls").innerHTML=tplChips("");return}
    var ta=$("np-text"),cur=ta?ta.value.trim():"",isTpl=!cur||TPL.some(function(x){return x.t.trim()===cur});
    KIND=k;if(!inComposer)window.show("newpost");
    ta=$("np-text");if(isTpl){ta.value=tx.t;$("np-n").textContent=ta.value.length}
    $("np-tpls").innerHTML=tplChips(k);ta.focus();try{ta.setSelectionRange(ta.value.length,ta.value.length)}catch(e){}return}
  if((b=T.closest("[data-umode]"))){UM=b.dataset.umode;var ub=$("hx-updates-feed");if(ub)ub.dataset.loaded="";return loadUpdates()}
  if((b=T.closest("[data-follow]"))){toggleFollow(b);if(visible("updates"))setTimeout(loadUpdates,600);return}
  if((b=T.closest("[data-share]")))return sharePost(b);
  if((b=T.closest("[data-ph]")))return lightbox(b.dataset.ph);
  if(T.closest("#hx-lb")){closeLb();return}
  if((b=T.closest("[data-more]"))){var pp=b.previousElementSibling,on=pp.classList.toggle("clamp");b.textContent=on?"Read more":"Show less";b.setAttribute("aria-expanded",on?"false":"true");return}
  if((b=T.closest("[data-phrm]"))){var ph=PH.splice(+b.dataset.phrm,1)[0];if(ph)URL.revokeObjectURL(ph.url);renderPH();return}
  if(T.closest("#np-add")){$("np-file").click();return}
  if(T.closest("#np-addv")){$("np-vfile").click();return}
  if(T.closest("[data-vrm]")){if(VID){URL.revokeObjectURL(VID.url);VID=null}renderVID();renderPH();return}
  if(T.closest("#hx-av-change")||T.closest("#me-avatar")){$("av-file").click();return}
  if(T.closest("#hx-av-rm")){if(confirm("Remove your profile photo?"))removeAvatar();return}
  if((b=T.closest("[data-like]")))return toggleLike(b);
  if((b=T.closest("[data-cm]"))){var bx=$("cm-"+b.dataset.cm);if(bx){bx.hidden=!bx.hidden;if(!bx.hidden)loadComments(b.dataset.cm,b.dataset.owner)}return}
  if((b=T.closest("[data-cmsend]")))return sendComment(b);
  if((b=T.closest("[data-cmdel]"))){if(confirm("Delete this comment?"))db().from("post_comments").delete().eq("id",b.dataset.cmdel).then(function(){var id=b.dataset.post,c=document.querySelector('[data-cm="'+id+'"] span');if(c)c.textContent=Math.max(0,(S.cm[id]||1)-1),S.cm[id]=Math.max(0,(S.cm[id]||1)-1);loadComments(id,b.dataset.owner)});return}
  if((b=T.closest("[data-postdel]"))){
    if(confirm("Delete this post?")){var art=b.closest(".hx-post"),paths=[];
      var vpaths=[];
      try{JSON.parse(art.dataset.imgs||"[]").forEach(function(u){var i=u.indexOf("/post-images/");if(i>-1)paths.push(decodeURIComponent(u.slice(i+13)))})}catch(e){}
      try{JSON.parse(art.dataset.vids||"[]").forEach(function(u){var i=u.indexOf("/post-videos/"),k=u.indexOf("/post-images/");if(i>-1)vpaths.push(decodeURIComponent(u.slice(i+13)));else if(k>-1)paths.push(decodeURIComponent(u.slice(k+13)))})}catch(e){}
      db().from("posts").delete().eq("id",b.dataset.postdel).then(function(r){if(!r.error&&paths.length)db().storage.from("post-images").remove(paths);if(!r.error&&vpaths.length)db().storage.from("post-videos").remove(vpaths);loadMyPosts();loadStats()})}
    return}
  if(T.closest("#ne-btn"))return createEvent();
  if(T.closest("#np-btn"))return createPost();
  if(T.closest('[data-extab="events"]'))setTimeout(loadEvents,30)
});
document.addEventListener("keydown",function(e){
  if(e.key==="Escape")closeLb();
  if((e.key==="Enter"||e.key===" ")&&e.target.id==="me-avatar"){e.preventDefault();$("av-file").click()}});
document.addEventListener("play",function(e){if(e.target&&e.target.tagName==="VIDEO")document.querySelectorAll(".hx-vid video").forEach(function(v){if(v!==e.target)v.pause()})},true);
document.addEventListener("change",function(e){
  var T=e.target;
  if(T.id==="np-file"){var fs=Array.prototype.slice.call(T.files||[]).slice(0,4-PH.length);T.value="";var pend=fs.length;if(!pend)return;
    fs.forEach(function(f){shrink(f,1600,false,function(bl){if(bl)PH.push({blob:bl,url:URL.createObjectURL(bl)});else toast("One photo could not be read.");if(--pend===0)renderPH()})})}
  if(T.id==="np-vfile"){var vf=T.files&&T.files[0];T.value="";if(!vf)return;
    if(String(vf.type).indexOf("video/")!==0){toast("Please choose a video file.");return}
    if(vf.size>MAXV){toast("That video is "+(vf.size/1048576).toFixed(0)+" MB. The limit is 50 MB. Trim it and try again.");return}
    VID={file:vf,url:URL.createObjectURL(vf),poster:null};renderVID();renderPH();makePoster(vf,function(b){if(VID&&VID.file===vf)VID.poster=b})}
  if(T.id==="av-file"){var f=T.files&&T.files[0];T.value="";if(f)setAvatar(f)}});
document.addEventListener("input",function(e){if(e.target.id==="np-text")$("np-n").textContent=e.target.value.length});

function openFromPush(o){
  o=String(o||"");
  if(o.indexOf("post:")===0&&/^[0-9a-f-]{36}$/i.test(o.slice(5))){FOCUS=o.slice(5);window.show("updates");loadUpdates()}
  else if(o==="tab:updates"){window.show("updates");loadUpdates()}
  else if(o==="tab:explore"){window.show("explore")}}
if(navigator.serviceWorker)navigator.serviceWorker.addEventListener("message",function(e){if(e.data&&e.data.open)openFromPush(e.data.open)});
(function(){var m=(location.search.match(/[?&]open=([^&]+)/)||[])[1];if(m){try{m=decodeURIComponent(m)}catch(x){m=""}
  if(m.indexOf("post:")===0&&/^[0-9a-f-]{36}$/i.test(m.slice(5)))HASHID=m.slice(5)}})();
function checkHash(){
  if(!HASHID||!me())return;FOCUS=HASHID;HASHID="";try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  setTimeout(function(){window.show("updates");loadUpdates()},900)}
var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){
  if(!visible("updates"))FOCUS="";
  loadMine();applyMine();checkHash();
  if(visible("home")&&!fresh("feed",25000))loadFeed();
  if(visible("updates")&&!fresh("upd",25000))loadUpdates();
  if(visible("profile")&&!fresh("stats",25000)){STAMP.stats=Date.now();loadStats()}
  if(visible("myposts")&&!fresh("my",25000)){STAMP.my=Date.now();loadMyPosts()}
  if(visible("explore")&&!$("hx-ex-events").hidden&&!fresh("ev",25000)){STAMP.ev=Date.now();loadEvents()}},25)}
document.addEventListener("visibilitychange",function(){if(!document.hidden){STAMP={};soon()}});
document.addEventListener("click",function(e){if(e.target.closest&&e.target.closest("#sign-out")){try{Object.keys(localStorage).filter(function(k){return k.indexOf("fl-snap-")===0}).forEach(function(k){localStorage.removeItem(k)})}catch(x){}}},true);
function init(){build();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);STAMP={};soon()};
  var pv=setInterval(function(){if(me()){loadMine();checkHash()}},800);setTimeout(function(){clearInterval(pv)},180000);
  if(window.MutationObserver)new MutationObserver(function(ms){if(ms.some(function(m){return m.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
