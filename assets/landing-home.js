import {defaults,normalizeSettings} from './landing-schema.js';
import {createBadge} from './landing-badge.js';
(() => {
  'use strict';
  const root=document.getElementById('dan-landing-home'); if(!root)return;
  const config=normalizeSettings(window.portfolioLandingConfig||{});
  const h1=root.querySelector('.ds-reveal'),intro=root.querySelector('.ds-intro');
  const ticket=root.querySelector('.ds-ticket'),ticketStage=root.querySelector('.ds-ticket-stage');
  const headshot=root.querySelector('.ds-headshot'),photoWindow=root.querySelector('.ds-photo-window');
  const name=root.querySelector('.ds-ticket-footer'),heading=root.querySelector('.ds-ticket-heading');
  const bio=root.querySelector('.ds-bio'),copy=root.querySelector('.ds-ticket-copy');
  const gallery=root.querySelector('.ds-gallery'),panels=[...gallery.querySelectorAll('.ds-panel')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let currentAnimations=[];
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
    const max=config.fontSize,compact=root.querySelector('.ds-hero').classList.contains('is-compact');
    h1.style.fontSize=max+'px';h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    const lines=[...h1.children];
    h1.classList.remove('ds-long');lines.forEach(el=>{el.style.whiteSpace='nowrap';el.style.width='max-content';});
    const widths=lines.map(line=>line.getBoundingClientRect().width);
    const width=Math.max(...widths,1),available=Math.max(1,intro.clientWidth-4);
    h1.dataset.longestLine=String(widths.indexOf(Math.max(...widths)));
    const floor=Math.min(max,18),fitted=max*available/width;
    if(compact||width>available){
      h1.style.fontSize=Math.max(floor,fitted)+'px';
      if(fitted<floor){h1.classList.add('ds-long');lines.forEach(el=>el.style.whiteSpace='normal');}
    }
    lines.forEach(el=>el.style.removeProperty('width'));
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

  const badge=createBadge({root,intro,h1,ticket,ticketStage,config,fitText});
  function render(){renderText();renderGallery();badge.update();}

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

  const resize=()=>{fitText();renderGallery();badge.layout();};
  addEventListener('resize',resize);new ResizeObserver(resize).observe(root);
  document.fonts?.ready.then(resize);
  addEventListener('pagehide',event=>{if(event.persisted)return;badge.destroy();currentAnimations.forEach(a=>a.cancel());});
  const api={
    getConfig:()=>({...config}),
    applyConfig(next,{animateReveal=false}={}){Object.assign(config,normalizeSettings(next,config));render();if(animateReveal)replay();},
    replay,
    revision:null,
    defaults:{...defaults},
    owner:false
  };
  window.portfolioLanding=api;
  render();requestAnimationFrame(()=>requestAnimationFrame(replay));
  async function loadSettings(){
    try{
      const response=await fetch('/api/landing-settings',{credentials:'same-origin',cache:'no-store'});
      if(response.ok){const data=await response.json();api.revision=data.revision;
        if(data.config&&JSON.stringify(data.config)!==JSON.stringify(config))api.applyConfig(data.config);
      }
    }catch{}
    try{
      const response=await fetch('/api/owner',{credentials:'same-origin',cache:'no-store'});
      if(response.ok&&(await response.json()).owner){api.owner=true;const module=await import('./landing-tune.js');module.mountTune(api);}
    }catch{}
  }
  loadSettings();
})();
