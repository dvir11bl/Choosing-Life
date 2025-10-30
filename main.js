// Smooth scroll for the little down-arrow (hero scroll button)
document.querySelectorAll('[data-scroll-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = btn.getAttribute('data-scroll-target');
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Removed unused hero video autoplay handler (no #heroVideo in markup)

// Smooth scroll for in-page anchors
// Slower custom scroll for links pointing to #contact
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();

    // Smooth scroll with sticky-header offset for all anchors
    const header = document.querySelector('.site-header');
    const headerOffset = header ? header.offsetHeight : 0;
    const startY = window.pageYOffset;
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.pageYOffset - headerOffset; // account for sticky header
    const duration = (id === '#contact') ? 1600 : 700; // slower for the primary CTA
    const startTime = performance.now();

    const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;

    function step(now){
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);
      const y = startY + (targetY - startY) * eased;
      window.scrollTo(0, y);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
});

// Mobile nav toggle (hamburger)
(function(){
  const toggle = document.querySelector('.nav__toggle');
  const menu   = document.getElementById('siteMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Close menu after clicking a link
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
})();

// Stronger parallax background position for the hero image
(function () {
  const hero = document.getElementById('hero');
  const bg   = hero?.querySelector('.hero__bg');      // or .hero__image if you use <img>
  if (!hero || !bg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen = window.matchMedia('(max-width: 640px)').matches;
  if (prefersReduced || smallScreen) return;

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

// Success stories carousel (Swiper)
new Swiper('.success-swiper', {
  slidesPerView: 1,
  spaceBetween: 0,
  centeredSlides: false,

  // 🔁 circular navigation
  loop: true,

  speed: 900,

  // ⏱ autoplay, pause on hover, move in RTL direction
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
    reverseDirection: true,  // 🔄 moves “right to left”
  },

  navigation: {
    nextEl: '.success-swiper .swiper-button-next',
    prevEl: '.success-swiper .swiper-button-prev',
  },
  pagination: {
    el: '.success-swiper .swiper-pagination',
    clickable: true,
  },

  // 📐 respect container RTL (usually auto-detected, but we can be explicit)
  rtlTranslate: true,
});

// Enhance success stories: add avatar + stacked subtitle under name
(function(){
  const cards = document.querySelectorAll('#success .story-card');
  if (!cards.length) return;
  cards.forEach(card => {
    const title = card.querySelector('.story__title');
    const subtitle = card.querySelector('.story__subtitle');
    if (!title || !subtitle) return;

    // Create header wrapper
    const header = document.createElement('div');
    header.className = 'story__header';

    // Use existing avatar tag if present, otherwise create a default one
    let img = card.querySelector('.story__avatar');
    if (!img) {
      img = document.createElement('img');
      img.className = 'story__avatar';
      img.src = 'assets/media/avatar-default.svg';
      img.alt = `Photo of ${title.textContent?.trim() || 'storyteller'}`;
    }

    // Meta container and move existing nodes inside
    const meta = document.createElement('div');
    meta.className = 'story__meta';

    // Insert header before the current title, then move nodes into meta
    card.insertBefore(header, title);
    meta.appendChild(title);
    meta.appendChild(subtitle);
    header.appendChild(img);
    header.appendChild(meta);
  });
})();

// Contact form: POST JSON to /api/contact
(function(){
  const form = document.getElementById('contactForm');
  if (!form) return;
  const statusEl = document.getElementById('contactFormStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const actions = form.querySelector('.form__actions');
    const submitBtn = actions?.querySelector('button');
    const originalText = submitBtn?.textContent;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'שולחים…'; }
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }

    // Collect fields
    const payload = {
      name: (form.querySelector('#name')?.value || '').trim(),
      phone: (form.querySelector('#phone')?.value || '').trim(),
      email: (form.querySelector('#email')?.value || '').trim(),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Request failed');
      if (statusEl) {
        statusEl.textContent = 'תודה! קיבלנו את הבקשה — אנחנו על זה!';
      }
      // Reveal success overlay and fade out form content while keeping size
      const overlay = form.querySelector('.form__success');
      const overlayText = form.querySelector('.form__success-text');
      const actions = form.querySelector('.form__actions');
      if (overlay) {
        overlay.removeAttribute('aria-hidden');
        overlay.focus?.();
      }
      if (overlayText) {
        overlayText.textContent = 'תודה! קיבלנו את הפנייה — אנחנו על זה.';
      }
      if (submitBtn) submitBtn.classList.add('is-hidden');
      if (actions) actions.classList.add('submitted');
      form.classList.add('submitted');
      form.reset();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'אופס — לא הצלחנו לשלוח. נסו שוב.';
        statusEl.style.color = '#DC2626';
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; if (originalText) submitBtn.textContent = originalText; }
    }
  });
})();

// Interactive feature cards: "side zoom" based on entry corner only
(function(){
  // Skip on devices that don't support hover (touch) to avoid odd effects
  if (!window.matchMedia('(hover: hover)').matches) return;
  const cards = document.querySelectorAll('.feature-card');
  if (!cards.length) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  cards.forEach(card => {
    function originFromEvent(e){
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // Distances squared to each corner
      const dTL = x*x + y*y;
      const dTR = (r.width - x)*(r.width - x) + y*y;
      const dBL = x*x + (r.height - y)*(r.height - y);
      const dBR = (r.width - x)*(r.width - x) + (r.height - y)*(r.height - y);
      const min = Math.min(dTL, dTR, dBL, dBR);
      if (min === dTL) return ['0%','0%'];
      if (min === dTR) return ['100%','0%'];
      if (min === dBL) return ['0%','100%'];
      return ['100%','100%'];
    }

    let entered = false;
    let ox = '50%';
    let oy = '50%';

    card.addEventListener('mouseenter', (e) => {
      entered = true;
      [ox, oy] = originFromEvent(e);
      card.style.transformOrigin = `${ox} ${oy}`;
      card.style.transform = 'scale(1.05)';
    });

    // Mouse move inside does not change origin; keep steady zoom
    card.addEventListener('mousemove', () => {
      if (!entered) return;
      // Maintain set transform (CSS transition keeps it smooth)
      card.style.transformOrigin = `${ox} ${oy}`;
      card.style.transform = 'scale(1.05)';
    });

    card.addEventListener('mouseleave', () => {
      entered = false;
      card.style.transformOrigin = '';
      card.style.transform = '';
    });
  });
})();
