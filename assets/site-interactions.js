export function installSiteInteractions(){
  if(window.__portfolioInteractions)return;window.__portfolioInteractions=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motions=new WeakMap(),pressed=new Map();
  for(const cell of document.querySelectorAll('.site-logo,.site-nav a')){
    if(cell.querySelector('.ds-nav-label'))continue;
    const label=document.createElement('span');label.className='ds-nav-label';label.append(...cell.childNodes);cell.append(label);
  }
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
    const frames=down?[{scale:current},{scale:.955}]:[{scale:current},{scale:1.018,offset:.62},{scale:1}];
    const animation=target.animate(frames,{duration:down?110:470,easing:down?'ease-out':'cubic-bezier(.2,.75,.25,1)',fill:down?'forwards':'none'});
    motions.set(target,animation);animation.finished.catch(()=>{}).then(()=>{if(!down&&motions.get(target)===animation){animation.cancel();motions.delete(target);}});
  }
  document.addEventListener('pointerdown',event=>{if(event.button!==0)return;const target=targetFor(event.target);if(target){pressed.set(event.pointerId,target);animate(target,true);}},{capture:true});
  const release=event=>{const target=pressed.get(event.pointerId);if(target){pressed.delete(event.pointerId);animate(target,false);}};
  document.addEventListener('pointerup',release,{capture:true});document.addEventListener('pointercancel',release,{capture:true});
  addEventListener('blur',()=>{for(const target of pressed.values())animate(target,false);pressed.clear();});
  document.addEventListener('keydown',event=>{if(!event.repeat&&['Enter',' '].includes(event.key)&&!event.target.matches('input,textarea,select'))animate(targetFor(event.target),true);},{capture:true});
  document.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key))animate(targetFor(event.target),false);},{capture:true});

  // Native tracks remain transparent inside local surfaces. The root gutter
  // follows full-bleed sections, including the dark contact footer.
  let scheduled=0;
  function syncTrack(){
    scheduled=0;const root=document.documentElement,height=innerHeight,width=root.clientWidth;
    root.style.setProperty('--site-viewport-width',width+'px');
    const surfaces=[...document.querySelectorAll('.rd-footer-cta,.rcompat-footer')].map(el=>({rect:el.getBoundingClientRect(),color:getComputedStyle(el).backgroundColor})).filter(({rect,color})=>rect.bottom>0&&rect.top<height&&rect.left<4&&rect.right>=width-4&&color!=='rgba(0, 0, 0, 0)');
    const stops=['#f5f5f2 0px'];let last=0;
    for(const {rect,color}of surfaces.sort((a,b)=>a.rect.top-b.rect.top)){
      const top=Math.max(last,Math.min(height,rect.top)),bottom=Math.max(top,Math.min(height,rect.bottom));
      stops.push(`#f5f5f2 ${top}px`,`${color} ${top}px`,`${color} ${bottom}px`);last=bottom;
    }
    stops.push(`#f5f5f2 ${last}px`,`#f5f5f2 ${height}px`);
    const track=`linear-gradient(to bottom,${stops.join(',')})`;
    if(root.style.getPropertyValue('--root-scrollbar-track')!==track)root.style.setProperty('--root-scrollbar-track',track);
    const center=surfaces.find(({rect})=>rect.top<=height/2&&rect.bottom>=height/2)?.color||'#f5f5f2';
    root.style.setProperty('--scrollbar-surface',center);
  }
  const schedule=()=>{if(!scheduled)scheduled=requestAnimationFrame(syncTrack);};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  new ResizeObserver(schedule).observe(document.body);schedule();
}
