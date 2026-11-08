(function(){
var SYS="system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif";
var RAW="GEN|Genesis|50|Law,EXO|Exodus|40|Law,LEV|Leviticus|27|Law,NUM|Numbers|36|Law,DEU|Deuteronomy|34|Law,JOS|Joshua|24|History,JDG|Judges|21|History,RUT|Ruth|4|History,1SA|1 Samuel|31|History,2SA|2 Samuel|24|History,1KI|1 Kings|22|History,2KI|2 Kings|25|History,1CH|1 Chronicles|29|History,2CH|2 Chronicles|36|History,EZR|Ezra|10|History,NEH|Nehemiah|13|History,EST|Esther|10|History,JOB|Job|42|Wisdom and poetry,PSA|Psalms|150|Wisdom and poetry,PRO|Proverbs|31|Wisdom and poetry,ECC|Ecclesiastes|12|Wisdom and poetry,SNG|Song of Solomon|8|Wisdom and poetry,ISA|Isaiah|66|Major prophets,JER|Jeremiah|52|Major prophets,LAM|Lamentations|5|Major prophets,EZK|Ezekiel|48|Major prophets,DAN|Daniel|12|Major prophets,HOS|Hosea|14|Minor prophets,JOL|Joel|3|Minor prophets,AMO|Amos|9|Minor prophets,OBA|Obadiah|1|Minor prophets,JON|Jonah|4|Minor prophets,MIC|Micah|7|Minor prophets,NAM|Nahum|3|Minor prophets,HAB|Habakkuk|3|Minor prophets,ZEP|Zephaniah|3|Minor prophets,HAG|Haggai|2|Minor prophets,ZEC|Zechariah|14|Minor prophets,MAL|Malachi|4|Minor prophets,MAT|Matthew|28|Gospels,MRK|Mark|16|Gospels,LUK|Luke|24|Gospels,JHN|John|21|Gospels,ACT|Acts|28|History,ROM|Romans|16|Letters of Paul,1CO|1 Corinthians|16|Letters of Paul,2CO|2 Corinthians|13|Letters of Paul,GAL|Galatians|6|Letters of Paul,EPH|Ephesians|6|Letters of Paul,PHP|Philippians|4|Letters of Paul,COL|Colossians|4|Letters of Paul,1TH|1 Thessalonians|5|Letters of Paul,2TH|2 Thessalonians|3|Letters of Paul,1TI|1 Timothy|6|Letters of Paul,2TI|2 Timothy|4|Letters of Paul,TIT|Titus|3|Letters of Paul,PHM|Philemon|1|Letters of Paul,HEB|Hebrews|13|General letters,JAS|James|5|General letters,1PE|1 Peter|5|General letters,2PE|2 Peter|3|General letters,1JN|1 John|5|General letters,2JN|2 John|1|General letters,3JN|3 John|1|General letters,JUD|Jude|1|General letters,REV|Revelation|22|Prophecy";
var BOOKS=RAW.split(",").map(function(r){var p=r.split("|");return{id:p[0],name:p[1],ch:+p[2],grp:p[3]}});
var TRS=[["kjv","King James Version","KJV"],["web","World English Bible","WEB"],["asv","American Standard Version","ASV"],["bbe","Bible in Basic English","BBE"],["darby","Darby Bible","Darby"]];
var ALIAS={ps:"PSA",psalm:"PSA",jn:"JHN",mt:"MAT",mk:"MRK",lk:"LUK",rev:"REV",revelations:"REV",song:"SNG",sos:"SNG",songofsongs:"SNG",phil:"PHP",php:"PHP",jam:"JAS",jas:"JAS",jude:"JUD",jud:"JUD",gen:"GEN",ex:"EXO",deut:"DEU",num:"NUM",lev:"LEV",rom:"ROM",gal:"GAL",eph:"EPH",col:"COL",heb:"HEB",prov:"PRO",eccl:"ECC",isa:"ISA",jer:"JER",ezek:"EZK",dan:"DAN",matt:"MAT"};
var VOTD=["Psalm 23:1","John 3:16","Jeremiah 29:11","Philippians 4:13","Proverbs 3:5-6","Romans 8:28","Isaiah 41:10","Joshua 1:9","Matthew 11:28","Psalm 46:1","Romans 12:2","2 Timothy 1:7","Psalm 119:105","Galatians 5:22-23","Hebrews 11:1","Ephesians 2:8-9","Matthew 6:33","Psalm 27:1","Isaiah 40:31","John 14:6","Romans 5:8","1 John 4:19","Psalm 91:1-2","Lamentations 3:22-23","Micah 6:8","Colossians 3:23","James 1:5","1 Peter 5:7","Revelation 21:4","Numbers 6:24-26","Psalm 121:1-2"];
function norm(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,"")}
function idx(id){for(var i=0;i<BOOKS.length;i++)if(BOOKS[i].id===id)return i;return -1}
function findBook(q){var n=norm(q);if(!n)return -1;if(ALIAS[n])return idx(ALIAS[n]);var i;
  for(i=0;i<BOOKS.length;i++)if(norm(BOOKS[i].name)===n||BOOKS[i].id.toLowerCase()===n)return i;
  for(i=0;i<BOOKS.length;i++)if(norm(BOOKS[i].name).indexOf(n)===0)return i;return -1}
function parseRef(q){var m=String(q).trim().match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s*(?:(\d+)(?:\s*[:.]\s*(\d+)(?:\s*[-\u2013]\s*(\d+))?)?)?$/);if(!m)return null;
  var b=findBook(m[1]);if(b<0)return null;return{b:b,ch:m[2]?+m[2]:0,v1:m[3]?+m[3]:0,v2:m[4]?+m[4]:0}}
