(() => {
  'use strict';
  // Shared authored emoji and portfolio hover treatment, including project shelves.
  import('/assets/site-effects.js?v=20261118-sectioncards1').catch(()=>{});
  import('/assets/site-runtime.js?v=20261118-sectioncards1').catch(()=>{});

  /* Use the original portfolio favicon as a real asset on every redesign route. */
  const faviconHref = '/favicon.ico?v=20260910-original';
  let icon = document.querySelector('link[rel~="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.append(icon);
  }
  icon.removeAttribute('type');
  icon.href = faviconHref;

  if (!document.body.classList.contains('home-redesign')) return;
  if (window.__redesignNavInitialized) return;
  window.__redesignNavInitialized = true;

  const pageIntroStylesheetPath = '/assets/redesign-page-intro.css';
  if (!document.querySelector(`link[href^="${pageIntroStylesheetPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${pageIntroStylesheetPath}?v=20260911-b`;
    document.head.append(link);
  }

  const stylesheetPath = '/assets/redesign-nav.css';
  if (!document.querySelector(`link[href^="${stylesheetPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${stylesheetPath}?v=20261118-optical1`;
    document.head.append(link);
  }

  if (!document.querySelector('script[data-redesign-contact-shelf]')) {
    const contactShelfScript = document.createElement('script');
    contactShelfScript.src = '/assets/redesign-contact-shelf.js?v=20261118-sectioncards1';
    contactShelfScript.dataset.redesignContactShelf = '';
    document.head.append(contactShelfScript);
  }

  /* The active primary-nav state already identifies which discipline is being
     viewed, so remove the duplicate micro-label and archive/category label row
     from those pages entirely. */
  if (document.body.classList.contains('video-redesign')) {
    document.querySelector('.rv-intro .rd-eyebrow')?.remove();
    document.querySelector('.rv-shelves-head')?.remove();
    const intro = document.querySelector('.rv-intro-copy');
    const clientShelfTitle = document.querySelector('#freelance .rv-shelf-copy h2');
    if (intro) intro.textContent = 'Editing, essays, short-form, and channel work. A selection spanning client stories, long-form editorial, social video, and gaming content.';
    if (clientShelfTitle) clientShelfTitle.textContent = 'Client Work';

    const previewVideoStylesheetPath = '/assets/redesign-video-preview.css';
    if (!document.querySelector(`link[href^="${previewVideoStylesheetPath}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${previewVideoStylesheetPath}?v=20260911-a`;
      document.head.append(link);
    }
  }

  if (document.body.classList.contains('discipline-redesign')) {
    document.querySelector('.rdp-intro .rd-eyebrow')?.remove();
    document.querySelector('.rdp-gallery-head')?.remove();
  }

  if (document.body.classList.contains('discipline-design')) {
    const intro = document.querySelector('.rdp-intro-copy');
    if (intro) intro.textContent = 'Identity, print, campaigns, and digital work. A broad selection of projects built to make organizations, events, and ideas easier to recognize and understand.';
  }

  if (document.body.classList.contains('discipline-photo')) {
    const intro = document.querySelector('.rdp-intro-copy');
    if (intro) intro.textContent = 'Portraits, events, travel, and experiments. Client work and personal projects shaped by color, light, and atmosphere.';
  }

  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.site-nav');
  if (!header || !nav) return;

  if (!nav.id) nav.id = 'site-primary-nav';

  let toggle = header.querySelector('.site-nav-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.className = 'site-nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', nav.id);
    header.insertBefore(toggle, nav);
  }

  // EasyUI HamburgerMenu: rounded 24px strokes and springSnappy physics.
  // Adapted without adding a React runtime. See THIRD-PARTY-NOTICES.txt.
  toggle.innerHTML = '<span class="ds-hamburger" aria-hidden="true"><span></span><span></span><span></span></span>';
  const lines = [...toggle.querySelectorAll('.ds-hamburger > span')];
  const menuReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let menuProgress = 0, menuVelocity = 0, menuTarget = 0, menuFrame = 0, menuTime = 0;
  const paintMenu = () => {
    const gap = 24 * .28 * (1 - menuProgress);
    lines[0].style.transform = `translateY(${-gap}px) rotate(${45 * menuProgress}deg)`;
    lines[1].style.transform = `scaleX(${1 - .7 * menuProgress})`;
    lines[1].style.opacity = 1 - menuProgress;
    lines[2].style.transform = `translateY(${gap}px) rotate(${-45 * menuProgress}deg)`;
  };
  const tickMenu = now => {
    menuFrame = 0;
    const elapsed = Math.min(.04, (now - menuTime) / 1000);
    menuTime = now;
    const steps = Math.max(1, Math.ceil(elapsed * 240)), dt = elapsed / steps;
    for (let i = 0; i < steps; i++) {
      menuVelocity += ((menuTarget - menuProgress) * 380 - menuVelocity * 30) / .5 * dt;
      menuProgress += menuVelocity * dt;
    }
    if (Math.abs(menuTarget - menuProgress) + Math.abs(menuVelocity) < .0005) {
      menuProgress = menuTarget; menuVelocity = 0;
    } else menuFrame = requestAnimationFrame(tickMenu);
    paintMenu();
  };
  const morphMenu = open => {
    menuTarget = open ? 1 : 0;
    if (menuReducedMotion.matches) {
      cancelAnimationFrame(menuFrame); menuFrame = 0; menuProgress = menuTarget; menuVelocity = 0; paintMenu();
    } else if (!menuFrame && menuProgress !== menuTarget) {
      menuTime = performance.now(); menuFrame = requestAnimationFrame(tickMenu);
    }
  };
  paintMenu();

  header.classList.add('has-nav-toggle');
  const mobile = window.matchMedia('(max-width: 720px)');

  const setOpen = (open, restoreFocus = false) => {
    const shouldOpen = Boolean(open && mobile.matches);
    header.classList.toggle('nav-open', shouldOpen);
    toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
    morphMenu(shouldOpen);
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('nav-open')) {
      event.preventDefault();
      setOpen(false, true);
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (!header.classList.contains('nav-open')) return;
    if (!header.contains(event.target)) setOpen(false);
  }, { capture: true });

  mobile.addEventListener?.('change', () => setOpen(false));

  /* Project hashes are a navigation contract, not just state markers. The
     discipline controller opens the matching shelf; this layer restores the
     missing second half by positioning that shelf's actual project title at
     the top of the usable viewport beneath the sticky header. */
  if (document.body.classList.contains('discipline-redesign')) {
    const projectPrefix = '#project-';
    const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
    let projectAnchorToken = 0;

    const projectSlugForCard = (card) => {
      const path = new URL(card.href, window.location.href).pathname.replace(/^\/+|\/+$/g, '');
      return path || 'project';
    };

    const currentProjectSlug = () => window.location.hash.startsWith(projectPrefix)
      ? window.location.hash.slice(projectPrefix.length)
      : '';

    const findProjectCard = (slug) => Array.from(document.querySelectorAll('.rdp-project-card'))
      .find((card) => projectSlugForCard(card) === slug);

    const findOpenShelf = () => Array.from(document.querySelectorAll('.rdp-project-shelf.is-open'))
      .find((shelf) => !shelf.classList.contains('rd-home-project-shelf')) || null;

    const alignProjectTitle = (slug, openIfNeeded = false) => {
      if (!slug) return;
      const card = findProjectCard(slug);
      if (!card) return;

      const token = ++projectAnchorToken;
      let requestedOpen = false;
      const startedAt = performance.now();

      const tick = () => {
        if (token !== projectAnchorToken || currentProjectSlug() !== slug) return;

        if (!card.classList.contains('is-active')) {
          if (openIfNeeded && !requestedOpen) {
            requestedOpen = true;
            card.click();
          }
          if (performance.now() - startedAt < 4000) requestAnimationFrame(tick);
          return;
        }

        const shelf = findOpenShelf();
        const frame = shelf?.querySelector('.rdp-project-frame');
        const doc = frame?.contentDocument;
        const frameReady = doc?.body?.classList.contains('rdp-inline-frame');
        const title = frameReady
          ? doc.querySelector('.rproj-header h1, .rcompat-header h1, .site-main h1')
          : null;

        if (!frame || !title) {
          if (performance.now() - startedAt < 4000) requestAnimationFrame(tick);
          return;
        }

        requestAnimationFrame(() => {
          if (token !== projectAnchorToken || currentProjectSlug() !== slug) return;
          const titleTop = frame.getBoundingClientRect().top + title.getBoundingClientRect().top;
          const headerBottom = Math.max(0, header.getBoundingClientRect().bottom);
          const delta = titleTop - headerBottom;
          if (Math.abs(delta) > 1) window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
        });
      };

      requestAnimationFrame(tick);
    };

    const cancelPendingProjectAnchor = (event) => {
      if (event.type === 'keydown') {
        const target = event.target;
        if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
        if (!scrollKeys.has(event.key)) return;
      }
      projectAnchorToken += 1;
    };

    window.addEventListener('wheel', cancelPendingProjectAnchor, { passive: true, capture: true });
    window.addEventListener('touchmove', cancelPendingProjectAnchor, { passive: true, capture: true });
    window.addEventListener('keydown', cancelPendingProjectAnchor, { capture: true });

    const initialSlug = currentProjectSlug();
    if (initialSlug) alignProjectTitle(initialSlug, false);

    window.addEventListener('hashchange', () => {
      const slug = currentProjectSlug();
      if (slug) alignProjectTitle(slug, true);
      else projectAnchorToken += 1;
    });
  }
})();

