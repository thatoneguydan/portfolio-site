import {controlGroups,normalizeSettings} from './landing-schema.js';
export function mountTune(api){
  if(!api.owner||document.getElementById('dan-owner-controls'))return;
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/assets/landing-tune.css?v=20261116-owner1';document.head.append(stylesheet);
  const root=document.getElementById('dan-landing-home');
  const config={...api.getConfig()},baseline={...api.defaults};
  let saved={};try{saved=JSON.parse(localStorage.getItem('portfolio-tune-ui-v1')||'{}');}catch{}
  const ownerPortal=document.createElement('div');ownerPortal.id='dan-owner-controls';ownerPortal.dataset.ownerPreview='true';
  ownerPortal.innerHTML="<button class=\"ds-config-launch\" type=\"button\" aria-label=\"Tune staging. Drag to move.\" aria-expanded=\"false\" aria-controls=\"dan-demo-config\"><span class=\"ds-config-grip\" aria-hidden=\"true\">⠿</span><span>Tune</span></button>\n  <aside class=\"ds-config\" id=\"dan-demo-config\" aria-label=\"Staging controls\" hidden>\n    <div class=\"ds-config-header\"><h2>Tune the homepage</h2><button type=\"button\" aria-label=\"Close staging controls\" data-close-config>×</button></div>\n    <details open><summary>Reveal text</summary>\n      <div class=\"ds-edit-fields\">\n        <label>Line 1<input type=\"text\" name=\"line1\" aria-label=\"Line 1\" value=\"HI 👋 THERE!\"></label>\n        <label>Line 2<input type=\"text\" name=\"line2\" aria-label=\"Line 2\" value=\"😊 READY TO\"></label>\n        <label>Line 3<input type=\"text\" name=\"line3\" aria-label=\"Line 3\" value=\"MAKE 🎨 SOMETHING?\"></label>\n      </div>\n      <div data-controls=\"reveal\"></div>\n      <div class=\"ds-config-buttons\"><button type=\"button\" data-replay>Replay reveal</button></div>\n    </details>\n    <details><summary>Headshot ticket</summary>\n      <div class=\"ds-edit-fields\">\n        <label>Name<input type=\"text\" name=\"ticketName\" aria-label=\"Ticket name\" value=\"Dan Smith\"></label>\n        <label>Heading<input type=\"text\" name=\"ticketHeading\" aria-label=\"Ticket heading\" value=\"Who is Dan?\"></label>\n        <label>Short bio<textarea name=\"bio\" aria-label=\"Short bio\">I work across video, design, print, and photography to make things clear, intentional, and worth looking at.</textarea></label>\n      </div>\n      <details open><summary>Layout</summary><div data-controls=\"ticketLayout\"></div></details>\n      <details><summary>Motion</summary><div data-controls=\"ticketMotion\"></div></details>\n      <details><summary>Badge behavior</summary><div data-controls=\"badge\"></div></details><details><summary>Appearance</summary><div data-controls=\"ticketAppearance\"></div></details>\n      <details><summary>Typography</summary><div data-controls=\"ticketTypography\"></div></details>\n      <details><summary>Drop shadow</summary><div data-controls=\"ticketShadow\"></div></details>\n    </details>\n    <details><summary>Featured work gallery</summary><div data-controls=\"gallery\"></div></details>\n    <details><summary>Copy / paste settings</summary>\n      <label>Settings<textarea aria-label=\"Settings JSON\" class=\"ds-config-json\" spellcheck=\"false\"></textarea></label>\n      <div class=\"ds-config-buttons\"><button type=\"button\" data-export>Copy settings</button><button type=\"button\" data-import>Apply settings</button></div>\n    </details>\n    <div class=\"ds-config-buttons\"><button type=\"button\" data-save>Save staging settings</button><button type=\"button\" data-reset>Restore starting settings</button></div>\n    <p class=\"ds-config-status\" role=\"status\"></p>\n  </aside>";document.body.append(ownerPortal);
  const configPanel=ownerPortal.querySelector('.ds-config'),configLauncher=ownerPortal.querySelector('.ds-config-launch');
  const ownerPreview=true;
  let placementFrame=0,launcherPosition=saved.launcherPosition||null,visibleViewport=null,drag=null,suppressToggleUntil=0,liveTimer=0;
  let saveTimer=0,pending=null,saving=false,lastQueued=JSON.stringify(config);
  const status=configPanel.querySelector('.ds-config-status');
  const colorKeys=['ticketBackground','ticketColor','ticketPanelBackground','ticketBorderColor','shadowColor'];
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const replay=()=>api.replay();
  function render(){
    api.applyConfig(config);
    for(const key of ['line1','line2','line3','bio','ticketName','ticketHeading']){
      const input=configPanel.querySelector(`[name=${key}]`);if(input&&document.activeElement!==input)input.value=config[key];
    }
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
  function optionDisabled(key) {
    if(['ticketTiltMax','ticketTiltReach','ticketParallax'].includes(key))return !config.ticketTilt;
    if(['ticketBorderWidth','ticketBorderColor','ticketBorderOpacity'].includes(key))return !config.ticketBorder;
    if(key==='ticketPanelBackground')return !config.ticketCustomPanelBackground;
    if(key==='ticketImageRadius')return config.ticketAutoImageRadius;
    if(key.startsWith('shadow'))return !config.ticketShadow;
    return false;
  }
  function renderControls() {
    for(const [group,fields] of Object.entries(controlGroups))configPanel.querySelector(`[data-controls=${group}]`).innerHTML=fields.map(([type,key,label,min,max,step,unit])=>{
      const disabled=optionDisabled(key)?' disabled':'';
      if(type==='range')return `<label><span class="ds-control-label"><span>${label}</span><output data-output="${key}">${config[key]}${unit}</output></span><input aria-label="${label}" data-option="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${config[key]}"${disabled}></label>`;
      if(type==='check')return `<label class="ds-check"><input aria-label="${label}" data-option="${key}" type="checkbox"${config[key]?' checked':''}>${label}</label>`;
      if(type==='color')return `<label>${label}<span class="ds-color-row"><input type="color" aria-label="${label}" data-option="${key}" value="${config[key]}"${disabled}><input type="text" aria-label="${label} hex" data-option="${key}" value="${config[key]}" spellcheck="false"${disabled}></span></label>`;
      return `<label>${label}<select aria-label="${label}" data-option="${key}">${min.map(option=>{const [value,text]=Array.isArray(option)?option:[option,option[0].toUpperCase()+option.slice(1)];return `<option value="${escapeHtml(value)}"${config[key]===value?' selected':''}>${text}</option>`;}).join('')}</select></label>`;
    }).join('');
    schedulePlacement();
  }

  function positionControls() {
    placementFrame=0;if(!ownerPreview)return;
    const pad=12,gap=11,area=visibleViewport||{left:0,top:0,right:window.innerWidth,bottom:window.innerHeight};
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
    const b=configLauncher.getBoundingClientRect(),pad=12,area=visibleViewport||{left:0,top:0,right:window.innerWidth,bottom:window.innerHeight};
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
  configPanel.querySelector('[data-replay]').addEventListener('click',replay);
  configPanel.addEventListener('toggle',schedulePlacement,true);new ResizeObserver(schedulePlacement).observe(configPanel);
  configPanel.querySelectorAll('.ds-edit-fields input,.ds-edit-fields textarea').forEach(input=>input.addEventListener('input',()=>{config[input.name]=input.value;render();persist();clearTimeout(liveTimer);liveTimer=setTimeout(replay,700);}));
  configPanel.addEventListener('input',event=>{
    const input=event.target,key=input.dataset.option;if(!key)return;
    if(colorKeys.includes(key)&&!/^#[\da-f]{6}$/i.test(input.value))return;
    config[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;
    const field=Object.values(controlGroups).flat().find(f=>f[1]===key),output=configPanel.querySelector(`[data-output=${key}]`);if(output)output.textContent=input.value+(field[6]||'');
    if(colorKeys.includes(key))configPanel.querySelectorAll(`[data-option=${key}]`).forEach(other=>{if(other!==input)other.value=input.value;});
    if(key==='ticketOrientation'){
      const vertical=config.ticketOrientation==='vertical';config.ticketWidth=vertical?300:460;config.ticketHeight=vertical?440:260;config.ticketPanelSize=vertical?130:150;renderControls();
    }
    if(input.type==='checkbox')configPanel.querySelectorAll('[data-option]').forEach(control=>control.disabled=optionDisabled(control.dataset.option));
    if(controlGroups.reveal.some(f=>f[1]===key)){render();replay();}else if(key.startsWith('ticket')||key==='photoPosition'||key.startsWith('shadow'))render();else render();persist();
  });
  configPanel.querySelector('[data-export]').addEventListener('click',()=>{const area=configPanel.querySelector('.ds-config-json');area.value=JSON.stringify(config,null,2);area.focus();area.select();navigator.clipboard?.writeText(area.value).catch(()=>{});configPanel.querySelector('.ds-config-status').textContent='Settings ready to copy.';});
  configPanel.querySelector('[data-import]').addEventListener('click',()=>{try{const value=JSON.parse(configPanel.querySelector('.ds-config-json').value);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Paste a settings object.');Object.assign(config,normalizeSettings(value,config));render();renderControls();replay();persist();configPanel.querySelector('.ds-config-status').textContent='Settings applied.';}catch(error){configPanel.querySelector('.ds-config-status').textContent=error.message;}});
  configPanel.querySelector('[data-reset]').addEventListener('click',()=>{Object.assign(config,baseline);render();renderControls();replay();persist();configPanel.querySelector('.ds-config-status').textContent='Your starting settings restored.';});


  configPanel.querySelector('[data-save]').addEventListener('click',()=>{pending={...config};flush();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!configPanel.hidden){toggleControls(false);configLauncher.focus();}});
  addEventListener('resize',schedulePlacement);
  window.visualViewport?.addEventListener('resize',schedulePlacement);
  configPanel.hidden=location.hash==='#tune'?false:!saved.controlsOpen;
  configLauncher.setAttribute('aria-expanded',String(!configPanel.hidden));
  for(const key of ['line1','line2','line3','bio','ticketName','ticketHeading'])configPanel.querySelector(`[name=${key}]`).value=config[key];
  renderControls();schedulePlacement();status.textContent='Changes save automatically to staging.';
}
