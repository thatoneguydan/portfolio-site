(() => {
  'use strict';

  const grid = document.querySelector('.rdp-project-grid');
  if (!grid) return;

  const cards = () => Array.from(grid.querySelectorAll(':scope > .rdp-project-card'));
  let activeCard = null;
  let activeShelf = null;
  let activeResizeObserver = null;
  let resizeTimer = 0;

  // The redesign initially pointed Photo cards at the largest migrated source
  // images (often 5120px wide). Reuse the accepted production renderer's
  // 1280px derivatives for grid browsing; full-size assets remain available
  // inside project pages/lightboxes.
  const photoThumbnailByRoute = new Map([
    ['/portrait', '328b1fd5f43c91acb8dc436e77bf58c517c5ca14266ff2d2cf3fceb9b3adf1c1.jpg'],
    ['/graduation-event-photography', '5eca95a92fecb526334f78ca5427b9a8baa8d118fe4ae4e5dc4562cb002e0809.jpg'],
    ['/photo-set-moms-basement', 'e139299d58e42488f422ad05cf2f0c47941bf87be0a15734bebe905f1c332e5a.jpg'],
    ['/professional-headshots', 'df3d9a7953fe63571a17e1eea26be14482d2158b49c5a67147d679cd5add6b74.jpg'],
    ['/glamor-headshot', '7f64119678c032093664ff65b2dbc97b53e76982d4103ff21f73ce96ec8dccbd.jpg'],
    ['/experimental-photoshoot-3', '725391a43e7480af1e6e3ee77eb48a1f2fcbb7582614a47dd0a24c89785fcbf0.jpg'],
    ['/headshot', '81d48758c5f4e45556bfd23119876815731a1fb8ae59b590586372efe6159e3b.jpg'],
    ['/album-art-photoshoot', '014e2ad3c8d952e3d1a04bda4b422a3ebb2ea44be4979336cf864e1a79bd491c.jpg'],
    ['/experimental-photoshoot', '46f3c202166ad972e59257bd3d4780b81bdbbd94348c177b9720053b6ff2f0ca.jpg'],
    ['/architectural-photo', 'a0ad2c4c97a16c0d1b1dc1c83c6dc0ee26dd134008192e8d0fbd07500103304a.jpg'],
    ['/family-conference-photo', 'cd58622eac02c3866a0acba37a21889125a760b54c14ace3b5c2dcf549e5c942.jpg'],
    ['/experimental-photoshoot-1', 'e567d38d8d486d8c3a063802dec5afa7a603c3113dca9a79c90cd5a8716177aa.jpg'],
    ['/graduation-photos', 'e9d492614b4f55dfc7b229d28e9ab057560648204f5e3d6cdd0d6c90b881e4a1.jpg'],
    ['/safari-photoshoot', 'a7ccac3bd40eaaec8cf0c3ce3a4e4653950a4531905a07404011a462ab2fb69d.jpg'],
    ['/street-photoshoot', 'ce8967a7f8de913e154cc887c415904715ce362bec1b3a07e3fc37a1ba6d93ef.jpg'],
    ['/experimental-photoshoot-2', 'b189cd8b9fcedaa6cae2637a9ac4c82458af6954c2efcc66520f5e9c0a97c3a1.jpg'],
    ['/graduation-portraits', '2a083a6187ce701bc41a4c8f5482a4b5f7ac70e29c0ad26c30bcbd3d1d28cb8c.jpg'],
    ['/90s-stylized-photoshoot', '3ad10f86c8760b5ea03017367cc05884217dee4443e081c93dee24dfd9d1a6e4.jpg'],
    ['/outdoor-portrait', 'caef9223ef490066e19e9f1c801dae8835426241628447cf4ab71271eb02d615.jpg'],
    ['/stylized-photoshoot', '0e23bd2f7cc1064688e14bd163b518b06bdb37f70b2bcc79cd709bccc425ca0c.jpg'],
    ['/engagement-photos', '8fd4442ba452c527d91c54ea941ecbc3331afc84a6e548a6b8d1c50a2d158f2c.jpg'],
  ]);

  const setImageHints = () => {
    const isPhoto = document.body.classList.contains('discipline-photo');

    cards().forEach((card) => {
      const image = card.querySelector('img');
      if (!image) return;

      if (isPhoto) {
        const route = new URL(card.href, window.location.href).pathname.replace(/\/+$/, '') || '/';
        const thumbnail = photoThumbnailByRoute.get(route);
        if (thumbnail) {
          image.src = `/assets/media/${thumbnail}`;
          image.removeAttribute('srcset');
          image.removeAttribute('sizes');
        }
      }

      image.loading = 'lazy';
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
