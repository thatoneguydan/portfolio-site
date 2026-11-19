import {defaults} from './landing-schema.js?v=public-dbd473291c-6d6196dc';
import {mountHeadline} from './headline-view.js?v=public-dbd473291c-6d6196dc';

const views=new Set();
let pageHeadline=null;
const embedded=new URLSearchParams(location.search).get('inlineShelf')==='1'&&window.parent!==window;
const siteAPI={
  getConfig:()=>({...defaults}),
  replay(){for(const view of views)view.replay?.();pageHeadline?.replay();},
  register(view){views.add(view);view.update(defaults);return()=>views.delete(view);}
};
window.portfolioSite=Object.freeze({replay:siteAPI.replay});
export const siteReady=(async()=>{
  await document.fonts?.ready;
  const scope=document.body.classList.contains('contact-redesign')?'contact':document.body.classList.contains('video-redesign')?'video':document.body.classList.contains('discipline-design')?'design':document.body.classList.contains('discipline-photo')?'photo':null;
  siteAPI.pageScope=scope||'';
  const h1=scope&&document.querySelector(scope==='contact'?'.rc-contact-copy h1':scope==='video'?'.rv-intro h1':'.rdp-intro h1');
  if(h1){
    const deferReveal=scope==='contact'&&embedded&&window.frameElement?.hasAttribute('data-contact-reveal-on-open');
    pageHeadline=mountHeadline(h1,scope,defaults,{deferReveal});
  }
  document.dispatchEvent(new CustomEvent('portfolio-appearance',{detail:{...defaults}}));
  return siteAPI;
})();
