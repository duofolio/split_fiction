'use strict';
(() => {
  const stage = document.querySelector('.split-home');
  const portal = document.querySelector('.portal');
  const previews = Object.fromEntries([...portal.querySelectorAll('iframe')].map(frame => [frame.dataset.person, { frame, ready:false, started:false }]));
  const status = document.querySelector('.transition-status');
  const links = { yuan: document.querySelector('.world-yuan'), bob: document.querySelector('.world-bob') };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const commitThreshold = .18;
  let active = null;
  let target = 0;
  let progress = 0;
  let animation = 0;
  let settleTimer = 0;
  let previewOpacity = 0;
  let completionTimer = 0;
  let navigating = false;
  let lastTime = 0;
  let touch = null;
  let draggedUntil = 0;
  document.body.classList.add('gesture-home');
  const smoothstep = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
  function prepare(person) {
    const preview = previews[person];
    if (preview.started) return;
    preview.started = true;
    preview.frame.src = links[person].href;
  }
  for (const [person,preview] of Object.entries(previews)) {
    preview.frame.addEventListener('load', () => {
      if (!preview.started) return;
      preview.ready = true;
      if (active === person) schedule();
    });
    links[person].addEventListener('pointerenter', () => prepare(person));
    links[person].addEventListener('focus', () => prepare(person));
  }
  // Keep both previews warm so reversing or re-entering never reloads a frame.
  if (!reduceMotion.matches) {
    const warm = () => { prepare('yuan'); prepare('bob'); };
    if ('requestIdleCallback' in window) requestIdleCallback(warm, {timeout:1500});
    else setTimeout(warm, 800);
  }

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
    stage.style.setProperty('--content-fade', Math.max(smoothstep(progress * .85), previewOpacity));
    links[active].style.clipPath = clip;
    portal.style.clipPath = clip;
    portal.style.opacity = previewOpacity;
    const frame = previews[active].frame;
    const offset = (active === 'yuan' ? -1 : 1) * (1 - progress) * 14;
    frame.style.transform = reduceMotion.matches ? 'none' : `translateY(${offset}px) scale(${1.018 - progress * .018})`;
  }
  function reset() {
    clearTimeout(settleTimer);
    clearTimeout(completionTimer);
    cancelAnimationFrame(animation);
    for (const link of Object.values(links)) { link.style.clipPath = ''; link.classList.remove('expanding'); }
    stage.style.removeProperty('--reveal');
    stage.style.removeProperty('--content-fade');
    stage.classList.remove('transitioning');
    portal.hidden = true;
    portal.style.opacity = 0;
    active = null; target = 0; progress = 0; previewOpacity = 0; animation = 0; lastTime = 0; navigating = false; completionTimer = 0;
    status.textContent = '';
  }
  function finish() {
    if (navigating || !active) return;
    clearTimeout(completionTimer);
    navigating = true;
    location.assign(links[active].href);
  }
  function animate(time) {
    if (!active) { animation = 0; return; }
    const elapsed = lastTime ? Math.min(time - lastTime, 40) : 16;
    lastTime = time;
    progress += (target - progress) * (1 - Math.exp(-elapsed / 65));
    if (Math.abs(target - progress) < .004) progress = target;
    const opacityTarget = previews[active].ready ? smoothstep((progress - .08) / .72) : 0;
    previewOpacity += (opacityTarget - previewOpacity) * (1 - Math.exp(-elapsed / 90));
    if (Math.abs(opacityTarget - previewOpacity) < .004) previewOpacity = opacityTarget;
    draw();
    if (progress === 1) {
      if (previewOpacity === 1) { finish(); animation = 0; return; }
      // A slow or unavailable preview must never trap the visitor on the homepage.
      if (!completionTimer) completionTimer = setTimeout(finish, 900);
    }
    if (progress === 0 && target === 0) { reset(); return; }
    if (progress !== target || previewOpacity !== opacityTarget) animation = requestAnimationFrame(animate);
    else { animation = 0; lastTime = 0; }
  }
  function schedule() { if (active && !animation) animation = requestAnimationFrame(animate); }
  function begin(person) {
    if (active === person) return;
    if (active) reset();
    active = person;
    portal.hidden = false;
    portal.style.background = '#f5f3ec';
    for (const [name,preview] of Object.entries(previews)) preview.frame.hidden = name !== person;
    stage.classList.add('transitioning');
    links[person].classList.add('expanding');
    prepare(person);
    status.textContent = `正在展开 ${person === 'yuan' ? 'yuan chao' : 'KingBob34'} 的主页，按 Escape 返回。`;
    draw();
  }
  function settle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      target = target >= commitThreshold ? 1 : 0;
      schedule();
    }, 220);
  }
  function advance(delta) {
    if (navigating || Math.abs(delta) < 1) return;
    clearTimeout(completionTimer); completionTimer = 0;
    const person = delta < 0 ? 'yuan' : 'bob';
    if (!active) begin(person);
    // Reversing the gesture rewinds the current transition before switching sides.
    const step = Math.min(Math.abs(delta), 100) / 480;
    target = Math.max(0, Math.min(1, target + (active === person ? step : -step)));
    if (reduceMotion.matches && target >= commitThreshold) { finish(); return; }
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
    if (event.touches.length !== 1) { touch = null; target = 0; clearTimeout(settleTimer); if (active) schedule(); return; }
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
    if (event.key === 'Escape' && active) { clearTimeout(settleTimer); clearTimeout(completionTimer); completionTimer = 0; target = 0; schedule(); }
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
