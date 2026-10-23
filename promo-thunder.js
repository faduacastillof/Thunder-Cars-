(() => {
  'use strict';
  const button = document.querySelector('.promo-thunder-art');
  const dialog = document.querySelector('#zoomDialog');
  if (!button || !dialog) return;
  let openedByPromotion = false;
  button.addEventListener('click', () => {
    document.querySelector('#zoomImage').src = button.querySelector('img').getAttribute('src');
    document.querySelector('#zoomImage').alt = button.querySelector('img').alt;
    document.querySelector('#zoomCaption').textContent = '1 polera + 1 polerón por $37.990. El precio corresponde a ambas prendas. Puedes elegir cualquier diseño del catálogo.';
    openedByPromotion = true;
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (!openedByPromotion) return;
    openedByPromotion = false;
    document.querySelector('#zoomImage').alt = 'Diseño ampliado';
    button.focus({ preventScroll: true });
  });
})();
