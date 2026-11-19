import {defaults} from './landing-schema.js?v=20261119-carousel-colors1';
import {animateRotationEntries,rotationEntry} from './landing-rotate.js?v=20261119-carousel1';

function installLogoInkAlignment(){
  const bounds=new WeakMap(),cells=[...document.querySelectorAll('.site-logo')];
  function align(cell){
    const image=cell.querySelector('img'),label=cell.querySelector('.ds-nav-label');if(!image?.naturalWidth||!label)return;
    const src=image.currentSrc||image.src;
    let ink=bounds.get(image)?.src===src?bounds.get(image).ink:null;
    // The original artwork is content-addressed. These are its alpha > 24
    // bounds, calculated once from the unscaled 2655 by 606 PNG.
    if(!ink&&image.naturalWidth===2655&&image.naturalHeight===606&&
      new URL(src).pathname==='/assets/media/ac892c82fb108875fa5b331a6f0a9e8086fff50d681fa2d92f2e42ca5db03a70.png'){
      ink={x:6,y:5,w:2098,h:597};
    }
    if(!ink)try{
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,right=0,top=canvas.height,bottom=0;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      ink={x:left,y:top,w:right-left+1,h:bottom-top+1};
    }catch{cell.dataset.logoReady='true';return;}
    bounds.set(image,{src,ink});
    const compact=getComputedStyle(document.querySelector('.site-nav-toggle')||cell).display!=='none'&&innerWidth<=720;
    const crop={...ink,w:compact?ink.h:ink.w},available=compact?48:Math.min(205,Math.max(32,cell.clientWidth-48)),scale=Math.min(available/crop.w,48/crop.h);
    Object.assign(label.style,{display:'block',position:'relative',overflow:'hidden',width:crop.w*scale+'px',height:crop.h*scale+'px',flexBasis:'auto'});
    Object.assign(image.style,{position:'absolute',left:-crop.x*scale+'px',top:-crop.y*scale+'px',maxWidth:'none'});image.style.setProperty('width',image.naturalWidth*scale+'px','important');image.style.setProperty('height',image.naturalHeight*scale+'px','important');
    cell.style.justifyContent='center';cell.dataset.logoInkBounds=[ink.x,ink.y,ink.w,ink.h].join(',');cell.dataset.logoReady='true';
  }
  for(const cell of cells){cell.querySelector('img')?.addEventListener('load',()=>align(cell));align(cell);}
  addEventListener('resize',()=>cells.forEach(align),{passive:true});
}

