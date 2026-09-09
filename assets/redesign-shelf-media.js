(() => {
  'use strict';

  const grid = document.querySelector('.rdp-project-grid');
  if (!grid) return;

  const LIGHTBOX_DETAIL_MAX_WIDTH = 1920;
  const LIGHTBOX_DETAIL_DELAY_MS = 120;
  const lightboxPreloadCache = new Map();

  const lightbox = document.createElement('div');
  lightbox.className = 'portfolio-lightbox rdp-shelf-lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image viewer');
  lightbox.innerHTML = '<button type="button" class="portfolio-lightbox__close" aria-label="Close image viewer">×</button>' +
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--prev" aria-label="Previous image">‹</button>' +
    '<img class="portfolio-lightbox__image" alt="" decoding="async">' +
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--next" aria-label="Next image">›</button>';
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector('.portfolio-lightbox__image');
  const closeButton = lightbox.querySelector('.portfolio-lightbox__close');
  const previousButton = lightbox.querySelector('.portfolio-lightbox__nav--prev');
  const nextButton = lightbox.querySelector('.portfolio-lightbox__nav--next');
  let lightboxItems = [];
  let lightboxIndex = -1;
  let lightboxRenderToken = 0;
  let lightboxUpgradeTimer = 0;
  let returnFocus = null;

  const parseSrcset = (srcset) => String(srcset || '')
    .split(',')
    .map((candidate) => {
      const parts = candidate.trim().split(/\s+/);
      const width = Number(String(parts[1] || '').replace(/w$/i, ''));
      return { src: parts[0] || '', width: Number.isFinite(width) ? width : 0 };
    })
    .filter((candidate) => candidate.src && candidate.width > 0)
    .sort((a, b) => a.width - b.width);

  const chooseDetailSrc = (image, fallbackSrc) => {
    const candidates = parseSrcset(image?.getAttribute('srcset'));
    if (!candidates.length) return image?.currentSrc || image?.src || fallbackSrc || '';

    const withinCap = candidates.filter((candidate) => candidate.width <= LIGHTBOX_DETAIL_MAX_WIDTH);
    const chosen = withinCap[withinCap.length - 1] || candidates[0];
    return chosen?.src || image?.currentSrc || image?.src || fallbackSrc || '';
  };

  const getImageAspectRatio = (image) => {
    const naturalWidth = Number(image?.naturalWidth) || 0;
    const naturalHeight = Number(image?.naturalHeight) || 0;
    if (naturalWidth > 0 && naturalHeight > 0) return naturalWidth / naturalHeight;

    const width = Number(image?.getAttribute('width')) || 0;
    const height = Number(image?.getAttribute('height')) || 0;
    if (width > 0 && height > 0) return width / height;

    const rect = image?.getBoundingClientRect?.();
    if (rect?.width > 0 && rect?.height > 0) return rect.width / rect.height;

    return 1;
  };

  const createLightboxItem = (trigger) => {
    const image = trigger.querySelector('img');
    const fullSrc = String(trigger.dataset.lightboxSrc || '');
    const previewSrc = image?.currentSrc || image?.src || fullSrc;
    const detailSrc = chooseDetailSrc(image, fullSrc) || previewSrc;
    return {
      previewSrc,
      detailSrc,
      fullSrc,
      aspectRatio: getImageAspectRatio(image),
      alt: image?.alt || '',
    };
  };

  const getLightboxContentBounds = () => {
    const style = window.getComputedStyle(lightbox);
    const horizontalPadding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const verticalPadding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    return {
      width: Math.max(1, window.innerWidth - horizontalPadding),
      height: Math.max(1, window.innerHeight - verticalPadding),
    };
  };

  const applyLightboxGeometry = (item) => {
    const ratio = Number(item?.aspectRatio) > 0 ? Number(item.aspectRatio) : 1;
    const bounds = getLightboxContentBounds();
    let width = bounds.width;
    let height = width / ratio;

    if (height > bounds.height) {
      height = bounds.height;
      width = height * ratio;
    }

    lightboxImage.style.width = `${Math.max(1, Math.round(width * 1000) / 1000)}px`;
    lightboxImage.style.height = `${Math.max(1, Math.round(height * 1000) / 1000)}px`;
  };

  const preloadAndDecode = (src) => {
    if (!src) return Promise.resolve();
    if (lightboxPreloadCache.has(src)) return lightboxPreloadCache.get(src);

    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (typeof image.decode !== 'function') {
          resolve();
          return;
        }
        image.decode().catch(() => {}).then(resolve);
      };
      image.onerror = resolve;
      image.src = src;
      if (image.complete) image.onload();
    });

    lightboxPreloadCache.set(src, promise);
    return promise;
  };

  const warmNeighbor = (index) => {
    if (lightboxItems.length < 2) return;
    const normalized = (index + lightboxItems.length) % lightboxItems.length;
    preloadAndDecode(lightboxItems[normalized]?.detailSrc);
  };

  const scheduleDetailUpgrade = (item, token) => {
    window.clearTimeout(lightboxUpgradeTimer);
    lightboxUpgradeTimer = window.setTimeout(() => {
      const detailSrc = item.detailSrc || item.previewSrc || item.fullSrc;
      if (!detailSrc) return;

      preloadAndDecode(detailSrc).then(() => {
        if (
          token !== lightboxRenderToken ||
          lightbox.hidden ||
          lightboxItems[lightboxIndex] !== item
        ) return;

        if (lightboxImage.src !== new URL(detailSrc, window.location.href).href) {
          lightboxImage.src = detailSrc;
        }

        warmNeighbor(lightboxIndex - 1);
        warmNeighbor(lightboxIndex + 1);
      });
    }, LIGHTBOX_DETAIL_DELAY_MS);
  };

  const showLightboxItem = (index) => {
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const item = lightboxItems[lightboxIndex];
    const token = ++lightboxRenderToken;
    const previewSrc = item.previewSrc || item.detailSrc || item.fullSrc;

    applyLightboxGeometry(item);
    lightboxImage.alt = item.alt || '';
    if (previewSrc) lightboxImage.src = previewSrc;
    previousButton.hidden = lightboxItems.length < 2;
    nextButton.hidden = lightboxItems.length < 2;

    scheduleDetailUpgrade(item, token);
  };

  const openLightbox = (items, index, trigger) => {
    lightboxItems = items.filter((item) => item.previewSrc || item.detailSrc || item.fullSrc);
    if (!lightboxItems.length) return;
    returnFocus = trigger;
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    showLightboxItem(Math.max(0, index));
    closeButton.focus();
  };

  const closeLightbox = () => {
    if (lightbox.hidden) return;
    ++lightboxRenderToken;
    window.clearTimeout(lightboxUpgradeTimer);
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
    lightboxImage.style.removeProperty('width');
    lightboxImage.style.removeProperty('height');
    document.body.classList.remove('lightbox-open');
    try { returnFocus?.focus?.(); } catch {}
    returnFocus = null;
    lightboxItems = [];
    lightboxIndex = -1;
  };

  closeButton.addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
  nextButton.addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  window.addEventListener('resize', () => {
    if (lightbox.hidden || lightboxIndex < 0) return;
    applyLightboxGeometry(lightboxItems[lightboxIndex]);
  });
  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowLeft' && lightboxItems.length > 1) {
      event.preventDefault();
      showLightboxItem(lightboxIndex - 1);
    } else if (event.key === 'ArrowRight' && lightboxItems.length > 1) {
      event.preventDefault();
      showLightboxItem(lightboxIndex + 1);
    }
  });

  const wrapShelfImages = (doc) => {
    doc.querySelectorAll('button[data-lightbox-src]').forEach((button) => {
      const image = button.querySelector(':scope > img');
      if (!image) return;

      const viewport = doc.createElement('span');
      viewport.className = 'rdp-shelf-image-viewport';
      button.insertBefore(viewport, image);
      viewport.append(image);
    });
  };

  const balanceRowSizes = (count) => {
    if (count <= 4) return [count];
    const rowCount = Math.ceil(count / 4);
    const base = Math.floor(count / rowCount);
    const remainder = count % rowCount;
    return Array.from({ length: rowCount }, (_, index) => base + (index < remainder ? 1 : 0));
  };

  const normalizeLongCompatGalleries = (doc) => {
    doc.querySelectorAll('.project-compat-redesign .rcompat-gallery').forEach((gallery) => {
      if (gallery.dataset.rdpShelfRows === 'true') return;
      const items = Array.from(gallery.children);
      if (items.length <= 4) return;

      const rowSizes = balanceRowSizes(items.length);
      const fragment = doc.createDocumentFragment();
      let offset = 0;

      rowSizes.forEach((size) => {
        const row = doc.createElement('div');
        row.className = 'rdp-shelf-gallery-row';
        items.slice(offset, offset + size).forEach((item) => row.append(item));
        fragment.append(row);
        offset += size;
      });

      gallery.replaceChildren(fragment);
      gallery.dataset.rdpShelfRows = 'true';
    });
  };

  const injectShelfMediaStyles = (doc) => {
    doc.getElementById('rdp-shelf-media-style')?.remove();
    const style = doc.createElement('style');
    style.id = 'rdp-shelf-media-style';
    style.textContent = `
      .rproj-hero { background: transparent !important; }

      .rproj-hero button,
      .rproj-gallery button,
      .project-compat-redesign .rcompat-image-module button,
      .project-compat-redesign .rcompat-gallery button,
      button[data-lightbox-src] {
        position: relative !important;
        display: block !important;
        width: 100% !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        line-height: 0 !important;
      }

      .rdp-shelf-image-viewport {
        position: relative !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        line-height: 0 !important;
        background: transparent !important;
      }

      .rdp-shelf-image-viewport > img {
        display: block !important;
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        object-fit: contain !important;
        transform: scale(1) !important;
        transform-origin: 50% 50% !important;
        transition: transform 360ms cubic-bezier(.2,.7,.2,1) !important;
      }

      button[data-lightbox-src]:hover .rdp-shelf-image-viewport > img,
      button[data-lightbox-src]:focus-visible .rdp-shelf-image-viewport > img {
        transform: scale(1.015) !important;
      }

      .rproj-hero img {
        width: 100% !important;
        height: auto !important;
        max-height: none !important;
        object-fit: contain !important;
      }

      .rproj-gallery {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
        gap: 8px !important;
      }

      .rproj-gallery-item,
      .rproj-gallery-item--wide,
      .rproj-gallery-item--narrow {
        grid-column: auto !important;
        min-width: 0 !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
      }

      .rproj-gallery-item img,
      .rproj-gallery-item--wide img,
      .rproj-gallery-item--narrow img {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        object-fit: contain !important;
      }

      .project-compat-redesign .rcompat-gallery > * {
        overflow: hidden !important;
        background: transparent !important;
      }

      .project-compat-redesign .rcompat-gallery[data-rdp-shelf-rows="true"] {
        display: block !important;
      }

      .project-compat-redesign .rcompat-gallery[data-rdp-shelf-rows="true"] > .rdp-shelf-gallery-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
        width: 100% !important;
        gap: 8px !important;
        margin: 0 0 8px !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      .project-compat-redesign .rcompat-gallery[data-rdp-shelf-rows="true"] > .rdp-shelf-gallery-row:last-child {
        margin-bottom: 0 !important;
      }

      .project-compat-redesign .rcompat-gallery[data-rdp-shelf-rows="true"] > .rdp-shelf-gallery-row > * {
        min-width: 0 !important;
        height: auto !important;
        overflow: hidden !important;
        background: transparent !important;
      }

      @media (max-width: 700px) {
        .rproj-gallery { display: block !important; }
        .rproj-gallery-item,
        .rproj-gallery-item--wide,
        .rproj-gallery-item--narrow {
          width: 100% !important;
          flex: none !important;
          margin-bottom: 12px !important;
        }

        .project-compat-redesign .rcompat-gallery[data-rdp-shelf-rows="true"] > .rdp-shelf-gallery-row {
          display: block !important;
          margin-bottom: 0 !important;
        }

        .project-compat-redesign .rcompat-gallery[data-rdp-shelf-rows="true"] > .rdp-shelf-gallery-row > * {
          width: 100% !important;
          flex: none !important;
          margin-bottom: 12px !important;
        }
      }
    `;
    doc.head.append(style);
  };

  const normalizeHandcraftedGallery = (doc) => {
    doc.querySelectorAll('.rproj-gallery').forEach((gallery) => {
      const items = Array.from(gallery.querySelectorAll(':scope > .rproj-gallery-item'));
      items.forEach((item) => {
        const image = item.querySelector('img');
        if (!image) return;

        const applyRatio = () => {
          const width = image.naturalWidth || Number(image.getAttribute('width')) || 0;
          const height = image.naturalHeight || Number(image.getAttribute('height')) || 0;
          if (!width || !height) return;
          item.style.setProperty('flex', `${width / height} 1 0%`, 'important');
        };

        if (image.complete) applyRatio();
        else image.addEventListener('load', applyRatio, { once: true });
      });
    });
  };

  const installParentLightboxBridge = (doc) => {
    doc.querySelectorAll('.portfolio-lightbox').forEach((node) => node.remove());
    doc.body?.classList.remove('lightbox-open');

    if (doc.documentElement.dataset.rdpParentLightboxBound === 'true') return;
    doc.documentElement.dataset.rdpParentLightboxBound = 'true';

    doc.addEventListener('click', (event) => {
      const trigger = event.target?.closest?.('[data-lightbox-src]');
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const triggers = Array.from(doc.querySelectorAll('[data-lightbox-src]'));
      const items = triggers.map(createLightboxItem);
      const index = Math.max(0, triggers.indexOf(trigger));
      openLightbox(items, index, trigger);
    }, true);
  };

  const applyEnhancements = (iframe) => {
    const doc = iframe.contentDocument;
    if (!doc || doc.readyState === 'loading') return;
    normalizeLongCompatGalleries(doc);
    wrapShelfImages(doc);
    injectShelfMediaStyles(doc);
    normalizeHandcraftedGallery(doc);
    installParentLightboxBridge(doc);
  };

  const enhanceFrame = (iframe) => {
    if (iframe.dataset.rdpShelfMediaBound === 'true') return;
    iframe.dataset.rdpShelfMediaBound = 'true';
    iframe.addEventListener('load', () => applyEnhancements(iframe));

    const doc = iframe.contentDocument;
    if (doc && doc.readyState === 'complete' && iframe.getAttribute('src')) {
      applyEnhancements(iframe);
    }
  };

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches('.rdp-project-frame')) enhanceFrame(node);
        node.querySelectorAll?.('.rdp-project-frame').forEach(enhanceFrame);
      });
    });
  });

  grid.querySelectorAll('.rdp-project-frame').forEach(enhanceFrame);
  observer.observe(grid, { childList: true, subtree: true });
})();
