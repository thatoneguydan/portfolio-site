(() => {
  'use strict';

  if (!document.querySelector('script[data-redesign-nav]')) {
    const navScript = document.createElement('script');
    navScript.src = '/assets/redesign-nav.js?v=20260909-a';
    navScript.dataset.redesignNav = '';
    document.head.append(navScript);
  }

  const grid = document.querySelector('#featured-work .rd-work-grid');
  if (!grid) return;

  const cards = () => Array.from(grid.querySelectorAll(':scope > .rd-work-card'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const liveShelves = new Set();
  let active = null;
  let resizeTimer = 0;
  let anchorJob = null;
  let suppressAnchorUntil = 0;

  const titleFor = (card) => card.querySelector('.rd-work-title')?.textContent?.trim() || 'Featured work';
  const videoIdFor = (card) => card.dataset.videoId?.trim() || '';
  const shelfSlug = (card) => card.dataset.shelfSlug?.trim() || new URL(card.href, location.href).pathname.replace(/^\/+|\/+$/g, '') || 'work';

  const clearHash = () => {
    if (location.hash.startsWith('#featured-')) history.replaceState(null, '', location.pathname + location.search);
  };

  const findRowEnd = (card) => {
    const top = card.getBoundingClientRect().top;
    let end = card;
    cards().forEach((candidate) => {
      if (Math.abs(candidate.getBoundingClientRect().top - top) < 3) end = candidate;
    });
    return end;
  };

  const injectInlineStyles = (doc) => {
    doc.getElementById('rd-home-inline-frame-style')?.remove();
    const style = doc.createElement('style');
    style.id = 'rd-home-inline-frame-style';
    style.textContent = `
      html, body { min-height:0 !important; margin:0 !important; overflow:hidden !important; background:#f5f5f2 !important; }
      body { padding:0 !important; }
      .site-header,.rproj-back,.rproj-related,.rcompat-related,.rd-footer-cta,.rcompat-footer { display:none !important; }
      .site-main,.project-redesign .site-main,.project-compat-redesign .site-main {
        width:min(90%,1380px) !important; max-width:none !important; margin:0 auto !important; padding:0 !important;
      }
      .rproj-header,.project-compat-redesign .rcompat-header { padding-top:52px !important; padding-bottom:42px !important; }
      .rproj-header h1 { font-size:clamp(44px,6vw,92px) !important; }
      .rproj-summary { font-size:clamp(16px,1.25vw,19px) !important; }
      .project-compat-redesign .rcompat-gallery,.project-photo .rproj-gallery { display:flex !important; align-items:flex-start !important; gap:8px !important; }
      .project-compat-redesign .rcompat-gallery > *,.project-photo .rproj-gallery-item { min-width:0 !important; height:auto !important; overflow:hidden !important; }
      .project-compat-redesign .rcompat-gallery img,.project-photo .rproj-gallery img,.project-photo .rproj-hero img { width:100% !important; height:auto !important; max-height:none !important; object-fit:contain !important; }
      @media (max-width:700px) {
        .site-main,.project-redesign .site-main,.project-compat-redesign .site-main { width:calc(100% - 32px) !important; }
        .rproj-header,.project-compat-redesign .rcompat-header { padding-top:36px !important; }
        .project-compat-redesign .rcompat-gallery,.project-photo .rproj-gallery { display:block !important; }
        .project-compat-redesign .rcompat-gallery > *,.project-photo .rproj-gallery-item { width:100% !important; margin-bottom:12px !important; }
      }
    `;
    doc.head.append(style);
  };

  const createShelf = (card) => {
    const videoId = videoIdFor(card);
    const shelf = document.createElement('section');
    shelf.className = `rdp-project-shelf rd-home-project-shelf${videoId ? ' rd-home-video-shelf' : ''}`;
    shelf.setAttribute('aria-hidden', 'true');
    shelf.setAttribute('aria-label', `${titleFor(card)} details`);

    if (videoId) {
      shelf.innerHTML = `<div class="rdp-project-shelf-inner"><div class="rd-home-video-stage"><iframe class="rd-home-video-frame" title="${titleFor(card).replace(/"/g, '&quot;')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div></div>`;
    } else {
      shelf.innerHTML = `<div class="rdp-project-shelf-inner"><div class="rdp-project-loading" aria-live="polite">Loading project…</div><iframe class="rdp-project-frame" title="${titleFor(card).replace(/"/g, '&quot;')}"></iframe></div>`;
    }

    const state = {
      card,
      shelf,
      videoId,
      iframe: shelf.querySelector('iframe'),
      loading: shelf.querySelector('.rdp-project-loading'),
      observer: null,
      cleanupTimer: 0,
    };
    findRowEnd(card).insertAdjacentElement('afterend', shelf);
    liveShelves.add(state);
    return state;
  };

  const disconnectObserver = (state) => {
    state.observer?.disconnect();
    state.observer = null;
  };

  const setShelfOpen = (state, open) => {
    state.shelf.classList.toggle('is-open', open);
    state.shelf.setAttribute('aria-hidden', open ? 'false' : 'true');
    state.card.setAttribute('aria-expanded', open ? 'true' : 'false');
    if ('inert' in state.shelf) state.shelf.inert = !open;
  };

  const stopTransitionAnchor = () => {
    if (!anchorJob) return;
    cancelAnimationFrame(anchorJob.raf);
    anchorJob.shelf?.removeEventListener('transitionend', anchorJob.onTransitionEnd);
    anchorJob = null;
  };

  const startTransitionAnchor = (card, shelf, anchorTop) => {
    stopTransitionAnchor();
    if (performance.now() < suppressAnchorUntil) return;
    const job = { card, shelf, anchorTop, raf: 0, startedAt: performance.now(), onTransitionEnd: null };
    anchorJob = job;
    const compensate = () => {
      if (!card.isConnected) return false;
      const delta = card.getBoundingClientRect().top - anchorTop;
      if (Math.abs(delta) > .5) scrollBy(0, delta);
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
      if (!compensate() || performance.now() - job.startedAt >= (reducedMotion.matches ? 80 : 600)) return finish();
      job.raf = requestAnimationFrame(tick);
    };
    job.raf = requestAnimationFrame(tick);
  };

  const scrollKeys = new Set(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ']);
  const cancelAnchorForUserScroll = (event) => {
    if (event.type === 'keydown') {
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (!scrollKeys.has(event.key)) return;
    }
    suppressAnchorUntil = performance.now() + 180;
    stopTransitionAnchor();
  };
  addEventListener('wheel', cancelAnchorForUserScroll, { passive:true, capture:true });
  addEventListener('touchmove', cancelAnchorForUserScroll, { passive:true, capture:true });
  addEventListener('keydown', cancelAnchorForUserScroll, { capture:true });

  const removeShelf = (state) => {
    clearTimeout(state.cleanupTimer);
    disconnectObserver(state);
    state.iframe.onload = null;
    if (state.iframe.src) state.iframe.src = 'about:blank';
    state.shelf.remove();
    liveShelves.delete(state);
  };

  const removeAfterClose = (state) => {
    if (reducedMotion.matches) return requestAnimationFrame(() => removeShelf(state));
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      state.shelf.removeEventListener('transitionend', onEnd);
      removeShelf(state);
    };
    const onEnd = (event) => {
      if (event.target === state.shelf && event.propertyName === 'grid-template-rows') finish();
    };
    state.shelf.addEventListener('transitionend', onEnd);
    state.cleanupTimer = setTimeout(finish, 620);
  };

  const prepareProjectFrame = (state) => {
    const doc = state.iframe.contentDocument;
    if (!doc || !state.shelf.isConnected) return;
    disconnectObserver(state);
    injectInlineStyles(doc);
    doc.body?.classList.add('rd-home-inline-frame');
    doc.querySelectorAll('img').forEach((img) => { img.decoding = 'async'; if (img.loading !== 'eager') img.loading = 'lazy'; });
    const main = doc.querySelector('.site-main');
    const resize = () => {
      if (!state.iframe.isConnected || !main || !doc.body) return;
      const height = Math.max(Math.ceil(main.getBoundingClientRect().bottom - doc.body.getBoundingClientRect().top), 320);
      state.iframe.style.height = `${height}px`;
    };
    resize(); requestAnimationFrame(resize); setTimeout(resize, 120); setTimeout(resize, 500);
    const RO = state.iframe.contentWindow?.ResizeObserver;
    if (RO && main) { state.observer = new RO(resize); state.observer.observe(main); }
  };

  const loadShelf = (state) => {
    if (state.videoId) {
      state.iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(state.videoId)}?autoplay=1&rel=0`;
      return;
    }
    const url = new URL(state.card.href, location.href);
    url.searchParams.set('inlineShelf', '1');
    state.iframe.onload = () => {
      if (!state.shelf.isConnected) return;
      prepareProjectFrame(state);
      if (state.loading) state.loading.hidden = true;
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
    const cardRect = card.getBoundingClientRect();
    const shouldAnchor = Boolean(previous?.shelf?.isConnected && previous.shelf.getBoundingClientRect().bottom <= cardRect.top + 2);
    const next = createShelf(card);
    active = next;
    previous?.card.classList.remove('is-active');
    card.classList.add('is-active');
    loadShelf(next);

    requestAnimationFrame(() => {
      if (previous) {
        if (shouldAnchor) startTransitionAnchor(card, previous.shelf, cardRect.top); else stopTransitionAnchor();
        disconnectObserver(previous);
        setShelfOpen(previous, false);
        removeAfterClose(previous);
      } else stopTransitionAnchor();
      setShelfOpen(next, true);
    });

    if (updateHash) history.replaceState(null, '', `${location.pathname}${location.search}#featured-${shelfSlug(card)}`);
  };

  cards().forEach((card) => {
    card.setAttribute('aria-expanded', 'false');
    card.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openOnly(card, true);
    });
  });

  const requestedSlug = location.hash.startsWith('#featured-') ? location.hash.slice('#featured-'.length) : '';
  if (requestedSlug) {
    const card = cards().find((item) => shelfSlug(item) === requestedSlug);
    if (card) requestAnimationFrame(() => openOnly(card, false));
  }

  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      liveShelves.forEach((state) => {
        if (state.shelf.isConnected) findRowEnd(state.card).insertAdjacentElement('afterend', state.shelf);
      });
    }, 120);
  });
})();
