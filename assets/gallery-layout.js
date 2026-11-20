export function gallerySettings(config,vertical,orientation){
  if(orientation==='portrait'){
    const prefix=vertical?'portraitVerticalGallery':'portraitGallery';
    return {
      adaptive:config[prefix+'Adaptive'],height:config[prefix+'Height'],gap:config[prefix+'Gap'],
      radius:config[prefix+'Radius'],duration:config[prefix+'Duration'],grayscale:config[prefix+'Grayscale'],
      aspect:config[prefix+'Aspect']/100,expandRatio:config.portraitGalleryExpandRatio/100,
      collapsed:config.portraitVerticalGalleryCollapsed,padding:vertical?config.portraitVerticalGalleryPadding:20,
      titleSize:vertical?config.portraitVerticalGalleryTitleSize:20,compactTitleSize:config.portraitVerticalGalleryCompactTitleSize
    };
  }
  return {
    adaptive:vertical?config.verticalGalleryAdaptive:config.galleryAdaptive,
    height:vertical?config.verticalGalleryHeight:config.galleryHeight,
    gap:vertical?config.verticalGalleryGap:config.galleryGap,
    radius:vertical?config.verticalGalleryRadius:config.galleryRadius,
    duration:vertical?config.verticalGalleryDuration:config.galleryDuration,
    grayscale:vertical?config.verticalGalleryGrayscale:config.grayscale,
    aspect:16/9,expandRatio:config.expandRatio/100,collapsed:config.verticalGalleryCollapsed,
    padding:vertical?config.verticalGalleryPadding:20,titleSize:vertical?config.verticalGalleryTitleSize:20,
    compactTitleSize:config.verticalGalleryCompactTitleSize
  };
}
function expandedHeight(settings,vertical,width,portrait){
  if(!settings.adaptive)return settings.height;
  // The desktop portrait width budget already limits height where it can.
  const max=vertical?(portrait?800:430):portrait?Infinity:760;
  return Math.round(Math.max(vertical?140:160,Math.min(max,width/settings.aspect)));
}
export function expandedGalleryHeight(config,vertical,width,orientation){
  return expandedHeight(gallerySettings(config,vertical,orientation),vertical,width,orientation==='portrait');
}

const portraitNeighborRatio=.8;
function portraitFocusWidth(settings,usable,count,minimum,decay){
  if(count===1)return usable;
  const others=count-1;
  const maxFocus=usable-minimum*others;
  // The nearest strip receives its largest share when the selection is
  // at either end. Budget for that case so the row height remains steady.
  const closestShare=(1-decay)/(1-decay**others);
  const widthForSeparation=(minimum+maxFocus*closestShare)/(portraitNeighborRatio+closestShare);
  const preferred=usable*settings.expandRatio;
  const preferredLimit=settings.adaptive?900*settings.aspect:Infinity;
  return Math.min(maxFocus,Math.max(widthForSeparation,Math.min(preferred,preferredLimit)));
}

export function featuredGalleryLayout(config,vertical,width,count,active,orientation){
  const settings=gallerySettings(config,vertical,orientation);
  const {gap,radius,collapsed:compactHeight,compactTitleSize,expandRatio}=settings;
  const usable=Math.max(0,width-gap*(count-1));
  const portrait=orientation==='portrait';
  const horizontalPortrait=portrait&&!vertical;
  const stripLimit=horizontalPortrait?usable*portraitNeighborRatio/(1+portraitNeighborRatio*(count-1)):usable/count;
  const minimum=vertical
    ? Math.max(2*radius+4,Math.ceil(compactTitleSize*2.4+30))
    : Math.min(stripLimit,Math.max(24,2*radius+4));
  const nearest=vertical?compactHeight:usable*(1-expandRatio)/Math.max(1,count-1);

  // Budget the outer strips once. Selecting a middle card redistributes that
  // same space between its two sides, keeping the active crop and row steady.
  const decay=.62;
  const surplus=horizontalPortrait
    ? Math.max(0,usable-portraitFocusWidth(settings,usable,count,minimum,decay)-minimum*(count-1))
    : Math.max(0,nearest-minimum)*(1-decay**(count-1))/(1-decay);
  const collapsed=minimum*(count-1)+surplus;
  const expandedWidth=vertical?width:usable-collapsed;
  const height=expandedHeight(settings,vertical,expandedWidth,portrait);
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
