/* =========================================================
   CẢNH 2 · Lời chào — "Happy Birthday" bung từng ký tự trong không gian 3D,
   tên được gõ ra, cả khối nghiêng theo con trỏ / con quay điện thoại.
   ========================================================= */
HB.scene('hello', () => {
  'use strict';
  const { $, C, RM, bus, pointer } = HB, gsap = window.gsap;
  const name = $('#helloName'), nameWrap = $('.hello__name'), tilt = $('.hello__tilt');
  const split = window.SplitText.create('.hb-line', { type: 'chars', charsClass: 'ch', aria: 'none' });
  const rest = ['.hello__meta', '.hello__line', '#helloCue'];
  let tl;

  function reset() {
    if (tl) tl.kill();
    name.textContent = ''; nameWrap.classList.remove('is-done');
    gsap.set(split.chars, { opacity: 0, yPercent: 70, rotationX: -90 });
    gsap.set(rest, { autoAlpha: 0, y: 14 });
  }
  function play() {
    if (RM) {
      gsap.set(split.chars, { opacity: 1, yPercent: 0, rotationX: 0 });
      gsap.set(rest, { autoAlpha: 1, y: 0 });
      name.textContent = C.recipient.nick; nameWrap.classList.add('is-done');
      return;
    }
    tl = gsap.timeline({ delay: .3 })
      .to(split.chars, { opacity: 1, yPercent: 0, rotationX: 0, duration: 1.4, ease: 'expo.out', stagger: .05 })
      .add(() => HB.typeText(name, C.recipient.nick, 210, () => nameWrap.classList.add('is-done')), '-=.8')
      .to(rest, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .2 }, '+=.6');
  }
  bus.on('open', play);

  if (!RM) {
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.1, ease: 'power3' });
    const ry = gsap.quickTo(tilt, 'rotationY', { duration: 1.1, ease: 'power3' });
    let lx = 0, ly = 0;
    gsap.ticker.add(() => {
      if (!HB.state.opened || scrollY > innerHeight || (pointer.x === lx && pointer.y === ly)) return;
      lx = pointer.x; ly = pointer.y; ry(lx * 18); rx(-ly * 14);
    });
  }
  $('#helloCue').addEventListener('click', (e) => { e.preventDefault(); HB.scrollTo('#story'); });

  reset();
  return reset;
});
