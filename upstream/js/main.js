(function () {
  "use strict";

  const site = window.siteConfig || {};
  const categories = window.portfolioCategories || [];
  const visibleCategoryKeys = new Set(categories.filter((category) => category.key !== "All").map((category) => category.key));
  const works = (window.portfolioWorks || [])
    .filter((work) => visibleCategoryKeys.has(work.category))
    .slice()
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const workflowSteps = window.workflowSteps || [];
  const vibeWorkflowSteps = window.vibeWorkflowSteps || [];
  const dragonSeries = window.dragonCovenantSeries || {};

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const escapeHTML = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const findWork = (id) => works.find((work) => work.id === id);
  const byId = (id) => findWork(id) || works[0];
  const categoryAliases = {
    "Vibe Coding": "Vibe Coding",
    "Vibecoding": "Vibe Coding",
    "AI编程": "Vibe Coding",
    "AI 编程": "Vibe Coding",
    "Commercial Ads": "电商",
    "E-commerce Ads": "电商",
    "电商广告": "电商",
    "AI电商": "电商",
    "App Promo": "APP",
    "App 宣传": "APP",
    "APP宣传": "APP",
    "APP方向": "APP",
    "Travel & Overseas": "APP",
    "Health & Consumer": "电商",
    "Game Visuals": "游戏",
    "AI Short Films": "游戏",
    "AI 短片": "游戏",
    "AI短片": "游戏",
    "Exhibition Boards": "All",
    "Portfolio Archive": "All",
    "其他": "All",
    "Game": "游戏",
    "Games": "游戏",
    "游戏类": "游戏"
  };
  const normalizeCategory = (category) => categoryAliases[category] || category;

  function iconKey(category) {
    return categories.find((item) => item.key === category)?.icon || "all";
  }

  function countCategory(category) {
    return category === "All" ? works.length : works.filter((work) => work.category === category).length;
  }

  function setText(selector, text) {
    const node = $(selector);
    if (node) node.textContent = text;
  }

  function initSiteConfig() {
    const resumeMode = document.body?.dataset?.resumeMode === "true";

    if (!resumeMode) {
      $$(".brand-mark").forEach((mark) => {
        mark.innerHTML = `<img src="assets/logo/wd-logo.png" alt="WD" width="44" height="44">`;
        mark.classList.add("brand-mark-image");
      });
    }

    $$("[data-site-email]").forEach((node) => {
      node.textContent = site.email || "";
      if (node.tagName === "A" && site.email) {
        node.setAttribute("href", `mailto:${site.email}`);
      }
    });
    setText("[data-site-location]", site.location || "");
    setText("[data-site-wechat]", site.wechat || "");
    $$("[data-site-name]").forEach((node) => { node.textContent = site.name || site.nameZh || ""; });
    $$("[data-site-tagline]").forEach((node) => { node.textContent = site.tagline || site.taglineZh || ""; });
    $$("[data-site-role]").forEach((node) => { node.textContent = site.role || ""; });
    $$("[data-site-intro]").forEach((node) => { node.textContent = site.intro || ""; });
    $$("[data-site-summary]").forEach((node) => { node.textContent = site.summary || ""; });
    $$("[data-site-status]").forEach((node) => { node.textContent = site.status || ""; });
    $$("[data-site-focus]").forEach((node) => { node.textContent = site.focus || ""; });
    $$("[data-site-contact-lead]").forEach((node) => { node.textContent = site.contactLead || ""; });

    const tagRoots = $$("[data-resume-tags], [data-resume-tags-secondary]");
    if (tagRoots.length && Array.isArray(site.tags)) {
      tagRoots.forEach((root) => {
        root.innerHTML = site.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("");
      });
    }

    $$("[data-feishu-link]").forEach((link) => {
      if (isNavigableHref(site.feishuUrl)) {
        const href = String(site.feishuUrl).trim();
        link.setAttribute("href", href);
        if (/^https?:\/\//i.test(href)) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
        link.removeAttribute("aria-disabled");
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.addEventListener("click", (event) => event.preventDefault());
      }
    });

    const socials = $("[data-socials]");
    if (socials) {
      socials.innerHTML = (site.socials || [])
        .map((social) => {
          const href = isNavigableHref(social.url) ? String(social.url).trim() : "";
          if (!href) {
            return `
              <span class="social-link social-icon-link is-static" aria-label="${escapeHTML(social.name)}">
                <img src="${escapeHTML(social.icon)}" alt="" width="18" height="18">
                <span>${escapeHTML(social.name)}</span>
              </span>
            `;
          }
          const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:");
          const externalAttrs = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
          return `
            <a class="social-link social-icon-link" href="${escapeHTML(href)}" aria-label="${escapeHTML(social.name)}"${externalAttrs}>
              <img src="${escapeHTML(social.icon)}" alt="" width="18" height="18">
              <span>${escapeHTML(social.name)}</span>
            </a>
          `;
        })
        .join("");
    }
  }

  function coverImageMarkup(work, className = "cover-image") {
    if (work.coverVideoUrl) {
      return `<video class="${escapeHTML(className)} cover-video" data-lazy-video data-src="${escapeHTML(work.coverVideoUrl)}"${work.coverUrl ? ` data-poster="${escapeHTML(work.coverUrl)}"` : ""} autoplay muted loop playsinline preload="none" aria-label="${escapeHTML(`${work.title} / ${work.titleCn}`)}"></video>`;
    }
    if (!work.coverUrl) return "";
    return `<img class="${escapeHTML(className)}" src="${escapeHTML(work.coverUrl)}" alt="${escapeHTML(`${work.title} / ${work.titleCn}`)}" loading="lazy" decoding="async">`;
  }

  function orientationOf(work) {
    if (work.orientation) return work.orientation;
    if (work.format && work.format.includes("9:16")) return "vertical";
    return "horizontal";
  }

  function visualMarkup(work, compact = false) {
    if (work.type === "website-recording") {
      return `
        <div class="browser-shell cover-shell" aria-hidden="true">
          <div class="browser-bar"><span></span><span></span><span></span></div>
          <div class="browser-screen visual-placeholder has-cover">${coverImageMarkup(work)}</div>
        </div>
      `;
    }

    if (orientationOf(work) === "vertical") {
      return `
        <div class="phone-shell cover-phone" aria-hidden="true">
          <div class="phone-screen visual-placeholder has-cover">${coverImageMarkup(work)}</div>
        </div>
      `;
    }

    return `
      <div class="wide-frame visual-placeholder has-cover" aria-hidden="true">
        ${coverImageMarkup(work)}
      </div>
    `;
  }

  function tagMarkup(tags) {
    return (tags || [])
      .slice(0, 3)
      .map((tag) => `<span class="pill">${escapeHTML(tag)}</span>`)
      .join("");
  }

  function isNavigableHref(href) {
    if (href == null) return false;
    const value = String(href).trim();
    if (!value) return false;
    if (value === "#" || value === "/" || /^javascript:/i.test(value)) return false;
    return true;
  }

  function mediaHref(work) {
    if (!work) return "";
    const candidates = [work.externalUrl, work.link, work.href, work.pdfUrl];
    for (const candidate of candidates) {
      if (isNavigableHref(candidate)) return String(candidate).trim();
    }
    if (work.videoUrl && /^https?:\/\//i.test(work.videoUrl)) return work.videoUrl;
    return "";
  }

  function visualActionMarkup(work, options = {}) {
    const visual = visualMarkup(work, options.compact);
    if (work.enableLightbox) {
      return `<button class="visual-button" type="button" data-open-video="${escapeHTML(work.id)}" aria-label="View ${escapeHTML(work.title)}">${visual}</button>`;
    }
    const href = mediaHref(work);
    if (!href) return visual;
    const isExternal = /^https?:\/\//i.test(href);
    return `<a class="visual-link" href="${escapeHTML(href)}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="Open ${escapeHTML(work.title)}">${visual}</a>`;
  }

  function workCard(work, options = {}) {
    const showSummary = options.summary !== false;
    const href = mediaHref(work);
    const isExternal = /^https?:\/\//i.test(href);
    const body = `
        <div class="card-visual">${visualActionMarkup(work, options)}</div>
        <div class="card-body">
          <div class="card-overline">
            <span>${escapeHTML(work.categoryCn || work.category)}</span>
          </div>
          <h3>${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span></h3>
          ${showSummary ? `<p>${escapeHTML(work.summaryCn)}</p>` : ""}
          ${work.highResUrl && isNavigableHref(work.highResUrl) ? `
            <div class="card-action-row">
              <a class="card-action-link" href="${escapeHTML(work.highResUrl)}" target="_blank" rel="noopener noreferrer">查看高清视频</a>
            </div>
          ` : ""}
        </div>
    `;
    const className = `work-card ${escapeHTML(work.type)} orientation-${escapeHTML(orientationOf(work))} layout-${escapeHTML(work.layout || "wide")} reveal`;
    const attrs = `data-work-card data-work-id="${escapeHTML(work.id)}" data-category="${escapeHTML(work.category)}" data-year="${escapeHTML(work.year)}" data-accent="${escapeHTML(work.accent || "cyan")}"`;
    if (!href) {
      return `<article class="${className} is-static" ${attrs}>${body}</article>`;
    }
    return `<a class="${className}" href="${escapeHTML(href)}" ${attrs}${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}>${body}</a>`;
  }

  function renderHighlights() {
    const root = $("[data-highlights]");
    if (!root) return;
    const resumeMode = document.body?.dataset?.resumeMode === "true";
    const keys = ["游戏", "电商", "APP", "Vibe Coding"];
    root.innerHTML = categories
      .filter((category) => keys.includes(category.key))
      .map((category) => {
        const firstWork = works.find((work) => work.category === category.key);
        const configured = isNavigableHref(category.link) ? String(category.link).trim() : "";
        const href = configured || (!resumeMode ? `works.html?category=${encodeURIComponent(category.key)}` : "");
        const action = href ? (resumeMode ? "Open Link" : "View Works") : "Text Card";
        const isExternal = /^https?:\/\//i.test(href);
        const inner = `
            <div>
              <div class="metric-top">
                <span class="metric-icon" data-icon="${escapeHTML(category.icon)}" aria-hidden="true"></span>
                <span class="count">${String(countCategory(category.key)).padStart(2, "0")} ${resumeMode ? "Items" : "Series"}</span>
              </div>
              <h3>${escapeHTML(category.cn || category.key)}</h3>
              <p>${escapeHTML(category.summary)}</p>
            </div>
            <span class="text-link">${action}</span>
        `;
        if (!isNavigableHref(href)) {
          return `<article class="metric-card reveal is-static" data-category-key="${escapeHTML(category.key)}" data-accent="${escapeHTML(firstWork?.accent || "cyan")}">${inner}</article>`;
        }
        return `
          <a class="metric-card reveal" href="${escapeHTML(href)}" data-category-key="${escapeHTML(category.key)}" data-accent="${escapeHTML(firstWork?.accent || "cyan")}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}>
            ${inner}
          </a>
        `;
      })
      .join("");
  }

  function renderHomeFeatured() {
    const gridRoot = $("[data-featured-grid]");
    const reelRoot = $("[data-featured-reel]");
    const featured = works.filter((work) => work.featured).slice(0, 6);

    if (gridRoot) {
      gridRoot.innerHTML = featured.map((work) => workCard(work)).join("");
    }

    if (reelRoot) {
      reelRoot.innerHTML = featured
        .slice(0, 4)
        .map(
          (work) => `
            <button class="reel-thumb" type="button" data-open-video="${escapeHTML(work.id)}">
              ${coverImageMarkup(work, "reel-thumb-image")}
              <span>${String(work.order).padStart(2, "0")}</span>
              <strong>${escapeHTML(work.title)}</strong>
              <em>${escapeHTML(work.duration)}</em>
            </button>
          `
        )
        .join("");
    }
  }

  function archiveItem(work, pdf = false) {
    if (pdf) {
      const pdfHref = work.pdfUrl || `case-study.html?id=${encodeURIComponent(work.id)}`;
      const pdfButtonLabel = /\.pdf(\?.*)?$/i.test(pdfHref) ? "Preview PDF" : "Open Portfolio";
      const isExternal = /^https?:\/\//i.test(pdfHref);
      return `
        <article class="archive-card pdf-card reveal">
          ${visualMarkup(work)}
          <div>
            <div class="meta-row">${tagMarkup(work.tags)}</div>
            <h3>${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span></h3>
            <p>${escapeHTML(work.summaryCn)}</p>
          </div>
          <a class="archive-open-button" href="${escapeHTML(pdfHref)}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""}>
            <span>${pdfButtonLabel}</span>
            <span class="button-arrow" aria-hidden="true">↗</span>
          </a>
        </article>
      `;
    }

    return `
      <article class="archive-card reveal" data-accent="${escapeHTML(work.accent || "cyan")}">
        <div>
          <div class="preview-shell">${visualActionMarkup(work)}</div>
          <h3>${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span></h3>
          <p>${escapeHTML(work.summaryCn)}</p>
        </div>
      </article>
    `;
  }

  function dragonOriginIndexCard() {
    const gameUrl = dragonSeries.gameUrl || "https://wduan1212-rgb.github.io/Dragon/";
    return `
      <a class="dragon-origin-index reveal" href="${escapeHTML(gameUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open Dragon Covenant interactive game">
        <div class="dragon-origin-media">
          <video data-lazy-video data-src="${escapeHTML(dragonSeries.indexMotionUrl || "")}" data-poster="${escapeHTML(dragonSeries.indexPosterUrl || "")}" autoplay muted loop playsinline preload="none" aria-label="Dragon Covenant origin index"></video>
        </div>
        <div class="dragon-origin-copy">
          <p class="section-kicker">2025 Narrative Origin</p>
          <h3>龙之契起源</h3>
          <p>龙之契系列起源于 2025 年的 AI 叙事探索，这张索引卡直接进入 2026 互动网页游戏。</p>
          <span class="button dragon-primary">Play Dragon Game<br><span>进入互动游戏</span></span>
        </div>
      </a>
    `;
  }

  function yearBlock(year, title, subtitle, content) {
    return `
      <section class="year-block reveal" data-year-block>
        <div class="year-sticky">
          <h3 class="year">${year}</h3>
          <p class="year-caption">${escapeHTML(title)}<span>${escapeHTML(subtitle)}</span></p>
        </div>
        <div class="year-content">${content}</div>
      </section>
    `;
  }

  function timelineCoverMarkup(work) {
    if (!work.coverUrl && !work.coverVideoUrl) return "";
    const orientation = orientationOf(work);
    return `
      <div class="project-cover-wrap is-${escapeHTML(orientation)}">
        ${coverImageMarkup(work, `project-cover is-${orientation}`)}
      </div>
    `;
  }

  function timelineProjectCard(work, groupTitle) {
    const href = mediaHref(work);
    const subTag = work.timelineSubTag || "";
    const labels = [work.year, subTag || groupTitle];
    if (subTag && subTag !== groupTitle) labels.push(groupTitle);
    const tagLine = `
      <div class="project-tags">
        ${labels.map((label) => `<span>${escapeHTML(label)}</span>`).join("")}
      </div>
    `;
    const textOnly = !work.coverUrl && !work.coverVideoUrl;
    const inner = `
      ${timelineCoverMarkup(work)}
      <div class="project-info">
        <div>
          <h4 class="project-title">${escapeHTML(work.title)}</h4>
          <p class="project-subtitle">${escapeHTML(work.titleCn || work.summaryCn || "")}</p>
          ${textOnly && work.summaryCn ? `<p class="project-summary">${escapeHTML(work.summaryCn)}</p>` : ""}
        </div>
        ${tagLine}
      </div>
    `;
    const className = `timeline-project-card orientation-${escapeHTML(orientationOf(work))}${textOnly ? " is-text-only" : ""}`;
    const workAttr = ` data-work-id="${escapeHTML(work.id)}"`;
    if (!href) return `<article class="${className}"${workAttr}>${inner}</article>`;
    const isExternal = /^https?:\/\//i.test(href);
    if (work.highResUrl) {
      return `
        <article class="${className} has-actions"${workAttr}>
          <a class="timeline-card-main" href="${escapeHTML(href)}"${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="Open ${escapeHTML(work.title)}">${inner}</a>
          <a class="project-action-link" href="${escapeHTML(work.highResUrl)}" target="_blank" rel="noopener noreferrer">查看高清视频</a>
        </article>
      `;
    }
    return `<a class="${className}" href="${escapeHTML(href)}"${workAttr}${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ""} aria-label="Open ${escapeHTML(work.title)}">${inner}</a>`;
  }

  function createDragonGameTimelineItem() {
    return {
      id: "dragon-covenant-game",
      title: "Dragon Covenant Web Game",
      titleCn: "龙之契互动网页游戏",
      year: 2026,
      category: "Vibe Coding",
      categoryCn: "Vibe Coding",
      type: "website-recording",
      format: "Web Game",
      coverUrl: dragonSeries.indexPosterUrl || findWork("dragon-covenant-dragon")?.coverUrl || "",
      coverVideoUrl: dragonSeries.indexMotionUrl || "",
      externalUrl: dragonSeries.gameUrl || "https://wduan1212-rgb.github.io/Dragon/",
      timelineSubTag: "游戏类",
      summaryCn: "东方奇幻互动网页游戏入口。"
    };
  }

  function renderIndustryTimeline() {
    const byIds = (ids) => ids.map(findWork).filter(Boolean);
    const withSubTag = (work, subTag) => ({ ...work, timelineSubTag: subTag });
    const resumeMode = document.body?.dataset?.resumeMode === "true";

    let groups;
    if (resumeMode && Array.isArray(window.resumeTracks) && window.resumeTracks.length) {
      groups = window.resumeTracks.map((track) => ({
        ...track,
        items: byIds(track.itemIds || []).map((work) => withSubTag(work, work.timelineSubTag || track.title))
      }));
    } else {
      const gameItems = [
        ...byIds(["xundao-daqian"]).map((work) => withSubTag(work, "游戏视觉")),
        ...byIds(["dragon-covenant-finale"]).map((work) => withSubTag(work, "龙之契")),
        ...byIds(["coa-game-showcase"]).map((work) => withSubTag(work, "CoA")),
        ...byIds(["dragon-covenant-undersea", "dragon-covenant-dragon"]).map((work) => withSubTag(work, "2025 龙之契"))
      ];
      const commerceItems = byIds(["ebenb-cooling-pants", "varta-battery-campaign", "tt-fashion-series", "arthur-andrew-medical"])
        .map((work) => withSubTag(work, "商业广告"));
      const appItems = [
        ...byIds(["vivago-overseas-campaign", "alipay-overseas-project", "baidu-cloud-doorway", "trip-uca-travel"]).map((work) => withSubTag(work, "APP")),
        ...byIds(["asha-easy-cash-app", "brazil-local-campaign", "undersea-demo"]).map((work) => withSubTag(work, "移动场景"))
      ];
      const vibeCodingItems = [
        ...byIds(["starfield-frontline-game"]).map((work) => withSubTag(work, "游戏 Demo")),
        ...byIds(["ai-creative-tool-system", "self-operated-production-system"]).map((work) => withSubTag(work, "工具类")),
        ...byIds(["vibe-coding-guide", "renpy-study-guide"]).map((work) => withSubTag(work, "教学类"))
      ];

      groups = [
        {
          id: "game",
          className: "industry-track-game",
          title: "游戏",
          eyebrow: "Game Direction",
          description: "游戏视觉、角色 Campaign、龙之契系列与互动展示入口。",
          duration: 54,
          items: gameItems
        },
        {
          id: "ecommerce",
          className: "industry-track-commerce",
          title: "电商",
          eyebrow: "E-commerce",
          description: "服饰、消费品、健康品和产品广告的系列化投放案例。",
          duration: 44,
          items: commerceItems
        },
        {
          id: "app",
          className: "industry-track-app",
          title: "APP",
          eyebrow: "APP Promo",
          description: "支付、旅行、贷款、出行和移动应用相关传播项目。",
          duration: 62,
          items: appItems
        },
        {
          id: "vibe",
          className: "industry-track-vibe",
          title: "Vibe Coding",
          eyebrow: "AI Coding",
          description: "网站、工具、游戏 Demo 与教学型网页项目。",
          duration: 58,
          items: vibeCodingItems
        }
      ];
    }

    const totalCount = groups.reduce((sum, group) => sum + group.items.length, 0);
    const loopCopies = (items) => (items.length > 1 ? Array.from({ length: 4 }, () => items).flat() : items);
    const headEye = resumeMode ? "Education · Experience" : "Games · E-commerce · APP · Vibe Coding";
    const headLabel = resumeMode ? "Resume Timelines" : "Industry Timelines";
    const headUnit = resumeMode ? "career tracks" : "project series";

    return `
      <div class="industry-timeline" aria-label="${escapeHTML(headLabel)}">
        <div class="industry-timeline-head">
          <span>${escapeHTML(headLabel)}</span>
          <em>${escapeHTML(headEye)}</em>
          <strong>${totalCount} ${escapeHTML(headUnit)}</strong>
        </div>
        <div class="industry-track-list">
          ${groups.map((group, index) => {
            return `
              <section class="industry-track ${escapeHTML(group.className)} reveal${index ? ` delay-${Math.min(index, 3)}` : ""}" data-reveal-repeat aria-label="${escapeHTML(group.title)}">
                <div class="industry-track-head">
                  <div>
                    <span>${escapeHTML(group.eyebrow)}</span>
                    <h3>${escapeHTML(group.title)}</h3>
                  </div>
                  <p>${escapeHTML(group.description)}</p>
                  <strong>${String(group.items.length).padStart(2, "0")} works</strong>
                </div>
                <div class="industry-marquee" data-wheel-horizontal>
                  <div class="industry-marquee-row${group.items.length <= 1 ? " is-static" : ""}" style="--marquee-duration: ${group.duration}s">
                    ${loopCopies(group.items).map((work) => timelineProjectCard(work, group.title)).join("")}
                  </div>
                </div>
              </section>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderTimeline() {
    const root = $("[data-timeline]");
    if (!root) return;

    root.innerHTML = renderIndustryTimeline();
  }

  function renderCategories() {
    const root = $("[data-categories]");
    if (!root) return;
    root.innerHTML = categories
      .filter((category) => category.key !== "All")
      .map((category) => {
        const firstWork = works.find((work) => work.category === category.key);
        return `
          <a class="category-card reveal" href="works.html?category=${encodeURIComponent(category.key)}" data-accent="${escapeHTML(firstWork?.accent || "cyan")}">
            <span class="category-icon" data-icon="${escapeHTML(category.icon)}" aria-hidden="true"></span>
            <h3>${escapeHTML(category.cn || category.key)}</h3>
            <p>${escapeHTML(category.summary)}</p>
          </a>
        `;
      })
      .join("");
  }

  function renderWorkflow(rootSelector, steps, six = false) {
    const root = $(rootSelector);
    if (!root) return;
    root.classList.toggle("six", six);
    root.innerHTML = steps
      .map(
        ([number, en, cn]) => `
          <div class="workflow-step">
            <div class="step-dot">${escapeHTML(number)}</div>
            <strong>${escapeHTML(en)}</strong>
            <span>${escapeHTML(cn)}</span>
          </div>
        `
      )
      .join("");
  }

  function renderWorksPage() {
    const grid = $("[data-works-grid]");
    const filters = $("[data-filters]");
    const count = $("[data-works-count]");
    if (!grid || !filters) return;

    filters.innerHTML = categories
      .map(
        (category) => `
          <button class="filter-button" type="button" data-filter="${escapeHTML(category.key)}">
            ${escapeHTML(category.cn || category.key)}
          </button>
        `
      )
      .join("");

    const params = new URLSearchParams(window.location.search);
    const initial = normalizeCategory(params.get("category") || "All");

    const renderWorksSections = (items) => {
      const horizontal = items.filter((work) => orientationOf(work) !== "vertical");
      const vertical = items.filter((work) => orientationOf(work) === "vertical");
      return `
        ${horizontal.length ? `
          <section class="works-layout-section">
            <div class="works-section-head">
              <h3>Horizontal Works / 横屏项目</h3>
              <span>${horizontal.length} items</span>
            </div>
            <div class="works-horizontal-track">
              ${horizontal.map((work) => workCard(work)).join("")}
            </div>
          </section>
        ` : ""}
        ${vertical.length ? `
          <section class="works-layout-section">
            <div class="works-section-head">
              <h3>Vertical Poster Wall / 竖屏作品瀑布</h3>
              <span>${vertical.length} items</span>
            </div>
            <div class="works-masonry-scroll" data-wheel-horizontal>
              <div class="works-masonry-grid">
                ${vertical.map((work) => workCard(work)).join("")}
              </div>
            </div>
          </section>
        ` : ""}
      `;
    };

    const applyFilter = (category) => {
      const normalizedCategory = normalizeCategory(category);
      const selected = categories.some((item) => item.key === normalizedCategory) ? normalizedCategory : "All";
      $$(".filter-button", filters).forEach((button) => {
        button.classList.toggle("is-active", button.dataset.filter === selected);
      });
      const visible = selected === "All" ? works : works.filter((work) => work.category === selected);
      grid.innerHTML = renderWorksSections(visible);
      if (count) count.textContent = `${visible.length} projects`;
      setupWheelHorizontal(grid);
      revealNow(grid);
    };

    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      applyFilter(button.dataset.filter);
      const url = new URL(window.location.href);
      if (button.dataset.filter === "All") url.searchParams.delete("category");
      else url.searchParams.set("category", button.dataset.filter);
      window.history.replaceState({}, "", url);
    });

    filters.addEventListener("keydown", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      button.click();
    });

    applyFilter(initial);
  }

  function renderCaseStudyPage() {
    const root = $("[data-case-page]");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const work = byId(params.get("id"));
    if (!work) return;

    document.title = `${work.title} | WangDuan AI Portfolio`;
    setText("[data-case-category]", work.categoryCn || work.category);
    const title = $("[data-case-title]");
    if (title) title.innerHTML = `${escapeHTML(work.title)}<br><span>${escapeHTML(work.titleCn)}</span>`;
    setText("[data-case-summary]", work.summaryCn);
    const tags = $("[data-case-tags]");
    if (tags) tags.innerHTML = tagMarkup(work.tags);
    const visual = $("[data-case-visual]");
    if (visual) visual.innerHTML = visualMarkup(work);

    const meta = [
      ["Project Type", work.categoryCn || work.category],
      ["Year", work.year],
      ["Format", work.format],
      ["Platform", work.platform],
      ["Recommended", work.recommendedVideoCount],
      ["Tools", work.tools],
      ["Role", work.role]
    ];
    const metaRoot = $("[data-case-meta]");
    if (metaRoot) {
      metaRoot.innerHTML = meta
        .map(
          ([label, value]) => `
            <div class="meta-item">
              <span>${escapeHTML(label)}</span>
              <strong>${escapeHTML(value)}</strong>
            </div>
          `
        )
        .join("");
    }

    setText("[data-creative-goal]", work.goal);
    setText("[data-visual-strategy]", work.strategy);
    setText("[data-case-value]", work.value);
    setText("[data-reflection]", "This case records the creative objective, visual strategy, production role and final media entry for portfolio review. / 本案例保留创作目标、视觉策略、制作角色与最终媒体入口，便于完整查看项目脉络。");
    $$("[data-case-preview-button]").forEach((button) => {
      button.dataset.openVideo = work.id;
    });
  }

  function setupHeroVideo() {
    const video = $("[data-hero-video]");
    if (!video) return;

    const videoPath = site.heroVideo || "";
    video.poster = site.heroPoster || "";
    video.muted = true;
    video.volume = 0;
    video.preload = "auto";
    if (videoPath) {
      video.src = videoPath;
      video.load();
    }

    const playHero = async () => {
      try {
        video.muted = true;
        video.volume = 0;
        await video.play();
      } catch (error) {
        try {
          video.muted = true;
          video.volume = 0;
          await video.play();
        } catch (mutedError) {
          // Keep the static poster if the browser refuses autoplay entirely.
        }
      }
    };

    if (video.src) playHero();
  }

  function setupLazyVideos(root = document) {
    const lazyVideos = $$("video[data-lazy-video]", root);
    if (!lazyVideos.length) return;

    const loadVideo = (video) => {
      if (video.dataset.lazyLoaded === "true") return;
      const src = video.dataset.src || "";
      const poster = video.dataset.poster || "";
      if (poster) video.poster = poster;
      if (src) video.src = src;
      video.preload = "metadata";
      video.dataset.lazyLoaded = "true";
      video.load();
      if (video.autoplay) {
        video.play().catch(() => {
          // The poster remains visible if autoplay is blocked or the network is still warming up.
        });
      }
    };

    if (!("IntersectionObserver" in window)) {
      lazyVideos.forEach(loadVideo);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadVideo(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px", threshold: 0.01 }
    );

    lazyVideos.forEach((video) => observer.observe(video));
  }

  function setupWheelHorizontal(root = document) {
    $$("[data-wheel-horizontal]", root).forEach((gallery) => {
      if (gallery.dataset.wheelBound === "true") return;
      gallery.dataset.wheelBound = "true";
      gallery.addEventListener(
        "wheel",
        (event) => {
          const canScrollLeft = gallery.scrollLeft > 0;
          const canScrollRight = gallery.scrollLeft + gallery.clientWidth < gallery.scrollWidth - 1;
          const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
          const scrollingNext = delta > 0;
          const scrollingPrev = delta < 0;
          if ((scrollingNext && canScrollRight) || (scrollingPrev && canScrollLeft)) {
            event.preventDefault();
            gallery.scrollLeft += delta;
          }
        },
        { passive: false }
      );

      let isDragging = false;
      let startX = 0;
      let startScroll = 0;
      gallery.addEventListener("pointerdown", (event) => {
        if (event.target.closest("a, button")) return;
        isDragging = true;
        startX = event.clientX;
        startScroll = gallery.scrollLeft;
        gallery.setPointerCapture(event.pointerId);
        gallery.classList.add("is-dragging");
      });
      gallery.addEventListener("pointermove", (event) => {
        if (!isDragging) return;
        gallery.scrollLeft = startScroll - (event.clientX - startX);
      });
      gallery.addEventListener("pointerup", () => {
        isDragging = false;
        gallery.classList.remove("is-dragging");
      });
      gallery.addEventListener("pointercancel", () => {
        isDragging = false;
        gallery.classList.remove("is-dragging");
      });
    });
  }

  function setupGalleryControls() {
    $$(".horizontal-gallery-shell").forEach((shell) => {
      const gallery = $("[data-wheel-horizontal]", shell);
      if (!gallery) return;
      const dots = $$("[data-gallery-dots] span", shell);
      const updateDots = () => {
        if (!dots.length) return;
        const maxScroll = Math.max(gallery.scrollWidth - gallery.clientWidth, 1);
        const active = Math.min(dots.length - 1, Math.round((gallery.scrollLeft / maxScroll) * (dots.length - 1)));
        dots.forEach((dot, index) => dot.classList.toggle("is-active", index === active));
      };

      $$("[data-gallery-scroll]", shell).forEach((button) => {
        button.addEventListener("click", () => {
          const direction = Number(button.dataset.galleryScroll || 1);
          gallery.scrollBy({ left: direction * gallery.clientWidth * 0.82, behavior: "smooth" });
        });
      });

      gallery.addEventListener("scroll", updateDots, { passive: true });
      updateDots();
    });
  }

  function setupReveal() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const replayItems = new Set($$("[data-reveal-repeat]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (!replayItems.has(entry.target)) observer.unobserve(entry.target);
          } else if (replayItems.has(entry.target)) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((item) => observer.observe(item));
  }

  function revealNow(root) {
    $$(".reveal", root).forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 0.035, 0.2)}s`;
      requestAnimationFrame(() => item.classList.add("is-visible"));
    });
  }

  function setupWorkflowAnimation() {
    const workflows = $$(".workflow");
    if (!workflows.length) return;
    const light = (workflow) => {
      workflow.style.setProperty("--workflow-progress", "1");
      $$(".workflow-step", workflow).forEach((step, index) => {
        window.setTimeout(() => step.classList.add("is-lit"), index * 130);
      });
    };
    if (!("IntersectionObserver" in window)) {
      workflows.forEach(light);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          light(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.42 }
    );
    workflows.forEach((workflow) => observer.observe(workflow));
  }

  function setupModal() {
    const modal = $("[data-video-modal]");
    if (!modal) return;
    const title = $("[data-modal-title]", modal);
    const body = $("[data-modal-body]", modal);
    const isPlayableFile = (url = "") => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url) || !/^https?:\/\//i.test(url);

    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      body.innerHTML = "";
      document.body.style.overflow = "";
    };

    const open = (id) => {
      const work = id === "hero" || id === "intro" ? null : byId(id);
      const modalTitle = work
        ? `${work.title} / ${work.titleCn}`
        : id === "intro"
          ? "Works Overview Reel / 作品速览混剪"
          : "Dragon Covenant Finale / 龙之契终章";
      title.textContent = modalTitle;
      if (work && work.embedUrl) {
        body.innerHTML = `<iframe class="embed-slot" src="${escapeHTML(work.embedUrl)}" title="${escapeHTML(modalTitle)}" allowfullscreen></iframe>`;
      } else if (work && work.videoUrl && isPlayableFile(work.videoUrl)) {
        body.innerHTML = `<video class="embed-slot" src="${escapeHTML(work.videoUrl)}" poster="${escapeHTML(work.coverUrl || "")}" controls autoplay playsinline preload="auto"></video>`;
      } else if (work && (work.externalUrl || work.videoUrl)) {
        const url = work.externalUrl || work.videoUrl;
        body.innerHTML = `
          <div class="embed-slot external-slot">
            <div>
              <strong>Open Project Video / 打开项目视频</strong>
              <span>${escapeHTML(work.videoType === "feishu" ? "This series is collected in the Feishu video archive." : "This video opens in an external player.")}</span>
              <a class="button primary" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Open Link / 打开链接</a>
            </div>
          </div>
        `;
      } else if (id === "hero" && site.heroVideo) {
        const finaleVideo = findWork("dragon-covenant-finale")?.videoUrl || site.heroVideo;
        body.innerHTML = `<video class="embed-slot" src="${escapeHTML(finaleVideo)}" poster="${escapeHTML(site.heroPoster || "")}" controls autoplay playsinline preload="auto"></video>`;
      } else if (id === "intro" && site.introVideo) {
        body.innerHTML = `<video class="embed-slot" src="${escapeHTML(site.introVideo)}" poster="assets/covers/horizontal/quick-preview-cover.png" controls autoplay playsinline preload="auto"></video>`;
      } else {
        body.innerHTML = `
          <div class="embed-slot">
            <div>
              <strong>Media Preview / 媒体预览</strong>
              <span>${work ? "This project is presented through its cover and case details." : "Intro media is available on request."}</span>
            </div>
          </div>
        `;
      }
      const modalVideo = $("video.embed-slot", body);
      if (modalVideo) {
        modalVideo.volume = 1;
        modalVideo.play().catch(() => {
          // The controls remain visible if the browser asks for one more explicit play tap.
        });
      }
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-open-video]");
      if (trigger) {
        event.preventDefault();
        open(trigger.dataset.openVideo);
        return;
      }
      if (event.target.matches("[data-modal-close], .modal-backdrop")) close();
    });

    document.addEventListener("keydown", (event) => {
      const trigger = event.target.closest("[data-open-video]");
      if (trigger && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        open(trigger.dataset.openVideo);
        return;
      }
      if (event.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  function setupNav() {
    const toggle = $("[data-nav-toggle]");
    const links = $("[data-nav-links]");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const isOpen = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
      links.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          links.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    const file = window.location.pathname.split("/").pop() || "index.html";
    const hash = window.location.hash;
    let activeSet = false;
    $$(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const targetFile = href.split("#")[0].split("?")[0] || "index.html";
      const targetHash = href.includes("#") ? `#${href.split("#")[1]}` : "";
      let isActive = false;
      if (file === "index.html" && targetFile === "index.html") {
        isActive = hash ? targetHash === hash : !targetHash;
      } else {
        isActive = !hash && targetFile === file && !targetHash;
      }
      if (isActive && !activeSet) {
        link.classList.add("is-active");
        activeSet = true;
      } else {
        link.classList.remove("is-active");
      }
    });
  }

  function init() {
    initSiteConfig();
    renderHighlights();
    renderHomeFeatured();
    renderTimeline();
    renderCategories();
    renderWorkflow("[data-workflow]", workflowSteps);
    renderWorkflow("[data-vibe-workflow]", vibeWorkflowSteps, true);
    renderWorksPage();
    renderCaseStudyPage();
    setupNav();
    setupModal();
    setupHeroVideo();
    setupLazyVideos();
    setupWheelHorizontal();
    setupGalleryControls();
    setupWorkflowAnimation();
    setupReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
