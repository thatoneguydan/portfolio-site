export function expandedGalleryHeight(config,vertical,width){
  const adaptive=vertical?config.verticalGalleryAdaptive:config.galleryAdaptive;
  if(!adaptive)return vertical?config.verticalGalleryHeight:config.galleryHeight;
  return Math.round(Math.max(vertical?140:160,Math.min(vertical?360:520,width*9/16)));
}
export function galleryCaptionKind({active,vertical,mobile,hovered,focused}){
  if(active&&(mobile||hovered||focused))return 'full';
  return !active&&vertical&&mobile?'compact':'none';
}
export function captionBlurGeometry({height,captionHeight,bottom,fontSize,coverage,strength,compact=false}){
  const solid=Math.min(height,Math.max(0,captionHeight+bottom));
  const feather=Math.max(8,fontSize*(.35+coverage/100));
  const cover=Math.min(height,solid+feather);
  const shadeCover=Math.min(height,solid+Math.max(44,fontSize*2.4));
  return {solid,cover,shadeCover,percent:height?cover/height*100:0,strength:strength*Math.max(.5,fontSize/20)};
}
export function captionShadeGradient({solid,shadeCover}){
  const start=solid*.35,span=Math.max(1,shadeCover-start);
  const stops=Array.from({length:25},(_,i)=>{
    const distance=shadeCover*i/24,t=Math.max(0,Math.min(1,(distance-start)/span));
    const smooth=t*t*t*(t*(t*6-15)+10),alpha=.82*(1-smooth);
    return `rgba(0,0,0,${alpha.toFixed(4)}) ${distance.toFixed(2)}px`;
  });
  return `linear-gradient(to top,${stops.join(',')})`;
}
