import {createTextRotation,rotationWords,splitPunctuation} from './landing-rotate.js?v=20261119-carousel1';
import {appendEmojiText} from './site-emoji.js?v=20261118-perf1';

function headingRange(config){
  const words=[...config.featuredHeading.matchAll(/\S+/g)];
  const last=Math.max(0,words.length-1);
  const start=Math.min(last,Math.max(0,config.featuredRotateStart));
  const end=Math.min(last,Math.max(start,config.featuredRotateEnd));
  return {words,start,end};
}

export function mountSectionHeading(heading,section,content,{scope,label,anchored=false,lastItem}){
  let rendered='',typography='',width=0,rotator=null;
  const viewport=window.visualViewport;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let growth=0,growthFrame=0,scrollScale=1,layoutScale=1;
  function applyScrollScale(scale){
    if(anchored){
      const finalScale=reduced.matches?1:1+growth;
      if(finalScale!==layoutScale){
        layoutScale=finalScale;
        heading.style.setProperty('--featured-scroll-scale',finalScale);
        rotator?.syncWidth();
      }
      const visualScale=scale/finalScale;
      if(visualScale!==scrollScale){
        scrollScale=visualScale;
        heading.style.setProperty('--work-heading-scale',visualScale);
      }
      return;
    }
    if(scale===scrollScale)return;
    scrollScale=scale;
    heading.style.setProperty('--featured-scroll-scale',scale);
    rotator?.syncWidth();
  }
  function scheduleGrowth(){
    if(growthFrame)return;
    growthFrame=requestAnimationFrame(()=>{
      growthFrame=0;
      if(!growth||heading.hidden||reduced.matches){applyScrollScale(1);return;}
      const bounds=content.getBoundingClientRect(),top=bounds.top;
      const height=lastItem?(content.querySelector(lastItem)?.getBoundingClientRect().bottom??bounds.bottom)-top:bounds.height;
      const bottom=viewport?viewport.offsetTop+viewport.height:innerHeight;
      // Grow across the content's entry into the viewport and stop once its
      // bottom edge is visible. Quantize subpixel changes while scrolling.
      const progress=height?Math.max(0,Math.min(1,(bottom-top)/height)):0;
      applyScrollScale(1+growth*Math.round(progress*1000)/1000);
    });
  }
  const contentObserver=new ResizeObserver(scheduleGrowth);
  function listenForGrowth(enabled){
    const method=enabled?'addEventListener':'removeEventListener';
    window[method]('scroll',scheduleGrowth,{passive:true});
    window[method]('resize',scheduleGrowth);
    viewport?.[method]('scroll',scheduleGrowth,{passive:true});
    viewport?.[method]('resize',scheduleGrowth);
    reduced[method]('change',scheduleGrowth);
    if(enabled)contentObserver.observe(content);
    else contentObserver.disconnect();
  }
  const syncPhrase=()=>{
    width=heading.clientWidth;
    heading.style.setProperty('--featured-phrase-limit',width+'px');
    rotator?.syncWidth();
  };
  const observer=new ResizeObserver(()=>{
    if(rotator&&heading.clientWidth!==width)syncPhrase();
  });
  function update(config){
    const text=config[scope+'Heading'];
    const nextGrowth=config[scope+'HeadingScrollGrowth']/100;
    if(nextGrowth!==growth){
      if(Boolean(nextGrowth)!==Boolean(growth))listenForGrowth(Boolean(nextGrowth));
      growth=nextGrowth;
      if(!growth)applyScrollScale(1);
    }
    if(growth)scheduleGrowth();
    const timing=scope==='featured'&&config.featuredRotateEnabled?{
      rotateWords:config.featuredRotateWords,
      rotateInterval:config.rotateInterval,
      rotateDuration:config.rotateDuration,
      rotateStagger:config.rotateStagger,
      rotateSplit:config.rotateSplit,
      rotateFrom:config.rotateFrom
    }:null;
    const range=timing&&headingRange(config),entries=timing&&rotationWords(timing);
    const active=range?.words.length&&entries.length;
    const titleKey=JSON.stringify(active?[text,range.start,range.end,timing]:[text]);
    const size=config[scope+'HeadingSize'],weight=config[scope+'HeadingWeight'];
    const gap=config[scope+'HeadingGap'],align=config[scope+'HeadingAlign'],anchor=config[scope+'HeadingAnchor'];
    const styleKey=JSON.stringify([size,weight,gap,align,anchor]);
    if(styleKey!==typography){
      heading.style.setProperty('--featured-heading-size',size);
      heading.style.setProperty('--featured-heading-weight',weight);
      heading.style.setProperty('--featured-heading-gap',gap+'px');
      heading.style.textAlign=align;
      if(anchored){
        heading.style.setProperty('--work-heading-origin-x',align==='justify'?'left':align);
        heading.style.setProperty('--work-heading-origin-y',anchor);
      }
      typography=styleKey;
      if(titleKey===rendered&&rotator)syncPhrase();
    }
    if(titleKey===rendered)return;
    rendered=titleKey;
    observer.disconnect();
    rotator?.destroy();
    rotator=null;
    heading.hidden=!text.trim();
    if(heading.hidden){
      section.removeAttribute('aria-labelledby');
      section.setAttribute('aria-label',label);
    }else{
      section.setAttribute('aria-labelledby',heading.id);
      section.removeAttribute('aria-label');
    }
    if(!active){
      heading.removeAttribute('aria-label');
      if(heading.textContent!==text)heading.textContent=text;
      return;
    }
    const start=range.words[range.start],end=range.words[range.end];
    const after=end.index+end[0].length;
    const {prefix,suffix}=splitPunctuation(text.slice(start.index,after));
    const beforeText=text.slice(0,start.index)+prefix,afterText=text.slice(after);
    const first=entries[0],ending=suffix&&!first.endsWith(suffix)?suffix:'';
    heading.setAttribute('aria-label',beforeText+first+ending+afterText);
    heading.replaceChildren();
    appendEmojiText(heading,beforeText);
    const phrase=document.createElement('span');
    phrase.className='ds-featured-phrase';
    phrase.setAttribute('aria-hidden','true');
    heading.append(phrase);
    appendEmojiText(heading,afterText);
    rotator=createTextRotation(phrase,timing,{suffix,wrapEntries:true});
    syncPhrase();
    observer.observe(heading);
    rotator.start();
  }
  return {update,destroy(){
    listenForGrowth(false);
    cancelAnimationFrame(growthFrame);
    observer.disconnect();
    rotator?.destroy();
  }};
}

