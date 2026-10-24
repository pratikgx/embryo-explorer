## Borderless anatomy field — October 24

- Reviewed the supplied 38.6-second Human Atlas reference at four-second intervals, covering assembly, the spread of parts, selection, isolation, and system visibility. No reference geometry or visual assets were copied.
- Removed card surfaces and overview paragraphs. Retained small age labels and contextual names on hover/focus. Days remain in the first row, pregnancy weeks afterward.
- Verified all 16 loaded stage previews in Assembled, Separate, and All parts; All parts contains 113 direct structure targets.
- Dragging a stage changes its rendered orientation without opening inspection. Reset clears stored orientations. Click and keyboard activation still open inspection.
- Confirmed Week 24 heart selection, its stage-specific information, and return to the overview.
- Checked compact 543 × 724 layout: no bordered stage containers or off-screen stages. Header actions and bottom mode controls remain separate.
- Syntax checks and diff whitespace checks passed; no browser warnings or errors observed.

## Centered stage inspection and date labels — October 24

- First four cards retain Day 1, 3, 5, 10 after fertilization. Row two displays pregnancy Week 4 (+3 days), Week 5 (+3 days), Week 7, Week 10; later rows remain pregnancy weeks. Underlying snapshot dates and geometry are unchanged.
- At 1280 × 720 the inspection panel is centered at (640, 360). Header, overview, and decorative environment are hidden while open.
- Checked the centered view in the compact 543px preview, including stage notes and date precision.
- All parts selection displays the selected structure and its explanation. Escape and the close button restore the overview, mode, and focus. Shift+Tab from Close stays inside the inspection view.
- JavaScript syntax and whitespace checks passed. No browser warnings or errors observed.

# Verification — complete development overview



## Overview checks

- Verified all 16 cards and their loaded 3D previews in each global mode: Assembled, Separate and All parts (48 previews). All parts exposes 113 stage-specific structure buttons across the collection.
- Opened all sixteen stages by keyboard Enter from the overview. Each inspection panel showed the correct stage, All parts mode and nonempty stage explanation.
- Selected the Week 24 heart directly from its card; checked the matching stage-specific explanation. Changed the mode from inside the inspection panel and verified that the overview and inspector both switched to Separate.
- Escape closed inspection and returned focus to the selected stage. The overview remained in place. Opening and closing the compact-screen inspector was also checked.
- At 1280 × 720, all sixteen stages and their short notes fit in one overview. At 543 × 724, all sixteen stage cards fit, with complete notes shown on selection. Checked the compact inspector’s mode controls and Week 40 nervous-system information.
- Journey playback, pause and seeking to the Week 24 collection worked. Exiting restored the previous stage and overview mode. The 60-second choreography and downloadable video content remain unchanged.
- The stage-level browsing timeline is hidden; the optional film retains its playback scrubber. Very narrow or short layouts intentionally scroll to preserve readability.

## Earlier journey update

- Cord and placenta default to checked and rendered at all ten modeled support stages (Day 35 through Week 40). Captured and reviewed each stage for attachment and framing. The cord starts slightly inside a ray-sampled point on each body surface and terminates inside the simplified placental disc.
- Hiding support at Week 40 remained hidden at Week 12. Starting the guide showed support in the late-stage shot; exiting restored the hidden choice. Reset restored checked and visible support.
- The shared story module totals exactly 60 seconds over 16 stages. Its 18 caption windows each provide at least three seconds and contain 10–18 words. Automated checks verify time boundaries, caption lengths, and that every named inspection target exists at its stage.
- Browser seek checks sampled every caption window. Stage metadata and timeline values agreed with the selected shot. The collection explanation and heart inspection each appeared in the intended Week 24 segment.
- The 3D scene uses the upper 900 pixels of a 1920 × 1080 export; the bottom 180 pixels are reserved for one caption and the progress indicator. A screen-reader status mirrors the active explanation. Physical assistive-technology testing remains outstanding.
- Manual visibility choices are held separately from guide visibility, including entry from the All parts view. The guide does not retain changes to a visitor’s hidden-layer set.

- Reviewed the complete 60-second sequence through two-second frame samples plus full-resolution views. The refreshed H.264 export is 1920 × 1080 at 30 fps; all 1,800 frames decode successfully. Browser recording completed with no errors or warnings.

