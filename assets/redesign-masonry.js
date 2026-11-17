import {masonryLayout} from './masonry-layout.js?v=20261117-masonry1';

// Keep the portfolio's existing links, caption planes and inline project shelves.
const grid=document.querySelector('.rdp-project-grid[data-masonry]');
if(grid){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),states=new Map(),positions=new WeakMap(),motions=new Map();
  const shelves=new Set();let frame=0,lastWidth=0,initialized=false;
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(layout);};
  const shelfResize=new ResizeObserver(schedule);
  function reveal(card){
    const state=states.get(card);if(!state||state.shown||!state.near)return;
    const image=state.image;
    image.loading='eager';
    if(!image.complete)return;
    const show=()=>{
      if(state.shown)return;state.shown=true;card.classList.remove('is-masonry-pending');
      if(!reduced.matches){
        const motion=state.face.animate([
          {opacity:0,transform:'translate3d(0,18px,0)',filter:'blur(3px)'},
          {opacity:1,transform:'translate3d(0,0,0)',filter:'blur(0px)'}
        ],{duration:230,easing:'cubic-bezier(.2,.9,.2,1)'});
        motion.finished.catch(()=>{});
      }
      observer?.unobserve(card);
    };
    // Decode each arriving image independently; never gate the gallery on a batch.
    if(image.naturalWidth&&image.decode)image.decode().catch(()=>{}).then(show);else show();
  }
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){const state=states.get(entry.target);if(state)state.near=true;reveal(entry.target);}
  },{rootMargin:'220px 0px',threshold:0});
  function discover(){
    let rank=0;
    for(const card of grid.querySelectorAll(':scope > .rdp-project-card')){
      if(states.has(card)){rank++;continue;}
      const image=card.querySelector('img');if(!image)continue;
      const face=document.createElement('span');face.className='rdp-masonry-face';face.append(...card.childNodes);card.append(face);
      const state={face,image,shown:false,near:!observer};states.set(card,state);
      card.classList.add('is-masonry-pending');
      if(rank<4){image.loading='eager';image.fetchPriority=rank<2?'high':'auto';}
      image.addEventListener('load',()=>reveal(card));image.addEventListener('error',()=>reveal(card));
      card.addEventListener('focus',()=>{state.near=true;reveal(card);});
      observer?.observe(card);rank++;
    }
    for(const shelf of grid.querySelectorAll(':scope > .rdp-project-shelf'))if(!shelves.has(shelf)){shelves.add(shelf);shelfResize.observe(shelf);}
    for(const shelf of shelves)if(!shelf.isConnected){shelfResize.unobserve(shelf);shelves.delete(shelf);}
  }
  function layout(){
    frame=0;discover();const width=grid.clientWidth;if(!width)return;
    const resized=Math.abs(width-lastWidth)>.5;
    const items=[...grid.children].filter(el=>el.matches('.rdp-project-card,.rdp-project-shelf')).map(el=>({
      el,kind:el.matches('.rdp-project-shelf')?'shelf':'card',
      ratio:Number(el.dataset.masonryRatio)||1,height:el.offsetHeight
    }));
    const plan=masonryLayout(items,width);
    grid.style.height=plan.height+'px';grid.dataset.masonryColumns=plan.columns;
    for(const tile of plan.tiles){
      const {el,x,y,w,h,kind}=tile,old=positions.get(el);
      if(kind==='shelf'){
        el.style.top=y+'px';el.style.width=w+'px';continue;
      }
      const target=`translate3d(${x}px,${y}px,0)`;
      el.style.width=w+'px';el.style.height=h+'px';
      const source=states.get(el)?.image;if(source?.srcset)source.sizes=Math.ceil(w)+'px';
      el.dataset.masonryX=x;el.dataset.masonryY=y;
      if(!old||Math.abs(old.x-x)>.5||Math.abs(old.y-y)>.5){
        const current=old&&getComputedStyle(el).transform;motions.get(el)?.cancel();el.style.transform=target;
        // Resize commits final text wrapping first. Only its position moves.
        // Shelf height updates happen every frame and must follow their actual edge.
        if(initialized&&resized&&states.get(el)?.shown&&!reduced.matches&&current&&current!=='none'){
          const motion=el.animate([{transform:current},{transform:target}],{duration:240,easing:'cubic-bezier(.2,.9,.2,1)'});
          motions.set(el,motion);motion.finished.catch(()=>{}).then(()=>{if(motions.get(el)===motion){motion.cancel();motions.delete(el);}});
        }
      }
      positions.set(el,{x,y,w,h});
      const state=states.get(el);if(state&&!observer)reveal(el);
    }
    grid.classList.add('is-masonry');grid.dataset.masonryReady='true';lastWidth=width;initialized=true;
  }
  new ResizeObserver(entries=>{if(Math.abs(entries[0].contentRect.width-lastWidth)>.5)schedule();}).observe(grid);
  new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&r.target===grid))schedule();}).observe(grid,{childList:true});
  layout();
  reduced.addEventListener('change',()=>{if(reduced.matches)for(const motion of motions.values())motion.cancel();});
}
