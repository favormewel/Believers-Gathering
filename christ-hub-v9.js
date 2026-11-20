(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function visible(id){var s=$(id);return !!s&&!s.hidden}
function toast(m){var t=$("hx-toast");if(!t){t=document.createElement("div");t.id="hx-toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");document.body.appendChild(t)}
  t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove("on")},3200)}
var BACK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>';
function sec(id,title,back,body){
  var s=document.createElement("section");s.id=id;s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="'+back+'">'+BACK+'</button><h1 style="font-size:20px">'+esc(title)+'</h1></div></header><div class="hx-scroll" data-scroll>'+body+'</div></div>';
  $("app").appendChild(s)}
function appBase(){return location.origin+location.pathname.replace(/index\.html$/,"")}

/* =============== LIVE NOW =============== */
var LIVE=null,STAMP={};
function banner(){
  var sc=document.querySelector("#home .hx-scroll");if(!sc)return;
  var el=$("lv-box");if(!el){el=document.createElement("div");el.id="lv-box";sc.insertBefore(el,sc.firstChild)}
  if(!LIVE){el.innerHTML="";return}
  el.innerHTML='<a class="lv-banner" href="'+esc(LIVE.url)+'" target="_blank" rel="noopener noreferrer"><span class="lv-dot" aria-hidden="true"></span><span class="tx"><b>LIVE NOW</b><span>'+esc(LIVE.title)+'</span></span><span class="go">Watch</span></a>'}
