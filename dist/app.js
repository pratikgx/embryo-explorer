import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {stages,systems,detail,ageBasis} from './stages.js?v=canvas3';
import {buildStage} from './models.js?v=canvas3';
import {createBoard} from './board.js?v=canvas3';
import {planLayout} from './layout.js?v=canvas3';
import {journeyAt,duration as journeyDuration} from './journey.js';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const ease=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const canvas=$('scene'),film=$('film'),ctx=film.getContext('2d');film.width=1920;film.height=1080;
const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.05,60);camera.position.set(3.3,.6,6.6);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=2.5;controls.maxDistance=14;controls.target.set(0,.12,0);
scene.add(new T.HemisphereLight(0xffffff,0x99968b,1.75));
const key=new T.DirectionalLight(0xfff5ed,3.3);key.position.set(3,6,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:20});key.shadow.normalBias=.025;key.shadow.bias=-.0001;key.shadow.radius=4;scene.add(key);
const rim=new T.DirectionalLight(0xe4edf1,1.8);rim.position.set(-4,2,-4);scene.add(rim);const fill=new T.DirectionalLight(0xfff9f1,.45);fill.position.set(-3,0,3);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({color:0x829080,opacity:.1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.46;floor.receiveShadow=true;scene.add(floor);
const root=new T.Group();scene.add(root);
const guides=new T.Group();root.add(guides);
for(let j=0;j<12;j++){const g=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);guides.add(new T.Line(g,new T.LineBasicMaterial({color:0xb3bdb1,transparent:true,opacity:0})));}
const models=Array(stages.length),loads=new Map();
const state={view:'assembled',hover:null,stage:8,selected:null,isolate:false,explode:0,hidden:new Set(),playing:false,paused:false,time:0};
let actualTray=0,layout=null,hiddenBeforeParts=null,hiddenBeforeFilm=null;
let currentCue=journeyAt(0);
let board=null,boardMode='assembled',boardBeforeFilm=null;
let actualExplode=0,cameraGoal=null,recording=false,recorder=null,chunks=[],lastTime=performance.now(),filmStart=0,requestId=0;
let dragging=false,pointerTarget=new T.Vector2(),pointerActual=new T.Vector2();
const identityRotation=new T.Quaternion();
const directions={body:[0,0,0],neural:[-.95,.48,0],heart:[.95,.48,.15],gut:[.9,-.83,.15],liver:[1.25,-.18,-.12],lungs:[-.9,-.08,.2],skeleton:[-.75,-.8,-.15],kidneys:[.15,-1.12,-.35],somites:[-.85,-.65,0],support:[.35,.1,0],yolk:[.9,-.3,0],zona:[0,0,0],cell:[.7,0,0],nuclei:[-.85,.25,0],blastomeres:[.5,0,0],trophoblast:[-.65,0,0],inner:[.75,.1,0],epiblast:[0,.6,0],hypoblast:[0,-.5,0],amnion:[-.8,.4,0],ectoderm:[0,.7,0],mesoderm:[0,0,0],endoderm:[0,-.7,0],axis:[.9,.35,0]};
// The same anatomical objects move between assembled, separated and collection views.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=64;
const shadowCtx=shadowCanvas.getContext('2d');const shadowGradient=shadowCtx.createRadialGradient(64,32,1,64,32,60);shadowGradient.addColorStop(0,'rgba(90,104,88,.16)');shadowGradient.addColorStop(1,'rgba(90,104,88,0)');shadowCtx.fillStyle=shadowGradient;shadowCtx.fillRect(0,0,128,64);
const trayShadows=new T.Group();root.add(trayShadows);
for(let j=0;j<12;j++){const shadow=new T.Mesh(new T.PlaneGeometry(1.65,.32),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:0}));shadow.position.z=-.5;trayShadows.add(shadow);}
function refreshTray(){
 const m=models[state.stage];if(!m)return;
 layout=planLayout(m.userData.parts,stages[state.stage].parts,camera.aspect);
 $('partLabels').innerHTML=stages[state.stage].parts.map(k=>`<button class="part-label" data-tray="${k}" aria-label="Inspect ${systems[k][0]}" title="Inspect ${systems[k][0]}"><span>${systems[k][0]}</span></button>`).join('');
 document.querySelectorAll('[data-tray]').forEach(b=>{b.onclick=()=>{pauseForInput();selectPart(b.dataset.tray)};b.onpointerenter=b.onfocus=()=>state.hover=b.dataset.tray;b.onpointerleave=b.onblur=()=>state.hover=null;});
 document.body.dataset.trayCount=stages[state.stage].parts.length;
}
function setAnatomyPanel(open){document.body.dataset.layersOpen=String(open);$('anatomyToggle').setAttribute('aria-expanded',String(open));$('anatomyToggle').textContent=open?'Close anatomy':'Anatomy';}
$('anatomyToggle').onclick=()=>setAnatomyPanel(document.body.dataset.layersOpen!=='true');
document.querySelectorAll('[data-detail-view]').forEach(b=>b.onclick=()=>setView(b.dataset.detailView));
function syncView(){
 document.querySelectorAll('[data-detail-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.detailView===state.view));
 document.querySelector('.view-hint').textContent=state.view==='parts'&&!state.isolate?'Choose a part to explore':'Drag to rotate · Scroll to zoom';
 document.body.dataset.view=state.view;document.body.dataset.inspecting=String(state.view==='parts'&&state.isolate);
 for(const [id,value] of [['assembledView','assembled'],['separatedView','separated'],['partsView','parts']])$(id).setAttribute('aria-pressed',state.view===value);
 $('backToParts').hidden=state.view!=='parts'||!state.selected;
 $('scaleText').textContent=state.view==='parts'?'Display scales adjusted':stages[state.stage].scale;
 $('clearSelection').textContent=state.view==='parts'?'← Back to all parts':'Restore full view';
}
function setView(view,{manual=true,frame=true}={}){
 if(manual){pauseForInput();boardMode=view;board?.setMode(view);}
 if(view==='parts'&&state.view!=='parts'){hiddenBeforeParts=new Set(state.hidden);state.hidden.clear();}
 if(view!=='parts'&&state.view==='parts'&&hiddenBeforeParts){state.hidden=hiddenBeforeParts;hiddenBeforeParts=null;}
 setAnatomyPanel(false);state.view=view;state.selected=null;state.isolate=false;state.hover=null;state.explode=view==='separated'?1:0;
 $('explode').value=state.explode;$('explodeValue').textContent=Math.round(state.explode*100)+'%';syncView();resize();refreshTray();updateLayers();if(frame)frameDefault();
 controls.enableRotate=view!=='parts';controls.maxDistance=view==='parts'?40:14;
}
function overviewCamera(){
 const l=layout||{width:6.3,height:5.85};const distance=Math.max(l.height,l.width/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.14;
 return {pos:new T.Vector3(0,.20,distance),target:new T.Vector3(0,.1,0)};
}
$('assembledView').onclick=()=>setView('assembled');$('separatedView').onclick=()=>setView('separated');$('partsView').onclick=()=>setView('parts');
$('backToParts').onclick=()=>{pauseForInput();state.selected=null;state.isolate=false;state.hover=null;syncView();resize();refreshTray();updateLayers();controls.enableRotate=false;frameDefault();};
async function ensure(i){if(models[i])return models[i];if(loads.has(i))return loads.get(i);const promise=buildStage(i).then(m=>{models[i]=m;m.visible=false;root.add(m);return m});loads.set(i,promise);return promise;}
function pauseForInput(){if(state.playing)stopFilm();cameraGoal=null;}
function updateLayers(){
 const keys=stages[state.stage].parts;
 $('layerList').innerHTML=keys.map(k=>`<div class="layer"><span class="dot" style="background:${systems[k][1]}"></span><button data-part="${k}" aria-pressed="${state.selected===k}">${k==='skeleton'&&state.stage<10?'Cartilage & bone':systems[k][0]}</button><input type="checkbox" data-visible="${k}" aria-label="Show ${systems[k][0]}" ${state.hidden.has(k)?'':'checked'}></div>`).join('');
 $('partCount').textContent=`${keys.length} structures`;
 document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{pauseForInput();selectPart(b.dataset.part)});
 document.querySelectorAll('[data-visible]').forEach(c=>c.onchange=()=>{pauseForInput();c.checked?state.hidden.delete(c.dataset.visible):state.hidden.add(c.dataset.visible);if(state.selected===c.dataset.visible&&!c.checked){state.selected=null;state.isolate=false;updateSelection()}if(c.dataset.visible==='support'&&!state.isolate)frameDefault();});
 updateSelection();
}
function updateSelection(){
 syncView();const k=state.selected;$('selection').hidden=!k;$('clearSelection').hidden=!k;
 if(k){$('selectionName').textContent=systems[k][0]+' · '+stages[state.stage].age;$('selectionDesc').textContent=detail(k,state.stage);$('isolate').textContent=state.isolate?'Restore context':'Isolate structure';}
 document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.part===k));
 document.body.dataset.selected=k||'';document.body.dataset.isolated=String(state.isolate);
}
function selectPart(k){if(state.view!=='parts')setAnatomyPanel(true);state.selected=k;state.isolate=state.view==='parts';state.hidden.delete(k);updateLayers();if(state.view==='parts'){resize();controls.enableRotate=true;focusSelected();}}
function frameDefault(){if(state.view==='parts'){cameraGoal=overviewCamera();return;}const support=stages[state.stage].parts.includes('support')&&!state.hidden.has('support');const target=new T.Vector3(support?.20:0,.12,0);const distance=Math.max(5.8,3.4/Math.max(.6,camera.aspect))+state.explode*1.7;cameraGoal={pos:target.clone().add(new T.Vector3(distance*.60,.28,distance*.80)),target};}
async function setStage(value,{manual=true}={}){
 const i=clamp(Math.round(Number(value)||0),0,stages.length-1);if(manual){pauseForInput();restoreCleavage();}
 const ticket=++requestId;state.stage=i;if(manual)board?.select(i,document.body.dataset.inspector==='true');
 if(!stages[i].parts.includes(state.selected)){state.selected=null;state.isolate=false;}
 $('stageSlider').value=i;$('stageSelect').value=i;$('previous').disabled=i===0;$('next').disabled=i===stages.length-1;
 const s=stages[i];$('phase').textContent=`Human development · ${s.phase}`;$('stageName').textContent=s.name;$('stageNote').textContent=s.note;$('ageLabel').textContent=s.age;$('dating').textContent=ageBasis(s);$('scaleText').textContent=s.scale;
 $('stageSlider').setAttribute('aria-valuetext',`${s.name}, ${s.age} ${ageBasis(s)}`);
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-current',+b.dataset.stage===i));
 updateLayers();resize();if(state.view==='parts')controls.enableRotate=state.isolate;document.body.dataset.stage=String(i);document.body.dataset.modelReady='false';
 models.forEach(m=>{if(m)m.visible=false});
 try{const m=await ensure(i);if(ticket!==requestId)return;m.visible=true;document.body.dataset.modelReady='true';document.body.dataset.visibleParts=Object.keys(m.userData.parts).join(',');refreshTray();syncView();if(manual){if(state.isolate)focusSelected();else frameDefault();}}
 catch(e){$('loadText').textContent=e.message;$('loading').hidden=false;throw e;}
}
function focusSelected(){const p=models[state.stage]?.userData.parts[state.selected];if(!p)return;if(state.view==='parts'){const item=layout.entries[state.selected];const d=Math.max(2.5,item.extent.length()*1.9);cameraGoal={target:item.slot.clone(),pos:item.slot.clone().add(new T.Vector3(.15,.15,d))};return;}const c=p.userData.center.clone().add(p.position);const d=Math.max(2.5,p.userData.size.length()*2);cameraGoal={target:c,pos:c.clone().add(new T.Vector3(d*.5,.2,d*.86))};}
$('stageSelect').innerHTML=stages.map((s,i)=>`<option value="${i}">${s.age} · ${s.name}</option>`).join('');
$('stageTicks').innerHTML=stages.map((s,i)=>`<button data-stage="${i}" aria-label="${s.name}, ${s.age}" title="${s.name} · ${ageBasis(s)}">${s.pregnancyWeeks?'w'+s.pregnancyWeeks:s.pf?'d'+s.pf:'w'+s.ga}</button>`).join('');
$('stageSlider').max=stages.length-1;
$('stageSlider').oninput=e=>setStage(e.target.value);$('stageSelect').onchange=e=>setStage(e.target.value);
$('previous').onclick=()=>setStage(state.stage-1);$('next').onclick=()=>setStage(state.stage+1);
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>setStage(b.dataset.stage));
$('explode').oninput=e=>{pauseForInput();if(state.view==='parts')setView('separated');state.view='separated';state.explode=+e.target.value;$('explodeValue').textContent=Math.round(state.explode*100)+'%';state.isolate=false;updateSelection();frameDefault();};
$('isolate').onclick=()=>{pauseForInput();state.isolate=!state.isolate;updateSelection();state.isolate?focusSelected():frameDefault()};
$('clearSelection').onclick=()=>{if(state.view==='parts'){$('backToParts').click();return;}pauseForInput();state.selected=null;state.isolate=false;updateSelection();frameDefault()};
function reset(){setAnatomyPanel(false);state.view='assembled';hiddenBeforeParts=null;actualTray=0;controls.enableRotate=true;controls.maxDistance=14;state.selected=null;state.isolate=false;state.explode=0;state.hidden=new Set();$('explode').value=0;$('explodeValue').textContent='0%';syncView();resize();refreshTray();updateLayers();frameDefault();}
$('reset').onclick=()=>{pauseForInput();reset();boardMode='assembled';board?.reset()};$('sourceBtn').onclick=()=>$('sources').showModal();$('closeSources').onclick=()=>$('sources').close();$('sources').onclick=e=>{if(e.target===$('sources'))$('sources').close()};
const ray=new T.Raycaster(),mouse=new T.Vector2();let down=[0,0];
canvas.addEventListener('pointerdown',e=>{pauseForInput();dragging=true;down=[e.clientX,e.clientY];pointerTarget.set(0,0)});
window.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const model=models[state.stage];if(!model)return;const meshes=[];model.traverse(o=>{if(o.isMesh&&o.visible&&o.material.opacity>.15)meshes.push(o)});const hit=ray.intersectObjects(meshes.filter(o=>{let p=o;while(p){if(!p.visible)return false;p=p.parent;}return true}),false)[0];if(hit)selectPart(hit.object.userData.key);});
controls.addEventListener('start',()=>{cameraGoal=null;dragging=true});controls.addEventListener('end',()=>dragging=false);
window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce.matches||dragging||state.playing)return;pointerTarget.set((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2)});
document.documentElement.addEventListener('pointerleave',()=>pointerTarget.set(0,0));
function updateModel(dt){
 const alpha=reduce.matches?1:1-Math.exp(-dt*7);
 actualExplode=mix(actualExplode,state.explode,alpha);actualTray=mix(actualTray,state.view==='parts'?1:0,alpha);
 const m=models[state.stage];if(!m)return;
 if(!m.userData.parts.support)document.body.dataset.supportVisible='false';
 const reveal=state.explode>.02||state.selected&&state.selected!=='body'||state.hidden.has('body');
 let guideIndex=0;guides.children.forEach(l=>l.visible=false);trayShadows.children.forEach(l=>l.visible=false);
 for(const [k,p] of Object.entries(m.userData.parts)){
  const d=new T.Vector3(...(directions[k]||[0,0,0])).multiplyScalar(actualExplode);const entry=layout?.entries[k];
  if(entry){p.position.copy(d).lerp(entry.position,actualTray);p.scale.setScalar(mix(1,entry.scale,actualTray));p.quaternion.copy(identityRotation).slerp(entry.rotation,actualTray);}
  const hidden=state.hidden.has(k);const isOuter=k==='body';let opacity=hidden?0:1;
  if(state.view==='parts'){if(state.isolate&&state.selected!==k)opacity=0;}
  else{
   if(isOuter&&reveal)opacity*=state.isolate?.035:.075;
   else if(state.selected&&state.selected!==k)opacity*=state.isolate?.025:.45;
   if(!isOuter&&state.stage>=5&&k!=='support'&&k!=='yolk'&&!reveal)opacity=0;
  }
  p.visible=opacity>.001;if(k==='support')document.body.dataset.supportVisible=String(p.visible);
  if(k!=='body'&&!hidden&&actualExplode>.05&&actualTray<.1&&guideIndex<12){const line=guides.children[guideIndex++],a=p.userData.center,b=a.clone().add(p.position);line.visible=true;line.material.opacity=actualExplode*.24;const v=line.geometry.attributes.position;v.setXYZ(0,a.x,a.y,a.z);v.setXYZ(1,b.x,b.y,b.z);v.needsUpdate=true;line.geometry.computeBoundingSphere();}
  p.traverse(o=>{if(o.isMesh){o.material.opacity=opacity*o.userData.baseOpacity;o.material.depthWrite=o.material.opacity>.85;o.castShadow=o.material.opacity>.85&&actualTray<.1;o.material.emissive.set(state.hover===k?'#b0bba3':'#000000');o.material.emissiveIntensity=state.hover===k?.12:0;}});
 }
 floor.material.opacity=.1*(1-actualTray);floor.visible=actualTray<.05;
 if(layout&&actualTray>.02&&!state.isolate){let j=0;for(const entry of Object.values(layout.entries)){const shadow=trayShadows.children[j++];shadow.visible=true;shadow.position.set(entry.slot.x,entry.slot.y-entry.extent.y/2-.06,-.6);shadow.material.opacity=actualTray;}}
 scene.updateMatrixWorld(true);
 const rect=$('viewport').getBoundingClientRect();
 document.querySelectorAll('[data-tray]').forEach(button=>{
  const entry=layout?.entries[button.dataset.tray];button.hidden=state.view!=='parts'||state.isolate||!entry||state.playing;
  if(!entry)return;const point=root.localToWorld(entry.label.clone()).project(camera);const top=root.localToWorld(entry.slot.clone().add(new T.Vector3(0,.76,.1))).project(camera);const height=Math.max(45,(point.y-top.y)*-.5*rect.height);
  button.style.left=(point.x*.5+.5)*rect.width+'px';button.style.top=(-top.y*.5+.5)*rect.height+'px';button.style.height=height+'px';button.style.width=Math.min(110,Math.max(54,rect.width/(layout?.columns||3)*.85))+'px';button.dataset.highlight=String(state.hover===button.dataset.tray);
 });
 document.body.dataset.explode=state.explode.toFixed(2);document.body.dataset.renderedExplode=actualExplode.toFixed(2);document.body.dataset.renderedView=actualTray>.98?'parts':actualTray<.02?'anatomy':'transition';
}
function resize(){const rect=$('viewport').getBoundingClientRect();if(state.playing){renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);renderer.setViewport(0,180,1920,900);camera.aspect=1920/900;}else{renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);renderer.setViewport(0,0,Math.max(1,rect.width),Math.max(1,rect.height));camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);}camera.updateProjectionMatrix();}
window.addEventListener('resize',()=>{resize();refreshTray();if(state.view==='parts')state.isolate?focusSelected():frameDefault();});