// A desktop with a classic scrollbar can draw its thumb over the page.
// Touch and compact layouts keep their platform's native scrollbar.
function installPageScrollbar(){
  const root=document.documentElement,body=document.body;
  if(window.parent!==window&&new URLSearchParams(location.search).get('inlineShelf')==='1')return;
  const desktop=matchMedia('screen and (width > 720px) and (hover: hover) and (pointer: fine) and (forced-colors: none)');
  const timeline=CSS.supports('animation-timeline: scroll(root block)');
  let rail,thumb,scrollRange=0,thumbTravel=0,grab=null;

  function jump(y){window.scrollTo({top:y,behavior:'instant'});}
  function syncValue(){
    if(!rail||rail.hidden)return;
    const progress=scrollRange?Math.max(0,Math.min(1,window.scrollY/scrollRange)):0;
    const percent=String(Math.round(100*progress));
    if(rail.getAttribute('aria-valuenow')!==percent)rail.setAttribute('aria-valuenow',percent);
    if(!timeline)thumb.style.transform='translateY('+progress*thumbTravel+'px)';
  }
  function mount(){
    rail=document.createElement('div');rail.className='portfolio-scroll-rail';rail.tabIndex=0;
    rail.setAttribute('role','scrollbar');rail.setAttribute('aria-label','Scroll page');
    rail.setAttribute('aria-orientation','vertical');
    rail.setAttribute('aria-valuemin','0');rail.setAttribute('aria-valuemax','100');
    if(!body.id)body.id='portfolio-page';
    rail.setAttribute('aria-controls',body.id);rail.setAttribute('aria-valuenow','0');
    thumb=document.createElement('span');thumb.className='portfolio-scroll-thumb';
    rail.append(thumb);body.append(rail);

    rail.addEventListener('pointerdown',event=>{
      if(event.button!==0||!event.isPrimary||rail.hidden)return;
      event.preventDefault();
      rail.focus({preventScroll:true});
      const bounds=thumb.getBoundingClientRect();
      if(event.target===thumb||event.shiftKey){
        grab={id:event.pointerId,offset:event.shiftKey?bounds.height/2:event.clientY-bounds.top};
        rail.setPointerCapture(event.pointerId);
        if(event.shiftKey&&thumbTravel)jump((event.clientY-grab.offset)/thumbTravel*scrollRange);
      }else{
        jump(scrollY+(event.clientY<bounds.top?-1:1)*root.clientHeight*.9);
      }
    });
    rail.addEventListener('pointermove',event=>{
      if(grab?.id===event.pointerId&&thumbTravel&&!rail.hidden)jump((event.clientY-grab.offset)/thumbTravel*scrollRange);
    });
    const release=event=>{if(grab?.id===event.pointerId)grab=null;};
    rail.addEventListener('lostpointercapture',release);
    rail.addEventListener('pointerup',release);rail.addEventListener('pointercancel',release);
    rail.addEventListener('keydown',event=>{
      const page=root.clientHeight*.9;
      const destination={ArrowUp:scrollY-40,ArrowDown:scrollY+40,PageUp:scrollY-page,PageDown:scrollY+page,Home:0,End:scrollRange,' ':scrollY+(event.shiftKey?-page:page)}[event.key];
      if(destination!==undefined&&!event.altKey&&!event.metaKey&&!event.ctrlKey){event.preventDefault();jump(destination);}
    });
    addEventListener('scroll',syncValue,{passive:true});
    addEventListener('resize',measure,{passive:true});
    const size=new ResizeObserver(measure);
    size.observe(root);size.observe(body);
    // The shared modal lock changes the root overflow without changing its size.
    let overflow=root.style.overflowY;
    new MutationObserver(()=>{
      const next=root.style.overflowY;
      if(overflow===next)return;
      overflow=next;measure();
    }).observe(root,{attributes:true,attributeFilter:['style']});
  }
  function measure(){
    if(!rail||!root.hasAttribute('data-page-scroll-rail'))return;
    const height=root.clientHeight,total=root.scrollHeight;
    scrollRange=Math.max(0,total-height);
    rail.hidden=!scrollRange||['hidden','clip'].includes(getComputedStyle(root).overflowY);
    if(rail.hidden){grab=null;return;}
    const thumbHeight=Math.min(height,Math.max(28,height*height/total));
    thumbTravel=height-thumbHeight;
    rail.style.setProperty('--thumb-height',thumbHeight+'px');
    rail.style.setProperty('--thumb-travel',thumbTravel+'px');
    syncValue();
  }
  function refreshMode(){
    let gutter=0;
    if(desktop.matches){
      // The mobile viewport can change independently of the document width.
      // Measure a real classic scrollbar inside a fixed, out-of-flow box.
      const probe=document.createElement('div');
      probe.className='portfolio-scroll-probe';
      body.append(probe);
      gutter=probe.offsetWidth-probe.clientWidth;
      probe.remove();
    }
    if(gutter>0){
      if(!rail)mount();
      root.style.setProperty('--page-rail-space',gutter+'px');
      root.dataset.pageScrollRail='';
      measure();
    }else if(rail){
      delete root.dataset.pageScrollRail;
      root.style.removeProperty('--page-rail-space');
      rail.hidden=true;
      grab=null;
    }
  }
  desktop.addEventListener('change',refreshMode);refreshMode();
}