window.FLB={BOOKS:BOOKS,parseRef:parseRef,findBook:findBook,VOTD:VOTD};
if(typeof document==="undefined"||!document.getElementById("bb-list"))return;
var cfg=window.FAITHLINK_CONFIG||{},base=(cfg.BIBLE_BASE_URL||"").replace(/\/$/,"");
function $(i){return document.getElementById(i)}
function ls(k,v){try{if(v===undefined){var s=localStorage.getItem(k);return s?JSON.parse(s):null}localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function esc(t){var d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML}
var S={tr:ls("flb-tr")||"kjv",tab:"ALL",b:0,c:1,sel:{},fs:ls("flb-fs")||15},HL=ls("flb-hl")||{},BM=ls("flb-bm")||[],mem={};
function trName(c){for(var i=0;i<TRS.length;i++)if(TRS[i][0]===c)return TRS[i]; return TRS[0]}
function key(b,c,v){return BOOKS[b].id+"."+c+"."+v}
function clean(t){return String(t).replace(/\s+/g," ").replace(/^\u00b6\s*/,"").trim()}
// ---- data
function getChapter(tr,b,c){
  var ck="flb:"+tr+":"+BOOKS[b].id+":"+c,hit=mem[ck]||ls(ck);if(hit)return Promise.resolve(hit);
  var p;
  if(base){p=(mem["bk:"+tr+b]||(mem["bk:"+tr+b]=fetch(base+"/"+tr+"/"+BOOKS[b].id+".json").then(function(r){if(!r.ok)throw new Error("err");return r.json()}))).then(function(j){if(!j[c])throw new Error("err");return j[c]})}
  else p=fetch("https://bible-api.com/"+encodeURIComponent(BOOKS[b].name+" "+c)+"?translation="+tr+"&single_chapter_book_matching=indifferent").then(function(r){if(r.status===429)throw new Error("busy");if(!r.ok)throw new Error("err");return r.json()}).then(function(j){return j.verses.map(function(v){return[v.verse,clean(v.text)]})});
  return p.then(function(vs){mem[ck]=vs;ls(ck,vs);return vs})}
// ---- home
function rowHTML(i){var b=BOOKS[i];return '<button data-book="'+i+'" style="display:flex;justify-content:space-between;align-items:center;width:100%;min-height:52px;padding:0 20px;border:0;border-bottom:1px solid #F0E2C8;background:#FFFAF2;font:600 13px '+SYS+';color:#222;text-align:left"><span>'+esc(b.name)+'</span><span style="font-size:12px;color:#6B6055;font-weight:400">'+b.ch+' chapter'+(b.ch>1?'s':'')+' &rsaquo;</span></button>'}
function gh(t){return '<div style="padding:14px 20px 6px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#6B6055;background:#FDF3E3">'+esc(t)+'</div>'}
function renderList(){
  var l=$("bb-list"),q=$("bb-search").value.trim(),h="",last="";
  if(S.tab==="SV"){
    if(!BM.length){l.innerHTML='<div style="padding:24px 20px;color:#6B6055;font-size:13px">No saved verses yet. Open a chapter, tap a verse, then tap Bookmark.</div>';return}
    l.innerHTML=BM.map(function(m,i){return '<div style="display:flex;align-items:center;gap:8px;padding:10px 8px 10px 20px;background:#FFFAF2;border-bottom:1px solid #F0E2C8"><button data-bm="'+i+'" style="flex:1;min-width:0;border:0;background:none;text-align:left;font-family:'+SYS+';color:#222"><b style="font-size:13px">'+esc(m.ref)+'</b><div style="font-size:12px;color:#6B6055;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(m.t)+'</div></button><button data-bmdel="'+i+'" aria-label="Remove bookmark" style="width:44px;height:44px;border:0;background:none;font-size:15px;color:#6B6055">&times;</button></div>'}).join("");return}
  var f=/\d/.test(q)?"":norm(q);
  BOOKS.forEach(function(b,i){var nt=i>=39;if(S.tab!=="ALL"&&(S.tab==="NT")!==nt&&!f)return;if(f&&norm(b.name).indexOf(f)<0)return;
    var g=(nt?"New Testament \u00b7 ":"Old Testament \u00b7 ")+b.grp;if(g!==last){h+=gh(g);last=g}h+=rowHTML(i)});
  l.innerHTML=h||'<div style="padding:24px 20px;color:#6B6055;font-size:13px">No book matches that. Try a name like John, or a reference like Romans 8:28.</div>'}
function setTabs(){document.querySelectorAll("[data-bt]").forEach(function(b){var on=b.dataset.bt===S.tab;b.style.background=on?"#E2B04E":"#DAD3C8";b.style.color=on?"#222":"#6B6055"})}
function setChips(){var t=trName(S.tr)[2];["bb-tr","rd-tr"].forEach(function(i){var e=$(i);if(e)e.textContent=t+" \u25be"})}
function votd(){
  var r=parseRef(VOTD[new Date().getDate()%VOTD.length]),t=$("bb-votd-text"),rf=$("bb-votd-ref");if(!r||!t)return;
  getChapter(S.tr,r.b,r.ch).then(function(vs){var a=r.v1,z=r.v2||r.v1,txt=vs.filter(function(v){return v[0]>=a&&v[0]<=z}).map(function(v){return v[1]}).join(" ");
    t.textContent="\u201c"+txt+"\u201d";rf.textContent=BOOKS[r.b].name+" "+r.ch+":"+a+(r.v2?"-"+r.v2:"")+" ("+trName(S.tr)[2]+")";window.FLB.votd={text:txt,ref:rf.textContent}}).catch(function(){t.textContent="Open any book below to start reading.";rf.textContent=""})}
function cont(){var l=ls("flb-last")||{b:18,c:23},e=$("bb-cont-name");if(e)e.textContent=BOOKS[l.b].name+" "+l.c}
// ---- chapters + reader
function openBook(i){S.b=i;var b=BOOKS[i];$("bk-title").textContent=b.name;$("bk-sub").textContent=(i<39?"Old Testament":"New Testament")+" \u00b7 "+b.grp+" \u00b7 "+b.ch+" chapter"+(b.ch>1?"s":"");
  var h="";for(var c=1;c<=b.ch;c++)h+='<button data-ch="'+c+'" style="min-height:52px;border:1px solid #F0E2C8;border-radius:14px;background:#FFFAF2;font:700 14px '+SYS+';color:#222">'+c+'</button>';
  $("bk-grid").innerHTML=h;show("chapters")}
function msg(t,retry){return '<div style="padding:24px 4px;color:#6B6055;font-size:13px;font-family:'+SYS+'">'+esc(t)+(retry?' <button data-retry style="min-height:44px;padding:0 16px;margin-top:8px;border:0;border-radius:22px;background:#E2B04E;color:#222;font:700 13px '+SYS+';display:block">Try again</button>':"")+'</div>'}
function openChapter(b,c,v){
  S.b=b;S.c=c;S.sel={};selBar();ls("flb-last",{b:b,c:c});cont();
  $("rd-title").textContent=BOOKS[b].name+" "+c;$("rd-text").innerHTML=msg("Loading\u2026");show("reader");setChips();
  getChapter(S.tr,b,c).then(function(vs){S.vs=vs;drawVerses();if(v){var p=document.querySelector('#rd-text [data-v="'+v+'"]');if(p){S.sel[v]=1;drawVerses();selBar();p=document.querySelector('#rd-text [data-v="'+v+'"]');if(p)p.scrollIntoView({block:"center"})}}})
  .catch(function(e){$("rd-text").innerHTML=msg(e&&e.message==="busy"?"Too many requests right now. Please wait a few seconds.":"Could not load this chapter. Check your internet connection.",1)})}
function drawVerses(){
  $("rd-text").innerHTML=(S.vs||[]).map(function(v){var k=key(S.b,S.c,v[0]),bg=S.sel[v[0]]?"#DCE6FF":(HL[k]?"#F8E19B":"transparent");
    return '<p data-v="'+v[0]+'" style="margin:0 0 6px;padding:6px 8px;border-radius:10px;background:'+bg+';font:500 '+S.fs+'px/1.65 Lora,serif;color:#222"><sup style="font:700 11px '+SYS+';color:#A06A0E;margin-right:6px">'+v[0]+'</sup>'+esc(v[1])+'</p>'}).join("")}
function selNums(){return Object.keys(S.sel).map(Number).sort(function(a,b){return a-b})}
function selBar(){var s=$("rd-sel");if(s)s.hidden=!selNums().length}
function refText(){var n=selNums(),ref=BOOKS[S.b].name+" "+S.c+":",con=true;for(var i=1;i<n.length;i++)if(n[i]!==n[i-1]+1)con=false;
  ref+=n.length>1&&con?n[0]+"-"+n[n.length-1]:n.join(",");return ref+" ("+trName(S.tr)[2]+")"}
function selTextOnly(){var n=selNums();return S.vs.filter(function(v){return n.indexOf(+v[0])>=0}).map(function(v){return v[1]}).join(" ")}
function step(d){var b=S.b,c=S.c+d;if(c<1){if(b===0)return;b--;c=BOOKS[b].ch}else if(c>BOOKS[b].ch){if(b===BOOKS.length-1)return;b++;c=1}openChapter(b,c)}
// ---- translation sheet
function trSheet(){var s=$("tr-sheet");if(!s){s=document.createElement("div");s.id="tr-sheet";s.hidden=true;s.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(43,33,24,.45);display:flex;align-items:flex-end;justify-content:center;z-index:50";document.body.appendChild(s)}
  s.innerHTML='<div style="width:100%;max-width:430px;background:#fff;border-radius:24px 24px 0 0;padding:12px 20px 28px;box-sizing:border-box;font-family:'+SYS+'"><div style="width:40px;height:4px;border-radius:2px;background:#D5CCBE;margin:0 auto 12px"></div><b style="font-size:15px">Translation</b>'+TRS.map(function(t){return '<button data-tr="'+t[0]+'" style="display:flex;justify-content:space-between;align-items:center;width:100%;min-height:52px;border:0;border-bottom:1px solid #F0E2C8;background:none;font:600 13px '+SYS+';color:#222;text-align:left"><span>'+t[1]+' ('+t[2]+')</span><span style="color:#A06A0E">'+(t[0]===S.tr?"\u2713":"")+'</span></button>'}).join("")+'</div>';
  s.hidden=false}
// ---- events
document.addEventListener("click",function(e){var t=e.target,x;
  if(t.id==="tr-sheet"){t.hidden=true;return}
  if((x=t.closest("[data-trsheet]"))){trSheet();return}
  if((x=t.closest("[data-tr]"))){S.tr=x.dataset.tr;ls("flb-tr",S.tr);$("tr-sheet").hidden=true;setChips();votd();if($("reader")&&!$("reader").hidden)openChapter(S.b,S.c);return}
  if((x=t.closest("[data-bt]"))){S.tab=x.dataset.bt;setTabs();renderList();return}
  if((x=t.closest("[data-book]"))){openBook(+x.dataset.book);return}
  if((x=t.closest("[data-ch]"))){openChapter(S.b,+x.dataset.ch);return}
  if((x=t.closest("[data-bm]"))){var m=BM[+x.dataset.bm];openChapter(m.b,m.c,m.v);return}
  if((x=t.closest("[data-bmdel]"))){BM.splice(+x.dataset.bmdel,1);ls("flb-bm",BM);renderList();return}
  if(t.closest("[data-cont]")){var l=ls("flb-last")||{b:18,c:23};openChapter(l.b,l.c);return}
  if(t.closest("[data-retry]")){openChapter(S.b,S.c);return}
  if(t.closest("#rd-prev")){step(-1);return}
  if(t.closest("#rd-next")){step(1);return}
  if(t.closest("#rd-fsm")||t.closest("#rd-fsp")){S.fs=Math.max(13,Math.min(26,S.fs+(t.closest("#rd-fsp")?1:-1)));ls("flb-fs",S.fs);drawVerses();return}
  if((x=t.closest("#rd-text [data-v]"))){var v=x.dataset.v;if(S.sel[v])delete S.sel[v];else S.sel[v]=1;drawVerses();selBar();return}
  if(t.closest("#bb-votd-share")){var vt=window.FLB.votd;if(vt&&window.FL_SHARE&&window.FL_SHARE(vt.text,vt.ref))show("chat");else if(vt)alert("Open a group chat first, then share the verse.");return}
  if((x=t.closest("[data-bact]"))){var a=x.dataset.bact,n=selNums();if(!n.length)return;
    if(a==="copy"){var tx=refText()+"\n"+selTextOnly();if(navigator.clipboard)navigator.clipboard.writeText(tx).catch(function(){});x.lastChild.textContent="Copied";setTimeout(function(){x.lastChild.textContent="Copy"},1500)}
    else if(a==="hl"){var all=n.every(function(v){return HL[key(S.b,S.c,v)]});n.forEach(function(v){if(all)delete HL[key(S.b,S.c,v)];else HL[key(S.b,S.c,v)]=1});ls("flb-hl",HL);S.sel={};drawVerses();selBar()}
    else if(a==="bm"){n.forEach(function(v){var k=key(S.b,S.c,v),i=-1;BM.forEach(function(m,j){if(m.k===k)i=j});if(i<0){var tv=S.vs.filter(function(q){return +q[0]===v})[0][1];BM.unshift({k:k,b:S.b,c:S.c,v:v,ref:BOOKS[S.b].name+" "+S.c+":"+v,t:tv})}});ls("flb-bm",BM);x.lastChild.textContent="Saved";setTimeout(function(){x.lastChild.textContent="Bookmark"},1500)}
    else if(a==="share"){if(window.FL_SHARE&&window.FL_SHARE(selTextOnly(),refText())){S.sel={};drawVerses();selBar();show("chat")}else alert("Open a group chat first, then share the verse.")}}});
document.addEventListener("input",function(e){if(e.target.id==="bb-search"){$("bb-msg").textContent="";renderList()}});
document.addEventListener("keydown",function(e){if(e.key!=="Enter"||e.target.id!=="bb-search")return;
  var r=parseRef(e.target.value);if(!r){$("bb-msg").textContent="I could not find that book. Try John 3:16 or Psalm 23.";return}
  if(r.ch>BOOKS[r.b].ch){$("bb-msg").textContent=BOOKS[r.b].name+" has only "+BOOKS[r.b].ch+" chapters.";return}
  if(r.ch){e.target.value="";renderList();openChapter(r.b,r.ch,r.v1)}else{e.target.value="";openBook(r.b)}});
(function(){var t0=document.querySelector('[data-bt="OT"]');if(t0&&!document.querySelector('[data-bt="ALL"]')){var c=t0.cloneNode(true);c.setAttribute("data-bt","ALL");c.textContent="All 66";t0.parentNode.insertBefore(c,t0)}})();
window.FLB.resume=function(){var l=ls("flb-last");if(l)openChapter(l.b,l.c);else show("bible")};
setChips();setTabs();renderList();votd();cont();
})();
