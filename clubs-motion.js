/* Entrada única y aislada del bloque Talleres y Clubes. */
(() => {
  'use strict';
  const section = document.querySelector('#talleres.clubs-editorial');
  if (!section || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const photo = section.querySelector('.clubs-photo');
  const home = section.closest('[data-view="home"]');
  const running = new Set();
  let played = false;
  function reveal(node, frames, delay) {
    if (!node) return;
    const animation = node.animate(frames, {duration:700,delay,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'});
    running.add(animation);
    animation.onfinish = () => {running.delete(animation);animation.cancel();};
    animation.oncancel = () => running.delete(animation);
  }
  function enter() {
    if (played || home?.hidden) return;
    played = true;
    observer.disconnect();
    if (reduced.matches) return;
    const mobile = matchMedia('(max-width: 900px)').matches;
    reveal(photo,[{opacity:.25,transform:`scale(${mobile ? 1.008 : 1.02})`},{opacity:1,transform:'scale(1)'}],0);
    const frames=[{opacity:0,transform:'translate3d(0,8px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}];
    ['.eyebrow','h2','p','.primary'].forEach((selector,i)=>reveal(section.querySelector(selector),frames,180+i*90));
  }
  const observer = new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)) enter();
  },{threshold:.12});
  observer.observe(section);
  function settle(){[...running].forEach(animation=>animation.cancel());}
  window.addEventListener('tc:viewchange',settle);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
  reduced.addEventListener?.('change',()=>{if(reduced.matches)settle();});
})();
