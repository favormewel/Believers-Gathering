(function(){
var db=window.FL_DBC,user=null,gid=null,seen={},lastDay="",chan=null;
var COL=["#3F5FB0","#4C6B35","#6B42B8","#A85315","#2F6F66","#9A4A55","#6A6630"];
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;")}
function ini(n){return (n||"?").split(/\s+/).slice(0,2).map(function(w){return w[0]||""}).join("").toUpperCase()}
function tm(d){try{return new Date(d).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}catch(e){return ""}}
function same(a,b){return a.toDateString()===b.toDateString()}
function dayLabel(d){var t=new Date(d),n=new Date();if(same(t,n))return "Today";if(same(t,new Date(n-864e5)))return "Yesterday";return t.toLocaleDateString([],{day:"numeric",month:"short",year:t.getFullYear()!==n.getFullYear()?"numeric":undefined})}
function stamp(d){if(!d)return "";var t=new Date(d),n=new Date();if(same(t,n))return tm(d);if(same(t,new Date(n-864e5)))return "Yesterday";if(n-t<6*864e5)return t.toLocaleDateString([],{weekday:"long"});return t.toLocaleDateString([],{day:"numeric",month:"short"})}
function live(){return !!(db&&user&&gid)}
function myName(){return(user&&user.user_metadata&&user.user_metadata.full_name)||(user&&user.email&&user.email.split("@")[0])||"Me"}
function col(id){var s=0;for(var i=0;i<(id||"").length;i++)s+=id.charCodeAt(i);return COL[s%COL.length]}
function pv(kind,body,name){if(kind==="image")return "\ud83d\udcf7 Photo";if(kind==="voice")return "\ud83c\udfa4 Voice note";if(kind==="file")return "\ud83d\udcc4 "+(name||"File");if(kind==="verse")return "\ud83d\udcd6 "+(name||"Verse");return body||""}
// ---- chat bubbles (WhatsApp style)
function addMsg(m,quiet){
  if(m.id){if(seen[m.id])return;seen[m.id]=1}
  var box=$("msgs");if(!box)return;
  var e0=box.querySelector(".fl-empty");if(e0)e0.remove();
  var dl=dayLabel(m.created_at||new Date());
  if(dl!==lastDay){lastDay=dl;var s=document.createElement("div");s.style.cssText="align-self:center;padding:3px 12px;border-radius:10px;background:#E4D9CC;color:#6B6055;font-size:11px;margin:4px 0";s.textContent=dl;box.appendChild(s)}
  var mine=(user&&m.user_id===user.id)||m.user_id==="me";
  var w=document.createElement("div");
  w.style.cssText="max-width:82%;padding:6px 8px 4px;border-radius:"+(mine?"12px 12px 4px 12px":"12px 12px 12px 4px")+";background:"+(mine?"#DCE6FF":"#fff")+";box-shadow:0 1px 1px rgba(43,33,24,.12);font-size:14px;line-height:1.35;color:#222;align-self:"+(mine?"flex-end":"flex-start");
  var h=mine?"":'<div style="font-size:12px;font-weight:700;color:'+col(m.user_id)+';margin-bottom:2px">'+esc(m.author_name||"Member")+'</div>';
  var b="",u=esc(m.file_url);
  if(m.kind==="image")b='<a href="'+u+'" target="_blank" rel="noopener"><img src="'+u+'" alt="Photo" style="max-width:100%;border-radius:8px;display:block"></a>';
  else if(m.kind==="file")b='<a href="'+u+'" target="_blank" rel="noopener" style="display:flex;gap:8px;align-items:center;color:#2F5BD8;font-weight:700;text-decoration:none">&#128196; '+esc(m.file_name||"File")+'</a>';
  else if(m.kind==="voice"){var d=m.duration_sec||0;b='<div style="display:flex;align-items:center;gap:10px"><button data-play="'+u+'" aria-label="Play voice note" style="width:44px;height:44px;border:0;border-radius:22px;background:#2F5BD8;color:#fff;font-size:16px">&#9654;</button><span><b>Voice note</b> &middot; '+Math.floor(d/60)+":"+("0"+d%60).slice(-2)+'</span></div>'}
  else if(m.kind==="verse")b='<div style="padding:8px;border:1.5px dashed #E2B04E;border-radius:10px;background:#F8EBD6">'+esc(m.body)+'<br><b>'+esc(m.file_name||"")+'</b></div>';
  else b='<div style="white-space:pre-wrap;word-wrap:break-word">'+esc(m.body)+'</div>';
  w.innerHTML=h+b+'<div style="font-size:10px;color:#6B6055;text-align:right;margin-top:2px">'+tm(m.created_at||new Date())+'</div>';
  box.appendChild(w);if(!quiet)box.scrollTop=box.scrollHeight}
function post(kind,o){
  if(live()){db.from("messages").insert(Object.assign({group_id:gid,user_id:user.id,author_name:myName(),kind:kind},o)).select().single().then(function(r){if(r.error){alert("Could not send. Please try again.");return}addMsg(r.data);bump(r.data)})}
  else addMsg(Object.assign({user_id:"me",author_name:"You",kind:kind,created_at:new Date().toISOString()},o))}
window.FL_SEND=function(t){post("text",{body:t});return true};
window.FL_SHARE=function(t,r){if(db&&user&&!gid)return false;post("verse",{body:t,file_name:r});return true};
function upload(blob,name,type,cb){
  if(!live()){cb(URL.createObjectURL(blob));return}
  var path=gid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"-"+name.replace(/[^a-zA-Z0-9._-]/g,"_");
  db.storage.from("chat-files").upload(path,blob,{contentType:type}).then(function(r){if(r.error){alert("Upload failed. Please try again.");return}cb(db.storage.from("chat-files").getPublicUrl(path).data.publicUrl)})}
var fi=document.createElement("input");fi.type="file";fi.accept="image/*,application/pdf,.doc,.docx,.txt";fi.hidden=true;document.body.appendChild(fi);
fi.onchange=function(){var f=fi.files[0];fi.value="";if(!f)return;if(f.size>10485760){alert("Please choose a file under 10 MB.");return}
  upload(f,f.name,f.type||"application/octet-stream",function(u){post(f.type.indexOf("image/")===0?"image":"file",{file_url:u,file_name:f.name})})};
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
// search the chat list
var gs=document.querySelector("#groups input");
if(gs)gs.addEventListener("input",function(){var q=gs.value.trim().toLowerCase();document.querySelectorAll("#group-list [data-group]").forEach(function(r){r.style.display=!q||r.textContent.toLowerCase().indexOf(q)>-1?"":"none"})});
var ar0=$("admin-row");if(!db&&ar0)ar0.hidden=false;
if(!db)return;
// ---- backend mode: real groups only
function rm(x){x.remove()}
function note(t,id,btns){var d=document.createElement("div");d.className="fl-empty";if(id)d.id=id;d.style.cssText="padding:20px;font-size:14px;color:#6B6055;text-align:center";d.textContent=t;(btns||[]).forEach(function(b){var x=document.createElement("button");x.setAttribute("data-go",b[1]);x.textContent=b[0];x.style.cssText="display:block;margin:12px auto 0;min-height:44px;padding:0 20px;border:0;border-radius:22px;background:#E2B04E;color:#222;font:700 14px system-ui,sans-serif";d.appendChild(x)});return d}
(function clean(){
  var gl=$("group-list"),nl=$("nearby-list"),pl=$("prayer-list");
  if(gl){gl.querySelectorAll("[data-group]").forEach(rm);gl.appendChild(note("Loading your groups\u2026"))}
  if(nl)nl.querySelectorAll("[data-nb]").forEach(rm);
  if(pl){pl.querySelectorAll("article").forEach(rm);pl.appendChild(note("No prayer requests yet. Tap + to share one.","pr-empty"))}
  var m=$("msgs");if(m)m.innerHTML="";
  var pb=$("pin-banner");if(pb)pb.hidden=true;
  var ns=document.querySelector("#notifications [data-scroll]");if(ns){ns.innerHTML="";ns.appendChild(note("No notifications yet."))}
  var rl=$("req-label");if(rl)rl.remove();var rb=$("req-box");if(rb)rb.innerHTML="";var mb=$("mem-box");if(mb)mb.innerHTML="";
})();
function paint(row){
  var c=row._c,n=c.n,u=c.unread||0;
  var who=c.lastAt?(c.lastUser&&user&&c.lastUser===user.id?"You: ":(c.lastAuthor?String(c.lastAuthor).split(" ")[0]+": ":"")):"";
  row.querySelector(".fl-nm").textContent=c.name;
  row.querySelector(".fl-pv").textContent=c.lastAt?who+pv(c.lastKind,c.lastBody,c.lastFile):("No messages yet \u00b7 "+n+(n===1?" member":" members"));
  var t=row.querySelector(".fl-tm");t.textContent=stamp(c.lastAt);t.style.color=u?"#A06A0E":"#6B6055";t.style.fontWeight=u?"700":"400";
  row.querySelector(".fl-nm").style.fontWeight=u?"800":"700";row.querySelector(".fl-pv").style.color=u?"#222":"#6B6055";
  var bd=row.querySelector(".fl-bd");bd.hidden=!u;bd.textContent=u>99?"99+":u;
  row.dataset.members=n+(n===1?" member":" members")}
function groupRow(c){
  var r=document.createElement("div");r._c=c;r.setAttribute("data-real","1");r.setAttribute("data-go","chat");r.setAttribute("data-group","");r.setAttribute("role","button");r.tabIndex=0;
  r.dataset.gid=c.id;r.dataset.title=c.name;r.dataset.desc=c.desc||"";
  r.style.cssText="display:flex;gap:14px;align-items:center;padding:14px;margin:0 20px 12px;background:#FFFAF2;border:1px solid #F0E2C8;border-radius:18px;box-shadow:0 2px 6px rgba(43,33,24,.08)";
  r.innerHTML='<div class="fl-av" style="width:52px;height:52px;border-radius:26px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;flex:none"></div><div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><span class="fl-nm" style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span><span class="fl-tm" style="font-size:11px;flex:none"></span></div><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:2px"><span class="fl-pv" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span><span class="fl-bd" hidden style="min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:11px;background:#E2B04E;color:#222;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none"></span></div></div>';
  var av=r.querySelector(".fl-av");av.style.background=col(c.id);av.textContent=ini(c.name);paint(r);return r}
function nearRow(g,n){
  var c=document.createElement("div");c.setAttribute("data-real","1");c.setAttribute("data-nb","");
  c.style.cssText="display:flex;gap:14px;align-items:center;padding:14px;margin:0 20px 12px;background:#FFFAF2;border:1px solid #F0E2C8;border-radius:18px;box-shadow:0 2px 6px rgba(43,33,24,.08)";
  c.innerHTML='<div style="width:52px;height:52px;border-radius:26px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;flex:none"></div><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:700"></div><div style="font-size:13px;color:#6B6055"></div></div>';
  c.firstChild.style.background=col(g.id);c.firstChild.textContent=ini(g.name);c.childNodes[1].firstChild.textContent=g.name;c.childNodes[1].lastChild.textContent=n+(n===1?" member":" members")+(g.description?" \u00b7 "+g.description:"");
  var j=document.createElement("button");j.setAttribute("data-join","");j.dataset.gid=g.id;j.textContent="Join";j.style.cssText="min-height:44px;padding:0 18px;border-radius:22px;font:700 13px system-ui,sans-serif;border:0;background:#E2B04E;color:#222";c.appendChild(j);return c}
function loadGroups(cb){
  var gl=$("group-list"),nl=$("nearby-list");if(!gl)return;
  db.rpc("my_chats").then(function(r){
    if(!r.error&&r.data)return r.data.map(function(x){return{id:x.chat_id,name:x.chat_name,desc:x.chat_desc,n:+x.member_count||0,lastBody:x.last_body,lastKind:x.last_kind,lastFile:x.last_file,lastAuthor:x.last_author,lastUser:x.last_user,lastAt:x.last_at,unread:+x.unread||0}});
    return db.from("group_members").select("group_id,groups(id,name,description)").eq("user_id",user.id).then(function(q){return(q.data||[]).filter(function(x){return x.groups}).map(function(x){return{id:x.groups.id,name:x.groups.name,desc:x.groups.description,n:0,unread:0}})})
  }).then(function(mine){
    var have={};mine.forEach(function(c){have[c.id]=1});
    return db.from("groups").select("id,name,description,group_members(count)").order("created_at").then(function(r2){return{mine:mine,have:have,all:r2.data||[]}})
  }).then(function(o){
    gl.querySelectorAll("[data-group],.fl-empty").forEach(rm);if(nl)nl.querySelectorAll("[data-nb],.fl-empty").forEach(rm);
    o.mine.forEach(function(c){if(!c.n){var g=o.all.filter(function(x){return x.id===c.id})[0];c.n=g&&g.group_members&&g.group_members[0]?g.group_members[0].count:0}gl.appendChild(groupRow(c))});
    if(!o.mine.length)gl.appendChild(note("You are not in any group yet.","",[["Create a group","newgroup"],["Find groups","nearby"]]));
    var k=0;o.all.forEach(function(g){if(o.have[g.id])return;k++;nl.appendChild(nearRow(g,g.group_members&&g.group_members[0]?g.group_members[0].count:0))});
    if(!k&&nl)nl.appendChild(note("No other groups to join right now."));
    if(cb)cb()}).catch(function(){var gl2=$("group-list");if(gl2){gl2.querySelectorAll(".fl-empty").forEach(rm);gl2.appendChild(note("Could not load your groups. Check your internet and reopen the app."))}})}
function rowOf(id){return document.querySelector('#group-list [data-gid="'+id+'"][data-group]')}
function bump(m){
  var row=rowOf(m.group_id);if(!row){loadGroups();return}
  var c=row._c;c.lastBody=m.body;c.lastKind=m.kind;c.lastFile=m.file_name;c.lastAuthor=m.author_name;c.lastUser=m.user_id;c.lastAt=m.created_at;
  var viewing=m.group_id===gid&&$("chat")&&!$("chat").hidden;
  if(m.user_id!==user.id&&!viewing)c.unread=(c.unread||0)+1;
  paint(row);var gl=$("group-list"),first=gl.querySelector("[data-group]");if(first&&first!==row)gl.insertBefore(row,first)}
function markRead(g){
  db.from("group_members").update({last_read_at:new Date().toISOString()}).eq("group_id",g).eq("user_id",user.id).then(function(){});
  var row=rowOf(g);if(row){row._c.unread=0;paint(row)}}
function onNew(m){
  if(m.group_id===gid){addMsg(m);if(m.user_id!==user.id&&$("chat")&&!$("chat").hidden)markRead(gid)}
  bump(m)}
function listen(){if(chan)return;chan=db.channel("fl-messages").on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},function(p){onNew(p.new)}).subscribe()}
function setSub(rowEl,t){var s=rowEl&&rowEl.querySelector("div > div:nth-child(2)");if(s)s.textContent=t}
function members(id,total){
  db.from("group_members").select("role,user_id,profiles(full_name)").eq("group_id",id).order("joined_at").limit(200).then(function(r){
    var list=r.data||[],box=$("info-members"),mb=$("mem-box");
    function line(m,dots){var nm=(m.profiles&&m.profiles.full_name)||"Member";var d=document.createElement("div");d.style.cssText="display:flex;gap:14px;align-items:center;margin-bottom:14px";
      d.innerHTML='<div style="width:48px;height:48px;border-radius:24px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex:none"></div><div><b style="font-size:15px"></b></div>';
      d.firstChild.style.background=col(m.user_id);d.firstChild.textContent=ini(nm);d.lastChild.firstChild.textContent=nm+(user&&m.user_id===user.id?" (you)":"");
      if(m.role==="admin"){var s=document.createElement("div");s.innerHTML='<span style="padding:2px 12px;border-radius:12px;background:#FBE3C2;color:#A06A0E;font-size:12px;font-weight:700">Admin</span>';d.lastChild.appendChild(s)}return d}
    if(box){box.innerHTML="";list.slice(0,5).forEach(function(m){box.appendChild(line(m))});var more=Math.max(total,list.length)-Math.min(5,list.length);if(more>0){var x=document.createElement("div");x.style.cssText="margin:0 0 18px 62px;font-weight:700;color:#2F5BD8";x.textContent=more+" more members";box.appendChild(x)}}
    if(mb){mb.innerHTML="";list.forEach(function(m){var d=line(m);d.style.cssText="display:flex;gap:14px;align-items:center;padding:10px 20px;background:#FFFAF2;border-bottom:1px solid #F0E2C8;margin:0";mb.appendChild(d)})}})}
