(function(){
var db=window.FL_DBC,user=null,gid=null,chan=null,seen={};
var COL=["#3F5FB0","#5E7F43","#7B52C9","#C2641F","#3F8279","#B8636F","#7A7637"];
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;")}
function ini(n){return (n||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase()}
function tm(d){try{return new Date(d).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}catch(e){return ""}}
function live(){return !!(db&&user&&gid)}
function myName(){return(user&&user.user_metadata&&user.user_metadata.full_name)||(user&&user.email&&user.email.split("@")[0])||"Me"}
function col(id){var s=0;for(var i=0;i<(id||"").length;i++)s+=id.charCodeAt(i);return COL[s%COL.length]}
// ---- messages
function addMsg(m){
  if(m.id){if(seen[m.id])return;seen[m.id]=1}
  var box=$("msgs");if(!box)return;
  var mine=(user&&m.user_id===user.id)||m.user_id==="me";
  var w=document.createElement("div");
  w.style.cssText=mine?"align-self:flex-end;max-width:85%;padding:10px 14px;border-radius:18px 18px 4px 18px;background:#CBD8F8;color:#222;font-size:13px;line-height:1.4":"padding:14px;border-radius:18px;background:#FBEBDD;box-shadow:0 2px 5px rgba(43,33,24,.1);font-size:13px;line-height:1.4;color:#222";
  var h=mine?"":'<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><div style="width:36px;height:36px;border-radius:18px;background:'+col(m.user_id)+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">'+esc(ini(m.author_name))+'</div><div><b>'+esc(m.author_name||"Member")+'</b> <span style="font-size:11px;color:#6B6055">'+tm(m.created_at)+'</span></div></div>';
  var b="",u=esc(m.file_url);
  if(m.kind==="image")b='<a href="'+u+'" target="_blank" rel="noopener"><img src="'+u+'" alt="Photo" style="max-width:100%;border-radius:12px;display:block"></a>';
  else if(m.kind==="file")b='<a href="'+u+'" target="_blank" rel="noopener" style="display:flex;gap:8px;align-items:center;color:#2F5BD8;font-weight:700;text-decoration:none">&#128196; '+esc(m.file_name||"File")+'</a>';
  else if(m.kind==="voice"){var d=m.duration_sec||0;b='<div style="display:flex;align-items:center;gap:10px"><button data-play="'+u+'" aria-label="Play voice note" style="width:44px;height:44px;border:0;border-radius:22px;background:#2F5BD8;color:#fff;font-size:14px">&#9654;</button><span><b>Voice note</b> &middot; '+Math.floor(d/60)+":"+("0"+d%60).slice(-2)+'</span></div>'}
  else if(m.kind==="verse")b='<div style="padding:10px;border:1.5px dashed #E2B04B;border-radius:14px;background:#F8EBD6">'+esc(m.body)+'<br><b>'+esc(m.file_name||"")+'</b></div>';
  else b='<div>'+esc(m.body)+'</div>';
  w.innerHTML=h+b;box.appendChild(w);box.scrollTop=box.scrollHeight}
function post(kind,o){
  if(live()){db.from("messages").insert(Object.assign({group_id:gid,user_id:user.id,author_name:myName(),kind:kind},o)).select().single().then(function(r){if(r.error){alert("Could not send. Please try again.");return}addMsg(r.data)})}
  else addMsg(Object.assign({user_id:"me",author_name:"You",kind:kind,created_at:new Date().toISOString()},o))}
window.FL_SEND=function(t){post("text",{body:t});return true};
window.FL_SHARE=function(t,r){if(db&&user&&!gid)return false;post("verse",{body:t,file_name:r});return true};
function upload(blob,name,type,cb){
  if(!live()){cb(URL.createObjectURL(blob));return}
  var path=gid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+name.replace(/[^a-zA-Z0-9._-]/g,"_");
  db.storage.from("chat-files").upload(path,blob,{contentType:type}).then(function(r){if(r.error){alert("Upload failed. Please try again.");return}cb(db.storage.from("chat-files").getPublicUrl(path).data.publicUrl)})}
// ---- attach
var fi=document.createElement("input");fi.type="file";fi.accept="image/*,application/pdf,.doc,.docx,.txt";fi.hidden=true;document.body.appendChild(fi);
fi.onchange=function(){var f=fi.files[0];fi.value="";if(!f)return;if(f.size>10485760){alert("Please choose a file under 10 MB.");return}
  upload(f,f.name,f.type||"application/octet-stream",function(u){post(f.type.indexOf("image/")===0?"image":"file",{file_url:u,file_name:f.name})})};
// ---- voice
var rec=null,chunks=[],t0=0,tick=null,au=null,aub=null;
function startRec(b){
  if(!navigator.mediaDevices||!window.MediaRecorder){alert("Voice notes are not supported on this browser.");return}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
    var mt=MediaRecorder.isTypeSupported("audio/webm")?"audio/webm":"audio/mp4",sp=b.querySelector("span");
    rec=new MediaRecorder(s,{mimeType:mt});chunks=[];
    rec.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};
    rec.onstop=function(){s.getTracks().forEach(function(t){t.stop()});clearInterval(tick);sp.textContent="Voice Note";sp.style.color="";
      var dur=Math.round((Date.now()-t0)/1000);rec=null;
      if(dur>=1)upload(new Blob(chunks,{type:mt}),"voice."+(mt==="audio/webm"?"webm":"m4a"),mt,function(u){post("voice",{file_url:u,duration_sec:dur})})};
    t0=Date.now();rec.start();sp.style.color="#B3261E";sp.textContent="Stop 0:00";
    tick=setInterval(function(){var d=Math.round((Date.now()-t0)/1000);sp.textContent="Stop "+Math.floor(d/60)+":"+("0"+d%60).slice(-2)},500)
  }).catch(function(){alert("Please allow microphone access to record a voice note.")})}
