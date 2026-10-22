(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const tabbar = document.querySelector('.mobile-tabbar');
  const imagePanels = [...document.querySelectorAll('.city-collage figure, .gallery-track figure')];
  const visibleImages = new Set();
  const entrances = new Set();
  let pending = 0;

  const placeIndicator = () => {
    if (!tabbar || !tabbar.offsetWidth) return;
    const active = tabbar.querySelector('a.active');
    if (!active) return;
    tabbar.style.setProperty('--nav-x', `${active.offsetLeft}px`);
    tabbar.style.setProperty('--nav-width', `${active.offsetWidth}px`);
    tabbar.classList.add('has-moving-indicator');
  };
  if (tabbar) {
    const observer = new MutationObserver(placeIndicator);
    [...tabbar.children].forEach((link) => observer.observe(link, { attributes: true, attributeFilter: ['class', 'aria-current'] }));
    new ResizeObserver(placeIndicator).observe(tabbar);
    placeIndicator();
  }

  const paint = () => {
    pending = 0;
    const viewport = window.innerHeight;
    const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - viewport)));
    const measurements = reduced.matches ? [] : [...visibleImages].map((panel) => ({panel, bounds: panel.getBoundingClientRect()}));
    header?.style.setProperty('--reading-progress', progress.toFixed(4));
    header?.classList.toggle('is-scrolled', window.scrollY > 18);
    measurements.forEach(({panel, bounds}) => {
      const vertical = Math.max(-7, Math.min(7, (viewport / 2 - bounds.top - bounds.height / 2) / viewport * 14));
      const horizontal = Math.max(-8, Math.min(8, (window.innerWidth / 2 - bounds.left - bounds.width / 2) / window.innerWidth * 14));
      panel.style.setProperty('--scroll-drift', `${vertical.toFixed(2)}px`);
      panel.style.setProperty('--slide-drift', `${horizontal.toFixed(2)}px`);
    });
  };
  const schedulePaint = () => {
    if (!pending && !document.hidden) pending = requestAnimationFrame(paint);
  };
  window.addEventListener('scroll', schedulePaint, { passive: true });
  window.addEventListener('resize', schedulePaint, { passive: true });
  document.querySelectorAll('.city-collage, .gallery-track').forEach((track) => track.addEventListener('scroll', schedulePaint, { passive: true }));
  new ResizeObserver(schedulePaint).observe(document.body);

  if ('IntersectionObserver' in window) {
    const images = new IntersectionObserver((entries) => {
      entries.forEach(({target, isIntersecting}) => isIntersecting ? visibleImages.add(target) : visibleImages.delete(target));
      schedulePaint();
    }, { rootMargin: '50px' });
    imagePanels.forEach((panel) => images.observe(panel));

    // Animate only on entry. Content stays visible if scripting or motion is disabled.
    const reveals = new IntersectionObserver((entries) => {
      let step = 0;
      entries.forEach(({target, isIntersecting}) => {
        if (!isIntersecting) return;
        reveals.unobserve(target);
        if (reduced.matches || window.scrollY < 10 || !target.offsetHeight) return;
        const animation = target.animate([
          { opacity: .65, translate: '0 14px' },
          { opacity: 1, translate: '0 0' }
        ], { duration: 650, delay: Math.min(step++ * 55, 165), easing: 'cubic-bezier(.22,1,.36,1)' });
        entrances.add(animation);
        animation.finished.then(() => entrances.delete(animation), () => entrances.delete(animation));
      });
    }, { threshold: .12, rootMargin: '0px 0px -35px 0px' });
    document.querySelectorAll('main > section:not(.hero) h2, .journey-card, .services .service-grid > li, .cost-grid article, .needs-presets').forEach((element) => reveals.observe(element));
  }
  reduced.addEventListener('change', () => {
    entrances.forEach((animation) => animation.cancel());
    entrances.clear();
    imagePanels.forEach((panel) => {
      panel.style.removeProperty('--scroll-drift');
      panel.style.removeProperty('--slide-drift');
    });
    schedulePaint();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(pending);
      pending = 0;
      entrances.forEach((animation) => animation.cancel());
    } else schedulePaint();
  });
  schedulePaint();
})();
