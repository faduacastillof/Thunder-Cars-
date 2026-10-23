/* Primera prueba. No modifica productos, rutas, Comunidad ni diálogos. */
(() => {
  'use strict';
  const home = document.querySelector('[data-view="home"]');
  if (!home || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 900px)');
  const desktop = matchMedia('(min-width: 901px) and (hover: hover)');
  const device = window.navigator || {};
  const lowPower = !!device.connection?.saveData || (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) || (device.deviceMemory > 0 && device.deviceMemory <= 2);
  const hero = document.querySelector('[data-view="home"] .hero');
  const heroCopy = document.querySelector('[data-view="home"] .hero-copy');
  const favorites = document.getElementById('favoritos');
  const launch = document.getElementById('nueva-linea-tc');
  const launchMedia = document.querySelector('#nueva-linea-tc .tc-launch-media');
  const launchImage = document.querySelector('#nueva-linea-tc .tc-launch-media img');
  const cards = [...document.querySelectorAll('#favoritos .favorite-card')].slice(0,4);
  const played = new WeakSet();
  const animations = new Set();
  const effects = new Map();
  const inView = new Set();
  let frame = null;
  const enabled = () => !reduced.matches;
  function reveal(element, options = {}) {
    if (!element || !enabled()) return;
    const quiet = mobile.matches || lowPower;
    const x = quiet ? 0 : options.x || 0;
    const y = quiet ? Math.min(options.y || 10,8) : options.y || 12;
    const blur = quiet ? 0 : options.blur || 0;
    const keyframes = [
      {opacity:options.dark ? .22 : 0,transform:`translate3d(${x}px,${y}px,0) scale(${options.scale || 1})`,filter:blur ? `blur(${blur}px)` : 'none'},
      {opacity:1,transform:'translate3d(0,0,0) scale(1)',filter:'none'}
    ];
    const animation = element.animate(keyframes, {
      duration:quiet ? 480 : options.duration || 720,
      delay:options.delay || 0,
      easing:'cubic-bezier(.16,.78,.22,1)',fill:'backwards'
    });
    animations.add(animation);
    animation.onfinish = () => { animations.delete(animation); animation.cancel(); };
    animation.oncancel = () => animations.delete(animation);
  }
  function atmosphere(element, className, duration) {
    if (!element || lowPower || !enabled()) return;
    element.classList.add(className);
    effects.set(element,{className,timer:setTimeout(() => {
      element.classList.remove(className); effects.delete(element);
    },duration)});
  }
  function run(group) {
    if (!enabled() || home.hidden || played.has(group)) return;
    played.add(group);
    if (group === hero) {
      atmosphere(hero,'tc-hero-entering',1450);
      reveal(document.querySelector('.hero-copy .eyebrow'),{delay:200,y:6});
      reveal(document.querySelector('.hero-copy h1'),{delay:360,x:-20,y:0,blur:2,duration:760});
      reveal(document.querySelector('.hero-copy p'),{delay:580,y:12});
      reveal(document.querySelector('.hero-copy .primary'),{delay:760,y:10,duration:620});
      reveal(document.querySelector('.hero-copy .hero-meta'),{delay:850,y:6});
    } else if (group === favorites) {
      reveal(document.querySelector('#favoritos .section-top h2'),{x:-16,y:0,blur:1.3,duration:650});
      cards.forEach((card,index) => {
        reveal(card,{delay:160+index*100,y:16,scale:.975,duration:680});
        if (!lowPower) card.classList.add('tc-motion-hover');
      });
    } else if (group === launch) {
      reveal(launchImage,{dark:true,y:10,scale:.992,duration:900});
      atmosphere(launchMedia,'tc-atmosphere-entering',1200);
      reveal(document.querySelector('#nueva-linea-tc .tc-launch-copy'),{delay:320,x:-10,y:6,duration:740});
    }
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !home.hidden) {
        inView.add(entry.target); run(entry.target);
      } else inView.delete(entry.target);
    });
    scheduleDepth();
  },{threshold:0,rootMargin:'0px 0px -5% 0px'});
  [hero,favorites,launch].filter(Boolean).forEach(group => observer.observe(group));
  function clearDepth() {
    [heroCopy,launchImage].filter(Boolean).forEach(element => {
      element.style.removeProperty('--tc-depth'); element.classList.remove('tc-motion-depth');
    });
  }
  function updateDepth() {
    frame = null;
    if (!enabled() || lowPower || !desktop.matches || home.hidden || document.hidden) { clearDepth(); return; }
    // Dos lecturas y dos escrituras como máximo por frame de scroll; sin bucle continuo.
    const heroRect = hero.getBoundingClientRect();
    const launchRect = launch.getBoundingClientRect();
    const values = [
      [heroCopy,inView.has(hero) ? Math.max(-6,Math.min(0,heroRect.top*.012)) : 0],
      [launchImage,inView.has(launch) ? Math.max(-4,Math.min(4,(launchRect.top-window.innerHeight*.35)*.008)) : 0]
    ];
    values.forEach(([element,value]) => {
      if (!element) return;
      element.classList.add('tc-motion-depth'); element.style.setProperty('--tc-depth',value.toFixed(2)+'px');
    });
  }
  function scheduleDepth() {
    if (!enabled() || lowPower || !desktop.matches || home.hidden || document.hidden || (!inView.has(hero) && !inView.has(launch)) || frame !== null) return;
    frame = requestAnimationFrame(updateDepth);
  }
  function settle() {
    [...animations].forEach(animation => animation.cancel());
    effects.forEach(({className,timer},element) => {clearTimeout(timer);element.classList.remove(className)});
    effects.clear(); clearDepth();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  window.addEventListener('scroll',scheduleDepth,{passive:true});
  window.addEventListener('resize',() => {clearDepth();scheduleDepth()},{passive:true});
  window.addEventListener('hashchange',() => {
    settle();
    if (!home.hidden) inView.forEach(run);
  });
  document.addEventListener('visibilitychange',() => { if (document.hidden) settle(); });
  if (reduced.addEventListener) reduced.addEventListener('change',() => {
    settle();
    if (reduced.matches) [hero,favorites,launch].forEach(group => {if(group) played.add(group)});
  });
})();
