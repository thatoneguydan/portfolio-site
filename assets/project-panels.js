import {defaults} from './landing-schema.js?v=public-19c7b55447-48419883';
import {panelTailCenter,panelSurfacePath,neighborMaskBounds} from './project-panel-math.js?v=20261117-navlab1';
import {filledControlIcon} from './filled-controls.js?v=20261117-navlab1';
import {revealProjectThumbnail} from './reveal-scroll.js?v=20261119-carousel-colors1';
let config={...defaults,...window.portfolioLandingConfig},installed=false,trackFrame=0,trackUntil=0;
const panels=new Set(),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const rgba=(hex,opacity)=>`rgba(${hex.match(/\w\w/g).map(s=>parseInt(s,16))},${opacity/100})`;
function variables(root){
  const brightness=config.projectPanelBackground.match(/\w\w/g).map(s=>parseInt(s,16)).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0),auto=brightness>145?'#373b35':'#f5f5f2';
  const values={'project-panel-bg':config.projectPanelBackground,'project-panel-border':config.projectPanelBorderColor,'project-panel-border-width':config.projectPanelBorderWidth+'px','project-panel-radius':config.projectPanelRadius+'px','project-tail-size':config.projectPanelTailSize+'px','project-content-gap':config.projectPanelSpacing+'px','project-image-radius':config.projectImageRadius+'px','project-text-color':config.projectTextAutoContrast?auto:config.projectTextColor,'project-heading-color':config.projectTextAutoContrast?auto:config.projectHeadingColor,'project-text-size':config.projectTextSize+'px','project-text-weight':config.projectTextWeight,'project-text-leading':config.projectTextLeading,'project-heading-size':config.projectHeadingSize+'px','project-heading-weight':config.projectHeadingWeight,'project-text-align':config.projectTextAlign,'project-close-size':config.projectCloseSize+'px','project-close-offset':config.projectCloseTop+'px','project-close-right':config.projectCloseRight+'px','project-close-nav-gap':config.projectCloseNavGap+'px','project-close-bg':config.projectCloseBackground,'project-close-ink':config.projectCloseColor,'project-close-hover-bg':config.projectCloseHoverBackground,'project-close-hover-ink':config.projectCloseHoverColor,'loader-bar-width':config.projectLoaderWidth+'px','loader-bar-height':config.projectLoaderHeight+'px','loader-bar-gap':config.projectLoaderGap+'px','loader-padding':config.projectLoaderPadding+'px','nav-shadow-color':rgba(config.navShadowColor,config.navShadowOpacity),'nav-shadow-x':config.navShadowX+'px','nav-shadow-y':config.navShadowY+'px','nav-shadow-blur':config.navShadowBlur+'px','nav-shadow-spread':config.navShadowSpread+'px'};
  for(let i=1;i<=5;i++)values['loader-color-'+i]=config['projectLoaderColor'+i];
  for(const [key,value]of Object.entries(values))root.style.setProperty('--'+key,String(value));
  root.style.setProperty('--project-panel-shadow',config.projectPanelShadow?`drop-shadow(${config.projectShadowX}px ${config.projectShadowY}px ${config.projectShadowBlur}px ${rgba(config.projectShadowColor,config.projectShadowOpacity)})`:'none');root.style.setProperty('--nav-shadow-enabled',config.navShadow?'1':'0');
  root.style.setProperty('--project-close-shadow',config.projectCloseShadow?`${config.projectCloseShadowX}px ${config.projectCloseShadowY}px ${config.projectCloseShadowBlur}px ${config.projectCloseShadowSpread}px ${rgba(config.projectCloseShadowColor,config.projectCloseShadowOpacity)}`:'none');
  root.style.setProperty('--lightbox-blur',config.lightboxBlur+'px');root.style.setProperty('--lightbox-backdrop',rgba(config.lightboxColor,config.lightboxOpacity));root.style.setProperty('--lightbox-clear',rgba(config.lightboxColor,0));
}
const maskCards=new Map();let panelSerial=0;
function liftCaption(card,value){const before=card.style.getPropertyValue('--project-caption-lift');if(before===value)return;value?card.style.setProperty('--project-caption-lift',value):card.style.removeProperty('--project-caption-lift');card.dispatchEvent(new CustomEvent('portfolio-caption-position',{bubbles:true}));}
function paintMasks(card){
  const record=maskCards.get(card);if(!record)return;
  if(!record.layers.size){
    for(const [property,value]of Object.entries(record.saved))card.style[property]=value;
    liftCaption(card,record.savedLift||'');maskCards.delete(card);return;
  }
  const gradients=[...record.layers.values()].map(({start,end,amount})=>{
    const alpha=(1-amount).toFixed(4);
    const stops=Array.from({length:17},(_,i)=>{const t=i/16,smooth=t*t*t*(t*(t*6-15)+10);return `rgba(0,0,0,${(1-amount*smooth).toFixed(4)}) ${(start+(end-start)*t).toFixed(2)}px`;});
    return `linear-gradient(to bottom,#000 ${start.toFixed(2)}px,${stops.join(',')},rgba(0,0,0,${alpha}) 100%)`;
  }).join(',');
  card.style.maskImage=gradients;card.style.maskComposite='intersect';
  const caption=card.querySelector('.rdp-project-meta');if(caption){const padding=Number.parseFloat(getComputedStyle(caption).paddingBottom)||24,bounds=[...caption.children].map(el=>el.getBoundingClientRect()).filter(r=>r.height>0),textHeight=bounds.length?Math.max(...bounds.map(r=>r.bottom))-Math.min(...bounds.map(r=>r.top)):0,maxLift=Math.max(0,card.clientHeight-textHeight-padding*2),lift=Math.min(maxLift,Math.max(0,...[...record.layers.values()].map(({start,amount})=>(card.clientHeight-padding-start+10)*amount)));liftCaption(card,lift.toFixed(2)+'px');}
}
function clearMasks(state){
  for(const card of state.masked){maskCards.get(card)?.layers.delete(state);paintMasks(card);}state.masked.clear();
  for(const entry of state.retiringMasks||[]){maskCards.get(entry.card)?.layers.delete(entry.key);paintMasks(entry.card);}state.retiringMasks=[];
}
function retireMasks(state){
  state.retiringMasks||=[];for(const card of state.masked){const record=maskCards.get(card),layer=record?.layers.get(state);if(!layer)continue;const key={};record.layers.delete(state);record.layers.set(key,layer);state.retiringMasks.push({card,key,layer,at:performance.now()});}state.masked.clear();
}
function updateMasks(state,sourceRect){
  // In the stacked gallery the shelf participates in the same flow as its
  // cards, so it never needs a mask to cover the next card.
  if(state.source?.closest('.ds-gallery[data-layout=vertical]')){
    if(state.masked.size||state.retiringMasks.length)clearMasks(state);
    return;
  }
  state.retiringMasks=(state.retiringMasks||[]).filter(entry=>{const record=maskCards.get(entry.card);if(!record)return false;const t=Math.min(1,(performance.now()-entry.at)/240);if(t===1)record.layers.delete(entry.key);else record.layers.set(entry.key,{...entry.layer,amount:entry.layer.amount*(1-t*t*(3-2*t))});paintMasks(entry.card);return t<1;});
  if(state.maskProgress<=0||!sourceRect){for(const card of state.masked){maskCards.get(card)?.layers.delete(state);paintMasks(card);}state.masked.clear();return;}
  const grid=state.source.closest('.is-masonry,.ds-gallery');if(!grid){clearMasks(state);return;}
  const candidates=[...grid.children].filter(card=>card!==state.source&&card.matches('.rdp-project-card,.ds-panel')&&(grid.matches('.ds-gallery')||!!(card.compareDocumentPosition(state.shelf)&Node.DOCUMENT_POSITION_FOLLOWING)));
  const current=new Set();
  for(const card of candidates){
    const rect=card.getBoundingClientRect(),bounds=neighborMaskBounds(sourceRect,rect,grid.dataset.layout==='vertical');if(!bounds)continue;current.add(card);
    let record=maskCards.get(card);
    if(!record){record={saved:{maskImage:card.style.maskImage,maskComposite:card.style.maskComposite},savedLift:card.style.getPropertyValue('--project-caption-lift'),layers:new Map()};maskCards.set(card,record);}
    record.layers.set(state,{...bounds,amount:state.maskProgress});paintMasks(card);
  }
  for(const card of state.masked)if(!current.has(card)){maskCards.get(card)?.layers.delete(state);paintMasks(card);}state.masked=current;
}
function animateMask(state,target,duration){
  state.maskAnimation?.cancel();
  if(reduced.matches||!duration){state.maskProgress=target;position(state);return Promise.resolve();}
  const from=state.maskProgress,start=performance.now();let frame,resolve;
  const done=new Promise(r=>resolve=r),animation={cancel(){cancelAnimationFrame(frame);resolve();}};state.maskAnimation=animation;
  const tick=now=>{const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t);state.maskProgress=from+(target-from)*ease;position(state);if(t<1)frame=requestAnimationFrame(tick);else{if(state.maskAnimation===animation)state.maskAnimation=null;resolve();}};
  frame=requestAnimationFrame(tick);return done;
}
function surface(svg,width,height,center,tail,state){
  const back=svg===state.back;
  const padding=back&&config.projectPanelShadow?Math.ceil(3*config.projectShadowBlur+Math.max(Math.abs(config.projectShadowX),Math.abs(config.projectShadowY))+config.projectPanelBorderWidth+4):Math.ceil(config.projectPanelBorderWidth+2);
  const signature=[width,height,center,tail,config.projectPanelRadius,padding,config.projectPanelShadow,config.projectShadowX,config.projectShadowY,config.projectShadowBlur,config.projectShadowColor,config.projectShadowOpacity].join(',');if(svg.dataset.geometry===signature)return;
  svg.dataset.geometry=signature;
  svg.setAttribute('viewBox',`${-padding} ${-tail-padding} ${width+2*padding} ${Math.max(1,height)+tail+2*padding}`);
  Object.assign(svg.style,{left:-padding+'px',top:(-tail-padding)+'px',width:(width+2*padding)+'px',height:(height+tail+2*padding)+'px'});
  const path=svg.querySelector('path');path.setAttribute('d',panelSurfacePath(width,height,center,tail,config.projectPanelRadius));
  if(back){
    const filter=svg.querySelector('filter'),shadow=filter.firstElementChild;
    filter.setAttribute('x',-padding);filter.setAttribute('y',-tail-padding);filter.setAttribute('width',width+2*padding);filter.setAttribute('height',height+tail+2*padding);
    shadow.setAttribute('dx',config.projectShadowX);shadow.setAttribute('dy',config.projectShadowY);shadow.setAttribute('stdDeviation',config.projectShadowBlur);
    shadow.setAttribute('flood-color',config.projectShadowColor);shadow.setAttribute('flood-opacity',config.projectShadowOpacity/100);
    path.setAttribute('filter',config.projectPanelShadow?`url(#${filter.id})`:'none');
  }
}
function dispose(state){
  const dots=state.featuredDotBar;
  if(dots&&![...panels].some(panel=>panel!==state&&panel.featuredDotBar===dots))dots.style.left='';
  state.initial.abort();state.pending?.abort.abort();state.observer.disconnect();state.mutation.disconnect();state.contentObserver?.disconnect();state.maskAnimation?.cancel();state.anchorMotions?.forEach(motion=>motion.cancel());clearMasks(state);state.loading?.remove();panels.delete(state);
}
function syncContent(state,content=state.content,inner=state.inner){
  if(!content)return;variables(content.doc.documentElement);const padding=config.projectPanelSpacing,left=state.shelf.clientWidth-config.projectCloseRight-config.projectCloseSize-padding;
  content.clearCloseButton({left,right:left+config.projectCloseSize,top:config.projectCloseTop-padding,bottom:config.projectCloseTop-padding+config.projectCloseSize});
  inner.querySelector('.rdp-project-frame').style.height=content.height()+'px';
}
function observeContent(state){state.contentObserver?.disconnect();if(!state.content)return;state.contentObserver=new state.content.doc.defaultView.ResizeObserver(()=>measure(state));state.contentObserver.observe(state.content.main);}
function carouselMotionDuration(node){
  return parseFloat(node?.closest('.ds-gallery')?.style.getPropertyValue('--gallery-duration'))||0;
}
function trackPositions(duration){trackUntil=Math.max(trackUntil,performance.now()+duration);if(!trackFrame){const tick=now=>{for(const state of panels)position(state);trackFrame=now<trackUntil?requestAnimationFrame(tick):0;};trackFrame=requestAnimationFrame(tick);}}
function featuredDots(shelf){
  return shelf.closest('.ds-gallery[data-layout=horizontal]')?.querySelector('.ds-gallery-dots');
}
const tailDotClearance=12;
function featuredTail(state,source,panel,dots,bar,tail,gap,now){
  const corner=Math.min(config.projectPanelRadius,panel.width/2);
  const clearance=tailDotClearance+config.projectPanelBorderWidth/2;
  const availableSide=panel.width-bar.width-tailDotClearance-corner;
  // In very narrow layouts even an off-center pill may not leave room for
  // the full tail. Scale the entire triangle down before choosing its side.
  const sideLimit=(availableSide+gap-Math.SQRT2*clearance)/2;
  const length=Math.max(0,Math.min(tail,panel.width/2-corner,sideLimit));
  const inset=corner+length;
  const first=inset,last=panel.width-inset;
  const clamp=center=>Math.max(first,Math.min(last,center));
  const desired=source.left+source.width/2-panel.left;
  const middle=clamp(desired);
  // The nearest obstruction is the bottom corner of the pill. Project the
  // clearance onto the horizontal axis of the 45-degree tail.
  const reach=length-gap+Math.SQRT2*clearance;
  const baseLeft=(panel.width-bar.width)/2,baseRight=baseLeft+bar.width;
  let shift=0,leftLimit=baseLeft-reach,rightLimit=baseRight+reach;
  if(length&&leftLimit<first&&rightLimit>last){
    // Move the pill only when a narrow panel has no room on either side.
    const shiftRight=first-leftLimit,shiftLeft=last-rightLimit;
    const canShiftRight=baseRight+shiftRight<=panel.width-tailDotClearance+.01;
    const canShiftLeft=baseLeft+shiftLeft>=tailDotClearance-.01;
    if(canShiftRight&&(!canShiftLeft||shiftRight<=-shiftLeft+.5))shift=shiftRight;
    else if(canShiftLeft)shift=shiftLeft;
    leftLimit+=shift;rightLimit+=shift;
  }
  const shiftStyle=shift?shift.toFixed(3)+'px':'';
  if(dots.style.left!==shiftStyle)dots.style.left=shiftStyle;
  const clear=x=>x>=first&&x<=last&&(x<=leftLimit||x>=rightLimit);
  let target=middle;
  if(length&&!clear(target)){
    const thirds=[desired-source.width/6,desired+source.width/6].filter(clear);
    const nearest=[Math.min(last,leftLimit),Math.max(first,rightLimit)].filter(clear);
    const candidates=thirds.length?thirds:nearest;
    candidates.sort((a,b)=>Math.abs(a-desired)-Math.abs(b-desired));
    // There may still be no full-size fit at unusual combinations of narrow
    // width, many dots and large corner radii. Keep the widest clear side.
    target=candidates[0]??(baseLeft-first>=last-baseRight?first:last);
  }
  if(length&&!reduced.matches&&!state.tailBlend&&Number.isFinite(state.tailCenter)){
    const pillCenter=(baseLeft+baseRight)/2+shift;
    if((state.tailCenter-pillCenter)*(target-pillCenter)<0){
      state.tailBlend={from:state.tailCenter,at:now};
      trackPositions(400);
    }
  }
  // The dot bar is stacked above the panel. Keep the tail at its settled
  // size while it passes behind the bar and save clearance for the endpoint.
  return {center:clamp(blendTail(state,target,now)),tail:length};
}
function blendTail(state,target,now){
  if(!state.tailBlend)return target;
  const t=Math.min(1,(now-state.tailBlend.at)/400),ease=t*t*(3-2*t);
  const center=state.tailBlend.from+(target-state.tailBlend.from)*ease;
  if(t===1)state.tailBlend=null;
  return center;
}
function position(state){
  const {shelf,source}=state;if(!shelf.isConnected){dispose(state);return;}
  const gallery=source?.closest('.ds-gallery');
  const sourceRect=source?.getBoundingClientRect();
  let tail=config.projectPanelTailSize,dots,bar,gap;
  if(gallery){
    dots=featuredDots(shelf);
    // The horizontal dot bar sits between the thumbnails and the panel.
    // The stacked gallery animates clearance in normal flow with the panel.
    if(dots){
      state.featuredDotBar=dots;
      bar=dots.getBoundingClientRect();
      const dotGap=parseFloat(getComputedStyle(dots).getPropertyValue('--gallery-dot-gap'))||0;
      const halfStroke=config.projectPanelBorderWidth/2;
      gap=dotGap+halfStroke;
      // Move the outside stroke to the former fill edge and extend the same
      // 45-degree tail to keep its fill tip level with the top of the pill.
      if(tail)tail=bar.height+gap+Math.SQRT2*halfStroke;
      shelf.style.marginTop=gap+'px';
    }
  }
  if(shelf.parentElement.matches('.is-masonry')&&source?.isConnected){const grid=shelf.parentElement.getBoundingClientRect();shelf.style.top=(source.getBoundingClientRect().bottom-grid.top+14+config.projectPanelTailSize)+'px';}
  const rect=shelf.getBoundingClientRect(),now=performance.now();
  let center;
  if(dots){
    // The pending card owns the tail during loading. The committed card
    // keeps owning the current panel's vertical layout and edge masks.
    const tailSource=state.pending?.source?.getBoundingClientRect()||sourceRect;
    ({center,tail}=featuredTail(state,tailSource,rect,dots,bar,tail,gap,now));
  }else{
    center=blendTail(state,sourceRect?panelTailCenter(sourceRect,rect,tail,config.projectPanelRadius):rect.width/2,now);
  }
  state.tailCenter=center;
  if(rect.width&&rect.height>0){surface(state.back,rect.width,rect.height,center,tail,state);surface(state.outline,rect.width,rect.height,center,tail,state);}
  shelf.dataset.projectVisible=String(rect.height>.5);state.controls.hidden=!state.open||rect.height<config.projectCloseSize+Math.max(0,config.projectCloseTop)*2;
  shelf.style.setProperty('--project-nav-bottom',Math.max(0,document.querySelector('.site-header')?.getBoundingClientRect().bottom||0)+'px');
  updateMasks(state,sourceRect);
  positionLoader(state,sourceRect);
}
function moveTail(state){
  if(reduced.matches||!Number.isFinite(state.tailCenter))return;
  state.tailBlend={from:state.tailCenter,at:performance.now()};
  trackPositions(Math.max(400,carouselMotionDuration(state.pending?.source||state.source))+100);
}
function finishClose(state){
  if(state.finishing||state.open)return;state.finishing=true;
  Promise.resolve(state.closeMask).then(()=>{if(!state.open)state.shelf.dispatchEvent(new CustomEvent('portfolio-panel-closed'));});
}
function revealProject(state){
  const {shelf,source}=state;
  if(!source||!state.open)return;
  revealProjectThumbnail(shelf,source);
}
function measure(state){
  if(!state.shelf.isConnected){dispose(state);return;}
  if(state.content)syncContent(state);
  const {shelf,inner}=state,wasOpen=state.open;state.open=shelf.classList.contains('is-open');
  const gallery=state.source?.closest('.ds-gallery');
  const stacked=gallery?.dataset.layout==='vertical';
  let hasFollowingCard=false;
  if(gallery){
    const cards=[...gallery.children].filter(card=>card.matches('.ds-panel'));
    const sourceIndex=cards.indexOf(state.source);
    shelf.style.setProperty('--featured-shelf-order',2*sourceIndex+1);
    hasFollowingCard=sourceIndex>=0&&sourceIndex<cards.length-1;
  }
  if(stacked!==state.stacked){
    shelf.style.removeProperty('margin-top');
    shelf.style.removeProperty('margin-bottom');
    state.stacked=stacked;
  }
  if(wasOpen&&!state.open){state.initial.abort();state.pending?.abort.abort();state.closeMask=animateMask(state,0,360);}
  if(state.open&&state.ready&&!state.pending&&!state.allowed&&!state.preparing){
    state.preparing=true;
    const mask=config.projectEdgeFade&&!stacked;
    animateMask(state,mask?1:0,mask?180:0).then(()=>{if(!state.open||!shelf.isConnected)return;state.allowed=true;measure(state);state.content?.reveal();});
  }
  // The content plane can be proportionately scaled during a morph. Measure
  // its settled layout box, never that currently painted transform.
  const target=state.open&&state.ready&&state.allowed?inner.offsetHeight:0;
  const clearance=stacked&&target?14+config.projectPanelTailSize:0;
  const trailingClearance=stacked&&target&&hasFollowingCard?24:0;
  const firstReveal=target>0&&!state.target&&shelf.dataset.projectRevealOnOpen==='true';
  if(state.target!==target||state.clearance!==clearance||state.trailingClearance!==trailingClearance){
    const from=shelf.getBoundingClientRect().height;
    const previousMargins=stacked?getComputedStyle(shelf):null;
    const fromClearance=previousMargins?parseFloat(previousMargins.marginTop):0;
    const fromTrailingClearance=previousMargins?parseFloat(previousMargins.marginBottom):0;
    state.target=target;state.clearance=clearance;state.trailingClearance=trailingClearance;
    state.motion?.cancel();state.motion=null;shelf.style.height=target+'px';
    if(stacked){shelf.style.marginTop=clearance+'px';shelf.style.marginBottom=trailingClearance+'px';}
    if(!reduced.matches&&(Math.abs(from-target)>.5||Math.abs(fromClearance-clearance)>.5||Math.abs(fromTrailingClearance-trailingClearance)>.5)){
      const start={height:from+'px'},end={height:target+'px'};
      if(stacked){
        start.marginTop=fromClearance+'px';end.marginTop=clearance+'px';
        start.marginBottom=fromTrailingClearance+'px';end.marginBottom=trailingClearance+'px';
      }
      const motion=shelf.animate([start,end],{duration:state.open?500:480,easing:'cubic-bezier(.3,.65,.25,1)',fill:'both'});state.motion=motion;
      motion.finished.catch(()=>{}).then(()=>{if(state.motion===motion){motion.cancel();state.motion=null;position(state);if(!state.open)finishClose(state);}});
    }else if(!state.open)finishClose(state);
  }else if(!state.open&&!state.motion)finishClose(state);
  position(state);
  if(firstReveal){delete shelf.dataset.projectRevealOnOpen;revealProject(state);}
}
function mount(shelf){
  if(shelf.dataset.projectPanelMounted)return;shelf.dataset.projectPanelMounted='true';
  const source=document.getElementById(shelf.dataset.projectSource)||shelf.closest('.rv-shelf')?.querySelector('.rv-shelf-toggle'),serial=++panelSerial;
  let clip=shelf.querySelector(':scope>.portfolio-panel-clip');
  let inner=(clip||shelf).querySelector(':scope>.rdp-project-shelf-inner');if(!inner){inner=document.createElement('div');inner.className='portfolio-panel-content';inner.append(...shelf.childNodes);shelf.append(inner);}
  if(!clip){clip=document.createElement('div');clip.className='portfolio-panel-clip';inner.before(clip);clip.append(inner);}
  shelf.classList.add('portfolio-project-panel');shelf.style.height='0px';
  const makeSurface=kind=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('portfolio-panel-surface',kind);svg.setAttribute('aria-hidden','true');svg.innerHTML=(kind==='is-backing'?`<defs><filter id="project-shadow-${serial}" filterUnits="userSpaceOnUse"><feDropShadow/></filter></defs>`:'')+'<path/>';shelf.append(svg);return svg;};
  const back=makeSurface('is-backing'),outline=makeSurface('is-outline'),controls=document.createElement('div');controls.className='portfolio-panel-controls';
  const button=document.createElement('button');button.type='button';button.className='portfolio-panel-close';button.setAttribute('aria-label','Close project');button.innerHTML=filledControlIcon('circle-x');controls.append(button);shelf.append(controls);
  const loading=shelf.querySelector('.rdp-project-loading');
  const frames=[...shelf.querySelectorAll('.rdp-project-frame')],state={shelf,source,inner,clip,back,outline,controls,loading,ready:!frames.length,allowed:false,preparing:false,target:null,open:shelf.classList.contains('is-open'),motion:null,observer:null,content:null,masked:new Set(),maskProgress:0,initial:new AbortController(),retiringMasks:[]};panels.add(state);
  if(loading)loaderFor(state);
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(shelf.matches('.rv-shelf-panel'))source?.click();else shelf.dispatchEvent(new CustomEvent('portfolio-panel-close'));});
  state.observer=new ResizeObserver(entries=>{if(entries.some(e=>e.target===state.inner)&&state.ready)measure(state);position(state);});state.observer.observe(inner);state.observer.observe(shelf);if(source)state.observer.observe(source);
  state.mutation=new MutationObserver(()=>measure(state));state.mutation.observe(shelf,{attributes:true,attributeFilter:['class']});
  for(const frame of frames){
    const signal=state.initial.signal;
    prepareFrame(frame,signal,0).then(content=>{
      if(signal.aborted||!shelf.isConnected)return;
      state.content=content;syncContent(state);state.ready=true;shelf.dataset.projectReady='true';
      frame.style.visibility='';measure(state);observeContent(state);
    }).catch(error=>{
      if(signal.aborted)return;
      if(loading)showLoadError(state,source,'This project could not load. Close it and try again.');
      console.warn(error);
    });
  }measure(state);
}
export function applyProjectConfig(next){config={...defaults,...next};variables(document.documentElement);for(const state of panels){if(state.content)syncContent(state);if(state.allowed)animateMask(state,config.projectEdgeFade?1:0,180);measure(state);}document.dispatchEvent(new CustomEvent('portfolio-project-config'));}
function loaderFor(state){
  const loading=state.loading||document.createElement('div');loading.className='rdp-project-loading portfolio-project-loading';loading.removeAttribute('role');
  loading.innerHTML=`<span class="portfolio-wave-loader" role="status" aria-label="Loading project">${Array.from({length:5},(_,i)=>`<span style="--bar-index:${i}" aria-hidden="true"></span>`).join('')}</span>`;
  if(loading.parentElement!==document.body)document.body.append(loading);state.loading=loading;return loading;
}
function positionLoader(state,sourceRect){
  const {loading,pending,loadingError,open,ready}=state;
  if(!loading)return;
  // The shelf can still be preparing its expansion after content is ready.
  // Leave the thumbnail clear during that animation.
  const rect=(pending?.source||loadingError?.source)?.getBoundingClientRect()||sourceRect;
  if(rect){
    const padding=Math.min(config.projectLoaderPadding,Math.max(8,(rect.height-config.projectLoaderHeight)/2-8));
    Object.assign(loading.style,{left:(rect.left+rect.width/2)+'px',top:(rect.top+rect.height/2)+'px',maxWidth:Math.max(48,rect.width-20)+'px',padding:padding+'px 20px'});
  }
  const visible=!!(rect&&open&&(pending||!ready||loadingError));
  loading.classList.toggle('is-loading',visible);
  loading.classList.toggle('has-load-error',visible&&!!loadingError);
}
function showLoadError(state,source,message){
  state.loadingError={source};
  const loading=loaderFor(state);loading.removeAttribute('aria-label');loading.textContent=message;loading.setAttribute('role','status');
  position(state);
}
function abortable(promise,signal){return new Promise((resolve,reject)=>{const abort=()=>reject(new DOMException('Cancelled','AbortError'));if(signal.aborted)return abort();signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));});}
function frameReady(frame,signal,project,timeout=15000){
  return new Promise((resolve,reject)=>{
    const listeners=new AbortController();
    let timer;
    const finish=error=>{
      clearTimeout(timer);listeners.abort();signal.removeEventListener('abort',cancel);
      error?reject(error):resolve();
    };
    const cancel=()=>finish(new DOMException('Cancelled','AbortError'));
    if(signal.aborted){cancel();return;}
    const check=event=>{
      if(!project){if(event?.type==='load')finish();return;}
      const doc=frame.contentDocument;
      if(doc?.URL==='about:blank')return;
      if(doc?.querySelector('.site-main') && (doc.documentElement.dataset.projectMarkupReady==='true'||doc.readyState==='complete'))finish();
      else if(event?.type==='load')finish(Error('Project content is unavailable.'));
    };
    if(timeout)timer=setTimeout(()=>finish(Error('The project is taking too long to load.')),timeout);
    signal.addEventListener('abort',cancel,{once:true});
    frame.addEventListener('error',()=>finish(Error('The project could not load.')),{signal:listeners.signal});
    frame.addEventListener('load',check,{signal:listeners.signal});
    if(project){frame.addEventListener('portfolio-project-markup-ready',check,{signal:listeners.signal});check();}
  });
}
async function prepareFrame(frame,signal,timeout){
  const [{prepareProjectDocument}]=await Promise.all([
    import('./project-content.js?v=20261119-mobile-polish1'),
    frameReady(frame,signal,true,timeout)
  ]);
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  variables(frame.contentDocument.documentElement);
  return abortable(prepareProjectDocument(frame),signal);
}
export async function replaceProjectContent(shelf,{source,inner,title,onCommit,revealOnOpen=false}){
  await Promise.resolve();let state=[...panels].find(item=>item.shelf===shelf);
  if(!state){await new Promise(requestAnimationFrame);state=[...panels].find(item=>item.shelf===shelf);}
  if(!state||!state.open||!shelf.isConnected)return false;
  state.pending?.abort.abort();
  const pending={source,inner,abort:new AbortController()};state.pending=pending;state.loadingError=null;
  moveTail(state);
  const {signal}=pending.abort;inner.querySelector('.rdp-project-loading')?.remove();inner.classList.add('portfolio-panel-incoming');inner.inert=true;inner.setAttribute('aria-hidden','true');state.clip.append(inner);loaderFor(state);position(state);
  try{
    const frame=inner.querySelector('.rdp-project-frame');let content=null;
    if(frame){
      content=await prepareFrame(frame,signal);syncContent(state,content,inner);
      const hero=content.main.querySelector('img');if(hero){hero.loading='eager';if(hero.decode)await abortable(hero.decode().catch(()=>{}),signal);}
      frame.style.visibility='';
    }else{const player=inner.querySelector('.portfolio-inline-video>iframe');if(player)await frameReady(player,signal,false);}
    if(signal.aborted||state.pending!==pending||!state.open||!shelf.isConnected)return false;
    const oldInner=state.inner,oldRect=shelf.getBoundingClientRect(),visible=oldRect.height>1;
    state.anchorMotions?.forEach(motion=>motion.cancel());state.anchorMotions=null;
    state.initial.abort();state.contentObserver?.disconnect();state.observer.unobserve(oldInner);state.observer.unobserve(state.source);
    retireMasks(state);state.maskProgress=0;state.source=source;shelf.dataset.projectSource=source.id;shelf.setAttribute('aria-label',title+' details');
    Object.assign(oldInner.style,{position:'absolute',left:'0',top:'0',width:oldInner.getBoundingClientRect().width+'px',boxSizing:'border-box',pointerEvents:'none'});oldInner.inert=true;oldInner.setAttribute('aria-hidden','true');
    inner.classList.remove('portfolio-panel-incoming');inner.inert=false;inner.removeAttribute('aria-hidden');inner.style.width=state.clip.getBoundingClientRect().width+'px';
    state.inner=inner;state.content=content;state.ready=true;state.pending=null;state.preparing=visible;state.allowed=visible;shelf.dataset.projectReady='true';
    state.observer.observe(inner);state.observer.observe(source);observeContent(state);onCommit?.();
    if(revealOnOpen&&!visible)shelf.dataset.projectRevealOnOpen='true';
    measure(state);
    content?.reveal();
    if(visible){
      if(revealOnOpen)revealProject(state);
      animateMask(state,config.projectEdgeFade?1:0,240);
    }
    trackPositions(Math.max(650,carouselMotionDuration(source))+100);
    const delta=oldRect.top-shelf.getBoundingClientRect().top;
    const options={duration:reduced.matches?0:360,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'},oldStyle=getComputedStyle(oldInner);
    const motions=reduced.matches?[]:[oldInner.animate([{opacity:oldStyle.opacity,transform:oldStyle.transform},{opacity:0,transform:'translateY(-10px) scale(.985)'}],options),inner.animate([{opacity:0,transform:'translateY(10px) scale(.985)'},{opacity:1,transform:'none'}],options)];
    if(!state.stacked&&!reduced.matches&&Math.abs(delta)>1){
      const anchors=[shelf,featuredDots(shelf)].filter(Boolean);
      state.anchorMotions=anchors.map(anchor=>anchor.animate([{translate:`0px ${delta}px`},{translate:'0px 0px'}],options));
      motions.push(...state.anchorMotions);
    }
    await Promise.all(motions.map(motion=>motion.finished.catch(()=>{})));motions.forEach(motion=>motion.cancel());
    oldInner.querySelectorAll('iframe').forEach(frame=>frame.src='about:blank');oldInner.remove();if(state.inner===inner){inner.style.width='';measure(state);}return true;
  }catch(error){
    if(error.name!=='AbortError'&&state.pending===pending){showLoadError(state,source,'This project could not load. Choose it again to retry.');console.warn(error);}
    return false;
  }finally{
    if(state.inner!==inner){inner.querySelectorAll('iframe').forEach(frame=>frame.src='about:blank');inner.remove();}
    if(state.pending===pending){state.pending=null;if(state.open)moveTail(state);measure(state);}
  }
}
export function installProjectPanels(){
  if(installed)return;installed=true;variables(document.documentElement);
  const discover=root=>{if(root.nodeType!==1&&root.nodeType!==9)return;const selector='.rdp-project-shelf,.rv-shelf-panel';if(root.matches?.(selector))mount(root);root.querySelectorAll(selector).forEach(mount);};
  discover(document);new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)discover(node);for(const state of panels)if(!state.shelf.isConnected)dispose(state);}).observe(document.body,{childList:true,subtree:true});
  addEventListener('scroll',()=>{for(const state of panels)position(state);},{passive:true});
  addEventListener('resize',()=>{for(const state of panels)measure(state);},{passive:true});
  document.addEventListener('portfolio-masonry-motion',()=>{for(const state of panels)position(state);});
  document.addEventListener('transitionrun',event=>{const duration=carouselMotionDuration(event.target);if(duration)trackPositions(duration+100);});
}
