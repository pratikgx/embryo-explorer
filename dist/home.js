import * as T from 'three';
import {buildStage} from './models.js?v=info4';
import {stages,systems,detail,ageBasis} from './stages.js?v=info4';
import {planLayout} from './layout.js?v=canvas3';
import {directions} from './home-directions.js?v=allzoom4';
const $=id=>document.getElementById(id),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)},mix=T.MathUtils.lerp;
const grid=$('stageBoard'),canvas=$('homeScene'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width: 1100px), (pointer: coarse)');
import {bindExplorationSlider} from './touch-controls.js?v=mobile1';
const defaultHint=()=>compact.matches?'Swipe to browse · Tap a stage to explore':'Scroll to explore · Point to a stage or part to zoom further';
let overviewScroll=0,inspectionCandidate=null,stageCandidate=null,waitingForPart=false,waitingForStage=false,requestedProgress=0;
const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x99968b,1.75));const light=new T.DirectionalLight(0xfff5ed,3.3);light.position.set(3,6,7);scene.add(light);const rim=new T.DirectionalLight(0xe4edf1,1.8);rim.position.set(-4,2,-4);scene.add(rim);const fill=new T.DirectionalLight(0xfff9f1,.45);fill.position.set(-3,0,3);scene.add(fill);
const records=[],identity=new T.Quaternion(),ray=new T.Raycaster(),hidden=new Set();
let progress=0,target=0,dirty=true,last=0,selected=null,hover=null,focused=null,loaded=0,boxes=[],canvasRect=null,resetting=false,lastWheel=0,wheelSum=0,systemHighlight=null,pendingChoice=null;
grid.innerHTML=stages.map((s,i)=>`<article class="stage-card" data-card="${i}"><button class="stage-preview" data-open="${i}" aria-label="Explore ${s.age}: ${s.name}"><span class="stage-age">${s.age}</span><span class="stage-title">${s.name}</span></button><div class="home-parts" hidden aria-label="${s.age} structures"></div></article>`).join('');
$('focusStage').innerHTML=stages.map((s,i)=>`<option value="${i}">${s.age}</option>`).join('');
function status(text){$('boardStatus').textContent=text;}
function name(i,key){return stages[i].age+' · '+(key?systems[key][0]:stages[i].name);}
function updateInfo(){if(!selected)return;const {i,key}=selected;status(name(i,key));$('homeInfo').hidden=false;document.body.dataset.homeInfo='true';$('homeInfoAge').textContent=stages[i].age+' · '+ageBasis(stages[i]);$('homeInfoName').textContent=key?systems[key][0]:stages[i].name;$('homeInfoDescription').textContent=key?detail(key,i):stages[i].note;$('enterStage').textContent=key?'Zoom into this part':'Zoom into this stage';grid.querySelectorAll('.stage-card').forEach(c=>c.dataset.active=String(+c.dataset.card===i));}
function setFocus(i){if(focused!==i)inspectionCandidate=null;if(focused===null)overviewScroll=grid.scrollTop;focused=i;document.body.dataset.focusStage=i;$('focusStage').value=i;updateSystems();resize();dirty=true;}
function showInspectPicker(show){
 waitingForPart=show;waitingForStage=false;$('inspectPicker').querySelector('label').textContent='Inspect a part';$('inspectTarget').setAttribute('aria-label','Part to inspect');$('inspectPicker').hidden=!show;document.body.dataset.chooseInspect=String(show);
 if(show&&focused!==null){
  const keys=stages[focused].parts.filter(k=>!hidden.has(k));
  $('inspectTarget').innerHTML='<option value="">Choose a part…</option>'+keys.map(k=>`<option value="${k}">${systems[k][0]}</option>`).join('');
  status(keys.length?'Choose a part to continue into Inspect':'Show a structure in Systems to inspect it');
 }
}
function showStagePicker(){
 waitingForStage=true;waitingForPart=false;$('inspectPicker').hidden=false;document.body.dataset.chooseInspect='true';
 $('inspectPicker').querySelector('label').textContent='Explore a stage';$('inspectTarget').setAttribute('aria-label','Stage to explore');
 $('inspectTarget').innerHTML='<option value="">Choose a stage…</option>'+stages.map((s,i)=>`<option value="stage:${i}">${s.age} · ${s.name}</option>`).join('');
 status('Choose a stage, then a part to continue to 100%');
}
function rememberPart(i,key){
 const visibleKey=key&&!hidden.has(key)?key:null;
 if(focused===null)stageCandidate={i,key:progress>=94?visibleKey:null};
 if(visibleKey&&i===focused&&progress>=125){inspectionCandidate={i,key:visibleKey};dirty=true;}
}

