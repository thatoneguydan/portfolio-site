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

  const contactForms = Array.from(document.querySelectorAll('[data-portfolio-contact]'));
  const setContactStatus = (form, message) => {
    const status = form.querySelector('[data-contact-status]');
    if (status) status.textContent = message || '';
  };

  let turnstileLoader = null;
  const loadTurnstile = () => {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (turnstileLoader) return turnstileLoader;
    turnstileLoader = new Promise((resolve, reject) => {
      const ready = () => {
        if (window.turnstile?.render) resolve(window.turnstile);
        else reject(new Error('Verification could not initialize.'));
      };
      const fail = () => reject(new Error('Verification could not load.'));
      const existing = document.querySelector('script[data-portfolio-turnstile-script]');
      if (existing) {
        if (window.turnstile?.render) { ready(); return; }
        existing.addEventListener('load', ready, { once: true });
        existing.addEventListener('error', fail, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.portfolioTurnstileScript = '';
      script.addEventListener('load', ready, { once: true });
      script.addEventListener('error', fail, { once: true });
      document.head.append(script);
    });
    return turnstileLoader;
  };

  const initializeContactTurnstile = async (form) => {
    const host = form.querySelector('[data-contact-turnstile]');
    const sitekey = String(form.dataset.turnstileSitekey || '').trim();
    if (!host || !sitekey) return;
    try {
      const turnstile = await loadTurnstile();
      const widgetId = turnstile.render(host, {
        sitekey,
        appearance: 'interaction-only',
        callback(token) {
          form.dataset.turnstileToken = String(token || '');
          setContactStatus(form, '');
        },
        'expired-callback'() { form.dataset.turnstileToken = ''; },
        'timeout-callback'() { form.dataset.turnstileToken = ''; },
        'error-callback'() {
          form.dataset.turnstileToken = '';
          setContactStatus(form, 'Verification could not load. Please refresh and try again.');
        }
      });
      form.dataset.turnstileWidget = String(widgetId);
    } catch (error) {
      console.error('Turnstile initialization failed:', error?.message || error);
      setContactStatus(form, 'Verification could not load. Please refresh and try again.');
    }
  };

  for (const form of contactForms) initializeContactTurnstile(form);

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-portfolio-contact]')) return;
    if (!form.checkValidity()) return;
    event.preventDefault();
    if (form.dataset.submitting === 'true') return;

    const value = (name) => String(form.elements.namedItem(name)?.value || '').trim();
    const name = value('field1') || value('name');
    const senderEmail = value('email');
    const message = value('field2') || value('message');
    const website = value('website');
    const turnstileToken = String(form.dataset.turnstileToken || '').trim();
    const endpoint = String(form.dataset.contactEndpoint || '/api/contact').trim();
    const submitButton = form.querySelector('button[type="submit"]');

    if (!turnstileToken) {
      setContactStatus(form, 'Please complete the verification and try again.');
      return;
    }

    form.dataset.submitting = 'true';
    if (submitButton) submitButton.disabled = true;
    setContactStatus(form, 'Sending…');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email: senderEmail,
          message,
          website,
          turnstileToken
        })
      });
      let payload = null;
      try { payload = await response.json(); } catch {}
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Your message could not be sent. Please try again.');
      }
      const status = form.querySelector('[data-contact-status]');
      if (status) status.textContent = status.dataset.sentMessage || 'Thank you!';
      form.reset();
    } catch (error) {
      console.error('Contact submission failed:', error?.message || error);
      setContactStatus(form, error?.message || 'Your message could not be sent. Please try again.');
    } finally {
      form.dataset.submitting = 'false';
      form.dataset.turnstileToken = '';
      if (submitButton) submitButton.disabled = false;
      const widgetId = form.dataset.turnstileWidget;
      if (widgetId && window.turnstile?.reset) window.turnstile.reset(widgetId);
    }
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