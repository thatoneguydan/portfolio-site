import {replaceProjectContent} from './project-panels.js?v=20261119-opaque-wave1';
import {cancelPendingRevealScroll,restoreProjectThumbnail} from './reveal-scroll.js?v=20261119-carousel-colors1';
let installed=false,active=null,serial=0,touchExpand=null;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const selector='.rdp-project-card,.ds-gallery > .ds-panel,.rv-video-card[data-youtube-id]';
const titleFor=card=>card.dataset.videoTitle||card.querySelector('.rdp-project-title,.rd-work-title,.rv-video-title,strong')?.textContent.trim()||'Project';
const slugFor=card=>card.dataset.shelfSlug||((card.dataset.youtubeId||card.dataset.videoId)?'video-'+(card.dataset.youtubeId||card.dataset.videoId):new URL(card.href,location.href).pathname.replace(/^\/+|\/+$/g,''))||'project';
function setExpanded(card,shelf,expanded){
  card.classList.toggle('is-active',expanded);
  card.setAttribute('aria-expanded',String(expanded));
  if(expanded)card.setAttribute('aria-controls',shelf.id);
  else card.removeAttribute('aria-controls');
}
function close(state,{restore=false}={}){
  if(!state)return;state.cancelInsert?.();state.pendingCard?.removeAttribute('aria-busy');
  if(restore)restoreProjectThumbnail(state.card);
  setExpanded(state.card,state.shelf,false);
  if(state.shelf.contains(document.activeElement))state.card.focus({preventScroll:true});
  state.shelf.classList.remove('is-open');state.shelf.setAttribute('aria-hidden','true');state.shelf.inert=true;
  let removed=false;const remove=()=>{if(removed)return;removed=true;state.shelf.querySelectorAll('iframe').forEach(f=>f.src='about:blank');state.shelf.remove();};
  state.shelf.addEventListener('portfolio-panel-closed',remove,{once:true});setTimeout(remove,reduced.matches?100:1400);
  if(active===state)active=null;
}
function insert(card,shelf,force=false){
  const grid=card.closest('.rdp-project-grid,.ds-gallery,.rv-video-grid');
  if(!force&&grid?.hasAttribute('data-masonry')&&grid.dataset.masonryReady!=='true'){
    // A restored URL can open before the deferred masonry module has assigned
    // row positions. Wait for its first plan so the shelf follows the whole row.
    let done=false,timer;const cancel=()=>{done=true;observer.disconnect();clearTimeout(timer);};
    const place=()=>{if(done)return;cancel();if(card.isConnected&&shelf.classList.contains('is-open'))insert(card,shelf,true);};
    const observer=new MutationObserver(()=>{if(grid.dataset.masonryReady==='true')place();});
    observer.observe(grid,{attributes:true,attributeFilter:['data-masonry-ready']});timer=setTimeout(place,1500);return cancel;
  }
  if(grid?.matches('.is-masonry')){
    const top=Number(card.dataset.masonryY);const end=[...grid.querySelectorAll(':scope>.rdp-project-card')].filter(c=>Number(c.dataset.masonryY)<=top+.5).at(-1)||card;end.after(shelf);
  }else if(grid?.matches('.ds-gallery')){
    const toggle=document.querySelector('.site-nav-toggle');
    const stacked=grid.dataset.layout ? grid.dataset.layout==='vertical' : toggle&&getComputedStyle(toggle).display!=='none';
    if(stacked)card.after(shelf);
    else grid.append(shelf);
  }
  else if(grid?.matches('.rv-video-grid')){shelf.style.gridColumn='1 / -1';card.after(shelf);}
  else card.after(shelf);
}
function contentFor(card,title){
  const inner=document.createElement('div');inner.className='rdp-project-shelf-inner';
  const videoId=card.dataset.youtubeId||card.dataset.videoId;
  if(videoId){
    const player=document.createElement('div');player.className='portfolio-inline-video';
    player.classList.toggle('is-portrait',card.dataset.videoPortrait==='true');
    const iframe=document.createElement('iframe');iframe.title=title;iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(videoId)+'?autoplay=1&rel=0';player.append(iframe);inner.append(player);
    const copy=document.createElement('div');copy.className='portfolio-project-video-copy';const heading=document.createElement('h2');heading.textContent=title;copy.append(heading);const description=card.dataset.videoDescription;if(description){const p=document.createElement('p');p.textContent=description;copy.append(p);}inner.append(copy);
  }else{
    const loading=document.createElement('div');loading.className='rdp-project-loading';loading.setAttribute('aria-label','Loading project');inner.append(loading);
    const frame=document.createElement('iframe');frame.className='rdp-project-frame';frame.title=title;frame.style.visibility='hidden';const url=new URL(card.href,location.href);url.searchParams.set('inlineShelf','1');frame.src=url.pathname+url.search;inner.append(frame);
  }
  return inner;
}
function selectFeatured(card){
  card.dispatchEvent(new CustomEvent('portfolio-featured-select',{bubbles:true}));
}
const projectHash=card=>'#'+(card.closest('#featured-work')?'featured-':'project-')+slugFor(card);
export function openProject(card,{hash=true,reveal=hash}={}){
  cancelPendingRevealScroll();
  if(card.matches('.ds-panel'))selectFeatured(card);
  const category=card.closest('.rv-shelf');if(category){const toggle=category.querySelector('.rv-shelf-toggle');if(toggle?.getAttribute('aria-expanded')!=='true')toggle?.click();}
  if(active?.card===card&&!active.pendingCard){close(active,{restore:reveal});if(hash)history.replaceState(null,'',location.pathname+location.search);return;}
  if(!card.id)card.id='project-source-'+(++serial);
  const title=titleFor(card);
  const gallery=card.closest('.ds-gallery[data-layout=horizontal]');
  if(gallery&&active?.card.closest('.ds-gallery')===gallery){
    const state=active,version=(state.swapVersion||0)+1;state.swapVersion=version;state.pendingCard?.removeAttribute('aria-busy');state.pendingCard=card;card.setAttribute('aria-busy','true');
    replaceProjectContent(state.shelf,{source:card,inner:contentFor(card,title),title,revealOnOpen:reveal,onCommit(){
      if(active!==state||state.swapVersion!==version)return;
      setExpanded(state.card,state.shelf,false);state.card=card;state.pendingCard=null;card.removeAttribute('aria-busy');setExpanded(card,state.shelf,true);
      if(hash)history.replaceState(null,'',location.pathname+location.search+projectHash(card));
    }}).then(()=>{if(state.swapVersion===version){card.removeAttribute('aria-busy');state.pendingCard=null;}});
    return;
  }
  close(active);
  const shelf=document.createElement('section');shelf.className='rdp-project-shelf is-open';shelf.id=`project-details-${++serial}`;shelf.setAttribute('aria-label',title+' details');shelf.setAttribute('aria-hidden','false');shelf.dataset.projectSource=card.id;
  shelf.dataset.projectRevealOnOpen=String(reveal);
  // Moving a connected iframe into its clip destroys its browsing context
  // and starts a second navigation. Assemble the final tree before insertion.
  const clip=document.createElement('div');clip.className='portfolio-panel-clip';
  clip.append(contentFor(card,title));shelf.append(clip);
  active={card,shelf};setExpanded(card,shelf,true);active.cancelInsert=insert(card,shelf);
  shelf.addEventListener('portfolio-panel-close',()=>{if(active?.shelf===shelf){close(active,{restore:true});history.replaceState(null,'',location.pathname+location.search);}});
  if(hash)history.replaceState(null,'',location.pathname+location.search+projectHash(card));
}
export function installProjectViews(){
  if(installed||new URLSearchParams(location.search).has('inlineShelf'))return;installed=true;
  document.addEventListener('pointerdown',event=>{
    const card=event.target.closest('.ds-gallery > .ds-panel');
    touchExpand=event.pointerType==='touch'&&card?.dataset.focused==='false'?card:null;
  },true);
  document.addEventListener('pointercancel',()=>{touchExpand=null;},true);
  document.addEventListener('click',event=>{
    const card=event.target.closest(selector);if(!card||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.defaultPrevented)return;
    const expandOnly=event.detail!==0&&card===touchExpand;
    touchExpand=null;
    event.preventDefault();event.stopImmediatePropagation();
    // Consume the first tap on a collapsed thumbnail, including videos
    // with a legacy per-card click handler.
    if(expandOnly)selectFeatured(card);
    else openProject(card);
  },true);
  document.addEventListener('portfolio-open-project',event=>openProject(event.detail.card));
  const slug=location.hash.replace(/^#(?:project|featured)-/,'');
  if(slug&&slug!==location.hash){
    const card=[...document.querySelectorAll(selector)].find(card=>slugFor(card)===slug);
    const refreshing=performance.getEntriesByType('navigation')[0]?.type==='reload';
    if(refreshing&&(location.hash.startsWith('#featured-')||card?.closest('#featured-work'))){
      history.replaceState(history.state,'',location.pathname+location.search);
    }else if(card)requestAnimationFrame(()=>openProject(card,{hash:false}));
  }
}
