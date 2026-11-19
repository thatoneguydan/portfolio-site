import {createTextRotation,rotationWords,splitPunctuation} from './landing-rotate.js?v=20261118-hero3';

export function mountFooterHeading(heading){
  let rendered,rotator;
  return {
    update(config){
      const text=config.footerHeadingText;
      const target=[...text.matchAll(/\S+/g)].find(match=>splitPunctuation(match[0]).body.toLowerCase()==='great');
      let timing;
      if(config.rotateEnabled&&target){
        const authored=splitPunctuation(target[0]).body;
        const uppercase=authored===authored.toUpperCase();
        const titleCase=authored==='Great';
        const choices=rotationWords(config).filter(word=>word.toLowerCase()!=='great').map(word=>{
          if(uppercase)return word.toUpperCase();
          if(word!==word.toUpperCase())return word;
          const lower=word.toLowerCase();
          return titleCase?lower[0].toUpperCase()+lower.slice(1):lower;
        });
        if(choices.length)timing={
          rotateWords:[authored,...choices].join(', '),
          rotateInterval:config.rotateInterval,rotateDuration:config.rotateDuration,rotateStagger:config.rotateStagger,
          rotateSplit:config.rotateSplit,rotateFrom:config.rotateFrom
        };
      }
      const next=JSON.stringify([text,timing]);
      if(next===rendered)return;
      rendered=next;
      rotator?.destroy();
      rotator=null;
      heading.hidden=!text.trim();
      if(!timing){
        heading.removeAttribute('aria-label');
        if(heading.textContent!==text)heading.textContent=text;
        return;
      }
      const {prefix,suffix}=splitPunctuation(target[0]);
      const phrase=document.createElement('span');
      phrase.className='ds-footer-phrase';
      phrase.setAttribute('aria-hidden','true');
      heading.setAttribute('aria-label',text);
      heading.replaceChildren(text.slice(0,target.index)+prefix,phrase,text.slice(target.index+target[0].length));
      rotator=createTextRotation(phrase,timing,{suffix});
      rotator.start();
    },
    replay(){if(rotator){rotator.reset();rotator.start();}}
  };
}
