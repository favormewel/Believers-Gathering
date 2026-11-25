(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function visible(id){var s=$(id);return !!s&&!s.hidden}
function toast(m){var t=$("hx-toast");if(!t){t=document.createElement("div");t.id="hx-toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");document.body.appendChild(t)}
  t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove("on")},3200)}
function ini(n){return (n||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase()}
function ago(d){var s=(Date.now()-new Date(d))/1000;if(s<60)return "just now";if(s<3600)return Math.floor(s/60)+" min ago";if(s<86400)return Math.floor(s/3600)+" hr ago";return Math.floor(s/86400)+" d ago"}
function safeUrl(u){var b=((window.FAITHLINK_CONFIG||{}).SUPABASE_URL||"").replace(/\/$/,"")+"/storage/v1/object/public/";return(typeof u==="string"&&b.length>40&&u.indexOf(b)===0)?u:""}
var BACK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>';
function sec(id,title,back,body){
  var s=document.createElement("section");s.id=id;s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="'+back+'">'+BACK+'</button><h1 style="font-size:20px">'+esc(title)+'</h1></div></header><div class="hx-scroll" data-scroll>'+body+'</div></div>';
  $("app").appendChild(s)}
var ST={};
function myName(){var u=me();return (u&&u.user_metadata&&u.user_metadata.full_name)||(u&&u.email&&u.email.split("@")[0])||"Member"}

/* ============ SAVED POSTS ============ */
var SV={};
function svKey(){var u=me();return u?"fl-sv-"+u.id:""}
window.CHEN_SAVED=function(id){return !!SV[id]};
function paintSave(){document.querySelectorAll("[data-save]").forEach(function(b){var on=!!SV[b.dataset.save];b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false")})}
function storeSv(){try{localStorage.setItem(svKey(),JSON.stringify(Object.keys(SV)))}catch(e){}}
function loadSavedIds(){
  if(!db()||!me())return;ST.sv=Date.now();
  try{(JSON.parse(localStorage.getItem(svKey())||"[]")||[]).forEach(function(i){SV[i]=1})}catch(e){}paintSave();
  db().from("saved_posts").select("post_id").limit(500).then(function(r){if(r.error)return;SV={};(r.data||[]).forEach(function(x){SV[x.post_id]=1});storeSv();paintSave()},function(){})}
function toggleSave(btn){
  var id=btn.dataset.save,u=me();if(!u||!db()||btn.dataset.busy)return;btn.dataset.busy=1;
  var on=!!SV[id];if(on)delete SV[id];else SV[id]=1;storeSv();paintSave();
  var q=on?db().from("saved_posts").delete().eq("user_id",u.id).eq("post_id",id):db().from("saved_posts").insert({post_id:id});
  q.then(function(r){delete btn.dataset.busy;
    if(r.error){if(on)SV[id]=1;else delete SV[id];storeSv();paintSave();toast("Could not save. Run the saved posts SQL in Supabase first.");return}
    toast(on?"Removed from saved":"Saved");
    if(on&&visible("saved")){var a=btn.closest(".hx-post");if(a)a.remove();var l=$("sv-list");if(l&&!l.querySelector(".hx-post"))l.innerHTML='<div class="hx-empty">Nothing saved yet. Tap the bookmark on a post to keep it here.</div>'}},function(){delete btn.dataset.busy})}
function loadSavedScreen(){
  var box=$("sv-list");if(!box)return;ST.svs=Date.now();
  if(!db()||!me()){box.innerHTML='<div class="hx-empty">Sign in to see your saved posts.</div>';return}
  if(!box.dataset.loaded)box.innerHTML='<div class="hx-skel"><i class="a"></i><div><i class="l1"></i><i class="l2"></i><i class="l3"></i></div></div>';
  db().rpc("saved_feed",{p_limit:50}).then(function(r){
    if(r.error||!r.data||r.data.error){box.innerHTML='<div class="hx-empty">Saved posts are not set up yet. Run the saved posts SQL in Supabase first.</div>';return}
    var h=window.CHEN_POSTS_HTML?window.CHEN_POSTS_HTML(r.data):"";
    (r.data.posts||[]).forEach(function(p){SV[p.id]=1});storeSv();
    box.innerHTML=h||'<div class="hx-empty">Nothing saved yet. Tap the bookmark on a post to keep it here.</div>';box.dataset.loaded="1";paintSave()},function(){box.innerHTML='<div class="hx-empty">Could not load. Please try again.</div>'})}

/* ============ STORIES ============ */
var BGS={brand:"linear-gradient(135deg,#3B13AA,#6544D8,#1D0A5E)",sunrise:"linear-gradient(135deg,#FF9A3C,#E0457B,#4B2A8A)",night:"linear-gradient(135deg,#0B1026,#1C2348,#2B1F5C)",gold:"linear-gradient(135deg,#F2B22E,#E8730C)",forest:"linear-gradient(135deg,#1F6B4F,#0E3B2C)",sky:"linear-gradient(135deg,#6EC1FF,#2F6DE0)"};
var STG=[],STAV={},SX={g:0,s:0,t:0,paused:false,raf:0,last:0,hold:0};
var DUR=5000;
function stKey(){var u=me();return u?"fl-st-"+u.id:""}
function avt(uid,name,cls){var u=safeUrl(STAV[uid]);return '<span class="av'+(cls?" "+cls:"")+'" style="background:#6544D8">'+(u?'<img src="'+esc(u)+'" alt="" decoding="async">':esc(ini(name)))+'</span>'}
function storyUrl(path){try{return safeUrl(db().storage.from("story-images").getPublicUrl(path).data.publicUrl)}catch(e){return ""}}
function barEl(){
  var home=$("home"),sc=home&&home.querySelector(".hx-scroll");if(!sc)return null;
  var el=$("st-bar");if(!el){el=document.createElement("div");el.id="st-bar";el.className="st-bar";var hero=sc.querySelector(".hx-hero");if(hero)sc.insertBefore(el,hero);else sc.insertBefore(el,sc.firstChild)}
  return el}
function renderBar(){
  var el=barEl();if(!el)return;
  if(!db()||!me()){el.innerHTML="";return}
  var mine=STG.filter(function(g){return g.is_me})[0],others=STG.filter(function(g){return !g.is_me}),nm=myName();
  var h='<button type="button" class="st-i" '+(mine?'data-sti="me"':'data-go="newstory"')+' aria-label="'+(mine?"Your story":"Add to your story")+'"><span class="st-ring '+(mine?(mine.has_unseen?"unseen":"seen"):"add")+'">'+avt(me().id,nm)+'</span><span class="nm">Your story</span></button>';
  if(mine)h=h.replace('</button>','<span class="st-plus" data-go="newstory" role="button" aria-label="Add another story">+</span></button>');
  if(!mine)h=h.replace('</span><span class="nm">','<span class="st-plus" aria-hidden="true">+</span></span><span class="nm">');
  others.forEach(function(g){var i=STG.indexOf(g);h+='<button type="button" class="st-i" data-sti="'+i+'" aria-label="'+esc(g.author_name||"Member")+(g.has_unseen?", new story":", seen")+'"><span class="st-ring '+(g.has_unseen?"unseen":"seen")+'">'+avt(g.user_id,g.author_name)+'</span><span class="nm">'+esc((g.author_name||"Member").split(/\s+/)[0])+'</span></button>'});
  el.innerHTML=h;el.hidden=false}
function loadStories(){
  if(!db()||!me())return;ST.st=Date.now();
  if(!STG.length){try{var c=JSON.parse(localStorage.getItem(stKey())||"null");if(c){STG=c.groups||[];STAV=c.avatars||{};renderBar()}}catch(e){}}
  db().rpc("active_stories").then(function(r){
    if(r.error||!r.data){if(r.error&&/function|schema cache|could not find/i.test(r.error.message||""))renderBar();return}
    STG=r.data.groups||[];STAV=r.data.avatars||{};
    try{localStorage.setItem(stKey(),JSON.stringify({groups:STG,avatars:STAV}))}catch(e){}
    renderBar();cleanupMine()},function(){})}
function cleanupMine(){
  if(ST.clean||!db()||!me()||!db().from)return;ST.clean=1;
  var q=db().from("stories").select("id,image_path").eq("user_id",me().id);
  if(!q.lt)return;
  q.lt("expires_at",new Date().toISOString()).limit(20).then(function(r){
    var rows=r&&r.data;if(!rows||!rows.length)return;
    var paths=rows.map(function(x){return x.image_path}).filter(Boolean);
    if(paths.length)db().storage.from("story-images").remove(paths);
    db().from("stories").delete().in("id",rows.map(function(x){return x.id})).then(function(){},function(){})},function(){})}

/* ---- viewer ---- */
function viewerEl(){
  var v=$("st-view");if(v)return v;
  v=document.createElement("div");v.id="st-view";v.setAttribute("role","dialog");v.setAttribute("aria-modal","true");v.setAttribute("aria-label","Story");
  v.innerHTML='<div class="sv-top"><div class="sv-segs" id="sv-segs"></div><div class="sv-hd"><span id="sv-av"></span><span class="who"><b id="sv-name"></b><small id="sv-time"></small></span><button type="button" id="sv-pause" aria-label="Pause">&#10074;&#10074;</button><button type="button" id="sv-x" aria-label="Close story">&times;</button></div></div><div class="sv-body" id="sv-body"></div><div class="sv-foot" id="sv-foot"></div>';
  document.body.appendChild(v);return v}
function curStory(){var g=STG[SX.g];return g&&g.stories[SX.s]}
function openStory(gi,si){
  var g=STG[gi];if(!g||!g.stories.length)return;
  SX.g=gi;SX.s=si==null?Math.max(0,g.stories.findIndex(function(s){return !s.viewed})):si;if(SX.s<0)SX.s=0;
  viewerEl().classList.add("on");document.body.classList.add("st-lock");showStory()}
function showStory(){
  var g=STG[SX.g],s=curStory();if(!g||!s)return closeStory();
  var v=viewerEl();SX.t=0;SX.last=0;SX.paused=false;$("sv-pause").innerHTML="&#10074;&#10074;";$("sv-pause").setAttribute("aria-label","Pause");
  $("sv-segs").innerHTML=g.stories.map(function(x,i){return '<i><b style="width:'+(i<SX.s?100:0)+'%"></b></i>'}).join("");
  $("sv-av").innerHTML=avt(g.user_id,g.author_name);$("sv-name").textContent=g.is_me?"Your story":(g.author_name||"Member");$("sv-time").textContent=ago(s.created_at);
  var body=$("sv-body");
  if(s.kind==="photo"){var u=storyUrl(s.image_path);body.innerHTML='<img class="sv-img" src="'+esc(u)+'" alt="Story photo by '+esc(g.author_name||"a member")+'">'+(s.body?'<div class="sv-cap">'+esc(s.body)+'</div>':"");body.style.background="#000"}
  else{var t=s.body||"";body.style.background=BGS[s.bg]||BGS.brand;body.innerHTML='<div class="sv-text" style="font-size:'+(t.length>160?"26px":t.length>80?"32px":"40px")+'">'+esc(t)+'</div>'}
  var f=$("sv-foot");
  if(g.is_me)f.innerHTML='<button type="button" id="sv-views">'+(+s.views||0)+' view'+((+s.views||0)===1?"":"s")+'</button><button type="button" id="sv-del">Delete</button>';else f.innerHTML="";
  if(!g.is_me&&!s.viewed){s.viewed=true;markViewed(s.id)}
  startTimer()}
function markViewed(id){
  if(!db()||!me())return;
  db().from("story_views").upsert({story_id:id},{onConflict:"story_id,viewer_id",ignoreDuplicates:true}).then(function(){},function(){})}
function startTimer(){cancelAnimationFrame(SX.raf);SX.last=0;
  function tick(ts){
    if(!visibleViewer())return;
    if(!SX.last)SX.last=ts;var dt=ts-SX.last;SX.last=ts;
    if(!SX.paused){SX.t+=dt;var p=Math.min(100,SX.t/DUR*100),bar=document.querySelector("#sv-segs i:nth-child("+(SX.s+1)+") b");if(bar)bar.style.width=p+"%";if(SX.t>=DUR)return nextStory()}
    SX.raf=requestAnimationFrame(tick)}
  SX.raf=requestAnimationFrame(tick)}
function visibleViewer(){var v=$("st-view");return !!v&&v.classList.contains("on")}
function nextStory(){var g=STG[SX.g];if(SX.s<g.stories.length-1){SX.s++;showStory();return}
  var n=nextGroup(1);if(n>-1){SX.g=n;SX.s=Math.max(0,STG[n].stories.findIndex(function(s){return !s.viewed}));showStory()}else closeStory()}
function prevStory(){if(SX.s>0){SX.s--;showStory();return}var n=nextGroup(-1);if(n>-1){SX.g=n;SX.s=STG[n].stories.length-1;showStory()}else showStory()}
function nextGroup(dir){var i=SX.g+dir;return i>=0&&i<STG.length?i:-1}
function closeStory(){cancelAnimationFrame(SX.raf);var v=$("st-view");if(v)v.classList.remove("on");document.body.classList.remove("st-lock");
  STG.forEach(function(g){g.has_unseen=g.stories.some(function(s){return !s.viewed})});
  try{localStorage.setItem(stKey(),JSON.stringify({groups:STG,avatars:STAV}))}catch(e){}renderBar()}
function pauseToggle(force){SX.paused=force==null?!SX.paused:force;$("sv-pause").innerHTML=SX.paused?"&#9654;":"&#10074;&#10074;";$("sv-pause").setAttribute("aria-label",SX.paused?"Play":"Pause")}
function showViewers(){
  var s=curStory();if(!s||!db())return;pauseToggle(true);
  db().rpc("story_viewers",{p_story:s.id}).then(function(r){
    var rows=r.data||[],p=$("sv-panel");if(p)p.remove();
    var el=document.createElement("div");el.id="sv-panel";el.innerHTML='<div class="vp"><button type="button" id="sv-pclose" aria-label="Close list">&times;</button><h3>Viewed by</h3>'+(rows.length?'<ul>'+rows.map(function(x){return '<li><b>'+esc(x.full_name)+'</b><small>'+esc(ago(x.viewed_at))+'</small></li>'}).join("")+'</ul>':'<p>No views yet.</p>')+'</div>';
    $("st-view").appendChild(el)},function(){toast("Could not load viewers")})}
function deleteStory(){
  var g=STG[SX.g],s=curStory();if(!g||!s||!confirm("Delete this story?"))return;
  if(s.image_path&&db())db().storage.from("story-images").remove([s.image_path]);
  db().from("stories").delete().eq("id",s.id).then(function(r){
    if(r.error){toast("Could not delete it.");return}
    g.stories.splice(SX.s,1);toast("Story deleted");
    if(!g.stories.length){STG.splice(SX.g,1);closeStory();return}
    if(SX.s>=g.stories.length)SX.s=g.stories.length-1;showStory()})}

/* ---- create ---- */
var NS={mode:"photo",bg:"brand",blob:null,url:""};
function shrink(file,max,cb){
  if(!file||String(file.type).indexOf("image/")!==0||file.size>25*1048576)return cb(null);
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){var w=img.naturalWidth,h=img.naturalHeight,s=Math.min(1,max/Math.max(w,h)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));
    var x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(function(b){cb(b)},"image/jpeg",.82)};
  img.onerror=function(){URL.revokeObjectURL(url);cb(null)};img.src=url}
function nsMode(m){
  NS.mode=m;document.querySelectorAll("[data-nsm]").forEach(function(b){var on=b.dataset.nsm===m;b.classList.toggle("on",on);b.setAttribute("aria-selected",on?"true":"false")});
  $("ns-photo").hidden=m!=="photo";$("ns-text").hidden=m!=="text"}
function nsPreview(){
  var t=$("ns-t");if(!t)return;var pv=$("ns-pv");pv.style.background=BGS[NS.bg];var v=($("ns-body").value||"").trim();pv.textContent=v||"Your words here";
  document.querySelectorAll("[data-nsb]").forEach(function(b){var on=b.dataset.nsb===NS.bg;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false")})}
function postStory(){
  var m=$("ns-msg");m.textContent="";m.className="hx-msg";
  if(!db()||!me()){m.textContent="Please sign in.";return}
  var nm=myName(),btn=$("ns-go");
  function insert(row){row.author_name=nm;db().from("stories").insert(row).then(function(r){
    btn.disabled=false;
    if(r.error){m.className="hx-msg";m.textContent=/relation|schema cache|does not exist/i.test(r.error.message||"")?"Stories are not set up yet. Run the stories SQL in Supabase.":"Could not share your story. Please try again.";return}
    resetNs();toast("Story shared. It stays for 24 hours.");ST.st=0;loadStories();window.show("home")},function(){btn.disabled=false;m.textContent="Could not share your story. Please try again."})}
  btn.disabled=true;
  if(NS.mode==="text"){var t=($("ns-body").value||"").trim();if(!t){btn.disabled=false;m.textContent="Write something first.";return}insert({kind:"text",body:t.slice(0,300),bg:NS.bg});return}
  if(!NS.blob){btn.disabled=false;m.textContent="Choose a photo first.";return}
  m.className="hx-msg ok";m.textContent="Uploading photo...";
  var path=me().id+"/"+Date.now()+".jpg";
  db().storage.from("story-images").upload(path,NS.blob,{contentType:"image/jpeg",upsert:false,cacheControl:"86400"}).then(function(r){
    if(r.error){btn.disabled=false;m.className="hx-msg";m.textContent="Photo upload failed. Run the stories SQL in Supabase, then try again.";return}
    insert({kind:"photo",image_path:path,body:($("ns-cap").value||"").trim().slice(0,200)||null})},function(){btn.disabled=false;m.className="hx-msg";m.textContent="Photo upload failed. Please try again."})}
function resetNs(){nsMode("photo");NS.blob=null;if(NS.url){URL.revokeObjectURL(NS.url);NS.url=""}$("ns-prev").innerHTML="";$("ns-cap").value="";$("ns-body").value="";$("ns-msg").textContent="";nsPreview();$("ns-pick").hidden=false}

/* ---- build + wiring ---- */
function build(){
  if(!$("app")||$("saved"))return;
  sec("saved","Saved posts","menu",'<div id="sv-list"></div>');
  var sw=Object.keys(BGS).map(function(k){return '<button type="button" class="vc-sw" data-nsb="'+k+'" aria-label="'+k+' background" aria-pressed="false" style="background:'+BGS[k]+'"></button>'}).join("");
  sec("newstory","New story","home",
    '<div class="hx-umode" id="ns-modes" role="tablist" style="margin:0 0 14px"><button type="button" class="on" role="tab" data-nsm="photo" aria-selected="true">Photo</button><button type="button" role="tab" data-nsm="text" aria-selected="false">Text</button></div>'+
    '<div id="ns-photo"><div id="ns-prev"></div><button class="hx-addph" id="ns-pick" type="button">Choose a photo</button><input type="file" id="ns-file" accept="image/*" hidden><label class="hx-f" style="margin-top:12px"><span>Caption (optional)</span><input id="ns-cap" maxlength="200" placeholder="Say something about it"></label></div>'+
    '<div id="ns-text" hidden><div class="ns-pv" id="ns-pv" aria-live="polite">Your words here</div><label class="hx-f"><span>Your words</span><textarea id="ns-body" rows="4" maxlength="300" placeholder="A verse, a thought, a prayer..."></textarea></label><div class="hx-f"><span>Background</span><div class="vc-sws" id="ns-t">'+sw+'</div></div></div>'+
    '<p class="v9-sub">Stories disappear after 24 hours. Everyone in Chen Network can see them.</p><div id="ns-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="ns-go" type="button">Share story</button>');
  nsPreview()}

document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest("[data-save]"))){toggleSave(b);return}
  if((b=T.closest("[data-sti]"))){if(T.closest("[data-go]"))return;var k=b.dataset.sti;openStory(k==="me"?STG.findIndex(function(g){return g.is_me}):+k);return}
  if(T.closest("#sv-x")){closeStory();return}
  if(T.closest("#sv-pause")){pauseToggle();return}
  if(T.closest("#sv-views")){showViewers();return}
  if(T.closest("#sv-pclose")){var p=$("sv-panel");if(p)p.remove();pauseToggle(false);return}
  if(T.closest("#sv-del")){deleteStory();return}
  if((b=T.closest("[data-nsm]"))){nsMode(b.dataset.nsm);return}
  if((b=T.closest("[data-nsb]"))){NS.bg=b.dataset.nsb;nsPreview();return}
  if(T.closest("#ns-pick")){$("ns-file").click();return}
  if(T.closest("#ns-go")){postStory();return}
});
/* tap left / right to move, press and hold to pause */
(function(){
  var down=0,held=false,tmr=null;
  document.addEventListener("pointerdown",function(e){var b=e.target.closest&&e.target.closest("#sv-body");if(!b)return;down=Date.now();held=false;clearTimeout(tmr);tmr=setTimeout(function(){held=true;pauseToggle(true)},220)});
  document.addEventListener("pointerup",function(e){var b=e.target.closest&&e.target.closest("#sv-body");clearTimeout(tmr);if(!b||!down)return;down=0;
    if(held){pauseToggle(false);return}
    var r=b.getBoundingClientRect();if(e.clientX-r.left<r.width*.33)prevStory();else nextStory()});
  document.addEventListener("pointercancel",function(){clearTimeout(tmr);if(held)pauseToggle(false);down=0})})();
document.addEventListener("keydown",function(e){if(!visibleViewer())return;if(e.key==="Escape")closeStory();if(e.key==="ArrowRight")nextStory();if(e.key==="ArrowLeft")prevStory();if(e.key===" "&&!/BUTTON|INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();pauseToggle()}});
document.addEventListener("input",function(e){if(e.target.id==="ns-body")nsPreview()});
document.addEventListener("change",function(e){
  if(e.target.id==="ns-file"){var f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;
    shrink(f,1080,function(bl){if(!bl){toast("That photo could not be read.");return}NS.blob=bl;if(NS.url)URL.revokeObjectURL(NS.url);NS.url=URL.createObjectURL(bl);$("ns-prev").innerHTML='<img class="ns-img" src="'+NS.url+'" alt="Selected photo">';$("ns-pick").textContent="Choose a different photo"})}});

var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){
  build();
  if(me()&&!ST.sv)loadSavedIds();
  if(visible("home")){renderBar();if(me()&&Date.now()-(ST.st||0)>60000)loadStories()}
  if(visible("saved")&&Date.now()-(ST.svs||0)>15000)loadSavedScreen();
  if(visible("feed")||true)paintSave()},40)}
function init(){
  build();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);if(!u){SV={};STG=[];STAV={};ST={}}soon()};
  if(window.MutationObserver){
    if($("app"))new MutationObserver(function(ms){if(ms.some(function(x){return x.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
    var pt=null;new MutationObserver(function(){clearTimeout(pt);pt=setTimeout(paintSave,120)}).observe(document.body,{childList:true,subtree:true})}
  document.addEventListener("visibilitychange",function(){if(!document.hidden){ST.st=0;soon()}});
  var pv=setInterval(function(){if(me())soon()},1500);setTimeout(function(){clearInterval(pv)},120000);
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
