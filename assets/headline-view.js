import {appendEmojiText,graphemes} from './site-emoji.js?v=20261118-perf1';
import {headlineLines,rotationWords,splitPunctuation,createTextRotation,accessibleHeadline} from './landing-rotate.js?v=20261118-hero3';
import {headlineSettings} from './landing-schema.js?v=20261118-idanchor1';

export function revealOffset(clipHeight,glyphHeight,fontSize,direction){
  return Math.sign(direction)*(Math.max(clipHeight,glyphHeight)+fontSize*.6+2);
}
export function revealFrames(start,duration,unit='%'){
  return Array.from({length:51},(_,i)=>{
    const t=i/50*duration/1000,decay=Math.exp(-10.5*t)*(Math.cos(9.47365*t)+10.5/9.47365*Math.sin(9.47365*t));
    return {transform:`translateY(${i===50?0:start*decay}${unit})`,offset:i/50};
  });
}

export function mountHeadline(h1,scope,initial,{deferReveal=false}={}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let config,signature='',animations=[],rotator=null,fitFrame=0,initialFrame=0;
  h1.setAttribute('data-headline-pending','');h1.classList.add('ds-authored-reveal');h1.dataset.headlineScope=scope;
  function fit(){
    fitFrame=0;if(!config)return;
    const available=Math.max(1,h1.parentElement.clientWidth-8);
    h1.style.fontSize=(scope==='contact'?config.fontSize:Math.min(config.fontSize,Math.max(Math.min(28,config.fontSize),available*.13)))+'px';
    h1.style.fontWeight=config.fontWeight;h1.style.lineHeight=config.lineHeight;
    h1.classList.toggle('is-wrapping',scope!=='contact');
    if(scope==='contact'){
      rotator?.prepareFit();
      const lines=[...h1.children];lines.forEach(line=>line.style.width='max-content');
      const widths=lines.map(line=>line.scrollWidth),longest=Math.max(1,...widths);
      if(longest>available)h1.style.fontSize=Math.max(12,config.fontSize*available/longest)+'px';
      lines.forEach(line=>line.style.removeProperty('width'));
    }
    rotator?.syncWidth();
  }
  function replay(){
    animations.forEach(a=>a.cancel());animations=[];rotator?.reset();
    if(!config.animate||reduced.matches){h1.removeAttribute('data-headline-pending');rotator?.start();return;}
    let end=0,rotationEnd=0;const rotatingLine=Number(config.rotateTarget.split(':')[0])-1;
    [...h1.children].forEach((line,li)=>{
      const glyphs=[...line.querySelectorAll('.ds-glyph')],words=[...line.querySelectorAll('.ds-word')];
      const count=config.splitBy==='lines'?1:config.splitBy==='words'?words.length:glyphs.length;
      const order=Array.from({length:count},(_,i)=>i);
      if(config.staggerFrom==='random')for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      const from=config.staggerFrom==='reference'?['first','last','center'][li%3]:config.staggerFrom;
      const start=config.direction==='down'?-112:config.direction==='up'?112:li%2?-112:112;
      glyphs.forEach((glyph,i)=>{
        const at=config.splitBy==='lines'?0:config.splitBy==='words'?words.indexOf(glyph.closest('.ds-word')):i;
        const rank=from==='last'?count-1-at:from==='center'?Math.abs(at-(count-1)/2):from==='random'?order[at]:at;
        const delay=li*config.lineDelay+rank*config.stagger;end=Math.max(end,delay+config.duration);
        if(li===rotatingLine)rotationEnd=Math.max(rotationEnd,delay+config.duration);
        const distance=revealOffset(glyph.closest('.ds-word').offsetHeight,glyph.offsetHeight,parseFloat(getComputedStyle(glyph).fontSize),start);
        animations.push(glyph.animate(revealFrames(distance,config.duration,'px'),{duration:config.duration,delay,easing:'linear',fill:'both'}));
      });
    });
    rotator?.start(rotationEnd+config.rotateInterval);h1.removeAttribute('data-headline-pending');
    const sequence=animations;
    Promise.all(sequence.map(a=>a.finished.catch(()=>{}))).then(()=>{if(sequence===animations){sequence.forEach(a=>a.cancel());animations=[];}});
  }
  function update(next,{animate=false}={}){
    const current=headlineSettings(next,scope),key=JSON.stringify(current);if(key===signature)return;
    signature=key;config=current;animations.forEach(a=>a.cancel());animations=[];rotator?.destroy();rotator=null;
    h1.replaceChildren();h1.setAttribute('aria-label',accessibleHeadline(config));
    headlineLines(config).forEach((text,index)=>{
      const line=document.createElement('span');line.className='ds-reveal-line';line.setAttribute('aria-hidden','true');let wordIndex=0;
      text.split(/(\s+)/).filter(Boolean).forEach(word=>{
        if(/^\s+$/.test(word)){line.append(document.createTextNode(word));return;}
        const wrap=document.createElement('span');wrap.className='ds-word';
        if(config.rotateEnabled&&config.rotateTarget===`${index+1}:${wordIndex}`&&rotationWords(config).length){
          const {prefix,suffix}=splitPunctuation(word);appendEmojiText(wrap,prefix);
          const glyph=document.createElement('span');glyph.className='ds-glyph';wrap.append(glyph);rotator=createTextRotation(glyph,config,{suffix,dynamicWidth:scope==='contact'});
        }else for(const char of graphemes(word)){const glyph=document.createElement('span');glyph.className='ds-glyph';appendEmojiText(glyph,char);wrap.append(glyph);}
        wordIndex++;line.append(wrap);
      });
      if(!text)line.append(document.createTextNode('\u00a0'));h1.append(line);
    });
    fit();if(animate)replay();else if(!h1.hasAttribute('data-headline-pending'))rotator?.start();
  }
  const observer=new ResizeObserver(()=>{if(!fitFrame)fitFrame=requestAnimationFrame(fit);});observer.observe(h1.parentElement);
  update(initial);
  if(!deferReveal)initialFrame=requestAnimationFrame(()=>{initialFrame=0;replay();});
  return {update,replay,destroy(){observer.disconnect();cancelAnimationFrame(initialFrame);cancelAnimationFrame(fitFrame);animations.forEach(a=>a.cancel());rotator?.destroy();}};
}
