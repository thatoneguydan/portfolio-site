(() => {
  'use strict';

  if (window.__redesignContactShelfInitialized) return;
  window.__redesignContactShelfInitialized = true;

  /* The original portfolio embedded this DS icon as a data URI. Keep the same
     artwork as a real favicon asset so every route can resolve it immediately. */
  const faviconHref = '/favicon.ico?v=20260910-original';
  let favicon = document.querySelector('link[rel~="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.append(favicon);
  }
  favicon.removeAttribute('type');
  favicon.href = faviconHref;
  document.querySelectorAll('link[rel~="icon"]').forEach((candidate) => {
    if (candidate !== favicon) candidate.remove();
  });

  const normalizePath = (pathname) => pathname.replace(/\/+$/, '') || '/';
  if (normalizePath(window.location.pathname) === '/contact') return;

  const ensureStylesheet = (href) => {
    const base = href.split('?')[0];
    const existing = document.querySelector(`link[href^="${base}"]`);
    if (existing) {
      if (existing.getAttribute('href') !== href) existing.setAttribute('href', href);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  };

  ensureStylesheet('/assets/redesign-contact-shelf.css?v=20260911-e');
  ensureStylesheet('/assets/redesign-footer-contact.css?v=20260910-b');

  const footerMarkup = `
    <div class="rd-footer-cta-inner">
      <div class="rd-footer-cta-row">
        <h2>Have something in mind?</h2>
        <a class="rd-footer-cta-button" href="/contact">Let's make it <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  `;

  const normalizeFooter = (footer) => {
    if (!(footer instanceof HTMLElement) || footer.dataset.sharedContactFooter === 'true') return;
    footer.dataset.sharedContactFooter = 'true';
    footer.innerHTML = footerMarkup;
  };

  const normalizeFootersIn = (root) => {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches('.rd-footer-cta')) normalizeFooter(root);
    root.querySelectorAll?.('.rd-footer-cta').forEach(normalizeFooter);
  };

  normalizeFootersIn(document);

  const footerObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) normalizeFootersIn(node);
      }
    }
  });
  if (document.body) footerObserver.observe(document.body, { childList: true, subtree: true });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let shelfSequence = 0;

  const isContactLink = (link) => {
    if (!(link instanceof HTMLAnchorElement)) return false;
    let url;
    try { url = new URL(link.href, window.location.href); } catch { return false; }
    return url.origin === window.location.origin && normalizePath(url.pathname) === '/contact';
  };

  const directMainChildFor = (link) => {
    const main = link.closest('main');
    if (!main) return null;
    let node = link;
    while (node.parentElement && node.parentElement !== main) node = node.parentElement;
    return node.parentElement === main ? node : null;
  };

  const navBottom = () => {
    const header = document.querySelector('.site-header');
    if (!(header instanceof HTMLElement)) return 0;
    const rect = header.getBoundingClientRect();
    return Math.max(0, Math.min(window.innerHeight, rect.bottom));
  };

  const desiredScrollTop = (state) => {
    const shelfTop = state.shelf.getBoundingClientRect().top + window.scrollY;
    return Math.max(0, shelfTop - navBottom());
  };

  const maxScrollTop = () => Math.max(
    0,
    Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0) - window.innerHeight
  );

  /* Footer contact shelves reserve their loading geometry immediately, so one
     native smooth scroll can begin on the next paint instead of waiting for
     the shelf transition, iframe load, or ResizeObserver. There are no later
     correction scrolls, which also avoids the old hitching behavior. */
  const startAutoScroll = (state) => {
    if (!state?.autoScroll || state.autoScrollStarted || !state.shelf?.isConnected) return false;
    state.autoScrollStarted = true;

    const target = desiredScrollTop(state);
    const max = maxScrollTop();
    window.scrollTo({
      top: Math.min(target, max),
      left: 0,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
    return true;
  };

  const cleanup = (state, restoreFocus = false) => {
    if (!state) return;
    window.clearTimeout(state.removeTimer);
    state.resizeObserver?.disconnect();
    state.resizeObserver = null;
    state.source?.setAttribute('aria-expanded', 'false');
    state.source?.removeAttribute('aria-controls');
    state.frame.onload = null;
    if (state.frame.src) state.frame.src = 'about:blank';
    state.shelf.remove();
    if (active === state) active = null;
    if (restoreFocus && state.source instanceof HTMLElement && state.source.isConnected) state.source.focus();
  };

  const close = (state = active, restoreFocus = false, immediate = false) => {
    if (!state) return;
    state.shelf.classList.remove('is-open', 'is-loaded', 'rc-inline-contact-shelf--autoscroll');
    state.shelf.setAttribute('aria-hidden', 'true');
    state.source?.setAttribute('aria-expanded', 'false');
    state.resizeObserver?.disconnect();
    state.resizeObserver = null;

    if (immediate || reducedMotion.matches) {
      cleanup(state, restoreFocus);
      return;
    }

    state.removeTimer = window.setTimeout(() => cleanup(state, restoreFocus), 500);
  };

  const resizeFrame = (state) => {
    if (!state?.frame?.isConnected) return;
    const doc = state.frame.contentDocument;
    if (!doc?.documentElement || !doc.body) return;

    const main = doc.querySelector('.site-main');
    const height = Math.max(
      doc.documentElement.scrollHeight,
      doc.body.scrollHeight,
      main?.scrollHeight || 0,
      560
    );
    state.frame.style.height = `${Math.ceil(height)}px`;
  };

  const prepareFrame = (state) => {
    const doc = state.frame.contentDocument;
    if (!doc?.body || !state.shelf.isConnected) return;

    resizeFrame(state);
    state.shelf.classList.add('is-loaded');

    requestAnimationFrame(() => resizeFrame(state));

    const FrameResizeObserver = state.frame.contentWindow?.ResizeObserver;
    if (FrameResizeObserver) {
      state.resizeObserver = new FrameResizeObserver(() => resizeFrame(state));
      state.resizeObserver.observe(doc.documentElement);
      state.resizeObserver.observe(doc.body);
      const main = doc.querySelector('.site-main');
      if (main) state.resizeObserver.observe(main);
    }
  };

  const placeholderMarkup = `
    <div class="rc-inline-contact-placeholder" aria-hidden="true">
      <div class="rc-inline-contact-placeholder-copy">
        <span class="rc-placeholder-line rc-placeholder-line--title"></span>
        <span class="rc-placeholder-line rc-placeholder-line--long"></span>
        <span class="rc-placeholder-line rc-placeholder-line--short"></span>
      </div>
      <div class="rc-inline-contact-placeholder-form">
        <span class="rc-placeholder-field"></span>
        <span class="rc-placeholder-field"></span>
        <span class="rc-placeholder-field rc-placeholder-field--message"></span>
        <span class="rc-placeholder-button"></span>
      </div>
    </div>
  `;

  const open = (source) => {
    const anchor = directMainChildFor(source);
    if (!anchor) {
      window.location.assign('/contact');
      return;
    }

    if (active?.source === source && active.shelf.isConnected) {
      close(active, true);
      return;
    }

    if (active) close(active, false, true);

    const autoScroll = Boolean(source.closest('.rd-footer-cta'));
    const id = `contact-shelf-${++shelfSequence}`;
    const shelf = document.createElement('section');
    shelf.id = id;
    shelf.className = 'rc-inline-contact-shelf';
    if (autoScroll) shelf.classList.add('rc-inline-contact-shelf--autoscroll');
    shelf.setAttribute('aria-hidden', 'true');
    shelf.setAttribute('aria-label', 'Contact Dan Smith');
    shelf.innerHTML = `
      <div class="rc-inline-contact-shell">
        <button class="rc-inline-contact-close" type="button" aria-label="Close contact">×</button>
        ${placeholderMarkup}
        <iframe class="rc-inline-contact-frame" title="Contact Dan Smith" src="/contact?inlineShelf=1"></iframe>
      </div>
    `;

    const state = {
      source,
      shelf,
      frame: shelf.querySelector('.rc-inline-contact-frame'),
      closeButton: shelf.querySelector('.rc-inline-contact-close'),
      resizeObserver: null,
      removeTimer: 0,
      autoScroll,
      autoScrollStarted: false,
    };
    active = state;

    source.setAttribute('aria-expanded', 'true');
    source.setAttribute('aria-controls', id);
    anchor.insertAdjacentElement('afterend', shelf);

    state.frame.addEventListener('load', () => prepareFrame(state), { once: true });
    state.closeButton.addEventListener('click', () => close(state, true));

    /* Auto-scroll shelves already have placeholder height at insertion time.
       Begin moving as soon as that geometry has been committed. */
    if (autoScroll) requestAnimationFrame(() => startAutoScroll(state));

    requestAnimationFrame(() => {
      if (!shelf.isConnected) return;
      shelf.setAttribute('aria-hidden', 'false');
      shelf.classList.add('is-open');
    });
  };

  document.addEventListener('click', (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const link = event.target.closest?.('a[href]');
    if (!isContactLink(link)) return;
    if (link.closest('.site-nav')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    open(link);
  }, { capture: true });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault();
    close(active, true);
  });
})();
