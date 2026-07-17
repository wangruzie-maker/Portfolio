/**
 * Spiral staircase hero — a rotating 3D helix of "steps" carrying
 * chronological capability keywords.
 *
 * Keyword text effects ported to vanilla JS/CSS from vue-bits
 * (https://github.com/DavidHDev/vue-bits):
 *   shiny    — ShinyText: gold shine sweeping across the text
 *   blur     — BlurText: staggered blur-in reveal
 *   decrypt  — DecryptedText: scramble-then-reveal
 *   gradient — GradientText: flowing gradient fill
 * Preview any effect with ?fx=shiny|blur|decrypt|gradient
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mount = document.querySelector("[data-spiral]");
  if (!mount) return;

  const site = window.siteConfig || {};
  const keywords = Array.isArray(site.heroKeywords) ? site.heroKeywords : [];
  if (!keywords.length) return;

  const params = new URLSearchParams(window.location.search);
  const EFFECTS = ["shiny", "blur", "decrypt", "gradient"];
  const fxParam = (params.get("fx") || "").toLowerCase();
  const effect = EFFECTS.includes(fxParam) ? fxParam : (EFFECTS.includes(site.heroKeywordEffect) ? site.heroKeywordEffect : "shiny");

  /* ——— Build DOM ——— */
  // Chronological: earliest keyword at the bottom, climbing to the top.
  const ordered = keywords.slice().reverse(); // index 0 = top (latest)
  const STEPS_PER_KEYWORD = 2;
  const stepCount = ordered.length * STEPS_PER_KEYWORD;

  mount.innerHTML = "";
  const scene = document.createElement("div");
  scene.className = "spiral-scene";
  const axis = document.createElement("div");
  axis.className = "spiral-axis";
  scene.appendChild(axis);
  const base = document.createElement("div");
  base.className = "spiral-base";
  scene.appendChild(base);

  const steps = [];
  for (let i = 0; i < stepCount; i += 1) {
    const step = document.createElement("div");
    step.className = "spiral-step";
    const tread = document.createElement("div");
    tread.className = "spiral-tread";
    step.appendChild(tread);
    step.__tread = tread;

    // Keywords live on the axis at their step's height and surface
    // whenever their step swings to the front.
    const kwIndex = i % STEPS_PER_KEYWORD === 0 ? i / STEPS_PER_KEYWORD : -1;
    let label = null;
    if (kwIndex >= 0 && kwIndex < ordered.length) {
      label = document.createElement("div");
      label.className = "spiral-label";
      const yearEl = document.createElement("span");
      yearEl.className = "spiral-year";
      yearEl.textContent = ordered[kwIndex].year;
      const textEl = document.createElement("span");
      textEl.className = `spiral-word fx-${effect}`;
      textEl.textContent = ordered[kwIndex].text;
      textEl.style.setProperty("--fx-i", String(ordered.length - 1 - kwIndex));
      label.appendChild(yearEl);
      label.appendChild(textEl);
      scene.appendChild(label);
    }
    scene.appendChild(step);
    steps.push({ el: step, label });
  }
  mount.appendChild(scene);

  /* ——— Effects setup ——— */
  if (effect === "blur") {
    // BlurText port: staggered blur(10px) -> blur(0) reveal, oldest first.
    const words = mount.querySelectorAll(".fx-blur");
    words.forEach((word) => {
      const i = Number(word.style.getPropertyValue("--fx-i")) || 0;
      setTimeout(() => word.classList.add("is-in"), 350 + i * 220);
    });
  }

  if (effect === "decrypt") {
    // DecryptedText port: sequential scramble reveal, oldest first.
    const GLYPHS = "アイウエオカキクケコ0123456789#*+=△○●◇";
    const words = Array.from(mount.querySelectorAll(".fx-decrypt"));
    words
      .sort((a, b) => (Number(a.style.getPropertyValue("--fx-i")) || 0) - (Number(b.style.getPropertyValue("--fx-i")) || 0))
      .forEach((word, order) => {
        const original = word.textContent;
        const chars = Array.from(original);
        word.textContent = "";
        setTimeout(() => {
          let revealed = 0;
          const timer = setInterval(() => {
            revealed += 1;
            word.textContent = chars
              .map((ch, idx) => {
                if (ch === " ") return " ";
                if (idx < revealed) return ch;
                return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              })
              .join("");
            if (revealed >= chars.length) {
              clearInterval(timer);
              word.textContent = original;
            }
          }, 55);
        }, 300 + order * 260);
      });
  }

  /* ——— 3D layout + rotation ——— */
  const TURNS = 1.6; // total helix turns top to bottom
  const SPIN_SECONDS = 26;
  let width = 0;
  let height = 0;

  function measure() {
    const rect = mount.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }

  function render(rotationDeg) {
    // Treads radiate outward from the central axis, like a real spiral stair.
    const radius = Math.min(width * 0.24, 150);
    const usableH = height * 0.72;
    const topY = -usableH / 2;
    const rowH = usableH / Math.max(1, stepCount - 1);

    for (let i = 0; i < stepCount; i += 1) {
      const { el, label } = steps[i];
      const baseAngle = (i / stepCount) * 360 * TURNS;
      const deg = baseAngle + rotationDeg;
      const rad = (deg * Math.PI) / 180;
      const y = topY + i * rowH;

      // With rotateY(deg), the tread's outer tip lands at world z = -sin(deg)*radius.
      const depth = (-Math.sin(rad) + 1) / 2; // 0 = far, 1 = near

      el.__tread.style.width = `${radius.toFixed(0)}px`;
      el.style.transform = `translateY(${y.toFixed(1)}px) rotateY(${deg.toFixed(2)}deg)`;
      el.style.zIndex = String(10 + Math.round(depth * 100));
      el.style.opacity = (0.3 + depth * 0.7).toFixed(3);

      if (label) {
        label.style.top = `${(height / 2 + y).toFixed(1)}px`;
        const vis = Math.max(0, (depth - 0.35) / 0.65);
        label.style.opacity = (vis * vis).toFixed(3);
      }
    }
  }

  measure();
  window.addEventListener("resize", () => {
    measure();
    if (reduceMotion) render(0);
  });

  if (reduceMotion) {
    render(0);
    return;
  }

  let start = null;
  function tick(now) {
    if (start === null) start = now;
    const rotation = (((now - start) / 1000) % SPIN_SECONDS) / SPIN_SECONDS * 360;
    render(rotation);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
