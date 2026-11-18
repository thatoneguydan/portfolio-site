function installLogoInkAlignment(){
  const bounds=new WeakMap(),cells=[...document.querySelectorAll('.site-logo')];
  function align(cell){
    const image=cell.querySelector('img'),label=cell.querySelector('.ds-nav-label');if(!image?.naturalWidth||!label)return;
    let ink=bounds.get(image);
    if(!ink)try{
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,right=0,top=canvas.height,bottom=0;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      ink={x:left,y:top,w:right-left+1,h:bottom-top+1};bounds.set(image,ink);
    }catch{cell.dataset.logoReady='true';return;}
    const compact=getComputedStyle(document.querySelector('.site-nav-toggle')||cell).display!=='none'&&innerWidth<=720;
    const crop={...ink,w:compact?ink.h:ink.w},available=compact?48:Math.min(205,Math.max(32,cell.clientWidth-48)),scale=Math.min(available/crop.w,48/crop.h);
    Object.assign(label.style,{display:'block',position:'relative',overflow:'hidden',width:crop.w*scale+'px',height:crop.h*scale+'px',flexBasis:'auto'});
    Object.assign(image.style,{position:'absolute',left:-crop.x*scale+'px',top:-crop.y*scale+'px',maxWidth:'none'});image.style.setProperty('width',image.naturalWidth*scale+'px','important');image.style.setProperty('height',image.naturalHeight*scale+'px','important');
    cell.style.justifyContent='center';cell.dataset.logoInkBounds=[ink.x,ink.y,ink.w,ink.h].join(',');cell.dataset.logoReady='true';
  }
  for(const cell of cells){cell.querySelector('img')?.addEventListener('load',()=>align(cell));align(cell);}
  addEventListener('resize',()=>cells.forEach(align),{passive:true});
}

// Keep window as the sole scroll owner. On systems with a classic gutter, put
// the thumb over the page so imagery, the footer and the blur continue behind it.
function installPageScrollbar(){
  const root=document.documentElement,body=document.body;
  const embedded=window.parent!==window&&new URLSearchParams(location.search).get('inlineShelf')==='1';
  const nativeOnly=matchMedia('(forced-colors: active), print');
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
  function mount(gutter){
    root.style.setProperty('--page-rail-space',gutter+'px');
    root.dataset.pageScrollRail='';
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
    // The shared modal lock changes the root overflow without changing its size.
    let overflow=root.style.overflowY;
    new MutationObserver(()=>{
      if(overflow===root.style.overflowY)return;
      overflow=root.style.overflowY;measure();
    }).observe(root,{attributes:true,attributeFilter:['style']});
  }
  function measure(){
    const gutter=innerWidth-root.clientWidth;
    if(!rail&&!embedded&&!nativeOnly.matches&&gutter>0)mount(gutter);
    const width=root.clientWidth+'px';
    if(root.style.getPropertyValue('--site-viewport-width')!==width)root.style.setProperty('--site-viewport-width',width);
    if(!rail)return;
    const height=root.clientHeight,total=root.scrollHeight;
    scrollRange=Math.max(0,total-height);
    rail.hidden=!scrollRange||nativeOnly.matches||['hidden','clip'].includes(getComputedStyle(root).overflowY);
    if(rail.hidden){grab=null;return;}
    const thumbHeight=Math.min(height,Math.max(28,height*height/total));
    thumbTravel=height-thumbHeight;
    rail.style.setProperty('--thumb-height',thumbHeight+'px');
    rail.style.setProperty('--thumb-travel',thumbTravel+'px');
    syncValue();
  }
  const size=new ResizeObserver(measure);
  size.observe(root);size.observe(body);
  addEventListener('resize',measure,{passive:true});
  nativeOnly.addEventListener('change',measure);measure();
}
export function installSiteInteractions(){
  if(window.__portfolioInteractions)return;window.__portfolioInteractions=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motions=new WeakMap(),pressed=new Map();
  for(const cell of document.querySelectorAll('.site-logo,.site-nav a')){
    if(cell.querySelector('.ds-nav-label'))continue;
    const label=document.createElement('span');label.className='ds-nav-label';label.append(...cell.childNodes);cell.append(label);
    const shadow=document.createElement('span');shadow.className='ds-nav-shadow';shadow.setAttribute('aria-hidden','true');cell.append(shadow);
  }
  installLogoInkAlignment();
  function targetFor(node){
    const button=node.closest?.('button,a,[role="button"]');
    if(!button||button.matches(':disabled,[aria-disabled="true"],.ds-badge-activate,.ds-badge-drag-plane'))return null;
    const nav=button.matches('.site-logo,.site-nav a');if(nav)return button.querySelector('.ds-nav-label');
    const box=button.getBoundingClientRect(),radius=parseFloat(getComputedStyle(button).borderTopLeftRadius);
    return box.width>box.height*1.25&&radius>=box.height*.42?button:null;
  }
  function animate(target,down){
    if(!target||reduced.matches)return;
    const value=getComputedStyle(target).scale,current=value==='none'?1:parseFloat(value)||1;
    motions.get(target)?.cancel();
    const nav=target.classList.contains('ds-nav-label');
    const frames=down?[{scale:current},{scale:nav ? .82 : .955}]:[{scale:current},{scale:nav ? 1.055 : 1.018,offset:.62},{scale:1}];
    const animation=target.animate(frames,{duration:down?110:470,easing:down?'ease-out':'cubic-bezier(.2,.75,.25,1)',fill:down?'forwards':'none'});
    motions.set(target,animation);animation.finished.catch(()=>{}).then(()=>{if(!down&&motions.get(target)===animation){animation.cancel();motions.delete(target);}});
  }
  document.addEventListener('pointerdown',event=>{if(event.button!==0)return;const target=targetFor(event.target);if(target){pressed.set(event.pointerId,target);animate(target,true);}},{capture:true});
  const release=event=>{const target=pressed.get(event.pointerId);if(target){pressed.delete(event.pointerId);animate(target,false);}};
  document.addEventListener('pointerup',release,{capture:true});document.addEventListener('pointercancel',release,{capture:true});
  addEventListener('blur',()=>{for(const target of pressed.values())animate(target,false);pressed.clear();});
  document.addEventListener('keydown',event=>{if(!event.repeat&&['Enter',' '].includes(event.key)&&!event.target.matches('input,textarea,select'))animate(targetFor(event.target),true);},{capture:true});
  document.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key))animate(targetFor(event.target),false);},{capture:true});

  installPageScrollbar();
}
