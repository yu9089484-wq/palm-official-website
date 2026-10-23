/* Every service stays visible in the phone list and desktop grid. */
(() => {
  const track = document.querySelector('#service-bubbles');
  const controls = document.querySelector('.service-bubble-controls');
  if (controls) controls.hidden = true;
  if (track) track.removeAttribute('tabindex');
})();
