(function(){
var P="#E0A93B",INK="#2B2118",BD="#E4D9CC";
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML}
// Search and filter on the Messages screen (works with or without a backend)
var q="",cat="All";
function apply(){var l=document.getElementById("sermon-list");if(!l)return;
 Array.prototype.forEach.call(l.children,function(r){var ok=(cat==="All"||r.dataset.cat===cat)&&r.textContent.toLowerCase().indexOf(q)>-1;r.style.display=ok?"":"none"})}
document.addEventListener("input",function(e){if(e.target.id==="sermon-search"){q=e.target.value.toLowerCase();apply()}});
document.addEventListener("click",function(e){var f=e.target.closest("[data-filter]");if(!f)return;cat=f.dataset.filter;
 document.querySelectorAll("[data-filter]").forEach(function(b){var on=b===f;b.style.background=on?P:"#fff";b.style.color=INK;b.style.border=on?"0":"1px solid "+BD});apply()});
// Backend (Supabase). Runs only after config.js has your real values.
var C=window.FAITHLINK_CONFIG||{};
var live=C.SUPABASE_URL&&C.SUPABASE_URL.indexOf("YOUR_")!==0&&window.supabase;
var db=live?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null;
window.FL_DBC=db;
var grads=["linear-gradient(135deg,#6B4408,#A87420)","linear-gradient(135deg,#223E99,#2F52C4)","linear-gradient(135deg,#3C4F86,#6B4408)"];
function loadSermons(){db.from("sermons").select("*").order("published_at",{ascending:false}).limit(30).then(function(r){
 var l=document.getElementById("sermon-list");if(r.error||!r.data||!r.data.length||!l)return;
 l.innerHTML=r.data.map(function(s,i){var d=s.published_at?new Date(s.published_at).toLocaleDateString():"";
  return '<a data-cat="'+esc(s.category)+'" href="'+esc(s.video_url||"#")+'" target="_blank" rel="noopener" style="display:flex;gap:12px;align-items:center;padding:10px 20px;background:#fff;border-bottom:1px solid #F0E2C8;color:inherit;text-decoration:none"><div style="width:96px;height:64px;border-radius:12px;background:'+grads[i%3]+';flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px">'+esc(s.duration_min?s.duration_min+" min":"Play")+'</div><div style="flex:1;min-width:0"><b>'+esc(s.title)+'</b><div style="font-size:11px;color:#6F6253">'+esc(s.speaker)+" &middot; "+esc(d)+'</div></div></a>'}).join("");apply()})}
function loadPrayers(){db.from("prayer_requests").select("*").eq("status","approved").order("created_at",{ascending:false}).limit(30).then(function(r){
 var l=document.getElementById("prayer-list");if(r.error||!r.data||!r.data.length||!l)return;
 l.querySelectorAll("article").forEach(function(x){x.remove()});l.insertAdjacentHTML("beforeend",r.data.map(function(p){return '<article style="margin:0 20px 12px;padding:16px;border-radius:16px;background:#FFFAF2;border:1px solid #F0E2C8"><div style="font-size:11px;color:#6F6253">'+esc(p.author)+(p.group_name?" &middot; "+esc(p.group_name):"")+'</div><p style="margin:6px 0 12px;font-size:13px;line-height:1.45">'+esc(p.body)+'</p><div style="display:flex;align-items:center;gap:12px"><button data-pray data-pray-id="'+esc(p.id)+'" style="min-height:44px;padding:0 16px;border:0;border-radius:22px;background:#C9D4F5;color:#2F52C4;font:700 13px system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif">I&#39;m praying</button><span style="font-size:12px"><span class="n">'+(p.prayed_count||0)+'</span> praying</span></div></article>'}).join(""))})}
var userName="";
function setMsg(id,t,ok){var m=document.getElementById(id);if(m){m.textContent=t;m.style.color=ok?"#1B6B3A":"#B3261E"}}
function val(id){var e=document.getElementById(id);return e?e.value.trim():""}
function applyUser(u){window.FL_USER=u;if(window.FL_ONAUTH)window.FL_ONAUTH(u);
 var md=(u&&u.user_metadata)||{},n=md.full_name||(u&&u.email?u.email.split("@")[0]:"");if(!n)return;userName=n;
 var m=document.getElementById("me-name"),a=document.getElementById("me-avatar"),b=document.getElementById("me-bio");
 if(m)m.textContent=n;
 if(a)a.textContent=n.split(/\s+/).slice(0,2).map(function(w){return w[0]}).join("").toUpperCase();
 if(b)b.textContent=md.bio||"Tap Edit profile to add a short bio"}
window.FL_SAVE=function(){};
if(db){window.FL_DB=true;loadPrayers();db.auth.getSession().then(function(r){var s=r.data&&r.data.session;if(s)applyUser(s.user);if(window.FL_AUTHED)window.FL_AUTHED(!!s);else if(!s)show("login")})}
document.addEventListener("click",function(e){
 var b=e.target.closest("[data-pray-id]");if(b&&db&&!b.dataset.sent){b.dataset.sent=1;db.rpc("pray_for",{request_id:b.dataset.prayId})}
 if(e.target.closest("#pr-post")&&db){var t=(document.getElementById("pr-text").value||"").trim();if(t.length<5)return;db.from("prayer_requests").insert({body:t.slice(0,500),author:userName||"Anonymous"}).then(function(r){alert(r.error?"Sorry, we could not send your request. Please try again.":"Thank you. Your request will appear after review.")})}});
document.addEventListener("click",function(e){var id=(e.target.closest("button")||{}).id;
 if(id==="li-btn"){if(!db){show("groups");return}var em=val("li-email"),pw=document.getElementById("li-pass").value;
  if(!em||!pw){setMsg("li-msg","Enter your email and password.");return}
  db.auth.signInWithPassword({email:em,password:pw}).then(function(r){if(r.error){setMsg("li-msg","Sign-in failed. Check your email and password.");return}applyUser(r.data.user);show("groups")})}
 if(id==="su-btn"){if(!db){show("groups");return}var pw2=document.getElementById("su-pass").value;if(!val("su-name")){setMsg("su-msg","Please enter your name.");return}
  if(pw2.length<8){setMsg("su-msg","Use at least 8 characters.");return}
  db.auth.signUp({email:val("su-email"),password:pw2,options:{data:{full_name:val("su-name")}}}).then(function(r){
   if(r.error){setMsg("su-msg","Could not create the account. Please try again.");return}
   if(r.data.session){applyUser(r.data.user);show("groups")}else{setMsg("su-msg","Check your email to confirm your account, then sign in.",1)}})}
 if(id==="forgot"){if(!db){setMsg("li-msg","Add your Supabase details in config.js first.");return}var fe=val("li-email")||prompt("Enter your email");if(!fe)return;
  db.auth.resetPasswordForEmail(fe).then(function(){setMsg("li-msg","If that email has an account, a reset link is on its way.",1)})}
 if(id==="sign-out"){if(db)db.auth.signOut().then(function(){if(window.FL_ONAUTH)window.FL_ONAUTH(null);show("login")});else show("login")}});

(function(){
 function $(i){return document.getElementById(i)}
 var n=$("me-name");if(n&&n.textContent==="Favor Mewel")n.textContent="Guest";
 var a=$("me-avatar");if(a&&a.textContent==="FM")a.textContent="G";
 var b=$("me-bio");if(b&&b.textContent.charAt(0)==="[")b.textContent="Tap Edit profile to add a short bio";
 document.addEventListener("click",function(e){
  if(e.target.closest('[data-go="editprofile"]')){var m=$("me-name"),i=$("ep-name"),mb=$("me-bio"),bi=$("ep-bio");
   if(i&&m)i.value=m.textContent==="Guest"?"":m.textContent;if(bi&&mb)bi.value=/^Tap Edit/.test(mb.textContent)?"":mb.textContent}
  if(e.target.closest("#ep-save")&&db&&window.FL_USER){var nm=($("ep-name").value||"").trim(),bio=($("ep-bio").value||"").trim();
   if(nm){db.auth.updateUser({data:{full_name:nm,bio:bio}});db.from("profiles").update({full_name:nm}).eq("id",window.FL_USER.id).then(function(){})}}});
})();
})();
