const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const diameter = 8.4;

function frame(left, width, offset) {
  return {left: left + 'px', width: width + 'px', offset};
}

export function createDotIndicator(track) {
  const ink = document.createElement('span');
  ink.className = 'portfolio-dot-indicator';
  ink.setAttribute('aria-hidden', 'true');
  let selected, animation, dragShape;
  const writeShape = (left, width) => {
    ink.style.left = left + 'px';
    ink.style.width = width ? width + 'px' : '';
    if (ink.parentNode !== track) track.append(ink);
  };

  function select(button) {
    if (!button || selected === button && !dragShape && ink.parentNode === track) return;
    selected = button;
    const previous = !dragShape && ink.parentNode === track && !reducedMotion.matches
      ? getComputedStyle(ink) : null;
    // Read the painted shape before cancelling an interrupted stretch.
    const oldLeft = dragShape?.left ?? (previous ? parseFloat(previous.left) : null);
    const oldWidth = dragShape?.width ?? (previous ? parseFloat(previous.width) : null);
    const dragged = !!dragShape;
    dragShape = null;
    animation?.cancel();
    animation = null;

    const step = button.offsetWidth;
    const destination = button.offsetLeft + (step - diameter) / 2;
    writeShape(destination);
    if (reducedMotion.matches || oldLeft === null || !step) return;

    const start = frame(oldLeft, oldWidth, 0);
    const end = frame(destination, diameter, 1);
    if (dragged) {
      animation = ink.animate([start, end], {duration: 120, easing: 'ease-out'});
      return;
    }
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
  }

  function follow(center, distance, step) {
    if (reducedMotion.matches) return;
    animation?.cancel();
    animation = null;
    const tail = Math.min(step, Math.abs(distance));
    const left = center - diameter / 2 - (distance > 0 ? tail : 0);
    dragShape = {left, width: diameter + tail};
    writeShape(left, dragShape.width);
  }

  return {select, follow};
}

export function bindDotScrubber(track, getButtons, indicator, {preview, commit, cancel = () => {}}) {
  let gesture = null, pendingFrame = 0;

  function draw() {
    pendingFrame = 0;
    const {buttons, firstCenter, localCenter, step, x, moved} = gesture;
    const position = Math.max(0, Math.min(buttons.length - 1, (x - firstCenter) / step));
    const index = Math.round(position);
    // Drag to the current pointer position instead of chasing it with a
    // restarted animation. Keep the stretch on the trailing edge.
    if (moved && !reducedMotion.matches && position !== gesture.position) {
      const distance = gesture.position === undefined ? 0 : (position - gesture.position) * step;
      indicator.follow(localCenter + position * step, distance, step);
    } else if (!moved || reducedMotion.matches) {
      indicator.select(buttons[index]);
    }
    gesture.position = position;
    if (gesture.index !== index) preview(index);
    gesture.index = index;
  }

  function finish(commitSelection, event, notify = true) {
    if (!gesture) return;
    cancelAnimationFrame(pendingFrame);
    if (commitSelection) {
      gesture.moved ||= gesture.x !== event.clientX;
      gesture.x = event.clientX;
      draw();
    }
    const {buttons, index} = gesture;
    gesture = null;
    pendingFrame = 0;
    indicator.select(buttons[index]);
    if (commitSelection) commit(index);
    else if (notify) cancel();
  }

  track.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    const buttons = getButtons(), first = buttons[0];
    if (!first) return;
    const {left, width: step} = first.getBoundingClientRect();
    if (!step) return;
    event.preventDefault();
    track.setPointerCapture(event.pointerId);
    gesture = {
      buttons, firstCenter: left + step / 2, localCenter: first.offsetLeft + step / 2,
      step, id: event.pointerId, x: event.clientX, moved: false
    };
    draw();
  });
  track.addEventListener('pointermove', event => {
    if (event.pointerId !== gesture?.id || gesture.x === event.clientX) return;
    gesture.x = event.clientX;
    gesture.moved = true;
    if (!pendingFrame) pendingFrame = requestAnimationFrame(draw);
  });
  track.addEventListener('pointerup', event => {
    if (event.pointerId === gesture?.id) finish(true, event);
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    track.addEventListener(name, event => {
      if (event.pointerId === gesture?.id) finish(false);
    });
  }

  return () => finish(false, null, false);
}
