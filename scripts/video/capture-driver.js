// Local-only deterministic capture of the actual application scene and controls.
if(captureMode){
 const cursor=document.createElement('div');cursor.id='demoCursor';cursor.innerHTML='<svg width="26" height="32" viewBox="0 0 26 32"><path d="M3 2 L3 25 L9 19 L14 29 L19 26 L14 17 L23 17 Z" fill="#354632" stroke="white" stroke-width="2"/></svg>';document.body.append(cursor);
 const site=document.createElement('div');site.id='demoAddress';site.textContent='embryoexplorer.com';document.body.append(site);
 let priorFocus=-1,priorKey='';
 const tween=(t,a,b,x,y)=>mix(x,y,ease(a,b,t));
 function pose(t){
  let p=0,i=null,k=null;
  if(t<1.2)p=0;
  else if(t<4.0)p=tween(t,1.2,4,0,100);
  else if(t<4.8)p=100;
  else if(t<6.3){i=11;p=tween(t,4.8,6.3,100,130);}
  else if(t<7){i=11;p=130;}
  else if(t<9.2){i=11;k='heart';p=tween(t,7,7.9,130,160);}
  else if(t<9.8){i=11;k='heart';p=tween(t,9.2,9.8,160,130);}
  else if(t<11.7){i=11;k='lungs';p=tween(t,9.8,10.6,130,160);}
  else if(t<12.3){i=11;k='lungs';p=tween(t,11.7,12.3,160,130);}
  else if(t<14.4){i=11;k='neural';p=tween(t,12.3,13.1,130,160);}
  else if(t<15){i=11;k='neural';p=tween(t,14.4,15,160,130);}
  else if(t<17.2){i=11;k='body';p=tween(t,15,15.8,130,160);}
  else if(t<18){i=11;k='body';p=tween(t,17.2,18,160,130);}
  else if(t<18.7){i=11;p=tween(t,18,18.7,130,100);}
  else if(t<19.5)p=tween(t,18.7,19.5,100,0);
  return {p,i,k};
 }
 async function captureFrame(n){const t=n/30,{p,i,k}=pose(t);progress=target=p;focused=i;selected=i===null?null:{i,key:k};hover=null;resetting=false;hidden.clear();
  for(const r of records){r.yaw=0;r.pitch=0;}if(i!==null&&p>130){const start=k==='heart'?7:k==='lungs'?9.8:k==='neural'?12.3:15;records[i].yaw=(t-start)*.20-.12;records[i].pitch=.02*Math.sin(t);}
  $('homeInfo').hidden=i===null;document.body.dataset.homeInfo=String(i!==null);if(i!==null){$('focusStage').value=i;updateInfo();}if(i!==priorFocus||k!==priorKey){updateSystems();priorFocus=i;priorKey=k;}
  if(selected){$('enterStage').hidden=!k&&p>=129.9;$('enterStage').textContent=p>130?'← Back to stage parts':k?'Zoom into this part':'Zoom into this stage';}
  $('homeSlider').value=p;$('homeSlider').style.setProperty('--progress',p/160*100+'%');$('homeValue').textContent=Math.round(p/160*100)+'%';$('homePhase').textContent=p<.1?'Assembled':p<50?'Separating':p<99.9?'Arranging parts':p<100.1?'All parts':p<129.9?'Into the stage':p<130.1?'Stage anatomy':p<159.9?'Closer look':'Inspect';
  status(i===null?'Scroll to explore · Point to a stage or part to zoom further':name(i,k));resize();render();
  const range=$('homeSlider').getBoundingClientRect(),slider=q=>[range.left+q/160*range.width,range.top+range.height/2],sys=key=>{const b=document.querySelector(`[data-system-select="${key}"]`).getBoundingClientRect();return [b.left+b.width*.6,b.top+b.height*.5];},r=boxes[11];
  const track=[[0,[innerWidth*.76,innerHeight*.3]],[1.2,slider(0)],[4,slider(100)],[4.75,[r.left+r.width*.5,r.top+r.height*.5]],[5.1,[r.left+r.width*.5,r.top+r.height*.5]],[6.8,sys('heart')],[7.05,sys('heart')],[9.6,sys('lungs')],[9.85,sys('lungs')],[12.1,sys('neural')],[12.35,sys('neural')],[14.8,sys('body')],[15.05,sys('body')],[17.4,slider(160)],[18,slider(130)],[18.7,slider(100)],[19.5,slider(0)],[20,slider(0)]];
  let pair=0;while(pair<track.length-2&&t>track[pair+1][0])pair++;const a=track[pair],b=track[pair+1],f=ease(a[0],b[0],t),x=mix(a[1][0],b[1][0],f),y=mix(a[1][1],b[1][1],f);
  const clicks=[4.8,7,9.8,12.3,15];let current=clicks.filter(v=>t>=v).at(-1),pulse=current===undefined?2:t-current;
  cursor.style.left=x+'px';cursor.style.top=y+'px';cursor.style.setProperty('--pulse',pulse<.45?1-pulse/.45:0);cursor.style.setProperty('--ring',pulse<.45?12+pulse*55+'px':'12px');
  document.body.dataset.captureFrame=n;await new Promise(r=>requestAnimationFrame(r));parent.postMessage({captureFrame:n},location.origin);
 }
 window.addEventListener('capture-frame',e=>captureFrame(Number(e.detail)));await captureFrame(0);
}
