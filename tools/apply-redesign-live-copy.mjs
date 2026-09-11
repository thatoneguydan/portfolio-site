import fs from 'node:fs';
import path from 'node:path';

const projectCopy = {
  '/couch-of-games-logo-brand-identity': { discipline: 'design', title: 'Couch of Games Brand Identity', short: 'A high-energy gaming identity designed to feel playful, recognizable, and readable at a glance.', full: 'I created the logo and visual identity for The Couch of Games, a gaming channel I launched. The goal was to make the brand feel quirky and energetic without sacrificing readability, so it could grab attention quickly and stay recognizable across the channel.' },
  '/nmd-conference': { discipline: 'design', title: 'N.M.D. Conference Identity', short: 'A 90s-graffiti-inspired identity for a student conference, designed to work across digital promotion and street-style stickers.', full: 'I developed the visual identity for “Normalize Making Disciples,” a Christian student conference. The direction pulled from 90s graffiti and early hip-hop graphics to connect with a younger audience. Plans to use stickers as street-sign “tags” pushed the identity further toward something bold, youthful, and deliberately urban.' },
  '/book-cover-and-layout': { discipline: 'design', title: 'What to Do When Things Go from Bad to Worse — Book Design', short: 'Cover and interior layout for a published book, plus a matching eBook edition.', full: 'I designed the cover and interior layout for What to Do When Things Go from Bad to Worse, then adapted the design for its eBook edition. The project covered both the book’s visual identity and the page layout readers interact with throughout.' },
  '/triad-dream-center-logo': { discipline: 'design', title: 'Triad Dream Center Logo', short: 'A flexible nonprofit mark combining a location pin with a hot-air balloon: community presence and lift in one symbol.', full: 'I designed the Triad Dream Center logo for a nonprofit providing food services, counseling, and other community support. The mark combines two ideas: a location pin, positioning the organization as a community anchor, and a hot-air balloon, representing lift and hope. It also works in a single color and remains legible from small letterhead applications to large-format signage.' },
  '/lead21-digital-promo': { discipline: 'design', title: 'LEAD21 Conference Identity', short: 'A leadership-conference identity carried across digital and print promotion.', full: 'I created the LEAD21 logo and extended its visual system across digital and printed materials for a leadership conference. The goal was a consistent identity that could move between formats without losing recognition.' },
  '/video-curriculum': { discipline: 'design', title: 'The Olive and the Press — Curriculum Identity', short: 'Packaging, visual identity, and production support for a filmed curriculum series.', full: 'I designed the packaging and visual identity for The Olive and the Press, a video curriculum series. My role also extended into production: I helped shape the set, filmed each session, and photographed the red couch that became a recurring visual element in both the set and packaging.' },
  '/anchor-young-adults-digital-promo': { discipline: 'design', title: 'Anchor Young Adults — Identity & Signage', short: 'A young-adults identity built for digital signage, with a companion group logo.', full: 'I designed digital signage for Anchor Young Adults and created the group’s logo. The two pieces were developed as a cohesive visual identity that could carry the same recognizable look across the group’s branding and on-site promotion.' },
  '/thoughtraid': { discipline: 'design', title: 'Thought Raid Brand Identity', short: 'A gaming-community identity built around conversation, mental health, and a distinctly game-adjacent visual language.', full: 'I created the logo, brand identity, and supporting graphics for Thought Raid, a YouTube and Twitch community centered on thoughtful conversations about life and mental health through a gaming lens. The logo combines the idea of conversation with cues that keep it immediately readable as gaming content. I also produced streaming assets, including a short motion-graphics intro.' },
  '/born-to-restore-printed-handout-flyer': { discipline: 'design', title: 'Born to Restore — Christmas Campaign', short: 'A printed invitation and broader promotional identity for a Christmas musical production.', full: 'I created the visual identity for Born to Restore, a Christmas musical production, and carried it across digital and physical promotion. This printed invitation was designed for church members to hand directly to friends and family; I also designed the ornament featured in the artwork.' },
  '/power-kids-logo': { discipline: 'design', title: 'Power Kids Logo', short: 'A playful children’s-ministry mark designed to stay legible across colors, sizes, and formats.', full: 'I designed the Power Kids logo for Agape Faith Church’s children’s Sunday school. The brief called for something zany and playful without becoming hard to read. The finished mark works in a single color and holds up from small print applications to large-format signage.' },
  '/the-event-christmas-musical-production': { discipline: 'design', title: 'The Event — Christmas Production Identity', short: 'A campaign identity for a Christmas musical framed through the visual language of investigation and breaking news.', full: 'I developed the visual identity for The Event, a Christmas musical told from the perspective of a modern-day news reporter investigating the events leading to the crucifixion and resurrection. The timeline motif borrows from classified files and investigative graphics, giving the promotion a sense of mystery while carrying consistently across print and digital materials.' },
  '/family-matters-conference': { discipline: 'design', title: 'Family Matters Conference Campaign', short: 'A multi-format conference campaign built around a playful Family Matters reference.', full: 'I designed the campaign for the Family Matters conference across email, social media, posters, and handout invitations, adapting the visual system for both mobile and print formats. I also shot the Urkel-inspired portrait used in the campaign, tying the design back to the sitcom the conference was parodying.' },
  '/masters-plan': { discipline: 'design', title: 'Master’s Plan Fundraising Campaign', short: 'A fundraising identity for church building upgrades, designed as an extension of the organization’s existing brand.', full: 'I created the Master’s Plan campaign identity for Agape Faith Church’s building-upgrade fundraiser. Rather than introducing a completely separate look, I drew from the church’s existing logo so the campaign felt connected to the organization it was supporting.' },
  '/agape-kids-ministry': { discipline: 'design', title: 'Agape Kids Ministry Logo', short: 'A simple, whimsical children’s-ministry logo built to stay flexible across colors, sizes, and formats.', full: 'I designed the Agape Kids Ministry logo for Agape Faith Church. The goal was playful and approachable, but still simple enough to work across many formats. The mark can run in a single color and remains readable from small print to large signage.' },
  '/women-of-worth-conference': { discipline: 'design', title: 'Women of Worth Conference Campaign', short: 'Conference identity and handout design supported by original event photography.', full: 'I designed the Women of Worth conference logo and this handout as part of a broader promotional campaign. I also photographed the imagery used throughout, with the exception of the Real Talk Kim photo. Keeping the identity, layout, and photography under one visual direction helped the campaign read as a single system.' },
  '/be-salty': { discipline: 'design', title: 'Be Salty Campaign', short: 'A year-long church campaign carried from social media to physical signage, built around the “salt of the earth” theme.', full: 'I developed the visual identity for Be Salty, a year-long spiritual-growth campaign based on the idea of being “the salt of the earth.” The system was used across digital and physical formats ranging from social media to custom window clings.' },
  '/agapestrong': { discipline: 'design', title: '#agapestrong Campaign', short: 'A year-long campaign identity centered on agape—unconditional love—across social and physical touchpoints.', full: 'I created the visual identity for #agapestrong, a year-long church campaign built around “agape,” the Greek word for unconditional love. The campaign encouraged the community to put that idea into practice and use the hashtag to spread the message. The identity appeared across digital and physical materials, from social media to stickers.' },

  '/portrait': { discipline: 'photo', title: 'Portrait Story Series', short: 'A social portrait series pairing individual photographs with short personal stories.', full: 'I photographed this series for an Instagram project built around snapshots of people’s lives. Each portrait was paired with a short personal story, making the photography one half of a simple people-first storytelling format.' },
  '/graduation-event-photography': { discipline: 'photo', title: 'Graduation Event Photography', short: 'Event coverage from several graduation ceremonies, collected into one set.', full: 'A collection of event photography from several graduation ceremonies, bringing multiple client assignments together in one place.' },
  '/photo-set-moms-basement': { discipline: 'photo', title: 'Mom’s Basement', short: 'An 80s-tech still-life series built around CRT glow, saturated color, and a little basement nostalgia.', full: 'A personal photo set built around my affection for old 80s technology. I leaned into the glow, color, and slightly strange atmosphere of CRTs and retro hardware rather than trying to make the objects feel pristine or modern.' },
  '/professional-headshots': { discipline: 'photo', title: 'Client Portraits', short: 'A selection of portrait work created for a range of clients.', full: 'A collection of portraits created across multiple client sessions, gathered here as a broader look at my portrait work.' },
  '/glamor-headshot': { discipline: 'photo', title: 'Glamour Portrait', short: 'A personal portrait study created as a photography exercise.', full: 'A personal portrait study made for practice, with the finished image treated as a polished standalone portrait rather than a client assignment.' },
  '/experimental-photoshoot-3': { discipline: 'photo', title: 'Limited-Palette Portrait Study', short: 'An experimental portrait set constrained to a deliberately narrow color palette.', full: 'An experimental portrait study built around a deliberately limited palette, using the color constraint as the central visual rule for the set.' },
  '/headshot': { discipline: 'photo', title: 'Client Headshot', short: 'A clean, direct headshot created for a client.', full: 'A client headshot focused on a straightforward, polished portrait rather than a heavily styled concept.' },
  '/album-art-photoshoot': { discipline: 'photo', title: 'Album Cover Portraits', short: 'Portraits created for an album cover and the artist’s broader promotional use.', full: 'I photographed this session for an artist who needed both album-cover imagery and a wider set of portraits for general use. The shoot produced the cover-focused images alongside a more flexible portrait set for use beyond the release.' },
  '/experimental-photoshoot': { discipline: 'photo', title: 'Light & Color Fringing Study', short: 'An experimental photo study built around light, color fringing, and optical imperfection.', full: 'An experimental set focused on the way light and color fringing can become part of the image rather than something to correct away.' },
  '/architectural-photo': { discipline: 'photo', title: 'Architectural Symmetry', short: 'An architectural series focused on symmetry and geometry across several buildings.', full: 'A photographic study of several buildings, framed around symmetry and the geometry already present in the architecture.' },
  '/family-conference-photo': { discipline: 'photo', title: 'Family Matters Campaign Portrait', short: 'An Urkel-inspired portrait created for a Family Matters–themed conference campaign.', full: 'I shot this image for promotional materials for a Christian family conference. The visual reference is Steve Urkel from Family Matters, tying the portrait directly into the sitcom-inspired campaign.' },
  '/experimental-photoshoot-1': { discipline: 'photo', title: 'Snake Portraits', short: 'An experimental portrait session built around a borrowed live snake and several visual directions.', full: 'A friend lent me their pet snake, which became the excuse to explore several portrait concepts, visual styles, and moods in one session.' },
  '/graduation-photos': { discipline: 'photo', title: 'Graduation Portrait Session', short: 'A graduation session balancing polished portraits with a few more playful frames.', full: 'This client wanted graduation photos that reflected her easygoing personality, so the session mixed polished, glam-leaning portraits with more whimsical images. The set feels celebratory without becoming overly formal.' },
  '/safari-photoshoot': { discipline: 'photo', title: 'Kenyan Safari', short: 'A photographic travel set from a safari in Kenya.', full: 'A selection of photographs I made while on safari in Kenya.' },
  '/street-photoshoot': { discipline: 'photo', title: 'Street Portrait Study', short: 'A street-based portrait exercise across varied subjects and changing light.', full: 'A street photography exercise built around working with different subjects under a range of lighting conditions.' },
  '/experimental-photoshoot-2': { discipline: 'photo', title: 'Dirty-Frame Portrait Study', short: 'An experimental portrait set using a deliberately imperfect frame and a lightly irreverent tone.', full: 'An experimental portrait session built around a dirty-frame aesthetic and a light, slightly irreverent attitude. The imperfection is part of the visual language rather than something the image tries to hide.' },
  '/graduation-portraits': { discipline: 'photo', title: 'Graduation Portrait Collection', short: 'A selection of graduation portraits created for multiple clients.', full: 'A collection of graduation portraits created across several client sessions.' },
  '/90s-stylized-photoshoot': { discipline: 'photo', title: '90s Portrait Study', short: 'A personal portrait set made as a nod to 90s visual style.', full: 'A personal photo set created as a visual nod to the 90s, using the era’s look as the central styling cue.' },
  '/outdoor-portrait': { discipline: 'photo', title: 'Outdoor Self-Portrait', short: 'A self-portrait made outdoors as a personal photography exercise.', full: 'An outdoor self-portrait created as a personal photography exercise.' },
  '/stylized-photoshoot': { discipline: 'photo', title: 'Blue-Hue Portrait Study', short: 'An experimental portrait set built around blue tones and a deliberately imperfect frame.', full: 'An experimental portrait study using blue hues and a dirty-frame treatment as the visual constraints for the set.' },
  '/engagement-photos': { discipline: 'photo', title: 'Engagement Session', short: 'A client engagement portrait session.', full: 'A set of engagement portraits created for a client.' },
};

