(() => {
  'use strict';

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
})();
