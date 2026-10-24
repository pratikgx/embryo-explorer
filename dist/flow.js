import {bindExplorationSlider} from './touch-controls.js?v=mobile1';
import * as T from 'three';
import {stages,systems,detail,ageBasis} from './stages.js?v=info4';
import {buildStage} from './models.js?v=info4';
import {planLayout} from './layout.js?v=canvas3';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=T.MathUtils.lerp;
const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:1100px), (pointer:coarse)'),PARTS=75;
const state={stage:9,target:0,progress:0,pinned:null,hover:null,locked:null,yaw:0,pitch:0,loading:false};
const canvas=$('scene'),renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.01,160);scene.add(new T.HemisphereLight(0xffffff,0x99968b,1.75));
const light=new T.DirectionalLight(0xfff5ed,3.3);light.position.set(3,6,7);scene.add(light);const rim=new T.DirectionalLight(0xe4edf1,1.8);rim.position.set(-4,2,-4);scene.add(rim);const fill=new T.DirectionalLight(0xfff9f1,.45);fill.position.set(-3,0,3);scene.add(fill);
const directions={body:[0,0,0],neural:[-.95,.48,0],heart:[.95,.48,.15],gut:[.9,-.83,.15],liver:[1.25,-.18,-.12],lungs:[-.9,-.08,.2],skeleton:[-.75,-.8,-.15],kidneys:[.15,-1.12,-.35],somites:[-.85,-.65,0],support:[.35,.1,0],yolk:[.9,-.3,0],zona:[0,0,0],cell:[.7,0,0],nuclei:[-.85,.25,0],blastomeres:[.5,0,0],trophoblast:[-.65,0,0],inner:[.75,.1,0],epiblast:[0,.6,0],hypoblast:[0,-.5,0],amnion:[-.8,.4,0],ectoderm:[0,.7,0],mesoderm:[0,0,0],endoderm:[0,-.7,0],axis:[.9,.35,0]};
const cache=new Map(),pending=new Map();let resettingOrbit=false,sliderDragging=false,model=null,layout=null,stageTicket=0,last=0,lastInfo='',blocked=false,lastWheel=0,wheelCandidate=null,wheelFrame=0,wheelAmount=0;
const ray=new T.Raycaster(),pointer=new T.Vector2(),identity=new T.Quaternion();
const guideGroup=new T.Group();scene.add(guideGroup);for(let i=0;i<12;i++)guideGroup.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xc1cbb8,transparent:true,opacity:0})));

