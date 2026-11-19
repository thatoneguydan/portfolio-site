const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let pendingScroll = 0;

export function scrollToReveal(panel, source, {
  always = false,
  revealTop = panel.getBoundingClientRect().top,
  keepPanelVisible = false
} = {}) {
  cancelAnimationFrame(pendingScroll);
  if (!panel.isConnected || !source.isConnected) return;
  const revealLine = innerHeight * .65;
  if (!always && revealTop <= revealLine) return;

  const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
  const sourceOffset = source.getBoundingClientRect().top - header - 20;
  // A tall thumbnail can fill the screen by itself. Scroll far enough for
  // its panel to enter view, even if that means cropping the thumbnail.
  const offset = keepPanelVisible ? Math.max(sourceOffset, revealTop - revealLine) : sourceOffset;
  const top = Math.max(0, scrollY + offset);
  const waitUntil = performance.now() + 500;
  function scrollWhenReachable(now) {
    pendingScroll = 0;
    if (!panel.isConnected || !source.isConnected || panel.getAttribute('aria-hidden') === 'true') return;
    const root = document.scrollingElement;
    // At the end of the page an opening panel creates space over several
    // frames. A scroll issued too early is clamped to the old page height.
    if (!reduced.matches && root && top > root.scrollHeight - root.clientHeight + 1 && now < waitUntil) {
      pendingScroll = requestAnimationFrame(scrollWhenReachable);
      return;
    }
    window.scrollTo({top, behavior: reduced.matches ? 'auto' : 'smooth'});
  }
  scrollWhenReachable(performance.now());
}
