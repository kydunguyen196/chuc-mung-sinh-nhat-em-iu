/* =========================================================
   audio.js — nhạc nền (mp3 nếu có, không thì piano tổng hợp) + SFX tổng hợp
   Mọi thứ đi qua một AudioContext, mở khoá ở lần chạm "mở thư".
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { C, $, clamp, rand } = HB;
  const audio = $('#song');
  const canRoute = /^https?:$/.test(location.protocol); // file:// không đưa <audio> qua Web Audio được (CORS)
  let ctx = null, master = null, musicGain = null, sfxGain = null, noiseBuf = null;
  let routed = false, mode = 'none', playing = false, muted = false, fileOk = null, synth = null;
  let vol = C.music.volume, duckF = 1;
  const listeners = [];
  const emit = () => listeners.forEach(fn => fn());

  audio.src = C.music.src;
  audio.addEventListener('canplay', () => { fileOk = true; emit(); });
  audio.addEventListener('error', () => { fileOk = false; emit(); });

  function ensure() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = .9; sfxGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const viaGain = () => mode === 'synth' || (mode === 'file' && routed);
  function fade(to, dur) {
    if (viaGain() && ctx) {
      const g = musicGain.gain, t = ctx.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(to, t + dur);
    } else if (window.gsap) {
      window.gsap.to(audio, { volume: clamp(to, 0, 1), duration: dur, ease: 'sine.inOut', overwrite: true });
    }
  }
  const target = () => vol * duckF;

  async function start() {
    ensure();
    if (playing) return;
    if (fileOk !== false) {
      try {
        if (canRoute && ctx && !routed) { ctx.createMediaElementSource(audio).connect(musicGain); routed = true; }
        audio.volume = routed ? 1 : 0; audio.muted = muted;
        mode = 'file';
        await audio.play();
        playing = true; fade(target(), 2.4); emit();
        return;
      } catch (e) { mode = 'none'; }
    }
    startSynth();
  }
  function startSynth() {
    if (!ensure()) return;
    mode = 'synth';
    if (!synth) synth = createSynth(ctx, musicGain);
    playing = true; fade(target(), 2.4); emit();
  }
  function stop(dur = .8) {
    if (!playing) return;
    playing = false; fade(0, dur);
    setTimeout(() => {
      if (playing) return;
      if (mode === 'file') { audio.pause(); try { audio.currentTime = 0; } catch (e) { /* noop */ } }
      if (synth) { synth.stop(); synth = null; }
    }, dur * 1000 + 40);
    emit();
  }
  function setMuted(m) {
    muted = m; audio.muted = m;
    if (ctx) { const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(m ? 0 : 1, t, .08); }
    emit();
  }
  /* Hạ nhạc xuống f lần (lá thư, lúc nghe micro) */
  function duck(f, dur = 1.2) { duckF = f; if (playing) fade(target(), dur); }

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
        const o = ctx.createOscillator(), e = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f * mul; o.detune.value = rand(-3, 3);
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(v * g, t + .008);
        e.gain.exponentialRampToValueAtTime(.0001, t + dur / mul);
        o.connect(e); e.connect(out); o.start(t); o.stop(t + dur / mul + .05);
      });
    }
    function tick() {
      if (!alive) return;
      if (next < ctx.currentTime) next = ctx.currentTime + .05; // tab bị ngủ: bỏ qua phần lỡ nhịp
      while (next < ctx.currentTime + .25) {
        const cyc = step % 32, c = chords[Math.floor(cyc / 8)];
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
        setTimeout(() => { out.disconnect(); wet.disconnect(); lp.disconnect(); rev.disconnect(); }, 2500);
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

  /* ---------- SFX tổng hợp ---------- */
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
  }
  function tone(f0, f1, dur, g, type = 'sine', at = 0) {
    const t = ctx.currentTime + at, o = ctx.createOscillator(), e = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + .01); e.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(e); e.connect(sfxGain); o.start(t); o.stop(t + dur + .05);
  }
  function burst(freq, q, dur, g, type = 'lowpass', at = 0, f1) {
    const t = ctx.currentTime + at, s = noise(), f = ctx.createBiquadFilter(), e = ctx.createGain();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + dur * .15); e.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(e); e.connect(sfxGain); s.start(t); s.stop(t + dur + .05);
  }
  const ready = () => ctx && ctx.state === 'running' && !muted;
  const sfx = {
    tick() { if (ready()) tone(1100, 1500, .07, .025); },
    pop() { if (ready()) { tone(520, 880, .16, .07); tone(1040, 1560, .2, .03, 'sine', .04); } },
    chime() { if (ready()) [76, 83, 88, 95].forEach((m, i) => { const f = 440 * Math.pow(2, (m - 69) / 12); tone(f, f, 2.2, .07, 'sine', i * .11); tone(f * 2.01, f * 2.01, 1.1, .02, 'sine', i * .11); }); },
    sparkle() { if (ready()) [91, 95, 98, 103].forEach((m, i) => { const f = 440 * Math.pow(2, (m - 69) / 12); tone(f, f, .9, .035, 'sine', i * .06); }); },
    whoosh() { if (ready()) burst(900, .8, .9, .22, 'bandpass', 0, 220); },
    boom() {
      if (!ready()) return;
      burst(220, .7, .7, .5, 'lowpass', 0, 60);
      for (let i = 0; i < 9; i++) burst(rand(3000, 6500), 4, .05, rand(.04, .1), 'bandpass', .12 + rand(0, .7));
    }
  };

  HB.audio = {
    start, stop, duck, setMuted, ensure, sfx,
    toggleMute() { setMuted(!muted); return muted; },
    on(fn) { listeners.push(fn); },
    get ctx() { return ctx; },
    get playing() { return playing; },
    get muted() { return muted; },
    get real() { return mode === 'file' || (mode === 'none' && fileOk !== false); }
  };
})();
