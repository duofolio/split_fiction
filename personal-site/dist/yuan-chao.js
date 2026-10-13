'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // An iframe preview should match the final page rather than restart its reveal.
  if (reduced.matches || window.self !== window.top || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion-ready');
  let fromHomepage = false;
  try {
    const referrer = new URL(document.referrer);
    fromHomepage = referrer.origin === location.origin && /\/(?:index\.html)?$/.test(referrer.pathname);
  } catch {}
  if (!fromHomepage) document.documentElement.classList.add('intro-motion');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, {threshold:.08, rootMargin:'0px 0px -25px 0px'});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  const art = document.querySelector('.hero-art');
  let pending = false;
  function draw() {
    pending = false;
    if (reduced.matches) { art.style.removeProperty('--art-progress'); return; }
    const progress = Math.min(1, Math.max(0, window.scrollY / innerHeight));
    art.style.setProperty('--art-progress', progress.toFixed(4));
  }
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(draw); }
  }, {passive:true});
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      document.documentElement.classList.remove('motion-ready', 'intro-motion');
      observer.disconnect();
      draw();
    }
  });
  draw();
})();
