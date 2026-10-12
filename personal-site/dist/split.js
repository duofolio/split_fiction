'use strict';
(() => {
  const stage = document.querySelector('.split-home');
  const portal = document.querySelector('.portal');
  const frame = portal.querySelector('iframe');
  const status = document.querySelector('.transition-status');
  const links = { yuan: document.querySelector('.world-yuan'), bob: document.querySelector('.world-bob') };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  let target = 0;
  let progress = 0;
  let animation = 0;
  let settleTimer = 0;
  let ready = false;
  let navigating = false;
  let lastTime = 0;
  let touch = null;
  let draggedUntil = 0;
  document.body.classList.add('gesture-home');

  // Expand the selected diagonal half into a full viewport.
  function polygon(person, amount) {
    const mobile = matchMedia('(max-width: 540px)').matches;
    const start = mobile
      ? (person === 'yuan' ? [[0,0],[100,0],[100,25],[0,75]] : [[0,75],[100,25],[100,100],[0,100]])
      : (person === 'yuan' ? [[0,0],[84,0],[16,100],[0,100]] : [[84,0],[100,0],[100,100],[16,100]]);
    const end = [[0,0],[100,0],[100,100],[0,100]];
    return `polygon(${start.map((point,i) => `${point[0] + (end[i][0] - point[0]) * amount}% ${point[1] + (end[i][1] - point[1]) * amount}%`).join(',')})`;
  }
  function draw() {
    if (!active) return;
    const clip = polygon(active, progress);
    stage.style.setProperty('--reveal', progress);
    links[active].style.clipPath = clip;
    portal.style.clipPath = clip;
    portal.style.opacity = ready ? Math.min(1, progress * 1.7) : 0;
    frame.style.transform = reduceMotion.matches ? 'none' : `scale(${1.035 - progress * .035})`;
  }
  function reset() {
    clearTimeout(settleTimer);
    cancelAnimationFrame(animation);
    for (const link of Object.values(links)) { link.style.clipPath = ''; link.classList.remove('expanding'); }
    stage.style.removeProperty('--reveal');
    stage.classList.remove('transitioning');
    portal.hidden = true;
    portal.style.opacity = 0;
    active = null; target = 0; progress = 0; animation = 0; lastTime = 0; navigating = false;
    status.textContent = '';
  }
  function finish() {
    if (navigating || !active) return;
    navigating = true;
    location.assign(links[active].href);
  }
  function animate(time) {
    const elapsed = lastTime ? Math.min(time - lastTime, 40) : 16;
    lastTime = time;
    progress += (target - progress) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - progress) < .002) progress = target;
    draw();
    if (progress === 1) { finish(); animation = 0; return; }
    if (progress === 0 && target === 0) { reset(); return; }
    if (progress !== target) animation = requestAnimationFrame(animate);
    else { animation = 0; lastTime = 0; }
  }
  function schedule() { if (!animation) animation = requestAnimationFrame(animate); }
  function begin(person) {
    if (active === person) return;
    if (active) reset();
    active = person;
    ready = false;
    portal.hidden = false;
    portal.style.background = person === 'yuan' ? '#f5f3ec' : '#262c2a';
    stage.classList.add('transitioning');
    links[person].classList.add('expanding');
    frame.src = links[person].href;
    status.textContent = `正在展开 ${person === 'yuan' ? 'yuan chao' : 'King bob'} 的主页，按 Escape 返回。`;
    draw();
  }
  frame.addEventListener('load', () => { ready = true; draw(); });
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      target = target >= .22 ? 1 : 0;
      schedule();
    }, 220);
  }
  function advance(delta) {
    if (navigating || Math.abs(delta) < 1) return;
    const person = delta < 0 ? 'yuan' : 'bob';
    if (!active) begin(person);
    // Reversing the gesture rewinds the current transition before switching sides.
    const step = Math.min(Math.abs(delta), 100) / 480;
    target = Math.max(0, Math.min(1, target + (active === person ? step : -step)));
    if (reduceMotion.matches && target >= .22) { finish(); return; }
    schedule();
    settle();
  }
  window.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    const factor = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    advance(event.deltaY * factor);
  }, {passive:false});
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touch = null; return; }
    touch = { x:event.touches[0].clientX, y:event.touches[0].clientY, lastY:event.touches[0].clientY, dragging:false };
  }, {passive:true});
  stage.addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) return;
    const finger = event.touches[0];
    if (!touch.dragging) {
      if (Math.abs(finger.clientY - touch.y) < 12 || Math.abs(finger.clientX - touch.x) > Math.abs(finger.clientY - touch.y)) return;
      touch.dragging = true;
    }
    event.preventDefault();
    advance((finger.clientY - touch.lastY) * 1.8);
    clearTimeout(settleTimer);
    touch.lastY = finger.clientY;
  }, {passive:false});
  const endTouch = () => { if (touch?.dragging) { draggedUntil = Date.now() + 500; settle(); } touch = null; };
  stage.addEventListener('touchend', endTouch);
  stage.addEventListener('touchcancel', () => { touch = null; target = 0; schedule(); });
  window.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') { clearTimeout(settleTimer); target = 0; schedule(); }
    if (['ArrowUp','PageUp','ArrowDown','PageDown'].includes(event.key)) {
      event.preventDefault(); advance(['ArrowUp','PageUp'].includes(event.key) ? -80 : 80);
    }
  });
  for (const [person,link] of Object.entries(links)) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      if (Date.now() < draggedUntil || navigating) return;
      if (reduceMotion.matches) { location.assign(link.href); return; }
      clearTimeout(settleTimer); begin(person); target = 1; schedule();
    });
  }
  window.addEventListener('resize', draw);
  window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
})();
