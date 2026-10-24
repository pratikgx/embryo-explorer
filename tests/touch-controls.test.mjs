import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindExplorationSlider} from '../dist/touch-controls.js';
function setup(limit=160){
 const handlers={},captures=new Set(),requests=[];
 const slider={min:'0',max:'160',value:0,addEventListener:(type,fn)=>handlers[type]=fn,getBoundingClientRect:()=>({left:10,width:348}),focus:()=>{},setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
 bindExplorationSlider(slider,value=>{requests.push(value);return Math.min(limit,value)});
 const send=(type,x,id=1)=>handlers[type]({type,clientX:x,pointerId:id,button:0,preventDefault(){}});
 return {slider,captures,requests,send};
}
test('captured drag keeps working outside the slider and clamps both ends',()=>{
 const t=setup();t.send('pointerdown',24);assert(t.captures.has(1));t.send('pointermove',184);assert.equal(t.slider.value,80);t.send('pointermove',900);assert.equal(t.slider.value,160);t.send('pointermove',-40);assert.equal(t.slider.value,0);t.send('pointerup',344);assert.equal(t.slider.value,160);assert.equal(t.captures.size,0);
});
test('a second finger cannot hijack an active drag; cancel releases it',()=>{
 const t=setup();t.send('pointerdown',24);t.send('pointerdown',344,2);t.send('pointermove',344,2);assert.equal(t.slider.value,0);t.send('pointercancel',24);const n=t.requests.length;t.send('pointermove',344);assert.equal(t.requests.length,n);t.send('pointerdown',184,3);assert.equal(t.slider.value,80);
});
test('selection boundary is reflected in the thumb; keyboard input remains supported',()=>{
 const t=setup(100);t.send('pointerdown',344);assert.equal(t.slider.value,100);t.send('pointerup',344);t.slider.value=50;t.send('input',0);assert.equal(t.slider.value,50);
});
