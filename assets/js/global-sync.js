/**
 * Global sync — export homepage edits + detail SPA content (text + images).
 * Loaded on both index.html and detail.html.
 */
(function () {
  "use strict";

  const HOME_LS = "resume-simple-edits-v3";
  const HOME_IDB = "wrz-resume-edits-db";
  const DETAIL_KEY = "wrz-portfolio-content-v3";
  const DETAIL_IDB = "wrz-portfolio-db";
  const STORE = "kv";

  function openIdb(name) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IndexedDB 打开失败"));
    });
  }

  async function idbGet(dbName, key) {
    try {
      const db = await openIdb(dbName);
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  function readLocalJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  async function collectHome() {
    const meta = readLocalJson(HOME_LS) || {};
    const images = (await idbGet(HOME_IDB, "images")) || meta.images || {};
    const edits = { ...meta, images: images && typeof images === "object" ? images : {} };
    return {
      edits,
      site: window.siteConfig || null,
      works: Array.isArray(window.portfolioWorks)
        ? window.portfolioWorks.map((w) => ({ ...w }))
        : [],
      liveJourney: [...document.querySelectorAll(".journey-item")].map((el) => {
        const host = el.closest("[data-work-id]") || el;
        return {
          year: el.querySelector(".year")?.textContent?.trim() || "",
          role: el.querySelector(".role")?.textContent?.trim() || "",
          title: el.querySelector("h3")?.textContent?.trim() || "",
          summary: el.querySelector(".journey-copy p:not(.role)")?.textContent?.trim() || "",
          workId: host.getAttribute("data-work-id") || "",
          imageSrc: el.querySelector("[data-image-preview]")?.currentSrc || ""
        };
      })
    };
  }

  async function collectDetail() {
    let content = await idbGet(DETAIL_IDB, DETAIL_KEY);
    if (!content) content = readLocalJson(DETAIL_KEY);
    if (!content && window.__detailContent) content = window.__detailContent;
    if (!content && window.DEFAULT_CONTENT) content = window.DEFAULT_CONTENT;
    return content || null;
  }

  async function buildPack() {
    const [home, detail] = await Promise.all([collectHome(), collectDetail()]);
    return {
      version: 2,
      kind: "wang-portfolio-global-sync",
      exportedAt: new Date().toISOString(),
      home,
      detail
    };
  }

  function downloadJson(filename, data) {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function exportGlobalSync() {
    const pack = await buildPack();
    const homeImgs = Object.keys((pack.home && pack.home.edits && pack.home.edits.images) || {}).length;
    let detailImgs = 0;
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(walk);
      if (typeof node.src === "string" && node.src.startsWith("data:")) detailImgs += 1;
      Object.values(node).forEach(walk);
    };
    walk(pack.detail);
    downloadJson("wang-portfolio-global-sync.json", pack);
    alert(
      `已下载全局同步包 wang-portfolio-global-sync.json\n` +
        `首页图片 ${homeImgs} 张 · 子页图片 ${detailImgs} 张\n` +
        `请放到项目 sync-inbox\\ 文件夹，然后告诉我「已导出全局」。`
    );
    return pack;
  }

  window.__wrzGlobalSync = {
    exportGlobalSync,
    buildPack,
    collectHome,
    collectDetail
  };
})();
