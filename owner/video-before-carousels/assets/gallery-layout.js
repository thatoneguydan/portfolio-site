export function expandedGalleryHeight(config,vertical,width){
  const adaptive=vertical?config.verticalGalleryAdaptive:config.galleryAdaptive;
  if(!adaptive)return vertical?config.verticalGalleryHeight:config.galleryHeight;
  return Math.round(Math.max(vertical?140:160,Math.min(vertical?430:760,width*9/16)));
}
export function featuredGalleryLayout(config,vertical,width,count,active){
  const gap=vertical?config.verticalGalleryGap:config.galleryGap;
  const usable=Math.max(0,width-gap*(count-1));
  const radius=vertical?config.verticalGalleryRadius:config.galleryRadius;
  const minimum=vertical
    ? Math.max(2*radius+4,Math.ceil(config.verticalGalleryCompactTitleSize*2.4+30))
    : Math.min(usable/count,Math.max(24,2*radius+4));
  const nearest=vertical?config.verticalGalleryCollapsed:usable*(1-config.expandRatio/100)/Math.max(1,count-1);

  // Budget the outer strips once. Selecting a middle card redistributes that
  // same space between its two sides, keeping the active crop and row steady.
  const decay=.62;
  const surplus=Math.max(0,nearest-minimum)*(1-decay**(count-1))/(1-decay);
  const collapsed=minimum*(count-1)+surplus;
  const expandedWidth=vertical?width:usable-collapsed;
  const height=expandedGalleryHeight(config,vertical,expandedWidth);
  const weights=Array.from({length:count},(_,i)=>i===active?0:decay**(Math.abs(i-active)-1));
  const totalWeight=weights.reduce((sum,weight)=>sum+weight,0);
  const extents=weights.map((weight,i)=>i===active?(vertical?height:expandedWidth):minimum+surplus*weight/totalWeight);
  return {expandedWidth,height,extents,totalHeight:vertical?height+collapsed+gap*(count-1):height};
}
export function galleryCaptionKind({active,vertical}){
  return vertical||active?'full':'none';
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
