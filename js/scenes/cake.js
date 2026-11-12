/* =========================================================
   CẢNH 5 · Bánh kem & điều ước (cao trào)
   Thổi thật vào micro (Web Audio, chỉ xin quyền khi bấm) hoặc chạm-và-giữ.
   Lực thổi tích dần → nến tắt từng cây → khói → pháo hoa → nhập điều ước
   → điều ước bay thành sao băng. Điều ước không được lưu hay gửi đi đâu.
   ========================================================= */
HB.scene('cake', () => {
  'use strict';
  const { $, C, RM, clamp, rand } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const A = HB.audio, sky = HB.sky, cake = HB.cake3d, N = cake.count;
  const sec = $('#cake'), flat = $('.cake__flat'), title = $('#cakeTitle'), status = $('#cakeStatus'), meter = $('#cakeMeter');
  const blowStep = $('#cakeBlow'), form = $('#wishForm'), input = $('#wishInput'), doneStep = $('#cakeDone');
  const micBtn = $('#micBtn'), holdBtn = $('#holdBtn');
  const TITLE = title.textContent;
  $('.cake__label').textContent = C.wish.label; input.placeholder = C.wish.placeholder;
  $('#wishNote').textContent = C.wish.note; $('button', form).firstElementChild.textContent = C.wish.send;
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) micBtn.hidden = true;

  let power = 0, out = 0, done = false, holding = false, mic = null, level = 0, calls = [];
  const say = (t) => { status.textContent = t; };
  const later = (t, fn) => { calls.push(gsap.delayedCall(t, fn)); };

  /* ---------- Micro ---------- */
  async function startMic() {
    if (mic || done) return;
    say('Đang xin quyền dùng micro…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = A.ensure(); if (!ctx) { stream.getTracks().forEach(t => t.stop()); throw new Error('no audio context'); }
      const src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
      an.fftSize = 1024; an.smoothingTimeConstant = .5; src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount), hi = Math.max(4, Math.round(900 / (ctx.sampleRate / an.fftSize)));
      const t0 = performance.now(); let base = 0, n = 0;
      A.duck(.1, .4); // hạ nhạc để loa không tự "thổi" vào micro
      mic = {
        read() {
          an.getByteFrequencyData(buf);
          let s = 0; for (let i = 1; i < hi; i++) s += buf[i];
          const v = s / (hi - 1) / 255, el = performance.now() - t0;
          if (el < 450) { base = (base * n + v) / (n + 1); n++; return 0; } // đo tiếng ồn nền
          if (el > 20000) { stopMic('Chưa nghe thấy gì cả. Em thử lại, hoặc chạm và giữ nha.'); return 0; }
          return clamp((v - base - .1) / .3, 0, 1);
        },
        stop() { stream.getTracks().forEach(t => t.stop()); src.disconnect(); }
      };
      micBtn.classList.add('is-held');
      say('Đang nghe… thổi mạnh vào micro nha');
    } catch (e) {
      say('Micro chưa mở được, chạm và giữ cũng được nha ♥');
    }
  }
  function stopMic(msg) {
    if (!mic) return;
    mic.stop(); mic = null; A.duck(1, .8); micBtn.classList.remove('is-held');
    if (msg) say(msg);
  }
  micBtn.addEventListener('click', () => { HB.buzz(8); mic ? stopMic('') : startMic(); });

  /* ---------- Chạm & giữ ---------- */
  const hold = (on) => {
    if (done) on = false;
    if (holding === on) return;
    holding = on; holdBtn.classList.toggle('is-held', on);
    if (on) { HB.buzz(8); say('Giữ tiếp nha…'); }
  };
  holdBtn.addEventListener('pointerdown', (e) => { try { holdBtn.setPointerCapture(e.pointerId); } catch (err) { /* noop */ } hold(true); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => holdBtn.addEventListener(ev, () => hold(false)));
  holdBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  holdBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hold(true); } });
  holdBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') hold(false); });

  /* ---------- Lực thổi ---------- */
  gsap.ticker.add((t, dms) => {
    if (done || (!holding && !mic && power <= out / N)) { if (level) { level = 0; cake.setBlow(0); } return; }
    const dt = Math.min(.12, dms / 1000), lv = holding ? .85 : (mic ? mic.read() : 0);
    level += (lv - level) * Math.min(1, dt * 10);
    cake.setBlow(level);
    if (lv > .22) power = Math.min(1, power + dt * lv * 1.15);
    else power = Math.max(out / N, power - dt * .25);
    meter.style.transform = `scaleX(${power.toFixed(3)})`;
    const want = Math.floor(power * N + .001);
    while (out < want) { cake.extinguish(out); out++; HB.buzz(12); }
    if (power >= 1) finish();
  });

  function finish() {
    done = true; holding = false; holdBtn.classList.remove('is-held');
    stopMic(''); cake.setBlow(0); flat.classList.add('is-out'); sec.classList.add('is-blown');
    HB.buzz(30); A.sfx.whoosh();
    say('Phù! Tắt hết rồi nè');
    blowStep.hidden = true;
    if (!RM) for (let i = 0; i < 6; i++) later(.5 + i * .34, () => { sky.firework(rand(.14, .86), rand(.1, .42), i); if (i % 2 === 0) A.sfx.boom(); });
    later(RM ? .1 : 1.5, () => {
      title.textContent = 'Nến tắt rồi, giờ gửi điều ước lên trời nha';
      form.hidden = false; say('');
      if (!RM) gsap.fromTo(form, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out' });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = input.value.trim();
    if (!txt) { say('Em viết một điều ước đã nha'); input.focus(); return; }
    const r = input.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    input.blur(); input.value = ''; form.hidden = true; doneStep.hidden = false;
    title.textContent = 'Chúc mừng sinh nhật em'; say(C.wish.done);
    A.sfx.sparkle(); HB.buzz(20);
    if (RM) return;
    const fly = document.createElement('span'); fly.className = 'wish-fly'; fly.textContent = txt;
    document.body.appendChild(fly);
    gsap.fromTo(fly, { x: cx, y: cy, xPercent: -50, yPercent: -50, scale: 1, opacity: 1 },
      { y: cy - 110, scale: .25, opacity: 0, filter: 'blur(6px)', duration: 1, ease: 'power3.in', onComplete: () => fly.remove() });
    later(.85, () => { sky.shoot(cx, cy - 110, innerWidth * 1.05, -innerHeight * .12, { dur: 1.5, len: 3.4, w: .15 }); sky.flash(.008, .8); });
  });

  function relight() {
    calls.forEach(c => c.kill()); calls = [];
    stopMic(''); power = 0; out = 0; level = 0; done = false; holding = false;
    cake.relight(); cake.setBlow(0); flat.classList.remove('is-out'); sec.classList.remove('is-blown');
    meter.style.transform = 'scaleX(0)';
    title.textContent = TITLE; say(''); input.value = '';
    blowStep.hidden = false; form.hidden = true; doneStep.hidden = true;
    gsap.set(form, { clearProps: 'all' });
  }
  $('#relightBtn').addEventListener('click', () => { HB.buzz(8); relight(); });

  /* Rời cảnh thì trả micro lại */
  ST.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onLeave: () => stopMic(''), onLeaveBack: () => stopMic('') });

  return relight;
});
