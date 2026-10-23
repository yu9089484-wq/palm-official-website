(() => {
  'use strict';

  const translate = (source) => window.PALM_ENGLISH?.t(source) ?? source;
  const setMessage = (element, source) => {
    element.dataset.i18nMessage = source;
    element.textContent = translate(source);
  };
  const clearMessage = (element) => {
    delete element.dataset.i18nMessage;
    element.textContent = '';
  };

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const open = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.querySelector('span').textContent = open ? '−' : '＋';
    });
    document.querySelectorAll('#navigation a, .mobile-tabbar a').forEach((link) => link.addEventListener('click', () => {
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.querySelector('span').textContent = '＋';
    }));
  }

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('#navigation a[href^="#"], .mobile-tabbar a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const section = { 'private-journey': 'about', 'journey-scenes': 'services' }[visible.target.id] || visible.target.id;
      if (!navLinks.some((link) => link.getAttribute('href') === `#${section}`)) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${section}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: [0, 0.2, 0.6] });
    sections.forEach((section) => observer.observe(section));
  }

  const track = document.querySelector('#gallery-track');
  const cards = track ? [...track.querySelectorAll('figure')] : [];
  const count = document.querySelector('#gallery-count');
  const move = (direction) => {
    if (!track || !cards.length) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    const current = cards.reduce((best, card, index) =>
      Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - center) ? index : best, 0);
    const target = cards[Math.max(0, Math.min(cards.length - 1, current + direction))];
    track.scrollTo({ left: Math.max(0, target.offsetLeft + target.offsetWidth / 2 - track.clientWidth / 2), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  document.querySelector('#gallery-prev')?.addEventListener('click', () => move(-1));
  document.querySelector('#gallery-next')?.addEventListener('click', () => move(1));
  track?.addEventListener('scroll', () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let active = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const nextDistance = Math.abs(center - cardCenter);
      if (nextDistance < distance) { distance = nextDistance; active = index; }
    });
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  }, { passive: true });

  const leadDialog = document.querySelector('#lead-dialog');
  const leadForm = document.querySelector('#lead-form');
  const leadStatus = document.querySelector('#lead-status');
  const leadSubmit = document.querySelector('#lead-submit');
  const leadStartedAt = document.querySelector('#lead-started-at');
  const leadCountry = document.querySelector('#lead-country');
  const validateCountry = () => {
    leadCountry.setCustomValidity(!leadCountry.value.trim()
      ? translate('Please enter your country or region. / 請輸入您的國家或地區。') : '');
  };
  leadCountry.addEventListener('input', validateCountry);
  leadCountry.addEventListener('change', validateCountry);
  leadForm.addEventListener('reset', () => leadCountry.setCustomValidity(''));
  const leadReadyMessage = () => window.PALM_LEAD_ENDPOINT
    ? 'Your request will be sent with your contact details.'
    : 'Preview mode: no information will be sent. / 預覽模式：資料不會送出。';
  setMessage(leadStatus, leadReadyMessage());
  const selectedCities = new Set();
  const syncCities = () => {
    document.querySelector('#lead-cities').value = [...selectedCities].join(' | ');
  };
  document.querySelectorAll('[data-city]').forEach((button) => {
    button.addEventListener('click', () => {
      const city = button.dataset.city;
      const selected = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(selected));
      if (selected) selectedCities.add(city); else selectedCities.delete(city);
      syncCities();
    });
  });
  const openLeadDialog = () => {
      window.PALM_REQUEST?.refresh();
      leadStartedAt.value = String(Date.now());
      leadStatus.className = 'lead-status';
      setMessage(leadStatus, leadReadyMessage());
      leadDialog.showModal();
      requestAnimationFrame(() => { leadDialog.scrollTop = 0; });
  };
  document.querySelectorAll('[data-open-lead]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openLeadDialog();
    });
  });
  if (window.location.hash === '#lead-form') {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    document.querySelector('[data-open-lead]')?.click();
  }
  const closeLeadDialog = () => leadDialog.close();
  leadDialog.querySelector('.lead-close').addEventListener('click', closeLeadDialog);
  leadDialog.addEventListener('click', (event) => { if (event.target === leadDialog) closeLeadDialog(); });
  document.querySelector('#lead-start').addEventListener('change', (event) => {
    document.querySelector('#lead-end').min = event.target.value;
  });
  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    leadStatus.className = 'lead-status';
    validateCountry();
    if (!leadForm.checkValidity()) {
      leadForm.reportValidity();
      clearMessage(leadStatus);
      return;
    }
    const customCity = document.querySelector('#lead-custom-city').value.trim();
    if (!selectedCities.size && !customCity) {
      setMessage(leadStatus, 'Please select or enter a preferred city. / 請選擇或輸入意向城市。');
      leadStatus.classList.add('error');
      document.querySelector('#lead-custom-city').focus();
      return;
    }
    const payload = {
      email: document.querySelector('#lead-email').value.trim(),
      name: document.querySelector('#lead-name').value.trim(),
      country: leadCountry.value.trim(),
      whatsapp: document.querySelector('#lead-whatsapp').value.trim(),
      cities: [...selectedCities],
      customCity,
      travelStart: document.querySelector('#lead-start').value || null,
      travelEnd: document.querySelector('#lead-end').value || null,
      needs: document.querySelector('#lead-needs').value.trim(),
      ...window.PALM_REQUEST?.read(),
      consent: document.querySelector('#lead-consent').checked,
      website: leadForm.elements.website.value,
      startedAt: Number(leadStartedAt.value || Date.now()),
      source: 'palm-website'
    };
    const endpoint = window.PALM_LEAD_ENDPOINT || '';
    if (!endpoint) {
      setMessage(leadStatus, 'Preview successful. No information was sent or saved. / 預覽成功，資料未傳送或儲存。');
      leadStatus.classList.add('success');
      return;
    }
    leadSubmit.disabled = true;
    leadSubmit.setAttribute('aria-busy', 'true');
    setMessage(leadStatus, 'Submitting securely… / 正在安全提交…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to submit');
      leadForm.reset();
      window.PALM_REQUEST?.refresh();
      selectedCities.clear();
      document.querySelectorAll('[data-city]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
      syncCities();
      setMessage(leadStatus, 'Thank you. Your enquiry is in the PALM dashboard. / 謝謝，您的查詢已進入 PALM 留資後台。');
      leadStatus.classList.add('success');
    } catch {
      setMessage(leadStatus, 'Submission failed. Please try again or call 0756-3336363. / 提交失敗，請重試或致電 0756-3336363。');
      leadStatus.classList.add('error');
    } finally {
      leadSubmit.disabled = false;
      leadSubmit.removeAttribute('aria-busy');
    }
  });

  const imagePanels = [...document.querySelectorAll('.city-collage figure, .gallery-track figure, .cost-grid article')];
  imagePanels.forEach((panel) => {
    panel.classList.add('interactive-image');
    panel.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || reducedMotion?.matches) return;
      const bounds = panel.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      panel.style.setProperty('--image-x', `${(x - 0.5) * 12}px`);
      panel.style.setProperty('--image-y', `${(y - 0.5) * 10}px`);
      panel.style.setProperty('--image-rotate', `${(x - 0.5) * 0.7}deg`);
      panel.style.setProperty('--glow-x', `${x * 100}%`);
      panel.style.setProperty('--glow-y', `${y * 100}%`);
    });
    panel.addEventListener('pointerleave', () => {
      panel.style.setProperty('--image-x', '0px');
      panel.style.setProperty('--image-y', '0px');
      panel.style.setProperty('--image-rotate', '0deg');
      panel.classList.remove('is-pressed');
    });
    panel.addEventListener('pointerdown', () => panel.classList.add('is-pressed'));
    panel.addEventListener('pointerup', () => panel.classList.remove('is-pressed'));
  });
  if ('IntersectionObserver' in window && cards.length) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting));
    }, { root: track, threshold: 0.55 });
    cards.forEach((card) => imageObserver.observe(card));
  }

  const canvas = document.querySelector('#mobius');
  const context = canvas?.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let canvasWidth = 0;
  let canvasHeight = 0;
  let previousProgress = -1;

  const drawMobius = (force = false) => {
    if (!canvas || !context) return;
    const progress = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, window.scrollY / Math.max(canvasHeight, 1)));
    if (!force && Math.abs(progress - previousProgress) < 0.0002) return;
    previousProgress = progress;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const radius = Math.min(canvasWidth * 0.40, 440);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight * 0.44 + progress * 15;
    const tilt = 0.87 + progress * 0.025;
    const roll = -0.34 + progress * 0.045;
    const project = (u, v) => {
      const x = (1 + v * Math.cos(u / 2)) * Math.cos(u);
      const y = (1 + v * Math.cos(u / 2)) * Math.sin(u);
      const z = v * Math.sin(u / 2);
      const rotatedY = y * Math.cos(tilt) - z * Math.sin(tilt);
      const depth = y * Math.sin(tilt) + z * Math.cos(tilt);
      return {
        x: centerX + radius * (x * Math.cos(roll) - rotatedY * Math.sin(roll)),
        y: centerY + radius * (x * Math.sin(roll) + rotatedY * Math.cos(roll)),
        z: depth
      };
    };
    const patches = [];
    const along = canvasWidth <= 680 ? 96 : 144;
    const across = canvasWidth <= 680 ? 10 : 14;
    for (let i = 0; i < along; i += 1) {
      for (let j = 0; j < across; j += 1) {
        const u = i * Math.PI * 2 / along;
        const du = Math.PI * 2 / along;
        const v = -0.27 + j * 0.54 / across;
        const dv = 0.54 / across;
        const points = [project(u, v), project(u + du, v), project(u + du, v + dv), project(u, v + dv)];
        patches.push({ points, z: points.reduce((sum, point) => sum + point.z, 0) / 4, shade: Math.sin(u * 0.8 + v * 2) });
      }
    }
    patches.sort((a, b) => a.z - b.z);
    patches.forEach((patch) => {
      const tone = Math.round(209 + patch.shade * 14 + patch.z * 7);
      context.beginPath();
      patch.points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
      context.closePath();
      context.fillStyle = `rgb(${tone - 8},${tone + 2},${tone - 14})`;
      context.fill();
      context.strokeStyle = 'rgba(118,146,113,.085)';
      context.lineWidth = 0.55;
      context.stroke();
    });
  };

  const resizeMobius = () => {
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawMobius(true);
  };
  window.addEventListener('resize', resizeMobius, { passive: true });
  let mobiusFrame = 0;
  window.addEventListener('scroll', () => {
    if (mobiusFrame) return;
    mobiusFrame = requestAnimationFrame(() => {
      mobiusFrame = 0;
      drawMobius();
    });
  }, { passive: true });
  reducedMotion.addEventListener('change', () => drawMobius(true));
  resizeMobius();
})();

