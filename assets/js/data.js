window.siteConfig = {
  name: "Wang Ruize",
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
  location: "",
  wechat: "",
  status: "开放全职机会",
  focus: "AI 产品 · 市场增长 · Agent 工具",
  intro: "复合学科背景，兼备文理思维、产品与市场化思维，兼备中英日多语言优势；关注前沿AI技术并活用于工作提效，具备从设计、业务到研发的协作经验，具备产品、运营增长、内容创作的实战经验。",
  summary: "新闻传播与金融复合学科背景，兼备文理思维、产品与市场化思维，以及中英日语言优势。熟悉并乐于把 AI 技术用于工作提效与调优，具备从设计到研发的跨部门协作能力，以及产品、运营增长、市场等实战经验与抗压能力。",
  mission: "把业务痛点拆成可验证的 SOP 与工具，用更低成本交付更高质量的内容与增长结果。",
  contactLead: "有合适机会，欢迎直接写信。",
  workTitle: "作品与项目",
  workLead: "爆款内容、Agent 工具与实习入口——可核验产出",
  aboutTitle: "把经历说清楚",
  journeyBracket: "[ Journey ]",
  journeyTitle: "教育背景/实习",
  journeyLead: "山东大学 / 重庆大学 · 百度 · 趣丸 · 科大讯飞 · 紫讯。可点实习条目了解详情",
  eduBracket: "[ Education ]",
  eduTitle: "教育背景",
  internBracket: "[ Internships ]",
  internTitle: "实习经历",
  labBracket: "[ Lab ]",
  labTitle: "AI 平台与工具",
  labLead: "",
  personalBracket: "[ Personal ]",
  personalTitle: "个人作品",
  workBracket: "[ Work ]",
  /* 编辑模式可隐藏的首页模块 id：journey / work */
  hiddenModules: [],
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
    },
    "tools-hub": {
      label: "工具入口封面",
      title: "进入工具体验",
      subtitle: "Wefly Agent · 星阵画布 · 选题搜集工具，面试可打开静态 Demo。",
      coverUrl: "assets/covers/tools-hub-cover.jpg"
    },
    "personal-works": {
      label: "个人作品封面",
      title: "实拍与 AIGC 作品",
      subtitle: "纪录片、故事片与 AIGC 成片说明；精选合集见飞书，面试可按需打开。",
      coverUrl: "assets/covers/personal-works-cover.jpg"
    }
  }
};

/* 简历+作品集默认板块顺序（可在编辑器里上下调整） */
window.defaultSectionOrder = [
  "home",
  "journey",
  "tools",
  "personal",
  "work"
];

