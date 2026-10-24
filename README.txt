EMBRYO EXPLORER

An original interactive 3D illustration on a white background.

RUN LOCALLY
From this folder, run:
  python3 -m http.server 8000 --directory dist
Then open http://localhost:8000 in a modern browser with WebGL.
No accounts, API keys, or network requests are needed after loading the files.

CONTROLS
Drag to rotate; scroll to zoom. Select a structure to reveal it through the outer form. Isolate it for a close view. Toggle layers, separate tissues, switch to particles, or select one of three conceptual forms.
Film plays the 55-second automated sequence. Export records a 1920 x 1080 WebM video in supported browsers. Use the resulting Download film link. The supplied MP4 is also ready to share.

WHAT IT REPRESENTS
The geometry is an original procedural illustration of mammalian embryonic form. The stages are conceptual, not exact developmental ages. Internal anatomy is simplified. The points are surface samples, not measured cells. No predictive simulation or experimental measurements are presented.

REGENERATE GEOMETRY (OPTIONAL)
Install numpy, scipy, and scikit-image in a Python environment, then run:
  python3 scripts/generate_geometry.py
The shipped binary meshes are ready to use; regeneration is optional.

CREDITS
Original geometry, interface, and camera choreography created for this project.
Three.js / OrbitControls: MIT, see dist/vendor/LICENSE.txt.
