import {defaults,normalizeSettings,footerProperties,workSectionProperties} from './landing-schema.js?v=20261118-workheading1';
import {mountHeadline} from './headline-view.js?v=20261118-workheading1';

let config=normalizeSettings(window.portfolioLandingConfig||{}),revision=window.portfolioLandingRevision||null;
const views=new Set();let pageHeadline=null;
const embedded=new URLSearchParams(location.search).get('inlineShelf')==='1'&&window.parent!==window;
export const siteAPI={
  defaults:{...defaults},owner:false,
  get revision(){return revision;},set revision(value){revision=value;},
  getConfig:()=>({...config}),
  applyConfig(next,{animateReveal=false}={}){
    config=normalizeSettings(next,config);window.portfolioLandingConfig={...config};
    const properties=footerProperties(config);
    if(document.body.classList.contains('landing-refresh'))Object.assign(properties,workSectionProperties(config));
    for(const [name,value] of Object.entries(properties))document.documentElement.style.setProperty(name,value);
    for(const view of views)view.update(config);
    pageHeadline?.update(config,{animate:animateReveal});
    document.dispatchEvent(new CustomEvent('portfolio-appearance',{detail:{...config}}));
    for(const frame of document.querySelectorAll('.rc-inline-contact-frame'))frame.contentWindow?.postMessage({type:'portfolio-contact-settings',config,revision},location.origin);
  },
  replay(){for(const view of views)view.replay?.();pageHeadline?.replay();},
  register(view){views.add(view);view.update(config);return()=>views.delete(view);}
};
window.portfolioSite=siteAPI;
export const siteReady=(async()=>{
  if(!window.portfolioLandingBootstrapped)try{
    const response=await fetch('/api/landing-settings',{credentials:'same-origin',cache:'no-store'});
    if(response.ok){const data=await response.json();revision=data.revision;if(data.config)config=normalizeSettings(data.config,config);}
  }catch{}
  await document.fonts?.ready;
  const scope=document.body.classList.contains('contact-redesign')?'contact':document.body.classList.contains('video-redesign')?'video':document.body.classList.contains('discipline-design')?'design':document.body.classList.contains('discipline-photo')?'photo':null;
  siteAPI.pageScope=scope||'';
  const h1=scope&&document.querySelector(scope==='contact'?'.rc-contact-copy h1':scope==='video'?'.rv-intro h1':'.rdp-intro h1');
  if(h1){
    const deferReveal=scope==='contact'&&embedded&&window.frameElement?.hasAttribute('data-contact-reveal-on-open');
    pageHeadline=mountHeadline(h1,scope,config,{deferReveal});
  }
  siteAPI.applyConfig(config);
  if(embedded){
    addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='portfolio-contact-settings')try{siteAPI.applyConfig(event.data.config);revision=event.data.revision;}catch{}});
  }else siteAPI.ownerReady=(async()=>{
    try{
      const response=await fetch('/api/owner',{credentials:'same-origin',cache:'no-store'});
      if(response.ok&&(await response.json()).owner){siteAPI.owner=true;const {mountTune}=await import('./landing-tune.js?v=20261118-workheading1');mountTune(siteAPI);}
    }catch(error){console.warn('Owner controls could not initialize.',error);}
  })();
  return siteAPI;
})();
