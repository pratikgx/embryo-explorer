// Each stop has its own reading time. Captions describe schematic anatomy, not measured motion.
export const durations=[3,3,3,3,3,4.5,3,3,3.5,3,3,10,4,3,3,5];
export const boundaries=durations.reduce((a,d)=>[...a,a.at(-1)+d],[0]);
export const duration=boundaries.at(-1);
export const captions=[
 'Development begins with one cell, shown here inside its surrounding envelope.',
 'Repeated divisions produce more cells inside an envelope that stays roughly the same size.',
 'A fluid cavity forms, with a cluster of cells gathered at one side.',
 'Two embryonic layers lie between early supporting compartments during this stage of implantation.',
 'Three germ layers establish the foundations from which different tissues and organs develop.',
 'As the body folds, a looping heart tube takes shape in the chest.',
 'The head expands as limb buds begin shaping the future arms and legs.',
 'Distinct fingers and toes emerge as the limbs lengthen and the external tail regresses.',
 'The head remains large while the intestinal loops return to the growing abdomen.',
 'The neck and limbs lengthen, gradually changing the proportions of the growing fetus.',
 'A recognizable face and slender limbs accompany continued growth of the brain and body.',
 'Brain and lung organization grows more complex while the body still carries little fat.',
 'The growing brain develops stronger surface folds, shown here as simplified illustrative contours.',
 'Increasing body fat makes the cheeks and limbs fuller as organs continue developing.',
 'The body looks fuller and smoother, with the limbs shown in a relaxed curled pose.',
 'The cord still connects fetus and placenta; the first breath has not happened yet.'
];
export function journeyAt(time){
 const seconds=Math.max(0,Math.min(duration,time));
 let index=durations.length-1;
 for(let i=0;i<durations.length;i++)if(seconds<boundaries[i+1]){index=i;break;}
 const local=seconds-boundaries[index];
 let start=boundaries[index],end=boundaries[index+1],caption=captions[index],part=index===5?'heart':index===8?'gut':index===12?'neural':null,title=null;
 if(index===11&&local>=3&&local<6){start+=3;end=boundaries[index]+6;part=null;title='All parts';caption='Structures spread out for inspection; their display sizes are adjusted to make each one readable.';}
 else if(index===11&&local>=6){start+=6;part='heart';caption='The fetal heart retains connections that route blood around the lungs before birth.';}
 else if(index===11)end=start+3;
 return {index,local,progress:local/durations[index],start,end,caption,part,title};
}
