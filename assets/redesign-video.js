(() => {
  'use strict';

  if (!document.querySelector('script[data-redesign-nav]')) {
    const navScript = document.createElement('script');
    navScript.src = '/assets/redesign-nav.js?v=20260909-a';
    navScript.dataset.redesignNav = '';
    document.head.append(navScript);
  }

  const ensureStylesheet = (href) => {
    if (document.querySelector(`link[href^="${href.split('?')[0]}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  };

  ensureStylesheet('/assets/redesign-video-refine.css?v=20260909-b');

  const descriptions = {
    o8DPtyrcZ5o: "This was an edit for LifeBUILDERS Detroit. Their goal was to showcase the fun energy of camp, explore it's lasting impact, and offer people a chance to donate.",
    fRD5NXXbcIA: 'This video was created for Sterling Engines, to give customers an idea of who they are, as well as showcase their long-standing position as a pioneer in the industry.',
    '0oS8Mu9Ogak': "This video was created for 242 Community Church to tell Kelly's story. Her story showcases the power of connecting to a spiritual community, and the importance of giving back.",
    '8sbnF1n9pyg': "So often, works of fiction get put in a box like they're just trinkets. Little distractions from everyday life that are fun, but pointless.\n\nWhen it comes to the Fantasy genre especially, there's this idea that liking it too isn't good for a person.\n\nI made this video because I don't think that tells the whole story.",
    Z0gUnF1mCdM: "I wrote this video to tackle a common scenario in the video gaming community. Often, gamers will find themselves with a large collection of games they've never played all the way through.\n\nI dove into the psychology behind this phenomenon and discovered several interesting points that apply not only to entertainment, but also to a person's overall quality of life.",
    '5SR6PtZTsRo': "I wrote this video to tackle a common scenario in the video gaming community. Often, gamers will find themselves \"stuck\" playing a single game repeatedly, even though they find themselves no longer enjoying it.\n\nI dove into the psychology behind this phenomenon and discovered several interesting points that apply not only to entertainment, but also to a person's overall quality of life.\n\nThe thumbnail design draws inspiration from the UI of \"Steam,\" an online gaming store instantly recognizable to any PC gamer. The thumbnail conveys the relatable scenario of launching your \"default\" game even though you're tired of it. It does so in a simple way that is easy to understand at a glance, which is crucial for click-through rate.",
    kc28oRplfBI: 'These shorts were pulled from long form video essays and reformatted to hook a viewer and nudge them to watch the full video.',
    b7nHBZJSY9k: 'These shorts were pulled from long form video essays and reformatted to hook a viewer and nudge them to watch the full video.',
    FCvgAYznqZs: 'These shorts were pulled from long-form gaming content to showcase relatable, funny or intense moments.',
    'E2bhsiV-ImU': 'These shorts were pulled from long-form gaming content to showcase relatable, funny or intense moments.',
    Havi4q0GDI4: 'These shorts were pulled from long-form gaming content to showcase relatable, funny or intense moments.',
    '0pMECkKuP8c': 'These shorts were pulled from long-form gaming content to showcase relatable, funny or intense moments.',
    g1MZS1vk3kw: 'This older video project is an artful and experimental approach to promote "White Noise," a Christian student conference.\n\nWhite Noise refers to the static from old TV sets/radios, and was used as a metaphor for the chaos of life. The conference aimed to provide students a reprieve to spiritually center themselves.\n\nI was responsible for the set design, lighting, filming, script-writing, and editing for this project.',
    'wlzEdc-eMwM': "I set up a competition within Minecraft and told the story through clips and narration. I began the video with a heavily meme-flavored explanation of the competition's rules for the viewer's sake.\n\nI edited the footage together to highlight the goofiest moments and tell an entertaining story.",
    L9_GqeiMdMk: 'I developed a gaming channel focused on long-form gaming content (15 minutes or more). The scope of the work included lighting design, clean audio capture & processing, video game capture, filming, set design, and managing the channel. I edited and published over a hundred long-form videos in this format. Packaging such as thumbnail design and video titles also played a key role in the process of each video.',
    '9eeHNjlRLrI': 'I developed a gaming channel focused on long-form gaming content (15 minutes or more). The scope of the work included lighting design, clean audio capture & processing, video game capture, filming, set design, and managing the channel. I edited and published over a hundred long-form videos in this format. Packaging such as thumbnail design and video titles also played a key role in the process of each video.',
    fsWEm2pewhk: 'I developed a gaming channel focused on long-form gaming content (15 minutes or more). The scope of the work included lighting design, clean audio capture & processing, video game capture, filming, set design, and managing the channel. I edited and published over a hundred long-form videos in this format. Packaging such as thumbnail design and video titles also played a key role in the process of each video.',
    xfpTg2g6NF4: 'I developed a gaming channel focused on long-form gaming content (15 minutes or more). The scope of the work included lighting design, clean audio capture & processing, video game capture, filming, set design, and managing the channel. I edited and published over a hundred long-form videos in this format. Packaging such as thumbnail design and video titles also played a key role in the process of each video.',
  };

  const shelves = Array.from(document.querySelectorAll('.rv-shelf'));
  const dialog = document.querySelector('[data-video-dialog]');
  const player = dialog?.querySelector('.rv-dialog-player');
  const frame = player?.querySelector('iframe');
  const dialogTitle = dialog?.querySelector('[data-video-dialog-title]');
  const closeButton = dialog?.querySelector('[data-video-dialog-close]');

  let dialogInfo = dialog?.querySelector('.rv-dialog-info');
  let dialogKicker = dialogInfo?.querySelector('.rv-dialog-kicker');
  let dialogInfoTitle = dialogInfo?.querySelector('.rv-dialog-title');
  let dialogDescription = dialogInfo?.querySelector('.rv-dialog-description');

  if (dialog && player && !dialogInfo) {
    const body = document.createElement('div');
    body.className = 'rv-dialog-body';
    dialog.insertBefore(body, player);
    body.append(player);

    dialogInfo = document.createElement('aside');
    dialogInfo.className = 'rv-dialog-info';
    dialogInfo.innerHTML = '<p class="rv-dialog-kicker"></p><h2 class="rv-dialog-title"></h2><p class="rv-dialog-description"></p>';
    body.append(dialogInfo);

    dialogKicker = dialogInfo.querySelector('.rv-dialog-kicker');
    dialogInfoTitle = dialogInfo.querySelector('.rv-dialog-title');
    dialogDescription = dialogInfo.querySelector('.rv-dialog-description');
  }

  const setShelfOpen = (shelf, shouldOpen) => {
    const toggle = shelf.querySelector('.rv-shelf-toggle');
    const panel = shelf.querySelector('.rv-shelf-panel');
    if (!toggle || !panel) return;

    if (panel.hidden) panel.hidden = false;
    toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    panel.classList.toggle('is-open', shouldOpen);
    panel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if ('inert' in panel) panel.inert = !shouldOpen;
  };

  const openOnly = (target, updateHash = true) => {
    shelves.forEach((shelf) => setShelfOpen(shelf, shelf === target));
    if (target && updateHash && target.id) {
      history.replaceState(null, '', `#${target.id}`);
    }
  };

  shelves.forEach((shelf) => {
    const toggle = shelf.querySelector('.rv-shelf-toggle');
    const panel = shelf.querySelector('.rv-shelf-panel');
    if (panel) panel.hidden = false;

    toggle?.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        setShelfOpen(shelf, false);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        openOnly(shelf, true);
      }
    });
  });

  const requestedShelf = window.location.hash
    ? document.getElementById(window.location.hash.slice(1))
    : null;
  openOnly(requestedShelf?.classList.contains('rv-shelf') ? requestedShelf : null, false);

  window.addEventListener('hashchange', () => {
    const shelf = document.getElementById(window.location.hash.slice(1));
    if (shelf?.classList.contains('rv-shelf')) {
      openOnly(shelf, false);
      shelf.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.querySelectorAll('.rv-video-thumb img').forEach((image) => {
    const fallback = image.src;
    if (!fallback.includes('/hqdefault.jpg')) return;
    image.addEventListener('error', () => {
      if (image.src !== fallback) image.src = fallback;
    }, { once: true });
    image.src = fallback.replace('/hqdefault.jpg', '/maxresdefault.jpg');
    image.decoding = 'async';
  });

  const resetPlayer = () => {
    if (frame) frame.src = '';
  };

  document.querySelectorAll('[data-youtube-id]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (!dialog || !frame || typeof dialog.showModal !== 'function') return;

      event.preventDefault();
      const id = card.getAttribute('data-youtube-id');
      const title = card.getAttribute('data-video-title') || 'Video';
      const kicker = card.querySelector('.rv-video-kicker')?.textContent?.trim() || 'Video';
      if (!id) return;

      if (dialogTitle) dialogTitle.textContent = kicker;
      if (dialogKicker) dialogKicker.textContent = kicker;
      if (dialogInfoTitle) dialogInfoTitle.textContent = title;
      if (dialogDescription) dialogDescription.textContent = descriptions[id] || '';

      frame.title = title;
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      dialog.showModal();
    });
  });

  closeButton?.addEventListener('click', () => dialog?.close());

  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog?.addEventListener('close', resetPlayer);
})();
