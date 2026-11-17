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
  const solid=Math.min(height,captionHeight+bottom+fontSize*.25);
  const cover=compact?height:Math.min(height,Math.max(height*coverage/100,solid+fontSize*1.1));
  return {solid,cover,percent:height?cover/height*100:coverage,strength:strength*Math.max(.5,fontSize/20)};
}
