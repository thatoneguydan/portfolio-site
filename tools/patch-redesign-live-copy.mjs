import fs from 'node:fs';

const file = 'tools/apply-redesign-live-copy.mjs';
let source = fs.readFileSync(file, 'utf8');
const needle = '  html = replaceFirstMeaningfulTextModule(html, copy.full);';
if (!source.includes(needle)) throw new Error('Release transformer patch target not found.');
const replacement = String.raw`  html = removeNoIndex(html);
  if (/project-redesign/.test(html)) {
    html = html.replace(/(<header class="rproj-header">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, (_, before, after) => before + esc(copy.title) + after);
    html = html.replace(/<p class="rproj-summary">[\s\S]*?<\/p>/, '<p class="rproj-summary">' + esc(copy.short) + '</p>');
    html = html.replace(/<div class="rproj-story-copy">[\s\S]*?<\/div>/, '<div class="rproj-story-copy"><p>' + esc(copy.full) + '</p></div>');
    if (!html.includes('<p class="rproj-summary">' + esc(copy.short) + '</p>')) throw new Error('Native project summary did not update: ' + route);
    if (!html.includes('<div class="rproj-story-copy"><p>' + esc(copy.full) + '</p></div>')) throw new Error('Native project story did not update: ' + route);
  } else {
    html = replaceFirstMeaningfulTextModule(html, copy.full);
  }`;
source = source.replace(needle, replacement);
source = source.replace("if (/const descriptions =/.test(videoJs) || /descriptions\\[id\\]/.test(videoJs)) throw new Error('Legacy video description map remains');", "if (/descriptions\\[id\\]/.test(videoJs)) throw new Error('Legacy video description lookup remains');");
source = source.replace("if (/const descriptions =/.test(homeVideoJs) || /descriptions\\[id\\]/.test(homeVideoJs)) throw new Error('Legacy homepage video description map remains');", "if (/descriptions\\[id\\]/.test(homeVideoJs)) throw new Error('Legacy homepage video description lookup remains');");
const compatValidation = "  if (/\\.button-row, \\.related-projects/.test(compat)) throw new Error('Legacy related-project removal code remains in compatibility runtime');";
if (!source.includes(compatValidation)) throw new Error('Compatibility cleanup validation target not found.');
source = source.replace(compatValidation, String.raw`  const legacyCompatStart = compat.indexOf('  /* The migrated project pages carried');
  const legacyCompatEnd = compat.indexOf('  const contentChildren', legacyCompatStart);
  if (legacyCompatStart >= 0 && legacyCompatEnd > legacyCompatStart) compat = compat.slice(0, legacyCompatStart) + compat.slice(legacyCompatEnd);
  if (/\.button-row, \.related-projects/.test(compat)) throw new Error('Legacy related-project removal code remains in compatibility runtime');`);
fs.writeFileSync(file, source, 'utf8');
console.log('Patched release transformer for native projects, data-backed video descriptions, and deterministic legacy compatibility cleanup.');
