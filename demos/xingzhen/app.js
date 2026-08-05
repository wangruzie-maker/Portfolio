/* 星阵 · 柔光纪念碑
 * 交互体系第一性：丝滑易懂 + 审美
 * 四条成体系规则：
 *  1. 一眼一意 — 每屏一个主任务
 *  2. 模块游廊 — 横向滑入换模块（现网命名）
 *  3. 预见提示 — 输入即推荐下一步
 *  4. 生成可控 → 交付收束 — 所有产出以交付包预览结束
 */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const ROUTES = [
    "home", "video", "canvas", "voice", "assets",
    "studio", "agent", "delivery", "overview", "settings",
  ];

  const TITLES = {
    home: "首页",
    video: "视频工坊",
    canvas: "无限画布",
    voice: "语音生成",
    assets: "整体资产",
    studio: "单号创作",
    agent: "批量生产",
    delivery: "发布清单",
    overview: "数据看板",
    settings: "我的",
  };

  const HISTORY = [
    { title: "未命名创作", tag: "画布", go: "canvas" },
    { title: "玩偶淡紫色彩色铅笔", tag: "画布", go: "canvas" },
    { title: "梦幻童话花园短片", tag: "视频", go: "video" },
    { title: "百度搭子·三图批次", tag: "批量", go: "agent" },
  ];

  const ACCOUNTS = [
    { id: "a1", name: "秒哒观察室", platform: "小红书图文", status: "活跃" },
    { id: "a2", name: "搭子研究所", platform: "小红书图文", status: "活跃" },
    { id: "a3", name: "市场前线V", platform: "视频号", status: "活跃" },
    { id: "a4", name: "ACG速递", platform: "小红书图文", status: "停用" },
  ];

  const GEN_PHASES = ["理解意图", "匹配资产", "生成草稿", "质量检查", "组装交付包"];

  const state = {
    route: "home",
    intent: "",
    medium: "video",
    homePhase: "compose", // compose | path
    path: null,
    foresee: true,
    agentStep: 0,
    agentMode: "list",
    selected: ["a1", "a2"],
    title: "",
    content: "",
    imageCount: 3,
    studioAcc: null,
    studioStep: 0,
    genPhase: 0,
    genPaused: false,
    genTimer: null,
    packFrom: null,
  };

  let scrolling = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  function toast(msg) {
    const el = $("#toast");
    el.hidden = false;
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function intentChip() {
    if (!state.intent) return "";
    return `<div class="chip"><b>意图</b><span>${esc(state.intent)}</span></div>`;
  }

  function trail(labels, active) {
    if (!labels?.length) {
      $("#trail").innerHTML = "";
      return;
    }
    $("#trail").innerHTML = labels.map((l, i) => {
      const sep = i ? `<span class="trail__sep"></span>` : "";
      const cls = i < active ? "is-done" : i === active ? "is-on" : "";
      return `${sep}<span class="trail__step ${cls}">${l}</span>`;
    }).join("");
  }

  function syncTrail() {
    if (state.route === "home") {
      trail(
        state.homePhase === "compose" ? ["写下意图", "选择路径"] : ["写下意图", "选择路径"],
        state.homePhase === "compose" ? 0 : 1
      );
    } else if (state.route === "agent" && state.agentMode === "wizard") {
      trail(["选账号", "写文案", "核对", "交付预览"], state.agentStep);
    } else if (state.route === "studio" && state.studioAcc) {
      trail(["脚本", "分镜", "生成", "交付预览"], state.studioStep);
    } else if (["video", "canvas", "voice"].includes(state.route)) {
      trail(["创作", "可控生成", "交付预览"], 0);
    } else {
      trail([], 0);
    }
  }

  /* —— Atmosphere parallax —— */
  if (fine) {
    addEventListener("mousemove", (e) => {
      const d = $("#damask");
      if (!d || reduced) return;
      const x = (e.clientX / innerWidth - 0.5) * 12;
      const y = (e.clientY / innerHeight - 0.5) * 12;
      d.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* —— Corridor —— */
  function idx(r) { return Math.max(0, ROUTES.indexOf(r)); }

  function go(next, { render = true } = {}) {
    if (!ROUTES.includes(next)) next = "home";
    state.route = next;
    if (location.hash !== `#/${next}`) location.hash = `#/${next}`;
    $("#pageTitle").textContent = TITLES[next];
    $$(".rail__item[data-go]").forEach((b) => b.classList.toggle("is-active", b.dataset.go === next));
    syncTrail();

    if (render) {
      const pane = $(`#pane-${next}`);
      pane.innerHTML = VIEWS[next]();
      bind(next, pane);
    }

    scrolling = true;
    $(`#pane-${next}`).scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "start",
      block: "nearest",
    });
    setTimeout(() => { scrolling = false; }, reduced ? 40 : 480);
  }

  function neighbor(dir) {
    const i = idx(state.route) + dir;
    if (i < 0 || i >= ROUTES.length) {
      toast(dir < 0 ? "已到第一个模块" : "已到最后一个模块");
      return;
    }
    go(ROUTES[i]);
  }

  /* —— System: controllable generate —— */
  function openGen(from) {
    state.packFrom = from;
    state.genPhase = 0;
    state.genPaused = false;
    const sheet = $("#genSheet");
    sheet.hidden = false;
    renderGenSteps();
    $("#genNote").textContent = "可在任意阶段暂停并修改";
    clearInterval(state.genTimer);
    state.genTimer = setInterval(() => {
      if (state.genPaused) return;
      if (state.genPhase >= GEN_PHASES.length - 1) {
        clearInterval(state.genTimer);
        setTimeout(() => {
          sheet.hidden = true;
          openPack();
        }, 420);
        return;
      }
      state.genPhase += 1;
      renderGenSteps();
    }, reduced ? 200 : 700);
  }

  function renderGenSteps() {
    $("#genSteps").innerHTML = GEN_PHASES.map((p, i) => {
      const cls = i < state.genPhase ? "is-done" : i === state.genPhase ? "is-on" : "is-wait";
      return `<li class="${cls}"><em>0${i + 1}</em><span>${p}</span></li>`;
    }).join("");
    $("#genTitle").textContent = state.genPaused ? "已暂停" : `生成中 · ${GEN_PHASES[state.genPhase]}`;
    $("#genPause").textContent = state.genPaused ? "继续生成" : "暂停";
  }

  function openPack() {
    const sheet = $("#packSheet");
    sheet.hidden = false;
    const acc = ACCOUNTS.find((a) => a.id === state.studioAcc);
    const names = ACCOUNTS.filter((a) => state.selected.includes(a.id)).map((a) => a.name).join("、");
    const who = state.packFrom === "agent" ? names : (acc?.name || "当前账号");
    const title = state.title || state.intent || "未命名作品";
    $("#packBody").innerHTML = `
      <div class="pack__meta">
        供应商下载时将看到以下结构。确认后进入<strong>发布清单</strong>。
      </div>
      <div class="pack__file">
        <div class="pack__thumb vis-a"></div>
        <div>
          <b>${esc(title.slice(0, 32))}</b>
          <span>${esc(who)} · ${state.medium === "video" ? "视频" : state.medium === "voice" ? "音频" : "图文"} · ${new Date().toLocaleDateString("zh-CN")}</span>
        </div>
        <span class="badge badge--run">待交割</span>
      </div>
      <div class="pack__file">
        <div class="pack__thumb vis-d"></div>
        <div>
          <b>cover.jpg</b>
          <span>封面 · 1080×1440</span>
        </div>
        <span class="badge">附件</span>
      </div>
      <div class="pack__file">
        <div class="pack__thumb vis-b"></div>
        <div>
          <b>copy.txt</b>
          <span>标题与正文</span>
        </div>
        <span class="badge">文案</span>
      </div>
    `;
  }

  function closeSheets() {
    $("#genSheet").hidden = true;
    $("#packSheet").hidden = true;
    clearInterval(state.genTimer);
  }

  /* —— Views —— */
  function viewHome() {
    if (state.homePhase === "path") {
      return `
        <div class="panel" style="max-width:820px;margin:0 auto">
          <p class="eyebrow">CHOOSE PATH</p>
          <h1 class="h1">这一次怎么做？</h1>
          <p class="lead">只问一件事。选完会沿模块滑入对应工作区。</p>
          ${intentChip()}
          <div style="display:grid;gap:.65rem;margin-top:1rem">
            <button type="button" class="row ${state.path === "quick" ? "is-on" : ""}" data-path="quick" style="padding:1.1rem">
              <b>快速创作</b>
              <span>进入视频工坊 / 无限画布 / 语音生成 · 适合试稿</span>
            </button>
            <button type="button" class="row ${state.path === "studio" ? "is-on" : ""}" data-path="studio" style="padding:1.1rem">
              <b>单号创作</b>
              <span>先选账号，再精修 · 一号一风格</span>
            </button>
            <button type="button" class="row ${state.path === "agent" ? "is-on" : ""}" data-path="agent" style="padding:1.1rem">
              <b>批量生产</b>
              <span>多账号并行 · 核对后交付</span>
            </button>
          </div>
          ${state.path === "quick" ? `
            <div style="margin-top:1rem">
              <p class="lead" style="margin-bottom:.6rem">选介质</p>
              <div class="seg">
                <button type="button" data-medium="video" class="${state.medium === "video" ? "is-on" : ""}">视频工坊</button>
                <button type="button" data-medium="canvas" class="${state.medium === "canvas" ? "is-on" : ""}">无限画布</button>
                <button type="button" data-medium="voice" class="${state.medium === "voice" ? "is-on" : ""}">语音生成</button>
              </div>
            </div>` : ""}
          <div class="foot">
            <button type="button" class="btn btn--ghost" id="backCompose">返回</button>
            <span class="hint">一步一问，少找菜单</span>
            <button type="button" class="btn btn--solid" id="goPath" ${state.path ? "" : "disabled"}>继续</button>
          </div>
        </div>`;
    }

    const showFore = state.intent.trim().length >= 8;
    return `
      <div class="home">
        <div class="home__watermark">STAR MATRIX</div>
        <p class="monument">星阵</p>
        <p class="monument-sub">让灵感成为可交付的作品</p>
        <div class="composer surface surface--soft ${state.intent ? "is-focus" : ""}">
          <textarea id="prompt" placeholder="用一句话说清你想做的内容……">${esc(state.intent)}</textarea>
          <div class="composer__bar">
            <div class="seg">
              <button type="button" data-medium="video" class="${state.medium === "video" ? "is-on" : ""}">视频</button>
              <button type="button" data-medium="image" class="${state.medium === "image" ? "is-on" : ""}">图片</button>
            </div>
            <span class="spacer"></span>
            <button type="button" class="btn btn--solid" id="startHome">开始</button>
          </div>
        </div>
        <div class="foresee ${showFore ? "is-on" : ""}" id="foresee">
          <button type="button" class="foresee__item" data-fore="assets"><b>相关资产</b>已匹配 3 个可用素材<em>整体资产</em></button>
          <button type="button" class="foresee__item" data-fore="agent"><b>也可能适合</b>多账号分发同一主题<em>批量生产</em></button>
          <button type="button" class="foresee__item" data-fore="studio"><b>或按人设精修</b>先选一个账号再写<em>单号创作</em></button>
        </div>
        <section class="discover">
          <div class="discover__head">
            <div>
              <p class="eyebrow">DISCOVER</p>
              <h2>灵感发现</h2>
            </div>
          </div>
          <div class="grid-4">
            ${[
              ["vis-a", "云海构图", "视觉设计"],
              ["vis-b", "夜色海报", "视觉设计"],
              ["vis-c", "雨中街景", "视频灵感"],
              ["vis-d", "晨光静物", "视频灵感"],
            ].map(([v, t, s]) => `
              <button type="button" class="tile" data-inspire="${t}">
                <div class="tile__vis ${v}"></div>
                <div class="tile__meta"><b>${t}</b><span>${s}</span></div>
              </button>`).join("")}
          </div>
        </section>
      </div>`;
  }

  function viewVideo() {
    return workModule("视频工坊", "VIDEO WORKSHOP", "分镜确认后再渲染。生成过程可暂停。", [
      ["品牌解释短片", "动态 · 约 30s"],
      ["展会追风四步", "动态 · 约 45s"],
    ]);
  }

  function viewCanvas() {
    return `
      <div class="panel">
        <p class="eyebrow">INFINITE CANVAS</p>
        <h1 class="h1">无限画布</h1>
        <p class="lead">意图 → 参考 → 生成 → 精修。完成后进入交付预览。</p>
        ${intentChip()}
        <div class="foot" style="border:0;padding-top:0;margin-top:.75rem">
          <button type="button" class="btn btn--solid" data-gen="canvas">开始生成</button>
          <button type="button" class="btn btn--ghost" data-go="home">回首页</button>
        </div>
        <div class="canvas surface" style="margin-top:1rem">
          <div class="node" style="left:10%;top:20%"><b>意图</b>${esc(state.intent || "待填写")}</div>
          <div class="node" style="left:38%;top:42%"><b>参考</b>风格 / 构图</div>
          <div class="node" style="left:62%;top:26%"><b>生成</b>主视觉 ×3</div>
          <div class="node" style="left:46%;top:64%"><b>精修</b>定稿</div>
        </div>
      </div>`;
  }

  function viewVoice() {
    return `
      <div class="panel">
        <p class="eyebrow">VOICE</p>
        <h1 class="h1">语音生成</h1>
        <p class="lead">先选音色，再贴文案，再生成。</p>
        ${intentChip()}
        <div class="split">
          <div class="list">
            ${["沉稳女声", "轻快男声", "纪录片旁白"].map((t, i) =>
              `<button type="button" class="row ${i === 0 ? "is-on" : ""}"><b>${t}</b></button>`
            ).join("")}
          </div>
          <div class="surface surface--soft" style="padding:1.15rem">
            <textarea rows="5" style="width:100%;resize:vertical;outline:none;font-family:var(--font-display);line-height:1.7;background:transparent">${esc(state.intent || "口播文案…")}</textarea>
            <div class="foot" style="border:0;padding-top:.85rem;margin:0">
              <span class="hint">生成可中途暂停</span>
              <button type="button" class="btn btn--solid" data-gen="voice">生成语音</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function workModule(title, eye, lead, sessions) {
    return `
      <div class="panel">
        <p class="eyebrow">${eye}</p>
        <h1 class="h1">${title}</h1>
        <p class="lead">${lead}</p>
        ${intentChip()}
        <div class="split">
          <div class="list">
            ${sessions.map((s, i) =>
              `<button type="button" class="row ${i === 0 ? "is-on" : ""}"><b>${s[0]}</b><span>${s[1]}</span></button>`
            ).join("")}
          </div>
          <div class="surface surface--soft" style="padding:1.1rem;display:flex;flex-direction:column;gap:1rem">
            <div style="aspect-ratio:16/9;background:linear-gradient(160deg,#EBE3D4,#1A3731);display:grid;place-items:center;color:var(--ivory);font-family:var(--font-latin);letter-spacing:.2em;font-size:.7rem">PREVIEW</div>
            <div class="foot" style="margin:0;padding:0;border:0">
              <span class="badge badge--run">分镜待确认</span>
              <span class="spacer"></span>
              <button type="button" class="btn btn--ghost" data-toast="分镜已确认">确认分镜</button>
              <button type="button" class="btn btn--solid" data-gen="video">渲染成片</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function viewAssets() {
    return `
      <div class="panel">
        <p class="eyebrow">ASSETS</p>
        <h1 class="h1">整体资产</h1>
        <p class="lead">草稿与定稿分开放。交付前从这里取用。</p>
        <div class="foot" style="border:0;padding:0;margin:.85rem 0 1rem">
          <button type="button" class="btn btn--solid" data-go="delivery">去发布清单</button>
        </div>
        <div class="assets">
          ${["定稿 · 展会立牌","草稿 · 主视觉","BGM · 晨光","封面 · 鎏金","分镜 · 街景","人设包 · 秒哒"].map((l, i) =>
            `<button type="button" class="asset" data-toast="${l}"><div class="asset__vis ${["vis-a","vis-b","vis-c","vis-d"][i % 4]}"></div><span class="asset__label">${l}</span></button>`
          ).join("")}
        </div>
      </div>`;
  }

  function viewStudio() {
    const locked = !state.studioAcc;
    const steps = ["脚本", "分镜", "生成", "交付预览"];
    const actions = ["完成脚本", "完成分镜", "开始生成", "查看交付包"];
    return `
      <div class="panel">
        <p class="eyebrow">STUDIO</p>
        <h1 class="h1">单号创作</h1>
        <p class="lead">先选账号，再逐步推进。顺序固定，减少返工。</p>
        ${intentChip()}
        <div class="split">
          <div class="list">
            ${ACCOUNTS.map((a) => `
              <button type="button" class="row ${state.studioAcc === a.id ? "is-on" : ""}"
                data-sacc="${a.id}" ${a.status === "停用" ? "disabled style=opacity:.4" : ""}>
                <b>${a.name}</b><span>${a.platform} · ${a.status}</span>
              </button>`).join("")}
          </div>
          <div class="lock ${locked ? "is-on" : ""}" data-lock="请先选择一个活跃账号">
            <ol class="steps">${steps.map((s, i) =>
              `<li class="${i < state.studioStep ? "is-done" : i === state.studioStep ? "is-on" : ""}"><em>0${i + 1}</em>${s}</li>`
            ).join("")}</ol>
            <div class="surface surface--soft" style="padding:1.15rem">
              <textarea rows="5" style="width:100%;resize:vertical;outline:none;font-family:var(--font-display);line-height:1.7;background:transparent;letter-spacing:.04em">${esc(state.intent && state.studioStep === 0 ? state.intent : "")}</textarea>
              <div class="foot">
                <button type="button" class="btn btn--ghost" id="studioBack" ${state.studioStep === 0 ? "disabled" : ""}>上一步</button>
                <span class="hint">${state.studioStep + 1} / 4</span>
                <button type="button" class="btn btn--solid" id="studioNext">${actions[state.studioStep]}</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function viewAgent() {
    if (state.agentMode === "list") {
      return `
        <div class="panel">
          <p class="eyebrow">BATCH</p>
          <h1 class="h1">批量生产</h1>
          <p class="lead">选账号 → 写文案 → 核对 → 交付预览。不跳步。</p>
          ${intentChip()}
          <div class="foot" style="border:0;padding:0;margin:.85rem 0 1rem">
            <button type="button" class="btn btn--solid" id="agentNew">新建批量任务</button>
          </div>
          <div class="stats">
            <div class="stat"><em>PLAN</em><b>03</b><span>进行中</span></div>
            <div class="stat"><em>ACC</em><b>26</b><span>覆盖账号</span></div>
            <div class="stat"><em>OUT</em><b>84</b><span>待审图文</span></div>
            <div class="stat"><em>NEXT</em><b>核对</b><span>建议动作</span></div>
          </div>
        </div>`;
    }
    const s = state.agentStep;
    let body = "";
    if (s === 0) {
      body = `<div class="list" style="max-width:420px">${ACCOUNTS.map((a) => {
        const on = state.selected.includes(a.id);
        return `<button type="button" class="check ${on ? "is-on" : ""} ${a.status === "停用" ? "is-disabled" : ""}" data-acc="${a.id}" ${a.status === "停用" ? "disabled" : ""}>
          <span class="box">${on ? "✓" : ""}</span>
          <span><b style="font-family:var(--font-display)">${a.name}</b><br/><span style="font-size:.68rem;color:var(--ink-3)">${a.platform}</span></span>
        </button>`;
      }).join("")}</div>`;
    } else if (s === 1) {
      body = `<div class="surface surface--soft" style="padding:1.1rem;max-width:520px">
        <input id="aTitle" value="${esc(state.title)}" placeholder="标题" style="width:100%;padding:.5rem 0;border-bottom:1px solid var(--line-2);outline:none;font-family:var(--font-display);margin-bottom:.85rem;background:transparent"/>
        <textarea id="aContent" rows="6" placeholder="正文" style="width:100%;resize:vertical;outline:none;font-family:var(--font-display);line-height:1.7;background:transparent">${esc(state.content)}</textarea>
      </div>`;
    } else {
      const names = ACCOUNTS.filter((a) => state.selected.includes(a.id)).map((a) => a.name).join("、");
      body = `<div class="surface surface--soft" style="padding:1.1rem;max-width:520px;line-height:1.7;font-size:.9rem;letter-spacing:.04em">
        <p><b style="font-family:var(--font-display)">账号</b>　${esc(names)}</p>
        <p style="margin-top:.55rem"><b style="font-family:var(--font-display)">标题</b>　${esc(state.title) || "—"}</p>
        <p style="margin-top:.55rem;color:var(--ink-2)">${esc(state.content) || "—"}</p>
      </div>`;
    }
    const can = (s === 0 && state.selected.length) || (s === 1 && state.title && state.content) || s >= 2;
    return `
      <div class="panel">
        <p class="eyebrow">NEW BATCH</p>
        <h1 class="h1">批量任务</h1>
        <ol class="steps">
          ${["选账号","写文案","核对","交付预览"].map((l, i) =>
            `<li class="${i < s ? "is-done" : i === s ? "is-on" : ""}"><em>0${i + 1}</em>${l}</li>`
          ).join("")}
        </ol>
        ${intentChip()}
        ${body}
        <div class="foot">
          <button type="button" class="btn btn--ghost" id="agentBack">${s === 0 ? "回列表" : "上一步"}</button>
          <span class="hint">${s === 0 ? `已选 <b>${state.selected.length}</b>` : "按序推进"}</span>
          <button type="button" class="btn btn--solid" id="agentNext" ${can ? "" : "disabled"}>${s >= 2 ? "生成并预览交付" : "下一步"}</button>
        </div>
      </div>`;
  }

  function viewDelivery() {
    return `
      <div class="panel">
        <p class="eyebrow">DELIVERY</p>
        <h1 class="h1">发布清单</h1>
        <p class="lead">定稿包在这里等待供应商下载与回链。</p>
        <div class="surface" style="padding:0;overflow:hidden;margin-top:1rem">
          <table class="table">
            <thead><tr><th>账号</th><th>作品</th><th>状态</th><th>时间</th></tr></thead>
            <tbody>
              <tr><td>秒哒观察室</td><td style="font-family:var(--font-display)">今天谁先到家？</td><td><span class="badge badge--run">待下载</span></td><td>今天</td></tr>
              <tr><td>搭子研究所</td><td style="font-family:var(--font-display)">宇宙级难题</td><td><span class="badge badge--ok">已交割</span></td><td>昨天</td></tr>
              <tr><td>市场前线V</td><td style="font-family:var(--font-display)">追风四步</td><td><span class="badge badge--run">待回链</span></td><td>昨天</td></tr>
            </tbody>
          </table>
        </div>
        <div class="foot">
          <button type="button" class="btn btn--solid" data-toast="已导出今日交付包">导出交付包</button>
          <button type="button" class="btn btn--ghost" data-go="overview">去数据看板</button>
        </div>
      </div>`;
  }

  function viewOverview() {
    return `
      <div class="panel">
        <p class="eyebrow">DASHBOARD</p>
        <h1 class="h1">数据看板</h1>
        <p class="lead">回链回收后，再回首页写下一批意图。</p>
        <div class="stats">
          <div class="stat"><em>TOTAL</em><b>80</b><span>账号矩阵</span></div>
          <div class="stat"><em>XHS</em><b>50</b><span>小红书图文</span></div>
          <div class="stat"><em>VIDEO</em><b>30</b><span>视频号</span></div>
          <div class="stat"><em>CYCLE</em><b>07</b><span>日均闭环</span></div>
        </div>
        <button type="button" class="btn btn--solid" data-go="home">回首页</button>
      </div>`;
  }

  function viewSettings() {
    return `
      <div class="panel">
        <p class="eyebrow">PROFILE</p>
        <h1 class="h1">我的</h1>
        <div class="surface surface--soft" style="padding:1.4rem;max-width:420px;margin-top:1rem">
          <p style="font-family:var(--font-display);letter-spacing:.12em;margin-bottom:.45rem">游客 · 个人版</p>
          <p style="color:var(--ink-3);font-size:.85rem;margin-bottom:1rem">登录后可使用批量生产、发布清单与数据看板完整能力。</p>
          <button type="button" class="btn btn--solid" data-toast="演示态">登录</button>
        </div>
      </div>`;
  }

  const VIEWS = {
    home: viewHome, video: viewVideo, canvas: viewCanvas, voice: viewVoice,
    assets: viewAssets, studio: viewStudio, agent: viewAgent,
    delivery: viewDelivery, overview: viewOverview, settings: viewSettings,
  };

  /* —— Bind —— */
  function bind(name, root) {
    root.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.go === "home") state.homePhase = "compose";
      go(b.dataset.go);
    }));
    root.querySelectorAll("[data-toast]").forEach((b) => b.addEventListener("click", () => toast(b.dataset.toast)));
    root.querySelectorAll("[data-gen]").forEach((b) => b.addEventListener("click", () => openGen(b.dataset.gen)));

    if (name === "home") {
      const ta = $("#prompt", root);
      ta?.addEventListener("input", () => {
        state.intent = ta.value;
        root.querySelector(".composer")?.classList.toggle("is-focus", !!ta.value.trim());
        const fore = $("#foresee", root);
        if (fore) fore.classList.toggle("is-on", ta.value.trim().length >= 8);
      });
      root.querySelectorAll("[data-medium]").forEach((b) => b.addEventListener("click", () => {
        state.medium = b.dataset.medium;
        go("home");
      }));
      $("#startHome", root)?.addEventListener("click", () => {
        const v = (ta?.value || state.intent).trim();
        if (!v) { toast("先写一句意图"); ta?.focus(); return; }
        state.intent = v;
        state.homePhase = "path";
        go("home");
      });
      ta?.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") $("#startHome", root)?.click();
      });
      root.querySelectorAll("[data-fore]").forEach((b) => b.addEventListener("click", () => {
        const t = b.dataset.fore;
        if (t === "assets") go("assets");
        else if (t === "agent") {
          state.homePhase = "compose";
          state.agentMode = "wizard";
          state.agentStep = 0;
          state.title = state.intent.slice(0, 28);
          state.content = state.intent;
          go("agent");
        } else if (t === "studio") {
          state.homePhase = "compose";
          go("studio");
        }
      }));
      root.querySelectorAll("[data-inspire]").forEach((b) => b.addEventListener("click", () => {
        state.intent = `以「${b.dataset.inspire}」为气质，生成一组可发布内容`;
        state.homePhase = "compose";
        toast("已写入意图");
        go("home");
        requestAnimationFrame(() => $("#prompt")?.focus());
      }));
      root.querySelectorAll("[data-path]").forEach((b) => b.addEventListener("click", () => {
        state.path = b.dataset.path;
        go("home");
      }));
      $("#backCompose", root)?.addEventListener("click", () => {
        state.homePhase = "compose";
        go("home");
      });
      $("#goPath", root)?.addEventListener("click", () => {
        if (!state.path) return;
        state.homePhase = "compose";
        if (state.path === "quick") {
          const m = state.medium === "image" ? "canvas" : state.medium;
          go(m === "video" || m === "canvas" || m === "voice" ? m : "video");
        } else if (state.path === "studio") go("studio");
        else {
          state.agentMode = "wizard";
          state.agentStep = 0;
          state.title = state.intent.slice(0, 28);
          state.content = state.intent;
          go("agent");
        }
      });
    }

    if (name === "studio") {
      root.querySelectorAll("[data-sacc]").forEach((b) => b.addEventListener("click", () => {
        state.studioAcc = b.dataset.sacc;
        state.studioStep = 0;
        go("studio");
      }));
      $("#studioBack", root)?.addEventListener("click", () => {
        if (state.studioStep > 0) { state.studioStep -= 1; go("studio"); }
      });
      $("#studioNext", root)?.addEventListener("click", () => {
        if (!state.studioAcc) { toast("请先选账号"); return; }
        if (state.studioStep === 2) { openGen("studio"); return; }
        if (state.studioStep >= 3) { openPack(); return; }
        state.studioStep += 1;
        go("studio");
      });
    }

    if (name === "agent") {
      $("#agentNew", root)?.addEventListener("click", () => {
        state.agentMode = "wizard";
        state.agentStep = 0;
        go("agent");
      });
      root.querySelectorAll("[data-acc]").forEach((b) => b.addEventListener("click", () => {
        const set = new Set(state.selected);
        if (set.has(b.dataset.acc)) set.delete(b.dataset.acc);
        else set.add(b.dataset.acc);
        state.selected = [...set];
        go("agent");
      }));
      $("#agentBack", root)?.addEventListener("click", () => {
        if (state.agentStep === 0) state.agentMode = "list";
        else state.agentStep -= 1;
        go("agent");
      });
      $("#agentNext", root)?.addEventListener("click", () => {
        if (state.agentStep === 1) {
          state.title = $("#aTitle", root)?.value?.trim() || "";
          state.content = $("#aContent", root)?.value?.trim() || "";
          if (!state.title || !state.content) { toast("请填写标题与正文"); return; }
        }
        if (state.agentStep >= 2) { openGen("agent"); return; }
        state.agentStep += 1;
        go("agent");
      });
    }
  }

  /* —— Shell —— */
  $("#historyList").innerHTML = HISTORY.map((h) =>
    `<button type="button" class="hist" data-go="${h.go}"><span>${esc(h.title)}</span><span>${h.tag}</span></button>`
  ).join("");

  $$(".rail__item[data-go], .brand[data-go], #historyList").forEach((el) => {
    if (el.id === "historyList") {
      el.addEventListener("click", (e) => {
        const b = e.target.closest("[data-go]");
        if (b) go(b.dataset.go);
      });
    } else {
      el.addEventListener("click", () => {
        if (el.dataset.go === "home") state.homePhase = "compose";
        go(el.dataset.go);
      });
    }
  });

  $("#prevMod").addEventListener("click", () => neighbor(-1));
  $("#nextMod").addEventListener("click", () => neighbor(1));
  $("#searchBtn").addEventListener("click", () => toast("搜索账号 / 任务 / 操作"));
  $("#creditsBtn").addEventListener("click", () => toast("积分与订阅"));

  $$("[data-close-sheet]").forEach((el) => el.addEventListener("click", closeSheets));
  $("#genPause").addEventListener("click", () => {
    state.genPaused = !state.genPaused;
    renderGenSteps();
    toast(state.genPaused ? "已暂停，可修改后再继续" : "继续生成");
  });
  $("#genFork").addEventListener("click", () => toast("已分叉一版并行生成（演示）"));
  $("#genContinue").addEventListener("click", () => {
    if (state.genPaused) {
      state.genPaused = false;
      renderGenSteps();
    } else if (state.genPhase < GEN_PHASES.length - 1) {
      state.genPhase += 1;
      renderGenSteps();
    }
  });
  $("#packConfirm").addEventListener("click", () => {
    closeSheets();
    toast("已送入发布清单");
    go("delivery");
  });

  const strip = $("#corridor");
  let t;
  strip.addEventListener("scroll", () => {
    if (scrolling) return;
    clearTimeout(t);
    t = setTimeout(() => {
      const i = Math.round(strip.scrollLeft / (strip.clientWidth || 1));
      const next = ROUTES[Math.max(0, Math.min(ROUTES.length - 1, i))];
      if (next !== state.route) {
        state.route = next;
        $("#pageTitle").textContent = TITLES[next];
        $$(".rail__item[data-go]").forEach((b) => b.classList.toggle("is-active", b.dataset.go === next));
        if (location.hash !== `#/${next}`) location.hash = `#/${next}`;
        syncTrail();
      }
    }, 70);
  }, { passive: true });

  addEventListener("keydown", (e) => {
    const tag = e.target?.tagName || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowRight") { e.preventDefault(); neighbor(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); neighbor(-1); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      toast("搜索");
    }
  });

  addEventListener("hashchange", () => {
    const key = (location.hash.replace(/^#\/?/, "") || "home").split("/")[0];
    if (ROUTES.includes(key) && key !== state.route) go(key);
  });

  ROUTES.forEach((r) => {
    const pane = $(`#pane-${r}`);
    pane.innerHTML = VIEWS[r]();
    bind(r, pane);
  });

  const start = ROUTES.includes((location.hash.replace(/^#\/?/, "") || "home").split("/")[0])
    ? (location.hash.replace(/^#\/?/, "") || "home").split("/")[0]
    : "home";
  state.route = start;
  $("#pageTitle").textContent = TITLES[start];
  syncTrail();
  $(`#pane-${start}`).scrollIntoView({ behavior: "auto", inline: "start", block: "nearest" });
  if (location.hash !== `#/${start}`) location.hash = `#/${start}`;
})();
