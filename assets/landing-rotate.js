import {appendEmojiText,graphemes} from './site-emoji.js?v=20261117-site8';
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
export function createTextRotation(host,config,{suffix=''}={}){
  const words=rotationWords(config).map(word=>suffix&&!word.endsWith(suffix)?word+suffix:word),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  host.classList.add('ds-rotate');
  for(const word of words){const measure=document.createElement('span');measure.className='ds-rotate-measure';appendEmojiText(measure,word);host.append(measure);}
  const clip=document.createElement('span');clip.className='ds-rotate-clip';host.append(clip);
  let index=0,timer=0,visible=false,running=true,destroyed=false,notBefore=0,animations=[];
  function entry(text){
    const el=document.createElement('span');el.className='ds-rotate-entry';
    const add=(parent,chunk)=>{const piece=document.createElement('span');piece.className='ds-rotate-piece';appendEmojiText(piece,chunk);parent.append(piece);};
    if(config.rotateSplit==='whole')add(el,text);
    else for(const word of text.split(/(\s+)/).filter(Boolean)){
      if(/^\s+$/.test(word)){el.append(document.createTextNode(word));continue;}
      const wrap=document.createElement('span');wrap.className='ds-rotate-word';
      for(const chunk of config.rotateSplit==='words'?[word]:graphemes(word))add(wrap,chunk);
      el.append(wrap);
    }
    return el;
  }
  let current=entry(words[0]);clip.append(current);
  function clear(){clearTimeout(timer);timer=0;}
  function arm(){
    clear();if(!running||destroyed||!visible||document.hidden||reduced.matches||words.length<2)return;
    timer=setTimeout(next,Math.max(config.rotateInterval,notBefore-performance.now()));
  }
  async function next(){
    timer=0;if(destroyed||document.hidden||!visible||reduced.matches)return;
    const old=current;index=(index+1)%words.length;current=entry(words[index]);clip.append(current);
    const pieces=[...current.querySelectorAll('.ds-rotate-piece')],count=pieces.length;
    const order=pieces.map((_,i)=>i);if(config.rotateFrom==='random')for(let i=count-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    animations=[...old.querySelectorAll('.ds-rotate-piece')].map((el,i)=>el.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-120%)',opacity:0}],{duration:config.rotateDuration*.55,delay:i*config.rotateStagger*.45,easing:'cubic-bezier(.4,0,1,1)',fill:'both'}));
    pieces.forEach((el,i)=>{
      const rank=config.rotateFrom==='last'?count-1-i:config.rotateFrom==='center'?Math.abs(i-(count-1)/2):config.rotateFrom==='random'?order[i]:i;
      const frames=[];
      // Fancy Text Rotate's upward spring, expressed with native animations.
      for(let n=0;n<=50;n++){const t=n/50*config.rotateDuration/1000,d=Math.exp(-12.5*t)*(Math.cos(11.9896*t)+12.5/11.9896*Math.sin(11.9896*t));frames.push({transform:`translateY(${n===50?0:100*d}%)`,opacity:Math.min(1,n/12),offset:n/50});}
      animations.push(el.animate(frames,{duration:config.rotateDuration,delay:config.rotateDuration*.14+rank*config.rotateStagger,easing:'linear',fill:'both'}));
    });
    await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    old.remove();animations.forEach(a=>a.cancel());animations=[];if(!destroyed)arm();
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;arm();});observer.observe(host);
  const visibility=()=>arm();document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);
  return {start(delay=0){running=true;notBefore=performance.now()+delay;arm();},pause(){running=false;clear();},destroy(){destroyed=true;clear();animations.forEach(a=>a.cancel());observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);}};
}
