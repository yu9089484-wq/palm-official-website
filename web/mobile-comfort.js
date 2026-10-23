(() => {
  const track = document.querySelector('#about .journey-cards');
  if (!track) return;
  const cards = [...track.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  track.id = 'journey-dimensions';
  const pager = document.createElement('div');
  pager.className = 'journey-pager';
  pager.setAttribute('role', 'group');
  pager.setAttribute('aria-label', 'Choose a journey dimension');
  pager.setAttribute('data-no-confetti', '');
  const buttons = cards.map((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(index + 1).padStart(2, '0');
    button.setAttribute('aria-label', card.querySelector('h3').childNodes[0].textContent.trim());
    button.setAttribute('aria-controls', track.id);
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => track.scrollTo({
      left: card.offsetLeft - cards[0].offsetLeft,
      behavior: reduced.matches ? 'auto' : 'smooth'
    }));
    pager.append(button);
    return button;
  });
  track.after(pager);
  let frame;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const start = track.getBoundingClientRect().left;
      const distances = cards.map(card => Math.abs(card.getBoundingClientRect().left - start));
      const active = distances.indexOf(Math.min(...distances));
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
    });
  };
  track.addEventListener('scroll', update, {passive:true});
  new ResizeObserver(update).observe(track);
})();
