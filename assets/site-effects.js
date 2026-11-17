import {installAuthoredEmoji} from './site-emoji.js';
import {defaults} from './landing-schema.js';

const href='/assets/site-effects.css?v=20261116-emoji1';
let stylesheet=document.querySelector('link[href^="/assets/site-effects.css"]');
if(!stylesheet){stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=href;document.head.append(stylesheet);}
if(!stylesheet.sheet)await new Promise(resolve=>{stylesheet.addEventListener('load',resolve,{once:true});stylesheet.addEventListener('error',resolve,{once:true});});
installAuthoredEmoji();

let config={...defaults,...window.portfolioLandingConfig};
const cards=new Set(),seen=new WeakSet();
function apply(card){
  card.classList.toggle('has-progressive-blur',!!config.portfolioBlur);
  const blur=card.querySelector('.portfolio-blur');if(!blur)return;
  blur.style.height=config.portfolioBlurHeight+'%';blur.style.transitionDuration=config.portfolioBlurDuration+'ms';
  [...blur.children].forEach((layer,i)=>{const filter=`blur(${config.portfolioBlurStrength*(i+1)/6}px)`;layer.style.backdropFilter=filter;layer.style.webkitBackdropFilter=filter;});
}
function ensure(card){
  if(!config.portfolioBlur||card.querySelector('.portfolio-blur'))return;
  const media=card.matches('.ds-panel')?card:card.querySelector('.rdp-project-media,.rv-video-thumb');if(!media)return;
  const blur=document.createElement('span');blur.className='portfolio-blur';blur.setAttribute('aria-hidden','true');
  // Adapted from Motion Primitives Progressive Blur; see THIRD-PARTY-NOTICES.
  for(let i=0;i<6;i++){
    const layer=document.createElement('span');const stops=[i,i+1,i+2,i+3].map((n,j)=>`rgba(255,255,255,${j===1||j===2?1:0}) ${n/7*100}%`);
    const mask=`linear-gradient(180deg,${stops.join(',')})`;layer.style.maskImage=mask;layer.style.webkitMaskImage=mask;blur.append(layer);
  }
  media.append(blur);apply(card);
}
function discover(root){
  if(root.nodeType!==1)return;
  const selector='.ds-panel,.rdp-project-card,.rv-video-card';
  const found=[...(root.matches(selector)?[root]:[]),...root.querySelectorAll(selector)];
  for(const card of found){
    if(seen.has(card))continue;seen.add(card);cards.add(card);apply(card);
    card.addEventListener('pointerenter',()=>ensure(card),{passive:true});card.addEventListener('focusin',()=>ensure(card));
    card.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')ensure(card);},{passive:true});
    if(card.matches(':hover,:focus-visible'))ensure(card);
  }
}
discover(document.body);
new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!node.matches('.portfolio-blur,.portfolio-blur *'))discover(node);}).observe(document.body,{childList:true,subtree:true});
function update(next){config={...defaults,...next};for(const card of cards){if(!card.isConnected){cards.delete(card);continue;}apply(card);}}
document.addEventListener('portfolio-appearance',event=>update(event.detail));
if(!document.getElementById('dan-landing-home'))fetch('/api/landing-settings',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.config)update(data.config);}).catch(()=>{});
