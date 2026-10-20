(() => {
  const pages = [...document.querySelectorAll('.page')];
  const counter = document.getElementById('counter');
  let current = 0;
  const labels = ['મંગલ આમંત્રણ', 'શુભ સંદેશ', 'માંગલિક પ્રસંગો', 'લગ્નવિધિ', 'સ્નેહબંધન'];

  function render() {
    pages.forEach((page, i) => {
      const flipped = i < current;
      page.classList.toggle('flipped', flipped);
      page.style.zIndex = flipped ? String(i + 1) : String(pages.length - i + 1);
      page.setAttribute('aria-hidden', flipped ? 'true' : 'false');
    });
    counter.textContent = current === 0 ? 'આમંત્રણ ખોલવા ટૅપ કરો' : `${labels[current - 1]} · ${current}/${pages.length - 1}`;
  }
  function next() { if (current < pages.length - 1) { current++; render(); } }
  function prev() { if (current > 0) { current--; render(); } }

  document.querySelector('.open-btn').addEventListener('click', e => { e.stopPropagation(); next(); });
  let startX = 0;
  let suppressClick = false;
  const book = document.querySelector('.book');
  book.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 55) {
      suppressClick = true;
      delta < 0 ? next() : prev();
      window.setTimeout(() => { suppressClick = false; }, 350);
    }
  }, { passive: true });
  book.addEventListener('click', e => {
    if (suppressClick) return;
    if (e.target.closest('a, button')) return;
    next();
  });
  render();
})();
