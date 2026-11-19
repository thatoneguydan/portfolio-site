// Reuse the exact PNG twice: only the backing is filtered. The four paint
// swatches are restored from the original, unfiltered pixels at the same size.
let sequence=0,saturation=.42;
const namespace='http://www.w3.org/2000/svg';
const paintCircles=[[113.5,72,20],[68.5,104.5,20],[69,162,20],[113.5,197,20]];
export function createPaletteGlyph(source){
  const id='palette-'+(++sequence),svg=document.createElementNS(namespace,'svg');
  for(const [key,value]of Object.entries({viewBox:'0 0 256 256',width:32,height:32,role:'img','aria-label':'🎨',class:'ms-emoji ms-palette'}))svg.setAttribute(key,value);
  const defs=document.createElementNS(namespace,'defs'),filter=document.createElementNS(namespace,'filter'),matrix=document.createElementNS(namespace,'feColorMatrix'),clip=document.createElementNS(namespace,'clipPath');
  filter.id=id+'-backing';filter.setAttribute('color-interpolation-filters','sRGB');matrix.setAttribute('type','saturate');matrix.setAttribute('values',saturation);matrix.dataset.paletteMatrix='';filter.append(matrix);
  clip.id=id+'-paint';clip.setAttribute('clipPathUnits','userSpaceOnUse');
  for(const [cx,cy,r]of paintCircles){const circle=document.createElementNS(namespace,'circle');for(const [key,value]of Object.entries({cx,cy,r}))circle.setAttribute(key,value);clip.append(circle);}
  defs.append(filter,clip);svg.append(defs);
  for(const paint of [false,true]){const image=document.createElementNS(namespace,'image');image.setAttribute('href',source);image.setAttribute('width','256');image.setAttribute('height','256');image.setAttribute(paint?'clip-path':'filter',`url(#${id+(paint?'-paint':'-backing')})`);svg.append(image);}
  return svg;
}
export function setPaletteSaturation(percent){saturation=Math.max(0,Math.min(1,percent/100));document.querySelectorAll('[data-palette-matrix]').forEach(matrix=>matrix.setAttribute('values',saturation));}