const videoCategories = {
  freelance: { title: 'Client Video & Editing', description: 'Story-led edits for nonprofits, businesses, and community organizations.' },
  essays: { title: 'Video Essays', description: 'Long-form essays that turn games and media habits into approachable stories about behavior, nostalgia, and attention.' },
  'short-form': { title: 'Short-Form Video', description: 'Vertical edits built around fast hooks, clean pacing, and moments worth stopping for.' },
  misc: { title: 'Promos & Experiments', description: 'Promotional and experimental work that sits outside the usual buckets.' },
  gaming: { title: 'Long-Form Gaming', description: 'A sample from a 100+ video channel I produced end to end—from capture and lighting to edit, thumbnail, and publishing.' },
};

const videoCopy = {
  o8DPtyrcZ5o: { title: 'LifeBUILDERS Camp', description: 'Edited for LifeBUILDERS Detroit to capture the energy of camp while showing the longer-term impact of the program. The piece also needed to give viewers a clear path toward supporting the organization through donations.' },
  fRD5NXXbcIA: { title: 'Sterling Engines — Company Profile', description: 'Created for Sterling Engines as a concise company profile: an introduction to who they are and a look at the company’s long-standing role as an industry pioneer.' },
  '0oS8Mu9Ogak': { title: 'Kelly Hazamy’s Story — 242 Community Church', description: 'Produced for 242 Community Church to tell Kelly Hazamy’s story, centered on finding spiritual community and the importance of giving back.' },
  '8sbnF1n9pyg': { title: 'Escaping into Fantasy Is Healthier Than You Think', description: 'A video essay pushing back on the idea that fantasy is merely a pointless escape. It looks at why people are drawn to fictional worlds and why that relationship can be healthier than the usual stereotype suggests.' },
  Z0gUnF1mCdM: { title: 'Why You Never Finish Games', description: 'A psychology-driven video essay about the familiar habit of building a game library faster than we finish it. It explores why unfinished games pile up and what those patterns can reveal about how we approach entertainment, time, and choice.' },
  '5SR6PtZTsRo': { title: 'Why You Keep Replaying THAT Game', description: 'A psychology-driven essay about why we keep returning to a familiar game even after the fun starts fading. The thumbnail borrows Steam’s visual language to make the “default game” habit recognizable at a glance, tying the packaging directly to the behavior the video explores.' },
  kc28oRplfBI: { title: null, description: 'A vertical excerpt rebuilt from a long-form video essay, with the opening, pacing, and framing adjusted to earn attention quickly and lead viewers toward the full piece.' },
  b7nHBZJSY9k: { title: null, description: 'A vertical excerpt rebuilt from a long-form video essay, with the opening, pacing, and framing adjusted to earn attention quickly and lead viewers toward the full piece.' },
  FCvgAYznqZs: { title: null, description: 'Four vertical edits pulled from long-form gaming videos, shaped around the funniest, most relatable, or highest-energy moments.' },
  'E2bhsiV-ImU': { title: null, description: 'Four vertical edits pulled from long-form gaming videos, shaped around the funniest, most relatable, or highest-energy moments.' },
  Havi4q0GDI4: { title: null, description: 'Four vertical edits pulled from long-form gaming videos, shaped around the funniest, most relatable, or highest-energy moments.' },
  '0pMECkKuP8c': { title: null, description: 'Four vertical edits pulled from long-form gaming videos, shaped around the funniest, most relatable, or highest-energy moments.' },
  g1MZS1vk3kw: { title: 'White Noise — Student Conference Promo', description: 'An early experimental promo for White Noise, a Christian student conference built around the metaphor of static and everyday noise. I handled set design, lighting, filming, scriptwriting, and editing, using the visual language of old television and radio static to support the concept.' },
  'wlzEdc-eMwM': { title: 'Minecraft Competition', description: 'I built a competition inside Minecraft and turned the footage into a narrated story, opening with a deliberately meme-heavy explanation of the rules before cutting the event around its funniest moments.' },
  L9_GqeiMdMk: { title: null, description: 'I developed and ran a channel centered on long-form gaming videos, handling lighting, audio, game capture, filming, set design, editing, packaging, and publishing. I produced more than a hundred videos in the format, with thumbnails and titles treated as part of the creative work rather than an afterthought.' },
  '9eeHNjlRLrI': { title: null, description: 'I developed and ran a channel centered on long-form gaming videos, handling lighting, audio, game capture, filming, set design, editing, packaging, and publishing. I produced more than a hundred videos in the format, with thumbnails and titles treated as part of the creative work rather than an afterthought.' },
  fsWEm2pewhk: { title: null, description: 'I developed and ran a channel centered on long-form gaming videos, handling lighting, audio, game capture, filming, set design, editing, packaging, and publishing. I produced more than a hundred videos in the format, with thumbnails and titles treated as part of the creative work rather than an afterthought.' },
  xfpTg2g6NF4: { title: null, description: 'I developed and ran a channel centered on long-form gaming videos, handling lighting, audio, game capture, filming, set design, editing, packaging, and publishing. I produced more than a hundred videos in the format, with thumbnails and titles treated as part of the creative work rather than an afterthought.' },
};

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, text) => fs.writeFileSync(file, text.replace(/\r\n/g, '\n'), 'utf8');
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (value) => esc(value).replace(/"/g, '&quot;');
const stripTags = (value) => String(value).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const reEscape = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function removeNoIndex(html) {
  return html.replace(/\s*<meta name="robots" content="noindex,nofollow">\s*/gi, '\n');
}

function replaceMeta(html, kind, key, value) {
  const pattern = kind === 'name'
    ? new RegExp(`<meta name="${reEscape(key)}" content="[^"]*">`, 'i')
    : new RegExp(`<meta property="${reEscape(key)}" content="[^"]*">`, 'i');
  const replacement = kind === 'name'
    ? `<meta name="${key}" content="${attr(value)}">`
    : `<meta property="${key}" content="${attr(value)}">`;
  if (!pattern.test(html)) throw new Error(`Missing meta ${kind}=${key}`);
  return html.replace(pattern, replacement);
}

function replaceFirstMeaningfulTextModule(html, full) {
  let replaced = false;
  const pattern = /<section class="module module--text"([^>]*)>([\s\S]*?)<\/section>/gi;
  const next = html.replace(pattern, (match, extra, inner) => {
    const plain = stripTags(inner);
    if (!replaced && plain && plain !== '-') {
      replaced = true;
      return `<section class="module module--text"${extra}><div class="text-block">${esc(full)}</div></section>`;
    }
    return match;
  });
  if (!replaced) throw new Error('No meaningful project text module found');
  return next;
}

function updateProjectPage(route, copy) {
  const file = path.join(route.slice(1), 'index.html');
  if (!fs.existsSync(file)) throw new Error(`Missing project page ${file}`);
  let html = read(file);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>Dan Smith — ${esc(copy.title)}</title>`);
  html = replaceMeta(html, 'name', 'description', copy.short);
  html = replaceMeta(html, 'property', 'og:title', `Dan Smith — ${copy.title}`);
  html = replaceMeta(html, 'property', 'og:description', copy.short);
  html = removeNoIndex(html);
  if (/project-redesign/.test(html)) {
    html = html.replace(/(<header class="rproj-header">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, (_, before, after) => before + esc(copy.title) + after);
    html = html.replace(/<p class="rproj-summary">[\s\S]*?<\/p>/, '<p class="rproj-summary">' + esc(copy.short) + '</p>');
    html = html.replace(/<div class="rproj-story-copy">[\s\S]*?<\/div>/, '<div class="rproj-story-copy"><p>' + esc(copy.full) + '</p></div>');
    if (!html.includes('<p class="rproj-summary">' + esc(copy.short) + '</p>')) throw new Error('Native project summary did not update: ' + route);
    if (!html.includes('<div class="rproj-story-copy"><p>' + esc(copy.full) + '</p></div>')) throw new Error('Native project story did not update: ' + route);
  } else {
    html = replaceFirstMeaningfulTextModule(html, copy.full);
  }
  html = html.replace(/<div class="module button-row">[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<section class="related-projects">[\s\S]*?<\/section>/gi, '');
  html = html.replace(/<script src="\/assets\/portfolio-contact\.js\?v=[^"]+" defer><\/script>/i, '<script src="/assets/portfolio-contact.js?v=20260910-live-copy" defer></script>');
  if (/Contact Dan Smith/i.test(html)) throw new Error(`Legacy Contact button remains in ${route}`);
  if (/Other Categories:/i.test(html)) throw new Error(`Legacy related grid remains in ${route}`);
  if (!html.includes(copy.short) || !html.includes(esc(copy.full))) throw new Error(`Copy did not apply to ${route}`);
  write(file, html);
}

function updateArchiveCard(html, route, copy) {
  const pattern = new RegExp(`<a class="rdp-project-card[^"]*" href="${reEscape(route)}">[\\s\\S]*?<\\/a>`);
  if (!pattern.test(html)) throw new Error(`Archive card missing for ${route}`);
  return html.replace(pattern, (card) => {
    let next = card.replace(/<span class="rdp-project-title">[\s\S]*?<\/span>/, `<span class="rdp-project-title">${esc(copy.title)}</span>`);
    if (/<span class="rdp-project-note">/.test(next)) {
      next = next.replace(/<span class="rdp-project-note">[\s\S]*?<\/span>/, `<span class="rdp-project-note">${esc(copy.short)}</span>`);
    } else {
      next = next.replace(/<\/span><\/a>$/, `<span class="rdp-project-note">${esc(copy.short)}</span></span></a>`);
    }
    return next;
  });
}

