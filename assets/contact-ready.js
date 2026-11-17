import {siteReady} from './site-runtime.js?v=20261117-site8';
const inline=new URLSearchParams(location.search).get('inlineShelf')==='1'&&parent!==window;
if(inline){
  document.documentElement.classList.add('contact-inline-embed');document.body.classList.add('contact-inline-embed');
  await siteReady;
  document.documentElement.dataset.contactReady='true';
  const signal=()=>parent.postMessage({type:'portfolio-contact-ready'},location.origin);
  const main=document.querySelector('.site-main');if(main)new ResizeObserver(signal).observe(main);
  signal();
}
