import {installAuthoredEmoji} from './site-emoji.js?v=20261117-site8';
import {setPaletteSaturation} from './palette-glyph.js?v=20261117-site8';
import {defaults} from './landing-schema.js?v=20261117-site8';
import {installSettledShelfText} from './settled-text.js';
import {captionBlurGeometry} from './gallery-layout.js?v=20261117-site8';
import './site-runtime.js?v=20261117-site8';
import {installSiteInteractions} from './site-interactions.js?v=20261117-site8';

const href='/assets/site-effects.css?v=20261117-site8';
let stylesheet=document.querySelector('link[href^="/assets/site-effects.css"]');
if(!stylesheet){stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=href;document.head.append(stylesheet);}
if(!stylesheet.sheet)await new Promise(resolve=>{stylesheet.addEventListener('load',resolve,{once:true});stylesheet.addEventListener('error',resolve,{once:true});});
installAuthoredEmoji();installSettledShelfText();installSiteInteractions();
let config={...defaults,...window.portfolioLandingConfig};
setPaletteSaturation(config.paletteSaturation);
const cards=new Set(),seen=new WeakSet();
const cardResize=new ResizeObserver(entries=>{for(const {target}of entries)schedule(target);});
function captionVisible(card){
  if(card.matches('.ds-panel'))return card.dataset.captionVisible==='true';
  return !!card.querySelector('.rdp-project-meta')&&card.matches(':hover,:focus-visible');
}
function apply(card){
  const enabled=!!config.portfolioBlur;
  if(card.classList.contains('has-progressive-blur')!==enabled)card.classList.toggle('has-progressive-blur',enabled);
  const active=String(enabled&&captionVisible(card));if(card.dataset.blurActive!==active)card.dataset.blurActive=active;
  const blur=card.querySelector('.portfolio-blur');if(!blur)return;
  const source=card.querySelector('img:not([data-blur-copy])');
  const caption=card.querySelector(card.dataset.captionKind==='compact'?'.ds-compact-caption':'.ds-caption,.rdp-project-meta');
  const text=caption?.querySelector('strong')||caption,style=text&&getComputedStyle(text),captionStyle=caption&&getComputedStyle(caption);
  const geometry=captionBlurGeometry({height:card.clientHeight,captionHeight:caption?.offsetHeight||0,bottom:parseFloat(captionStyle?.bottom)||0,fontSize:parseFloat(style?.fontSize)||20,coverage:config.portfolioBlurHeight,strength:config.portfolioBlurStrength,compact:card.dataset.captionKind==='compact'});
  const height=geometry.percent;
  for(const [key,value]of [['--caption-solid-height',geometry.solid+'px'],['--caption-cover-height',geometry.cover+'px']])if(card.style.getPropertyValue(key)!==value)card.style.setProperty(key,value);
  blur.style.setProperty('--blur-duration',config.portfolioBlurDuration+'ms');
  [...blur.children].forEach((layer,i)=>{
    layer.style.setProperty('--layer-blur',geometry.strength*(i+1)/6+'px');
    const stops=[i,i+1,i+2,i+3].map((n,j)=>'rgba(255,255,255,'+(j===1||j===2?1:0)+') '+(100-height+n/7*height)+'%');
    const mask='linear-gradient(180deg,'+stops.join(',')+')';layer.style.maskImage=mask;layer.style.webkitMaskImage=mask;
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
    else schedule(record.target.closest('.ds-panel,.rdp-project-card'));
  }
}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-caption-visible','data-caption-kind','data-focused','class','style','src']});
function update(next){config={...defaults,...next};setPaletteSaturation(config.paletteSaturation);for(const card of cards)sync(card);}
document.addEventListener('portfolio-appearance',event=>update(event.detail));
addEventListener('resize',()=>{for(const card of cards)schedule(card);},{passive:true});
if(!document.getElementById('dan-landing-home'))fetch('/api/landing-settings',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.config)update(data.config);}).catch(()=>{});
