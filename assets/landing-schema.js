export const defaults = {
  "line1": "HI 👋 THERE!",
  "line2": "😊 READY TO",
  "line3": "MAKE 🎨 SOMETHING GREAT?",
  "line4": "",
  "line5": "",
  "line6": "",
  "lineCount": 3,
  "rotateEnabled": true,
  "rotateTarget": "3:3",
  "rotateWords": "GREAT, CLEAR, MEMORABLE",
  "rotateInterval": 2600,
  "rotateDuration": 650,
  "rotateStagger": 22,
  "rotateSplit": "characters",
  "rotateFrom": "first",
  "portfolioBlur": true,
  "portfolioBlurStrength": 8,
  "portfolioBlurHeight": 33,
  "portfolioBlurDuration": 240,
  "paletteSaturation": 42,
  "bio": "I work across video, design, print, and photography to make things clear, intentional, and worth looking at.",
  "fontSize": 53,
  "fontWeight": 500,
  "lineHeight": 1.17,
  "splitBy": "characters",
  "stagger": 25,
  "duration": 1000,
  "lineDelay": 350,
  "direction": "alternating",
  "staggerFrom": "first",
  "animate": true,
  "ticketName": "Dan Smith",
  "ticketHeading": "Who is Dan?",
  "ticketOrientation": "horizontal",
  "ticketWidth": 480,
  "ticketHeight": 380,
  "ticketPanelSize": 180,
  "ticketRadius": 16,
  "ticketImageRadius": 8,
  "ticketAutoImageRadius": true,
  "ticketResponsive": true,
  "ticketScrim": true,
  "scrimColor": "#111111",
  "scrimBlend": "normal",
  "scrimOpacity": 100,
  "scrimAngle": 90,
  "scrimDistance": 0,
  "scrimSpread": 0,
  "scrimSize": 80,
  "photoPosition": 17,
  "photoPositionX": 50,
  "ticketRotation": 4,
  "ticketTilt": true,
  "ticketTiltMax": 9,
  "ticketTiltReach": 260,
  "ticketParallax": 6,
  "ticketPerspective": 1000,
  "ticketBackground": "#111111",
  "ticketColor": "#f5f5f2",
  "ticketPanelBackground": "#111111",
  "ticketCustomPanelBackground": false,
  "ticketBorder": true,
  "ticketBorderWidth": 2.5,
  "ticketBorderColor": "#474747",
  "ticketBorderOpacity": 100,
  "ticketDisabled": false,
  "ticketNameSize": 18,
  "ticketNameWeight": 500,
  "ticketNameAlign": "left",
  "badgeName": "",
  "badgeNameSize": 14,
  "badgeNameWeight": 500,
  "badgeNameAlign": "center",
  "ticketHeadingSize": 27,
  "ticketHeadingWeight": 800,
  "ticketBodySize": 13,
  "ticketBodyWeight": 400,
  "ticketCopyAlign": "left",
  "ticketCopyCenter": false,
  "ticketBodyLineHeight": 1.65,
  "ticketBodyOpacity": 50,
  "ticketShadow": true,
  "shadowX": 0,
  "shadowY": 12,
  "shadowBlur": 22,
  "shadowSpread": 0,
  "shadowOpacity": 68,
  "shadowColor": "#111111",
  "galleryHeight": 320,
  "galleryAdaptive": true,
  "expandRatio": 52,
  "galleryGap": 10,
  "galleryRadius": 16,
  "galleryDuration": 600,
  "grayscale": false,
  "activeIndex": 0,
  "badgeScrollTilt": 20,
  "badgeCompactWidth": 92,
  "badgeBreakpoint": 760,
  "badgeLinkNavBreakpoint": true,
  "badgeExpandedWidth": 92,
  "badgeExpandedHeight": 86,
  "badgeEntrance": true,
  "badgeEntrancePosition": 1,
  "badgeEntranceDuration": 850,
  "badgeEntranceBounce": 3,
  "badgeEntranceHold": 220,
  "badgeEntranceSettle": 750,
  "badgeCompactScale": 1,
  "badgeCompactTextRatio": 1,
  "badgeHoverScale": 1.04,
  "badgeMorphDuration": 520,
  "badgeBackdropBlur": 10,
  "badgeOverlap": 32,
  "badgeIdleTilt": true,
  "badgeIdleAngle": 1.1,
  "badgeIdlePeriod": 10,
  "badgeIdleEase": 900,
  "verticalGalleryHeight": 320,
  "verticalGalleryAdaptive": true,
  "verticalGalleryCollapsed": 64,
  "verticalGalleryGap": 10,
  "verticalGalleryRadius": 16,
  "verticalGalleryDuration": 600,
  "verticalGalleryGrayscale": false,
  "verticalGalleryTitleSize": 20,
  "verticalGalleryCompactTitleSize": 14,
  "verticalGalleryPadding": 17
};
export const controlGroups = {
    headlineTypography: [
      ['range','lineCount','Number of lines',1,6,1,''],
      ['range','fontSize','Text size',30,120,1,'px'], ['range','fontWeight','Text weight',100,900,100,''],
      ['range','lineHeight','Line spacing',1.05,1.5,.01,''],
      ['range','paletteSaturation','Palette emoji saturation',0,100,1,'%']
    ],
    reveal: [
      ['select','splitBy','Reveal by',['characters','words','lines']],
      ['range','stagger','Character / word stagger',0,100,1,'ms'],
      ['range','duration','Reveal duration',400,1800,50,'ms'], ['range','lineDelay','Delay between lines',0,1200,50,'ms'],
      ['select','direction','Reveal direction',[['alternating','Reference alternating'],['up','Up'],['down','Down']]],
      ['select','staggerFrom','Stagger origin',[['reference','Reference per line'],'first','last','center','random']],
      ['check','animate','Animate reveal']
    ],
    rotate: [
      ['check','rotateEnabled','Rotate a headline word'],
      ['range','rotateInterval','Time between words',1200,12000,100,'ms'],
      ['range','rotateDuration','Word animation duration',250,1600,50,'ms'],
      ['range','rotateStagger','Letter / word stagger',0,80,1,'ms'],
      ['select','rotateSplit','Animate by',['characters','words','whole']],
      ['select','rotateFrom','Stagger from',['first','last','center','random']]
    ],
    portfolioEffects: [
      ['check','portfolioBlur','Progressive blur behind captions'],
      ['range','portfolioBlurStrength','Maximum blur',0,24,.5,'px'],
      ['range','portfolioBlurHeight','Blur height',20,100,1,'%'],
      ['range','portfolioBlurDuration','Blur hover duration',100,800,20,'ms']
    ],
    ticketLayout: [
      ['select','ticketOrientation','Orientation',['horizontal','vertical']],
      ['range','ticketWidth','Width',220,560,10,'px'], ['range','ticketHeight','Height',140,460,10,'px'],
      ['range','ticketPanelSize','Text panel size',70,180,2,'px'], ['range','ticketRadius','Radius',0,32,1,'px'],
      ['check','ticketAutoImageRadius','Image radius follows card'], ['range','ticketImageRadius','Image radius',0,32,1,'px']
    ],
    ticketPhoto: [
      ['range','photoPositionX','Photo horizontal position',0,100,1,'%'],
      ['range','photoPosition','Photo vertical position',0,100,1,'%']
    ],
    ticketMotion: [
      ['range','ticketRotation','Rotate',-20,20,1,'°'], ['check','ticketTilt','Tilt'],
      ['range','ticketTiltMax','Tilt max',0,24,1,'°'], ['range','ticketTiltReach','Tilt reach',0,700,20,'px'],
      ['range','ticketParallax','Parallax',0,32,1,'px'], ['range','ticketPerspective','Perspective',400,2400,50,'px'],
      ['range','badgeHoverScale','Hover scale',1,1.12,.01,'×'],
      ['range','badgeScrollTilt','Scroll tilt',0,36,1,'°']
    ],
    ticketAppearance: [
      ['color','ticketBackground','Background'], ['color','ticketColor','Text color'],
      ['check','ticketCustomPanelBackground','Separate text-panel background'], ['color','ticketPanelBackground','Text-panel background'],
      ['check','ticketBorder','Border'], ['range','ticketBorderWidth','Border width',0,12,.25,'px'],
      ['color','ticketBorderColor','Border color'], ['range','ticketBorderOpacity','Border opacity',0,100,1,'%'],
      ['check','ticketDisabled','Disabled']
    ],
    ticketNameType: [
      ['range','ticketNameSize','Full ID name size',6,120,1,'px'], ['range','ticketNameWeight','Full ID name weight',100,1000,50,''],
      ['select','ticketNameAlign','Full ID name alignment',['left','center','right','justify']]
    ],
    badgeNameType: [
      ['range','badgeNameSize','Badge name size',6,100,1,'px'], ['range','badgeNameWeight','Badge name weight',100,1000,50,''],
      ['select','badgeNameAlign','Badge name alignment',['left','center','right','justify']]
    ],
    ticketHeadingType: [
      ['range','ticketHeadingSize','ID heading size',6,120,1,'px'], ['range','ticketHeadingWeight','ID heading weight',100,1000,50,'']
    ],
    ticketBodyType: [
      ['range','ticketBodySize','Short bio size',6,96,1,'px'], ['range','ticketBodyWeight','Short bio weight',100,1000,50,''],
      ['range','ticketBodyLineHeight','Short bio line spacing',.9,2.5,.05,''], ['range','ticketBodyOpacity','Short bio opacity',0,100,1,'%']
    ],
    ticketCopyLayout: [
      ['check','ticketCopyCenter','Center heading and bio vertically'],
      ['select','ticketCopyAlign','Heading and bio alignment',['left','right','center','justify']]
    ],
    ticketScrim: [
      ['check','ticketScrim','Photo scrim'], ['color','scrimColor','Scrim color'],
      ['select','scrimBlend','Blend mode',['normal','multiply','screen','overlay','darken','lighten','soft-light','hard-light']],
      ['range','scrimOpacity','Scrim opacity',0,100,1,'%'],
      ['range','scrimAngle','Light angle',-180,180,1,'°'],
      ['range','scrimDistance','Distance',-100,100,1,'%'],
      ['range','scrimSpread','Spread',0,100,1,'%'],
      ['range','scrimSize','Size',1,200,1,'%']
    ],
    ticketShadow: [
      ['check','ticketShadow','Drop shadow'], ['color','shadowColor','Shadow color'], ['range','shadowOpacity','Shadow opacity',0,100,1,'%'],
      ['range','shadowX','Horizontal offset',-50,50,1,'px'], ['range','shadowY','Vertical offset',-50,70,1,'px'],
      ['range','shadowBlur','Blur',0,100,1,'px'], ['range','shadowSpread','Spread',-25,30,1,'px']
    ],
    badge: [
      ['check','ticketResponsive','Collapse to photo badge'],
      ['check','badgeLinkNavBreakpoint','Match hamburger-menu breakpoint'],
      ['range','badgeBreakpoint','Custom badge breakpoint',320,1800,10,'px'],
      ['range','badgeCompactScale','Photo badge scale',.4,1.6,.01,'×'],
      ['range','badgeOverlap','Headline overlap',10,80,1,'%']
    ],
    badgeFullscreen: [
      ['range','badgeExpandedWidth','Expanded width',50,98,1,'%'],
      ['range','badgeExpandedHeight','Expanded height limit',50,94,1,'%'],
      ['range','badgeMorphDuration','Open / close duration',200,1000,20,'ms'],
      ['range','badgeBackdropBlur','Background blur',0,24,1,'px']
    ],
    badgeIdle: [
      ['check','badgeIdleTilt','Subtle idle tilt'],
      ['range','badgeIdleAngle','Idle tilt strength',0,30,.1,'°'],
      ['range','badgeIdlePeriod','Idle cycle length',.5,120,.5,'s']
      ,['range','badgeIdleEase','Ease into idle',200,3000,50,'ms']
    ],
    badgeEntrance: [
      ['check','badgeEntrance','Animate ID entrance'],
      ['range','badgeEntrancePosition','Entrance in text sequence',0,7,.1,''],
      ['range','badgeEntranceDuration','Entrance growth duration',250,3000,50,'ms'],
      ['range','badgeEntranceBounce','Entrance overshoot',0,18,.5,'%'],
      ['range','badgeEntranceHold','Hold at maximum size',0,2000,20,'ms'],
      ['range','badgeEntranceSettle','Rubber-band settling duration',200,3000,50,'ms']
    ],
    gallery: [
      ['check','galleryAdaptive','Responsive 16:9 height'],
      ['range','galleryHeight','Manual gallery height',240,500,1,'px'], ['range','expandRatio','Expanded width',35,75,1,'%'],
      ['range','galleryGap','Gallery gap',0,24,1,'px'], ['range','galleryRadius','Gallery radius',0,32,1,'px'],
      ['range','galleryDuration','Transition duration',200,1400,50,'ms'], ['check','grayscale','Grayscale inactive cards']
    ],
    galleryVertical: [
      ['check','verticalGalleryAdaptive','Responsive 16:9 height'],
      ['range','verticalGalleryHeight','Manual expanded card height',140,640,1,'px'],
      ['range','verticalGalleryCollapsed','Collapsed card height',44,140,1,'px'],
      ['range','verticalGalleryGap','Vertical gallery gap',0,32,1,'px'],
      ['range','verticalGalleryRadius','Vertical gallery radius',0,40,1,'px'],
      ['range','verticalGalleryDuration','Vertical transition duration',200,1400,50,'ms'],
      ['range','verticalGalleryTitleSize','Expanded title size',12,32,1,'px'],
      ['range','verticalGalleryCompactTitleSize','Collapsed title size',11,24,1,'px'],
      ['range','verticalGalleryPadding','Caption inset',10,32,1,'px'],
      ['check','verticalGalleryGrayscale','Grayscale inactive vertical cards']
    ]
  };

