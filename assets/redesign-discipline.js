(() => {
  'use strict';

  const grid = document.querySelector('.rdp-project-grid');
  if (!grid) return;

  const cards = () => Array.from(grid.querySelectorAll(':scope > .rdp-project-card'));
  let activeCard = null;
  let activeShelf = null;
  let activeResizeObserver = null;
  let resizeTimer = 0;

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

  const removeShelfImmediately = () => {
    disconnectResizeObserver();
    activeShelf?.remove();
    activeShelf = null;
    activeCard?.classList.remove('is-active');
    activeCard = null;
  };

  const closeShelf = ({ updateHistory = true } = {}) => {
    if (!activeShelf) return;

    const shelf = activeShelf;
    const card = activeCard;
    disconnectResizeObserver();

    shelf.style.height = `${shelf.getBoundingClientRect().height}px`;
    requestAnimationFrame(() => {
      shelf.classList.remove('is-open');
      shelf.style.height = '0px';
    });

    window.setTimeout(() => {
      if (shelf.isConnected) shelf.remove();
    }, 520);

    card?.classList.remove('is-active');
    activeShelf = null;
    activeCard = null;
    if (updateHistory) clearHash();
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
      @media (max-width: 700px) {
        .site-main,
        .project-redesign .site-main,
        .project-compat-redesign .site-main { width: calc(100% - 32px) !important; }
        .rproj-header,
        .project-compat-redesign .rcompat-header { padding-top: 36px !important; }
        .rproj-hero img { max-height: none !important; }
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
    window.setTimeout(resize, 450);

    const FrameResizeObserver = iframe.contentWindow?.ResizeObserver;
    if (FrameResizeObserver && doc.documentElement) {
      activeResizeObserver = new FrameResizeObserver(resize);
      activeResizeObserver.observe(doc.documentElement);
    }
  };

  const openShelf = (card, { updateHistory = true } = {}) => {
    if (activeCard === card && activeShelf) {
      closeShelf({ updateHistory });
      return;
    }

    removeShelfImmediately();

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
