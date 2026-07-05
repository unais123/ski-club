/* ==========================================================================
   Gulmarg Ski Club — hero-sequence.js
   Cinematic pinned hero: canvas image-sequence scrubbed by scroll.

   HOW IT WORKS
   ------------
   The .hero section is 200vh tall; .hero__stage is position:sticky so the
   canvas pins for one full viewport of scrolling. Scroll progress (0 → 1)
   through that runway selects a frame. The visible frame is eased toward
   the target with linear interpolation each requestAnimationFrame tick,
   which gives the Apple-style fluid scrub even on jumpy scroll input.

   FRAMES
   ------
   Drop your 500 rendered frames into assets/hero-frames/ named:
       frame_0001.webp … frame_0500.webp   (JPG also works — see EXT below)
   The loader probes frame_0001; when present, all 500 frames are preloaded
   with a coarse-to-fine strategy (every 10th frame first so scrubbing works
   almost immediately, then the gaps fill in). Until real frames exist, a
   procedural renderer draws an equivalent cinematic mountain flyover so the
   hero is fully functional out of the box.
   ========================================================================== */

(() => {
  "use strict";

  const CONFIG = {
    frameCount: 500,
    // Frames are named 0001.jpg … 0500.jpg in assets/hero-frames/
    path: (i) => `assets/hero-frames/${String(i).padStart(4, "0")}${CONFIG.ext}`,
    ext: ".jpg",             // uploaded frames are JPEG
    lerp: 0.12,              // scrub smoothing (lower = floatier)
    maxDpr: 2,               // cap devicePixelRatio for performance
    // Static cinematic hero photo used when no frame sequence is present.
    // Rendered with a slow scroll-driven Ken-Burns zoom. Set to null to
    // fall back to the procedural mountain scene instead.
    poster: "assets/images/hero_winter_mountain.jpg",
  };

  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("hero-canvas");
  if (!hero || !canvas) return;

  const ctx = canvas.getContext("2d");
  const counterEl = document.getElementById("hero-frame-counter");
  const content = document.querySelector(".hero__content");
  const parallaxLayers = document.querySelectorAll(".hero__parallax [data-depth]");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dpr = 1, vw = 0, vh = 0;
  let progress = 0;          // raw scroll progress 0..1
  let smooth = 0;            // eased progress used for rendering
  let frames = null;         // Image[] when real frames are in use
  let loadedCount = 0;
  let posterImg = null;      // static hero photo, once loaded
  // Render mode: "procedural" (drawn scene) → "poster" (static photo) →
  // "frames" (real image sequence), upgrading as each asset becomes available.
  let mode = "procedural";

  /* ------------------------------------------------------------ sizing */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    vw = canvas.clientWidth;
    vh = canvas.clientHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* -------------------------------------------------------- poster mode */
  function loadPoster() {
    if (!CONFIG.poster) return;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      posterImg = img;
      // Only promote to poster mode if the real frame sequence hasn't won.
      if (mode !== "frames") { mode = "poster"; needsDraw = true; }
      // The frame counter is meaningless without a sequence — hide it.
      if (counterEl) counterEl.style.display = "none";
    };
    img.onerror = () => { /* keep procedural fallback */ };
    img.src = CONFIG.poster;
  }

  /* -------------------------------------------------------- frame mode */
  function probeFrames() {
    const probe = new Image();
    probe.onload = () => {
      mode = "frames";
      needsDraw = true;                       // repaint away from the fallback
      if (counterEl) counterEl.style.display = "";
      preloadAll();
    };
    probe.onerror = () => { /* keep poster / procedural fallback */ };
    probe.src = CONFIG.path(1);
  }

  // Draw the static hero photo cover-fit with a scroll-driven zoom + drift.
  function drawPoster(t) {
    const img = posterImg;
    const zoom = 1 + t * 0.14;                 // subtle Ken-Burns push-in
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = vw / vh;
    let dw, dh;
    if (ir > cr) { dh = vh * zoom; dw = dh * ir; }
    else         { dw = vw * zoom; dh = dw / ir; }
    const dx = (vw - dw) / 2;
    const dy = (vh - dh) / 2 - t * vh * 0.06;  // slight upward drift
    ctx.clearRect(0, 0, vw, vh);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function preloadAll() {
    frames = new Array(CONFIG.frameCount);
    // Coarse pass (every 10th frame) first, then fill the gaps.
    const order = [];
    for (let i = 1; i <= CONFIG.frameCount; i += 10) order.push(i);
    for (let i = 1; i <= CONFIG.frameCount; i++) if ((i - 1) % 10 !== 0) order.push(i);

    let cursor = 0;
    const CONCURRENCY = 8;
    function next() {
      if (cursor >= order.length) return;
      const idx = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        loadedCount++;
        // If this frame is the one currently on screen, force a repaint so
        // the hero swaps from the fallback the instant its frame arrives.
        if (idx - 1 === lastDrawnFrame) needsDraw = true;
        next();
      };
      img.src = CONFIG.path(idx);
      frames[idx - 1] = img;
    }
    for (let c = 0; c < CONCURRENCY; c++) next();
  }

  // Nearest already-loaded frame at or below the target index.
  function nearestLoaded(target) {
    for (let d = 0; d < CONFIG.frameCount; d++) {
      const below = frames[target - d];
      if (below && below.complete && below.naturalWidth) return below;
      const above = frames[target + d];
      if (above && above.complete && above.naturalWidth) return above;
    }
    return null;
  }

  function drawFrameImage(img) {
    // cover-fit
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = vw / vh;
    let dw, dh;
    if (ir > cr) { dh = vh; dw = dh * ir; } else { dw = vw; dh = dw / ir; }
    ctx.drawImage(img, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
  }

  /* ------------------------------------------- procedural fallback scene
     A slow cinematic push toward Apharwat: gradient dawn sky, drifting
     stars, four parallax ridge lines that scale and slide as t advances,
     plus rolling valley fog. Purely a stand-in until real frames arrive. */
  const RIDGES = [
    { seed: 7,  base: 0.52, amp: 0.16, speed: 0.05, scale: 0.35, color: [24, 32, 84] },
    { seed: 13, base: 0.62, amp: 0.20, speed: 0.12, scale: 0.55, color: [24, 21, 165] },
    { seed: 29, base: 0.74, amp: 0.24, speed: 0.24, scale: 0.8,  color: [16, 24, 62] },
    { seed: 47, base: 0.88, amp: 0.26, speed: 0.42, scale: 1.1,  color: [8, 11, 36] },
  ];

  function ridgeY(x, seed, amp) {
    // layered sine noise → believable mountain profile
    return (
      Math.sin(x * 2.1 + seed) * 0.45 +
      Math.sin(x * 4.7 + seed * 1.7) * 0.3 +
      Math.sin(x * 9.3 + seed * 2.9) * 0.15 +
      Math.sin(x * 17.0 + seed * 4.1) * 0.1
    ) * amp;
  }

  function drawProcedural(t) {
    // Sky: night navy → brand blue dawn as t advances
    const g = ctx.createLinearGradient(0, 0, 0, vh);
    const dawn = t;
    g.addColorStop(0, `rgb(${8 + 20 * dawn}, ${10 + 14 * dawn}, ${40 + 90 * dawn})`);
    g.addColorStop(0.55, `rgb(${24 + 18 * dawn}, ${21 + 15 * dawn}, ${120 + 80 * dawn})`);
    g.addColorStop(1, `rgb(${70 + 60 * dawn}, ${80 + 60 * dawn}, ${190 + 55 * dawn})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vw, vh);

    // Stars fade out as dawn rises
    const starAlpha = Math.max(0, 0.8 - t * 1.4);
    if (starAlpha > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${starAlpha})`;
      for (let i = 0; i < 90; i++) {
        const sx = ((i * 73.13) % 1) * vw;
        const sy = ((i * 37.77) % 1) * vh * 0.55;
        ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
      }
    }

    // Rising sun glow behind the far ridge
    const sunY = vh * (0.55 - t * 0.28);
    const glow = ctx.createRadialGradient(vw * 0.68, sunY, 0, vw * 0.68, sunY, vh * 0.5);
    glow.addColorStop(0, `rgba(255, 236, 200, ${0.12 + t * 0.4})`);
    glow.addColorStop(1, "rgba(255, 236, 200, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, vw, vh);

    // Ridges — camera pushes forward: each layer scales up and slides down
    for (const r of RIDGES) {
      const push = 1 + t * r.scale * 0.35;
      const yBase = vh * (r.base + t * r.speed * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, vh);
      const steps = 90;
      for (let s = 0; s <= steps; s++) {
        const x = (s / steps) * vw;
        const nx = (s / steps - 0.5) * push + t * r.speed * 0.4;
        const y = yBase - Math.abs(ridgeY(nx * 3, r.seed, r.amp)) * vh * push;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(vw, vh);
      ctx.closePath();
      const [cr, cg, cb] = r.color;
      const lift = t * 26;
      ctx.fillStyle = `rgb(${cr + lift}, ${cg + lift}, ${cb + lift * 1.6})`;
      ctx.fill();

      // snow caps on the two nearest ridges
      if (r.scale >= 0.8) {
        ctx.save();
        ctx.globalAlpha = 0.55 + t * 0.3;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const x = (s / steps) * vw;
          const nx = (s / steps - 0.5) * push + t * r.speed * 0.4;
          const y = yBase - Math.abs(ridgeY(nx * 3, r.seed, r.amp)) * vh * push;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // Valley fog banks
    for (let f = 0; f < 3; f++) {
      const fy = vh * (0.68 + f * 0.1) + Math.sin(t * 6 + f) * 8;
      const fog = ctx.createLinearGradient(0, fy - 60, 0, fy + 60);
      fog.addColorStop(0, "rgba(238, 241, 255, 0)");
      fog.addColorStop(0.5, `rgba(238, 241, 255, ${0.10 + f * 0.05})`);
      fog.addColorStop(1, "rgba(238, 241, 255, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, fy - 60, vw, 120);
    }
  }

  /* ------------------------------------------------------------ render */
  let lastDrawnFrame = -1;
  let needsDraw = true;

  function render() {
    smooth += (progress - smooth) * (reduceMotion ? 1 : CONFIG.lerp);
    if (Math.abs(progress - smooth) < 0.0005) smooth = progress;

    const frameIdx = Math.min(
      CONFIG.frameCount - 1,
      Math.max(0, Math.round(smooth * (CONFIG.frameCount - 1)))
    );

    if (frameIdx !== lastDrawnFrame || needsDraw) {
      if (mode === "frames" && frames) {
        const img = nearestLoaded(frameIdx);
        if (img) { ctx.clearRect(0, 0, vw, vh); drawFrameImage(img); }
        else if (posterImg) drawPoster(smooth);
        else drawProcedural(smooth);
        if (counterEl) {
          counterEl.innerHTML =
            `<strong>${String(frameIdx + 1).padStart(3, "0")}</strong> / ${CONFIG.frameCount}`;
        }
      } else if (mode === "poster" && posterImg) {
        drawPoster(smooth);
      } else {
        drawProcedural(smooth);
      }
      lastDrawnFrame = frameIdx;
      needsDraw = false;
    }

    // Hero copy drifts up + fades across the first 60% of the runway
    if (content) {
      const fade = Math.min(1, smooth / 0.6);
      content.style.opacity = String(1 - fade * fade);
      content.style.transform = `translateY(${fade * -70}px)`;
    }
    // Foreground mountain silhouettes: slower drift = parallax depth
    parallaxLayers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth) || 0.3;
      layer.style.transform = `translateX(-50%) translateY(${smooth * 120 * depth}px)`;
    });

    requestAnimationFrame(render);
  }

  function onScroll() {
    const rect = hero.getBoundingClientRect();
    const runway = hero.offsetHeight - window.innerHeight;
    progress = runway > 0 ? Math.min(1, Math.max(0, -rect.top / runway)) : 0;
  }

  /* ------------------------------------------------------ snow particles */
  function initSnow() {
    const snowCanvas = document.getElementById("hero-snow");
    if (!snowCanvas || reduceMotion) return;
    const sctx = snowCanvas.getContext("2d");
    let sw, sh;
    const COUNT = window.innerWidth < 700 ? 45 : 110;
    const flakes = [];

    function sizeSnow() {
      sw = snowCanvas.width = snowCanvas.clientWidth;
      sh = snowCanvas.height = snowCanvas.clientHeight;
    }
    sizeSnow();
    window.addEventListener("resize", sizeSnow);

    for (let i = 0; i < COUNT; i++) {
      flakes.push({
        x: Math.random() * 2000, y: Math.random() * 1200,
        r: 0.6 + Math.random() * 2.4,
        vy: 0.3 + Math.random() * 1.1,
        vx: -0.3 + Math.random() * 0.6,
        o: 0.25 + Math.random() * 0.6,
        wob: Math.random() * Math.PI * 2,
      });
    }

    (function tick() {
      sctx.clearRect(0, 0, sw, sh);
      sctx.fillStyle = "#fff";
      for (const f of flakes) {
        f.wob += 0.01;
        f.x += f.vx + Math.sin(f.wob) * 0.35;
        f.y += f.vy;
        if (f.y > sh + 5) { f.y = -5; f.x = Math.random() * sw; }
        if (f.x > sw + 5) f.x = -5;
        if (f.x < -5) f.x = sw + 5;
        sctx.globalAlpha = f.o;
        sctx.beginPath();
        sctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    })();
  }

  /* -------------------------------------------------------------- boot */
  resize();
  window.addEventListener("resize", () => { resize(); needsDraw = true; });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  loadPoster();
  probeFrames();
  initSnow();
  requestAnimationFrame(render);
})();
