import {clamp,fitBadge,shouldDismiss,compactBadge,idleOrbit} from './badge-math.js';

export function createBadge({root,intro,h1,ticket,ticketStage,config,fitText}){
  const hero=root.querySelector('.ds-hero');
  const photo=ticket.querySelector('.ds-headshot'),photoWindow=ticket.querySelector('.ds-photo-window');
  const name=ticket.querySelector('.ds-ticket-footer'),heading=ticket.querySelector('.ds-ticket-heading');
  const copy=ticket.querySelector('.ds-ticket-copy'),bio=ticket.querySelector('.ds-bio');
  const carrier=document.createElement('div');carrier.className='ds-ticket-carrier';ticketStage.append(carrier);
  const idleLayer=document.createElement('div');idleLayer.className='ds-ticket-idle';carrier.append(idleLayer);idleLayer.append(ticket);
  const surface=document.createElement('div');surface.className='ds-ticket-surface';surface.append(...ticket.children);ticket.append(surface);
  // Keep hit testing in an untransformed plane. The painted card can tilt freely.
  const activation=document.createElement('button');activation.type='button';activation.className='ds-badge-activate';
  activation.setAttribute('aria-haspopup','dialog');activation.setAttribute('aria-expanded','false');carrier.append(activation);
  const dragPlane=document.createElement('div');dragPlane.className='ds-badge-drag-plane';dragPlane.hidden=true;carrier.append(dragPlane);
  const scrim=document.createElement('div');scrim.className='ds-photo-scrim';photoWindow.append(scrim);
  const dialog=document.createElement('dialog');dialog.id='dan-badge-dialog';dialog.className='ds-badge-dialog';dialog.setAttribute('aria-label','About Dan Smith');
  dialog.innerHTML='<button type="button" class="ds-badge-close" aria-label="Close ID badge">×</button>';
  document.body.append(dialog);
  const closeButton=dialog.querySelector('button');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let compact=false,firstLayout=true,opened=false,busy=false,closeRequested=false,drag=null,frame=0,lastTime=0,scrollFrame=0,morph=null;
  let scrollTop=0,scrollTilt=0,inlineGeometry=null,lastPointer=null,suppressClickUntil=0,previousOverflow='';
  const motion={x:0,y:0,h:1,vx:0,vy:0,vh:0,tx:0,ty:0,th:1};
  let visible=false,idlePhase=0,idleWeight=0,lastPointerTime=0,hovering=false;
  const idleEnabled=()=>config.badgeIdleTilt&&config.ticketTilt&&!config.ticketDisabled&&(compact||opened)&&visible&&!document.hidden&&!reduced.matches&&!drag;
  function updateIdleVisibility(){animateMotion();}
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateIdleVisibility();});
  visibilityObserver.observe(carrier);document.addEventListener('visibilitychange',updateIdleVisibility);
  const rgba=(hex,opacity)=>`rgba(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')},${clamp(opacity,0,100)/100})`;
  ticket.removeAttribute('role');ticket.removeAttribute('tabindex');

  function paint(){
    const scale=Number(carrier.dataset.scale||1)*motion.h;
    const rotation=opened?0:config.ticketRotation;
    const idle=idleOrbit(idlePhase,config.badgeIdleAngle*idleWeight),x=motion.x+idle.x,y=motion.y+idle.y;
    ticket.style.transform=`translate(-50%,-50%) perspective(${config.ticketPerspective}px) rotate(${rotation}deg) rotateX(${x}deg) rotateY(${y}deg) scale(${scale})`;
    const depth=config.ticketTiltMax>0?config.ticketParallax/config.ticketTiltMax:0;
    const px=clamp(-y*depth,-config.ticketParallax,config.ticketParallax),py=clamp(x*depth,-config.ticketParallax,config.ticketParallax);
    photo.style.transform=`translate(${px}px,${py}px)`;
    name.style.transform=`translate(${-px*.22}px,${-py*.22}px)`;
  }
  function tick(now){
    const dt=lastTime?Math.min((now-lastTime)/1000,.04):1/60;lastTime=now;
    const idle=idleEnabled();
    if(idle)idlePhase=(idlePhase+dt*Math.PI*2/config.badgeIdlePeriod)%(Math.PI*2);
    const targetWeight=idle&&now-lastPointerTime>1000?1:0;
    idleWeight+=(targetWeight-idleWeight)*(1-Math.exp(-dt*5));
    for(let step=0;step<3;step++)for(const axis of ['x','y','h']){
      const velocity='v'+axis,target='t'+axis;
      motion[velocity]+=(220*(motion[target]-motion[axis])-24*motion[velocity])/.6*(dt/3);
      motion[axis]+=motion[velocity]*(dt/3);
    }
    paint();
    const resting=['x','y','h'].every(axis=>Math.abs(motion['t'+axis]-motion[axis])+Math.abs(motion['v'+axis])<.008);
    if(resting&&!idle&&idleWeight<.001){for(const axis of ['x','y','h']){motion[axis]=motion['t'+axis];motion['v'+axis]=0;}idleWeight=0;paint();frame=0;lastTime=0;}
    else frame=requestAnimationFrame(tick);
  }
  function animateMotion(){
    if(reduced.matches){motion.x=motion.y=0;motion.h=1;idleWeight=0;paint();return;}
    if(!frame)frame=requestAnimationFrame(tick);
  }
  function targets(){
    let x=0,y=0;
    if(config.ticketTilt&&!reduced.matches&&!drag&&lastPointer){
      const rect=carrier.getBoundingClientRect();
      y=clamp((lastPointer.x-rect.left-rect.width/2)/(rect.width/2+config.ticketTiltReach),-1,1)*config.ticketTiltMax;
      x=-clamp((lastPointer.y-rect.top-rect.height/2)/(rect.height/2+config.ticketTiltReach),-1,1)*config.ticketTiltMax;
    }
    motion.tx=x+(opened||reduced.matches?0:scrollTilt);motion.ty=y;animateMotion();
  }
  function updateScroll(){
    scrollFrame=0;
    const headerHeight=document.querySelector('.site-header')?.getBoundingClientRect().height||0;
    const progress=clamp((window.scrollY+headerHeight-scrollTop)/Math.max(window.innerHeight,hero.offsetHeight),0,1);
    // Negative rotateX brings the top edge toward the viewer.
    scrollTilt=-config.badgeScrollTilt*progress;targets();
  }
  function look(isCompact){
    // One intrinsic compact design scales as a unit, including its insets/type.
    const width=isCompact?100:config.ticketWidth;
    const height=isCompact?width*1.3:config.ticketHeight;
    ticket.classList.toggle('is-compact',isCompact);
    ticket.style.width=width+'px';ticket.style.height=height+'px';ticket.style.minHeight='0';
    surface.style.gridTemplateColumns=isCompact?'minmax(0,1fr) 0px':config.ticketOrientation==='vertical'?'minmax(0,1fr)':`minmax(0,1fr) ${config.ticketPanelSize}px`;
    surface.style.gridTemplateRows=!isCompact&&config.ticketOrientation==='vertical'?`minmax(0,1fr) ${config.ticketPanelSize}px`:'minmax(0,1fr)';
    ticket.dataset.orientation=isCompact?'compact':config.ticketOrientation;
    ticket.dataset.disabled=String(config.ticketDisabled);activation.disabled=config.ticketDisabled;
    ticket.style.borderRadius=(isCompact?Math.min(config.ticketRadius,14):config.ticketRadius)+'px';
    ticket.style.setProperty('--ticket-radius',(isCompact?Math.min(config.ticketRadius,14):config.ticketRadius)+'px');
    ticket.style.setProperty('--ticket-bg',config.ticketBackground);ticket.style.setProperty('--ticket-ink',config.ticketColor);
    ticket.style.setProperty('--ticket-copy-bg',config.ticketCustomPanelBackground?config.ticketPanelBackground:config.ticketBackground);
    ticket.style.setProperty('--ticket-parallax',config.ticketParallax+'px');
    photoWindow.style.borderRadius=(config.ticketAutoImageRadius?Math.max(0,Math.min(config.ticketRadius,isCompact?14:32)-8):config.ticketImageRadius)+'px';
    photoWindow.style.setProperty('--photo-radius',photoWindow.style.borderRadius);
    photo.style.objectPosition=`50% ${config.photoPosition}%`;
    copy.style.padding=config.ticketOrientation==='vertical'?'26px 24px':'30px 20px 30px 26px';
    copy.setAttribute('aria-hidden',String(isCompact));
    name.style.padding=isCompact?'0 8px':'0 24px';name.style.fontSize=(isCompact?Math.min(width*.14,config.ticketNameSize):config.ticketNameSize)+'px';name.style.fontWeight=config.ticketNameWeight;
    heading.style.fontSize=config.ticketHeadingSize+'px';heading.style.fontWeight=config.ticketHeadingWeight;
    bio.style.fontSize=config.ticketBodySize+'px';bio.style.lineHeight=config.ticketBodyLineHeight;bio.style.opacity=config.ticketBodyOpacity/100;
    scrim.hidden=!config.ticketScrim;
    const radians=config.scrimAngle*Math.PI/180;
    const distance=config.scrimDistance,size=config.scrimSize;
    const anchor=100-config.scrimSpread;
    scrim.style.background=`linear-gradient(${config.scrimAngle+90}deg,transparent ${anchor-size}%,${rgba(config.scrimColor,config.scrimOpacity*.18)} ${anchor-size*.72}%,${rgba(config.scrimColor,config.scrimOpacity*.72)} ${anchor-size*.38}%,${rgba(config.scrimColor,config.scrimOpacity)} ${anchor}%)`;
    scrim.style.transform=`translate(${-Math.cos(radians)*distance}%,${Math.sin(radians)*distance}%)`;
    scrim.style.mixBlendMode=config.scrimBlend;
    ticket.style.setProperty('--ticket-border-width',(config.ticketBorder?config.ticketBorderWidth:0)+'px');
    ticket.style.setProperty('--ticket-border-bleed',(config.ticketBorder?.7:0)+'px');
    ticket.style.setProperty('--ticket-border-color',rgba(config.ticketBorderColor,config.ticketBorderOpacity));
    ticket.style.boxShadow=config.ticketShadow?`${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${config.shadowSpread}px ${rgba(config.shadowColor,config.shadowOpacity)}`:'none';
    ticket.setAttribute('aria-label',`${config.ticketName}: ID badge`);
    activation.setAttribute('aria-label',`${config.ticketName}: open ID badge`);
    activation.hidden=opened||busy||!isCompact;dragPlane.hidden=!opened||busy;
    dialog.style.setProperty('--badge-blur',config.badgeBackdropBlur+'px');
  }
  function sizeCarrier(geometry){
    carrier.style.width=geometry.width+'px';carrier.style.height=geometry.height+'px';carrier.dataset.scale=geometry.scale;paint();
  }
  function flip(start,end){
    morph?.cancel();
    if(reduced.matches)return Promise.resolve();
    const dx=start.left+start.width/2-end.left-end.width/2,dy=start.top+start.height/2-end.top-end.height/2;
    morph=carrier.animate([
      {transform:`translate(${dx}px,${dy}px) scale(${start.width/Math.max(1,end.width)},${start.height/Math.max(1,end.height)})`},
      {transform:'translate(0,0) scale(1,1)'}
    ],{duration:config.badgeMorphDuration,easing:'cubic-bezier(.2,.85,.2,1)',fill:'none'});
    return morph.finished.catch(()=>{});
  }
  function layout(animate=true){
    const before=carrier.getBoundingClientRect(),heroWidth=hero.clientWidth;
    const gap=parseFloat(getComputedStyle(hero).columnGap)||32;
    const candidate=fitBadge(config.ticketWidth,config.ticketHeight,Math.max(100,(heroWidth-gap)/2.08-32),Infinity,config.ticketRotation);
    const naturalTextHeight=config.fontSize*config.lineHeight*3+56;
    const nextCompact=!!config.ticketResponsive&&candidate.height<naturalTextHeight*config.badgeCompactTextRatio;
    const changed=nextCompact!==compact;compact=nextCompact;
    hero.classList.toggle('is-compact',compact);
    fitText();
    let compactGeometry;
    if(compact){
      const textRect=h1.getBoundingClientRect(),line=h1.children[Number(h1.dataset.longestLine)]||h1;
      const lineHeight=parseFloat(getComputedStyle(h1).lineHeight);
      compactGeometry=compactBadge(lineHeight,line.getBoundingClientRect().top-textRect.top,config.badgeOverlap,config.badgeCompactScale);
      hero.style.setProperty('--badge-top',(textRect.top-hero.getBoundingClientRect().top-compactGeometry.lift)+'px');
    }
    hero.style.setProperty('--badge-compact-width',(compactGeometry?.width||0)+'px');
    const style=getComputedStyle(ticketStage),available=Math.max(1,ticketStage.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
    inlineGeometry=compact?compactGeometry:fitBadge(config.ticketWidth,config.ticketHeight,available,Infinity,config.ticketRotation);
    // The empty anchor keeps its real geometry while the badge is in the dialog.
    ticketStage.style.setProperty('--badge-anchor-height',inlineGeometry.height+'px');
    if(!opened&&!busy){
      look(compact);sizeCarrier(inlineGeometry);
      if(changed&&!firstLayout&&animate)flip(before,carrier.getBoundingClientRect());
    }else if(opened&&!busy){placeExpanded();}
    firstLayout=false;scrollTop=hero.getBoundingClientRect().top+window.scrollY;updateScroll();
  }
  function placeExpanded(){
    const geometry=fitBadge(config.ticketWidth,config.ticketHeight,Math.max(160,innerWidth-48),Math.max(140,innerHeight-112));
    look(false);sizeCarrier(geometry);
    carrier.style.left=(innerWidth-geometry.width)/2+'px';carrier.style.top=(innerHeight-geometry.height)/2+'px';
  }
  async function open(){
    if(opened||busy||!compact||config.ticketDisabled)return;
    const start=carrier.getBoundingClientRect();busy=true;opened=true;
    previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    ticketStage.classList.add('is-badge-open');
    dialog.showModal();dialog.append(carrier);carrier.classList.add('is-portaled');
    motion.th=1;motion.tx=motion.ty=0;motion.x=motion.y=0;placeExpanded();
    activation.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>dialog.classList.add('is-open'));
    copy.animate([{opacity:0},{opacity:1}],{duration:config.badgeMorphDuration*.65,easing:'ease-out'});
    await flip(start,carrier.getBoundingClientRect());busy=false;dragPlane.hidden=false;suppressClickUntil=performance.now()+150;
    targets();
    if(closeRequested){closeRequested=false;close();}
  }
  async function close(){
    if(!opened)return;
    if(busy){closeRequested=true;return;}
    busy=true;
    const start=carrier.getBoundingClientRect();
    // Remove the drag transform after capturing its actual screen position.
    carrier.style.transform='';drag=null;opened=false;motion.h=motion.th=1;
    const stage=ticketStage.getBoundingClientRect(),style=getComputedStyle(ticketStage);
    look(compact);sizeCarrier(inlineGeometry);
    carrier.style.left=(stage.left+stage.width/2-inlineGeometry.width/2)+'px';
    carrier.style.top=(stage.top+parseFloat(style.paddingTop))+'px';
    dialog.classList.remove('is-open');updateScroll();
    await flip(start,carrier.getBoundingClientRect());
    ticketStage.append(carrier);ticketStage.classList.remove('is-badge-open');carrier.classList.remove('is-portaled');carrier.style.left=carrier.style.top='';
    dialog.close();document.body.style.overflow=previousOverflow;activation.setAttribute('aria-expanded','false');
    busy=false;layout(false);activation.focus({preventScroll:true});
  }
  activation.addEventListener('click',()=>{if(performance.now()>=suppressClickUntil&&!opened)open();});
  closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog&&performance.now()>=suppressClickUntil)close();});
  carrier.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){hovering=true;motion.th=config.badgeHoverScale;animateMotion();}});
  carrier.addEventListener('pointerleave',()=>{hovering=false;motion.th=1;animateMotion();});
  dragPlane.addEventListener('pointerdown',event=>{
    if(!opened||busy||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,lastTime:performance.now(),speed:0,dx:0,dy:0};
    dragPlane.setPointerCapture(event.pointerId);carrier.classList.add('is-dragging');
  });
  dragPlane.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const now=performance.now(),elapsed=Math.max(1,now-drag.lastTime);
    drag.speed=Math.hypot(event.clientX-drag.lastX,event.clientY-drag.lastY)/elapsed;
    drag.lastX=event.clientX;drag.lastY=event.clientY;drag.lastTime=now;drag.dx=event.clientX-drag.x;drag.dy=event.clientY-drag.y;
    carrier.style.transform=`translate(${drag.dx}px,${drag.dy}px) rotate(${clamp(drag.dx/35,-8,8)}deg)`;
  });
  function release(event){
    if(!drag||event.pointerId!==drag.id)return;
    const dismiss=event.type!=='pointercancel'&&shouldDismiss(Math.hypot(drag.dx,drag.dy),drag.speed);
    carrier.classList.remove('is-dragging');suppressClickUntil=performance.now()+300;
    if(dismiss){drag=null;close();}
    else{const from=carrier.style.transform;carrier.style.transform='';drag=null;carrier.animate([{transform:from},{transform:'none'}],{duration:300,easing:'cubic-bezier(.2,.85,.2,1)'});targets();}
  }
  dragPlane.addEventListener('pointerup',release);dragPlane.addEventListener('pointercancel',release);
  document.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||event.target.closest?.('#dan-owner-controls'))return;
    lastPointer={x:event.clientX,y:event.clientY};lastPointerTime=performance.now();if(!drag&&!busy)targets();
  },{passive:true});
  document.addEventListener('pointerleave',()=>{lastPointer=null;targets();});
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  window.visualViewport?.addEventListener('resize',()=>{if(opened&&!busy)placeExpanded();});
  reduced.addEventListener('change',targets);
  return {layout,update:()=>{motion.th=hovering?config.badgeHoverScale:1;layout(false);},open,close,destroy(){cancelAnimationFrame(frame);cancelAnimationFrame(scrollFrame);morph?.cancel();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',updateIdleVisibility);dialog.remove();}};
}
