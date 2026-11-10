(() => {
  const pages = [...document.querySelectorAll('.page')];
  const counter = document.getElementById('counter');
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  let current = 0;
  const labels = ['મંગલ આમંત્રણ', 'શુભ સંદેશ', 'માંગલિક પ્રસંગો', 'લગ્નવિધિ', 'સ્નેહબંધન'];
  const whatsappShare = document.getElementById('whatsappShare');

  if (whatsappShare) {
    const inviteText = 'તિરથ અને પૂર્વાશાના શુભ વિવાહ પ્રસંગે આપને સહકુટુંબ પધારવાનું ભાવભર્યું આમંત્રણ. 💐\nલગ્ન: રવિવાર, ૨૮ ફેબ્રુઆરી ૨૦૨૭ · અમરેલી\nઆમંત્રણ અને સ્થળની વિગતો: ' + window.location.href;
    whatsappShare.href = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
  }

  function render() {
    document.querySelector('.stage')?.classList.toggle('reading', current > 0);
    pages.forEach((page, i) => {
      const flipped = i < current;
      page.classList.toggle('flipped', flipped);
      page.style.zIndex = flipped ? String(i + 1) : String(pages.length - i + 1);
      page.setAttribute('aria-hidden', flipped ? 'true' : 'false');
    });
    const activeContent = pages[current]?.querySelector('.page-inner');
    if (activeContent) activeContent.scrollTo({ top: 0, behavior: 'instant' });
    counter.textContent = current === 0 ? 'આમંત્રણ ખોલવા ટૅપ કરો' : `${labels[current - 1]} · ${current}/${pages.length - 1}`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === pages.length - 1;
  }
  function next() { if (current < pages.length - 1) { current++; render(); } }
  function prev() { if (current > 0) { current--; render(); } }

  document.getElementById('welcomeOpen')?.addEventListener('click', e => {
    e.stopPropagation();
    next();
  });
  prevButton.addEventListener('click', prev);
  nextButton.addEventListener('click', next);
  let startX = 0;
  let startY = 0;
  let suppressClick = false;
  const book = document.querySelector('.book');
  book.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].clientX;
    startY = e.changedTouches[0].clientY;
  }, { passive: true });
  book.addEventListener('touchend', e => {
    const deltaX = e.changedTouches[0].clientX - startX;
    const deltaY = e.changedTouches[0].clientY - startY;
    const onControl = e.target.closest('a, button');
    if (Math.abs(deltaY) > 12) {
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 350);
    }
    if (!onControl && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      suppressClick = true;
      deltaX < 0 ? next() : prev();
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
