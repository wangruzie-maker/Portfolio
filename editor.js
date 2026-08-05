/**
 * Resume editor — 承接 Portfolio GitHub 版能力：
 * 文案 contentEditable · 本机 localStorage · 密码解锁后才显示编辑入口
 * 解锁：Cmd/Ctrl+Shift+E，或连点左上角品牌 5 次，输入密码
 */
(function () {
  "use strict";

  const STORAGE_KEY = "ivory-portfolio-edits-v1";
  const AUTH_KEY = "ivory-edit-auth";
  const EDIT_PASS = "020410";
  const TOGGLEABLE = [
    { id: "journey", label: "Journey 经历" },
    { id: "lab", label: "Lab 工具" },
    { id: "work", label: "Work 作品" },
  ];

  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }

  function setAuthed(on) {
    if (on) sessionStorage.setItem(AUTH_KEY, "1");
    else sessionStorage.removeItem(AUTH_KEY);
    syncAuthUI();
  }

  function syncAuthUI() {
    const ok = isAuthed();
    document.body.classList.toggle("is-edit-authed", ok);
    const root = document.querySelector("[data-edit-root]");
    const topBtn = document.querySelector("#editBtn");
    if (root) root.hidden = !ok;
    if (topBtn) topBtn.hidden = !ok;
    if (!ok && document.body.classList.contains("is-editing")) {
      setEditMode(false);
    }
  }

  function askPassword() {
    const input = window.prompt("请输入编辑密码");
    if (input === null) return false;
    if (String(input).trim() === EDIT_PASS) {
      setAuthed(true);
      return true;
    }
    window.alert("密码不正确");
    return false;
  }

  function requireAuth() {
    if (isAuthed()) return true;
    return askPassword();
  }

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

  function applyEditsToContent() {
    const edits = loadEdits();
    window.__resumeEdits = edits;
    const C = window.DEFAULT_CONTENT;
    if (!C) return;

    if (edits.site) {
      C.site = { ...(C.site || {}), ...edits.site };
      if (Array.isArray(edits.site.heroKeywords)) C.heroKeywords = edits.site.heroKeywords;
      if (Array.isArray(edits.site.tags)) C.tags = edits.site.tags;
      if (Array.isArray(edits.site.hiddenModules)) C.site.hiddenModules = edits.site.hiddenModules;
    }
    if (edits.education && C.education) {
      C.education = C.education.map((e) => ({ ...e, ...(edits.education[e.id] || {}) }));
    }
    if (edits.works && C.works) {
      C.works = C.works.map((w) => ({ ...w, ...(edits.works[w.id] || {}) }));
    }
    if (edits.experiences && C.experiences) {
      C.experiences = C.experiences.map((exp) => {
        const patch = edits.experiences[exp.id];
        if (!patch) return exp;
        const { modules: modPatch, ...rest } = patch;
        return {
          ...exp,
          ...rest,
          modules: (exp.modules || []).map((m) => ({
            ...m,
            ...((modPatch && modPatch[m.id]) || {}),
          })),
        };
      });
    }
    if (edits.tools && C.tools) {
      C.tools = C.tools.map((t) => ({ ...t, ...(edits.tools[t.id] || {}) }));
    }
  }

  function exportSyncPack() {
    const edits = loadEdits();
    applyEditsToContent();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      note: "把此文件发给开发者合并进 content.js，或自行替换仓库后推送，访客才能看到。仅本机编辑不会同步到 Netlify/GitHub Pages。",
      edits,
      content: window.DEFAULT_CONTENT,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-edits-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    window.alert("已下载同步包。注意：页面上改的字默认只存在你这台设备；要让别人看到，需把同步包合并进仓库并重新部署。");
  }

  function wantEditMode() {
    if (!isAuthed()) return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "1") return true;
    if (params.get("edit") === "0") return false;
    return sessionStorage.getItem("ivory-edit-mode") === "1";
  }

  function mountChrome() {
    if (document.querySelector("[data-edit-root]")) return;
    const root = document.createElement("div");
    root.className = "edit-chrome";
    root.setAttribute("data-edit-root", "");
    root.hidden = !isAuthed();
    root.innerHTML = `
      <div class="edit-panel" data-edit-panel hidden>
        <p class="edit-hint">可改首页 / Journey 详情 / Lab / 作品等文案，保存在本机。<b>别人打开网站看不到你的本机修改</b>——需点「导出同步包」后提交仓库重新部署。</p>
        <div class="edit-module-list" data-module-toggles></div>
      </div>
      <button type="button" class="edit-fab" data-edit-toggle aria-pressed="false">编辑内容</button>
      <button type="button" class="edit-fab" data-edit-export hidden style="background:var(--gold);border-color:var(--gold);color:var(--ivory)">导出同步包</button>
      <button type="button" class="edit-fab" data-edit-reset hidden style="background:transparent;color:var(--jade)">清空本地修改</button>
      <button type="button" class="edit-fab" data-edit-lock hidden style="background:transparent;color:var(--ink-3)">锁定编辑</button>
    `;
    document.body.appendChild(root);

    const toggles = root.querySelector("[data-module-toggles]");
    toggles.innerHTML = TOGGLEABLE.map((mod) => `
      <label class="edit-module-item">
        <input type="checkbox" data-module-toggle="${mod.id}" checked>
        <span>${mod.label}</span>
      </label>
    `).join("");

    root.querySelector("[data-edit-toggle]").addEventListener("click", () => {
      if (!requireAuth()) return;
      setEditMode(!document.body.classList.contains("is-editing"));
    });
    root.querySelector("[data-edit-export]").addEventListener("click", () => {
      if (!requireAuth()) return;
      exportSyncPack();
    });
    root.querySelector("[data-edit-reset]").addEventListener("click", () => {
      if (!requireAuth()) return;
      if (!confirm("清空本机保存的文案修改？")) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    root.querySelector("[data-edit-lock]").addEventListener("click", () => {
      setEditMode(false);
      setAuthed(false);
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
      if (window.DEFAULT_CONTENT?.site) {
        window.DEFAULT_CONTENT.site.hiddenModules = edits.site.hiddenModules;
      }
      saveEdits(edits);
      applyHiddenModules();
    });
  }

  function applyHiddenModules() {
    const hidden = new Set(
      Array.isArray(window.DEFAULT_CONTENT?.site?.hiddenModules)
        ? window.DEFAULT_CONTENT.site.hiddenModules
        : []
    );
    ["journey", "lab", "work"].forEach((id) => {
      const pane = document.querySelector(`#pane-${id}`);
      const nav = document.querySelector(`.rail__item[data-go="${id}"]`);
      const on = !hidden.has(id);
      if (pane) pane.style.display = on ? "" : "none";
      if (nav) nav.style.display = on ? "" : "none";
    });
    document.querySelectorAll("[data-module-toggle]").forEach((input) => {
      input.checked = !hidden.has(input.getAttribute("data-module-toggle"));
    });
  }

  function setEditMode(on) {
    if (on && !isAuthed()) return;
    sessionStorage.setItem("ivory-edit-mode", on ? "1" : "0");
    document.body.classList.toggle("is-editing", on);
    const toggle = document.querySelector("[data-edit-toggle]");
    const panel = document.querySelector("[data-edit-panel]");
    const reset = document.querySelector("[data-edit-reset]");
    const lock = document.querySelector("[data-edit-lock]");
    const expBtn = document.querySelector("[data-edit-export]");
    const topBtn = document.querySelector("#editBtn");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = on ? "完成编辑" : "编辑内容";
      toggle.classList.toggle("is-on", on);
    }
    if (topBtn) {
      topBtn.hidden = !isAuthed();
      topBtn.textContent = on ? "完成" : "编辑";
      topBtn.classList.toggle("is-on", on);
    }
    if (panel) panel.hidden = !on;
    if (reset) reset.hidden = !on;
    if (lock) lock.hidden = !isAuthed();
    if (expBtn) expBtn.hidden = !isAuthed();
    bindEditing(on);
  }

  function bindUnlockGestures() {
    document.addEventListener("keydown", (event) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
      if (event.key.toLowerCase() !== "e") return;
      event.preventDefault();
      if (!requireAuth()) return;
      setEditMode(true);
    });

    let brandClicks = 0;
    let brandTimer = null;
    document.addEventListener("click", (event) => {
      const brand = event.target.closest(".brand");
      if (!brand) return;
      brandClicks += 1;
      clearTimeout(brandTimer);
      brandTimer = setTimeout(() => { brandClicks = 0; }, 1200);
      if (brandClicks < 5) return;
      brandClicks = 0;
      if (!requireAuth()) return;
      setEditMode(true);
    });

    // ?edit=1 也需先过密码
    const params = new URLSearchParams(window.location.search);
    if (params.get("edit") === "1" && !isAuthed()) {
      if (requireAuth()) setEditMode(true);
    }
  }

  function bindEditing(on) {
    document.querySelectorAll("[data-edit-text]").forEach((node) => {
      const key = node.getAttribute("data-edit-text");
      if (key && key.startsWith("tag:")) {
        node.contentEditable = "false";
        return;
      }
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const k = node.getAttribute("data-edit-text");
        if (!k || k.startsWith("tag:")) return;
        const edits = loadEdits();
        edits.site = edits.site || {};
        pathSet(edits.site, k, node.textContent.trim());
        if (window.DEFAULT_CONTENT?.site) pathSet(window.DEFAULT_CONTENT.site, k, node.textContent.trim());
        // also mirror top-level fields used by render
        if (k === "leadShort" || k === "lead") {
          window.DEFAULT_CONTENT.site[k] = node.textContent.trim();
        }
        saveEdits(edits);
      });
    });

    document.querySelectorAll("[data-edit-keyword]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const index = Number(node.getAttribute("data-edit-keyword"));
        const field = node.getAttribute("data-edit-field") || "text";
        if (!Number.isInteger(index) || index < 0) return;
        const edits = loadEdits();
        edits.site = edits.site || {};
        const keywords = Array.isArray(edits.site.heroKeywords)
          ? edits.site.heroKeywords.slice()
          : (window.DEFAULT_CONTENT.heroKeywords || []).map((item) => ({ ...item }));
        if (!keywords[index]) keywords[index] = { year: "", text: "" };
        keywords[index] = { ...keywords[index], [field]: node.textContent.trim() };
        edits.site.heroKeywords = keywords;
        window.DEFAULT_CONTENT.heroKeywords = keywords;
        saveEdits(edits);
      });
    });

    document.querySelectorAll("[data-edit-edu]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const id = node.getAttribute("data-edit-edu");
        const field = node.getAttribute("data-edit-field") || "title";
        const edits = loadEdits();
        edits.education = edits.education || {};
        edits.education[id] = { ...(edits.education[id] || {}), [field]: node.textContent.trim() };
        const edu = (window.DEFAULT_CONTENT.education || []).find((e) => e.id === id);
        if (edu) edu[field] = node.textContent.trim();
        saveEdits(edits);
      });
    });

    document.querySelectorAll("[data-edit-work]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const id = node.getAttribute("data-edit-work");
        const field = node.getAttribute("data-edit-field") || "title";
        let value = node.textContent.trim();
        if (field === "detail") value = node.innerText.trim();
        const edits = loadEdits();
        edits.works = edits.works || {};
        edits.works[id] = { ...(edits.works[id] || {}), [field]: value };
        const work = (window.DEFAULT_CONTENT.works || []).find((w) => w.id === id);
        if (work) work[field] = value;
        saveEdits(edits);
      });
      node.addEventListener("click", (event) => {
        if (document.body.classList.contains("is-editing")) event.preventDefault();
      });
    });

    document.querySelectorAll("[data-edit-exp]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const id = node.getAttribute("data-edit-exp");
        const field = node.getAttribute("data-edit-field") || "company";
        const value = node.innerText.trim();
        const edits = loadEdits();
        edits.experiences = edits.experiences || {};
        edits.experiences[id] = { ...(edits.experiences[id] || {}), [field]: value };
        const exp = (window.DEFAULT_CONTENT.experiences || []).find((e) => e.id === id);
        if (exp) exp[field] = value;
        saveEdits(edits);
      });
    });

    document.querySelectorAll("[data-edit-mod]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const key = node.getAttribute("data-edit-mod") || "";
        const [expId, modId] = key.split(".");
        const field = node.getAttribute("data-edit-field") || "title";
        const value = node.innerText.trim();
        if (!expId || !modId) return;
        const edits = loadEdits();
        edits.experiences = edits.experiences || {};
        edits.experiences[expId] = edits.experiences[expId] || {};
        edits.experiences[expId].modules = edits.experiences[expId].modules || {};
        edits.experiences[expId].modules[modId] = {
          ...(edits.experiences[expId].modules[modId] || {}),
          [field]: value,
        };
        const exp = (window.DEFAULT_CONTENT.experiences || []).find((e) => e.id === expId);
        const mod = exp && (exp.modules || []).find((m) => m.id === modId);
        if (mod) mod[field] = value;
        saveEdits(edits);
      });
    });

    document.querySelectorAll("[data-edit-tool]").forEach((node) => {
      node.contentEditable = on ? "true" : "false";
      if (!on || node.dataset.editBound === "1") return;
      node.dataset.editBound = "1";
      node.addEventListener("blur", () => {
        const id = node.getAttribute("data-edit-tool");
        const field = node.getAttribute("data-edit-field") || "name";
        const value = node.innerText.trim();
        const edits = loadEdits();
        edits.tools = edits.tools || {};
        edits.tools[id] = { ...(edits.tools[id] || {}), [field]: value };
        const tool = (window.DEFAULT_CONTENT.tools || []).find((t) => t.id === id);
        if (tool) tool[field] = value;
        saveEdits(edits);
      });
    });
  }

  window.__resumeToggleEdit = function () {
    if (!requireAuth()) return;
    setEditMode(!document.body.classList.contains("is-editing"));
  };
  window.__resumeBindEdit = function () {
    if (document.body.classList.contains("is-editing")) bindEditing(true);
  };

  function boot() {
    mountChrome();
    applyHiddenModules();
    syncAuthUI();
    bindUnlockGestures();
    if (wantEditMode()) setEditMode(true);
  }

  applyEditsToContent();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
