(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function toast(m){var t=$("hx-toast");if(!t){t=document.createElement("div");t.id="hx-toast";t.setAttribute("role","status");t.setAttribute("aria-live","polite");document.body.appendChild(t)}
  t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove("on")},3200)}

var EMO=["\uD83D\uDC4D","\u2764\uFE0F","\uD83D\uDE4F","\uD83D\uDD25","\uD83D\uDE02","\uD83D\uDE2E"];
var EL=["Thumbs up","Heart","Praying hands","Fire","Laughing","Surprised"];
var RX={},LOADED={},RXOFF=false,REPLY=null,CH=null,obsFor=null;

/* ---------- replies ---------- */
function barEl(){
  var b=$("rp-bar");if(b)return b;
  var inp=$("msg");if(!inp)return null;var lab=inp.closest("label");if(!lab)return null;
  lab.insertAdjacentHTML("beforebegin",'<div id="rp-bar" hidden><div class="rt"><b id="rp-who"></b><span id="rp-pre"></span></div><button type="button" id="rp-x" aria-label="Cancel reply">&times;</button></div>');
  return $("rp-bar")}
function setReply(r){
  REPLY=r;var b=barEl();if(!b)return;
  if(!r){b.hidden=true;return}
  $("rp-who").textContent="Replying to "+r.name;$("rp-pre").textContent=r.preview;b.hidden=false;
  var i=$("msg");if(i)i.focus()}
function previewOf(el){
  var k=el.dataset.kind||"text",t=el.dataset.text||"";
  if(k==="image")return "Photo";if(k==="voice")return "Voice note";if(k==="file")return t||"File";
  return t.replace(/\s+/g," ").slice(0,100)}
window.CHEN_TAKEREPLY=function(){
  if(!REPLY)return null;
  var r={reply_to:REPLY.id,reply_preview:(REPLY.name+": "+REPLY.preview).slice(0,140)};
  setReply(null);return r};

/* ---------- reactions ---------- */
function mineOf(mid){var o=RX[mid]||{};return Object.keys(o).filter(function(e){return o[e].mine})}
function paint(mid){
  var box=document.querySelector('#msgs .rx[data-rxfor="'+mid+'"]');if(!box)return;
  var o=RX[mid]||{},html="";
  EMO.forEach(function(e,i){var x=o[e];if(x&&x.n>0)html+='<button type="button" class="rxc'+(x.mine?" mine":"")+'" data-rxe="'+i+'" data-rxm="'+esc(mid)+'" aria-pressed="'+(x.mine?"true":"false")+'" aria-label="'+EL[i]+', '+x.n+(x.mine?', you reacted':'')+'">'+e+' '+x.n+'</button>'});
  box.innerHTML=html}
function add(mid,e,n,mine){var o=RX[mid]=RX[mid]||{};var x=o[e]=o[e]||{n:0,mine:false};x.n=Math.max(0,x.n+n);if(mine!==undefined)x.mine=mine;if(x.n===0)delete o[e]}
function toggle(mid,i){
  var e=EMO[i];if(!db()||!me()||!mid)return;
  var on=!!(RX[mid]&&RX[mid][e]&&RX[mid][e].mine);
  add(mid,e,on?-1:1,!on);paint(mid);
  var q=on?db().from("message_reactions").delete().eq("message_id",mid).eq("user_id",me().id).eq("emoji",e):db().from("message_reactions").insert({message_id:mid,user_id:me().id,emoji:e});
  q.then(function(r){if(r.error){add(mid,e,on?1:-1,on);paint(mid);toast("Could not react. Run the chat SQL in Supabase first.")}},function(){add(mid,e,on?1:-1,on);paint(mid)})}
var tL=null;
function loadVisible(){
  if(RXOFF||!db()||!me())return;
  var els=Array.prototype.slice.call(document.querySelectorAll("#msgs [data-mid]")).filter(function(x){return x.dataset.mid&&!LOADED[x.dataset.mid]});
  if(!els.length)return;
  var ids=els.map(function(x){return x.dataset.mid});ids.forEach(function(i){LOADED[i]=1});
  for(var k=0;k<ids.length;k+=100)(function(chunk){
    db().from("message_reactions").select("message_id,user_id,emoji").in("message_id",chunk).then(function(r){
      if(r.error){RXOFF=true;chunk.forEach(function(i){delete LOADED[i]});return}
      chunk.forEach(function(i){RX[i]={}});
      (r.data||[]).forEach(function(x){add(x.message_id,x.emoji,1,x.user_id===me().id?true:undefined)});
      chunk.forEach(paint)},function(){chunk.forEach(function(i){delete LOADED[i]})})})(ids.slice(k,k+100))}
