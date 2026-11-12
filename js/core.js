/* =========================================================
   core.js — không gian tên HB, tiện ích chung, bậc chất lượng
   ========================================================= */
(() => {
  'use strict';
  const qs = new URLSearchParams(location.search);
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const RM = qs.has('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (RM) root.classList.add('rm');

  /* ---------- Sự kiện nội bộ ---------- */
  const handlers = {};
  const bus = {
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    emit(ev, data) { (handlers[ev] || []).forEach(fn => fn(data)); }
  };

  /* ---------- Bậc chất lượng: đoán ban đầu, sky.js đo FPS thật rồi hạ bậc nếu cần ---------- */
  const TIERS = [
    { name: 'low', dpr: 1, stars: 1400, dust: 2200, fw: 500, oct: 0, post: false },
    { name: 'mid', dpr: 1.5, stars: 3200, dust: 5000, fw: 900, oct: 3, post: true },
    { name: 'high', dpr: 2, stars: 6000, dust: 9000, fw: 1500, oct: 4, post: true }
  ];
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && !FINE);
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency || 4;
  let tier = mobile ? 1 : 2;
  if (mem && mem <= 3) tier = 0;
  else if (/Android/i.test(ua) && cores <= 4) tier = 0;
  else if (!mobile && (cores <= 4 || (mem && mem <= 4))) tier = 1;
  const forced = { low: 0, mid: 1, high: 2 }[qs.get('q')];
  if (forced !== undefined) tier = forced;
  const Q = {
    tier, forced: forced !== undefined, mobile,
    get t() { return TIERS[Q.tier]; },
    max: TIERS[tier],
    downgrade() {
      if (Q.forced || Q.tier === 0) return false;
      Q.tier--; bus.emit('quality', Q.t); return true;
    }
  };

  /* ---------- Con trỏ / con quay: nguồn chung cho parallax ---------- */
  const pointer = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX / innerWidth - .5; pointer.y = e.clientY / innerHeight - .5;
  }, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    pointer.x = clamp(e.gamma / 50, -.5, .5); pointer.y = clamp((e.beta - 45) / 60, -.5, .5);
  }, { passive: true });

  /* ---------- Tuổi / năm tự tính ---------- */
  const C = window.HAL;
  const now = new Date();
  const bYear = (now.getMonth() + 1 < 6) ? now.getFullYear() - 1 : now.getFullYear();
  const AGE = bYear - C.birthday.year;
  $$('[data-age]').forEach(e => { e.textContent = AGE; });
  $$('[data-year]').forEach(e => { e.textContent = bYear; });

  /* ---------- Tiện ích hiệu ứng ---------- */
  const PAL = ['#F4D58D', '#FFB89A', '#FBF3E7', '#E8909C', '#C9B6E4'];
  const buzz = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* noop */ } };
  const boom = (o = {}) => {
    if (RM || !window.confetti) return;
    window.confetti(Object.assign({
      particleCount: 70, spread: 75, startVelocity: 38, ticks: 220, scalar: .85, gravity: .9,
      origin: { x: .5, y: .5 }, colors: PAL, zIndex: 45, disableForReducedMotion: true
    }, o));
  };
  const originOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
  };

  /* Số lăn: <span class="odo" data-digits="5" data-sep="2">, sep = vị trí chèn dấu chấm (tính từ trái) */
  function odometer(el) {
    const n = +el.dataset.digits, sep = el.dataset.sep ? +el.dataset.sep : -1;
    const cols = [];
    el.textContent = '';
    for (let i = 0; i < n; i++) {
      if (i === sep) { const d = document.createElement('span'); d.textContent = '.'; el.appendChild(d); }
      const c = document.createElement('span'); c.className = 'odo__col';
      for (let k = 0; k < 10; k++) { const s = document.createElement('span'); s.textContent = k; c.appendChild(s); }
      el.appendChild(c); cols.push(c);
    }
    let last = -1;
    return (v) => {
      v = Math.round(v); if (v === last) return; last = v;
      const str = String(v).padStart(n, '0');
      cols.forEach((c, i) => {
        c.style.transform = `translateY(${-str[i]}em)`;
        c.classList.toggle('is-zero', i < n - String(v).length);
      });
    };
  }

  /* Gõ chữ từng ký tự (an toàn với dấu tiếng Việt và emoji) */
  function typeText(el, text, speed = 34, done) {
    clearInterval(el._ty);
    const chars = Array.from(text); let i = 0;
    el.textContent = '';
    if (RM) { el.textContent = text; done && done(); return; }
    el._ty = setInterval(() => {
      el.textContent += chars[i++];
      if (i >= chars.length) { clearInterval(el._ty); done && done(); }
    }, speed);
  }

  if (window.gsap) {
    [window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin].forEach(p => p && window.gsap.registerPlugin(p));
  }

  /* Đăng ký cảnh: init() chạy một lần, trả về hàm reset (nếu có) cho "Đọc lại từ đầu" */
  const scenes = [];
  window.HB = {
    C, AGE, qs, $, $$, clamp, rand, RM, FINE, Q, bus, pointer, PAL,
    buzz, boom, originOf, odometer, typeText,
    isDesk: () => innerWidth >= 900,
    state: { opened: false },
    scenes, resets: [],
    scene(name, init) { scenes.push({ name, init }); },
    M: { fast: .25, base: .6, slow: 1.2, epic: 2.4, out: 'expo.out', inout: 'power4.inOut', spring: 'elastic.out(1, .55)' }
  };
})();
