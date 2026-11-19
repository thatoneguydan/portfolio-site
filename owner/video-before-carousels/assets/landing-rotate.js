import {appendEmojiText,graphemes} from './site-emoji.js?v=20261118-perf1';
export const headlineLines=config=>Array.from({length:config.lineCount},(_,i)=>config['line'+(i+1)]||'');
export const rotationWords=config=>config.rotateWords.split(',').map(s=>s.trim()).filter(Boolean);
export function splitPunctuation(word){
  const prefix=word.match(/^[([{"'“‘]*/u)?.[0]||'';
  const suffix=word.slice(prefix.length).match(/[.,!?;:)\]}"'”’]*$/u)?.[0]||'';
  return {prefix,body:word.slice(prefix.length,word.length-suffix.length),suffix};
}
export function targetChoices(config){
  return headlineLines(config).flatMap((line,i)=>line.split(/\s+/).filter(Boolean).map((word,j)=>({value:`${i+1}:${j}`,label:`Line ${i+1} · ${j+1}: ${word}`})));
}
export function accessibleHeadline(config){
  const first=rotationWords(config)[0];
  return headlineLines(config).map((line,i)=>{
    let wordIndex=0;
    return line.split(/(\s+)/).map(word=>{
      if(!word||/^\s+$/.test(word))return word;
      const target=`${i+1}:${wordIndex++}`;
      if(!config.rotateEnabled||!first||target!==config.rotateTarget)return word;
      const {prefix,suffix}=splitPunctuation(word);
      return prefix+first+(suffix&&!first.endsWith(suffix)?suffix:'');
    }).join('');
  }).join(' ');
}
export function rotationEntry(text,split){
  const el=document.createElement('span');el.className='ds-rotate-entry';
  const add=(parent,chunk)=>{const piece=document.createElement('span');piece.className='ds-rotate-piece';appendEmojiText(piece,chunk);parent.append(piece);};
  if(split==='whole')add(el,text);
  else for(const word of text.split(/(\s+)/).filter(Boolean)){
    if(/^\s+$/.test(word)){el.append(document.createTextNode(word));continue;}
    const wrap=document.createElement('span');wrap.className='ds-rotate-word';
    for(const chunk of split==='words'?[word]:graphemes(word))add(wrap,chunk);
    el.append(wrap);
  }
  return el;
}

export function animateRotationEntries(old,current,{rotateFrom,rotateDuration,rotateStagger}){
  const pieces=[...current.querySelectorAll('.ds-rotate-piece')],count=pieces.length;
  const order=pieces.map((_,i)=>i);if(rotateFrom==='random')for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const animations=[...old.querySelectorAll('.ds-rotate-piece')].map((el,i)=>el.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-120%)',opacity:0}],{duration:rotateDuration*.55,delay:i*rotateStagger*.45,easing:'cubic-bezier(.4,0,1,1)',fill:'both'}));
  const frames=[];
  // Fancy Text Rotate's upward spring, expressed with native animations.
  for(let n=0;n<=50;n++){const t=n/50*rotateDuration/1000,d=Math.exp(-12.5*t)*(Math.cos(11.9896*t)+12.5/11.9896*Math.sin(11.9896*t));frames.push({transform:`translateY(${n===50?0:100*d}%)`,opacity:Math.min(1,n/12),offset:n/50});}
  pieces.forEach((el,i)=>{
    const rank=rotateFrom==='last'?count-1-i:rotateFrom==='center'?Math.abs(i-(count-1)/2):rotateFrom==='random'?order[i]:i;
    animations.push(el.animate(frames,{duration:rotateDuration,delay:rotateDuration*.14+rank*rotateStagger,easing:'linear',fill:'both'}));
  });
  return animations;
}

export function createTextRotation(host,config,{suffix='',wrapEntries=false}={}){
  const words=rotationWords(config).map(word=>suffix&&!word.endsWith(suffix)?word+suffix:word),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  host.classList.add('ds-rotate');
  host.classList.toggle('ds-rotate-wrap',wrapEntries);
  const measures=wrapEntries?[]:words.map(word=>{
    // These out-of-flow swatches let single-line headings choose a stable type
    // size. They never determine the space taken by the painted phrase.
    const measure=rotationEntry(word,config.rotateSplit);
    measure.className='ds-rotate-measure';
    measure.setAttribute('aria-hidden','true');
    host.append(measure);
    return measure;
  });
  const sizer=document.createElement('span');sizer.className='ds-rotate-sizer';sizer.textContent='Ag';sizer.setAttribute('aria-hidden','true');host.append(sizer);
  const clip=document.createElement('span');clip.className='ds-rotate-clip';host.append(clip);
  let index=0,timer=0,visible=false,running=false,destroyed=false,notBefore=0,animations=[],generation=0,widthMotion=null;
  const measureWidth=i=>measures[i]?.getBoundingClientRect().width||0;
  const fitExtraWidth=()=>Math.max(0,...measures.map((_,i)=>measureWidth(i)))-measureWidth(index);
  function setEntrySize(){
    // Keep the outgoing text on its settled plane while the host follows the
    // incoming entry's actual dimensions.
    current.style.removeProperty('width');
    const size=current.getBoundingClientRect();
    current.style.width=size.width+'px';
    host.style.width=size.width+'px';
    host.style.height=size.height+'px';
    return size;
  }
  function syncWidth(){widthMotion?.cancel();widthMotion=null;setEntrySize();}
  function morphWidth(){
    const previous=host.getBoundingClientRect();
    widthMotion?.cancel();
    const settled=setEntrySize();
    if(!reduced.matches){
      const size=box=>({width:box.width+'px',height:box.height+'px'});
      const motion=host.animate([size(previous),size(settled)],{duration:config.rotateDuration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
      widthMotion=motion;
      motion.finished.catch(()=>{}).then(()=>{if(widthMotion===motion){motion.cancel();widthMotion=null;}});
    }
  }
  let current=rotationEntry(words[0],config.rotateSplit);clip.append(current);
  function clear(){clearTimeout(timer);timer=0;}
  function arm(){
    clear();if(!running||destroyed||!visible||document.hidden||reduced.matches||words.length<2)return;
    timer=setTimeout(next,Math.max(config.rotateInterval,notBefore-performance.now()));
  }
  async function next(){
    timer=0;if(destroyed||!running||document.hidden||!visible||reduced.matches)return;
    const token=++generation;
    const old=current;index=(index+1)%words.length;current=rotationEntry(words[index],config.rotateSplit);clip.append(current);morphWidth();
    animations=animateRotationEntries(old,current,config);
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    if(token!==generation||destroyed)return;
    old.remove();animations.forEach(a=>a.cancel());animations=[];if(!destroyed)arm();
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;arm();});observer.observe(host);
  const visibility=()=>arm();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);
  return {syncWidth,fitExtraWidth,start(delay=0){running=true;notBefore=performance.now()+delay;arm();},pause(){running=false;clear();},reset(){running=false;clear();generation++;animations.forEach(a=>a.cancel());animations=[];index=0;current=rotationEntry(words[0],config.rotateSplit);clip.replaceChildren(current);syncWidth();},destroy(){destroyed=true;generation++;clear();widthMotion?.cancel();animations.forEach(a=>a.cancel());observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);}};
}
