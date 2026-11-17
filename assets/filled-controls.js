import {filledIcons} from './filled-icons.js?v=20261117-refine4';
// Fill the symbol's cutout from inside the SVG. A button background leaves a
// contrasting antialiased rim around the outer circle, especially on hover.
export function filledControlIcon(name){
  return filledIcons[name].replace('<path','<circle class="portfolio-control-ink" cx="12" cy="12" r="9" fill="var(--control-glyph)"/><path');
}
