/**
 * Public vs editing.
 * - localhost / LAN / file: always allow edit chrome
 * - GitHub Pages / Vercel: hide edit by default (visitor-safe)
 * - Owner unlock: ?edit=1  → show edit + export again
 * - Force read-only preview: ?public=1
 */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const host = (location.hostname || "").toLowerCase();

  function isPrivateHost(h) {
    if (!h || h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
    if (location.protocol === "file:") return true;
    // IPv4 private / link-local
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (h.endsWith(".local")) return true;
    return false;
  }

  const forcePublic = params.get("public") === "1";
  const forceEdit =
    params.has("edit") && params.get("edit") !== "0" && params.get("edit") !== "false";

  const allowEdit = !forcePublic && (isPrivateHost(host) || forceEdit);
  window.__WRZ_PUBLIC__ = !allowEdit;
  window.__WRZ_ALLOW_EDIT__ = allowEdit;

  document.documentElement.classList.toggle("wrz-public", window.__WRZ_PUBLIC__);
  document.documentElement.classList.toggle("wrz-editable", allowEdit);
})();