function media(id){
  db.from("messages").select("kind").eq("group_id",id).in("kind",["image","file","voice"]).limit(1000).then(function(r){
    var k={image:0,file:0,voice:0};(r.data||[]).forEach(function(x){k[x.kind]++});
    var els=document.querySelectorAll("#info div");els.forEach(function(e){if(!e.children.length&&/photos, \d+ files/.test(e.textContent))e.textContent=k.image+" photos, "+k.file+" files, "+k.voice+" voice notes"});
    els.forEach(function(e){if(!e.children.length&&/Jeremiah 29:11/.test(e.textContent)&&/Verse of the Day/.test(e.textContent))e.textContent="Nothing pinned yet"})})}
function openGroup(c){
  gid=c.dataset.gid;seen={};lastDay="";try{localStorage.setItem("fl-gid",JSON.stringify(gid))}catch(e){}
  var box=$("msgs");box.innerHTML="";
  var t=$("info-title"),s=$("info-sub"),a=$("info-about");if(t)t.textContent=c.dataset.title;if(s)s.textContent=c.dataset.members||"";if(a)a.textContent=c.dataset.desc||"No description yet.";
  var ch=$("chat-title"),cm=$("chat-members");if(ch)ch.textContent=c.dataset.title;if(cm)cm.textContent=c.dataset.members||"";
  var rows=document.querySelectorAll("#settings [data-scroll] > div");setSub(rows[1],c.dataset.title);setSub(rows[2],c.dataset.desc||"No description yet");
  var mr=document.querySelector('#settings [data-go="members"]');setSub(mr,c.dataset.members||"");
  members(gid,parseInt(c.dataset.members,10)||0);media(gid);markRead(gid);
  db.from("messages").select("*").eq("group_id",gid).order("created_at",{ascending:false}).limit(100).then(function(r){
    if(r.error){box.appendChild(note("Could not load messages."));return}
    var list=(r.data||[]).slice().reverse();list.forEach(function(m){addMsg(m,true)});
    if(!list.length)box.appendChild(note("No messages yet. Say hello!"));box.scrollTop=box.scrollHeight})}
