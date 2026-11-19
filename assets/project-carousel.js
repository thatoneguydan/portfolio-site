import {featuredGalleryLayout,galleryCaptionKind,gallerySettings} from './gallery-layout.js?v=20261119-shared-carousel1';
import {bindDotScrubber,createDotIndicator} from './dot-indicator.js?v=20261118-hero3';

export function usesCompactNavigation(){
  const toggle=document.querySelector('.site-nav-toggle');
  return toggle?getComputedStyle(toggle).display!=='none':innerWidth<=720;
}

// Each carousel owns its selection, while all share layout and motion settings.
export function mountProjectCarousel(gallery,{controlsLabel,orientationKey,configuredIndex,idPrefix}={}){
  const panels=[...gallery.querySelectorAll(':scope > .ds-panel')];
  const images=panels.map(panel=>panel.querySelector('.ds-gallery-image'));
  const events=new AbortController();
  const listen=(target,type,callback)=>target.addEventListener(type,callback,{signal:events.signal});
  for(const image of images){
    const fallback=image.dataset.thumbnailFallback;
    if(!fallback)continue;
    const useFallback=()=>{if(image.getAttribute('src')!==fallback)image.src=fallback;};
    image.addEventListener('error',useFallback,{once:true,signal:events.signal});
    if(image.complete&&!image.naturalWidth)useFallback();
  }
  let config=null,orientation='landscape',profile=null,activeIndex=0,renderedIndex=-1,lastConfiguredIndex;
  let galleryWidth=0,layoutSignature='',pendingFrame=0;

  const dots=document.createElement('nav');
  dots.className='ds-gallery-dots';
  dots.setAttribute('aria-label',controlsLabel||'Choose a project');
  const indicator=createDotIndicator(dots);
  const dotButtons=panels.map((panel,i)=>{
    panel.style.setProperty('--featured-card-order',i*2);
    const button=document.createElement('button');
    button.type='button';button.dataset.index=String(i);
    if(!panel.id)panel.id=`${idPrefix||gallery.closest('section')?.id||'carousel'}-card-${i+1}`;
    button.setAttribute('aria-controls',panel.id);
    button.setAttribute('aria-label',`Show ${panel.querySelector('.rd-work-title').textContent}, ${i+1} of ${panels.length}`);
    dots.append(button);
    return button;
  });
  if(panels.length>1){
    const controls=document.createElement('div');
    controls.className='ds-gallery-controls';
    controls.append(dots);
    const shelf=gallery.querySelector(':scope > .rdp-project-shelf');
    if(shelf&&gallery.dataset.layout!=='vertical')shelf.before(controls);
    else gallery.append(controls);
  }

  function select(index,{fromScrub=false,refresh=false}={}){
    if(!config||!panels.length)return;
    activeIndex=(index+panels.length)%panels.length;
    if(!fromScrub)indicator.select(dotButtons[activeIndex]);
    if(renderedIndex===activeIndex&&!refresh)return;
    renderedIndex=activeIndex;
    const vertical=gallery.dataset.layout==='vertical';
    const layout=featuredGalleryLayout(config,vertical,galleryWidth,panels.length,activeIndex,orientation);
    if(refresh){
      gallery.style.setProperty('--gallery-height',layout.height+'px');
      gallery.style.setProperty('--mobile-expanded',layout.height+'px');
      gallery.style.setProperty('--media-width',layout.expandedWidth+'px');
      gallery.style.setProperty('--caption-width',Math.max(1,layout.expandedWidth-(vertical?profile.padding*2:36))+'px');
    }
    panels.forEach((panel,i)=>{
      const active=i===activeIndex;
      if(panel.dataset.focused!==String(active))panel.dataset.focused=String(active);
      panel.style.flexGrow=vertical?'':String(layout.extents[i]);
      panel.style.setProperty('--featured-card-extent',layout.extents[i]+'px');
      const captionVisible=String(galleryCaptionKind({active,vertical})==='full');
      if(panel.dataset.captionVisible!==captionVisible)panel.dataset.captionVisible=captionVisible;
      const image=images[i];
      image.style.filter=profile.grayscale&&!active?'grayscale(1)':'none';
      if(refresh&&image.srcset)image.sizes=Math.ceil(vertical?galleryWidth:layout.expandedWidth)+'px';
      if(dotButtons[i].getAttribute('aria-current')!==String(active)){
        dotButtons[i].setAttribute('aria-current',String(active));
        dotButtons[i].tabIndex=active?0:-1;
      }
    });
  }

  function layout(){
    if(!config||!panels.length)return;
    const vertical=usesCompactNavigation();
    const direction=vertical?'vertical':'horizontal';
    const width=gallery.getBoundingClientRect().width;
    const nextProfile=gallerySettings(config,vertical,orientation);
    const signature=JSON.stringify([direction,width,orientation,nextProfile]);
    if(signature===layoutSignature){select(activeIndex);return;}
    layoutSignature=signature;
    const changed=gallery.dataset.layout!==direction;
    if(changed)gallery.classList.add('is-switching-layout');
    galleryWidth=width;
    profile=nextProfile;
    gallery.dataset.layout=direction;
    gallery.dataset.mobile=String(vertical);
    gallery.dataset.orientation=orientation;
    for(const [name,value,unit] of [
      ['gallery-gap',profile.gap,'px'],['gallery-radius',profile.radius,'px'],['gallery-duration',profile.duration,'ms'],
      ['caption-inset',profile.padding,'px'],['caption-title-size',profile.titleSize,'px'],['compact-title-size',profile.compactTitleSize,'px']
    ])gallery.style.setProperty('--'+name,value+unit);
    select(activeIndex,{refresh:true});
    if(changed){
      void gallery.offsetHeight;
      cancelAnimationFrame(pendingFrame);
      pendingFrame=requestAnimationFrame(()=>gallery.classList.remove('is-switching-layout'));
    }
  }

  function commitDot(index){
    const target=panels[index];
    if(gallery.querySelector(':scope > .rdp-project-shelf.is-open')&&!target.hasAttribute('aria-busy')&&
       (!target.classList.contains('is-active')||gallery.querySelector('[aria-busy="true"]'))){
      document.dispatchEvent(new CustomEvent('portfolio-open-project',{detail:{card:target}}));
    }
  }
  function keyIndex(key){
    if(key==='Home')return 0;
    if(key==='End')return panels.length-1;
    if(key==='ArrowRight'||key==='ArrowDown')return (activeIndex+1)%panels.length;
    if(key==='ArrowLeft'||key==='ArrowUp')return (activeIndex+panels.length-1)%panels.length;
    return null;
  }
  listen(dots,'click',event=>{
    const button=event.target.closest('button');
    if(button){const index=Number(button.dataset.index);select(index);commitDot(index);}
  });
  listen(dots,'keydown',event=>{
    const index=keyIndex(event.key);if(index===null)return;
    event.preventDefault();select(index);dotButtons[index].focus({preventScroll:true});commitDot(index);
  });
  const unbindScrub=bindDotScrubber(dots,()=>dotButtons,indicator,{
    preview:index=>select(index,{fromScrub:true}),
    commit:index=>{
      dotButtons[index].focus({preventScroll:true});
      commitDot(index);
    }
  });
  listen(gallery,'portfolio-featured-select',event=>{
    const index=panels.indexOf(event.target);if(index!==-1)select(index);
  });
  panels.forEach((panel,index)=>{
    listen(panel,'pointerdown',event=>{
      if(gallery.dataset.layout==='horizontal'&&event.pointerType==='mouse'&&event.button===0)select(index);
    });
    listen(panel,'pointerenter',event=>{
      if(gallery.dataset.layout==='horizontal'&&event.pointerType!=='touch')select(index);
    });
    listen(panel,'focus',()=>{if(gallery.dataset.layout==='horizontal')select(index);});
    listen(panel,'keydown',event=>{
      const next=keyIndex(event.key);if(next===null)return;
      event.preventDefault();select(next);panels[next].focus();
    });
  });
  const observer=new ResizeObserver(()=>{if(gallery.getBoundingClientRect().width!==galleryWidth)layout();});
  observer.observe(gallery);
  listen(window,'resize',layout);
  return {
    update(next){
      config=next;
      orientation=config[orientationKey]==='portrait'?'portrait':'landscape';
      const index=configuredIndex?config[configuredIndex]:0;
      if(index!==lastConfiguredIndex){
        const restored=lastConfiguredIndex===undefined?panels.findIndex(panel=>panel.classList.contains('is-active')):-1;
        activeIndex=restored>=0?restored:Math.max(0,Math.min(panels.length-1,index));
        lastConfiguredIndex=index;
      }
      layout();
    },
    destroy(){
      events.abort();
      observer.disconnect();
      cancelAnimationFrame(pendingFrame);
      unbindScrub?.();
      indicator.destroy?.();
    }
  };
}
