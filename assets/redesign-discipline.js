(() => {
  'use strict';

  const grid = document.querySelector('.rdp-project-grid');
  if (!grid) return;

  const cards = () => Array.from(grid.querySelectorAll(':scope > .rdp-project-card'));
  let activeCard = null;
  let activeShelf = null;
  let activeResizeObserver = null;
  let closingPromise = null;
  let resizeTimer = 0;
  let actionSequence = 0;

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

  const disconnectResizeObserver = () => {
    activeResizeObserver?.disconnect();
    activeResizeObserver = null;
  };

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const closeShelf = ({ updateHistory = true } = {}) => {
    if (closingPromise) return closingPromise;
    if (!activeShelf) {
      if (updateHistory) clearHash();
      return Promise.resolve();
    }

    const shelf = activeShelf;
    const card = activeCard;

    disconnectResizeObserver();
    activeShelf = null;
    activeCard = null;
    card?.classList.remove('is-active');

    shelf.classList.remove('is-settled');
    shelf.style.height = `${shelf.getBoundingClientRect().height}px`;

    closingPromise = (async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      shelf.classList.remove('is-open');
      shelf.style.height = '0px';
      await wait(430);
      shelf.remove();
      closingPromise = null;
      if (updateHistory) clearHash();
    })();

    return closingPromise;
  };

  const injectInlineStyles = (doc) => {
    if (doc.getElementById('rdp-inline-frame-style')) return;

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
      .rproj-hero img {
        width: 100% !important;
        max-height: 760px !important;
        object-fit: cover !important;
      }
      .project-compat-redesign .site-main > .rcompat-image-module,
      .project-compat-redesign .site-main > .rcompat-text-module,
      .project-compat-redesign .rcompat-layout,
      .project-compat-redesign .rcompat-gallery {
        padding-top: clamp(38px, 5vw, 76px) !important;
        padding-bottom: clamp(38px, 5vw, 76px) !important;
      }

      /* Expanded sets use stable, equal-height gallery rows. Crop only the
         browsing presentation; the existing lightbox still opens the source. */
      .rproj-gallery,
      .project-compat-redesign .rcompat-gallery {
        grid-auto-rows: clamp(340px, 34vw, 560px) !important;
        align-items: stretch !important;
      }
      .rproj-gallery-item,
      .project-compat-redesign .rcompat-gallery > * {
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .rproj-gallery-item button,
      .project-compat-redesign .rcompat-gallery button {
        height: 100% !important;
      }
      .rproj-gallery-item img,
      .project-compat-redesign .rcompat-gallery img {
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        object-fit: cover !important;
        transform: none !important;
        transition: none !important;
      }

      @media (max-width: 700px) {
        .site-main,
        .project-redesign .site-main,
        .project-compat-redesign .site-main { width: calc(100% - 32px) !important; }
        .rproj-header,
        .project-compat-redesign .rcompat-header { padding-top: 36px !important; }
        .rproj-hero img { max-height: none !important; }
        .rproj-gallery,
        .project-compat-redesign .rcompat-gallery { grid-auto-rows: auto !important; }
        .rproj-gallery-item,
        .project-compat-redesign .rcompat-gallery > * { height: auto !important; }
        .rproj-gallery-item button,
        .project-compat-redesign .rcompat-gallery button { height: auto !important; }
        .rproj-gallery-item img,
        .project-compat-redesign .rcompat-gallery img { height: auto !important; }
      }
    `;
    doc.head.append(style);
  };

  const prepareFrameDocument = (iframe, shelf) => {
    const doc = iframe.contentDocument;
    if (!doc) return;

    injectInlineStyles(doc);
    doc.body?.classList.add('rdp-inline-frame');

    doc.querySelectorAll('img').forEach((image) => {
      image.decoding = 'async';
      if (image.loading !== 'eager') image.loading = 'lazy';
    });

    const resize = () => {
      if (!iframe.isConnected || shelf !== activeShelf) return;
      const height = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        320,
      );
      iframe.style.height = `${height}px`;
      shelf.style.height = `${height}px`;
    };

    resize();
    requestAnimationFrame(resize);
    window.setTimeout(resize, 100);
    window.setTimeout(() => {
      resize();
      if (shelf === activeShelf) shelf.classList.add('is-settled');
    }, 470);

    const FrameResizeObserver = iframe.contentWindow?.ResizeObserver;
    if (FrameResizeObserver && doc.documentElement) {
      activeResizeObserver = new FrameResizeObserver(resize);
      activeResizeObserver.observe(doc.documentElement);
    }
  };

  const createShelf = (card, { updateHistory = true } = {}) => {
    const rowEnd = findRowEnd(card);
    const shelf = document.createElement('section');
    shelf.className = 'rdp-project-shelf';
    shelf.setAttribute('aria-label', `${card.querySelector('.rdp-project-title')?.textContent?.trim() || 'Project'} details`);
    shelf.innerHTML = `
      <div class="rdp-project-shelf-inner">
        <div class="rdp-project-loading" aria-live="polite">Loading project…</div>
        <iframe class="rdp-project-frame" title="${(card.querySelector('.rdp-project-title')?.textContent || 'Project').replace(/"/g, '&quot;')}"></iframe>
      </div>
    `;

    rowEnd.insertAdjacentElement('afterend', shelf);
    activeCard = card;
    activeShelf = shelf;
    card.classList.add('is-active');

    requestAnimationFrame(() => {
      shelf.classList.add('is-open');
      shelf.style.height = '88px';
    });

    const iframe = shelf.querySelector('iframe');
    const loading = shelf.querySelector('.rdp-project-loading');
    const url = new URL(card.href, window.location.href);
    url.searchParams.set('inlineShelf', '1');

    iframe.addEventListener('load', () => {
      loading?.setAttribute('hidden', '');
      prepareFrameDocument(iframe, shelf);
    }, { once: true });

    iframe.src = `${url.pathname}${url.search}`;

    if (updateHistory) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#project-${shelfSlug(card)}`);
    }
  };

  const openShelf = async (card, { updateHistory = true } = {}) => {
    const sequence = ++actionSequence;

    if (activeCard === card && activeShelf) {
      await closeShelf({ updateHistory });
      return;
    }

    const anchorTop = card.getBoundingClientRect().top;

    if (activeShelf) {
      await closeShelf({ updateHistory: false });
    } else if (closingPromise) {
      await closingPromise;
    }

    if (sequence !== actionSequence) return;

    /* If the collapsing shelf was above the newly selected card, preserve the
       selected card's viewport position while the document shrinks. */
    const movedTop = card.getBoundingClientRect().top;
    const delta = movedTop - anchorTop;
    if (Math.abs(delta) > 1) window.scrollBy(0, delta);

    createShelf(card, { updateHistory });
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
      openShelf(card);
    });
  });

  const requestedSlug = window.location.hash.startsWith('#project-')
    ? window.location.hash.slice('#project-'.length)
    : '';

  if (requestedSlug) {
    const requestedCard = cards().find((card) => shelfSlug(card) === requestedSlug);
    if (requestedCard) {
      requestAnimationFrame(() => {
        openShelf(requestedCard, { updateHistory: false });
        requestedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!activeCard || !activeShelf) return;
      const rowEnd = findRowEnd(activeCard);
      rowEnd.insertAdjacentElement('afterend', activeShelf);
    }, 120);
  });
})();