function repaint(){Array.prototype.forEach.call(document.querySelectorAll("#msgs .rx"),function(b){if(!b.firstChild&&b.dataset.rxfor&&RX[b.dataset.rxfor])paint(b.dataset.rxfor)})}
function soon(){clearTimeout(tL);tL=setTimeout(function(){repaint();loadVisible()},150)}
function watch(){
  var box=$("msgs");if(!box||obsFor===box)return;obsFor=box;
  new MutationObserver(soon).observe(box,{childList:true})}
function listen(){
  var d=db();
  if(!me()){if(CH&&d&&d.removeChannel){try{d.removeChannel(CH)}catch(e){}}CH=null;return}
  if(CH||!d||!d.channel)return;
  CH=d.channel("fl-reactions")
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"message_reactions"},function(p){change(p.new,1)})
   .on("postgres_changes",{event:"DELETE",schema:"public",table:"message_reactions"},function(p){change(p.old,-1)}).subscribe()}
function change(x,n){
  if(!x||!x.message_id||!x.emoji||!LOADED[x.message_id]||!me())return;
  var mineEv=x.user_id===me().id,cur=RX[x.message_id]&&RX[x.message_id][x.emoji];
  if(mineEv){if(n>0&&cur&&cur.mine)return;if(n<0&&!(cur&&cur.mine))return}
  if(mineEv)add(x.message_id,x.emoji,n,n>0);else add(x.message_id,x.emoji,n);
  paint(x.message_id)}

/* ---------- long-press sheet additions (called by the existing message menu) ---------- */
window.CHEN_MSGEXTRA=function(el){
  if(!el||!el.dataset.mid)return "";
  var mid=el.dataset.mid,mine=mineOf(mid),h="";
  if(!RXOFF&&db()){
    h+='<div role="group" aria-label="React" style="display:flex;justify-content:space-between;gap:4px;padding:6px 0 10px">';
    EMO.forEach(function(e,i){var on=mine.indexOf(e)>-1;h+='<button type="button" data-react="'+i+'" aria-label="'+EL[i]+'" aria-pressed="'+(on?"true":"false")+'" style="width:48px;height:48px;border:0;border-radius:24px;background:'+(on?"#E3DAFF":"#F3EEE6")+';font-size:24px;line-height:1">'+e+'</button>'});
    h+='</div>'}
  h+='<button type="button" data-ma="reply" style="display:block;width:100%;min-height:50px;border:0;border-bottom:1px solid #F0E2C8;background:none;text-align:left;font:600 15px system-ui,-apple-system,Roboto,Arial,sans-serif;color:#222">Reply</button>';
  return h};
function sheetOf(n){while(n&&!n._m)n=n.parentNode;return n}

document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest&&T.closest("[data-react]"))){
    var sh=sheetOf(b);if(sh&&sh._m){e.stopPropagation();var mid=sh._m.dataset.mid;sh.hidden=true;toggle(mid,+b.dataset.react)}return}
  if((b=T.closest&&T.closest('[data-ma="reply"]'))){
    var sh2=sheetOf(b);if(sh2&&sh2._m){e.stopPropagation();var el=sh2._m;sh2.hidden=true;
      setReply({id:el.dataset.mid,name:el.dataset.name||"Member",preview:previewOf(el)})}return}
  if(T.closest&&T.closest("#rp-x")){setReply(null);return}
  if((b=T.closest&&T.closest(".rxc"))){e.stopPropagation();toggle(b.dataset.rxm,+b.dataset.rxe);return}
  if((b=T.closest&&T.closest(".rq"))){
    e.stopPropagation();var id=b.dataset.rto,t=id&&document.querySelector('#msgs [data-mid="'+id+'"]');
    if(t){t.scrollIntoView({block:"center",behavior:"smooth"});t.classList.add("hl");setTimeout(function(){t.classList.remove("hl")},1600)}else toast("The original message is no longer shown.");return}
},true);

function init(){
  watch();listen();soon();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);if(!u){RX={};LOADED={};RXOFF=false}listen();soon()};
  if(window.MutationObserver&&$("app"))new MutationObserver(function(ms){
    if(ms.some(function(x){return x.target.id==="chat"})){watch();barEl();if($("chat")&&$("chat").hidden)setReply(null);soon()}}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  var pv=setInterval(function(){if(me()){listen();watch();soon()}},1500);setTimeout(function(){clearInterval(pv)},120000)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
