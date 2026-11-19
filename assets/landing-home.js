import {defaults,normalizeSettings} from './landing-schema.js?v=20261119-opaque-wave1';
import {createBadge} from './landing-badge.js?v=20261119-tunefind1';
import {appendEmojiText,graphemes} from './site-emoji.js?v=20261118-perf1';
import {headlineLines,rotationWords,splitPunctuation,createTextRotation,accessibleHeadline} from './landing-rotate.js?v=20261119-carousel1';
import {mountProjectCarousel,usesCompactNavigation} from './project-carousel.js?v=20261119-mobile-polish1';
import {siteReady} from './site-runtime.js?v=20261119-opaque-wave1';
import {revealFrames,revealOffset} from './headline-view.js?v=20261119-opaque-wave1';
import {mountSectionHeading} from './featured-heading.js?v=20261119-shared-carousel1';
(async() => {
  'use strict';
  const root=document.getElementById('dan-landing-home'); if(!root)return;
  const api=await siteReady,config=api.getConfig();
  const featured=root.querySelector('#featured-work');
  const featuredHeading=featured.querySelector('#featured-heading');
  const featuredTitle=mountSectionHeading(featuredHeading,featured,featured.querySelector('.ds-gallery'),{
    scope:'featured',label:'Featured work',lastItem:'.ds-panel:last-of-type'
  });
  const workDescriptions=root.querySelectorAll('[data-work-description]');
  const workLinks=root.querySelector('.ds-work-links');
  const workHeading=root.querySelector('#work-section-heading');
  const workTitle=workHeading&&mountSectionHeading(workHeading,workHeading.closest('.ds-work-group'),workLinks,{
    scope:'workSection',label:'Explore work',anchored:true
  });
  if(workLinks){
    let pressedWorkCard=null,workPointer=null;
    function releaseWorkCard(event){
      if(event&&'pointerId' in event&&event.pointerId!==workPointer)return;
      pressedWorkCard?.classList.remove('is-work-pressed');
      pressedWorkCard=workPointer=null;
    }
    workLinks.addEventListener('pointerdown',event=>{
      if(event.button!==0||!event.isPrimary)return;
      const card=event.target.closest('.ds-work-card');
      if(!card)return;
      releaseWorkCard();
      pressedWorkCard=card;
      workPointer=event.pointerId;
      card.classList.add('is-work-pressed');
    },{passive:true});
    addEventListener('pointerup',releaseWorkCard,{capture:true,passive:true});
    addEventListener('pointercancel',releaseWorkCard,{capture:true,passive:true});
    addEventListener('blur',releaseWorkCard);
    addEventListener('pagehide',releaseWorkCard);
  }
  const h1=root.querySelector('.ds-reveal'),intro=root.querySelector('.ds-intro');
  const hero=root.querySelector('.ds-hero'),cta=intro.querySelector('.ds-contact');
  // The reference composition has a 920 CSS-pixel content area inside the site gutters.
  function fullHeroScale(){return config.heroScaleWithWidth ? Math.max(1,hero.clientWidth)/920 : 1;}
  function textSizeAdjustment(){return config.heroTextSizeOffset/100;}
  function fullIDScale(){return fullHeroScale()*(1-textSizeAdjustment());}
  // Document coordinates keep the fold at the original page position while scrolling.
  function measureLandingOrigin(){
    if(config.heroFeaturedBelowFold)root.style.setProperty('--landing-document-top',(root.getBoundingClientRect().top+window.scrollY)+'px');
  }
  const header=document.querySelector('.site-header');
  const headerObserver=new ResizeObserver(measureLandingOrigin);
  if(header)headerObserver.observe(header);
  function measureFeaturedHeading(){
    if(config.heroFeaturedBelowFold)root.style.setProperty('--featured-anchor-height',featuredHeading.getBoundingClientRect().height+'px');
  }
  const featuredHeadingObserver=new ResizeObserver(measureFeaturedHeading);
  featuredHeadingObserver.observe(featuredHeading,{box:'border-box'});
  function applyHeroLayout(){
    const topSpace=usesCompactNavigation()?config.heroMobileTopSpace:config.heroDesktopTopSpace;
    hero.style.setProperty('--hero-top-space',topSpace/100);
    hero.classList.toggle('scales-with-width',config.heroScaleWithWidth);
    hero.style.setProperty('--hero-width-scale',fullHeroScale());
    const textTrack=1.08*(1+textSizeAdjustment()),idTrack=2.08-textTrack;
    hero.style.setProperty('--hero-text-track',textTrack+'fr');
    hero.style.setProperty('--hero-id-track',idTrack+'fr');
    root.style.setProperty('--hero-cta-offset',config.heroCtaOffset+'px');
    root.style.setProperty('--hero-featured-spacing',config.heroFeaturedSpacing/100);
    root.style.setProperty('--featured-anchor-offset',config.heroFeaturedAnchorOffset+'px');
    root.classList.toggle('featured-below-fold',config.heroFeaturedBelowFold);
    hero.classList.toggle('is-centered',config.heroCenterVertically);
    measureLandingOrigin();
  }
  const ticket=root.querySelector('.ds-ticket'),ticketStage=root.querySelector('.ds-ticket-stage');
  const headshot=root.querySelector('.ds-headshot'),photoWindow=root.querySelector('.ds-photo-window');
  const name=root.querySelector('.ds-ticket-footer'),heading=root.querySelector('.ds-ticket-heading');
  const bio=root.querySelector('.ds-bio'),copy=root.querySelector('.ds-ticket-copy');
  const carousel=mountProjectCarousel(featured.querySelector('.ds-gallery'),{
    controlsLabel:'Choose a featured project',orientationKey:'featuredOrientation',configuredIndex:'activeIndex',idPrefix:'featured'
  });
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
    const compact=hero.classList.contains('is-compact');
    const singleLine=compact||usesCompactNavigation();
    const baseSize=config.fontSize*(compact?1:fullHeroScale());
    const adjustment=textSizeAdjustment();
    const signature=JSON.stringify([intro.clientWidth,compact,singleLine,baseSize,adjustment,config.fontWeight,config.lineHeight,config.heroCtaScale,lastHeadline]);
    if(signature===lastFit)return;lastFit=signature;
    h1.style.fontSize=baseSize+'px';h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    const lines=[...h1.children];
    h1.classList.remove('ds-long');lines.forEach(el=>{el.style.whiteSpace='nowrap';el.style.width='max-content';});
    const rotatingLine=Number(config.rotateTarget.split(':')[0])-1;
    function measureLines(){
      rotator?.syncWidth();
      const extra=rotator?.fitExtraWidth()||0;
      return lines.map((line,i)=>line.getBoundingClientRect().width+(i===rotatingLine?extra:0));
    }
    const widths=measureLines();
    const width=Math.max(...widths,1),available=Math.max(1,intro.clientWidth-4);
    h1.style.setProperty('--rotate-entry-limit',available+'px');
    h1.dataset.longestLine=String(widths.indexOf(Math.max(...widths)));
    const fitted=baseSize*available/width;
    const desired=(compact?fitted:baseSize)*(1+adjustment);
    // Fit the authored line breaks on phones, including the widest rotation
    // entry. The actual word still occupies only its current width.
    let finalSize=singleLine?Math.min(desired,fitted):Math.max(Math.min(desired,18),Math.min(desired,fitted));
    h1.style.fontSize=finalSize+'px';
    if(singleLine){
      const actual=Math.max(...measureLines());
      // The glyph clips also need room for their em-sized padding at larger widths.
      const usable=Math.max(1,intro.clientWidth-Math.max(4,finalSize*.1));
      if(actual>usable){finalSize*=usable/actual;h1.style.fontSize=finalSize+'px';}
    }else if(finalSize>fitted+.01){h1.classList.add('ds-long');lines.forEach(el=>el.style.whiteSpace='normal');}
    const titleScale='var(--site-title-scale,1)';
    h1.style.fontSize=`calc(${finalSize}px * ${titleScale})`;
    // Match the settled type size, including compact fitting and authored copy edits.
    // At the reference headline size, Tune's percentage applies to the original 260px pill.
    const buttonScale=config.heroCtaScale/100*finalSize/defaults.fontSize;
    cta.style.setProperty('--contact-button-scale',`min(${buttonScale} * ${titleScale}, ${intro.clientWidth/260})`);
    lines.forEach(el=>el.style.removeProperty('width'));
    rotator?.syncWidth();
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
  const badge=createBadge({root,intro,h1,ticket,ticketStage,config,fitText,fullHeroScale:fullIDScale});
  function render(){
    applyHeroLayout();
    featuredTitle.update(config);
    workTitle?.update(config);
    measureFeaturedHeading();
    for(const description of workDescriptions){
      const text=config[description.dataset.workDescription];
      if(description.textContent!==text)description.textContent=text;
    }
    if(workLinks){
      workLinks.style.setProperty('--work-card-hover-height',config.workCardHoverHeight+'px');
      workLinks.style.setProperty('--work-desktop-height',config.workDesktopHeight/100);
      workLinks.style.setProperty('--work-mobile-height',config.workMobileHeight+'px');
      workLinks.style.setProperty('--work-mobile-padding',config.workMobilePadding+'px');
      for(const [element,key] of [['number','Number'],['title','Title'],['description','Description'],['arrow','Arrow']]){
        workLinks.style.setProperty('--work-'+element+'-size',config['work'+key+'Size']/100);
        workLinks.style.setProperty('--work-'+element+'-weight',config['work'+key+'Weight']);
        workLinks.style.setProperty('--work-'+element+'-color',config['work'+key+'Color']);
      }
    }
    renderText();
    carousel.update(config);
    badge.update();
    document.dispatchEvent(new CustomEvent('portfolio-appearance',{detail:{...config}}));
  }

  let lastRootWidth=0;
  const resize=()=>{
    lastRootWidth=root.clientWidth;
    applyHeroLayout();fitText();badge.layout();
  };
  addEventListener('resize',resize);
  new ResizeObserver(()=>{if(root.clientWidth!==lastRootWidth)resize();}).observe(root);
  addEventListener('pagehide',event=>{if(event.persisted)return;headerObserver.disconnect();featuredHeadingObserver.disconnect();badge.destroy();carousel.destroy();featuredTitle.destroy();workTitle?.destroy();rotator?.destroy();currentAnimations.forEach(a=>a.cancel());});
  window.portfolioLanding=api;
  api.register({update(next){Object.assign(config,next);render();},replay});
  lastFit='';resize();document.documentElement.classList.remove('landing-loading');requestAnimationFrame(replay);
})();
