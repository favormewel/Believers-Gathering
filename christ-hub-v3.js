(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML}
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
var NEED="Sign in to see this. Guests can browse groups, prayers and the Bible.";

/* ---------- screens added once ---------- */
var SVGBACK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>';
function sec(id,title,back,body){
  var s=document.createElement("section");s.id=id;s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="'+back+'">'+SVGBACK+'</button><h1 style="font-size:20px">'+title+'</h1></div></header><div class="hx-scroll" data-scroll>'+body+'</div></div>';
  $("app").appendChild(s)}
function build(){
  if($("newevent"))return;
  sec("newevent","Create Event","explore",
   '<label class="hx-f"><span>Event name</span><input id="ne-title" maxlength="120" placeholder="Sunday Worship Service"></label>'+
   '<label class="hx-f"><span>Date and time</span><input id="ne-when" type="datetime-local"></label>'+
   '<label class="hx-f"><span>Where</span><input id="ne-where" maxlength="160" placeholder="Church hall, Gulu"></label>'+
   '<label class="hx-f"><span>Details (optional)</span><textarea id="ne-desc" maxlength="600" rows="4" placeholder="What should people know?"></textarea></label>'+
   '<div id="ne-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="ne-btn" type="button">Publish Event</button>');
  sec("newpost","Share an Update","home",
   '<label class="hx-f"><span>What is on your heart?</span><textarea id="np-text" maxlength="500" rows="6" placeholder="Share a testimony, a verse, or encouragement..."></textarea></label>'+
   '<div class="hx-count"><span id="np-n">0</span>/500</div><div id="np-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="np-btn" type="button">Post</button>');
  sec("myposts","My Posts","profile",'<div id="hx-myposts"></div>');
  /* events tab content */
  var ev=$("hx-ex-events");
  if(ev)ev.innerHTML='<button class="hx-cta slim" data-go="newevent" type="button">+ Create Event</button><div id="hx-ev-list" style="margin-top:14px"></div>';
  /* community feed on Home, before Verse of the Day */
  var hs=document.querySelectorAll("#home .hx-sec"),vd=null;
  hs.forEach(function(h){if(/Verse of the Day/.test(h.textContent))vd=h});
  if(vd){var w=document.createElement("div");w.innerHTML='<div class="hx-sec"><h2>Community</h2><button data-go="newpost" type="button">Share update</button></div><div id="hx-feed"></div>';
    while(w.firstChild)vd.parentNode.insertBefore(w.firstChild,vd)}
  /* My posts row on Profile */
  var ep=document.querySelector('#profile button[data-go="editprofile"]');
  if(ep&&!$("hx-myposts-row")){var r=ep.cloneNode(true);r.id="hx-myposts-row";r.setAttribute("data-go","myposts");r.querySelector("span").textContent="My posts";ep.parentNode.insertBefore(r,ep.nextSibling)}
}

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
  q.then(function(r){delete btn.dataset.busy;if(r.error){alert("Could not update. Please try again.");return}loadEvents()})
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
    window.show("explore");var tab=document.querySelector('[data-extab="events"]');if(tab)tab.click();loadEvents()})
}

/* ---------- POSTS + FOLLOWS ---------- */
var following={};
function blocked(id){return window.FLC_BLOCKED&&window.FLC_BLOCKED[id]}
function postHTML(p,uid,opts){
  var mine=p.user_id===uid;
  return '<article class="hx-post"><span class="av" style="background:'+col(p.user_id)+'">'+esc(ini(p.author_name))+'</span><div class="tx"><div class="hd"><b>'+esc(p.author_name||"Member")+'</b><small>'+esc(ago(p.created_at))+'</small>'+
   (mine?(opts&&opts.del?'<button type="button" class="fol" data-postdel="'+esc(p.id)+'">Delete</button>':""):'<button type="button" class="fol'+(following[p.user_id]?" on":"")+'" data-follow="'+esc(p.user_id)+'">'+(following[p.user_id]?"Following":"Follow")+'</button>')+
   '</div><p>'+esc(p.body)+'</p></div></article>'}
function loadFeed(){
  var box=$("hx-feed");if(!box)return;
  if(!db()||!me()){box.innerHTML=note("Sign in to see updates from the community.");return}
  var uid=me().id;
  db().from("follows").select("following_id").eq("follower_id",uid).then(function(f){
    following={};(f.data||[]).forEach(function(x){following[x.following_id]=1});
    db().from("posts").select("*").order("created_at",{ascending:false}).limit(15).then(function(r){
      if(r.error){box.innerHTML=note("Community updates are not set up yet. Run the posts SQL in Supabase first.");return}
      var rows=(r.data||[]).filter(function(p){return !blocked(p.user_id)});
      box.innerHTML=rows.length?rows.map(function(p){return postHTML(p,uid)}).join(""):note("No updates yet. Be the first to share one.")})})
}
function loadMyPosts(){
  var box=$("hx-myposts");if(!box)return;
  if(!db()||!me()){box.innerHTML=note(NEED);return}
  db().from("posts").select("*").eq("user_id",me().id).order("created_at",{ascending:false}).limit(50).then(function(r){
    if(r.error){box.innerHTML=note("Posts are not set up yet.");return}
    box.innerHTML=(r.data||[]).length?r.data.map(function(p){return postHTML(p,me().id,{del:true})}).join(""):note("You have not posted yet. Share an update from Home.")})
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
  q.then(function(r){delete btn.dataset.busy;if(r.error)return;if(on)delete following[id];else following[id]=1;
    document.querySelectorAll('[data-follow="'+id+'"]').forEach(function(b){b.classList.toggle("on",!on);b.textContent=on?"Follow":"Following"})})
}
function createPost(){
  var m=$("np-msg"),t=$("np-text").value.trim();m.textContent="";
  if(!db()||!me()){m.textContent="Please sign in to post.";return}
  if(!t){m.textContent="Write something first.";return}
  var btn=$("np-btn");btn.disabled=true;
  db().from("posts").insert({body:t.slice(0,500),author_name:myName()}).then(function(r){
    btn.disabled=false;if(r.error){m.textContent="Could not post. Please try again.";return}
    $("np-text").value="";$("np-n").textContent="0";window.show("home");loadFeed()})
}

/* ---------- wiring ---------- */
document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest("[data-rsvp]")))return toggleRsvp(b);
  if((b=T.closest("[data-evdel]"))){if(confirm("Delete this event?"))db().from("events").delete().eq("id",b.dataset.evdel).then(loadEvents);return}
  if((b=T.closest("[data-follow]")))return toggleFollow(b);
  if((b=T.closest("[data-postdel]"))){if(confirm("Delete this post?"))db().from("posts").delete().eq("id",b.dataset.postdel).then(function(){loadMyPosts();loadStats()});return}
  if(T.closest("#ne-btn"))return createEvent();
  if(T.closest("#np-btn"))return createPost();
  if(T.closest('[data-extab="events"]'))setTimeout(loadEvents,30)
});
document.addEventListener("input",function(e){if(e.target.id==="np-text")$("np-n").textContent=e.target.value.length});

var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){
  if(visible("home"))loadFeed();
  if(visible("profile"))loadStats();
  if(visible("myposts"))loadMyPosts();
  if(visible("explore")&&!$("hx-ex-events").hidden)loadEvents()},120)}
function init(){build();
  if(window.MutationObserver)new MutationObserver(soon).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
