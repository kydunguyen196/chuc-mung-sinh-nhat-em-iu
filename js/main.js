/* =========================================================
   main.js — khởi động: cuộn mượt (Lenis), dựng các cảnh, tiến trình,
   và "Đọc lại từ đầu" (reset mọi cảnh, không tạo lại listener hay đối tượng).
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { $, RM, bus } = HB;
  const gsap = window.gsap, ST = window.ScrollTrigger, root = document.documentElement;
  if (!gsap || !ST) return; // gate.js đã hiện thông báo mạng yếu

  ST.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* Cuộn mượt cho chuột/trackpad; cảm ứng giữ cuộn gốc của máy (ổn định trong trình duyệt in-app) */
  const lenis = (!RM && window.Lenis) ? new window.Lenis({ lerp: .1 }) : null;
  if (lenis) {
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  HB.scrollTo = (target, o = {}) => {
    if (lenis) return lenis.scrollTo(target, Object.assign({ duration: 1.6 }, o));
    const y = typeof target === 'number' ? target : $(target).getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  };
  HB.lockScroll = (on) => {
    root.classList.toggle('is-locked', on);
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
  };
  bus.on('unlock', () => { HB.lockScroll(false); ST.refresh(); });

  /* Dựng cảnh sau khi font sẵn sàng (SplitText và chữ bụi sao cần đúng font) */
  const bar = $('.progress__fill');
  HB.gate.progress(35);
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise(r => setTimeout(r, 2500))]).then(() => {
    HB.gate.progress(70);
    HB.scenes.forEach((s) => { const r = s.init(); if (typeof r === 'function') HB.resets.push(r); });
    ST.create({
      trigger: '#main', start: 'top top', end: 'bottom bottom',
      onUpdate: (s) => { HB.sky.setScroll(s.progress); bar.style.transform = `scaleX(${s.progress.toFixed(4)})`; }
    });
    ST.refresh();
    HB.gate.progress(100);
  });

  /* Đọc lại từ đầu */
  let busy = false;
  HB.replay = () => {
    if (busy) return; busy = true;
    HB.buzz(10); HB.sky.flash(.02, 1.2);
    gsap.timeline({ onComplete: () => { busy = false; } })
      .to('.curtain', { autoAlpha: 1, duration: RM ? .01 : .8, ease: 'power2.inOut' })
      .add(() => {
        HB.state.opened = false;
        HB.lockScroll(true);
        if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        ST.update();
        HB.audio.stop(.6); HB.audio.duck(1, 0);
        HB.resets.forEach(fn => fn());
        HB.sky.reset(); HB.sky.setScroll(0); bar.style.transform = 'scaleX(0)';
        HB.gate.reset();
        root.classList.remove('is-open');
        gsap.set('#main', { autoAlpha: 0 });
        ST.refresh();
      })
      .to('.curtain', { autoAlpha: 0, duration: RM ? .01 : 1, ease: 'power2.inOut' }, '+=.2');
  };
})();
