export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function fitBadge(width,height,availableWidth,availableHeight=Infinity,rotation=0){
  const angle=Math.abs(rotation)*Math.PI/180;
  const projectedWidth=width*Math.cos(angle)+height*Math.sin(angle);
  const projectedHeight=height*Math.cos(angle)+width*Math.sin(angle);
  const scale=Math.max(.05,Math.min(1,availableWidth/projectedWidth,availableHeight/projectedHeight));
  return {scale,width:width*scale,height:height*scale};
}
export function shouldDismiss(distance,speed){return distance>100||(distance>24&&speed>.55);}
