export function expandedGalleryHeight(config,vertical,width){
  const adaptive=vertical?config.verticalGalleryAdaptive:config.galleryAdaptive;
  if(!adaptive)return vertical?config.verticalGalleryHeight:config.galleryHeight;
  return Math.round(Math.max(vertical?140:160,Math.min(vertical?360:520,width*9/16)));
}
export function galleryCaptionKind({active,vertical,mobile,hovered,focused}){
  if(active&&(mobile||hovered||focused))return 'full';
  return !active&&vertical&&mobile?'compact':'none';
}
