import {siteReady} from './site-runtime.js?v=public-bbcdffe8d1-86b4d982';
import {mountProjectCarousel} from './project-carousel.js?v=20261119-mobile-polish1';
import {mountSectionHeading} from './featured-heading.js?v=20261119-shared-carousel1';
import {installProjectViews,openProject} from './project-views.js?v=public-bbcdffe8d1-86b4d982';

const sections=[...document.querySelectorAll('.rv-carousels > [data-carousel-scope]')];
if(sections.length){
  const api=await siteReady;
  const carousels=sections.map(section=>{
    const {carouselScope:scope}=section.dataset;
    const title=section.querySelector('.ds-section-head');
    const flavor=section.querySelector('.rv-carousel-flavor');
    const gallery=section.querySelector('.ds-gallery');
    const label=title.textContent;
    const heading=mountSectionHeading(title,section,gallery,{scope,label,lastItem:'.ds-panel:last-of-type'});
    const carousel=mountProjectCarousel(gallery,{
      orientationKey:scope+'Orientation',controlsLabel:'Browse '+label
    });
    return {
      update(config){
        heading.update(config);
        carousel.update(config);
        const text=config[scope+'FlavorText'];
        flavor.hidden=!config[scope+'FlavorEnabled']||!text.trim();
        if(flavor.textContent!==text)flavor.textContent=text;
        if(flavor.hidden)section.removeAttribute('aria-describedby');
        else section.setAttribute('aria-describedby',flavor.id);
        section.style.setProperty('--video-carousel-heading-gap',config[scope+'HeadingGap']+'px');
      },
      destroy(){heading.destroy();carousel.destroy();}
    };
  });
  const unregister=api.register({update(config){carousels.forEach(carousel=>carousel.update(config));}});
  addEventListener('pagehide',event=>{
    if(event.persisted)return;
    unregister();
    carousels.forEach(carousel=>carousel.destroy());
  });

  installProjectViews();
  const slug=location.hash.slice(1);
  const category=sections.find(section=>section.id===slug);
  const videoID=new URLSearchParams(location.search).get('play');
  if(videoID&&!slug.startsWith('project-')){
    const card=[...document.querySelectorAll('.rv-carousels [data-youtube-id]')]
      .find(card=>card.dataset.youtubeId===videoID);
    if(card)requestAnimationFrame(()=>openProject(card,{hash:false,reveal:true}));
  }else if(category){
    // A direct category link may have scrolled against the fallback layout
    // before fonts and carousel dimensions were ready.
    requestAnimationFrame(()=>category.scrollIntoView({block:'start',behavior:'instant'}));
  }
}
