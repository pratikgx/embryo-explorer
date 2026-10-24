// Representative snapshots, not equally spaced biological time or measured specimens.
export const stages = [
 {name:'Fertilization',age:'Day 1',pf:1,phase:'Cells',note:'One cell, before the first division.',scale:'≈ 0.1 mm · cell diameter',parts:['zona','cell','nuclei']},
 {name:'Cleavage',age:'Day 3',pf:3,phase:'Cells',note:'More cells within a similar-sized envelope.',scale:'≈ 0.1–0.2 mm · conceptus diameter',parts:['zona','blastomeres']},
 {name:'Blastocyst',age:'Day 5',pf:5,phase:'Cells',note:'A fluid cavity and an inner cell mass emerge.',scale:'Microscopic · independently framed',parts:['trophoblast','inner']},
 {name:'Implantation',age:'Day 10',pf:10,phase:'Layers',note:'A two-layer disc between supporting cavities.',scale:'Microscopic · independently framed',parts:['epiblast','hypoblast','amnion','yolk','trophoblast']},
 {name:'Germ layers',age:'Week 4',pregnancyWeeks:4,pf:17,phase:'Layers',note:'Three germ layers establish the body’s organization.',scale:'Submillimetre scale · independently framed',parts:['ectoderm','mesoderm','endoderm','axis','yolk']},
 {name:'Body folding',age:'Week 5',pregnancyWeeks:5,pf:24,phase:'Embryo',note:'The flat disc folds; the heart and neural tube take shape.',scale:'≈ 2–4 mm · crown–rump length',parts:['body','neural','heart','somites','gut','yolk']},
 {name:'Early organs',age:'Week 7',pregnancyWeeks:7,pf:35,phase:'Embryo',note:'Cranial regions expand and limb buds emerge.',scale:'≈ 7–9 mm · crown–rump length',parts:['body','neural','heart','somites','gut','liver','lungs','kidneys','support']},
 {name:'Late embryo',age:'Week 10',pregnancyWeeks:10,pf:56,phase:'Embryo',note:'Digits separate; the tail regresses. Bowel remains herniated.',scale:'≈ 27–31 mm · crown–rump length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Early fetus',age:'Week 12',ga:12,phase:'Fetus',note:'A large head and defined limbs; bowel returns to the abdomen.',scale:'≈ 5–6 cm · crown–rump length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Growing limbs',age:'Week 16',ga:16,phase:'Fetus',note:'The neck and limbs lengthen; cartilage begins to mineralize.',scale:'≈ 11–12 cm · crown–rump length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Changing proportions',age:'Week 20',ga:20,phase:'Fetus',note:'A slender body, recognizable face, and growing brain.',scale:'≈ 25 cm · crown–heel length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Developing detail',age:'Week 24',ga:24,phase:'Fetus',note:'Brain and lung organization grows more complex; little body fat.',scale:'≈ 30 cm · crown–heel length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Maturation',age:'Week 28',ga:28,phase:'Fetus',note:'Cortical folds deepen; eyelids can open and body fat increases.',scale:'≈ 35–38 cm · crown–heel length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Filling out',age:'Week 32',ga:32,phase:'Fetus',note:'Cheeks and limbs become fuller as organs continue to mature.',scale:'≈ 42 cm · crown–heel length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Late fetus',age:'Week 36',ga:36,phase:'Fetus',note:'Smoother contours, fuller limbs, and a compact folded posture.',scale:'≈ 47 cm · crown–heel length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']},
 {name:'Before birth',age:'Week 40',ga:40,phase:'Fetus',note:'Near-term form. Circulation and lungs remain prenatal.',scale:'≈ 50 cm · crown–heel length',parts:['body','neural','heart','gut','liver','lungs','skeleton','kidneys','support']}
];
export const systems={
 zona:['Zona pellucida','#cddbd7','The surrounding glycoprotein envelope.'],cell:['Cell body','#e1bfa8','The fertilized cell, shown schematically.'],nuclei:['Pronuclei','#b18c98','Schematic pronuclear organization, not tracked genetic material.'],blastomeres:['Blastomeres','#d9b89b','A schematic eight-cell cleavage snapshot; cell number varies with timing.'],trophoblast:['Trophoblast','#c6b2b1','Outer supporting tissue; represented as an open shell for visibility.'],inner:['Inner cell mass','#be8d86','A cluster at one pole of the blastocyst.'],epiblast:['Epiblast','#849cad','The upper layer of the bilaminar embryonic disc.'],hypoblast:['Hypoblast','#c5ad76','The lower layer of the bilaminar embryonic disc.'],amnion:['Amniotic compartment','#a8c3ca','A schematic supporting cavity above the disc.'],yolk:['Yolk-sac compartment','#cbb484','An early supporting compartment; no longer shown as a large sac in fetal stages.'],ectoderm:['Ectoderm','#849cad','One of the three germ layers.'],mesoderm:['Mesoderm','#bf8a83','The middle germ layer.'],endoderm:['Endoderm','#c5ad76','The inner germ layer.'],axis:['Midline organization','#8b8297','A schematic primitive-streak and notochordal region.'],body:['Outer form','#dfbaa4','Original illustrative outer anatomy.'],neural:['Nervous system','#8e9eae','Developing brain and spinal structures.'],heart:['Heart & circulation','#bc7773','Schematic heart and principal vessels. Fetal circulation is retained.'],somites:['Somites','#bca67b','Transient paired segments along the embryonic body axis.'],gut:['Digestive tract','#8ba799','Developing gut and intestinal arrangement.'],liver:['Liver','#a67e7d','A prominent developing abdominal organ.'],lungs:['Respiratory system','#b09ca7','Prenatal respiratory tissue and branching airways.'],skeleton:['Skeleton','#c0b28f','Cartilage and selected mineralizing skeletal elements.'],kidneys:['Kidney regions','#aaa084','Simplified developing kidney regions; not a complete urinary-system reconstruction.'],support:['Cord & placenta','#b6aaa6','Optional, schematic extraembryonic context; placement is illustrative.']
};
export function detail(key,i){
 const ga=stages[i].ga||0;
 if(ga){
  const period=ga<20?0:ga<28?1:ga<36?2:3;
  const notes={
   body:[stages[i].note+' The eyelids are shown resting closed.'],
   neural:[
    'The brain and spinal cord continue growing. The large cranial regions have a comparatively smooth surface at this stage.',
    'The hemispheres expand. This model introduces shallow surface folds as pregnancy advances; they are illustrative, not a map of named grooves.',
    'The growing brain develops stronger surface folds. Their increasing relief suggests maturation without reconstructing measured brain tissue.',
    'The folded cerebral surface is more pronounced. Brain growth and organization continue after birth; this is a simplified outer view.'
   ],
   heart:[
    'The chambered heart is growing with the fetus. Connections that route blood around the lungs remain part of prenatal circulation.',
    'The heart grows within the expanding chest. The major vessels and fetal connections are shown schematically; this view does not simulate blood flow.',
    'The larger fetal heart retains its prenatal connections. The placenta still supports gas exchange while the lungs develop.',
    'The heart still has prenatal circulation. Birth-related changes have not happened: the illustrated atrial connection and ductus arteriosus remain present.'
   ],
   gut:[
    'The intestinal loops are now shown inside the abdomen after their early return from the base of the cord. The stomach and bowel remain simplified.',
    'The digestive tract grows within the abdomen. This view shows longer, more closely packed intestinal loops than the early fetal stage.',
    'The expanding bowel is arranged in denser loops. Their exact paths are illustrative; this is not a measured intestinal reconstruction.',
    'The digestive tract remains within the near-term abdomen. The packed loops show its broad arrangement, without microscopic tissue detail.'
   ],
   lungs:[
    'Branching airways extend within the small developing lungs. The translucent envelopes reveal a simplified airway scaffold.',
    'Airway and peripheral lung organization becomes more elaborate. Branches increase in this illustration; microscopic air spaces are not reconstructed.',
    'Peripheral lung tissue continues developing. These lungs remain prenatal and fluid-filled; the visible branches are a schematic guide.',
    'The lungs are still shown before the first breath. Their development continues beyond birth, and this model does not predict breathing readiness.'
   ],
   skeleton:[
    'A cartilage framework supports the growing limbs. Selected shafts begin to appear mineralized; the complete skeleton is not reconstructed.',
    'The limbs lengthen and selected mineralized shafts extend. Cartilage remains visible around the developing joints.',
    'The growing framework shows longer mineralized regions within the limbs. Gaps remain between the simplified cranial plates.',
    'The near-term framework remains a mixture of bone and cartilage. The skull plates are shown with gaps rather than as a fused shell.'
   ],
   liver:[
    'The liver is prominent in the early fetal abdomen. Its broad form is shown alongside the returning intestinal loops.',
    'The liver grows as the abdominal proportions change. The illustration adjusts its size relative to the surrounding body.',
    'The liver remains a substantial abdominal organ while the torso fills out. Its internal vessels and microscopic tissue are omitted.',
    'The liver is shown within the near-term abdominal arrangement. Its lobes are simplified, and no physiological activity is simulated.'
   ],
   kidneys:[
    'Paired kidney regions appear behind the digestive tract. These simple forms show their broad position, not the full developing urinary system.',
    'The paired kidneys grow with the abdomen. This schematic adjusts their size and relative position; internal collecting structures are omitted.',
    'The kidney regions enlarge within the growing torso. Their smooth surfaces are illustrative and do not show microscopic maturation.',
    'The near-term kidney regions remain paired behind the abdominal organs. The urinary tract and internal tissue are not reconstructed.'
   ],
   support:[
    'The cord links the fetus to the developing placenta. The disc and connection are shown as optional context with illustrative placement.',
    'The cord and placenta continue supporting exchange as the fetus grows. Their displayed size and spacing are simplified for readability.',
    'The cord and placenta remain the supporting connection during fetal growth. This model shows their relationship, not placental microanatomy.',
    'The cord and placenta remain connected before delivery. The scene ends before cord clamping or the transition to newborn circulation.'
   ]
  };
  if(notes[key])return notes[key][key==='body'?0:period];
 }
 if(key==='neural')return i===5?'Neural folds and an incompletely closing tube with cranial expansions.':i===6?'Expanding cranial vesicles and spinal tube; no adult cortical folds.':ga>=24?'Enlarging hemispheres with illustrative, progressively stronger surface folds. These are not named or measured sulci.':'Expanding brain regions and spinal cord. The cerebral surface remains comparatively smooth.';
 if(key==='heart')return i===5?'A simplified looping heart tube, without mature chambers.':i===6?'Looping and chamber formation, with a schematic outflow tract.':'Schematic chambered fetal heart and major vessels. The foramen ovale and ductus arteriosus remain represented; this is not a flow simulation.';
 if(key==='gut')return i===7?'Intestinal loops extend into the base of the cord during physiological herniation.':i>=8?'Intestinal loops lie within the abdomen, increasing in extent and packing as the fetus grows.':'A primitive gut tube and developing regional organization.';
 if(key==='lungs')return i===6?'Small paired respiratory buds and early branching.':ga>=24?'Increasingly elaborate prenatal airways and peripheral tissue. The lungs are fluid-filled; microanatomy is not reconstructed.':'A branching conducting-airway scaffold and simplified developing lung envelopes.';
 if(key==='skeleton')return ga>=24?'A growing cartilage framework with selected mineralized shafts. Skull gaps remain; this is not a complete skeleton.':'A predominantly cartilaginous framework with limited illustrative ossification centers.';
 return systems[key][2];
}

// Display pregnancy age from row two without changing the anatomical snapshot.
export function ageBasis(s){
 if(s.pregnancyWeeks){const days=(s.pf+14)%7;return 'of pregnancy'+(days?' · +'+days+' days':'');}
 return s.pf?'after fertilization':'of pregnancy';
}
