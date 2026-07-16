/**
 * Simple resume editor — text, image upload, and per-item jump links.
 * Empty link = not clickable. Filled URL opens (http(s) → new tab).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "resume-simple-edits-v2";
  const MAX_IMAGE_BYTES = 900 * 1024;

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
      <p class="edit-hint" data-edit-hint hidden>
        编辑：改文字 · 上传图片 · 填写跳转链接（留空不可点）· 自动保存在本机
      </p>
      <button type="button" class="edit-fab" data-edit-toggle aria-pressed="false">编辑内容</button>
      <button type="button" class="edit-fab" data-edit-reset hidden>清空本地修改</button>
    `;
    document.body.appendChild(root);

    root.querySelector("[data-edit-toggle]").addEventListener("click", () => {
      setEditMode(!document.body.classList.contains("is-editing"));
    });
    root.querySelector("[data-edit-reset]").addEventListener("click", () => {
      if (!confirm("清空本机保存的文案、图片与链接修改？")) return;
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }

  function setEditMode(on) {
    sessionStorage.setItem("resume-edit-mode", on ? "1" : "0");
    document.body.classList.toggle("is-editing", on);
    const toggle = document.querySelector("[data-edit-toggle]");
    const hint = document.querySelector("[data-edit-hint]");
    const reset = document.querySelector("[data-edit-reset]");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(on));
      toggle.textContent = on ? "完成编辑" : "编辑内容";
      toggle.classList.toggle("is-on", on);
    }
    if (hint) hint.hidden = !on;
    if (reset) reset.hidden = !on;
    setupTextEditing(on);
    setupImageUploads(on);
    setupLinkEditing(on);
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

  function refresh() {
    if (document.body.classList.contains("is-editing")) {
      setupTextEditing(true);
      setupImageUploads(true);
      setupLinkEditing(true);
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
