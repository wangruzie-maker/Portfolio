#!/usr/bin/env python3
"""Apply wang-portfolio global/browser sync JSON into project files."""
from __future__ import annotations

import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "sync-inbox"
DATA_JS = ROOT / "assets" / "js" / "data.js"
CONTENT_JS = ROOT / "js" / "content.js"
COVER_DIR = ROOT / "assets" / "covers" / "journey"
DETAIL_DIR = ROOT / "assets" / "covers" / "detail"


def find_pack() -> Path:
    names = (
        "wang-portfolio-global-sync*.json",
        "wang-portfolio-browser-sync*.json",
        "*global-sync*.json",
        "*browser-sync*.json",
    )
    candidates: list[Path] = []
    for folder in (
        INBOX,
        Path.home() / "Downloads",
        Path(r"C:\Users\Administrator\Downloads"),
        Path(r"C:\Users\Administrator\Desktop\个人网站图"),
        ROOT,
    ):
        if not folder.exists():
            continue
        for pat in names:
            candidates.extend(folder.glob(pat))
    if not candidates:
        raise SystemExit("未找到同步包 JSON。请导出后放到 sync-inbox\\")
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


def save_data_url(data_url: str, dest: Path) -> str | None:
    if not data_url or not isinstance(data_url, str) or not data_url.startswith("data:image"):
        return None
    m = re.match(r"data:(image/[\w+.-]+);base64,(.+)", data_url, re.S)
    if not m:
        return None
    mime, b64 = m.group(1), m.group(2)
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(mime, ".jpg")
    dest = dest.with_suffix(ext)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(base64.b64decode(b64))
    return dest.relative_to(ROOT).as_posix()


def patch_work_fields(src: str, work_id: str, fields: dict) -> str:
    id_idx = src.find(f'id: "{work_id}"')
    if id_idx < 0:
        id_idx = src.find(f"id: '{work_id}'")
    if id_idx < 0:
        print(f"skip missing work {work_id}")
        return src
    start = src.rfind("{", 0, id_idx)
    depth = 0
    end = None
    for i in range(start, len(src)):
        ch = src[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        return src
    block = src[start:end]

    def repl_field(block: str, key: str, value) -> str:
        if value is None:
            return block
        if not isinstance(value, str):
            value = str(value)
        pat = rf'({key}:\s*)(`(?:\\`|[^`])*`|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')'
        encoded = json.dumps(value, ensure_ascii=False)
        if re.search(pat, block):
            return re.sub(pat, lambda m: m.group(1) + encoded, block, count=1)
        # insert before final }
        insert = f",\n    {key}: {encoded}\n  "
        return block[:-1].rstrip().rstrip(",") + insert + "}"

    for key, value in fields.items():
        if value in (None, ""):
            continue
        block = repl_field(block, key, value)
    return src[:start] + block + src[end:]


def patch_site_fields(src: str, site: dict) -> str:
    for key in (
        "nameFirst",
        "name",
        "summary",
        "intro",
        "focus",
        "journeyLead",
        "journeyTitle",
        "workTitle",
        "workLead",
        "labTitle",
        "personalTitle",
    ):
        if key not in site or site[key] in (None, ""):
            continue
        pat = rf'({key}:\s*)(`(?:\\`|[^`])*`|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')'
        if re.search(pat, src):
            src = re.sub(
                pat,
                lambda m, v=site[key]: m.group(1) + json.dumps(v, ensure_ascii=False),
                src,
                count=1,
            )
    return src


