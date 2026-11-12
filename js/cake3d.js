/* =========================================================
   cake3d.js — bánh kem hai tầng dựng bằng Three.js (khối tiện tròn bo mép, kem chảy,
   bông kem, dâu, cốm màu, nến sọc, trái tim vàng),
   ngọn lửa là shader, khói là sprite tự huỷ. Bánh bám theo khung
   #cakeAnchor trong DOM nên luôn khớp bố cục và vị trí cuộn.
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { rand, RM } = HB;
  const sky = HB.sky, gsap = window.gsap, THREE = window.THREE;
  const N = 5;
  const noop = { ok: false, count: N, setBlow() {}, extinguish() {}, relight() {}, lit: () => N };
  HB.cake3d = noop;
  if (!sky.ok) return;

  const anchor = document.getElementById('cakeAnchor');
  const group = new THREE.Group(), spin = new THREE.Group();
  group.add(spin); group.visible = false; group.rotation.x = .3;
  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .62, metalness: 0 }, o));
  const mPlate = std(0xFFFBF5, { roughness: .3 }), mGold = std(0xF6D37A, { roughness: .28, metalness: .55 });
  const mBlush = std(0xF8B9CB, { roughness: .78 }), mCream = std(0xFFF3DF, { roughness: .78 });
  const mIcing = std(0xFFFEFA, { roughness: .32 }), mRose = std(0xFF7FA6, { roughness: .26 });
  const mBerry = std(0xE5304E, { roughness: .32 }), mLeaf = std(0x4FA35F, { roughness: .6 });
  const mHeart = std(0xFFD27A, { roughness: .22, metalness: .6, emissive: 0xFF9A4A, emissiveIntensity: .25 });
  const mesh = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); spin.add(m); return m; };
  const V = (x, y) => new THREE.Vector2(x, y);
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.slice().reverse(), seg || 72);
  const arc = (cx, cy, r, a0, a1, n) => { const o = []; for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; o.push(V(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } return o; };
  /* Nhiều bản sao cùng hình: một InstancedMesh = một draw call */
  const dummy = new THREE.Object3D(), tint = new THREE.Color();
  function inst(geo, mat, n, place) {
    const m = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) {
      dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      const c = place(dummy, i); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      if (c) m.setColorAt(i, tint.set(c));
    }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    spin.add(m); return m;
  }
  const ring = (r, y, n, off) => (d, i) => { const a = (i / n) * 6.2832 + (off || 0); d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); d.rotation.y = -a; };

  /* Đế bánh: chân đế vàng + đĩa sứ viền vàng */
  mesh(lathe([V(0, 0), V(.42, 0), V(.3, -.12), V(.5, -.26), V(1.1, -.36), V(1.05, -.42), V(0, -.42)]), mGold);
  mesh(lathe([V(0, .12), ...arc(2.1, .06, .06, Math.PI / 2, -Math.PI / 2, 6), V(0, 0)]), mPlate);
  const rim = mesh(new THREE.TorusGeometry(2.15, .04, 10, 80), mGold, 0, .06); rim.rotation.x = Math.PI / 2;

  /* Hai tầng bánh bo tròn mép + lớp kem phủ có vành chảy xuống (biên dạng đi từ trên xuống) */
  const tier = (r, y0, h, b) => lathe([V(0, y0 + h), ...arc(r - b, y0 + h - b, b, Math.PI / 2, 0, 8), V(r, y0), V(0, y0)]);
  const icing = (r, yt, b, lip) => lathe([V(0, yt + .035), ...arc(r - b, yt - b + .005, b + .03, Math.PI / 2, 0, 8), V(r + .03, yt - lip), V(r, yt - lip - .03)]);
  const Y1 = .12, H1 = 1, R1 = 1.6, Y2 = Y1 + H1, H2 = .82, R2 = 1.05, TOP = Y2 + H2;
  mesh(tier(R1, Y1, H1, .1), mBlush);
  mesh(icing(R1, Y2, .1, .14), mIcing);
  mesh(tier(R2, Y2, H2, .09), mCream);
  mesh(icing(R2, TOP, .09, .12), mRose);
  /* Giọt kem chảy: viên nang nhiều độ dài, đầu tròn sẵn nên không bị méo */
  function drips(r, top, n, mat, lens) {
    lens.forEach((len, k) => {
      const geo = new THREE.CapsuleGeometry(.062, len, 6, 12), cnt = Math.ceil(n / lens.length);
      inst(geo, mat, cnt, (d, i) => { const a = ((i * lens.length + k) / n) * 6.2832 + rand(-.05, .05); d.position.set(Math.cos(a) * (r - .035), top - len / 2 - .05, Math.sin(a) * (r - .035)); });
    });
  }
  drips(R1, Y2 - .06, 20, mIcing, [.1, .44, .22, .34]);
  drips(R2, TOP - .05, 14, mRose, [.08, .3, .16, .24]);

  /* Hạt ngọc vàng quanh chân mỗi tầng */
  const pearl = new THREE.SphereGeometry(.052, 12, 10);
  inst(pearl, mGold, 56, ring(R1 + .02, Y1 + .05, 56));
  inst(pearl, mGold, 38, ring(R2 + .02, Y2 + .08, 38));
  /* Bông kem + dâu tây xen kẽ trên bậc giữa hai tầng, vòng bông kem nhỏ trên mặt bánh */
  const kiss = lathe([V(0, .33), V(.045, .26), V(.09, .19), V(.14, .12), V(.17, .05), V(.15, 0), V(0, 0)], 10);
  const berry = lathe([V(0, .32), V(.07, .28), V(.13, .19), V(.145, .09), V(.1, .02), V(0, 0)], 16);
  const LEDGE = (R1 + R2) / 2 + .02;
  inst(kiss, mIcing, 9, ring(LEDGE, Y2 + .03, 9));
  inst(berry, mBerry, 9, (d, i) => { ring(LEDGE, Y2 + .03, 9, Math.PI / 9)(d, i); d.rotation.z = rand(-.25, .25); d.rotation.x = rand(-.2, .2); });
  inst(new THREE.ConeGeometry(.07, .05, 5), mLeaf, 9, (d, i) => { ring(LEDGE - .15, Y2 + .06, 9, Math.PI / 9)(d, i); d.scale.set(1.3, 1, 1.3); });
  inst(kiss, mIcing, 10, (d, i) => { ring(R2 - .17, TOP + .03, 10, .3)(d, i); d.scale.setScalar(.8); });
  inst(pearl, mBerry, 10, (d, i) => { ring(R2 - .17, TOP + .3, 10, .3)(d, i); d.scale.setScalar(1.15); });
  /* Cốm màu rắc quanh thân hai tầng */
  const SPR = ['#FF6B8B', '#FFD166', '#7BDFF2', '#B79CFF', '#8CE99A', '#FFFFFF', '#FF9F68'];
  inst(new THREE.CapsuleGeometry(.018, .075, 3, 6), std(0xffffff, { roughness: .4 }), 90, (d, i) => {
    const a = rand(0, 6.2832); d.position.set(Math.cos(a) * (R1 + .012), rand(Y1 + .16, Y2 - .5), Math.sin(a) * (R1 + .012));
    d.rotateY(-a); d.rotateX(rand(0, 3.14)); return SPR[i % SPR.length];
  });
  inst(new THREE.SphereGeometry(.03, 8, 6), std(0xffffff, { roughness: .35 }), 46, (d, i) => {
    const a = rand(0, 6.2832); d.position.set(Math.cos(a) * (R2 + .012), rand(Y2 + .2, TOP - .36), Math.sin(a) * (R2 + .012)); return SPR[(i + 2) % SPR.length];
  });

  /* Trái tim vàng cắm giữa mặt bánh */
  const hs = new THREE.Shape();
  hs.moveTo(0, -.34); hs.bezierCurveTo(-.5, -.02, -.42, .4, -.16, .4); hs.bezierCurveTo(-.06, .4, 0, .32, 0, .24);
  hs.bezierCurveTo(0, .32, .06, .4, .16, .4); hs.bezierCurveTo(.42, .4, .5, -.02, 0, -.34);
  const heartGeo = new THREE.ExtrudeGeometry(hs, { depth: .07, bevelEnabled: true, bevelThickness: .035, bevelSize: .035, bevelSegments: 4, curveSegments: 20 });
  heartGeo.translate(0, 0, -.035);
  const heart = mesh(heartGeo, mHeart, 0, TOP + .78, 0); heart.scale.setScalar(.72);
  mesh(new THREE.CylinderGeometry(.014, .014, .5, 6), mGold, 0, TOP + .28, 0);

  /* Nến sọc xoắn + ngọn lửa */
  const candleGeo = new THREE.CylinderGeometry(.055, .055, .62, 16), wickGeo = new THREE.CylinderGeometry(.008, .008, .08, 5);
  const flameGeo = new THREE.PlaneGeometry(.7, 1); flameGeo.translate(0, .5, 0);
  const mWick = std(0x1a1320);
  const stripe = (col) => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32;
    const g = c.getContext('2d'); g.fillStyle = '#FFFDF8'; g.fillRect(0, 0, 32, 32); g.strokeStyle = col; g.lineWidth = 9;
    for (let k = -1; k < 3; k++) { g.beginPath(); g.moveTo(k * 32 - 4, 36); g.lineTo(k * 32 + 36, -4); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 5); return t;
  };
  const CANDLE = ['#FF7FA6', '#FFC94D', '#6CC7FF', '#B08CFF', '#62D6A4'];
  const flameVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
  const flameFS = `
    precision mediump float; varying vec2 vUv; uniform float uTime, uOn, uBend, uSeed;
    void main(){
      vec2 p = vec2(vUv.x - .5, vUv.y);
      float h = .78 * (.9 + .1 * sin(uTime*11. + uSeed*5.)) * (.35 + .65*uOn);
      float yy = p.y / h;
      p.x -= sin(uTime*7. + uSeed*9. + p.y*6.) * .03 * yy + uBend * yy * yy * .3;
      float wv = .25 * sin(3.14159 * pow(clamp(yy, 0., 1.), .5)) * (1. - yy*.3);
      float a = (1. - smoothstep(wv*.3, wv, abs(p.x))) * step(yy, 1.) * smoothstep(0., .05, yy);
      float core = (1. - smoothstep(0., wv, abs(p.x))) * (1. - yy*.55);
      vec3 col = mix(vec3(1., .5, .16), vec3(1., .94, .72), core);
      col = mix(vec3(.3, .46, 1.), col, smoothstep(.02, .2, yy));
      float glow = exp(-length(vec2(p.x*2.6, (p.y - h*.45)*1.5)) * 4.2) * .5;
      gl_FragColor = vec4(col * a + vec3(1., .66, .3) * glow, (a + glow) * uOn);
    }`;
  const flames = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + .3, x = Math.cos(a) * .5, z = Math.sin(a) * .5, top = TOP + .03 + .62;
    mesh(candleGeo, std(0xffffff, { roughness: .45, map: stripe(CANDLE[i]) }), x, TOP + .03 + .31, z);
    mesh(wickGeo, mWick, x, top + .03, z);
    const u = { uTime: { value: 0 }, uOn: { value: 1 }, uBend: { value: 0 }, uSeed: { value: Math.random() } };
    const f = new THREE.Mesh(flameGeo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: flameVS, fragmentShader: flameFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    f.position.set(x, top + .02, z); f.scale.setScalar(.9); f.renderOrder = 2;
    spin.add(f); flames.push({ mesh: f, u, lit: true, x, z, top });
  }

  /* Ánh sáng: nền trời + đèn chính + ánh nến */
  group.add(new THREE.HemisphereLight(0xfff0f6, 0x4a3c78, .72));
  const key = new THREE.DirectionalLight(0xfff0dd, .5); key.position.set(-4, 5, 6); group.add(key);
  const back = new THREE.DirectionalLight(0xff9ad0, .45); back.position.set(5, 3, -5); group.add(back);
  const glow = new THREE.PointLight(0xffa550, 1.5, 10, 2); glow.position.set(0, TOP + 1.1, .6); group.add(glow);
  sky.add(group);

  /* Khói: sprite mềm, tự gỡ và giải phóng material khi tan */
  const smokeGeo = new THREE.PlaneGeometry(1, 1);
  function smoke(fl) {
    if (RM) return;
    for (let k = 0; k < 3; k++) {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false,
        vertexShader: flameVS,
        fragmentShader: 'precision mediump float; varying vec2 vUv; uniform float uA; void main(){ float d = length(vUv - .5); gl_FragColor = vec4(vec3(.86, .85, .92), smoothstep(.5, .05, d) * uA); }'
      });
      const m = new THREE.Mesh(smokeGeo, mat);
      m.position.set(fl.x, fl.top + .1, fl.z); m.scale.setScalar(.16); m.renderOrder = 2; m.userData.smoke = true;
      spin.add(m);
      const d = 1.8 + k * .5;
      gsap.timeline({ delay: k * .22, onComplete() { spin.remove(m); mat.dispose(); } })
        .to(mat.uniforms.uA, { value: .32, duration: .35, ease: 'power2.out' }, 0)
        .to(m.position, { y: fl.top + rand(1, 1.6), x: fl.x + rand(-.35, .35), duration: d, ease: 'power1.out' }, 0)
        .to(m.scale, { x: rand(.5, .8), y: rand(.6, .95), duration: d, ease: 'power1.out' }, 0)
        .to(mat.uniforms.uA, { value: 0, duration: d * .6, ease: 'power1.in' }, d * .4);
    }
  }

  let blow = 0, blowT = 0, ry = 0;
  const inv = new THREE.Quaternion();
  sky.onFrame((dt, t) => {
    const r = anchor.getBoundingClientRect(), vh = innerHeight;
    const on = HB.state.opened && r.bottom > -vh * .25 && r.top < vh * 1.25;
    group.visible = on;
    if (!on) return;
    const w = sky.toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const s = Math.min(r.height * w.s / 4.4, r.width * w.s / 4.8);
    group.scale.setScalar(s);
    group.position.set(w.x, w.y - 1.25 * s, 0);
    ry += dt * (RM ? 0 : .22);
    spin.rotation.y = ry + HB.pointer.x * .6;
    group.rotation.x = .3 + HB.pointer.y * .12;
    blow += (blowT - blow) * Math.min(1, dt * 8);
    inv.copy(group.quaternion).multiply(spin.quaternion).invert();
    let lit = 0;
    for (const f of flames) {
      f.u.uTime.value = t; f.u.uBend.value = blow * (1.2 + f.u.uSeed.value);
      f.mesh.quaternion.copy(inv); f.mesh.visible = f.u.uOn.value > .01;
      lit += f.u.uOn.value;
    }
    glow.intensity = lit / N * (1.5 + .25 * Math.sin(t * 9) + .15 * Math.sin(t * 23)) * (1 - blow * .4);
  });

  HB.cake3d = {
    ok: true, count: N,
    setBlow(v) { blowT = v; },
    lit: () => flames.filter(f => f.lit).length,
    extinguish(i) {
      const f = flames[i]; if (!f || !f.lit) return;
      f.lit = false;
      gsap.to(f.u.uOn, { value: 0, duration: RM ? .01 : .28, ease: 'power2.in', overwrite: true });
      smoke(f);
    },
    relight() {
      flames.forEach((f, i) => {
        f.lit = true;
        gsap.to(f.u.uOn, { value: 1, duration: RM ? .01 : .7, delay: RM ? 0 : i * .12, ease: 'back.out(2.2)', overwrite: true });
      });
    }
  };
})();