const previousFrame=document.createElement('canvas');previousFrame.width=1920;previousFrame.height=1080;const previousCtx=previousFrame.getContext('2d');let transitionTime=-10;
function restoreCleavage(){const p=models[1]?.userData.parts.blastomeres;if(p)p.children.forEach((m,j)=>{m.visible=true;m.position.set((j&1?1:-1)*.32,(j&2?1:-1)*.32,(j&4?1:-1)*.32);m.scale.setScalar(.43);});}
function choreograph(time){
 currentCue=journeyAt(time);const {index,local,progress:t}=currentCue;
 if(state.stage!==index){previousCtx.clearRect(0,0,1920,1080);previousCtx.drawImage(canvas,0,0,1920,1080);transitionTime=state.paused?time-.35:time;setStage(index,{manual:false});}
 const wantParts=index===11&&local>=3;
 if((state.view==='parts')!==wantParts)setView(wantParts?'parts':'assembled',{manual:false,frame:false});
 state.selected=null;state.isolate=false;state.explode=0;
 if(index===1){const cells=models[1].userData.parts.blastomeres.children;const count=t<.3?2:t<.6?4:8;cells.forEach((m,j)=>{m.visible=j<count;const size=count===2?.60:count===4?.50:.43;m.scale.setScalar(size);m.position.set((j&1?1:-1)*(count===8?.32:.38),count===2?0:(j&2?1:-1)*.32,count===8?(j&4?1:-1)*.32:0);});}
 if(index===3||index===4)state.explode=.65*ease(.05,.25,t)*(1-ease(.82,1,t));
 if(index===5)state.explode=.78*ease(0,.22,t)*(1-ease(.87,1,t));
 if(index===5)state.selected='heart';
 if(index===8||index===12)state.explode=.72*ease(0,.22,t)*(1-ease(.87,1,t));
 if(index===8)state.selected='gut';
 if(index===11&&!wantParts)state.explode=.55*ease(0,.5,local);
 if(index===12)state.selected='neural';
 const angle=.60+Math.sin(time*.10)*.16,distance=(index<5?6.3:6.7)+state.explode*1.8;
 const target=new T.Vector3(index>=6?.20:0,index<5?0:.13,0);
 const assembledPosition=target.clone().add(new T.Vector3(Math.sin(angle)*distance,.22,Math.cos(angle)*distance));
 if(wantParts&&layout){
  const overview=overviewCamera(),focus=ease(6,6.8,local)*(1-ease(9.2,10,local)),heart=layout.entries.heart,enter=ease(3,3.7,local);
  const shotTarget=target.clone().lerp(overview.target,enter).lerp(heart.slot,focus);
  camera.position.copy(assembledPosition).lerp(overview.pos,enter).lerp(heart.slot.clone().add(new T.Vector3(.15,.15,3.5)),focus);
  camera.lookAt(shotTarget);camera.updateMatrixWorld();state.selected=focus>.1?'heart':null;state.isolate=focus>.1;root.rotation.set(0,0,0);return;
 }
 camera.position.copy(assembledPosition);camera.lookAt(target);camera.updateMatrixWorld();
 root.rotation.set(index===3||index===4?.30:0,0,0);
}
function text(str,x,y,size,color='#647369',align='left'){ctx.font=`${size}px -apple-system, BlinkMacSystemFont, Arial`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y)}
function filmOverlay(){
 const s=stages[state.stage],cue=currentCue;
 ctx.fillStyle='#fff';ctx.fillRect(0,0,1920,1080);
 const blend=state.paused?1:ease(0,.35,state.time-transitionTime);
 if(blend<1){ctx.globalAlpha=1-blend;ctx.drawImage(previousFrame,0,0);ctx.globalAlpha=blend;}
 ctx.drawImage(canvas,0,0,1920,1080);ctx.globalAlpha=1;
 text(s.age,86,94,32,'#4a5f51');text(ageBasis(s),86,122,15,'#9aa59d');text(s.name,86,168,21,'#819084');
 if(state.view==='parts'&&!state.selected&&layout){for(const [k,item] of Object.entries(layout.entries)){const v=root.localToWorld(item.label.clone()).project(camera);text(systems[k][0],(v.x*.5+.5)*1920,(-v.y*.5+.5)*900,16,'#77887a','center');}}
 // One caption at a time, in a reserved band below the 3D scene.
 ctx.fillStyle='#fff';ctx.fillRect(0,900,1920,180);
 ctx.globalAlpha=state.paused?1:ease(cue.start,cue.start+.18,state.time)*(1-ease(cue.end-.18,cue.end,state.time));
 const heading=cue.title||(cue.part?systems[cue.part][0]:'');if(heading)text(heading,960,924,16,'#859486','center');
 text(cue.caption,960,963,27,'#4b6253','center');ctx.globalAlpha=1;
 text(state.view==='parts'?'Display scales adjusted':s.scale,86,1040,14,'#99a497');text('Illustrative human anatomy',1834,1040,13,'#a7afa5','right');
 const x0=710,x1=1210,y=1037;ctx.strokeStyle='#e1e6df';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();stages.forEach((_,j)=>{ctx.fillStyle=j===state.stage?'#718a76':'#d9e1d6';ctx.beginPath();ctx.arc(mix(x0,x1,j/15),y,j===state.stage?4:2,0,Math.PI*2);ctx.fill()});
 const caption=$('journeyCaption');if(caption.textContent!==cue.caption)caption.textContent=cue.caption;
 document.body.dataset.journeyPart=cue.part||'';document.body.dataset.journeyCaption=cue.caption;
}
async function startFilm(capture=false){
 $('loadText').textContent='Preparing the complete journey';$('loading').hidden=false;
 try{for(let i=0;i<16;i++)await ensure(i);}catch(e){$('loadText').textContent=e.message;return}
 $('loading').hidden=true;boardBeforeFilm={mode:boardMode,stage:state.stage,open:document.body.dataset.inspector==='true'};hiddenBeforeFilm=new Set(hiddenBeforeParts||state.hidden);reset();cameraGoal=null;state.playing=true;state.paused=false;state.time=0;transitionTime=-10;filmStart=performance.now();recording=capture;actualExplode=0;controls.enabled=false;pointerTarget.set(0,0);pointerActual.set(0,0);document.body.classList.add('filmMode');film.hidden=false;$('filmControls').hidden=false;$('pauseFilm').textContent='Pause';$('filmStatus').textContent=capture?'Recording 1080p':'';$('filmSeek').disabled=capture;$('pauseFilm').disabled=capture;resize();await setStage(0,{manual:false});
 if(capture){
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));chunks=[];
  recorder=new MediaRecorder(film.captureStream(30),{mimeType:mime,videoBitsPerSecond:14000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onstop=async()=>{const blob=new Blob(chunks,{type:mime});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='embryo-explorer-prenatal.webm';link.textContent='Download recording';link.className='download';link.style='position:fixed;top:72px;right:32px;z-index:50;padding:12px;background:#eef3eb;border-radius:6px;font-size:12px';document.querySelector('.download')?.remove();document.body.append(link);document.body.dataset.exportStatus='download';if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){try{const r=await fetch('/capture',{method:'POST',body:blob,headers:{'Content-Type':mime}});document.body.dataset.exportStatus=r.ok?'saved':'download';}catch{}}};recorder.start(1000);
 }
 document.body.dataset.playing='true';
}
function stopFilm(){if(!state.playing)return;restoreCleavage();state.playing=false;state.paused=false;if(recorder?.state==='recording')recorder.stop();recording=false;state.view='assembled';hiddenBeforeParts=null;if(hiddenBeforeFilm){state.hidden=hiddenBeforeFilm;hiddenBeforeFilm=null;}actualTray=0;controls.enabled=true;controls.enableRotate=true;document.body.classList.remove('filmMode');film.hidden=true;$('filmControls').hidden=true;root.rotation.set(0,0,0);state.selected=null;state.explode=0;actualExplode=0;state.isolate=false;$('explode').value=0;$('explodeValue').textContent='0%';updateLayers();frameDefault();resize();document.body.dataset.playing='false';if(boardBeforeFilm){const saved=boardBeforeFilm;boardBeforeFilm=null;setView(saved.mode,{manual:false});setStage(saved.stage,{manual:false}).then(()=>{board?.select(saved.stage,saved.open);frameDefault();resize();});}}
$('play').onclick=()=>startFilm();$('record').onclick=()=>{if(!window.MediaRecorder){$('record').textContent='Export unavailable';return}startFilm(true)};
$('stopFilm').onclick=stopFilm;$('pauseFilm').onclick=()=>{state.paused=!state.paused;$('pauseFilm').textContent=state.paused?'Resume':'Pause';filmStart=performance.now()-state.time*1000};
$('filmSeek').oninput=e=>{state.time=+e.target.value;state.paused=true;$('pauseFilm').textContent='Resume';filmStart=performance.now()-state.time*1000};
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(state.playing)stopFilm();else if(document.body.dataset.inspector==='true')closeDetail();}
 if(e.key==='Tab'&&!state.playing&&document.body.dataset.inspector==='true'){
  const items=[...$('detailPanel').querySelectorAll('button,input,select,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
  const first=items[0],last=items.at(-1);
  if(e.shiftKey&&(document.activeElement===first||!$('detailPanel').contains(document.activeElement))){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&(document.activeElement===last||!$('detailPanel').contains(document.activeElement))){e.preventDefault();first?.focus();}
 }
});
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.06,(now-lastTime)/1000);lastTime=now;
 if(state.playing){if(!state.paused)state.time=clamp((now-filmStart)/1000,0,journeyDuration);choreograph(state.time);$('filmSeek').value=state.time;$('filmSeek').setAttribute('aria-valuetext',`${Math.floor(state.time)} of ${journeyDuration} seconds`);$('filmTime').textContent=`${Math.floor(state.time/60)}:${String(Math.floor(state.time%60)).padStart(2,'0')}`;}
 else{if(cameraGoal){const alpha=reduce.matches?1:1-Math.exp(-dt*5);camera.position.lerp(cameraGoal.pos,alpha);controls.target.lerp(cameraGoal.target,alpha);if(camera.position.distanceTo(cameraGoal.pos)<.003)cameraGoal=null;}controls.update();pointerActual.lerp(reduce.matches?new T.Vector2():pointerTarget,1-Math.exp(-dt*3));root.rotation.set(pointerActual.y*.016,pointerActual.x*.025,0);key.position.x=3+pointerActual.x*.35;document.documentElement.style.setProperty('--px',pointerActual.x*18+'px');document.documentElement.style.setProperty('--py',pointerActual.y*12+'px');}
 if(state.playing||document.body.dataset.inspector==='true'){updateModel(dt);renderer.render(scene,camera);}if(state.playing){filmOverlay();if(state.time>=journeyDuration)stopFilm();}
}
async function openDetail(i,part=null){
 pauseForInput();$('detailPanel').hidden=false;document.body.dataset.inspector='true';$('overview').inert=true;
 setView(boardMode,{manual:false});await setStage(i,{manual:false});board.select(i);resize();refreshTray();frameDefault();
 if(part)selectPart(part);$('closeDetail').focus({preventScroll:true});
}
function closeDetail(){pauseForInput();$('detailPanel').hidden=true;document.body.dataset.inspector='false';$('overview').inert=false;board?.select(state.stage,false);board?.focus(state.stage);}
$('closeDetail').onclick=closeDetail;
const params=new URLSearchParams(location.search);const initial=params.has('stage')?clamp(Number(params.get('stage')),0,15):8;
document.body.dataset.inspector='false';
await setStage(initial,{manual:false});
board=createBoard({ensure,directions,openStage:openDetail});
boardMode=['parts','separated'].includes(params.get('view'))?params.get('view'):'assembled';
setView(boardMode,{manual:false});
$('loading').hidden=true;resize();requestAnimationFrame(animate);document.body.dataset.ready='true';
board.setMode(boardMode).catch(e=>{$('boardStatus').textContent='Some stage views could not load. Reload to retry.';console.error(e)});
if(params.has('stage'))await openDetail(initial);
