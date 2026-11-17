export function panelClosePosition({top,height},navBottom,{projectCloseTop:offset,projectCloseNavGap:gap,projectCloseSize:size}){
  return Math.min(Math.max(offset,navBottom+gap-top),Math.max(offset,height-size-8));
}
export function panelTailCenter(source,panel,size,radius){
  const inset=Math.min(panel.width/2,radius+size+3);
  return Math.max(inset,Math.min(panel.width-inset,source.left+source.width/2-panel.left));
}
