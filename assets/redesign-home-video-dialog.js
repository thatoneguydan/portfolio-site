(() => {
  'use strict';

  const cards = Array.from(document.querySelectorAll('#featured-work .rd-work-card[data-youtube-id]'));
  const dialog = document.querySelector('[data-video-dialog]');
  const frame = dialog?.querySelector('.rv-dialog-player iframe');
  const dialogTitle = dialog?.querySelector('[data-video-dialog-title]');
  const closeButton = dialog?.querySelector('[data-video-dialog-close]');
  const dialogKicker = dialog?.querySelector('.rv-dialog-kicker');
  const dialogInfoTitle = dialog?.querySelector('.rv-dialog-title');
  const dialogDescription = dialog?.querySelector('.rv-dialog-description');

  if (!cards.length || !dialog || !frame || typeof dialog.showModal !== 'function') return;

  const descriptions = {
    o8DPtyrcZ5o: "This was an edit for LifeBUILDERS Detroit. Their goal was to showcase the fun energy of camp, explore it's lasting impact, and offer people a chance to donate.",
    Z0gUnF1mCdM: "I wrote this video to tackle a common scenario in the video gaming community. Often, gamers will find themselves with a large collection of games they've never played all the way through.\n\nI dove into the psychology behind this phenomenon and discovered several interesting points that apply not only to entertainment, but also to a person's overall quality of life.",
  };

  const resetPlayer = () => {
    frame.src = '';
  };

  const openVideoCard = (card) => {
    const id = card.getAttribute('data-youtube-id');
    const title = card.getAttribute('data-video-title') || 'Video';
    const kicker = card.getAttribute('data-video-kicker') || 'Video';
    if (!id) return;

    if (dialogTitle) dialogTitle.textContent = kicker;
    if (dialogKicker) dialogKicker.textContent = kicker;
    if (dialogInfoTitle) dialogInfoTitle.textContent = title;
    if (dialogDescription) dialogDescription.textContent = descriptions[id] || '';

    frame.title = title;
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    if (!dialog.open) dialog.showModal();
  };

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      /* Capture first so the homepage's project-shelf controller never sees a
         video-card click. Video thumbnails should behave exactly like /video. */
      event.preventDefault();
      event.stopImmediatePropagation();
      openVideoCard(card);
    }, { capture: true });
  });

  closeButton?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', resetPlayer);
})();
