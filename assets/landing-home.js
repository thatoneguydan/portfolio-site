import {defaults,normalizeSettings} from './landing-schema.js?v=20261118-worklinks1';
import {createBadge} from './landing-badge.js?v=20261118-tune2';
import {appendEmojiText,graphemes} from './site-emoji.js?v=20261118-perf1';
import {headlineLines,rotationWords,splitPunctuation,createTextRotation,accessibleHeadline} from './landing-rotate.js?v=20261118-hero3';
import {featuredGalleryLayout,featuredPointerPosition,galleryCaptionKind} from './gallery-layout.js?v=20261118-featured4';
import {siteReady} from './site-runtime.js?v=20261118-worklinks1';
import {revealFrames,revealOffset} from './headline-view.js?v=20261118-worklinks1';
import {mountFeaturedHeading} from './featured-heading.js?v=20261118-featured4';
import {bindDotScrubber,createDotIndicator} from './dot-indicator.js?v=20261118-hero3';
(async() => {
  'use strict';
  const root=document.getElementById('dan-landing-home'); if(!root)return;
  const api=await siteReady,config=api.getConfig();
  const featured=root.querySelector('#featured-work');
  const featuredHeading=featured.querySelector('#featured-heading');
  const featuredTitle=mountFeaturedHeading(featuredHeading,featured);
  const workDescriptions=root.querySelectorAll('[data-work-description]');
  const workLinks=root.querySelector('.ds-work-links');
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
  function mobileNavigation(){
    const toggle=document.querySelector('.site-nav-toggle');
    return toggle?getComputedStyle(toggle).display!=='none':innerWidth<=720;
  }
  function applyHeroLayout(){
    const topSpace=mobileNavigation()?config.heroMobileTopSpace:config.heroDesktopTopSpace;
    hero.style.setProperty('--hero-top-space',topSpace/100);
    hero.classList.toggle('scales-with-width',config.heroScaleWithWidth);
    hero.style.setProperty('--hero-width-scale',fullHeroScale());
    const textTrack=1.08*(1+textSizeAdjustment()),idTrack=2.08-textTrack;
    hero.style.setProperty('--hero-text-track',textTrack+'fr');
    hero.style.setProperty('--hero-id-track',idTrack+'fr');
    hero.style.setProperty('--hero-id-share',idTrack/2.08);
    hero.style.setProperty('--hero-id-overlap',config.heroDesktopIdOverlap/100);
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
    const compact=hero.classList.contains('is-compact');
    const baseSize=config.fontSize*(compact?1:fullHeroScale());
    const adjustment=textSizeAdjustment();
    const signature=JSON.stringify([intro.clientWidth,compact,baseSize,adjustment,config.fontWeight,config.lineHeight,config.heroCtaScale,lastHeadline]);
    if(signature===lastFit)return;lastFit=signature;
    h1.style.fontSize=baseSize+'px';h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    const lines=[...h1.children];
    h1.classList.remove('ds-long');lines.forEach(el=>{el.style.whiteSpace='nowrap';el.style.width='max-content';});
    const widths=lines.map(line=>line.getBoundingClientRect().width);
    const width=Math.max(...widths,1),available=Math.max(1,intro.clientWidth-4);
    h1.dataset.longestLine=String(widths.indexOf(Math.max(...widths)));
    const fitted=baseSize*available/width;
    const desired=(compact?fitted:baseSize)*(1+adjustment);
    const floor=Math.min(compact?baseSize*(1+adjustment):desired,18);
    const finalSize=compact?Math.max(floor,desired):Math.max(floor,Math.min(desired,fitted));
    h1.style.fontSize=finalSize+'px';
    if(finalSize>fitted+.01){h1.classList.add('ds-long');lines.forEach(el=>el.style.whiteSpace='normal');}
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
  const dotIndicator=createDotIndicator(dots);
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
  let galleryPlans=[],galleryGap=0,renderedPosition=-1,renderedIndex=-1;
  let mouseTrack=null,mouseFrame=0;
  const panelImages=panels.map(panel=>panel.querySelector('.ds-gallery-image'));
  function paintGallery(position,{fromScrub=false}={}) {
    if(!galleryPlans.length)return;
    const index=Math.round(position),before=Math.floor(position),after=Math.ceil(position);
    const changeSelection=index!==renderedIndex;
    if(!fromScrub&&changeSelection)dotIndicator.select(dotButtons[index]);
    if(renderedPosition!==position){
      renderedPosition=position;
      const progress=position-before;
      panels.forEach((panel,i)=>{
        const start=galleryPlans[before].extents[i],end=galleryPlans[after].extents[i];
        panel.style.flexGrow=String(start+(end-start)*progress);
      });
    }
    if(changeSelection){
      renderedIndex=index;
      const grayscale=gallery.dataset.layout==='vertical'?config.verticalGalleryGrayscale:config.grayscale;
      panels.forEach((panel,i)=>{
        const active=i===index;
        panel.dataset.focused=String(active);
        panelImages[i].style.filter=grayscale&&!active?'grayscale(1)':'none';
        dotButtons[i].setAttribute('aria-current',String(active));
        dotButtons[i].tabIndex=active?0:-1;
      });
    }
    updateCaptions();
  }
  function clearMouseTrack(){
    mouseTrack=null;
    cancelAnimationFrame(mouseFrame);
    mouseFrame=0;
    gallery.classList.remove('is-mouse-tracking');
  }
  function selectPanel(index,{fromScrub=false}={}) {
    if(!panels.length)return;
    clearMouseTrack();
    config.activeIndex=(index+panels.length)%panels.length;
    paintGallery(config.activeIndex,{fromScrub});
  }
  function updateCaptions(){
    const mobile=gallery.dataset.layout==='vertical';
    panels.forEach((panel,i)=>{
      const active=i===renderedIndex;
      const kind=galleryCaptionKind({active,vertical:mobile,mobile,hovered:active&&!mobile&&(!!mouseTrack||panel.matches(':hover')),focused:active&&!mobile&&(panel.matches(':focus-visible')||dotButtons[i].matches(':focus-visible'))});
      if(panel.dataset.captionKind!==kind)panel.dataset.captionKind=kind;
      if(panel.dataset.captionVisible!==String(kind!=='none'))panel.dataset.captionVisible=String(kind!=='none');
    });
  }
  function renderGallery() {
    if(!panels.length)return;
    const vertical=mobileNavigation();
    const layout=vertical?'vertical':'horizontal',changed=gallery.dataset.layout!==layout;
    if(changed)gallery.classList.add('is-switching-layout');
    galleryGap=vertical?config.verticalGalleryGap:config.galleryGap;
    const galleryWidth=gallery.getBoundingClientRect().width;
    galleryPlans=panels.map((_,i)=>featuredGalleryLayout(config,vertical,galleryWidth,panels.length,i));
    const layoutPlan=galleryPlans[0];
    gallery.style.setProperty('--gallery-height',layoutPlan.totalHeight+'px');
    gallery.style.setProperty('--mobile-expanded',layoutPlan.height+'px');
    gallery.style.setProperty('--media-width',layoutPlan.expandedWidth+'px');
    gallery.style.setProperty('--caption-width',Math.max(1,layoutPlan.expandedWidth-(vertical?config.verticalGalleryPadding*2:36))+'px');
    for(const image of panelImages)if(image.srcset)image.sizes=Math.ceil(vertical?galleryWidth:layoutPlan.expandedWidth)+'px';
    gallery.dataset.layout=layout;
    gallery.dataset.mobile=String(vertical);
    gallery.style.setProperty('--gallery-gap',galleryGap+'px');
    gallery.style.setProperty('--gallery-radius',(vertical?config.verticalGalleryRadius:config.galleryRadius)+'px');
    gallery.style.setProperty('--gallery-duration',(vertical?config.verticalGalleryDuration:config.galleryDuration)+'ms');
    gallery.style.setProperty('--caption-inset',(vertical?config.verticalGalleryPadding:20)+'px');
    gallery.style.setProperty('--caption-title-size',(vertical?config.verticalGalleryTitleSize:20)+'px');
    gallery.style.setProperty('--compact-title-size',config.verticalGalleryCompactTitleSize+'px');
    renderedIndex=renderedPosition=-1;
    selectPanel(config.activeIndex);
    if(changed){void gallery.offsetHeight;requestAnimationFrame(()=>gallery.classList.remove('is-switching-layout'));}
  }
  function updateMousePreview(event){
    if(event.pointerType!=='mouse'||event.buttons||!galleryPlans.length)return;
    if(!mouseTrack){
      const vertical=gallery.dataset.layout==='vertical';
      const bounds=gallery.getBoundingClientRect();
      mouseTrack={vertical,start:vertical?bounds.top+scrollY:bounds.left+scrollX,extents:galleryPlans[config.activeIndex].extents};
      gallery.classList.add('is-mouse-tracking');
    }
    const coordinate=mouseTrack.vertical?event.clientY+scrollY:event.clientX+scrollX;
    if(coordinate===mouseTrack.coordinate)return;
    mouseTrack.coordinate=coordinate;
    if(mouseFrame)return;
    mouseFrame=requestAnimationFrame(()=>{
      mouseFrame=0;
      const position=featuredPointerPosition(mouseTrack.extents,galleryGap,mouseTrack.coordinate-mouseTrack.start);
      paintGallery(position);
    });
  }
  gallery.addEventListener('pointerenter',updateMousePreview);
  gallery.addEventListener('pointermove',updateMousePreview);
  gallery.addEventListener('pointerleave',()=>{
    if(mouseTrack)selectPanel(config.activeIndex);
  });

  const badge=createBadge({root,intro,h1,ticket,ticketStage,config,fitText,fullHeroScale:fullIDScale});
  function render(){
    applyHeroLayout();
    featuredTitle.update(config);
    measureFeaturedHeading();
    for(const description of workDescriptions){
      const text=config[description.dataset.workDescription];
      if(description.textContent!==text)description.textContent=text;
    }
    renderText();
    renderGallery();
    badge.update();
    document.dispatchEvent(new CustomEvent('portfolio-appearance',{detail:{...config}}));
  }

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
  bindDotScrubber(dots,()=>dotButtons,dotIndicator,{
    preview:index=>selectPanel(index,{fromScrub:true}),
    commit:index=>{
      dotButtons[index].focus({preventScroll:true});
      commitDot(index);
    }
  });
  gallery.addEventListener('portfolio-featured-select',event=>{
    const i=panels.indexOf(event.target);if(i!==-1)selectPanel(i);
  });
  panels.forEach((panel,i)=>{
    const compactCaption=document.createElement('span');compactCaption.className='ds-compact-caption';compactCaption.setAttribute('aria-hidden','true');
    const compactTitle=document.createElement('strong');compactTitle.textContent=panel.querySelector('.rd-work-title').textContent;
    compactCaption.append(compactTitle);panel.append(compactCaption);
    panel.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button===0)selectPanel(i);
    });
    panel.addEventListener('focus',()=>selectPanel(i));
    panel.addEventListener('blur',()=>requestAnimationFrame(updateCaptions));
    panel.addEventListener('keydown',event=>{
      const next=keyIndex(event.key);if(next===null)return;
      event.preventDefault();selectPanel(next);panels[next].focus();
    });
  });

  let lastRootWidth=0;
  const resize=()=>{
    lastRootWidth=root.clientWidth;
    applyHeroLayout();fitText();renderGallery();badge.layout();
  };
  addEventListener('resize',resize);
  new ResizeObserver(()=>{if(root.clientWidth!==lastRootWidth)resize();}).observe(root);
  addEventListener('pagehide',event=>{if(event.persisted)return;headerObserver.disconnect();featuredHeadingObserver.disconnect();badge.destroy();featuredTitle.destroy();rotator?.destroy();currentAnimations.forEach(a=>a.cancel());});
  window.portfolioLanding=api;
  api.register({update(next){Object.assign(config,next);render();},replay});
  const restored=panels.findIndex(panel=>panel.classList.contains('is-active'));
  if(restored!==-1)selectPanel(restored);
  lastFit='';resize();document.documentElement.classList.remove('landing-loading');requestAnimationFrame(replay);
})();
