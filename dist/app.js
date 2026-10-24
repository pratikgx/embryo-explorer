import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {stages,systems,detail} from './stages.js';
import {buildStage} from './models.js';
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
const state={stage:8,selected:null,isolate:false,explode:0,hidden:new Set(['support']),playing:false,paused:false,time:0};
let actualExplode=0,cameraGoal=null,recording=false,recorder=null,chunks=[],lastTime=performance.now(),filmStart=0,requestId=0;
let dragging=false,pointerTarget=new T.Vector2(),pointerActual=new T.Vector2();
const directions={body:[0,0,0],neural:[-.95,.48,0],heart:[.95,.48,.15],gut:[.9,-.83,.15],liver:[1.25,-.18,-.12],lungs:[-.9,-.08,.2],skeleton:[-.75,-.8,-.15],kidneys:[.15,-1.12,-.35],somites:[-.85,-.65,0],support:[.35,.1,0],yolk:[.9,-.3,0],zona:[0,0,0],cell:[.7,0,0],nuclei:[-.85,.25,0],blastomeres:[.5,0,0],trophoblast:[-.65,0,0],inner:[.75,.1,0],epiblast:[0,.6,0],hypoblast:[0,-.5,0],amnion:[-.8,.4,0],ectoderm:[0,.7,0],mesoderm:[0,0,0],endoderm:[0,-.7,0],axis:[.9,.35,0]};
async function ensure(i){if(models[i])return models[i];if(loads.has(i))return loads.get(i);const promise=buildStage(i).then(m=>{models[i]=m;m.visible=false;root.add(m);return m});loads.set(i,promise);return promise;}
function pauseForInput(){if(state.playing)stopFilm();cameraGoal=null;}
function updateLayers(){
 const keys=stages[state.stage].parts;
 $('layerList').innerHTML=keys.map(k=>`<div class="layer"><span class="dot" style="background:${systems[k][1]}"></span><button data-part="${k}" aria-pressed="${state.selected===k}">${k==='skeleton'&&state.stage<10?'Cartilage & bone':systems[k][0]}</button><input type="checkbox" data-visible="${k}" aria-label="Show ${systems[k][0]}" ${state.hidden.has(k)?'':'checked'}></div>`).join('');
 $('partCount').textContent=`${keys.length} structures`;
 document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{pauseForInput();selectPart(b.dataset.part)});
 document.querySelectorAll('[data-visible]').forEach(c=>c.onchange=()=>{pauseForInput();c.checked?state.hidden.delete(c.dataset.visible):state.hidden.add(c.dataset.visible);if(state.selected===c.dataset.visible&&!c.checked){state.selected=null;state.isolate=false;updateSelection()}});
 updateSelection();
}
function updateSelection(){
 const k=state.selected;$('selection').hidden=!k;$('clearSelection').hidden=!k;
 if(k){$('selectionName').textContent=systems[k][0];$('selectionDesc').textContent=detail(k,state.stage);$('isolate').textContent=state.isolate?'Restore context':'Isolate structure';}
 document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.part===k));
 document.body.dataset.selected=k||'';document.body.dataset.isolated=String(state.isolate);
}
function selectPart(k){state.selected=k;state.isolate=false;state.hidden.delete(k);updateLayers();}
function frameDefault(){const distance=5.8+state.explode*1.7;cameraGoal={pos:new T.Vector3(distance*.40,.55,distance*.91),target:new T.Vector3(0,.12,0)};}
async function setStage(value,{manual=true}={}){
 const i=clamp(Math.round(Number(value)||0),0,stages.length-1);if(manual){pauseForInput();restoreCleavage();}
 const ticket=++requestId;state.stage=i;
 if(!stages[i].parts.includes(state.selected)){state.selected=null;state.isolate=false;}
 $('stageSlider').value=i;$('stageSelect').value=i;$('previous').disabled=i===0;$('next').disabled=i===stages.length-1;
 const s=stages[i];$('phase').textContent=`Human development · ${s.phase}`;$('stageName').textContent=s.name;$('stageNote').textContent=s.note;$('ageLabel').textContent=s.age;$('dating').textContent=s.pf?'After fertilization':'Pregnancy age';$('scaleText').textContent=s.scale;
 $('stageSlider').setAttribute('aria-valuetext',`${s.name}, ${s.age} ${s.pf?'after fertilization':'of pregnancy'}`);
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-current',+b.dataset.stage===i));
 updateLayers();document.body.dataset.stage=String(i);document.body.dataset.modelReady='false';
 models.forEach(m=>{if(m)m.visible=false});
 try{const m=await ensure(i);if(ticket!==requestId)return;m.visible=true;document.body.dataset.modelReady='true';document.body.dataset.visibleParts=Object.keys(m.userData.parts).join(',');if(manual){if(state.isolate)focusSelected();else frameDefault();}}
 catch(e){$('loadText').textContent=e.message;$('loading').hidden=false;throw e;}
}
function focusSelected(){const p=models[state.stage]?.userData.parts[state.selected];if(!p)return;const c=p.userData.center.clone().add(p.position);const d=Math.max(2.5,p.userData.size.length()*2.0);cameraGoal={pos:c.clone().add(new T.Vector3(d*.35,.2,d*.94)),target:c};}
$('stageSelect').innerHTML=stages.map((s,i)=>`<option value="${i}">${s.age} · ${s.name}</option>`).join('');
$('stageTicks').innerHTML=stages.map((s,i)=>`<button data-stage="${i}" aria-label="${s.name}, ${s.age}" title="${s.name} · ${s.pf?'after fertilization':'pregnancy age'}">${s.pf?'d'+s.pf:'w'+s.ga}</button>`).join('');
$('stageSlider').max=stages.length-1;
$('stageSlider').oninput=e=>setStage(e.target.value);$('stageSelect').onchange=e=>setStage(e.target.value);
$('previous').onclick=()=>setStage(state.stage-1);$('next').onclick=()=>setStage(state.stage+1);
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>setStage(b.dataset.stage));
$('explode').oninput=e=>{pauseForInput();state.explode=+e.target.value;$('explodeValue').textContent=Math.round(state.explode*100)+'%';state.isolate=false;updateSelection();frameDefault();};
$('isolate').onclick=()=>{pauseForInput();state.isolate=!state.isolate;updateSelection();state.isolate?focusSelected():frameDefault()};
$('clearSelection').onclick=()=>{pauseForInput();state.selected=null;state.isolate=false;updateSelection();frameDefault()};
function reset(){state.selected=null;state.isolate=false;state.explode=0;state.hidden=new Set(['support']);$('explode').value=0;$('explodeValue').textContent='0%';updateLayers();frameDefault();}
$('reset').onclick=()=>{pauseForInput();reset()};$('sourceBtn').onclick=()=>$('sources').showModal();$('closeSources').onclick=()=>$('sources').close();$('sources').onclick=e=>{if(e.target===$('sources'))$('sources').close()};
const ray=new T.Raycaster(),mouse=new T.Vector2();let down=[0,0];
canvas.addEventListener('pointerdown',e=>{pauseForInput();dragging=true;down=[e.clientX,e.clientY];pointerTarget.set(0,0)});
window.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const model=models[state.stage];if(!model)return;const meshes=[];model.traverse(o=>{if(o.isMesh&&o.visible&&o.material.opacity>.15)meshes.push(o)});const hit=ray.intersectObjects(meshes,false)[0];if(hit)selectPart(hit.object.userData.key);});
controls.addEventListener('start',()=>{cameraGoal=null;dragging=true});controls.addEventListener('end',()=>dragging=false);
window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce.matches||dragging||state.playing)return;pointerTarget.set((e.clientX/innerWidth-.5)*2,(e.clientY/innerHeight-.5)*2)});
document.documentElement.addEventListener('pointerleave',()=>pointerTarget.set(0,0));
function updateModel(dt){
 actualExplode=reduce.matches?state.explode:mix(actualExplode,state.explode,1-Math.exp(-dt*7));
 const m=models[state.stage];if(!m)return;
 const reveal=state.explode>.02||state.selected&&state.selected!=='body'||state.hidden.has('body');
 let guideIndex=0;guides.children.forEach(l=>l.visible=false);
 for(const [k,p] of Object.entries(m.userData.parts)){
  const d=directions[k]||[0,0,0];p.position.set(...d).multiplyScalar(actualExplode);
  const hidden=state.hidden.has(k);const isOuter=k==='body';
  let opacity=hidden?0:1;
  if(isOuter&&reveal)opacity*=state.isolate?.035:.075;
  else if(state.selected&&state.selected!==k)opacity*=state.isolate?.025:.45;
  if(!isOuter&&state.stage>=5&&k!=='support'&&k!=='yolk'&&!reveal)opacity=0;
  p.visible=opacity>.001;
  if(k!=='body'&&!hidden&&actualExplode>.05&&guideIndex<12){const line=guides.children[guideIndex++],a=p.userData.center,b=a.clone().add(p.position);line.visible=true;line.material.opacity=actualExplode*.24;const v=line.geometry.attributes.position;v.setXYZ(0,a.x,a.y,a.z);v.setXYZ(1,b.x,b.y,b.z);v.needsUpdate=true;line.geometry.computeBoundingSphere();}
  p.traverse(o=>{if(o.isMesh){o.material.opacity=opacity*o.userData.baseOpacity;o.material.depthWrite=o.material.opacity>.85;o.castShadow=o.material.opacity>.85;}});
 }
 document.body.dataset.explode=state.explode.toFixed(2);document.body.dataset.renderedExplode=actualExplode.toFixed(2);
}
function resize(){const rect=$('viewport').getBoundingClientRect();if(state.playing){renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);camera.aspect=16/9;}else{renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/rect.height;}camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);
const boundaries=[0,4,8,13,18,23,29,36,44,49,54,59,64,69,74,79,84];
const previousFrame=document.createElement('canvas');previousFrame.width=1920;previousFrame.height=1080;const previousCtx=previousFrame.getContext('2d');let transitionTime=-10;
function restoreCleavage(){const p=models[1]?.userData.parts.blastomeres;if(p)p.children.forEach((m,j)=>{m.visible=true;m.position.set((j&1?1:-1)*.32,(j&2?1:-1)*.32,(j&4?1:-1)*.32);m.scale.setScalar(.43);});}
function choreograph(time){
 let index=15;for(let j=0;j<16;j++){if(time<boundaries[j+1]){index=j;break}}
 if(state.stage!==index){previousCtx.clearRect(0,0,1920,1080);previousCtx.drawImage(canvas,0,0,1920,1080);transitionTime=time;setStage(index,{manual:false});}
 const t=(time-boundaries[index])/(boundaries[index+1]-boundaries[index]);
 state.selected=null;state.isolate=false;state.explode=0;
 if(index===1){const cells=models[1].userData.parts.blastomeres.children;const count=t<.3?2:t<.6?4:8;cells.forEach((m,j)=>{m.visible=j<count;const size=count===2?.60:count===4?.50:.43;const progress=ease(0,.13,t%(count===8?1:.3));m.scale.setScalar(size);m.position.set((j&1?1:-1)*(count===8?.32:.38),count===2?0:(j&2?1:-1)*.32,count===8?(j&4?1:-1)*.32:0);});}
 if(index===3||index===4)state.explode=.65*ease(.1,.45,t)*(1-ease(.72,1,t));
 if(index>=5&&index<=7){state.explode=.9*ease(.15,.45,t)*(1-ease(.82,1,t));if(t>.4&&t<.8)state.selected='heart';}
 if(index===10||index===12)state.explode=.82*ease(.1,.4,t)*(1-ease(.73,1,t));
 if(index===12&&t>.35&&t<.8)state.selected='neural';
 const angle=.3+Math.sin(time*.10)*.22,distance=(index<5?6.3:6.9)+state.explode*2.0;
 const target=new T.Vector3(0,index<5?0:.13,0);
 camera.position.set(Math.sin(angle)*distance,.35,target.z+Math.cos(angle)*distance);camera.lookAt(target);camera.updateMatrixWorld();
 root.rotation.set(index===3||index===4?.30:0,0,0);
}
function text(str,x,y,size,color='#647369',align='left'){ctx.font=`${size}px -apple-system, BlinkMacSystemFont, Arial`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y)}
function filmOverlay(){const s=stages[state.stage];ctx.fillStyle='#fff';ctx.fillRect(0,0,1920,1080);const blend=ease(0,.65,state.time-transitionTime);if(blend<1){ctx.globalAlpha=1-blend;ctx.drawImage(previousFrame,0,0);ctx.globalAlpha=blend;}ctx.drawImage(canvas,0,0,1920,1080);ctx.globalAlpha=1;
 text(s.age,100,113,36,'#4a5f51');text(s.pf?'after fertilization':'of pregnancy',100,143,15,'#a0aaa1');text(s.name,100,195,22,'#819084');
 if(state.selected)text(systems[state.selected][0],100,242,18,'#8d9c90');
 text(s.scale,100,980,15,'#99a497');text('Illustrative human anatomy · independently framed',1820,1015,13,'#a7afa5','right');
 const x0=710,x1=1210,y=1008;ctx.strokeStyle='#e1e6df';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();stages.forEach((_,j)=>{ctx.fillStyle=j===state.stage?'#718a76':'#d9e1d6';ctx.beginPath();ctx.arc(mix(x0,x1,j/15),y,j===state.stage?4:2,0,Math.PI*2);ctx.fill()});
}
async function startFilm(capture=false){
 $('loadText').textContent='Preparing the complete journey';$('loading').hidden=false;
 try{for(let i=0;i<16;i++)await ensure(i);}catch(e){$('loadText').textContent=e.message;return}
 $('loading').hidden=true;reset();cameraGoal=null;state.playing=true;state.paused=false;state.time=0;transitionTime=-10;filmStart=performance.now();recording=capture;actualExplode=0;controls.enabled=false;pointerTarget.set(0,0);pointerActual.set(0,0);document.body.classList.add('filmMode');film.hidden=false;$('filmControls').hidden=false;$('pauseFilm').textContent='Pause';$('filmStatus').textContent=capture?'Recording 1080p':'';$('filmSeek').disabled=capture;$('pauseFilm').disabled=capture;resize();await setStage(0,{manual:false});
 if(capture){
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));chunks=[];
  recorder=new MediaRecorder(film.captureStream(30),{mimeType:mime,videoBitsPerSecond:14000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onstop=async()=>{const blob=new Blob(chunks,{type:mime});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='embryo-explorer-prenatal.webm';link.textContent='Download recording';link.className='download';link.style='position:fixed;top:72px;right:32px;z-index:50;padding:12px;background:#eef3eb;border-radius:6px;font-size:12px';document.querySelector('.download')?.remove();document.body.append(link);document.body.dataset.exportStatus='download';if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){try{const r=await fetch('/capture',{method:'POST',body:blob,headers:{'Content-Type':mime}});document.body.dataset.exportStatus=r.ok?'saved':'download';}catch{}}};recorder.start(1000);
 }
 document.body.dataset.playing='true';
}
function stopFilm(){if(!state.playing)return;restoreCleavage();state.playing=false;state.paused=false;if(recorder?.state==='recording')recorder.stop();recording=false;controls.enabled=true;document.body.classList.remove('filmMode');film.hidden=true;$('filmControls').hidden=true;root.rotation.set(0,0,0);state.selected=null;state.explode=0;actualExplode=0;state.isolate=false;$('explode').value=0;$('explodeValue').textContent='0%';updateLayers();frameDefault();resize();document.body.dataset.playing='false';}
$('play').onclick=()=>startFilm();$('record').onclick=()=>{if(!window.MediaRecorder){$('record').textContent='Export unavailable';return}startFilm(true)};
$('stopFilm').onclick=stopFilm;$('pauseFilm').onclick=()=>{state.paused=!state.paused;$('pauseFilm').textContent=state.paused?'Resume':'Pause';filmStart=performance.now()-state.time*1000};
$('filmSeek').oninput=e=>{state.time=+e.target.value;state.paused=true;$('pauseFilm').textContent='Resume';filmStart=performance.now()-state.time*1000};
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.playing)stopFilm()});
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.06,(now-lastTime)/1000);lastTime=now;
 if(state.playing){if(!state.paused)state.time=Math.min(84,(now-filmStart)/1000);choreograph(state.time);$('filmSeek').value=state.time;$('filmTime').textContent=`${Math.floor(state.time/60)}:${String(Math.floor(state.time%60)).padStart(2,'0')}`;}
 else{if(cameraGoal){const alpha=reduce.matches?1:1-Math.exp(-dt*5);camera.position.lerp(cameraGoal.pos,alpha);controls.target.lerp(cameraGoal.target,alpha);if(camera.position.distanceTo(cameraGoal.pos)<.003)cameraGoal=null;}controls.update();pointerActual.lerp(reduce.matches?new T.Vector2():pointerTarget,1-Math.exp(-dt*3));root.rotation.set(pointerActual.y*.016,pointerActual.x*.025,0);key.position.x=3+pointerActual.x*.35;document.documentElement.style.setProperty('--px',pointerActual.x*18+'px');document.documentElement.style.setProperty('--py',pointerActual.y*12+'px');}
 updateModel(dt);renderer.render(scene,camera);if(state.playing){filmOverlay();if(state.time>=84)stopFilm();}
}
const params=new URLSearchParams(location.search);const initial=params.has('stage')?clamp(Number(params.get('stage')),0,15):8;
await setStage(initial,{manual:false});if(params.get('view')==='separated'){state.explode=1;$('explode').value=1;$('explodeValue').textContent='100%'}
$('loading').hidden=true;frameDefault();resize();requestAnimationFrame(animate);document.body.dataset.ready='true';
// Preload sequentially to keep initial rendering responsive and rapid scrubbing safe.
(async()=>{for(let i=0;i<16;i++){await new Promise(r=>setTimeout(r,80));await ensure(i)}})().catch(e=>console.error('Stage preload:',e));
