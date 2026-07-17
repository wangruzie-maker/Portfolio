window.siteConfig = {
  name: "王瑞泽",
  nameZh: "王瑞泽",
  nameFirst: "王瑞泽",
  nameLast: "",
  /* Hero 螺旋阶梯上的能力关键词（按时间顺序，自下而上攀升） */
  heroKeywords: [
    { year: "2020", text: "编导 × 金融 双学位" },
    { year: "2023", text: "直播运营 · 数据分析" },
    { year: "2024", text: "新传硕士 · NLP 研究" },
    { year: "2025", text: "海外内容增长" },
    { year: "2025", text: "广告投流获客" },
    { year: "2026", text: "Agent 产品设计" },
    { year: "2026", text: "市场 SOP × Vibe Coding" }
  ],
  /* 关键词动效：shiny 金色流光 / blur 模糊渐显 / decrypt 乱码解密 / gradient 渐变流动 */
  heroKeywordEffect: "gradient",
  tagline: "Portfolio",
  taglineZh: "作品集",
  role: "产品 / 市场 / AI 内容",
  email: "wangruzie@gmail.com",
  phone: "15315189380",
  location: "济南 / 北京 · 可远程",
  wechat: "",
  status: "电话 15315189380 · 开放全职机会",
  focus: "产品体验 / 市场增长 / AI 工具",
  intro: "新闻传播与金融复合背景，用产品思维与 vibe coding 把营销、投放、内容生产做成可复用的 SOP 与工具。",
  summary: "新闻传播与金融复合学科背景，兼备文理思维、产品与市场化思维，以及中英日语言优势。熟悉并乐于把 AI 技术用于工作提效与调优，具备从设计到研发的跨部门协作能力，以及产品、运营增长、市场等实战经验与抗压能力。",
  mission: "把业务痛点拆成可验证的 SOP 与工具，用更低成本交付更高质量的内容与增长结果。",
  contactLead: "有合适机会，欢迎直接写信。",
  workTitle: "精选作品与可验证项目。",
  workLead: "从智能云市场 SOP、广告 Agent，到海外内容增长——每张卡片对应一段可核验的结果。",
  aboutTitle: "把经历说清楚",
  feishuUrl: "",
  heroVideo: "",
  heroPoster: "",
  introVideo: "",
  tags: [
    "英语六级",
    "日语 N1",
    "Claude / Cursor",
    "Vibe Coding",
    "Figma / 墨刀",
    "Python / SPSS",
    "PS / PR / AU",
    "跨团队协作"
  ],
  socials: [
    { name: "Email", icon: "assets/icons/github.svg", url: "mailto:wangruzie@gmail.com" },
    { name: "Phone", icon: "assets/icons/xiaohongshu.svg", url: "tel:15315189380" }
  ],
  slots: {
    "hero-portrait": {
      label: "Hero 肖像",
      title: "王瑞泽",
      subtitle: "产品 / 市场 / AI 内容",
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
  { key: "游戏", cn: "产品能力", icon: "game", summary: "需求拆解、原型推进、Agent 与跨团队协作。", link: "" },
  { key: "电商", cn: "市场增长", icon: "commerce", summary: "多平台推广、投放获客、矩阵内容与账号运营。", link: "" },
  { key: "APP", cn: "内容运营", icon: "phone", summary: "海外账号、短视频、直播与品牌物料。", link: "" },
  { key: "Vibe Coding", cn: "AI 工具", icon: "code", summary: "SOP 平台、信息提取、数据分析与自动化。", link: "" }
];

window.portfolioWorks = [
  {
    id: "edu-sdu",
    order: 1,
    title: "Shandong University",
    titleCn: "山东大学 · 新闻传播学硕士",
    year: 2027,
    category: "游戏",
    categoryCn: "教育",
    type: "text",
    format: "Education",
    coverUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2024.9-2027.6",
    tags: ["Master", "Journalism"],
    summaryCn: "新闻传播学硕士在读；参与国社科等科研，负责日语板块与大批量文本的深度学习微调及自然语言处理。",
    accent: "cyan"
  },
  {
    id: "edu-cqu",
    order: 2,
    title: "Chongqing University",
    titleCn: "重庆大学 · 广电编导 / 金融学双学位学士",
    year: 2024,
    category: "游戏",
    categoryCn: "教育",
    type: "text",
    format: "Education",
    coverUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2020.9-2024.6",
    tags: ["Bachelor", "Dual Degree"],
    summaryCn: "广播电视编导与金融学双学位；四次综合奖学金，优秀毕业生。参与纪录片等六部作品创作，在校展映并获业内肯定。",
    accent: "lime"
  },
  {
    id: "exp-baidu",
    order: 3,
    title: "Baidu ACG Cloud",
    titleCn: "百度 ACG 智能云 · 市场部",
    year: 2026,
    category: "电商",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2025.06至今",
    tags: ["Marketing", "SOP", "AI"],
    summaryCn: "将市场部营销需求 SOP 化，自建物料创作到数据闭环平台，支持 80 个矩阵号图文/视频较高质量、低成本自动化生产，并推广至智能云全体市场部。负责百度搭子、秒哒等 AI 产品与 WAIC 等多平台推广；独立搭建信息提取与爆款复刻工具，实现组内提效与内容质量优化。",
    accent: "lime",
    featured: false
  },
  {
    id: "exp-quwan",
    order: 4,
    title: "Quwan Product Intern",
    titleCn: "趣丸科技 · 产品实习生",
    year: 2026,
    category: "游戏",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2025.04-2026.06",
    tags: ["Product", "Agent", "Figma"],
    summaryCn: "协助搭建 Wefly 广告投放及信息流素材制作 Agent 平台，以 Figma 输出需求与原型；梳理业务流程并封装为 Skill；与业务、算法协作整合结构化标签引擎，优化素材归因；推进 Agent 与内部 AIGC 工具「元境」接入，打通从广告投放到物料制作的业务闭环。",
    accent: "violet"
  },
  {
    id: "exp-iflytek",
    order: 5,
    title: "iFLYTEK Product Ops",
    titleCn: "科大讯飞 · 产品运营",
    year: 2026,
    category: "电商",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2025.10-2026.01",
    tags: ["Ads", "Facebook", "LinkedIn"],
    summaryCn: "以 AI 智能家居中控 Wallex 获客询盘为目标，在 Facebook、领英制定投流策略并参与素材制作：全口径浏览 30万+，月均询盘 560+，初步有效率约 20%；对接海外销售跟单。同时负责 Facebook / X 账号运营，参与品牌升级与网页迭代，支持展会物料。",
    accent: "cyan"
  },
  {
    id: "exp-sellerpic",
    order: 6,
    title: "SellerPic Content Ops",
    titleCn: "紫讯 SellerPic · AI 内容运营",
    year: 2025,
    category: "APP",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2025.06-2025.09",
    tags: ["YouTube", "AIGC", "Growth"],
    summaryCn: "用 Python 爬取分析 50 余家 AIGC 竞品宣传信息并输出内容策略；主导 YouTube 等海外账号运营与创作（30 余条），配合投放将总浏览从 20 万提升至 102 万，订阅从 300+ 增至 2200+，并参与 100+ KOL 联动。",
    accent: "lime"
  },
  {
    id: "exp-bytedance",
    order: 7,
    title: "ByteDance Dongchedi",
    titleCn: "字节跳动懂车帝 · 直播运营",
    year: 2023,
    category: "APP",
    categoryCn: "工作经历",
    type: "text",
    format: "Experience",
    coverUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2023.09-2023.11",
    tags: ["Live", "Ops", "Analytics"],
    summaryCn: "参与直播平台功能规划、引流策略与场景落地；场均在线 300+，用户转化率 10%+。负责宣传短视频创作，并完成数据采集、清洗、整合与可视化分析。",
    accent: "violet"
  },
  {
    id: "proj-xingzhen",
    order: 8,
    title: "Xingzhen Marketing Loop",
    titleCn: "星阵市场闭环平台",
    year: 2026,
    category: "Vibe Coding",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "百度 · 至今",
    tags: ["SOP", "Matrix", "Automation"],
    summaryCn: "自建物料创作到数据闭环平台，支撑 80 个矩阵号高质量低成本自动化生产，已推广至智能云全体市场部。",
    accent: "lime",
    featured: true
  },
  {
    id: "proj-wefly-agent",
    order: 9,
    title: "Wefly Ads Agent",
    titleCn: "Wefly Agent 平台产出",
    year: 2026,
    category: "Vibe Coding",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "趣丸 · 2025-2026",
    tags: ["Agent", "Ads", "AIGC"],
    summaryCn: "广告投放与信息流素材 Agent 平台的需求原型、Skill 封装与中台闭环产出。",
    accent: "violet",
    featured: true
  },
  {
    id: "proj-info-tool",
    order: 10,
    title: "Insight & Topic Tools",
    titleCn: "信息提取与选题工具",
    year: 2026,
    category: "Vibe Coding",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2026",
    tags: ["Tooling", "Insight", "Topics"],
    summaryCn: "面向内容团队的信息提取与爆款选题工具，覆盖采集、拆解到复刻的完整链路。",
    accent: "cyan",
    featured: true
  },
  {
    id: "proj-aigc-media",
    order: 11,
    title: "AIGC Media Works",
    titleCn: "AIGC 视频与图片作品",
    year: 2025,
    category: "APP",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "持续更新",
    tags: ["AIGC", "Video", "Image"],
    summaryCn: "AIGC 生成的视频与图片作品精选，展示提示词设计、风格控制与后期整合能力。",
    accent: "violet",
    featured: true
  },
  {
    id: "proj-docufilm",
    order: 12,
    title: "Documentary & Film",
    titleCn: "实拍纪录片与故事片",
    year: 2024,
    category: "APP",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "2020-2024",
    tags: ["Documentary", "Film", "Directing"],
    summaryCn: "参与编导与摄制的实拍纪录片、故事片精选，覆盖策划、拍摄与剪辑全流程。",
    accent: "cyan",
    featured: true
  },
  {
    id: "proj-sellerpic-growth",
    order: 13,
    title: "SellerPic YouTube Growth",
    titleCn: "SellerPic 海外账号增长",
    year: 2025,
    category: "APP",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fdf1?auto=format&fit=crop&w=900&q=80",
    externalUrl: "",
    timelineSubTag: "紫讯 · 2025",
    tags: ["YouTube", "Growth", "KOL"],
    summaryCn: "以竞品洞察驱动内容策略，YouTube 等内容将总浏览 20万→102万、订阅 300+→2200+，并联动 100+ KOL 传播。",
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
  descriptionZh: "从重庆大学、山东大学到百度、趣丸等岗位的连续轨迹。",
  descriptionEn: "From Chongqing / Shandong University to Baidu, Quwan, and growth roles."
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
    itemIds: ["edu-sdu", "edu-cqu"]
  },
  {
    id: "experience",
    className: "industry-track-commerce",
    title: "工作经历",
    eyebrow: "Experience",
    description: "主要岗位与阶段性成果。",
    duration: 48,
    itemIds: [
      "exp-baidu",
      "exp-quwan",
      "exp-iflytek",
      "exp-sellerpic",
      "exp-bytedance"
    ]
  }
];