// Every page uses the same reveal/rotation engine and validation contract.
export const headlineScopes=['contact','video','design','photo'];
export const scopedKey=(scope,key)=>scope?scope+key[0].toUpperCase()+key.slice(1):key;
export function headlineSettings(config,scope=''){
  const fields=['lineCount','fontSize','fontWeight','lineHeight','splitBy','stagger','duration','lineDelay','direction','staggerFrom','animate','rotateEnabled','rotateTarget','rotateWords','rotateInterval','rotateDuration','rotateStagger','rotateSplit','rotateFrom',...Array.from({length:6},(_,i)=>'line'+(i+1))];
  return Object.fromEntries(fields.map(key=>[key,config[scopedKey(scope,key)]]));
}
const phraseWords='hold attention, get the click, tell a story, stop the scroll';
for(const scope of headlineScopes){
  const contact=scope==='contact';
  const initial={...headlineSettings(defaults),lineCount:contact?4:1,line1:contact?"Let's make":`${{video:'Videos',design:'Designs',photo:'Photos'}[scope]} that _.`,line2:contact?'something':'',line3:contact?'worth':'',line4:contact?'looking at.':'',line5:'',line6:'',fontSize:contact?112:56,fontWeight:700,lineHeight:contact?.94:1.08,rotateTarget:contact?'4:0':'1:2',rotateWords:contact?'looking, peeking, grinning, peering, marveling, smiling':phraseWords,lineDelay:160};
  for(const [key,value]of Object.entries(initial))defaults[scopedKey(scope,key)]=value;
  const scoped=fields=>fields.map(field=>{const next=[...field];next[1]=scopedKey(scope,next[1]);return next;});
  controlGroups[scope+'Typography']=scoped(controlGroups.headlineTypography.filter(field=>field[1]!=='paletteSaturation')).map(field=>{if(field[1]===scopedKey(scope,'fontSize')){field[3]=18;field[4]=180;}if(field[1]===scopedKey(scope,'lineHeight')){field[3]=.85;field[4]=2;}return field;});
  controlGroups[scope+'Reveal']=scoped(controlGroups.reveal);
  controlGroups[scope+'Rotate']=scoped(controlGroups.rotate);
}
export function normalizeSettings(input, base = defaults) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Settings must be an object.');
  const result={...defaults,...base};
  const colors=['ticketBackground','ticketColor','ticketPanelBackground','ticketBorderColor','shadowColor','scrimColor'];
  // Old saved settings keep their vertical appearance when first upgraded.
  const inherited={verticalGalleryHeight:['galleryHeight',v=>Math.min(360,v)],verticalGalleryGap:['galleryGap'],verticalGalleryRadius:['galleryRadius'],verticalGalleryDuration:['galleryDuration'],verticalGalleryGrayscale:['grayscale']};
  for(const [key,[source,convert]] of Object.entries(inherited))if(!(key in input)&&!(key in base&&base!==defaults)&&source in input)result[key]=convert?convert(input[source]):input[source];
  for(const [key,value] of Object.entries(input)) {
    if(!(key in defaults)) throw new Error('Unknown setting: '+key);
    if(typeof value!==typeof defaults[key]) throw new Error('Invalid setting: '+key);
    if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Invalid number: '+key);
    if(typeof value==='string'&&value.length>(/rotateWords$/i.test(key)?6000:2000))throw new Error('Text is too long: '+key);
    if(colors.includes(key)&&!/^#[a-f0-9]{6}$/i.test(value))throw new Error('Invalid color: '+key);
    result[key]=value;
  }
  for(const fields of Object.values(controlGroups))for(const [type,key,,min,max]of fields){
    if(type==='range')result[key]=Math.max(min,Math.min(max,result[key]));
    if(type==='select'&&!min.some(v=>(Array.isArray(v)?v[0]:v)===result[key]))throw new Error('Invalid choice: '+key);
  }
  result.activeIndex=Math.max(0,Math.min(4,Math.round(result.activeIndex)));
  for(const scope of ['',...headlineScopes]){
    result[scopedKey(scope,'lineCount')]=Math.round(result[scopedKey(scope,'lineCount')]);
    if(!/^[1-6]:\d{1,3}$/.test(result[scopedKey(scope,'rotateTarget')]))throw new Error('Choose a valid rotating word.');
    const entries=result[scopedKey(scope,'rotateWords')].split(',').map(s=>s.trim()).filter(Boolean);
    if(entries.length>50)throw new Error('Use up to 50 comma-separated words or phrases.');
    if(entries.some(s=>s.length>100))throw new Error('Keep each rotating entry within 100 characters.');
  }
  return result;
}
