Embryo Explorer — human prenatal edition

A buildless Three.js experience with sixteen representative stages, from fertilization to pregnancy week 40. The original smooth body surfaces are generated locally; internal anatomy is procedural JavaScript geometry. No Human Atlas or eMouse Atlas geometry, imagery, or interface is used.

Run a static HTTP server in dist/, for example: python3 -m http.server 8873 --directory dist
Open http://localhost:8873. ES modules require HTTP rather than file://.

Controls: drag to orbit, scroll to zoom, use the stage selector, shortcut labels, or keyboard-accessible timeline. Choose an anatomical structure, isolate it, toggle visibility, or separate the structures. A structure absent in a new stage clears its selection. Extraembryonic cord/placenta context is optional.

The white environment responds gently to pointer movement and respects reduced-motion preferences. Touch does not activate pointer parallax. The 84-second journey can be paused and scrubbed; Exit film returns control to the explorer. Export records a 1920 × 1080 WebM using the browser's MediaRecorder. Export performance and format depend on the browser. The delivered MP4 is converted from the same recording.

Files:
  dist/stages.js — source-supported stage metadata and descriptions
  dist/models.js — original stage-specific anatomy
  dist/prenatal/ — generated binary outer surfaces
  dist/app.js — shared stage state, interaction, lighting, film, export
  dist/anatomy-matrix.md — stage-by-stage sources and limitations
  scripts/prenatal_geometry.py — body mesh generator

Geometry regeneration requires numpy, scipy, and scikit-image:
  python3 scripts/prenatal_geometry.py
Optional integer arguments (5–15) rebuild selected surface indices.
Binary layout: two little-endian uint32 values (vertex count, index count), followed by float32 XYZ vertex positions, then uint32 triangle indices.

Science and scope:
These are original schematic human anatomical illustrations, not scans, measured cell lineages, or validated clinical reconstructions. Dates, pose, tissue spacing, and transitions are approximate/illustrative. The early period uses days after fertilization; later labels use pregnancy weeks, approximately two weeks ahead. Reference lengths are approximate; the models are independently framed. Carnegie staging does not extend through fetal development. The brain folds, lung branching, heart/vessels, cartilage/bone, and bowel loops are simplified; microscopic anatomy and several organs are omitted. Specialist anatomical review remains outstanding.

See dist/CREDITS.txt for attribution and VERIFICATION.md for checks and remaining limitations.
