(function(){
function $(i){return document.getElementById(i)}
var MQ=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
function pref(){try{return localStorage.getItem("fl-theme")||"light"}catch(e){return "light"}}
function eff(p){return p==="auto"?(MQ&&MQ.matches?"dark":"light"):(p==="dark"?"dark":"light")}
function sync(){
  var p=pref();
  document.querySelectorAll("[data-theme-set]").forEach(function(b){b.setAttribute("aria-checked",b.dataset.themeSet===p?"true":"false")})}
function apply(p){
  var e=eff(p),h=document.documentElement;
  h.setAttribute("data-theme",e);h.setAttribute("data-theme-pref",p);
  var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",e==="light"?"#F3F4F8":"#0B1026");
  sync()}
function set(p){try{localStorage.setItem("fl-theme",p)}catch(e){}apply(p)}
function build(){
  var sc=document.querySelector("#appsettings [data-scroll]");
  if(!sc||$("thm"))return;
  sc.insertAdjacentHTML("afterbegin",'<div class="thm-h" id="thm-h">Appearance</div><div class="thm" id="thm" role="radiogroup" aria-labelledby="thm-h"><button type="button" role="radio" data-theme-set="light" aria-checked="false">Light</button><button type="button" role="radio" data-theme-set="dark" aria-checked="false">Dark</button><button type="button" role="radio" data-theme-set="auto" aria-checked="false">Auto</button></div>');
  sync()}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-theme-set]");if(b)set(b.dataset.themeSet)});
if(MQ&&MQ.addEventListener)MQ.addEventListener("change",function(){if(pref()==="auto")apply("auto")});
function init(){build();apply(pref())}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
