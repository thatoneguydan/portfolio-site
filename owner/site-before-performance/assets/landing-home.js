import {defaults,normalizeSettings} from './landing-schema.js?v=20261118-featured1';
import {createBadge} from './landing-badge.js?v=20261118-viewport1';
import {appendEmojiText,graphemes} from './site-emoji.js?v=20261117-navlab1';
import {headlineLines,rotationWords,splitPunctuation,createTextRotation,accessibleHeadline} from './landing-rotate.js?v=20261117-navlab1';
import {featuredGalleryLayout,galleryCaptionKind} from './gallery-layout.js?v=20261118-featured1';
import {siteReady} from './site-runtime.js?v=20261118-featured1';
import {revealFrames,revealOffset} from './headline-view.js?v=20261118-featured1';
(async() => {
  'use strict';
  const root=document.getElementById('dan-landing-home'); if(!root)return;
  const api=await siteReady,config=api.getConfig();
  const featured=root.querySelector('#featured-work');
  const featuredHeading=featured.querySelector('#featured-heading');
  function applyFeaturedHeading(){
    const text=config.featuredHeading;
    if(featuredHeading.dataset.authoredCopy!==text){
      featuredHeading.dataset.authoredCopy=text;
      if(featuredHeading.textContent!==text)featuredHeading.textContent=text;
    }
    featuredHeading.hidden=!text.trim();
    if(featuredHeading.hidden){
      featured.removeAttribute('aria-labelledby');
      featured.setAttribute('aria-label','Featured work');
    }else{
      featured.setAttribute('aria-labelledby',featuredHeading.id);
      featured.removeAttribute('aria-label');
    }
    featuredHeading.style.setProperty('--featured-heading-size',config.featuredHeadingSize);
    featuredHeading.style.setProperty('--featured-heading-weight',config.featuredHeadingWeight);
    featuredHeading.style.setProperty('--featured-heading-gap',config.featuredHeadingGap+'px');
  }
  const h1=root.querySelector('.ds-reveal'),intro=root.querySelector('.ds-intro');
  const hero=root.querySelector('.ds-hero'),cta=intro.querySelector('.ds-contact');
  // The reference composition has a 920 CSS-pixel content area inside the site gutters.
  function fullHeroScale(){return config.heroScaleWithWidth ? Math.max(1,hero.clientWidth)/920 : 1;}
  // Document coordinates keep the fold at the original page position while scrolling.
  function measureLandingOrigin(){
    if(config.heroFeaturedBelowFold)root.style.setProperty('--landing-document-top',(root.getBoundingClientRect().top+window.scrollY)+'px');
  }
  const header=document.querySelector('.site-header');
  const headerObserver=new ResizeObserver(measureLandingOrigin);
  if(header)headerObserver.observe(header);
  function mobileNavigation(){
    const toggle=document.querySelector('.site-nav-toggle');
    return toggle?getComputedStyle(toggle).display!=='none':innerWidth<=720;
  }
  function applyHeroLayout(){
    const topSpace=mobileNavigation()?config.heroMobileTopSpace:config.heroDesktopTopSpace;
    hero.style.setProperty('--hero-top-space',topSpace/100);
    hero.classList.toggle('scales-with-width',config.heroScaleWithWidth);
    hero.style.setProperty('--hero-width-scale',fullHeroScale());
    root.style.setProperty('--hero-cta-offset',config.heroCtaOffset+'px');
    root.style.setProperty('--hero-featured-spacing',config.heroFeaturedSpacing/100);
    root.classList.toggle('featured-below-fold',config.heroFeaturedBelowFold);
    measureLandingOrigin();
  }
  const ticket=root.querySelector('.ds-ticket'),ticketStage=root.querySelector('.ds-ticket-stage');
  const headshot=root.querySelector('.ds-headshot'),photoWindow=root.querySelector('.ds-photo-window');
  const name=root.querySelector('.ds-ticket-footer'),heading=root.querySelector('.ds-ticket-heading');
  const bio=root.querySelector('.ds-bio'),copy=root.querySelector('.ds-ticket-copy');
  const gallery=root.querySelector('.ds-gallery'),panels=[...gallery.querySelectorAll('.ds-panel')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let currentAnimations=[],rotator=null,lastHeadline='',lastFit='';
  function segment(text) {
    return graphemes(text);
  }
  function renderText() {
    heading.hidden=!config.ticketHeading.trim();
    for(const [element,value]of [[heading,config.ticketHeading],[bio,config.bio]])if(element.dataset.authoredCopy!==value){element.dataset.authoredCopy=value;element.replaceChildren();appendEmojiText(element,value);}
    const headlineSignature=JSON.stringify(Object.entries(config).filter(([key])=>/^line\d$/.test(key)||key==='lineCount'||key.startsWith('rotate')));
    if(headlineSignature===lastHeadline){fitText();return;}
    lastHeadline=headlineSignature;
    currentAnimations.forEach(a=>a.cancel()); currentAnimations=[];rotator?.destroy();rotator=null; h1.replaceChildren();
    h1.classList.remove('is-revealing');
    const lines = headlineLines(config); h1.setAttribute('aria-label',accessibleHeadline(config));
    lines.forEach((text,index) => {
      const line=document.createElement('span'); line.className='ds-reveal-line'; line.dataset.line=index; line.setAttribute('aria-hidden','true');
      let wordIndex=0;
      String(text).split(/(\s+)/).filter(Boolean).forEach(word => {
        const wrap=document.createElement('span'); wrap.className=/^\s+$/.test(word)?'ds-space':'ds-word';
        const isWord=!/^\s+$/.test(word),target=isWord&&config.rotateEnabled&&config.rotateTarget===`${index+1}:${wordIndex}`&&rotationWords(config).length;
        if(target){
          const parts=splitPunctuation(word);appendEmojiText(wrap,parts.prefix);
          const glyph=document.createElement('span');glyph.className='ds-glyph';wrap.append(glyph);rotator=createTextRotation(glyph,config,{suffix:parts.suffix});
        }else segment(word).forEach(char => {const el=document.createElement('span');el.className='ds-glyph';appendEmojiText(el,char);wrap.append(el);});
        if(isWord)wordIndex++;line.append(wrap);
      });
      if (!text) line.append(document.createTextNode('\u00a0')); h1.append(line);
    });
    fitText();
    if(!h1.hasAttribute('data-headline-pending'))rotator?.start();
  }
  function fitText() {
    const compact=hero.classList.contains('is-compact'),max=config.fontSize*(compact?1:fullHeroScale());
    const signature=JSON.stringify([intro.clientWidth,compact,max,config.fontWeight,config.lineHeight,config.heroCtaScale,lastHeadline]);
    if(signature===lastFit)return;lastFit=signature;
    h1.style.fontSize=max+'px';h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    const lines=[...h1.children];
    h1.classList.remove('ds-long');lines.forEach(el=>{el.style.whiteSpace='nowrap';el.style.width='max-content';});
    const widths=lines.map(line=>line.getBoundingClientRect().width);
    const width=Math.max(...widths,1),available=Math.max(1,intro.clientWidth-4);
    h1.dataset.longestLine=String(widths.indexOf(Math.max(...widths)));
    const floor=Math.min(max,18),fitted=max*available/width;
    const finalSize=compact||width>available?Math.max(floor,fitted):max;
    if(compact||width>available){
      h1.style.fontSize=finalSize+'px';
      if(fitted<floor){h1.classList.add('ds-long');lines.forEach(el=>el.style.whiteSpace='normal');}
    }
    // Match the settled type size, including compact fitting and authored copy edits.
    // At the reference headline size, Tune's percentage applies to the original 260px pill.
    const buttonScale=config.heroCtaScale/100*finalSize/defaults.fontSize;
    cta.style.setProperty('--contact-button-scale',Math.min(buttonScale,intro.clientWidth/260));
    lines.forEach(el=>el.style.removeProperty('width'));
  }
  function replay() {
    currentAnimations.forEach(a=>a.cancel());currentAnimations=[];h1.classList.remove('is-revealing');rotator?.reset();if(reduced.matches||!config.animate){h1.removeAttribute('data-headline-pending');rotator?.start();badge.enter([{start:0,end:0}]);return;}
    let revealEnd=0,rotationEnd=0;const lineTimes=[],lead=config.badgeEntrance?220:0,rotatingLine=Number(config.rotateTarget.split(':')[0])-1;
    [...h1.children].forEach((line,li) => {
      const glyphs=[...line.querySelectorAll('.ds-glyph')],words=[...line.querySelectorAll('.ds-word')],n=glyphs.length;
      const timing={start:lead+li*config.lineDelay,end:lead+li*config.lineDelay};lineTimes.push(timing);
      const from=config.staggerFrom==='reference'?['first','last','center'][li]:config.staggerFrom;
      const start=config.direction==='down'?-112:config.direction==='up'?112:li===1?-112:112;
      const randomOrder=Array.from({length:config.splitBy==='words'?words.length:n},(_,i)=>i);
      for(let i=randomOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[randomOrder[i],randomOrder[j]]=[randomOrder[j],randomOrder[i]];}
      glyphs.forEach((el,index) => {
        const position=config.splitBy==='lines'?0:config.splitBy==='words'?Math.max(0,words.indexOf(el.closest('.ds-word'))):index;
        const count=config.splitBy==='lines'?1:config.splitBy==='words'?words.length:n;
        const order=from==='last'?count-1-position:from==='center'?Math.abs(position-(count-1)/2):from==='random'?randomOrder[position]||0:position;
        const distance=revealOffset(el.closest('.ds-word,.ds-space').offsetHeight,el.offsetHeight,parseFloat(getComputedStyle(el).fontSize),start);
        const frames=revealFrames(distance,config.duration,'px');
        const delay=lead+li*config.lineDelay+order*config.stagger;revealEnd=Math.max(revealEnd,config.duration+delay);timing.end=Math.max(timing.end,config.duration+delay);
        if(li===rotatingLine)rotationEnd=Math.max(rotationEnd,config.duration+delay);
        currentAnimations.push(el.animate(frames,{duration:config.duration,delay,easing:'linear',fill:'both'}));
      });
    });
    badge.enter(lineTimes);
    rotator?.start(rotationEnd+config.rotateInterval);h1.removeAttribute('data-headline-pending');
    const sequence=currentAnimations;h1.classList.add('is-revealing');
    Promise.all(sequence.map(animation=>animation.finished.catch(()=>{}))).then(()=>{
      if(currentAnimations!==sequence)return;
      sequence.forEach(animation=>animation.cancel());currentAnimations=[];h1.classList.remove('is-revealing');
    });
  }
  const dots=document.createElement('nav');
  dots.className='ds-gallery-dots';dots.setAttribute('aria-label','Choose a featured project');
  const dotButtons=panels.map((panel,i)=>{
    const button=document.createElement('button');
    button.type='button';button.dataset.index=String(i);
    if(!panel.id)panel.id='featured-card-'+(i+1);
    button.setAttribute('aria-controls',panel.id);
    button.setAttribute('aria-label',`Show ${panel.querySelector('.rd-work-title').textContent}, ${i+1} of ${panels.length}`);
    dots.append(button);
    return button;
  });
  if(panels.length>1)gallery.after(dots);
  let galleryWidth=gallery.getBoundingClientRect().width;
  function selectPanel(index) {
    if(!panels.length)return;
    config.activeIndex=(index+panels.length)%panels.length;
    const vertical=gallery.dataset.layout==='vertical';
    const layout=featuredGalleryLayout(config,vertical,galleryWidth,panels.length,config.activeIndex);
    const grayscale=vertical?config.verticalGalleryGrayscale:config.grayscale;
    gallery.style.setProperty('--gallery-height',layout.totalHeight+'px');
    gallery.style.setProperty('--mobile-expanded',layout.height+'px');
    gallery.style.setProperty('--media-width',layout.expandedWidth+'px');
    gallery.style.setProperty('--caption-width',Math.max(1,layout.expandedWidth-(vertical?config.verticalGalleryPadding*2:36))+'px');
    panels.forEach((panel,i)=>{
      const active=i===config.activeIndex;
      panel.dataset.focused=String(active);panel.style.flexGrow=String(layout.extents[i]);
      panel.querySelector('img').style.filter=grayscale&&!active?'grayscale(1)':'none';
      dotButtons[i].setAttribute('aria-current',String(active));
      dotButtons[i].tabIndex=active?0:-1;
    });
    updateCaptions();
  }
  function updateCaptions(){
    const mobile=mobileNavigation();
    gallery.dataset.mobile=String(mobile);
    panels.forEach((panel,i)=>{
      const kind=galleryCaptionKind({active:i===config.activeIndex,vertical:gallery.dataset.layout==='vertical',mobile,hovered:panel.matches(':hover'),focused:panel.matches(':focus-visible')||dotButtons[i].matches(':focus-visible')});
      panel.dataset.captionKind=kind;panel.dataset.captionVisible=String(kind!=='none');
    });
  }
  function renderGallery() {
    const vertical=mobileNavigation();
    const layout=vertical?'vertical':'horizontal',changed=gallery.dataset.layout!==layout;
    if(changed)gallery.classList.add('is-switching-layout');
    const gap=vertical?config.verticalGalleryGap:config.galleryGap;
    galleryWidth=gallery.getBoundingClientRect().width;
    gallery.dataset.layout=layout;
    gallery.style.setProperty('--gallery-gap',gap+'px');
    gallery.style.setProperty('--gallery-radius',(vertical?config.verticalGalleryRadius:config.galleryRadius)+'px');
    gallery.style.setProperty('--gallery-duration',(vertical?config.verticalGalleryDuration:config.galleryDuration)+'ms');
    gallery.style.setProperty('--caption-inset',(vertical?config.verticalGalleryPadding:20)+'px');
    gallery.style.setProperty('--caption-title-size',(vertical?config.verticalGalleryTitleSize:20)+'px');
    gallery.style.setProperty('--compact-title-size',config.verticalGalleryCompactTitleSize+'px');
    selectPanel(config.activeIndex);
    if(changed){void gallery.offsetHeight;requestAnimationFrame(()=>gallery.classList.remove('is-switching-layout'));}
  }

  const badge=createBadge({root,intro,h1,ticket,ticketStage,config,fitText,fullHeroScale});
  function render(){applyHeroLayout();applyFeaturedHeading();renderText();renderGallery();badge.update();document.dispatchEvent(new CustomEvent('portfolio-appearance',{detail:{...config}}));}

  function commitDot(index){
    const target=panels[index],section=gallery.closest('#featured-work');
    if(section.querySelector('.rdp-project-shelf.is-open')&&!target.hasAttribute('aria-busy')&&
       (!target.classList.contains('is-active')||gallery.querySelector('[aria-busy="true"]'))){
      document.dispatchEvent(new CustomEvent('portfolio-open-project',{detail:{card:target}}));
    }
  }
  function keyIndex(key){
    if(key==='Home')return 0;
    if(key==='End')return panels.length-1;
    if(key==='ArrowRight'||key==='ArrowDown')return (config.activeIndex+1)%panels.length;
    if(key==='ArrowLeft'||key==='ArrowUp')return (config.activeIndex+panels.length-1)%panels.length;
    return null;
  }
  dots.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(button){const i=Number(button.dataset.index);selectPanel(i);commitDot(i);}
  });
  dots.addEventListener('keydown',event=>{
    const i=keyIndex(event.key);if(i===null)return;
    event.preventDefault();selectPanel(i);dotButtons[i].focus({preventScroll:true});commitDot(i);
  });
  dots.addEventListener('focusin',updateCaptions);
  dots.addEventListener('focusout',()=>requestAnimationFrame(updateCaptions));
  let scrubPointer=null;
  function scrub(clientX){
    const start=dotButtons[0].getBoundingClientRect();
    const i=Math.max(0,Math.min(panels.length-1,Math.floor((clientX-start.left)/start.width)));
    if(i!==config.activeIndex)selectPanel(i);
  }
  dots.addEventListener('pointerdown',event=>{
    if(!event.isPrimary||event.button!==0)return;
    event.preventDefault();scrubPointer=event.pointerId;dots.setPointerCapture(event.pointerId);scrub(event.clientX);
  });
  dots.addEventListener('pointermove',event=>{if(scrubPointer===event.pointerId)scrub(event.clientX);});
  dots.addEventListener('pointerup',event=>{
    if(scrubPointer!==event.pointerId)return;
    scrub(event.clientX);scrubPointer=null;dotButtons[config.activeIndex].focus({preventScroll:true});commitDot(config.activeIndex);
  });
  dots.addEventListener('lostpointercapture',()=>{scrubPointer=null;});
  gallery.addEventListener('portfolio-featured-select',event=>{
    const i=panels.indexOf(event.target);if(i!==-1)selectPanel(i);
  });
  panels.forEach((panel,i)=>{
    const compactCaption=document.createElement('span');compactCaption.className='ds-compact-caption';compactCaption.setAttribute('aria-hidden','true');
    const compactTitle=document.createElement('strong');compactTitle.textContent=panel.querySelector('.rd-work-title').textContent;
    compactCaption.append(compactTitle);panel.append(compactCaption);
    let touchExpanding=false;
    panel.addEventListener('pointerdown',event=>{touchExpanding=event.pointerType==='touch'&&config.activeIndex!==i;});
    panel.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')selectPanel(i);});
    panel.addEventListener('pointerleave',updateCaptions);
    panel.addEventListener('focus',()=>selectPanel(i));
    panel.addEventListener('blur',()=>requestAnimationFrame(updateCaptions));
    // Capture before the site's video-modal and project-shelf click handlers.
    panel.addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      if(touchExpanding||config.activeIndex!==i){event.preventDefault();event.stopImmediatePropagation();selectPanel(i);}
      touchExpanding=false;
    },{capture:true});
    panel.addEventListener('keydown',event=>{
      const next=keyIndex(event.key);if(next===null)return;
      event.preventDefault();selectPanel(next);panels[next].focus();
    });
  });

  const resize=()=>{applyHeroLayout();fitText();renderGallery();badge.layout();};
  addEventListener('resize',resize);let lastRootWidth=0;new ResizeObserver(()=>{if(root.clientWidth!==lastRootWidth){lastRootWidth=root.clientWidth;resize();}}).observe(root);
  addEventListener('pagehide',event=>{if(event.persisted)return;headerObserver.disconnect();badge.destroy();rotator?.destroy();currentAnimations.forEach(a=>a.cancel());});
  window.portfolioLanding=api;
  api.register({update(next){Object.assign(config,next);render();},replay});
  const restored=panels.findIndex(panel=>panel.classList.contains('is-active'));
  if(restored!==-1)selectPanel(restored);
  lastFit='';resize();document.documentElement.classList.remove('landing-loading');requestAnimationFrame(replay);
})();
