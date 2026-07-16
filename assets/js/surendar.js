(function () {
  "use strict";

  const tracks = window.resumeTracks || [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHTML = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  function getWorks() {
    return (window.portfolioWorks || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  function getSite() {
    return window.siteConfig || {};
  }

  function isNavigableHref(href) {
    if (href == null) return false;
    const value = String(href).trim();
    if (!value || value === "#" || value === "/" || /^javascript:/i.test(value)) return false;
    return true;
  }

  function mediaHref(work) {
    if (!work) return "";
    for (const key of ["externalUrl", "link", "href"]) {
      if (isNavigableHref(work[key])) return String(work[key]).trim();
    }
    return "";
  }

  function featuredWorks() {
    const works = getWorks();
    const featured = works.filter((w) => w.featured);
    const pool = featured.length >= 3 ? featured : works.filter((w) => w.categoryCn === "作品" || w.format === "Project");
    const list = pool.length ? pool : works;
    const seen = new Set();
    return list.filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    }).slice(0, 6);
  }

  function setText(sel, value) {
    $$(sel).forEach((node) => {
      if (value != null && value !== "") node.textContent = value;
    });
  }

  function linkField(work) {
    const href = mediaHref(work);
    return `
      <div class="work-link-field" data-link-field>
        <label>跳转链接（留空不可点）</label>
        <input type="url" data-edit-link="${escapeHTML(work.id)}" value="${escapeHTML(href)}" placeholder="https://… 或 mailto:…">
      </div>`;
  }

  function hydrateSite() {
    const site = getSite();
    const fullName = site.name || site.nameZh || `${site.nameFirst || ""}${site.nameLast || ""}`;
    setText("[data-site-name]", fullName);
    setText("[data-name-first]", site.nameFirst || fullName.slice(0, Math.ceil(fullName.length / 2)));
    setText("[data-name-last]", site.nameLast || fullName.slice(Math.ceil(fullName.length / 2)));
    setText("[data-site-role]", site.role || "");
    setText("[data-site-intro]", site.intro || "");
    setText("[data-site-summary]", site.summary || "");
    setText("[data-site-location]", site.location || "");
    setText("[data-site-status]", site.status || "");
    setText("[data-site-focus]", site.focus || "");
    setText("[data-site-contact-lead]", site.contactLead || "");
    setText("[data-site-email]", site.email || "");

    ["mission"].forEach((key) => {
      if (site[key]) setText(`[data-edit-text="${key}"]`, site[key]);
    });

    const mailCard = $("[data-mail-card]");
    if (mailCard && site.email) mailCard.setAttribute("href", `mailto:${site.email}`);

    if (site.workTitle) setText('[data-edit-text="workTitle"]', site.workTitle);
    if (site.workLead) setText('[data-edit-text="workLead"]', site.workLead);
    if (site.aboutTitle) setText('[data-edit-text="aboutTitle"]', site.aboutTitle);

    const tags = $("[data-resume-tags]");
    if (tags && Array.isArray(site.tags)) {
      tags.innerHTML = site.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
    }

    const socialHtml = (site.socials || [])
      .map((social) => {
        const href = isNavigableHref(social.url) ? String(social.url).trim() : "";
        if (!href) return `<span>${escapeHTML(social.name)}</span>`;
        const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${escapeHTML(href)}"${external}>${escapeHTML(social.name)}</a>`;
      })
      .join("");
    $$("[data-socials], [data-socials-footer]").forEach((node) => {
      node.innerHTML = socialHtml;
    });

    applyImages();
  }

  function applyImages() {
    const site = getSite();
    const images = (window.__resumeEdits && window.__resumeEdits.images) || {};
    const slots = site.slots || {};

    $$("[data-image-slot]").forEach((root) => {
      const id = root.getAttribute("data-image-slot");
      const src = images[id] || (slots[id] && slots[id].coverUrl) || "";
      const img = root.querySelector("[data-image-preview]");
      const fallback = root.querySelector("[data-image-fallback]");
      if (!img) return;
      if (src) {
        img.src = src;
        img.hidden = false;
        if (fallback && !root.hasAttribute("data-hero-stage")) fallback.hidden = true;
      } else {
        img.removeAttribute("src");
        img.hidden = true;
        if (fallback) fallback.hidden = false;
      }
    });

    if (window.__heroPortrait && typeof window.__heroPortrait.rebuild === "function") {
      window.__heroPortrait.rebuild();
    }
  }

  function renderGrid() {
    const grid = $("[data-case-grid]");
    if (!grid) return;
    const images = (window.__resumeEdits && window.__resumeEdits.images) || {};

    grid.innerHTML = featuredWorks()
      .map((work, index) => {
        const href = mediaHref(work);
        const tags = (work.tags || []).slice(0, 3).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
        const cover = images[`work:${work.id}`] || work.coverUrl || "";
        const media = cover
          ? `<div class="case-media"><img src="${escapeHTML(cover)}" alt="" loading="lazy"></div>`
          : `<div class="case-media"><div class="case-media-ph" aria-hidden="true"></div></div>`;
        const upload = `<button type="button" class="case-upload" data-image-upload data-work-image="${escapeHTML(work.id)}" hidden>上传封面</button>`;
        const org = escapeHTML(work.categoryCn || work.format || "");
        const year = escapeHTML(work.timelineSubTag || work.year || "");
        const body = `
          ${media}
          <span class="case-badge">${href ? "Linked" : "Case"}</span>
          <div class="case-index">${String(index + 1).padStart(2, "0")}</div>
          ${upload}
          <div class="case-body">
            <h3 data-edit-work="${escapeHTML(work.id)}" data-edit-field="titleCn">${escapeHTML(work.titleCn || work.title)}</h3>
            <p class="case-meta">${org}${year ? ` · ${year}` : ""}</p>
            <p data-edit-work="${escapeHTML(work.id)}" data-edit-field="summaryCn">${escapeHTML(work.summaryCn || "")}</p>
            <div class="case-tags">${tags}</div>
            ${linkField(work)}
          </div>`;
        const linkClass = href ? " has-link" : "";
        if (href) {
          const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `<a class="case-card reveal${linkClass}" data-work-id="${escapeHTML(work.id)}" href="${escapeHTML(href)}"${external}>${body}</a>`;
        }
        return `<article class="case-card is-static reveal${linkClass}" data-work-id="${escapeHTML(work.id)}">${body}</article>`;
      })
      .join("");
  }

  function renderJourney() {
    const root = $("[data-journey]");
    if (!root) return;
    const works = getWorks();
    const byId = Object.fromEntries(works.map((work) => [work.id, work]));
    const items = [];
    tracks.forEach((track) => {
      (track.itemIds || []).forEach((id) => {
        const work = byId[id];
        if (work) items.push({ ...work, trackTitle: track.title, trackEye: track.eyebrow });
      });
    });

    root.innerHTML = items
      .map((work) => {
        const href = mediaHref(work);
        const linkClass = href ? " has-link" : "";
        const inner = `
          <div class="year">${escapeHTML(work.timelineSubTag || work.year || "")}<br>${escapeHTML(work.trackEye || work.trackTitle || "")}</div>
          <div>
            <p class="role">${escapeHTML(work.categoryCn || work.format || "")}</p>
            <h3 data-edit-work="${escapeHTML(work.id)}" data-edit-field="titleCn">${escapeHTML(work.titleCn || work.title)}</h3>
            <p data-edit-work="${escapeHTML(work.id)}" data-edit-field="summaryCn">${escapeHTML(work.summaryCn || "")}</p>
            ${linkField(work)}
          </div>`;
        if (href) {
          const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `<li><a class="journey-item reveal${linkClass}" data-work-id="${escapeHTML(work.id)}" href="${escapeHTML(href)}"${external}>${inner}</a></li>`;
        }
        return `<li><article class="journey-item is-static reveal${linkClass}" data-work-id="${escapeHTML(work.id)}">${inner}</article></li>`;
      })
      .join("");
  }

  function setupReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 6, 5) * 80}ms`;
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.88 && rect.bottom > 40) {
        item.classList.add("is-visible");
      }
    });

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    items.forEach((item) => {
      if (!item.classList.contains("is-visible")) observer.observe(item);
    });
  }

  function splitHeroName() {
    const heading = $("[data-hero-name]");
    if (!heading) return;
    const lines = $$(".sx-name-line", heading);
    if (reduceMotion) {
      heading.classList.add("is-ready");
      return;
    }
    let offset = 0;
    lines.forEach((line) => {
      const text = line.textContent.trim();
      if (!text) return;
      line.innerHTML = Array.from(text)
        .map((ch, i) => {
          const space = ch === " " ? "&nbsp;" : escapeHTML(ch);
          return `<span class="char" style="--char-i:${offset + i}">${space}</span>`;
        })
        .join("");
      offset += text.length;
    });
    heading.classList.remove("is-ready");
    requestAnimationFrame(() => heading.classList.add("is-ready"));
  }

  function setupDust() {
    const canvas = $("[data-dust-canvas]");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    const dots = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.2,
      a: 0.08 + Math.random() * 0.22,
      s: 0.02 + Math.random() * 0.06
    }));

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function tick(t) {
      ctx.clearRect(0, 0, w, h);
      const time = t * 0.001;
      for (const d of dots) {
        const x = d.x * w + Math.sin(time * d.s + d.y * 8) * 12;
        const y = ((d.y + time * d.s * 0.035) % 1) * h;
        ctx.beginPath();
        ctx.fillStyle = `rgba(245,242,236,${d.a})`;
        ctx.arc(x, y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  }

  function setupRail() {
    const links = $$("[data-rail]");
    const sections = links
      .map((link) => document.getElementById(link.getAttribute("data-rail")))
      .filter(Boolean);
    if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("data-rail") === id);
          });
        });
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: 0.01 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  function setupLenis() {
    if (reduceMotion || typeof window.Lenis !== "function") return;
    const lenis = new window.Lenis({
      duration: 1.35,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -20 });
      });
    });

    window.__lenis = lenis;
  }

  function setupParallaxMist() {
    const mist = $("[data-parallax-mist]");
    if (!mist || reduceMotion) return;
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY || 0;
          mist.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(${1 + Math.min(y, 800) * 0.00008})`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  function bindEditor() {
    if (window.__resumeEditor && window.__resumeEditor.refresh) {
      window.__resumeEditor.refresh();
    }
  }

  function paint() {
    hydrateSite();
    splitHeroName();
    renderGrid();
    renderJourney();
    setupReveal();
    bindEditor();
  }

  function init() {
    paint();
    setupRail();
    setupLenis();
    setupParallaxMist();
    setupDust();
    window.__resumeHydrate = paint;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
