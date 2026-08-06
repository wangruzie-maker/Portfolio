/* Wang Ruize · Ivory Monument Portfolio
 * 模块游廊 + 可编辑 + GitHub 资源
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const C = window.DEFAULT_CONTENT || {};
  const site = C.site || {};
  const asset = window.assetUrl || ((s) => s || "");
  const demo = window.demoUrl || asset;

  const MAIN = ["home", "journey", "lab", "work"];
  const ROUTES = [
    "home", "journey", "lab", "work", "works",
    "baidu", "quwan", "iflytek", "zixun",
    "tool-wefly", "tool-xingzhen", "tool-topic-ai",
  ];

  const TITLES = {
    home: "Home",
    journey: "Journey",
    lab: "Lab",
    work: "Work",
    works: "Works",
    baidu: "百度",
    quwan: "趣丸",
    iflytek: "科大讯飞",
    zixun: "紫讯",
    "tool-wefly": "Wefly",
    "tool-xingzhen": "星阵",
    "tool-topic-ai": "选题工具",
  };

  const PARENT = {
    works: "work",
    baidu: "journey",
    quwan: "journey",
    iflytek: "journey",
    zixun: "journey",
    "tool-wefly": "lab",
    "tool-xingzhen": "lab",
    "tool-topic-ai": "lab",
  };

  const state = { route: "home" };
  let scrolling = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function nl(text) {
    return esc(text).replace(/\n/g, "<br>");
  }

  function mediaFigure(img, editKey) {
    const src = asset(img.src);
    const label = esc(img.label || "");
    if (!src) return "";
    const capEdit = editKey
      ? ` data-edit-img="${esc(editKey)}" data-edit-field="label"`
      : "";
    const replaceBtn = editKey
      ? `<button type="button" class="media__replace" data-image-replace="${esc(editKey)}">换图</button>`
      : "";
    return `<figure class="media" data-lightbox-src="${esc(src)}" data-lightbox-label="${label}" role="button" tabindex="0" title="点击放大">
      ${replaceBtn}
      <img src="${esc(src)}" alt="${label}" loading="lazy" decoding="async" />
      <figcaption class="media__cap"${capEdit}>${label || "图片名称"}</figcaption>
    </figure>`;
  }

  function ensureLightbox() {
    if ($("#lightbox")) return;
    const el = document.createElement("div");
    el.id = "lightbox";
    el.className = "lightbox";
    el.hidden = true;
    el.innerHTML = `
      <div class="lightbox__scrim" data-lightbox-close></div>
      <figure class="lightbox__panel">
        <button type="button" class="lightbox__close" data-lightbox-close aria-label="关闭">×</button>
        <img class="lightbox__img" alt="" />
        <figcaption class="lightbox__cap"></figcaption>
      </figure>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-lightbox-close]") || e.target === el.querySelector(".lightbox__scrim")) {
        closeLightbox();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  function openLightbox(src, label) {
    ensureLightbox();
    const box = $("#lightbox");
    const img = box.querySelector(".lightbox__img");
    const cap = box.querySelector(".lightbox__cap");
    img.src = src;
    img.alt = label || "";
    cap.textContent = label || "";
    box.hidden = false;
    document.body.classList.add("has-lightbox");
  }

  function closeLightbox() {
    const box = $("#lightbox");
    if (!box) return;
    box.hidden = true;
    document.body.classList.remove("has-lightbox");
  }

  function metricsHtml(list, tip) {
    if (!list?.length) return "";
    return `<div class="metrics">${list.map((m) =>
      `<span class="metric"${tip ? ` data-tip="${esc(tip)}"` : ""}>${esc(m)}</span>`
    ).join("")}</div>`;
  }

  /* —— Renderers —— */
  function renderHome() {
    const tags = (C.tags || []).map((t) => `<span class="tag" data-edit-text="tag:${esc(t)}">${esc(t)}</span>`).join("");

    return `
      <div class="home">
        <div>
          <p class="eyebrow" data-edit-text="role">${esc(site.role || "AI 产品 · 市场增长 · Agent 工具")}</p>
          <h1 class="h1" data-edit-text="nameZh">${esc(site.nameZh || "王瑞泽")}</h1>
          <p class="lead" data-edit-text="leadShort">${esc(site.leadShort || "")}</p>
          <div class="chips">
            <a class="chip" href="mailto:${esc(site.email || "")}">
              <b>Email</b><span data-edit-text="email">${esc(site.email || "")}</span>
            </a>
            <a class="chip" href="tel:${esc(site.phone || "")}">
              <b>Phone</b><span data-edit-text="phone">${esc(site.phone || "")}</span>
            </a>
          </div>
          <div class="tags">${tags}</div>
          <div class="btn-row">
            <button type="button" class="btn btn--solid" data-go="journey">${esc(site.heroCtaPrimary || "查看经历")}</button>
            <button type="button" class="btn btn--ghost" data-go="lab">${esc(site.heroCtaSecondary || "体验工具")}</button>
            <button type="button" class="btn btn--ghost" data-go="work">作品</button>
          </div>
          <p class="muted" style="margin-top:1.2rem" data-edit-text="lead">${esc(site.lead || "")}</p>
        </div>
        <aside class="home__spiral">
          <p class="eyebrow">Trajectory</p>
          <div class="sx-spiral" data-spiral aria-label="职业轨迹螺旋阶梯"></div>
        </aside>
      </div>`;
  }

  function renderJourney() {
    const edu = (C.education || []).map((e) => `
      <article class="card" style="cursor:default">
        <div class="card__meta"><span class="kind">${esc(e.kind || "教育")}</span><span>${esc(e.period)}</span></div>
        <h3 class="h3" data-edit-edu="${esc(e.id)}" data-edit-field="title">${esc(e.title)}</h3>
        <p data-edit-edu="${esc(e.id)}" data-edit-field="body">${esc(e.body)}</p>
      </article>`).join("");

    const exps = (C.experiences || []).map((e) => `
      <button type="button" class="card" data-go="${esc(e.id)}">
        <div class="card__meta"><span class="kind">实习</span><span>${esc(e.period)}</span></div>
        <h3 class="h3">${esc(e.company)} · ${esc(e.role)}</h3>
        <p>${esc(e.oneLiner || e.cardSummary || "")}</p>
        ${metricsHtml((e.modules || []).flatMap((m) => m.metrics || []).slice(0, 3), "点击查看详情")}
        <div class="card__arrow">查看详情 →</div>
      </button>`).join("");

    return `
      <div class="section-head">
        <p class="eyebrow">[ Journey ]</p>
        <h2 class="h2">教育背景 / 实习</h2>
        <p class="muted">山东大学 / 重庆大学 · 百度 · 趣丸 · 科大讯飞 · 紫讯。点实习条目进入详情。</p>
      </div>
      <p class="eyebrow" style="margin-top:0.5rem">Education</p>
      <div class="grid-2" style="margin-bottom:1.4rem">${edu}</div>
      <p class="eyebrow">Internships</p>
      <div class="grid-2">${exps}</div>`;
  }

  function renderExp(id) {
    const e = (C.experiences || []).find((x) => x.id === id);
    if (!e) return `<p class="muted">未找到经历</p>`;
    const modules = (e.modules || []).map((m) => {
      const toolBtn = m.toolAnchor === "xingzhen"
        ? `<a class="btn btn--ghost" href="${esc(demo("./demos/xingzhen/index.html"))}" target="_blank" rel="noopener">打开星阵试用 →</a>`
        : m.toolAnchor
          ? `<button type="button" class="btn btn--ghost" data-go="tool-${esc(m.toolAnchor)}">相关工具 →</button>`
          : "";
      return `
      <article class="module">
        <h3 class="h3" data-edit-mod="${esc(e.id)}.${esc(m.id)}" data-edit-field="title">${esc(m.title)}</h3>
        <p class="muted" data-edit-mod="${esc(e.id)}.${esc(m.id)}" data-edit-field="bodyBrief">${esc(m.bodyBrief || "")}</p>
        ${metricsHtml(m.metrics, "结果指标")}
        <div class="module__body" data-edit-mod="${esc(e.id)}.${esc(m.id)}" data-edit-field="body">${nl(m.body || "")}</div>
        <div class="media-grid">${(m.images || []).map((img, ii) => mediaFigure(img, `exp.${e.id}.${m.id}.${ii}`)).join("")}</div>
        ${toolBtn ? `<div class="btn-row" style="margin-top:.9rem">${toolBtn}</div>` : ""}
      </article>`;
    }).join("");

    return `
      <button type="button" class="back" data-go="journey">← 返回 Journey</button>
      <div class="detail-hero">
        <p class="eyebrow">
          <span data-edit-exp="${esc(e.id)}" data-edit-field="period">${esc(e.period)}</span>
          ·
          <span data-edit-exp="${esc(e.id)}" data-edit-field="role">${esc(e.role)}</span>
        </p>
        <h2 class="h2" data-edit-exp="${esc(e.id)}" data-edit-field="company">${esc(e.company)}</h2>
        <p class="lead" data-edit-exp="${esc(e.id)}" data-edit-field="detailIntro">${esc(e.detailIntro || e.oneLiner || "")}</p>
        <div class="tags">${(e.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </div>
      ${modules}`;
  }

  function pickCover(images) {
    const list = images || [];
    const jpg = list.find((img) => /\.(jpe?g|webp)$/i.test(img.src || ""));
    return jpg || list[0] || null;
  }

  function renderLab() {
    const tools = (C.tools || []).map((t) => {
      const coverImg = pickCover(t.images);
      const coverSrc = coverImg ? asset(coverImg.src) : "";
      const href = demo(t.demoUrl || "");
      const isXing = t.id === "xingzhen";
      const actions = isXing
        ? (href
          ? `<a class="btn btn--solid" href="${esc(href)}" target="_blank" rel="noopener">${esc(t.demoLabel || "打开试用")}</a>`
          : "")
        : `
              <button type="button" class="btn btn--ghost" data-go="tool-${esc(t.id)}">图文说明</button>
              ${href ? `<a class="btn btn--solid" href="${esc(href)}" target="_blank" rel="noopener">${esc(t.demoLabel || "打开 Demo")}</a>` : ""}`;
      const coverHtml = coverSrc
        ? `<div class="feature__cover" data-cover-key="tool.${esc(t.id)}.cover"${isXing && href ? ` role="link" data-open="${esc(href)}"` : ""}>
            <button type="button" class="feature__replace" data-image-replace="tool.${esc(t.id)}.cover">换图</button>
            <img src="${esc(coverSrc)}" alt="${esc(coverImg.label || t.name)}" loading="lazy" decoding="async" />
          </div>`
        : `<div class="feature__cover feature__cover--empty" data-cover-key="tool.${esc(t.id)}.cover">
            <button type="button" class="feature__replace" data-image-replace="tool.${esc(t.id)}.cover">换图</button>
          </div>`;
      return `
        <article class="feature">
          <div class="feature__body">
            <p class="eyebrow">${esc(t.sourceLabel || "Tool")}</p>
            <h3 class="h3" data-edit-tool="${esc(t.id)}" data-edit-field="name">${esc(t.name)}</h3>
            <p class="muted" data-edit-tool="${esc(t.id)}" data-edit-field="oneLiner">${esc((t.oneLiner || "").replace(/\n/g, " "))}</p>
            ${metricsHtml(t.metrics)}
            ${isXing ? `<p class="muted" style="margin:.45rem 0">${esc(t.demoNote || "")}</p>` : `
            <ul class="muted" style="margin:.5rem 0;padding-left:1rem;list-style:disc">
              ${(t.capabilities || []).slice(0, 3).map((c) => `<li>${esc(c)}</li>`).join("")}
            </ul>`}
            <div class="btn-row">${actions}</div>
          </div>
          ${coverHtml}
        </article>`;
    }).join("");

    return `
      <div class="section-head">
        <p class="eyebrow">[ Lab ]</p>
        <h2 class="h2" data-edit-text="toolsSectionTitle">${esc(site.toolsSectionTitle || "AI 平台与工具")}</h2>
        <p class="muted" data-edit-text="toolsSectionDesc">${esc(site.toolsSectionDesc || "")}</p>
      </div>
      ${tools}`;
  }

  function renderTool(id) {
    const t = (C.tools || []).find((x) => x.id === id);
    if (!t) return `<p class="muted">未找到工具</p>`;
    const href = demo(t.demoUrl || "");

    // 星阵：不再堆长介绍，直接给试用入口
    if (id === "xingzhen") {
      return `
        <button type="button" class="back" data-go="lab">← 返回 Lab</button>
        <div class="detail-hero">
          <p class="eyebrow">${esc(t.sourceLabel || "")}</p>
          <h2 class="h2" data-edit-tool="xingzhen" data-edit-field="name">${esc(t.name)}</h2>
          <p class="lead" data-edit-tool="xingzhen" data-edit-field="demoNote">${esc(t.demoNote || "")}</p>
          <div class="btn-row">
            ${href ? `<a class="btn btn--solid" href="${esc(href)}" target="_blank" rel="noopener">${esc(t.demoLabel || "打开星阵试用")}</a>` : ""}
          </div>
        </div>
        <div class="media-grid">${(t.images || []).map((img, ii) => mediaFigure(img, `tool.${t.id}.${ii}`)).join("")}</div>`;
    }

    return `
      <button type="button" class="back" data-go="lab">← 返回 Lab</button>
      <div class="detail-hero">
        <p class="eyebrow">${esc(t.sourceLabel || "")}</p>
        <h2 class="h2" data-edit-tool="${esc(t.id)}" data-edit-field="name">${esc(t.name)}</h2>
        <p class="lead" data-edit-tool="${esc(t.id)}" data-edit-field="oneLiner">${esc((t.oneLiner || "").replace(/\n/g, " "))}</p>
        ${metricsHtml(t.metrics)}
        <p class="muted" data-edit-tool="${esc(t.id)}" data-edit-field="demoNote">${esc(t.demoNote || "")}</p>
        <div class="btn-row" style="margin-top:.8rem">
          ${href ? `<a class="btn btn--solid" href="${esc(href)}" target="_blank" rel="noopener">${esc(t.demoLabel || "打开 Demo")}</a>` : `<span class="btn btn--ghost" style="cursor:default">内网演示</span>`}
        </div>
      </div>
      <div class="media-grid">${(t.images || []).map((img, ii) => mediaFigure(img, `tool.${t.id}.${ii}`)).join("")}</div>
      <ul class="muted" style="margin-top:1rem;padding-left:1.1rem;list-style:disc">
        ${(t.capabilities || []).map((c) => `<li style="margin:.35rem 0">${esc(c)}</li>`).join("")}
      </ul>`;
  }

  function renderWork() {
    const works = (C.works || []).map((w) => `
      <button type="button" class="card" data-go="works" data-work="${esc(w.id)}">
        <div class="card__meta"><span class="kind">作品</span><span>${esc(w.type || "")}</span></div>
        <h3 class="h3">${esc(w.title)}</h3>
        <p>${esc(w.summary || "")}</p>
        <div class="card__arrow">作品说明 →</div>
      </button>`).join("");

    const entries = (C.experiences || []).map((e) => `
      <button type="button" class="card" data-go="${esc(e.id)}">
        <div class="card__meta"><span class="kind">实习入口</span><span>${esc(e.period)}</span></div>
        <h3 class="h3">${esc(e.company)}</h3>
        <p>${esc(e.cardSummary || e.oneLiner || "")}</p>
        <div class="card__arrow">进入详情 →</div>
      </button>`).join("");

    return `
      <div class="section-head">
        <p class="eyebrow">[ Work ]</p>
        <h2 class="h2">作品与项目</h2>
        <p class="muted">爆款内容、Agent 工具与实习入口——可核验产出</p>
      </div>
      <p class="eyebrow">Personal</p>
      <div class="grid-2" style="margin-bottom:1.2rem">${works}</div>
      <div class="feature" style="cursor:pointer" data-go="works">
        <div class="feature__body" style="grid-column:1/-1">
          <h3 class="h3">实拍与 AIGC 作品</h3>
          <p class="muted" data-edit-text="worksSectionDesc">${esc(site.worksSectionDesc || "")}</p>
          <div class="btn-row">
            <button type="button" class="btn btn--ghost" data-go="works">${esc(site.worksEntryLabel || "查看作品说明")}</button>
            <button type="button" class="btn btn--ghost" data-go="lab">Agent 平台与工具</button>
          </div>
        </div>
      </div>
      <p class="eyebrow" style="margin-top:1rem">Internship entries</p>
      <div class="grid-2">${entries}</div>`;
  }

  function renderWorks() {
    const page = C.worksPage || {};
    const feishu = page.feishuUrl || "";
    const list = (C.works || []).map((w) => `
      <article class="module" id="work-${esc(w.id)}">
        <p class="eyebrow">${esc(w.type || "")}</p>
        <h3 class="h3" data-edit-work="${esc(w.id)}" data-edit-field="title">${esc(w.title)}</h3>
        <p class="muted" data-edit-work="${esc(w.id)}" data-edit-field="summary">${esc(w.summary || "")}</p>
        <div class="module__body" data-edit-work="${esc(w.id)}" data-edit-field="detail">${nl(w.detail || "")}</div>
        <div class="media-grid">${(w.images || []).map((img, ii) => mediaFigure(img, `work.${w.id}.${ii}`)).join("")}</div>
      </article>`).join("");

    return `
      <button type="button" class="back" data-go="work">← 返回 Work</button>
      <div class="detail-hero">
        <p class="eyebrow">Personal Works</p>
        <h2 class="h2">${esc(page.title || "个人作品集")}</h2>
        <p class="lead">${esc(page.intro || "")}</p>
        <div class="btn-row">
          ${feishu ? `<a class="btn btn--solid" href="${esc(feishu)}" target="_blank" rel="noopener">${esc(page.feishuLabel || "打开飞书合集")}</a>` : `<span class="btn btn--ghost" style="cursor:default">飞书链接待上传</span>`}
        </div>
      </div>
      ${list}`;
  }

  const RENDER = {
    home: renderHome,
    journey: renderJourney,
    lab: renderLab,
    work: renderWork,
    works: renderWorks,
    baidu: () => renderExp("baidu"),
    quwan: () => renderExp("quwan"),
    iflytek: () => renderExp("iflytek"),
    zixun: () => renderExp("zixun"),
    "tool-wefly": () => renderTool("wefly"),
    "tool-xingzhen": () => renderTool("xingzhen"),
    "tool-topic-ai": () => renderTool("topic-ai"),
  };

  const renderedPanes = new Set();

  function syncChrome() {
    const nameZh = site.nameZh || site.name || "王瑞泽";
    $$("[data-edit-text='nameZh']").forEach((n) => { if (!n.closest(".pane")) n.textContent = nameZh; });
    $$("[data-edit-text='email']").forEach((n) => { if (n.classList.contains("rail__contact")) n.textContent = site.email || ""; });
    $$("[data-edit-text='phone']").forEach((n) => { if (n.classList.contains("rail__contact")) n.textContent = site.phone || ""; });
    $$("[data-edit-text='status']").forEach((n) => { n.textContent = site.status || "开放全职机会"; });
  }

  function ensurePane(route, { force } = {}) {
    if (!ROUTES.includes(route)) return;
    if (!force && renderedPanes.has(route)) return;
    const pane = $(`#pane-${route}`);
    if (!pane || !RENDER[route]) return;
    pane.innerHTML = RENDER[route]();
    renderedPanes.add(route);
    if (typeof window.__resumeBindEdit === "function") window.__resumeBindEdit();
    if (route === "home" && window.__spiralHero && typeof window.__spiralHero.rebuild === "function") {
      requestAnimationFrame(function () { window.__spiralHero.rebuild(); });
    }
  }

  function hydrate() {
    // 首屏只渲染一级页，详情页进入时再挂载，避免一次拉取全部大图
    MAIN.forEach((r) => ensurePane(r));
    syncChrome();
  }

  window.__resumeHydrate = function () {
    renderedPanes.clear();
    hydrate();
    ensurePane(state.route, { force: true });
  };

  function setTrail(route) {
    const parent = PARENT[route];
    if (!parent) {
      $("#trail").innerHTML = "";
      return;
    }
    $("#trail").innerHTML = `
      <span class="trail__step">${esc(TITLES[parent])}</span>
      <span class="trail__sep"></span>
      <span class="trail__step is-on">${esc(TITLES[route])}</span>`;
  }

  let loaderTimer = null;
  function showLoader(on) {
    const el = $("#routeLoader");
    if (!el) return;
    clearTimeout(loaderTimer);
    el.hidden = !on;
    el.setAttribute("aria-hidden", on ? "false" : "true");
    if (on) {
      loaderTimer = setTimeout(() => showLoader(false), reduced ? 80 : 420);
    }
  }

  function go(route, { silent } = {}) {
    if (!ROUTES.includes(route)) return;
    const corridor = $("#corridor");
    const pane = $(`#pane-${route}`);
    if (!corridor || !pane) return;

    state.route = route;
    ensurePane(route);
    $("#pageTitle").textContent = TITLES[route] || route;
    setTrail(route);

    $$(".rail__item").forEach((btn) => {
      const g = btn.getAttribute("data-go");
      const active = g === route || g === PARENT[route];
      btn.classList.toggle("is-active", active);
    });

    if (!silent) showLoader(true);
    else showLoader(false);

    scrolling = true;
    pane.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "start", block: "nearest" });
    setTimeout(() => { scrolling = false; }, 500);

    const hash = MAIN.includes(route) ? `#/${route}` : `#/${PARENT[route] || "home"}/${route}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);

    const damask = $("#damask");
    if (damask && !reduced) {
      const i = ROUTES.indexOf(route);
      damask.style.transform = `translateX(${(i % 5) * -6}px) translateY(${(i % 3) * 4}px)`;
    }
  }

  function routeFromHash() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    if (!raw) return "home";
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 1 && ROUTES.includes(parts[0])) return parts[0];
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      if (ROUTES.includes(last)) return last;
      // experience/baidu style
      if (parts[0] === "experience" && ROUTES.includes(parts[1])) return parts[1];
      if (parts[0] === "tools" || parts[0] === "lab") {
        const id = parts[1];
        if (ROUTES.includes(`tool-${id}`)) return `tool-${id}`;
        if (id === "xingzhen") return "tool-xingzhen";
      }
    }
    return "home";
  }

  function neighbor(dir) {
    const seq = MAIN.includes(state.route)
      ? MAIN
      : ROUTES;
    const i = seq.indexOf(state.route);
    if (i < 0) return go(dir > 0 ? "journey" : "home");
    const next = seq[(i + dir + seq.length) % seq.length];
    go(next);
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const light = e.target.closest("[data-lightbox-src]");
      if (light) {
        if (e.target.closest("[data-image-replace]")) return;
        if (document.body.classList.contains("is-editing") && e.target.closest("[data-edit-img]")) return;
        e.preventDefault();
        openLightbox(light.getAttribute("data-lightbox-src"), light.getAttribute("data-lightbox-label") || "");
        return;
      }
      const openEl = e.target.closest("[data-open]");
      if (openEl) {
        if (e.target.closest("[data-image-replace]")) return;
        const url = openEl.getAttribute("data-open");
        if (url) window.open(url, "_blank", "noopener");
        return;
      }
      const goEl = e.target.closest("[data-go]");
      if (goEl) {
        e.preventDefault();
        go(goEl.getAttribute("data-go"));
        return;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const light = e.target.closest?.("[data-lightbox-src]");
      if (!light) return;
      e.preventDefault();
      openLightbox(light.getAttribute("data-lightbox-src"), light.getAttribute("data-lightbox-label") || "");
    });

    $("#prevMod")?.addEventListener("click", () => neighbor(-1));
    $("#nextMod")?.addEventListener("click", () => neighbor(1));
    $("#editBtn")?.addEventListener("click", () => {
      if (typeof window.__resumeToggleEdit === "function") window.__resumeToggleEdit();
      else toast("编辑模块加载中");
    });

    const corridor = $("#corridor");
    corridor?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); neighbor(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); neighbor(-1); }
    });

    // sync active pane on manual scroll
    let scrollT;
    corridor?.addEventListener("scroll", () => {
      if (scrolling) return;
      clearTimeout(scrollT);
      scrollT = setTimeout(() => {
        const panes = $$(".pane");
        const left = corridor.scrollLeft;
        let best = panes[0];
        let bestDist = Infinity;
        panes.forEach((p) => {
          const d = Math.abs(p.offsetLeft - left);
          if (d < bestDist) { bestDist = d; best = p; }
        });
        const r = best?.getAttribute("data-route");
        if (r && r !== state.route) go(r, { silent: true });
      }, 80);
    });

    window.addEventListener("hashchange", () => go(routeFromHash(), { silent: true }));
  }

  // expose for editor
  window.__portfolioGo = go;
  window.__portfolioContent = C;

  hydrate();
  bind();
  const bootRoute = routeFromHash();
  ensurePane(bootRoute);
  go(bootRoute, { silent: true });
})();
