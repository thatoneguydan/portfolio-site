import {replaceProjectContent} from './project-panels.js?v=20261117-polish2a';
let installed=false,active=null,serial=0,touchExpand=null;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const selector='.rdp-project-card,#featured-work .rd-work-card,.rv-video-card[data-youtube-id]';
const titleFor=card=>card.dataset.videoTitle||card.querySelector('.rdp-project-title,.rd-work-title,.rv-video-title,strong')?.textContent.trim()||'Project';
const slugFor=card=>card.dataset.shelfSlug||((card.dataset.youtubeId||card.dataset.videoId)?'video-'+(card.dataset.youtubeId||card.dataset.videoId):new URL(card.href,location.href).pathname.replace(/^\/+|\/+$/g,''))||'project';
function close(state){
  if(!state)return;state.cancelInsert?.();state.pendingCard?.removeAttribute('aria-busy');state.card.classList.remove('is-active');state.card.setAttribute('aria-expanded','false');state.shelf.classList.remove('is-open');state.shelf.setAttribute('aria-hidden','true');state.shelf.inert=true;
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
  }else if(grid?.matches('.ds-gallery'))grid.after(shelf);
  else if(grid?.matches('.rv-video-grid')){shelf.style.gridColumn='1 / -1';card.after(shelf);}
  else card.after(shelf);
}
function contentFor(card,title){
  const inner=document.createElement('div');inner.className='rdp-project-shelf-inner';
  const videoId=card.dataset.youtubeId||card.dataset.videoId;
  if(videoId){
    const player=document.createElement('div');player.className='portfolio-inline-video';const iframe=document.createElement('iframe');iframe.title=title;iframe.allow='autoplay; encrypted-media; picture-in-picture';iframe.allowFullscreen=true;iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(videoId)+'?autoplay=1&rel=0';player.append(iframe);inner.append(player);
    const copy=document.createElement('div');copy.className='portfolio-project-video-copy';const heading=document.createElement('h2');heading.textContent=title;copy.append(heading);const description=card.dataset.videoDescription;if(description){const p=document.createElement('p');p.textContent=description;copy.append(p);}inner.append(copy);
  }else{
    const loading=document.createElement('div');loading.className='rdp-project-loading';loading.setAttribute('aria-label','Loading project');inner.append(loading);
    const frame=document.createElement('iframe');frame.className='rdp-project-frame';frame.title=title;frame.style.visibility='hidden';const url=new URL(card.href,location.href);url.searchParams.set('inlineShelf','1');frame.src=url.pathname+url.search;inner.append(frame);
  }
  return inner;
}
export function openProject(card,{hash=true}={}){
  const category=card.closest('.rv-shelf');if(category){const toggle=category.querySelector('.rv-shelf-toggle');if(toggle?.getAttribute('aria-expanded')!=='true')toggle?.click();}
  if(active?.card===card&&!active.pendingCard){close(active);if(hash)history.replaceState(null,'',location.pathname+location.search);return;}
  if(!card.id)card.id='project-source-'+(++serial);
  const title=titleFor(card);
  if(active?.card.closest('#featured-work')&&card.closest('#featured-work')){
    const state=active,version=(state.swapVersion||0)+1;state.swapVersion=version;state.pendingCard?.removeAttribute('aria-busy');state.pendingCard=card;card.setAttribute('aria-busy','true');
    replaceProjectContent(state.shelf,{source:card,inner:contentFor(card,title),title,onCommit(){
      if(active!==state||state.swapVersion!==version)return;
      state.card.classList.remove('is-active');state.card.setAttribute('aria-expanded','false');state.card=card;state.pendingCard=null;card.removeAttribute('aria-busy');card.classList.add('is-active');card.setAttribute('aria-expanded','true');
      if(hash)history.replaceState(null,'',location.pathname+location.search+'#featured-'+slugFor(card));
    }}).then(()=>{if(state.swapVersion===version){card.removeAttribute('aria-busy');state.pendingCard=null;}});
    return;
  }
  close(active);
  const shelf=document.createElement('section');shelf.className='rdp-project-shelf is-open';shelf.setAttribute('aria-label',title+' details');shelf.setAttribute('aria-hidden','false');shelf.dataset.projectSource=card.id;shelf.append(contentFor(card,title));
  active={card,shelf};card.classList.add('is-active');card.setAttribute('aria-expanded','true');active.cancelInsert=insert(card,shelf);
  shelf.addEventListener('portfolio-panel-close',()=>{if(active?.shelf===shelf){close(active);history.replaceState(null,'',location.pathname+location.search);}});
  if(hash)history.replaceState(null,'',location.pathname+location.search+'#'+(card.closest('#featured-work')?'featured-':'project-')+slugFor(card));
}
export function installProjectViews(){
  if(installed||new URLSearchParams(location.search).has('inlineShelf'))return;installed=true;
  document.addEventListener('pointerdown',event=>{const card=event.target.closest('.ds-panel');touchExpand=card&&event.pointerType==='touch'&&card.dataset.focused!=='true'?card:null;},true);
  document.addEventListener('click',event=>{
    const card=event.target.closest(selector);if(!card||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.defaultPrevented)return;
    if(card.matches('.ds-panel')&&(card===touchExpand||card.dataset.focused!=='true')){touchExpand=null;return;}touchExpand=null;
    event.preventDefault();event.stopImmediatePropagation();openProject(card);
  },true);
  document.addEventListener('portfolio-open-project',event=>openProject(event.detail.card));
  const slug=location.hash.replace(/^#(?:project|featured)-/,'');if(slug&&slug!==location.hash){const card=[...document.querySelectorAll(selector)].find(card=>slugFor(card)===slug);if(card)requestAnimationFrame(()=>openProject(card,{hash:false}));}
}
