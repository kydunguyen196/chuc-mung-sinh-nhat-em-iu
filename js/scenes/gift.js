/* =========================================================
   CẢNH 7 · Món quà — ba ngôi sao băng rơi xuống thành ba tấm voucher.
   Chạm vào voucher để đóng dấu "ĐÃ NHẬN".
   ========================================================= */
HB.scene('gift', () => {
  'use strict';
  const { $, C, RM } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const A = HB.audio, sky = HB.sky;
  const label = $('#giftLabel'), title = $('#giftTitle'), cta = $('#giftCta'), wrap = $('#vouchers');
  const LABEL = label.textContent, TITLE = title.innerHTML;
  $('#voucherCount').textContent = C.vouchers.length;
  let open = false;
  const el = (tag, cls, txt) => { const e = document.createElement(tag); e.className = cls; if (txt != null) e.textContent = txt; return e; };

  function voucherEl(v) {
    const b = el('button', 'voucher ' + (v.main ? 'voucher--main' : 'voucher--mini')); b.type = 'button';
    const t = el('span', 'voucher__title', v.title), x = el('span', 'voucher__text', v.text), st = el('span', 'voucher__stamp', 'ĐÃ NHẬN ♥');
    if (v.main) { const bd = el('span', 'voucher__body'); bd.append(t, x); b.append(el('span', 'voucher__stub', 'VOUCHER'), bd, st); }
    else b.append(t, x, st);
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      const on = b.classList.toggle('claimed'); b.setAttribute('aria-pressed', on); HB.buzz(on ? 25 : 8);
      if (on) { A.sfx.pop(); HB.boom({ particleCount: 26, spread: 55, startVelocity: 24, origin: HB.originOf(b), scalar: .7 }); }
    });
    return b;
  }

  function openGift() {
    if (open) return;
    open = true; HB.buzz(20); A.sfx.sparkle();
    label.textContent = LABEL + ' · đã mở';
    title.textContent = '';
    title.append(C.vouchers.length + ' voucher yêu thương,', document.createElement('br'), 'em dùng lúc nào cũng được');
    cta.hidden = true;
    const items = C.vouchers.map(voucherEl);
    wrap.append(...items, el('p', 'v-note', 'Chạm vào voucher để "kích hoạt" rồi chụp màn hình gửi anh nha 📸'));
    ST.refresh();
    if (RM) return;
    gsap.set(wrap.children, { autoAlpha: 0, y: 36 });
    items.forEach((b, i) => {
      const r = b.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2;
      gsap.delayedCall(i * .22, () => {
        sky.shoot(tx + innerWidth * .5, ty - innerHeight * .55, tx, ty, { dur: .8, len: 2.6, w: .12, ease: 'power2.in' })
          .then(() => { if (i === 0) sky.flash(.006, .6); });
      });
    });
    gsap.to(wrap.children, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .22, delay: .72, clearProps: 'transform' });
  }
  $('#giftBtn').addEventListener('click', openGift);

  return () => {
    open = false; wrap.textContent = ''; cta.hidden = false;
    label.textContent = LABEL; title.innerHTML = TITLE;
  };
});