$('inspectTarget').onchange=e=>{
 const value=e.target.value;if(!value)return;
 if(value.startsWith('stage:')){const i=Number(value.slice(6)),destination=requestedProgress;selected={i,key:null};stageCandidate={i,key:null};setFocus(i);updateInfo();request(destination);}
 else if(focused!==null)choose(focused,value);
};
function request(value){
 pendingChoice=null;let next=clamp(Number(value)||0,0,160);requestedProgress=next;showInspectPicker(false);
 if(next>100&&focused===null){const candidate=selected||hover||stageCandidate;if(!candidate){next=100;showStagePicker();}else{selected={i:candidate.i,key:candidate.key||systemHighlight||null};if(!stages[selected.i].parts.includes(selected.key)||hidden.has(selected.key))selected.key=null;setFocus(selected.i);updateInfo();}}
 if(next>130&&focused!==null&&!selected?.key){
  const candidate=hover?.i===focused&&hover.key?hover:inspectionCandidate;
  const key=candidate?.i===focused?candidate.key:null;
  if(key&&stages[focused].parts.includes(key)&&!hidden.has(key)){selected={i:focused,key};updateInfo();}
  else{next=130;showInspectPicker(true);}
 }
 if(compact.matches&&next<=130&&target>130){$('homeInfo').hidden=true;document.body.dataset.homeInfo='false';}
 // A return from inspection may have hidden the panel; entering again restores it.
 if(next>130&&selected?.key&&target<=130)updateInfo();
 target=next;dirty=true;
}
function applyChoice(i,key){if(key)hidden.delete(key);selected={i,key};setFocus(i);updateInfo();updateSystems();request(key?160:130);if(compact.matches&&!key){$('homeInfo').hidden=true;document.body.dataset.homeInfo='false';}}
function choose(i,key=null){document.body.dataset.systemsOpen='false';$('systemsToggle').setAttribute('aria-expanded','false');if(focused!==null&&progress>130&&(focused!==i||selected?.key!==key)){pendingChoice={i,key};target=focused===i?130:100;dirty=true;return;}applyChoice(i,key);}
function closeInfo(){status(defaultHint());if(progress>130)request(130);selected=null;$('homeInfo').hidden=true;document.body.dataset.homeInfo='false';grid.querySelectorAll('.stage-card').forEach(c=>c.dataset.active='false');dirty=true;}
$('closeHomeInfo').onclick=()=>{$('homeInfo').hidden=true;document.body.dataset.homeInfo='false';dirty=true;};
$('enterStage').onclick=()=>{if(progress>130){request(130);if(compact.matches){$('homeInfo').hidden=true;document.body.dataset.homeInfo='false';}}else if(selected)choose(selected.i,selected.key);};
$('stageDetails').onclick=()=>{if(focused!==null){if(!selected)selected={i:focused,key:null};updateInfo();}};
$('backOverview').onclick=()=>{pendingChoice=null;request(100);status('Returning to all sixteen stages');};
$('focusStage').onchange=e=>{const i=+e.target.value,key=selected?.key;choose(i,stages[i].parts.includes(key)&&!hidden.has(key)?key:null);};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sources').open){if(target>130){choose(focused,null);}else if(target>100)request(100);else closeInfo();}});
function pick(i,x,y){const record=records[i],r=record?.rect;if(!r||x<r.left||x>r.left+r.width||y<r.top||y>r.top+r.height)return null;ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),record.camera);const objects=[];for(const p of Object.values(record.model.userData.parts))if(p.visible)p.traverse(o=>{if(o.isMesh&&o.visible&&o.material.opacity>.2)objects.push(o)});return ray.intersectObjects(objects,false)[0]?.object.userData.key||null;}
function bindSurface(b,getIndex,getKey=null){let down=null,suppress=false,pressedKey=null;const pointers=new Map();let pinch=null;
 b.onpointerdown=e=>{if(e.button!==0)return;pressedKey=e.target.closest('[data-key]')?.dataset.key||null;if(compact.matches&&focused===null){down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};suppress=false;return;}resetting=false;suppress=false;pointers.set(e.pointerId,[e.clientX,e.clientY]);down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};b.setPointerCapture(e.pointerId);if(pointers.size===2){const [a,c]=[...pointers.values()];pinch=Math.hypot(a[0]-c[0],a[1]-c[1]);}};
 b.onpointermove=e=>{if(compact.matches&&focused===null){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)suppress=true;return;}const i=getIndex();if(i===null)return;if(pointers.has(e.pointerId))pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const [a,c]=[...pointers.values()],distance=Math.hypot(a[0]-c[0],a[1]-c[1]);hover={i,key:pick(i,e.clientX,e.clientY)};if(pinch)request(target+(distance-pinch)*.25);pinch=distance;suppress=true;return;}
 if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)suppress=true;if(suppress&&records[i]){records[i].yaw-=(e.clientX-down.lastX)*.012;records[i].pitch=clamp(records[i].pitch+(e.clientY-down.lastY)*.01,-1.05,1.05);dirty=true;}down.lastX=e.clientX;down.lastY=e.clientY;return;}
 const key=pick(i,e.clientX,e.clientY);rememberPart(i,key);if(hover?.i!==i||hover?.key!==key){hover={i,key};rememberPart(i,key);status(name(i,key));$('hoverName').textContent=key?systems[key][0]:'';dirty=true;}};
 b.onpointerup=b.onpointercancel=e=>{if(e.type==='pointercancel')suppress=true;pointers.delete(e.pointerId);pinch=null;down=null;if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);};
 b.onclick=e=>{if(suppress){suppress=false;return;}const i=getIndex();if(i!==null)choose(i,getKey?(e.detail===0?getKey(e):pressedKey||getKey(e)):(e.detail===0||(compact.matches&&focused===null))?null:pick(i,e.clientX,e.clientY));};
 b.onfocus=()=>{const i=getIndex();if(i!==null){hover={i,key:null};rememberPart(i,null);status(name(i,null));}};
 b.onpointerleave=()=>{if(!down){hover=null;$('hoverName').textContent='';dirty=true;}};
}
grid.querySelectorAll('[data-open]').forEach(b=>bindSurface(b,()=>+b.dataset.open));bindSurface($('focusLayer'),()=>focused,e=>e.target.closest('[data-key]')?.dataset.key||pick(focused,e.clientX,e.clientY));
function partButton(b,i,delegated=false){if(!delegated)bindSurface(b,()=>i,()=>b.dataset.key);b.onpointerenter=b.onfocus=()=>{hover={i,key:b.dataset.key};rememberPart(i,b.dataset.key);status(name(i,b.dataset.key));$('hoverName').textContent=systems[b.dataset.key][0];dirty=true;};b.onpointerleave=b.onblur=()=>{hover=null;$('hoverName').textContent='';dirty=true;};}
function updateFocusParts(){if(focused===null)return;const layer=$('focusParts');if(layer.dataset.stage===String(focused))return;layer.dataset.stage=focused;layer.innerHTML=stages[focused].parts.map(k=>`<button data-key="${k}" aria-label="Inspect ${systems[k][0]}"><span>${systems[k][0]}</span></button>`).join('');for(const b of layer.children)partButton(b,focused,true);}
const systemKeys=[...new Set(['body','neural','heart','lungs','gut','liver','skeleton','kidneys','support',...stages.flatMap(s=>s.parts)])];
function updateSystems(){const keys=focused===null?systemKeys:stages[focused].parts;$('systemsContext').textContent=focused===null?'Across all stages':stages[focused].age;$('systemList').innerHTML=keys.map(key=>{const n=focused===null?stages.filter(s=>s.parts.includes(key)).length:1;return `<div class="system-row" data-system="${key}" data-selected="${selected?.key===key}"><button class="system-name" data-system-select="${key}" title="${focused===null?'Highlight across stages':'Inspect this structure'}"><i style="background:${systems[key][1]}"></i>${systems[key][0]}</button><small>${n}</small><input type="checkbox" data-system-visible="${key}" aria-label="Show ${systems[key][0]}" ${hidden.has(key)?'':'checked'}></div>`;}).join('');
 $('systemsCount').textContent=focused===null?'Counts show stages containing each structure':'Structures represented at this stage';
 for(const b of $('systemList').querySelectorAll('[data-system-select]'))b.onclick=()=>{const key=b.dataset.systemSelect;if(focused!==null)choose(focused,key);else{systemHighlight=systemHighlight===key?null:key;status(systemHighlight?`${systems[key][0]} · Point to a stage and scroll to inspect`:'All systems');dirty=true;}};
 for(const c of $('systemList').querySelectorAll('[data-system-visible]'))c.onchange=()=>{const key=c.dataset.systemVisible;if(c.checked)hidden.delete(key);else hidden.add(key);if(inspectionCandidate?.key===key&&!c.checked)inspectionCandidate=null;if(selected?.key===key&&!c.checked){selected.key=null;target=Math.min(target,130);updateInfo();}dirty=true;};
}
$('showSystems').onclick=()=>{hidden.clear();updateSystems();dirty=true;};$('systemsToggle').onclick=()=>{const open=document.body.dataset.systemsOpen!=='true';document.body.dataset.systemsOpen=String(open);$('systemsToggle').setAttribute('aria-expanded',String(open));};updateSystems();
bindExplorationSlider($('homeSlider'),value=>{request(value);return target;});
for(const b of document.querySelectorAll('[data-progress]'))b.onclick=()=>request(+b.dataset.progress);
window.addEventListener('pointermove',e=>{if(reduce.matches||e.pointerType==='touch'||e.buttons)return;document.documentElement.style.setProperty('--px',(e.clientX/innerWidth-.5)*12+'px');document.documentElement.style.setProperty('--py',(e.clientY/innerHeight-.5)*8+'px');});
$('home').addEventListener('wheel',e=>{if($('sources').open||e.target.closest('#inspectPicker')||(compact.matches&&focused===null&&!e.target.closest('#homeExploration')))return;e.preventDefault();const f=Math.floor(performance.now()/16);if(f!==lastWheel){lastWheel=f;wheelSum=0;}const delta=clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1)*.065,-4,4),allowed=Math.sign(delta)*Math.min(Math.abs(delta),4-Math.abs(wheelSum));wheelSum+=allowed;request(target+allowed);},{passive:false});
$('reset').onclick=()=>{pendingChoice=null;if(focused===null)closeInfo();hidden.clear();systemHighlight=null;resetting=true;overviewScroll=0;grid.scrollTop=0;hover=null;inspectionCandidate=null;stageCandidate=null;request(0);updateSystems();};
$('sourceBtn').onclick=()=>$('sources').showModal();$('closeSources').onclick=()=>$('sources').close();$('sources').onclick=e=>{if(e.target===$('sources'))e.target.close();};
function measureBoxes(){boxes=[...grid.querySelectorAll('.stage-card')].map(c=>{const r=c.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:Math.max(1,r.height-(compact.matches?40:27))};});dirty=true;}
grid.addEventListener('scroll',measureBoxes,{passive:true});
function resize(){canvasRect=canvas.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(Math.max(1,canvasRect.width),Math.max(1,canvasRect.height),false);measureBoxes();for(const record of records){if(!record)continue;const fullHeight=canvasRect.height+(document.body.dataset.homeInfo==='true'&&innerHeight>=601?$('homeInfo').getBoundingClientRect().height+10:0),aspect=canvasRect.width/Math.max(1,fullHeight),columns=focused===record.i&&compact.matches?(aspect<.85?2:aspect>1.7?4:3):3;record.layout=planLayout(record.model.userData.parts,stages[record.i].parts,1.4,Math.min(columns,stages[record.i].parts.length));}dirty=true;}
new ResizeObserver(resize).observe($('home'));
compact.addEventListener('change',()=>{resize();if(focused===null)status(defaultHint());});
new ResizeObserver(()=>{document.documentElement.style.setProperty('--info-height',$('homeInfo').getBoundingClientRect().height+'px');}).observe($('homeInfo'));
function localCorners(part){const {center,size}=part.userData,result=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])result.push(center.clone().add(new T.Vector3(x*size.x,y*size.y,z*size.z).multiplyScalar(.5)));return result;}
function frame(points,aspect,direction){const bounds=new T.Box3().setFromPoints(points),center=bounds.getCenter(new T.Vector3()),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),tan=Math.tan(T.MathUtils.degToRad(33/2));let distance=.1;for(const v of points){const d=v.clone().sub(center);distance=Math.max(distance,Math.abs(d.dot(up))/tan+d.dot(direction),Math.abs(d.dot(right))/(tan*aspect)+d.dot(direction));}return {center,distance:distance*1.09};}
function render(){if(!canvasRect||!boxes.length)return;renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);let framed=true;
 const exp=ease(6,50,progress),tray=ease(50,100,progress),reveal=ease(2,35,progress),focus=focused===null?0:ease(100,130,progress),inspect=selected?.key?ease(130,160,progress):0;
 grid.style.opacity=1-focus;grid.inert=focus>.02;grid.style.pointerEvents=focus>.02?'none':'';$('focusLayer').hidden=focus<.01;$('focusHeader').hidden=focus<.3;$('focusLayer').style.opacity=focus;updateFocusParts();
 const order=records.filter(Boolean).filter(r=>r.i!==focused);if(records[focused])order.push(records[focused]);
 for(const record of order){const {i,model,camera,layout}=record;if(compact.matches&&focus===0&&(boxes[i].top+boxes[i].height<canvasRect.top||boxes[i].top>canvasRect.bottom)){model.visible=false;grid.querySelector(`[data-card="${i}"] .home-parts`).hidden=true;continue;}if(focus>=.999&&i!==focused){model.visible=false;continue;}const base=boxes[i],big={left:canvasRect.left+10,top:canvasRect.top+42,width:canvasRect.width-20,height:canvasRect.height-48},zoom=i===focused?focus:0,r={};for(const k of ['left','top','width','height'])r[k]=mix(base[k],big[k],zoom);record.rect=r;const points=[],partPoints={};
 for(const [key,p] of Object.entries(model.userData.parts)){
 const entry=layout.entries[key];p.position.set(...(directions[key]||[0,0,0])).multiplyScalar(exp).lerp(entry.position,tray);p.scale.setScalar(mix(1,entry.scale,tray));p.quaternion.copy(identity).slerp(entry.rotation,tray);
 let opacity=1;if(i>=5){if(key==='body')opacity=mix(1,.09,reveal)*(1-tray)+tray;else if(!['support','yolk'].includes(key))opacity=reveal;}
 if(i!==focused)opacity*=1-focus;if(i===focused&&selected?.key!==key)opacity*=1-inspect;if(hidden.has(key))opacity=0;
 p.visible=opacity>.001;const lit=(selected?.i===i&&selected.key===key)||(hover?.i===i&&hover.key===key)||(inspectionCandidate?.i===i&&inspectionCandidate.key===key&&progress<=130)||systemHighlight===key;
 p.traverse(o=>{if(o.isMesh){o.material.opacity=opacity*o.userData.baseOpacity;o.material.depthWrite=o.material.opacity>.85;o.material.emissive.set(lit?'#8b9e72':'#000000');o.material.emissiveIntensity=lit?.12:0;}});
 partPoints[key]=record.corners[key].map(c=>c.clone().multiply(p.scale).applyQuaternion(p.quaternion).add(p.position));if(!hidden.has(key))points.push(...partPoints[key]);
 }
 if(!points.length){const emptyLayer=i===focused?$('focusParts'):grid.querySelector(`[data-card="${i}"] .home-parts`);for(const b of emptyLayer.children)b.hidden=true;continue;}
 const yaw=.644*(1-tray)+record.yaw,pitch=.06+record.pitch,direction=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));camera.aspect=r.width/r.height;camera.updateProjectionMatrix();const all=frame(points,camera.aspect,direction),one=i===focused&&selected?.key?frame(partPoints[selected.key],camera.aspect,direction):all,center=all.center.clone().lerp(one.center,i===focused?inspect:0),distance=mix(all.distance,one.distance,i===focused?inspect:0);
 camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.updateMatrixWorld();model.visible=true;model.updateMatrixWorld(true);
 const x=r.left-canvasRect.left,y=canvasRect.height-(r.top+r.height-canvasRect.top);renderer.setViewport(x,y,r.width,r.height);const sx=Math.max(0,x),sy=Math.max(0,y);renderer.setScissor(sx,sy,Math.max(0,Math.min(canvasRect.width,x+r.width)-sx),Math.max(0,Math.min(canvasRect.height,y+r.height)-sy));renderer.render(scene,camera);model.visible=false;
 const checked=i===focused&&inspect>.01&&selected?.key?partPoints[selected.key]:points;if(!checked.every(v=>{const q=v.clone().project(camera);return Math.abs(q.x)<=1&&Math.abs(q.y)<=1}))framed=false;
 const layer=grid.querySelector(`[data-card="${i}"] .home-parts`);layer.hidden=progress<94||focus>.01;
 if(progress>=94){const activeLayer=i===focused&&focus>.01?$('focusParts'):layer;for(const b of activeLayer.children){const key=b.dataset.key,entry=layout.entries[key],q=entry.slot.clone().project(camera);b.hidden=hidden.has(key)||inspect>.02;b.style.left=(q.x*.5+.5)*r.width+(activeLayer===layer?0:r.left-canvasRect.left)+'px';b.style.top=(.5-q.y*.5)*r.height+(activeLayer===layer?0:r.top-canvasRect.top)+'px';const edgeX=entry.slot.clone().add(new T.Vector3(1.7,0,0)).project(camera),edgeY=entry.slot.clone().add(new T.Vector3(0,1.55,0)).project(camera),hitWidth=Math.abs(edgeX.x-q.x)*r.width/2,hitHeight=Math.abs(edgeY.y-q.y)*r.height/2;b.style.width=(activeLayer===layer?Math.min(hitWidth,42):Math.min(hitWidth,160))+'px';b.style.height=(activeLayer===layer?Math.min(hitHeight,42):Math.min(hitHeight,140))+'px';b.dataset.selected=String((selected?.i===i&&selected.key===key)||(inspectionCandidate?.i===i&&inspectionCandidate.key===key));}}
 }
 renderer.setScissorTest(false);document.body.dataset.framed=String(framed);document.body.dataset.homeProgress=progress.toFixed(2);document.body.dataset.homeMode=progress<.1?'assembled':progress>159.9?'inspect':progress>129.9?'stage':progress>99.9?'parts':Math.abs(progress-50)<.1?'separate':'transition';document.body.dataset.zoomed=String(focus>.01);
}
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(Math.abs(progress-target)>.02){progress+=clamp((target-progress)*(1-Math.exp(-dt*6)),-dt*65,dt*65);dirty=true;}else if(progress!==target){progress=target;dirty=true;}
 if(pendingChoice&&Math.abs(progress-target)<.03){const next=pendingChoice;pendingChoice=null;applyChoice(next.i,next.key);}
 if(progress<=100&&target<=100&&focused!==null){focused=null;inspectionCandidate=null;showInspectPicker(false);delete document.body.dataset.focusStage;closeInfo();updateSystems();grid.scrollTop=overviewScroll;resize();dirty=true;}
 if(resetting){let rest=true;for(const r of records){if(!r)continue;r.yaw=mix(r.yaw,0,1-Math.exp(-dt*8));r.pitch=mix(r.pitch,0,1-Math.exp(-dt*8));if(Math.abs(r.yaw)+Math.abs(r.pitch)>.001)rest=false;else r.yaw=r.pitch=0;}resetting=!rest;dirty=true;}
 if(selected){if(!waitingForPart&&target<=130&&focused!==null)status(compact.matches?'Tap a part to inspect · Drag to rotate':name(focused,null)+' · Point to a part to inspect');if(target>130)status(name(selected.i,selected.key)+(compact.matches?' · Slide back to return':' · Scroll back to return'));$('enterStage').hidden=!selected.key&&progress>=129.9;$('enterStage').textContent=progress>130?'← Back to stage parts':selected.key?'Zoom into this part':'Zoom into this stage';}
 $('homeSlider').value=target;$('homeSlider').style.setProperty('--progress',(target/160*100)+'%');$('homeValue').textContent=Math.round(progress/160*100)+'%';$('homePhase').textContent=progress<.1?'Assembled':progress<49.9?'Separating':progress<50.1?'Separate':progress<99.9?'Arranging parts':progress<100.1?'All parts':progress<129.9?'Into the stage':progress<130.1?'Stage anatomy':progress<159.9?'Closer look':'Inspect';for(const b of document.querySelectorAll('[data-progress]'))b.setAttribute('aria-pressed',String(Math.abs(target-Number(b.dataset.progress))<1));$('homeSlider').setAttribute('aria-valuetext',`${$('homePhase').textContent}${focused!==null?', '+stages[focused].age:''}`);if(dirty){render();dirty=false;}}
resize();requestAnimationFrame(tick);
for(let i=0;i<stages.length;i++){
 try{const model=await buildStage(i);model.visible=false;scene.add(model);records[i]={i,model,camera:new T.PerspectiveCamera(33,1,.01,100),layout:planLayout(model.userData.parts,stages[i].parts,1.4,Math.min(3,stages[i].parts.length)),corners:Object.fromEntries(Object.entries(model.userData.parts).map(([k,p])=>[k,localCorners(p)])),yaw:0,pitch:0};
 const layer=grid.querySelector(`[data-card="${i}"] .home-parts`);layer.innerHTML=stages[i].parts.map(k=>`<button data-key="${k}" aria-label="${stages[i].age}: ${systems[k][0]}" title="${systems[k][0]}"></button>`).join('');for(const b of layer.children)partButton(b,i);
 loaded++;document.body.dataset.loadedStages=loaded;dirty=true;status('Preparing stages · '+loaded+' / 16');await new Promise(resolve=>requestAnimationFrame(resolve));
 }catch(e){status('A stage could not load. Reload to try again.');console.error(e);}
}
document.body.dataset.boardReady=String(loaded===16);status(defaultHint());
