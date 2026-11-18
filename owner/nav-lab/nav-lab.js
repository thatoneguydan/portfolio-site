// Original, dependency-free local recreation of the keycap visual reference.
const STORE='portfolio-nav-lab-v1';
const defaults={style:'graphite',device:'auto',height:138,depth:10,gap:10,radius:15,text:17,ledColor:'#f4fbff',ledSize:6,glow:15,strength:85,page:'home'};
const pages={home:{path:'/',title:'Home'},video:{path:'/video/',title:'Video'},design:{path:'/design/',title:'Design'},photo:{path:'/photo/',title:'Photo'},contact:{path:'/contact/',title:'Contact'}};
const presets={graphite:{depth:10,radius:15},porcelain:{depth:10,radius:15},'low-profile':{depth:4,radius:8}};
const numberRanges={height:[84,200],depth:[2,20],gap:[0,24],radius:[4,32],text:[10,28],ledSize:[3,12],glow:[0,36],strength:[0,100]};
function normalize(input={}){const out={...defaults};for(const [key,[min,max]]of Object.entries(numberRanges)){const v=Number(input[key]);if(Number.isFinite(v))out[key]=Math.max(min,Math.min(max,v));}if(Object.hasOwn(presets,input.style))out.style=input.style;if(['auto','390','768','1280'].includes(input.device))out.device=input.device;if(/^#[a-f0-9]{6}$/i.test(input.ledColor||''))out.ledColor=input.ledColor;if(Object.hasOwn(pages,input.page))out.page=input.page;return out;}
let config=(()=>{try{return normalize(JSON.parse(localStorage.getItem(STORE)||'{}'));}catch{return {...defaults};}})();
const root=document.documentElement,device=document.querySelector('.navlab-device'),bar=document.querySelector('.navlab-bar'),menu=document.querySelector('.navlab-menu'),preview=document.querySelector('.navlab-preview'),status=document.querySelector('.navlab-loading'),controls=document.querySelector('.navlab-controls'),launcher=document.querySelector('.navlab-launcher');
const links=[...document.querySelectorAll('a[data-page]')];let frame=null,pending=null,generation=0;
function save(){try{localStorage.setItem(STORE,JSON.stringify(config));}catch{}}
function closeMenu(){if(getComputedStyle(menu).display!=='none'&&document.activeElement?.closest('.navlab-pages'))menu.focus();bar.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
function paint(){
  document.body.dataset.style=config.style;device.style.setProperty('--preview-width',config.device==='auto'?'100%':config.device+'px');
  const props={height:'key-height',depth:'key-depth',gap:'key-gap',radius:'key-radius',text:'key-text',ledSize:'led-size',glow:'led-glow'};
  for(const [key,prop]of Object.entries(props))root.style.setProperty('--'+prop,config[key]+'px');
  root.style.setProperty('--led-color',config.ledColor);root.style.setProperty('--led-alpha',config.strength/100);
  for(const input of controls.querySelectorAll('[name]')){input.value=config[input.name];const output=controls.querySelector(`[data-for="${input.name}"]`);if(output)output.value=config[input.name]+(input.name==='strength'?'%':'px');}
  for(const link of links)if(link.dataset.page===config.page)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  menu.dataset.hasPage=String(config.page!=='home');menu.querySelector('.navlab-label').textContent=config.page==='home'?'Menu':pages[config.page].title;
  document.querySelector('[data-open-page]').href=pages[config.page].path;
  positionControls();
}
const waitFrame=win=>new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
async function selectPage(key,{initial=false}={}){
  if(!Object.hasOwn(pages,key))return;config.page=key;paint();save();closeMenu();
  if(!initial)history.replaceState(null,'','#'+key);
  const run=++generation;pending?.remove();status.hidden=false;status.textContent='Opening '+pages[key].title+'…';
  const next=document.createElement('iframe');next.className='navlab-frame';next.title=pages[key].title+' — site preview';next.name='navlab-preview';next.setAttribute('inert','');next.setAttribute('aria-hidden','true');next.setAttribute('allow','autoplay; fullscreen; picture-in-picture');
  pending=next;
  next.addEventListener('load',async()=>{
    if(run!==generation)return;
    try{
      const doc=next.contentDocument;
      if(!doc)throw new Error('Preview unavailable');
      const style=doc.createElement('style');style.dataset.navLabIsolation='';
      style.textContent='.site-header,#dan-owner-controls{display:none!important}html{scrollbar-gutter:stable}body{padding-top:0!important}';doc.head.append(style);doc.addEventListener('pointerdown',closeMenu,{passive:true});
      // The embedded page keeps its own layout and interactions; only its local
      // header is hidden. No parent/global stylesheet or saved setting is edited.
      await Promise.race([doc.fonts?.ready||Promise.resolve(),new Promise(resolve=>setTimeout(resolve,1600))]);
      if(run!==generation||!next.contentWindow)return;
      await waitFrame(next.contentWindow);
      if(run!==generation)return;
      next.removeAttribute('inert');next.removeAttribute('aria-hidden');next.classList.add('is-ready');status.hidden=true;
      const previous=frame;frame=next;pending=null;
      if(previous&&previous!==next){previous.setAttribute('inert','');previous.setAttribute('aria-hidden','true');previous.classList.add('is-leaving');setTimeout(()=>previous.remove(),280);}
    }catch(error){if(run!==generation)return;status.textContent='Preview could not load. Use “Open page normally” in Tune.';next.remove();if(pending===next)pending=null;}
  });
  next.src=pages[key].path+'?inlineShelf=1&navLab=1';preview.append(next);
}
for(const link of links){
  link.addEventListener('click',event=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();if(config.page===link.dataset.page&&frame){closeMenu();return;}selectPage(link.dataset.page);});
  link.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const index=links.indexOf(link),next=event.key==='Home'?0:event.key==='End'?links.length-1:(index+(event.key==='ArrowRight'?1:-1)+links.length)%links.length;links[next].focus();});
}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';bar.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
document.addEventListener('click',event=>{if(!bar.contains(event.target))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();if(!controls.hidden){controls.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus();}}});
const image=document.querySelector('.navlab-mark img'),mark=image.parentElement;
function cropMark(){
  if(!image.naturalWidth)return;
  try{const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let x=c.width,y=c.height,bottom=0;
    for(let row=0;row<c.height;row++)for(let col=0;col<c.width;col++)if(pixels[(row*c.width+col)*4+3]>24){x=Math.min(x,col);y=Math.min(y,row);bottom=Math.max(bottom,row);}
    const size=bottom-y+1;if(size<=0)throw new Error('Empty logo');
    Object.assign(image.style,{left:-x/size*100+'%',top:-y/size*100+'%',width:c.width/size*100+'%',height:c.height/size*100+'%'});mark.dataset.ready='true';
  }catch{image.src='/favicon.png';Object.assign(image.style,{inset:'0',width:'100%',height:'100%'});mark.dataset.ready='true';}
}
image.addEventListener('load',cropMark);image.addEventListener('error',()=>{image.src='/favicon.png';Object.assign(image.style,{inset:'0',width:'100%',height:'100%'});mark.dataset.ready='true';},{once:true});if(image.complete)cropMark();
function positionControls(){if(controls.hidden)return;const r=launcher.getBoundingClientRect(),width=Math.min(360,innerWidth-24);controls.style.width=width+'px';controls.style.maxHeight=Math.max(120,innerHeight-32-60)+'px';controls.style.left=Math.max(12,Math.min(innerWidth-width-12,r.right-width))+'px';const h=Math.min(controls.scrollHeight,innerHeight-92);controls.style.top=(r.top-h-10>=12?r.top-h-10:Math.min(innerHeight-h-12,r.bottom+10))+'px';}
let drag=null,moved=false;
launcher.addEventListener('pointerdown',event=>{if(event.button!==0)return;const r=launcher.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top};moved=false;launcher.setPointerCapture(event.pointerId);});
launcher.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>5)moved=true;if(!moved)return;const tools=launcher.parentElement;tools.style.right='auto';tools.style.bottom='auto';tools.style.left=Math.max(12,Math.min(innerWidth-launcher.offsetWidth-12,drag.left+dx))+'px';tools.style.top=Math.max(12,Math.min(innerHeight-launcher.offsetHeight-12,drag.top+dy))+'px';positionControls();});
launcher.addEventListener('pointerup',()=>{drag=null;});launcher.addEventListener('pointercancel',()=>{drag=null;});
launcher.addEventListener('click',()=>{if(moved){moved=false;return;}controls.hidden=!controls.hidden;launcher.setAttribute('aria-expanded',String(!controls.hidden));positionControls();});
document.querySelector('.navlab-close').addEventListener('click',()=>{controls.hidden=true;launcher.setAttribute('aria-expanded','false');launcher.focus();});
controls.addEventListener('input',event=>{const input=event.target;if(!input.name)return;const previousStyle=config.style;config=normalize({...config,[input.name]:input.type==='range'?Number(input.value):input.value});if(input.name==='style'&&config.style!==previousStyle)Object.assign(config,presets[config.style]);paint();save();});
document.querySelector('[data-reset]').addEventListener('click',()=>{const page=config.page;config={...defaults,page};paint();save();});
addEventListener('resize',()=>{const tools=launcher.parentElement;if(tools.style.left){const r=launcher.getBoundingClientRect();tools.style.left=Math.max(12,Math.min(innerWidth-launcher.offsetWidth-12,r.left))+'px';tools.style.top=Math.max(12,Math.min(innerHeight-launcher.offsetHeight-12,r.top))+'px';}if(device.clientWidth>720)closeMenu();positionControls();});
addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(Object.hasOwn(pages,key)&&key!==config.page)selectPage(key);});
const initial=location.hash.slice(1);if(Object.hasOwn(pages,initial))config.page=initial;
paint();selectPage(config.page,{initial:true});