document.addEventListener("click",function(e){
  var c=e.target.closest("[data-gid][data-group]");if(c&&user)openGroup(c);
  var j=e.target.closest("[data-join][data-gid]");if(j&&user)db.from("group_members").insert({group_id:j.dataset.gid,user_id:user.id}).then(function(){loadGroups(function(){var row=rowOf(j.dataset.gid);if(row)row.click()})})});
document.addEventListener("click",function(e){var d=e.target.closest("[data-danger]");if(!d||!user||!gid)return;e.stopPropagation();
  if(d.dataset.danger==="leave"){if(confirm("Leave this group?"))db.from("group_members").delete().eq("group_id",gid).eq("user_id",user.id).then(function(r){if(r.error){alert("Could not leave the group.");return}gid=null;show("groups");loadGroups()})}
  else alert("Ask the app admin to delete a group.")},true);
window.FL_NEWGROUP=function(name,desc){
  if(!user)return false;
  db.from("groups").insert({name:name,description:desc,created_by:user.id}).select().single().then(function(r){
    if(r.error){alert("Could not create the group. Please try again.");return}
    var id=r.data.id;db.from("group_members").insert({group_id:id,user_id:user.id,role:"admin"}).then(function(){loadGroups(function(){var row=rowOf(id);if(row)row.click()})})});
  return true};
window.FL_ONAUTH=function(u){user=u;var ar=$("admin-row");if(ar)ar.hidden=true;
  if(!u){gid=null;if(chan){db.removeChannel(chan);chan=null}document.querySelectorAll("[data-real]").forEach(rm);return}
  loadGroups(function(){if(window.FL_RESUME_GID){var rc=rowOf(window.FL_RESUME_GID);window.FL_RESUME_GID=null;if(rc)rc.click()}});listen();
  if(ar)db.from("profiles").select("is_admin").eq("id",u.id).single().then(function(r){ar.hidden=!(r.data&&r.data.is_admin)})};
window.FL_RESUME=function(id){var r=rowOf(id);if(r)r.click();else window.FL_RESUME_GID=id};
if(window.FL_USER)window.FL_ONAUTH(window.FL_USER);
})();
