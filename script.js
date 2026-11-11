(() => {
  const stage = document.querySelector('.stage');
  const book = document.querySelector('.book');
  const pages = [...document.querySelectorAll('.page')];
  const counter = document.getElementById('counter');
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  const labels = ['મંગલ આમંત્રણ', 'શુભ સંદેશ', 'માંગલિક પ્રસંગો', 'લગ્નવિધિ', 'સ્નેહબંધન'];
  const whatsappShare = document.getElementById('whatsappShare');
  const FLIP_MS = 1000;     // tap / button / keyboard
  const RELEASE_MS = 600;   // after letting go of a drag
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isZoomed = () => !!window.visualViewport && window.visualViewport.scale > 1.05;
  let current = 0;
  let lastMs = -1;
  let turnTimer = 0;

  /* shading layer inside every page */
  pages.forEach(p => {
    const s = document.createElement('span');
    s.className = 'page-shade';
    s.setAttribute('aria-hidden', 'true');
    p.appendChild(s);
  });

  document.querySelectorAll('.book img').forEach(img => { img.decoding = 'async'; });

  if (whatsappShare) {
    const inviteText = 'તિરથ અને પૂર્વાશાના શુભ વિવાહ પ્રસંગે આપને સહકુટુંબ પધારવાનું ભાવભર્યું આમંત્રણ. 💐\nલગ્ન: રવિવાર, ૨૮ ફેબ્રુઆરી ૨૦૨૭ · અમરેલી\nઆમંત્રણ અને સ્થળની વિગતો: ' + window.location.href;
    whatsappShare.href = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
  }

  function render(ms = FLIP_MS) {
    const dur = reduceMotion ? 1 : ms;
    if (dur !== lastMs) { book.style.setProperty('--flip-ms', dur + 'ms'); lastMs = dur; }
    book.classList.add('turning'); // promotes layers + pauses decorative loops only while turning
    window.clearTimeout(turnTimer);
    turnTimer = window.setTimeout(() => book.classList.remove('turning'), dur + 120);
    stage.classList.toggle('reading', current > 0);
    stage.classList.toggle('zoomable', current >= 2);
    if (current >= 2) startTip();
    pages.forEach((page, i) => {
      const flipped = i < current;
      page.classList.toggle('flipped', flipped);
      page.classList.toggle('is-active', i === current);
      page.classList.toggle('is-next', i === current + 1);
      page.classList.toggle('is-prev', i === current - 1);
      page.classList.toggle('is-far', i > current + 1);
      /* a turning page always stays above the rest until it finishes */
      page.style.zIndex = flipped ? String(50 + i) : String(30 - i);
      page.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      if ('inert' in page) page.inert = i !== current;
    });
    const activeContent = pages[current]?.querySelector('.page-inner');
    if (activeContent) activeContent.scrollTo({ top: 0, behavior: 'instant' });
    counter.textContent = current === 0 ? 'આમંત્રણ ખોલવા ટૅપ કરો' : `${labels[current - 1]} · ${current}/${pages.length - 1}`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === pages.length - 1;
  }
  function go(d, ms) {
    const n = current + d;
    if (n < 0 || n >= pages.length) return;
    current = n;
    render(ms);
  }
  const next = () => go(1);
  const prev = () => go(-1);

  document.getElementById('welcomeOpen')?.addEventListener('click', e => {
    e.stopPropagation();
    next();
  });
  prevButton.addEventListener('click', prev);
  nextButton.addEventListener('click', next);
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  /* ---------- drag-to-turn: the page follows your finger ---------- */
  const shades = pages.map(p => p.querySelector('.page-shade'));
  const drag = { ok: false, locked: false, x0: 0, y0: 0, t0: 0, dir: 0, p: 0, w: 1, raf: 0 };
  let suppressClick = false;
  const suppress = () => {
    suppressClick = true;
    window.setTimeout(() => { suppressClick = false; }, 350);
  };
  const turnCss = deg => `perspective(2400px) rotateY(${deg}deg)`;
  function setPage(i, deg, shade) {
    if (deg !== null) pages[i].style.transform = turnCss(deg);
    shades[i].style.opacity = shade;
  }
  function clearDrag() {
    pages.forEach((pg, i) => {
      pg.style.removeProperty('transform');
      pg.style.removeProperty('visibility');
      shades[i].style.removeProperty('opacity');
    });
  }
  /* one style write per frame, never per touch event */
  function paintDrag() {
    drag.raf = 0;
    const p = drag.p;
    if (drag.dir === 1) {
      setPage(current, -90 * p, p);
      setPage(current + 1, null, 1 - p);
    } else {
      pages[current - 1].style.visibility = 'visible';
      setPage(current - 1, -90 * (1 - p), 1 - p);
      setPage(current, null, p);
    }
  }
  function endDrag(commit) {
    window.cancelAnimationFrame(drag.raf);
    drag.raf = 0;
    book.classList.remove('dragging');
    clearDrag();
    const dir = drag.dir;
    drag.ok = drag.locked = false;
    suppress();
    if (commit) go(dir, RELEASE_MS);
    else render(RELEASE_MS);
  }

  book.addEventListener('touchstart', e => {
    drag.ok = e.touches.length === 1 && !isZoomed() && !e.target.closest('.zoom-ctrl');
    drag.locked = false;
    drag.x0 = e.touches[0].clientX;
    drag.y0 = e.touches[0].clientY;
    drag.t0 = Date.now();
    drag.p = 0;
    drag.w = (book.clientWidth || 1) * 0.85; // measured once, not on every move
  }, { passive: true });

  book.addEventListener('touchmove', e => {
    if (!drag.ok) return;
    if (e.touches.length > 1 || isZoomed()) {
      if (drag.locked) endDrag(false);
      drag.ok = false;
      return;
    }
    const t = e.touches[0];
    const dx = t.clientX - drag.x0;
    const dy = t.clientY - drag.y0;
    if (!drag.locked) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag.ok = false; return; } // vertical scroll
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        drag.dir = dx < 0 ? 1 : -1;
        if ((drag.dir === 1 && current >= pages.length - 1) || (drag.dir === -1 && current <= 0)) {
          drag.ok = false;
          return;
        }
        drag.locked = true;
        book.classList.add('dragging', 'turning');
        window.clearTimeout(turnTimer);
      } else return;
    }
    drag.p = clamp((drag.dir === 1 ? -dx : dx) / drag.w, 0, 1);
    if (!drag.raf) drag.raf = window.requestAnimationFrame(paintDrag);
  }, { passive: true });

  book.addEventListener('touchend', e => {
    if (!drag.locked) { drag.ok = false; return; }
    const dt = Math.max(1, Date.now() - drag.t0);
    const v = Math.abs(e.changedTouches[0].clientX - drag.x0) / dt;
    endDrag(drag.p > 0.3 || (v > 0.5 && drag.p > 0.05));
  }, { passive: true });
  book.addEventListener('touchcancel', () => { if (drag.locked) endDrag(false); drag.ok = false; }, { passive: true });

  /* swallow the click that follows a drag (also stops accidental map-link taps) */
  book.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  /* tap: left edge = back, anywhere else = forward. Ignored while pinch-zoomed. */
  book.addEventListener('click', e => {
    if (isZoomed() || e.target.closest('a, button, .zoom-ctrl')) return;
    const r = book.getBoundingClientRect();
    (e.clientX - r.left < r.width * 0.2) ? prev() : next();
  });

  /* ---------- text-size control (A− / 100% / A+) ---------- */
  const LEVELS = [1, 1.15, 1.3, 1.5, 1.75];
  let zi = 0;
  try {
    const saved = parseInt(localStorage.getItem('inviteZoom'), 10);
    if (saved >= 0 && saved < LEVELS.length) zi = saved;
  } catch (_) {}

  const ctrl = document.createElement('div');
  ctrl.className = 'zoom-ctrl';
  ctrl.setAttribute('role', 'group');
  ctrl.setAttribute('aria-label', 'અક્ષરનું કદ');
  ctrl.innerHTML =
    '<span class="zoom-label"><b class="zl-n">અક્ષરનું કદ</b><b class="zl-t">અક્ષર મોટા કરો</b></span>' +
    '<button type="button" data-z="-1" aria-label="અક્ષર નાના કરો">A−</button>' +
    '<button type="button" class="zoom-level" data-z="0" aria-label="મૂળ કદ">100%</button>' +
    '<button type="button" data-z="1" aria-label="અક્ષર મોટા કરો">A+</button>';
  (document.querySelector('.sticky-controls') || stage).appendChild(ctrl);

  /* first-visit cue: highlighted label + pulsing A+ for a few seconds */
  let tipTimer = 0;
  try { if (localStorage.getItem('inviteZoomTip') !== '1') ctrl.classList.add('zoom-tip'); } catch (_) {}
  function endTip() {
    if (!ctrl.classList.contains('zoom-tip')) return;
    ctrl.classList.remove('zoom-tip');
    window.clearTimeout(tipTimer);
    try { localStorage.setItem('inviteZoomTip', '1'); } catch (_) {}
  }
  function startTip() {
    if (tipTimer || !ctrl.classList.contains('zoom-tip')) return;
    tipTimer = window.setTimeout(endTip, 9000);
  }
  const [minus, level, plus] = ctrl.querySelectorAll('button');

  function applyZoom(save) {
    document.documentElement.style.setProperty('--text-zoom', LEVELS[zi]);
    level.textContent = Math.round(LEVELS[zi] * 100) + '%';
    minus.disabled = zi === 0;
    plus.disabled = zi === LEVELS.length - 1;
    if (save) {
      try { localStorage.setItem('inviteZoom', String(zi)); } catch (_) {}
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))); // refresh "scroll down" cue
    }
  }
  ctrl.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    endTip();
    const z = Number(b.dataset.z);
    zi = z === 0 ? 0 : clamp(zi + z, 0, LEVELS.length - 1);
    applyZoom(true);
  });
  applyZoom(false);

  render();
})();

(function () {
  document.querySelectorAll('.page:not(.cover)').forEach(function (page) {
    var inner = page.querySelector('.page-inner');
    if (!inner) return;

    var hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.innerHTML =
      '<button type="button" aria-label="નીચે સ્ક્રોલ કરો"><span>નીચે જુઓ</span><i>⌄</i></button>';
    page.appendChild(hint);

    function update() {
      var remaining = inner.scrollHeight - inner.scrollTop - inner.clientHeight;
      hint.classList.toggle('show', remaining > 24);
    }

    var raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; update(); });
    }
    inner.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);

    hint.querySelector('button').addEventListener('click', function () {
      inner.scrollBy({ top: inner.clientHeight * 0.7, behavior: 'smooth' });
    });

    update();
  });
})();