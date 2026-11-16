(() => {
  'use strict';
  const root=document.getElementById('dan-landing-home'); if(!root)return;
  const defaults = {
    line1: 'HI 👋 THERE!', line2: '😊 READY TO', line3: 'MAKE 🎨 SOMETHING?',
    bio: 'I work across video, design, print, and photography to make things clear, intentional, and worth looking at.',
    fontSize: 56, fontWeight: 400, lineHeight: 1.17, splitBy: 'characters', stagger: 25, duration: 1000,
    lineDelay: 550, direction: 'alternating', staggerFrom: 'first', animate: true,
    ticketName: 'Dan Smith', ticketHeading: 'Who is Dan?', ticketOrientation: 'horizontal',
    ticketWidth: 460, ticketHeight: 260, ticketPanelSize: 150, ticketRadius: 16,
    ticketImageRadius: 8, ticketAutoImageRadius: true, ticketResponsive: true, ticketScrim: false, photoPosition: 39,
    ticketRotation: 4, ticketTilt: true, ticketTiltMax: 9, ticketTiltReach: 260,
    ticketParallax: 6, ticketPerspective: 1000, ticketBackground: '#111111', ticketColor: '#f5f5f2',
    ticketPanelBackground: '#111111', ticketCustomPanelBackground: false,
    ticketBorder: true, ticketBorderWidth: 1, ticketBorderColor: '#f5f5f2', ticketBorderOpacity: 16,
    ticketDisabled: false, ticketNameSize: 15, ticketNameWeight: 500, ticketHeadingSize: 17,
    ticketHeadingWeight: 500, ticketBodySize: 12, ticketBodyLineHeight: 1.55, ticketBodyOpacity: 50,
    ticketShadow: true, shadowX: 0, shadowY: 12, shadowBlur: 22, shadowSpread: 0,
    shadowOpacity: 8, shadowColor: '#111111',
    galleryHeight: 320, expandRatio: 52, galleryGap: 10, galleryRadius: 16, galleryDuration: 600,
    grayscale: false, activeIndex: 3
  };

  const config={...defaults,...window.portfolioLandingConfig};
  const h1=root.querySelector('.ds-reveal'),intro=root.querySelector('.ds-intro');
  const ticket=root.querySelector('.ds-ticket'),ticketStage=root.querySelector('.ds-ticket-stage');
  const headshot=root.querySelector('.ds-headshot'),photoWindow=root.querySelector('.ds-photo-window');
  const name=root.querySelector('.ds-ticket-footer'),heading=root.querySelector('.ds-ticket-heading');
  const bio=root.querySelector('.ds-bio'),copy=root.querySelector('.ds-ticket-copy');
  const gallery=root.querySelector('.ds-gallery'),panels=[...gallery.querySelectorAll('.ds-panel')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const scrim=document.createElement('div');scrim.className='ds-photo-scrim';photoWindow.append(scrim);
  let currentAnimations=[],motionFrame=0,motionTime=0,drag=null;
  const motion={x:0,y:0,vx:0,vy:0,tx:0,ty:0},lastPointer={x:0,y:0,known:false};
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const rgba=(hex,opacity)=>`rgba(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')},${clamp(opacity,0,100)/100})`;
  const persist=()=>{};
  function segment(text) {
    return typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)].map(x=>x.segment) : Array.from(text);
  }
  function renderText() {
    currentAnimations.forEach(a=>a.cancel()); currentAnimations=[]; h1.replaceChildren();
    const lines = [config.line1,config.line2,config.line3]; h1.setAttribute('aria-label',lines.join(' '));
    lines.forEach((text,index) => {
      const line=document.createElement('span'); line.className='ds-reveal-line'; line.dataset.line=index; line.setAttribute('aria-hidden','true');
      String(text).split(/(\s+)/).filter(Boolean).forEach(word => {
        const wrap=document.createElement('span'); wrap.className=/^\s+$/.test(word)?'ds-space':'ds-word';
        segment(word).forEach(char => {const el=document.createElement('span');el.className='ds-glyph';el.textContent=char;wrap.append(el);}); line.append(wrap);
      });
      if (!text) line.append(document.createTextNode('\u00a0')); h1.append(line);
    });
    name.textContent=config.ticketName; heading.textContent=config.ticketHeading; bio.textContent=config.bio;
    fitText();
  }
  function fitText() {
    const max=config.fontSize; h1.style.fontSize=max+'px';h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    h1.classList.remove('ds-long');h1.querySelectorAll('.ds-reveal-line').forEach(el=>el.style.whiteSpace='nowrap');
    const width=Math.max(...[...h1.children].map(line=>line.scrollWidth),1),available=intro.clientWidth-4;
    if (width>available) {
      const fitted=max*available/width;h1.style.fontSize=Math.max(18,fitted)+'px';
      if(fitted<18){h1.classList.add('ds-long');h1.querySelectorAll('.ds-reveal-line').forEach(el=>el.style.whiteSpace='normal');}
    }
  }
  function replay() {
    currentAnimations.forEach(a=>a.cancel());currentAnimations=[];if(reduced.matches||!config.animate)return;
    [...h1.children].forEach((line,li) => {
      const glyphs=[...line.querySelectorAll('.ds-glyph')],words=[...line.querySelectorAll('.ds-word')],n=glyphs.length;
      const from=config.staggerFrom==='reference'?['first','last','center'][li]:config.staggerFrom;
      const start=config.direction==='down'?-112:config.direction==='up'?112:li===1?-112:112;
      const randomOrder=Array.from({length:config.splitBy==='words'?words.length:n},(_,i)=>i);
      for(let i=randomOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[randomOrder[i],randomOrder[j]]=[randomOrder[j],randomOrder[i]];}
      glyphs.forEach((el,index) => {
        const position=config.splitBy==='lines'?0:config.splitBy==='words'?Math.max(0,words.indexOf(el.closest('.ds-word'))):index;
        const count=config.splitBy==='lines'?1:config.splitBy==='words'?words.length:n;
        const order=from==='last'?count-1-position:from==='center'?Math.abs(position-(count-1)/2):from==='random'?randomOrder[position]||0:position;
        const frames=[];for(let i=0;i<=50;i++){const t=i/50*config.duration/1000,decay=Math.exp(-10.5*t)*(Math.cos(9.47365*t)+10.5/9.47365*Math.sin(9.47365*t));frames.push({transform:`translateY(${i===50?0:start*decay}%)`,offset:i/50});}
        currentAnimations.push(el.animate(frames,{duration:config.duration,delay:li*config.lineDelay+order*config.stagger,easing:'linear',fill:'both'}));
      });
    });
  }
  function selectPanel(index,save=true) {
    config.activeIndex=(index+panels.length)%panels.length;
    panels.forEach((el,i) => {const active=i===config.activeIndex;el.dataset.focused=String(active);el.style.flexGrow=active?config.expandRatio*(panels.length-1)/(100-config.expandRatio):1;el.querySelector('img').style.filter=config.grayscale&&!active?'grayscale(1)':'none';});
    if(save)persist();
  }
  function renderGallery() {
    gallery.style.height=config.galleryHeight+'px';gallery.style.gap=config.galleryGap+'px';gallery.style.setProperty('--mobile-expanded',Math.min(360,config.galleryHeight)+'px');
    panels.forEach(p=>{p.style.borderRadius=config.galleryRadius+'px';p.style.transitionDuration=config.galleryDuration+'ms';});
    gallery.style.setProperty('--media-width',Math.max(140,(gallery.clientWidth-config.galleryGap*(panels.length-1))*config.expandRatio/100*1.22)+'px');selectPanel(config.activeIndex,false);
  }

  // The same spring and parallax ratios used by the reference, without any tear simulation.
  function paintTicket() {
    ticket.style.transform=`perspective(${config.ticketPerspective}px) rotate(${config.ticketRotation}deg) rotateX(${motion.x}deg) rotateY(${motion.y}deg)`;
    const depth=config.ticketTiltMax>0?config.ticketParallax/config.ticketTiltMax:0;
    headshot.style.transform=`translate(${-motion.y*depth}px,${motion.x*depth}px)`;
    name.style.transform=`translate(${motion.y*depth*.22}px,${-motion.x*depth*.22}px)`;
  }
  function tickTicket(now) {
    const elapsed=motionTime?Math.min((now-motionTime)/1000,.04):1/60;motionTime=now;
    for(let step=0;step<3;step++){const dt=elapsed/3;for(const axis of ['x','y']){const velocity='v'+axis,target='t'+axis;motion[velocity]+=(220*(motion[target]-motion[axis])-24*motion[velocity])/.6*dt;motion[axis]+=motion[velocity]*dt;}}
    paintTicket();
    const resting=Math.abs(motion.tx-motion.x)+Math.abs(motion.ty-motion.y)+Math.abs(motion.vx)+Math.abs(motion.vy)<.008;
    if(resting){motion.x=motion.tx;motion.y=motion.ty;motion.vx=motion.vy=0;paintTicket();motionFrame=0;motionTime=0;}else motionFrame=requestAnimationFrame(tickTicket);
  }
  function pointTicket(x,y) {
    const active=config.ticketTilt&&!config.ticketDisabled&&!reduced.matches&&!drag;
    const box=ticket.getBoundingClientRect();
    motion.ty=active?clamp((x-(box.left+box.width/2))/(box.width/2+config.ticketTiltReach),-1,1)*config.ticketTiltMax:0;
    motion.tx=active?-clamp((y-(box.top+box.height/2))/(box.height/2+config.ticketTiltReach),-1,1)*config.ticketTiltMax:0;
    if(reduced.matches){motion.x=motion.y=motion.vx=motion.vy=0;paintTicket();return;}
    if(!motionFrame)motionFrame=requestAnimationFrame(tickTicket);
  }
  function renderTicket() {
    const vertical=config.ticketOrientation==='vertical',angle=Math.abs(config.ticketRotation)*Math.PI/180;
    const stageStyle=getComputedStyle(ticketStage),available=ticketStage.clientWidth-parseFloat(stageStyle.paddingLeft)-parseFloat(stageStyle.paddingRight);
    const rotationAllowance=Math.sin(angle)*Math.min(config.ticketHeight,460);
    const width=Math.min(config.ticketWidth,Math.max(170,(available-rotationAllowance)/Math.max(.8,Math.cos(angle))));
    const compact=config.ticketResponsive&&width<340;
    ticket.style.width=width+'px';ticket.style.minHeight=config.ticketHeight+'px';
    ticket.style.gridTemplateColumns=vertical?'minmax(0,1fr)':`minmax(0,1fr) ${Math.min(config.ticketPanelSize,width*(compact ? .5 : .62))}px`;
    ticket.style.gridTemplateRows=vertical?`minmax(140px,1fr) auto`:'';
    ticket.dataset.orientation=config.ticketOrientation;ticket.dataset.disabled=String(config.ticketDisabled);ticket.inert=config.ticketDisabled;
    ticket.style.borderRadius=config.ticketRadius+'px';ticket.style.setProperty('--ticket-bg',config.ticketBackground);
    ticket.style.setProperty('--ticket-ink',config.ticketColor);ticket.style.setProperty('--ticket-copy-bg',config.ticketCustomPanelBackground?config.ticketPanelBackground:config.ticketBackground);
    ticket.style.setProperty('--ticket-parallax',config.ticketParallax+'px');ticketStage.style.perspective='none';
    photoWindow.style.borderRadius=(config.ticketAutoImageRadius?Math.max(0,config.ticketRadius-8):config.ticketImageRadius)+'px';headshot.style.objectPosition=`50% ${config.photoPosition}%`;
    copy.style.padding=vertical?'32px 24px 30px':compact?'26px 14px 26px 18px':'30px 20px 30px 26px';copy.style.minHeight=vertical?config.ticketPanelSize+'px':'';
    name.style.padding=compact?'0 16px':'0 24px';name.style.fontSize=config.ticketNameSize+'px';name.style.fontWeight=config.ticketNameWeight;
    heading.style.fontSize=config.ticketHeadingSize+'px';heading.style.fontWeight=config.ticketHeadingWeight;
    bio.style.fontSize=config.ticketBodySize+'px';bio.style.lineHeight=config.ticketBodyLineHeight;bio.style.opacity=config.ticketBodyOpacity/100;
    scrim.hidden=!config.ticketScrim;
    ticket.style.setProperty('--ticket-border-width',(config.ticketBorder?config.ticketBorderWidth:0)+'px');
    ticket.style.setProperty('--ticket-border-color',rgba(config.ticketBorderColor,config.ticketBorderOpacity));
    const shadows=[];
    if(config.ticketShadow)shadows.push(`${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${config.shadowSpread}px ${rgba(config.shadowColor,config.shadowOpacity)}`);
    ticket.style.boxShadow=shadows.join(',')||'none';
    if(lastPointer.known)pointTicket(lastPointer.x,lastPointer.y);else paintTicket();
  }
  function render(){renderText();renderTicket();renderGallery();}


  panels.forEach((panel,i)=>{
    let touchExpanding=false;
    panel.addEventListener('pointerdown',event=>{touchExpanding=event.pointerType==='touch'&&config.activeIndex!==i;});
    panel.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')selectPanel(i);});
    panel.addEventListener('focus',()=>selectPanel(i));
    // Capture before the site's video-modal and project-shelf click handlers.
    panel.addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      if(touchExpanding||config.activeIndex!==i){event.preventDefault();event.stopImmediatePropagation();selectPanel(i);}
      touchExpanding=false;
    },{capture:true});
    panel.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key))return;
      event.preventDefault();selectPanel(event.key==='Home'?0:event.key==='End'?panels.length-1:config.activeIndex+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1));panels[config.activeIndex].focus();
    });
  });
  document.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    lastPointer.x=event.clientX;lastPointer.y=event.clientY;lastPointer.known=true;pointTicket(event.clientX,event.clientY);
  },{passive:true});
  document.addEventListener('pointerleave',()=>{motion.tx=motion.ty=0;if(!motionFrame)motionFrame=requestAnimationFrame(tickTicket);});
  const resize=()=>{fitText();renderGallery();renderTicket();};
  addEventListener('resize',resize);new ResizeObserver(resize).observe(root);
  document.fonts?.ready.then(resize);
  addEventListener('pagehide',()=>{cancelAnimationFrame(motionFrame);currentAnimations.forEach(a=>a.cancel());},{once:true});
  render();requestAnimationFrame(()=>requestAnimationFrame(replay));
})();