/* Compact phone reading: reuse existing headings and move, never rewrite, copy. */
(() => {
  'use strict';
  const phone = window.matchMedia('(max-width: 680px)');
  const reducedReadingMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const disclosures = [...document.querySelectorAll('.role-table article, .privacy-points article, .needs-info-row')]
    .map((article, index) => ({
      article,
      heading: article.querySelector('strong, h3'),
      content: article.querySelector('p'),
      id: `mobile-reading-${index + 1}`,
      originalId: article.querySelector('p')?.getAttribute('id'),
      originallyHidden: article.querySelector('p')?.hidden,
      button: null,
      animation: null,
      open: false
    }))
    .filter(({ heading, content }) => heading && content);

  const updateLayout = () => {
    disclosures.forEach((item) => {
      if (phone.matches && !item.button) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-disclosure-toggle';
        button.setAttribute('aria-expanded', String(item.open));
        item.content.id = item.originalId || item.id;
        button.setAttribute('aria-controls', item.content.id);
        while (item.heading.firstChild) button.append(item.heading.firstChild);
        item.heading.append(button);
        item.article.classList.add('mobile-disclosure');
        item.content.hidden = !item.open;
        button.addEventListener('click', () => {
          const previousHeight = item.content.hidden ? 0 : item.content.getBoundingClientRect().height;
          item.animation?.cancel();
          item.open = !item.open;
          button.setAttribute('aria-expanded', String(item.open));
          if (reducedReadingMotion.matches) {
            item.content.hidden = !item.open;
            item.content.style.removeProperty('overflow');
            return;
          }
          item.content.hidden = false;
          item.content.style.overflow = 'hidden';
          const animation = item.content.animate([
            { height: `${previousHeight}px`, opacity: item.open ? .45 : 1 },
            { height: `${item.open ? item.content.scrollHeight : 0}px`, opacity: item.open ? 1 : 0 }
          ], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
          item.animation = animation;
          animation.finished.then(() => {
            if (item.animation !== animation) return;
            item.content.hidden = !item.open;
            item.content.style.removeProperty('overflow');
            item.animation = null;
          }, () => {});
        });
        item.button = button;
      } else if (!phone.matches && item.button) {
        item.animation?.cancel();
        item.animation = null;
        item.content.style.removeProperty('overflow');
        while (item.button.firstChild) item.heading.insertBefore(item.button.firstChild, item.button);
        item.button.remove();
        item.button = null;
        item.article.classList.remove('mobile-disclosure');
        item.content.hidden = item.originallyHidden;
        if (item.originalId === null) item.content.removeAttribute('id');
        else item.content.id = item.originalId;
      }
    });
  };
  phone.addEventListener('change', updateLayout);
  reducedReadingMotion.addEventListener('change', () => {
    disclosures.forEach((item) => {
      item.animation?.cancel();
      item.animation = null;
      item.content.style.removeProperty('overflow');
      if (item.button) item.content.hidden = !item.open;
    });
  });
  updateLayout();
})();
