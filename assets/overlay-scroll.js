// One scroll lock for modal surfaces, including a viewer opened from a frame.
const owners=new Set();
let saved=null;
function remember(style,keys){return keys.map(key=>[key,style.getPropertyValue(key),style.getPropertyPriority(key)]);}
function restore(style,entries){for(const [key,value,priority]of entries)value?style.setProperty(key,value,priority):style.removeProperty(key);}
export function lockOverlayScroll(owner){
  if(owners.has(owner))return;owners.add(owner);if(saved)return;
  const root=document.documentElement,body=document.body;
  saved={x:scrollX,y:scrollY,root:remember(root.style,['overflow','scroll-behavior']),body:remember(body.style,['overflow'])};
  root.style.setProperty('overflow','hidden','important');root.style.setProperty('scroll-behavior','auto','important');
  // Preserve the scroll coordinate and sticky-header layout. Fixing the body
  // would reset the scrollport and make the navigation jump behind the blur.
  // `clip` blocks overflow without creating a new scroll container around the
  // sticky header; the document root owns the actual scroll lock.
  body.style.setProperty('overflow','clip','important');
}
export function unlockOverlayScroll(owner){
  if(!owners.delete(owner)||owners.size||!saved)return;
  const previous=saved;saved=null;
  restore(document.body.style,previous.body);
  restore(document.documentElement.style,previous.root.filter(([key])=>key!=='scroll-behavior'));
  scrollTo(previous.x,previous.y);
  restore(document.documentElement.style,previous.root.filter(([key])=>key==='scroll-behavior'));
}
document.addEventListener('wheel',event=>{if(owners.size&&!event.ctrlKey)event.preventDefault();},{passive:false,capture:true});
document.addEventListener('touchmove',event=>{if(owners.size)event.preventDefault();},{passive:false,capture:true});
