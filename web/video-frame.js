(() => {
  'use strict';
  const video = document.getElementById('palm-video');
  const frame = video?.closest('.palm-video-frame');
  if (!video || !frame) return;
  const player = frame.querySelector('.video-frame-player');
  const controls = frame.querySelector('.video-frame-controls');
  const toggle = frame.querySelector('.video-toggle');
  const sound = frame.querySelector('.video-sound');
  const seek = frame.querySelector('.video-seek');
  const fullscreen = frame.querySelector('.video-fullscreen');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let userPaused = false;
  let userStarted = false;
  let pendingPlay = false;

  video.muted = true;
  video.defaultMuted = true;
  controls.hidden = false;
  const setLabel = (button, text) => {
    button.setAttribute('aria-label', text);
    button.title = text;
  };
  const syncControls = () => {
    frame.classList.toggle('is-playing', !video.paused);
    frame.classList.toggle('has-sound', !video.muted);
    setLabel(toggle, video.paused ? 'Play video' : 'Pause video');
    setLabel(sound, video.muted ? 'Turn sound on' : 'Mute video');
    sound.setAttribute('aria-pressed', String(!video.muted));
  };
  const shouldPlay = () => inView && !document.hidden && !userPaused && (!reduced.matches || userStarted);
  const play = async () => {
    if (pendingPlay || !shouldPlay()) return;
    pendingPlay = true;
    try {
      await video.play();
      // Do not start offscreen playback if the visitor scrolls away while loading.
      if (!shouldPlay()) video.pause();
    } catch {
      // Power-saving browsers may require a tap; the external play button remains available.
    } finally {
      pendingPlay = false;
      syncControls();
    }
  };
  const syncPlayback = () => shouldPlay() ? play() : video.pause();
  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    if (!userPaused) { userStarted = true; inView = true; }
    syncPlayback();
  });
  sound.addEventListener('click', () => { video.muted = !video.muted; });
  seek.addEventListener('input', () => {
    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Number(seek.value) / 100 * video.duration;
  });
  const syncProgress = () => {
    const progress = Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration * 100 : 0;
    seek.value = progress;
    seek.style.setProperty('--video-progress', `${progress}%`);
    const seconds = Math.floor(video.currentTime || 0);
    seek.setAttribute('aria-valuetext', `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
  };
  ['play', 'pause', 'volumechange'].forEach((event) => video.addEventListener(event, syncControls));
  ['timeupdate', 'loadedmetadata', 'emptied'].forEach((event) => video.addEventListener(event, syncProgress));
  fullscreen.hidden = !player.requestFullscreen && !video.webkitEnterFullscreen;
  fullscreen.addEventListener('click', async () => {
    try {
      if (player.requestFullscreen) await player.requestFullscreen();
      else video.webkitEnterFullscreen();
    } catch { /* Inline playback remains available when fullscreen is denied. */ }
  });
  // Keep native controls confined to the dedicated fullscreen player.
  document.addEventListener('fullscreenchange', () => { video.controls = document.fullscreenElement === player; });
  video.addEventListener('webkitendfullscreen', () => { video.controls = false; });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= .15;
      document.body.classList.toggle('palm-film-in-view', inView);
      syncPlayback();
    }, { threshold: [0, .15] });
    observer.observe(player);
  } else { inView = true; syncPlayback(); }
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => video.pause());
  window.addEventListener('pageshow', syncPlayback);
  reduced.addEventListener('change', syncPlayback);
  syncControls();
  syncProgress();
})();
