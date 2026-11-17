import {defaults,normalizeSettings} from './landing-schema.js?v=20261117-refine2';
import {createBadge} from './landing-badge.js?v=20261117-refine2';
import {appendEmojiText,graphemes} from './site-emoji.js?v=20261117-refine2';
import {headlineLines,rotationWords,splitPunctuation,createTextRotation,accessibleHeadline} from './landing-rotate.js?v=20261117-refine2';
import {expandedGalleryHeight,galleryCaptionKind} from './gallery-layout.js?v=20261117-refine2';
import {siteReady} from './site-runtime.js?v=20261117-refine2';
import {revealFrames,revealOffset} from './headline-view.js?v=20261117-refine2';
(async() => {
  'use strict';
  const root=document.getElementById('dan-landing-home'); if(!root)return;
  const api=await siteReady,config=api.getConfig();
  const h1=root.querySelector('.ds-reveal'),intro=root.querySelector('.ds-intro');
  const ticket=root.querySelector('.ds-ticket'),ticketStage=root.querySelector('.ds-ticket-stage');
  const headshot=root.querySelector('.ds-headshot'),photoWindow=root.querySelector('.ds-photo-window');
  const name=root.querySelector('.ds-ticket-footer'),heading=root.querySelector('.ds-ticket-heading');
  const bio=root.querySelector('.ds-bio'),copy=root.querySelector('.ds-ticket-copy');
  const gallery=root.querySelector('.ds-gallery'),panels=[...gallery.querySelectorAll('.ds-panel')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let currentAnimations=[],rotator=null,lastHeadline='',lastFit='';
  const persist=()=>{};
  function segment(text) {
    return graphemes(text);
  }
  function renderText() {
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
    const max=config.fontSize,compact=root.querySelector('.ds-hero').classList.contains('is-compact');
    const signature=JSON.stringify([intro.clientWidth,compact,max,config.fontWeight,config.lineHeight,lastHeadline]);
    if(signature===lastFit)return;lastFit=signature;
    h1.style.fontSize=max+'px';h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    const lines=[...h1.children];
    h1.classList.remove('ds-long');lines.forEach(el=>{el.style.whiteSpace='nowrap';el.style.width='max-content';});
    const widths=lines.map(line=>line.getBoundingClientRect().width);
    const width=Math.max(...widths,1),available=Math.max(1,intro.clientWidth-4);
    h1.dataset.longestLine=String(widths.indexOf(Math.max(...widths)));
    const floor=Math.min(max,18),fitted=max*available/width;
    if(compact||width>available){
      h1.style.fontSize=Math.max(floor,fitted)+'px';
      if(fitted<floor){h1.classList.add('ds-long');lines.forEach(el=>el.style.whiteSpace='normal');}
    }
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
  function selectPanel(index,save=true) {
    config.activeIndex=(index+panels.length)%panels.length;
    const grayscale=gallery.dataset.layout==='vertical'?config.verticalGalleryGrayscale:config.grayscale;
    panels.forEach((el,i) => {const active=i===config.activeIndex;el.dataset.focused=String(active);el.style.flexGrow=active?config.expandRatio*(panels.length-1)/(100-config.expandRatio):1;el.querySelector('img').style.filter=grayscale&&!active?'grayscale(1)':'none';});
    updateCaptions();
    if(save)persist();
  }
  function updateCaptions(){
    const navToggle=document.querySelector('.site-nav-toggle');
    const mobile=navToggle?getComputedStyle(navToggle).display!=='none':innerWidth<=720;
    gallery.dataset.mobile=String(mobile);
    panels.forEach((panel,i)=>{
      const kind=galleryCaptionKind({active:i===config.activeIndex,vertical:gallery.dataset.layout==='vertical',mobile,hovered:panel.matches(':hover'),focused:panel.matches(':focus-visible')});
      panel.dataset.captionKind=kind;panel.dataset.captionVisible=String(kind!=='none');
    });
  }
  function renderGallery() {
    const navToggle=document.querySelector('.site-nav-toggle');
    const vertical=navToggle?getComputedStyle(navToggle).display!=='none':innerWidth<=720;
    const layout=vertical?'vertical':'horizontal',changed=gallery.dataset.layout!==layout;
    if(changed)gallery.classList.add('is-switching-layout');
    const gap=vertical?config.verticalGalleryGap:config.galleryGap;
    const settledWidth=vertical?gallery.clientWidth:(gallery.clientWidth-gap*(panels.length-1))*config.expandRatio/100;
    const height=expandedGalleryHeight(config,vertical,settledWidth);
    gallery.dataset.layout=layout;
    gallery.style.setProperty('--gallery-height',height+'px');
    gallery.style.setProperty('--gallery-gap',gap+'px');
    gallery.style.setProperty('--gallery-radius',(vertical?config.verticalGalleryRadius:config.galleryRadius)+'px');
    gallery.style.setProperty('--gallery-duration',(vertical?config.verticalGalleryDuration:config.galleryDuration)+'ms');
    gallery.style.setProperty('--mobile-expanded',height+'px');
    gallery.style.setProperty('--mobile-collapsed',config.verticalGalleryCollapsed+'px');
    gallery.style.setProperty('--gallery-total-height',(height+config.verticalGalleryCollapsed*(panels.length-1)+gap*(panels.length-1))+'px');
    gallery.style.setProperty('--caption-inset',(vertical?config.verticalGalleryPadding:20)+'px');
    gallery.style.setProperty('--caption-width',Math.max(1,settledWidth-(vertical?config.verticalGalleryPadding*2:36))+'px');
    gallery.style.setProperty('--caption-title-size',(vertical?config.verticalGalleryTitleSize:20)+'px');
    gallery.style.setProperty('--compact-title-size',config.verticalGalleryCompactTitleSize+'px');
    gallery.style.setProperty('--media-width',Math.max(1,settledWidth)+'px');selectPanel(config.activeIndex,false);
    if(changed){void gallery.offsetHeight;requestAnimationFrame(()=>gallery.classList.remove('is-switching-layout'));}
  }

  const badge=createBadge({root,intro,h1,ticket,ticketStage,config,fitText});
  function render(){renderText();renderGallery();badge.update();document.dispatchEvent(new CustomEvent('portfolio-appearance',{detail:{...config}}));}

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
      if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();selectPanel(event.key==='Home'?0:event.key==='End'?panels.length-1:config.activeIndex+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1));panels[config.activeIndex].focus();
    });
  });

  const resize=()=>{fitText();renderGallery();badge.layout();};
  addEventListener('resize',resize);let lastRootWidth=0;new ResizeObserver(()=>{if(root.clientWidth!==lastRootWidth){lastRootWidth=root.clientWidth;resize();}}).observe(root);
  addEventListener('pagehide',event=>{if(event.persisted)return;badge.destroy();rotator?.destroy();currentAnimations.forEach(a=>a.cancel());});
  window.portfolioLanding=api;
  api.register({update(next){Object.assign(config,next);render();},replay});
  lastFit='';resize();document.documentElement.classList.remove('landing-loading');requestAnimationFrame(replay);
})();
