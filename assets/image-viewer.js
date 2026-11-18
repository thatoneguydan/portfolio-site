import {filledControlIcon} from './filled-controls.js?v=20261117-hierarchy3';
import {lockOverlayScroll,unlockOverlayScroll} from './overlay-scroll.js?v=20261117-hierarchy3';
let viewer,photo,stage,dots,prev,next,closeButton,items=[],index=0,focusBack,drag=null,closing=0,token=0;
const bound=new WeakSet(),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const icon=name=>filledControlIcon(name);
function create(){
  if(viewer)return;
  viewer=document.createElement('div');viewer.className='portfolio-lightbox portfolio-image-viewer';viewer.hidden=true;viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Image viewer');
  viewer.innerHTML=`<div class="portfolio-viewer-blur" aria-hidden="true"></div><button class="portfolio-lightbox__close" type="button" aria-label="Close image viewer">${icon('circle-x')}</button><button class="portfolio-lightbox__nav portfolio-lightbox__nav--prev" type="button" aria-label="Previous image">${icon('circle-arrow-left')}</button><figure class="portfolio-viewer-stage"><div class="portfolio-viewer-photo"><img class="portfolio-lightbox__image" alt="" draggable="false"></div><nav class="portfolio-viewer-dots" aria-label="Gallery images"></nav></figure><button class="portfolio-lightbox__nav portfolio-lightbox__nav--next" type="button" aria-label="Next image">${icon('circle-arrow-right')}</button>`;
  document.body.append(viewer);stage=viewer.querySelector('.portfolio-viewer-photo');photo=stage.querySelector('img');dots=viewer.querySelector('.portfolio-viewer-dots');prev=viewer.querySelector('.portfolio-lightbox__nav--prev');next=viewer.querySelector('.portfolio-lightbox__nav--next');closeButton=viewer.querySelector('.portfolio-lightbox__close');
  closeButton.addEventListener('click',close);prev.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));
  viewer.addEventListener('click',event=>{if(event.target===viewer||event.target.classList.contains('portfolio-viewer-blur'))close();});
  let scrubbing=false;
  const scrub=event=>{const buttons=[...dots.children];if(!buttons.length)return;const closest=buttons.reduce((best,b)=>Math.abs(b.getBoundingClientRect().left+b.offsetWidth/2-event.clientX)<Math.abs(best.getBoundingClientRect().left+best.offsetWidth/2-event.clientX)?b:best);show(Number(closest.dataset.index),true);};
  dots.addEventListener('pointerdown',event=>{scrubbing=true;dots.setPointerCapture(event.pointerId);scrub(event);});
  dots.addEventListener('pointermove',event=>{if(scrubbing)scrub(event);});dots.addEventListener('pointerup',()=>scrubbing=false);dots.addEventListener('pointercancel',()=>scrubbing=false);
  stage.addEventListener('pointerdown',event=>{if(event.button)return;drag={x:event.clientX,y:event.clientY,at:performance.now(),dx:0};stage.setPointerCapture(event.pointerId);});
  stage.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x;drag.dx=dx;const edge=(index===0&&dx>0)||(index===items.length-1&&dx<0);photo.style.transform=`translateX(${edge?dx*.22:dx}px)`;});
  const release=()=>{if(!drag)return;const {dx,at}=drag;drag=null;photo.style.transform='';if(Math.abs(dx)>Math.min(80,stage.clientWidth*.16)||(Math.abs(dx)>25&&performance.now()-at<220))show(index+(dx<0?1:-1));else bounce(dx*.2);};
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  document.addEventListener('keydown',event=>{
    if(viewer.hidden||event.target?.closest?.('#dan-owner-controls'))return;
    if(event.key==='Escape'){event.preventDefault();close();}
    else if(event.key==='ArrowLeft'){event.preventDefault();show(index-1);}
    else if(event.key==='ArrowRight'){event.preventDefault();show(index+1);}
    else if(event.key==='Tab'){const targets=[...viewer.querySelectorAll('button:not([hidden])')];let at=targets.indexOf(document.activeElement)+(event.shiftKey?-1:1);if(at<0)at=targets.length-1;if(at>=targets.length)at=0;event.preventDefault();targets[at]?.focus();}
  });
}
function bounce(offset){if(!reduced.matches)photo.animate([{transform:`translateX(${offset||20}px)`},{transform:'translateX(-3px)',offset:.55},{transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.75,.2,1)'});}
function geometry(){
  const item=items[index];if(!item||viewer.hidden)return;
  const style=getComputedStyle(viewer),number=key=>parseFloat(style[key])||0;
  const availableWidth=Math.max(1,viewer.clientWidth-number('paddingLeft')-number('paddingRight'));
  const availableHeight=Math.max(1,viewer.clientHeight-number('paddingTop')-number('paddingBottom'));
  const width=Math.min(availableWidth,availableHeight*item.ratio),height=width/item.ratio;
  stage.style.width=photo.style.width=width+'px';stage.style.height=photo.style.height=height+'px';
}
function show(at,scrub=false){
  if(at<0||at>=items.length){bounce(at<0?24:-24);return;}
  if(at===index&&photo.getAttribute('src'))return;
  const direction=at>index?1:-1;index=at;const current=++token,item=items[index];geometry();photo.src=item.preview;photo.alt=item.alt;
  if(!reduced.matches&&!scrub)photo.animate([{opacity:.25,transform:`translateX(${direction*32}px)`},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.2,.75,.2,1)'});
  prev.hidden=next.hidden=items.length<2;prev.setAttribute('aria-disabled',String(index===0));next.setAttribute('aria-disabled',String(index===items.length-1));
  [...dots.children].forEach((dot,i)=>{dot.classList.toggle('is-current',i===index);dot.setAttribute('aria-current',i===index?'true':'false');});
  const detailed=new Image();detailed.src=item.full;detailed.decode?.().catch(()=>{}).then(()=>{if(current===token&&!viewer.hidden)photo.src=item.full;});
}
function open(list,at,trigger){create();clearTimeout(closing);token++;items=list;index=-1;focusBack=trigger;photo.removeAttribute('src');dots.replaceChildren();
  list.forEach((_,i)=>{const button=document.createElement('button');button.type='button';button.dataset.index=i;button.setAttribute('aria-label',`Image ${i+1} of ${list.length}`);button.addEventListener('click',()=>show(i));dots.append(button);});
  dots.hidden=list.length<2;viewer.hidden=false;lockOverlayScroll(viewer);document.body.classList.add('lightbox-open');show(at);requestAnimationFrame(()=>viewer.classList.add('is-open'));closeButton.focus({preventScroll:true});
}
function close(){if(!viewer||viewer.hidden)return;token++;viewer.classList.remove('is-open');clearTimeout(closing);closing=setTimeout(()=>{viewer.hidden=true;photo.removeAttribute('src');document.body.classList.remove('lightbox-open');unlockOverlayScroll(viewer);focusBack?.focus?.({preventScroll:true});},reduced.matches?0:300);}
export function bindImageDocument(doc){
  if(bound.has(doc))return;bound.add(doc);
  doc.querySelectorAll('.portfolio-lightbox:not(.portfolio-image-viewer)').forEach(el=>el.remove());
  doc.addEventListener('click',event=>{const trigger=event.target.closest('[data-lightbox-src]');if(!trigger)return;event.preventDefault();event.stopImmediatePropagation();
    const triggers=[...doc.querySelectorAll('[data-lightbox-src]')],list=triggers.map(button=>{const image=button.querySelector('img'),candidates=(image?.getAttribute('srcset')||'').split(',').map(s=>s.trim().split(/\s+/)).filter(s=>Number(s[1]?.replace('w',''))<=1920);return{preview:image?.currentSrc||image?.src||button.dataset.lightboxSrc,full:candidates.at(-1)?.[0]||button.dataset.lightboxSrc,ratio:(image?.naturalWidth||image?.width||1)/(image?.naturalHeight||image?.height||1),alt:image?.alt||''};});
    open(list,Math.max(0,triggers.indexOf(trigger)),trigger);
  },true);
}
export function installImageViewer(){if(parent!==window&&new URLSearchParams(location.search).has('inlineShelf'))return;bindImageDocument(document);}
addEventListener('resize',geometry,{passive:true});
