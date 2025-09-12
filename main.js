// Smooth scroll for the little down-arrow
document.querySelectorAll('[data-scroll-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = btn.getAttribute('data-scroll-target');
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Hero video: respect prefers-reduced-motion and autoplay policies
(function(){
  const video = document.getElementById('heroVideo');
  if (!video) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    // Don’t autoplay for users who prefer less motion
    video.pause();
    return;
  }

  // Try to play; some browsers block until user interacts if not muted, so we ensure muted
  video.muted = true;
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(() => {
      // If autoplay fails, we just leave the poster image
    });
  }
})();

// Smooth scroll for in-page anchors (respects scroll-margin-top in CSS)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Stronger parallax background position for the hero image
(function () {
  const hero = document.getElementById('hero');
  const bg   = hero?.querySelector('.hero__bg');      // or .hero__image if you use <img>
  if (!hero || !bg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const START = 15;   // starting Y%
  const END   = 82;   // bigger range -> more visible motion (try 78–88)
  const SPEED = 1.9;  // higher = completes sooner (1.0 = original feel)

  let ticking = false;
  const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      // amount of the hero that has scrolled past the top of the viewport (px)
      const scrolled = Math.max(0, -rect.top);

      // progress reaches 1.0 faster thanks to SPEED
      const progress = clamp(scrolled / (rect.height / SPEED), 0, 1);

      const y = START + (END - START) * progress;
      bg.style.setProperty('--bgY', `${y}%`);  // if using <img>, use --imgY instead
      ticking = false;
    });
  }

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();