function targetKey(){return state.pinned||state.locked||state.hover;}
function requestProgress(value,{candidate=targetKey()}={}){
 let next=clamp(Number(value)||0,0,100);blocked=false;
 if(next>PARTS&&!state.pinned&&!state.locked){if(candidate&&model?.userData.parts[candidate])state.locked=candidate;else{next=PARTS;blocked=true;}}
 state.target=next;if(next<=PARTS&&state.progress<=PARTS)state.locked=null;
 syncUI();
}
function phase(p){return p<.5?'Assembled':p<40?'Separating':p<40.5?'Separate':p<74.5?'Arranging parts':p<=75.5?'All parts':'Inspecting';}
function syncUI(){
 const focus=targetKey();$('exploreSlider').value=state.target;$('phaseLabel').textContent=phase(state.progress);$('progressValue').textContent=Math.round(state.progress)+'%';$('exploreSlider').style.setProperty('--progress',state.progress+'%');
 $('exploreSlider').setAttribute('aria-valuetext',`${Math.round(state.progress)} percent, ${phase(state.progress)}${state.target>75&&focus?', '+systems[focus][0]:''}`);
 const text=blocked?(compact.matches?'Tap a part to explore':'Point to a part to explore'):state.target>75&&focus?systems[focus][0]+(compact.matches?' · Slide back to return':' · Scroll back to return'):state.progress>=68?(compact.matches?'Tap a part to explore':focus?systems[focus][0]+' · Scroll to inspect':'Point to a part to explore'):(compact.matches?'Slide to explore · Drag to rotate':'Scroll to explore · Drag to rotate');
 if($('exploreHint').textContent!==text)$('exploreHint').textContent=text;
 document.body.dataset.progress=state.progress.toFixed(2);document.body.dataset.target=state.target.toFixed(2);document.body.dataset.phase=phase(state.progress);document.body.dataset.selected=focus||'';
 const show=state.pinned||(state.progress>75&&state.locked);document.body.dataset.info=String(!!show);$('infoPanel').hidden=!show;
 const id=show?`${state.stage}:${show}`:'';if(id&&id!==lastInfo){$('infoAge').textContent=stages[state.stage].age+' · '+ageBasis(stages[state.stage]);$('infoName').textContent=systems[show][0];$('infoDescription').textContent=detail(show,state.stage);}lastInfo=id;
}
function choose(key){if(!model?.userData.parts[key])return;state.pinned=key;state.locked=null;state.hover=key;requestProgress(100);}
function clearSelection(){const previous=targetKey();requestProgress(Math.min(PARTS,state.target));state.pinned=null;state.locked=state.progress>PARTS?previous:null;state.hover=null;syncUI();}
$('closeInfo').onclick=clearSelection;$('backParts').onclick=()=>{const previous=targetKey();requestProgress(PARTS);state.pinned=null;state.locked=state.progress>PARTS?previous:null;state.hover=null;syncUI();};
bindExplorationSlider($('exploreSlider'),value=>{requestProgress(value);return state.target;});
$('stageSelect').innerHTML=stages.map((s,i)=>`<option value="${i}">${s.age}</option>`).join('');
async function ensure(i){if(cache.has(i))return cache.get(i);if(pending.has(i))return pending.get(i);const promise=buildStage(i).then(m=>{cache.set(i,m);return m});pending.set(i,promise);try{return await promise}finally{pending.delete(i)}}
async function setStage(index){
 const i=clamp(+index,0,15),ticket=++stageTicket;state.loading=true;$('loadMessage').textContent='Preparing '+stages[i].age+'…';$('loadMessage').hidden=false;
 try{const next=await ensure(i);if(ticket!==stageTicket)return;
 const keep=state.pinned||state.locked;if(keep&&!next.userData.parts[keep]){state.target=Math.min(PARTS,state.target);await new Promise(resolve=>{const wait=()=>{if(ticket!==stageTicket||state.progress<=75.1)resolve();else requestAnimationFrame(wait);};wait();});if(ticket!==stageTicket)return;state.pinned=null;state.locked=null;}
 state.hover=null;if(model){canvas.style.opacity='0';await new Promise(resolve=>setTimeout(resolve,140));if(ticket!==stageTicket)return;scene.remove(model);}canvas.style.opacity='1';model=next;scene.add(model);state.stage=i;state.loading=false;
 const columns=innerWidth<430?2:3;layout=planLayout(model.userData.parts,stages[i].parts,1.4,Math.min(columns,stages[i].parts.length));
 $('stageSelect').value=i;$('stageName').textContent=stages[i].name;$('stageDate').textContent=ageBasis(stages[i]);$('previous').disabled=i===0;$('next').disabled=i===15;
 $('partLabels').innerHTML=stages[i].parts.map(k=>`<button class="part-label" data-part="${k}" aria-label="Inspect ${systems[k][0]}" hidden>${systems[k][0]}</button>`).join('');
 document.querySelectorAll('[data-part]').forEach(b=>{b.onclick=()=>choose(b.dataset.part);b.onfocus=()=>{state.hover=b.dataset.part;syncUI()};b.onblur=()=>{state.hover=null;syncUI()};});
 $('loadMessage').hidden=true;document.body.dataset.stage=i;document.body.dataset.ready='true';$('exploreSlider').value=state.target;lastInfo='';syncUI();
 }catch(e){if(ticket!==stageTicket)return;state.loading=false;$('loadMessage').textContent='This stage could not load. Choose another stage or reload.';console.error(e);}
}
$('stageSelect').onchange=e=>setStage(e.target.value);$('previous').onclick=()=>setStage(state.stage-1);$('next').onclick=()=>setStage(state.stage+1);
$('reset').onclick=()=>{const previous=targetKey();state.pinned=null;state.locked=state.progress>75?previous:null;state.hover=null;resettingOrbit=true;requestProgress(0);};
$('sourceBtn').onclick=()=>$('sources').showModal();$('closeSources').onclick=()=>$('sources').close();$('sources').onclick=e=>{if(e.target===$('sources'))$('sources').close()};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sources').open)clearSelection();});
function resize(){const rect=$('viewport').getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('viewport'));window.addEventListener('resize',()=>{if(model){const columns=innerWidth<430?2:3;layout=planLayout(model.userData.parts,stages[state.stage].parts,1.4,Math.min(columns,stages[state.stage].parts.length));}});
function pick(x,y){if(!model||state.loading)return null;const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const meshes=[];model.traverse(o=>{if(o.isMesh&&o.visible&&o.material.opacity>.2&&o.parent.visible)meshes.push(o)});return ray.intersectObjects(meshes,false)[0]?.object.userData.key||null;}
// One gesture changes exploration progress. A new scroll gesture is needed to leave the unselected All parts stop.
function wheel(e){if(state.loading||$('sources').open||e.target.closest('aside,select,button,dialog'))return;e.preventDefault();const now=performance.now();if(now-lastWheel>180)wheelCandidate=state.pinned||(state.progress>=68?state.hover:null);lastWheel=now;
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);const frame=Math.floor(now/16);if(frame!==wheelFrame){wheelFrame=frame;wheelAmount=0;}const amount=clamp(delta*.055,-4,4),allowed=Math.sign(amount)*Math.min(Math.abs(amount),Math.max(0,4-Math.abs(wheelAmount)));wheelAmount+=allowed;
 requestProgress(state.target+allowed,{candidate:state.pinned||state.locked||wheelCandidate});
}
$('viewport').addEventListener('wheel',wheel,{passive:false});$('exploration').addEventListener('wheel',wheel,{passive:false});
const pointers=new Map();let gesture=null,pinchDistance=null,wasPinch=false;
canvas.addEventListener('pointerdown',e=>{resettingOrbit=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size===1){gesture={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};wasPinch=false;}else{wasPinch=true;const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}});
canvas.addEventListener('pointermove',e=>{
 if(pointers.has(e.pointerId)){pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance)requestProgress(state.target+clamp((d-pinchDistance)*.18,-3,3));pinchDistance=d;return;}
 if(gesture&&!wasPinch){const dx=e.clientX-gesture.lastX,dy=e.clientY-gesture.lastY;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>5)gesture.moved=true;if(gesture.moved){state.yaw-=dx*.008;state.pitch=clamp(state.pitch+dy*.008,-1.1,1.1);}gesture.lastX=e.clientX;gesture.lastY=e.clientY;}return;}
 state.hover=state.progress>=68?pick(e.clientX,e.clientY):null;blocked=false;syncUI();
 if(!reduce.matches){document.documentElement.style.setProperty('--px',(e.clientX/innerWidth-.5)*12+'px');document.documentElement.style.setProperty('--py',(e.clientY/innerHeight-.5)*8+'px');}
});
function pointerEnd(e){const click=!wasPinch&&!gesture?.moved&&e.type==='pointerup';pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(click){const key=pick(e.clientX,e.clientY);if(key)choose(key);}if(!pointers.size){gesture=null;pinchDistance=null;wasPinch=false;}}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);canvas.addEventListener('pointerleave',()=>{if(!pointers.size){state.hover=null;syncUI();}});
const corners=(center,size)=>{const result=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])result.push(center.clone().add(new T.Vector3(x*size.x,y*size.y,z*size.z).multiplyScalar(.5)));return result;};
function transformedCorners(part){const {center,size}=part.userData;return corners(center,size).map(v=>v.multiply(part.scale).applyQuaternion(part.quaternion).add(part.position));}
function fit(points,direction){const bounds=new T.Box3().setFromPoints(points),center=bounds.getCenter(new T.Vector3()),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=.5;for(const point of points){const d=point.clone().sub(center);distance=Math.max(distance,Math.abs(d.dot(up))/tan+d.dot(direction),Math.abs(d.dot(right))/(tan*camera.aspect)+d.dot(direction));}return{center,distance:distance*1.15};}
function render(){if(!model)return;
 const p=state.progress,explode=ease(7,40,p),tray=ease(40,75,p),inspect=ease(75,100,p),reveal=ease(2,30,p),focus=targetKey();let n=0;const all=[];guideGroup.children.forEach(l=>l.visible=false);
 for(const [k,part] of Object.entries(model.userData.parts)){
 const entry=layout.entries[k],d=new T.Vector3(...(directions[k]||[0,0,0])).multiplyScalar(explode);
 part.position.copy(d).lerp(entry.position,tray);part.scale.setScalar(mix(1,entry.scale,tray));part.quaternion.copy(identity).slerp(entry.rotation,tray);
 let opacity=1;if(state.stage>=5){if(k==='body')opacity=mix(1,.09,reveal)*(1-tray)+tray;else if(!['support','yolk'].includes(k))opacity=reveal;}
 if(inspect&&k!==focus)opacity*=1-inspect*.96;part.visible=opacity>.001;
 part.traverse(o=>{if(o.isMesh){o.material.opacity=opacity*o.userData.baseOpacity;o.material.depthWrite=o.material.opacity>.85;o.material.emissive.set((state.hover===k||state.pinned===k||state.locked===k)?'#829a6e':'#000000');o.material.emissiveIntensity=(state.hover===k||state.pinned===k||state.locked===k)?.13:0;}});
 all.push(...transformedCorners(part));
 if(k!=='body'&&explode>.03&&tray<.99&&n<guideGroup.children.length){const line=guideGroup.children[n++],a=part.userData.center,b=a.clone().add(d);line.visible=true;line.material.opacity=explode*(1-tray)*.19;const pos=line.geometry.attributes.position;pos.setXYZ(0,a.x,a.y,a.z);pos.setXYZ(1,b.x,b.y,b.z);pos.needsUpdate=true;line.geometry.computeBoundingSphere();}
 }
 model.updateMatrixWorld(true);
 const yaw=.644*(1-tray)+state.yaw,pitch=.06+state.pitch,direction=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),whole=fit(all,direction);
 const selected=focus&&model.userData.parts[focus]?fit(transformedCorners(model.userData.parts[focus]),direction):whole;
 const center=whole.center.clone().lerp(selected.center,inspect),distance=mix(whole.distance,selected.distance,inspect)*(1+.06*(1-ease(0,7,p)));camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.updateMatrixWorld();renderer.render(scene,camera);const check=inspect>.99&&focus?transformedCorners(model.userData.parts[focus]):inspect<.01?all:null;if(check)document.body.dataset.framed=String(check.every(v=>{const q=v.clone().project(camera);return Math.abs(q.x)<1&&Math.abs(q.y)<1&&q.z>-1&&q.z<1}));
 const rect=canvas.getBoundingClientRect();document.querySelectorAll('[data-part]').forEach(b=>{const k=b.dataset.part,part=model.userData.parts[k],entry=layout.entries[k];b.hidden=p<68||p>80;b.dataset.highlight=String(focus===k);if(b.hidden)return;const v=entry.label.clone().project(camera);b.style.left=(v.x*.5+.5)*rect.width+'px';b.style.top=(.5-v.y*.5)*rect.height+'px';});
 document.body.dataset.orbit=state.yaw.toFixed(3)+','+state.pitch.toFixed(3);document.body.dataset.renderedStage=state.stage;document.body.dataset.renderedProgress=p.toFixed(2);document.body.dataset.meshCount=all.length/8;
}
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(resettingOrbit){const a=1-Math.exp(-dt*7);state.yaw=mix(state.yaw,0,a);state.pitch=mix(state.pitch,0,a);if(Math.abs(state.yaw)+Math.abs(state.pitch)<.001){state.yaw=0;state.pitch=0;resettingOrbit=false;}}const delta=state.target-state.progress;if(Math.abs(delta)<.02)state.progress=state.target;else{const step=delta*(1-Math.exp(-dt*(reduce.matches?18:6)));state.progress+=clamp(step,-dt*70,dt*70);}if(state.progress<=PARTS&&state.target<=PARTS)state.locked=null;syncUI();render();}
const stageParam=new URLSearchParams(location.search).get('stage');const initial=stageParam!==null&&Number.isInteger(Number(stageParam))&&Number(stageParam)>=0&&Number(stageParam)<16?Number(stageParam):9;resize();requestAnimationFrame(animate);await setStage(initial);const entryParams=new URLSearchParams(location.search),entryProgress=clamp(Number(entryParams.get('progress'))||0,0,75),entryPart=entryParams.get('part');state.progress=entryProgress;state.target=entryProgress;if(entryPart&&model?.userData.parts[entryPart])choose(entryPart);else syncUI();
