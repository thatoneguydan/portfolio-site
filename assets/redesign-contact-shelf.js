(() => {
  'use strict';
  if(window.__redesignContactShelfInitialized)return;window.__redesignContactShelfInitialized=true;
  const path=name=>name.replace(/\/+$/,'')||'/';if(path(location.pathname)==='/contact')return;
  function style(href){
    let link=document.querySelector(`link[href^="${href.split('?')[0]}"]`);
    if(!link){link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
    if(link.sheet)return Promise.resolve();
    return new Promise(resolve=>{link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true});});
  }
  const styles=Promise.all([style('/assets/redesign-contact-shelf.css?v=20261117-site9'),style('/assets/redesign-contact.css?v=20261117-hierarchy3'),style('/assets/redesign-footer-contact.css?v=20261117-site9')]);
  const runtime=import('/assets/site-runtime.js?v=20261117-hierarchy3');
  const headline=import('/assets/headline-view.js?v=20261117-hierarchy3');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null,sequence=0;
  const footerMarkup='<div class="rd-footer-cta-inner"><div class="rd-footer-cta-row"><h2>Have something in mind?</h2><a class="rd-footer-cta-button" href="/contact">Let\'s make it <span aria-hidden="true">↗</span></a></div></div>';
  function footers(root){
    const found=[...(root.matches?.('.rd-footer-cta')?[root]:[]),...(root.querySelectorAll?.('.rd-footer-cta')||[])];
    for(const footer of found)if(footer.dataset.sharedContactFooter!=='true'){footer.dataset.sharedContactFooter='true';footer.innerHTML=footerMarkup;}
  }
  footers(document);new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)footers(node);}).observe(document.body,{childList:true,subtree:true});
  function anchorFor(source){
    // The landing wrapper contains both hero and gallery. It is not a section
    // boundary for an action inside the hero.
    const hero=source.closest('.ds-hero');if(hero)return hero;
    const section=source.closest('section');if(section&&section.closest('main'))return section;
    const main=source.closest('main');if(!main)return null;
    let node=source;while(node.parentElement!==main&&node.parentElement)node=node.parentElement;
    return node.parentElement===main?node:null;
  }
  function clean(state,focus=false){
    if(!state)return;clearTimeout(state.removeTimer);clearTimeout(state.timeout);cancelAnimationFrame(state.poll);
    state.observer?.disconnect();state.preview?.destroy();state.source.setAttribute('aria-expanded','false');state.source.removeAttribute('aria-controls');
    state.anchor.classList.remove('has-contact-shelf');state.frame.src='about:blank';state.shelf.remove();
    if(active===state)active=null;if(focus&&state.source.isConnected)state.source.focus({preventScroll:true});
  }
  function close(state=active,focus=false,immediate=false){
    if(!state||state.closing)return;state.closing=true;clearTimeout(state.timeout);cancelAnimationFrame(state.poll);
    state.shelf.classList.remove('is-open');state.shelf.setAttribute('aria-hidden','true');state.source.setAttribute('aria-expanded','false');state.anchor.classList.remove('has-contact-shelf');
    if(immediate||reduced.matches)clean(state,focus);else state.removeTimer=setTimeout(()=>clean(state,focus),500);
  }
  function resize(state){
    if(!state.shelf.isConnected||state.closing)return;
    const main=state.frame.contentDocument?.querySelector('.site-main');if(!main)return;
    const height=Math.ceil(main.getBoundingClientRect().height);
    if(height>0&&state.frame.style.height!==height+'px')state.frame.style.height=height+'px';
  }
  function prepare(state){
    if(state.loaded||state.closing||!state.shelf.isConnected)return;
    let doc;try{doc=state.frame.contentDocument;}catch{return;}
    if(doc?.documentElement.dataset.contactReady!=='true'||!doc.querySelector('[data-portfolio-contact]'))return;
    state.loaded=true;clearTimeout(state.timeout);cancelAnimationFrame(state.poll);resize(state);
    state.shelf.classList.add('is-loaded');state.frame.removeAttribute('aria-hidden');state.preview?.destroy();state.preview=null;
    state.observer=new ResizeObserver(()=>resize(state));state.observer.observe(doc.querySelector('.site-main'));
    runtime.then(({siteAPI})=>state.frame.contentWindow?.postMessage({type:'portfolio-contact-settings',config:siteAPI.getConfig(),revision:siteAPI.revision},location.origin));
  }
  const previewMarkup=`<div class="rc-inline-contact-placeholder contact-redesign" aria-hidden="true"><section class="rc-contact">
    <div class="rc-contact-copy"><div><p class="rd-eyebrow">Contact</p><h1 data-headline-pending></h1><p class="rc-contact-lede">Whether you need help with a single project, ongoing creative support, or someone to join your team, tell me what you're working toward and where I could help.</p></div><dl class="rc-contact-details"><div class="rc-contact-detail"><dt>Phone</dt><dd><span class="rc-placeholder-detail"></span></dd></div><div class="rc-contact-detail"><dt>Email</dt><dd><span class="rc-placeholder-detail"></span></dd></div></dl></div>
    <div class="rc-form-wrap"><header class="rc-form-head"><h2>Tell me what you're looking for.</h2></header><div class="contact-form"><div class="form-field"><label>Your name *</label><input placeholder="Name" disabled></div><div class="form-field"><label>Your email *</label><input placeholder="Email" disabled></div><div class="form-field"><label>Message *</label><textarea placeholder="A project, an idea, an role on your team? I'm all ears!" disabled></textarea></div><div data-contact-turnstile></div><button class="portfolio-button" disabled>Start the conversation</button><p class="form-status"></p></div></div>
  </section></div>`;
  async function open(source){
    const anchor=anchorFor(source);if(!anchor){location.assign('/contact/');return;}
    if(active?.source===source&&!active.closing){close(active,true);return;}
    if(active)clean(active);
    const shelf=document.createElement('section');shelf.id='contact-shelf-'+(++sequence);shelf.className='rc-inline-contact-shelf';shelf.setAttribute('aria-label','Contact Dan Smith');shelf.setAttribute('aria-hidden','true');
    shelf.innerHTML=`<div class="rc-inline-contact-shell"><button class="rc-inline-contact-close" type="button" aria-label="Close contact">×</button>${previewMarkup}<iframe class="rc-inline-contact-frame" title="Contact Dan Smith" aria-hidden="true"></iframe><p class="rc-inline-contact-error" hidden>Contact is taking longer to load. <a href="/contact/" data-contact-fallback>Open the contact page ↗</a></p></div>`;
    const state={source,anchor,shelf,frame:shelf.querySelector('iframe'),loaded:false,closing:false,preview:null,poll:0};active=state;
    source.setAttribute('aria-expanded','true');source.setAttribute('aria-controls',shelf.id);anchor.classList.add('has-contact-shelf');
    state.frame.addEventListener('load',()=>prepare(state));
    shelf.querySelector('.rc-inline-contact-close').addEventListener('click',()=>close(state,true));
    anchor.insertAdjacentElement('afterend',shelf);
    const [{siteAPI},{mountHeadline}]=await Promise.all([runtime,headline,styles]);
    if(state.closing||!shelf.isConnected)return;
    state.preview=mountHeadline(shelf.querySelector('h1'),'contact',siteAPI.getConfig());
    state.frame.src='/contact/?inlineShelf=1';
    const started=performance.now();
    function poll(){prepare(state);if(!state.loaded&&!state.closing&&performance.now()-started<12000)state.poll=requestAnimationFrame(poll);}
    state.poll=requestAnimationFrame(poll);
    state.timeout=setTimeout(()=>{if(!state.loaded&&!state.closing)shelf.querySelector('.rc-inline-contact-error').hidden=false;},10000);
    requestAnimationFrame(()=>{
      shelf.setAttribute('aria-hidden','false');shelf.classList.add('is-open');
      const top=source.getBoundingClientRect().top+scrollY,header=document.querySelector('.site-header')?.getBoundingClientRect().bottom||0;
      if(shelf.getBoundingClientRect().top>innerHeight*.65||source.closest('.rd-footer-cta'))window.scrollTo({top:Math.max(0,top-header-20),behavior:reduced.matches?'auto':'smooth'});
    });
  }
  addEventListener('message',event=>{if(active&&event.origin===location.origin&&event.source===active.frame.contentWindow&&event.data?.type==='portfolio-contact-ready')prepare(active);});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest?.('a[href]');if(!link||link.closest('.site-nav')||link.hasAttribute('data-contact-fallback'))return;
    const url=new URL(link.href,location.href);if(url.origin!==location.origin||path(url.pathname)!=='/contact')return;
    event.preventDefault();event.stopImmediatePropagation();open(link);
  },{capture:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active&&!document.querySelector('#dan-demo-config:not([hidden])')){event.preventDefault();close(active,true);}});
})();
