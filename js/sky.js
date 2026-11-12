/* =========================================================
   sky.js — bầu trời WebGL chạy suốt bộ phim (Three.js r149)
   Nền đêm→bình minh (shader), trường sao, bụi sao biến hình (tim / tên / tuổi),
   sao băng, pháo hoa, và một pass sắc sai chỉ bật ở khoảnh khắc chuyển cảnh.
   Không có WebGL → HB.sky là bản thay thế rỗng, CSS lo phần nền.
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { clamp, rand, RM, Q, bus, pointer, qs } = HB;
  const gsap = window.gsap, THREE = window.THREE;
  const root = document.documentElement;
  const canvas = document.getElementById('sky');
  const cssDawn = (v) => root.style.setProperty('--dawn', v.toFixed(3));
  const dawnOf = (p) => Math.pow(clamp(p, 0, 1), 1.6);

  const stub = {
    ok: false, camera: null,
    setScroll(p) { cssDawn(dawnOf(p)); }, setPull() {}, warp() {}, flash() {}, burst() {}, morph() {}, setDustAnchor() {}, pulse() {},
    shoot() { return Promise.resolve(); },
    firework(x, y) { HB.boom({ origin: { x, y }, particleCount: 46, spread: 360, startVelocity: 20, gravity: .6, ticks: 120 }); },
    toWorld() { return { x: 0, y: 0, s: 1 }; }, reset() { cssDawn(0); }, add() {}, onFrame() {}
  };
  HB.sky = stub;

  function hasGL() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  if (!gsap || !THREE || qs.has('nowebgl') || !hasGL()) { root.classList.add('no-webgl'); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.tier === 2, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { root.classList.add('no-webgl'); return; }
  renderer.setClearColor(0x060914, 1);
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 200);
  camera.position.z = 10;
  let vw = 1, vh = 1;
  const uTime = { value: 0 }, uPx = { value: 1 };

  /* ---------- Nền trời ---------- */
  const bgU = { uDawn: { value: 0 }, uTime, uAspect: { value: 1 }, uFlash: { value: 0 } };
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const bgMat = new THREE.ShaderMaterial({
    defines: { NOISE_OCT: Q.t.oct }, uniforms: bgU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision highp float;
      varying vec2 vUv; uniform float uDawn, uTime, uAspect, uFlash;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
      #if NOISE_OCT > 0
      float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < NOISE_OCT; i++){ s += a*noise(p); p = p*2.03 + 17.; a *= .5; } return s; }
      #endif
      void main(){
        float y = vUv.y;
        vec3 night = mix(vec3(.105,.090,.235), mix(vec3(.043,.063,.149), vec3(.018,.026,.072), smoothstep(.35,1.,y)), smoothstep(0.,.42,y));
        vec3 dawn = mix(vec3(.66,.38,.43), mix(vec3(.29,.20,.42), vec3(.085,.082,.225), smoothstep(.28,.95,y)), smoothstep(0.,.36,y));
        vec3 col = mix(night, dawn, uDawn);
        #if NOISE_OCT > 0
        vec2 p = vec2(vUv.x*uAspect, y) * 2.1;
        float n = fbm(p + vec2(uTime*.010, 0.));
        float n2 = fbm(p*1.7 - vec2(0., uTime*.008) + n);
        float band = smoothstep(.42,.86,n2) * smoothstep(1.25,.15, abs(y - .64 - .22*(vUv.x-.5)) * 3.);
        col += vec3(.20,.16,.34) * band * .6 * (1. - uDawn*.65);
        col += vec3(.96,.70,.58) * smoothstep(.45,1.,n) * .07 * uDawn;
        #endif
        col += vec3(1.,.70,.56) * exp(-y*8.5) * uDawn * .34;
        float sd = distance(vec2((vUv.x-.5)*uAspect, y), vec2(0., -.20 + .13*smoothstep(.72,1.,uDawn)));
        col += vec3(1.,.84,.62) * smoothstep(.30,0.,sd) * smoothstep(.66,1.,uDawn) * .7;
        col += uFlash * vec3(1.,.92,.82);
        col += (hash(gl_FragCoord.xy + fract(uTime)) - .5) / 128.;
        gl_FragColor = vec4(col, 1.);
      }`
  });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.frustumCulled = false; bg.renderOrder = -10;
  scene.add(bg);

  /* ---------- Trường sao ---------- */
  const SN = Q.max.stars;
  const sPos = new Float32Array(SN * 3), sSize = new Float32Array(SN), sPhase = new Float32Array(SN), sTint = new Float32Array(SN);
  for (let i = 0; i < SN; i++) {
    sPos[i * 3] = rand(-70, 70); sPos[i * 3 + 1] = rand(-45, 70); sPos[i * 3 + 2] = rand(-75, -12);
    sSize[i] = Math.random() < .06 ? rand(2.6, 4.2) : rand(.9, 2.2);
    sPhase[i] = Math.random(); sTint[i] = Math.random() < .28 ? rand(.5, 1) : 0;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  sGeo.setAttribute('aPhase', new THREE.BufferAttribute(sPhase, 1));
  sGeo.setAttribute('aTint', new THREE.BufferAttribute(sTint, 1));
  const sU = { uTime, uPx, uAlpha: { value: 1 }, uTwinkle: { value: RM ? 0 : 1 } };
  const stars = new THREE.Points(sGeo, new THREE.ShaderMaterial({
    uniforms: sU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize, aPhase, aTint; uniform float uTime, uPx, uTwinkle; varying float vA, vTint;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        float tw = .58 + .42 * sin(uTime*(.7 + aPhase*1.6) + aPhase*6.283); tw = mix(.9, tw, uTwinkle);
        gl_PointSize = max(1.2, aSize * uPx * (34. / -mv.z)); vA = tw; vTint = aTint; }`,
    fragmentShader: `
      precision mediump float; uniform float uAlpha; varying float vA, vTint;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); a *= a;
        gl_FragColor = vec4(mix(vec3(.98,.95,.92), vec3(.96,.83,.55), vTint), a * vA * uAlpha); }`
  }));
  stars.frustumCulled = false; stars.renderOrder = -5;
  scene.add(stars);

  /* ---------- Bụi sao biến hình ---------- */
  const DN = Q.max.dust;
  const dFrom = new Float32Array(DN * 3), dTo = new Float32Array(DN * 3), dRand = new Float32Array(DN);
  for (let i = 0; i < DN; i++) dRand[i] = Math.random();
  const dGeo = new THREE.BufferGeometry();
  const aTo = new THREE.BufferAttribute(dTo, 3), aFrom = new THREE.BufferAttribute(dFrom, 3);
  dGeo.setAttribute('position', aTo); dGeo.setAttribute('aFrom', aFrom);
  dGeo.setAttribute('aRand', new THREE.BufferAttribute(dRand, 1));
  const dU = { uTime, uPx, uMix: { value: 1 }, uTurb: { value: .5 }, uSize: { value: 1 }, uAlpha: { value: 0 } };
  const dust = new THREE.Points(dGeo, new THREE.ShaderMaterial({
    uniforms: dU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aFrom; attribute float aRand; uniform float uTime, uPx, uMix, uTurb, uSize; varying float vR;
      void main(){ float t = clamp(uMix*1.6 - aRand*.6, 0., 1.); t = t*t*(3.-2.*t);
        vec3 p = mix(aFrom, position, t); float w = sin(t*3.14159);
        p.xy += vec2(sin(uTime*.7 + aRand*40.), cos(uTime*.6 + aRand*31.)) * (uTurb*.1 + w*.5) * (.4 + aRand);
        p.z += w * sin(aRand*50.) * 1.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.4, uSize * uPx * (1.4 + aRand*2.6) * (10. / -mv.z)); vR = aRand; }`,
    fragmentShader: `
      precision mediump float; uniform float uAlpha; varying float vR;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d);
        gl_FragColor = vec4(mix(vec3(.96,.84,.55), vec3(1.,.72,.60), fract(vR*7.)), a * uAlpha * (.35 + .65*fract(vR*13.))); }`
  }));
  dust.frustumCulled = false; dust.renderOrder = 4;
  scene.add(dust);

  let shape = 'cluster', anchorEl = null;
  const sc = document.createElement('canvas'); sc.width = 400; sc.height = 200;
  const sx = sc.getContext('2d', { willReadFrequently: true });
  const samples = {};
  function sample(name) {
    if (samples[name]) return samples[name];
    sx.clearRect(0, 0, 400, 200); sx.fillStyle = '#fff';
    if (name === 'heart') {
      const s = 84;
      sx.save(); sx.translate(200, 100); sx.beginPath(); sx.moveTo(0, s * .95);
      sx.bezierCurveTo(-s * 1.55, -s * .1, -s * .82, -s * 1.15, 0, -s * .42);
      sx.bezierCurveTo(s * .82, -s * 1.15, s * 1.55, -s * .1, 0, s * .95);
      sx.fill(); sx.restore();
    } else {
      const txt = name.slice(5); let fs = 176;
      const font = () => { sx.font = `italic 600 ${fs}px "Cormorant Garamond", "Times New Roman", serif`; };
      font(); const w = sx.measureText(txt).width;
      if (w > 350) { fs *= 350 / w; font(); }
      sx.textAlign = 'center'; sx.textBaseline = 'middle'; sx.fillText(txt, 200, 106);
    }
    const d = sx.getImageData(0, 0, 400, 200).data, pts = [];
    for (let y = 0; y < 200; y += 2) for (let x = 0; x < 400; x += 2) if (d[(y * 400 + x) * 4 + 3] > 128) pts.push(x, y);
    return (samples[name] = pts);
  }
  function view() { const H = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z; return { W: H * camera.aspect, H }; }
  function fill(name, out) {
    const { W, H } = view();
    if (name === 'cluster') {
      for (let i = 0; i < DN; i++) { out[i * 3] = rand(-.3, .3); out[i * 3 + 1] = rand(-.3, .3); out[i * 3 + 2] = rand(-.3, .3); }
    } else if (name === 'scatter') {
      for (let i = 0; i < DN; i++) { out[i * 3] = rand(-W, W) * .85; out[i * 3 + 1] = rand(-H, H) * .85; out[i * 3 + 2] = rand(-9, 2.5); }
    } else {
      const pts = sample(name), n = pts.length / 2;
      let Wd = W * .74;
      if (anchorEl) { const r = anchorEl.getBoundingClientRect(); Wd = Math.min(r.width * 1.25, r.height * 2.1) * (H / vh); }
      for (let i = 0; i < DN; i++) {
        const k = (Math.random() * n | 0) * 2, loose = dRand[i] > .9 ? .45 : 0;
        out[i * 3] = (pts[k] + rand(-1, 1) - 200) / 400 * Wd + rand(-loose, loose);
        out[i * 3 + 1] = -(pts[k + 1] + rand(-1, 1) - 100) / 400 * Wd + rand(-loose, loose);
        out[i * 3 + 2] = rand(-.2, .2);
      }
    }
  }
  function bake() {
    const m = dU.uMix.value;
    for (let i = 0; i < DN; i++) {
      let t = clamp(m * 1.6 - dRand[i] * .6, 0, 1); t = t * t * (3 - 2 * t);
      for (let k = 0; k < 3; k++) { const j = i * 3 + k; dFrom[j] += (dTo[j] - dFrom[j]) * t; }
    }
  }
  function morph(name, o = {}) {
    const dur = RM ? .01 : (o.dur || 2.4);
    gsap.killTweensOf(dU.uMix);
    bake(); fill(name, dTo); aFrom.needsUpdate = true; aTo.needsUpdate = true;
    dU.uMix.value = 0; shape = name;
    gsap.to(dU.uMix, { value: 1, duration: dur, ease: o.ease || 'power2.inOut' });
    if (o.alpha != null) gsap.to(dU.uAlpha, { value: o.alpha, duration: dur, ease: 'power2.out', overwrite: true });
    gsap.to(dU.uTurb, { value: name === 'scatter' ? .5 : .14, duration: dur, overwrite: true });
  }
  function burst() {
    gsap.killTweensOf(dU.uMix);
    fill('cluster', dFrom); fill('scatter', dTo); aFrom.needsUpdate = true; aTo.needsUpdate = true; shape = 'scatter';
    dU.uMix.value = 0; dU.uAlpha.value = 1; dU.uTurb.value = .5;
    gsap.to(dU.uMix, { value: 1, duration: RM ? .01 : 2.8, ease: 'expo.out' });
    gsap.to(dU.uAlpha, { value: .42, duration: 3, ease: 'power2.inOut', overwrite: true });
  }
  fill('cluster', dTo); dFrom.set(dTo);

  /* ---------- Pháo hoa ---------- */
  const FN = Q.max.fw;
  const fPos = new Float32Array(FN * 3), fCol = new Float32Array(FN * 3), fLife = new Float32Array(FN), fVel = new Float32Array(FN * 3), fDec = new Float32Array(FN);
  const fGeo = new THREE.BufferGeometry();
  const afPos = new THREE.BufferAttribute(fPos, 3), afCol = new THREE.BufferAttribute(fCol, 3), afLife = new THREE.BufferAttribute(fLife, 1);
  fGeo.setAttribute('position', afPos); fGeo.setAttribute('aColor', afCol); fGeo.setAttribute('aLife', afLife);
  const fw = new THREE.Points(fGeo, new THREE.ShaderMaterial({
    uniforms: { uPx }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aColor; attribute float aLife; uniform float uPx; varying vec3 vC; varying float vL;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uPx * (2. + 9.*aLife) * (10. / -mv.z) * step(.001, aLife); vC = aColor; vL = aLife; }`,
    fragmentShader: `
      precision mediump float; varying vec3 vC; varying float vL;
      void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d);
        gl_FragColor = vec4(vC, a * vL); }`
  }));
  fw.frustumCulled = false; fw.visible = false; fw.renderOrder = 5;
  scene.add(fw);
  const FW_COL = [[.96, .84, .55], [1, .72, .6], [.98, .95, .9], [.91, .56, .61]];
  let fCur = 0, fActive = 0;
  function firework(xn, yn, ci) {
    if (RM) return;
    const p = toWorld(xn * vw, yn * vh, -1), lim = Q.t.fw, n = Math.round(lim * .11);
    const c = FW_COL[ci == null ? (Math.random() * FW_COL.length | 0) : ci % FW_COL.length];
    for (let k = 0; k < n; k++) {
      const i = fCur; fCur = (fCur + 1) % lim;
      const th = rand(0, 6.283), ph = Math.acos(rand(-1, 1)), sp = rand(1.6, 6);
      fPos[i * 3] = p.x; fPos[i * 3 + 1] = p.y; fPos[i * 3 + 2] = -1;
      fVel[i * 3] = Math.sin(ph) * Math.cos(th) * sp; fVel[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * sp; fVel[i * 3 + 2] = Math.cos(ph) * sp * .5;
      const w = Math.random() < .2 ? 1 : 0;
      fCol[i * 3] = c[0] + (1 - c[0]) * w; fCol[i * 3 + 1] = c[1] + (1 - c[1]) * w; fCol[i * 3 + 2] = c[2] + (1 - c[2]) * w;
      fLife[i] = 1; fDec[i] = rand(.45, .8);
    }
    afCol.needsUpdate = true; fw.visible = true; fActive = 1;
    gsap.fromTo(bgU.uFlash, { value: .06 }, { value: 0, duration: .7, ease: 'expo.out', overwrite: true });
  }
  function stepFw(dt) {
    if (!fActive) return;
    let alive = 0; const drag = Math.max(0, 1 - 1.5 * dt);
    for (let i = 0; i < FN; i++) {
      if (fLife[i] <= 0) continue;
      const j = i * 3;
      fVel[j] *= drag; fVel[j + 1] = fVel[j + 1] * drag - 1.5 * dt; fVel[j + 2] *= drag;
      fPos[j] += fVel[j] * dt; fPos[j + 1] += fVel[j + 1] * dt; fPos[j + 2] += fVel[j + 2] * dt;
      fLife[i] = Math.max(0, fLife[i] - fDec[i] * dt); if (fLife[i] > 0) alive++;
    }
    afPos.needsUpdate = true; afLife.needsUpdate = true;
    if (!alive) { fActive = 0; fw.visible = false; }
  }

  /* ---------- Sao băng ---------- */
  const shootGeo = new THREE.PlaneGeometry(1, 1); shootGeo.translate(-.5, 0, 0);
  const shooters = [];
  function getShooter() {
    let m = shooters.find(s => !s.userData.busy);
    if (!m && shooters.length < 6) {
      m = new THREE.Mesh(shootGeo, new THREE.ShaderMaterial({
        uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `
          precision mediump float; varying vec2 vUv; uniform float uA;
          void main(){ float t = vUv.x; float w = 1. - abs(vUv.y - .5) * 2.;
            float tail = t*t * pow(w, 2.5); float head = smoothstep(.93, 1., t) * pow(w, .8);
            gl_FragColor = vec4(mix(vec3(.96,.84,.55), vec3(1.), head), (tail*.8 + head) * uA); }`
      }));
      m.visible = false; m.frustumCulled = false; m.renderOrder = 3;
      scene.add(m); shooters.push(m);
    }
    return m;
  }
  function shoot(x0, y0, x1, y1, o = {}) {
    const m = RM ? null : getShooter();
    if (!m) return Promise.resolve();
    const a = toWorld(x0, y0, -1), b = toWorld(x1, y1, -1), dur = o.dur || 1.1, u = m.material.uniforms.uA;
    m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    m.position.set(a.x, a.y, -1); m.scale.set(o.len || 2.6, o.w || .1, 1);
    m.visible = true; m.userData.busy = true; u.value = 0;
    return new Promise((res) => {
      gsap.timeline({ onComplete() { m.visible = false; m.userData.busy = false; res(); } })
        .to(u, { value: 1, duration: .18, ease: 'power2.out' }, 0)
        .to(m.position, { x: b.x, y: b.y, duration: dur, ease: o.ease || 'power2.in' }, 0)
        .to(u, { value: 0, duration: .3, ease: 'power2.in' }, dur - .3);
    });
  }
  let nextShoot = 4;
  function ambientShoot(dt) {
    if (RM || !HB.state.opened) return;
    nextShoot -= dt;
    if (nextShoot > 0) return;
    nextShoot = rand(5, 11);
    if (bgU.uDawn.value > .6) return;
    const x = rand(.35, 1.05) * vw, y = rand(-.05, .3) * vh;
    shoot(x, y, x - vw * rand(.35, .6) - 120, y + vh * rand(.18, .3), { dur: rand(.8, 1.2), ease: 'power1.in', len: 2.2, w: .07 });
  }

  /* ---------- Pass sắc sai: chỉ chạy khi uCA > 0 ---------- */
  const postU = { tDiffuse: { value: null }, uCA: { value: 0 } };
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: postU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision mediump float; varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uCA;
      void main(){ vec2 d = (vUv - .5) * uCA * (.4 + 2.*length(vUv - .5));
        gl_FragColor = vec4(texture2D(tDiffuse, vUv + d).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d).b, 1.); }`
  })));
  let rt = null;
  function flash(amount = .012, dur = .9) {
    if (RM || !Q.t.post) return;
    gsap.fromTo(postU.uCA, { value: amount }, { value: 0, duration: dur, ease: 'expo.out', overwrite: true });
  }
  function warp() {
    if (RM) return;
    const upd = () => camera.updateProjectionMatrix();
    gsap.timeline()
      .to(camera, { fov: 86, duration: .45, ease: 'power3.in', onUpdate: upd })
      .to(camera, { fov: 50, duration: 1.7, ease: 'expo.out', onUpdate: upd });
    gsap.fromTo(bgU.uFlash, { value: 0 }, { value: .16, duration: .45, ease: 'power3.in', yoyo: true, repeat: 1, overwrite: true });
    flash(.03, 1.8);
  }

  /* ---------- Toạ độ màn hình → thế giới (mặt phẳng z) ---------- */
  function toWorld(x, y, z = 0) {
    const H = 2 * Math.tan(camera.fov * Math.PI / 360) * (camera.position.z - z);
    return { x: (x / vw - .5) * H * camera.aspect, y: -(y / vh - .5) * H, s: H / vh };
  }

  /* ---------- Kích thước & chất lượng ---------- */
  function resize() {
    vw = innerWidth; vh = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.t.dpr));
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh; camera.updateProjectionMatrix();
    bgU.uAspect.value = camera.aspect; uPx.value = renderer.getPixelRatio();
    if (rt) { rt.dispose(); rt = null; }
    if (shape !== 'cluster' && HB.state.opened) morph(shape, { dur: .5 });
  }
  function applyQuality() {
    const t = Q.t;
    sGeo.setDrawRange(0, t.stars); dGeo.setDrawRange(0, t.dust);
    if (bgMat.defines.NOISE_OCT !== t.oct) { bgMat.defines.NOISE_OCT = t.oct; bgMat.needsUpdate = true; }
    root.dataset.q = t.name;
    resize();
  }
  bus.on('quality', applyQuality);
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });
  applyQuality();

  /* ---------- Vòng lặp ---------- */
  const frameFns = [];
  let scrollP = 0, pull = 0, px = 0, py = 0, last = performance.now();
  let fpsT = 0, fpsN = 0, fpsSq = 0, warm = 0, firstWindow = true;
  const dAnchor = new THREE.Vector3();
  function tick() {
    if (document.hidden) { last = performance.now(); return; }
    const now = performance.now(); let dt = (now - last) / 1000; last = now;
    const raw = dt; if (dt > .1) dt = .1;
    if (!RM) uTime.value += dt;

    /* Đo FPS thật: 2 giây đầu, sau đó mỗi 3 giây; tụt thì hạ một bậc.
       Khung > 1s là do chuyển tab nên bỏ qua. FPS đều tăm tắp quanh 30 là máy đang bị
       giới hạn 30Hz (chế độ tiết kiệm pin), hạ chất lượng cũng không nhanh hơn nên giữ nguyên. */
    if (raw < 1 && !Q.forced) {
      warm += raw;
      if (warm > .7) {
        fpsT += raw; fpsN++; fpsSq += raw * raw;
        if (fpsT >= (firstWindow ? 2 : 3)) {
          const mean = fpsT / fpsN, fps = 1 / mean, jitter = Math.sqrt(Math.max(0, fpsSq / fpsN - mean * mean));
          const capped = fps > 27.5 && fps < 31.5 && jitter < .004;
          if (fps < (firstWindow ? 45 : 30) && !capped) Q.downgrade();
          firstWindow = false; fpsT = 0; fpsN = 0; fpsSq = 0;
        }
      }
    }

    px += (pointer.x - px) * .04; py += (pointer.y - py) * .04;
    stars.rotation.y = px * .1; stars.rotation.x = py * .07;
    stars.position.y = scrollP * 16;
    const dawn = dawnOf(scrollP);
    bgU.uDawn.value += (dawn - bgU.uDawn.value) * Math.min(1, dt * 4);
    sU.uAlpha.value = 1 - bgU.uDawn.value * .5;
    camera.position.z += (10 + pull * 3 - camera.position.z) * Math.min(1, dt * 5);

    if (anchorEl) {
      const r = anchorEl.getBoundingClientRect(), w = toWorld(r.left + r.width / 2, r.top + r.height / 2);
      dAnchor.set(w.x, w.y, 0);
    } else dAnchor.set(0, 0, 0);
    dust.position.lerp(dAnchor, anchorEl ? 1 : Math.min(1, dt * 3));

    stepFw(dt); ambientShoot(dt);
    for (let i = 0; i < frameFns.length; i++) frameFns[i](dt, uTime.value);

    if (postU.uCA.value > .0004) {
      if (!rt) { const s = renderer.getDrawingBufferSize(new THREE.Vector2()); rt = new THREE.WebGLRenderTarget(s.x, s.y); }
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); postU.tDiffuse.value = rt.texture; renderer.render(postScene, postCam);
    } else renderer.render(scene, camera);
  }
  gsap.ticker.add(tick);

  HB.sky = {
    ok: true, camera, scene,
    setScroll(p) { scrollP = p; },
    setPull(v) { pull = v; },
    setDustAnchor(el) { anchorEl = el; },
    pulse() { gsap.fromTo(dU.uSize, { value: 2 }, { value: 1, duration: .7, ease: 'expo.out', overwrite: true }); },
    warp, flash, burst, morph, shoot, firework, toWorld,
    add(o) { scene.add(o); },
    onFrame(fn) { frameFns.push(fn); },
    reset() {
      scrollP = 0; pull = 0; anchorEl = null; bgU.uDawn.value = 0;
      gsap.killTweensOf([dU.uMix, dU.uAlpha]);
      fill('cluster', dTo); dFrom.set(dTo); aFrom.needsUpdate = true; aTo.needsUpdate = true;
      dU.uMix.value = 1; dU.uAlpha.value = 0; shape = 'cluster';
      fLife.fill(0); afLife.needsUpdate = true; fActive = 0; fw.visible = false;
    }
  };
})();
