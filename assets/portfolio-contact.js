(() => {
  'use strict';
  const tokenKeys = [29, 71, 43, 97, 13, 53, 83];
  const decodeContactToken = (token) => String(token || '').split('.').filter(Boolean).map((part, index) => {
    const value = Number(part);
    return Number.isInteger(value) ? String.fromCharCode(value ^ tokenKeys[index % tokenKeys.length]) : '';
  }).join('');

  for (const node of document.querySelectorAll('[data-contact-email][data-contact-token]')) {
    node.textContent = decodeContactToken(node.dataset.contactToken);
  }

  if (!document.body.classList.contains('project-redesign') && !document.querySelector('script[data-redesign-project-compat]')) {
    const compatibilityScript = document.createElement('script');
    compatibilityScript.src = '/assets/redesign-project-compat.js?v=20260909-a';
    compatibilityScript.dataset.redesignProjectCompat = '';
    document.head.append(compatibilityScript);
  }

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-portfolio-contact]')) return;
    if (!form.checkValidity()) return;
    event.preventDefault();
    const value = (name) => String(form.elements.namedItem(name)?.value || '').trim();
    const recipient = decodeContactToken(form.dataset.recipientToken);
    const name = value('field1') || value('name');
    const senderEmail = value('email');
    const message = value('field2') || value('message');
    const subject = 'Portfolio inquiry from ' + (name || senderEmail || 'website visitor');
    const body = ['Name: ' + name, 'Email: ' + senderEmail, '', message].join('\n');
    const status = form.querySelector('[data-contact-status]');
    if (status) status.textContent = status.dataset.sentMessage || '';
    if (!recipient) return;
    location.href = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }, true);

  const lightboxTriggers = Array.from(document.querySelectorAll('[data-lightbox-src]'));
  if (!lightboxTriggers.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'portfolio-lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image viewer');
  lightbox.innerHTML = '<button type="button" class="portfolio-lightbox__close" aria-label="Close image viewer">×</button>' +
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--prev" aria-label="Previous image">‹</button>' +
    '<img class="portfolio-lightbox__image" alt="">' +
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--next" aria-label="Next image">›</button>';
  document.body.append(lightbox);

  const image = lightbox.querySelector('.portfolio-lightbox__image');
  const closeButton = lightbox.querySelector('.portfolio-lightbox__close');
  const previousButton = lightbox.querySelector('.portfolio-lightbox__nav--prev');
  const nextButton = lightbox.querySelector('.portfolio-lightbox__nav--next');
  let currentIndex = -1;
  let returnFocus = null;

  const show = (index) => {
    currentIndex = (index + lightboxTriggers.length) % lightboxTriggers.length;
    const trigger = lightboxTriggers[currentIndex];
    image.src = trigger.dataset.lightboxSrc || '';
    image.alt = trigger.querySelector('img')?.alt || '';
    previousButton.hidden = lightboxTriggers.length < 2;
    nextButton.hidden = lightboxTriggers.length < 2;
  };

  const open = (index, trigger) => {
    returnFocus = trigger;
    show(index);
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  const close = () => {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    image.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
    returnFocus = null;
  };

  lightboxTriggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => open(index, trigger));
  });
  closeButton.addEventListener('click', close);
  previousButton.addEventListener('click', () => show(currentIndex - 1));
  nextButton.addEventListener('click', () => show(currentIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'ArrowLeft' && lightboxTriggers.length > 1) { event.preventDefault(); show(currentIndex - 1); }
    else if (event.key === 'ArrowRight' && lightboxTriggers.length > 1) { event.preventDefault(); show(currentIndex + 1); }
  });
})();
