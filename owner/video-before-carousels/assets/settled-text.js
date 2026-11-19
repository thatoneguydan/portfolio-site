// Changing a reveal container must not continuously rewrap its text.
export function installSettledShelfText(){
  const toggles=new Set();let scheduled=0;
  function measure(){
    scheduled=0;
    for(const toggle of toggles){
      if(!toggle.isConnected){toggles.delete(toggle);continue;}
      const copy=toggle.querySelector('.rv-shelf-copy');if(!copy)continue;
      if(!matchMedia('(min-width: 761px)').matches){copy.style.removeProperty('width');continue;}
      const clone=toggle.cloneNode(true);clone.dataset.settledMeasure='true';clone.inert=true;clone.setAttribute('aria-hidden','true');clone.setAttribute('aria-expanded','false');
      Object.assign(clone.style,{position:'fixed',left:'0px',top:'-10000px',width:toggle.getBoundingClientRect().width+'px',margin:'0',visibility:'hidden',pointerEvents:'none',transition:'none'});
      clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));clone.removeAttribute('id');
      clone.querySelectorAll('*').forEach(el=>{el.style.transition='none';el.style.animation='none';});
      const measured=clone.querySelector('.rv-shelf-copy');measured.style.removeProperty('width');
      toggle.parentElement.append(clone);
      const width=measured.getBoundingClientRect().width;clone.remove();
      if(width>0)copy.style.width=width+'px';
    }
  }
  const schedule=()=>{if(!scheduled)scheduled=requestAnimationFrame(measure);};
  function discover(root){
    if(root.nodeType!==1||root.closest('[data-settled-measure]'))return;
    const found=[...(root.matches('.rv-shelf-toggle')?[root]:[]),...root.querySelectorAll('.rv-shelf-toggle')];
    for(const toggle of found)if(!toggle.closest('[data-settled-measure]'))toggles.add(toggle);
    if(found.length)schedule();
  }
  discover(document.body);addEventListener('resize',schedule,{passive:true});addEventListener('load',schedule,{once:true});document.fonts?.ready.then(schedule);
  new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)discover(node);}).observe(document.body,{childList:true,subtree:true});
}
