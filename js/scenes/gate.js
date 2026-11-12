/* =========================================================
   CẢNH 0 + 1 · Preloader nghệ thuật & khoảnh khắc mở màn
   Chòm sao "Hal" được nối dần theo tiến độ tải thật, phần trăm chạy
   kiểu số lăn; tải xong thì hiện lời mời. Chạm = mở khoá âm thanh.
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { $, $$, RM, bus } = HB, gsap = window.gsap;
  const gate = $('#gate'), root = document.documentElement;
  if (!gsap || !window.ScrollTrigger) {
    $('.gate__load').hidden = true; $('.gate__err').hidden = false;
    HB.gate = { progress() {}, reset() {} };
    return;
  }
  const A = HB.audio;
  const lines = $$('.constel__lines path'), constel = $('.constel'), load = $('.gate__load');
  const invite = ['.gate__date', '.gate__title', '.gate__cta'];
  const setOdo = HB.odometer($('#loadOdo'));
  const drawTl = gsap.timeline({ paused: true })
    .fromTo(lines, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, stagger: .55, ease: 'power2.inOut' });
  const st = { v: 0 };
  let invited = false, t0 = performance.now();
  setOdo(0);

  function progress(target) {
    gsap.to(st, {
      v: target, duration: RM ? .01 : 1.1, ease: 'power2.out', overwrite: true,
      onUpdate() { setOdo(st.v); drawTl.progress(st.v / 100); },
      onComplete() { if (target >= 100) gsap.delayedCall(RM ? 0 : Math.max(0, 1.4 - (performance.now() - t0) / 1000), showInvite); }
    });
  }
  function showInvite() {
    if (invited) return; invited = true;
    gsap.timeline()
      .to(load, { autoAlpha: 0, y: -8, duration: RM ? .01 : .5, ease: 'power2.in' })
      .fromTo(invite, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: RM ? .01 : 1.1, ease: 'expo.out', stagger: .14 }, '-=.1');
  }

  function open() {
    if (HB.state.opened || !invited) return;
    HB.state.opened = true;
    HB.buzz(20); A.start(); A.sfx.chime();
    if (RM) { gate.style.display = 'none'; return reveal(); }
    gsap.timeline()
      .to(invite, { autoAlpha: 0, y: -12, duration: .5, ease: 'power2.in', stagger: .05 }, 0)
      .to(constel, { scale: 2.6, autoAlpha: 0, duration: 1.2, ease: 'power3.in' }, 0)
      .add(() => { HB.sky.warp(); HB.sky.burst(); A.sfx.whoosh(); }, .55)
      .add(() => HB.boom({ particleCount: 90, spread: 130, startVelocity: 46, origin: { x: .5, y: .48 } }), .95)
      .add(() => { gate.style.display = 'none'; reveal(); }, 1.2);
  }
  function reveal() {
    root.classList.add('is-open');
    gsap.to('#main', { autoAlpha: 1, duration: RM ? .01 : 1.4, ease: 'power2.out' });
    bus.emit('open');
    gsap.delayedCall(RM ? 0 : 1.3, () => bus.emit('unlock'));
  }
  $('#openBtn').addEventListener('click', open);
  constel.addEventListener('click', open);

  HB.gate = {
    progress,
    /* Quay lại lời mời (dùng cho "Đọc lại từ đầu") */
    reset() {
      gate.style.display = '';
      drawTl.progress(1);
      gsap.set(load, { autoAlpha: 0 });
      gsap.set(constel, { scale: 1, autoAlpha: 1 });
      gsap.set(invite, { autoAlpha: 1, y: 0 });
      invited = true;
    }
  };
})();
