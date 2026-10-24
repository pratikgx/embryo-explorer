# Verification — human prenatal edition

## Passed

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
