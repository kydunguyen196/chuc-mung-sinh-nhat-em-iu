/* =========================================================
   CẢNH 6 · Lá thư — giấy có vân, từng dòng hiện ra như mực đang thấm,
   nhạc dịu lại trong lúc đọc.
   ========================================================= */
HB.scene('letter', () => {
  'use strict';
  const { $, $$, C, RM, Q } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const ps = $$('.lp');

  $$('.mini-pol .ph').forEach(box => { const p = C.photos[+box.dataset.photo]; if (p) HB.loadPhotoInto(box, p); });

  if (RM) { ps.forEach(p => p.classList.add('on')); return; }

  ps.forEach((p) => {
    window.SplitText.create(p, {
      type: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit(self) {
        const from = Q.tier === 0 ? { opacity: 0, y: 8 } : { opacity: 0, y: 8, filter: 'blur(7px)' };
        const tw = gsap.from(self.lines, Object.assign(from, { duration: 1.3, ease: 'power2.out', stagger: .16, paused: true }));
        if (p._played) tw.progress(1);
        p._tw = tw;
        return tw;
      }
    });
    ST.create({
      trigger: p, start: 'top 86%',
      onEnter() { p._played = true; p.classList.add('on'); if (p._tw) p._tw.play(); }
    });
  });

  /* Nhạc dịu lại khi đọc thư */
  ST.create({ trigger: '#letter', start: 'top 55%', end: 'bottom 45%', onToggle: (s) => HB.audio.duck(s.isActive ? .55 : 1, 1.6) });

  /* Polaroid nhỏ hai bên (desktop) trôi lệch nhịp */
  $$('.mini-pol').forEach((d) => {
    const sp = parseFloat(d.dataset.speed || 1);
    gsap.fromTo(d, { y: (sp - 1) * 180 }, { y: (1 - sp) * 180, ease: 'none', scrollTrigger: { trigger: '#letter', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  return () => ps.forEach((p) => { p._played = false; p.classList.remove('on'); if (p._tw) p._tw.pause(0); });
});
