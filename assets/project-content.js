import {imageDimensions} from './project-image-dimensions.js?v=20261117-navlab1';
import {bindImageDocument} from './image-viewer.js?v=20261118-perf1';

const prepared=new WeakMap();
const css=`
html.portfolio-project-document,html.portfolio-project-document body{min-height:0!important;height:auto!important;margin:0!important;padding:0!important;overflow:hidden!important;scrollbar-gutter:auto!important;background:var(--project-panel-bg)!important;color:var(--project-text-color)!important}
.portfolio-project-document .site-header,.portfolio-project-document .rproj-back,.portfolio-project-document .rproj-related,.portfolio-project-document .rcompat-related,.portfolio-project-document .rd-footer-cta,.portfolio-project-document .rcompat-footer,.portfolio-project-document #dan-owner-controls{display:none!important}
.portfolio-project-document body .site-main{display:flex!important;flex-direction:column!important;gap:var(--project-content-gap)!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;min-height:0!important;background:transparent!important}
.portfolio-project-document .site-main :is(section,figure,header,.column,.rcompat-layout,.rproj-gallery-item){min-width:0!important;min-height:0!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
.portfolio-project-document .site-main :is(p,.text-block,.rproj-summary,.rproj-story-copy){font-size:var(--project-text-size)!important;font-weight:var(--project-text-weight)!important;line-height:var(--project-text-leading)!important;color:var(--project-text-color)!important;text-align:var(--project-text-align)!important;hyphens:none!important;max-width:none!important;margin:0!important;padding:0!important}
.portfolio-project-document .site-main :is(h1,h2,h3){font-size:var(--project-heading-size)!important;font-weight:var(--project-heading-weight)!important;line-height:1.12!important;color:var(--project-heading-color)!important;text-align:var(--project-text-align)!important;margin:0!important;padding:0!important;max-width:none!important}
.portfolio-project-document :is(.rd-eyebrow,.rproj-story-label){color:var(--project-text-color)!important;opacity:.7;font-size:var(--project-text-size)!important;margin:0!important}
.portfolio-project-document :is(.rproj-header,.rcompat-header,.rproj-story,.rcompat-layout,.column-layout){display:flex!important;gap:var(--project-content-gap)!important;align-items:flex-start!important}
.portfolio-project-document :is(.rproj-header,.rcompat-header){flex-direction:column!important}
.portfolio-project-document :is(.rproj-header>div,.rcompat-header>div,.column){display:flex!important;flex-direction:column!important;gap:var(--project-content-gap)!important}
.portfolio-project-document .rproj-story-label{flex:0 0 20%}
.portfolio-project-document .rproj-story-copy>p+p,.portfolio-project-document .text-block>p+p{margin-top:var(--project-content-gap)!important}
.portfolio-project-document :is(.rproj-gallery,.rcompat-gallery,.media-collection){display:flex!important;gap:var(--project-content-gap)!important;align-items:flex-start!important;flex-wrap:wrap!important}
.portfolio-project-document :is(.rproj-gallery,.rcompat-gallery,.media-collection)>*{flex:1 1 22%!important;min-width:0!important;height:auto!important;grid-column:auto!important}
.portfolio-project-document button[data-lightbox-src],.portfolio-project-document .rdp-shelf-image-viewport{display:block!important;position:relative!important;width:100%!important;padding:0!important;border:0!important;border-radius:var(--project-image-radius)!important;overflow:hidden!important;line-height:0!important;background:transparent!important}
.portfolio-project-document button[data-lightbox-src] img{display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;object-fit:contain!important;border-radius:0!important;transform:none!important}
.portfolio-project-document .embed-shell{position:relative!important;width:100%!important;aspect-ratio:16/9!important;height:auto!important;padding:0!important;overflow:hidden!important;border-radius:var(--project-image-radius)!important}
.portfolio-project-document .embed-shell iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important}
@media(max-width:600px){.portfolio-project-document :is(.column-layout,.rcompat-layout,.rproj-story){flex-direction:column!important}.portfolio-project-document :is(.column-layout,.rcompat-layout)>.column{width:100%!important;flex:auto!important}.portfolio-project-document :is(.rproj-gallery,.rcompat-gallery,.media-collection)>*{flex-basis:45%!important}.portfolio-project-document .site-main :is(h1,h2,h3){font-size:min(var(--project-heading-size),10vw)!important}}
`;
const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
export async function prepareProjectDocument(frame){
  const doc=frame.contentDocument;if(!doc?.querySelector('.site-main'))throw Error('Project content is unavailable.');
  if(prepared.has(doc))return prepared.get(doc);
  doc.documentElement.classList.add('portfolio-project-document');
  const style=doc.createElement('style');style.id='portfolio-project-content';style.textContent=css;doc.head.append(style);
  for(const image of doc.querySelectorAll('.site-main img')){
    const dimensions=imageDimensions[new URL(image.getAttribute('src'),location.href).pathname];
    if(dimensions){image.width=dimensions.width;image.height=dimensions.height;}
    image.decoding='async';
    const button=image.closest('button[data-lightbox-src]');
    if(button&&!image.parentElement.classList.contains('rdp-shelf-image-viewport')){const viewport=doc.createElement('span');viewport.className='rdp-shelf-image-viewport';image.before(viewport);viewport.append(image);}
  }
  const main=doc.querySelector('.site-main');
  // The first image gates the Featured content morph. A standalone 100vw
  // hint can be several times wider than its embedded column. Select for
  // the settled CSS width (and the browser's DPR) before starting decode.
  const hero=frame.closest('.portfolio-panel-incoming') && main.querySelector('img');
  if(hero){
    hero.fetchPriority='high';
    if(hero.srcset){
      const setWidth=width=>{
        const size=Math.ceil(width)+'px';
        if(width>0 && hero.sizes!==size)hero.sizes=size;
      };
      setWidth(hero.offsetWidth);
      const observer=new doc.defaultView.ResizeObserver(([entry])=>setWidth(entry.contentRect.width));
      observer.observe(hero);
      doc.defaultView.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    }
    hero.loading='eager';
  }
  bindImageDocument(doc);
  // Resolve the embedded typography and image boxes before asking for the
  // font-ready promise; font discovery depends on the applied parent styles.
  void main.offsetHeight;
  await doc.fonts?.ready;await raf();await raf();
  const height=()=>Math.ceil(main.getBoundingClientRect().height);
  frame.style.height=height()+'px';
  let clearanceKey='',adjusted=[];
  const result={doc,main,height,clearCloseButton(box){
    const key=JSON.stringify([frame.clientWidth,box,doc.documentElement.style.cssText]);if(key===clearanceKey)return;clearanceKey=key;
    for(const [element,value,priority]of adjusted)value?element.style.setProperty('padding-top',value,priority):element.style.removeProperty('padding-top');adjusted=[];
    const selector='.text-block,p,h1,h2,h3,.rproj-summary';
    for(const element of main.querySelectorAll(selector)){
      if(element.parentElement.closest(selector))continue;
      const range=doc.createRange();range.selectNodeContents(element);
      const overlap=[...range.getClientRects()].some(r=>r.width>0&&r.right>box.left&&r.left<box.right&&r.top<box.bottom&&r.bottom>box.top);
      if(!overlap)continue;
      const amount=Math.max(0,box.bottom+12-element.getBoundingClientRect().top);
      if(amount){adjusted.push([element,element.style.getPropertyValue('padding-top'),element.style.getPropertyPriority('padding-top')]);element.style.setProperty('padding-top',amount+'px','important');}
    }
  },reveal(){
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    for(const element of main.querySelectorAll('button[data-lightbox-src],.text-block,.rproj-header,.rproj-story,.embed-shell')){
      const image=element.querySelector('img');
      const show=()=>{element.style.visibility='';if(!reduced)element.animate([{opacity:0,transform:'translateY(12px) scale(.985)'},{opacity:1,transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.75,.2,1)',fill:'both'}).finished.catch(()=>{});};
      if(image&&!image.complete){element.style.visibility='hidden';image.addEventListener('load',show,{once:true});image.addEventListener('error',show,{once:true});}else show();
    }
  }};
  prepared.set(doc,result);return result;
}
