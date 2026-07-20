/**
 * Simple resume editor — text, image upload, and per-item jump links.
 * Empty link = not clickable. Filled URL opens (http(s) → new tab).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "resume-simple-edits-v3";
  const MAX_IMAGE_BYTES = 900 * 1024;
  const TOGGLEABLE_MODULES = [
    { id: "journey", label: "Journey 经历" },
    { id: "work", label: "Work 作品滚动" }
  ];

  function loadEdits() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function saveEdits(edits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
    window.__resumeEdits = edits;
  }

  function applyEdits() {
    const edits = loadEdits();
    window.__resumeEdits = edits;

    if (edits.site && window.siteConfig) {
      Object.assign(window.siteConfig, edits.site);
      if (edits.site.slots && window.siteConfig.slots) {
        window.siteConfig.slots = { ...window.siteConfig.slots, ...edits.site.slots };
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
  }

  function wantEditMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "1") return true;
    if (params.get("edit") === "0") return false;
    return sessionStorage.getItem("resume-edit-mode") === "1";
  }

  function mountChrome() {
    if (document.querySelector("[data-edit-root]")) return;

    const root = document.createElement("div");
    root.className = "edit-chrome";
    root.setAttribute("data-edit-root", "");
    root.innerHTML = `
      <div class="edit-panel" data-edit-panel hidden>
        <p class="edit-hint">编辑：改文字 · 上传图片 · 填链接 · 增减模块 · 自动保存在本机</p>
        <div class="edit-module-list" data-module-toggles></div>
      </div>
      <button type="button" class="edit-fab" data-edit-toggle aria-pressed="false">编辑内容</button>
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
    root.querySelector("[data-edit-reset]").addEventListener("click", () => {
      if (!confirm("清空本机保存的文案、图片、模块与卡片修改？")) return;
      localStorage.removeItem(STORAGE_KEY);
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
  }

  function setupKeywordEditing(on) {
    document.querySelectorAll("[data-edit-keyword]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
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
      node.contentEditable = on ? "true" : "false";
      if (!on) return;
      if (node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const key = node.getAttribute("data-edit-text");
        if (!key) return;
        const edits = loadEdits();
        edits.site = edits.site || {};
        if (key.startsWith("slot.")) {
          const [, slotId, field] = key.split(".");
          edits.site.slots = edits.site.slots || {};
          edits.site.slots[slotId] = { ...(edits.site.slots[slotId] || {}), [field]: node.textContent.trim() };
        } else {
          pathSet(edits.site, key, node.textContent.trim());
        }
        saveEdits(edits);
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
      node.contentEditable = on ? "true" : "false";
      if (!on) return;
      if (node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const id = node.getAttribute("data-edit-work");
        const field = node.getAttribute("data-edit-field") || "titleCn";
        if (!id) return;
        const edits = loadEdits();
        edits.works = edits.works || {};
        edits.works[id] = { ...(edits.works[id] || {}), [field]: node.textContent.trim() };
        saveEdits(edits);
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

    if (input.dataset.editBound === "1") return;
    input.dataset.editBound = "1";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file || !pendingImageTarget) return;
      if (!file.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        alert("图片请控制在约 900KB 以内（本机存储限制）");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const edits = loadEdits();
        edits.images = edits.images || {};
        const key =
          pendingImageTarget.kind === "work"
            ? `work:${pendingImageTarget.id}`
            : pendingImageTarget.id;
        edits.images[key] = dataUrl;
        try {
          saveEdits(edits);
        } catch {
          alert("图片过大，无法写入本机存储。请压缩后再试。");
          return;
        }
        const wasHero = pendingImageTarget.kind === "slot" && pendingImageTarget.id === "hero-portrait";
        pendingImageTarget = null;
        if (typeof window.__resumeHydrate === "function") window.__resumeHydrate();
        else window.location.reload();
        if (wasHero && window.__heroPortrait) window.__heroPortrait.rebuild();
      };
      reader.readAsDataURL(file);
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
      syncModuleToggles();
    }
  }

  applyEdits();
  mountChrome();

  window.__resumeEditor = { refresh, setEditMode, loadEdits };

  function boot() {
    setEditMode(wantEditMode());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
