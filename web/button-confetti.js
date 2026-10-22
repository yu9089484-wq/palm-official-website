(() => {
  'use strict';

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#2f6152', '#7d9a80', '#b4c8a8', '#c2a46c', '#e3d6b4'];
  const pressAnimations = new WeakMap();
  let canvas;
  let context;
  let particles = [];
  let emblems = [];
  let frame = 0;

  const clear = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    particles = [];
    emblems = [];
    canvas?.remove();
    canvas = context = null;
  };

  const draw = (now) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    emblems = emblems.filter((emblem) => now - emblem.born < emblem.life);
    for (const emblem of emblems) {
      const progress = (now - emblem.born) / emblem.life;
      const reveal = emblem.still ? 1 : Math.min(1, progress * 5);
      context.save();
      context.translate(emblem.x, emblem.y - (emblem.still ? 0 : progress * 18));
      context.globalAlpha = Math.min(1, (1 - progress) * 4) * reveal;
      const size = emblem.still ? 1 : .7 + .3 * Math.sin(reveal * Math.PI / 2);
      context.scale(size, size);
      context.fillStyle = 'rgba(250,250,244,.94)';
      context.beginPath();
      context.arc(0, 0, 43, 0, Math.PI * 2);
      context.fill();
      // Reuse the PALM wordmark for the navigation's decorative surprise.
      context.fillStyle = '#173f34';
      context.font = '400 23px Arial, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('PALM', 0, 1);
      context.restore();
    }
    particles = particles.filter((particle) => now - particle.born < particle.life);
    for (const particle of particles) {
      const elapsed = (now - particle.born) / 1000;
      const progress = (now - particle.born) / particle.life;
      const travel = (1 - Math.exp(-elapsed * 3)) / 3;
      const x = particle.x + (particle.still ? 0 : particle.vx * travel);
      const y = particle.y + (particle.still ? 0 : particle.vy * travel + 100 * elapsed * elapsed);
      context.save();
      context.translate(x, y);
      context.rotate(particle.angle + (particle.still ? 0 : elapsed * particle.spin));
      context.globalAlpha = .96 * Math.min(1, (1 - progress) * 2.6);
      context.fillStyle = particle.color;
      if (particle.round) {
        context.beginPath();
        context.arc(0, 0, particle.size * .48, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      }
      context.restore();
    }
    if (particles.length || emblems.length) frame = requestAnimationFrame(draw);
    else clear();
  };

  const burst = (x, y, navigationBounds) => {
    if (document.hidden) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'palm-click-confetti';
      canvas.setAttribute('aria-hidden', 'true');
      context = canvas.getContext('2d');
      if (!context) { clear(); return; }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    // A native modal is above the document; its decoration must share that layer.
    const host = [...document.querySelectorAll('dialog[open]')].at(-1) || document.body;
    if (canvas.parentElement !== host) host.append(canvas);
    const still = motion.matches;
    const count = still ? 10 : (window.innerWidth <= 680 ? 28 : 36);
    const born = performance.now();
    if (navigationBounds) {
      emblems.push({
        x: Math.max(48, Math.min(window.innerWidth - 48, navigationBounds.left + navigationBounds.width / 2)),
        y: Math.max(60, navigationBounds.top - 52),
        born,
        life: still ? 160 : 1250,
        still
      });
      emblems = emblems.slice(-2);
    }
    for (let index = 0; index < count; index += 1) {
      const angle = Math.PI * 2 * index / count + Math.random() * .22;
      const speed = 150 + Math.random() * 190;
      const radius = still ? 12 + Math.random() * 18 : 0;
      particles.push({
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 110,
        angle,
        spin: (Math.random() - .5) * 12,
        size: 3.5 + Math.random() * 4,
        color: colors[index % colors.length],
        round: index % 4 === 0,
        born,
        life: still ? 160 : 720 + Math.random() * 260,
        still
      });
    }
    particles = particles.slice(-100);
    if (!frame) frame = requestAnimationFrame(draw);
  };

  document.addEventListener('click', (event) => {
    if (!event.isTrusted || event.button !== 0 || !(event.target instanceof Element)) return;
    const control = event.target.closest('button, a[href], [role="button"], input[type="button"], input[type="submit"]');
    if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.closest('[inert], [data-no-confetti]')) return;
    const bounds = control.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX;
    const y = event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY;
    // Wait for existing navigation/dialog handlers without cancelling their behavior.
    requestAnimationFrame(() => {
      if (!motion.matches && control.isConnected && typeof control.animate === 'function') {
        pressAnimations.get(control)?.cancel();
        pressAnimations.set(control, control.animate([
          { scale: '.96' },
          { scale: '1.025', offset: .6 },
          { scale: '1' }
        ], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }));
      }
      burst(x, y, control.closest('.mobile-tabbar') ? bounds : null);
    });
  }, { capture: true });

  window.addEventListener('resize', clear, { passive: true });
  window.addEventListener('pagehide', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  motion.addEventListener('change', clear);
})();
