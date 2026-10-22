(() => {
  'use strict';
  const gallery = document.querySelector('.about-photo-gallery');
  if (!gallery) return;
  const track = gallery.querySelector('.about-photo-track');
  const photos = [...track.querySelectorAll('figure')];
  const controls = gallery.querySelector('.about-photo-controls');
  const previous = gallery.querySelector('.about-photo-prev');
  const next = gallery.querySelector('.about-photo-next');
  const count = gallery.querySelector('.about-photo-count');
  const progress = gallery.querySelector('.about-photo-progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  let paint = 0;
  let drag;
  const position = (photo) => photo.offsetLeft - photos[0].offsetLeft;
  const update = () => {
    paint = 0;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
    const bounds = track.getBoundingClientRect();
    const visible = photos.map((photo, index) => ({index, rect: photo.getBoundingClientRect()}))
      .filter(({rect}) => Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left) > rect.width * .35);
    if (visible.length) {
      const first = String(visible[0].index + 1).padStart(2, '0');
      const last = String(visible.at(-1).index + 1).padStart(2, '0');
      const label = `${first === last ? first : `${first}–${last}`} / ${String(photos.length).padStart(2, '0')}`;
      if (count.textContent !== label) count.textContent = label;
    }
    const portion = track.clientWidth / track.scrollWidth;
    progress.style.setProperty('--photo-visible', `${portion * 100}%`);
    progress.style.setProperty('--photo-position', `${track.scrollLeft / track.clientWidth * 100}%`);
  };
  const schedule = () => { if (!paint) paint = requestAnimationFrame(update); };
  const scrollTo = (left) => track.scrollTo({left, behavior: reduced.matches ? 'auto' : 'smooth'});
  const move = (direction) => {
    const current = track.scrollLeft;
    const targets = photos.map(position);
    const target = direction > 0 ? targets.find((x) => x > current + 8) : targets.findLast((x) => x < current - 8);
    scrollTo(target ?? (direction > 0 ? track.scrollWidth : 0));
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', (event) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') scrollTo(0);
    else if (event.key === 'End') scrollTo(track.scrollWidth);
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  // Touch and trackpads retain native scrolling; add direct dragging for a mouse.
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = {id: event.pointerId, x: event.clientX, left: track.scrollLeft};
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id || Math.abs(event.clientX - drag.x) < 5) return;
    track.classList.add('is-dragging');
    track.scrollLeft = drag.left - (event.clientX - drag.x);
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = undefined;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.classList.remove('is-dragging');
  };
  ['pointerup','pointercancel','lostpointercapture'].forEach((name) => track.addEventListener(name, endDrag));
  track.addEventListener('scroll', schedule, {passive: true});
  new ResizeObserver(schedule).observe(track);
  controls.hidden = false;

  // Each photograph rises gently once, including pictures reached by swiping.
  // Content remains visible if JavaScript, image loading or motion is unavailable.
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('about-photos-in-view', entry.isIntersecting);
    }, {threshold: 0});
    visibility.observe(track);
    const reveal = new IntersectionObserver((entries) => {
      let order = 0;
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        reveal.unobserve(target);
        const delay = order++ * 90;
        const enter = () => {
          if (reduced.matches || document.hidden) return;
          const animation = target.animate([
            {opacity: .2, transform: 'translateY(22px) scale(.95)'},
            {opacity: 1, transform: 'translateY(0) scale(1)'}
          ], {duration: 1100, delay, easing: 'cubic-bezier(.2,.75,.2,1)'});
          animations.add(animation);
          animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
        };
        const img = target.querySelector('img');
        if (img.complete) enter();
        else img.addEventListener('load', enter, {once: true});
      });
    }, {threshold: .12});
    photos.forEach((photo) => reveal.observe(photo));
  }
  const cancel = () => { animations.forEach((animation) => animation.cancel()); animations.clear(); };
  reduced.addEventListener('change', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  update();
})();