document.addEventListener("click",function(e){
  var p=e.target.closest("[data-play]");
  if(p){if(au){au.pause();if(aub)aub.innerHTML="&#9654;"}if(aub===p){au=null;aub=null;return}
    au=new Audio(p.dataset.play);aub=p;p.innerHTML="&#10074;&#10074;";au.onended=function(){p.innerHTML="&#9654;";au=null;aub=null};au.play().catch(function(){alert("Could not play this voice note.")});return}
  var b=e.target.closest("button");if(!b)return;var l=b.textContent.trim();
  if(l==="Attach")fi.click();
  else if(l==="Voice Note"||l.indexOf("Stop")===0){if(rec)rec.stop();else startRec(b)}
  else if(l==="Verse"&&b.closest("#chat")){var r=prompt("Which verse? (for example John 3:16)");if(!r)return;var t=prompt("Type the verse text");if(!t)return;post("verse",{body:t.trim(),file_name:r.trim()})}});
// ---- groups (signed-in, backend only)
if(!db)return;
function rm(x){x.remove()}
function card(g,n,mine){
  var c=document.createElement("div");
  c.style.cssText="display:flex;gap:16px;align-items:center;padding:16px;margin:0 20px 14px;background:#FFFAF2;border:1px solid #F0E2C8;border-radius:18px;box-shadow:0 2px 6px rgba(43,33,24,.08)";
  c.innerHTML='<div style="width:64px;height:64px;border-radius:32px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px;flex:none"></div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700"></div><div style="font-size:12px;color:#6B6055"></div></div>';
  c.firstChild.style.background=col(g.id);c.firstChild.textContent=ini(g.name);c.childNodes[1].firstChild.textContent=g.name;c.childNodes[1].lastChild.textContent=n+(n===1?" member":" members");
  if(mine){c.setAttribute("data-go","chat");c.setAttribute("data-group","");c.setAttribute("role","button");c.tabIndex=0;c.dataset.gid=g.id;c.dataset.title=g.name;c.dataset.members=n+(n===1?" member":" members");c.dataset.desc=g.description||""}
  else{c.setAttribute("data-nb","");var j=document.createElement("button");j.setAttribute("data-join","");j.dataset.gid=g.id;j.textContent="Join";j.style.cssText="min-height:44px;padding:0 20px;border-radius:22px;font:700 13px system-ui,sans-serif;border:0;background:#E2B04E;color:#222";c.appendChild(j)}
  return c}
