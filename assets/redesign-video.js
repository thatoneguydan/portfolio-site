(() => {
  const shelves = Array.from(document.querySelectorAll('.rv-shelf'));
  const dialog = document.querySelector('[data-video-dialog]');
  const frame = dialog?.querySelector('iframe');
  const dialogTitle = dialog?.querySelector('[data-video-dialog-title]');
  const closeButton = dialog?.querySelector('[data-video-dialog-close]');

  const setShelfOpen = (shelf, shouldOpen, updateHash = false) => {
    const toggle = shelf.querySelector('.rv-shelf-toggle');
    const panel = shelf.querySelector('.rv-shelf-panel');
    if (!toggle || !panel) return;

    toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    panel.hidden = !shouldOpen;

    if (shouldOpen && updateHash && shelf.id) {
      history.replaceState(null, '', `#${shelf.id}`);
    }
  };

  const openOnly = (target, updateHash = true) => {
    shelves.forEach((shelf) => setShelfOpen(shelf, shelf === target, false));
    if (target && updateHash && target.id) {
      history.replaceState(null, '', `#${target.id}`);
    }
  };

  shelves.forEach((shelf) => {
    const toggle = shelf.querySelector('.rv-shelf-toggle');
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
  openOnly(requestedShelf?.classList.contains('rv-shelf') ? requestedShelf : shelves[0], false);

  window.addEventListener('hashchange', () => {
    const shelf = document.getElementById(window.location.hash.slice(1));
    if (shelf?.classList.contains('rv-shelf')) {
      openOnly(shelf, false);
      shelf.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      if (!id) return;

      if (dialogTitle) dialogTitle.textContent = title;
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
