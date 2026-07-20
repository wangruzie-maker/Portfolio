/**
 * Public vs local editing.
 * On GitHub Pages / any non-local host: hide edit & sync chrome.
 * Localhost keeps full editor. Force public preview: ?public=1
 */
(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  const host = location.hostname || "";
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "" ||
    location.protocol === "file:";
  const forcePublic = params.get("public") === "1";
  window.__WRZ_PUBLIC__ = forcePublic || !isLocal;
  if (window.__WRZ_PUBLIC__) {
    document.documentElement.classList.add("wrz-public");
  }
})();
