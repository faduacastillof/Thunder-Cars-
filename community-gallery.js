/* Comunidad editorial: ambos clips reales, en línea, silenciosos y sin carrusel. */
(() => {
  'use strict';
  const film = document.getElementById('communityFilm');
  if (!film) return;
  const videos = [...document.querySelectorAll('#communityFilm video')];
  const toggle = document.getElementById('communityPlayback');
  const status = document.getElementById('communityPlaybackStatus');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, loaded = false, userPaused = false, manualMotion = false, blocked = false, revision = 0;
  const home = film.closest('[data-view="home"]');
  const homeVisible = () => !home || !home.hidden;
  const canPlay = () => visible && homeVisible() && !document.hidden && !userPaused && (!motion.matches || manualMotion);
  // La precarga próxima a Comunidad no debe iniciar reproducción fuera de vista.
  videos.forEach(video => {
    video.autoplay = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.controls = false;
  });
  function loadMedia() {
    if (loaded) return;
    loaded = true;
    videos.forEach(video => {
      video.preload = 'metadata';
      video.setAttribute('src', video.getAttribute('data-community-src'));
      video.load();
    });
  }
  function updateControl() {
    const playing = canPlay() && !blocked;
    toggle.hidden = false;
    toggle.textContent = playing ? 'Pausar' : 'Reproducir';
    toggle.setAttribute('aria-label', playing ? 'Pausar ambos videos de Comunidad' : 'Reproducir ambos videos de Comunidad sin sonido');
  }
  function syncPlayback() {
    const current = ++revision;
    if (!canPlay()) {
      videos.forEach(video => { video.autoplay = false; video.pause(); });
      updateControl();
      return;
    }
    loadMedia();
    film.classList.add('is-ready');
    videos.forEach(video => {
      video.autoplay = true;
      video.muted = true;
      const result = video.play();
      if (result) result.then(() => {
        if (!canPlay()) video.pause();
      }).catch(error => {
        if (current !== revision || !canPlay() || error.name === 'AbortError') return;
        blocked = true;
        updateControl();
      });
    });
    updateControl();
  }
  function refreshVisibility() {
    const rect = film.getBoundingClientRect();
    visible = homeVisible() && rect.bottom > 0 && rect.top < window.innerHeight;
    syncPlayback();
  }
  toggle.addEventListener('click', () => {
    if (canPlay() && !blocked) userPaused = true;
    else {
      userPaused = false; manualMotion = true; blocked = false;
      status.hidden = true;
      videos.forEach(video => { if (video.error) video.load(); });
    }
    refreshVisibility();
  });
  videos.forEach(video => video.addEventListener('error', () => {
    status.hidden = false;
    status.textContent = 'No pudimos cargar uno de los videos. Puedes volver a intentarlo con Reproducir.';
    blocked = true;
    updateControl();
  }));
  document.addEventListener('visibilitychange', refreshVisibility);
  window.addEventListener('pagehide', () => { visible = false; syncPlayback(); });
  window.addEventListener('pageshow', refreshVisibility);
  window.addEventListener('hashchange', () => {
    visible = false;
    syncPlayback();
    requestAnimationFrame(refreshVisibility);
  });
  if (motion.addEventListener) motion.addEventListener('change', () => {
    manualMotion = false; userPaused = false; syncPlayback();
  });
  if ('IntersectionObserver' in window) {
    const nearby = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && homeVisible() && !motion.matches) {
        loadMedia(); nearby.disconnect();
      }
    }, { rootMargin: '500px 0px' });
    nearby.observe(film);
    const viewport = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting) && homeVisible();
      if (visible) film.classList.add('is-ready');
      syncPlayback();
    }, { threshold: 0 });
    viewport.observe(film);
  } else window.addEventListener('scroll', refreshVisibility, { passive: true });
  window.addEventListener('resize', refreshVisibility);
  refreshVisibility();
})();
