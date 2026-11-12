/* =========================================================
   CẢNH 8 · Kết — camera lùi xa, bụi sao hội tụ thành trái tim → tên → số tuổi
   → trái tim. Chữ ký được viết ra, bộ đếm lăn tới số ngày hai đứa đã bên nhau.
   Easter egg: chạm 5 lần vào trái tim.
   ========================================================= */
HB.scene('ending', () => {
  'use strict';
  const { $, C, RM, rand } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const A = HB.audio, sky = HB.sky;
  const sec = $('#ending'), heart = $('#heartBtn'), secret = $('#secret'), text = $('.sign__text'), line = $('.sign__line');
  /* Số ngày từ ngày yêu nhau tới hôm nay, tính theo nửa đêm giờ địa phương */
  const T = C.together, d0 = new Date(T.year, T.month - 1, T.day), now = new Date();
  const DAYS = Math.max(0, Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - d0) / 864e5));
  $('#yearsOdo').dataset.digits = String(DAYS).length;
  $('#daysLine').setAttribute('aria-label', 'Hai đứa mình đã bên nhau ' + DAYS + ' ngày');
  const setYears = HB.odometer($('#yearsOdo'));
  const intro = ['.ending .head__label', '.ending__quote', '.ending__love'], outro = ['.ending__foot', '#replayBtn'].map(s => $(s));
  const all = intro.concat(['.ending__years'], outro);
  text.textContent = C.sender.short;
  let tl, seq, played = false, shown = false, taps = 0, tapT = 0, found = false;
  const yv = { v: 0 };

  function reset() {
    if (tl) tl.kill(); if (seq) seq.kill();
    gsap.killTweensOf(outro);
    played = false; shown = false; taps = 0; found = false; yv.v = 0;
    clearInterval(secret._ty); secret.textContent = ''; setYears(0);
    if (RM) return;
    gsap.set(all, { autoAlpha: 0, y: 16 });
    gsap.set(text, { strokeDasharray: 900, strokeDashoffset: 900, fillOpacity: 0 });
    gsap.set(line, { drawSVG: '0%' });
  }

  /* Bụi sao: tim → tên → tuổi → tim */
  function gather() {
    if (!shown) { shown = true; if (!RM) gsap.to(outro, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .25, delay: 2.2 }); }
    sky.setDustAnchor(heart);
    sky.morph('heart', { dur: 2.8, alpha: .95 });
    if (seq) seq.kill();
    seq = gsap.timeline()
      .add(() => sky.morph('text:' + C.recipient.nick, { dur: 2.2 }), 4.6)
      .add(() => sky.morph('text:' + HB.AGE, { dur: 2.2 }), 8.6)
      .add(() => sky.morph('heart', { dur: 2.2 }), 12.4);
  }
  function scatter() {
    if (seq) seq.kill();
    sky.setDustAnchor(null);
    sky.morph('scatter', { dur: 2, alpha: .42 });
  }
  function play() {
    if (played) return; played = true;
    if (RM) { setYears(DAYS); return; }
    tl = gsap.timeline({ delay: .5 })
      .to(intro, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .28 })
      .to(text, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, '-=.3')
      .to(text, { fillOpacity: 1, duration: .6, ease: 'power2.out' }, '-=.6')
      .to(line, { drawSVG: '100%', duration: .7, ease: 'power3.out' }, '-=.3')
      .to('.ending__years', { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out' })
      .to(yv, { v: DAYS, duration: 3.4, ease: 'power3.out', onUpdate: () => setYears(yv.v) }, '<');
  }

  ST.create({ trigger: sec, start: 'top 55%', onEnter: play });
  ST.create({ trigger: '#finale', start: 'top 60%', onEnter: gather, onLeaveBack: scatter });
  ST.create({ trigger: '#finale', start: 'top bottom', end: 'top top', onUpdate: (s) => sky.setPull(s.progress) });

  heart.addEventListener('click', () => {
    if (!shown) return;
    taps++; sky.pulse(); A.sfx.tick(); HB.buzz(8);
    clearTimeout(tapT); tapT = setTimeout(() => { taps = 0; }, 2500);
    if (taps >= 5 && !found) {
      found = true; HB.buzz(40); A.sfx.sparkle();
      HB.typeText(secret, C.secret, 34);
      for (let i = 0; i < 4; i++) gsap.delayedCall(i * .3, () => { sky.firework(rand(.15, .85), rand(.08, .36), i); if (i % 2 === 0) A.sfx.boom(); });
      HB.boom({ particleCount: 70, spread: 110, origin: HB.originOf(heart) });
    }
  });
  $('#replayBtn').addEventListener('click', () => HB.replay());

  reset();
  return reset;
});
