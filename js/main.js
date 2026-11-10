/* =========================================================
   Thư sinh nhật Hal — hiệu ứng & tương tác
   Phụ thuộc: GSAP 3 + ScrollTrigger, canvas-confetti (vendor/)
   ========================================================= */
(() => {
  'use strict';

  const C = window.HAL;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesk = () => innerWidth >= 900;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const PAL = ['#FFB5A7', '#F28DA6', '#C9B6E4', '#FFE29A', '#FFF4EC', '#FF8FB1'];
  const body = document.body;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  const buzz = (ms = 10) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* noop */ } };
  const boom = (o = {}) => {
    if (RM || !window.confetti) return;
    window.confetti(Object.assign({
      particleCount: 80, spread: 70, startVelocity: 38, ticks: 220, scalar: .9,
      origin: { x: .5, y: .5 }, colors: PAL, zIndex: 120, disableForReducedMotion: true
    }, o));
  };
  const originOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight };
  };
  const themeColor = (c) => { const m = $('meta[name="theme-color"]'); if (m) m.content = c; };

  /* ---------- Năm / tuổi tự tính ---------- */
  const now = new Date();
  const bYear = (now.getMonth() + 1 < 6) ? now.getFullYear() - 1 : now.getFullYear();
  const AGE = bYear - C.birthday.year;
  $$('[data-age]').forEach(e => { e.textContent = AGE; });
  $$('[data-year]').forEach(e => { e.textContent = bYear; });

  /* =========================================================
     MUSIC — file mp3 nếu có, không thì piano tổng hợp (Web Audio)
     ========================================================= */
  const Music = (() => {
    const audio = $('#song');
    const canRoute = /^https?:$/.test(location.protocol); // file:// không đi qua Web Audio được (bị chặn CORS)
    let ctx = null, master = null, analyser = null, freq = null, routed = false;
    let mode = 'none', playing = false, vol = C.music.volume, fileOk = null, synth = null, synthT0 = 0;
    const listeners = [];

    audio.src = C.music.src;
    audio.addEventListener('canplay', () => { fileOk = true; emit(); });
    audio.addEventListener('error', () => { fileOk = false; emit(); });

    function emit() { listeners.forEach(fn => fn()); }
    function ensureCtx() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0;
        analyser = ctx.createAnalyser(); analyser.fftSize = 64; analyser.smoothingTimeConstant = .82;
        freq = new Uint8Array(analyser.frequencyBinCount);
        master.connect(analyser); analyser.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const useGain = () => mode === 'synth' || (mode === 'file' && routed);
    function fade(to, dur) {
      if (useGain()) {
        const g = master.gain, t = ctx.currentTime;
        g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + dur);
      } else {
        gsap.to(audio, { volume: clamp(to, 0, 1), duration: dur, ease: 'none', overwrite: true });
      }
    }

    async function start() {
      ensureCtx();
      if (fileOk !== false) {
        try {
          if (canRoute && ctx && !routed) {
            const src = ctx.createMediaElementSource(audio);
            src.connect(master); routed = true;
          }
          audio.volume = routed ? 1 : 0;
          mode = 'file';
          await audio.play();
          playing = true; fade(vol, 2); emit();
          return;
        } catch (e) { mode = 'none'; }
      }
      startSynth();
    }
    function startSynth() {
      if (!ensureCtx()) return;
      mode = 'synth';
      if (!synth) { synth = createSynth(ctx, master); synthT0 = ctx.currentTime; }
      playing = true; fade(vol, 2); emit();
    }
    function pause() {
      if (!playing) return;
      playing = false; fade(0, .5);
      setTimeout(() => {
        if (playing) return;
        if (mode === 'file') audio.pause();
        if (mode === 'synth' && synth) { synth.stop(); synth = null; }
      }, 520);
      emit();
    }
    function resume() {
      if (playing) return;
      if (mode === 'none') return start();
      ensureCtx();
      if (mode === 'file') {
        audio.play().then(() => { playing = true; fade(vol, .8); emit(); }).catch(() => startSynth());
      } else startSynth();
    }
    function setVolume(v) { vol = v; if (playing) fade(v, .15); }
    function levels(n) {
      const out = new Array(n).fill(.15);
      if (!playing) return out;
      if (analyser && useGain()) {
        analyser.getByteFrequencyData(freq);
        const per = Math.floor((freq.length - 4) / n);
        for (let i = 0; i < n; i++) {
          let s = 0; for (let j = 0; j < per; j++) s += freq[2 + i * per + j];
          out[i] = clamp(s / per / 200, .12, 1);
        }
        return out;
      }
      const t = performance.now() / 1000;
      for (let i = 0; i < n; i++) out[i] = .3 + .35 * Math.abs(Math.sin(t * (2.1 + i * .37) + i)) + .25 * Math.abs(Math.sin(t * 5.3 + i * 1.7));
      return out;
    }
    function time() {
      if (mode === 'file') return { cur: audio.currentTime || 0, dur: audio.duration || 0 };
      if (mode === 'synth' && ctx) return { cur: ctx.currentTime - synthT0, dur: 0 };
      return { cur: 0, dur: 0 };
    }
    return {
      start, pause, resume, setVolume, levels, time,
      toggle() { playing ? pause() : resume(); },
      get playing() { return playing; },
      get mode() { return mode; },
      get fileOk() { return fileOk; },
      get volume() { return vol; },
      on(fn) { listeners.push(fn); }
    };
  })();

  /* Piano tổng hợp nhẹ nhàng — vòng hợp âm Fmaj7 · G · Em7 · Am, 70bpm */
  function createSynth(ctx, dest) {
    const out = ctx.createGain(); out.gain.value = .9;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
    const rev = ctx.createConvolver(); rev.buffer = impulse(ctx, 3, 2.4);
    const wet = ctx.createGain(); wet.gain.value = .45;
    out.connect(lp); lp.connect(dest); lp.connect(rev); rev.connect(wet); wet.connect(dest);

    const chords = [[41, 53, 57, 60, 64], [43, 55, 59, 62, 67], [40, 52, 55, 59, 62], [45, 57, 60, 64, 69]];
    const arp = [1, 2, 3, 4, 3, 2, 3, 2];
    const melody = { 0: 76, 3: 74, 4: 72, 6: 74, 8: 74, 11: 72, 12: 71, 14: 67, 16: 71, 19: 72, 20: 74, 22: 71, 24: 72, 27: 71, 28: 69, 30: 76 };
    const eighth = 60 / 70 / 2;
    let next = ctx.currentTime + .15, step = 0, alive = true;

    function note(m, t, v, dur) {
      const f = 440 * Math.pow(2, (m - 69) / 12);
      [[1, 1], [2, .42], [3, .18], [4, .08]].forEach(([mul, g]) => {
        const o = ctx.createOscillator(); const e = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f * mul; o.detune.value = rand(-3, 3);
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(v * g, t + .008);
        e.gain.exponentialRampToValueAtTime(.0001, t + dur / mul);
        o.connect(e); e.connect(out); o.start(t); o.stop(t + dur / mul + .05);
      });
    }
    function tick() {
      if (!alive) return;
      while (next < ctx.currentTime + .25) {
        const cyc = step % 32, bar = Math.floor(cyc / 8), c = chords[bar];
        if (cyc % 8 === 0) note(c[0], next, .16, 4);
        note(c[arp[step % 8]], next + rand(0, .012), step % 2 ? .055 : .075, 2.6);
        if (melody[cyc] && Math.floor(step / 32) % 2 === 1) note(melody[cyc], next + .01, .11, 3);
        else if (melody[cyc] && cyc % 8 === 0) note(melody[cyc], next + .01, .08, 3);
        next += eighth; step++;
      }
    }
    const iv = setInterval(tick, 60); tick();
    return {
      stop() {
        alive = false; clearInterval(iv);
        out.gain.setTargetAtTime(0, ctx.currentTime, .2);
        setTimeout(() => out.disconnect(), 2500);
      }
    };
  }
  function impulse(ctx, sec, decay) {
    const len = ctx.sampleRate * sec, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /* ---------- Player UI ---------- */
  (function player() {
    const el = $('#player');
    const disc = $('.player__disc', el), play = $('.player__play', el);
    const title = $('.player__title', el), src = $('.player__src', el), tm = $('.player__time', el);
    const bars = $$('.player__bars i', el);
    const range = $('.player__vol input', el), outv = $('.player__vol output', el);
    const fmt = (s) => { s = Math.max(0, s | 0); return String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

    if (isDesk()) el.classList.add('is-open');
    range.value = Math.round(Music.volume * 100); outv.textContent = range.value;

    disc.addEventListener('click', () => {
      buzz(8);
      if (!el.classList.contains('is-open')) { el.classList.add('is-open'); disc.setAttribute('aria-label', 'Thu gọn trình phát'); }
      else { el.classList.remove('is-open'); disc.setAttribute('aria-label', 'Mở trình phát nhạc'); }
    });
    play.addEventListener('click', () => { buzz(8); Music.toggle(); });
    range.addEventListener('input', () => { outv.textContent = range.value; Music.setVolume(range.value / 100); });

    function sync() {
      el.classList.toggle('playing', Music.playing);
      play.textContent = Music.playing ? '❚❚' : '▶';
      play.setAttribute('aria-label', Music.playing ? 'Tạm dừng' : 'Phát nhạc');
      const real = Music.mode === 'file' || (Music.mode === 'none' && Music.fileOk !== false);
      title.textContent = real ? C.music.title : C.music.fallbackTitle;
      src.textContent = real ? C.music.sub : C.music.fallbackSub;
    }
    Music.on(sync); sync();

    let lastT = 0;
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!RM) {
        const lv = Music.levels(bars.length);
        bars.forEach((b, i) => { b.style.transform = `scaleY(${lv[i].toFixed(3)})`; });
      }
      if (t - lastT > 500) {
        lastT = t;
        const { cur, dur } = Music.time();
        tm.textContent = dur ? `${fmt(cur)} / ${fmt(dur)}` : fmt(cur);
      }
    })(0);
  })();

  /* =========================================================
     STARS (cảnh 1) — canvas, 2 lớp parallax theo chuột / nghiêng máy
     ========================================================= */
  function starField(canvas, host) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, stars = [], shoot = null, on = false, tx = 0, ty = 0, px = 0, py = 0;
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 8000, 60, 160));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: rand(.4, 1.6), layer: Math.random() < .55 ? 1 : 2.2,
        ph: rand(0, 6.28), sp: 6.28 / rand(2000, 4000), gold: Math.random() < .25, cross: Math.random() < .07
      }));
    }
    function sparkle(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
      ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
    }
    function frame(t) {
      if (!on) return;
      requestAnimationFrame(frame);
      px += (tx - px) * .05; py += (ty - py) * .05;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = .25 + .75 * (.5 + .5 * Math.sin(t * s.sp + s.ph));
        const x = s.x + px * s.layer * 10, y = s.y + py * s.layer * 10;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.gold ? '#FFD98E' : (s.cross && s.layer > 2 ? '#FF8FB1' : '#FFF4EC');
        if (s.cross) sparkle(x, y, s.r * 4.5);
        else { ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill(); }
      }
      if (!shoot && Math.random() < .004) shoot = { x: rand(w * .2, w), y: rand(0, h * .4), l: 0 };
      if (shoot) {
        shoot.l += 1;
        const k = shoot.l / 50, x = shoot.x - k * 220, y = shoot.y + k * 110;
        const g = ctx.createLinearGradient(x, y, x + 60, y - 30);
        g.addColorStop(0, 'rgba(255,244,236,.9)'); g.addColorStop(1, 'rgba(255,244,236,0)');
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y - 30); ctx.stroke();
        if (shoot.l > 50) shoot = null;
      }
      ctx.globalAlpha = 1;
    }
    resize(); addEventListener('resize', resize);
    addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      tx = clamp(e.gamma / 45, -.5, .5); ty = clamp((e.beta - 45) / 45, -.5, .5);
    }, { passive: true });
    if (RM) { on = true; frame(0); on = false; return; }
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !on) { on = true; requestAnimationFrame(frame); }
      else if (!en.isIntersecting) on = false;
    }).observe(host);
  }

  /* ---------- Cánh hoa / tim rơi nhẹ toàn trang ---------- */
  function petalField(canvas) {
    if (RM) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, items = [];
    const colors = ['#FFB5A7', '#F28DA6', '#C9B6E4', '#FFE29A'];
    function make(y) {
      return { x: rand(0, w), y: y ?? rand(-h, 0), s: rand(5, 10), vy: rand(.25, .6), sw: rand(.4, 1.2), ph: rand(0, 6.28),
        rot: rand(0, 6.28), vr: rand(-.01, .01), c: colors[Math.random() * 4 | 0], heart: Math.random() < .35, a: rand(.35, .7) };
    }
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 600 ? 10 : 16;
      items = Array.from({ length: n }, () => make(rand(0, h)));
    }
    function heart(s) {
      ctx.beginPath();
      ctx.moveTo(0, s * .35);
      ctx.bezierCurveTo(-s, -s * .3, -s * .45, -s, 0, -s * .45);
      ctx.bezierCurveTo(s * .45, -s, s, -s * .3, 0, s * .35);
      ctx.fill();
    }
    function frame(t) {
      requestAnimationFrame(frame);
      if (body.classList.contains('night') || document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of items) {
        p.y += p.vy; p.rot += p.vr;
        const x = p.x + Math.sin(t / 1400 + p.ph) * 18 * p.sw;
        if (p.y > h + 20) Object.assign(p, make(-20));
        ctx.save(); ctx.translate(x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
        if (p.heart) heart(p.s);
        else { ctx.beginPath(); ctx.ellipse(0, 0, p.s * .55, p.s, 0, 0, 6.283); ctx.fill(); }
        ctx.restore();
      }
    }
    resize(); addEventListener('resize', resize); requestAnimationFrame(frame);
  }

  /* ---------- Con trỏ trái tim + vệt sáng (desktop) ---------- */
  function heartCursor() {
    if (!FINE || RM) return;
    body.classList.add('has-cursor');
    const cur = document.createElement('div');
    cur.className = 'cursor'; cur.innerHTML = '<span class="cursor__heart">♥</span>';
    body.appendChild(cur);
    const dots = Array.from({ length: 6 }, (_, i) => {
      const d = document.createElement('i'); d.className = 'cursor-dot';
      const s = 10 - i; d.style.width = d.style.height = s + 'px';
      d.style.opacity = (.65 - i * .09).toFixed(2);
      d.style.background = i < 2 ? '#F28DA6' : '#FFB5A7';
      body.appendChild(d); return { el: d, x: -50, y: -50, s };
    });
    let mx = -100, my = -100, hx = -100, hy = -100, shown = true;
    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      const hot = e.target.closest && e.target.closest('button, a, .pol, .ring__card, .tl__card, .voucher, input');
      cur.classList.toggle('is-hover', !!hot);
      if (!shown) { shown = true; cur.style.opacity = dots[0].el.style.display = ''; }
    }, { passive: true });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => { shown = false; cur.style.opacity = 0; });
    (function loop() {
      requestAnimationFrame(loop);
      hx += (mx - hx) * .35; hy += (my - hy) * .35;
      cur.style.transform = `translate3d(${hx}px,${hy}px,0)`;
      let px = hx, py = hy;
      dots.forEach((d, i) => {
        d.x += (px - d.x) * (.32 - i * .03); d.y += (py - d.y) * (.32 - i * .03);
        d.el.style.transform = `translate3d(${d.x - d.s / 2}px,${d.y - d.s / 2 + 6}px,0)`;
        d.el.style.visibility = shown ? '' : 'hidden';
        px = d.x; py = d.y;
      });
    })();
  }

  /* ---------- Sợi chỉ tiến trình ---------- */
  function thread() {
    const fill = $('.thread__fill'), heart = $('.thread__heart'), knotsBox = $('.thread__knots');
    const targets = ['#s1', '#s1', '#s3', '#s4', '#s5', '#s6', '#s7', '#s8'];
    const names = ['Màn chào', 'Mở thư', 'Happy Birthday', 'Bức thư', 'Thư viện ảnh', 'Dòng thời gian', 'Món quà', 'Kết thư'];
    const knots = targets.map((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'knot'; b.style.left = ((i + 1) * 12.5) + '%';
      b.setAttribute('aria-label', 'Đến cảnh ' + (i + 1) + ': ' + names[i]);
      b.addEventListener('click', () => { buzz(8); scrollToEl($(t)); });
      knotsBox.appendChild(b); return b;
    });
    const secs = ['#s3', '#s4', '#s5', '#s6', '#s7', '#s8'].map(s => $(s));
    function update() {
      const y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const anchors = [[0, State.opened ? .25 : .125]].concat(secs.map((s, i) => [Math.min(s.offsetTop, max), .375 + i * .125]));
      anchors[anchors.length - 1][0] = Math.min(anchors[anchors.length - 1][0], max);
      let p = anchors[0][1];
      for (let i = 1; i < anchors.length; i++) {
        const [y0, p0] = anchors[i - 1], [y1, p1] = anchors[i];
        if (y >= y1) p = p1;
        else if (y > y0) { p = p0 + (p1 - p0) * (y - y0) / Math.max(1, y1 - y0); break; }
        else break;
      }
      if (y >= max - 2) p = 1;
      const pc = (p * 100).toFixed(2) + '%';
      fill.style.width = pc; heart.style.left = pc;
      knots.forEach((k, i) => k.classList.toggle('passed', p >= (i + 1) * .125 - .001));
    }
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return update;
  }
  function scrollToEl(el) {
    const y = el.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  }
  function scrollTop() {
    return new Promise((res) => {
      window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
      const t0 = performance.now();
      (function chk() {
        if (scrollY < 2 || performance.now() - t0 > 3500) { window.scrollTo(0, 0); res(); }
        else requestAnimationFrame(chk);
      })();
    });
  }

  /* =========================================================
     State chung
     ========================================================= */
  const State = { opened: false };
  let updateThread = () => {};

  /* =========================================================
     CẢNH 1 + 2 · Mở phong bì
     ========================================================= */
  const gate = $('#s1');
  const envelope = $('#envelope');
  let openTl;

  function initGate() {
    gsap.set('.env__back', { z: 0 });
    gsap.set('.env__letter', { z: 2 });
    gsap.set('.env__pocket', { z: 4 });
    gsap.set('.env__flap', { z: 6, rotationX: 0, transformOrigin: '50% 0%' });
    gsap.set('.env__seal', { z: 8 });
    gsap.set('.gate__scroll', { y: 10 });
    gsap.set('.balloon', { opacity: 0 });

    openTl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .to('.gate__cta', { opacity: 0, y: 10, duration: .35, pointerEvents: 'none' }, 0)
      .to('.gate__msg--closed', { opacity: 0, y: -12, duration: .45 }, 0)
      .to('.seal__half--l', { x: -20, y: 30, rotation: -30, opacity: 0, duration: .5, ease: 'power2.in' }, 0)
      .to('.seal__half--r', { x: 20, y: 34, rotation: 26, opacity: 0, duration: .5, ease: 'power2.in' }, 0)
      .to('.env__flap', { rotationX: 180, z: 1, duration: .8, ease: 'back.out(1.5)' }, .2)
      .to('.gate__bg--dawn', { opacity: 1, duration: 1.2, ease: 'power1.inOut' }, .2)
      .to('.gate__stars', { opacity: .2, duration: 1.2 }, .2)
      .to('.env-pos', { y: () => isDesk() ? 40 : 64, duration: 1, ease: 'expo.out' }, .45)
      .to('.env__letter', { y: -120, duration: .9, ease: 'expo.out' }, .7)
      .fromTo('.gate__msg--open', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .8 }, .75)
      .to('.gate__scroll', { opacity: 1, y: 0, duration: .6, pointerEvents: 'auto' }, 1.4);

    if (FINE && !RM) {
      const rx = gsap.quickTo('.env-tilt', 'rotationX', { duration: .8, ease: 'power3' });
      const ry = gsap.quickTo('.env-tilt', 'rotationY', { duration: .8, ease: 'power3' });
      addEventListener('pointermove', (e) => {
        if (scrollY > innerHeight) return;
        ry((e.clientX / innerWidth - .5) * 20);
        rx(-(e.clientY / innerHeight - .5) * 20);
      }, { passive: true });
    }

    $('#openBtn').addEventListener('click', openLetter);
    $('.env__letter').addEventListener('click', () => { if (State.opened) scrollToEl($('#s3')); else openLetter(); });
    envelope.addEventListener('click', (e) => { if (!State.opened && !e.target.closest('.env__letter')) openLetter(); });
    $('.gate__scroll').addEventListener('click', (e) => { e.preventDefault(); scrollToEl($('#s3')); });
  }

  function openLetter() {
    if (State.opened) return;
    State.opened = true;
    buzz(20);
    Music.start();
    gate.classList.add('is-open');
    $('.gate__msg--open').removeAttribute('aria-hidden');
    $('.gate__msg--closed').setAttribute('aria-hidden', 'true');
    openTl.timeScale(1).play();
    setTimeout(() => { body.classList.remove('night'); themeColor('#FFF4EC'); }, 650);
    setTimeout(() => {
      const o = originOf(envelope);
      boom({ particleCount: 80, spread: 100, startVelocity: 45, origin: o });
      boom({ particleCount: 40, spread: 60, angle: 60, origin: { x: 0, y: .9 } });
      boom({ particleCount: 40, spread: 60, angle: 120, origin: { x: 1, y: .9 } });
    }, 450);
    balloonsUp();
    heartsUp();
    setTimeout(() => {
      body.classList.remove('is-locked');
      ST.refresh(); updateThread();
    }, RM ? 50 : 1100);
    updateThread();
  }

  function balloonsUp() {
    if (RM) return;
    $$('.balloon').forEach((b, i) => {
      gsap.killTweensOf(b);
      gsap.fromTo(b, { y: 0, x: 0, rotation: 0, opacity: 1 },
        { y: -(gate.offsetHeight + 360), duration: 8 + i * 1.5, delay: .3 + i * .4, ease: 'sine.in' });
      gsap.to(b, { x: '+=20', rotation: i % 2 ? 6 : -6, duration: 1.7 + i * .3, yoyo: true, repeat: 7, ease: 'sine.inOut', delay: .3 });
    });
  }
  function heartsUp() {
    if (RM) return;
    const r = envelope.getBoundingClientRect(), g = gate.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const h = document.createElement('span');
      h.className = 'rise-heart'; h.textContent = '♥';
      h.style.color = PAL[i % PAL.length];
      h.style.fontSize = rand(10, 20) + 'px';
      h.style.left = (r.left - g.left + r.width / 2 + rand(-40, 40)) + 'px';
      h.style.top = (r.top - g.top + r.height * .35) + 'px';
      gate.appendChild(h);
      gsap.fromTo(h, { opacity: 0, y: 0, scale: .4 }, {
        opacity: 1, y: rand(-260, -160), x: rand(-90, 90), scale: 1, duration: rand(1.8, 2.8), delay: .8 + i * .08, ease: 'power1.out',
        onComplete: () => gsap.to(h, { opacity: 0, duration: .5, onComplete: () => h.remove() })
      });
    }
  }

  /* =========================================================
     CẢNH 3 · Happy Birthday + bánh kem
     ========================================================= */
  const Hello = { played: false, blown: false };
  function initHello() {
    const texts = $$('.hb-text'), type = $('.type'), cake = $('#cake'), btn = $('#candleBtn'), mic = $('#micBtn');
    type.dataset.text = C.recipient.nick;

    function reset() {
      Hello.played = false;
      if (RM) { texts.forEach(t => { t.style.strokeDasharray = 'none'; t.style.fillOpacity = 1; }); type.textContent = type.dataset.text; return; }
      gsap.set(texts, { strokeDasharray: 700, strokeDashoffset: 700, fillOpacity: 0 });
      type.textContent = '';
      relight();
    }
    function play() {
      if (Hello.played || RM) return;
      Hello.played = true;
      gsap.timeline()
        .to(texts, { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut', stagger: .35 })
        .to(texts, { fillOpacity: 1, duration: .7, stagger: .2 }, '-=.7')
        .add(() => {
          const s = type.dataset.text; type.textContent = '';
          [...s].forEach((ch, i) => setTimeout(() => { type.textContent += ch; }, 120 + i * 90));
        }, '-=.3');
    }
    function blow() {
      if (Hello.blown) { relight(); return; }
      Hello.blown = true; cake.classList.add('blown'); buzz(30);
      btn.textContent = 'Điều ước đã bay lên trời rồi ✦ (chạm để thắp lại)';
      const o = originOf(cake);
      o.y -= .08;
      boom({ particleCount: 70, spread: 80, angle: 70, origin: o, startVelocity: 40 });
      setTimeout(() => boom({ particleCount: 70, spread: 80, angle: 110, origin: o, startVelocity: 40 }), 160);
    }
    function relight() {
      Hello.blown = false; cake.classList.remove('blown');
      btn.textContent = 'Chạm vào nến để thổi ✦';
    }
    btn.addEventListener('click', blow);
    $('.cake__hit').addEventListener('click', blow);

    /* Thổi thật vào micro */
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) mic.hidden = true;
    let listening = false;
    mic.addEventListener('click', async () => {
      if (listening) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        listening = true;
        const AC = window.AudioContext || window.webkitAudioContext;
        const ac = new AC(); const src = ac.createMediaStreamSource(stream);
        const an = ac.createAnalyser(); an.fftSize = 512; src.connect(an);
        const buf = new Uint8Array(an.fftSize);
        mic.textContent = 'Đang nghe… thổi mạnh vào micro nha 🌬️';
        let hits = 0; const t0 = performance.now();
        const stop = (msg) => {
          listening = false; stream.getTracks().forEach(t => t.stop()); ac.close();
          mic.textContent = msg || '🎤 hoặc thổi thật vào micro';
        };
        (function loop() {
          an.getByteTimeDomainData(buf);
          let sum = 0; for (let i = 0; i < buf.length; i++) { const d = (buf[i] - 128) / 128; sum += d * d; }
          const rms = Math.sqrt(sum / buf.length);
          hits = rms > .2 ? hits + 1 : Math.max(0, hits - 1);
          if (hits > 5) { if (!Hello.blown) blow(); return stop('Phù! Tắt hết rồi nè 🎉'); }
          if (performance.now() - t0 > 15000) return stop();
          requestAnimationFrame(loop);
        })();
      } catch (e) {
        mic.textContent = 'Micro chưa mở được, chạm vào nến cũng được nha ♥';
      }
    });

    /* Bánh nghiêng theo chuột */
    if (FINE && !RM) {
      $('#s3').addEventListener('pointermove', (e) => {
        const r = cake.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width - .5, -1, 1), y = clamp((e.clientY - r.top) / r.height - .5, -1, 1);
        cake.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
        cake.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      });
      $('#s3').addEventListener('pointerleave', () => { cake.style.setProperty('--ry', '0deg'); cake.style.setProperty('--rx', '0deg'); });
    }

    reset();
    ST.create({ trigger: '#s3', start: 'top 65%', onEnter: play });
    return reset;
  }

  /* =========================================================
     CẢNH 4 · Thư: đoạn văn hiện dần + highlight
     ========================================================= */
  function initLetter() {
    const ps = $$('.lp');
    function reveal(p) {
      if (p.classList.contains('on')) return;
      p.classList.add('on');
      if (!RM) gsap.to(p, { opacity: 1, filter: 'blur(0px)', y: 0, duration: .8, ease: 'expo.out' });
    }
    function reset() {
      ps.forEach(p => {
        p.classList.remove('on');
        if (!RM) gsap.set(p, { opacity: .28, filter: 'blur(4px)', y: 12 });
      });
      if (RM) ps.forEach(p => p.classList.add('on'));
    }
    reset();
    ps.forEach(p => ST.create({ trigger: p, start: 'top 84%', onEnter: () => reveal(p) }));

    /* Ảnh trang trí: parallax ngược chiều + giấy nghiêng theo chuột */
    if (!RM) {
      $$('.letter__deco').forEach(d => {
        const sp = parseFloat(d.dataset.speed || 1);
        gsap.fromTo(d, { y: (sp - 1) * 160 }, { y: (1 - sp) * 160, ease: 'none',
          scrollTrigger: { trigger: '#s4', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      if (FINE) {
        const paper = $('.paper');
        $('#s4').addEventListener('pointermove', (e) => {
          paper.style.setProperty('--py', ((e.clientX / innerWidth - .5) * 6).toFixed(2) + 'deg');
          paper.style.setProperty('--px', (-(e.clientY / innerHeight - .5) * 4).toFixed(2) + 'deg');
        });
        $('#s4').addEventListener('pointerleave', () => { paper.style.setProperty('--py', '0deg'); paper.style.setProperty('--px', '0deg'); });
      }
    }
    return reset;
  }

  /* =========================================================
     CẢNH 5 · Polaroid: xếp lệch + carousel 3D + lightbox
     ========================================================= */
  const PH_TONES = ['', 'ph--lav', 'ph--butter'];
  function photoBox(p, i) {
    const d = document.createElement('div');
    d.className = 'ph ' + PH_TONES[i % 3];
    const lab = document.createElement('span');
    lab.textContent = 'ảnh: ' + p.label;
    d.appendChild(lab);
    const img = new Image();
    img.alt = p.caption; img.decoding = 'async'; img.draggable = false;
    img.onload = () => d.classList.add('has-img');
    img.onerror = () => img.remove();
    img.src = p.src;
    d.appendChild(img);
    return d;
  }
  function tiltable(el) {
    el.addEventListener('pointermove', (e) => {
      if (RM || e.pointerType === 'touch' && !el.classList.contains('is-tilt')) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--ty', (x * 24).toFixed(2) + 'deg');
      el.style.setProperty('--tx', (-y * 24).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') el.classList.add('is-tilt'); });
    const off = () => { el.classList.remove('is-tilt'); el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); };
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') setTimeout(off, 250); });
  }

  function initGallery() {
    const P = C.photos;
    const stack = $('#galStack'), ring = $('#ring'), stage = $('.ring-stage');
    const ROT = [-7, 6, -3, 5, -6, 4, -4, 7, -2], WASHI = ['butter', 'lav', 'peach'], SPEED = [.85, 1.15, 1, 1.2, .8, 1.05, .9, 1.1, 1];

    /* Ảnh trang trí ở cảnh thư */
    $$('[data-photo]').forEach(box => {
      const p = P[+box.dataset.photo]; if (!p) return;
      const img = new Image(); img.alt = ''; img.onload = () => box.classList.add('has-img'); img.onerror = () => img.remove();
      img.src = p.src; box.appendChild(img);
    });

    /* --- Xếp lệch --- */
    P.forEach((p, i) => {
      const wrap = document.createElement('div'); wrap.className = 'pol-wrap'; wrap.dataset.speed = SPEED[i % SPEED.length];
      const drop = document.createElement('div'); drop.className = 'pol-drop';
      const fig = document.createElement('figure'); fig.className = 'pol'; fig.tabIndex = 0;
      fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', 'Xem ảnh: ' + p.caption);
      fig.style.setProperty('--r', ROT[i % ROT.length] + 'deg');
      const w = document.createElement('i'); w.className = 'washi washi--' + WASHI[i % 3];
      w.style.setProperty('--wr', (i % 2 ? 3 : -4) + 'deg');
      const cap = document.createElement('figcaption'); cap.className = 'pol__cap'; cap.textContent = p.caption;
      fig.append(w, photoBox(p, i), cap);
      drop.appendChild(fig); wrap.appendChild(drop); stack.appendChild(wrap);
      tiltable(fig);
      fig.addEventListener('click', () => openLB(i));
      fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLB(i); } });
    });

    let dropped = false;
    function dropIn() {
      if (dropped || RM) return; dropped = true;
      gsap.fromTo('.pol-drop', { y: -40, opacity: 0, rotation: -8 },
        { y: 0, opacity: 1, rotation: 0, duration: .7, ease: 'back.out(1.7)', stagger: .08 });
    }
    if (!RM) {
      gsap.set('.pol-drop', { opacity: 0 });
      ST.create({ trigger: stack, start: 'top 78%', onEnter: dropIn });
      $$('.pol-wrap').forEach(wr => {
        const sp = parseFloat(wr.dataset.speed);
        gsap.fromTo(wr, { y: (sp - 1) * -120 }, { y: (sp - 1) * 120, ease: 'none',
          scrollTrigger: { trigger: stack, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }

    /* --- Carousel 3D --- */
    const N = P.length;
    const cards = P.map((p, i) => {
      const f = document.createElement('figure'); f.className = 'ring__card';
      const cap = document.createElement('figcaption'); cap.textContent = p.caption;
      f.append(photoBox(p, i), cap);
      f.addEventListener('click', () => { if (!moved) openLB(i); });
      ring.appendChild(f); return f;
    });
    let R = 170, angle = 0, vel = 0, dragging = false, lastX = 0, startX = 0, moved = false, running = false, idleT = 0;
    function layout() {
      const w = ring.offsetWidth || 150;
      R = Math.round((w / 2) / Math.tan(Math.PI / N) + w * (w > 160 ? .75 : .45));
      cards.forEach((c, i) => { c.style.transform = `rotateY(${i * 360 / N}deg) translateZ(${R}px)`; });
    }
    function render() {
      ring.style.transform = `translateZ(${-R * .55}px) rotateX(-6deg) rotateY(${angle}deg)`;
      cards.forEach((c, i) => {
        const a = (i * 360 / N + angle) * Math.PI / 180;
        const f = (Math.cos(a) + 1) / 2;
        c.style.opacity = (.35 + .65 * f).toFixed(3);
        c.style.filter = `brightness(${(.75 + .25 * f).toFixed(3)})`;
      });
    }
    function loop(t) {
      if (!running) return;
      requestAnimationFrame(loop);
      if (!dragging) {
        angle += vel; vel *= .94;
        if (!RM && Math.abs(vel) < .05 && t - idleT > 1500) angle -= .12;
      }
      render();
    }
    stage.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false; startX = lastX = e.clientX; vel = 0; stage.classList.add('dragging');
    });
    addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      if (Math.abs(e.clientX - startX) > 6) moved = true;
      angle += dx * .35; vel = dx * .35;
    });
    const end = () => { if (!dragging) return; dragging = false; idleT = performance.now(); stage.classList.remove('dragging'); };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    addEventListener('resize', () => { if (running) layout(); });

    /* --- Đổi chế độ --- */
    const segs = $$('.seg__btn'), stackBox = $('#galStack'), carBox = $('#galCarousel');
    segs.forEach(b => b.addEventListener('click', () => {
      const mode = b.dataset.mode; buzz(8);
      segs.forEach(s => { const on = s === b; s.classList.toggle('is-on', on); s.setAttribute('aria-selected', on); });
      const show = mode === 'carousel' ? carBox : stackBox, hide = mode === 'carousel' ? stackBox : carBox;
      if (!show.hidden) return;
      hide.hidden = true; show.hidden = false;
      if (mode === 'carousel') { layout(); running = true; requestAnimationFrame(loop); }
      else { running = false; if (!dropped) dropIn(); }
      if (!RM) gsap.fromTo(show, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' });
      ST.refresh();
    }));

    /* --- Lightbox --- */
    const lb = $('#lightbox'), lbImg = $('.lb__img', lb), lbCap = $('.lb__cap', lb), lbPol = $('.lb__pol', lb);
    let cur = 0, lastFocus = null;
    function fill(i) {
      cur = (i + N) % N;
      lbImg.innerHTML = ''; lbImg.appendChild(photoBox(P[cur], cur));
      lbCap.textContent = P[cur].caption;
    }
    function openLB(i) {
      lastFocus = document.activeElement; fill(i); lb.hidden = false; buzz(8);
      if (!RM) gsap.fromTo(lbPol, { scale: .85, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: -1.5, duration: .6, ease: 'back.out(1.6)' });
      $('.lb__close', lb).focus();
    }
    function closeLB() { lb.hidden = true; if (lastFocus) lastFocus.focus(); }
    function step(d) {
      fill(cur + d);
      if (!RM) gsap.fromTo(lbPol, { x: d * 40, opacity: 0 }, { x: 0, opacity: 1, duration: .4, ease: 'expo.out' });
    }
    $('.lb__close', lb).addEventListener('click', closeLB);
    $('.lb__nav--prev', lb).addEventListener('click', () => step(-1));
    $('.lb__nav--next', lb).addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
    addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    let sx = null;
    lbPol.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    lbPol.addEventListener('pointerup', (e) => { if (sx != null && Math.abs(e.clientX - sx) > 50) step(e.clientX < sx ? 1 : -1); sx = null; });
  }

  /* =========================================================
     CẢNH 6 · Dòng thời gian: đường chỉ vẽ dần theo cuộn
     ========================================================= */
  function initTimeline() {
    const tl = $('#tl'), list = $('#tlList'), base = $('.tl__base', tl), draw = $('.tl__draw', tl), svg = $('.tl__svg', tl);
    C.timeline.forEach((m) => {
      const li = document.createElement('li'); li.className = 'tl__item tone-' + m.tone;
      const ic = document.createElement('span'); ic.className = 'tl__icon'; ic.textContent = m.icon; ic.setAttribute('aria-hidden', 'true');
      if (m.rain) { const r = document.createElement('span'); r.className = 'rain'; r.innerHTML = '<i></i><i></i><i></i>'; ic.appendChild(r); }
      const card = document.createElement('button'); card.type = 'button'; card.className = 'tl__card'; card.setAttribute('aria-expanded', 'false');
      const mk = (cls, txt, tag = 'span') => { const e = document.createElement(tag); e.className = cls; e.textContent = txt; return e; };
      const more = document.createElement('span'); more.className = 'tl__more';
      const inner = document.createElement('span'); inner.appendChild(mk('tl__story', m.story)); more.appendChild(inner);
      card.append(mk('tl__date', m.date), mk('tl__title', m.title.replace('{age}', AGE)), mk('tl__text', m.text), more, mk('tl__plus', '+'));
      card.addEventListener('click', () => {
        buzz(8);
        const open = li.classList.toggle('open');
        card.setAttribute('aria-expanded', open);
      });
      li.append(ic, card); list.appendChild(li);
    });
    const items = $$('.tl__item', list), icons = items.map(i => $('.tl__icon', i));
    let len = 0, ys = [], H = 1, prog = 0;

    function build() {
      const box = tl.getBoundingClientRect();
      H = box.height;
      const pts = icons.map(ic => { const r = ic.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; });
      ys = pts.map(p => p[1]);
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dy = y1 - y0, s = (i % 2 ? 1 : -1) * 18;
        d += ` C ${x0 + s} ${y0 + dy * .4}, ${x1 + s} ${y1 - dy * .4}, ${x1} ${y1}`;
      }
      base.setAttribute('d', d); draw.setAttribute('d', d);
      len = draw.getTotalLength();
      draw.style.strokeDasharray = len;
      set(prog);
    }
    function set(p) {
      prog = p;
      const y = RM ? Infinity : p * H;
      const q = RM ? 1 : clamp((y - ys[0]) / Math.max(1, ys[ys.length - 1] - ys[0]), 0, 1);
      draw.style.strokeDashoffset = len * (1 - q);
      items.forEach((it, i) => { if (y >= ys[i] - 6) it.classList.add('on'); });
    }
    function reset() { items.forEach(i => i.classList.remove('on', 'open')); set(0); }
    build();
    new ResizeObserver(() => build()).observe(tl);
    ST.create({ trigger: tl, start: 'top 72%', end: 'bottom 60%', onUpdate: (s) => set(s.progress) });
    return reset;
  }

  /* =========================================================
     CẢNH 7 · Hộp quà + voucher
     ========================================================= */
  function initGift() {
    const sec = $('#s7'), box = $('#giftBox'), btn = $('#giftBtn'), wrap = $('#vouchers');
    const eyebrow = $('#giftEyebrow'), title = $('#giftTitle');
    $('#voucherCount').textContent = C.vouchers.length;
    let open = false;

    function voucherEl(v) {
      const b = document.createElement('button'); b.type = 'button';
      const t = document.createElement('span'); t.className = 'voucher__title'; t.textContent = v.title;
      const x = document.createElement('span'); x.className = 'voucher__text'; x.textContent = v.text;
      const st = document.createElement('span'); st.className = 'voucher__stamp'; st.textContent = 'ĐÃ NHẬN ♥';
      if (v.main) {
        b.className = 'voucher voucher--main';
        const stub = document.createElement('span'); stub.className = 'voucher__stub'; stub.textContent = 'VOUCHER';
        const bd = document.createElement('span'); bd.className = 'voucher__body'; bd.append(t, x);
        b.append(stub, bd, st);
      } else {
        b.className = 'voucher voucher--mini voucher--' + (v.tone || 'butter');
        b.append(t, x, st);
      }
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        const on = b.classList.toggle('claimed'); b.setAttribute('aria-pressed', on); buzz(on ? 25 : 8);
        if (on) boom({ particleCount: 30, spread: 50, startVelocity: 25, origin: originOf(b), scalar: .7 });
      });
      return b;
    }
    function openGift() {
      if (open) return closeGift();
      open = true; buzz(20);
      sec.classList.add('is-open');
      box.setAttribute('aria-label', 'Đóng hộp quà');
      eyebrow.textContent = 'MÓN QUÀ NHỎ · ĐÃ MỞ';
      title.innerHTML = '';
      title.append(C.vouchers.length + ' voucher yêu thương,', document.createElement('br'), 'em dùng lúc nào cũng được');
      wrap.innerHTML = '';
      const mains = C.vouchers.filter(v => v.main), minis = C.vouchers.filter(v => !v.main);
      mains.forEach(v => wrap.appendChild(voucherEl(v)));
      for (let i = 0; i < minis.length; i += 2) {
        const row = document.createElement('div'); row.className = 'v-row';
        minis.slice(i, i + 2).forEach(v => row.appendChild(voucherEl(v)));
        wrap.appendChild(row);
      }
      const note = document.createElement('p'); note.className = 'v-note'; note.textContent = 'Chạm vào voucher để "kích hoạt" rồi chụp màn hình gửi anh nha 📸';
      wrap.appendChild(note);
      const o = originOf(box); o.y -= .05;
      setTimeout(() => boom({ particleCount: 110, spread: 90, startVelocity: 42, origin: o }), 350);
      if (!RM) gsap.fromTo(wrap.querySelectorAll('.voucher, .v-note'), { y: 30, scale: .8, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: .7, ease: 'back.out(1.7)', stagger: .12, delay: .45, clearProps: 'transform' });
      ST.refresh();
    }
    function closeGift() {
      open = false;
      sec.classList.remove('is-open');
      box.setAttribute('aria-label', 'Mở hộp quà');
      eyebrow.textContent = 'MÓN QUÀ NHỎ';
      title.innerHTML = 'Anh có cái này<br>cho em nè…';
      wrap.innerHTML = '';
      ST.refresh();
    }
    box.addEventListener('click', openGift);
    btn.addEventListener('click', openGift);
    if (!RM) gsap.from(box, { scale: .7, opacity: 0, duration: .9, ease: 'back.out(1.8)', scrollTrigger: { trigger: box, start: 'top 85%' } });
    return () => { if (open) closeGift(); };
  }

  /* =========================================================
     CẢNH 8 · Kết thư: chữ ký, dấu sáp, pháo hoa, đom đóm
     ========================================================= */
  function endingFx(canvas, host) {
    if (RM) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, flies = [], sparks = [], on = false, nextBurst = 0;
    const sprite = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,247,214,1)'); gr.addColorStop(.25, 'rgba(255,226,154,.85)'); gr.addColorStop(1, 'rgba(255,226,154,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
    })();
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flies = Array.from({ length: 20 }, () => ({ x: rand(0, w), y: rand(h * .2, h), vx: rand(-.3, .3), vy: rand(-.3, .3), ph: rand(0, 6.28), s: rand(10, 22) }));
    }
    function burst() {
      const x = rand(w * .12, w * .88), y = rand(h * .08, h * .38);
      const col = Math.random() < .5 ? ['#FFD98E', '#FFE29A'] : ['#F28DA6', '#FFB5A7'];
      const n = 34;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283, sp = rand(1.6, 3.2);
        sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: col[i % 2] });
      }
    }
    function frame(t) {
      if (!on) return;
      requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      if (t > nextBurst) { burst(); nextBurst = t + rand(1100, 2000); }
      ctx.globalCompositeOperation = 'lighter';
      for (const f of flies) {
        f.vx += rand(-.04, .04); f.vy += rand(-.04, .04);
        f.vx = clamp(f.vx, -.5, .5); f.vy = clamp(f.vy, -.5, .5);
        f.x = (f.x + f.vx + w) % w; f.y = (f.y + f.vy + h) % h;
        ctx.globalAlpha = .35 + .65 * (.5 + .5 * Math.sin(t / 600 + f.ph));
        ctx.drawImage(sprite, f.x - f.s / 2, f.y - f.s / 2, f.s, f.s);
      }
      ctx.globalCompositeOperation = 'source-over';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx; s.y += s.vy; s.vy += .03; s.vx *= .985; s.vy *= .985; s.life -= .013;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life; ctx.strokeStyle = s.c; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    resize(); addEventListener('resize', resize);
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !on) { on = true; requestAnimationFrame(frame); }
      else if (!en.isIntersecting) on = false;
    }, { threshold: .15 }).observe(host);
  }

  function initEnding() {
    const text = $('.sign__text'), line = $('.sign__line'), wax = $('#wax');
    const LL = line.getTotalLength();
    text.textContent = C.sender.short;
    let played = false;
    function reset() {
      played = false; wax.classList.remove('beat');
      if (RM) { gsap.set(text, { fillOpacity: 1 }); return; }
      gsap.set(text, { strokeDasharray: 900, strokeDashoffset: 900, fillOpacity: 0 });
      gsap.set(line, { strokeDasharray: LL, strokeDashoffset: LL });
      gsap.set(wax, { opacity: 0, scale: 1.6 });
    }
    function play() {
      if (played || RM) return; played = true;
      gsap.timeline({ delay: .2 })
        .to(text, { strokeDashoffset: 0, duration: 2, ease: 'power1.inOut' })
        .to(text, { fillOpacity: 1, duration: .6 }, '-=.6')
        .to(line, { strokeDashoffset: 0, duration: .6, ease: 'power2.out' }, '-=.3')
        .to(wax, { opacity: 1, scale: 1, duration: .45, ease: 'power4.in' })
        .add(() => {
          buzz(30);
          gsap.fromTo(wax, { x: -3 }, { x: 0, duration: .3, ease: 'elastic.out(1, .3)' });
          wax.classList.add('beat');
          boom({ particleCount: 60, spread: 120, startVelocity: 30, origin: originOf(wax), shapes: ['circle'] });
        });
    }
    reset();
    ST.create({ trigger: '#s8', start: 'top 55%', onEnter: play });
    endingFx($('.ending__fx'), $('#s8'));
    return reset;
  }

  /* =========================================================
     Đọc lại từ đầu
     ========================================================= */
  function initReplay(resets) {
    $('#replayBtn').addEventListener('click', async () => {
      buzz(10);
      await scrollTop();
      resets.forEach(fn => fn && fn());
      State.opened = false;
      body.classList.add('is-locked', 'night');
      themeColor('#1B1535');
      gate.classList.remove('is-open');
      $('.gate__msg--open').setAttribute('aria-hidden', 'true');
      $('.gate__msg--closed').removeAttribute('aria-hidden');
      $$('.balloon').forEach(b => { gsap.killTweensOf(b); gsap.set(b, { opacity: 0, y: 0, x: 0 }); });
      openTl.timeScale(1.5).reverse();
      updateThread();
      ST.refresh();
    });
  }

  /* =========================================================
     Khởi động
     ========================================================= */
  function boot() {
    starField($('.gate__stars'), gate);
    petalField($('.petals'));
    heartCursor();
    initGate();
    const resets = [initHello(), initLetter()];
    initGallery();
    resets.push(initTimeline(), initGift(), initEnding());
    initReplay(resets);
    updateThread = thread();
    updateThread();
    ST.refresh();
  }

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1800))]).then(() => {
    window.scrollTo(0, 0);
    boot();
  });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
})();