def apply_home(pack: dict) -> None:
    home = pack.get("home") or pack
    # v1 pack shape
    if "edits" in pack and "home" not in pack:
        home = {
            "edits": pack.get("edits") or {},
            "site": pack.get("site") or {},
            "works": pack.get("works") or [],
            "liveJourney": pack.get("liveJourney") or [],
        }
    edits = home.get("edits") or {}
    works_patch = edits.get("works") or {}
    images = edits.get("images") or {}
    site = edits.get("site") or home.get("site") or {}
    live = {row.get("workId"): row for row in (home.get("liveJourney") or []) if row.get("workId")}

    COVER_DIR.mkdir(parents=True, exist_ok=True)
    src = DATA_JS.read_text(encoding="utf-8")

    works = home.get("works") or []
    if not works and works_patch:
        works = [{"id": wid, **(works_patch[wid] or {})} for wid in works_patch]

    for work in works:
        wid = work.get("id")
        if not wid:
            continue
        patch = dict(works_patch.get(wid) or {})
        live_row = live.get(wid) or {}
        fields = {
            "titleCn": patch.get("titleCn") or live_row.get("title") or work.get("titleCn"),
            "summaryCn": patch.get("summaryCn") or live_row.get("summary") or work.get("summaryCn"),
            "timelineSubTag": patch.get("timelineSubTag")
            or live_row.get("year")
            or work.get("timelineSubTag"),
            "categoryCn": patch.get("categoryCn") or live_row.get("role") or work.get("categoryCn"),
        }
        data_url = (
            images.get(f"work:{wid}")
            or patch.get("journeyCoverUrl")
            or work.get("journeyCoverUrl")
        )
        if isinstance(data_url, str) and data_url.startswith("data:"):
            rel = save_data_url(data_url, COVER_DIR / wid)
            if rel:
                fields["journeyCoverUrl"] = rel
                fields["coverUrl"] = rel
        elif live_row.get("imageSrc", "").startswith("data:"):
            rel = save_data_url(live_row["imageSrc"], COVER_DIR / wid)
            if rel:
                fields["journeyCoverUrl"] = rel
                fields["coverUrl"] = rel
        src = patch_work_fields(src, wid, fields)

    for slot_id, default_name in (
        ("tools-hub", "tools-hub-cover"),
        ("personal-works", "personal-works-cover"),
    ):
        data_url = images.get(slot_id)
        if isinstance(data_url, str) and data_url.startswith("data:"):
            rel = save_data_url(data_url, ROOT / "assets" / "covers" / default_name)
            print(f"slot {slot_id} -> {rel}")

    # ensure bytedance in experience track
    if '"exp-bytedance"' not in src.split("resumeTracks")[-1] if "resumeTracks" in src else True:
        src = src.replace(
            '"exp-sellerpic"\n    ]',
            '"exp-sellerpic",\n      "exp-bytedance"\n    ]',
        )

    src = patch_site_fields(src, site if isinstance(site, dict) else {})
    DATA_JS.write_text(src, encoding="utf-8")
    print("updated", DATA_JS)


def extract_detail_images(content: dict) -> dict:
    DETAIL_DIR.mkdir(parents=True, exist_ok=True)
    n = 0

    def fix_images(owner_id: str, images: list) -> list:
        nonlocal n
        out = []
        for i, img in enumerate(images or []):
            item = dict(img or {})
            src = item.get("src") or ""
            if isinstance(src, str) and src.startswith("data:"):
                rel = save_data_url(src, DETAIL_DIR / f"{owner_id}-{i}")
                if rel:
                    item["src"] = rel
                    n += 1
            out.append(item)
        return out

    for exp in content.get("experiences") or []:
        eid = exp.get("id") or "exp"
        for mod in exp.get("modules") or []:
            mid = mod.get("id") or "m"
            mod["images"] = fix_images(f"{eid}-{mid}", mod.get("images") or [])
    for tool in content.get("tools") or []:
        tid = tool.get("id") or "tool"
        tool["images"] = fix_images(f"tool-{tid}", tool.get("images") or [])
    for work in content.get("works") or []:
        wid = work.get("id") or "work"
        work["images"] = fix_images(f"work-{wid}", work.get("images") or [])
    print(f"detail images extracted: {n}")
    return content


def apply_detail(pack: dict) -> None:
    detail = pack.get("detail")
    # also accept raw portfolio-content.json
    if not detail and pack.get("version") == 3 and pack.get("experiences"):
        detail = pack
    if not detail:
        print("no detail content in pack — skip content.js")
        return
    detail = extract_detail_images(json.loads(json.dumps(detail)))
    # keep name English brand on detail site
    if isinstance(detail.get("site"), dict):
        if detail["site"].get("name") == "王瑞泽":
            detail["site"]["name"] = "Wang Ruize"
    # backup once
    bak = CONTENT_JS.with_suffix(".js.bak")
    if CONTENT_JS.exists() and not bak.exists():
        bak.write_text(CONTENT_JS.read_text(encoding="utf-8"), encoding="utf-8")
    body = (
        "/* Auto-synced from browser global sync. Original backed up as content.js.bak */\n"
        "window.DEFAULT_CONTENT = "
        + json.dumps(detail, ensure_ascii=False, indent=2)
        + ";\n"
    )
    CONTENT_JS.write_text(body, encoding="utf-8")
    print("updated", CONTENT_JS)


def normalize_pack(raw: dict) -> dict:
    if raw.get("kind") == "wang-portfolio-global-sync" or "home" in raw or "detail" in raw:
        return raw
    # v1 homepage-only
    return {"version": 1, "home": raw, "detail": None}


def main() -> None:
    pack_path = Path(sys.argv[1]) if len(sys.argv) > 1 else find_pack()
    print("using", pack_path)
    raw = json.loads(pack_path.read_text(encoding="utf-8"))
    pack = normalize_pack(raw)
    INBOX.mkdir(parents=True, exist_ok=True)
    apply_home(pack)
    apply_detail(pack)
    dest = INBOX / pack_path.name
    if pack_path.resolve() != dest.resolve():
        dest.write_bytes(pack_path.read_bytes())
    print("done")


if __name__ == "__main__":
    main()
