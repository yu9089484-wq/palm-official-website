(() => {
  'use strict';
  const dialog = document.querySelector('#newsletter-dialog');
  const form = document.querySelector('#newsletter-form');
  const email = document.querySelector('#newsletter-email');
  const trigger = document.querySelector('.newsletter-trigger');
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector('.newsletter-status');
  let startedAt = 0;
  let busy = false;
  trigger.addEventListener('click', () => {
    document.querySelector('#navigation')?.classList.remove('open');
    const menu = document.querySelector('.menu-toggle');
    menu?.setAttribute('aria-expanded', 'false');
    if (menu) menu.querySelector('span').textContent = '＋';
    if (!busy) status.textContent = '';
    startedAt = Date.now();
    dialog.showModal();
  });
  dialog.querySelector('.newsletter-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    status.textContent = '';
    if (!form.reportValidity()) return;
    const endpoint = window.PALM_SUBSCRIBE_ENDPOINT || '';
    if (!endpoint) {
      status.append('To subscribe, please email ');
      const link = document.createElement('a');
      link.href = 'mailto:palm529018@gmail.com?subject=PALM%20newsletter%20subscription';
      link.textContent = 'palm529018@gmail.com';
      status.append(link, '.');
      return;
    }
    busy = true;
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    status.textContent = 'Subscribing…';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({email:email.value.trim(),consent:true,website:form.elements.website.value,startedAt})
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error('Subscription failed');
      form.reset();
      status.textContent = 'Thank you. You’re subscribed to PALM updates.';
    } catch {
      status.textContent = 'We couldn’t save your subscription. Please try again shortly.';
    } finally {
      busy = false;
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  });
})();
