import {installAuthoredEmoji} from './site-emoji.js?v=20261118-perf1';
import {setPaletteSaturation} from './palette-glyph.js?v=20261117-navlab1';
import {defaults} from './landing-schema.js?v=20261118-worklinks2';
import {installSettledShelfText} from './settled-text.js';
import {captionBlurGeometry,captionShadeGradient} from './gallery-layout.js?v=20261118-worklinks2';
import {installProjectPanels,applyProjectConfig} from './project-panels.js?v=20261118-worklinks2';
import './site-runtime.js?v=20261118-worklinks2';
import {installSiteInteractions} from './site-interactions.js?v=20261118-perf1';
import {installProjectViews} from './project-views.js?v=20261118-worklinks2';
import {installImageViewer} from './image-viewer.js?v=20261118-hero3';

const href='/assets/site-effects.css?v=20261118-hero3';
let stylesheet=document.querySelector('link[href^="/assets/site-effects.css"]');
if(!stylesheet){stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=href;document.head.append(stylesheet);}
if(!stylesheet.sheet)await new Promise(resolve=>{stylesheet.addEventListener('load',resolve,{once:true});stylesheet.addEventListener('error',resolve,{once:true});});
installAuthoredEmoji();installSettledShelfText();installSiteInteractions();installProjectPanels();installProjectViews();installImageViewer();
let config={...defaults,...window.portfolioLandingConfig};
setPaletteSaturation(config.paletteSaturation);
const insideShelf=window.parent!==window&&new URLSearchParams(location.search).get('inlineShelf')==='1';
const onLandingPage=!!document.getElementById('dan-landing-home');
const pageContent=document.querySelector('.portfolio-page-content');
function radiusAt(depth){
  const power=config.pageBlurFalloff==='bottom' ? 2.4 : config.pageBlurFalloff==='broad' ? .65 : 1;
  return config.pageBlurStrength*(depth*depth*(3-2*depth))**power;
}

function svgNode(name,attributes){
  const node=document.createElementNS('http://www.w3.org/2000/svg',name);
  for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
  return node;
}

// All levels read the same live backdrop. The ramp chooses neighboring Gaussian
// radii at each depth, so sharp details disappear earlier than broad features.
const depthRamp='data:image/svg+xml,'+encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 256" preserveAspectRatio="none">'+
  '<linearGradient id="a" x2="0" y2="1"><stop stop-opacity="0"/><stop offset="1"/></linearGradient>'+
  '<rect width="1" height="256" fill="url(#a)"/></svg>');

function drawBackdropFilter(filter,width,height){
  const region={x:0,y:0,width,height};
  filter.setAttribute('width',width);
  filter.setAttribute('height',height);
  const nodes=document.createDocumentFragment();
  nodes.append(svgNode('feImage',{...region,href:depthRamp,preserveAspectRatio:'none',result:'depth'}));
  const levels=8;
  let previous='SourceGraphic';
  for(let i=1;i<=levels;i++){
    const weight=svgNode('feComponentTransfer',{...region,in:'depth',result:'weight'});
    weight.append(svgNode('feFuncA',{type:'linear',slope:levels,intercept:1-i}));
    const level=svgNode('feGaussianBlur',{...region,in:'SourceGraphic',stdDeviation:radiusAt(i/levels),edgeMode:'duplicate',result:'level'});
    const masked=svgNode('feComposite',{...region,in:'level',in2:'weight',operator:'in',result:'weighted'});
    nodes.append(weight,level,masked,svgNode('feComposite',{...region,in:'weighted',in2:previous,operator:'over',result:'mix'+i}));
    previous='mix'+i;
  }
  filter.replaceChildren(nodes);
}

function drawBackdropBands(surface,height){
  // Other engines can parse an SVG backdrop reference without painting it.
  // Native backdrop blurs compose in order. Gaussian variances add, so each
  // level contributes only the increase in variance from the preceding level.
  const bands=document.createDocumentFragment(),count=12,step=height/count;
  let variance=0;
  for(let index=1;index<=count;index++){
    const band=document.createElement('span');
    const next=radiusAt(index/count)**2,radius=Math.sqrt(next-variance);
    const padding=Math.ceil(3*radius)+2,start=step*(index-1),top=start-padding;
    band.style.top=top+'px';
    band.style.bottom='0';
    const feather=`linear-gradient(to bottom,transparent ${padding}px,#000 ${padding+step}px)`;
    band.style.maskImage=band.style.webkitMaskImage=feather;
    band.style.backdropFilter=band.style.webkitBackdropFilter=`blur(${radius}px)`;
    bands.append(band);
    variance=next;
  }
  surface.replaceChildren(bands);
}

