import {createBoard} from './board.js?v=home3';
import {buildStage} from './models.js?v=info4';
const cache=new Map();
async function ensure(i){if(!cache.has(i))cache.set(i,buildStage(i));return cache.get(i);}
const board=createBoard({ensure,directions:{},openStage:i=>{location.href=`./explore.html?stage=${i}`;}});
document.querySelectorAll('[data-open]').forEach(b=>{b.removeAttribute('aria-expanded');b.removeAttribute('aria-controls');});
document.getElementById('sourceBtn').onclick=()=>document.getElementById('sources').showModal();
document.getElementById('closeSources').onclick=()=>document.getElementById('sources').close();
document.getElementById('reset').onclick=()=>board.reset();
document.getElementById('sources').onclick=e=>{if(e.target===document.getElementById('sources'))e.target.close();};
window.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.style.setProperty('--px',(e.clientX/innerWidth-.5)*12+'px');document.documentElement.style.setProperty('--py',(e.clientY/innerHeight-.5)*8+'px');});
board.setMode('assembled').catch(e=>{document.getElementById('boardStatus').textContent='Some stages could not load. Reload to try again.';console.error(e);});
