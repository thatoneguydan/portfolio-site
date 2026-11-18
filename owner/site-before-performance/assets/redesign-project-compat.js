(() => {
  'use strict';

  if (document.body.classList.contains('project-redesign')) return;

  const designRoutes = new Set([
    '/owner/site-before-performance/couch-of-games-logo-brand-identity',
    '/owner/site-before-performance/nmd-conference',
    '/owner/site-before-performance/book-cover-and-layout',
    '/owner/site-before-performance/triad-dream-center-logo',
    '/owner/site-before-performance/lead21-digital-promo',
    '/owner/site-before-performance/video-curriculum',
    '/owner/site-before-performance/anchor-young-adults-digital-promo',
    '/owner/site-before-performance/thoughtraid',
    '/owner/site-before-performance/born-to-restore-printed-handout-flyer',
    '/owner/site-before-performance/power-kids-logo',
    '/owner/site-before-performance/the-event-christmas-musical-production',
    '/owner/site-before-performance/family-matters-conference',
    '/owner/site-before-performance/masters-plan',
    '/owner/site-before-performance/agape-kids-ministry',
    '/owner/site-before-performance/women-of-worth-conference',
    '/owner/site-before-performance/be-salty',
    '/owner/site-before-performance/agapestrong'
  ]);

  const photoRoutes = new Set([
    '/owner/site-before-performance/portrait',
    '/owner/site-before-performance/graduation-event-photography',
    '/owner/site-before-performance/photo-set-moms-basement',
    '/owner/site-before-performance/professional-headshots',
    '/owner/site-before-performance/glamor-headshot',
    '/owner/site-before-performance/experimental-photoshoot-3',
    '/owner/site-before-performance/headshot',
    '/owner/site-before-performance/album-art-photoshoot',
    '/owner/site-before-performance/experimental-photoshoot',
    '/owner/site-before-performance/architectural-photo',
    '/owner/site-before-performance/family-conference-photo',
    '/owner/site-before-performance/experimental-photoshoot-1',
    '/owner/site-before-performance/graduation-photos',
    '/owner/site-before-performance/safari-photoshoot',
    '/owner/site-before-performance/street-photoshoot',
    '/owner/site-before-performance/experimental-photoshoot-2',
    '/owner/site-before-performance/graduation-portraits',
    '/owner/site-before-performance/90s-stylized-photoshoot',
    '/owner/site-before-performance/outdoor-portrait',
    '/owner/site-before-performance/stylized-photoshoot',
    '/owner/site-before-performance/engagement-photos'
  ]);

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const discipline = designRoutes.has(path) ? 'design' : photoRoutes.has(path) ? 'photo' : null;
  if (!discipline) return;

  const ensureStylesheet = (href) => {
    if (document.querySelector(`link[href^="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  };

  ensureStylesheet('/owner/site-before-performance/assets/redesign-production-baseline.css?v=20260909-a');
  ensureStylesheet('/owner/site-before-performance/assets/redesign-home.css?v=20260908-production-baseline');
  ensureStylesheet('/owner/site-before-performance/assets/redesign-project.css?v=20260909-b');
  ensureStylesheet('/owner/site-before-performance/assets/redesign-project-compat.css?v=20260910-clean');

  const main = document.querySelector('.site-main');
  if (!main) return;

  document.body.classList.add('home-redesign', 'project-redesign', 'project-compat-redesign', `project-${discipline}`);

  const logo = document.querySelector('.site-logo');
  if (logo) logo.setAttribute('href', '/owner/site-before-performance/');

  document.querySelectorAll('.site-nav a').forEach((link) => {
    link.removeAttribute('aria-current');
    if (link.getAttribute('href') === `/owner/site-before-performance/${discipline}`) link.setAttribute('aria-current', 'page');
  });

  const rawTitle = document.title.replace(/^Dan\s+smith\s*-\s*/i, '').replace(/^Dan\s+Smith\s*[—-]\s*/i, '').trim();
  const title = rawTitle || (discipline === 'design' ? 'Design Project' : 'Photography Project');
  const description = String(document.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim();
  const genericDescription = /^I am a versatile content creator/i.test(description);
  const summary = genericDescription || !description
    ? (discipline === 'design' ? 'Selected design work by Dan Smith.' : 'Selected photography by Dan Smith.')
    : description.replace(/\s*\.{3}\s*$/, '.');

  const header = document.createElement('header');
  header.className = 'rproj-header rcompat-header';
  header.innerHTML = `
    <div>
      <a class="rproj-back" href="/owner/site-before-performance/${discipline}">← Back to ${discipline === 'design' ? 'Design' : 'Photo'}</a>
      <p class="rd-eyebrow">${discipline === 'design' ? 'Design project' : 'Photography'}</p>
      <h1></h1>
    </div>
    <p class="rproj-summary"></p>
  `;
  header.querySelector('h1').textContent = title;
  header.querySelector('.rproj-summary').textContent = summary;
  main.prepend(header);

  const contentChildren = Array.from(main.children).filter((node) => node !== header);
  let firstVisual = null;

  for (const node of contentChildren) {
    if (node.matches('.column-layout')) node.classList.add('rcompat-layout');
    if (node.matches('.media-collection')) node.classList.add('rcompat-gallery');
    if (node.matches('.module--image')) node.classList.add('rcompat-image-module');
    if (node.matches('.module--text')) node.classList.add('rcompat-text-module');

    if (!firstVisual) firstVisual = node.querySelector?.('img') || (node.matches('img') ? node : null);
  }

  main.querySelectorAll('.column-layout').forEach((node) => node.classList.add('rcompat-layout'));
  main.querySelectorAll('.media-collection').forEach((node) => node.classList.add('rcompat-gallery'));
  main.querySelectorAll('.module--image').forEach((node) => node.classList.add('rcompat-image-module'));
  main.querySelectorAll('.module--text').forEach((node) => node.classList.add('rcompat-text-module'));

  const footer = document.createElement('section');
  footer.className = 'rd-footer-cta rcompat-footer';
  footer.innerHTML = '<p>Interested in working together?</p><a href="/owner/site-before-performance/contact">Let\'s talk.</a>';
  main.append(footer);

  if (firstVisual && !firstVisual.getAttribute('alt')) firstVisual.setAttribute('alt', title);
})();