function updateArchive(file, discipline) {
  let html = removeNoIndex(read(file));
  for (const [route, copy] of Object.entries(projectCopy)) {
    if (copy.discipline === discipline) html = updateArchiveCard(html, route, copy);
  }
  if (discipline === 'photo') {
    html = html.replace(/<div><p class="rd-eyebrow">Photography<\/p><h1>[\s\S]*?<\/h1><\/div>/, '<div><p class="rd-eyebrow">Photography</p><h1>Portraits, places, and light.</h1></div>');
    html = html.replace(/<p class="rdp-intro-copy">[\s\S]*?<\/p>/, '<p class="rdp-intro-copy"><strong>Portraits, events, travel, and experiments.</strong> Client work and personal projects shaped by color, light, and atmosphere.</p>');
  }
  write(file, html);
}

async function fetchYouTubeTitle(id) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, { signal: controller.signal, headers: { 'User-Agent': 'portfolio-release-copy/1.0' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const title = String(data.title || '').trim();
      if (!title) throw new Error('empty title');
      return title;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Could not recover YouTube title for ${id}: ${lastError?.message || lastError}`);
}

function updateShelf(html, id, copy) {
  const pattern = new RegExp(`<section class="rv-shelf" id="${reEscape(id)}">[\\s\\S]*?<\\/section>`);
  if (!pattern.test(html)) throw new Error(`Video shelf missing: ${id}`);
  return html.replace(pattern, (shelf) => shelf.replace(/<span class="rv-shelf-copy"><h2>[\s\S]*?<\/h2><p>[\s\S]*?<\/p><\/span>/, `<span class="rv-shelf-copy"><h2>${esc(copy.title)}</h2><p>${esc(copy.description)}</p></span>`));
}

function updateVideoCard(html, id, copy) {
  const pattern = new RegExp(`<a class="rv-video-card[^"]*"[^>]*data-youtube-id="${reEscape(id)}"[^>]*>[\\s\\S]*?<\\/a>`);
  if (!pattern.test(html)) throw new Error(`Video card missing: ${id}`);
  return html.replace(pattern, (card) => {
    let next = card.replace(/data-video-title="[^"]*"/, `data-video-title="${attr(copy.title)}"`);
    if (/data-video-description="/.test(next)) next = next.replace(/data-video-description="[^"]*"/, `data-video-description="${attr(copy.description)}"`);
    else next = next.replace(/(data-video-title="[^"]*")/, `$1 data-video-description="${attr(copy.description)}"`);
    next = next.replace(/<span class="rv-video-title">[\s\S]*?<\/span>/, `<span class="rv-video-title">${esc(copy.title)}</span>`);
    next = next.replace(/alt="[^"]*thumbnail"/, `alt="${attr(copy.title)} thumbnail"`);
    return next;
  });
}

function updateFeaturedVideo(html, id, copy) {
  const pattern = new RegExp(`<a class="rd-work-card"[^>]*data-youtube-id="${reEscape(id)}"[^>]*>[\\s\\S]*?<\\/a>`);
  if (!pattern.test(html)) throw new Error(`Featured video card missing: ${id}`);
  return html.replace(pattern, (card) => {
    let next = card.replace(/data-video-title="[^"]*"/, `data-video-title="${attr(copy.title)}"`);
    if (/data-video-description="/.test(next)) next = next.replace(/data-video-description="[^"]*"/, `data-video-description="${attr(copy.description)}"`);
    else next = next.replace(/(data-video-title="[^"]*")/, `$1 data-video-description="${attr(copy.description)}"`);
    next = next.replace(/<span class="rd-work-title">[\s\S]*?<\/span>/, `<span class="rd-work-title">${esc(copy.title)}</span>`);
    return next;
  });
}

function updateFeaturedProject(html, route, title) {
  const pattern = new RegExp(`<a class="rd-work-card" href="${reEscape(route)}">[\\s\\S]*?<\\/a>`);
  if (!pattern.test(html)) throw new Error(`Featured project missing: ${route}`);
  return html.replace(pattern, (card) => card.replace(/<span class="rd-work-title">[\s\S]*?<\/span>/, `<span class="rd-work-title">${esc(title)}</span>`));
}

async function main() {
  const unknownIds = Object.entries(videoCopy).filter(([, copy]) => !copy.title).map(([id]) => id);
  const recovered = await Promise.all(unknownIds.map(async (id) => [id, await fetchYouTubeTitle(id)]));
  for (const [id, title] of recovered) {
    videoCopy[id].title = title;
    console.log(`Recovered YouTube title ${id}: ${title}`);
  }

  for (const [route, copy] of Object.entries(projectCopy)) updateProjectPage(route, copy);
  updateArchive('design/index.html', 'design');
  updateArchive('photo/index.html', 'photo');

  let video = removeNoIndex(read('video/index.html'));
  video = replaceMeta(video, 'name', 'description', 'Client video editing, video essays, short-form work, and long-form gaming production by Dan Smith.');
  video = replaceMeta(video, 'property', 'og:description', 'Client video editing, video essays, short-form work, and long-form gaming production by Dan Smith.');
  video = video.replace(/<h1>Pick a shelf\.<br>Press play\.<\/h1>/, '<h1>Video built to<br>hold attention.</h1>');
  video = video.replace(/<p class="rv-intro-copy">[\s\S]*?<\/p>/, '<p class="rv-intro-copy"><strong>Editing, essays, short-form, and channel work.</strong> A selection spanning client stories, long-form editorial, social video, and gaming content.</p>');
  video = video.replace(/<div class="rv-shelves-head"><p>Browse the work<\/p><span>[\s\S]*?<\/span><\/div>/, '<div class="rv-shelves-head"><p>Browse the work</p><span>Client, editorial, social &amp; long-form</span></div>');
  for (const [id, copy] of Object.entries(videoCategories)) video = updateShelf(video, id, copy);
  for (const [id, copy] of Object.entries(videoCopy)) video = updateVideoCard(video, id, copy);
  write('video/index.html', video);

  let home = removeNoIndex(read('index.html'));
  home = home.replace(/<link rel="canonical" href="\/work">/, '<link rel="canonical" href="/">');
  home = updateFeaturedVideo(home, 'o8DPtyrcZ5o', videoCopy.o8DPtyrcZ5o);
  home = updateFeaturedVideo(home, 'Z0gUnF1mCdM', videoCopy.Z0gUnF1mCdM);
  home = updateFeaturedProject(home, '/couch-of-games-logo-brand-identity', projectCopy['/couch-of-games-logo-brand-identity'].title);
  home = updateFeaturedProject(home, '/professional-headshots', projectCopy['/professional-headshots'].title);
  write('index.html', home);
  write(path.join('work', 'index.html'), home);

  let contact = removeNoIndex(read('contact/index.html'));
  write('contact/index.html', contact);

  let videoJs = read('assets/redesign-video.js');
  videoJs = videoJs.replace(/\n  const descriptions = \{[\s\S]*?\n  \};\n/, '\n');
  videoJs = videoJs.replace("if (dialogDescription) dialogDescription.textContent = descriptions[id] || '';", "if (dialogDescription) dialogDescription.textContent = card.getAttribute('data-video-description') || '';");
  if (/descriptions\[id\]/.test(videoJs)) throw new Error('Legacy video description lookup remains');
  write('assets/redesign-video.js', videoJs);

  let homeVideoJs = read('assets/redesign-home-video-dialog.js');
  homeVideoJs = homeVideoJs.replace(/\n  const descriptions = \{[\s\S]*?\n  \};\n/, '\n');
  homeVideoJs = homeVideoJs.replace("if (dialogDescription) dialogDescription.textContent = descriptions[id] || '';", "if (dialogDescription) dialogDescription.textContent = card.getAttribute('data-video-description') || '';");
  if (/descriptions\[id\]/.test(homeVideoJs)) throw new Error('Legacy homepage video description lookup remains');
  write('assets/redesign-home-video-dialog.js', homeVideoJs);

  let compat = read('assets/redesign-project-compat.js');
  compat = compat.replace(/\n  \/\* The migrated project pages carried two navigation leftovers[\s\S]*?main\.querySelectorAll\('\.button-row, \.related-projects'\)\.forEach\(\(node\) => node\.remove\(\)\);\n/, '\n');
  const legacyCompatStart = compat.indexOf('  /* The migrated project pages carried');
  const legacyCompatEnd = compat.indexOf('  const contentChildren', legacyCompatStart);
  if (legacyCompatStart >= 0 && legacyCompatEnd > legacyCompatStart) compat = compat.slice(0, legacyCompatStart) + compat.slice(legacyCompatEnd);
  if (/\.button-row, \.related-projects/.test(compat)) throw new Error('Legacy related-project removal code remains in compatibility runtime');
  write('assets/redesign-project-compat.js', compat);

  // With the accepted copy now static, the nav no longer needs to rewrite the Video/Photo intro text at runtime.
  let nav = read('assets/redesign-nav.js');
  nav = nav.replace(/\n  \/\* Remove prototype\/user-review language[\s\S]*?\n  if \(document\.body\.classList\.contains\('discipline-photo'\)\) \{[\s\S]*?\n  \}\n/, '\n');
  write('assets/redesign-nav.js', nav);

  // Bump runtime URLs whose contents changed so the live cutover cannot reuse staging-era cached scripts.
  for (const file of ['index.html', 'video/index.html', 'design/index.html', 'photo/index.html', 'contact/index.html', 'work/index.html']) {
    let html = read(file);
    html = html.replace(/\/assets\/redesign-nav\.js\?v=[^"]+/g, '/assets/redesign-nav.js?v=20260910-live');
    html = html.replace(/\/assets\/redesign-video\.js\?v=[^"]+/g, '/assets/redesign-video.js?v=20260910-live');
    html = html.replace(/\/assets\/redesign-home-video-dialog\.js\?v=[^"]+/g, '/assets/redesign-home-video-dialog.js?v=20260910-live');
    write(file, html);
  }
  // The category controllers dynamically request nav.js, so bump those references too.
  for (const file of ['assets/redesign-video.js', 'assets/redesign-discipline.js']) {
    let js = read(file);
    js = js.replace(/\/assets\/redesign-nav\.js\?v=[^'";]+/g, '/assets/redesign-nav.js?v=20260910-live');
    write(file, js);
  }

  write('robots.txt', 'User-agent: *\nAllow: /\n');
  if (fs.existsSync('_headers')) fs.rmSync('_headers');

  // Release validation: preserve inventory, remove staging crawl blocks, and verify all approved copy made it into visitor-facing source.
  const design = read('design/index.html');
  const photo = read('photo/index.html');
  const finalVideo = read('video/index.html');
  const finalHome = read('index.html');
  if ((design.match(/class="rdp-project-card/g) || []).length !== 17) throw new Error('Design archive count changed');
  if ((photo.match(/class="rdp-project-card/g) || []).length !== 21) throw new Error('Photo archive count changed');
  if ((finalVideo.match(/data-youtube-id=/g) || []).length !== 18) throw new Error('Video inventory count changed');
  if (!finalHome.includes('<link rel="canonical" href="/">')) throw new Error('Homepage canonical is not root');
  if (!read('robots.txt').includes('Allow: /')) throw new Error('robots.txt is not live-safe');
  if (fs.existsSync('_headers')) throw new Error('Staging X-Robots header file still exists');

  for (const [route, copy] of Object.entries(projectCopy)) {
    const file = path.join(route.slice(1), 'index.html');
    const html = read(file);
    if (!html.includes(`Dan Smith — ${esc(copy.title)}`)) throw new Error(`Project title missing: ${route}`);
    if (!html.includes(attr(copy.short))) throw new Error(`Project short description missing: ${route}`);
    if (!html.includes(esc(copy.full))) throw new Error(`Project full description missing: ${route}`);
  }
  for (const [id, copy] of Object.entries(videoCopy)) {
    if (!copy.title || !finalVideo.includes(`data-video-title="${attr(copy.title)}"`)) throw new Error(`Final video title missing: ${id}`);
    if (!finalVideo.includes(`data-video-description="${attr(copy.description)}"`)) throw new Error(`Final video description missing: ${id}`);
  }

  const htmlFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
    }
  };
  walk('.');
  for (const file of htmlFiles) {
    if (file.endsWith(`${path.sep}404.html`) || file === '404.html') continue;
    const html = read(file);
    if (/noindex,nofollow/i.test(html)) throw new Error(`Staging noindex remains in ${file}`);
  }

  console.log(`Applied approved copy to ${Object.keys(projectCopy).length} projects and ${Object.keys(videoCopy).length} videos.`);
  console.log('Live-release source validation PASS.');
}

await main();
