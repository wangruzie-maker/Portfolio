(function () {
  "use strict";

  const site = window.siteConfig || {};
  const works = (window.portfolioWorks || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const tracks = window.resumeTracks || [];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHTML = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

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
    const withCover = works.filter((work) => work.coverUrl);
    const featured = withCover.filter((work) => work.featured);
    const pool = featured.length >= 3 ? featured : withCover;
    // denser cylinder: loop copies when few items
    if (pool.length && pool.length < 6) {
      return [...pool, ...pool];
    }
    return pool;
  }

  function hydrateSite() {
    $$("[data-site-name]").forEach((node) => { node.textContent = site.name || site.nameZh || ""; });
    $$("[data-site-role]").forEach((node) => { node.textContent = site.role || ""; });
    $$("[data-site-summary]").forEach((node) => { node.textContent = site.summary || ""; });
    $$("[data-site-location]").forEach((node) => { node.textContent = site.location || ""; });
    $$("[data-site-status]").forEach((node) => { node.textContent = site.status || ""; });
    $$("[data-site-focus]").forEach((node) => { node.textContent = site.focus || ""; });
    $$("[data-site-contact-lead]").forEach((node) => { node.textContent = site.contactLead || ""; });
    $$("[data-site-email]").forEach((node) => {
      node.textContent = site.email || "";
      if (node.tagName === "A" && site.email) node.setAttribute("href", `mailto:${site.email}`);
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
  }

  function renderSpiral() {
    const ring = $("[data-spiral-ring]");
    if (!ring) return;
    const items = featuredWorks();
    const count = Math.max(items.length, 1);
    const radius = Math.min(420, window.innerWidth * 0.42);

    ring.innerHTML = items
      .map((work, index) => {
        const angle = (360 / count) * index;
        const href = mediaHref(work);
        const media = work.coverUrl
          ? `<img src="${escapeHTML(work.coverUrl)}" alt="" loading="lazy" draggable="false">`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a1a,#2a2a2a)"></div>`;
        const label = `<span class="spiral-label">${escapeHTML(work.titleCn || work.title)}</span>`;
        const style = `transform: translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px);`;
        if (href) {
          const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `<a class="spiral-card" data-work-id="${escapeHTML(work.id)}" href="${escapeHTML(href)}" style="${style}"${external}>${media}${label}</a>`;
        }
        return `<article class="spiral-card is-static" data-work-id="${escapeHTML(work.id)}" style="${style}">${media}${label}</article>`;
      })
      .join("");
  }

  function renderList() {
    const list = $("[data-work-list]");
    if (!list) return;
    const seen = new Set();
    const items = featuredWorks().filter((work) => {
      if (seen.has(work.id)) return false;
      seen.add(work.id);
      return true;
    });
    list.innerHTML = items
      .map((work) => {
        const href = mediaHref(work);
        const title = escapeHTML(work.titleCn || work.title);
        if (href) {
          const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `<li><a data-work-id="${escapeHTML(work.id)}" href="${escapeHTML(href)}"${external}>${title}</a></li>`;
        }
        return `<li><span class="is-static" data-work-id="${escapeHTML(work.id)}">${title}</span></li>`;
      })
      .join("");
  }

  function renderExperience() {
    const root = $("[data-exp-tracks]");
    if (!root) return;
    const byId = Object.fromEntries(works.map((work) => [work.id, work]));
    root.innerHTML = tracks
      .map((track) => {
        const items = (track.itemIds || []).map((id) => byId[id]).filter(Boolean);
        return `
          <section class="exp-track">
            <h3>${escapeHTML(track.eyebrow || track.title)}</h3>
            <p>${escapeHTML(track.description || "")}</p>
            <div class="exp-row">
              ${items
                .map((work) => {
                  const href = mediaHref(work);
                  const img = work.coverUrl
                    ? `<img src="${escapeHTML(work.coverUrl)}" alt="" loading="lazy">`
                    : `<div style="aspect-ratio:16/10;background:#181818"></div>`;
                  const body = `
                    ${img}
                    <div class="exp-body">
                      <h4>${escapeHTML(work.titleCn || work.title)}</h4>
                      <p>${escapeHTML(work.summaryCn || "")}</p>
                    </div>`;
                  if (href) {
                    const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
                    return `<a class="exp-card" data-work-id="${escapeHTML(work.id)}" href="${escapeHTML(href)}"${external}>${body}</a>`;
                  }
                  return `<article class="exp-card is-static" data-work-id="${escapeHTML(work.id)}">${body}</article>`;
                })
                .join("")}
            </div>
          </section>`;
      })
      .join("");
  }

  function setupViewToggle() {
    const buttons = $$("[data-view-btn]");
    const setView = (view) => {
      document.body.dataset.view = view;
      buttons.forEach((btn) => {
        const active = btn.getAttribute("data-view-btn") === view;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    };
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.getAttribute("data-view-btn")));
    });
    setView(document.body.dataset.view || "spiral");
  }

  function setupMenu() {
    const menu = $("[data-menu]");
    const toggle = $("[data-menu-toggle]");
    const close = $("[data-menu-close]");
    if (!menu || !toggle) return;

    const open = () => {
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };
    const shut = () => {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };

    toggle.addEventListener("click", () => (menu.hidden ? open() : shut()));
    close?.addEventListener("click", shut);
    $$("[data-menu-link]").forEach((link) => link.addEventListener("click", shut));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) shut();
    });
  }

  function setupSpiralInteraction() {
    const stage = $("[data-spiral-stage]");
    if (!stage) return;

    let rotation = 0;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    let raf = 0;

    const apply = () => {
      document.documentElement.style.setProperty("--spiral-rotate", `${rotation}deg`);
    };

    const tick = () => {
      if (Math.abs(velocity) > 0.02) {
        rotation += velocity;
        velocity *= 0.95;
        apply();
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    stage.addEventListener(
      "wheel",
      (event) => {
        if (document.body.dataset.view !== "spiral") return;
        event.preventDefault();
        rotation += event.deltaY * 0.08 + event.deltaX * 0.08;
        velocity = 0;
        apply();
      },
      { passive: false }
    );

    stage.addEventListener("pointerdown", (event) => {
      if (document.body.dataset.view !== "spiral") return;
      dragging = true;
      lastX = event.clientX;
      velocity = 0;
      stage.setPointerCapture(event.pointerId);
      if (raf) cancelAnimationFrame(raf);
    });

    stage.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      rotation += dx * 0.35;
      velocity = dx * 0.18;
      apply();
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    apply();
    window.addEventListener("resize", () => {
      renderSpiral();
      apply();
    });
  }

  function init() {
    hydrateSite();
    renderSpiral();
    renderList();
    renderExperience();
    setupViewToggle();
    setupMenu();
    setupSpiralInteraction();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
