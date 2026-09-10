(() => {
  'use strict';

  if (!document.body.classList.contains('home-redesign')) return;
  if (window.__redesignNavInitialized) return;
  window.__redesignNavInitialized = true;

  const stylesheetPath = '/assets/redesign-nav.css';
  if (!document.querySelector(`link[href^="${stylesheetPath}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${stylesheetPath}?v=20260909-a`;
    document.head.append(link);
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
    toggle.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(toggle, nav);
  }

  header.classList.add('has-nav-toggle');
  const mobile = window.matchMedia('(max-width: 720px)');

  const setOpen = (open, restoreFocus = false) => {
    const shouldOpen = Boolean(open && mobile.matches);
    header.classList.toggle('nav-open', shouldOpen);
    toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
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
