/* Manual browsing only; all seven descriptions remain in their original DOM order. */
(() => {
  'use strict';
  const track = document.querySelector('#service-bubbles');
  const controls = document.querySelector('.service-bubble-controls');
  if (!track || !controls) return;
  const cards = [...track.children];
  const previous = document.querySelector('#services-prev');
  const next = document.querySelector('#services-next');
  const range = document.querySelector('#service-range');
  const announcement = document.querySelector('#service-announcement');
  const phone = window.matchMedia('(max-width: 680px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pages = Math.ceil(cards.length / 2);
  let userScrolling = false;
  let settleTimer;
  const stride = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
  const activePage = () => Math.min(pages - 1, Math.max(0, Math.round(track.scrollLeft / stride())));
  const update = () => {
    if (!phone.matches) return;
    const page = activePage();
    const first = page * 2 + 1;
    const last = Math.min(first + 1, cards.length);
    range.textContent = `${String(first).padStart(2, '0')}${last > first ? `–${String(last).padStart(2, '0')}` : ''} / ${String(cards.length).padStart(2, '0')}`;
    previous.disabled = page === 0;
    next.disabled = page === pages - 1;
    return `Services ${first}${last > first ? ` to ${last}` : ''} of ${cards.length}`;
  };
  const go = (page) => {
    userScrolling = true;
    track.scrollTo({ left: Math.max(0, Math.min(pages - 1, page)) * stride(), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };
  previous.addEventListener('click', () => go(activePage() - 1));
  next.addEventListener('click', () => go(activePage() + 1));
  track.addEventListener('keydown', (event) => {
    if (!phone.matches || event.target !== track) return;
    const targets = { ArrowLeft: activePage() - 1, ArrowRight: activePage() + 1, Home: 0, End: pages - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    go(targets[event.key]);
  });
  ['pointerdown', 'wheel'].forEach((name) => track.addEventListener(name, () => { userScrolling = true; }, { passive: true }));
  track.addEventListener('scroll', () => {
    const message = update();
    clearTimeout(settleTimer);
    if (userScrolling && message) settleTimer = setTimeout(() => {
      announcement.textContent = message;
      userScrolling = false;
    }, 180);
  }, { passive: true });
  const syncLayout = () => {
    controls.hidden = !phone.matches;
    track.tabIndex = phone.matches ? 0 : -1;
    update();
  };
  phone.addEventListener('change', syncLayout);
  new ResizeObserver(syncLayout).observe(track);
  syncLayout();
})();
