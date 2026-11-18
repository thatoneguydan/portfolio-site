import {installAuthoredEmoji} from './site-emoji.js?v=20261117-navlab1';
import {setPaletteSaturation} from './palette-glyph.js?v=20261117-navlab1';
import {defaults} from './landing-schema.js?v=20261118-viewport1';
import {installSettledShelfText} from './settled-text.js';
import {captionBlurGeometry,captionShadeGradient} from './gallery-layout.js?v=20261117-navlab1';
import {installProjectPanels,applyProjectConfig} from './project-panels.js?v=20261118-viewport1';
import './site-runtime.js?v=20261118-viewport1';
import {installSiteInteractions} from './site-interactions.js?v=20261118-optical1';
import {installProjectViews} from './project-views.js?v=20261118-viewport1';
import {installImageViewer} from './image-viewer.js?v=20261117-navlab1';

const href='/assets/site-effects.css?v=20261118-optical1';
let stylesheet=document.querySelector('link[href^="/assets/site-effects.css"]');
if(!stylesheet){stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=href;document.head.append(stylesheet);}
if(!stylesheet.sheet)await new Promise(resolve=>{stylesheet.addEventListener('load',resolve,{once:true});stylesheet.addEventListener('error',resolve,{once:true});});
installAuthoredEmoji();installSettledShelfText();installSiteInteractions();installProjectPanels();installProjectViews();installImageViewer();
let config={...defaults,...window.portfolioLandingConfig};
setPaletteSaturation(config.paletteSaturation);
const insideShelf=window.parent!==window&&new URLSearchParams(location.search).get('inlineShelf')==='1';
const onLandingPage=!!document.getElementById('dan-landing-home');
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
  // Give each strip its own radius and clip its output after backdrop sampling.
  const bands=document.createDocumentFragment(),count=16,step=height/count;
  for(let index=1;index<=count;index++){
    const band=document.createElement('span');
    const start=step*(index-1),end=Math.min(height,step*(index+1));
    const radius=radiusAt(index/count),padding=Math.ceil(3*radius)+2;
    band.style.top=(start-padding)+'px';
    band.style.height=(end-start+2*padding)+'px';
    band.style.clipPath=`inset(${padding}px 0)`;
    const feather=`linear-gradient(to bottom,transparent ${padding}px,#000 ${padding+step}px)`;
    band.style.maskImage=band.style.webkitMaskImage=feather;
    band.style.backdropFilter=band.style.webkitBackdropFilter=`blur(${radius}px)`;
    bands.append(band);
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
      blurSurface.style.backdropFilter='url("#portfolio-depth-blur")';
    }
    document.body.append(pageBlur);
    new ResizeObserver(sizePageBlur).observe(blurSurface);
  }
  pageBlur.style.setProperty('--blur-height',config.pageBlurHeight);
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
function apply(card){
  innerShadow(card);
  const enabled=!!config.portfolioBlur;
  const visible=captionVisible(card);
  if(!card.matches('.ds-panel')){
    if(card.dataset.captionVisible!==String(visible))card.dataset.captionVisible=String(visible);
    const media=card.querySelector('.rdp-project-media');
    if(media&&!media.querySelector('.portfolio-caption-shade')){const shade=document.createElement('span');shade.className='portfolio-caption-shade';shade.setAttribute('aria-hidden','true');media.append(shade);}
  }
  if(card.classList.contains('has-progressive-blur')!==enabled)card.classList.toggle('has-progressive-blur',enabled);
  const active=String(enabled&&visible);if(card.dataset.blurActive!==active)card.dataset.blurActive=active;
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
  const height=geometry.percent;
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
    const image=layer.querySelector('img');if(source&&image&&image.style.filter!==source.style.filter)image.style.filter=source.style.filter;
  });
}
function ensure(card){
  if(!config.portfolioBlur||card.querySelector('.portfolio-blur'))return;
  if(!card.matches('.ds-panel')&&!card.querySelector('.rdp-project-meta'))return;
  const media=card.matches('.ds-panel')?card:card.querySelector('.rdp-project-media,.rv-video-thumb');
  const source=media?.querySelector('img:not([data-blur-copy])');if(!source)return;
  const blur=document.createElement('span');blur.className='portfolio-blur';blur.setAttribute('aria-hidden','true');
  // Filter only a copy of this thumbnail. The page outside its edge is never
  // sampled, and transparent filter fringes composite over the original image.
  for(let i=0;i<6;i++){
    const layer=document.createElement('span'),image=source.cloneNode(false);
    image.removeAttribute('id');image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=source.currentSrc||source.src;
    image.alt='';image.dataset.blurCopy='';image.classList.add('portfolio-blur-image');image.draggable=false;image.loading='eager';
    layer.append(image);blur.append(layer);
  }
  media.append(blur);apply(card);
  requestAnimationFrame(()=>requestAnimationFrame(()=>blur.classList.add('is-ready')));
}
function sync(card){if(!card.isConnected){cards.delete(card);cardResize.unobserve(card);return;}if(card.matches('.ds-panel')||captionVisible(card))ensure(card);apply(card);}
function discover(root){
  if(root.nodeType!==1||root.closest('.portfolio-blur'))return;
  const selector='.ds-panel,.rdp-project-card';
  const found=[...(root.matches(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const card of found){
    if(seen.has(card))continue;seen.add(card);cards.add(card);cardResize.observe(card);
    card.addEventListener('pointerenter',()=>sync(card),{passive:true});
    card.addEventListener('pointerleave',()=>sync(card),{passive:true});
    card.addEventListener('focusin',()=>sync(card));
    card.addEventListener('focusout',()=>requestAnimationFrame(()=>sync(card)));
    sync(card);
  }
}
discover(document.body);
const dirty=new Set();let pending=0;
function schedule(card){if(!card)return;dirty.add(card);if(!pending)pending=requestAnimationFrame(()=>{pending=0;for(const item of dirty)sync(item);dirty.clear();});}
new MutationObserver(records=>{
  for(const record of records){
    if(record.target.nodeType!==1||record.target.closest('.portfolio-blur'))continue;
    if(record.type==='childList')for(const node of record.addedNodes)discover(node);
    else if(!(record.attributeName==='style'&&record.target.matches('.rdp-project-card')))schedule(record.target.closest('.ds-panel,.rdp-project-card'));
  }
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-caption-visible','data-caption-kind','data-focused','class','style','src']});
function update(next){config={...defaults,...next};applyPageBlur();setPaletteSaturation(config.paletteSaturation);applyProjectConfig(config);for(const card of cards)sync(card);}
document.addEventListener('portfolio-appearance',event=>update(event.detail));
document.addEventListener('portfolio-caption-position',event=>schedule(event.target.closest('.rdp-project-card')));
addEventListener('resize',()=>{for(const card of cards)schedule(card);},{passive:true});