let pageBlur,blurSurface,blurFilter,filterGeometry='';
function sizePageBlur(){
  if(!pageBlur?.classList.contains('is-enabled'))return;
  const {width,height}=blurSurface.getBoundingClientRect();
  const geometry=[width,height,config.pageBlurStrength,config.pageBlurFalloff].join('/');
  if(!width||!height||geometry===filterGeometry)return;
  filterGeometry=geometry;
  if(blurFilter)drawBackdropFilter(blurFilter,width,height);
  else drawBackdropBands(blurSurface,height);
}

function applyPageBlur(){
  if(insideShelf)return;
  const enabled=(onLandingPage?config.pageBlurHome:config.pageBlurOther)&&config.pageBlurStrength>0;
  if(!pageBlur){
    if(!enabled)return;
    pageBlur=document.createElement('div');
    pageBlur.className='portfolio-page-blur';
    pageBlur.setAttribute('aria-hidden','true');
    blurSurface=document.createElement('div');
    blurSurface.className='portfolio-page-blur__surface';
    pageBlur.append(blurSurface);
    if(/(?:Chrome|Chromium)\//.test(navigator.userAgent)&&CSS.supports('backdrop-filter','url("#filter")')){
      const definitions=svgNode('svg',{width:0,height:0,'aria-hidden':'true',focusable:'false'});
      const defs=svgNode('defs',{});
      blurFilter=svgNode('filter',{id:'portfolio-depth-blur',x:0,y:0,filterUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'});
      defs.append(blurFilter);
      definitions.append(defs);
      pageBlur.append(definitions);
      // Capture the isolated page first. Run the custom graph on this finite
      // image, so partial backdrop updates never crop the blur's sampling area.
      blurSurface.style.backdropFilter='opacity(1)';
      blurSurface.style.filter='url("#portfolio-depth-blur")';
    }
    (pageContent || document.body).append(pageBlur);
    new ResizeObserver(sizePageBlur).observe(blurSurface);
  }
  pageBlur.style.setProperty('--blur-height',config.pageBlurHeight);
  pageContent?.classList.toggle('has-page-blur',enabled);
  pageBlur.classList.toggle('is-enabled',enabled);
  sizePageBlur();
}
applyPageBlur();
applyProjectConfig(config);
const cards=new Set(),seen=new WeakSet();
const cardResize=new ResizeObserver(entries=>{for(const {target}of entries)schedule(target);});
function captionVisible(card){
  if(card.matches('.ds-panel'))return card.dataset.captionVisible==='true';
  return !!card.querySelector('.rdp-project-meta')&&(card.matches(':hover,:focus-visible')||matchMedia('(hover:none)').matches);
}
function innerShadow(card){
  const design=!!card.closest('.discipline-design')||(card.matches('.ds-panel')&&/^DESIGN\b/i.test(card.querySelector('small')?.textContent.trim()||''));
  const media=card.matches('.ds-panel')?card:card.querySelector('.rdp-project-media');if(!design||!media)return;
  let layer=media.querySelector(':scope > .portfolio-thumbnail-shadow');
  if(!layer){layer=document.createElement('span');layer.className='portfolio-thumbnail-shadow';layer.setAttribute('aria-hidden','true');media.append(layer);}
  layer.hidden=!config.designInnerShadow;
  const angle=config.designShadowAngle*Math.PI/180,x=-Math.cos(angle)*config.designShadowDistance,y=Math.sin(angle)*config.designShadowDistance;
  const rgb=config.designShadowColor.match(/\w\w/g).map(n=>parseInt(n,16));
  layer.style.boxShadow=`inset ${x}px ${y}px ${config.designShadowSize}px ${config.designShadowSize*config.designShadowChoke/100}px rgba(${rgb.join(',')},${config.designShadowOpacity/100})`;
  layer.style.mixBlendMode=config.designShadowBlend;
}
const shadowSettings=new WeakMap();
const lastPaint=new WeakMap();
function prepareCard(card){
  if(!card.isConnected){cards.delete(card);cardResize.unobserve(card);proximity?.unobserve(card);return;}
  if(shadowSettings.get(card)!==config){innerShadow(card);shadowSettings.set(card,config);}
  const enabled=!!config.portfolioBlur;
  const visible=captionVisible(card);
  if(!card.matches('.ds-panel')){
    if(card.dataset.captionVisible!==String(visible))card.dataset.captionVisible=String(visible);
    const media=card.querySelector('.rdp-project-media');
    if(media&&!media.querySelector('.portfolio-caption-shade')){const shade=document.createElement('span');shade.className='portfolio-caption-shade';shade.setAttribute('aria-hidden','true');media.append(shade);}
  }
  if(card.classList.contains('has-progressive-blur')!==enabled)card.classList.toggle('has-progressive-blur',enabled);
  const active=String(enabled&&visible);if(card.dataset.blurActive!==active)card.dataset.blurActive=active;
  if(card.matches('.ds-panel')||visible)ensure(card);
}
function measureCaption(card){
  if(!card.isConnected)return;
  const blur=card.querySelector('.portfolio-blur');
  const source=card.querySelector('img:not([data-blur-copy])');
  const caption=card.querySelector(card.dataset.captionKind==='compact'?'.ds-compact-caption':'.ds-caption,.rdp-project-meta');
  if(!caption)return;
  const text=caption.querySelector('strong,.rdp-project-title')||caption,style=getComputedStyle(text);
  const plane=(card.querySelector('.rdp-masonry-face')||card).getBoundingClientRect();
  const bounds=[...caption.children].map(el=>el.getBoundingClientRect()).filter(r=>r.height>0);
  const top=bounds.length?Math.min(...bounds.map(r=>r.top)):plane.bottom;
  const bottom=bounds.length?Math.max(...bounds.map(r=>r.bottom)):plane.bottom,lift=Number.parseFloat(card.style.getPropertyValue('--project-caption-lift'))||0;
  const geometry=captionBlurGeometry({height:card.clientHeight,captionHeight:Math.max(0,bottom-top),bottom:Math.max(0,plane.bottom-lift-bottom),fontSize:parseFloat(style.fontSize)||20,coverage:config.portfolioBlurHeight,strength:config.portfolioBlurStrength,compact:card.dataset.captionKind==='compact'});
  return {card,blur,filter:source?.style.filter||'',geometry,lift};
}
function paintCaption({card,blur,filter,geometry,lift}){
  const signature=[geometry.solid,geometry.cover,geometry.shadeCover,geometry.strength,lift,filter,config.portfolioBlurDuration].join('/');
  const last=lastPaint.get(card);
  if(last?.signature===signature&&last.blur===blur)return;
  lastPaint.set(card,{signature,blur});
  for(const [key,value]of [['--caption-solid-height',geometry.solid+'px'],['--caption-cover-height',geometry.cover+'px']])if(card.style.getPropertyValue(key)!==value)card.style.setProperty(key,value);
  // The shade always reaches the image edge. Lifting text must never expose
  // the opaque lower edge of a translated background plane.
  const shade=captionShadeGradient({...geometry,solid:geometry.solid+lift,shadeCover:geometry.shadeCover+lift});if(card.style.getPropertyValue('--caption-shade')!==shade)card.style.setProperty('--caption-shade',shade);
  if(!blur)return;
  blur.style.setProperty('--blur-duration',config.portfolioBlurDuration+'ms');
  [...blur.children].forEach((layer,i)=>{
    layer.style.setProperty('--layer-blur',geometry.strength*(i+1)/6+'px');
    const full=geometry.solid*Math.max(.25,1-i*.1)+lift;
    const mask=`linear-gradient(to top,#000 0px,#000 ${full}px,transparent ${geometry.cover+lift}px)`;layer.style.maskImage=mask;layer.style.webkitMaskImage=mask;
    const image=layer.querySelector('img');if(image&&image.style.filter!==filter)image.style.filter=filter;
  });
}
const nearCards=new WeakSet();
const proximity=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries){
    if(isIntersecting){nearCards.add(target);schedule(target);}else nearCards.delete(target);
  }
},{rootMargin:'800px 0px'}):null;
function ensure(card){
  if(!config.portfolioBlur)return;
  if(!card.matches('.ds-panel')&&!card.querySelector('.rdp-project-meta'))return;
  const media=card.matches('.ds-panel')?card:card.querySelector('.rdp-project-media,.rv-video-thumb');
  const source=media?.querySelector('img:not([data-blur-copy])');if(!source)return;
  // The original image owns loading, srcset selection and decoding. A decorative
  // copy must never start a fallback download ahead of the responsive source.
  const url=source.currentSrc;
  if(!url||!source.complete||!source.naturalWidth)return;
  const existing=media.querySelector('.portfolio-blur');
  if(existing){
    if(existing.dataset.source!==url){
      for(const image of existing.querySelectorAll('img'))image.src=url;
      existing.dataset.source=url;
    }
    return;
  }
  if(proximity&&!nearCards.has(card)&&!card.matches(':hover,:focus-within'))return;
  const blur=document.createElement('span');blur.className='portfolio-blur';blur.setAttribute('aria-hidden','true');
  blur.dataset.source=url;
  // Filter only a copy of this thumbnail. The page outside its edge is never
  // sampled, and transparent filter fringes composite over the original image.
  for(let i=0;i<6;i++){
    const layer=document.createElement('span'),image=document.createElement('img');
    image.className=source.className;image.alt='';image.dataset.blurCopy='';image.classList.add('portfolio-blur-image');image.draggable=false;image.decoding='async';image.src=url;
    layer.append(image);blur.append(layer);
  }
  media.append(blur);
  requestAnimationFrame(()=>requestAnimationFrame(()=>blur.classList.add('is-ready')));
}
function sync(batch){
  for(const card of batch)prepareCard(card);
  // Take one layout snapshot for the whole row before updating any masks.
  const measures=[];
  for(const card of batch){const result=measureCaption(card);if(result)measures.push(result);}
  for(const measure of measures)paintCaption(measure);
}
const dirty=new Set();let pending=0;
function schedule(card){
  if(!card)return;
  dirty.add(card);
  if(!pending)pending=requestAnimationFrame(()=>{
    pending=0;const batch=[...dirty];dirty.clear();sync(batch);
  });
}
function discover(root){
  if(root.nodeType!==1||root.closest('.portfolio-blur'))return;
  const selector='.ds-panel,.rdp-project-card';
  const found=[...(root.matches(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const card of found){
    if(seen.has(card))continue;seen.add(card);cards.add(card);cardResize.observe(card);proximity?.observe(card);
    card.querySelector('img:not([data-blur-copy])')?.addEventListener('load',()=>schedule(card));
    card.addEventListener('pointerenter',()=>schedule(card),{passive:true});
    card.addEventListener('pointerleave',()=>schedule(card),{passive:true});
    card.addEventListener('focusin',()=>schedule(card));
    card.addEventListener('focusout',()=>schedule(card));
    schedule(card);
  }
}
discover(document.body);
new MutationObserver(records=>{
  for(const record of records){
    if(record.target.nodeType!==1||record.target.closest('.portfolio-blur'))continue;
    if(record.type==='childList')for(const node of record.addedNodes)discover(node);
    else if(!(record.attributeName==='style'&&record.target.matches('.rdp-project-card')))schedule(record.target.closest('.ds-panel,.rdp-project-card'));
  }
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-caption-visible','data-caption-kind','data-focused','class','style','src']});
function update(next){config={...defaults,...next};applyPageBlur();setPaletteSaturation(config.paletteSaturation);applyProjectConfig(config);for(const card of cards)schedule(card);}
document.addEventListener('portfolio-appearance',event=>update(event.detail));
document.addEventListener('portfolio-caption-position',event=>schedule(event.target.closest('.rdp-project-card')));
addEventListener('resize',()=>{for(const card of cards)schedule(card);},{passive:true});
