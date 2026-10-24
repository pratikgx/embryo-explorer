# Embryo Explorer

An interactive, illustrative human prenatal anatomy explorer with sixteen representative stages, from fertilization to pregnancy week 40.

The home screen shows all sixteen stages. One continuous control moves from assembled anatomy to separation, all parts, a full-size stage, and an individual component. Hover and scroll or click to inspect; the systems panel controls selection and visibility.

## Run locally

```sh
python3 -m http.server 8873 --directory dist
```

Open http://localhost:8873. No build or package installation is needed. Three.js is bundled locally.

## Project contents

- `dist/`: browser application, stage descriptions, original anatomy meshes and bundled Three.js.
- `scripts/prenatal_geometry.py`: geometry generator; regeneration needs numpy, scipy and scikit-image.
- `dist/anatomy-matrix.md`: scientific references and stage-specific scope.
- `dist/CREDITS.txt`: asset and dependency attribution.
- `VERIFICATION.md`: interaction checks and known limitations.
- `README.txt`: implementation notes and earlier editions.
- `media/embryo-explorer-walkthrough-20s.mp4`: current 1080p, 30 fps walkthrough.
- `scripts/video/`: reproducible walkthrough capture driver and instructions.
- `media/prenatal-journey-60s.*`: earlier guided journey in MP4 and WebM; predates the current homepage navigation.
- `.openai/hosting.json`: Sites deployment identity and static directory configuration.

## Scientific scope

This depicts **human**, not mouse, development. The anatomy is schematic and original. It is not a scan, a clinical reconstruction, a measured cell-lineage dataset, or a validated physiological simulation. Some structures are omitted, and sizes in component layouts are adjusted for inspection. Days after fertilization are used early; later labels use pregnancy weeks. See the anatomy matrix and in-app About panel for details.

## Hosting

Original hosting URL: https://embryo-explorer-lumen.eigen-labs-4536.chatgpt.site/

Live custom domain: https://embryoexplorer.com/

This repository is a private source backup. Pushing here does not automatically publish to Sites. The original project commit history is preserved.
