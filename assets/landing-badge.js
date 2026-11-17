import {clamp,fitBadge,shouldDismiss,compactBadge,blendIdlePose,scalePixelStyles,entranceDelay} from './badge-math.js';

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
  let morphParts=[],morphGeneration=0,morphing=false,entrance=null,hasEntered=false;
  carrier.style.visibility='hidden';
  const motion={x:0,y:0,h:1,vx:0,vy:0,vh:0,tx:0,ty:0,th:1};
  let visible=false,idlePhase=0,idleWeight=0,lastPointerTime=0,hovering=false;
  let idleTarget=0,idleFrom=0,idleTransition=0;
  const idleEnabled=()=>config.badgeIdleTilt&&config.ticketTilt&&!config.ticketDisabled&&(compact||opened)&&visible&&!document.hidden&&!reduced.matches&&!drag;
  function updateIdleVisibility(){
    if(!visible||document.hidden){
      const pose=blendIdlePose(motion.x,motion.y,opened?0:scrollTilt,idlePhase,config.badgeIdleAngle,idleWeight);
      motion.x=motion.tx=pose.x;motion.y=motion.ty=pose.y;motion.vx=motion.vy=0;
      idleWeight=idleFrom=idleTarget=0;idleTransition=performance.now();
    }
    animateMotion();
  }
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateIdleVisibility();});
  visibilityObserver.observe(carrier);document.addEventListener('visibilitychange',updateIdleVisibility);
  const rgba=(hex,opacity)=>`rgba(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')},${clamp(opacity,0,100)/100})`;
  ticket.removeAttribute('role');ticket.removeAttribute('tabindex');

  function paint(){
    const scale=motion.h;
    const rotation=opened?0:config.ticketRotation;
    const {x,y}=blendIdlePose(motion.x,motion.y,opened?0:scrollTilt,idlePhase,config.badgeIdleAngle,idleWeight);
    ticket.style.transform=`translate(-50%,-50%) perspective(${config.ticketPerspective}px) rotate(${rotation}deg) rotateX(${x}deg) rotateY(${y}deg) scale(${scale})`;
    const parallax=config.ticketParallax*Number(carrier.dataset.scale||1);
    const depth=config.ticketTiltMax>0?parallax/config.ticketTiltMax:0;
    const px=clamp(-y*depth,-parallax,parallax),py=clamp(x*depth,-parallax,parallax);
    photo.style.transform=`translate(${px}px,${py}px)`;
    name.style.transform=`translate(${-px*.22}px,${-py*.22}px)`;
  }
  function tick(now){
    const dt=lastTime?Math.min((now-lastTime)/1000,.04):1/60;lastTime=now;
    const idle=idleEnabled();
    if(idle)idlePhase=(idlePhase+dt*Math.PI*2/config.badgeIdlePeriod)%(Math.PI*2);
    const targetWeight=idle&&!busy&&!morphing&&now-lastPointerTime>1000?1:0;
    if(targetWeight!==idleTarget){
      idleFrom=idleWeight;idleTarget=targetWeight;idleTransition=now;
      if(idleTarget&&idleFrom<.001)idlePhase=Math.atan2(motion.x-(opened?0:scrollTilt),motion.y);
    }
    const elapsed=clamp((now-idleTransition)/(idleTarget?config.badgeIdleEase:Math.min(400,config.badgeIdleEase)),0,1);
    const ease=elapsed*elapsed*(3-2*elapsed);
    idleWeight=idleFrom+(idleTarget-idleFrom)*ease;
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
  function look(isCompact,geometry){
    // Paint physical dimensions once. Typography/insets scale as a single design.
    const {width,height,scale}=geometry;
    ticket.classList.toggle('is-compact',isCompact);
    ticket.style.width=width+'px';ticket.style.height=height+'px';ticket.style.minHeight='0';
    const panel=(isCompact?0:config.ticketPanelSize)*scale;
    surface.style.gridTemplateColumns=config.ticketOrientation==='vertical'?'minmax(0,1fr)':`minmax(0,1fr) ${panel}px`;
    surface.style.gridTemplateRows=config.ticketOrientation==='vertical'?`minmax(0,1fr) ${panel}px`:'minmax(0,1fr)';
    ticket.dataset.orientation=isCompact?'compact':config.ticketOrientation;
    ticket.dataset.disabled=String(config.ticketDisabled);activation.disabled=config.ticketDisabled;
    ticket.style.borderRadius=((isCompact?Math.min(config.ticketRadius,14):config.ticketRadius)*scale)+'px';
    ticket.style.setProperty('--ticket-radius',ticket.style.borderRadius);
    ticket.style.setProperty('--ticket-bg',config.ticketBackground);ticket.style.setProperty('--ticket-ink',config.ticketColor);
    ticket.style.setProperty('--ticket-copy-bg',config.ticketCustomPanelBackground?config.ticketPanelBackground:config.ticketBackground);
    ticket.style.setProperty('--ticket-parallax',config.ticketParallax*scale+'px');
    photoWindow.style.borderRadius=((config.ticketAutoImageRadius?Math.max(0,Math.min(config.ticketRadius,isCompact?14:32)-8):config.ticketImageRadius)*scale)+'px';
    photoWindow.style.setProperty('--photo-radius',photoWindow.style.borderRadius);
    photoWindow.style.top=photoWindow.style.left=photoWindow.style.right=(isCompact?6:8)*scale+'px';
    photoWindow.style.height=`calc(${isCompact?76:78}% - ${(isCompact?6:16)*scale}px)`;
    photo.style.objectPosition=`50% ${config.photoPosition}%`;
    copy.style.padding=(config.ticketOrientation==='vertical'?[26,24]:[30,20,30,26]).map(n=>n*scale+'px').join(' ');
    copy.setAttribute('aria-hidden',String(isCompact));
    name.style.padding=`0 ${(isCompact?8:24)*scale}px`;name.style.fontSize=(isCompact?Math.min(14,config.ticketNameSize):config.ticketNameSize)*scale+'px';name.style.fontWeight=config.ticketNameWeight;
    heading.style.fontSize=config.ticketHeadingSize*scale+'px';heading.style.fontWeight=config.ticketHeadingWeight;heading.style.marginBottom=8*scale+'px';
    bio.style.fontSize=config.ticketBodySize*scale+'px';bio.style.lineHeight=config.ticketBodyLineHeight;bio.style.opacity=config.ticketBodyOpacity/100;
    scrim.hidden=!config.ticketScrim;
    const radians=config.scrimAngle*Math.PI/180;
    const distance=config.scrimDistance,size=config.scrimSize;
    const anchor=100-config.scrimSpread;
    scrim.style.background=`linear-gradient(${config.scrimAngle+90}deg,transparent ${anchor-size}%,${rgba(config.scrimColor,config.scrimOpacity*.18)} ${anchor-size*.72}%,${rgba(config.scrimColor,config.scrimOpacity*.72)} ${anchor-size*.38}%,${rgba(config.scrimColor,config.scrimOpacity)} ${anchor}%)`;
    scrim.style.transform=`translate(${-Math.cos(radians)*distance}%,${Math.sin(radians)*distance}%)`;
    scrim.style.mixBlendMode=config.scrimBlend;
    ticket.style.setProperty('--ticket-border-width',(config.ticketBorder?config.ticketBorderWidth*scale:0)+'px');
    ticket.style.setProperty('--ticket-border-bleed',(config.ticketBorder?.7*scale:0)+'px');
    ticket.style.setProperty('--ticket-border-color',rgba(config.ticketBorderColor,config.ticketBorderOpacity));
    ticket.style.boxShadow=config.ticketShadow?`${config.shadowX*scale}px ${config.shadowY*scale}px ${config.shadowBlur*scale}px ${config.shadowSpread*scale}px ${rgba(config.shadowColor,config.shadowOpacity)}`:'none';
    ticket.setAttribute('aria-label',`${config.ticketName}: ID badge`);
    activation.setAttribute('aria-label',`${config.ticketName}: open ID badge`);
    activation.hidden=opened||busy||!isCompact;dragPlane.hidden=!opened||busy;
    dialog.style.setProperty('--badge-blur',config.badgeBackdropBlur+'px');
  }
  function sizeCarrier(geometry){
    carrier.style.width=geometry.width+'px';carrier.style.height=geometry.height+'px';carrier.dataset.scale=geometry.scale;paint();
  }
  function captureLook(){
    const read=(element,properties)=>Object.fromEntries(properties.map(key=>[key,getComputedStyle(element)[key]]));
    const matrix=new DOMMatrixReadOnly(getComputedStyle(carrier).transform);
    const scale=motion.h*Math.hypot(matrix.a,matrix.b);
    return Object.fromEntries([
      ['ticket',ticket,['width','height','borderRadius','boxShadow']],['surface',surface,['gridTemplateColumns','gridTemplateRows']],
      ['photo',photoWindow,['height','top','left','right','borderRadius']],['name',name,['fontSize','padding']],
      ['copy',copy,['padding']],['heading',heading,['fontSize','marginBottom']],['bio',bio,['fontSize','lineHeight']]
    ].map(([key,el,properties])=>[key,scalePixelStyles(read(el,properties),scale)]));
  }
  function cancelEntrance(){entrance?.cancel();entrance=null;if(hasEntered)carrier.style.visibility='visible';}
  function settleHover(){hovering=carrier.matches(':hover');motion.th=!busy&&!morphing&&hovering?config.badgeHoverScale:1;animateMotion();}
  function flip(start,end,from){
    const generation=++morphGeneration;cancelEntrance();
    morphParts.forEach(a=>a.cancel());morphParts=[];motion.h=motion.th=1;motion.vh=0;paint();
    if(reduced.matches){morphing=false;return Promise.resolve();}
    end=carrier.getBoundingClientRect();
    morphing=true;
    const to=captureLook();
    const dx=start.left+start.width/2-end.left-end.width/2,dy=start.top+start.height/2-end.top-end.height/2;
    // One direct physical size interpolation prevents the old size*scale bulge.
    const options={duration:config.badgeMorphDuration,easing:'cubic-bezier(.2,.85,.2,1)',fill:'none'};
    morph=carrier.animate([
      {transform:`translate(${dx}px,${dy}px)`},
      {transform:'translate(0,0)'}
    ],options);
    morphParts=[morph,...[[ticket,'ticket'],[surface,'surface'],[photoWindow,'photo'],[name,'name'],[copy,'copy'],[heading,'heading'],[bio,'bio']].map(([el,key])=>el.animate([from[key],to[key]],options))];
    return Promise.all(morphParts.map(a=>a.finished.catch(()=>{}))).then(()=>{if(generation===morphGeneration){morphing=false;settleHover();}});
  }
  function layout(animate=true){
    const before=carrier.getBoundingClientRect(),from=captureLook(),heroWidth=hero.clientWidth;
    const nextCompact=!!config.ticketResponsive&&innerWidth<=config.badgeBreakpoint;
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
      look(compact,inlineGeometry);sizeCarrier(inlineGeometry);
      if(changed&&!firstLayout&&animate)flip(before,carrier.getBoundingClientRect(),from);
    }else if(opened&&!busy){placeExpanded();}
    firstLayout=false;scrollTop=hero.getBoundingClientRect().top+window.scrollY;updateScroll();
  }
  function placeExpanded(){
    const bounds=dialog.getBoundingClientRect(),width=bounds.width||innerWidth,height=bounds.height||innerHeight;
    const geometry=fitBadge(config.ticketWidth,config.ticketHeight,width*config.badgeExpandedWidth/100,Math.max(140,height*config.badgeExpandedHeight/100),0,true);
    look(false,geometry);sizeCarrier(geometry);
    carrier.style.left=(bounds.left+(width-geometry.width)/2)+'px';carrier.style.top=(bounds.top+(height-geometry.height)/2)+'px';
  }
  async function open(){
    if(opened||busy||!compact||config.ticketDisabled)return;
    const start=carrier.getBoundingClientRect(),from=captureLook();busy=true;opened=true;
    previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    ticketStage.classList.add('is-badge-open');
    dialog.showModal();dialog.append(carrier);carrier.classList.add('is-portaled');
    motion.th=1;motion.tx=motion.ty=0;placeExpanded();
    activation.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>dialog.classList.add('is-open'));
    copy.animate([{opacity:0},{opacity:1}],{duration:config.badgeMorphDuration*.65,easing:'ease-out'});
    await flip(start,carrier.getBoundingClientRect(),from);busy=false;dragPlane.hidden=false;suppressClickUntil=performance.now()+150;
    settleHover();targets();
    if(closeRequested){closeRequested=false;close();}
  }
  async function close(){
    if(!opened)return;
    if(busy){closeRequested=true;return;}
    busy=true;
    const start=carrier.getBoundingClientRect(),from=captureLook();
    // Remove the drag transform after capturing its actual screen position.
    carrier.style.transform='';drag=null;opened=false;motion.h=motion.th=1;
    const stage=ticketStage.getBoundingClientRect(),style=getComputedStyle(ticketStage);
    look(compact,inlineGeometry);sizeCarrier(inlineGeometry);
    carrier.style.left=(stage.left+stage.width/2-inlineGeometry.width/2)+'px';
    carrier.style.top=(stage.top+parseFloat(style.paddingTop))+'px';
    dialog.classList.remove('is-open');updateScroll();
    await flip(start,carrier.getBoundingClientRect(),from);
    ticketStage.append(carrier);ticketStage.classList.remove('is-badge-open');carrier.classList.remove('is-portaled');carrier.style.left=carrier.style.top='';
    dialog.close();document.body.style.overflow=previousOverflow;activation.setAttribute('aria-expanded','false');
    busy=false;layout(false);settleHover();activation.focus({preventScroll:true});
  }
  activation.addEventListener('click',()=>{if(performance.now()>=suppressClickUntil&&!opened)open();});
  closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog&&performance.now()>=suppressClickUntil)close();});
  carrier.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!busy&&!morphing){hovering=true;motion.th=config.badgeHoverScale;animateMotion();}});
  carrier.addEventListener('pointerleave',()=>{hovering=false;if(!busy&&!morphing){motion.th=1;animateMotion();}});
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
  function enter(lineTimes){
    cancelEntrance();hasEntered=true;carrier.style.visibility='visible';
    if(!config.badgeEntrance||reduced.matches||opened||busy)return;
    const bounce=config.badgeEntranceBounce/100;
    const animation=carrier.animate([
      {transform:'scale(0)',visibility:'hidden',offset:0},
      {transform:'scale(.18)',visibility:'visible',offset:.01},
      {transform:`scale(${1+bounce})`,visibility:'visible',offset:.72},
      {transform:'scale(1)',visibility:'visible',offset:1}
    ],{duration:config.badgeEntranceDuration,delay:entranceDelay(config.badgeEntrancePosition,lineTimes),easing:'cubic-bezier(.16,.8,.3,1)',fill:'backwards'});
    entrance=animation;animation.finished.catch(()=>{}).then(()=>{if(entrance===animation)entrance=null;});
  }
  return {layout,enter,update:()=>{if(!busy&&!morphing)motion.th=hovering?config.badgeHoverScale:1;layout(false);},open,close,destroy(){cancelAnimationFrame(frame);cancelAnimationFrame(scrollFrame);cancelEntrance();morphParts.forEach(a=>a.cancel());visibilityObserver.disconnect();document.removeEventListener('visibilitychange',updateIdleVisibility);dialog.remove();}};
}
