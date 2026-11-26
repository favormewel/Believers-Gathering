/* v11: showcase-style 6-tab bar (Home, Discover, Create, Bible, Groups, Profile). Routing still uses data-go + window.show. */
(function(){
var MAP={home:"home",updates:"home",
messages:"messages",dm:"messages",newdm:"messages",
newpost:"create",myposts:"create",
bible:"bible",chapters:"bible",reader:"bible",
profile:"profile",editprofile:"profile",settings:"profile",appsettings:"profile",
explore:"x",nearby:"x",newevent:"x",groups:"x",chat:"x",info:"x",newgroup:"x",members:"x",pinned:"x",notifications:"x",menu:"x"};
function cur(){var s=document.querySelectorAll("#app section");for(var i=0;i<s.length;i++){if(!s[i].hidden&&MAP[s[i].id])return MAP[s[i].id]}return ""}
var busy=0;
function sync(){busy=0;var t=cur();if(!t)return;
document.querySelectorAll("nav.hx-nav button").forEach(function(b){var on=b.dataset.tab===t;b.classList.toggle("on",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
function queue(){if(!busy){busy=1;requestAnimationFrame(sync)}}
new MutationObserver(queue).observe(document.getElementById("app")||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["hidden"]});
document.addEventListener("click",function(e){if(e.target.closest("nav.hx-nav"))setTimeout(sync,60)});
function place(){var f=document.getElementById("hx-feed"),c=document.querySelector("#home .hx-cmp");
if(!f||!c||f.dataset.moved)return;var h=f.previousElementSibling;
if(h&&h.classList.contains("hx-sec")){c.after(h);h.after(f)}else c.after(f);f.dataset.moved="1"}
function lab(){var m={groups:"My Communities",myposts:"My Posts",appsettings:"Settings"};
Object.keys(m).forEach(function(k){var l=document.querySelector('#menu .mn-t[data-go="'+k+'"] .lb');if(l&&l.textContent!==m[k])l.textContent=m[k]})}
function av(){place();lab();var a=document.getElementById("hx-av"),c=document.getElementById("cmp-av");if(a&&c&&a.textContent)c.textContent=a.textContent}
setInterval(av,1500);av();place();sync();
})();
