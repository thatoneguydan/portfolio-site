(() => {
  'use strict';

  const showcase = document.querySelector('[data-hero-showcase]');
  if (!showcase) return;

  const slides = Array.from(showcase.querySelectorAll('[data-hero-slide]'));
  const controls = Array.from(showcase.querySelectorAll('[data-hero-control]'));
  if (slides.length < 2 || controls.length !== slides.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cycleMs = 6500;
  let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
  let timer = 0;
  let paused = false;

  const stop = () => {
    if (!timer) return;
    window.clearTimeout(timer);
    timer = 0;
  };

  const schedule = () => {
    stop();
    if (paused || reducedMotion.matches || document.hidden) return;
    timer = window.setTimeout(() => {
      setActive(activeIndex + 1);
      schedule();
    }, cycleMs);
  };

  const setActive = (index, restart = false) => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      slide.tabIndex = active ? 0 : -1;
    });
    controls.forEach((control, controlIndex) => {
      control.setAttribute('aria-pressed', controlIndex === activeIndex ? 'true' : 'false');
      control.tabIndex = controlIndex === activeIndex ? 0 : -1;
    });
    if (restart) schedule();
  };

  controls.forEach((control, index) => {
    control.addEventListener('click', () => setActive(index, true));
  });

  showcase.addEventListener('mouseenter', () => {
    paused = true;
    stop();
  });
  showcase.addEventListener('mouseleave', () => {
    paused = false;
    schedule();
  });
  showcase.addEventListener('focusin', () => {
    paused = true;
    stop();
  });
  showcase.addEventListener('focusout', (event) => {
    if (showcase.contains(event.relatedTarget)) return;
    paused = false;
    schedule();
  });

  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener?.('change', schedule);

  setActive(activeIndex);
  schedule();
})();
