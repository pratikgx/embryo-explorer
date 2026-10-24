import * as T from 'three';
// Arrange semantic systems rather than individual mesh fragments. Scale is a display choice.
export function planLayout(parts,keys,aspect=1.4,columnCount=null){
 const columns=columnCount|| (keys.length<=3?keys.length:(aspect<.85?2:3)),rows=Math.ceil(keys.length/columns);
 const cellW=2.1,cellH=1.95,width=columns*cellW,height=rows*cellH;
 const entries={};
 keys.forEach((key,j)=>{
  const flat=['epiblast','hypoblast','ectoderm','mesoderm','endoderm','axis'].includes(key);
  const rotation=new T.Quaternion().setFromEuler(new T.Euler(flat?.85:.06,-.55,0));
  const part=parts[key],size=part.userData.size,center=part.userData.center;
  const rotated=new T.Box3();
  for(let x of [-1,1])for(let y of [-1,1])for(let z of [-1,1])rotated.expandByPoint(new T.Vector3(size.x*x/2,size.y*y/2,size.z*z/2).applyQuaternion(rotation));
  const extent=rotated.getSize(new T.Vector3());
  const scale=Math.min(4.4,1.42/Math.max(.04,extent.x),1.36/Math.max(.04,extent.y));
  const countInRow=Math.min(columns,keys.length-Math.floor(j/columns)*columns);
  const slot=new T.Vector3((j%columns-(countInRow-1)/2)*cellW,((rows-1)/2-Math.floor(j/columns))*cellH+.16,0);
  const position=slot.clone().sub(center.clone().multiplyScalar(scale).applyQuaternion(rotation));
  entries[key]={slot,position,scale,rotation,extent:extent.multiplyScalar(scale),label:slot.clone().add(new T.Vector3(0,-.91,.1))};
 });
 return {entries,width,height,columns,rows};
}
