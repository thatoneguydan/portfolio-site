(() => {
  'use strict';

  /* Keep the established DS favicon available on every redesign page without
     requiring dozens of otherwise-identical HTML edits. */
  const faviconHref = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABBVBMVEUAAAD////+/v79/f35+fn4+Pj39/fx8fHv7+/s7Ozr6+vc3Nzb29vZ2dnX19fMzMzLy8vHx8e9vb24uLixsbGtra2rq6upqammpqalpaWkpKSjo6Oenp6cnJyampqXl5eWlpaUlJSPj4+CgoJ/f399fX16enp3d3dsbGxnZ2dmZmZhYWFeXl5dXV1cXFxUVFRSUlJQUFBPT09NTU1MTExLS0tJSUlHR0dBQUE8PDw6Ojo5OTkzMzMrKysmJiYgICAeHh4dHR0bGxsVFRUSEhIQEBAPDw8LCwsKCgoJCQkICAgHBwcCAgICAgIBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAADD2dZGAAAAV3RSTlMA//////////////////////////////////////////////////////////////////////////////////////////////8Y/x7/XGK5vcXI+L3u7/+ITIRhAAACWklEQVQ4jWIAAZ/AoDAMEBTow8DAwAAAAAD//2JgYPAIwJSFgAAPBgYAAAAA//9iYPAKxSUfFhbqxQAAAAD//2Jg8MMtHxbmxwAAAAD//2LwxScfFuYLAAAA//9iCMYnHRbmDwAAAP//YgjBJx0WFgIAAAD//2LAKx0WFgYAAAD//4Iq8DbWNzIyNLD0RJUNCwsDAAAA//+CKnBkYgQDFjUU2bCwMAAAAAD//0JTwMgoiiwbFhYGAAAA//+CKWBmZOQU4gKp0ESSDQsLAwAAAP//QlIgFRYmw8jIyB8WFuZmZWXrFhYWFhYWBgAAAP//QlIgHRYWxsvIyOgQpgMyST4sLCwsLAwAAAD//0I1IUyRkZHR3h3sGJWwsLCwsDAAAAAA//9CU6DMyMjoZMTIyKoqpBcWFhYWFgYAAAD//0JToMDIyOiiy8jIrOEMEg4LCwMAAAD//0JzAw8jI2OYDdgKnbCwsLCwMAAAAAD//0I1QYKRkVEgLMxCmIORkS8sLCwsLAwAAAD//0JSwCHIAdKpFWan7yTGyMjuGhYWFhYGAAAA///CCEnxsDBtMIM7LCwsLCwMAAAA//9CU8CmHhYWpgRmgkI0LCwMAAAA//+CxaaZoampiZGVN4hjLicpImsNYoWFhQEAAAD//8KfHsLCwgAAAAD//8KvICwsDAAAAP//wp/kwsJCAAAAAP//YvDHJx0W5g8AAAD//8Kf7MPCfAEAAAD//8KfccL8GAAAAAD//8Kf9UK9GAAAAAD//8KfeT0YGAAAAAD//8Kf/RkYGAAAAAD//wMARI0SZKMCPYUAAAAASUVORK5CYII=';
  if (!document.querySelector('link[rel~="icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/png';
    icon.href = faviconHref;
    document.head.append(icon);
  }

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

  if (!document.querySelector('script[data-redesign-contact-shelf]')) {
    const contactShelfScript = document.createElement('script');
    contactShelfScript.src = '/assets/redesign-contact-shelf.js?v=20260910-a';
    contactShelfScript.dataset.redesignContactShelf = '';
    document.head.append(contactShelfScript);
  }

  /* Remove prototype/user-review language from the public-facing redesign.
     This copy is visitor-facing portfolio language, not an explanation of how
     the interface works. */
  if (document.body.classList.contains('video-redesign')) {
    const title = document.querySelector('.rv-intro h1');
    const intro = document.querySelector('.rv-intro-copy');
    const shelfMeta = document.querySelector('.rv-shelves-head span');
    if (title) title.innerHTML = 'Video built to<br>hold attention.';
    if (intro) intro.innerHTML = '<strong>Editing, essays, short-form, and channel work.</strong> A selection spanning client stories, long-form editorial, social video, and gaming content.';
    if (shelfMeta) shelfMeta.textContent = 'Client, editorial, social & long-form';
  }

  if (document.body.classList.contains('discipline-design') || document.body.classList.contains('discipline-photo')) {
    const footerPrompt = document.querySelector('.rd-footer-cta p');
    const footerAction = document.querySelector('.rd-footer-cta a[href="/contact"]');
    if (footerPrompt) footerPrompt.textContent = 'Interested in working together?';
    if (footerAction) footerAction.textContent = "Let's talk.";
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
