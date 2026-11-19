const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let pendingScroll = 0;

function viewportTop() {
  return Math.max(window.visualViewport?.offsetTop || 0,
    document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0);
}

export function cancelPendingRevealScroll() {
  cancelAnimationFrame(pendingScroll);
  pendingScroll = 0;
}

function requestRevealScroll(target, isCurrent, {settle = false, timeout = 500} = {}) {
  cancelPendingRevealScroll();
  const waitUntil = performance.now() + timeout;
  let previous, stableFrames = 0;
  function scrollWhenReachable(now) {
    pendingScroll = 0;
    if (!isCurrent()) return;
    const top = Math.max(0, target());
    stableFrames = Math.abs(top - previous) < .25 ? stableFrames + 1 : 0;
    previous = top;
    const root = document.scrollingElement;
    // At the end of the page an opening panel creates space over several
    // frames. A scroll issued too early is clamped to the old page height.
    const reachable = !root || top <= root.scrollHeight - root.clientHeight + 1;
    if (!reduced.matches && now < waitUntil && (!reachable || (settle && stableFrames < 2))) {
      pendingScroll = requestAnimationFrame(scrollWhenReachable);
      return;
    }
    if (Math.abs(top - scrollY) >= 1) window.scrollTo({top, behavior: reduced.matches ? 'auto' : 'smooth'});
  }
  scrollWhenReachable(performance.now());
}

const isOpen = (panel, source) => panel.isConnected && source.isConnected && panel.getAttribute('aria-hidden') !== 'true';

export function scrollToReveal(panel, source, {
  always = false,
  revealTop = panel.getBoundingClientRect().top
} = {}) {
  if (!always && revealTop <= innerHeight * .65) return;
  const top = scrollY + source.getBoundingClientRect().top - viewportTop() - 20;
  requestRevealScroll(() => top, () => isOpen(panel, source));
}

export function revealProjectThumbnail(panel, source) {
  requestRevealScroll(() => {
    const bounds = source.getBoundingClientRect();
    return scrollY + bounds.bottom - bounds.height / 3 - viewportTop();
  }, () => isOpen(panel, source) && panel.dataset.projectSource === source.id, {
    // In the vertical carousel both the activated card and the cards before
    // it can change height, so use their settled geometry to align the view.
    settle: true,
    timeout: 1500
  });
}

export function restoreProjectThumbnail(source) {
  cancelPendingRevealScroll();
  if (!source.isConnected) return;
  const bounds = source.getBoundingClientRect();
  const top = viewportTop();
  if (!bounds.height || bounds.top >= top) return;
  // Never scroll down to a source below the viewport. Restore only if 90%
  // or more of the thumbnail has already gone above the visible area.
  if (bounds.bottom - top > bounds.height / 10) return;
  requestRevealScroll(() => scrollY + source.getBoundingClientRect().top - viewportTop(),
    () => source.isConnected, {settle:true});
}
