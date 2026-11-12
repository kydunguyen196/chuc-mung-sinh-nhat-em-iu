/* =========================================================
   CẢNH 4 · Hành trình ký ức — polaroid trôi từ xa tới trong không gian 3D
   theo nhịp cuộn; tấm nào tới gần thì caption được gõ ra. Chạm để xem lớn.
   Ảnh chỉ bắt đầu tải sau khi mở thư (lazy-load).
   ========================================================= */
HB.scene('memories', () => {
  'use strict';
  const { $, C, RM, bus, clamp } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const sec = $('#memories'), pin = $('.mem__pin'), space = $('#memSpace'), idxEl = $('#memIdx');
  const P = C.photos, N = P.length;
  $('#memTotal').textContent = N;

  /* Khung ảnh: thiếu file thì vẫn là một ô trời sao có nhãn */
  const pending = [];
  function loadInto(box, p) {
    const go = () => {
      if (box.querySelector('img')) return;
      const img = new Image();
      img.alt = ''; img.decoding = 'async'; img.draggable = false;
      img.onload = () => box.classList.add('has-img');
      img.onerror = () => img.remove();
      img.src = p.src; box.appendChild(img);
    };
    if (HB.state.opened) go(); else pending.push(go);
  }
  function photoBox(p) {
    const d = document.createElement('div'); d.className = 'ph';
    const lab = document.createElement('span'); lab.textContent = 'ảnh: ' + p.label; d.appendChild(lab);
    loadInto(d, p);
    return d;
  }
  bus.on('open', () => { pending.splice(0).forEach(fn => fn()); });
  HB.photoBox = photoBox; HB.loadPhotoInto = loadInto;

  const cards = P.map((p, i) => {
    const wrap = document.createElement('div'); wrap.className = 'mem__card';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pol';
    b.setAttribute('aria-label', 'Xem ảnh: ' + p.caption);
    const cap = document.createElement('span'); cap.className = 'pol__cap'; cap.style.display = 'block';
    b.append(photoBox(p), cap);
    b.addEventListener('click', () => openLB(i));
    wrap.appendChild(b); space.appendChild(wrap);
    return { wrap, cap, typed: false };
  });

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('.lb__img', lb), lbCap = $('.lb__cap', lb), lbPol = $('.lb__pol', lb);
  let cur = 0, lastFocus = null;
  function fillLB(i) {
    cur = (i + N) % N;
    lbImg.textContent = ''; lbImg.appendChild(photoBox(P[cur]));
    lbCap.textContent = P[cur].caption;
  }
  function openLB(i) {
    lastFocus = document.activeElement; fillLB(i); lb.hidden = false; HB.buzz(8); HB.lockScroll(true);
    if (!RM) gsap.fromTo(lbPol, { scale: .86, autoAlpha: 0, rotation: -5 }, { scale: 1, autoAlpha: 1, rotation: -1.5, duration: .7, ease: 'expo.out' });
    $('.lb__close', lb).focus();
  }
  function closeLB() { lb.hidden = true; HB.lockScroll(false); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  function stepLB(d) {
    fillLB(cur + d);
    if (!RM) gsap.fromTo(lbPol, { x: d * 46, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .5, ease: 'expo.out' });
  }
  $('.lb__close', lb).addEventListener('click', closeLB);
  $('.lb__nav--prev', lb).addEventListener('click', () => stepLB(-1));
  $('.lb__nav--next', lb).addEventListener('click', () => stepLB(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') stepLB(-1);
    if (e.key === 'ArrowRight') stepLB(1);
  });
  let sx = null;
  lbPol.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  lbPol.addEventListener('pointerup', (e) => { if (sx != null && Math.abs(e.clientX - sx) > 50) stepLB(e.clientX < sx ? 1 : -1); sx = null; });

  if (RM) {
    sec.classList.add('is-static');
    cards.forEach((c, i) => { c.cap.textContent = P[i].caption; });
    return;
  }

  /* ---------- Bay trong không gian ---------- */
  const D = 1000;
  let lastP = 0, focus = -1, entered = false;
  function type(i) {
    const c = cards[i]; if (c.typed) return;
    c.typed = true; HB.typeText(c.cap, P[i].caption, 30);
  }
  function layout(p) {
    lastP = p;
    const spreadX = innerWidth * (HB.isDesk() ? .2 : .1), spreadY = innerHeight * .06;
    const f = clamp(Math.round(p * (N - 1)), 0, N - 1);
    cards.forEach((c, i) => {
      const z = (p * (N - 1) - i) * D, far = clamp(-z / D, 0, 1.6), side = i % 2 ? 1 : -1;
      const op = z <= 0 ? clamp(1 + z / (D * 2.5), 0, 1) : clamp(1 - (z - 120) / 280, 0, 1);
      gsap.set(c.wrap, {
        xPercent: -50, yPercent: -50, x: side * spreadX * far, y: ((i % 3) - 1) * spreadY * far, z,
        rotation: side * (1.5 + 5 * far), autoAlpha: op, zIndex: 100 - Math.round(Math.abs(z) / 20)
      });
      c.wrap.style.pointerEvents = i === f && op > .6 ? 'auto' : 'none';
    });
    if (f !== focus) { focus = f; idxEl.textContent = f + 1; if (entered) type(f); }
  }
  layout(0);
  addEventListener('resize', () => layout(lastP));
  ST.create({ trigger: pin, start: 'top 60%', onEnter: () => { entered = true; type(focus); } });
  ST.create({
    trigger: pin, start: 'top top', end: () => '+=' + Math.round(innerHeight * .8 * (N - 1)), pin: true, anticipatePin: 1,
    onUpdate: (s) => layout(s.progress)
  });

  return () => {
    entered = false; focus = -1;
    cards.forEach(c => { c.typed = false; clearInterval(c.cap._ty); c.cap.textContent = ''; });
    layout(0);
    if (!lb.hidden) closeLB();
  };
});
