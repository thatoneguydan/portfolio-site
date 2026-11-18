import {createTextRotation,rotationWords,splitPunctuation} from './landing-rotate.js?v=20261118-hero3';
import {appendEmojiText} from './site-emoji.js?v=20261118-perf1';

function headingRange(config){
  const words=[...config.featuredHeading.matchAll(/\S+/g)];
  const last=Math.max(0,words.length-1);
  const start=Math.min(last,Math.max(0,Math.round(config.featuredRotateStart)));
  const end=Math.min(last,Math.max(start,Math.round(config.featuredRotateEnd)));
  return {words,start,end};
}

export function mountFeaturedHeading(heading,section){
  let rendered='',typography='',width=0,rotator=null;
  const syncPhrase=()=>{
    width=heading.clientWidth;
    heading.style.setProperty('--featured-phrase-limit',width+'px');
    rotator?.syncWidth();
  };
  const observer=new ResizeObserver(()=>{
    if(rotator&&heading.clientWidth!==width)syncPhrase();
  });
  function update(config){
    const text=config.featuredHeading;
    const timing={
      rotateWords:config.featuredRotateWords,
      rotateInterval:config.rotateInterval,
      rotateDuration:config.rotateDuration,
      rotateStagger:config.rotateStagger,
      rotateSplit:config.rotateSplit,
      rotateFrom:config.rotateFrom
    };
    const range=headingRange(config),entries=rotationWords(timing);
    const active=config.featuredRotateEnabled&&range.words.length>0&&entries.length>0;
    const titleKey=JSON.stringify(active?[text,range.start,range.end,timing]:[text]);
    const styleKey=JSON.stringify([config.featuredHeadingSize,config.featuredHeadingWeight,config.featuredHeadingGap,config.featuredHeadingAlign]);
    if(styleKey!==typography){
      heading.style.setProperty('--featured-heading-size',config.featuredHeadingSize);
      heading.style.setProperty('--featured-heading-weight',config.featuredHeadingWeight);
      heading.style.setProperty('--featured-heading-gap',config.featuredHeadingGap+'px');
      heading.style.textAlign=config.featuredHeadingAlign;
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
      section.setAttribute('aria-label','Featured work');
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
    rotator=createTextRotation(phrase,timing,{suffix,dynamicWidth:true,wrapEntries:true});
    syncPhrase();
    observer.observe(heading);
    rotator.start();
  }
  return {update,destroy(){observer.disconnect();rotator?.destroy();}};
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