function note(t){var d=document.createElement("div");d.className="fl-empty";d.style.cssText="padding:12px 20px;font-size:13px;color:#6B6055";d.textContent=t;return d}
function loadGroups(){
  Promise.all([db.from("groups").select("id,name,description,group_members(count)").order("created_at"),db.from("group_members").select("group_id").eq("user_id",user.id)]).then(function(r){
    if(r[0].error){return}
    var mine={};(r[1].data||[]).forEach(function(x){mine[x.group_id]=1});
    var gl=$("group-list"),nl=$("nearby-list");
    gl.querySelectorAll("[data-group],.fl-empty").forEach(rm);nl.querySelectorAll("[data-nb],.fl-empty").forEach(rm);
    var a=0,b=0;
    r[0].data.forEach(function(g){var n=g.group_members&&g.group_members[0]?g.group_members[0].count:0;if(mine[g.id]){gl.appendChild(card(g,n,1));a++}else{nl.appendChild(card(g,n,0));b++}});
    if(!a)gl.appendChild(note("You have not joined a group yet. Open Nearby to join one, or tap + to create one."));
    if(!b)nl.appendChild(note("No other groups to join right now."))})}
function loadMembers(id,total){
  db.from("group_members").select("role,user_id,profiles(full_name)").eq("group_id",id).order("joined_at").limit(5).then(function(r){
    var box=$("info-members");if(!box||r.error)return;box.innerHTML="";
    (r.data||[]).forEach(function(m){var nm=(m.profiles&&m.profiles.full_name)||"Member";
      var d=document.createElement("div");d.style.cssText="display:flex;gap:14px;align-items:center;margin-bottom:14px";
      d.innerHTML='<div style="width:52px;height:52px;border-radius:26px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex:none"></div><div><b style="font-size:14px"></b></div>';
      d.firstChild.style.background=col(m.user_id);d.firstChild.textContent=ini(nm);d.lastChild.firstChild.textContent=nm+(user&&m.user_id===user.id?" (you)":"");
      if(m.role==="admin"){var s=document.createElement("div");s.innerHTML='<span style="padding:2px 12px;border-radius:12px;background:#FBE3C2;color:#A06A0E;font-size:12px;font-weight:700">Admin</span>';d.lastChild.appendChild(s)}
      box.appendChild(d)});
    var more=total-(r.data||[]).length;if(more>0){var x=document.createElement("div");x.style.cssText="margin:0 0 18px 66px;font-weight:700;color:#2F5BD8";x.textContent=more+" more members";box.appendChild(x)}})}
function openGroup(c){
  gid=c.dataset.gid;seen={};var box=$("msgs");box.innerHTML="";
  var t=$("info-title"),s=$("info-sub"),a=$("info-about");if(t)t.textContent=c.dataset.title;if(s)s.textContent=c.dataset.members;if(a)a.textContent=c.dataset.desc||"No description yet.";
  loadMembers(gid,parseInt(c.dataset.members,10)||0);
  db.from("messages").select("*").eq("group_id",gid).order("created_at",{ascending:false}).limit(100).then(function(r){if(r.error){box.appendChild(note("Could not load messages."));return}(r.data||[]).reverse().forEach(addMsg);if(!(r.data||[]).length)box.appendChild(note("No messages yet. Say hello!"))});
  if(chan){db.removeChannel(chan);chan=null}
  chan=db.channel("grp-"+gid).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"group_id=eq."+gid},function(p){var e=document.querySelector("#msgs .fl-empty");if(e)e.remove();addMsg(p.new)}).subscribe()}
document.addEventListener("click",function(e){
  var c=e.target.closest("[data-gid][data-group]");if(c&&user)openGroup(c);
  var j=e.target.closest("[data-join][data-gid]");if(j&&user)db.from("group_members").insert({group_id:j.dataset.gid,user_id:user.id}).then(function(){loadGroups()})});
window.FL_NEWGROUP=function(name,desc){
  if(!user)return false;
  db.from("groups").insert({name:name,description:desc,created_by:user.id}).select().single().then(function(r){
    if(r.error){alert("Could not create the group. Please try again.");return}
    db.from("group_members").insert({group_id:r.data.id,user_id:user.id,role:"admin"}).then(loadGroups)});
  return true};
window.FL_ONAUTH=function(u){user=u;if(!u){gid=null;if(chan){db.removeChannel(chan);chan=null}return}loadGroups()};
})();
