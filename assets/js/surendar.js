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
    const works = getWorks().filter((w) => !w.hidden);
    const featured = works.filter((w) => w.featured);
    const pool = featured.length ? featured : works.filter((w) => w.categoryCn === "作品" || w.categoryCn === "实习入口" || w.format === "Project");
    const list = pool.length ? pool : works;
    const seen = new Set();
    return list.filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    }).slice(0, 12);
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
        <input type="url" data-edit-link="${escapeHTML(work.id)}" value="${escapeHTML(href)}" placeholder="https://… 或 mailto:… 或子页面路径">
      </div>`;
  }

  function applyModules() {
    const site = getSite();
    const hidden = new Set(Array.isArray(site.hiddenModules) ? site.hiddenModules : []);
    $$("[data-module]").forEach((section) => {
      const id = section.getAttribute("data-module");
      if (!id || id === "home") return;
      section.hidden = hidden.has(id);
      section.classList.toggle("is-module-hidden", hidden.has(id));
    });
    $$("[data-nav-module]").forEach((link) => {
      const id = link.getAttribute("data-nav-module");
      link.hidden = hidden.has(id);
    });
  }

  function hydrateSite() {
    const site = getSite();
    // 顶栏英文品牌；Hero 大字用中文名
    const brandName = "Wang Ruize";
    const heroName = site.nameFirst || site.nameZh || "王瑞泽";
    if (window.siteConfig) {
      window.siteConfig.name = brandName;
      if (!window.siteConfig.nameFirst || window.siteConfig.nameFirst === "Wang Ruize") {
        window.siteConfig.nameFirst = "王瑞泽";
      }
    }
    setText("[data-site-name]", brandName);
    setText("[data-name-first]", heroName === "Wang Ruize" ? "王瑞泽" : heroName);
    setText("[data-name-last]", site.nameLast || "");
    setText("[data-site-role]", site.role || "");
    setText("[data-site-intro]", site.intro || "");
    setText("[data-site-summary]", site.summary || "");
    setText("[data-site-location]", site.location || "");
    $$("[data-site-location]").forEach((node) => {
      node.hidden = !String(site.location || "").trim();
    });
    setText("[data-site-status]", site.status || "");
    setText("[data-site-focus]", site.focus || "");
    setText("[data-site-contact-lead]", site.contactLead || "");
    setText("[data-site-email]", site.email || "");
    setText("[data-site-phone]", site.phone || "");

    ["mission"].forEach((key) => {
      if (site[key]) setText(`[data-edit-text="${key}"]`, site[key]);
    });

    $$("[data-mail-card], [data-mail-cta]").forEach((node) => {
      if (site.email) node.setAttribute("href", `mailto:${site.email}`);
    });
    const phoneCard = $("[data-phone-card]");
    if (phoneCard && site.phone) phoneCard.setAttribute("href", `tel:${String(site.phone).replace(/\s+/g, "")}`);

    [
      "workTitle",
      "workLead",
      "aboutTitle",
      "journeyBracket",
      "journeyTitle",
      "journeyLead",
      "eduBracket",
      "eduTitle",
      "internBracket",
      "internTitle",
      "labBracket",
      "labTitle",
      "labLead",
      "workBracket",
      "personalBracket",
      "personalTitle"
    ].forEach((key) => {
      if (site[key] != null) setText(`[data-edit-text="${key}"]`, site[key]);
    });
    $$('[data-edit-text="labLead"]').forEach((node) => {
      node.hidden = !String(site.labLead || "").trim();
    });

    const slots = site.slots || {};
    Object.keys(slots).forEach((slotId) => {
      const slot = slots[slotId] || {};
      if (slot.title) setText(`[data-edit-text="slot.${slotId}.title"]`, slot.title);
      if (slot.subtitle) setText(`[data-edit-text="slot.${slotId}.subtitle"]`, slot.subtitle);
    });

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

    applyModules();
    applyImages();
  }

  const DEFAULT_SLOT_COVERS = {
    "tools-hub": "assets/covers/tools-hub-cover.jpg",
    "personal-works": "assets/covers/personal-works-cover.jpg",
    "hero-portrait": "assets/hero/portrait-placeholder.png"
  };

  function applyImages() {
    const site = getSite();
    const images = (window.__resumeEdits && window.__resumeEdits.images) || {};
    const slots = site.slots || {};
    const worksById = Object.fromEntries(getWorks().map((work) => [work.id, work]));

    $$("[data-image-slot]").forEach((root) => {
      const id = root.getAttribute("data-image-slot");
      const img = root.querySelector("[data-image-preview]");
      const fallback = root.querySelector("[data-image-fallback]");
      if (!img) return;

      const uploaded = images[id];
      const hasUpload = typeof uploaded === "string" && uploaded.startsWith("data:");
      let src = "";
      if ((id === "tools-hub" || id === "personal-works") && !hasUpload) {
        src = DEFAULT_SLOT_COVERS[id];
      } else if (hasUpload) {
        src = uploaded;
      } else if (id && id.startsWith("work:")) {
        const work = worksById[id.slice(5)];
        src =
          (typeof uploaded === "string" && uploaded) ||
          (work && (work.journeyCoverUrl || work.coverUrl || "")) ||
          "";
      } else {
        src = (slots[id] && slots[id].coverUrl) || DEFAULT_SLOT_COVERS[id] || "";
      }
      const htmlSrc = img.getAttribute("src") || "";
      if (!src && htmlSrc && !htmlSrc.startsWith("data:")) src = htmlSrc;

      if (src) {
        // 加版本戳，避免旧缓存空白图
        const stamped =
          src.startsWith("data:") || src.includes("?")
            ? src
            : `${src}?v=20260721-covers`;
        img.src = stamped;
        img.hidden = false;
        if (fallback && !root.hasAttribute("data-hero-stage")) fallback.hidden = true;
        if (slots[id] && DEFAULT_SLOT_COVERS[id] && !hasUpload) {
          slots[id].coverUrl = DEFAULT_SLOT_COVERS[id];
        }
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
        const cover = images[`work:${work.id}`] || work.coverUrl || "";
        const media = cover
          ? `<div class="case-media"><img src="${escapeHTML(cover)}" alt="" loading="lazy"></div>`
          : `<div class="case-media"><div class="case-media-ph" aria-hidden="true"></div></div>`;
        const upload = `<button type="button" class="case-upload" data-image-upload data-work-image="${escapeHTML(work.id)}" hidden>上传封面</button>`;
        const remove = `<button type="button" class="case-remove" data-remove-case="${escapeHTML(work.id)}" hidden aria-label="删除卡片">×</button>`;
        const role = escapeHTML(work.categoryCn || work.format || "");
        const body = `
          ${media}
          <span class="case-badge">${href ? "Linked" : "Case"}</span>
          <div class="case-index">${String(index + 1).padStart(2, "0")}</div>
          ${upload}
          ${remove}
          <div class="case-body">
            <h3 data-edit-work="${escapeHTML(work.id)}" data-edit-field="titleCn">${escapeHTML(work.titleCn || work.title)}</h3>
            <p class="case-meta">${role}</p>
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

  let marqueeRaf = 0;

  function setupCaseMarquee() {
    const wrap = $("[data-case-marquee]");
    const track = $("[data-case-grid]");
    if (!wrap || !track) return;

    if (marqueeRaf) {
      cancelAnimationFrame(marqueeRaf);
      marqueeRaf = 0;
    }
    track.style.transform = "";

    const cards = Array.from(track.children).filter((node) => !node.hasAttribute("data-marquee-clone"));
    Array.from(track.querySelectorAll("[data-marquee-clone]")).forEach((node) => node.remove());

    if (reduceMotion || cards.length < 4) {
      wrap.classList.remove("is-marquee");
      return;
    }
    wrap.classList.add("is-marquee");

    // Seamless loop: clone the card set once, strip editing hooks from clones.
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("data-marquee-clone", "");
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("[data-edit-text], [data-edit-work]").forEach((node) => {
        node.removeAttribute("data-edit-text");
        node.removeAttribute("data-edit-work");
        node.removeAttribute("contenteditable");
      });
      clone.querySelectorAll("[data-edit-link]").forEach((node) => node.removeAttribute("data-edit-link"));
      clone.querySelectorAll("[data-image-upload], [data-remove-case]").forEach((node) => node.remove());
      track.appendChild(clone);
    });

    let offset = 0;
    let last = null;
    const SPEED = 32; // px per second

    if (!wrap.dataset.marqueeBound) {
      wrap.dataset.marqueeBound = "1";
      wrap.__marqueePaused = false;
      wrap.addEventListener("mouseenter", () => { wrap.__marqueePaused = true; });
      wrap.addEventListener("mouseleave", () => { wrap.__marqueePaused = false; });
      wrap.addEventListener("touchstart", () => { wrap.__marqueePaused = true; }, { passive: true });
      wrap.addEventListener("touchend", () => { wrap.__marqueePaused = false; }, { passive: true });
    }

    function loop(now) {
      marqueeRaf = requestAnimationFrame(loop);
      if (last === null) { last = now; return; }
      const dt = (now - last) / 1000;
      last = now;
      if (wrap.__marqueePaused || document.body.classList.contains("is-editing")) return;
      const half = track.scrollWidth / 2;
      if (!half) return;
      offset = (offset + SPEED * dt) % half;
      track.style.transform = `translate3d(${-offset.toFixed(2)}px, 0, 0)`;
    }
    marqueeRaf = requestAnimationFrame(loop);
  }

  function renderJourney() {
    const works = getWorks();
    const byId = Object.fromEntries(works.map((work) => [work.id, work]));

    tracks.forEach((track) => {
      const root = $(`[data-journey="${track.id}"]`) || (tracks.length === 1 ? $("[data-journey]") : null);
      if (!root) return;
      const items = (track.itemIds || [])
        .map((id) => byId[id])
        .filter((work) => work && !work.hidden)
        .map((work) => ({ ...work, trackTitle: track.title, trackEye: track.eyebrow }));

      root.innerHTML = items
        .map((work) => {
          const href = mediaHref(work);
          const linkClass = href ? " has-link" : "";
          const slotId = `work:${work.id}`;
          const images = (window.__resumeEdits && window.__resumeEdits.images) || {};
          const cover = images[slotId] || work.journeyCoverUrl || "";
          const media = `
            <div class="journey-media" data-image-slot="${escapeHTML(slotId)}">
              <img class="journey-media-img" alt="" data-image-preview ${cover ? `src="${escapeHTML(cover)}"` : "hidden"}>
              <div class="journey-media-ph" data-image-fallback ${cover ? "hidden" : ""} aria-hidden="true"></div>
              <button type="button" class="case-upload journey-upload" data-image-upload data-work-image="${escapeHTML(work.id)}" hidden>上传图片</button>
            </div>`;
          const inner = `
            <div class="year">${escapeHTML(work.timelineSubTag || work.year || "")}</div>
            ${media}
            <div class="journey-copy">
              <p class="role">${escapeHTML(work.categoryCn || work.format || "")}</p>
              <h3 data-edit-work="${escapeHTML(work.id)}" data-edit-field="titleCn">${escapeHTML(work.titleCn || work.title)}</h3>
              <p data-edit-work="${escapeHTML(work.id)}" data-edit-field="summaryCn">${escapeHTML(work.summaryCn || "")}</p>
              ${linkField(work)}
              <button type="button" class="journey-remove" data-remove-internship="${escapeHTML(work.id)}" hidden>删除此段实习</button>
            </div>`;
          if (href) {
            const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
            return `<li><a class="journey-item reveal${linkClass}" data-work-id="${escapeHTML(work.id)}" href="${escapeHTML(href)}"${external}>${inner}</a></li>`;
          }
          return `<li><article class="journey-item is-static reveal${linkClass}" data-work-id="${escapeHTML(work.id)}">${inner}</article></li>`;
        })
        .join("");

      // 教育轨道不显示删除按钮
      if (track.id !== "experience") {
        root.querySelectorAll("[data-remove-internship]").forEach((btn) => btn.remove());
      }
    });

    const editBar = $("[data-journey-edit-bar]");
    if (editBar) editBar.hidden = !document.body.classList.contains("is-editing");
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

  function setupSectionNav() {
    const links = $$("[data-primary-nav] a[href^='#']");
    const sections = links
      .map((link) => {
        const id = (link.getAttribute("href") || "").slice(1);
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);
    if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((link) => {
            const href = link.getAttribute("href") || "";
            link.classList.toggle("is-active", href === `#${id}`);
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
    document.documentElement.dataset.resumePainted = "1";
    hydrateSite();
    splitHeroName();
    renderGrid();
    setupCaseMarquee();
    renderJourney();
    applyImages();
    setupReveal();
    bindEditor();
  }

  function init() {
    window.__resumeHydrate = paint;
    const startChrome = () => {
      setupSectionNav();
      setupLenis();
      setupParallaxMist();
      setupDust();
    };
    const start = () => {
      paint();
      startChrome();
    };
    // 等本地编辑（含 IndexedDB 图片）就绪后再首屏渲染，避免预览丢图丢字
    if (window.__resumeEditsReady && typeof window.__resumeEditsReady.then === "function") {
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        start();
      };
      window.__resumeEditsReady.then(run).catch(run);
      setTimeout(run, 1200);
    } else {
      start();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
