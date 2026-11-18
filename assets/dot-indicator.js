const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const diameter = 8.4;

function frame(left, width, offset) {
  return {left: left + 'px', width: width + 'px', offset};
}

export function createDotIndicator(track) {
  const ink = document.createElement('span');
  ink.className = 'portfolio-dot-indicator';
  ink.setAttribute('aria-hidden', 'true');
  let selected, animation;

  return function setActive(button) {
    if (!button || selected === button) return;
    selected = button;
    const previous = ink.parentNode === track && !reducedMotion.matches
      ? getComputedStyle(ink) : null;
    // Read the painted shape before cancelling an interrupted stretch.
    const oldLeft = previous ? parseFloat(previous.left) : null;
    const oldWidth = previous ? parseFloat(previous.width) : null;
    animation?.cancel();
    animation = null;

    const step = button.offsetWidth;
    const destination = button.offsetLeft + (step - diameter) / 2;
    ink.style.left = destination + 'px';
    if (!ink.parentNode) track.append(ink);
    if (oldLeft === null || !step) return;

    const start = frame(oldLeft, oldWidth, 0);
    const end = frame(destination, diameter, 1);
    const settledInside = destination >= oldLeft && destination + diameter <= oldLeft + oldWidth;
    if (settledInside) {
      animation = ink.animate([start, end], {duration: 160, easing: 'ease-out'});
      return;
    }
    // The leading edge reaches the next dot first and the trailing edge
    // catches it. For longer jumps carry at most one dot's worth of stretch.
    const movingRight = destination > oldLeft;
    const peak = Math.max(oldWidth, diameter + Math.min(step, Math.abs(destination - oldLeft)));
    const stretch = movingRight ? oldLeft : oldLeft + oldWidth - peak;
    const collect = movingRight ? destination + diameter - peak : destination;
    const middle = Math.abs(stretch - collect) < 1
      ? [frame(stretch, peak, .5)]
      : [frame(stretch, peak, .3), frame(collect, peak, .64)];
    animation = ink.animate([start, ...middle, end], {
      duration: 280, easing: 'cubic-bezier(.25,.15,.25,1)'
    });
  };
}