window.sectionMeta = {
  home: { label: "Home" },
  journey: { label: "Journey" },
  tools: { label: "Lab" },
  personal: { label: "Personal" },
  work: { label: "Work" }
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
    titleCn: "山东大学 （985）新闻传播学硕士",
    year: 2027,
    category: "游戏",
    categoryCn: "教育",
    type: "text",
    format: "Education",
    coverUrl: "assets/covers/journey/edu-sdu.jpg",
    externalUrl: "",
    timelineSubTag: "2024.9-2027.6",
    tags: ["Master", "Journalism"],
    summaryCn: "新闻传播学硕士在读，计算传播方向，GPA（90.2/100）；参与国家社会科学基金项目科研活动，负责著作九国数字内容出版领域的日语板块，在期刊论文中通过大批量文本的深度学习微调及自然语言处理进行统计分析。担任山东大学宣传部干事和影视协会指导，获得山东大学一等奖学金。",
    accent: "cyan",
    journeyCoverUrl: "assets/covers/journey/edu-sdu.jpg"
  },
  {
    id: "edu-cqu",
    order: 2,
    title: "Chongqing University",
    titleCn: "重庆大学（985）广播电视编导 / 金融学双学位学士",
    year: 2024,
    category: "游戏",
    categoryCn: "教育",
    type: "text",
    format: "Education",
    coverUrl: "assets/covers/journey/edu-cqu.jpg",
    externalUrl: "",
    timelineSubTag: "2020.9-2024.6",
    tags: ["Bachelor", "Dual Degree"],
    summaryCn: "广播电视编导与金融学双学位，GPA（3.82/4.0），曾获得四次综合奖学金，2024届重庆大学优秀毕业生。参与纪录片、故事片等六部作品创作，在校展映并获张国立、米家山等业内专家肯定。",
    accent: "lime",
    journeyCoverUrl: "assets/covers/journey/edu-cqu.jpg"
  },
  {
    id: "exp-baidu",
    order: 3,
    title: "Baidu ACG Cloud",
    titleCn: "百度 ACG 智能云 · 市场部",
    year: 2026,
    category: "电商",
    categoryCn: "实习",
    type: "text",
    format: "Experience",
    coverUrl: "assets/covers/journey/exp-baidu.jpg",
    externalUrl: "detail.html#/experience/baidu",
    timelineSubTag: "2026.06至今",
    tags: ["Marketing", "SOP", "AI"],
    summaryCn: "平台搭建：针对矩阵号从 0 到 1 运营及物料需求痛点，整合业务生产流程，独立搭建自动化 AIGC 平台并推广至智能云市场部；支持物料批量到数据闭环，单人日产图组及视频物料可达 100+，综合成本下降 70%以上传播推广：负责百度搭子、秒哒等百度主推 AI 产品、影视飓风传播事件、世界人工智能大会传播的线上传播选题 SOP 工具：针对选题定制搭建信息/选题工具，支持爆款语料获取与选题输出，提升组内内容生产效率",
    accent: "lime",
    featured: false,
    journeyCoverUrl: "assets/covers/journey/exp-baidu.jpg"
  },
  {
    id: "exp-quwan",
    order: 4,
    title: "Quwan Product Intern",
    titleCn: "趣丸科技 · AI产品经理实习生",
    year: 2026,
    category: "游戏",
    categoryCn: "实习",
    type: "text",
    format: "Experience",
    coverUrl: "assets/covers/journey/exp-quwan.jpg",
    externalUrl: "detail.html#/experience/quwan",
    timelineSubTag: "2026.04-2026.06",
    tags: ["Product", "Agent", "Figma"],
    summaryCn: "归因分析：针对 Wefly 广告投放与数据平台无法评估投放素材质量的业务痛点，梳理广告投放与物料制作业务流程，设计 Figma 交互原型，协同业务与算法团队建立素材评分规则，落地 Agent 素材归因能力工作流整合：针对素材反复导出、即梦账号切换、重复抽卡及复盘成本高的业务痛点，推进元境 AIGC 无限画布接入 Agent 平台，打通广告投放、数据追踪与物料生产链路，业务统计提效约 25%，广告 ROI 提升 8%",
    accent: "violet",
    journeyCoverUrl: "assets/covers/journey/exp-quwan.jpg"
  },
  {
    id: "exp-iflytek",
    order: 5,
    title: "iFLYTEK Product Ops",
    titleCn: "科大讯飞 · AI产品运营",
    year: 2026,
    category: "电商",
    categoryCn: "实习",
    type: "text",
    format: "Experience",
    coverUrl: "assets/covers/journey/exp-iflytek.jpg",
    externalUrl: "detail.html#/experience/iflytek",
    timelineSubTag: "2025.10-2026.01",
    tags: ["Ads", "Facebook", "LinkedIn"],
    summaryCn: "广告投流：以 AI 智能家居中控产品 Wallex 获客询盘为目的，在社媒平台投流策略并参与素材制作，通过 WhatsApp 完成投流到销售闭环，全口径浏览人次 30w+，月平均吸引询盘 560+，线索初步有效率约 20%营销工作：Facebook 和 X 平台账号运营；参与品牌升级，对产品官网迭代负责；支持商务与展会物料交付",
    accent: "cyan",
    journeyCoverUrl: "assets/covers/journey/exp-iflytek.jpg"
  },
  {
    id: "exp-sellerpic",
    order: 6,
    title: "SellerPic Content Ops",
    titleCn: "紫讯 SellerPic · AI 内容运营",
    year: 2025,
    category: "APP",
    categoryCn: "实习",
    type: "text",
    format: "Experience",
    coverUrl: "assets/covers/journey/exp-sellerpic.jpg",
    externalUrl: "detail.html#/experience/zixun",
    timelineSubTag: "2025.06-2025.09",
    tags: ["YouTube", "AIGC", "Growth"],
    summaryCn: "市场洞察：搜集用户需求与行业动态、爬取分析 50+AIGC 类竞品的宣传信息与物料，输出内容策略账号运营：Youtube 海外账号运营与内容创作，5k 播放以上有 8 条，50k 以上 3 条，200k 爆款 2 条，配合广告投放实现总浏览量由 20w 到 102w+，订阅人数由 300+增长至 2200+，另参与 100+KOL 联动传播",
    accent: "lime",
    journeyCoverUrl: "assets/covers/journey/exp-sellerpic.jpg"
  },
  {
    id: "exp-bytedance",
    order: 7,
    title: "ByteDance Dongchedi",
    titleCn: "字节跳动 · 内容运营",
    year: 2023,
    category: "APP",
    categoryCn: "实习",
    type: "text",
    format: "Experience",
    coverUrl: "assets/covers/journey/exp-bytedance.jpg",
    externalUrl: "",
    timelineSubTag: "2023.09-2023.11",
    tags: ["Live", "Ops", "Analytics"],
    summaryCn: "参与懂车帝相关直播平台功能规划、引流策略与场景落地；场均在线 300+，用户转化率 10%+。负责宣传短视频创作与投放配合，并完成直播相关数据采集、清洗、整合与可视化分析，支撑运营决策。",
    accent: "violet",
    journeyCoverUrl: "assets/covers/journey/exp-bytedance.jpg"
  },
  {
    id: "proj-aigc-shot",
    order: 8,
    title: "AIGC & Live Works",
    titleCn: "AIGC 与实拍作品",
    year: 2025,
    category: "APP",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
    externalUrl: "detail.html#/works",
    timelineSubTag: "持续更新",
    tags: ["AIGC", "Documentary", "Viral"],
    summaryCn: "AIGC 视频图片与实拍纪录片、故事片精选，覆盖提示词设计、风格控制与摄制剪辑全流程。",
    accent: "violet",
    featured: true
  },
  {
    id: "proj-agent-tools",
    order: 9,
    title: "Agent Platforms & Tools",
    titleCn: "Agent 平台与工具",
    year: 2026,
    category: "Vibe Coding",
    categoryCn: "作品",
    type: "text",
    format: "Project",
    coverUrl: "assets/covers/journey/proj-agent-tools.jpg",
    externalUrl: "detail.html#/tools",
    timelineSubTag: "2025-2026",
    tags: ["Agent", "SOP", "Tooling"],
    summaryCn: "Wefly 广告投放 Agent、星阵市场闭环平台与信息提取选题工具等 Agent / SOP 产出。",
    accent: "lime",
    featured: true,
    journeyCoverUrl: "assets/covers/journey/proj-agent-tools.jpg"
  },
  {
    id: "entry-baidu",
    order: 10,
    title: "Baidu Internship",
    titleCn: "百度 智能云市场部",
    year: 2026,
    category: "电商",
    categoryCn: "实习入口",
    type: "text",
    format: "Project",
    coverUrl: "assets/covers/journey/entry-baidu.jpg",
    externalUrl: "detail.html#/experience/baidu",
    timelineSubTag: "百度 · 详细子页",
    tags: ["Baidu", "Marketing", "SOP"],
    summaryCn: "进入百度 ACG 智能云市场部详细经历页：星阵平台、选题工具与主推产品传播。",
    accent: "lime",
    featured: true,
    journeyCoverUrl: "assets/covers/journey/entry-baidu.jpg"
  },
  {
    id: "entry-quwan",
    order: 11,
    title: "Quwan Internship",
    titleCn: "趣丸 Agent 产品经理",
    year: 2026,
    category: "游戏",
    categoryCn: "实习入口",
    type: "text",
    format: "Project",
    coverUrl: "assets/covers/journey/entry-quwan.jpg",
    externalUrl: "detail.html#/experience/quwan",
    timelineSubTag: "趣丸 · 详细子页",
    tags: ["Quwan", "Product", "Agent"],
    summaryCn: "进入趣丸产品实习详细页：Wefly Agent、素材归因与元境工作流。",
    accent: "violet",
    featured: true,
    journeyCoverUrl: "assets/covers/journey/entry-quwan.jpg"
  },
  {
    id: "entry-iflytek",
    order: 12,
    title: "iFLYTEK Internship",
    titleCn: "科大讯飞 AI 产品运营",
    year: 2026,
    category: "电商",
    categoryCn: "实习入口",
    type: "text",
    format: "Project",
    coverUrl: "assets/covers/journey/entry-iflytek.jpg",
    externalUrl: "detail.html#/experience/iflytek",
    timelineSubTag: "讯飞 · 详细子页",
    tags: ["iFLYTEK", "Ads", "Ops"],
    summaryCn: "进入科大讯飞产品运营详细页：Wallex 海外投流、官网与社媒。",
    accent: "cyan",
    featured: true,
    journeyCoverUrl: "assets/covers/journey/entry-iflytek.jpg"
  },
  {
    id: "entry-sellerpic",
    order: 13,
    title: "SellerPic Internship",
    titleCn: "紫讯 AI内容运营",
    year: 2025,
    category: "APP",
    categoryCn: "实习入口",
    type: "text",
    format: "Project",
    coverUrl: "assets/covers/journey/entry-sellerpic.jpg",
    externalUrl: "detail.html#/experience/zixun",
    timelineSubTag: "紫讯 · 详细子页",
    tags: ["SellerPic", "YouTube", "Growth"],
    summaryCn: "进入紫讯 SellerPic 详细页：YouTube 增长、KOL 与内容策略。",
    accent: "cyan",
    featured: true,
    journeyCoverUrl: "assets/covers/journey/entry-sellerpic.jpg"
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
    title: "教育背景",
    eyebrow: "Education",
    description: "学历与知识结构起点。",
    duration: 36,
    itemIds: ["edu-sdu", "edu-cqu"]
  },
  {
    id: "experience",
    className: "industry-track-commerce",
    title: "实习经历",
    eyebrow: "Internships",
    description: "四段可讲述的实习主线。",
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
