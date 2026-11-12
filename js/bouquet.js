/* =========================================================
   bouquet.js — bó hoa vẽ bằng SVG, dựng hoàn toàn bằng code.
   Mỗi bông là một <svg> riêng (một lớp compositor) nên đung đưa và
   parallax chỉ tốn transform, không phải vẽ lại. Từng cánh là một <path>
   để có thể "nở" từng cánh một.
   HB.buildBouquet(container) → { flowers, leaves, paper, sparks }
   ========================================================= */
(() => {
  'use strict';
  const HB = window.HB, { rand } = HB;
  const NS = 'http://www.w3.org/2000/svg';
  const S = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  let gid = 0;
  /* Gradient chạy từ gốc cánh (dưới) lên đầu cánh (trên) */
  function lin(defs, base, tip, mid) {
    const id = 'bq' + (gid++), g = S('linearGradient', { id, x1: .5, y1: 1, x2: .5, y2: 0 }, defs);
    S('stop', { offset: 0, 'stop-color': base }, g);
    if (mid) S('stop', { offset: .55, 'stop-color': mid }, g);
    S('stop', { offset: 1, 'stop-color': tip }, g);
    return `url(#${id})`;
  }
  function rad(defs, stops) {
    const id = 'bq' + (gid++), g = S('radialGradient', { id, cx: .5, cy: .5, r: .5 }, defs);
    stops.forEach(([o, c, a]) => S('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a }, g));
    return `url(#${id})`;
  }
  const petalD = (len, w, round) => `M0 0C${w} ${-len * .22} ${w * round} ${-len * .92} 0 ${-len}C${-w * round} ${-len * .92} ${-w} ${-len * .22} 0 0Z`;
  const svgBox = (x, y, w, h) => { const s = S('svg', { viewBox: `${x} ${y} ${w} ${h}` }); return { svg: s, defs: S('defs', {}, s) }; };
  const shadow = (svg, defs, r) => S('circle', { r, cy: r * .12, fill: rad(defs, [[.55, '#12061f', .42], [1, '#12061f', 0]]) }, svg);

  /* Các vòng cánh, từ ngoài vào trong; vòng trong đậm hơn để có chiều sâu */
  function rings(svg, defs, spec, light, deep) {
    const m = spec.length, edge = mix(deep, '#1a0820', .35), out = [];
    spec.forEach((r, i) => {
      const t = i / m;
      const fill = lin(defs, mix(light, deep, .5 + t * .5), mix(light, deep, t * .65), mix(light, deep, .2 + t * .6));
      const arr = [];
      for (let k = 0; k < r.n; k++) {
        const g = S('g', { transform: `rotate(${(360 / r.n * k + (r.off || 0) + rand(-2.5, 2.5)).toFixed(1)})` }, svg);
        const j = rand(.93, 1.06);
        arr.push(S('path', { d: petalD(r.len * j, r.w * j, r.round || .85), fill, stroke: edge, 'stroke-opacity': .22, 'stroke-width': .7 }, g));
      }
      out.push(arr);
    });
    return out;
  }
  const dots = (svg, n, r, size, fill, off) => { for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + (off || 0); S('circle', { cx: (Math.cos(a) * r).toFixed(1), cy: (Math.sin(a) * r).toFixed(1), r: size, fill }, svg); } };

  const TYPES = {
    peony(light, deep) {
      const { svg, defs } = svgBox(-60, -60, 120, 120); shadow(svg, defs, 56);
      const p = rings(svg, defs, [
        { n: 9, len: 52, w: 27, round: 1.08 }, { n: 9, len: 44, w: 23, round: 1.08, off: 20 }, { n: 8, len: 35, w: 19, round: 1.05, off: 8 },
        { n: 7, len: 26, w: 15, round: 1, off: 30 }, { n: 6, len: 17, w: 11, round: 1, off: 10 }, { n: 5, len: 9, w: 7, round: 1, off: 40 }], light, deep);
      dots(svg, 6, 3, 1.1, '#FFE08A');
      return { svg, petals: p };
    },
    rose(light, deep) {
      const { svg, defs } = svgBox(-60, -60, 120, 120); shadow(svg, defs, 54);
      const p = rings(svg, defs, [
        { n: 5, len: 50, w: 35, round: 1.18 }, { n: 5, len: 41, w: 29, round: 1.18, off: 36 }, { n: 4, len: 31, w: 22, round: 1.15, off: 15 },
        { n: 3, len: 21, w: 15, round: 1.1, off: 50 }, { n: 3, len: 12, w: 9, round: 1.1, off: 10 }], light, deep);
      S('path', { d: 'M-4 1.500c-.500-6 8.500-6 8 0-.400 4.500-6 5-6 1', fill: 'none', stroke: mix(deep, '#1a0820', .45), 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: .7 }, svg);
      return { svg, petals: p };
    },
    gerbera(light, deep) {
      const { svg, defs } = svgBox(-60, -60, 120, 120); shadow(svg, defs, 52);
      const p = rings(svg, defs, [{ n: 20, len: 50, w: 6.8, round: .95 }, { n: 20, len: 42, w: 6.2, round: .95, off: 9 }, { n: 16, len: 19, w: 4.2, round: .9, off: 4 }], light, deep);
      S('circle', { r: 11, fill: rad(defs, [[0, '#3B2A14'], [.5, '#7A5320'], [1, '#F2C14E']]) }, svg);
      dots(svg, 14, 8.2, 1, '#FFE9A6'); dots(svg, 8, 4.4, .9, '#C9893E', .3);
      return { svg, petals: p };
    },
    sunflower(light, deep) {
      const { svg, defs } = svgBox(-60, -60, 120, 120); shadow(svg, defs, 54);
      const p = rings(svg, defs, [{ n: 17, len: 52, w: 10.5, round: .5 }, { n: 17, len: 44, w: 9.5, round: .5, off: 10.6 }], light, deep);
      S('circle', { r: 19, fill: rad(defs, [[0, '#2E1A0C'], [.6, '#5E3A1A'], [1, '#9A6A2E']]) }, svg);
      dots(svg, 20, 15.500, 1.3, '#D69B45'); dots(svg, 14, 10.500, 1.2, '#B97E32', .2); dots(svg, 8, 5.500, 1.1, '#8E5C22', .4);
      return { svg, petals: p };
    },
    dahlia(light, deep) {
      const { svg, defs } = svgBox(-60, -60, 120, 120); shadow(svg, defs, 54);
      const p = rings(svg, defs, [
        { n: 15, len: 52, w: 11.500, round: .55 }, { n: 15, len: 44, w: 10.500, round: .55, off: 12 }, { n: 13, len: 35, w: 9.500, round: .55, off: 4 },
        { n: 11, len: 26, w: 8, round: .6, off: 16 }, { n: 9, len: 17, w: 6.500, round: .65, off: 8 }, { n: 7, len: 9, w: 4.500, round: .7 }], light, deep);
      S('circle', { r: 2.600, fill: '#FFE9A6' }, svg);
      return { svg, petals: p };
    },
    blossom(light, deep) {
      const { svg, defs } = svgBox(-26, -26, 52, 52); shadow(svg, defs, 22);
      const p = rings(svg, defs, [{ n: 5, len: 22, w: 14.500, round: 1.25 }], light, mix(light, deep, .7));
      S('circle', { r: 3.400, fill: '#FFD54A' }, svg); dots(svg, 5, 5.400, .8, '#F5A300', .6);
      return { svg, petals: p };
    },
    tulip(light, deep) {
      const { svg, defs } = svgBox(-30, -58, 60, 100);
      S('path', { d: 'M0 8C1 22 -1 32 0 42', fill: 'none', stroke: '#3F8F58', 'stroke-width': 4.500, 'stroke-linecap': 'round' }, svg);
      const edge = mix(deep, '#1a0820', .35), mk = (d, base, tip) => S('path', { d, fill: lin(defs, base, tip), stroke: edge, 'stroke-opacity': .22, 'stroke-width': .7 }, S('g', { transform: 'translate(0 10)' }, svg));
      const back = mk('M0 0C-15 -16 -11 -50 0 -60C11 -50 15 -16 0 0Z', mix(light, deep, .9), mix(light, deep, .45));
      const l = mk('M0 0C-24 -2 -28 -34 -16 -57C-8 -42 -1 -22 0 0Z', deep, light);
      const r = mk('M0 0C24 -2 28 -34 16 -57C8 -42 1 -22 0 0Z', mix(light, deep, .8), mix(light, '#ffffff', .25));
      return { svg, petals: [[back], [l, r]] };
    },
    lavender(light, deep) {
      const { svg, defs } = svgBox(-14, -74, 28, 92);
      S('path', { d: 'M0 16C1 -10 -1 -40 0 -66', fill: 'none', stroke: '#5E9E6E', 'stroke-width': 2.200, 'stroke-linecap': 'round' }, svg);
      const fill = lin(defs, deep, light), arr = [];
      for (let k = 0; k < 11; k++) {
        const y = -6 - k * 5.800, side = k % 2 ? 1 : -1, s = 1 - k * .045;
        const g = S('g', { transform: `translate(${side * 3.400 * s} ${y}) rotate(${side * 34})` }, svg);
        arr.push(S('path', { d: petalD(10 * s, 4.600 * s, 1), fill }, g));
      }
      return { svg, petals: [arr] };
    }
  };

  /* Bố cục trong khung 600×770. Vẽ theo thứ tự: sau → trước. */
  const C = {
    red: ['#FF8C9B', '#C2143C'], coral: ['#FFC0A8', '#F0513A'], pink: ['#FFE0EC', '#EE5C9C'], magenta: ['#FF9AD0', '#D41A80'],
    orange: ['#FFCF7A', '#F26A14'], sun: ['#FFE873', '#F4A000'], violet: ['#D5B8FF', '#6A35CC'], peach: ['#FFE2B8', '#FF8752'],
    cream: ['#FFFEF8', '#F2CDA6'], blue: ['#CFE6FF', '#3F84E5'], white: ['#FFFFFF', '#D9CCF2'], lilac: ['#EBD9FF', '#9B6BE0'],
    yellow: ['#FFF0A0', '#F2B200'], lav: ['#C7B0F5', '#6F4BC4']
  };
  const PLAN = [
    ['lavender', 'lav', 300, 52, 1.5, 0, .25], ['lavender', 'lav', 222, 84, 1.4, -15, .25], ['lavender', 'lav', 378, 84, 1.4, 15, .25],
    ['lavender', 'lilac', 142, 142, 1.4, -34, .25], ['lavender', 'lilac', 458, 142, 1.4, 34, .25],
    ['tulip', 'yellow', 250, 104, 1.05, -9, .35], ['tulip', 'pink', 352, 100, 1.05, 10, .35], ['tulip', 'violet', 116, 232, 1, -44, .35], ['tulip', 'orange', 484, 232, 1, 44, .35],
    ['blossom', 'white', 186, 128, 1.05, 0, .4], ['blossom', 'blue', 414, 128, 1.05, 20, .4], ['blossom', 'blue', 92, 312, 1, 0, .4], ['blossom', 'white', 508, 312, 1, 30, .4],
    ['sunflower', 'sun', 300, 166, 1.08, 0, .55],
    ['rose', 'red', 204, 212, 1.12, -12, .65], ['rose', 'coral', 396, 212, 1.12, 14, .65],
    ['gerbera', 'magenta', 138, 318, .98, 0, .7], ['gerbera', 'orange', 462, 318, .98, 12, .7],
    ['dahlia', 'violet', 214, 340, 1.06, 0, .85], ['dahlia', 'peach', 386, 340, 1.06, 10, .85],
    ['rose', 'cream', 300, 384, .96, 24, .9],
    ['peony', 'pink', 300, 276, 1.38, 0, 1],
    ['blossom', 'blue', 250, 160, .8, 10, .75], ['blossom', 'lilac', 352, 158, .8, 40, .75], ['blossom', 'white', 162, 252, .85, 0, .8],
    ['blossom', 'lilac', 440, 252, .85, 25, .8], ['blossom', 'blue', 252, 404, .8, 0, 1], ['blossom', 'white', 350, 404, .8, 50, 1]
  ];

  function backLayer() {
    const { svg, defs } = svgBox(0, 0, 600, 770); svg.setAttribute('class', 'bq__layer');
    /* tờ giấy phía sau, nhô hai vai */
    S('path', { d: 'M300 712L70 356C96 300 150 270 196 300C230 250 370 250 404 300C450 270 504 300 530 356Z', fill: lin(defs, '#F2C6A6', '#FFF1DE'), stroke: '#8A4E2E', 'stroke-opacity': .14 }, svg);
    for (let i = 0; i < 7; i++) S('path', { d: `M300 700L${276 + i * 8} ${756 + (i % 2) * 6}`, stroke: i % 2 ? '#3F8F58' : '#2F7447', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
    const leaves = [];
    const leafFill = [lin(defs, '#256B45', '#A6DB8E', '#4FA463'), lin(defs, '#1F5E46', '#86C79A', '#3C8C5E')];
    [-98, -82, -64, -47, -30, -13, 5, 22, 39, 56, 72, 88, 100].forEach((a, i) => {
      const len = (Math.abs(a) < 40 ? 300 : 262) * rand(.94, 1.04), w = rand(30, 40);
      const g = S('g', { transform: `translate(300 350) rotate(${a})` }, svg), lf = S('g', {}, g);
      S('path', { d: petalD(len, w, .62), fill: leafFill[i % 2], stroke: '#143B2A', 'stroke-opacity': .25, 'stroke-width': .8 }, lf);
      S('path', { d: `M0 -8L0 ${-len * .9}`, stroke: '#EAF7D8', 'stroke-opacity': .45, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, lf);
      leaves.push(lf);
    });
    /* nhánh khuynh diệp vươn ra ngoài cho dáng bó hoa thoáng hơn */
    const euFill = rad(defs, [[0, '#D6EFE4'], [1, '#6FAE9B']]);
    [-70, -40, -8, 30, 62].forEach((a) => {
      const len = rand(310, 345), g = S('g', { transform: `translate(300 350) rotate(${a})` }, svg), lf = S('g', {}, g);
      S('path', { d: `M0 0C${rand(-14, 14)} ${-len * .5} ${rand(-10, 10)} ${-len * .8} 0 ${-len}`, fill: 'none', stroke: '#5C9A86', 'stroke-width': 2, 'stroke-linecap': 'round' }, lf);
      for (let k = 0; k < 5; k++) {
        const y = -len + k * 30, r = 15 - k * 1.400;
        S('ellipse', { cx: -r * .9, cy: y, rx: r, ry: r * .78, fill: euFill, opacity: .95, transform: `rotate(-24 ${-r * .9} ${y})` }, lf);
        S('ellipse', { cx: r * .9, cy: y + 12, rx: r, ry: r * .78, fill: euFill, opacity: .95, transform: `rotate(24 ${r * .9} ${y + 12})` }, lf);
      }
      S('circle', { cy: -len - 6, r: 7, fill: euFill }, lf);
      leaves.push(lf);
    });
    return { svg, leaves };
  }

  function paperLayer() {
    const { svg, defs } = svgBox(0, 0, 600, 770); svg.setAttribute('class', 'bq__layer bq__paper');
    S('path', { d: 'M300 712L88 366C120 330 168 372 208 392C250 372 276 404 300 392C324 404 350 372 392 392C432 372 480 330 512 366Z', fill: lin(defs, '#9C7FD6', '#E3D4FA'), opacity: .96 }, svg);
    S('path', { d: 'M300 718L80 384C150 430 242 446 340 410Z', fill: lin(defs, '#F3BF9B', '#FFF6EA', '#FBDCC2'), stroke: '#8A4E2E', 'stroke-opacity': .16 }, svg);
    S('path', { d: 'M300 718L520 384C450 430 358 448 258 408Z', fill: lin(defs, '#F7CDAE', '#FFFBF4', '#FDE6D2'), stroke: '#8A4E2E', 'stroke-opacity': .16 }, svg);
    S('path', { d: 'M300 718L258 408C286 416 312 416 340 410Z', fill: '#9A5A3A', opacity: .13 }, svg);
    S('path', { d: 'M520 384C478 412 430 428 380 432', fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': .7, 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
    [[170, 470], [214, 520], [252, 474], [392, 478], [430, 512], [352, 540], [236, 578], [372, 596], [300, 500], [322, 458], [196, 432], [410, 440]]
      .forEach(([x, y], i) => S('circle', { cx: x, cy: y, r: i % 3 ? 2 : 3, fill: '#E9B44C', opacity: .55 }, svg));
    const gold = lin(defs, '#D99A2B', '#FFEBB0', '#F6CF6B');
    S('path', { d: 'M296 620C284 652 268 672 258 694L278 687L284 706C296 676 303 650 305 622Z', fill: gold }, svg);
    S('path', { d: 'M304 620C316 650 334 668 346 688L326 684L322 702C310 674 300 650 297 622Z', fill: lin(defs, '#C98A22', '#F9DC8C') }, svg);
    S('path', { d: 'M244 606C280 619 320 619 356 606L360 626C322 639 278 639 240 626Z', fill: gold }, svg);
    S('path', { d: 'M300 616C262 574 214 588 226 622C236 648 282 636 300 616Z', fill: gold, stroke: '#A8741C', 'stroke-opacity': .35 }, svg);
    S('path', { d: 'M300 616C338 574 386 588 374 622C364 648 318 636 300 616Z', fill: gold, stroke: '#A8741C', 'stroke-opacity': .35 }, svg);
    S('ellipse', { cx: 300, cy: 617, rx: 13, ry: 11, fill: lin(defs, '#C98A22', '#FFE9A8') }, svg);
    return svg;
  }

  HB.buildBouquet = (root) => {
    const back = backLayer();
    root.appendChild(back.svg);
    const flowers = PLAN.map(([type, col, x0, y0, s0, rot, depth]) => {
      /* nới cụm hoa ra và phóng to một chút so với bố cục gốc để hoa lấn át giấy gói */
      const x = 300 + (x0 - 300) * 1.1, y = y0 - 16, s = s0 * 1.18;
      const [light, deep] = C[col], f = TYPES[type](light, deep);
      const vb = f.svg.viewBox.baseVal, wrap = document.createElement('div');
      wrap.className = 'bq__f bq__f--' + type;
      wrap.style.left = (x / 600 * 100).toFixed(2) + '%'; wrap.style.top = (y / 770 * 100).toFixed(2) + '%';
      wrap.style.width = (vb.width * s / 600 * 100).toFixed(2) + '%';
      wrap.appendChild(f.svg); root.appendChild(wrap);
      return { wrap, svg: f.svg, petals: f.petals, rot, depth, x, y, colors: [light, deep, mix(light, deep, .5)] };
    });
    const paper = paperLayer();
    root.appendChild(paper);
    const sparks = document.createElement('div'); sparks.className = 'bq__sparks'; root.appendChild(sparks);
    return { flowers, leaves: back.leaves, back: back.svg, paper, sparks };
  };
})();
