/* =========================================================
   ui.js — lớp tinh tế: con trỏ quán tính + vệt lấp lánh, chạm nở tim,
   nút từ tính, âm UI, nút tắt tiếng
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { $, $$, C, RM, FINE, rand } = HB, gsap = window.gsap;
  if (!gsap) return;
  const A = HB.audio, body = document.body;
  const HOT = 'button, a, input, .pol, .voucher';

  /* ---------- Nút âm thanh ---------- */
  const sound = $('#soundBtn'), sTitle = $('.sound__title'), sSub = $('.sound__sub');
  function syncSound() {
    sound.classList.toggle('is-playing', A.playing && !A.muted);
    sound.classList.toggle('is-muted', A.muted);
    sound.setAttribute('aria-pressed', A.muted);
    sound.setAttribute('aria-label', A.muted ? 'Bật tiếng' : 'Tắt tiếng');
    sTitle.textContent = A.real ? C.music.title : C.music.fallbackTitle;
    sSub.textContent = A.muted ? 'đang tắt tiếng' : (A.real ? C.music.sub : C.music.fallbackSub);
  }
  sound.addEventListener('click', () => { A.toggleMute(); HB.buzz(8); if (!A.muted) A.sfx.tick(); });
  A.on(syncSound); syncSound();

  /* ---------- Âm UI khi rê / chạm vào nút ---------- */
  let lastHot = null;
  document.addEventListener('pointerover', (e) => {
    const hot = e.target.closest && e.target.closest('button, a');
    if (hot && hot !== lastHot && e.pointerType === 'mouse') A.sfx.tick();
    lastHot = hot;
  }, { passive: true });

  /* ---------- Chạm nở tim (cảm ứng) ---------- */
  const HEART = 'M12 21s-7.500-4.600-9.600-9.200C.900 8.400 3 5 6.300 5c2 0 3.600 1 4.700 2.600h2C14.100 6 15.700 5 17.700 5 21 5 23.100 8.400 21.600 11.800 19.500 16.400 12 21 12 21z';
  if (!RM) {
    addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), p = document.createElementNS(ns, 'path');
      s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'bloom'); p.setAttribute('d', HEART); s.appendChild(p);
      body.appendChild(s);
      gsap.fromTo(s, { x: e.clientX, y: e.clientY, scale: .2, opacity: .95, rotation: rand(-20, 20) },
        { y: e.clientY - rand(40, 70), scale: 1, opacity: 0, duration: .9, ease: 'expo.out', onComplete: () => s.remove() });
    }, { passive: true });
  }

  if (!FINE || RM) return;

  /* ---------- Con trỏ: vòng có quán tính + chấm bám sát + vệt sao ---------- */
  body.classList.add('has-cursor');
  const ring = document.createElement('div'); ring.className = 'cur';
  const dot = document.createElement('div'); dot.className = 'cur-dot';
  body.append(ring, dot);
  gsap.set([ring, dot], { x: -100, y: -100 });
  const rx = gsap.quickTo(ring, 'x', { duration: .55, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .55, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: .08, ease: 'power2' }), dy = gsap.quickTo(dot, 'y', { duration: .08, ease: 'power2' });
  let lx = 0, ly = 0, acc = 0, live = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    ring.classList.toggle('is-hover', !!(e.target.closest && e.target.closest(HOT)));
    acc += Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
    if (acc > 46 && live < 14) {
      acc = 0; live++;
      const s = document.createElement('i'); s.className = 'spark'; body.appendChild(s);
      gsap.fromTo(s, { x: lx + rand(-8, 8), y: ly + rand(-8, 8), scale: rand(.5, 1.1), opacity: .9, rotation: rand(0, 90) },
        { y: '+=' + rand(14, 34), scale: 0, opacity: 0, rotation: '+=120', duration: rand(.6, 1), ease: 'power2.out', onComplete: () => { s.remove(); live--; } });
    }
  }, { passive: true });
  addEventListener('pointerdown', () => ring.classList.add('is-down'));
  addEventListener('pointerup', () => ring.classList.remove('is-down'));
  document.addEventListener('mouseleave', () => gsap.to([ring, dot], { opacity: 0, duration: .2, ease: 'power2.out' }));
  document.addEventListener('mouseenter', () => gsap.to([ring, dot], { opacity: 1, duration: .2, ease: 'power2.out', clearProps: 'opacity' }));

  /* ---------- Nút từ tính ---------- */
  $$('.magnetic').forEach((el) => {
    const inner = $('.btn__in', el);
    let bx = 0, by = 0; // tâm nút khi chưa bị kéo lệch
    el.addEventListener('pointerenter', () => { const r = el.getBoundingClientRect(); bx = r.left + r.width / 2 - (+gsap.getProperty(el, 'x') || 0); by = r.top + r.height / 2 - (+gsap.getProperty(el, 'y') || 0); });
    el.addEventListener('pointermove', (e) => {
      const ox = e.clientX - bx, oy = e.clientY - by;
      gsap.to(el, { x: ox * .32, y: oy * .42, duration: .5, ease: 'power3', overwrite: true });
      if (inner) gsap.to(inner, { x: ox * .12, y: oy * .16, duration: .4, ease: 'power3', overwrite: true });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: HB.M.spring, overwrite: true });
      if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: HB.M.spring, overwrite: true });
    });
  });
})();
