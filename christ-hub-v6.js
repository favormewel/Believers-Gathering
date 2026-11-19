(function(){
function $(i){return document.getElementById(i)}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function db(){return window.FL_DBC||null}
function me(){return window.FL_USER||null}
function visible(id){var s=$(id);return !!s&&!s.hidden}
var D=30,DATA=null,BUSY=false,STAMP=0;

/* ---------- count each member once per day (no content, just "was here") ---------- */
function trackSeen(){
  var u=me();if(!u||!db())return;
  var day=new Date(Date.now()+10800000).toISOString().slice(0,10);
  try{if(localStorage.getItem("fl-seen-"+u.id)===day)return}catch(e){}
  db().from("daily_seen").upsert({user_id:u.id,day:day},{onConflict:"user_id,day",ignoreDuplicates:true}).then(function(r){
    if(!r.error){try{localStorage.setItem("fl-seen-"+u.id,day)}catch(e){}}},function(){})}

/* ---------- formatting ---------- */
function num(n){n=+n||0;return n>=10000?(n/1000).toFixed(n>=100000?0:1)+"k":String(n)}
function fmt(d){try{var x=new Date(d+"T00:00:00");return x.toLocaleDateString([],{month:"short",day:"numeric"})}catch(e){return d}}
function sum(a){return (a||[]).reduce(function(s,x){return s+(+x.n||0)},0)}
function peak(a){var p=null;(a||[]).forEach(function(x){if(!p||x.n>p.n)p=x});return p}
function pct(a,b){return b>0?Math.round(100*a/b):0}

/* ---------- charts (plain SVG) ---------- */
function bars(series,label,color){
  series=series||[];var W=300,H=84,n=series.length||1,mx=Math.max.apply(null,series.map(function(x){return +x.n||0}).concat([1])),bw=W/n,gap=Math.min(2,bw*.2),p=peak(series);
  var rects=series.map(function(x,i){var h=Math.round((+x.n||0)/mx*(H-4));return '<rect x="'+(i*bw+gap/2).toFixed(1)+'" y="'+(H-h)+'" width="'+Math.max(1,bw-gap).toFixed(1)+'" height="'+Math.max(h,x.n>0?2:0)+'" rx="1.5" fill="'+color+'"/>'}).join("");
  var aria=label+": "+sum(series)+" in total"+(p&&p.n>0?", highest "+p.n+" on "+fmt(p.day):"");
  return '<svg class="an-svg" viewBox="0 0 '+W+' '+(H+1)+'" role="img" aria-label="'+esc(aria)+'" preserveAspectRatio="none"><title>'+esc(aria)+'</title>'+rects+'<line x1="0" y1="'+H+'" x2="'+W+'" y2="'+H+'" stroke="rgba(255,255,255,.18)"/></svg>'+
    '<div class="an-axis"><span>'+esc(series.length?fmt(series[0].day):"")+'</span><span>'+esc(series.length?fmt(series[series.length-1].day):"")+'</span></div>'}
function line(series,label,color){
  series=series||[];var W=300,H=84,n=Math.max(series.length-1,1),mx=Math.max.apply(null,series.map(function(x){return +x.n||0}).concat([1])),p=peak(series);
  var pts=series.map(function(x,i){return (i*W/n).toFixed(1)+","+(H-2-(+x.n||0)/mx*(H-8)).toFixed(1)}).join(" ");
  var aria=label+": highest "+(p?p.n:0)+(p&&p.n>0?" on "+fmt(p.day):"");
  return '<svg class="an-svg" viewBox="0 0 '+W+' '+(H+1)+'" role="img" aria-label="'+esc(aria)+'" preserveAspectRatio="none"><title>'+esc(aria)+'</title><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><line x1="0" y1="'+H+'" x2="'+W+'" y2="'+H+'" stroke="rgba(255,255,255,.18)"/></svg>'+
    '<div class="an-axis"><span>'+esc(series.length?fmt(series[0].day):"")+'</span><span>'+esc(series.length?fmt(series[series.length-1].day):"")+'</span></div>'}
function kpi(l,v,s){return '<div class="an-kpi"><div class="v">'+esc(v)+'</div><div class="l">'+esc(l)+'</div>'+(s?'<div class="s">'+esc(s)+'</div>':"")+'</div>'}
function card(t,body,sub){return '<section class="an-card" aria-label="'+esc(t)+'"><h2>'+esc(t)+'</h2>'+(sub?'<p class="an-sub">'+esc(sub)+'</p>':"")+body+'</section>'}

function render(){
  var box=$("an-body");if(!box)return;
  var s=DATA;if(!s){return}
  var members=+s.members_total||0;
  var h='<div class="an-grid">'+
    kpi("Members",num(members),"+"+num(s.new_7d)+" this week")+
    kpi("New today",num(s.new_today),num(s.new_30d)+" in 30 days")+
    kpi("Active today",num(s.dau),pct(s.dau,members)+"% of members")+
    kpi("Active 7 days",num(s.wau),pct(s.wau,members)+"% of members")+
    kpi("Active 30 days",num(s.mau),pct(s.mau,members)+"% of members")+
    kpi("Stickiness",pct(s.dau,s.mau)+"%","daily / monthly active")+
    kpi("Week-1 return",s.retention_d7==null?"-":s.retention_d7+"%","of new members came back")+
    kpi("Notifications on",pct(s.push_members,members)+"%",num(s.push_members)+" members")+
  '</div>';
  var tracking=sum(s.active)===0?'<p class="an-note">Active-member numbers start counting from the day this update went live. Check back after a few days.</p>':"";
  h+=card("New members per day",bars(s.signups,"New members","#9277F5"),"Last "+s.days+" days");
  h+=card("Members active per day",tracking+line(s.active,"Active members","#FFC83D"));
  h+=card("Posts per day",bars(s.posts,"Posts","#2FBF71"));
  h+=card("Likes and comments per day",bars((s.likes||[]).map(function(x,i){return{day:x.day,n:(+x.n||0)+(+((s.comments||[])[i]||{}).n||0)}}),"Likes and comments","#F0476B"));
  h+=card("Chat per day",bars(s.messages,"Group messages","#3B7BF0"),"Group chat messages. Only counts, never message text.");
  h+='<section class="an-card"><h2>Totals for the last '+s.days+' days</h2><table class="an-tab"><tbody>'+
    [["Posts",sum(s.posts)],["Comments",sum(s.comments)],["Likes",sum(s.likes)],["Group chat messages",sum(s.messages)],["Direct messages",sum(s.dms)],["Posts with photos",s.photos_posts],["Posts with video",s.video_posts]].map(function(r){return '<tr><th scope="row">'+esc(r[0])+'</th><td>'+num(r[1])+'</td></tr>'}).join("")+
    '</tbody></table></section>';
  h+=card("Top posts",(s.top_posts&&s.top_posts.length?'<ol class="an-list">'+s.top_posts.map(function(p){return '<li><b>'+esc(p.author_name||"Member")+'</b><span>'+esc(p.body||"(photo or video)")+'</span><em>'+num(p.likes)+' likes, '+num(p.comments)+' comments</em></li>'}).join("")+'</ol>':'<p class="an-sub">No posts yet in this period.</p>'),"Most liked and commented");
  h+=card("Most active groups",(s.top_groups&&s.top_groups.length?'<ol class="an-list">'+s.top_groups.map(function(g){return '<li><b>'+esc(g.name||"Group")+'</b><span>'+num(g.members)+' members</span><em>'+num(g.messages)+' messages</em></li>'}).join("")+'</ol>':'<p class="an-sub">No group chat activity in this period.</p>'));
  h+=card("Community",'<table class="an-tab"><tbody>'+[["Groups",s.groups_total],["Follows",s.follows_total],["Members with a profile photo",s.avatar_members]].map(function(r){return '<tr><th scope="row">'+esc(r[0])+'</th><td>'+num(r[1])+'</td></tr>'}).join("")+'</tbody></table>');
  h+='<button type="button" class="an-btn" id="an-csv">Download CSV</button><p class="an-foot">Updated '+esc(new Date(s.generated_at).toLocaleString())+'. Days follow Uganda time. Counts only; message text is never read.</p>';
  box.innerHTML=h}

function load(){
  var box=$("an-body");if(!box||BUSY)return;
  if(!db()||!me()){box.innerHTML='<div class="hx-empty">Sign in as an admin to see analytics.</div>';return}
  BUSY=true;STAMP=Date.now();
  if(!DATA||DATA.days!==D)box.innerHTML='<div class="an-load" role="status">Loading analytics...</div>';
  db().rpc("admin_stats",{p_days:D}).then(function(r){
    BUSY=false;
    if(r.error){
      var m=r.error.message||"";
      box.innerHTML='<div class="hx-empty">'+(/admins only/i.test(m)?"Analytics are for admins only.":/function|schema cache|could not find/i.test(m)?"Analytics are not set up yet. Run the analytics SQL in Supabase first.":"Could not load analytics. Please try again.")+'</div>';return}
    DATA=r.data;render()},function(){BUSY=false;box.innerHTML='<div class="hx-empty">Could not load analytics. Please try again.</div>'})}

function csv(){
  if(!DATA)return;
  var s=DATA,rows=[["date","new_members","active_members","posts","comments","likes","group_messages","direct_messages"]];
  (s.signups||[]).forEach(function(x,i){rows.push([x.day,x.n,(s.active[i]||{}).n||0,(s.posts[i]||{}).n||0,(s.comments[i]||{}).n||0,(s.likes[i]||{}).n||0,(s.messages[i]||{}).n||0,(s.dms[i]||{}).n||0])});
  var text=rows.map(function(r){return r.join(",")}).join("\n");
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/csv"}));a.download="chen-network-analytics-"+s.days+"d.csv";document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- screen + entry point ---------- */
function build(){
  if($("analytics")||!$("app"))return;
  var s=document.createElement("section");s.id="analytics";s.hidden=true;
  s.innerHTML='<div class="hx-screen"><header class="hx-top" style="padding-left:8px"><div style="display:flex;align-items:center;gap:2px"><button class="hx-icon" aria-label="Back" data-go="profile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 5l-7 7 7 7"/></svg></button><h1 style="font-size:20px">Analytics</h1></div><button class="hx-icon" id="an-refresh" aria-label="Refresh"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/></svg></button></header>'+
   '<div class="hx-tabs an-range" role="tablist" aria-label="Time range"><button type="button" role="tab" data-anr="7">7 days</button><button type="button" role="tab" class="on" data-anr="30">30 days</button><button type="button" role="tab" data-anr="90">90 days</button></div>'+
   '<div class="hx-scroll" data-scroll style="padding-top:0"><div id="an-body"></div></div></div>';
  $("app").appendChild(s);
  var ep=document.querySelector('#profile button[data-go="editprofile"]');
  if(ep&&!$("hx-an-row")){var r=ep.cloneNode(true);r.id="hx-an-row";r.setAttribute("data-go","analytics");r.querySelector("span").textContent="Analytics";r.hidden=!window.FL_IS_ADMIN;ep.parentNode.insertBefore(r,ep)}}
function syncRow(){var r=$("hx-an-row");if(r)r.hidden=!window.FL_IS_ADMIN}

document.addEventListener("click",function(e){
  var T=e.target,b;
  if((b=T.closest("[data-anr]"))){D=+b.dataset.anr;document.querySelectorAll("[data-anr]").forEach(function(x){var on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-selected",on?"true":"false")});DATA=null;load();return}
  if(T.closest("#an-refresh")){load();return}
  if(T.closest("#an-csv")){csv();return}
});
var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){
  build();syncRow();trackSeen();
  if(visible("analytics")&&Date.now()-STAMP>20000)load()},40)}
function init(){
  build();
  var po=window.FL_ONAUTH;window.FL_ONAUTH=function(u){if(po)po(u);if(!u){DATA=null;STAMP=0}soon()};
  if(window.MutationObserver&&$("app"))new MutationObserver(function(ms){if(ms.some(function(x){return x.target.tagName==="SECTION"}))soon()}).observe($("app"),{attributes:true,attributeFilter:["hidden"],subtree:true});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)soon()});
  var pv=setInterval(function(){if(me()){soon()}},1500);setTimeout(function(){clearInterval(pv)},120000);
  soon()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
