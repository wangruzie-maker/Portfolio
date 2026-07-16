window.siteConfig = {
  name: "你的姓名",
  nameZh: "你的姓名",
  nameFirst: "你的",
  nameLast: "姓名",
  tagline: "Portfolio",
  taglineZh: "作品集",
  role: "产品 / 运营 / 内容方向",
  email: "your.name@example.com",
  location: "上海 · 可远程",
  wechat: "",
  status: "开放机会 · 全职 / 合作",
  focus: "产品体验 / 内容增长 / AI 工具",
  intro: "用清晰的内容结构和可验证的项目成果，让招聘方快速理解你是谁、能做什么、正在寻找什么机会。",
  summary: "我是一名关注效率与内容表达的实践者，擅长把复杂问题拆成可执行方案，并把专业判断整理成容易被理解的表达。希望在产品、内容或工具相关方向找到能长期深耕的合作机会。",
  mission: "用清晰结构与可验证结果，降低沟通成本，让机会更快对上。",
  contactLead: "Let’s design something that lasts.",
  workTitle: "精选作品与可验证项目。",
  workLead: "每张卡片是一段可讲述的结果：角色、方法、与可核验的产出。",
  aboutTitle: "把经历说清楚",
  feishuUrl: "",
  heroVideo: "",
  heroPoster: "",
  introVideo: "",
  tags: ["产品思维", "内容增长", "项目管理", "用户研究", "数据分析", "跨团队协作"],
  socials: [
    { name: "Email", icon: "assets/icons/github.svg", url: "mailto:your.name@example.com" },
    { name: "Portfolio", icon: "assets/icons/xiaohongshu.svg", url: "" }
  ],
  slots: {
    "hero-portrait": {
      label: "Hero 肖像",
      title: "Profile",
      subtitle: "产品 / 运营 / 内容方向",
      coverUrl: "assets/hero/portrait-placeholder.png"
    },
    "about-side": {
      label: "About 配图",
      title: "",
      subtitle: "",
      coverUrl: ""
    }
  }
};

/* 简历+作品集默认板块顺序（可在编辑器里上下调整） */
window.defaultSectionOrder = [
  "home",
  "about",
  "journey",
  "work",
  "contact"
];

window.sectionMeta = {
  home: { label: "Hero" },
  about: { label: "About 关于" },
  journey: { label: "Journey 经历" },
  work: { label: "Work 作品" },
  contact: { label: "Contact 联系" }
};

/* Categories power highlight metric-cards. link 留空则不跳转。 */
window.portfolioCategories = [
  { key: "All", cn: "全部", icon: "all", summary: "全部能力方向。", link: "" },
  { key: "游戏", cn: "产品能力", icon: "game", summary: "需求拆解、用户研究、跨团队协作与原型推进。", link: "" },
  { key: "电商", cn: "内容能力", icon: "commerce", summary: "选题策划、信息架构、文案表达与多平台分发。", link: "" },
  { key: "APP", cn: "交付能力", icon: "phone", summary: "项目管理、节奏把控、复盘沉淀与结果导向。", link: "" },
  { key: "Vibe Coding", cn: "工具能力", icon: "code", summary: "数据分析、自动化工作流、Notion 与协作工具。", link: "" }
];

window.portfolioWorks = [
  {
    id: "edu-bachelor",
    order: 1,
    title: "Bachelor Degree",
    titleCn: "你的学校 · 学士学位",
    year: 2018,
    category: "游戏",
    categoryCn: "教育",
    type: "text",
    format: "Education",
    coverUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "教育",
    tags: ["Education", "2014-2018"],
    summaryCn: "主修专业相关课程，积累与职业方向相关的基础能力。",
    accent: "cyan"
  },
  {
    id: "exp-current",
    order: 2,
    title: "Current Role",
    titleCn: "当前角色 / 方向",
    year: 2026,
    category: "电商",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "至今",
    tags: ["Full-time", "Lead"],
    summaryCn: "围绕业务目标推进关键项目，连接用户反馈与执行方案。",
    accent: "lime",
    featured: false
  },
  {
    id: "exp-growth",
    order: 3,
    title: "Growth Role",
    titleCn: "内容 / 增长相关职位",
    year: 2024,
    category: "电商",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2021-2024",
    tags: ["Content", "Growth"],
    summaryCn: "负责策略制定、执行推进与结果复盘，建立稳定产出节奏。",
    accent: "violet"
  },
  {
    id: "exp-ops",
    order: 4,
    title: "Operations Role",
    titleCn: "产品 / 运营相关职位",
    year: 2021,
    category: "APP",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2018-2021",
    tags: ["Ops", "Product"],
    summaryCn: "参与用户调研、需求梳理与功能上线，沉淀协作模板。",
    accent: "cyan"
  },
  {
    id: "proj-resume",
    order: 5,
    title: "Resume Site",
    titleCn: "个人简历主页",
    year: 2026,
    category: "Vibe Coding",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "作品",
    tags: ["Web", "Resume"],
    summaryCn: "可编辑的个人简历站，集中展示经历与联系方式。",
    accent: "lime",
    featured: true
  },
  {
    id: "proj-growth-flow",
    order: 6,
    title: "Growth Workflow",
    titleCn: "内容增长工作流",
    year: 2025,
    category: "Vibe Coding",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "作品",
    tags: ["Growth", "Ops"],
    summaryCn: "整合选题、写作与复盘流程，提升团队内容生产效率。",
    accent: "violet",
    featured: true
  },
  {
    id: "proj-knowledge",
    order: 7,
    title: "Knowledge Base",
    titleCn: "项目协作知识库",
    year: 2024,
    category: "APP",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "作品",
    tags: ["Docs", "Collab"],
    summaryCn: "沉淀渠道表现、项目经验与方法论，支持持续迭代。",
    accent: "cyan",
    featured: true
  }
];

window.dragonCovenantSeries = {
  id: "resume-series",
  titleEn: "Career",
  titleZh: "职业轨迹",
  gameUrl: "",
  finaleUrl: "",
  indexMotionUrl: "",
  indexPosterUrl: "",
  descriptionZh: "从教育到工作再到作品沉淀的连续轨迹。",
  descriptionEn: "A continuous track from education to work and portfolio."
};

window.workflowSteps = [
  ["01", "Listen", "理解需求"],
  ["02", "Frame", "问题定义"],
  ["03", "Plan", "方案拆解"],
  ["04", "Build", "推进落地"],
  ["05", "Measure", "验证结果"],
  ["06", "Iterate", "复盘迭代"],
  ["07", "Archive", "沉淀复用"]
];

window.vibeWorkflowSteps = [
  ["01", "Research", "调研输入"],
  ["02", "Structure", "信息结构"],
  ["03", "Write", "内容表达"],
  ["04", "Align", "对齐协作"],
  ["05", "Ship", "按时交付"],
  ["06", "Review", "复盘归档"]
];

/* 经历时间线只放教育+工作；作品进独立 Works 板块 */
window.resumeTracks = [
  {
    id: "education",
    className: "industry-track-game",
    title: "教育",
    eyebrow: "Education",
    description: "学历与知识结构起点。",
    duration: 36,
    itemIds: ["edu-bachelor"]
  },
  {
    id: "experience",
    className: "industry-track-commerce",
    title: "工作经历",
    eyebrow: "Experience",
    description: "主要岗位与阶段性成果。",
    duration: 48,
    itemIds: ["exp-current", "exp-growth", "exp-ops"]
  }
];
