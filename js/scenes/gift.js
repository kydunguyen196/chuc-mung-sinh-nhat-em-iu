/* =========================================================
   CẢNH 7 · Món quà — một bó hoa nở ra từng cánh.
   Sao băng tụ về → giấy gói và lá vươn lên → hoa nở từ sau ra trước →
   pháo hoa, cánh hoa rơi, bướm, lấp lánh. Chạm vào bông nào bông đó tung cánh.
   ========================================================= */
HB.scene('gift', () => {
  'use strict';
  const { $, C, RM, rand, Q } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const A = HB.audio, sky = HB.sky, B = C.bouquet;
  const sec = $('#gift'), label = $('#giftLabel'), title = $('#giftTitle'), cta = $('#giftCta');
  const box = $('#bouquet'), stage = $('#bqStage'), note = $('#giftNote'), rain = $('#bqRain');
  const glow = $('.bq__glow', box), rays = $('.bq__rays', box);
  const LABEL = label.textContent, TITLE = title.innerHTML;
  const RAINBOW = ['#FF5C7A', '#FF9A3D', '#FFD84A', '#7ED957', '#5BB8FF', '#A77BFF', '#FF7AD1', '#FBF3E7'];
  $('#giftWait').textContent = B.wait; note.textContent = B.note;

  let open = false, bq = null, tl = null, loops = [], inView = false, px = 0, py = 0;
  const el = (cls, parent) => { const e = document.createElement('div'); e.className = cls; parent.appendChild(e); return e; };
  const live = (on) => { box.classList.toggle('is-live', on); loops.forEach(t => t.paused(!on)); };

  /* ---------- Dựng một lần (lần mở đầu tiên) ---------- */
  function build() {
    bq = HB.buildBouquet(stage);
    bq.flowers.forEach((f) => {
      gsap.set(f.wrap, { xPercent: -50, yPercent: -50, rotation: f.rot });
      f.setX = gsap.quickSetter(f.wrap, 'x', 'px'); f.setY = gsap.quickSetter(f.wrap, 'y', 'px');
      f.wrap.addEventListener('click', () => poke(f));
    });
    /* lấp lánh */
    for (let i = 0; i < (Q.tier ? 18 : 10); i++) {
      const s = el('bq__spark', bq.sparks), a = rand(0, 6.283), r = Math.sqrt(Math.random()) * 44;
      s.style.left = (50 + Math.cos(a) * r).toFixed(1) + '%'; s.style.top = (34 + Math.sin(a) * r * .62).toFixed(1) + '%';
      s.style.setProperty('--sz', rand(8, 18).toFixed(0) + 'px'); s.style.animationDelay = rand(0, 3.2).toFixed(2) + 's';
      s.style.animationDuration = rand(1.8, 3.4).toFixed(2) + 's';
    }
    /* bướm */
    bq.flies = [['#FFB3D9', '#FF5CA8'], ['#BFE3FF', '#5B8CFF']].map(([a, b]) => {
      const w = el('bq__fly', stage);
      w.innerHTML = `<svg viewBox="-20 -16 40 32"><g class="bq__wing bq__wing--l"><path d="M0 0C-6 -16 -20 -14 -17 -3C-15 3 -6 3 0 0Z" fill="${a}"/><path d="M0 1C-6 12 -15 12 -13 4C-11 0 -5 0 0 1Z" fill="${b}"/></g><g class="bq__wing bq__wing--r"><path d="M0 0C6 -16 20 -14 17 -3C15 3 6 3 0 0Z" fill="${a}"/><path d="M0 1C6 12 15 12 13 4C11 0 5 0 0 1Z" fill="${b}"/></g><path d="M0 -6L0 8" stroke="#3A2440" stroke-width="2" stroke-linecap="round"/></svg>`;
      return w;
    });
    /* cánh hoa rơi: một bể dùng lại */
    bq.rain = [];
    for (let i = 0; i < [10, 18, 26][Q.tier]; i++) {
      const p = el('bq__petal', rain), f = bq.flowers[(Math.random() * bq.flowers.length) | 0];
      p.style.background = `linear-gradient(135deg, ${f.colors[0]}, ${f.colors[1]})`;
      p.style.setProperty('--sz', rand(9, 17).toFixed(0) + 'px');
      bq.rain.push(p);
    }
  }

  /* ---------- Chạm vào một bông ---------- */
  function poke(f) {
    if (!open) return;
    HB.buzz(12); A.sfx.pop();
    if (RM) return;
    gsap.fromTo(f.svg, { scale: 1.28 }, { scale: 1, duration: 1.1, ease: 'elastic.out(1, .35)', overwrite: 'auto' });
    const r = f.wrap.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const cx = r.left + r.width / 2 - s.left, cy = r.top + r.height / 2 - s.top;
    for (let i = 0; i < 9; i++) {
      const p = el('bq__petal bq__petal--pop', stage), a = rand(0, 6.283), d = rand(50, 120);
      p.style.background = `linear-gradient(135deg, ${f.colors[0]}, ${f.colors[1]})`;
      p.style.setProperty('--sz', rand(8, 14).toFixed(0) + 'px');
      gsap.fromTo(p, { x: cx, y: cy, scale: .3, rotation: rand(0, 360), opacity: 1 },
        { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d + 50, scale: 1, rotation: '+=' + rand(-260, 260), rotationX: rand(-300, 300), opacity: 0, duration: rand(.9, 1.4), ease: 'power2.out', onComplete: () => p.remove() });
    }
    HB.boom({ particleCount: 14, spread: 70, startVelocity: 16, scalar: .6, ticks: 110, colors: f.colors, origin: HB.originOf(f.wrap) });
  }

  /* ---------- Nở ---------- */
  function bloom() {
    const lite = Q.tier === 0;
    tl = gsap.timeline();
    tl.fromTo(glow, { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: 1, duration: 2, ease: 'expo.out' }, 0)
      .fromTo(rays, { autoAlpha: 0, scale: .5 }, { autoAlpha: 1, scale: 1, duration: 2.4, ease: 'expo.out' }, .5)
      .fromTo([bq.back, bq.paper], { autoAlpha: 0, y: 70, scale: .8, transformOrigin: '50% 92%' }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: 'expo.out' }, 0)
      .fromTo(bq.leaves, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 1.2, ease: 'back.out(1.5)', stagger: .045 }, .2);
    bq.flowers.forEach((f, i) => {
      const t0 = .75 + i * .075;
      tl.fromTo(f.wrap, { autoAlpha: 0, scale: .15, rotation: f.rot - 50 }, { autoAlpha: 1, scale: 1, rotation: f.rot, duration: 1.3, ease: 'back.out(1.7)' }, t0);
      if (!lite) f.petals.forEach((ring, r) => tl.fromTo(ring, { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: .9, ease: 'back.out(2)', stagger: .018 }, t0 + .1 + r * .1));
      if (i % 5 === 2) tl.add(() => A.sfx.tick(), t0);
    });
    const end = .75 + bq.flowers.length * .075 + .5;
    tl.fromTo(bq.sparks, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, end - .6)
      .fromTo(bq.flies, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: .8, ease: 'back.out(2)', stagger: .3 }, end)
      .fromTo(note, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' }, end + .4)
      .add(() => {
        A.sfx.chime(); HB.buzz(30); sky.flash(.012, 1);
        HB.boom({ particleCount: 110, spread: 110, startVelocity: 42, colors: RAINBOW, origin: HB.originOf(stage) });
        for (let i = 0; i < 5; i++) gsap.delayedCall(i * .28, () => { if (!open) return; sky.firework(rand(.12, .88), rand(.1, .4), i); if (i % 2 === 0) A.sfx.boom(); });
      }, end - .3);

    /* đung đưa nhẹ, mỗi bông một nhịp */
    bq.flowers.forEach((f) => {
      const a = rand(2, 4.5) * (f.depth < .5 ? 1.5 : 1), stem = /tulip|lavender/.test(f.wrap.className);
      loops.push(gsap.fromTo(f.svg, { rotation: -a, transformOrigin: stem ? '50% 95%' : '50% 50%' }, { rotation: a, duration: rand(2.2, 3.8), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: -rand(0, 4) }));
    });
    loops.push(gsap.fromTo(bq.leaves, { rotation: -1.6 }, { rotation: 1.6, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: .12, from: 'random' }, delay: 1.6 }));
    /* bướm bay vòng quanh */
    bq.flies.forEach((w, i) => {
      const W = () => stage.clientWidth, H = () => stage.clientHeight, s = i ? -1 : 1;
      const pts = [[.5 + s * .34, .12], [.5 + s * .1, .3], [.5 - s * .3, .16], [.5 - s * .38, .42], [.5 - s * .05, .5], [.5 + s * .4, .36]];
      const t = gsap.timeline({ repeat: -1, delay: i * 1.3 });
      gsap.set(w, { x: () => pts[5][0] * W(), y: () => pts[5][1] * H() });
      pts.forEach(([x, y], k) => {
        const prev = pts[(k + 5) % 6];
        t.to(w, { x: () => x * W() + rand(-14, 14), y: () => y * H() + rand(-14, 14), rotation: Math.atan2(y - prev[1], x - prev[0]) * 57.3 + 90, duration: rand(2.2, 3.4), ease: 'sine.inOut' });
      });
      loops.push(t);
    });
    /* cánh hoa rơi */
    bq.rain.forEach((p) => {
      loops.push(gsap.fromTo(p,
        { x: () => rand(0, sec.clientWidth), y: -30, rotation: () => rand(0, 360), rotationX: 0 },
        { x: () => '+=' + rand(-140, 140), y: () => sec.clientHeight + 30, rotation: () => '+=' + rand(-420, 420), rotationX: () => rand(-540, 540),
          duration: () => rand(6, 11), ease: 'none', repeat: -1, repeatRefresh: true, delay: 2.2 + rand(0, 9) }));
    });
    live(inView);
  }

  function openGift() {
    if (open) return;
    open = true; HB.buzz(20); A.sfx.sparkle();
    if (!bq) build();
    label.textContent = LABEL + ' · đã mở';
    title.textContent = ''; title.append(B.title[0], document.createElement('br'), B.title[1]);
    cta.hidden = true; box.hidden = false; note.hidden = false; sec.classList.add('is-open');
    ST.refresh();
    if (RM) return;
    HB.scrollTo(sec, { duration: 1.2 });
    /* sao băng tụ về tâm bó hoa */
    const r = stage.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height * .4;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * (.15 + i * .175), d = Math.max(innerWidth, innerHeight) * .7;
      gsap.delayedCall(i * .09, () => sky.shoot(tx + Math.cos(a) * d, ty + Math.sin(a) * d, tx, ty, { dur: .7, len: 2.4, w: .1, ease: 'power2.in' }));
    }
    bloom();
  }
  $('#giftBtn').addEventListener('click', openGift);

  /* Chỉ chạy vòng lặp và parallax khi cảnh nằm trong khung nhìn */
  ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: (s) => { inView = s.isActive; if (open && !RM) live(inView); } });
  if (!RM) gsap.ticker.add(() => {
    if (!open || !inView || !bq) return;
    px += (HB.pointer.x - px) * .06; py += (HB.pointer.y - py) * .06;
    for (let i = 0; i < bq.flowers.length; i++) { const f = bq.flowers[i]; f.setX(px * f.depth * 30); f.setY(py * f.depth * 18); }
  });

  return () => {
    open = false;
    if (tl) { tl.kill(); tl = null; }
    loops.forEach(t => t.kill()); loops = [];
    box.classList.remove('is-live');
    if (bq) { stage.querySelectorAll('.bq__petal--pop').forEach(p => p.remove()); }
    sec.classList.remove('is-open');
    box.hidden = true; note.hidden = true; cta.hidden = false;
    label.textContent = LABEL; title.innerHTML = TITLE;
  };
});
