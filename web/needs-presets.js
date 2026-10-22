(() => {
  'use strict';
  const examples = {
    cardiovascular: 'I would like help coordinating an assessment of rehabilitation options for cardiovascular or cerebrovascular health during my trip.',
    cancer: 'I would like help arranging a specialist consultation to understand suitable cancer care options during my trip.',
    neurological: 'I would like help coordinating a specialist assessment for a neurological condition and planning practical travel support.',
    metabolic: 'I would like help arranging a consultation about metabolic health, such as diabetes or high uric acid, during my trip.',
    digestive: 'I would like help coordinating a specialist consultation about digestive health during my trip.',
    dental: 'I would like help exploring suitable dental or orthodontic appointments and how they could fit into my trip.',
    joint: 'I would like help coordinating an assessment of joint health and suitable rehabilitation or longevity-related options.'
  };
  const service = document.querySelector('#service-example');
  const needs = document.querySelector('#guest-needs');
  const travel = document.querySelector('#guest-window');
  const records = document.querySelector('#guest-records');
  const summary = document.querySelector('#lead-request-summary');
  const optionText = (select) => select.value ? select.selectedOptions[0].textContent.trim() : '';
  const read = () => ({
    serviceKey: service.value,
    journeyNeeds: needs.value.trim(),
    travelWindow: optionText(travel),
    recordsStatus: optionText(records)
  });
  const refresh = () => {
    document.querySelector('#lead-request-selection').textContent = optionText(service);
  };
  window.PALM_REQUEST = Object.freeze({ read, refresh });
  const resizeNeeds = () => {
    needs.style.height = 'auto';
    needs.style.height = `${Math.min(176, needs.scrollHeight)}px`;
  };
  service.addEventListener('change', () => {
    if (!examples[service.value]) return;
    needs.value = examples[service.value];
    resizeNeeds();
    if (!travel.value) travel.value = [...travel.options].find((option) => option.textContent.trim() === 'Flexible')?.value || '';
    if (!records.value) records.value = 'unsure';
    const status = document.querySelector('#form-status');
    status.style.color = '';
    status.textContent = 'Example added. Edit any answer, then preview your journey.';
    refresh();
  });
  [needs, travel, records].forEach((field) => field.addEventListener('input', refresh));
  needs.addEventListener('input', resizeNeeds);
  window.addEventListener('resize', resizeNeeds, { passive: true });
  summary.addEventListener('toggle', () => { if (summary.open) resizeNeeds(); });

  const additional = document.querySelector('#lead-needs');
  const suggestions = [...document.querySelectorAll('[data-needs-example]')];
  const updateSuggestions = () => suggestions.forEach((button) => {
    button.setAttribute('aria-pressed', String(additional.value.includes(button.dataset.needsExample)));
  });
  suggestions.forEach((button) => button.addEventListener('click', () => {
    const sentence = button.dataset.needsExample;
    const current = additional.value.trim();
    const next = current.includes(sentence)
      ? current.replace(sentence, '').replace(/\n{3,}/g, '\n\n').trim()
      : [current, sentence].filter(Boolean).join('\n');
    if (next.length > additional.maxLength) {
      const status = document.querySelector('#lead-status');
      status.textContent = 'Please shorten your additional notes before adding another example.';
      status.classList.add('error');
      return;
    }
    additional.value = next;
    additional.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  additional.addEventListener('input', updateSuggestions);
  document.querySelector('#lead-form').addEventListener('reset', () => queueMicrotask(updateSuggestions));
  refresh();
})();
