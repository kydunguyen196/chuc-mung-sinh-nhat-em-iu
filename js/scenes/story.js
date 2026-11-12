/* =========================================================
   CẢNH 3 · "Chuyện của mình" — 5 mốc thời gian là 5 ngôi sao của một chòm sao.
   Cảnh được ghim; cuộn tới đâu, đường nối vẽ tới ngôi sao đó và câu chuyện
   của mốc ấy hiện ra. Tháng 4 có mây trôi qua.
   ========================================================= */
HB.scene('story', () => {
  'use strict';
  const { $, C, RM, clamp } = HB, gsap = window.gsap, ST = window.ScrollTrigger;
  const sec = $('#story'), pin = $('.story__pin'), stage = $('#storyStage'), svg = $('.story__svg');
  const base = $('.story__base'), draw = $('.story__draw'), cloud = $('.story__cloud'), box = $('#storyCards');
  const T = C.timeline, n = T.length;
  const XS = [7, 29, 51, 72, 93], YS = [66, 20, 76, 28, 54];
  const cloudIdx = T.findIndex(m => m.cloud);
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); e.className = cls; e.textContent = txt; return e; };

  const stars = [], cards = [];
  T.forEach((m, i) => {
    const title = m.title.replace('{age}', HB.AGE);
    const b = mk('button', 'st tone-' + m.tone, ''); b.type = 'button';
    b.style.left = XS[i % XS.length] + '%'; b.style.top = YS[i % YS.length] + '%';
    b.setAttribute('aria-label', `Mốc ${i + 1}: ${title}`);
    b.appendChild(document.createElement('i'));
    stage.appendChild(b); stars.push(b);
    const li = mk('li', 'tlc', '');
    li.append(mk('p', 'tlc__date', m.date), mk('h3', 'tlc__title', title), mk('p', 'tlc__text', m.text), mk('p', 'tlc__story', m.story));
    box.appendChild(li); cards.push(li);
  });
  if (cloudIdx < 0) cloud.hidden = true;
  if (RM) { sec.classList.add('is-static'); return; }

  let fr = [], active = -1;
  function build() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const pts = stars.map((s, i) => [XS[i % XS.length] / 100 * w, YS[i % YS.length] / 100 * h]);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    base.setAttribute('d', d); draw.setAttribute('d', d);
    let acc = 0; const cum = [0];
    for (let i = 1; i < n; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(acc); }
    fr = cum.map(c => c / acc * 100);
    if (cloudIdx >= 0) { cloud.style.left = pts[cloudIdx][0] + 'px'; cloud.style.top = pts[cloudIdx][1] + 'px'; }
    gsap.set(draw, { drawSVG: `0% ${active < 0 ? 0 : fr[active]}%` });
  }
  function setActive(i) {
    if (i === active) return;
    const prev = cards[active];
    active = i;
    stars.forEach((s, k) => { s.classList.toggle('on', k <= i); s.classList.toggle('is-active', k === i); });
    cloud.classList.toggle('is-over', i === cloudIdx);
    cloud.classList.toggle('is-gone', i > cloudIdx);
    gsap.to(draw, { drawSVG: `0% ${i < 0 ? 0 : fr[i]}%`, duration: 1, ease: 'power3.inOut', overwrite: true });
    if (prev) gsap.to(prev, { autoAlpha: 0, y: -14, duration: .3, ease: 'power2.in', overwrite: true });
    if (i >= 0) {
      gsap.fromTo(cards[i], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', delay: prev ? .24 : 0, overwrite: true });
      if (prev) HB.audio.sfx.tick();
    }
  }

  build();
  new ResizeObserver(build).observe(stage);
  ST.create({ trigger: pin, start: 'top 62%', onEnter: () => { if (active < 0) setActive(0); } });
  const pinST = ST.create({
    trigger: pin, start: 'top top', end: () => '+=' + Math.round(innerHeight * .62 * n), pin: true, anticipatePin: 1,
    onUpdate: (s) => setActive(clamp(Math.floor(s.progress * n), 0, n - 1))
  });
  stars.forEach((b, i) => b.addEventListener('click', () => {
    HB.buzz(8);
    HB.scrollTo(pinST.start + (i + .5) / n * (pinST.end - pinST.start));
  }));

  return () => {
    active = -1;
    stars.forEach(s => s.classList.remove('on', 'is-active'));
    cloud.classList.remove('is-over', 'is-gone');
    gsap.set(cards, { autoAlpha: 0 });
    gsap.set(draw, { drawSVG: '0% 0%' });
  };
});
