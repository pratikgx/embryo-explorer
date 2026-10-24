import * as T from 'three';
import {stages,systems} from './stages.js';
import {planLayout} from './layout.js';
// One offscreen renderer generates all cards from the actual stage meshes.
// The selected stage retains a separate, fully interactive 3D viewport.
export function createBoard({ensure,directions,openStage}){
 const grid=document.getElementById('stageBoard'),status=document.getElementById('boardStatus');
 grid.innerHTML=stages.map((s,i)=>`<article class="stage-card" data-card="${i}"><button class="stage-preview" data-open="${i}" aria-label="Explore ${s.age}: ${s.name}" aria-expanded="false"><span class="stage-age">${s.age}<small>${s.pf?'after fertilization':'of pregnancy'}</small></span><img alt="${s.name}, original 3D illustration" draggable="false"><span class="stage-title">${s.name}<span aria-hidden="true">↗</span></span></button><p class="card-note">${s.note}</p><div class="card-parts" aria-label="${s.age} structures"></div></article>`).join('');
 grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openStage(+b.dataset.open));
 function placeTargets(){
  grid.querySelectorAll('.stage-card').forEach(card=>{const img=card.querySelector('img'),layer=card.querySelector('.card-parts'),a=img.getBoundingClientRect(),b=card.getBoundingClientRect(),scale=Math.min(a.width/440,a.height/280);Object.assign(layer.style,{left:(a.left-b.left+(a.width-440*scale)/2)+'px',top:(a.top-b.top+(a.height-280*scale)/2)+'px',width:440*scale+'px',height:280*scale+'px',right:'auto',bottom:'auto'});});
 }
 new ResizeObserver(placeTargets).observe(grid);
 const r=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(440,280);r.setClearColor(0xffffff,0);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.02;
 const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x99968b,1.75));const key=new T.DirectionalLight(0xfff5ed,3.3);key.position.set(3,6,7);scene.add(key);const rim=new T.DirectionalLight(0xe4edf1,1.8);rim.position.set(-4,2,-4);scene.add(rim);const fill=new T.DirectionalLight(0xfff9f1,.45);fill.position.set(-3,0,3);scene.add(fill);
 const camera=new T.PerspectiveCamera(33,440/280,.01,100),cache=new Map();let ticket=0,mode='assembled';
 async function preview(i,view){
  const cacheKey=`${i}:${view}`;if(cache.has(cacheKey))return cache.get(cacheKey);
  const original=await ensure(i),group=new T.Group(),parts={};
  for(const [key,source] of Object.entries(original.userData.parts)){
   const p=new T.Group();p.userData={center:source.userData.center,size:source.userData.size};parts[key]=p;group.add(p);
   for(const object of source.children){const c=object.clone(false);if(c.isMesh){c.material=object.material.clone();c.material.emissive.set(0);c.material.emissiveIntensity=0;c.material.opacity=object.userData.baseOpacity;c.material.depthWrite=c.material.opacity>.85;c.visible=true;}p.add(c);}
   if(view==='assembled'&&i>=5&&!['body','support','yolk'].includes(key))p.visible=false;
   if(view==='separated'){
    p.position.set(...(directions[key]||[0,0,0]));if(key==='body')p.children.forEach(o=>{o.material.opacity=.13;o.material.depthWrite=false;});
   }
  }
  const layout=view==='parts'?planLayout(parts,stages[i].parts,440/280):null;
  if(layout)for(const [k,p] of Object.entries(parts)){const e=layout.entries[k];p.position.copy(e.position);p.scale.setScalar(e.scale);p.quaternion.copy(e.rotation);}
  scene.add(group);group.updateMatrixWorld(true);
  const bounds=new T.Box3();Object.values(parts).forEach(p=>{if(p.visible)bounds.union(new T.Box3().setFromObject(p));});
  const center=bounds.getCenter(new T.Vector3()),direction=(view==='parts'?new T.Vector3(0,.01,1):new T.Vector3(.60,.06,.80)).normalize();
  const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right);
  const tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const d=new T.Vector3(x,y,z).sub(center);distance=Math.max(distance,Math.abs(d.dot(up))/tan+d.dot(direction),Math.abs(d.dot(right))/(tan*camera.aspect)+d.dot(direction));}
  camera.position.copy(center).addScaledVector(direction,distance*1.08);camera.lookAt(center);camera.updateMatrixWorld();r.render(scene,camera);
  const hits=[];if(layout)for(const [k,e] of Object.entries(layout.entries)){const point=e.slot.clone().project(camera);hits.push({key:k,x:(point.x*.5+.5)*100,y:(-.5*point.y+.5)*100});}
  const result={src:r.domElement.toDataURL('image/webp',.92),hits};cache.set(cacheKey,result);
  scene.remove(group);group.traverse(o=>{if(o.isMesh)o.material.dispose();});return result;
 }
 async function setMode(view){
  mode=view;const id=++ticket;grid.dataset.mode=view;status.textContent='Preparing stage views…';document.body.dataset.boardReady='false';
  for(let i=0;i<stages.length;i++){
   const data=await preview(i,view);if(id!==ticket)return;
   const card=grid.querySelector(`[data-card="${i}"]`);card.querySelector('img').src=data.src;card.querySelector('img').onload=placeTargets;card.dataset.mode=view;
   const hitLayer=card.querySelector('.card-parts');hitLayer.innerHTML=data.hits.map(h=>`<button class="card-part" data-key="${h.key}" style="left:${h.x}%;top:${h.y}%" aria-label="${stages[i].age}: inspect ${systems[h.key][0]}" title="${systems[h.key][0]}"></button>`).join('');
   hitLayer.querySelectorAll('button').forEach(b=>b.onclick=()=>openStage(i,b.dataset.key));
   await new Promise(resolve=>requestAnimationFrame(resolve));
  }
  status.textContent=view==='parts'?'Parts enlarged independently · choose a structure to inspect':'Views framed independently · choose a stage to explore';document.body.dataset.boardReady='true';document.body.dataset.boardMode=mode;
 }
 function select(i,open=true){grid.querySelectorAll('[data-card]').forEach(c=>{c.dataset.active=String(open&&+c.dataset.card===i);c.querySelector('[data-open]').setAttribute('aria-expanded',String(open&&+c.dataset.card===i));});}
 return {setMode,select,focus:i=>grid.querySelector(`[data-open="${i}"]`)?.focus()};
}
