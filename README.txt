Embryo Explorer — human prenatal edition

A buildless Three.js experience with sixteen representative stages, from fertilization to pregnancy week 40. The original smooth body surfaces are generated locally; internal anatomy is procedural JavaScript geometry. No Human Atlas or eMouse Atlas geometry, imagery, or interface is used.

Run a static HTTP server in dist/, for example: python3 -m http.server 8873 --directory dist
Open http://localhost:8873. ES modules require HTTP rather than file://.

The main screen is a 4 × 4 overview of all sixteen stages. The Assembled, Separate and All parts controls update every preview. Click a stage to open its interactive 3D inspection panel, or click an individual structure in an All parts preview. Stage notes remain alongside the anatomical explanation. Drag to orbit and scroll to zoom in the inspection panel. Choose an anatomical structure, isolate it, toggle visibility, or separate the structures. A structure absent in a new stage clears its selection. Cord and placenta are visible by default wherever modeled. A visitor can hide them; that choice persists across stages and is restored after the guided journey. Reset restores visible defaults. All parts opens an organized collection of the current stage’s structures. Select any item to inspect and rotate it, then return to the arrangement. Parts use adjusted display scales, explicitly labeled in the interface.

The white environment responds gently to pointer movement and respects reduced-motion preferences. Touch does not activate pointer parallax. The 60-second journey can be paused and scrubbed; Exit film returns control to the explorer. Export records a 1920 × 1080 WebM using the browser's MediaRecorder. Export performance and format depend on the browser. The delivered MP4 is converted from the same recording.

Files:
  dist/stages.js — source-supported stage metadata and descriptions
  dist/models.js — original stage-specific anatomy
  dist/prenatal/ — generated binary outer surfaces and surface-aligned facial/limb detail metadata
  dist/board.js — cached stage previews generated from the actual meshes, with direct part selection
  dist/board.css — overview and inspection layout
  dist/journey.js — shared 60-second timing and stage/structure captions
  dist/layout.js — normalized, responsive anatomy collection layout
  dist/app.js — shared stage state, interaction, lighting, film, export
  dist/anatomy-matrix.md — stage-by-stage sources and limitations
  scripts/prenatal_geometry.py — body mesh generator

Geometry regeneration requires numpy, scipy, and scikit-image:
  python3 scripts/prenatal_geometry.py
Optional integer arguments (5–15) rebuild selected surface indices.
Binary layout: two little-endian uint32 values (vertex count, index count), followed by float32 XYZ vertex positions, then uint32 triangle indices and float32 XYZ gradient normals.

Science and scope:
These are original schematic human anatomical illustrations, not scans, measured cell lineages, or validated clinical reconstructions. Dates, pose, tissue spacing, and transitions are approximate/illustrative. The early period uses days after fertilization; later labels use pregnancy weeks, approximately two weeks ahead. Reference lengths are approximate; the models are independently framed. Carnegie staging does not extend through fetal development. The brain folds, lung branching, heart/vessels, cartilage/bone, and bowel loops are simplified; microscopic anatomy and several organs are omitted. Specialist anatomical review remains outstanding.

See dist/CREDITS.txt for attribution and VERIFICATION.md for checks and remaining limitations.

Refinement edition: fetal surfaces contain approximately 85,000–92,000 vertices with smooth field normals. The face, ears, fingers, toes and curled pose were resculpted; color is applied at vertices, with no low-resolution skin bitmap. Skin self-shadow reception is disabled to avoid shadow-map acne while the floor receives a restrained cast shadow. The flat lay uses separate soft contact shadows. All parts is demonstrated at pregnancy week 24 in the refreshed journey.

Journey update: 16 developmental stages, 18 concise captions, and at least three seconds per explanation. The exported frame reserves a separate caption band below the anatomy. The guide shows its own layer configuration without overwriting manual visibility preferences. Cord attachments are sampled from the body surface at each supported stage; placental shape and positioning remain schematic.

Overview edition: stage previews use one shared offscreen renderer, rather than a separate graphics context per card. The selected stage uses the existing interactive renderer. Preview sizes are independently framed, not physical size comparisons. At compact widths, stage descriptions move into the inspection panel; very narrow or short screens use a scrolling two-column overview to keep controls legible. The guided journey remains optional and returns to the previously selected overview mode and stage.

Selected stages open in a centered focus view on white, with the overview and header hidden until closed. The first four overview dates use days after fertilization; all subsequent dates use pregnancy weeks, with additional days noted where needed.

Borderless overview: all 16 stages share a white field with age labels. Names appear on hover/focus and full information remains in centered inspection. Drag an assembled or separated stage to turn it directly. All parts uses responsive spreads (five columns on wide displays, three on compact displays) with 113 semantic structure targets. Reset clears overview rotations. Shared meshes and one renderer supply the interactive previews.

Information-first navigation: overview clicks open a non-modal information box while all stages remain visible. Rendered structures in Assembled and Separate are picked using their current preview camera; All parts retains direct structure targets. Explore in 3D is an explicit optional deeper view, and returning restores the information selection.

Current main experience: flow.js / flow.css render one live stage, initially Week 16. Progress 0–40 separates anatomical groups; 40–75 interpolates the same groups into a collection; 75–100 fits the camera to the targeted structure. Wheel, trackpad, pinch, and the range input share progress. No target holds at 75. Dragging orbits. Click or keyboard selection pins a structure. Missing anatomy on stage change returns to All parts before replacing the stage. Stage snapshots remain distinct illustrations. Older board/app files remain as project history but are not loaded by index.html.

Home-first navigation: index.html / home.js / home.css show all 16 stages with minimal labels and no boxes. Selecting a stage opens explore.html?stage=N at assembled progress 0. The continuous explorer retains separation, parts, targeted inspection, wheel input, and orbiting. All stages returns to the home screen.
