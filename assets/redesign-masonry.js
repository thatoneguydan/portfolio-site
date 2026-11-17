import {masonryLayout} from './masonry-layout.js?v=20261117-polish7';

// Keep the portfolio's existing links, caption planes and inline project shelves.
const grid=document.querySelector('.rdp-project-grid[data-masonry]');
if(grid){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),states=new Map(),positions=new WeakMap(),motions=new Map();
  const shelves=new Set();let frame=0,lastWidth=0,initialized=false,motionFrame=0,motionTime=0;
  function paintPosition(el,s){el.style.transform=`translate3d(${s.x}px,${s.y}px,0)`;}
  function stepPositions(now){
    motionFrame=0;const elapsed=Math.min(.04,Math.max(0,(now-motionTime)/1000));motionTime=now;
    const steps=Math.max(1,Math.ceil(elapsed*240)),dt=elapsed/steps,omega=28;let active=false;
    for(const [el,s]of motions){
      if(!el.isConnected){motions.delete(el);continue;}
      for(let i=0;i<steps;i++){
        s.vx+=(-omega*omega*(s.x-s.tx)-2*omega*s.vx)*dt;s.vy+=(-omega*omega*(s.y-s.ty)-2*omega*s.vy)*dt;
        s.x+=s.vx*dt;s.y+=s.vy*dt;
      }
      const resting=Math.abs(s.x-s.tx)+Math.abs(s.y-s.ty)<.05&&Math.abs(s.vx)+Math.abs(s.vy)<.1;
      if(resting){s.x=s.tx;s.y=s.ty;s.vx=s.vy=0;}else active=true;
      paintPosition(el,s);
    }
    grid.dispatchEvent(new CustomEvent('portfolio-masonry-motion',{bubbles:true}));
    if(active)motionFrame=requestAnimationFrame(stepPositions);
  }
  function move(el,x,y,animate){
    let s=motions.get(el);if(!s){s={x,y,tx:x,ty:y,vx:0,vy:0};motions.set(el,s);paintPosition(el,s);return;}
    s.tx=x;s.ty=y;
    if(!animate||reduced.matches){s.x=x;s.y=y;s.vx=s.vy=0;paintPosition(el,s);return;}
    if(!motionFrame){motionTime=performance.now();motionFrame=requestAnimationFrame(stepPositions);}
  }
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
        ],{duration:230,easing:'cubic-bezier(.2,.9,.2,1)',fill:'both'});
        motion.finished.catch(()=>{}).then(()=>motion.cancel());
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
      el.style.width=w+'px';el.style.height=h+'px';
      const source=states.get(el)?.image;if(source?.srcset)source.sizes=Math.ceil(w)+'px';
      el.dataset.masonryX=x;el.dataset.masonryY=y;
      if(!old||Math.abs(old.x-x)>.5||Math.abs(old.y-y)>.5){
        // Keep both position and velocity through changing shelf targets.
        // No destination style is exposed before the first animated frame.
        move(el,x,y,initialized&&states.get(el)?.shown);
      }
      positions.set(el,{x,y,w,h});
      const state=states.get(el);if(state&&!observer)reveal(el);
    }
    grid.classList.add('is-masonry');grid.dataset.masonryReady='true';lastWidth=width;initialized=true;
  }
  new ResizeObserver(entries=>{if(Math.abs(entries[0].contentRect.width-lastWidth)>.5)schedule();}).observe(grid);
  new MutationObserver(records=>{if(records.some(r=>r.type==='childList'&&r.target===grid))schedule();}).observe(grid,{childList:true});
  layout();
  reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(motionFrame);motionFrame=0;for(const [el,s]of motions){s.x=s.tx;s.y=s.ty;s.vx=s.vy=0;paintPosition(el,s);}}});
  addEventListener('pagehide',()=>cancelAnimationFrame(motionFrame),{once:true});
}
