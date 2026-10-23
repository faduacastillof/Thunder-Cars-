(() => {
  'use strict';
  // Campaña independiente: no usa productos, filtros ni la bolsa.
  const newLinePreviewImages = [
    { image: 'assets/campaigns/tc-preview/silvia-s14.webp', name: 'Silvia S14', alt: 'Hombre de espalda con polera negra acid wash y diseño Silvia S14 morado.' },
    { image: 'assets/campaigns/tc-preview/toyota-chaser.webp', name: 'Toyota Chaser', alt: 'Hombre de espalda con polera negra acid wash y diseño Toyota Chaser blanco.' },
    { image: 'assets/campaigns/tc-preview/skyline-r32.webp', name: 'Skyline R32', alt: 'Hombre de espalda con polera negra acid wash y diseño Nissan Skyline R32 gris y rojo.' },
    { image: 'assets/campaigns/tc-preview/supra-mk4.webp', name: 'Supra MK4', alt: 'Hombre de espalda con polera negra acid wash y diseño Toyota Supra MK4 naranjo y verde.' }
  ];
  const trigger = document.querySelector('.tc-launch-preview');
  const dialog = document.querySelector('#tcPreviewDialog');
  if (!trigger || !dialog) return;
  const image = dialog.querySelector('#tcPreviewImage');
  const name = dialog.querySelector('#tcPreviewName');
  const counter = dialog.querySelector('#tcPreviewCounter');
  const thumbnails = dialog.querySelector('.tc-preview-thumbs');
  const stage = dialog.querySelector('.tc-preview-stage');
  const close = dialog.querySelector('.tc-preview-close');
  let current = 0;
  let touchStart = null;
  let thumbButtons = [];

  function show(index) {
    current = (index + newLinePreviewImages.length) % newLinePreviewImages.length;
    const entry = newLinePreviewImages[current];
    image.alt = entry.alt;
    image.src = entry.image;
    name.textContent = entry.name;
    counter.textContent = `${current + 1} / ${newLinePreviewImages.length}`;
    thumbButtons.forEach((button, i) => {
      button.setAttribute('aria-current', String(i === current));
    });
  }

  function prepareThumbnails() {
    if (thumbButtons.length) return;
    thumbButtons = newLinePreviewImages.map((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Ver ${entry.name}`);
      const thumb = document.createElement('img');
      thumb.alt = '';
      thumb.width = 64;
      thumb.height = 80;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      thumb.src = entry.image.replace('.webp', '-thumb.webp');
      button.append(thumb);
      button.addEventListener('click', () => show(index));
      thumbnails.append(button);
      return button;
    });
  }

  trigger.addEventListener('click', event => {
    event.preventDefault();
    if (dialog.open) return;
    prepareThumbnails();
    show(0);
    touchStart = null;
    document.documentElement.classList.add('tc-preview-open');
    dialog.showModal();
    close.focus({ preventScroll: true });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.querySelector('.tc-preview-prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.tc-preview-next').addEventListener('click', () => show(current + 1));

  dialog.addEventListener('click', event => {
    if (!dialog.open || event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dialog.close();
  });
  dialog.addEventListener('close', () => {
    touchStart = null;
    document.documentElement.classList.remove('tc-preview-open');
    trigger.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    } else if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter(element => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  stage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, time: Date.now() } : null;
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart || !dialog.open || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Date.now() - touchStart.time < 1000 && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
})();
