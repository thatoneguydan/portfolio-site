// One scroll lock for modal surfaces, including a viewer opened from a frame.
const owners=new Set();
let saved=null;
const bodyKeys=['position','top','left','width','overflow'];
function remember(style,keys){return keys.map(key=>[key,style.getPropertyValue(key),style.getPropertyPriority(key)]);}
function restore(style,entries){for(const [key,value,priority]of entries)value?style.setProperty(key,value,priority):style.removeProperty(key);}
export function lockOverlayScroll(owner){
  if(owners.has(owner))return;owners.add(owner);if(saved)return;
  const root=document.documentElement,body=document.body;
  saved={x:scrollX,y:scrollY,root:remember(root.style,['overflow','scroll-behavior']),body:remember(body.style,bodyKeys)};
  const width=root.clientWidth;
  root.style.setProperty('overflow','hidden','important');root.style.setProperty('scroll-behavior','auto','important');
  body.style.setProperty('position','fixed','important');body.style.setProperty('top',-saved.y+'px','important');body.style.setProperty('left',-saved.x+'px','important');
  body.style.setProperty('width',width+'px','important');body.style.setProperty('overflow','hidden','important');
}
export function unlockOverlayScroll(owner){
  if(!owners.delete(owner)||owners.size||!saved)return;
  const previous=saved;saved=null;
  restore(document.body.style,previous.body);
  restore(document.documentElement.style,previous.root.filter(([key])=>key!=='scroll-behavior'));
  scrollTo(previous.x,previous.y);
  restore(document.documentElement.style,previous.root.filter(([key])=>key==='scroll-behavior'));
}
addEventListener('resize',()=>{if(saved)document.body.style.setProperty('width',document.documentElement.clientWidth+'px','important');},{passive:true});
