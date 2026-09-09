(() => {
  'use strict';

  const grid = document.querySelector('.rdp-project-grid');
  if (!grid) return;

  const cards = () => Array.from(grid.querySelectorAll(':scope > .rdp-project-card'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeCard = null;
  let activeResizeObserver = null;
  let resizeTimer = 0;
  let actionSequence = 0;

  const shelf = document.createElement('section');
  shelf.className = 'rdp-project-shelf';
  shelf.setAttribute('aria-hidden', 'true');
  shelf.innerHTML = `
    <div class="rdp-project-shelf-inner">
      <div class="rdp-project-loading" aria-live="polite">Loading project…</div>
      <iframe class="rdp-project-frame" title="Project details"></iframe>
    </div>
  `;

  const iframe = shelf.querySelector('.rdp-project-frame');
  const loading = shelf.querySelector('.rdp-project-loading');

  const setImageHints = () => {
    cards().forEach((card) => {
      const image = card.querySelector('img');
      if (!image) return;
      image.decoding = 'async';
      image.fetchPriority = 'low';
    });
  };

  const clearHash = () => {
    if (!window.location.hash.startsWith('#project-')) return;
    history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const shelfSlug = (card) => {
    const path = new URL(card.href, window.location.href).pathname.replace(/^\/+|\/+$/g, '');
    return path || 'project';
  };

  const findRowEnd = (card) => {
    const allCards = cards();
    const targetTop = card.getBoundingClientRect().top;
    let end = card;

    allCards.forEach((candidate) => {
      const top = candidate.getBoundingClientRect().top;
      if (Math.abs(top - targetTop) < 3) end = candidate;
    });

    return end;
  };

  const setShelfOpen = (shouldOpen) => {
    shelf.classList.toggle('is-open', shouldOpen);
    shelf.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if ('inert' in shelf) shelf.inert = !shouldOpen;
  };

  const waitForShelfMotion = () => new Promise((resolve) => {
    if (reducedMotion.matches || !shelf.isConnected) {
      requestAnimationFrame(resolve);
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      shelf.removeEventListener('transitionend', onTransitionEnd);
      window.clearTimeout(fallback);
      resolve();
    };
    const onTransitionEnd = (event) => {
      if (event.target === shelf && event.propertyName === 'grid-template-rows') finish();
    };
    const fallback = window.setTimeout(finish, 620);
    shelf.addEventListener('transitionend', onTransitionEnd);
  });

  const disconnectResizeObserver = () => {
    activeResizeObserver?.disconnect();
    activeResizeObserver = null;
  };

  const injectInlineStyles = (doc) => {
    const oldStyle = doc.getElementById('rdp-inline-frame-style');
    oldStyle?.remove();

    const style = doc.createElement('style');
    style.id = 'rdp-inline-frame-style';
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
      .rproj-header,
      .project-compat-redesign .rcompat-header {
        padding-top: 52px !important;
        padding-bottom: 42px !important;
      }
      .rproj-header h1 { font-size: clamp(44px, 6vw, 92px) !important; }
      .rproj-summary { font-size: clamp(16px, 1.25vw, 19px) !important; }

      /* Preserve the migrated gallery model: media-collection children carry
         proportional flex weights that make unlike aspect ratios share a row
         height without cropping. */
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

      button[data-lightbox-src] { overflow: hidden !important; }
      button[data-lightbox-src] img {
        transform: scale(1) !important;
        transition: transform 360ms cubic-bezier(.2,.7,.2,1) !important;
      }
      button[data-lightbox-src]:hover img,
      button[data-lightbox-src]:focus-visible img {
        transform: scale(1.015) !important;
      }

      .project-compat-redesign .site-main > .rcompat-image-module,
      .project-compat-redesign .site-main > .rcompat-text-module,
      .project-compat-redesign .rcompat-layout,
      .project-compat-redesign .rcompat-gallery {
        padding-top: clamp(38px, 5vw, 76px) !important;
        padding-bottom: clamp(38px, 5vw, 76px) !important;
      }

      @media (max-width: 700px) {
        .site-main,
        .project-redesign .site-main,
        .project-compat-redesign .site-main { width: calc(100% - 32px) !important; }
        .rproj-header,
        .project-compat-redesign .rcompat-header { padding-top: 36px !important; }
        .project-compat-redesign .rcompat-gallery,
        .project-photo .rproj-gallery {
          display: block !important;
        }
        .project-compat-redesign .rcompat-gallery > *,
        .project-photo .rproj-gallery-item {
          width: 100% !important;
          margin-bottom: 12px !important;
        }
      }
    `;
    doc.head.append(style);
  };

  const prepareFrameDocument = () => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    disconnectResizeObserver();
    injectInlineStyles(doc);
    doc.body?.classList.add('rdp-inline-frame');

    doc.querySelectorAll('img').forEach((image) => {
      image.decoding = 'async';
      if (image.loading !== 'eager') image.loading = 'lazy';
    });

    const resize = () => {
      if (!iframe.isConnected) return;
      const height = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        320,
      );
      iframe.style.height = `${height}px`;
    };

    resize();
    requestAnimationFrame(resize);
    window.setTimeout(resize, 120);
    window.setTimeout(resize, 500);

    const FrameResizeObserver = iframe.contentWindow?.ResizeObserver;
    if (FrameResizeObserver && doc.documentElement) {
      activeResizeObserver = new FrameResizeObserver(resize);
      activeResizeObserver.observe(doc.documentElement);
    }
  };

  const closeCurrentShelf = async ({ updateHistory = true } = {}) => {
    if (!activeCard && !shelf.classList.contains('is-open')) {
      if (updateHistory) clearHash();
      return;
    }

    const wasOpen = shelf.classList.contains('is-open');
    activeCard?.classList.remove('is-active');
    activeCard = null;
    disconnectResizeObserver();
    setShelfOpen(false);
    if (updateHistory) clearHash();

    if (wasOpen) await waitForShelfMotion();
  };

  const mountProject = (card, { updateHistory = true, sequence } = {}) => {
    const rowEnd = findRowEnd(card);
    rowEnd.insertAdjacentElement('afterend', shelf);

    activeCard = card;
    card.classList.add('is-active');
    shelf.setAttribute('aria-label', `${card.querySelector('.rdp-project-title')?.textContent?.trim() || 'Project'} details`);
    iframe.title = card.querySelector('.rdp-project-title')?.textContent?.trim() || 'Project details';
    iframe.style.height = '0px';
    loading.hidden = false;
    setShelfOpen(false);

    const url = new URL(card.href, window.location.href);
    url.searchParams.set('inlineShelf', '1');

    iframe.onload = () => {
      if (sequence !== actionSequence || activeCard !== card) return;
      prepareFrameDocument();
      loading.hidden = true;
      requestAnimationFrame(() => {
        if (sequence !== actionSequence || activeCard !== card) return;
        setShelfOpen(true);
      });
    };

    iframe.src = `${url.pathname}${url.search}`;

    if (updateHistory) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#project-${shelfSlug(card)}`);
    }
  };

  const toggleProject = async (card, { updateHistory = true } = {}) => {
    const sequence = ++actionSequence;

    if (activeCard === card) {
      await closeCurrentShelf({ updateHistory });
      return;
    }

    if (activeCard || shelf.classList.contains('is-open')) {
      await closeCurrentShelf({ updateHistory: false });
    }

    if (sequence !== actionSequence) return;
    mountProject(card, { updateHistory, sequence });
  };

  setImageHints();

  cards().forEach((card) => {
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
      toggleProject(card);
    });
  });

  const requestedSlug = window.location.hash.startsWith('#project-')
    ? window.location.hash.slice('#project-'.length)
    : '';

  if (requestedSlug) {
    const requestedCard = cards().find((card) => shelfSlug(card) === requestedSlug);
    if (requestedCard) {
      requestAnimationFrame(() => toggleProject(requestedCard, { updateHistory: false }));
    }
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!activeCard || !shelf.isConnected) return;
      const rowEnd = findRowEnd(activeCard);
      rowEnd.insertAdjacentElement('afterend', shelf);
    }, 120);
  });
})();
