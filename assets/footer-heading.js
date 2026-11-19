import {createTextRotation,rotationWords,splitPunctuation} from './landing-rotate.js?v=20261119-rotatewidth1';

export function mountFooterHeading(heading){
  let rendered,rotator,fitObserver;
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
      if(next===rendered)return;
      rendered=next;
      fitObserver?.disconnect();
      rotator?.destroy();
      rotator=null;
      heading.hidden=!text.trim();
      if(!timing){
        heading.removeAttribute('aria-label');
        if(heading.textContent!==text)heading.textContent=text;
        return;
      }
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
      const marks=[prefix,suffix].filter(Boolean);
      run.append(...[prefix,phrase,suffix].filter(Boolean));
      heading.setAttribute('aria-label',text);
      heading.replaceChildren(text.slice(0,target.index),run,text.slice(target.index+target[0].length));
      rotator=createTextRotation(phrase,timing,{wrapEntries:true});
      let lastLimit;
      function fitPhrase(){
        const markWidth=marks.reduce((total,mark)=>total+mark.getBoundingClientRect().width,0);
        const limit=Math.max(1,heading.getBoundingClientRect().width-markWidth);
        if(limit===lastLimit)return;
        lastLimit=limit;
        phrase.style.setProperty('--rotate-entry-limit',limit+'px');
        rotator.syncWidth();
      }
      fitPhrase();
      fitObserver=new ResizeObserver(fitPhrase);
      [heading,...marks].forEach(element=>fitObserver.observe(element));
      rotator.start();
    },
    replay(){if(rotator){rotator.reset();rotator.start();}}
  };
}
