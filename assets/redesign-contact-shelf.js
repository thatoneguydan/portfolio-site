(() => {
  'use strict';

  if (window.__redesignContactShelfInitialized) return;
  window.__redesignContactShelfInitialized = true;

  const normalizePath = (pathname) => pathname.replace(/\/+$/, '') || '/';
  if (normalizePath(window.location.pathname) === '/contact') return;

  const stylesheetPath = '/assets/redesign-contact-shelf.css';
  if (!document.querySelector(`link[href^="${stylesheetPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${stylesheetPath}?v=20260910-a`;
    document.head.append(link);
  }

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
    state.shelf.classList.remove('is-open', 'is-loaded');
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
    requestAnimationFrame(() => resizeFrame(state));
    window.setTimeout(() => resizeFrame(state), 120);
    window.setTimeout(() => resizeFrame(state), 600);

    const FrameResizeObserver = state.frame.contentWindow?.ResizeObserver;
    if (FrameResizeObserver) {
      state.resizeObserver = new FrameResizeObserver(() => resizeFrame(state));
      state.resizeObserver.observe(doc.documentElement);
      state.resizeObserver.observe(doc.body);
      const main = doc.querySelector('.site-main');
      if (main) state.resizeObserver.observe(main);
    }

    state.shelf.classList.add('is-loaded');
  };

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

    const id = `contact-shelf-${++shelfSequence}`;
    const shelf = document.createElement('section');
    shelf.id = id;
    shelf.className = 'rc-inline-contact-shelf';
    shelf.setAttribute('aria-hidden', 'true');
    shelf.setAttribute('aria-label', 'Contact Dan Smith');
    shelf.innerHTML = `
      <div class="rc-inline-contact-shell">
        <button class="rc-inline-contact-close" type="button" aria-label="Close contact">×</button>
        <p class="rc-inline-contact-loading" aria-live="polite">Loading contact…</p>
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
    };
    active = state;

    source.setAttribute('aria-expanded', 'true');
    source.setAttribute('aria-controls', id);
    anchor.insertAdjacentElement('afterend', shelf);

    state.frame.addEventListener('load', () => prepareFrame(state), { once: true });
    state.closeButton.addEventListener('click', () => close(state, true));

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
