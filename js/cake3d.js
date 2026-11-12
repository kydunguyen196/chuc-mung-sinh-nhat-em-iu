/* =========================================================
   cake3d.js — bánh kem "trời đêm" dựng bằng hình khối Three.js,
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
  const mMilk = std(0xFBF3E7), mNight = std(0x2B2A5E, { roughness: .5 }), mPeach = std(0xFFB89A), mGold = std(0xF4D58D, { roughness: .35, metalness: .35 });
  const mSpark = std(0xF4D58D, { emissive: 0xF4D58D, emissiveIntensity: .9 });
  const mesh = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); spin.add(m); return m; };

  mesh(new THREE.CylinderGeometry(2.1, 2.2, .12, 56), mMilk, 0, .06);
  const rim = mesh(new THREE.TorusGeometry(2.13, .035, 8, 64), mGold, 0, .12); rim.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(1.6, 1.6, 1, 56), mNight, 0, .62);
  mesh(new THREE.CylinderGeometry(1.65, 1.65, .13, 56), mMilk, 0, 1.17);
  mesh(new THREE.CylinderGeometry(1.05, 1.05, .8, 48), mMilk, 0, 1.63);
  mesh(new THREE.CylinderGeometry(1.1, 1.1, .11, 48), mPeach, 0, 2.07);

  /* Kem chảy quanh mép hai tầng */
  const dripGeo = new THREE.CylinderGeometry(.1, .1, 1, 10), dropGeo = new THREE.SphereGeometry(.1, 10, 8);
  function drips(radius, top, n, mat, hMin, hMax) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-.08, .08), h = rand(hMin, hMax), x = Math.cos(a) * radius, z = Math.sin(a) * radius;
      const d = mesh(dripGeo, mat, x, top - h / 2, z); d.scale.y = h;
      mesh(dropGeo, mat, x, top - h, z);
    }
  }
  drips(1.6, 1.14, 18, mMilk, .16, .52);
  drips(1.05, 2.04, 13, mPeach, .12, .36);

  /* Sao vàng rắc trên tầng dưới */
  const starGeo = new THREE.SphereGeometry(.034, 6, 5);
  for (let i = 0; i < 30; i++) { const a = rand(0, 6.283); mesh(starGeo, mSpark, Math.cos(a) * 1.61, rand(.2, .58), Math.sin(a) * 1.61); }

  /* Nến + ngọn lửa */
  const candleGeo = new THREE.CylinderGeometry(.045, .045, .56, 10), wickGeo = new THREE.CylinderGeometry(.008, .008, .08, 5);
  const flameGeo = new THREE.PlaneGeometry(.7, 1); flameGeo.translate(0, .5, 0);
  const mWick = std(0x1a1320);
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
    const a = (i / N) * Math.PI * 2 + .3, x = Math.cos(a) * .62, z = Math.sin(a) * .62, top = 2.12 + .56;
    mesh(candleGeo, i % 2 ? mGold : mMilk, x, 2.12 + .28, z);
    mesh(wickGeo, mWick, x, top + .03, z);
    const u = { uTime: { value: 0 }, uOn: { value: 1 }, uBend: { value: 0 }, uSeed: { value: Math.random() } };
    const f = new THREE.Mesh(flameGeo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: flameVS, fragmentShader: flameFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    f.position.set(x, top + .02, z); f.scale.setScalar(.9); f.renderOrder = 2;
    spin.add(f); flames.push({ mesh: f, u, lit: true, x, z, top });
  }

  /* Ánh sáng: nền trời + đèn chính + ánh nến */
  group.add(new THREE.HemisphereLight(0xa9a6e6, 0x1a1530, .85));
  const key = new THREE.DirectionalLight(0xfff0dd, .55); key.position.set(-4, 5, 6); group.add(key);
  const glow = new THREE.PointLight(0xffa550, 2.4, 10, 2); glow.position.set(0, 3.2, .6); group.add(glow);
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
    const on = r.bottom > -vh * .25 && r.top < vh * 1.25;
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
