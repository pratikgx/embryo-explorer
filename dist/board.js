import * as T from 'three';
import {stages,systems,ageBasis} from './stages.js?v=info4';
import {planLayout} from './layout.js?v=info4';
// Shared renderer; stage meshes can be turned directly in the overview.
// The selected stage retains a separate, fully interactive 3D viewport.
export function createBoard({ensure,directions,openStage}){
 const grid=document.getElementById('stageBoard'),status=document.getElementById('boardStatus');
 grid.innerHTML=stages.map((s,i)=>`<article class="stage-card" data-card="${i}"><button class="stage-preview" data-open="${i}" aria-label="Explore ${s.age}: ${s.name}" aria-expanded="false" aria-controls="infoPanel"><span class="stage-age">${s.age}<small>${ageBasis(s)}</small></span><img alt="${s.name}, original 3D illustration" draggable="false"><span class="stage-title">${s.name}<span aria-hidden="true">↗</span></span></button><p class="card-note">${s.note}</p><div class="card-parts" aria-label="${s.age} structures"></div></article>`).join('');
 grid.querySelectorAll('[data-open]').forEach(b=>{
  const i=+b.dataset.open;let drag=null,suppress=false,pending=null,busy=false;
  b.onclick=e=>{if(e.detail===0){suppress=false;openStage(i);return;}if(suppress){suppress=false;e.preventDefault();return;}openStage(i,pick(i,e));};
  b.onpointerenter=b.onfocus=()=>{status.textContent=stages[i].age+' · '+stages[i].name;};
  b.onpointerleave=b.onblur=()=>{if(!drag)status.textContent=mode==='parts'?'Hover to identify · Click a part for information':'Drag a stage to turn · Click for information';};
  b.onpointerdown=e=>{if(e.button!==0||mode==='parts')return;suppress=false;const angle=angles.get(`${i}:${mode}`)||{yaw:.644,pitch:.06};drag={x:e.clientX,y:e.clientY,...angle};b.setPointerCapture(e.pointerId);};
  const draw=async()=>{if(busy||!pending)return;busy=true;const value=pending;pending=null;const currentMode=mode;try{const data=await preview(i,currentMode,value);if(mode===currentMode){b.querySelector('img').src=data.src;cache.delete(`${i}:${mode}:${grid.clientWidth<800}`);}}finally{busy=false;if(pending)requestAnimationFrame(draw);}};
  b.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<5&&!suppress)return;suppress=true;const value={yaw:drag.yaw-dx*.012,pitch:Math.max(-1.1,Math.min(1.1,drag.pitch+dy*.009))};angles.set(`${i}:${mode}`,value);b.dataset.turning='true';pending=value;requestAnimationFrame(draw);};
  b.onpointerup=b.onpointercancel=e=>{drag=null;delete b.dataset.turning;if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);};
 });
 function placeTargets(){
  grid.querySelectorAll('.stage-card').forEach(card=>{const img=card.querySelector('img'),layer=card.querySelector('.card-parts'),a=img.getBoundingClientRect(),b=card.getBoundingClientRect(),width=img.naturalWidth||560,height=img.naturalHeight||420,scale=Math.min(a.width/width,a.height/height);Object.assign(layer.style,{left:(a.left-b.left+(a.width-width*scale)/2)+'px',top:(a.top-b.top+(a.height-height*scale)/2)+'px',width:width*scale+'px',height:height*scale+'px',right:'auto',bottom:'auto'});});
 }
 let lastCompact=grid.clientWidth<800;new ResizeObserver(()=>{placeTargets();const compact=grid.clientWidth<800;if(compact!==lastCompact){lastCompact=compact;setMode(mode).catch(console.error);}}).observe(grid);
 const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(560,420);r.setClearColor(0xffffff,0);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.02;
 const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x99968b,1.75));const key=new T.DirectionalLight(0xfff5ed,3.3);key.position.set(3,6,7);scene.add(key);const rim=new T.DirectionalLight(0xe4edf1,1.8);rim.position.set(-4,2,-4);scene.add(rim);const fill=new T.DirectionalLight(0xfff9f1,.45);fill.position.set(-3,0,3);scene.add(fill);
 const camera=new T.PerspectiveCamera(33,560/420,.01,100),cache=new Map(),geometryCache=new Map(),angles=new Map();let ticket=0,mode='assembled';
 async function preview(i,view,rotation=null){
  const compact=grid.clientWidth<800,cacheKey=`${i}:${view}:${compact}`;if(!rotation&&cache.has(cacheKey))return cache.get(cacheKey);
  let geometry=geometryCache.get(cacheKey);
  if(!geometry){
  const original=await ensure(i),group=new T.Group(),parts={};
  for(const [key,source] of Object.entries(original.userData.parts)){
   const p=new T.Group();p.userData={center:source.userData.center,size:source.userData.size};parts[key]=p;group.add(p);
   for(const object of source.children){const c=object.clone(false);if(c.isMesh){c.material=object.material.clone();c.material.emissive.set(0);c.material.emissiveIntensity=0;c.material.opacity=object.userData.baseOpacity;c.material.depthWrite=c.material.opacity>.85;c.visible=true;}p.add(c);}
   if(view==='assembled'&&i>=5&&!['body','support','yolk'].includes(key))p.visible=false;
   if(view==='separated'){
    p.position.set(...(directions[key]||[0,0,0]));if(key==='body')p.children.forEach(o=>{o.material.opacity=.13;o.material.depthWrite=false;});
   }
  }
  const layout=view==='parts'?planLayout(parts,stages[i].parts,2.4,Math.min(compact?3:5,stages[i].parts.length)):null;
  if(layout)for(const [k,p] of Object.entries(parts)){const e=layout.entries[k];p.position.copy(e.position);p.scale.setScalar(e.scale);p.quaternion.copy(e.rotation);}
  group.updateMatrixWorld(true);
  const bounds=new T.Box3();Object.values(parts).forEach(p=>{if(p.visible)bounds.union(new T.Box3().setFromObject(p));});
  geometry={group,parts,layout,bounds};geometryCache.set(cacheKey,geometry);
  }
  const {group,parts,layout,bounds}=geometry;r.setSize(view==='parts'&&!compact?840:560,view==='parts'&&!compact?350:420);camera.aspect=view==='parts'&&!compact?2.4:560/420;camera.updateProjectionMatrix();scene.add(group);group.updateMatrixWorld(true);
  const center=bounds.getCenter(new T.Vector3()),angle=rotation||angles.get(`${i}:${view}`)||{yaw:view==='parts'?0:.644,pitch:view==='parts'?.01:.06},direction=new T.Vector3(Math.sin(angle.yaw)*Math.cos(angle.pitch),Math.sin(angle.pitch),Math.cos(angle.yaw)*Math.cos(angle.pitch));
  const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right);
  const tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const d=new T.Vector3(x,y,z).sub(center);distance=Math.max(distance,Math.abs(d.dot(up))/tan+d.dot(direction),Math.abs(d.dot(right))/(tan*camera.aspect)+d.dot(direction));}
  camera.position.copy(center).addScaledVector(direction,distance*1.02);camera.lookAt(center);camera.updateMatrixWorld();geometry.camera=camera.clone();r.render(scene,camera);
  const hits=[];if(layout)for(const [k,e] of Object.entries(layout.entries)){const point=e.slot.clone().project(camera);const edge=e.slot.clone().add(new T.Vector3(.9,.84,0)).project(camera);hits.push({key:k,x:(point.x*.5+.5)*100,y:(-.5*point.y+.5)*100,w:Math.abs(edge.x-point.x)*100,h:Math.abs(edge.y-point.y)*100});}
  const result={src:r.domElement.toDataURL('image/webp',.94),hits};if(!rotation)cache.set(cacheKey,result);
  scene.remove(group);return result;
 }
 function pick(i,event){
  const geometry=geometryCache.get(`${i}:${mode}:${grid.clientWidth<800}`);if(!geometry?.camera||!event.clientX)return null;
  const img=grid.querySelector(`[data-card="${i}"] img`),rect=img.getBoundingClientRect(),scale=Math.min(rect.width/img.naturalWidth,rect.height/img.naturalHeight),width=img.naturalWidth*scale,height=img.naturalHeight*scale;
  const x=(event.clientX-rect.left-(rect.width-width)/2)/width,y=(event.clientY-rect.top-(rect.height-height)/2)/height;
  if(x<0||x>1||y<0||y>1)return null;
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x*2-1,1-y*2),geometry.camera);
  const meshes=[];for(const [key,p] of Object.entries(geometry.parts))if(p.visible)p.traverse(o=>{if(o.isMesh&&o.visible&&o.material.opacity>.2){o.userData.boardKey=key;meshes.push(o);}});
  const hit=ray.intersectObjects(meshes,false)[0];const key=hit?.object.userData.boardKey;
  return key==='body'?null:key||null;
 }
 async function setMode(view){
  mode=view;const id=++ticket;grid.dataset.mode=view;status.textContent='Preparing stage views…';document.body.dataset.boardReady='false';
  for(let i=0;i<stages.length;i++){
   const data=await preview(i,view);if(id!==ticket)return;
   const card=grid.querySelector(`[data-card="${i}"]`);card.querySelector('img').src=data.src;card.querySelector('img').onload=placeTargets;card.dataset.mode=view;
   const hitLayer=card.querySelector('.card-parts');hitLayer.innerHTML=data.hits.map(h=>`<button class="card-part" data-key="${h.key}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%" aria-label="${stages[i].age}: inspect ${systems[h.key][0]}" title="${systems[h.key][0]}"></button>`).join('');
   hitLayer.querySelectorAll('button').forEach(b=>{
    b.onclick=()=>openStage(i,b.dataset.key);
    b.onpointerenter=b.onfocus=()=>{status.textContent=stages[i].age+' · '+systems[b.dataset.key][0];b.closest('.stage-card').dataset.hoverPart=systems[b.dataset.key][0];};
    b.onpointerleave=b.onblur=()=>{delete b.closest('.stage-card').dataset.hoverPart;status.textContent='Hover to identify · Click a part for information';};
   });
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  status.textContent=view==='parts'?'Hover to identify · Click a part for information':'Drag a stage to turn · Click for information';document.body.dataset.boardReady='true';document.body.dataset.boardMode=mode;
 }
 function select(i,open=true,part=null){grid.querySelectorAll('[data-card]').forEach(c=>{c.dataset.active=String(open&&+c.dataset.card===i);c.querySelector('[data-open]').setAttribute('aria-expanded',String(open&&+c.dataset.card===i));c.querySelectorAll('.card-part').forEach(b=>b.dataset.selected=String(open&&+c.dataset.card===i&&b.dataset.key===part));});}
 return {setMode,select,reset:()=>{angles.clear();cache.clear();return setMode('assembled');},focus:i=>grid.querySelector(`[data-open="${i}"]`)?.focus()};
}
