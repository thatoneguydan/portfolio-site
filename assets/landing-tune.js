import {targetChoices,rotationWords} from './landing-rotate.js?v=20261118-hero3';
import {controlGroups,normalizeSettings,headlineScopes,headlineSettings,scopedKey} from './landing-schema.js?v=20261118-workheading1';
import {mountSectionRotationEditor} from './featured-heading.js?v=20261118-workheading1';
export function mountTune(api){
  if(!api.owner||document.getElementById('dan-owner-controls'))return;
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/assets/landing-tune.css?v=20261118-cardnav1';document.head.append(stylesheet);
  const config={...api.getConfig()},baseline={...api.getConfig()};
  let saved={};try{saved=JSON.parse(localStorage.getItem('portfolio-tune-ui-v1')||'{}');}catch{}
  const ownerPortal=document.createElement('div');ownerPortal.id='dan-owner-controls';ownerPortal.dataset.ownerPreview='true';
  function headlineEditor(scope,label){
    const key=name=>scopedKey(scope,name);
    return `<details data-headline-editor="${scope}"><summary>${label}</summary>
      <details><summary>Text & typography</summary><div class="ds-edit-fields">
        ${Array.from({length:6},(_,i)=>`<label data-line-field="${i+1}">Line ${i+1}<input name="${key('line'+(i+1))}" type="text" aria-label="${scope?label+' ':''}Line ${i+1}"></label>`).join('')}
      </div><div data-controls="${scope?scope+'Typography':'headlineTypography'}"></div></details>
      <details><summary>Reveal animation</summary><div data-controls="${scope?scope+'Reveal':'reveal'}"></div><div class="ds-config-buttons"><button type="button" data-replay>Replay text animation</button></div></details>
      <details><summary>Rotating text</summary>
        <label>Word to replace<select data-option="${key('rotateTarget')}" data-rotate-target="${scope}" aria-label="${scope?label+' ':''}Word to replace"></select></label>
        <label>Cycle through<input type="text" data-rotate-words="${scope}" aria-label="${scope?label+' ':''}Rotating words, comma separated" maxlength="6000" spellcheck="false"></label>
        <p class="ds-rotate-count"></p><div data-controls="${scope?scope+'Rotate':'rotate'}"></div>
      </details></details>`;
  }
  function sectionHeadingEditor(scope,label,editorAttribute){
    return `<details><summary>Section heading</summary>
        <div class="ds-edit-fields"><label>Heading text<input name="${scope}Heading" type="text" aria-label="${label} heading text"></label></div>
        <div data-controls="${scope}Heading"></div>
        <details><summary>Rotating text</summary><div data-controls="${scope}Rotation"></div><div ${editorAttribute}></div></details>
      </details>`;
  }
  ownerPortal.innerHTML=`<button class="ds-config-launch" type="button" aria-label="Tune staging. Drag to move." aria-expanded="false" aria-controls="dan-demo-config"><span class="ds-config-grip" aria-hidden="true">⠿</span><span>Tune</span></button>
  <aside class="ds-config" id="dan-demo-config" aria-label="Staging controls" hidden>
    <div class="ds-config-header"><h2>Tune the website</h2><button type="button" aria-label="Close staging controls" data-close-config>×</button></div>
    ${headlineEditor('','Home headline')}
    <details><summary>Home layout &amp; action button</summary><div data-controls="heroLayout"></div></details>
    <details><summary>Page headlines</summary>${headlineScopes.map(scope=>headlineEditor(scope,scope[0].toUpperCase()+scope.slice(1)+' headline')).join('')}</details>
    <details><summary>ID card</summary>
      <details><summary>Content & typography</summary>
        <details><summary>Full ID name</summary><div class="ds-edit-fields"><label>Name<input name="ticketName" type="text" aria-label="Full ID name"></label></div><div data-controls="ticketNameType"></div></details>
        <details><summary>Badge name</summary><div class="ds-edit-fields"><label>Name<input name="badgeName" type="text" aria-label="Badge name" placeholder="Use full ID name"></label></div><p class="ds-control-help">Leave blank to use the full ID name.</p><div data-controls="badgeNameType"></div></details>
        <details><summary>Heading</summary><div class="ds-edit-fields"><label>Heading<input name="ticketHeading" type="text" aria-label="Ticket heading"></label></div><div data-controls="ticketHeadingType"></div></details>
        <details><summary>Short bio</summary><div class="ds-edit-fields"><label>Short bio<textarea name="bio" aria-label="Short bio"></textarea></label></div><div data-controls="ticketBodyType"></div></details>
        <div data-controls="ticketCopyLayout"></div>
      </details>
      <details><summary>Size & corners</summary><div data-controls="ticketLayout"></div></details>
      <details><summary>Photo & scrim</summary><div data-controls="ticketPhoto"></div><div data-controls="ticketScrim"></div></details>
      <details><summary>Colors & frame</summary><div data-controls="ticketAppearance"></div></details>
      <details><summary>Drop shadow</summary><div data-controls="ticketShadow"></div></details>
    </details>
    <details><summary>Badge behavior</summary>
      <details><summary>Responsive layout</summary><div data-controls="badge"></div><p class="ds-control-help">Match navigation to switch at the same width as its hamburger menu, or choose a custom breakpoint.</p></details>
      <details><summary>Fullscreen & transformations</summary><div data-controls="badgeFullscreen"></div></details>
    </details>
    <details><summary>ID animation</summary>
      <details><summary>Entrance</summary><div data-controls="badgeEntrance"></div><div class="ds-config-buttons"><button type="button" data-replay>Replay entrance</button></div></details>
      <details><summary>Pointer & scroll</summary><div data-controls="ticketMotion"></div></details>
      <details><summary>Idle tilt</summary><div data-controls="badgeIdle"></div></details>
    </details>
    <details><summary>Featured work</summary>
      ${sectionHeadingEditor('featured','Featured work','data-featured-rotation-editor')}
      <details><summary>Horizontal gallery</summary><div data-controls="gallery"></div></details>
      <details><summary>Vertical gallery</summary><div data-controls="galleryVertical"></div></details>
    </details>
    <details><summary>Section cards</summary>
      ${sectionHeadingEditor('workSection','Section cards','data-work-section-rotation-editor')}
      <div data-controls="workCardMotion"></div>
      <details><summary>Section background &amp; spacing</summary><div data-controls="workSectionBackground"></div></details>
      <details><summary>Card backgrounds</summary><div data-controls="workCardBackgrounds"></div></details>
      <details><summary>Number</summary><div data-controls="workCardNumber"></div></details>
      <details><summary>Title</summary><div data-controls="workCardTitle"></div></details>
      <details><summary>Description</summary><div data-controls="workCardDescription"></div></details>
      <details><summary>Arrow</summary><div data-controls="workCardArrow"></div></details>
      <div class="ds-edit-fields">
        <label>Video description<textarea name="workVideoDescription"></textarea></label>
        <label>Design description<textarea name="workDesignDescription"></textarea></label>
        <label>Photo description<textarea name="workPhotoDescription"></textarea></label>
      </div>
    </details>
    <details><summary>Thumbnails & captions</summary><details><summary>Caption blur</summary><div data-controls="portfolioEffects"></div></details><details><summary>Design inner shadow</summary><div data-controls="designShadow"></div></details></details>
    <details><summary>Project panels</summary>
      <details><summary>Surface & tail</summary><div data-controls="projectPanel"></div></details>
      <details><summary>Text & content spacing</summary><div data-controls="projectText"></div></details><details><summary>Drop shadow</summary><div data-controls="projectShadow"></div></details>
      <details><summary>Floating close button</summary><div data-controls="projectClose"></div><details><summary>Button drop shadow</summary><div data-controls="projectCloseShadow"></div></details></details>
      <details><summary>Wave-bars loader</summary><div data-controls="projectLoader"></div><div class="ds-loader-preview"><span class="portfolio-wave-loader" role="status" aria-label="Loading preview">${Array.from({length:5},(_,i)=>`<span style="--bar-index:${i}" aria-hidden="true"></span>`).join('')}</span></div></details>
    </details>
    <details><summary>Bottom-edge blur</summary><div data-controls="pageBlur"></div></details>
    <details><summary>Image lightbox</summary><div data-controls="lightbox"></div></details>
    <details><summary>Navigation</summary><div data-controls="navShadow"></div></details>
    <details><summary>Footer</summary><div data-controls="footer"></div><div class="ds-config-buttons"><button type="button" data-reset-footer>Restore original footer</button></div></details>
    <details><summary>Design demos</summary><p class="ds-control-help">Try alternate navigation treatments on a separate page.</p><a class="ds-saved-version" href="/owner/nav-lab/" target="_blank" rel="noopener">Navigation lab <span aria-hidden="true">↗</span></a></details>
    <details><summary>Saved versions</summary><a class="ds-saved-version" href="/owner/site-before-performance/" target="_blank" rel="noopener">Full site before the performance pass <span aria-hidden="true">↗</span></a><a class="ds-saved-version" href="/owner/landing-before-hierarchy/" target="_blank" rel="noopener">Previous landing page <span aria-hidden="true">↗</span></a></details>
    <details><summary>Copy / paste settings</summary><label>Settings<textarea aria-label="Settings JSON" class="ds-config-json" spellcheck="false"></textarea></label><div class="ds-config-buttons"><button type="button" data-export>Copy settings</button><button type="button" data-import>Apply settings</button></div></details>
    <div class="ds-config-buttons"><button type="button" data-save>Save staging settings</button><button type="button" data-reset>Restore starting settings</button></div><p class="ds-config-status" role="status"></p>
  </aside>`;document.body.append(ownerPortal);
  const configPanel=ownerPortal.querySelector('.ds-config'),configLauncher=ownerPortal.querySelector('.ds-config-launch');
  const ownerPreview=true;
  let placementFrame=0,launcherPosition=saved.launcherPosition||null,visibleViewport=null,drag=null,suppressToggleUntil=0,liveTimer=0;
  let saveTimer=0,pending=null,saving=false,lastQueued=JSON.stringify(config);
  const status=configPanel.querySelector('.ds-config-status');
  const sectionRotationEditors=[
    ['featured','Featured','[data-featured-rotation-editor]'],
    ['workSection','Section cards','[data-work-section-rotation-editor]']
  ].map(([scope,label,selector])=>mountSectionRotationEditor(configPanel.querySelector(selector),config,scope,label,changes=>{
    try{Object.assign(config,normalizeSettings(changes,config));render();persist();return '';}
    catch(error){status.textContent=error.message;return error.message;}
  }));
  function refreshSectionRotation(){
    for(const refresh of sectionRotationEditors)refresh();
  }
  const colorKeys=Object.values(controlGroups).flat().filter(field=>field[0]==='color').map(field=>field[1]);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const replay=()=>api.replay();
  function render(){
    api.applyConfig(config);updateTextEditors();updateEntranceLabel();refreshSectionRotation();
    configPanel.querySelectorAll('.ds-edit-fields input,.ds-edit-fields textarea').forEach(input=>{if(document.activeElement!==input)input.value=config[input.name];});
  }
  async function flush(){
    clearTimeout(saveTimer);if(saving||!pending)return;
    saving=true;const snapshot=pending;pending=null;status.textContent='Saving to staging…';
    try{
      const response=await fetch('/api/tune',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({config:snapshot,revision:api.revision})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not save settings.');
      api.revision=data.revision;status.textContent='Saved to staging.';
    }catch(error){status.textContent=error.message;}
    finally{saving=false;if(pending)saveTimer=setTimeout(flush,650);}
  }
  function persist(){
    try{localStorage.setItem('portfolio-tune-ui-v1',JSON.stringify({controlsOpen:!configPanel.hidden,launcherPosition}));}catch{}
    const serialized=JSON.stringify(config);
    if(serialized!==lastQueued){lastQueued=serialized;pending={...config};clearTimeout(saveTimer);saveTimer=setTimeout(flush,800);status.textContent='Changes apply now and save automatically.';}
  }
  function updateTextEditors(){
    for(const scope of ['',...headlineScopes]){
      const editor=configPanel.querySelector(`[data-headline-editor="${scope}"]`),local=headlineSettings(config,scope);
      editor.querySelectorAll('[data-line-field]').forEach(el=>el.hidden=Number(el.dataset.lineField)>local.lineCount);
      const select=editor.querySelector('[data-rotate-target]'),choices=targetChoices(local);
      select.innerHTML=(!choices.some(c=>c.value===local.rotateTarget)?`<option value="${escapeHtml(local.rotateTarget)}" selected disabled>Choose a visible word</option>`:'')+choices.map(c=>`<option value="${c.value}"${c.value===local.rotateTarget?' selected':''}>${escapeHtml(c.label)}</option>`).join('');
      select.disabled=!local.rotateEnabled;
      const words=editor.querySelector('[data-rotate-words]');if(document.activeElement!==words)words.value=local.rotateWords;words.disabled=!local.rotateEnabled;
      editor.querySelector('.ds-rotate-count').textContent=rotationWords(local).length+' / 50 entries · separate words or phrases with commas';
    }
  }
  configPanel.querySelectorAll('[data-rotate-words]').forEach(input=>input.addEventListener('input',()=>{
    const key=scopedKey(input.dataset.rotateWords,'rotateWords');
    try{normalizeSettings({[key]:input.value},config);input.setCustomValidity('');config[key]=input.value;render();persist();}
    catch(error){input.setCustomValidity(error.message);status.textContent=error.message;}
  }));
  function updateEntranceLabel(){
    const slider=configPanel.querySelector('[data-option=badgeEntrancePosition]');
    if(!slider)return;
    slider.max=config.lineCount+1;
    const n=Math.min(config.badgeEntrancePosition,config.lineCount+1);
    syncNumber(slider,n,document.activeElement?.dataset.number==='badgeEntrancePosition');
    const output=configPanel.querySelector('[data-output=badgeEntrancePosition]');
    output.textContent=n===0?'Before line 1':n===config.lineCount+1?'After last line':Number.isInteger(n)?'With line '+n:n<1?'Before line 1':n>config.lineCount?'During line '+config.lineCount:`Between lines ${Math.floor(n)}–${Math.ceil(n)}`;
  }
  function optionDisabled(key) {
    if(key==='footerWaveLength'||key==='footerWaveHeight')return !config.footerWaveEnabled;
    if(key==='workSectionWaveLength'||key==='workSectionWaveHeight')return !config.workSectionWaveEnabled;
    if(key==='heroFeaturedAnchorOffset')return !config.heroFeaturedBelowFold;
    if(key==='galleryHeight')return config.galleryAdaptive;
    if(key==='verticalGalleryHeight')return config.verticalGalleryAdaptive;
    if(key==='badgeLinkNavBreakpoint')return !config.ticketResponsive;
    if(key==='badgeBreakpoint')return !config.ticketResponsive||config.badgeLinkNavBreakpoint;
    if(key.startsWith('badgeEntrance')&&key!=='badgeEntrance')return !config.badgeEntrance;
    for(const scope of ['',...headlineScopes])if(key.startsWith(scopedKey(scope,'rotate'))&&key!==scopedKey(scope,'rotateEnabled'))return !config[scopedKey(scope,'rotateEnabled')];
    if(key.startsWith('portfolioBlur')&&key!=='portfolioBlur')return !config.portfolioBlur;
    if(['badgeIdleAngle','badgeIdlePeriod','badgeIdleEase'].includes(key))return !config.badgeIdleTilt||!config.ticketTilt;
    if(['ticketTiltMax','ticketTiltReach','ticketParallax'].includes(key))return !config.ticketTilt;
    if(['ticketBorderWidth','ticketBorderColor','ticketBorderOpacity'].includes(key))return !config.ticketBorder;
    if(key==='ticketPanelBackground')return !config.ticketCustomPanelBackground;
    if(key==='ticketImageRadius')return config.ticketAutoImageRadius;
    if(key.startsWith('scrim'))return !config.ticketScrim;
    if(key.startsWith('shadow'))return !config.ticketShadow;
    return false;
  }
  function renderControls() {
    for(const [group,fields] of Object.entries(controlGroups)){
      const host=configPanel.querySelector(`[data-controls=${group}]`);if(!host)continue;
      host.innerHTML=fields.map(([type,key,label,min,max,step,unit])=>{
      const disabled=optionDisabled(key)?' disabled':'';
      if(key==='badgeEntrancePosition')max=config.lineCount+1;
      if(type==='range')return `<div class="ds-range-control">
        <div class="ds-control-label">
          <label for="ds-range-${key}">${label}</label>
          <span class="ds-control-value"><input aria-label="${label} value"${unit?` aria-describedby="ds-unit-${key}"`:''} data-number="${key}" type="text" inputmode="${min<0?'text':step<1?'decimal':'numeric'}" spellcheck="false" autocomplete="off" maxlength="20" enterkeyhint="done" value="${config[key]}"${disabled}>${unit?`<span id="ds-unit-${key}">${unit}</span>`:''}</span>
        </div>
        <input id="ds-range-${key}" data-option="${key}" data-range-step="${step}" type="range" min="${min}" max="${max}" step="${step}" value="${config[key]}"${disabled}>
        ${key==='badgeEntrancePosition'?`<output class="ds-range-note" data-output="${key}"></output>`:''}
      </div>`;
      if(type==='check')return `<label class="ds-check"><input aria-label="${label}" data-option="${key}" type="checkbox"${config[key]?' checked':''}${disabled}>${label}</label>`;
      if(type==='color')return `<label>${label}<span class="ds-color-row"><input type="color" aria-label="${label}" data-option="${key}" value="${config[key]}"${disabled}><input type="text" aria-label="${label} hex" data-option="${key}" value="${config[key]}" spellcheck="false"${disabled}></span></label>`;
      return `<label>${label}<select aria-label="${label}" data-option="${key}"${disabled}>${min.map(option=>{const [value,text]=Array.isArray(option)?option:[option,option[0].toUpperCase()+option.slice(1)];return `<option value="${escapeHtml(value)}"${config[key]===value?' selected':''}>${text}</option>`;}).join('')}</select></label>`;
    }).join('');
    }
    configPanel.querySelectorAll('[data-range-step]').forEach(slider=>syncNumber(slider,config[slider.dataset.option]));
    updateTextEditors();updateEntranceLabel();refreshSectionRotation();schedulePlacement();
  }

  function syncNumber(slider,value,keepDraft=false){
    const offset=(value-Number(slider.min))/Number(slider.dataset.rangeStep);
    // Keep precise typed values at the right position between the slider's usual steps.
    slider.step=Math.abs(offset-Math.round(offset))<1e-8?slider.dataset.rangeStep:'any';
    slider.value=value;
    const field=slider.closest('.ds-range-control').querySelector('[data-number]');
    if(!keepDraft&&field.value!==String(value))field.value=value;
  }

  function readNumber(field){
    const entered=field.value.trim().replace(',','.');
    if(!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(entered))return NaN;
    return Number(entered);
  }

  function applyNumber(slider,value,keepDraft=false){
    const key=slider.dataset.option;
    const bounded=clamp(/lineCount$/i.test(key)?Math.round(value):value,Number(slider.min),Number(slider.max));
    syncNumber(slider,bounded,keepDraft);
    if(config[key]!==bounded)applyOption(key,bounded);
  }

  function commitNumber(field){
    const slider=field.closest('.ds-range-control').querySelector('[data-range-step]');
    if(field.value===slider.value)return;
    const value=readNumber(field);
    if(Number.isFinite(value))applyNumber(slider,value);
    else field.value=slider.value;
  }

  function positionControls() {
    placementFrame=0;if(!ownerPreview)return;
    const pad=12,gap=11,area=visibleViewport||{left:0,top:0,right:document.documentElement.clientWidth,bottom:window.innerHeight};
    const w=area.right-area.left,minX=area.left+pad,minY=area.top+pad;
    const b=configLauncher.getBoundingClientRect(),maxX=Math.max(minX,area.right-b.width-pad),maxY=Math.max(minY,area.bottom-b.height-pad);
    const position=launcherPosition||{x:1,y:1};
    const x=clamp(minX+position.x*(maxX-minX),minX,maxX),y=clamp(minY+position.y*(maxY-minY),minY,maxY);
    configLauncher.style.left=x+'px';configLauncher.style.top=y+'px';configLauncher.style.right='auto';configLauncher.style.bottom='auto';
    if(configPanel.hidden)return;
    const panelWidth=Math.min(380,w-pad*2);configPanel.style.width=panelWidth+'px';
    const above=y-gap-minY,below=area.bottom-(y+b.height)-gap-pad;
    const belowPreferred=above<Math.min(520,configPanel.scrollHeight)&&below>above;
    const space=Math.max(0,belowPreferred?below:above),maxHeight=Math.min(680,space);
    configPanel.style.maxHeight=maxHeight+'px';
    const desiredHeight=Math.min(configPanel.scrollHeight,maxHeight),panelHeight=Math.max(0,desiredHeight);
    let left=x+b.width-panelWidth,side='left';if(left<minX){left=x;side='right';}
    left=clamp(left,minX,Math.max(minX,area.right-pad-panelWidth));
    const top=belowPreferred?y+b.height+gap:y-gap-panelHeight;
    configPanel.style.left=left+'px';configPanel.style.top=Math.max(minY,top)+'px';
    configPanel.dataset.vertical=belowPreferred?'below':'above';configPanel.dataset.horizontal=side;
  }
  function schedulePlacement(){if(!placementFrame)placementFrame=requestAnimationFrame(positionControls);}
  function rememberLauncher(x,y) {
    const b=configLauncher.getBoundingClientRect(),pad=12,area=visibleViewport||{left:0,top:0,right:document.documentElement.clientWidth,bottom:window.innerHeight};
    launcherPosition={x:clamp((x-area.left-pad)/Math.max(1,area.right-area.left-b.width-pad*2),0,1),y:clamp((y-area.top-pad)/Math.max(1,area.bottom-area.top-b.height-pad*2),0,1)};
  }
  function toggleControls(show){if(!ownerPreview)return;configPanel.hidden=!show;configLauncher.setAttribute('aria-expanded',String(show));schedulePlacement();persist();}
  configLauncher.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;const box=configLauncher.getBoundingClientRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:box.left,top:box.top,moved:false};configLauncher.setPointerCapture(event.pointerId);
  });
  configLauncher.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;configLauncher.classList.add('is-dragging');
    const box=configLauncher.getBoundingClientRect();rememberLauncher(clamp(drag.left+dx,12,window.innerWidth-box.width-12),clamp(drag.top+dy,12,window.innerHeight-box.height-12));positionControls();
  });
  function endDrag(event){if(!drag||event.pointerId!==drag.id)return;if(drag.moved){suppressToggleUntil=performance.now()+400;persist();}drag=null;configLauncher.classList.remove('is-dragging');}
  configLauncher.addEventListener('pointerup',endDrag);configLauncher.addEventListener('pointercancel',endDrag);
  configLauncher.addEventListener('click',()=>{if(performance.now()>=suppressToggleUntil)toggleControls(configPanel.hidden);});
  configLauncher.addEventListener('keydown',event=>{
    if(event.altKey&&['Home','End'].includes(event.key)){event.preventDefault();launcherPosition=event.key==='Home'?{x:0,y:0}:{x:1,y:1};positionControls();persist();return;}
    if(!event.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();const b=configLauncher.getBoundingClientRect(),step=event.shiftKey?32:12;
    rememberLauncher(b.left+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),b.top+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0));positionControls();persist();
  });
  configPanel.querySelector('[data-close-config]').addEventListener('click',()=>toggleControls(false));
  configPanel.querySelectorAll('[data-replay]').forEach(button=>button.addEventListener('click',replay));
  configPanel.addEventListener('toggle',schedulePlacement,true);
  const placementObserver=new ResizeObserver(schedulePlacement);placementObserver.observe(configPanel);placementObserver.observe(configLauncher);
  stylesheet.addEventListener('load',schedulePlacement);document.fonts?.ready.then(schedulePlacement);
  configPanel.querySelectorAll('.ds-edit-fields input,.ds-edit-fields textarea').forEach(input=>input.addEventListener('input',()=>{config[input.name]=input.value;render();persist();if(input.closest('[data-headline-editor]')){clearTimeout(liveTimer);liveTimer=setTimeout(replay,700);}}));
  function applyOption(key,value,source){
    config[key]=value;
    if(['projectTextColor','projectHeadingColor'].includes(key)){config.projectTextAutoContrast=false;configPanel.querySelector('[data-option=projectTextAutoContrast]').checked=false;}
    if(colorKeys.includes(key))configPanel.querySelectorAll(`[data-option=${key}]`).forEach(other=>{if(other!==source)other.value=value;});
    if(key==='ticketOrientation'){
      const vertical=config.ticketOrientation==='vertical';config.ticketWidth=vertical?300:460;config.ticketHeight=vertical?440:260;config.ticketPanelSize=vertical?130:150;renderControls();
    }
    if(source?.type==='checkbox')configPanel.querySelectorAll('[data-option],[data-number]').forEach(control=>control.disabled=optionDisabled(control.dataset.option||control.dataset.number));
    if(key!=='paletteSaturation'&&[...controlGroups.reveal,...controlGroups.headlineTypography,...controlGroups.badgeEntrance,...headlineScopes.flatMap(scope=>[...controlGroups[scope+'Typography'],...controlGroups[scope+'Reveal']])].some(f=>f[1]===key)){render();replay();}else render();persist();
  }
  configPanel.addEventListener('input',event=>{
    const input=event.target;
    if(input.dataset.number){
      const slider=input.closest('.ds-range-control').querySelector('[data-range-step]');
      const value=readNumber(input);
      if(value>=Number(slider.min)&&value<=Number(slider.max))applyNumber(slider,value,true);
      return;
    }
    const key=input.dataset.option;if(!key)return;
    if(input.type==='range'){
      const step=Number(input.dataset.rangeStep),min=Number(input.min);
      const value=min+Math.round((Number(input.value)-min)/step)*step;
      applyNumber(input,Number(value.toFixed(12)));
      return;
    }
    if(colorKeys.includes(key)&&!/^#[\da-f]{6}$/i.test(input.value))return;
    applyOption(key,input.type==='checkbox'?input.checked:input.value,input);
  });
  configPanel.addEventListener('focusout',event=>{
    if(event.target.dataset.number)commitNumber(event.target);
  });
  configPanel.addEventListener('keydown',event=>{
    const input=event.target,isField=Boolean(input.dataset.number);
    if(!isField&&!input.dataset.rangeStep)return;
    if(isField&&event.key==='Enter'){
      event.preventDefault();
      commitNumber(input);
      input.select();
      return;
    }
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
    event.preventDefault();
    const slider=isField?input.closest('.ds-range-control').querySelector('[data-range-step]'):input;
    const draft=isField?readNumber(input):NaN;
    const current=Number.isFinite(draft)?draft:Number(slider.value);
    applyNumber(slider,Number((current+(event.key==='ArrowLeft'?-1:1)).toFixed(12)));
  });
  configPanel.querySelector('[data-export]').addEventListener('click',()=>{const area=configPanel.querySelector('.ds-config-json');area.value=JSON.stringify(config,null,2);area.focus();area.select();navigator.clipboard?.writeText(area.value).catch(()=>{});configPanel.querySelector('.ds-config-status').textContent='Settings ready to copy.';});
  configPanel.querySelector('[data-import]').addEventListener('click',()=>{try{const value=JSON.parse(configPanel.querySelector('.ds-config-json').value);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Paste a settings object.');Object.assign(config,normalizeSettings(value,config));render();renderControls();replay();persist();configPanel.querySelector('.ds-config-status').textContent='Settings applied.';}catch(error){configPanel.querySelector('.ds-config-status').textContent=error.message;}});
  configPanel.querySelector('[data-reset]').addEventListener('click',()=>{Object.assign(config,baseline);render();renderControls();replay();persist();configPanel.querySelector('.ds-config-status').textContent='Your starting settings restored.';});
  configPanel.querySelector('[data-reset-footer]').addEventListener('click',()=>{
    for(const [,key] of controlGroups.footer)config[key]=api.defaults[key];
    render();renderControls();persist();
  });


  configPanel.querySelector('[data-save]').addEventListener('click',()=>{pending={...config};flush();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!configPanel.hidden){toggleControls(false);configLauncher.focus();}});
  addEventListener('resize',schedulePlacement);
  window.visualViewport?.addEventListener('resize',schedulePlacement);
  const refreshing=performance.getEntriesByType('navigation')[0]?.type==='reload';
  configPanel.hidden=!(refreshing||location.hash==='#tune'||saved.controlsOpen);
  configLauncher.setAttribute('aria-expanded',String(!configPanel.hidden));
  configPanel.querySelectorAll('.ds-edit-fields input,.ds-edit-fields textarea').forEach(input=>input.value=config[input.name]);
  configPanel.querySelectorAll('.ds-edit-fields input,.ds-edit-fields textarea').forEach(input=>input.maxLength=2000);
  renderControls();schedulePlacement();status.textContent='Changes save automatically to staging.';
}
