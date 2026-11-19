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
  const styles=Promise.all([style('/assets/redesign-contact-shelf.css?v=20261119-carousel-colors1'),style('/assets/redesign-footer-contact.css?v=20261119-shared-carousel1')]);
  const runtime=import('/assets/site-runtime.js?v=20261119-carousel-colors1').then(module=>module.siteReady);
  const scroll=import('/assets/reveal-scroll.js?v=20261119-carousel-colors1');
  const controls=import('/assets/filled-controls.js?v=20261117-navlab1');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null,sequence=0,footerHeading;
  const footerMarkup='<div class="rd-footer-cta-inner"><div class="rd-footer-cta-row"><h2>Ready to make something great?</h2><a class="rd-footer-cta-button" href="/contact">Let\'s make it <span aria-hidden="true">↗</span></a></div></div>';
  function footers(root){
    const found=[...(root.matches?.('.rd-footer-cta')?[root]:[]),...(root.querySelectorAll?.('.rd-footer-cta')||[])];
    for(const footer of found){
      // Legacy project pages create their CTA inside the narrow main at runtime.
      const main=footer.parentElement;
      if(main?.matches('.portfolio-page-content > .site-main'))main.after(footer);
      if(footer.dataset.sharedContactFooter==='true')continue;
      footer.dataset.sharedContactFooter='true';
      if(!footer.querySelector('.rd-footer-cta-row h2'))footer.innerHTML=footerMarkup;
      footerHeading??=import('/assets/footer-heading.js?v=20261119-carousel1');
      Promise.all([runtime,footerHeading]).then(([api,{mountFooterHeading}])=>{
        if(footer.isConnected)api.register(mountFooterHeading(footer.querySelector('h2')));
      }).catch(()=>{});
    }
  }
  footers(document);new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)footers(node);}).observe(document.body,{childList:true,subtree:true});
  function anchorFor(source){
    const footer=source.closest('.rd-footer-cta');if(footer)return footer;
    // The landing wrapper contains both hero and gallery. It is not a section
    // boundary for an action inside the hero.
    const hero=source.closest('.ds-hero');if(hero)return hero;
    const section=source.closest('section');if(section&&section.closest('main'))return section;
    const main=source.closest('main');if(!main)return null;
    let node=source;while(node.parentElement!==main&&node.parentElement)node=node.parentElement;
    return node.parentElement===main?node:null;
  }
  function clean(state,focus=false){
    if(!state)return;clearTimeout(state.removeTimer);clearTimeout(state.timeout);
    state.observer?.disconnect();state.source.setAttribute('aria-expanded','false');state.source.removeAttribute('aria-controls');state.source.removeAttribute('aria-busy');
    state.anchor.classList.remove('has-contact-shelf');state.notice.remove();state.shelf.remove();
    if(active===state)active=null;if(focus&&state.source.isConnected)state.source.focus({preventScroll:true});
  }
  function close(state=active,focus=false,immediate=false){
    if(!state||state.closing)return;state.closing=true;clearTimeout(state.timeout);
    if(!state.shelf.classList.contains('is-open'))immediate=true;
    state.shelf.inert=true;state.source.removeAttribute('aria-busy');
    state.shelf.classList.remove('is-open');state.shelf.setAttribute('aria-hidden','true');state.source.setAttribute('aria-expanded','false');state.anchor.classList.remove('has-contact-shelf');
    if(immediate||reduced.matches)clean(state,focus);else state.removeTimer=setTimeout(()=>clean(state,focus),500);
  }
  function resize(state){
    if(!state.shelf.isConnected||state.closing)return;
    const main=state.frame.contentDocument?.querySelector('.site-main');if(!main)return;
    const height=Math.ceil(main.getBoundingClientRect().height);
    if(height>0&&state.frame.style.height!==height+'px')state.frame.style.height=height+'px';
  }
  function alignSurface(shelf){
    const left=shelf.getBoundingClientRect().left;
    shelf.style.setProperty('--contact-shelf-surface-left',-left+'px');
    shelf.style.setProperty('--contact-shelf-surface-width',document.documentElement.clientWidth+'px');
  }
  function contactInk(color){
    const weights=[.2126,.7152,.0722];
    const channels=color.slice(1).match(/../g).map(value=>parseInt(value,16)/255);
    const luminance=channels.reduce((sum,value,index)=>sum+weights[index]*(value<=.04045?value/12.92:((value+.055)/1.055)**2.4),0);
    return luminance<.18?'#f5f5f2':'#111111';
  }
  function paint(state,config){
    const color=config.contactShelfBackground??'#eaeae6';
    const sizes={
      'wave-length':config.contactShelfWaveLength??23,
      'wave-height':config.contactShelfWaveEnabled===false?0:(config.contactShelfWaveHeight??3),
      'margin-before':config.contactShelfMarginBefore??24,
      'margin-after':config.contactShelfMarginAfter??35,
      'padding-before':config.contactShelfPaddingBefore??64,
      'padding-after':config.contactShelfPaddingAfter??100
    };
    state.shelf.style.setProperty('--contact-shelf-background',color);
    for(const [key,value] of Object.entries(sizes))state.shelf.style.setProperty('--contact-shelf-'+key,value+'px');
    const styling=state.frame.contentDocument?.documentElement?.style;
    styling?.setProperty('--contact-shelf-background',color);
    styling?.setProperty('--contact-shelf-ink',contactInk(color));
  }
  function prepare(state){
    if(active!==state||state.loaded||state.closing||!state.api||!state.shelf.isConnected)return;
    const doc=state.frame.contentDocument;
    if(doc?.documentElement.dataset.contactReady!=='true'||!doc.querySelector('[data-portfolio-contact]'))return;
    const frameAPI=state.frame.contentWindow.portfolioSite;
    if(!frameAPI)return;
    frameAPI.revision=state.api.revision;
    frameAPI.applyConfig(state.api.getConfig());
    paint(state,state.api.getConfig());
    alignSurface(state.shelf);
    resize(state);
    // Install the real glyphs' backwards-filled animations before exposing
    // either the frame or the shelf. No second copy of the form is painted.
    frameAPI.replay();
    state.loaded=true;clearTimeout(state.timeout);state.notice.remove();
    state.frame.inert=false;state.frame.removeAttribute('aria-hidden');
    state.source.removeAttribute('aria-busy');
    state.shelf.classList.add('is-loaded');
    show(state);
    state.observer=new ResizeObserver(()=>resize(state));state.observer.observe(doc.querySelector('.site-main'));
  }
  function show({shelf,source}){
    if(shelf.classList.contains('is-open'))return;
    const start=shelf.getBoundingClientRect().top;
    shelf.inert=false;shelf.setAttribute('aria-hidden','false');shelf.classList.add('is-open');
    scroll.then(({scrollToReveal})=>{
      if(shelf.isConnected&&shelf.classList.contains('is-open'))scrollToReveal(shelf,source,{always:!!source.closest('.rd-footer-cta'),revealTop:start});
    }).catch(()=>{});
  }
  async function open(source){
    const anchor=anchorFor(source);if(!anchor){location.assign('/contact/');return;}
    if(active?.source===source&&!active.closing){close(active,true);return;}
    if(active)clean(active);
    const shelf=document.createElement('section');shelf.id='contact-shelf-'+(++sequence);shelf.className='rc-inline-contact-shelf';shelf.setAttribute('aria-label','Contact Dan Smith');shelf.setAttribute('aria-hidden','true');
    shelf.inert=true;
    shelf.innerHTML=`<div class="rc-inline-contact-clip"><div class="rc-inline-contact-shell"><button class="portfolio-panel-close rc-inline-contact-close" type="button" aria-label="Close contact">×</button><iframe class="rc-inline-contact-frame" title="Contact Dan Smith" src="/contact/?inlineShelf=1" data-contact-reveal-on-open aria-hidden="true" inert></iframe></div></div>`;
    const notice=document.createElement('p');
    notice.className='rc-inline-contact-error';notice.setAttribute('role','status');
    notice.innerHTML='Contact is taking longer to load. <a href="/contact/" data-contact-fallback>Open the contact page ↗</a>';
    const state={source,anchor,shelf,notice,frame:shelf.querySelector('iframe'),loaded:false,closing:false,api:null};active=state;
    source.setAttribute('aria-expanded','true');source.setAttribute('aria-controls',shelf.id);source.setAttribute('aria-busy','true');
    state.frame.addEventListener('load',()=>prepare(state));
    const closeButton=shelf.querySelector('.rc-inline-contact-close');
    closeButton.addEventListener('click',()=>close(state,true));
    controls.then(({filledControlIcon})=>{closeButton.innerHTML=filledControlIcon('circle-x');}).catch(()=>{});
    await styles;
    if(state!==active||state.closing)return;
    anchor.classList.add('has-contact-shelf');
    anchor.insertAdjacentElement('afterend',shelf);
    const fallback=()=>{
      if(state!==active||state.closing||state.loaded)return;
      source.removeAttribute('aria-busy');shelf.after(notice);
    };
    state.timeout=setTimeout(fallback,10000);
    try{state.api=await runtime;prepare(state);}catch{fallback();}
  }
  addEventListener('resize',()=>{if(active?.loaded&&!active.closing)alignSurface(active.shelf);});
  document.addEventListener('portfolio-appearance',event=>{if(active?.loaded&&!active.closing)paint(active,event.detail);});
  addEventListener('message',event=>{if(active&&event.origin===location.origin&&event.source===active.frame.contentWindow&&event.data?.type==='portfolio-contact-ready')prepare(active);});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest?.('a[href]');if(!link||link.closest('.site-nav')||link.hasAttribute('data-contact-fallback'))return;
    const url=new URL(link.href,location.href);if(url.origin!==location.origin||path(url.pathname)!=='/contact')return;
    event.preventDefault();event.stopImmediatePropagation();open(link);
  },{capture:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active&&!document.querySelector('#dan-demo-config:not([hidden])')){event.preventDefault();close(active,true);}});
})();
