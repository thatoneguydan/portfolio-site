function installLogoInkAlignment(){
  const bounds=new WeakMap(),cells=[...document.querySelectorAll('.site-logo')];
  function align(cell){
    const image=cell.querySelector('img'),label=cell.querySelector('.ds-nav-label');if(!image?.naturalWidth||!label)return;
    let ink=bounds.get(image);
    if(!ink)try{
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,right=0,top=canvas.height,bottom=0;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      ink={x:left,y:top,w:right-left+1,h:bottom-top+1};bounds.set(image,ink);
    }catch{cell.dataset.logoReady='true';return;}
    const compact=getComputedStyle(document.querySelector('.site-nav-toggle')||cell).display!=='none'&&innerWidth<=720;
    const crop={...ink,w:compact?ink.h:ink.w},available=compact?48:Math.min(205,Math.max(32,cell.clientWidth-48)),scale=Math.min(available/crop.w,48/crop.h);
    Object.assign(label.style,{display:'block',position:'relative',overflow:'hidden',width:crop.w*scale+'px',height:crop.h*scale+'px',flexBasis:'auto'});
    Object.assign(image.style,{position:'absolute',left:-crop.x*scale+'px',top:-crop.y*scale+'px',maxWidth:'none'});image.style.setProperty('width',image.naturalWidth*scale+'px','important');image.style.setProperty('height',image.naturalHeight*scale+'px','important');
    cell.style.justifyContent='center';cell.dataset.logoInkBounds=[ink.x,ink.y,ink.w,ink.h].join(',');cell.dataset.logoReady='true';
  }
  for(const cell of cells){cell.querySelector('img')?.addEventListener('load',()=>align(cell));align(cell);}
  addEventListener('resize',()=>cells.forEach(align),{passive:true});
}

export function pageBlurWeight(progress,falloff){
  const u=Math.max(0,Math.min(1,progress));
  const power=falloff==='bottom' ? 2.4 : falloff==='broad' ? .65 : 1;
  return (u*u*(3-2*u))**power;
}

// A classic scrollbar is painted outside the root scrollport. Extend the
// blurred colors of the full-bleed surfaces into its native track. The thumb
// and OS scrolling stay on their own layer. A Gaussian-filtered color boundary
// is the cumulative normal curve, tabulated here in half-radius increments.
const normalCdf=[.5,.69146,.84134,.93319,.97725,.99379,.99865,.99977,1];
function blurredStep(distance){
  const index=Math.min(Math.abs(distance)*2,normalCdf.length-1),lo=Math.floor(index);
  const amount=normalCdf[lo]+(normalCdf[Math.ceil(index)]-normalCdf[lo])*(index-lo);
  return distance<0?1-amount:amount;
}
function blurredTrackLayer(surfaces,height,band,radius,falloff){
  const edges=surfaces.flatMap(({rect})=>[rect.top,rect.bottom]).filter(y=>y>0&&y<height&&y>band.top-4*radius);
  if(!edges.length)return '';
  const rows=new Set();
  for(let i=0;i<=16;i++)rows.add(band.top+band.height*i/16);
  for(const edge of edges){
    for(let i=-8;i<=8;i++){
      const y=edge+radius*i/2;
      if(y>=band.top&&y<=height)rows.add(y);
    }
  }
  const paper=[245,245,242];
  const colors=surfaces.map(({rect,color})=>({rect,rgb:color.match(/[\d.]+/g).slice(0,3).map(Number)}));
  const stops=[...rows].sort((a,b)=>a-b).map(y=>{
    const rgb=[...paper];
    for(const {rect,rgb:color} of colors){
      const start=rect.top<=0?1:blurredStep((y-rect.top)/radius);
      const end=rect.bottom>=height?0:blurredStep((y-rect.bottom)/radius);
      for(let c=0;c<3;c++)rgb[c]+=(color[c]-paper[c])*(start-end);
    }
    const alpha=pageBlurWeight((y-band.top)/band.height,falloff).toFixed(4);
    return `rgb(${rgb.map(Math.round).join(' ')} / calc(var(--track-blur-opacity) * ${alpha})) ${y.toFixed(2)}px`;
  });
  return 'linear-gradient(to bottom,'+stops.join(',')+'),';
}
export function installSiteInteractions(){
  if(window.__portfolioInteractions)return;window.__portfolioInteractions=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),motions=new WeakMap(),pressed=new Map();
  for(const cell of document.querySelectorAll('.site-logo,.site-nav a')){
    if(cell.querySelector('.ds-nav-label'))continue;
    const label=document.createElement('span');label.className='ds-nav-label';label.append(...cell.childNodes);cell.append(label);
    const shadow=document.createElement('span');shadow.className='ds-nav-shadow';shadow.setAttribute('aria-hidden','true');cell.append(shadow);
  }
  installLogoInkAlignment();
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
    const nav=target.classList.contains('ds-nav-label');
    const frames=down?[{scale:current},{scale:nav ? .82 : .955}]:[{scale:current},{scale:nav ? 1.055 : 1.018,offset:.62},{scale:1}];
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
    const gutter=Math.max(0,innerWidth-width);
    root.toggleAttribute('data-native-gutter',gutter>0);
    root.style.setProperty('--native-gutter-width',gutter+'px');
    const surfaces=[...document.querySelectorAll('.rd-footer-cta,.rcompat-footer')].map(el=>({rect:el.getBoundingClientRect(),color:getComputedStyle(el).backgroundColor})).filter(({rect,color})=>rect.bottom>0&&rect.top<height&&rect.left<4&&rect.right>=width-4&&color!=='rgba(0, 0, 0, 0)');
    const stops=['#f5f5f2 0px'];let last=0;
    for(const {rect,color}of surfaces.sort((a,b)=>a.rect.top-b.rect.top)){
      const top=Math.max(last,Math.min(height,rect.top)),bottom=Math.max(top,Math.min(height,rect.bottom));
      stops.push(`#f5f5f2 ${top}px`,`${color} ${top}px`,`${color} ${bottom}px`);last=bottom;
    }
    stops.push(`#f5f5f2 ${last}px`,`#f5f5f2 ${height}px`);
    const band=document.querySelector('.portfolio-page-blur')?.getBoundingClientRect();
    const config=window.portfolioLandingConfig;
    const soft=gutter&&band?.height&&config?.pageBlurStrength>0?
      blurredTrackLayer(surfaces,height,band,config.pageBlurStrength,config.pageBlurFalloff):'';
    const track=soft+`linear-gradient(to bottom,${stops.join(',')})`;
    if(root.style.getPropertyValue('--root-scrollbar-track')!==track)root.style.setProperty('--root-scrollbar-track',track);
    const center=surfaces.find(({rect})=>rect.top<=height/2&&rect.bottom>=height/2)?.color||'#f5f5f2';
    root.style.setProperty('--scrollbar-surface',center);
  }
  const schedule=()=>{if(!scheduled)scheduled=requestAnimationFrame(syncTrack);};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('portfolio-appearance',schedule);
  new ResizeObserver(schedule).observe(document.body);schedule();
}
