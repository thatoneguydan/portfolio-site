export function panelClosePosition({top,height},navBottom,{projectCloseTop:offset,projectCloseNavGap:gap,projectCloseSize:size}){
  return Math.min(Math.max(offset,navBottom+gap-top),Math.max(offset,height-size-offset));
}
export function panelSurfacePath(width,height,center,tail,radius){const r=Math.min(radius,width/2,Math.max(0,height/2)),c=Math.max(r,Math.min(width-r,center)),half=Math.max(0,Math.min(tail,c-r,width-r-c)),h=Math.max(0,height);return`M${r} 0 H${c-half} L${c} ${-tail} L${c+half} 0 H${width-r} Q${width} 0 ${width} ${r} V${h-r} Q${width} ${h} ${width-r} ${h} H${r} Q0 ${h} 0 ${h-r} V${r} Q0 0 ${r} 0 Z`;}
export function panelTailCenter(source,panel,size,radius){
  const inset=Math.min(panel.width/2,radius+2);
  return Math.max(inset,Math.min(panel.width-inset,source.left+source.width/2-panel.left));
}
export function neighborMaskBounds(source,neighbor,vertical=false){
  const cutoff=source.bottom+(vertical?0:14);
  if(neighbor.bottom<=cutoff)return null;
  return{start:cutoff-48-neighbor.top,end:cutoff-neighbor.top};
}