export function mountFeaturedRotationEditor(container,config,onChange){
  container.innerHTML=`
    <label>First word in range<select aria-label="Featured rotation first word"></select></label>
    <label>Last word in range<select aria-label="Featured rotation last word"></select></label>
    <label>Cycle through<input type="text" aria-label="Featured rotating words or phrases" maxlength="6000" spellcheck="false"></label>
    <p class="ds-rotate-count"></p>`;
  const [first,last]=container.querySelectorAll('select');
  const entries=container.querySelector('input'),count=container.querySelector('p');
  let choicesKey='';
  function refresh(){
    const {words,start,end}=headingRange(config);
    const key=JSON.stringify([words.map(word=>word[0]),start]);
    if(key!==choicesKey){
      const option=(word,i)=>new Option(`${i+1}. ${word[0]}`,String(i));
      first.replaceChildren(...words.map(option));
      last.replaceChildren(...words.slice(start).map((word,i)=>option(word,start+i)));
      choicesKey=key;
    }
    first.value=String(start);
    last.value=String(end);
    first.disabled=last.disabled=entries.disabled=!config.featuredRotateEnabled||!words.length;
    if(document.activeElement!==entries){
      entries.value=config.featuredRotateWords;
      entries.setCustomValidity('');
    }
    count.textContent=rotationWords({rotateWords:config.featuredRotateWords}).length+' / 50 entries · separate words or phrases with commas';
  }
  first.addEventListener('change',()=>{
    const start=Number(first.value);
    onChange({featuredRotateStart:start,featuredRotateEnd:Math.max(start,Number(last.value))});
  });
  last.addEventListener('change',()=>onChange({featuredRotateEnd:Number(last.value)}));
  entries.addEventListener('input',()=>entries.setCustomValidity(onChange({featuredRotateWords:entries.value})||''));
  return refresh;
}
