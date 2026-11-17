import {emojiPaths,emojiBase,localEmoji} from './fluent-emoji-map.js';
import {createPaletteGlyph} from './palette-glyph.js?v=20261117-site9';

export const graphemes=text=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(String(text))].map(s=>s.segment):Array.from(String(text));
export function emojiUrl(glyph){
  // Keep text-style arrows, copyright symbols, etc. in the site's typeface.
  if(!/[\p{Emoji_Presentation}\uFE0F\u20E3]/u.test(glyph))return null;
  const key=glyph.replace(/\uFE0F/g,''),path=emojiPaths[key];
  if(key==='🎨')return '/assets/fluent-emoji/1f3a8-yellow.png';
  return path?(localEmoji[key]||emojiBase+path.split('/').map(encodeURIComponent).join('/')):null;
}
export function appendEmojiText(parent,text){
  for(const glyph of graphemes(text)){
    const url=emojiUrl(glyph);
    if(url){
      if(glyph.replace(/\uFE0F/g,'')==='🎨'){parent.append(createPaletteGlyph(url));continue;}
      const img=document.createElement('img');img.className='ms-emoji';img.src=url;img.alt=glyph;img.draggable=false;img.width=32;img.height=32;
      img.addEventListener('error',()=>{const fallback=document.createElement('span');fallback.dataset.nativeEmoji='';fallback.textContent=glyph;img.replaceWith(fallback);},{once:true});parent.append(img);
    }else parent.append(document.createTextNode(glyph));
  }
}
export function installAuthoredEmoji(){
  const skip='form,input,textarea,select,[contenteditable]:not([contenteditable="false"]),script,style,code,pre,#dan-owner-controls,.ds-reveal,[data-native-emoji]';
  const scan=root=>{
    if(root.nodeType!==1||root.closest(skip))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:node=>/[\p{Emoji_Presentation}\uFE0F\u20E3]/u.test(node.data)&&!node.parentElement.closest(skip)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(!graphemes(node.data).some(emojiUrl))continue;
      const fragment=document.createDocumentFragment();appendEmojiText(fragment,node.data);node.replaceWith(fragment);
    }
  };
  scan(document.body);
  const observer=new MutationObserver(records=>{
    const roots=new Set();
    for(const r of records)if(r.type==='characterData')roots.add(r.target.parentElement);else for(const n of r.addedNodes)roots.add(n.nodeType===1?n:n.parentElement);
    roots.forEach(el=>{if(el?.isConnected)scan(el);});
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  return ()=>observer.disconnect();
}
