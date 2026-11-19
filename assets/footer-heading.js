import {createTextRotation,rotationWords,splitPunctuation} from './landing-rotate.js?v=20261119-carousel1';

export function mountFooterHeading(heading){
  let rendered,rotator,fitObserver,fitLine,typography;
  return {
    update(config){
      const text=config.footerHeadingText;
      const target=[...text.matchAll(/\S+/g)].find(match=>splitPunctuation(match[0]).body.toLowerCase()==='great');
      const word=target&&splitPunctuation(target[0]);
      let timing;
      if(config.rotateEnabled&&word){
        const {body:authored,suffix}=word;
        const uppercase=authored===authored.toUpperCase();
        const titleCase=authored==='Great';
        const choices=rotationWords(config).map(choice=>suffix&&choice.endsWith(suffix)
          ?choice.slice(0,-suffix.length).trimEnd():choice).filter(choice=>choice&&choice.toLowerCase()!=='great').map(choice=>{
          if(uppercase)return choice.toUpperCase();
          if(choice!==choice.toUpperCase())return choice;
          const lower=choice.toLowerCase();
          return titleCase?lower[0].toUpperCase()+lower.slice(1):lower;
        });
        if(choices.length)timing={
          rotateWords:[authored,...choices].join(', '),
          rotateInterval:config.rotateInterval,rotateDuration:config.rotateDuration,rotateStagger:config.rotateStagger,
          rotateSplit:config.rotateSplit,rotateFrom:config.rotateFrom
        };
      }
      const next=JSON.stringify([text,timing]);
      const nextTypography=JSON.stringify([config.footerHeadingScale,config.footerHeadingWeight]);
      if(next===rendered){
        if(nextTypography!==typography){typography=nextTypography;fitLine?.();}
        return;
      }
      rendered=next;
      typography=nextTypography;
      fitObserver?.disconnect();
      rotator?.destroy();
      rotator=fitLine=null;
      heading.style.removeProperty('font-size');
      heading.hidden=!text.trim();
      if(!timing){
        heading.removeAttribute('aria-label');
        if(heading.textContent!==text)heading.textContent=text;
        return;
      }
      const line=document.createElement('span');
      line.className='ds-footer-line';
      const run=document.createElement('span');
      run.className='ds-footer-word-run';
      run.setAttribute('aria-hidden','true');
      const phrase=document.createElement('span');
      phrase.className='ds-footer-phrase';
      function punctuation(value,placement){
        if(!value)return null;
        const mark=document.createElement('span');
        mark.className='ds-footer-punctuation ds-footer-'+placement;
        mark.textContent=value;
        return mark;
      }
      const prefix=punctuation(word.prefix,'prefix'),suffix=punctuation(word.suffix,'suffix');
      run.append(...[prefix,phrase,suffix].filter(Boolean));
      heading.setAttribute('aria-label',text);
      line.append(text.slice(0,target.index),run,text.slice(target.index+target[0].length));
      heading.replaceChildren(line);
      rotator=createTextRotation(phrase,timing);
      let lastWidth=0;
      fitLine=()=>{
        lastWidth=heading.getBoundingClientRect().width;
        if(lastWidth<=1)return;
        heading.style.removeProperty('font-size');
        rotator.syncWidth();
        // Measure the entire line including the punctuation. Only the fitted
        // font size uses the other entries; their widths stay out of flow.
        const longest=line.getBoundingClientRect().width+rotator.fitExtraWidth();
        const available=lastWidth-1;
        if(longest>available){
          const fontSize=parseFloat(getComputedStyle(heading).fontSize);
          heading.style.fontSize=fontSize*available/longest+'px';
          rotator.syncWidth();
        }
      };
      fitLine();
      fitObserver=new ResizeObserver(()=>{
        if(Math.abs(heading.getBoundingClientRect().width-lastWidth)>.25)fitLine?.();
      });
      fitObserver.observe(heading);
      rotator.start();
    },
    replay(){if(rotator){rotator.reset();rotator.start();}}
  };
}