function installPillLabelHover(reduced){
  const pills='.ds-contact,.rd-footer-cta-button,.portfolio-button';
  const interval=2000;
  let active=null;

  function labelFor(button){
    const existing=button.querySelector(':scope > .portfolio-pill-label');
    if(existing)return existing;
    const nodes=[...button.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim());
    if(!nodes.length)return null;
    const label=document.createElement('span');label.className='portfolio-pill-label';
    const copy=document.createElement('span');copy.className='portfolio-pill-copy';
    nodes[0].before(label);copy.append(...nodes);label.append(copy);
    return label;
  }

  function stop(){
    if(!active)return;
    clearTimeout(active.timer);active.finish?.();active=null;
  }

  function cycle(state){
    const {button,label}=state;
    if(!label.isConnected||button.matches(':disabled,[aria-disabled="true"]')){stop();return;}
    const {rotateSplit=defaults.rotateSplit,rotateDuration=defaults.rotateDuration,rotateStagger=defaults.rotateStagger,
      rotateFrom=defaults.rotateFrom}=window.portfolioLandingConfig||defaults;
    const text=label.firstElementChild.textContent.trim().replace(/\s+/g,' ');
    const before=rotationEntry(text,rotateSplit),after=rotationEntry(text,rotateSplit);
    const clip=document.createElement('span');clip.className='ds-rotate-clip';clip.setAttribute('aria-hidden','true');
    clip.append(before,after);label.append(clip);label.dataset.cycling='true';
    // Keep the spring and its stagger within one repeat even at the longest Tune timings.
    const count=after.querySelectorAll('.ds-rotate-piece').length;
    const stagger=Math.max(0,(interval-80-rotateDuration*1.14)/Math.max(1,count-1));
    const animations=animateRotationEntries(before,after,{rotateDuration,rotateFrom,rotateStagger:Math.min(rotateStagger,stagger)});
    const finish=()=>{
      if(state.finish!==finish)return;
      state.finish=null;animations.forEach(animation=>animation.cancel());clip.remove();delete label.dataset.cycling;
    };
    state.finish=finish;
    Promise.allSettled(animations.map(animation=>animation.finished)).then(finish);
    state.timer=setTimeout(()=>{state.finish?.();cycle(state);},interval);
  }

  document.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch'||reduced.matches||document.hidden)return;
    const button=event.target.closest?.(pills);
    if(!button||button.contains(event.relatedTarget)||button.matches(':disabled,[aria-disabled="true"]'))return;
    const label=labelFor(button);if(!label)return;
    stop();active={button,label};cycle(active);
  },{passive:true});
  document.addEventListener('pointerout',event=>{
    if(active?.button.contains(event.target)&&!active.button.contains(event.relatedTarget))stop();
  },{passive:true});
  addEventListener('pagehide',stop);addEventListener('blur',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',stop);
}

export function installSiteInteractions(){
  if(window.__portfolioInteractions)return;window.__portfolioInteractions=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motions=new WeakMap(),pressed=new Map();
  const navControls='.site-logo,.site-nav a,.site-nav-toggle';
  for(const cell of document.querySelectorAll('.site-logo,.site-nav a')){
    if(cell.querySelector('.ds-nav-label'))continue;
    const label=document.createElement('span');label.className='ds-nav-label';label.append(...cell.childNodes);cell.append(label);
    const shadow=document.createElement('span');shadow.className='ds-nav-shadow';shadow.setAttribute('aria-hidden','true');cell.append(shadow);
  }
  installLogoInkAlignment();
  function targetFor(node){
    const button=node.closest?.('button,a,[role="button"]');
    if(!button||button.matches(':disabled,[aria-disabled="true"],.ds-badge-activate,.ds-badge-drag-plane'))return null;
    if(button.matches(navControls))return button;
    const box=button.getBoundingClientRect(),radius=parseFloat(getComputedStyle(button).borderTopLeftRadius);
    return box.width>box.height*1.25&&radius>=box.height*.42?button:null;
  }
  function animate(target,down){
    if(!target)return;
    if(target.matches(navControls)){
      target.classList.toggle('is-nav-pressed',down);
      return;
    }
    if(reduced.matches)return;
    const value=getComputedStyle(target).scale,current=value==='none'?1:parseFloat(value)||1;
    motions.get(target)?.cancel();
    const frames=down?[{scale:current},{scale:.955}]:[{scale:current},{scale:1.018,offset:.62},{scale:1}];
    const animation=target.animate(frames,{duration:down?110:470,easing:down?'ease-out':'cubic-bezier(.2,.75,.25,1)',fill:down?'forwards':'none'});
    motions.set(target,animation);animation.finished.catch(()=>{}).then(()=>{if(!down&&motions.get(target)===animation){animation.cancel();motions.delete(target);}});
  }
  document.addEventListener('pointerdown',event=>{if(event.button!==0)return;const target=targetFor(event.target);if(target){pressed.set(event.pointerId,target);animate(target,true);}},{capture:true});
  const release=event=>{const target=pressed.get(event.pointerId);if(target){pressed.delete(event.pointerId);animate(target,false);}};
  document.addEventListener('pointerup',release,{capture:true});document.addEventListener('pointercancel',release,{capture:true});
  const clearPressed=()=>{
    for(const target of pressed.values())animate(target,false);
    pressed.clear();
    document.querySelectorAll('.is-nav-pressed').forEach(target=>target.classList.remove('is-nav-pressed'));
  };
  addEventListener('blur',clearPressed);
  addEventListener('pagehide',clearPressed);
  document.addEventListener('keydown',event=>{
    if(event.repeat||!['Enter',' '].includes(event.key)||event.target.matches('input,textarea,select'))return;
    const target=targetFor(event.target);
    if(event.key===' '&&target?.matches('a:is(.site-logo,.site-nav a)'))return;
    animate(target,true);
  },{capture:true});
  document.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key))animate(targetFor(event.target),false);},{capture:true});

  installPageScrollbar();installPillLabelHover(reduced);
}
