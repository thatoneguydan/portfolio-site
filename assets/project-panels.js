import {defaults} from './landing-schema.js?v=20261117-polish7';
import {panelClosePosition,panelTailCenter} from './project-panel-math.js?v=20261117-polish7';

let config={...defaults,...window.portfolioLandingConfig},installed=false,positionFrame=0;
const panels=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const waveMarkup=()=>`<span class="portfolio-wave-loader" role="status" aria-label="Loading project">${Array.from({length:5},(_,i)=>`<span style="--bar-index:${i}" aria-hidden="true"></span>`).join('')}</span>`;
function variables(root){
  const values={
    '--project-panel-bg':config.projectPanelBackground,'--project-panel-border':config.projectPanelBorderColor,
    '--project-panel-border-width':config.projectPanelBorderWidth+'px','--project-panel-radius':config.projectPanelRadius+'px',
    '--project-tail-size':config.projectPanelTailSize+'px','--project-close-size':config.projectCloseSize+'px',
    '--project-close-bg':config.projectCloseBackground,'--project-close-ink':config.projectCloseColor,
    '--project-close-hover-bg':config.projectCloseHoverBackground,'--project-close-hover-ink':config.projectCloseHoverColor,
    '--loader-bar-width':config.projectLoaderWidth+'px','--loader-bar-height':config.projectLoaderHeight+'px',
    '--loader-bar-gap':config.projectLoaderGap+'px','--loader-padding':config.projectLoaderPadding+'px'
  };
  for(let i=1;i<=5;i++)values['--loader-color-'+i]=config['projectLoaderColor'+i];
  for(const [key,value]of Object.entries(values))if(root.style.getPropertyValue(key)!==value)root.style.setProperty(key,value);
}
function frameSurface(state){
  for(const frame of state.shelf.querySelectorAll('iframe'))try{
    const doc=frame.contentDocument;if(!doc?.documentElement)continue;
    variables(doc.documentElement);
    if(!doc.getElementById('portfolio-project-surface')){
      const style=doc.createElement('style');style.id='portfolio-project-surface';
      style.textContent='html:root,html:root body{background:var(--project-panel-bg,#e5e5e0)!important}html:root .site-main,html:root .rcompat-layout,html:root .rproj-story{background:transparent!important}';
      doc.head?.append(style);
    }
  }catch{}
}
function position(state){
  const {shelf,button,tail,source}=state;if(!shelf.isConnected){state.observer.disconnect();state.motion?.cancel();panels.delete(state);return;}
  const rect=shelf.getBoundingClientRect(),header=document.querySelector('.site-header');
  const navBottom=Math.max(0,header?.getBoundingClientRect().bottom||0);
  button.style.top=panelClosePosition(rect,navBottom,config)+'px';button.style.right=config.projectCloseRight+'px';
  button.hidden=!state.open||rect.height<config.projectCloseSize+8;
  if(source?.isConnected)tail.style.left=panelTailCenter(source.getBoundingClientRect(),rect,config.projectPanelTailSize,config.projectPanelRadius)+'px';
}
function schedulePosition(){if(!positionFrame)positionFrame=requestAnimationFrame(()=>{positionFrame=0;for(const state of panels)position(state);});}
function measure(state){
  const {shelf,inner}=state;if(!shelf.isConnected)return;
  const open=shelf.classList.contains('is-open'),target=open?Math.ceil(inner.getBoundingClientRect().height):0;
  state.open=open;position(state);
  if(state.target===target)return;
  const from=shelf.getBoundingClientRect().height;state.target=target;state.motion?.cancel();shelf.style.height=target+'px';
  if(!reduced.matches&&Math.abs(from-target)>.5){
    const motion=shelf.animate([{height:from+'px'},{height:target+'px'}],{duration:open?(from<1?500:380):480,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'});
    state.motion=motion;motion.finished.catch(()=>{}).then(()=>{if(state.motion===motion){motion.cancel();state.motion=null;position(state);}});
  }
  schedulePosition();
}
function mount(shelf){
  if(shelf.dataset.projectPanelMounted)return;shelf.dataset.projectPanelMounted='true';
  const source=shelf.dataset.projectSource?document.getElementById(shelf.dataset.projectSource):shelf.closest('.rv-shelf')?.querySelector('.rv-shelf-toggle');
  let inner=shelf.querySelector(':scope > .rdp-project-shelf-inner');
  if(!inner){inner=document.createElement('div');inner.className='portfolio-panel-content';inner.append(...shelf.childNodes);shelf.append(inner);}
  const clip=document.createElement('div');clip.className='portfolio-panel-clip';inner.before(clip);clip.append(inner);
  shelf.classList.add('portfolio-project-panel');shelf.style.height='0px';
  const tail=document.createElementNS('http://www.w3.org/2000/svg','svg');tail.setAttribute('viewBox','0 0 100 50');tail.setAttribute('aria-hidden','true');tail.classList.add('portfolio-panel-tail');
  tail.innerHTML='<path d="M0 50 L50 0 L100 50 L100 53 L0 53Z" class="portfolio-tail-fill"/><path d="M0 50 L50 0 L100 50" class="portfolio-tail-edge"/>';
  const button=document.createElement('button');button.type='button';button.className='portfolio-panel-close';button.setAttribute('aria-label','Close project');button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
  shelf.append(tail,button);
  const state={shelf,inner,clip,tail,button,source,open:false,target:null,motion:null,observer:null};panels.add(state);
  button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    if(shelf.matches('.rv-shelf-panel')){if(source?.getAttribute('aria-expanded')==='true')source.click();}
    else shelf.dispatchEvent(new CustomEvent('portfolio-panel-close'));
  });
  state.observer=new ResizeObserver(entries=>{if(entries.some(entry=>entry.target===inner))measure(state);position(state);});
  state.observer.observe(inner);state.observer.observe(shelf);if(source)state.observer.observe(source);
  new MutationObserver(()=>measure(state)).observe(shelf,{attributes:true,attributeFilter:['class']});
  for(const frame of shelf.querySelectorAll('iframe'))frame.addEventListener('load',()=>{frameSurface(state);requestAnimationFrame(()=>measure(state));});
  for(const loading of shelf.querySelectorAll('.rdp-project-loading')){loading.removeAttribute('aria-live');loading.replaceChildren();loading.insertAdjacentHTML('afterbegin',waveMarkup());}
  frameSurface(state);measure(state);
}
export function applyProjectConfig(next){
  config={...defaults,...next};variables(document.documentElement);
  for(const state of panels){frameSurface(state);measure(state);position(state);}
}
export function installProjectPanels(){
  if(installed)return;installed=true;variables(document.documentElement);
  const discover=root=>{
    if(root.nodeType!==1&&root.nodeType!==9)return;
    const selector='.rdp-project-shelf,.rv-shelf-panel';
    if(root.matches?.(selector))mount(root);for(const el of root.querySelectorAll(selector))mount(el);
  };
  discover(document);new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)discover(node);schedulePosition();}).observe(document.body,{childList:true,subtree:true});
  addEventListener('scroll',schedulePosition,{passive:true});addEventListener('resize',()=>{for(const state of panels)measure(state);schedulePosition();},{passive:true});
  document.addEventListener('portfolio-masonry-motion',schedulePosition);
}
