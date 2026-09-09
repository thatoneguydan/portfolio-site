(() => {
  'use strict';

  const grid = document.querySelector('.rdp-project-grid');
  if (!grid) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'portfolio-lightbox rdp-shelf-lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image viewer');
  lightbox.innerHTML = '<button type="button" class="portfolio-lightbox__close" aria-label="Close image viewer">×</button>' +
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--prev" aria-label="Previous image">‹</button>' +
    '<img class="portfolio-lightbox__image" alt="">' +
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--next" aria-label="Next image">›</button>';
  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector('.portfolio-lightbox__image');
  const closeButton = lightbox.querySelector('.portfolio-lightbox__close');
  const previousButton = lightbox.querySelector('.portfolio-lightbox__nav--prev');
  const nextButton = lightbox.querySelector('.portfolio-lightbox__nav--next');
  let lightboxItems = [];
  let lightboxIndex = -1;
  let returnFocus = null;

  const showLightboxItem = (index) => {
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const item = lightboxItems[lightboxIndex];
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt || '';
    previousButton.hidden = lightboxItems.length < 2;
    nextButton.hidden = lightboxItems.length < 2;
  };

  const openLightbox = (items, index, trigger) => {
    lightboxItems = items.filter((item) => item.src);
    if (!lightboxItems.length) return;
    returnFocus = trigger;
    showLightboxItem(Math.max(0, index));
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
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

      /* Match the working thumbnail pattern elsewhere on the site: the image
         lives inside a dedicated crop viewport, and only the image transforms. */
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

      /* Match the original production media-collection model: one flex row,
         natural image ratios, equal visual height, no cropping. */
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

      @media (max-width: 700px) {
        .rproj-gallery { display: block !important; }
        .rproj-gallery-item,
        .rproj-gallery-item--wide,
        .rproj-gallery-item--narrow {
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
      const items = triggers.map((node) => ({
        src: String(node.dataset.lightboxSrc || ''),
        alt: node.querySelector('img')?.alt || '',
      }));
      const index = Math.max(0, triggers.indexOf(trigger));
      openLightbox(items, index, trigger);
    }, true);
  };

  const applyEnhancements = (iframe) => {
    const doc = iframe.contentDocument;
    if (!doc || doc.readyState === 'loading') return;
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
