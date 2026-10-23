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
  const additional = document.querySelector('#lead-needs');
  const optionText = (select) => select.value ? select.selectedOptions[0].textContent.trim() : '';
  const read = () => ({ serviceKey: service.value });
  const refresh = () => {
    document.querySelector('#lead-request-selection').textContent = optionText(service);
  };
  window.PALM_REQUEST = Object.freeze({ read, refresh });
  let previousExample = '';
  service.addEventListener('change', () => {
    const example = examples[service.value] || '';
    const notes = previousExample ? additional.value.replace(previousExample, '').trim() : additional.value.trim();
    const next = [example, notes].filter(Boolean).join('\n');
    if (next.length <= additional.maxLength) {
      additional.value = next;
      previousExample = example;
      additional.dispatchEvent(new Event('input', { bubbles: true }));
    }
    refresh();
  });
  document.querySelector('#lead-form').addEventListener('reset', () => { previousExample = ''; });

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
