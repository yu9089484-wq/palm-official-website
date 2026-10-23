/* Slow, visible-only rotation. User interaction always takes priority. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function rotate({track, items, controls, scopes, delay, name}) {
    if (!track || !controls || items.length < 2) return;
    let timer, visible = false, dragging = false, hovered = false, resumeAt = 0;
    const focused = () => scopes.some(scope => scope.contains(document.activeElement));
    const schedule = () => {
      clearTimeout(timer);
      if (!visible || dragging || hovered || focused() || document.hidden || reduced.matches || track.scrollWidth <= track.clientWidth + 3) return;
      timer = setTimeout(advance, Math.max(delay, resumeAt - Date.now()));
    };
    const advance = () => {
      const max = track.scrollWidth - track.clientWidth;
      const offsets = items.map(item => item.offsetLeft - items[0].offsetLeft);
      const next = track.scrollLeft >= max - 5 ? 0 : offsets.find(left => left > track.scrollLeft + 8) ?? 0;
      track.scrollTo({left:Math.min(next,max),behavior:'smooth'});
      schedule();
    };
    const hold = () => { resumeAt = Date.now() + 12000; schedule(); };
    scopes.forEach(scope => {
      scope.addEventListener('pointerdown', () => { dragging = true; clearTimeout(timer); }, {passive:true});
      scope.addEventListener('pointerup', () => { dragging = false; hold(); }, {passive:true});
      scope.addEventListener('pointercancel', () => { dragging = false; hold(); }, {passive:true});
      scope.addEventListener('wheel', hold, {passive:true});
      scope.addEventListener('keydown', hold);
      scope.addEventListener('focusin', () => clearTimeout(timer));
      scope.addEventListener('focusout', () => { resumeAt = Date.now() + 12000; setTimeout(schedule,0); });
      scope.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovered = true; clearTimeout(timer); } });
      scope.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovered = false; dragging = false; hold(); } });
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .6;
      schedule();
    }, {threshold:[0,.6]});
    observer.observe(track);
    new ResizeObserver(schedule).observe(track);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', schedule);
    window.addEventListener('pagehide', () => clearTimeout(timer));
    window.addEventListener('pageshow', schedule);
    schedule();
  }
  const photos = document.querySelector('#about-photos');
  const dimensions = document.querySelector('#journey-dimensions');
  const photoScope = document.querySelector('.about-photo-gallery');
  const pager = document.querySelector('.journey-pager');
  rotate({track:photos,items:[...photos.querySelectorAll('figure')],controls:document.querySelector('.about-photo-controls'),scopes:[photoScope],delay:6000,name:'photo'});
  rotate({track:dimensions,items:[...dimensions.children],controls:pager,scopes:[dimensions,pager],delay:8000,name:'journey'});
})();
