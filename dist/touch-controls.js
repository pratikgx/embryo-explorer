export function bindExplorationSlider(slider, request) {
  let pointer = null;
  const update = event => {
    const rect = slider.getBoundingClientRect();
    const inset = 14;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left - inset) / Math.max(1, rect.width - inset * 2)));
    const value = Number(slider.min) + ratio * (Number(slider.max) - Number(slider.min));
    slider.value = request(Math.round(value)) ?? value;
  };
  slider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer !== null) return;
    event.preventDefault();
    pointer = event.pointerId;
    slider.focus({preventScroll: true});
    slider.setPointerCapture(pointer);
    update(event);
  });
  slider.addEventListener('pointermove', event => {
    if (event.pointerId === pointer) { event.preventDefault(); update(event); }
  });
  const end = event => {
    if (event.pointerId !== pointer) return;
    if (event.type === 'pointerup') update(event);
    if (slider.hasPointerCapture(pointer)) slider.releasePointerCapture(pointer);
    pointer = null;
  };
  slider.addEventListener('pointerup', end);
  slider.addEventListener('pointercancel', end);
  slider.addEventListener('lostpointercapture', () => { pointer = null; });
  slider.addEventListener('input', () => { slider.value = request(Number(slider.value)) ?? slider.value; });
}
