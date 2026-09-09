(() => {
  'use strict';

  if (document.body.classList.contains('project-redesign')) return;

  const designRoutes = new Set([
    '/couch-of-games-logo-brand-identity',
    '/nmd-conference',
    '/book-cover-and-layout',
    '/triad-dream-center-logo',
    '/lead21-digital-promo',
    '/video-curriculum',
    '/anchor-young-adults-digital-promo',
    '/thoughtraid',
    '/born-to-restore-printed-handout-flyer',
    '/power-kids-logo',
    '/the-event-christmas-musical-production',
    '/family-matters-conference',
    '/masters-plan',
    '/agape-kids-ministry',
    '/women-of-worth-conference',
    '/be-salty',
    '/agapestrong'
  ]);

  const photoRoutes = new Set([
    '/portrait',
    '/graduation-event-photography',
    '/photo-set-moms-basement',
    '/professional-headshots',
    '/glamor-headshot',
    '/experimental-photoshoot-3',
    '/headshot',
    '/album-art-photoshoot',
    '/experimental-photoshoot',
    '/architectural-photo',
    '/family-conference-photo',
    '/experimental-photoshoot-1',
    '/graduation-photos',
    '/safari-photoshoot',
    '/street-photoshoot',
    '/experimental-photoshoot-2',
    '/graduation-portraits',
    '/90s-stylized-photoshoot',
    '/outdoor-portrait',
    '/stylized-photoshoot',
    '/engagement-photos'
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

  ensureStylesheet('/assets/redesign-production-baseline.css?v=20260909-a');
  ensureStylesheet('/assets/redesign-home.css?v=20260908-production-baseline');
  ensureStylesheet('/assets/redesign-project.css?v=20260909-a');
  ensureStylesheet('/assets/redesign-project-compat.css?v=20260909-a');

  const main = document.querySelector('.site-main');
  if (!main) return;

  document.body.classList.add('home-redesign', 'project-redesign', 'project-compat-redesign', `project-${discipline}`);

  const logo = document.querySelector('.site-logo');
  if (logo) logo.setAttribute('href', '/');

  document.querySelectorAll('.site-nav a').forEach((link) => {
    link.removeAttribute('aria-current');
    if (link.getAttribute('href') === `/${discipline}`) link.setAttribute('aria-current', 'page');
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
      <a class="rproj-back" href="/${discipline}">← Back to ${discipline === 'design' ? 'Design' : 'Photo'}</a>
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
    if (node.matches('.button-row')) node.classList.add('rcompat-old-cta');
    if (node.matches('.related-projects')) node.classList.add('rcompat-related');

    if (!firstVisual) firstVisual = node.querySelector?.('img') || (node.matches('img') ? node : null);
  }

  main.querySelectorAll('.column-layout').forEach((node) => node.classList.add('rcompat-layout'));
  main.querySelectorAll('.media-collection').forEach((node) => node.classList.add('rcompat-gallery'));
  main.querySelectorAll('.module--image').forEach((node) => node.classList.add('rcompat-image-module'));
  main.querySelectorAll('.module--text').forEach((node) => node.classList.add('rcompat-text-module'));

  const related = main.querySelector('.related-projects');
  if (related) {
    related.classList.add('rcompat-related');
    const heading = related.querySelector(':scope > h2');
    if (heading) heading.textContent = discipline === 'design' ? 'More design work' : 'More photography';
    const grid = related.querySelector('.cover-grid');
    if (grid) grid.classList.add('rcompat-related-grid');
  }

  const oldCtas = main.querySelectorAll('.button-row');
  oldCtas.forEach((node) => node.classList.add('rcompat-old-cta'));

  const footer = document.createElement('section');
  footer.className = 'rd-footer-cta rcompat-footer';
  footer.innerHTML = `<p>${discipline === 'design' ? 'Need something designed?' : 'Need photos?'}</p><a href="/contact">Let's make it.</a>`;
  main.append(footer);

  if (firstVisual && !firstVisual.getAttribute('alt')) firstVisual.setAttribute('alt', title);
})();
