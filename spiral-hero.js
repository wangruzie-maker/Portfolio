/**
 * Spiral staircase hero — golden helix with trajectory keywords.
 * Adapted from Portfolio-wduan for ivory monument portfolio.
 */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EFFECTS = ["shiny", "blur", "decrypt", "gradient"];
  let rafId = 0;
  let resizeBound = false;

  function getKeywords() {
    const C = window.DEFAULT_CONTENT || {};
    if (Array.isArray(C.heroKeywords) && C.heroKeywords.length) return C.heroKeywords;
    if (Array.isArray(C.site && C.site.heroKeywords)) return C.site.heroKeywords;
    return [];
  }

  function getEffect() {
    const params = new URLSearchParams(window.location.search);
    const fxParam = (params.get("fx") || "").toLowerCase();
    if (EFFECTS.includes(fxParam)) return fxParam;
    const configured = (window.DEFAULT_CONTENT && window.DEFAULT_CONTENT.heroKeywordEffect) || "shiny";
    return EFFECTS.includes(configured) ? configured : "shiny";
  }

  function build() {
    const mount = document.querySelector("[data-spiral]");
    if (!mount) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    const keywords = getKeywords();
    if (!keywords.length) {
      mount.innerHTML = "";
      return;
    }

    const effect = getEffect();
    const ordered = keywords.slice().reverse();
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
        const sourceIndex = keywords.length - 1 - kwIndex;
        label = document.createElement("div");
        label.className = "spiral-label";
        const yearEl = document.createElement("span");
        yearEl.className = "spiral-year";
        yearEl.setAttribute("data-edit-keyword", String(sourceIndex));
        yearEl.setAttribute("data-edit-field", "year");
        yearEl.textContent = ordered[kwIndex].year;
        const textEl = document.createElement("span");
        textEl.className = "spiral-word fx-" + effect;
        textEl.setAttribute("data-edit-keyword", String(sourceIndex));
        textEl.setAttribute("data-edit-field", "text");
        textEl.textContent = ordered[kwIndex].text;
        textEl.style.setProperty("--fx-i", String(sourceIndex));
        label.appendChild(yearEl);
        label.appendChild(textEl);
        step.appendChild(label);
      }
      scene.appendChild(step);
      steps.push({ el: step, label: label });
    }
    mount.appendChild(scene);

    if (effect === "blur") {
      mount.querySelectorAll(".fx-blur").forEach(function (word) {
        const i = Number(word.style.getPropertyValue("--fx-i")) || 0;
        setTimeout(function () { word.classList.add("is-in"); }, 350 + i * 220);
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
      const radius = Math.min(width * 0.40, 270);
      const usableH = height * 0.82;
      const topY = -usableH / 2;
      const rowH = usableH / Math.max(1, stepCount - 1);
      const editing = document.body.classList.contains("is-editing");

      for (let i = 0; i < stepCount; i += 1) {
        const item = steps[i];
        const el = item.el;
        const label = item.label;
        const baseAngle = (i / stepCount) * 360 * TURNS;
        const deg = baseAngle + rotationDeg;
        const rad = (deg * Math.PI) / 180;
        const y = topY + i * rowH;
        const depth = (-Math.sin(rad) + 1) / 2;

        el.__tread.style.width = radius.toFixed(0) + "px";
        el.style.transform = "translateY(" + y.toFixed(1) + "px) rotateY(" + deg.toFixed(2) + "deg)";
        el.style.zIndex = String(10 + Math.round(depth * 100));
        el.style.opacity = (0.28 + depth * 0.72).toFixed(3);

        if (label) {
          label.style.left = radius.toFixed(0) + "px";
          label.style.transform = "rotateY(" + (-deg).toFixed(2) + "deg)";
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
      window.addEventListener("resize", function () {
        measure();
        if (reduceMotion) render(0);
      });
    }

    if (reduceMotion) {
      render(0);
      if (typeof window.__resumeBindEdit === "function") window.__resumeBindEdit();
      return;
    }

    var start = null;
    var lastRotation = 0;
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

    if (typeof window.__resumeBindEdit === "function" && document.body.classList.contains("is-editing")) {
      window.__resumeBindEdit();
    }
  }

  window.__spiralHero = { rebuild: build };
})();
