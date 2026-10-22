/* Render the existing source copy in English without changing form values. */
(() => {
  'use strict';

  const translate = (source) => {
    const original = String(source ?? '');
    const value = window.PALM_ENGLISH_COPY?.[original.trim()];
    if (typeof value !== 'string') return original;
    return original.slice(0, original.length - original.trimStart().length)
      + value
      + original.slice(original.trimEnd().length);
  };
  window.PALM_ENGLISH = Object.freeze({ t: translate });

  document.documentElement.lang = 'en';
  document.title = translate(document.title);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = translate(description.content);

  // Keep the original secondary copies in the document without displaying duplicates.
  const secondarySelectors = [
    '.form-actions > p > span',
    '.gallery-track figcaption > small',
    '.lead-fab > small',
    '.site-footer > p > span',
    '#lead-title > small',
    '.lead-column > h3 > small',
    '.lead-submit-row > button > span',
    '.lead-submit-row > p > span',
    '#result-title > em'
  ];
  document.querySelectorAll(secondarySelectors.join(',')).forEach((element) => {
    element.classList.add('secondary-copy');
    const previous = element.previousSibling;
    if (previous?.nodeType === Node.ELEMENT_NODE && previous.tagName === 'BR') {
      previous.classList.add('secondary-copy');
    }
  });
  const secondaryText = [
    ['.lead-consent > span', '我同意 PALM 使用以上資料回覆本次查詢。請勿在此提交病歷或醫療報告。'],
    ['.result-note', '預覽完成；資料未傳送、未儲存。']
  ];
  secondaryText.forEach(([selector, source]) => {
    const parent = document.querySelector(selector);
    if (!parent) return;
    [...parent.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || node.nodeValue.trim() !== source) return;
      const previous = node.previousSibling;
      const span = document.createElement('span');
      span.className = 'secondary-copy';
      parent.insertBefore(span, node);
      span.append(node);
      if (previous?.nodeType === Node.ELEMENT_NODE && previous.tagName === 'BR') {
        previous.classList.add('secondary-copy');
      }
    });
  });

  // Freeze implicit option values before translating their visible labels.
  document.querySelectorAll('select option').forEach((option) => {
    if (!option.hasAttribute('value')) option.setAttribute('value', option.value);
  });

  const excluded = 'script, style, .menu-toggle span, #gallery-count, #country-options, #lead-status, #form-status, #result-summary, [data-layout-hidden], .secondary-copy';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue.trim() && !node.parentElement?.closest(excluded)
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  while (walker.nextNode()) {
    walker.currentNode.nodeValue = translate(walker.currentNode.nodeValue);
  }
  document.querySelectorAll('[placeholder], [aria-label], [alt]').forEach((element) => {
    if (element.closest(excluded)) return;
    ['placeholder', 'aria-label', 'alt'].forEach((name) => {
      if (element.hasAttribute(name)) {
        element.setAttribute(name, translate(element.getAttribute(name)));
      }
    });
  });

  const regionLabels = { CN: 'Mainland China', HK: 'Hong Kong', MO: 'Macao', TW: 'Taiwan' };
  let names;
  try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (_) { /* Use the source English labels. */ }
  document.querySelectorAll('#country-options option[data-region-code]').forEach((option) => {
    const code = option.dataset.regionCode;
    // These are suggestions only; the traveller's country input remains untouched.
    option.value = regionLabels[code] || names?.of(code) || option.value.split(' / ')[0];
  });
})();
