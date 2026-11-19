const normalize = text => text.trim().toLowerCase().replace(/\s+/g, ' ');

function sectionPath(row, panel) {
  const path = [];
  for (let parent = row.parentElement; parent && parent !== panel; parent = parent.parentElement) {
    if (parent.matches('details') && row !== parent.firstElementChild) path.push(parent);
  }
  return path.reverse();
}

function searchableRows(panel) {
  return [...panel.querySelectorAll('details > summary, .ds-range-control, label, .ds-saved-version, .ds-config-buttons button')]
    .filter(row => !row.closest('[hidden]') && !(row.matches('label') && row.closest('.ds-range-control')))
    .map(row => {
      const label = row.matches('.ds-range-control') ? row.querySelector('.ds-control-label label') : row;
      // A select's options and input values are settings, not additional matches.
      const text = label.matches('label') ? [...label.childNodes]
        .filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(' ') : label.textContent;
      const name = normalize(text || label.getAttribute('aria-label') || '');
      const path = sectionPath(row, panel);
      return {row, name, path, context: normalize(path.map(section => section.firstElementChild.textContent).join(' ') + ' ' + name)};
    })
    .filter(item => item.name);
}

export function mountTuneSearch(panel, layoutPanel) {
  const header = panel.querySelector('.ds-config-header');
  const find = document.createElement('div');
  find.className = 'ds-tune-find';
  find.setAttribute('role', 'search');
  find.innerHTML = `<input type="search" aria-label="Find in Tune" placeholder="Find in Tune" autocomplete="off" autocapitalize="none" spellcheck="false">
    <output aria-live="polite"></output>
    <button type="button" aria-label="Previous match" title="Previous match (Shift+Enter)">↑</button>
    <button type="button" aria-label="Next match" title="Next match (Enter)">↓</button>`;
  header.append(find);
  const input = find.querySelector('input'), count = find.querySelector('output');
  const [previous, next] = find.querySelectorAll('button');
  const opened = new Set();
  let matches = [], current = -1, frame = 0;

  function updateMarks() {
    const active = matches[current]?.row;
    for (const {row} of matches) row.dataset.tuneMatch = row === active ? 'current' : 'true';
    const message = !normalize(input.value) ? '' : matches.length ? `${current + 1} of ${matches.length}` : 'No matches';
    if (count.textContent !== message) count.textContent = message;
    previous.disabled = next.disabled = !matches.length;
  }

  function refresh(preserve = true) {
    const active = preserve ? matches[current]?.row : null;
    for (const {row} of matches) delete row.dataset.tuneMatch;
    const query = normalize(input.value);
    const rows = panel.hidden || !query ? [] : searchableRows(panel);
    matches = rows.filter(({name}) => name.includes(query));
    if (!matches.length && query.includes(' ')) {
      const terms = query.split(' ');
      matches = rows.filter(({name, context}) =>
        terms.some(term => name.includes(term)) && terms.every(term => context.includes(term)));
    }
    current = matches.length ? Math.max(0, matches.findIndex(match => match.row === active)) : -1;
    updateMarks();
  }

  function reveal() {
    const match = matches[current];
    if (!match) return;
    // Only collapse sections opened by Find. Leave the user's other sections alone.
    for (const section of opened) if (!match.path.includes(section)) {
      section.open = false;
      opened.delete(section);
    }
    for (const section of match.path) if (!section.open) {
      section.open = true;
      opened.add(section);
    }
    layoutPanel();
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (panel.hidden || matches[current]?.row !== match.row) return;
      const bounds = match.row.getBoundingClientRect();
      const top = header.getBoundingClientRect().bottom + 8;
      const bottom = panel.getBoundingClientRect().bottom - 12;
      // Move just this scrollport. scrollIntoView() can also move the page.
      if (bounds.top < top || bounds.bottom > bottom) panel.scrollTop += bounds.top - top;
    });
  }

  function step(direction) {
    refresh();
    if (!matches.length) return;
    current = (current + direction + matches.length) % matches.length;
    updateMarks();
    reveal();
  }

  function clear() {
    cancelAnimationFrame(frame);
    input.value = '';
    // Leave the current section available for editing when Find is cleared.
    opened.clear();
    refresh(false);
  }

  function onKey(event) {
    if (event.isComposing || event.altKey) return false;
    const command = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (command && key === 'f') {
      input.focus({preventScroll: true});
      input.select();
    } else if (key === 'escape' && input.value) {
      clear();
      input.focus({preventScroll: true});
    } else if (key === 'enter' && event.target === input && !command ||
        input.value && (key === 'f3' && !command || key === 'g' && command)) {
      step(event.shiftKey ? -1 : 1);
    } else return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  input.addEventListener('input', () => {
    refresh(false);
    if (matches.length) reveal();
    else opened.clear();
  });
  panel.addEventListener('click', event => {
    const summary = event.target.closest('summary');
    if (summary) opened.delete(summary.parentElement);
  });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  refresh();
  return {refresh, clear, onKey};
}
