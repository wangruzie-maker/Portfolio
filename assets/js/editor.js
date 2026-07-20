/**
 * Simple resume editor — text, image upload, and per-item jump links.
 * Empty link = not clickable. Filled URL opens (http(s) → new tab).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "resume-simple-edits-v3";
  const IDB_NAME = "wrz-resume-edits-db";
  const IDB_STORE = "kv";
  const MAX_IMAGE_EDGE = 1200;
  const MAX_IMAGE_DATA_CHARS = 450 * 1024;

  let resolveEditsReady;
  window.__resumeEditsReady = new Promise((resolve) => {
    resolveEditsReady = resolve;
  });

  const TOGGLEABLE_MODULES = [
    { id: "journey", label: "Journey 经历" },
    { id: "tools", label: "Lab 工具" },
    { id: "personal", label: "Personal 个人作品" },
    { id: "work", label: "Work 作品滚动" }
  ];

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

  function compressImageFile(file) {
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
      reader.onerror = () => reject(new Error("读取失败"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("图片解码失败"));
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(w, h));
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#0a0a0b";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          let q = 0.72;
          let out = canvas.toDataURL("image/jpeg", q);
          while (out.length > MAX_IMAGE_DATA_CHARS && q > 0.4) {
            q -= 0.08;
            out = canvas.toDataURL("image/jpeg", q);
          }
          if (out.length > MAX_IMAGE_DATA_CHARS) {
            const shrink = Math.sqrt(MAX_IMAGE_DATA_CHARS / out.length);
            canvas.width = Math.max(1, Math.round(w * shrink));
            canvas.height = Math.max(1, Math.round(h * shrink));
            const ctx2 = canvas.getContext("2d");
            ctx2.fillStyle = "#0a0a0b";
            ctx2.fillRect(0, 0, canvas.width, canvas.height);
            ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
            out = canvas.toDataURL("image/jpeg", 0.65);
          }
          resolve(out);
        };
        img.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  function loadEditsMeta() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function loadEdits() {
    return window.__resumeEdits || loadEditsMeta();
  }

  async function hydrateEditsFromStorage() {
    const edits = loadEditsMeta();
    try {
      const images = await idbGet("images");
      if (images && typeof images === "object") {
        edits.images = { ...(edits.images || {}), ...images };
      } else {
        edits.images = edits.images || {};
      }
      // 迁移：把 localStorage 里的大图挪到 IndexedDB（合并，不覆盖）
      if (Object.keys(edits.images).length) {
        await idbSet("images", edits.images);
        const slim = { ...edits };
        delete slim.images;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      }
    } catch (e) {
      console.warn(e);
      edits.images = edits.images || {};
    }
    window.__resumeEdits = edits;
    return edits;
  }

  async function saveEdits(edits) {
    const next = { ...(edits || {}) };
    // 关键：合并已有图片，避免某次保存缺 images 字段时把 IndexedDB 清空
    let images = next.images && typeof next.images === "object" ? { ...next.images } : null;
    const cached = (window.__resumeEdits && window.__resumeEdits.images) || {};
    try {
      const fromIdb = await idbGet("images");
      const base =
        fromIdb && typeof fromIdb === "object" ? fromIdb : cached;
      images = { ...base, ...(images || {}) };
    } catch {
      images = { ...cached, ...(images || {}) };
    }
    next.images = images;
    window.__resumeEdits = { ...next, images };
    try {
      await idbSet("images", images);
      const slim = { ...next };
      delete slim.images;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch (e) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e2) {
        throw e2;
      }
    }
  }

  function applyEdits() {
    const edits = loadEdits();
    window.__resumeEdits = edits;

    if (edits.site && window.siteConfig) {
      const savedSlots = edits.site.slots;
      const { slots: _dropSlots, ...siteRest } = edits.site;
      Object.assign(window.siteConfig, siteRest);
      // 深合并 slot，避免本地文案编辑冲掉 coverUrl
      if (savedSlots && typeof savedSlots === "object") {
        window.siteConfig.slots = window.siteConfig.slots || {};
        Object.keys(savedSlots).forEach((slotId) => {
          window.siteConfig.slots[slotId] = {
            ...(window.siteConfig.slots[slotId] || {}),
            ...(savedSlots[slotId] || {})
          };
        });
      }
      if (!window.siteConfig.name || window.siteConfig.name === "王瑞泽") {
        window.siteConfig.name = "Wang Ruize";
      }
      if (!window.siteConfig.nameFirst || window.siteConfig.nameFirst === "Wang Ruize") {
        window.siteConfig.nameFirst = "王瑞泽";
      }
    }

    if (Array.isArray(edits.addedWorks) && Array.isArray(window.portfolioWorks)) {
      edits.addedWorks.forEach((work) => {
        if (!work || !work.id) return;
        if (!window.portfolioWorks.some((item) => item.id === work.id)) {
          window.portfolioWorks.push(work);
        }
      });
    }

    if (edits.works && Array.isArray(window.portfolioWorks)) {
      window.portfolioWorks = window.portfolioWorks.map((work) => {
        const patch = edits.works[work.id];
        return patch ? { ...work, ...patch } : work;
      });
    }

    if (Array.isArray(edits.experienceIds) && Array.isArray(window.resumeTracks)) {
      const track = window.resumeTracks.find((item) => item.id === "experience");
      if (track) track.itemIds = edits.experienceIds.slice();
    }
  }

  function getExperienceTrack() {
    return (window.resumeTracks || []).find((item) => item.id === "experience") || null;
  }

  function syncExperienceIds(edits) {
    const track = getExperienceTrack();
    if (!track) return;
    edits.experienceIds = (track.itemIds || []).slice();
  }

  function isPublicSite() {
    return !!window.__WRZ_PUBLIC__;
  }

  function wantEditMode() {
    if (isPublicSite()) return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "1") return true;
    if (params.get("edit") === "0") return false;
    return sessionStorage.getItem("resume-edit-mode") === "1";
  }

  function bindPlainPaste() {
    if (document.documentElement.dataset.plainPasteBound === "1") return;
    document.documentElement.dataset.plainPasteBound = "1";
    document.addEventListener(
      "paste",
      (event) => {
        const target = event.target && event.target.closest
          ? event.target.closest('[contenteditable="true"], [contenteditable="plaintext-only"]')
          : null;
        if (!target || !document.body.classList.contains("is-editing")) return;
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData("text/plain");
        if (text == null) return;
        if (document.queryCommandSupported && document.queryCommandSupported("insertText")) {
          document.execCommand("insertText", false, text);
          return;
        }
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(text));
        selection.collapseToEnd();
      },
      true
    );
  }

  function mountChrome() {
    if (isPublicSite()) return;
    if (document.querySelector("[data-edit-root]")) return;

    bindPlainPaste();

    const root = document.createElement("div");
    root.className = "edit-chrome";
    root.setAttribute("data-edit-root", "");
    root.innerHTML = `
      <div class="edit-panel" data-edit-panel hidden>
        <p class="edit-hint">编辑：改文字 · 上传图片 · 填链接 · 增减模块 · 自动保存在本机</p>
        <div class="edit-module-list" data-module-toggles></div>
        <button type="button" class="edit-fab edit-export" data-edit-export>导出全局同步包</button>
      </div>
      <button type="button" class="edit-fab" data-edit-toggle aria-pressed="false">编辑内容</button>
      <button type="button" class="edit-fab" data-edit-export-fab>导出全局同步包</button>
      <button type="button" class="edit-fab" data-edit-reset hidden>清空本地修改</button>
    `;
    document.body.appendChild(root);

    const toggles = root.querySelector("[data-module-toggles]");
    toggles.innerHTML = TOGGLEABLE_MODULES.map((mod) => `
      <label class="edit-module-item">
        <input type="checkbox" data-module-toggle="${mod.id}" checked>
        <span>${mod.label}</span>
      </label>
    `).join("");

    root.querySelector("[data-edit-toggle]").addEventListener("click", () => {
      setEditMode(!document.body.classList.contains("is-editing"));
    });
    const runExport = () => exportSyncPack();
    root.querySelector("[data-edit-export]").addEventListener("click", runExport);
    root.querySelector("[data-edit-export-fab]").addEventListener("click", runExport);
    root.querySelector("[data-edit-reset]").addEventListener("click", async () => {
      if (!confirm("清空本机保存的文案、图片、模块与卡片修改？")) return;
      localStorage.removeItem(STORAGE_KEY);
      try {
        await idbSet("images", {});
      } catch (_) {}
      window.location.reload();
    });

    toggles.addEventListener("change", (event) => {
      const input = event.target.closest("[data-module-toggle]");
      if (!input) return;
      const id = input.getAttribute("data-module-toggle");
      const edits = loadEdits();
      edits.site = edits.site || {};
      const hidden = new Set(Array.isArray(edits.site.hiddenModules) ? edits.site.hiddenModules : []);
      if (input.checked) hidden.delete(id);
      else hidden.add(id);
      edits.site.hiddenModules = Array.from(hidden);
      if (window.siteConfig) window.siteConfig.hiddenModules = edits.site.hiddenModules;
      saveEdits(edits);
      if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
    });
  }

  function syncModuleToggles() {
    const hidden = new Set(
      Array.isArray(window.siteConfig && window.siteConfig.hiddenModules)
        ? window.siteConfig.hiddenModules
        : []
    );
    document.querySelectorAll("[data-module-toggle]").forEach((input) => {
      const id = input.getAttribute("data-module-toggle");
      input.checked = !hidden.has(id);
    });
  }

  function setEditMode(on) {
    if (isPublicSite()) on = false;
    sessionStorage.setItem("resume-edit-mode", on ? "1" : "0");
    document.body.classList.toggle("is-editing", on);
    const toggle = document.querySelector("[data-edit-toggle]");
    const panel = document.querySelector("[data-edit-panel]");
    const reset = document.querySelector("[data-edit-reset]");
    const caseBar = document.querySelector("[data-case-edit-bar]");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = on ? "完成编辑" : "编辑内容";
      toggle.classList.toggle("is-on", on);
    }
    if (panel) panel.hidden = !on;
    if (reset) reset.hidden = !on;
    if (caseBar) caseBar.hidden = !on;
    syncModuleToggles();
    setupTextEditing(on);
    setupKeywordEditing(on);
    setupImageUploads(on);
    setupLinkEditing(on);
    setupCaseControls(on);
    setupInternshipControls(on);
  }

  async function exportSyncPack() {
    if (window.__wrzGlobalSync && typeof window.__wrzGlobalSync.exportGlobalSync === "function") {
      await window.__wrzGlobalSync.exportGlobalSync();
      return;
    }
    // fallback: homepage-only
    let edits = loadEdits();
    try {
      edits = await hydrateEditsFromStorage();
    } catch (_) {}
    applyEdits();
    const pack = {
      version: 1,
      exportedAt: new Date().toISOString(),
      site: window.siteConfig || {},
      works: (window.portfolioWorks || []).map((w) => ({ ...w })),
      edits: {
        site: edits.site || {},
        works: edits.works || {},
        addedWorks: edits.addedWorks || [],
        experienceIds: edits.experienceIds || null,
        images: edits.images || {}
      }
    };
    const blob = new Blob([JSON.stringify(pack)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wang-portfolio-browser-sync.json";
    a.click();
    URL.revokeObjectURL(a.href);
    alert("已下载同步包（仅首页）。请确保已加载 global-sync.js 以导出子页。");
  }

  function setPlainEditable(node, on) {
    if (on) node.setAttribute("contenteditable", "plaintext-only");
    else node.removeAttribute("contenteditable");
  }

  function setupKeywordEditing(on) {
    document.querySelectorAll("[data-edit-keyword]").forEach((node) => {
      setPlainEditable(node, on);
      if (!on) return;
      if (node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("click", (event) => {
        if (document.body.classList.contains("is-editing")) event.stopPropagation();
      });
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          node.blur();
        }
      });
      node.addEventListener("blur", () => {
        const index = Number(node.getAttribute("data-edit-keyword"));
        const field = node.getAttribute("data-edit-field") || "text";
        if (!Number.isInteger(index) || index < 0) return;
        const value = node.textContent.trim();
        const edits = loadEdits();
        edits.site = edits.site || {};
        const keywords = Array.isArray(edits.site.heroKeywords)
          ? edits.site.heroKeywords.slice()
          : Array.isArray(window.siteConfig && window.siteConfig.heroKeywords)
            ? window.siteConfig.heroKeywords.map((item) => ({ ...item }))
            : [];
        if (!keywords[index]) keywords[index] = { year: "", text: "" };
        keywords[index] = { ...keywords[index], [field]: value };
        edits.site.heroKeywords = keywords;
        if (window.siteConfig) window.siteConfig.heroKeywords = keywords;
        saveEdits(edits);
      });
    });
  }

  function pathSet(obj, path, value) {
    const parts = path.split(".");
    let cursor = obj;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
      cursor = cursor[key];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  function setupTextEditing(on) {
    document.querySelectorAll("[data-edit-text]").forEach((node) => {
      setPlainEditable(node, on);
      if (!on) return;
      if (node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", async () => {
        const key = node.getAttribute("data-edit-text");
        if (!key) return;
        const edits = loadEdits();
        edits.site = edits.site || {};
        edits.images = edits.images || (window.__resumeEdits && window.__resumeEdits.images) || {};
        if (key.startsWith("slot.")) {
          const [, slotId, field] = key.split(".");
          edits.site.slots = edits.site.slots || {};
          const prev = {
            ...((window.siteConfig && window.siteConfig.slots && window.siteConfig.slots[slotId]) || {}),
            ...(edits.site.slots[slotId] || {})
          };
          edits.site.slots[slotId] = { ...prev, [field]: node.textContent.trim() };
        } else {
          pathSet(edits.site, key, node.textContent.trim());
        }
        try {
          await saveEdits(edits);
        } catch (err) {
          console.warn(err);
        }
        if (window.siteConfig) {
          if (key.startsWith("slot.")) {
            const [, slotId, field] = key.split(".");
            window.siteConfig.slots = window.siteConfig.slots || {};
            window.siteConfig.slots[slotId] = {
              ...(window.siteConfig.slots[slotId] || {}),
              [field]: node.textContent.trim()
            };
          } else {
            pathSet(window.siteConfig, key, node.textContent.trim());
          }
        }
        document.querySelectorAll(`[data-site-name]`).forEach((el) => {
          if (key === "name" && el !== node) el.textContent = node.textContent.trim();
        });
      });
    });

    document.querySelectorAll("[data-edit-work]").forEach((node) => {
      setPlainEditable(node, on);
      if (!on) return;
      if (node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", async () => {
        const id = node.getAttribute("data-edit-work");
        const field = node.getAttribute("data-edit-field") || "titleCn";
        if (!id) return;
        const edits = loadEdits();
        edits.works = edits.works || {};
        edits.images = edits.images || (window.__resumeEdits && window.__resumeEdits.images) || {};
        edits.works[id] = { ...(edits.works[id] || {}), [field]: node.textContent.trim() };
        try {
          await saveEdits(edits);
        } catch (err) {
          console.warn(err);
        }
        const work = (window.portfolioWorks || []).find((item) => item.id === id);
        if (work) work[field] = node.textContent.trim();
      });
      node.addEventListener("click", (event) => {
        if (document.body.classList.contains("is-editing")) event.preventDefault();
      });
    });
  }

  function setupLinkEditing(on) {
    document.querySelectorAll("[data-edit-link]").forEach((input) => {
      input.disabled = !on;
      if (!on) return;
      if (input.dataset.editBound === "1") return;
      input.dataset.editBound = "1";

      const persist = () => {
        const id = input.getAttribute("data-edit-link");
        if (!id) return;
        const value = input.value.trim();
        const edits = loadEdits();
        edits.works = edits.works || {};
        edits.works[id] = { ...(edits.works[id] || {}), externalUrl: value };
        saveEdits(edits);
        const work = (window.portfolioWorks || []).find((item) => item.id === id);
        if (work) work.externalUrl = value;
      };

      input.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      input.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
        }
      });
      input.addEventListener("blur", () => {
        persist();
        if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
      });
    });
  }

  let pendingImageTarget = null;

  function setupImageUploads(on) {
    const input = document.querySelector("[data-file-input]");
    if (!input) return;

    document.querySelectorAll("[data-image-upload]").forEach((btn) => {
      btn.hidden = !on;
      if (!on || btn.dataset.editBound === "1") return;
      btn.dataset.editBound = "1";
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const workId = btn.getAttribute("data-work-image");
        const slot = btn.closest("[data-image-slot]");
        pendingImageTarget = workId
          ? { kind: "work", id: workId }
          : { kind: "slot", id: slot ? slot.getAttribute("data-image-slot") : null };
        if (!pendingImageTarget.id) return;
        input.value = "";
        input.click();
      });
    });

    // Lab / Personal 封面区：编辑模式下点媒体区也可换图
    document.querySelectorAll('[data-image-slot="tools-hub"], [data-image-slot="personal-works"]').forEach((slot) => {
      if (!on || slot.dataset.editBound === "1") return;
      slot.dataset.editBound = "1";
      slot.addEventListener("click", (event) => {
        if (!document.body.classList.contains("is-editing")) return;
        if (event.target.closest("a, [contenteditable], input, button")) return;
        event.preventDefault();
        event.stopPropagation();
        pendingImageTarget = { kind: "slot", id: slot.getAttribute("data-image-slot") };
        if (!pendingImageTarget.id) return;
        input.value = "";
        input.click();
      });
    });

    if (input.dataset.editBound === "1") return;
    input.dataset.editBound = "1";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file || !pendingImageTarget) return;
      let dataUrl;
      try {
        dataUrl = await compressImageFile(file);
      } catch (err) {
        alert(err.message || "上传失败");
        return;
      }
      const edits = loadEdits();
      edits.images = edits.images || {};
      const key =
        pendingImageTarget.kind === "work"
          ? `work:${pendingImageTarget.id}`
          : pendingImageTarget.id;
      edits.images[key] = dataUrl;
      // 同步写到 works，预览模式不依赖 images map 也能显示
      if (pendingImageTarget.kind === "work") {
        const workId = pendingImageTarget.id;
        edits.works = edits.works || {};
        edits.works[workId] = {
          ...(edits.works[workId] || {}),
          journeyCoverUrl: dataUrl,
          coverUrl: dataUrl
        };
        const work = (window.portfolioWorks || []).find((item) => item.id === workId);
        if (work) {
          work.journeyCoverUrl = dataUrl;
          work.coverUrl = dataUrl;
        }
      }
      // 同步写回 slot.coverUrl 标记，避免下次 hydrate 丢图
      if (pendingImageTarget.kind === "slot" && window.siteConfig) {
        edits.site = edits.site || {};
        edits.site.slots = edits.site.slots || {};
        const slotId = pendingImageTarget.id;
        edits.site.slots[slotId] = {
          ...(window.siteConfig.slots && window.siteConfig.slots[slotId]),
          ...(edits.site.slots[slotId] || {}),
          coverUrl: dataUrl
        };
        window.siteConfig.slots = window.siteConfig.slots || {};
        window.siteConfig.slots[slotId] = {
          ...(window.siteConfig.slots[slotId] || {}),
          coverUrl: dataUrl
        };
      }
      try {
        await saveEdits(edits);
      } catch {
        alert("图片过大，无法写入本机存储。请换一张更小的图再试。");
        return;
      }
      const wasHero = pendingImageTarget.kind === "slot" && pendingImageTarget.id === "hero-portrait";
      pendingImageTarget = null;
      if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
      else window.location.reload();
      if (wasHero && window.__heroPortrait) window.__heroPortrait.rebuild();
    });
  }

  function setupInternshipControls(on) {
    const bar = document.querySelector("[data-journey-edit-bar]");
    if (bar) bar.hidden = !on;

    document.querySelectorAll("[data-remove-internship]").forEach((btn) => {
      btn.hidden = !on;
      if (!on || btn.dataset.editBound === "1") return;
      btn.dataset.editBound = "1";
      btn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const id = btn.getAttribute("data-remove-internship");
        if (!id || !confirm("从实习列表移除这一段？")) return;
        const track = getExperienceTrack();
        if (track) track.itemIds = (track.itemIds || []).filter((item) => item !== id);
        const edits = loadEdits();
        edits.works = edits.works || {};
        edits.works[id] = { ...(edits.works[id] || {}), hidden: true };
        syncExperienceIds(edits);
        await saveEdits(edits);
        const work = (window.portfolioWorks || []).find((item) => item.id === id);
        if (work) work.hidden = true;
        if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
        else window.location.reload();
      });
    });

    const addBtn = document.querySelector("[data-add-internship]");
    if (!addBtn) return;
    addBtn.hidden = !on;
    if (!on || addBtn.dataset.editBound === "1") return;
    addBtn.dataset.editBound = "1";
    addBtn.addEventListener("click", async () => {
      const id = `exp-custom-${Date.now()}`;
      const work = {
        id,
        order: 50 + (window.portfolioWorks || []).length,
        title: "New Internship",
        titleCn: "新实习经历 · 岗位",
        year: new Date().getFullYear(),
        category: "APP",
        categoryCn: "实习",
        type: "text",
        format: "Experience",
        coverUrl: "",
        externalUrl: "",
        timelineSubTag: "YYYY.MM-YYYY.MM",
        tags: [],
        summaryCn: "在此填写实习职责与结果（可直接粘贴简历原文）。",
        accent: "lime"
      };
      const track = getExperienceTrack();
      if (track) {
        track.itemIds = Array.isArray(track.itemIds) ? track.itemIds : [];
        track.itemIds.push(id);
      }
      const edits = loadEdits();
      edits.addedWorks = Array.isArray(edits.addedWorks) ? edits.addedWorks : [];
      edits.addedWorks.push(work);
      syncExperienceIds(edits);
      await saveEdits(edits);
      if (Array.isArray(window.portfolioWorks)) window.portfolioWorks.push(work);
      if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
      else window.location.reload();
    });
  }

  function setupCaseControls(on) {
    document.querySelectorAll("[data-remove-case]").forEach((btn) => {
      btn.hidden = !on;
      if (!on || btn.dataset.editBound === "1") return;
      btn.dataset.editBound = "1";
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const id = btn.getAttribute("data-remove-case");
        if (!id || !confirm("从作品滚动区移除这张卡片？")) return;
        const edits = loadEdits();
        edits.works = edits.works || {};
        edits.works[id] = { ...(edits.works[id] || {}), featured: false, hidden: true };
        saveEdits(edits);
        const work = (window.portfolioWorks || []).find((item) => item.id === id);
        if (work) {
          work.featured = false;
          work.hidden = true;
        }
        if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
        else window.location.reload();
      });
    });

    const addBtn = document.querySelector("[data-add-case]");
    if (!addBtn) return;
    addBtn.hidden = !on;
    if (!on || addBtn.dataset.editBound === "1") return;
    addBtn.dataset.editBound = "1";
    addBtn.addEventListener("click", () => {
      const id = `proj-custom-${Date.now()}`;
      const work = {
        id,
        order: 900 + (window.portfolioWorks || []).length,
        title: "New Case",
        titleCn: "新项目卡片",
        year: new Date().getFullYear(),
        category: "Vibe Coding",
        categoryCn: "作品",
        type: "text",
        format: "Project",
        coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
        externalUrl: "",
        timelineSubTag: "可编辑",
        tags: ["New"],
        summaryCn: "在编辑模式下直接改标题与描述，并可选填子页面链接。",
        accent: "cyan",
        featured: true
      };
      const edits = loadEdits();
      edits.addedWorks = Array.isArray(edits.addedWorks) ? edits.addedWorks : [];
      edits.addedWorks.push(work);
      saveEdits(edits);
      if (Array.isArray(window.portfolioWorks)) window.portfolioWorks.push(work);
      if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
      else window.location.reload();
    });
  }

  function refresh() {
    if (document.body.classList.contains("is-editing")) {
      setupTextEditing(true);
      setupKeywordEditing(true);
      setupImageUploads(true);
      setupLinkEditing(true);
      setupCaseControls(true);
      setupInternshipControls(true);
      syncModuleToggles();
    }
  }

  mountChrome();

  window.__resumeEditor = { refresh, setEditMode, loadEdits };

  async function boot() {
    try {
      await hydrateEditsFromStorage();
    } catch (e) {
      console.warn(e);
      window.__resumeEdits = window.__resumeEdits || loadEditsMeta();
      window.__resumeEdits.images = window.__resumeEdits.images || {};
    }
    applyEdits();
    setEditMode(wantEditMode());
    if (typeof resolveEditsReady === "function") resolveEditsReady(window.__resumeEdits);
    if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
    requestAnimationFrame(() => {
      if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
      refresh();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