- On the 543-pixel-wide preview, anatomy controls initially overlapped the placenta. Added a compact Anatomy toggle below 620 pixels; checked opening, visibility changes, and closing. The assembled view now keeps the complete arrangement clear. This responsive change does not alter the exported film.

## Previous refinement checks

- All 16 stages selected in All parts. Loaded anatomy, stage selector, slider and collection item counts matched: 3, 2, 2, 5, 5, 6, then 9 structures for each remaining stage. Captured and reviewed the complete contact sheet.
- All nine later-stage structures activated by keyboard Enter, with the matching inspection title and description; each returned to the collection.
- Isolated heart selection retained across Week 40 → Body folding, with the looping-tube description. Moving to Blastocyst cleared the absent selection and returned to the collection.
- Timeline Home and ArrowRight selected stages 0 and 1. The stage selector remained usable in inspection and collection modes.
- Compared pregnancy weeks 12, 24 and 40 from front, profile and three-quarter views, with a closer near-term inspection. Eyelid and mouth lines are sampled from the generated surface rather than floating geometry.
- Corrected an invisible floor that still wrote depth and clipped the bottom collection row. Early disc-shaped tissues are tilted in the collection so their surfaces are visible.
- All eleven outer surfaces have finite coordinates, valid indices, normalized normals, one connected component and distinct hashes. Eight regenerated fetal surfaces contain 84,806–92,213 vertices; their detail metadata is finite.
- A physical touch-device and screen-reader audit was not performed. Click/tap targets and native keyboard buttons are implemented; desktop keyboard operation was checked.

- Recorded the complete 90-second journey at 1920 × 1080, converted to H.264 MP4, and reviewed the contact sheet plus full-resolution near-term and collection frames. The updated sequence includes the collection and heart inspection at week 24.
- Corrected stale-frame behavior during paused scrubbing and smoothed the camera transition into and out of the collection. The final capture reported saved; the browser reported no errors or warnings.

## Earlier prenatal checks

- All 16 stages selected in order through the live browser. The selected stage, slider value, loaded model and anatomy controls matched for every stop.
- All 16 stages selected in reverse with separation at 100%; the loaded model and separation state remained synchronized.
- Visually reviewed assembled and separated contact sheets. Reviewed the late fetal surface from front, side and rear; corrected detached-looking eyelid details found in the first front-angle pass.
- Body folding selected by button/menu; keyboard Home and ArrowRight moved the timeline to stages 0 and 1. Rapid alternating selections ended at the requested Body folding stage with a ready model.
- Heart isolation persisted from Body folding to Late embryo with an updated description. Selecting Blastocyst cleared the unavailable heart selection and isolation state.
- Journey starts and pauses. Exiting playback releases the view; selecting Body folding afterward stays under manual control.
- Browser console had no errors or warnings during the interaction checks.
- JavaScript modules pass syntax checks.
- Generated body buffers contain finite coordinates and valid indices. All eleven generated outer surfaces are connected meshes; their geometry differs by stage.
- Reviewed desktop layouts at 1280px and the narrower 836px preview width. No mobile device or screen-reader session was available for a full device audit.

## Original timeline report

The old Body plan button and drag slider responded during reproduction. The old code used a tiny track, hard-coded three stages and closely similar forms. A completely dead control was not reproduced. The replacement uses a larger hit target, 16-stage metadata, shared selection state, keyboard support and stage-specific anatomy. Manual selection takes over from playback.

## Scientific and visual limits

The research matrix is implemented as schematic geometry. Embryonic/fetal shapes, brain surface folds, respiratory branching, cardiac chambers/vessels, bowel arrangement, cartilage/bone and extraembryonic context are simplified. Some systems and microscopic structures are omitted. The model does not reconstruct one individual, measure cell lineages or simulate physiology. Surface folds are not named sulci. The late fetal eyelids are depicted closed, a possible pose even after they can open. Reference size ranges are contextual, not measurements of the meshes. Specialist anatomical review remains outstanding.

## Motion and export

Pointer movement gently shifts environmental light fields, light position and model orientation. Dragging suppresses pointer parallax; touch and reduced-motion settings suppress it. The demo is explicit user-initiated motion. Film export uses the same models at 1920 × 1080; browser recording quality depends on runtime performance. Export and public delivery are checked separately before handoff.
