import {defaults} from './landing-schema.js?v=20261117-refine5';
import {panelTailCenter,panelSurfacePath,neighborMaskBounds} from './project-panel-math.js?v=20261117-refine5';
import {prepareProjectDocument} from './project-content.js?v=20261117-refine5';
import {filledControlIcon} from './filled-controls.js?v=20261117-refine5';
let config={...defaults,...window.portfolioLandingConfig},installed=false,trackFrame=0,trackUntil=0;
const panels=new Set(),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const rgba=(hex,opacity)=>`rgba(${hex.match(/\w\w/g).map(s=>parseInt(s,16))},${opacity/100})`;
function variables(root){
  const brightness=config.projectPanelBackground.match(/\w\w/g).map(s=>parseInt(s,16)).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0),auto=brightness>145?'#373b35':'#f5f5f2';
  const values={'project-panel-bg':config.projectPanelBackground,'project-panel-border':config.projectPanelBorderColor,'project-panel-border-width':config.projectPanelBorderWidth+'px','project-panel-radius':config.projectPanelRadius+'px','project-tail-size':config.projectPanelTailSize+'px','project-content-gap':config.projectPanelSpacing+'px','project-image-radius':config.projectImageRadius+'px','project-text-color':config.projectTextAutoContrast?auto:config.projectTextColor,'project-heading-color':config.projectTextAutoContrast?auto:config.projectHeadingColor,'project-text-size':config.projectTextSize+'px','project-text-weight':config.projectTextWeight,'project-text-leading':config.projectTextLeading,'project-heading-size':config.projectHeadingSize+'px','project-heading-weight':config.projectHeadingWeight,'project-text-align':config.projectTextAlign,'project-close-size':config.projectCloseSize+'px','project-close-offset':config.projectCloseTop+'px','project-close-right':config.projectCloseRight+'px','project-close-nav-gap':config.projectCloseNavGap+'px','project-close-bg':config.projectCloseBackground,'project-close-ink':config.projectCloseColor,'project-close-hover-bg':config.projectCloseHoverBackground,'project-close-hover-ink':config.projectCloseHoverColor,'loader-bar-width':config.projectLoaderWidth+'px','loader-bar-height':config.projectLoaderHeight+'px','loader-bar-gap':config.projectLoaderGap+'px','loader-padding':config.projectLoaderPadding+'px','nav-shadow-color':rgba(config.navShadowColor,config.navShadowOpacity),'nav-shadow-x':config.navShadowX+'px','nav-shadow-y':config.navShadowY+'px','nav-shadow-blur':config.navShadowBlur+'px','nav-shadow-spread':config.navShadowSpread+'px'};
  for(let i=1;i<=5;i++)values['loader-color-'+i]=config['projectLoaderColor'+i];
  for(const [key,value]of Object.entries(values))root.style.setProperty('--'+key,String(value));
  root.style.setProperty('--project-panel-shadow',config.projectPanelShadow?`drop-shadow(${config.projectShadowX}px ${config.projectShadowY}px ${config.projectShadowBlur}px ${rgba(config.projectShadowColor,config.projectShadowOpacity)})`:'none');root.style.setProperty('--nav-shadow-enabled',config.navShadow?'1':'0');
}
const maskCards=new Map();let panelSerial=0;
function paintMasks(card){
  const record=maskCards.get(card);if(!record)return;
  if(!record.layers.size){
    for(const [property,value]of Object.entries(record.saved))card.style[property]=value;
    maskCards.delete(card);return;
  }
  const gradients=[...record.layers.values()].map(({start,end,amount})=>{
    const alpha=(1-amount).toFixed(4);
    return `linear-gradient(to bottom,#000 ${start.toFixed(2)}px,rgba(0,0,0,${alpha}) ${end.toFixed(2)}px,rgba(0,0,0,${alpha}) 100%)`;
  }).join(',');
  card.style.maskImage=gradients;card.style.maskComposite='intersect';
}
function clearMasks(state){
  for(const card of state.masked){maskCards.get(card)?.layers.delete(state);paintMasks(card);}state.masked.clear();
}
function updateMasks(state,sourceRect){
  if(state.maskProgress<=0||!sourceRect){clearMasks(state);return;}
  const grid=state.source.closest('.is-masonry,.ds-gallery');if(!grid){clearMasks(state);return;}
  const candidates=[...grid.children].filter(card=>card!==state.source&&card.matches('.rdp-project-card,.ds-panel')&&(grid.matches('.ds-gallery')||!!(card.compareDocumentPosition(state.shelf)&Node.DOCUMENT_POSITION_FOLLOWING)));
  const current=new Set();
  for(const card of candidates){
    const rect=card.getBoundingClientRect(),bounds=neighborMaskBounds(sourceRect,rect,grid.dataset.layout==='vertical');if(!bounds)continue;current.add(card);
    let record=maskCards.get(card);
    if(!record){record={saved:{maskImage:card.style.maskImage,maskComposite:card.style.maskComposite},layers:new Map()};maskCards.set(card,record);}
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
function surface(svg,width,height,center,state){
  const back=svg===state.back,tail=config.projectPanelTailSize;
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
  state.observer.disconnect();state.mutation.disconnect();state.contentObserver?.disconnect();state.maskAnimation?.cancel();clearMasks(state);state.loading?.remove();panels.delete(state);
}
function position(state){
  const {shelf,source}=state;if(!shelf.isConnected){dispose(state);return;}
  const gallery=source?.closest('.ds-gallery');
  if(gallery){const sourceRect=source.getBoundingClientRect(),galleryRect=gallery.getBoundingClientRect();shelf.style.setProperty('margin-top',(sourceRect.bottom-galleryRect.bottom+14+config.projectPanelTailSize)+'px','important');shelf.style.marginBottom=Math.max(0,galleryRect.bottom-sourceRect.bottom-14-config.projectPanelTailSize-shelf.getBoundingClientRect().height)+'px';}
  if(shelf.parentElement.matches('.is-masonry')&&source?.isConnected){const grid=shelf.parentElement.getBoundingClientRect();shelf.style.top=(source.getBoundingClientRect().bottom-grid.top+14+config.projectPanelTailSize)+'px';}
  const rect=shelf.getBoundingClientRect(),sourceRect=source?.getBoundingClientRect(),center=sourceRect?panelTailCenter(sourceRect,rect,config.projectPanelTailSize,config.projectPanelRadius):rect.width/2;
  if(rect.width&&rect.height>0){surface(state.back,rect.width,rect.height,center,state);surface(state.outline,rect.width,rect.height,center,state);}
  shelf.dataset.projectVisible=String(rect.height>.5);state.controls.hidden=!state.open||rect.height<config.projectCloseSize+Math.max(0,config.projectCloseTop)*2;
  shelf.style.setProperty('--project-nav-bottom',Math.max(0,document.querySelector('.site-header')?.getBoundingClientRect().bottom||0)+'px');
  updateMasks(state,sourceRect);
  if(state.loading&&sourceRect){
    const padding=Math.min(config.projectLoaderPadding,Math.max(12,(sourceRect.height-config.projectLoaderHeight)/2-12));
    Object.assign(state.loading.style,{left:(sourceRect.left+sourceRect.width/2)+'px',top:(sourceRect.top+sourceRect.height/2)+'px',maxWidth:Math.max(48,sourceRect.width-20)+'px',padding:padding+'px 20px'});
    state.loading.hidden=!state.open||state.allowed;
  }
}
function finishClose(state){
  if(state.finishing||state.open)return;state.finishing=true;
  setTimeout(()=>animateMask(state,0,reduced.matches?0:220).then(()=>{if(!state.open)state.shelf.dispatchEvent(new CustomEvent('portfolio-panel-closed'));}),reduced.matches?0:150);
}
function measure(state){
  if(!state.shelf.isConnected){dispose(state);return;}
  if(state.content){const frame=state.shelf.querySelector('.rdp-project-frame'),height=state.content.height()+'px';if(frame.style.height!==height)frame.style.height=height;}
  const {shelf,inner}=state;state.open=shelf.classList.contains('is-open');
  if(state.open&&state.ready&&!state.allowed&&!state.preparing){
    state.preparing=true;
    animateMask(state,config.projectEdgeFade?1:0,config.projectEdgeFade?180:0).then(()=>{if(!state.open||!shelf.isConnected)return;state.allowed=true;measure(state);state.content?.reveal();});
  }
  const target=state.open&&state.ready&&state.allowed?Math.ceil(inner.getBoundingClientRect().height):0;
  if(state.target!==target){
    const from=shelf.getBoundingClientRect().height;state.target=target;state.motion?.cancel();state.motion=null;shelf.style.height=target+'px';
    if(!reduced.matches&&Math.abs(from-target)>.5){
      const motion=shelf.animate([{height:from+'px'},{height:target+'px'}],{duration:state.open?500:480,easing:'cubic-bezier(.3,.65,.25,1)',fill:'both'});state.motion=motion;
      motion.finished.catch(()=>{}).then(()=>{if(state.motion===motion){motion.cancel();state.motion=null;position(state);if(!state.open)finishClose(state);}});
    }else if(!state.open)finishClose(state);
  }else if(!state.open&&!state.motion)finishClose(state);
  position(state);
}
function mount(shelf){
  if(shelf.dataset.projectPanelMounted)return;shelf.dataset.projectPanelMounted='true';
  const source=document.getElementById(shelf.dataset.projectSource)||shelf.closest('.rv-shelf')?.querySelector('.rv-shelf-toggle'),serial=++panelSerial;
  let inner=shelf.querySelector(':scope>.rdp-project-shelf-inner');if(!inner){inner=document.createElement('div');inner.className='portfolio-panel-content';inner.append(...shelf.childNodes);shelf.append(inner);}
  const clip=document.createElement('div');clip.className='portfolio-panel-clip';inner.before(clip);clip.append(inner);shelf.classList.add('portfolio-project-panel');shelf.style.height='0px';
  const makeSurface=kind=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('portfolio-panel-surface',kind);svg.setAttribute('aria-hidden','true');svg.innerHTML=(kind==='is-backing'?`<defs><filter id="project-shadow-${serial}" filterUnits="userSpaceOnUse"><feDropShadow/></filter></defs>`:'')+'<path/>';shelf.append(svg);return svg;};
  const back=makeSurface('is-backing'),outline=makeSurface('is-outline'),controls=document.createElement('div');controls.className='portfolio-panel-controls';
  const button=document.createElement('button');button.type='button';button.className='portfolio-panel-close';button.setAttribute('aria-label','Close project');button.innerHTML=filledControlIcon('circle-x');controls.append(button);shelf.append(controls);
  const loading=shelf.querySelector('.rdp-project-loading');if(loading){loading.classList.add('portfolio-project-loading');loading.innerHTML=`<span class="portfolio-wave-loader" role="status" aria-label="Loading project">${Array.from({length:5},(_,i)=>`<span style="--bar-index:${i}" aria-hidden="true"></span>`).join('')}</span>`;document.body.append(loading);}
  const frames=[...shelf.querySelectorAll('.rdp-project-frame')],state={shelf,source,inner,clip,back,outline,controls,loading,ready:!frames.length,allowed:false,preparing:false,target:null,open:shelf.classList.contains('is-open'),motion:null,observer:null,content:null,masked:new Set(),maskProgress:0};panels.add(state);
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(shelf.matches('.rv-shelf-panel'))source?.click();else shelf.dispatchEvent(new CustomEvent('portfolio-panel-close'));});
  state.observer=new ResizeObserver(entries=>{if(entries.some(e=>e.target===inner)&&state.ready)measure(state);position(state);});state.observer.observe(inner);state.observer.observe(shelf);if(source)state.observer.observe(source);
  state.mutation=new MutationObserver(()=>measure(state));state.mutation.observe(shelf,{attributes:true,attributeFilter:['class']});
  for(const frame of frames){let preparing=false;const prepare=async()=>{if(preparing||!shelf.isConnected||!frame.contentDocument?.querySelector('.site-main'))return;preparing=true;try{
    variables(frame.contentDocument.documentElement);state.content=await prepareProjectDocument(frame);if(!shelf.isConnected)return;
    frame.style.height=state.content.height()+'px';state.ready=true;shelf.dataset.projectReady='true';frame.style.visibility='';measure(state);
    state.contentObserver?.disconnect();state.contentObserver=new frame.contentWindow.ResizeObserver(()=>{if(!shelf.isConnected)return;frame.style.height=state.content.height()+'px';measure(state);});state.contentObserver.observe(state.content.main);
  }catch(error){if(loading){loading.textContent='This project could not load. Close it and try again.';loading.setAttribute('role','status');}console.warn(error);}};
    frame.addEventListener('load',prepare);if(frame.contentDocument?.readyState==='complete'&&frame.contentDocument.querySelector('.site-main'))prepare();
  }measure(state);
}
export function applyProjectConfig(next){config={...defaults,...next};variables(document.documentElement);for(const state of panels){if(state.content){variables(state.content.doc.documentElement);state.shelf.querySelector('.rdp-project-frame').style.height=state.content.height()+'px';}if(state.allowed)animateMask(state,config.projectEdgeFade?1:0,180);measure(state);}document.dispatchEvent(new CustomEvent('portfolio-project-config'));}
export function installProjectPanels(){
  if(installed)return;installed=true;variables(document.documentElement);
  const discover=root=>{if(root.nodeType!==1&&root.nodeType!==9)return;const selector='.rdp-project-shelf,.rv-shelf-panel';if(root.matches?.(selector))mount(root);root.querySelectorAll(selector).forEach(mount);};
  discover(document);new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)discover(node);for(const state of panels)if(!state.shelf.isConnected)dispose(state);}).observe(document.body,{childList:true,subtree:true});
  addEventListener('scroll',()=>{for(const state of panels)position(state);},{passive:true});
  addEventListener('resize',()=>{for(const state of panels){if(state.content)state.shelf.querySelector('.rdp-project-frame').style.height=state.content.height()+'px';measure(state);}},{passive:true});
  document.addEventListener('portfolio-masonry-motion',()=>{for(const state of panels)position(state);});
  document.addEventListener('transitionrun',event=>{if(!event.target.closest('.ds-gallery'))return;trackUntil=performance.now()+Math.max(config.galleryDuration,config.verticalGalleryDuration)+100;if(!trackFrame){const track=now=>{for(const state of panels)position(state);trackFrame=now<trackUntil?requestAnimationFrame(track):0;};trackFrame=requestAnimationFrame(track);}});
}
