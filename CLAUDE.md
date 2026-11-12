# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive birthday card (Vietnamese copy) for Hal, concept "Mười Ngàn Năm": one WebGL sky that goes from starry night to dawn across 8 scenes. Plain HTML + CSS + classic (non-module) scripts: no build step, no package.json, no tests, no linter. Libraries load from jsDelivr with pinned versions (GSAP 3.13 + ScrollTrigger/SplitText/DrawSVG, Three.js r149 global build, Lenis 1.1.20, canvas-confetti). `vendor/` is left over from the old version and is unused.

`DESIGN.md` holds the design tokens, storyboard and adaptive-quality rules. The original pre-redesign site is in `../backup-original/`.

## Running

- `npx serve .` and open the printed URL. The microphone path needs `http://localhost` or https.
- Opening `index.html` directly works too (that is why scripts are classic, not ES modules).
- URL switches for testing: `?q=low|mid|high` forces a quality tier, `?rm=1` forces reduced motion, `?nowebgl=1` forces the no-WebGL fallback.

## Architecture

- **`js/config.js`** sets `window.HAL`: all editable content (names, birthday, music, `photos[]`, `timeline[]`, `vouchers[]`, wish copy, the easter-egg line). The letter text itself lives in `index.html` (`CẢNH 6`).
- **`js/core.js`** creates the `HB` namespace: helpers, `HB.bus` events (`open`, `unlock`, `quality`), `HB.Q` quality tiers, shared `HB.pointer` (mouse or device orientation), `HB.odometer`, `HB.typeText`, and `HB.scene(name, init)`.
- **`js/sky.js`** owns the single Three.js renderer and exposes `HB.sky` (`setScroll`, `morph`, `burst`, `shoot`, `firework`, `flash`, `warp`, `toWorld`, `onFrame`, `reset`). When WebGL is missing it leaves a stub with the same methods, so scenes never check for it. It also measures real FPS and calls `HB.Q.downgrade()`.
- **`js/cake3d.js`** builds the cake inside the sky scene (`HB.cake3d`); the cake follows the DOM box `#cakeAnchor` every frame, as the dust shapes follow the element passed to `sky.setDustAnchor()`.
- **`js/scenes/*.js`**: one file per scene, each calling `HB.scene(name, init)`. `init` runs once (after fonts are ready) and **returns a reset function** used by "Đọc lại từ đầu". A new scene with state must return a reset; never add listeners or create objects inside a reset. `gate.js` is the exception: it runs immediately so the preloader can show progress.
- **`js/main.js`** sets up Lenis + ScrollTrigger, runs the scene inits, the scroll-progress trigger (drives the sky's dawn), and `HB.replay()`.
- Script order in `index.html` matters: CDN libs → `config` → `core` → `audio` → `sky` → `cake3d` → `ui` → scenes → `main`.

## Conventions

- Pinned scenes (`#story`, `#memories`) must be `display: block`; ScrollTrigger drops pin spacing inside a flex parent.
- Every effect needs a reduced-motion path (`HB.RM`) and must work when `HB.sky.ok` is false.
- Missing assets degrade: photos fall back to a labelled night-sky box, the mp3 falls back to the synthesized piano in `audio.js`.
- The microphone is requested only when the user presses "Thổi thật vào micro"; denial falls back to press-and-hold. The wish text is never stored or sent.
- Use tokens from `css/tokens.css` (and `HB.M` in JS) instead of raw values. Code comments and UI copy are in Vietnamese; all three fonts must keep Vietnamese coverage.
- Call `ScrollTrigger.refresh()` after any layout change that moves scroll positions.
