/**
 * Static / Pages fallback for the full topic tool UI.
 * When FastAPI is unavailable, serve demo sample_data so GitHub Pages still works.
 * Local full mode: run start-demo.ps1 (uvicorn) — this bridge stays idle.
 */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const forceStatic = params.get("demo") === "1" || params.get("static") === "1";
  let mode = forceStatic ? "static" : "auto"; // auto | static | live
  let xhsSample = null;
  let channelsSample = null;

  function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  function samplePath(name) {
    // static/index.html → ../demo/sample_data/...
    return new URL(`../demo/sample_data/${name}`, location.href).href;
  }

  async function loadSamples() {
    if (xhsSample && channelsSample) return;
    const [xhs, ch] = await Promise.all([
      fetch(samplePath("xhs_accumulated.json")).then((r) => r.json()),
      fetch(samplePath("channels_accumulated.json")).then((r) => r.json())
    ]);
    xhsSample = Array.isArray(xhs) ? xhs : [];
    channelsSample = Array.isArray(ch) ? ch : [];
  }

  function serialize(results) {
    const list = results || [];
    const success = list.filter((r) => r.status === "成功").length;
    return { count: list.length, success, results: list };
  }

  async function probeLive() {
    if (mode === "static") return false;
    if (mode === "live") return true;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 800);
      const resp = await window.__wrzOrigFetch("/api/health", { signal: ctrl.signal });
      clearTimeout(t);
      if (resp.ok) {
        mode = "live";
        return true;
      }
    } catch (_) {}
    mode = "static";
    return false;
  }

  async function handleApi(url, init) {
    await loadSamples();
    const u = new URL(url, location.origin);
    const path = u.pathname;
    const method = ((init && init.method) || "GET").toUpperCase();

    if (path === "/api/health" || path.endsWith("/api/health")) {
      return jsonResponse({
        ok: true,
        version: "1.7.0-static",
        mode: "demo",
        message: "静态体验版（样例数据，无采集后端）"
      });
    }
    if (path.includes("/api/accumulated") && method === "GET") {
      return jsonResponse(serialize(xhsSample));
    }
    if (path.includes("/api/history") && method === "GET") {
      return jsonResponse({ count: 0, snapshots: [] });
    }
    if (path.includes("/api/tasks/current")) {
      return jsonResponse({ task: null });
    }
    if (path.includes("/api/whisper/status")) {
      return jsonResponse({ available: false, message: "静态体验版不含转写服务" });
    }
    if (path.includes("/api/xhs/login-status")) {
      return jsonResponse({ logged_in: false, demo: true });
    }
    if (path.includes("/api/discover/sources")) {
      return jsonResponse({
        sources: [
          { id: "xhs_search_keyword", name: "关键词搜索（演示）" },
          { id: "xhs_account_notes", name: "账号笔记（演示）" }
        ]
      });
    }
    if (path.includes("/api/channels/health") || path.endsWith("/api/channels/health")) {
      return jsonResponse({ ok: true, mode: "demo" });
    }
    if (path.includes("/api/channels/accumulated") && method === "GET") {
      return jsonResponse(serialize(channelsSample));
    }
    if (path.includes("/api/channels/tasks/current")) {
      return jsonResponse({ task: null });
    }
    if (path.includes("/api/channels/browser/status")) {
      return jsonResponse({ running: false, demo: true });
    }
    if (path.includes("/api/channels/discover/sources")) {
      return jsonResponse({
        sources: [{ id: "channels_search_keyword", name: "关键词搜索（演示）" }]
      });
    }
    if (path.includes("/api/channels/") && method !== "GET") {
      return jsonResponse({
        ok: false,
        message: "静态体验版仅演示样例数据；完整能力请本机运行 start-demo.ps1"
      });
    }
    if (path.includes("/api/intel/")) {
      if (path.includes("/watch-topics") && method === "GET" && !path.includes("/items") && !path.includes("/directions") && !path.includes("/run") && !path.includes("/from-template")) {
        return jsonResponse({
          items: [
            {
              id: "demo_topic_1",
              name: "AI 办公工具（演示）",
              keywords: ["AI", "WorkBuddy", "Claude"],
              platforms: ["xhs", "channels"],
              enabled: true,
              item_count: 2,
              last_run_at: "2026-06-16 10:00",
              last_run_message: "静态样例已加载",
              filters: { search_mode: "combined", note_type: "类型不限" }
            }
          ]
        });
      }
      if (path.includes("/watch-topics/") && path.includes("/items") && method === "GET") {
        return jsonResponse({ items: xhsSample.slice(0, 2), count: Math.min(2, xhsSample.length) });
      }
      if (path.includes("/llm/status")) {
        return jsonResponse({ available: false, message: "静态体验版未连接 LLM" });
      }
      if (path.includes("/templates/")) {
        return jsonResponse({ templates: [] });
      }
      if (path.includes("/corpus/") || path.includes("/tracked") || path.includes("/analytics") || path.includes("/mining")) {
        return jsonResponse({ items: [], assets: [], posts: [], count: 0, results: [] });
      }
      if (method !== "GET") {
        return jsonResponse({
          ok: false,
          message: "静态体验版只读演示；完整能力请本机运行 start-demo.ps1"
        });
      }
      return jsonResponse({ ok: true, items: [], count: 0 });
    }
  }

  window.__wrzOrigFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    if (!url) return window.__wrzOrigFetch(input, init);
    const isApi = /\/api\//.test(url) || String(url).startsWith("/api/");
    if (!isApi) return window.__wrzOrigFetch(input, init);

    const live = await probeLive();
    if (live) return window.__wrzOrigFetch(input, init);
    return handleApi(url, init);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const badge = document.getElementById("versionBadge");
    if (!badge) return;
    setTimeout(async () => {
      if (mode === "static" || forceStatic) {
        badge.textContent = "v1.7.0 · 静态体验版";
        badge.style.background = "linear-gradient(135deg,#f59e0b,#fbbf24)";
        badge.style.color = "#1a1a1a";
      }
    }, 400);
  });
})();
