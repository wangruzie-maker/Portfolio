/**
 * Full-bleed Surendar-style hero field.
 * Canvas covers entire hero; left fade keeps copy readable.
 * Mouse lens reveals source photo through a gold ring.
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function createProceduralFace(size) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#030304";
    ctx.fillRect(0, 0, size, size);

    const g = ctx.createRadialGradient(size * 0.58, size * 0.42, size * 0.05, size * 0.56, size * 0.46, size * 0.42);
    g.addColorStop(0, "rgba(255,250,242,1)");
    g.addColorStop(0.25, "rgba(236,230,220,0.88)");
    g.addColorStop(0.55, "rgba(150,146,138,0.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(size * 0.56, size * 0.44, size * 0.3, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 1400; i += 1) {
      const ang = Math.random() * Math.PI * 2;
      const rad = size * (0.18 + Math.random() * 0.5);
      const x = size * 0.56 + Math.cos(ang) * rad * (0.55 + Math.random() * 0.7);
      const y = size * 0.42 + Math.sin(ang) * rad * 0.9;
      ctx.fillStyle = `rgba(245,242,236,${Math.random() * 0.35})`;
      ctx.fillRect(x, y, 1.1, 1.1);
    }
    return c;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function sampleParticles(sourceCanvas, targetW, targetH, density) {
    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;
    const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, srcW, srcH).data;
    const particles = [];
    const step = Math.max(2, Math.round(2.8 / density));

    // Bias particles toward right side of hero (like Surendar)
    for (let y = 0; y < srcH; y += step) {
      for (let x = 0; x < srcW; x += step) {
        const i = (y * srcW + x) * 4;
        const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        const a = data[i + 3] / 255;
        if (a < 0.08 || lum < 0.05) continue;
        if (Math.random() > lum * 0.72 + 0.18) continue;

        const nx = x / srcW;
        const ny = y / srcH;
        const mappedX = targetW * (0.42 + nx * 0.58) + (Math.random() - 0.5) * step;
        const mappedY = targetH * (0.08 + ny * 0.84) + (Math.random() - 0.5) * step;

        particles.push({
          ox: mappedX,
          oy: mappedY,
          size: 0.55 + lum * 1.7 + Math.random() * 0.5,
          alpha: 0.22 + lum * 0.7,
          phase: Math.random() * Math.PI * 2
        });
      }
    }
    return particles;
  }

  function initHeroStage(root) {
    if (!root) return;
    if (root.__heroApi) {
      root.__heroApi.rebuildSource();
      return;
    }

    const canvas = root.querySelector("[data-hero-canvas]");
    const photo = root.querySelector("[data-hero-photo]");
    const lens = root.querySelector("[data-hero-lens]");
    const preview = root.querySelector("[data-image-preview]");
    const fallback = root.querySelector("[data-image-fallback]");
    if (!canvas || !photo || !lens) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let hovering = false;
    let lensStrength = 0;
    let rafStarted = false;
    let sourceCanvas = createProceduralFace(640);

    function currentSrc() {
      if (preview && preview.getAttribute("src") && !preview.hidden) return preview.getAttribute("src");
      return "";
    }

    async function rebuildSource() {
      const src = currentSrc();
      if (src) {
        try {
          const img = await loadImage(src);
          const size = 720;
          const c = document.createElement("canvas");
          c.width = size;
          c.height = size;
          const cctx = c.getContext("2d");
          const scale = Math.max(size / img.width, size / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          cctx.filter = "grayscale(0.4) contrast(1.2) brightness(1.05)";
          cctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
          sourceCanvas = c;
          if (fallback) fallback.hidden = true;
          preview.hidden = false;
        } catch {
          sourceCanvas = createProceduralFace(640);
        }
      } else {
        sourceCanvas = createProceduralFace(640);
        if (preview) {
          preview.hidden = true;
          preview.removeAttribute("src");
        }
      }
      photo.style.backgroundImage = `url(${sourceCanvas.toDataURL("image/jpeg", 0.84)})`;
      resize();
      ensureRaf();
    }

    function resize() {
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = sampleParticles(sourceCanvas, w, h, reduceMotion ? 0.5 : 0.9);
      pointer.x = w * 0.68;
      pointer.y = h * 0.42;
      pointer.tx = pointer.x;
      pointer.ty = pointer.y;
    }

    function setLens(x, y, strength) {
      const s = clamp(strength, 0, 1);
      const r = Math.min(w, h) * (0.01 + s * 0.15);
      photo.style.opacity = String(s * 0.95);
      const mask = `radial-gradient(circle ${r}px at ${x}px ${y}px, #000 0%, #000 58%, transparent 76%)`;
      photo.style.webkitMaskImage = mask;
      photo.style.maskImage = mask;
      lens.style.opacity = String(s);
      lens.style.width = `${r * 2}px`;
      lens.style.height = `${r * 2}px`;
      lens.style.transform = `translate(${x - r}px, ${y - r}px)`;
    }

    function tick(t) {
      const time = t * 0.001;
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      lensStrength += ((hovering ? 1 : 0) - lensStrength) * 0.14;

      ctx.clearRect(0, 0, w, h);
      const radius = Math.min(w, h) * (0.02 + lensStrength * 0.16);

      for (const p of particles) {
        const dx = p.ox - pointer.x;
        const dy = p.oy - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let px = p.ox + Math.sin(time * 0.55 + p.phase) * 0.6;
        let py = p.oy + Math.cos(time * 0.42 + p.phase) * 0.6;
        let alpha = p.alpha;

        if (lensStrength > 0.03 && dist < radius * 1.4) {
          const force = ((1 - dist / (radius * 1.4)) ** 1.35) * lensStrength;
          const ang = Math.atan2(dy, dx);
          px += Math.cos(ang) * force * 34;
          py += Math.sin(ang) * force * 34;
          alpha *= 1 - force * 0.9;
        }

        if (alpha < 0.03) continue;
        ctx.beginPath();
        ctx.fillStyle = `rgba(245,242,236,${clamp(alpha, 0, 1)})`;
        ctx.arc(px, py, p.size * 0.48, 0, Math.PI * 2);
        ctx.fill();
      }

      setLens(pointer.x, pointer.y, lensStrength);
      requestAnimationFrame(tick);
    }

    function ensureRaf() {
      if (reduceMotion || rafStarted) {
        if (reduceMotion) {
          ctx.clearRect(0, 0, w, h);
          for (const p of particles) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(245,242,236,${p.alpha})`;
            ctx.arc(p.ox, p.oy, p.size * 0.48, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        return;
      }
      rafStarted = true;
      requestAnimationFrame(tick);
    }

    function onMove(event) {
      if (reduceMotion) return;
      const rect = root.getBoundingClientRect();
      pointer.tx = clamp(event.clientX - rect.left, 0, w);
      pointer.ty = clamp(event.clientY - rect.top, 0, h);
      // Prefer interaction when cursor is on the right half
      hovering = pointer.tx > w * 0.34;
      root.classList.toggle("is-hovering", hovering);
      ensureRaf();
    }

    function onLeave() {
      hovering = false;
      root.classList.remove("is-hovering");
      pointer.tx = w * 0.68;
      pointer.ty = h * 0.42;
    }

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerenter", onMove);
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);

    rebuildSource();

    root.__heroApi = {
      rebuildSource,
      forceHover(nx, ny) {
        hovering = true;
        pointer.tx = (nx ?? 0.68) * w;
        pointer.ty = (ny ?? 0.42) * h;
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
        lensStrength = 1;
        ensureRaf();
        setLens(pointer.x, pointer.y, 1);
      },
      clearHover: onLeave
    };
    root.__heroRebuild = rebuildSource;
  }

  function boot() {
    const stage = document.querySelector("[data-hero-stage]");
    if (stage) initHeroStage(stage);
  }

  window.__heroPortrait = {
    rebuild() {
      const stage = document.querySelector("[data-hero-stage]");
      if (stage && stage.__heroRebuild) stage.__heroRebuild();
      else boot();
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
