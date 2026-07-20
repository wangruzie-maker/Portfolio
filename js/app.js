(() => {
  const STORAGE_KEY = "wrz-portfolio-content-v3";
  const IDB_NAME = "wrz-portfolio-db";
  const IDB_STORE = "kv";
  const MAX_IMAGE_EDGE = 1600;
  const MAX_IMAGE_DATA_CHARS = 900 * 1024; // ~0.9MB base64 budget per image
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let content = normalizeContent(window.DEFAULT_CONTENT);
  let editMode = new URLSearchParams(location.search).has("edit");
  let saveTimer = null;
  let activeToolId = "wefly";
  let storageReady = false;
  /** @type {Record<string, number>} */
  const slideIndex = {};

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeImages(item) {
    if (!Array.isArray(item.images) || !item.images.length) {
      item.images = [{ label: item.imageLabel || "占位图", src: item.image || "", link: "" }];
    }
    item.images = item.images.map((img) => ({
      label: img.label || "占位图",
      src: img.src || "",
      link: img.link || ""
    }));
    return item;
  }

  function normalizeContent(data) {
    const c = deepClone(data);
    (c.experiences || []).forEach((exp) => (exp.modules || []).forEach(normalizeImages));
    (c.tools || []).forEach(normalizeImages);
    (c.works || []).forEach(normalizeImages);
    if (!c.worksPage) {
      c.worksPage = {
        title: "个人作品集",
        intro: "作品说明如下。精选成片见飞书合集。",
        feishuLabel: "打开飞书作品合集",
        feishuUrl: "https://feishu.cn/docx/TODO_WORKS_COLLECTION"
      };
    }
    // 回填默认演示链接（用户本地旧存档可能缺 demoUrl）
    const defaults = window.DEFAULT_CONTENT && window.DEFAULT_CONTENT.tools;
    if (Array.isArray(defaults) && Array.isArray(c.tools)) {
      c.tools.forEach((tool) => {
        const base = defaults.find((t) => t.id === tool.id);
        if (!base) return;
        if (!tool.demoUrl && base.demoUrl) {
          tool.demoUrl = base.demoUrl;
          tool.demoLabel = tool.demoLabel || base.demoLabel;
          tool.demoNote = tool.demoNote || base.demoNote;
        }
        if ((!tool.images || !tool.images.some((img) => img.link)) && Array.isArray(base.images)) {
          tool.images = deepClone(base.images);
        }
      });
    }
    // 旧存档姓名强制对齐英文拼写
    if (c.site) {
      if (!c.site.name || c.site.name === "王瑞泽") c.site.name = "Wang Ruize";
    }
    return c;
  }

  function openIdb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IndexedDB 打开失败"));
    });
  }

  async function idbGet(key) {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbSet(key, value) {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDel(key) {
    const db = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function loadContentFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version >= 3) return normalizeContent(parsed);
      }
    } catch (_) {}
    try {
      localStorage.removeItem("wrz-portfolio-content-v1");
      localStorage.removeItem("wrz-portfolio-content-v2");
    } catch (_) {}
    return null;
  }

  async function loadContent() {
    try {
      const fromIdb = await idbGet(STORAGE_KEY);
      if (fromIdb && fromIdb.version >= 3) return normalizeContent(fromIdb);
    } catch (e) {
      console.warn("IndexedDB 读取失败，回退 localStorage", e);
    }
    const fromLs = loadContentFromLocalStorage();
    if (fromLs) {
      try {
        await idbSet(STORAGE_KEY, fromLs);
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      return fromLs;
    }
    return normalizeContent(window.DEFAULT_CONTENT);
  }

  async function persist(statusText) {
    content.version = 3;
    window.__detailContent = content;
    try {
      await idbSet(STORAGE_KEY, content);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    } catch (e) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      } catch (e2) {
        alert("保存失败：存储空间不足。请删掉几张大图，或换更小的截图后再试。");
        console.warn(e, e2);
        return;
      }
    }
    const el = $("#save-status");
    if (el) {
      el.textContent = statusText || "已自动保存";
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        el.textContent = "";
      }, 1600);
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist().catch((e) => console.warn(e));
    }, 400);
  }

  function setEditMode(on) {
    editMode = on;
    const url = new URL(location.href);
    if (on) url.searchParams.set("edit", "1");
    else url.searchParams.delete("edit");
    history.replaceState(null, "", url);
    render();
  }

  function ph(label) {
    return `<div class="ph" role="img" aria-label="${escapeHtml(label)}">${escapeHtml(label)}</div>`;
  }

  function mediaHtml(image, label) {
    if (image) {
      return `<img src="${escapeAttr(image)}" alt="${escapeAttr(label)}" loading="lazy" data-lightbox-src="${escapeAttr(image)}" data-lightbox-alt="${escapeAttr(label)}" />`;
    }
    return ph(label || "Image");
  }

  function slideFrameHtml(cur) {
    const inner = mediaHtml(cur.src, cur.label);
    const zoomable = Boolean(cur.src);
    const linkChip =
      cur.link && !editMode
        ? `<a class="link-chip" href="${escapeAttr(cur.link)}" target="_blank" rel="noopener noreferrer" data-carousel-link>打开链接</a>`
        : "";
    const cls = ["carousel-frame", zoomable ? "is-zoomable" : "", cur.link && !editMode ? "has-link" : ""]
      .filter(Boolean)
      .join(" ");
    return `<div class="${cls}" ${zoomable ? 'role="button" tabindex="0" title="点击放大查看"' : ""}>${inner}${linkChip}</div>`;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function editable(path, text, tag = "span") {
    const safe = escapeHtml(text);
    if (!editMode) return `<${tag}>${safe}</${tag}>`;
    return `<${tag} class="editable" contenteditable="plaintext-only" data-path="${escapeAttr(path)}">${safe}</${tag}>`;
  }

  function formatBody(path, text) {
    const parts = String(text || "").split(/\n+/).filter(Boolean);
    if (!editMode) {
      return parts.map((p) => `<p class="detail-p">${escapeHtml(p)}</p>`).join("");
    }
    return `<div class="editable body-edit" contenteditable="plaintext-only" data-path="${escapeAttr(path)}">${escapeHtml(text)}</div>`;
  }

  function route() {
    const hash = location.hash.replace(/^#\/?/, "") || "home";
    const [page, id] = hash.split("/");
    return { page, id };
  }

  function navigate(to) {
    location.hash = to.startsWith("#") ? to : `#/${to}`;
  }

  function getSlideKey(scope, id) {
    return `${scope}:${id}`;
  }

  function getSlide(scope, id, len) {
    const key = getSlideKey(scope, id);
    let i = slideIndex[key] || 0;
    if (len <= 0) return 0;
    i = ((i % len) + len) % len;
    slideIndex[key] = i;
    return i;
  }

  /** 只更新配图视口，不重绘整页 */
  function updateCarouselView(car) {
    const scope = car.dataset.scope;
    const id = car.dataset.id;
    const owner = resolveImageOwner(scope, id);
    if (!owner) return;
    const list = owner.images;
    const i = getSlide(scope, id, list.length);
    const cur = list[i];
    const viewport = car.querySelector("[data-carousel-viewport]");
    const count = car.querySelector("[data-carousel-count]");
    const hint = car.querySelector("[data-carousel-hint]");
    const clearBtn = car.querySelector("[data-img-clear-src]");
    const delBtn = car.querySelector("[data-img-del]");

    if (viewport) {
      viewport.classList.add("is-switching");
      viewport.innerHTML = slideFrameHtml(cur);
      requestAnimationFrame(() => {
        viewport.classList.remove("is-switching");
      });
    }
    if (count) count.textContent = `${i + 1} / ${list.length}`;

    const labelInput = car.querySelector("[data-img-label]");
    const linkInput = car.querySelector("[data-img-link]");
    if (labelInput && document.activeElement !== labelInput) labelInput.value = cur.label || "";
    if (linkInput && document.activeElement !== linkInput) linkInput.value = cur.link || "";

    if (clearBtn) clearBtn.hidden = !cur.src;
    if (delBtn) delBtn.disabled = list.length <= 1;
    if (hint) {
      const parts = [];
      if (cur.src) parts.push("点击配图可放大查看");
      if (cur.link && !editMode) parts.push("有外链可点「打开链接」");
      hint.textContent = parts.join(" · ");
      hint.hidden = !parts.length;
    }
  }

  function renderCarousel(scope, id, images, pathPrefix) {
    const list = images && images.length ? images : [{ label: "占位图", src: "", link: "" }];
    const i = getSlide(scope, id, list.length);
    const cur = list[i];
    const hasLink = Boolean(cur.link);

    return `
      <div class="carousel" data-scope="${escapeAttr(scope)}" data-id="${escapeAttr(id)}" data-path-prefix="${escapeAttr(pathPrefix)}">
        <div class="carousel-viewport" data-carousel-viewport>${slideFrameHtml(cur)}</div>
        <div class="carousel-bar">
          <button type="button" class="carousel-btn" data-carousel-prev aria-label="上一张">‹</button>
          <span class="carousel-count" data-carousel-count>${i + 1} / ${list.length}</span>
          <button type="button" class="carousel-btn" data-carousel-next aria-label="下一张">›</button>
          ${
            editMode
              ? `<span class="carousel-page-ops">
                  <button type="button" class="carousel-btn" data-img-add title="增加一页图示" aria-label="增加一页">＋</button>
                  <button type="button" class="carousel-btn" data-img-del title="删除本页图示" aria-label="删除本页" ${list.length <= 1 ? "disabled" : ""}>－</button>
                </span>`
              : ""
          }
        </div>
        ${
          editMode
            ? `<div class="carousel-edit">
                <label class="edit-field">图示标题
                  <input type="text" data-img-label value="${escapeAttr(cur.label)}" />
                </label>
                <label class="edit-field">跳转链接（可选，与放大查看并存）
                  <input type="text" data-img-link placeholder="./demos/wefly/index.html 或 https://..." value="${escapeAttr(cur.link)}" />
                </label>
                <div class="dropzone" data-dropzone tabindex="0">
                  <p>拖拽图片到此处，或选择本地文件上传 · 点击配图可放大查看</p>
                  <input type="file" accept="image/*" data-img-file hidden />
                  <button type="button" class="btn btn-ghost btn-sm" data-img-pick>选择图片</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-img-clear-src ${cur.src ? "" : "hidden"}>清除图片</button>
                </div>
              </div>`
            : `<p class="carousel-hint" data-carousel-hint>${cur.src ? "点击配图可放大查看" : ""}${hasLink ? (cur.src ? " · " : "") + "有外链可点「打开链接」" : ""}</p>`
        }
      </div>`;
  }

  function renderHeader() {
    const { page } = route();
    const links = [
      ["home", "Home", "index.html"],
      ["experience", "Journey", "#/experience/baidu"],
      ["tools", "Lab", "#/tools"],
      ["works", "Work", "#/works"]
    ];
    return `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" href="index.html">${escapeHtml(content.site.name)} <span>· Portfolio</span></a>
          <nav class="nav" aria-label="主导航">
            ${links
              .map(([key, label, href]) => {
                const active =
                  (key === "experience" && page === "experience") ||
                  (key === "tools" && page === "tools") ||
                  (key === "works" && page === "works");
                return `<a href="${href}" class="${active ? "active" : ""}">${label}</a>`;
              })
              .join("")}
            <button type="button" class="nav-edit" id="edit-toggle">${editMode ? "退出编辑" : "编辑"}</button>
          </nav>
        </div>
      </header>`;
  }

  function renderHome() {
    const s = content.site;
    const expCards = content.experiences
      .map(
        (e) => `
      <a class="card" href="#/experience/${e.id}">
        <div class="card-media">${mediaHtml(e.cardImage || "", e.placeholderLabel)}</div>
        <div class="card-body">
          <h3>${escapeHtml(e.company)}</h3>
          <p>${escapeHtml(e.cardSummary)}</p>
          <span class="card-time">${escapeHtml(e.role)} · ${escapeHtml(e.period)}</span>
        </div>
      </a>`
      )
      .join("");

    return `
      <section class="hero">
        <p class="eyebrow">Portfolio</p>
        ${editable("site.name", s.name, "h1")}
        ${editable("site.role", s.role, "p")}
        <p class="edu-line">${editable("site.education", s.education, "span")}</p>
        <div class="lead">${editable("site.leadShort", s.leadShort, "p")}</div>
        <div class="lead lead-detail">${editable("site.lead", s.lead, "p")}</div>
        <div class="hero-actions btn-row">
          <a class="btn btn-solid" href="#/experience/baidu">${escapeHtml(s.heroCtaPrimary)}</a>
          <a class="btn" href="#/tools">${escapeHtml(s.heroCtaSecondary)}</a>
          <a class="btn btn-ghost" href="#/works">作品集</a>
        </div>
      </section>

      <section>
        <div class="section-title"><h2>经历</h2><span class="eyebrow" style="margin:0">Experience</span></div>
        <div class="card-grid">${expCards}</div>
      </section>

      <section style="margin-top:2.5rem">
        <div class="section-title"><h2>${escapeHtml(s.toolsSectionTitle || "工具体验")}</h2><span class="eyebrow" style="margin:0">Tools</span></div>
        <a class="entry-banner" href="#/tools">
          <div class="entry-banner-media">${ph("Tools Hub")}</div>
          <div class="entry-banner-body">
            <h3>AI 平台与工具集合</h3>
            <p>${editable("site.toolsSectionDesc", s.toolsSectionDesc, "span")}</p>
            <span class="card-time">${escapeHtml(s.toolsEntryLabel || "进入工具集合")} →</span>
          </div>
        </a>
      </section>

      <section style="margin-top:2.5rem">
        <div class="section-title"><h2>作品</h2><span class="eyebrow" style="margin:0">Works</span></div>
        <a class="entry-banner" href="#/works">
          <div class="entry-banner-media">${ph("Works")}</div>
          <div class="entry-banner-body">
            <h3>个人作品说明</h3>
            <p>${editable("site.worksSectionDesc", s.worksSectionDesc, "span")}</p>
            <span class="card-time">${escapeHtml(s.worksEntryLabel || "查看作品说明")} →</span>
          </div>
        </a>
      </section>`;
  }

  function renderModule(expId, mod) {
    const base = `experiences.${expId}.modules.${mod.id}`;
    normalizeImages(mod);
    const toolBtn = mod.toolAnchor
      ? `<a class="btn" href="#/tools/${mod.toolAnchor}">查看工具</a>`
      : "";
    const metrics = (mod.metrics || [])
      .map((m, i) => `<span class="metric">${editMode ? editable(`${base}.metrics.${i}`, m) : escapeHtml(m)}</span>`)
      .join("");

    return `
      <article class="module" data-exp="${expId}" data-mod="${mod.id}">
        <div class="module-copy">
          ${editable(`${base}.title`, mod.title, "h3")}
          ${mod.bodyBrief ? `<p class="brief">${editable(`${base}.bodyBrief`, mod.bodyBrief, "span")}</p>` : ""}
          <div class="detail-rich">${formatBody(`${base}.body`, mod.body)}</div>
          ${metrics ? `<div class="metrics">${metrics}</div>` : ""}
          <div class="btn-row">${toolBtn}</div>
          <div class="module-actions">
            <button type="button" class="btn btn-ghost btn-mod-up" data-exp="${expId}" data-mod="${mod.id}">上移</button>
            <button type="button" class="btn btn-ghost btn-mod-down" data-exp="${expId}" data-mod="${mod.id}">下移</button>
            <button type="button" class="btn btn-ghost btn-mod-del" data-exp="${expId}" data-mod="${mod.id}">删除模块</button>
          </div>
        </div>
        <div class="module-media">
          ${renderCarousel("exp-mod", `${expId}.${mod.id}`, mod.images, base)}
        </div>
      </article>`;
  }

  function renderExperience(id) {
    const list = content.experiences;
    const idx = list.findIndex((e) => e.id === id);
    const exp = list[idx] || list[0];
    if (!exp) return `<p>暂无经历</p>`;
    const prev = list[idx - 1];
    const next = list[idx + 1];
    const tags = (exp.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");

    return `
      <p class="eyebrow">Experience</p>
      ${editable(`experiences.${exp.id}.company`, exp.company, "h1")}
      <div class="meta-row">
        ${editable(`experiences.${exp.id}.role`, exp.role, "span")}
        <span>·</span>
        ${editable(`experiences.${exp.id}.period`, exp.period, "span")}
      </div>
      <div class="lead">${editable(`experiences.${exp.id}.oneLiner`, exp.oneLiner, "p")}</div>
      ${
        exp.detailIntro
          ? `<div class="detail-block">${formatBody(`experiences.${exp.id}.detailIntro`, exp.detailIntro)}</div>`
          : ""
      }
      <div class="tags">${tags}</div>
      <div class="module-list">${exp.modules.map((m) => renderModule(exp.id, m)).join("")}</div>
      <div class="add-module-wrap">
        <button type="button" class="btn" id="add-module" data-exp="${exp.id}">＋ 新增产出模块</button>
      </div>
      <div class="page-nav">
        ${prev ? `<a class="btn btn-ghost" href="#/experience/${prev.id}">← ${escapeHtml(prev.company)}</a>` : `<span></span>`}
        ${next ? `<a class="btn btn-ghost" href="#/experience/${next.id}">${escapeHtml(next.company)} →</a>` : `<a class="btn btn-ghost" href="#/tools">工具中心 →</a>`}
      </div>`;
  }

  function renderTools(focusId) {
    if (focusId) activeToolId = focusId;
    if (!content.tools.some((t) => t.id === activeToolId)) activeToolId = content.tools[0]?.id;

    const tabs = content.tools
      .map(
        (t) =>
          `<button type="button" class="tool-tab ${t.id === activeToolId ? "active" : ""}" data-tool="${t.id}">${escapeHtml(t.name)}</button>`
      )
      .join("");

    const panels = content.tools
      .map((t) => {
        normalizeImages(t);
        const caps = (t.capabilities || [])
          .map((c, i) => `<li>${editMode ? editable(`tools.${t.id}.capabilities.${i}`, c) : escapeHtml(c)}</li>`)
          .join("");
        const metrics = (t.metrics || [])
          .map((m, i) => `<span class="metric">${editMode ? editable(`tools.${t.id}.metrics.${i}`, m) : escapeHtml(m)}</span>`)
          .join("");
        const demoBtn = t.demoUrl
          ? `<a class="btn btn-solid" href="${escapeAttr(t.demoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.demoLabel || "打开演示")}</a>`
          : "";
        return `
        <div class="tool-panel ${t.id === activeToolId ? "active" : ""}" id="tool-${t.id}">
          <div class="tool-layout">
            <div>
              ${editable(`tools.${t.id}.name`, t.name, "h2")}
              <p class="meta-row"><a href="#/experience/${t.sourceExp}">来源经历：${escapeHtml(t.sourceLabel)}</a></p>
              <div class="lead">${editable(`tools.${t.id}.oneLiner`, t.oneLiner, "p")}</div>
              <ul class="capability-list">${caps}</ul>
              ${metrics ? `<div class="metrics" style="margin-top:1rem">${metrics}</div>` : ""}
              <p style="margin-top:1rem;color:var(--text-muted);font-size:.9rem">${editable(`tools.${t.id}.demoNote`, t.demoNote, "span")}</p>
              ${
                editMode
                  ? `<label class="edit-field" style="margin-top:.75rem">演示链接 demoUrl
                      <input type="text" data-tool-demo-url data-tool-id="${t.id}" value="${escapeAttr(t.demoUrl || "")}" placeholder="./demos/wefly/index.html" />
                    </label>
                    <label class="edit-field">演示按钮文案
                      <input type="text" data-tool-demo-label data-tool-id="${t.id}" value="${escapeAttr(t.demoLabel || "")}" />
                    </label>`
                  : ""
              }
              <div class="btn-row">
                ${demoBtn}
                <a class="btn btn-ghost" href="#/experience/${t.sourceExp}">查看经历</a>
              </div>
            </div>
            <div class="module-media" style="aspect-ratio:auto;border:none;overflow:visible">
              ${renderCarousel("tool", t.id, t.images, `tools.${t.id}`)}
            </div>
          </div>
        </div>`;
      })
      .join("");

    return `
      <p class="eyebrow">Tools</p>
      <h1>AI 平台与工具</h1>
      <div class="tool-tabs">${tabs}</div>
      ${panels}`;
  }

  function renderWorks() {
    const wp = content.worksPage;
    const blocks = content.works
      .map((w) => {
        normalizeImages(w);
        const base = `works.${w.id}`;
        return `
        <article class="work-block" data-work="${w.id}">
          <div class="work-copy">
            ${editable(`${base}.title`, w.title, "h3")}
            <p class="work-type">${editable(`${base}.type`, w.type, "span")}</p>
            <p class="brief">${editable(`${base}.summary`, w.summary, "span")}</p>
            <div class="detail-rich">${formatBody(`${base}.detail`, w.detail || w.summary)}</div>
            <div class="module-actions">
              <button type="button" class="btn btn-ghost btn-work-del" data-work="${w.id}">删除作品</button>
            </div>
          </div>
          <div class="module-media" style="aspect-ratio:auto;border:none;overflow:visible">
            ${renderCarousel("work", w.id, w.images, base)}
          </div>
        </article>`;
      })
      .join("");

    return `
      <p class="eyebrow">Works</p>
      ${editable("worksPage.title", wp.title, "h1")}
      <div class="lead">${editable("worksPage.intro", wp.intro, "p")}</div>
      <div class="btn-row" style="margin-bottom:2rem">
        <a class="btn btn-solid" href="${escapeAttr(wp.feishuUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(wp.feishuLabel)}</a>
        ${
          editMode
            ? `<label class="edit-field" style="flex:1;min-width:220px">飞书合集链接
                <input type="text" data-feishu-url value="${escapeAttr(wp.feishuUrl)}" />
              </label>`
            : ""
        }
      </div>
      <div class="work-list">${blocks}</div>
      ${editMode ? `<div class="add-module-wrap"><button type="button" class="btn" id="add-work">＋ 新增作品</button></div>` : ""}`;
  }

  function renderEditBar() {
    return `
      <aside class="edit-bar" aria-label="编辑工具条">
        <p>编辑模式 · 自动保存本机</p>
        <div class="save-status" id="save-status"></div>
        <button type="button" class="btn" id="btn-export">导出全局同步包</button>
        <button type="button" class="btn btn-ghost" id="btn-import">导入 JSON</button>
        <button type="button" class="btn btn-ghost" id="btn-reset">恢复默认文案</button>
        <input type="file" id="import-file" accept="application/json,.json" hidden />
      </aside>`;
  }

  function render() {
    const { page, id } = route();
    let main = "";
    if (page === "experience") main = renderExperience(id || "baidu");
    else if (page === "tools") main = renderTools(id);
    else if (page === "works") main = renderWorks();
    else main = renderHome();

    $("#app").innerHTML = `
      <div class="site">
        ${renderHeader()}
        <main class="site-main" id="main">${main}</main>
        <footer class="site-footer">
          ${escapeHtml(content.site.name)} · ${escapeHtml(content.site.email)} · ${escapeHtml(content.site.phone)}
        </footer>
        ${renderEditBar()}
      </div>`;
    document.body.classList.toggle("edit-on", editMode);
    bindEvents();
  }

  function resolveImageOwner(scope, id) {
    if (scope === "tool") {
      const tool = content.tools.find((t) => t.id === id);
      return tool ? normalizeImages(tool) : null;
    }
    if (scope === "work") {
      const work = content.works.find((w) => w.id === id);
      return work ? normalizeImages(work) : null;
    }
    if (scope === "exp-mod") {
      const [expId, modId] = id.split(".");
      const exp = content.experiences.find((e) => e.id === expId);
      const mod = exp?.modules.find((m) => m.id === modId);
      return mod ? normalizeImages(mod) : null;
    }
    return null;
  }

  function setByPath(path, value) {
    const parts = path.split(".");
    if (parts[0] === "site") {
      content.site[parts[1]] = value;
      return;
    }
    if (parts[0] === "worksPage") {
      content.worksPage[parts[1]] = value;
      return;
    }
    if (parts[0] === "experiences") {
      const exp = content.experiences.find((e) => e.id === parts[1]);
      if (!exp) return;
      if (parts[2] === "modules") {
        const mod = exp.modules.find((m) => m.id === parts[3]);
        if (!mod) return;
        if (parts[4] === "metrics") mod.metrics[Number(parts[5])] = value;
        else if (parts[4] === "images") {
          normalizeImages(mod);
          mod.images[Number(parts[5])][parts[6]] = value;
        } else mod[parts[4]] = value;
      } else exp[parts[2]] = value;
      return;
    }
    if (parts[0] === "tools") {
      const tool = content.tools.find((t) => t.id === parts[1]);
      if (!tool) return;
      if (parts[2] === "capabilities" || parts[2] === "metrics") tool[parts[2]][Number(parts[3])] = value;
      else if (parts[2] === "images") {
        normalizeImages(tool);
        tool.images[Number(parts[3])][parts[4]] = value;
      } else tool[parts[2]] = value;
      return;
    }
    if (parts[0] === "works") {
      const work = content.works.find((w) => w.id === parts[1]);
      if (!work) return;
      if (parts[2] === "images") {
        normalizeImages(work);
        work.images[Number(parts[3])][parts[4]] = value;
      } else work[parts[2]] = value;
    }
  }

  function loadImageElement(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("图片解码失败"));
      img.src = src;
    });
  }

  function canvasToDataUrl(canvas, type, quality) {
    return canvas.toDataURL(type, quality);
  }

  async function compressDataUrl(dataUrl) {
    const img = await loadImageElement(dataUrl);
    let { width, height } = img;
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0e0e10";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.82;
    let out = canvasToDataUrl(canvas, "image/jpeg", quality);
    while (out.length > MAX_IMAGE_DATA_CHARS && quality > 0.45) {
      quality -= 0.08;
      out = canvasToDataUrl(canvas, "image/jpeg", quality);
    }
    if (out.length > MAX_IMAGE_DATA_CHARS) {
      const shrink = Math.sqrt(MAX_IMAGE_DATA_CHARS / out.length);
      canvas.width = Math.max(1, Math.round(width * shrink));
      canvas.height = Math.max(1, Math.round(height * shrink));
      const ctx2 = canvas.getContext("2d");
      ctx2.fillStyle = "#0e0e10";
      ctx2.fillRect(0, 0, canvas.width, canvas.height);
      ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
      out = canvasToDataUrl(canvas, "image/jpeg", 0.72);
    }
    return out;
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("请选择图片文件"));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        reject(new Error("单张图片请小于 12MB"));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const raw = String(reader.result || "");
          const compressed = await compressDataUrl(raw);
          resolve(compressed);
        } catch (err) {
          reject(err instanceof Error ? err : new Error("压缩失败"));
        }
      };
      reader.onerror = () => reject(new Error("读取失败"));
      reader.readAsDataURL(file);
    });
  }

  let lightbox = { open: false, src: "", alt: "", link: "", car: null };

  function ensureLightbox() {
    let root = document.getElementById("img-lightbox");
    if (root) return root;
    root = document.createElement("div");
    root.id = "img-lightbox";
    root.className = "img-lightbox";
    root.hidden = true;
    root.innerHTML = `
      <div class="img-lightbox-backdrop" data-lb-close></div>
      <div class="img-lightbox-dialog" role="dialog" aria-modal="true" aria-label="图片放大查看">
        <button type="button" class="img-lightbox-close" data-lb-close aria-label="关闭">×</button>
        <button type="button" class="img-lightbox-nav prev" data-lb-prev aria-label="上一张">‹</button>
        <img class="img-lightbox-img" alt="" data-lb-img />
        <button type="button" class="img-lightbox-nav next" data-lb-next aria-label="下一张">›</button>
        <div class="img-lightbox-meta">
          <p class="img-lightbox-caption" data-lb-caption></p>
          <a class="btn btn-ghost btn-sm" data-lb-link hidden target="_blank" rel="noopener noreferrer">打开链接</a>
        </div>
      </div>`;
    document.body.appendChild(root);

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-lb-close]")) closeLightbox();
      if (e.target.closest("[data-lb-prev]")) stepLightbox(-1);
      if (e.target.closest("[data-lb-next]")) stepLightbox(1);
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.open) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    });
    return root;
  }

  function openLightboxFromCarousel(car) {
    const scope = car.dataset.scope;
    const id = car.dataset.id;
    const owner = resolveImageOwner(scope, id);
    if (!owner) return;
    const i = getSlide(scope, id, owner.images.length);
    const cur = owner.images[i];
    if (!cur?.src) return;
    lightbox = { open: true, src: cur.src, alt: cur.label || "", link: cur.link || "", car };
    const root = ensureLightbox();
    const img = root.querySelector("[data-lb-img]");
    const caption = root.querySelector("[data-lb-caption]");
    const linkEl = root.querySelector("[data-lb-link]");
    img.src = cur.src;
    img.alt = cur.label || "";
    caption.textContent = `${cur.label || "图示"} · ${i + 1} / ${owner.images.length}`;
    if (cur.link) {
      linkEl.hidden = false;
      linkEl.href = cur.link;
    } else {
      linkEl.hidden = true;
      linkEl.removeAttribute("href");
    }
    root.hidden = false;
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    lightbox.open = false;
    const root = document.getElementById("img-lightbox");
    if (root) root.hidden = true;
    document.body.classList.remove("lightbox-open");
  }

  function stepLightbox(dir) {
    const car = lightbox.car;
    if (!car) return;
    const scope = car.dataset.scope;
    const id = car.dataset.id;
    const owner = resolveImageOwner(scope, id);
    if (!owner || owner.images.length <= 1) return;
    const key = getSlideKey(scope, id);
    const len = owner.images.length;
    slideIndex[key] = (getSlide(scope, id, len) + dir + len) % len;
    updateCarouselView(car);
    openLightboxFromCarousel(car);
  }

  function bindCarousel(car) {
    const scope = car.dataset.scope;
    const id = car.dataset.id;
    const owner = resolveImageOwner(scope, id);
    if (!owner) return;
    const key = getSlideKey(scope, id);
    const currentIndex = () => getSlide(scope, id, owner.images.length);

    car.querySelector("[data-carousel-prev]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const len = owner.images.length;
      if (len <= 1) return;
      slideIndex[key] = (currentIndex() - 1 + len) % len;
      updateCarouselView(car);
    });
    car.querySelector("[data-carousel-next]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const len = owner.images.length;
      if (len <= 1) return;
      slideIndex[key] = (currentIndex() + 1) % len;
      updateCarouselView(car);
    });

    car.querySelector("[data-carousel-viewport]")?.addEventListener("click", (e) => {
      if (e.target.closest("[data-carousel-link]")) return;
      const frame = e.target.closest(".carousel-frame.is-zoomable");
      if (!frame) return;
      e.preventDefault();
      openLightboxFromCarousel(car);
    });
    car.querySelector("[data-carousel-viewport]")?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!e.target.closest(".carousel-frame.is-zoomable")) return;
      e.preventDefault();
      openLightboxFromCarousel(car);
    });

    const labelInput = car.querySelector("[data-img-label]");
    const linkInput = car.querySelector("[data-img-link]");
    labelInput?.addEventListener("input", () => {
      owner.images[currentIndex()].label = labelInput.value;
      const phEl = car.querySelector(".carousel-frame .ph, .carousel-frame img");
      if (phEl?.classList?.contains("ph")) phEl.textContent = labelInput.value;
      if (phEl?.tagName === "IMG") {
        phEl.alt = labelInput.value;
        phEl.setAttribute("data-lightbox-alt", labelInput.value);
      }
      scheduleSave();
    });
    linkInput?.addEventListener("input", () => {
      owner.images[currentIndex()].link = linkInput.value.trim();
      scheduleSave();
    });

    const fileInput = car.querySelector("[data-img-file]");
    const dropzone = car.querySelector("[data-dropzone]");
    const applyFile = async (file) => {
      const status = $("#save-status");
      if (status) status.textContent = "压缩并保存中…";
      try {
        owner.images[currentIndex()].src = await readImageFile(file);
        updateCarouselView(car);
        await persist("图片已上传（已自动压缩）");
      } catch (err) {
        alert(err.message || "上传失败");
        if (status) status.textContent = "";
      }
    };

    car.querySelector("[data-img-pick]")?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", () => {
      const f = fileInput.files?.[0];
      if (f) applyFile(f);
    });
    car.querySelector("[data-img-clear-src]")?.addEventListener("click", () => {
      owner.images[currentIndex()].src = "";
      persist("已清除图片");
      updateCarouselView(car);
    });

    if (dropzone) {
      ["dragenter", "dragover"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.add("is-drag");
        });
      });
      ["dragleave", "drop"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.remove("is-drag");
        });
      });
      dropzone.addEventListener("drop", (e) => {
        const f = e.dataTransfer?.files?.[0];
        if (f) applyFile(f);
      });
    }

    car.querySelector("[data-img-add]")?.addEventListener("click", () => {
      owner.images.push({ label: `图示 ${owner.images.length + 1}`, src: "", link: "" });
      slideIndex[key] = owner.images.length - 1;
      persist("已新增一页");
      render();
    });
    car.querySelector("[data-img-del]")?.addEventListener("click", () => {
      if (owner.images.length <= 1) return;
      const i = currentIndex();
      owner.images.splice(i, 1);
      slideIndex[key] = Math.min(i, owner.images.length - 1);
      persist("已删除本页");
      render();
    });
  }

  function bindPlainPaste() {
    if (document.documentElement.dataset.plainPasteBound === "1") return;
    document.documentElement.dataset.plainPasteBound = "1";
    document.addEventListener(
      "paste",
      (event) => {
        const target = event.target?.closest?.(
          '[contenteditable="true"], [contenteditable="plaintext-only"], .editable'
        );
        if (!target || !editMode) return;
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData("text/plain");
        if (text == null) return;
        if (document.queryCommandSupported?.("insertText")) {
          document.execCommand("insertText", false, text);
          return;
        }
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(text));
        selection.collapseToEnd();
      },
      true
    );
  }

  function bindEvents() {
    bindPlainPaste();
    $("#edit-toggle")?.addEventListener("click", () => setEditMode(!editMode));

    $$(".editable").forEach((el) => {
      el.addEventListener("input", () => {
        setByPath(el.dataset.path, el.innerText);
        scheduleSave();
      });
      el.addEventListener("blur", () => {
        setByPath(el.dataset.path, el.innerText);
        persist("已自动保存");
      });
    });

    $$(".tool-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeToolId = btn.dataset.tool;
        navigate(`tools/${activeToolId}`);
      });
    });

    $$(".carousel").forEach(bindCarousel);

    $$("[data-tool-demo-url]").forEach((input) => {
      input.addEventListener("change", () => {
        const tool = content.tools.find((t) => t.id === input.dataset.toolId);
        if (tool) {
          tool.demoUrl = input.value.trim();
          persist("已保存演示链接");
          render();
        }
      });
    });
    $$("[data-tool-demo-label]").forEach((input) => {
      input.addEventListener("input", () => {
        const tool = content.tools.find((t) => t.id === input.dataset.toolId);
        if (tool) {
          tool.demoLabel = input.value;
          scheduleSave();
        }
      });
    });

    $("[data-feishu-url]")?.addEventListener("change", (e) => {
      content.worksPage.feishuUrl = e.target.value.trim();
      persist("已保存飞书链接");
      render();
    });

    $("#add-module")?.addEventListener("click", () => {
      const expId = $("#add-module").dataset.exp;
      const exp = content.experiences.find((e) => e.id === expId);
      if (!exp) return;
      exp.modules.push({
        id: `m${Date.now().toString(36)}`,
        title: "新产出模块",
        bodyBrief: "一句话摘要",
        body: "痛点：\n做法：\n结果：",
        metrics: [],
        toolAnchor: "",
        images: [{ label: "占位图", src: "", link: "" }]
      });
      persist("已新增模块");
      render();
    });

    $$(".btn-mod-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const exp = content.experiences.find((e) => e.id === btn.dataset.exp);
        if (!exp) return;
        exp.modules = exp.modules.filter((m) => m.id !== btn.dataset.mod);
        persist("已删除模块");
        render();
      });
    });
    $$(".btn-mod-up").forEach((btn) => {
      btn.addEventListener("click", () => moveModule(btn.dataset.exp, btn.dataset.mod, -1));
    });
    $$(".btn-mod-down").forEach((btn) => {
      btn.addEventListener("click", () => moveModule(btn.dataset.exp, btn.dataset.mod, 1));
    });

    $$(".btn-work-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        content.works = content.works.filter((w) => w.id !== btn.dataset.work);
        persist("已删除作品");
        render();
      });
    });

    $("#add-work")?.addEventListener("click", () => {
      content.works.push({
        id: `w${Date.now().toString(36)}`,
        title: "新作品",
        type: "类型",
        summary: "一句话简介",
        detail: "在此填写作品说明。",
        images: [{ label: "封面", src: "", link: "" }]
      });
      persist("已新增作品");
      render();
    });

    $("#btn-export")?.addEventListener("click", async () => {
      window.__detailContent = content;
      if (window.__wrzGlobalSync && typeof window.__wrzGlobalSync.exportGlobalSync === "function") {
        await window.__wrzGlobalSync.exportGlobalSync();
        return;
      }
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "portfolio-content.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $("#btn-import")?.addEventListener("click", () => $("#import-file")?.click());
    $("#import-file")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        content = normalizeContent(JSON.parse(await file.text()));
        persist("已导入");
        render();
      } catch {
        alert("JSON 无效");
      }
    });
    $("#btn-reset")?.addEventListener("click", async () => {
      if (!confirm("恢复默认文案？本机修改会清除。")) return;
      content = normalizeContent(window.DEFAULT_CONTENT);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      try {
        await idbDel(STORAGE_KEY);
      } catch (_) {}
      await persist("已恢复默认");
      render();
    });
  }

  function moveModule(expId, modId, dir) {
    const exp = content.experiences.find((e) => e.id === expId);
    if (!exp) return;
    const i = exp.modules.findIndex((m) => m.id === modId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= exp.modules.length) return;
    [exp.modules[i], exp.modules[j]] = [exp.modules[j], exp.modules[i]];
    persist("已调整顺序");
    render();
  }

  window.addEventListener("hashchange", () => {
    if (storageReady) render();
  });

  async function boot() {
    try {
      content = await loadContent();
    } catch (e) {
      console.warn(e);
      content = normalizeContent(window.DEFAULT_CONTENT);
    }
    if (
      content.site &&
      (!content.site.name ||
        content.site.name === "王瑞泽" ||
        (content.site.name.includes("瑞泽") && !/Wang/i.test(content.site.name)))
    ) {
      content.site.name = "Wang Ruize";
    }
    storageReady = true;
    window.__detailContent = content;
    try {
      await persist();
    } catch (_) {}
    if (!location.hash || location.hash === "#/home" || location.hash === "#/") {
      location.hash = "#/experience/baidu";
    } else {
      render();
    }
  }

  boot();
})();
