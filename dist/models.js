import * as T from 'three';
import {stages,systems} from './stages.js';
const V=p=>new T.Vector3(...p), mix=(a,b,t)=>a+(b-a)*t;
const sphere=new T.SphereGeometry(1,40,28);
function material(color){return new T.MeshPhysicalMaterial({color,roughness:.60,metalness:0,clearcoat:.04,clearcoatRoughness:.6,transparent:true,side:T.DoubleSide});}
function add(part,geo,color,position=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,material(color||part.userData.color));m.position.set(...position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;part.add(m);return m;}
function ell(p,c,r,col){return add(p,sphere,col,c,r)}
function tube(p,points,r=.04,col){return add(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),Math.max(12,points.length*7),r,8,false),col)}
function curve(p,points,r=.012,col){return tube(p,points,r,col)}
function shell(p,radius,scale,center=[0,0,0],opacity=.3){let m=add(p,new T.SphereGeometry(radius,48,32,Math.PI*.05,Math.PI*1.7),null,center,scale);m.userData.opacity=opacity;return m;}
function disc(p,y,col){return ell(p,[0,y,0],[.76,.085,.53],col)}
function cells(p,count,radius,extent){for(let j=0;j<count;j++){const a=j*2.39996,y=1-2*(j+.5)/count,rr=Math.sqrt(1-y*y);ell(p,[Math.cos(a)*rr*extent,y*extent,Math.sin(a)*rr*extent],[radius,radius,radius]);}}
function branch(p,start,dir,len,r,depth,phase=0){const end=V(start).addScaledVector(V(dir).normalize(),len).toArray();tube(p,[start,end],r);if(depth>0){for(let s of [-1,1]){const v=V(dir).add(new T.Vector3(.20*s,0,.6*s)).applyAxisAngle(new T.Vector3(0,1,0),phase).normalize();branch(p,end,v.toArray(),len*.69,r*.68,depth-1,phase+.72)}}}
function neural(p,i){
 if(i===5){tube(p,[[-.12,.99,0],[-.46,.56,0],[-.56,.0,0],[-.43,-.53,0],[-.15,-.89,0]],.08);for(let s of [-1,1])tube(p,[[-.18,.94,s*.11],[-.34,.78,s*.09],[-.45,.56,s*.07]],.045);ell(p,[-.02,.99,0],[.23,.23,.19]);return;}
 if(i<=7){tube(p,[[-.3,.96,0],[-.6,.53,0],[-.59,-.08,0],[-.4,-.54,0],[.03,-.78,0]],.09);for(const [c,r] of [[[-.29,1.06,0],[.31,.35,.29]],[[.04,1.13,0],[.29,.3,.26]],[[.23,.94,0],[.19,.20,.22]]])ell(p,c,r);return;}
 const ga=stages[i].ga,t=(ga-12)/28,h=1.14-.22*t,fold=Math.max(0,(ga-20)/20);
 tube(p,[[-.34,.67,0],[-.53,.2,0],[-.52,-.28,0],[-.36,-.70,0]],.055);
 for(let side of [-1,1]){
  const g=new T.SphereGeometry(1,72,52),pos=g.attributes.position;
  for(let j=0;j<pos.count;j++){let x=pos.getX(j),y=pos.getY(j),z=pos.getZ(j);const a=Math.atan2(z,x),b=Math.acos(Math.max(-1,Math.min(1,y)));const ridge=Math.sin(a*11+Math.sin(b*6)*1.2)*Math.sin(b*13+a*1.5);const k=1+fold*.035*ridge;pos.setXYZ(j,x*k,y*k,z*k)}g.computeVertexNormals();
  add(p,g,null,[-.13,1.02,side*.18*h],[.40*h,.44*h,.225*h]);
 }
 ell(p,[-.33,.65,0],[.18,.13,.23]);
}
function heart(p,i){
 if(i===5){tube(p,[[.0,.24,0],[.17,.12,.06],[.13,-.08,.13],[-.08,-.09,.12],[-.12,.10,.05]],.075);return;}
 if(i===6){tube(p,[[-.04,.16,0],[.12,.08,.12],[.13,-.12,.15],[-.11,-.13,.12],[-.16,.07,.02]],.075);ell(p,[.05,-.1,.14],[.12,.12,.11]);return;}
 const fetal=i>=8,c=fetal?[.0,.02,.05]:[.09,.02,.1],s=fetal?.94+(i-8)*.015:1;
 for(const [o,r] of [[[0,-.04,.065],[.14,.18,.12]],[[-.09,-.025,-.05],[.13,.16,.11]],[[.025,.13,.06],[.1,.09,.085]],[[-.105,.12,-.06],[.09,.08,.08]]])ell(p,c.map((v,j)=>v+o[j]*s),r.map(v=>v*s));
 tube(p,[[c[0],.12,.04],[.07,.31,.02],[-.16,.35,-.03],[-.32,.18,-.04],[-.35,-.52,-.04]],.025,'#bd807b');
 tube(p,[[-.08,.10,-.06],[-.18,.28,.02],[-.30,.36,.07]],.025,'#889da9');
 tube(p,[[-.02,.12,.04],[-.10,.27,.05],[-.20,.31,.02]],.015,'#ae8e9d'); // ductus arteriosus, schematic
 ell(p,[-.055,.12,.015],[.035,.032,.02],'#d9aba0'); // schematic atrial communication
 tube(p,[[-.1,.08,-.06],[-.24,-.12,-.05],[-.23,-.5,-.05]],.023,'#889da9');
}
function gut(p,i){
 if(i<=6){tube(p,[[-.12,.61,0],[-.3,.16,0],[-.34,-.26,0],[-.08,-.65,0]],.048);if(i===6)ell(p,[-.13,-.21,.1],[.12,.15,.09]);return;}
 const ga=stages[i].ga||10,count=i===7?16:56+(i-8)*4;
 tube(p,[[.13,.46,0],[-.16,.1,0],[-.19,-.19,.11]],.028);ell(p,[-.1,-.21,.12],[.14,.115,.085]);
 let ps=[];for(let j=0;j<=count;j++){let t=j/count,a=t*Math.PI*(i===7?5:8+(i-8)*.5);ps.push(i===7?[.37+.16*Math.cos(a),-.36+.1*Math.sin(a),-.10+.20*t]:[-.03+(.15+.025*Math.sin(t*17))*Math.sin(t*Math.PI*(6+(i-8)*.32)),-.3-.32*t+.025*Math.sin(t*27),.06+.09*Math.cos(t*Math.PI*5)])}tube(p,ps,.022+Math.min(i-7,7)*.001);
 if(i>=8)tube(p,[[.16,-.65,-.02],[.18,-.29,-.02],[-.18,-.26,-.04],[-.26,-.64,-.03],[-.19,-.74,0]],.035);
}
function lungs(p,i){
 if(i===6){tube(p,[[-.13,.43,0],[-.19,.14,0]],.018);for(let s of [-1,1]){tube(p,[[-.19,.14,0],[-.12,.02,s*.12]],.015);ell(p,[-.12,-.01,s*.13],[.045,.07,.05])}return;}
 const t=Math.max(0,(i-8)/7),depth=i===7?2:i<11?3:4;
 tube(p,[[.0,.46,0],[-.18,.16,0]],.025);
 for(let s of [-1,1]){
  const c=[-.13,.01,s*.19],r=[.16+.02*t,.28+.03*t,.105+.025*t];
  const l=ell(p,c,r);l.userData.opacity=.57;
  branch(p,[-.18,.16,0],[.12,-.7,s*.7],.16,.02,depth);
  // Peripheral compartments gain complexity without claiming alveolar resolution.
  if(i>=11)branch(p,[-.14,.04,s*.15],[.1,-.8,s*.2],.12,.012,Math.min(4,2+Math.floor((i-11)/2)),.4);
 }
}
function skeleton(p,i){
 const ga=stages[i].ga||10,t=Math.max(0,(ga-12)/28),fat=Math.max(0,(ga-24)/16);
 const cartilage='#b7c2b6',bone='#ddd0b0';
 for(let j=0;j<18;j++){let u=j/17;ell(p,[-.39-.12*Math.sin(u*Math.PI),.5-u*1.2,0],[.07,.029,.07],cartilage)}
 // Open cranial plates preserve gaps and do not obscure the entire brain.
 for(let s of [-1,1]){
  for(let j=0;j<7;j++){let y=.16-j*.071;curve(p,[[-.45,y,0],[-.32,y+.045,s*.24],[-.06,y+.03,s*.25],[.05,y-.01,s*.13]],.012,cartilage)}
  const arm=[[-.12,.20,s*.31],[.30+.12*t,-.14+.13*t,s*.45],[.45,.25+.12*t,s*.36]],leg=[[-.22,-.66,s*.25],[.51+.08*t,-.46+.08*t,s*(.32+.05*t)],[.26,-1.04+.08*t,s*(.35+.03*t)]];
  for(const pts of [arm,leg])for(let j=0;j<2;j++){
   tube(p,[pts[j],pts[j+1]],.032,cartilage);
   if(i>=8){const a=V(pts[j]),b=V(pts[j+1]),fraction=.15+.62*t;const from=a.clone().lerp(b,(1-fraction)/2),to=a.clone().lerp(b,(1+fraction)/2);tube(p,[from.toArray(),to.toArray()],.034,bone)}
   ell(p,pts[j],[.045,.045,.045],cartilage);
  }
  curve(p,[[-.22,-.6,0],[-.33,-.69,s*.23],[-.17,-.77,s*.24],[0,-.7,s*.12]],.028,cartilage);
  if(i>=8){const h=1.14-.22*t;let plate=add(p,new T.SphereGeometry(1,32,20,.2,2.6,.2,1.0),bone,[-.13,.95,s*.03],[.49*h,.55*h,.4*h]);plate.userData.opacity=.5;}
 }
}
function support(p,i){
 const early=i<=7;
 tube(p,[[early?.23:.34,-.4,0],[.66,-.49,.04],[.99,-.21,.1],[1.10,.14,.04],[.97,.49,-.07]],early?.045:.065);
 const disk=ell(p,[.98,.65,-.1],[.35,.10,.29]);disk.rotation.z=-.3;
 for(let j=0;j<6;j++){let a=j/6*Math.PI*2;curve(p,[[.97,.56,-.08],[.97+Math.cos(a)*.15,.57,-.08+Math.sin(a)*.15],[.97+Math.cos(a)*.28,.61,-.08+Math.sin(a)*.24]],.009,'#be8f88')}
}
async function body(p,i){
 const response=await fetch(`./prenatal/body-${i}.bin`);if(!response.ok)throw new Error(`Stage ${i+1} surface could not load`);
 const buf=await response.arrayBuffer(),h=new Uint32Array(buf,0,2),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(buf,8,h[0]*3),3));g.setIndex(new T.BufferAttribute(new Uint32Array(buf,8+h[0]*12,h[1]),1));const normalOffset=8+h[0]*12+h[1]*4;if(buf.byteLength>=normalOffset+h[0]*12)g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buf,normalOffset,h[0]*3),3));else g.computeVertexNormals();add(p,g,i>=11?'#dcbaa7':'#e0bda8');
 if(i>=6&&i<8){for(let s of [-1,1])ell(p,[.29,.86,s*.29],[.079,.079,.05],'#837f77')}
}
export async function buildStage(i){
 const stage=stages[i],root=new T.Group(),parts={};root.name=`stage-${i}`;
 for(const key of stage.parts){const p=new T.Group();p.name=key;p.userData={key,color:systems[key][1]};root.add(p);parts[key]=p;
  if(key==='body')await body(p,i);
  else if(key==='zona')shell(p,1.02,[1,1,1],[0,0,0],.25);
  else if(key==='cell')ell(p,[0,0,0],[.84,.84,.84]);
  else if(key==='nuclei'){ell(p,[-.22,.12,.22],[.22,.22,.22]);ell(p,[.21,-.06,.20],[.20,.20,.20]);}
  else if(key==='blastomeres'){for(let j=0;j<8;j++)ell(p,[(j&1?1:-1)*.32,(j&2?1:-1)*.32,(j&4?1:-1)*.32],[.43,.43,.43]);}
  else if(key==='trophoblast'){shell(p,1.0,i===3?[1,.7,1]:[1,1,1],[0,0,0],.3);if(i===2)for(let j=0;j<140;j++){const a=j*2.4,y=1-2*(j+.5)/140,r=Math.sqrt(1-y*y);ell(p,[Math.cos(a)*r*.95,y*.95,Math.sin(a)*r*.95],[.13,.13,.13]);}}
  else if(key==='inner'){cells(p,14,.17,.24);p.children.forEach(m=>m.position.add(new T.Vector3(-.45,.34,0)));}
  else if(key==='epiblast')disc(p,.08);
  else if(key==='hypoblast')disc(p,-.07);
  else if(key==='amnion')shell(p,.72,[1,.55,.7],[0,.3,0],.25);
  else if(key==='yolk'){shell(p,i<5?.64:.38,i<5?[1,.75,.8]:[1,1,.8],i<5?[0,-.50,0]:[.54,-.35,0],.46);if(i===5)tube(p,[[.05,-.18,0],[.29,-.25,0],[.38,-.32,0]],.045);}
  else if(key==='ectoderm')disc(p,.18);
  else if(key==='mesoderm')disc(p,0);
  else if(key==='endoderm')disc(p,-.18);
  else if(key==='axis')tube(p,[[0,.28,-.4],[0,.28,0],[0,.28,.37]],.035);
  else if(key==='neural')neural(p,i);
  else if(key==='heart')heart(p,i);
  else if(key==='somites'){for(let j=0;j<(i===5?10:14);j++){let u=j/(i===5?9:13);for(let s of [-1,1])ell(p,[-.39-.22*Math.sin(u*Math.PI),.61-u*1.3,s*.14],[.065,.039,.058]);}}
  else if(key==='gut')gut(p,i);
  else if(key==='liver'){const growth=i<8?1:1.12-(i-8)*.035;const l=ell(p,[-.08,-.20,-.07],[i===6?.16:.24*growth,i===6?.10:.15*growth,.22*growth]);l.rotation.z=-.16;ell(p,[.08,-.22,.08],[i===6?.09:.17*growth,.085*growth,.14*growth]);}
  else if(key==='lungs')lungs(p,i);
  else if(key==='skeleton')skeleton(p,i);
  else if(key==='kidneys'){for(let s of [-1,1]){const t=Math.max(0,(i-7)/8);const kidney=ell(p,[-.37,-.36+t*.09,s*.17],i===6?[.04,.13,.04]:[.06+.015*t,.10+.025*t,.045+.015*t]);kidney.rotation.z=s*.12;}}
  else if(key==='support')support(p,i);
  p.userData.basePosition=p.position.clone();
  p.updateMatrixWorld(true);const box=new T.Box3().setFromObject(p);p.userData.center=box.getCenter(new T.Vector3());p.userData.size=box.getSize(new T.Vector3());
  p.traverse(o=>{if(o.isMesh){o.userData.key=key;o.userData.baseOpacity=o.userData.opacity??1;}});
 }
 root.userData={parts,index:i};return root;
}
