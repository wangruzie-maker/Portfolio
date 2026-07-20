/**
 * Spiral staircase hero — rotating helix of steps with capability keywords.
 *
 * Keywords orbit with the stairs, but always face the camera (no mirror).
 * In edit mode, year/text are contenteditable and persist to localStorage.
 * Effects: shiny | blur | decrypt | gradient  (?fx=…)
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EFFECTS = ["shiny", "blur", "decrypt", "gradient"];
  let rafId = 0;
  let resizeBound = false;

  function getEffect(site) {
    const params = new URLSearchParams(window.location.search);
    const fxParam = (params.get("fx") || "").toLowerCase();
    if (EFFECTS.includes(fxParam)) return fxParam;
    return EFFECTS.includes(site.heroKeywordEffect) ? site.heroKeywordEffect : "shiny";
  }

  function build() {
    const mount = document.querySelector("[data-spiral]");
    if (!mount) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    const site = window.siteConfig || {};
    const keywords = Array.isArray(site.heroKeywords) ? site.heroKeywords : [];
    if (!keywords.length) {
      mount.innerHTML = "";
      return;
    }

    const effect = getEffect(site);
    const ordered = keywords.slice().reverse(); // index 0 = top (latest)
    const STEPS_PER_KEYWORD = 2;
    const stepCount = ordered.length * STEPS_PER_KEYWORD;
    const TURNS = 1.6;
    const SPIN_SECONDS = 26;

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

      const kwIndex = i % STEPS_PER_KEYWORD === 0 ? i / STEPS_PER_KEYWORD : -1;
      let label = null;
      if (kwIndex >= 0 && kwIndex < ordered.length) {
        // Map back to original chronological index in site.heroKeywords
        const sourceIndex = keywords.length - 1 - kwIndex;
        label = document.createElement("div");
        label.className = "spiral-label";
        const yearEl = document.createElement("span");
        yearEl.className = "spiral-year";
        yearEl.setAttribute("data-edit-keyword", String(sourceIndex));
        yearEl.setAttribute("data-edit-field", "year");
        yearEl.textContent = ordered[kwIndex].year;
        const textEl = document.createElement("span");
        textEl.className = `spiral-word fx-${effect}`;
        textEl.setAttribute("data-edit-keyword", String(sourceIndex));
        textEl.setAttribute("data-edit-field", "text");
        textEl.textContent = ordered[kwIndex].text;
        textEl.style.setProperty("--fx-i", String(sourceIndex));
        label.appendChild(yearEl);
        label.appendChild(textEl);
        step.appendChild(label);
      }
      scene.appendChild(step);
      steps.push({ el: step, label });
    }
    mount.appendChild(scene);

    if (effect === "blur") {
      mount.querySelectorAll(".fx-blur").forEach((word) => {
        const i = Number(word.style.getPropertyValue("--fx-i")) || 0;
        setTimeout(() => word.classList.add("is-in"), 350 + i * 220);
      });
    }

    if (effect === "decrypt") {
      const GLYPHS = "アイウエオカキクケコ0123456789#*+=△○●◇";
      Array.from(mount.querySelectorAll(".fx-decrypt"))
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

    let width = 0;
    let height = 0;
    function measure() {
      const rect = mount.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }

    function render(rotationDeg) {
      const radius = Math.min(width * 0.3, 210);
      const usableH = height * 0.78;
      const topY = -usableH / 2;
      const rowH = usableH / Math.max(1, stepCount - 1);
      const editing = document.body.classList.contains("is-editing");

      for (let i = 0; i < stepCount; i += 1) {
        const { el, label } = steps[i];
        const baseAngle = (i / stepCount) * 360 * TURNS;
        const deg = baseAngle + rotationDeg;
        const rad = (deg * Math.PI) / 180;
        const y = topY + i * rowH;
        const depth = (-Math.sin(rad) + 1) / 2;

        el.__tread.style.width = `${radius.toFixed(0)}px`;
        el.style.transform = `translateY(${y.toFixed(1)}px) rotateY(${deg.toFixed(2)}deg)`;
        el.style.zIndex = String(10 + Math.round(depth * 100));
        el.style.opacity = (0.28 + depth * 0.72).toFixed(3);

        if (label) {
          label.style.left = `${radius.toFixed(0)}px`;
          // Counter-rotate so text always faces the camera — no mirror.
          label.style.transform = `rotateY(${(-deg).toFixed(2)}deg)`;
          const vis = Math.max(0, (depth - 0.18) / 0.82);
          label.style.opacity = editing
            ? Math.max(0.72, vis).toFixed(3)
            : (vis * vis).toFixed(3);
        }
      }
    }

    measure();
    if (!resizeBound) {
      resizeBound = true;
      window.addEventListener("resize", () => {
        measure();
        if (reduceMotion) render(0);
      });
    }

    if (reduceMotion) {
      render(0);
      if (window.__resumeEditor && window.__resumeEditor.refresh) window.__resumeEditor.refresh();
      return;
    }

    let start = null;
    let lastRotation = 0;
    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (document.body.classList.contains("is-editing")) {
        render(lastRotation);
        return;
      }
      if (start === null) start = now;
      lastRotation = (((now - start) / 1000) % SPIN_SECONDS) / SPIN_SECONDS * 360;
      render(lastRotation);
    }
    rafId = requestAnimationFrame(tick);

    if (window.__resumeEditor && window.__resumeEditor.refresh) window.__resumeEditor.refresh();
  }

  window.__spiralHero = { rebuild: build };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
