(() => {
  'use strict';

  const grid = document.querySelector('.rd-work-grid');
  if (!grid) return;

  const cards = () => Array.from(grid.querySelectorAll(':scope > .rd-work-card'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const liveShelves = new Set();
  let active = null;
  let resizeTimer = 0;
  let anchorJob = null;
  let suppressAnchorUntil = 0;

  const titleFor = (card) => card.querySelector('.rd-work-title')?.textContent?.trim() || 'Selected work';

  const shelfSlug = (card) => {
    const path = new URL(card.href, window.location.href).pathname.replace(/^\/+|\/+$/g, '');
    return path || 'work';
  };

  const clearHash = () => {
    if (!window.location.hash.startsWith('#selected-')) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const findRowEnd = (card) => {
    const targetTop = card.getBoundingClientRect().top;
    let end = card;
    cards().forEach((candidate) => {
      const top = candidate.getBoundingClientRect().top;
      if (Math.abs(top - targetTop) < 3) end = candidate;
    });
    return end;
  };

  const injectInlineStyles = (doc) => {
    doc.getElementById('rd-home-inline-frame-style')?.remove();
    const style = doc.createElement('style');
    style.id = 'rd-home-inline-frame-style';
    style.textContent = `
      html, body {
        min-height: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: #f5f5f2 !important;
      }
      body { padding: 0 !important; }
      .site-header,
      .rproj-back,
      .rproj-related,
      .rcompat-related,
      .rd-footer-cta,
      .rcompat-footer { display: none !important; }
      .site-main,
      .project-redesign .site-main,
      .project-compat-redesign .site-main {
        width: min(90%, 1380px) !important;
        max-width: none !important;
        margin: 0 auto !important;
        padding: 0 0 58px !important;
      }
      body.rd-home-inline-frame .site-main,
      body.rd-home-inline-frame.project-redesign .site-main,
      body.rd-home-inline-frame.project-compat-redesign .site-main {
        padding-bottom: 0 !important;
      }
      .rproj-header,
      .project-compat-redesign .rcompat-header {
        padding-top: 52px !important;
        padding-bottom: 42px !important;
      }
      .rproj-header h1 { font-size: clamp(44px, 6vw, 92px) !important; }
      .rproj-summary { font-size: clamp(16px, 1.25vw, 19px) !important; }

      .project-compat-redesign .rcompat-gallery {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
        gap: 8px !important;
      }
      .project-compat-redesign .rcompat-gallery > * {
        min-width: 0 !important;
        height: auto !important;
        overflow: hidden !important;
      }
      .project-compat-redesign .rcompat-gallery button,
      .project-compat-redesign .rcompat-gallery img {
        height: auto !important;
      }
      .project-compat-redesign .rcompat-gallery img {
        width: 100% !important;
        object-fit: contain !important;
      }

      .project-photo .rproj-hero img,
      .project-photo .rproj-gallery img {
        height: auto !important;
        max-height: none !important;
        object-fit: contain !important;
      }
      .project-photo .rproj-gallery {
        display: flex !important;
        align-items: flex-start !important;
        gap: 8px !important;
      }
      .project-photo .rproj-gallery-item {
        min-width: 0 !important;
        min-height: 0 !important;
        height: auto !important;
        overflow: hidden !important;
      }

      @media (max-width: 700px) {
        .site-main,
        .project-redesign .site-main,
        .project-compat-redesign .site-main { width: calc(100% - 32px) !important; }
        .rproj-header,
        .project-compat-redesign .rcompat-header { padding-top: 36px !important; }
        .project-compat-redesign .rcompat-gallery,
        .project-photo .rproj-gallery { display: block !important; }
        .project-compat-redesign .rcompat-gallery > *,
        .project-photo .rproj-gallery-item {
          width: 100% !important;
          margin-bottom: 12px !important;
        }
      }
    `;
    doc.head.append(style);
  };

  const createShelf = (card) => {
    const shelf = document.createElement('section');
    shelf.className = 'rdp-project-shelf rd-home-project-shelf';
    shelf.setAttribute('aria-hidden', 'true');
    shelf.setAttribute('aria-label', `${titleFor(card)} details`);
    shelf.innerHTML = `
      <div class="rdp-project-shelf-inner">
        <div class="rdp-project-loading" aria-live="polite">Loading project…</div>
        <iframe class="rdp-project-frame" title="${titleFor(card).replace(/"/g, '&quot;')}"></iframe>
      </div>
    `;

    const state = {
      card,
      shelf,
      iframe: shelf.querySelector('.rdp-project-frame'),
      loading: shelf.querySelector('.rdp-project-loading'),
      observer: null,
      cleanupTimer: 0,
    };

    findRowEnd(card).insertAdjacentElement('afterend', shelf);
    liveShelves.add(state);
    return state;
  };

  const setShelfOpen = (state, shouldOpen) => {
    state.shelf.classList.toggle('is-open', shouldOpen);
    state.shelf.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    state.card.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    if ('inert' in state.shelf) state.shelf.inert = !shouldOpen;
  };

  const disconnectObserver = (state) => {
    state.observer?.disconnect();
    state.observer = null;
  };

  const stopTransitionAnchor = () => {
    if (!anchorJob) return;
    window.cancelAnimationFrame(anchorJob.raf);
    anchorJob.shelf?.removeEventListener('transitionend', anchorJob.onTransitionEnd);
    anchorJob = null;
  };

  const startTransitionAnchor = (card, shelf, anchorTop) => {
    stopTransitionAnchor();
    if (performance.now() < suppressAnchorUntil) return;

    const job = {
      card,
      shelf,
      anchorTop,
      raf: 0,
      startedAt: performance.now(),
      onTransitionEnd: null,
    };
    anchorJob = job;

    const compensate = () => {
      if (!card.isConnected) return false;
      const delta = card.getBoundingClientRect().top - anchorTop;
      if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
      return true;
    };

    const finish = () => {
      if (anchorJob !== job) return;
      compensate();
      stopTransitionAnchor();
    };

    job.onTransitionEnd = (event) => {
      if (event.target === shelf && event.propertyName === 'grid-template-rows') finish();
    };
    shelf.addEventListener('transitionend', job.onTransitionEnd);

    const tick = () => {
      if (anchorJob !== job) return;
      if (!compensate()) {
        stopTransitionAnchor();
        return;
      }
      if (performance.now() - job.startedAt >= (reducedMotion.matches ? 80 : 600)) {
        finish();
        return;
      }
      job.raf = window.requestAnimationFrame(tick);
    };

    job.raf = window.requestAnimationFrame(tick);
  };

  const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

  const cancelAnchorForUserScroll = (event) => {
    if (event.type === 'keydown') {
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!scrollKeys.has(event.key)) return;
    }

    suppressAnchorUntil = performance.now() + 180;
    stopTransitionAnchor();
  };

  const installScrollIntentListeners = (targetWindow) => {
    if (!targetWindow || targetWindow.__rdpShelfScrollIntentBound) return;
    targetWindow.__rdpShelfScrollIntentBound = true;
    targetWindow.addEventListener('wheel', cancelAnchorForUserScroll, { passive: true, capture: true });
    targetWindow.addEventListener('touchmove', cancelAnchorForUserScroll, { passive: true, capture: true });
    targetWindow.addEventListener('keydown', cancelAnchorForUserScroll, { capture: true });
    targetWindow.addEventListener('pointerdown', () => stopTransitionAnchor(), { passive: true, capture: true });
  };

  installScrollIntentListeners(window);

  const removeShelf = (state) => {
    window.clearTimeout(state.cleanupTimer);
    disconnectObserver(state);
    state.iframe.onload = null;
    if (state.iframe.src) state.iframe.src = 'about:blank';
    state.shelf.remove();
    liveShelves.delete(state);
  };

  const removeAfterClose = (state) => {
    if (reducedMotion.matches) {
      requestAnimationFrame(() => removeShelf(state));
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      state.shelf.removeEventListener('transitionend', onTransitionEnd);
      removeShelf(state);
    };
    const onTransitionEnd = (event) => {
      if (event.target === state.shelf && event.propertyName === 'grid-template-rows') finish();
    };

    state.shelf.addEventListener('transitionend', onTransitionEnd);
    state.cleanupTimer = window.setTimeout(finish, 620);
  };

  const prepareFrameDocument = (state) => {
    const doc = state.iframe.contentDocument;
    if (!doc || !state.shelf.isConnected) return;

    disconnectObserver(state);
    injectInlineStyles(doc);
    installScrollIntentListeners(state.iframe.contentWindow);
    doc.body?.classList.add('rd-home-inline-frame');

    doc.querySelectorAll('img').forEach((image) => {
      image.decoding = 'async';
      if (image.loading !== 'eager') image.loading = 'lazy';
    });

    const main = doc.querySelector('.site-main');
    const resize = () => {
      if (!state.iframe.isConnected || !main || !doc.body) return;
      const bodyTop = doc.body.getBoundingClientRect().top;
      const contentBottom = main.getBoundingClientRect().bottom;
      const height = Math.max(Math.ceil(contentBottom - bodyTop), 320);
      state.iframe.style.height = `${height}px`;
    };

    resize();
    requestAnimationFrame(resize);
    window.setTimeout(resize, 120);
    window.setTimeout(resize, 500);

    const FrameResizeObserver = state.iframe.contentWindow?.ResizeObserver;
    if (FrameResizeObserver && main) {
      state.observer = new FrameResizeObserver(resize);
      state.observer.observe(main);
    }
  };

  const loadProject = (state) => {
    const url = new URL(state.card.href, window.location.href);
    url.searchParams.set('inlineShelf', '1');

    state.iframe.onload = () => {
      if (!state.shelf.isConnected) return;
      prepareFrameDocument(state);
      state.loading.hidden = true;
    };

    state.iframe.src = `${url.pathname}${url.search}`;
  };

  const closeState = (state) => {
    state.card.classList.remove('is-active');
    disconnectObserver(state);
    setShelfOpen(state, false);
    removeAfterClose(state);
  };

  const openOnly = (card, updateHash = true) => {
    if (active?.card === card) {
      stopTransitionAnchor();
      const closing = active;
      active = null;
      closeState(closing);
      if (updateHash) clearHash();
      return;
    }

    const previous = active;
    const cardRectBefore = card.getBoundingClientRect();
    const shouldAnchor = Boolean(
      previous?.shelf?.isConnected &&
      previous.shelf.getBoundingClientRect().bottom <= cardRectBefore.top + 2
    );
    const anchorTop = cardRectBefore.top;
    const next = createShelf(card);
    active = next;

    previous?.card.classList.remove('is-active');
    card.classList.add('is-active');
    loadProject(next);

    requestAnimationFrame(() => {
      if (previous) {
        if (shouldAnchor) startTransitionAnchor(card, previous.shelf, anchorTop);
        else stopTransitionAnchor();
        disconnectObserver(previous);
        setShelfOpen(previous, false);
        removeAfterClose(previous);
      } else {
        stopTransitionAnchor();
      }
      setShelfOpen(next, true);
    });

    if (updateHash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#selected-${shelfSlug(card)}`);
    }
  };

  cards().forEach((card) => {
    card.setAttribute('aria-expanded', 'false');
    card.addEventListener('click', (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      event.preventDefault();
      openOnly(card, true);
    });
  });

  const requestedSlug = window.location.hash.startsWith('#selected-')
    ? window.location.hash.slice('#selected-'.length)
    : '';
  if (requestedSlug) {
    const requestedCard = cards().find((card) => shelfSlug(card) === requestedSlug);
    if (requestedCard) requestAnimationFrame(() => openOnly(requestedCard, false));
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      liveShelves.forEach((state) => {
        if (!state.shelf.isConnected) return;
        findRowEnd(state.card).insertAdjacentElement('afterend', state.shelf);
      });
    }, 120);
  });
})();
