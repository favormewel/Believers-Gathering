(function(){
var db=window.FL_DBC;if(!db||!window.FLC)return;
var SYS="system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif";
function $(i){return document.getElementById(i)}
function C(){return window.FLC}
function U(){return C().user()}
function G(){return C().gid()}
function ls(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function note(t){return C().note(t)}
var gd=null,role="member",curMember=null,blocked={},sh=null,upd={tab:"A",ann:[],ev:[],rs:[]},updChan=null,inited=false;
window.FLC_BLOCKED=blocked;
function isAdminHere(){return role==="admin"||!!window.FL_IS_ADMIN}
function setSub(el,t){var s=el&&el.querySelector("div > div:nth-child(2)");if(s)s.textContent=t}
function setSw(label,on){var b=document.querySelector('#settings [role="switch"][aria-label="'+label+'"]');if(!b)return;b.setAttribute("aria-checked",on?"true":"false");var tr=b.querySelector(".tr"),kn=b.querySelector(".kn");if(tr)tr.style.background=on?"#E2B04E":"#D5CCBE";if(kn)kn.style.left=on?"23px":"3px"}
// ================= group admin tools =================
function pinBanner(){var b=$("pin-banner"),t=$("pin-text");if(!b||!t)return;
  if(gd&&gd.pinned_text){t.textContent="\u201c"+gd.pinned_text+"\u201d"+(gd.pinned_ref?" \u2014 "+gd.pinned_ref:"");b.hidden=false}else b.hidden=true;
  setSub(document.querySelector('#settings [data-go="pinned"]'),gd&&gd.pinned_text?(gd.pinned_ref||"Pinned verse"):"Nothing pinned")}
function composer(){var m=$("msg"),s=$("send");if(!m)return;var lock=!!(gd&&gd.admins_only_post)&&!isAdminHere();m.disabled=lock;m.placeholder=lock?"Only admins can send messages":"Write a message";if(s)s.disabled=lock}
function applyRole(){var g=document.querySelector('#info [aria-label="Group settings"]');if(g)g.hidden=!isAdminHere();composer()}
function applyGroup(){if(!gd)return;setSw("Only admins can send messages",!!gd.admins_only_post);setSw("Members can add others",gd.members_can_add!==false);setSw("Approve new members",!!gd.approval_required);pinBanner();composer()}
function loadGroupData(id){
  db.from("groups").select("*").eq("id",id).single().then(function(r){if(G()!==id)return;gd=r.data||null;applyGroup();applyRole()});
  db.from("group_members").select("role,muted").eq("group_id",id).eq("user_id",U().id).single().then(function(r){if(G()!==id)return;role=(r.data&&r.data.role)||"member";setSw("Mute notifications",!!(r.data&&r.data.muted));applyRole();if(isAdminHere())loadManage()})}
function mkAv(box,id,name){box.style.cssText="width:48px;height:48px;border-radius:24px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex:none;background:"+C().col(id);box.textContent=C().ini(name)}
function loadManage(){
  var id=G();if(!id)return;
  Promise.all([db.from("group_members").select("role,user_id,profiles(full_name)").eq("group_id",id).order("joined_at").limit(200),db.from("group_requests").select("user_id,profiles(full_name)").eq("group_id",id)]).then(function(r){
    if(G()!==id)return;var mem=r[0].data||[],req=r[1].data||[],rb=$("req-box"),mb=$("mem-box");if(!rb||!mb)return;
    var lab=$("req-label");if(!lab){lab=document.createElement("div");lab.id="req-label";lab.style.cssText="padding:10px 20px 8px;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6B6055";rb.parentNode.insertBefore(lab,rb)}
    lab.textContent="Join requests"+(req.length?" ("+req.length+")":"");rb.innerHTML="";if(!req.length)rb.appendChild(note("No pending requests."));
    req.forEach(function(x){var nm=(x.profiles&&x.profiles.full_name)||"Member",d=document.createElement("div");d.setAttribute("data-reqrow","");d.dataset.uid=x.user_id;d.style.cssText="padding:12px 20px;background:#FFFAF2;border-bottom:1px solid #F0E2C8";
      d.innerHTML='<div style="display:flex;gap:12px;align-items:center"><div class="av"></div><div><b></b><div style="font-size:12px;color:#6B6055">Wants to join</div></div></div><div style="display:flex;gap:8px;margin-top:10px"><button data-req="ok" style="min-height:44px;padding:0 18px;border:0;border-radius:22px;background:#E2B04E;color:#222;font:700 13px '+SYS+'">Approve</button><button data-req="no" style="min-height:44px;padding:0 18px;border:1.5px solid #222;border-radius:22px;background:none;color:#222;font:700 13px '+SYS+'">Decline</button></div>';
      mkAv(d.querySelector(".av"),x.user_id,nm);d.querySelector("b").textContent=nm;rb.appendChild(d)});
    mb.innerHTML="";mem.forEach(function(m){var nm=(m.profiles&&m.profiles.full_name)||"Member",me=m.user_id===U().id,d=document.createElement("div");d.setAttribute("data-mrow","");d.dataset.uid=m.user_id;d.dataset.role=m.role;
      d.style.cssText="display:flex;gap:14px;align-items:center;padding:10px 20px;background:#FFFAF2;border-bottom:1px solid #F0E2C8";
      d.innerHTML='<div class="av"></div><div style="flex:1;min-width:0"><b></b><div class="role" style="font-size:12px"></div></div>'+(me?'':'<button aria-label="Options" data-mm style="width:44px;height:44px;border:0;background:none;font-size:22px;color:#222">&#8942;</button>');
      mkAv(d.querySelector(".av"),m.user_id,nm);d.querySelector("b").textContent=nm+(me?" (you)":"");var ro=d.querySelector(".role");ro.textContent=m.role==="admin"?"Admin":"Member";ro.style.color=m.role==="admin"?"#A06A0E":"#6B6055";ro.style.fontWeight=m.role==="admin"?"700":"400";mb.appendChild(d)});
    setSub(document.querySelector('#settings [data-go="members"]'),mem.length+(mem.length===1?" member":" members")+(req.length?" \u00b7 "+req.length+" request"+(req.length>1?"s":""):""))})}
function refreshCounts(){C().loadGroups();C().members(G(),0)}
function rename(kind){
  if(!gd||!isAdminHere())return;var cur=kind==="name"?gd.name:(gd.description||"");
  var v=prompt(kind==="name"?"Group name":"Group description",cur);if(v===null)return;v=v.trim();if(kind==="name"&&v.length<2){alert("Please enter a name of at least 2 letters.");return}
  var p={p_group:G()};if(kind==="name")p.p_name=v;else p.p_desc=v;
  db.rpc("group_update",p).then(function(r){if(r.error){alert("Could not save. "+(r.error.message||""));return}
    if(kind==="name"){gd.name=v;var t=$("chat-title"),i=$("info-title");if(t)t.textContent=v;if(i)i.textContent=v;setSub(document.querySelectorAll("#settings [data-scroll] > div")[1],v)}
    else{gd.description=v;var a=$("info-about");if(a)a.textContent=v||"No description yet.";setSub(document.querySelectorAll("#settings [data-scroll] > div")[2],v||"No description yet")}
    C().loadGroups()})}
function deleteGroup(){if(!isAdminHere()){alert("Only group admins can delete a group.");return}if(!confirm("Delete this group and all its messages for everyone? This cannot be undone."))return;
  db.rpc("group_delete",{p_group:G()}).then(function(r){if(r.error){alert("Could not delete the group.");return}show("groups");C().loadGroups()})}
// ================= safety =================
function sheetEl(){if(!sh){sh=document.createElement("div");sh.id="msg-sheet";sh.hidden=true;sh.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(43,33,24,.45);display:flex;align-items:flex-end;justify-content:center;z-index:70";document.body.appendChild(sh)}return sh}
function btn(attr,label,red){return '<button '+attr+' style="display:block;width:100%;min-height:50px;border:0;border-bottom:1px solid #F0E2C8;background:none;text-align:left;font:600 15px '+SYS+';color:'+(red?"#B3261E":"#222")+'">'+label+'</button>'}
function panel(title,inner){return '<div style="width:100%;max-width:430px;background:#fff;border-radius:24px 24px 0 0;padding:12px 20px 24px;box-sizing:border-box;font-family:'+SYS+';color:#222"><div style="width:40px;height:4px;border-radius:2px;background:#D5CCBE;margin:0 auto 10px"></div><div id="ma-pre" style="font-size:13px;color:#6B6055;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>'+inner+'<button data-ma="close" style="width:100%;min-height:48px;margin-top:10px;border:1.5px solid #222;border-radius:24px;background:none;font:700 15px '+SYS+'">Cancel</button></div>'}
function openMsg(el){
  var mine=el.dataset.uid===U().id,canDel=mine||isAdminHere(),nm=C().esc(el.dataset.name||"this member"),k=el.dataset.kind,h="";
  if(k==="text"||k==="verse")h+=btn('data-ma="copy"',"Copy text");
  if(!mine)h+=btn('data-ma="report"',"Report this message")+btn('data-ma="block"',"Block "+nm,1);
  if(canDel)h+=btn('data-ma="delete"',"Delete message",1);
  var s=sheetEl();s.innerHTML=panel("",h);s._m=el;s.querySelector("#ma-pre").textContent=(el.dataset.name?el.dataset.name+": ":"")+(el.dataset.text||k);s.hidden=false}
function reasons(){var s=sheetEl(),h="";["Harassment or bullying","Inappropriate or offensive","Spam or scam","Something else"].forEach(function(r){h+=btn('data-mr="'+r+'"',r)});s.innerHTML=panel("",h);s.querySelector("#ma-pre").textContent="Why are you reporting this message?"}
function closeMsg(){if(sh)sh.hidden=true}
function loadBlocks(cb){db.from("blocks").select("blocked_id,profiles!blocked_id(full_name)").then(function(r){Object.keys(blocked).forEach(function(k){delete blocked[k]});(r.data||[]).forEach(function(x){blocked[x.blocked_id]=(x.profiles&&x.profiles.full_name)||"Member"});if(cb)cb()})}
function renderBlocked(){
  var l=$("blocked-list");if(!l)return;l.innerHTML="";var ids=Object.keys(blocked);
  if(!ids.length){var n=note("You have not blocked anyone.");l.appendChild(n);return}
  ids.forEach(function(id){var d=document.createElement("div");d.style.cssText="display:flex;gap:14px;align-items:center;padding:10px 20px;background:#FFFAF2;border-bottom:1px solid #F0E2C8";
    d.innerHTML='<div class="av"></div><div style="flex:1;font-weight:700"></div><button data-unblock style="min-height:44px;padding:0 16px;border:1.5px solid #222;border-radius:22px;background:none;color:#222;font:700 13px '+SYS+'">Unblock</button>';
    mkAv(d.querySelector(".av"),id,blocked[id]);d.childNodes[1].textContent=blocked[id];d.querySelector("button").dataset.uid=id;l.appendChild(d)})}
function mkBlocked(){
  if($("blocked"))return;var s=document.createElement("section");s.id="blocked";s.hidden=true;
  s.innerHTML='<div style="width:100%;height:100%;box-sizing:border-box;display:flex;flex-direction:column;background:#FDF3E3;color:#222;font-family:'+SYS+'"><header style="padding:12px 8px 8px;display:flex;align-items:center;gap:4px"><button aria-label="Back" data-go="profile" style="width:44px;height:44px;border:0;background:none;display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg></button><h1 style="margin:0;font-size:19px;font-weight:700">Blocked members</h1></header><div id="blocked-list" data-scroll style="flex:1;overflow-y:auto;border-top:1px solid #F0E2C8"></div></div>';
  ($("app")||document.body).appendChild(s);
  var so=$("sign-out");if(so&&so.parentNode&&!$("blocked-row")){var r=document.createElement("button");r.id="blocked-row";r.setAttribute("data-go","blocked");r.style.cssText="display:flex;justify-content:space-between;align-items:center;width:100%;min-height:56px;padding:0 20px;border:0;border-bottom:1px solid #F0E2C8;background:#FFFAF2;font:600 15px "+SYS+";color:#222;text-align:left";r.innerHTML='<span>Blocked members</span><span style="color:#6B6055;font-size:20px">&rsaquo;</span>';so.parentNode.insertBefore(r,so)}}
// ================= announcements and events =================
function bells(){return document.querySelectorAll('[aria-label="Notifications"]')}
function dot(on){bells().forEach(function(b){var d=b.querySelector(".fl-dot");if(!d){b.style.position="relative";d=document.createElement("span");d.className="fl-dot";d.style.cssText="position:absolute;top:8px;right:8px;width:10px;height:10px;border-radius:5px;background:#B3261E;border:2px solid #FDF3E3;box-sizing:content-box";b.appendChild(d)}d.hidden=!on})}
function latest(){var m="";upd.ann.concat(upd.ev).forEach(function(x){if(x.created_at>m)m=x.created_at});return m}
function badge(){var seen=ls("fl-seen-upd")||"",l=latest();var open=$("notifications")&&!$("notifications").hidden;dot(!!l&&l>seen&&!open)}
function pill(t,on,tab){return '<button data-ut="'+tab+'" style="min-height:44px;padding:0 18px;border:0;border-radius:22px;font:700 14px '+SYS+';background:'+(on?"#E2B04E":"#DAD3C8")+';color:'+(on?"#222":"#6B6055")+'">'+t+'</button>'}
function renderUpdates(){
  var sec=$("notifications");if(!sec)return;var reg=sec.querySelector("[data-scroll]");if(!reg)return;
  var h1=sec.querySelector("h1");if(h1)h1.textContent="Updates";
  reg.innerHTML='<div style="display:flex;gap:8px;padding:12px 20px"></div><div id="upd-list"></div>';
  reg.firstChild.innerHTML=pill("Announcements",upd.tab==="A","A")+pill("Events",upd.tab==="E","E");
  var l=$("upd-list");
  if(upd.tab==="A"){if(!upd.ann.length){l.appendChild(note("No announcements yet."));return}
    upd.ann.forEach(function(a){var d=document.createElement("div");d.style.cssText="margin:0 20px 12px;padding:14px 16px;background:#FFFAF2;border:1px solid #F0E2C8;border-radius:16px;box-shadow:0 1px 3px rgba(43,33,24,.08)";
      d.innerHTML='<div style="font-size:11px;color:#6B6055"></div><div style="font-size:15px;font-weight:700;margin:2px 0 4px"></div><div style="font-size:14px;line-height:1.45;white-space:pre-wrap"></div>';
      d.childNodes[0].textContent=new Date(a.created_at).toLocaleDateString([],{day:"numeric",month:"short",year:"numeric"});d.childNodes[1].textContent=a.title;d.childNodes[2].textContent=a.body||"";l.appendChild(d)});return}
  if(!upd.ev.length){l.appendChild(note("No upcoming events yet."));return}
  upd.ev.forEach(function(e){var d0=new Date(e.starts_at),going=upd.rs.filter(function(x){return x.event_id===e.id&&x.status==="going"}).length,mine=upd.rs.filter(function(x){return x.event_id===e.id&&x.user_id===U().id})[0],st=mine&&mine.status;
    var d=document.createElement("div");d.dataset.eid=e.id;d.style.cssText="margin:0 20px 12px;padding:14px 16px;background:#FFFAF2;border:1px solid #F0E2C8;border-radius:16px;box-shadow:0 1px 3px rgba(43,33,24,.08)";
    function rb(s,l){var on=st===s;return '<button data-rsvp="'+s+'" style="min-height:44px;padding:0 16px;border:'+(on?"0":"1.5px solid #222")+';border-radius:22px;background:'+(on?"#E2B04E":"none")+';color:#222;font:700 13px '+SYS+'">'+(on?"\u2713 ":"")+l+'</button>'}
    d.innerHTML='<div style="display:flex;gap:12px"><div style="width:52px;height:56px;border-radius:12px;background:#E2B04E;display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none"><span class="mo" style="font-size:11px;font-weight:800"></span><span class="dy" style="font-size:20px;font-weight:800"></span></div><div style="min-width:0"><div class="tt" style="font-size:15px;font-weight:700"></div><div class="wh" style="font-size:13px;color:#6B6055"></div><div class="lc" style="font-size:13px;color:#6B6055"></div></div></div><div class="ds" style="font-size:14px;line-height:1.45;margin:10px 0 0;white-space:pre-wrap"></div><div style="display:flex;gap:8px;align-items:center;margin-top:10px">'+rb("going","Going")+rb("maybe","Maybe")+'<span class="gc" style="font-size:13px;color:#6B6055"></span></div>';
    d.querySelector(".mo").textContent=d0.toLocaleDateString([],{month:"short"}).toUpperCase();d.querySelector(".dy").textContent=d0.getDate();d.querySelector(".tt").textContent=e.title;
    d.querySelector(".wh").textContent=d0.toLocaleString([],{weekday:"short",hour:"numeric",minute:"2-digit"});d.querySelector(".lc").textContent=e.location||"";d.querySelector(".ds").textContent=e.description||"";d.querySelector(".gc").textContent=going+" going";l.appendChild(d)})}
function loadUpdates(cb){
  Promise.all([db.from("announcements").select("*").order("created_at",{ascending:false}).limit(50),db.from("events").select("*").gte("starts_at",new Date(Date.now()-12*36e5).toISOString()).order("starts_at").limit(50),db.from("event_rsvps").select("event_id,user_id,status")]).then(function(r){
    upd.ann=r[0].data||[];upd.ev=r[1].data||[];upd.rs=r[2].data||[];if($("notifications")&&!$("notifications").hidden)renderUpdates();badge();if(cb)cb()})}
// ================= wiring =================
document.addEventListener("click",function(e){
  var t=e.target,x;
  if((x=t.closest("#settings [data-sw]"))&&G()){e.stopPropagation();if(!isAdminHere())return;
    var lab=x.getAttribute("aria-label"),on=x.getAttribute("aria-checked")!=="true",p={p_group:G()};
    if(lab==="Mute notifications"){db.from("group_members").update({muted:on}).eq("group_id",G()).eq("user_id",U().id).then(function(r){if(r.error){alert("Could not save.");return}setSw(lab,on)});return}
    if(lab==="Only admins can send messages")p.p_admins_only=on;else if(lab==="Members can add others")p.p_members_add=on;else p.p_approval=on;
    db.rpc("group_update",p).then(function(r){if(r.error){alert("Could not save. "+(r.error.message||""));return}
      if(gd){if(lab==="Only admins can send messages")gd.admins_only_post=on;else if(lab==="Members can add others")gd.members_can_add=on;else gd.approval_required=on}setSw(lab,on);composer()});return}
  if((x=t.closest("#settings [data-scroll] > div"))&&G()){var i=Array.prototype.indexOf.call(x.parentNode.children,x);if(i===1){rename("name");return}if(i===2){rename("desc");return}}
  if((x=t.closest("#settings [data-copy]"))&&G()){e.stopPropagation();var u=location.origin+location.pathname+"?join="+G();if(navigator.clipboard)navigator.clipboard.writeText(u).catch(function(){});x.textContent="Copied";setTimeout(function(){x.textContent="Copy link"},2000);return}
  if(t.closest('#settings [data-go="pinned"]')&&gd){var pr=$("pv-ref"),pt=$("pv-text");if(pr)pr.value=gd.pinned_ref||"";if(pt)pt.value=gd.pinned_text||"";var a=$("pv-prev-ref"),b=$("pv-prev-text");if(a)a.textContent=gd.pinned_ref||"";if(b)b.textContent=gd.pinned_text||""}
  if(t.closest("#pv-pin")&&G()){e.stopPropagation();var tx=($("pv-text").value||"").trim(),rf=($("pv-ref").value||"").trim();if(tx.length<3){alert("Please type the verse text.");return}
    db.rpc("group_pin",{p_group:G(),p_ref:rf,p_text:tx}).then(function(r){if(r.error){alert("Could not pin. "+(r.error.message||""));return}gd=gd||{};gd.pinned_ref=rf;gd.pinned_text=tx;pinBanner();show("settings")});return}
  if(t.closest("#pv-unpin")&&G()){e.stopPropagation();db.rpc("group_pin",{p_group:G(),p_ref:"",p_text:""}).then(function(r){if(r.error){alert("Could not unpin.");return}if(gd){gd.pinned_ref=null;gd.pinned_text=null}pinBanner();show("settings")});return}
  if((x=t.closest("[data-mm]"))){var row=x.closest("[data-mrow]");curMember=row&&row.dataset.uid;var ms=$("member-sheet");if(ms&&row){var ad=ms.querySelector('[data-ms="admin"]'),mu=ms.querySelector('[data-ms="mute"]');if(mu)mu.hidden=true;if(ad){var tn=Array.prototype.filter.call(ad.childNodes,function(n){return n.nodeType===3})[0];if(tn)tn.nodeValue=row.dataset.role==="admin"?"Remove admin":"Make admin"}}}
  if((x=t.closest("[data-ms]"))&&curMember&&G()){var act=x.dataset.ms;if(act==="close")return;e.stopPropagation();var uid=curMember,mrow=document.querySelector('[data-mrow][data-uid="'+uid+'"]');
    function fin(r){if(r.error){alert("Could not save. "+(r.error.message||""));return}$("member-sheet").hidden=true;curMember=null;loadManage();refreshCounts()}
    if(act==="admin"){db.rpc("group_set_role",{p_group:G(),p_user:uid,p_role:mrow&&mrow.dataset.role==="admin"?"member":"admin"}).then(fin)}
    else if(act==="remove"){if(!confirm("Remove this member from the group?"))return;db.rpc("group_remove_member",{p_group:G(),p_user:uid}).then(fin)}
    return}
  if((x=t.closest("[data-req]"))&&G()&&x.closest("[data-reqrow]")){e.stopPropagation();var rr=x.closest("[data-reqrow]");db.rpc("group_decide",{p_group:G(),p_user:rr.dataset.uid,p_ok:x.dataset.req==="ok"}).then(function(r){if(r.error){alert("Could not save.");return}loadManage();refreshCounts()});return}
  // ---- message actions
  if(t.id==="msg-sheet"){closeMsg();return}
  if((x=t.closest("[data-ma]"))&&sh&&sh._m){var el=sh._m,a2=x.dataset.ma;
    if(a2==="close"){closeMsg();return}
    if(a2==="copy"){if(navigator.clipboard)navigator.clipboard.writeText(el.dataset.text||"").catch(function(){});closeMsg();return}
    if(a2==="report"){reasons();return}
    if(a2==="delete"){if(!confirm("Delete this message for everyone?"))return;closeMsg();db.from("messages").delete().eq("id",el.dataset.mid).then(function(r){if(r.error){alert("Could not delete the message.");return}el.remove();C().loadGroups()});return}
    if(a2==="block"){var uid2=el.dataset.uid,nm2=el.dataset.name||"Member";if(!confirm("Block "+nm2+"? You will no longer see their messages."))return;closeMsg();
      db.from("blocks").insert({blocked_id:uid2}).then(function(r){if(r.error){alert("Could not block.");return}blocked[uid2]=nm2;document.querySelectorAll('#msgs [data-uid="'+uid2+'"]').forEach(function(n){n.remove()})});return}}
  if((x=t.closest("[data-mr]"))&&sh&&sh._m){var el2=sh._m,why=x.dataset.mr;closeMsg();db.from("reports").insert({message_id:el2.dataset.mid,group_id:G(),reason:why}).then(function(r){alert(r.error?"Could not send the report.":"Thank you. An admin will review this message.")});return}
  if((x=t.closest("#msgs [data-mid]"))&&!t.closest("a,button,audio,input")&&x.dataset.mid){openMsg(x);return}
  if(t.closest('[data-go="blocked"]'))renderBlocked();
  if((x=t.closest("[data-unblock]"))){var id3=x.dataset.uid;db.from("blocks").delete().eq("blocked_id",id3).then(function(r){if(r.error){alert("Could not unblock.");return}delete blocked[id3];renderBlocked()});return}
  if(t.closest('[data-go="notifications"]')){loadUpdates(function(){ls("fl-seen-upd",new Date().toISOString());renderUpdates();badge()});return}
  if((x=t.closest("[data-ut]"))){upd.tab=x.dataset.ut;renderUpdates();return}
  if((x=t.closest("[data-rsvp]"))){var card=x.closest("[data-eid]");if(!card||!U())return;var eid=card.dataset.eid,s=x.dataset.rsvp,mine=upd.rs.filter(function(q){return q.event_id===eid&&q.user_id===U().id})[0];
    var q=mine&&mine.status===s?db.from("event_rsvps").delete().eq("event_id",eid).eq("user_id",U().id):db.from("event_rsvps").upsert({event_id:eid,user_id:U().id,status:s});
    q.then(function(r){if(r.error){alert("Could not save.");return}upd.rs=upd.rs.filter(function(z){return!(z.event_id===eid&&z.user_id===U().id)});if(!(mine&&mine.status===s))upd.rs.push({event_id:eid,user_id:U().id,status:s});renderUpdates()});return}
},true);
window.FLC_ON_OPEN=function(c,id){gd=null;role="member";curMember=null;var pb=$("pin-banner");if(pb)pb.hidden=true;applyRole();loadGroupData(id)};
window.FLS={deleteGroup:deleteGroup,refreshRole:applyRole,
  onAuth:function(u){
    if(!u){if(updChan){db.removeChannel(updChan);updChan=null}Object.keys(blocked).forEach(function(k){delete blocked[k]});upd.ann=[];upd.ev=[];upd.rs=[];dot(false);return}
    var h1=document.querySelector("#notifications h1");if(h1)h1.textContent="Updates";
    mkBlocked();loadBlocks();loadUpdates();
    if(!updChan)updChan=db.channel("fl-updates").on("postgres_changes",{event:"INSERT",schema:"public",table:"announcements"},function(){loadUpdates()}).on("postgres_changes",{event:"INSERT",schema:"public",table:"events"},function(){loadUpdates()}).subscribe();
    var j=new URLSearchParams(location.search).get("join");
    if(j&&!inited){inited=true;history.replaceState(null,"",location.pathname);db.rpc("request_join",{p_group:j}).then(function(r){if(r.error){alert("Could not join that group.");return}if(r.data==="requested")alert("Your request to join was sent. An admin will approve it.");C().loadGroups(function(){var row=C().rowOf(j);if(row)row.click()})})}}};
if(window.FL_USER)window.FLS.onAuth(window.FL_USER);
})();
