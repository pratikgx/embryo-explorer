import * as T from 'three';
import {buildStage} from './models.js?v=info4';
import {stages,systems,detail,ageBasis} from './stages.js?v=info4';
import {planLayout} from './layout.js?v=canvas3';
import {directions} from './home-directions.js?v=allzoom4';
const $=id=>document.getElementById(id),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)},mix=T.MathUtils.lerp;
const grid=$('stageBoard'),canvas=$('homeScene'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x99968b,1.75));const light=new T.DirectionalLight(0xfff5ed,3.3);light.position.set(3,6,7);scene.add(light);const rim=new T.DirectionalLight(0xe4edf1,1.8);rim.position.set(-4,2,-4);scene.add(rim);const fill=new T.DirectionalLight(0xfff9f1,.45);fill.position.set(-3,0,3);scene.add(fill);
const records=[],identity=new T.Quaternion(),ray=new T.Raycaster();let progress=0,target=0,dirty=true,last=0,sliding=false,selected=null,hover=null,loaded=0,boxes=[],canvasRect=null,resetting=false,lastWheel=0,wheelSum=0;
grid.innerHTML=stages.map((s,i)=>`<article class="stage-card" data-card="${i}"><button class="stage-preview" data-open="${i}" aria-label="Explore ${s.age}: ${s.name}"><span class="stage-age">${s.age}</span><span class="stage-title">${s.name}</span></button><div class="home-parts" aria-label="${s.age} structures"></div></article>`).join('');
function status(text){$('boardStatus').textContent=text;}
function request(value){target=clamp(Number(value)||0,0,100);dirty=true;}
function link(){if(!selected)return;const p=progress<=50?progress*.8:40+(progress-50)*.7;$('enterStage').href=`./explore.html?stage=${selected.i}&progress=${Math.round(p)}${selected.key?'&part='+encodeURIComponent(selected.key):''}`;}
function info(i,key=null){selected={i,key};$('homeInfo').hidden=false;document.body.dataset.homeInfo='true';$('homeInfoAge').textContent=stages[i].age+' · '+ageBasis(stages[i]);$('homeInfoName').textContent=key?systems[key][0]:stages[i].name;$('homeInfoDescription').textContent=key?detail(key,i):stages[i].note;grid.querySelectorAll('.stage-card').forEach(c=>c.dataset.active=String(+c.dataset.card===i));link();$('homeInfoName').focus({preventScroll:true});dirty=true;}
function closeInfo(){const previous=selected;selected=null;$('homeInfo').hidden=true;document.body.dataset.homeInfo='false';grid.querySelectorAll('.stage-card').forEach(c=>c.dataset.active='false');if(previous)grid.querySelector(`[data-open="${previous.i}"]`).focus({preventScroll:true});dirty=true;}
$('closeHomeInfo').onclick=closeInfo;window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('sources').open&&selected)closeInfo();});
function pick(i,x,y){const record=records[i],r=boxes[i];if(!record||!r||x<r.left||x>r.right||y<r.top||y>r.bottom)return null;ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),record.camera);const objects=[];for(const p of Object.values(record.model.userData.parts))if(p.visible)p.traverse(o=>{if(o.isMesh&&o.visible&&o.material.opacity>.2)objects.push(o)});return ray.intersectObjects(objects,false)[0]?.object.userData.key||null;}
function name(i,key){return stages[i].age+' · '+(key?systems[key][0]:stages[i].name);}
grid.querySelectorAll('[data-open]').forEach(b=>{
 const i=+b.dataset.open;let down=null,suppress=false;
 b.onpointerdown=e=>{if(e.button!==0)return;suppress=false;resetting=false;down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY};b.setPointerCapture(e.pointerId);};
 b.onpointermove=e=>{if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)suppress=true;if(suppress&&records[i]){records[i].yaw-=(e.clientX-down.lastX)*.012;records[i].pitch=clamp(records[i].pitch+(e.clientY-down.lastY)*.01,-1.05,1.05);dirty=true;}down.lastX=e.clientX;down.lastY=e.clientY;return;}const key=pick(i,e.clientX,e.clientY);if(hover?.i!==i||hover?.key!==key){hover={i,key};status(name(i,key));dirty=true;}};
 b.onpointerup=b.onpointercancel=e=>{down=null;if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);};
 b.onclick=e=>{if(e.detail===0){suppress=false;info(i);return;}if(suppress){suppress=false;return;}info(i,pick(i,e.clientX,e.clientY));};
 b.onfocus=()=>status(name(i,null));b.onpointerleave=()=>{if(!down){hover=null;status('Scroll to explore all stages · Drag to turn · Click for details');dirty=true;}};
});
$('homeSlider').oninput=e=>request(e.target.value);$('homeSlider').onpointerdown=()=>sliding=true;window.addEventListener('pointerup',()=>sliding=false);window.addEventListener('pointercancel',()=>sliding=false);
window.addEventListener('pointermove',e=>{if(reduce.matches||e.pointerType==='touch'||e.buttons)return;document.documentElement.style.setProperty('--px',(e.clientX/innerWidth-.5)*12+'px');document.documentElement.style.setProperty('--py',(e.clientY/innerHeight-.5)*8+'px');});
$('home').addEventListener('wheel',e=>{if($('sources').open)return;e.preventDefault();const f=Math.floor(performance.now()/16);if(f!==lastWheel){lastWheel=f;wheelSum=0;}const delta=clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1)*.055,-4,4),allowed=Math.sign(delta)*Math.min(Math.abs(delta),4-Math.abs(wheelSum));wheelSum+=allowed;request(target+allowed);},{passive:false});
$('reset').onclick=()=>{if(selected)closeInfo();resetting=true;hover=null;request(0);};
$('sourceBtn').onclick=()=>$('sources').showModal();$('closeSources').onclick=()=>$('sources').close();$('sources').onclick=e=>{if(e.target===$('sources'))e.target.close();};
function resize(){canvasRect=canvas.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(Math.max(1,canvasRect.width),Math.max(1,canvasRect.height),false);boxes=[...grid.querySelectorAll('.stage-card')].map(c=>{const r=c.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom-27,width:r.width,height:Math.max(1,r.height-27)};});const columns=grid.clientWidth<800?3:5;records.forEach(r=>{if(r){r.layout=planLayout(r.model.userData.parts,stages[r.i].parts,1.4,Math.min(columns,stages[r.i].parts.length));}});dirty=true;}
new ResizeObserver(resize).observe(grid);
function localCorners(part){const {center,size}=part.userData,result=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])result.push(center.clone().add(new T.Vector3(x*size.x,y*size.y,z*size.z).multiplyScalar(.5)));return result;}
function render(){if(!canvasRect||!boxes.length)return;renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);let framed=true;
 const exp=ease(6,50,progress),tray=ease(50,100,progress),reveal=ease(2,35,progress);
 for(const record of records){if(!record)continue;const {i,model,camera,layout}=record,r=boxes[i];if(!r)continue;const points=[];
 for(const [key,p] of Object.entries(model.userData.parts)){
 const entry=layout.entries[key];p.position.set(...(directions[key]||[0,0,0])).multiplyScalar(exp).lerp(entry.position,tray);p.scale.setScalar(mix(1,entry.scale,tray));p.quaternion.copy(identity).slerp(entry.rotation,tray);
 let opacity=1;if(i>=5){if(key==='body')opacity=mix(1,.09,reveal)*(1-tray)+tray;else if(!['support','yolk'].includes(key))opacity=reveal;}
 p.visible=opacity>.001;const lit=(selected?.i===i&&selected.key===key)||(hover?.i===i&&hover.key===key);
 p.traverse(o=>{if(o.isMesh){o.material.opacity=opacity*o.userData.baseOpacity;o.material.depthWrite=o.material.opacity>.85;o.material.emissive.set(lit?'#8b9e72':'#000000');o.material.emissiveIntensity=lit?.15:0;}});
 for(const corner of record.corners[key])points.push(corner.clone().multiply(p.scale).applyQuaternion(p.quaternion).add(p.position));
 }
 const yaw=.644*(1-tray)+record.yaw,pitch=.06+record.pitch,direction=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),bounds=new T.Box3().setFromPoints(points),center=bounds.getCenter(new T.Vector3()),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),tan=Math.tan(T.MathUtils.degToRad(33/2));camera.aspect=r.width/r.height;camera.updateProjectionMatrix();let distance=.1;
 for(const v of points){const d=v.clone().sub(center);distance=Math.max(distance,Math.abs(d.dot(up))/tan+d.dot(direction),Math.abs(d.dot(right))/(tan*camera.aspect)+d.dot(direction));}
 camera.position.copy(center).addScaledVector(direction,distance*1.06);camera.lookAt(center);camera.updateMatrixWorld();model.visible=true;model.updateMatrixWorld(true);
 const x=r.left-canvasRect.left,y=canvasRect.height-(r.bottom-canvasRect.top);renderer.setViewport(x,y,r.width,r.height);renderer.setScissor(x,y,r.width,r.height);renderer.render(scene,camera);model.visible=false;
 if(!points.every(v=>{const q=v.clone().project(camera);return Math.abs(q.x)<1&&Math.abs(q.y)<1}))framed=false;
 const layer=grid.querySelector(`[data-card="${i}"] .home-parts`);layer.hidden=progress<94;
 if(progress>=94)for(const b of layer.children){const entry=layout.entries[b.dataset.key],q=entry.slot.clone().project(camera);b.style.left=(q.x*.5+.5)*r.width+'px';b.style.top=(.5-q.y*.5)*r.height+'px';b.style.width=Math.min(r.width/layout.columns*.8,42)+'px';b.style.height=Math.min(r.height/layout.rows*.8,42)+'px';b.dataset.selected=String(selected?.i===i&&selected.key===b.dataset.key);}
 }
 renderer.setScissorTest(false);document.body.dataset.framed=String(framed);document.body.dataset.homeProgress=progress.toFixed(2);document.body.dataset.homeMode=progress<.1?'assembled':progress>99.9?'parts':Math.abs(progress-50)<.1?'separate':'transition';
}
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.05,(now-(last||now))/1000);last=now;if(Math.abs(progress-target)>.02){progress+=clamp((target-progress)*(1-Math.exp(-dt*6)),-dt*65,dt*65);dirty=true;}else if(progress!==target){progress=target;dirty=true;}if(resetting){let rest=true;for(const r of records){if(!r)continue;r.yaw=mix(r.yaw,0,1-Math.exp(-dt*8));r.pitch=mix(r.pitch,0,1-Math.exp(-dt*8));if(Math.abs(r.yaw)+Math.abs(r.pitch)>.001)rest=false;else r.yaw=r.pitch=0;}resetting=!rest;dirty=true;}if(!sliding)$('homeSlider').value=progress;$('homeSlider').style.setProperty('--progress',progress+'%');$('homeValue').textContent=Math.round(progress)+'%';$('homePhase').textContent=progress<.1?'Assembled':progress<49.9?'Separating':progress<50.1?'Separate':progress<99.9?'Arranging parts':'All parts';$('homeSlider').setAttribute('aria-valuetext',`${Math.round(progress)} percent, ${$('homePhase').textContent}, all sixteen stages`);if(selected)link();if(dirty){render();dirty=false;}}
resize();requestAnimationFrame(tick);
for(let i=0;i<stages.length;i++){
 try{const model=await buildStage(i);model.visible=false;scene.add(model);const columns=grid.clientWidth<800?3:5;records[i]={i,model,camera:new T.PerspectiveCamera(33,1,.01,100),layout:planLayout(model.userData.parts,stages[i].parts,1.4,Math.min(columns,stages[i].parts.length)),corners:Object.fromEntries(Object.entries(model.userData.parts).map(([k,p])=>[k,localCorners(p)])),yaw:0,pitch:0};
 const layer=grid.querySelector(`[data-card="${i}"] .home-parts`);layer.innerHTML=stages[i].parts.map(k=>`<button data-key="${k}" aria-label="${stages[i].age}: ${systems[k][0]}" title="${systems[k][0]}"></button>`).join('');for(const b of layer.children){b.onclick=()=>info(i,b.dataset.key);b.onpointerenter=b.onfocus=()=>{hover={i,key:b.dataset.key};status(name(i,b.dataset.key));dirty=true;};b.onpointerleave=b.onblur=()=>{hover=null;dirty=true;};}
 loaded++;document.body.dataset.loadedStages=loaded;dirty=true;status('Preparing stages · '+loaded+' / 16');await new Promise(resolve=>requestAnimationFrame(resolve));
 }catch(e){status('A stage could not load. Reload to try again.');console.error(e);}
}
document.body.dataset.boardReady=String(loaded===16);status('Scroll to explore all stages · Drag to turn · Click for details');