function loadLive(){
  if(!db()||!me())return;STAMP.live=Date.now();
  var since=new Date(Date.now()-12*3600*1000).toISOString();
  db().from("live_streams").select("*").is("ended_at",null).gt("started_at",since).order("started_at",{ascending:false}).limit(1).then(function(r){
    if(r.error)return;var x=(r.data||[])[0];LIVE=(x&&/^https:\/\//i.test(x.url||""))?x:null;banner();renderLiveAdmin()},function(){})}
function renderLiveAdmin(){
  var box=$("gl-now");if(!box)return;
  box.innerHTML=LIVE?'<div class="gl-cur"><span class="lv-dot" aria-hidden="true"></span><span class="tx"><b>You are live</b><span>'+esc(LIVE.title)+'</span></span><button type="button" id="gl-end">End live</button></div>':'<p class="v9-sub">Nothing is live right now.</p>'}
function validUrl(u){return /^https:\/\/[^\s]+\.[^\s]+$/i.test(u)&&u.length<=600}
function goLive(){
  var t=($("gl-title").value||"").trim(),u=($("gl-url").value||"").trim(),m=$("gl-msg");m.textContent="";
  if(t.length<2){m.textContent="Give the live service a title.";return}
  if(!validUrl(u)){m.textContent="Paste the full link starting with https://";return}
  var b=$("gl-go");b.disabled=true;
  db().rpc("start_live",{p_title:t,p_url:u,p_notify:$("gl-notify").checked}).then(function(r){
    b.disabled=false;
    if(r.error){var e=r.error.message||"";m.textContent=/admins only/i.test(e)?"Only admins can go live.":/function|schema cache|could not find/i.test(e)?"Live is not set up yet. Run the live SQL in Supabase.":"Could not start. Please try again.";return}
    $("gl-title").value="";$("gl-url").value="";toast("You are live. Members can see the banner.");loadLive()},function(){b.disabled=false;m.textContent="Could not start. Please try again."})}
function endLive(){
  db().rpc("end_live").then(function(r){if(r.error){toast("Could not end the live.");return}LIVE=null;banner();renderLiveAdmin();toast("Live ended")},function(){toast("Could not end the live.")})}

/* =============== VERSE CARDS =============== */
var VT=[
 {n:"Brand",bg:["#3B13AA","#6544D8","#1D0A5E"],accent:"#FFD35C",text:"#FFFFFF"},
 {n:"Sunrise",bg:["#FF9A3C","#E0457B","#4B2A8A"],accent:"#FFF1B8",text:"#FFFFFF"},
 {n:"Night",bg:["#0B1026","#1C2348","#2B1F5C"],accent:"#FFD35C",text:"#F7F5FF",stars:true},
 {n:"Parchment",bg:["#FBF3DF","#F0DFB8"],accent:"#A86F00",text:"#3B2A14"},
 {n:"Forest",bg:["#1F6B4F","#0E3B2C"],accent:"#BFF2D6",text:"#FFFFFF"},
 {n:"Sky",bg:["#6EC1FF","#2F6DE0"],accent:"#FFFFFF",text:"#FFFFFF"}];
var SAMPLES=[
 ["For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.","John 3:16 (KJV)"],
 ["The LORD is my shepherd; I shall not want.","Psalm 23:1 (KJV)"],
 ["I can do all things through Christ which strengtheneth me.","Philippians 4:13 (KJV)"],
 ["Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.","Isaiah 41:10 (KJV)"]];
var VTI=0,VF="sq",vT=null;
function wrap(x,text,maxw){
  var out=[];text.split(/\n/).forEach(function(par){
    var words=par.split(/\s+/).filter(Boolean),line="";
    if(!words.length){out.push("");return}
    words.forEach(function(w){var test=line?line+" "+w:w;if(x.measureText(test).width>maxw&&line){out.push(line);line=w}else line=test});
    out.push(line)});
  return out}
function drawCard(){
  var c=$("vc-canvas");if(!c)return;
  var W=1080,H=VF==="st"?1920:1080;c.width=W;c.height=H;
  var x=c.getContext("2d"),tp=VT[VTI],st=VF==="st";
  var g=x.createLinearGradient(0,0,W*.7,H);tp.bg.forEach(function(col,i){g.addColorStop(tp.bg.length>1?i/(tp.bg.length-1):0,col)});
  x.fillStyle=g;x.fillRect(0,0,W,H);
  x.globalAlpha=.13;x.fillStyle=tp.accent;x.beginPath();x.arc(W*.88,H*.1,W*.3,0,7);x.fill();x.beginPath();x.arc(W*.08,H*.93,W*.38,0,7);x.fill();x.globalAlpha=1;
  if(tp.stars){x.fillStyle="#fff";for(var i=0;i<46;i++){var sx=(i*197)%W,sy=(i*353)%H,sr=(i%3)+1.2;x.globalAlpha=.25+((i*7)%5)/10;x.beginPath();x.arc(sx,sy,sr,0,7);x.fill()}x.globalAlpha=1}
  x.textAlign="center";x.textBaseline="alphabetic";
  x.fillStyle=tp.accent;x.font="700 240px Georgia,serif";x.fillText("\u201C",W/2,H*(st?.25:.2));
  var text=(($("vc-text")||{}).value||"").trim()||"Type your verse here",ref=(($("vc-ref")||{}).value||"").trim();
  var bx=110,by=H*(st?.28:.23),bw=W-220,bh=H*(st?.42:.47),size=st?86:80,lines=[];
  for(;size>=28;size-=2){x.font="italic 600 "+size+"px Georgia,'Times New Roman',serif";lines=wrap(x,text,bw);if(lines.length*size*1.32<=bh)break}
  var lh=size*1.32,total=lines.length*lh,top=by+Math.max(0,(bh-total)/2)+size*.9;
  x.fillStyle=tp.text;lines.forEach(function(l,i){x.fillText(l,W/2,top+i*lh)});
  var ry=Math.min(by+bh+90,top+total+60);
  if(ref){x.fillStyle=tp.accent;x.font="700 46px 'Inter',system-ui,sans-serif";try{x.letterSpacing="3px"}catch(e){}x.fillText(ref.toUpperCase(),W/2,ry);try{x.letterSpacing="0px"}catch(e){}}
  var fy=H-(st?150:110);
  x.fillStyle=tp.accent;x.font="800 34px 'Inter',system-ui,sans-serif";try{x.letterSpacing="7px"}catch(e){}x.fillText("CHEN NETWORK",W/2,fy);try{x.letterSpacing="0px"}catch(e){}
  x.globalAlpha=.8;x.fillStyle=tp.text;x.font="500 27px 'Inter',system-ui,sans-serif";x.fillText(appBase().replace(/^https?:\/\//,"").replace(/\/$/,""),W/2,fy+44);x.globalAlpha=1;
  c.setAttribute("aria-label","Verse card preview: "+text.slice(0,120)+(ref?", "+ref:""))}
function soonCard(){clearTimeout(vT);vT=setTimeout(drawCard,120)}
function cardBlob(cb){drawCard();$("vc-canvas").toBlob(function(b){cb(b)},"image/png")}
function dl(b){var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="verse-card.png";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}
function shareCard(){
  cardBlob(function(b){
    if(!b){toast("Could not make the card");return}
    var f=new File([b],"verse-card.png",{type:"image/png"}),ref=(($("vc-ref")||{}).value||"").trim();
    if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:"Verse card",text:(ref?ref+" - ":"")+"Chen Network"}).catch(function(){})}
    else{dl(b);toast("Card saved to your phone")}})}

/* =============== INVITE =============== */
function inviteLink(){var u=me();return appBase()+(u?"?ref="+u.id:"")}
function inviteMsg(){return "Join me on Chen Network, a Christian community to connect, pray and grow together: "+inviteLink()}
function loadInvite(){
  var n=$("iv-n");if(!n)return;
  if(!db()||!me()){n.textContent="-";return}
  db().rpc("my_referral_count").then(function(r){n.textContent=r.error?"-":String(+r.data||0)},function(){n.textContent="-"})}
function shareInvite(){
  var msg=inviteMsg();
  if(navigator.share){navigator.share({title:"Chen Network",text:"Join me on Chen Network, a Christian community to connect, pray and grow together.",url:inviteLink()}).catch(function(){})}
  else copyInvite()}
function copyInvite(){
  var l=inviteLink();
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(l).then(function(){toast("Invite link copied")},function(){window.prompt("Copy your invite link",l)});
  else window.prompt("Copy your invite link",l)}
(function(){
  var m=(location.search.match(/[?&]ref=([0-9a-f-]{36})/i)||[])[1];
  if(m){try{localStorage.setItem("fl-ref",m)}catch(e){}
    try{var q=location.search.replace(/([?&])ref=[^&]*&?/,"$1").replace(/[?&]$/,"");history.replaceState(null,"",location.pathname+q+location.hash)}catch(e){}}})();
function claimRef(){
  var u=me();if(!u||!db())return;var r;try{r=localStorage.getItem("fl-ref")}catch(e){}
  if(!r)return;try{localStorage.removeItem("fl-ref")}catch(e){}
  if(r===u.id)return;
  db().rpc("claim_referral",{p_ref:r}).then(function(){},function(){})}

/* =============== BIRTHDAYS =============== */
var MON=["January","February","March","April","May","June","July","August","September","October","November","December"],DIM=[31,29,31,30,31,30,31,31,30,31,30,31];
var MYB=null,BD=[];
function kampalaNow(){var k=new Date(Date.now()+3*3600*1000);return{m:k.getUTCMonth()+1,d:k.getUTCDate()}}
function fillDays(){
  var mo=+($("bd-m")||{}).value||1,sel=$("bd-d");if(!sel)return;var cur=+sel.value||1,h="";
  for(var i=1;i<=DIM[mo-1];i++)h+='<option value="'+i+'"'+(i===Math.min(cur,DIM[mo-1])?" selected":"")+'>'+i+'</option>';
  sel.innerHTML=h}
function loadMyB(cb){
  if(!db()||!me())return cb&&cb();
  db().from("member_birthdays").select("*").eq("user_id",me().id).then(function(r){
    MYB=(!r.error&&r.data&&r.data[0])||null;
    if($("bd-m")){$("bd-m").value=MYB?MYB.month:1;fillDays();$("bd-d").value=MYB?MYB.day:1;$("bd-v").checked=!!(MYB&&MYB.visible);$("bd-rm").hidden=!MYB}
    if(cb)cb()},function(){if(cb)cb()})}
function saveB(){
  var m=+$("bd-m").value,d=+$("bd-d").value,msg=$("bd-msg");msg.textContent="";
  if(!db()||!me()){msg.textContent="Please sign in.";return}
  db().from("member_birthdays").upsert({user_id:me().id,month:m,day:d,visible:$("bd-v").checked,updated_at:new Date().toISOString()},{onConflict:"user_id"}).then(function(r){
    if(r.error){msg.textContent=/relation|does not exist|schema cache/i.test(r.error.message||"")?"Birthdays are not set up yet. Run the birthday SQL in Supabase.":"Could not save. Please try again.";return}
    MYB={month:m,day:d,visible:$("bd-v").checked};$("bd-rm").hidden=false;toast("Birthday saved");STAMP.bd=0;loadBd()})}
function removeB(){
  if(!confirm("Remove your birthday?")||!db()||!me())return;
  db().from("member_birthdays").delete().eq("user_id",me().id).then(function(r){if(r.error){toast("Could not remove it.");return}MYB=null;$("bd-rm").hidden=true;$("bd-m").value=1;fillDays();$("bd-v").checked=false;toast("Birthday removed");loadBd()})}
function first(n){return String(n||"").trim().split(/\s+/)[0]||"friend"}
function bdCard(){
  var home=$("home"),q=home&&home.querySelector(".hx-quick");if(!q)return;
  var el=$("bd-box");if(!el){el=document.createElement("div");el.id="bd-box";q.insertAdjacentElement("afterend",el)}
  var k=kampalaNow(),h="";
  if(MYB&&MYB.month===k.m&&MYB.day===k.d){
    var nm=(($("me-name")||{}).textContent||"").trim();
    h+='<div class="bd-me"><b>Happy birthday'+(nm&&nm!=="Guest"?", "+esc(first(nm)):"")+'!</b><span>May God bless your new year of life.</span></div>'}
  var today=BD.filter(function(x){return x.days_until===0}),soon=BD.filter(function(x){return x.days_until>0});
  if(today.length||soon.length){
    h+='<section class="bd-card" aria-label="Birthdays"><h2>Birthdays</h2><ul class="bd-list">'+
      today.map(function(x){return '<li><span class="tx"><b>'+esc(x.full_name)+'</b><small>Birthday today</small></span><button type="button" class="bd-wish" data-bw="'+esc(x.user_id)+'" data-name="'+esc(x.full_name)+'">Send a wish</button></li>'}).join("")+
      soon.slice(0,4).map(function(x){var d=new Date(2000,x.month-1,x.day).toLocaleDateString([],{month:"short",day:"numeric"});return '<li><span class="tx"><b>'+esc(x.full_name)+'</b><small>'+esc(d)+' &middot; in '+x.days_until+' day'+(x.days_until===1?"":"s")+'</small></span></li>'}).join("")+
      '</ul></section>'}
  el.innerHTML=h}
function loadBd(){
  if(!db()||!me())return;STAMP.bd=Date.now();
  loadMyB(function(){
    db().rpc("upcoming_birthdays",{p_days:7}).then(function(r){BD=r.error?[]:(r.data||[]);bdCard()},function(){bdCard()})})}

/* =============== inject entries + build screens =============== */
function build(){
  if(!$("app")||$("golive"))return;
  sec("golive","Go live","menu",
    '<div id="gl-now"></div>'+
    '<p class="v9-sub">Start a live service and every member sees a banner on Home. Paste the link from YouTube, Facebook or another site.</p>'+
    '<label class="hx-f"><span>Title</span><input id="gl-title" maxlength="120" placeholder="Sunday Service"></label>'+
    '<label class="hx-f"><span>Live link</span><input id="gl-url" type="url" inputmode="url" placeholder="https://..." autocomplete="off"></label>'+
    '<label class="v9-chk"><input type="checkbox" id="gl-notify" checked> Notify everyone</label>'+
    '<div id="gl-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="gl-go" type="button">Go live</button>');
  var sam=SAMPLES.map(function(s,i){return '<button type="button" class="tp" data-vs="'+i+'">'+esc(s[1].replace(/ \(KJV\)/,""))+'</button>'}).join("");
  var tpl=VT.map(function(t,i){return '<button type="button" class="vc-sw'+(i===0?" on":"")+'" data-vt="'+i+'" aria-label="'+esc(t.n)+' style" aria-pressed="'+(i===0?"true":"false")+'" style="background:linear-gradient(135deg,'+t.bg.join(",")+')"></button>'}).join("");
  sec("versecard","Verse card","menu",
    '<div class="vc-wrap"><canvas id="vc-canvas" role="img" aria-label="Verse card preview"></canvas></div>'+
    '<label class="hx-f"><span>Verse</span><textarea id="vc-text" rows="4" maxlength="700" placeholder="Type or paste the verse"></textarea></label>'+
    '<label class="hx-f"><span>Reference</span><input id="vc-ref" maxlength="60" placeholder="John 3:16 (KJV)"></label>'+
    '<div class="hx-f"><span>Quick verses (KJV)</span><div class="hx-tpls">'+sam+'</div></div>'+
    '<div class="hx-f"><span>Style</span><div class="vc-sws">'+tpl+'</div></div>'+
    '<div class="hx-f"><span>Size</span><div class="hx-umode" id="vc-fmt" role="radiogroup" aria-label="Card size" style="margin:0"><button type="button" class="on" data-vf="sq" role="radio" aria-checked="true">Square</button><button type="button" data-vf="st" role="radio" aria-checked="false">WhatsApp status</button></div></div>'+
    '<p class="v9-sub">Use a translation you may share, such as the KJV. The card includes the Chen Network name and link.</p>'+
    '<button class="hx-cta" id="vc-share" type="button">Share card</button><button class="hx-addph" id="vc-dl" type="button" style="margin-top:10px">Save to phone</button>');
  sec("invite","Invite friends","menu",
    '<div class="iv-hero"><h2>Grow the family</h2><p>Share Chen Network with friends and family. When they join through your link, you get a notification.</p></div>'+
    '<div class="iv-stat"><b id="iv-n">-</b><span>friends joined through your link</span></div>'+
    '<button class="hx-cta" id="iv-share" type="button">Share invite</button>'+
    '<a class="hx-addph iv-wa" id="iv-wa" target="_blank" rel="noopener noreferrer" href="#">Send on WhatsApp</a>'+
    '<button class="hx-addph" id="iv-copy" type="button" style="margin-top:10px">Copy link</button>'+
    '<p class="v9-sub" id="iv-link" style="word-break:break-all"></p>');
  var mo=MON.map(function(m,i){return '<option value="'+(i+1)+'">'+m+'</option>'}).join("");
  sec("birthday","Birthday","appsettings",
    '<p class="v9-sub">Add your birthday so friends can send you wishes. Only the day and month are used, never the year.</p>'+
    '<div class="bd-form"><label class="hx-f"><span>Month</span><select id="bd-m">'+mo+'</select></label><label class="hx-f"><span>Day</span><select id="bd-d"></select></label></div>'+
    '<label class="v9-chk"><input type="checkbox" id="bd-v"> Let other members see my birthday</label>'+
    '<div id="bd-msg" class="hx-msg" role="alert"></div><button class="hx-cta" id="bd-save" type="button">Save birthday</button><button class="hx-addph" id="bd-rm" type="button" style="margin-top:10px" hidden>Remove my birthday</button>');
  fillDays();
  /* Settings row */
  var out=$("hx-logout");
  if(out&&!$("hx-bd-row"))out.insertAdjacentHTML("beforebegin",'<button class="hx-set" id="hx-bd-row" type="button" data-go="birthday"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21h16v-8H4zM12 13V8M9 8h6M12 3v2"/></svg></span><span><b>Birthday</b><small>Let friends send you wishes</small></span><span class="ch">&rsaquo;</span></button>');
  /* Home: invite row */
  var ex=document.querySelector('#home button[data-go="explore"]');
  if(ex&&!$("hx-inv-row"))ex.insertAdjacentHTML("afterend",'<button class="hx-row" id="hx-inv-row" data-go="invite" type="button" style="margin-top:10px"><span class="av" style="background:linear-gradient(135deg,#9277F5,#6B48D8)"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M19 8v6M16 11h6"/></svg></span><span class="tx"><b>Invite friends</b><small>Share Chen Network on WhatsApp</small></span></button>');
  drawCard()}

document.addEventListener("click",function(e){
  var T=e.target,b;
  if(T.closest("#gl-go")){goLive();return}
  if(T.closest("#gl-end")){if(confirm("End the live now?"))endLive();return}
  if((b=T.closest("[data-vs]"))){var s=SAMPLES[+b.dataset.vs];$("vc-text").value=s[0];$("vc-ref").value=s[1];drawCard();return}
  if((b=T.closest("[data-vt]"))){VTI=+b.dataset.vt;document.querySelectorAll("[data-vt]").forEach(function(x){var on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on?"true":"false")});drawCard();return}
  if((b=T.closest("[data-vf]"))){VF=b.dataset.vf;document.querySelectorAll("[data-vf]").forEach(function(x){var on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-checked",on?"true":"false")});drawCard();return}
  if(T.closest("#vc-share")){shareCard();return}
  if(T.closest("#vc-dl")){cardBlob(function(bl){if(bl)dl(bl)});return}
  if(T.closest("#iv-share")){shareInvite();return}
  if(T.closest("#iv-copy")){copyInvite();return}
  if(T.closest("#bd-save")){saveB();return}
  if(T.closest("#bd-rm")){removeB();return}
  if((b=T.closest("[data-bw]"))){var nm=b.dataset.name;if(window.CHEN_STARTDM)window.CHEN_STARTDM(b.dataset.bw,nm,"Happy birthday "+first(nm)+"! May God bless you abundantly this new year of your life. \uD83C\uDF89");return}
});
document.addEventListener("input",function(e){if(e.target.id==="vc-text"||e.target.id==="vc-ref")soonCard()});
document.addEventListener("change",function(e){if(e.target.id==="bd-m")fillDays()});

var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){
  build();claimRef();
  if(visible("home")){banner();bdCard();if(Date.now()-(STAMP.live||0)>30000)loadLive();if(Date.now()-(STAMP.bd||0)>300000)loadBd()}
  if(visible("golive")){renderLiveAdmin();if(Date.now()-(STAMP.live||0)>8000)loadLive()}
  if(visible("invite")){var l=$("iv-link");if(l)l.textContent=inviteLink();var w=$("iv-wa");if(w)w.href="https://wa.me/?text="+encodeURIComponent(inviteMsg());loadInvite()}
  if(visible("birthday"))loadMyB();
  if(visible("versecard"))drawCard()},40)}
function init(){
  build();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);if(!u){LIVE=null;BD=[];MYB=null;STAMP={}}soon()};
  if(window.MutationObserver&&$("app"))new MutationObserver(function(ms){if(ms.some(function(x){return x.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  document.addEventListener("visibilitychange",function(){if(!document.hidden){STAMP={};soon()}});
  var pv=setInterval(function(){if(me())soon()},1500);setTimeout(function(){clearInterval(pv)},120000);
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
