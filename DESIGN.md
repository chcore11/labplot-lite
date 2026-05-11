---
name: LabPlot Lite
description: 对齐 Moonshot 式黑白灰秩序的学生实验绘图工具
colors:
  moon-black: "oklch(1.5% 0 0)"
  deep-graphite: "oklch(7.8% 0 0)"
  graphite: "oklch(12.5% 0 0)"
  graphite-raised: "oklch(17% 0 0)"
  graphite-line: "oklch(100% 0 0 / 0.12)"
  graphite-line-strong: "oklch(100% 0 0 / 0.42)"
  text-primary: "oklch(96% 0 0)"
  text-secondary: "oklch(96% 0 0 / 0.66)"
  text-muted: "oklch(62% 0 0)"
  text-faint: "oklch(96% 0 0 / 0.42)"
  white-wash: "oklch(96% 0 0 / 0.05)"
  white-hover: "oklch(96% 0 0 / 0.08)"
  focus-glow: "oklch(96% 0 0 / 0.28)"
  plot-paper: "oklch(97% 0.004 260)"
  plot-ink: "oklch(16% 0.005 260)"
  plot-muted: "oklch(48% 0.006 260)"
  plot-line: "oklch(76% 0.004 260 / 0.36)"
  state-success: "oklch(72% 0.08 155)"
  state-warning: "oklch(78% 0.1 82)"
  state-danger: "oklch(70% 0.11 28)"
typography:
  display:
    fontFamily: "MiSans, PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "56px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
  section:
    fontFamily: "MiSans, PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.28
    letterSpacing: "0"
  title:
    fontFamily: "MiSans, PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.52
    letterSpacing: "0"
  body:
    fontFamily: "PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.52
    letterSpacing: "0"
  label:
    fontFamily: "PingFang SC, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 450
    lineHeight: "20px"
    letterSpacing: "0"
  mono:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Cascadia Mono, Roboto Mono, Consolas, Liberation Mono, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  control-pill: "999px"
  card: "16px"
  panel: "12px"
  small: "4px"
spacing:
  page-x: "80px"
  page-x-tablet: "48px"
  page-x-mobile: "24px"
  section-y: "80px"
  section-gap: "96px"
  cluster-gap: "24px"
  control-pad: "12px 20px"
components:
  cta-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control-pill}"
    padding: "{spacing.control-pad}"
    typography: "{typography.label}"
  panel:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "24px"
  media-card:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.card}"
    padding: "0"
  input:
    backgroundColor: "oklch(20% 0 0 / 0.30)"
    textColor: "{colors.text-primary}"
    rounded: "24px"
    padding: "18px 12px 12px"
---

# Design System: LabPlot Lite

## 1. Overview

**Creative North Star: "黑场科学工作台"**

LabPlot Lite 的视觉系统应向 Moonshot 官网的克制黑场、清晰文字秩序和低色彩密度靠拢。界面第一感受不是“AI 工具”，不是彩色科技感，而是安静、精确、可信：大面积黑白灰，少量半透明边界，明确分区，短句标题和直接行动。

LabPlot Lite 仍然是实验绘图工具，不复制 Moonshot 的品牌、内容和动态视觉。对齐的是设计方法：黑色背景承载专注，灰阶建立层级，按钮像轻量入口而不是营销按钮，内容区靠留白和排版组织，而不是靠装饰色、卡片堆叠或夸张图形。

工作台必须比官网更可操作。Moonshot 式留白用于 landing、模式选择和说明区；进入功能模式后，仍然保留表格、输入、步骤和结果面板，但它们要被压进同一套黑白灰秩序里。图表导出区域可以使用白底，因为学生最终需要报告图件，但白底只属于图表和结果交付，不扩散成整站纸面主题。

**Key Characteristics:**

- 黑白灰优先：品牌层面不使用绿、琥珀、紫、蓝作为主视觉。
- 低装饰：少图标、少徽章、少彩色状态，避免 AI 模板感。
- 大留白：landing 和说明区使用 80px 级别分区间距，移动端收敛到 24px。
- 轻 CTA：圆角 pill、细边框、透明背景、hover 时轻微显现箭头或浅白底。
- 内容可信：图表、拟合指标和导出结果必须保持严谨可查，不被品牌视觉淹没。

## 2. Colors

调色板从 Moonshot 的黑色背景、白色文字、灰色说明和低透明白边界中抽象出来。彩色只用于数据曲线和语义状态，不作为品牌装饰。

### Primary

- **Moon Black** (`moon-black`): 页面主背景和 landing 主视觉底色。它是沉静黑场，不是炫酷深色渐变。
- **White Text** (`text-primary`, `text-secondary`): 主标题、按钮和关键说明。主要层级通过透明度变化，而不是彩色变化。

### Secondary

- **Graphite Surfaces** (`deep-graphite`, `graphite`, `graphite-raised`): 用于工作台面板、示例卡、下载区和浮层。面板之间的差异应细微。
- **Ghost Lines** (`graphite-line`, `graphite-line-strong`): 用于边框、分隔线、pill 按钮和 focus 前的结构线。

### Tertiary

- **Plot Paper** (`plot-paper`, `plot-ink`, `plot-line`): 只用于图表画布、导出预览和报告图件。它是结果材质，不是页面主主题。
- **Semantic Signals** (`state-success`, `state-warning`, `state-danger`): 只用于状态、错误、警告和可访问性提示。禁止扩大为品牌色。

### Neutral

- **Muted Grey** (`text-muted`, `text-faint`): 用于描述、日期、辅助说明和禁用状态。
- **White Wash** (`white-wash`, `white-hover`): 用于 hover、选中、轻背景和玻璃感输入底，但透明度必须克制。

### Named Rules

**The Monochrome First Rule.** 默认任何新界面都先用黑、白、灰完成层级；只有语义状态和数据曲线允许使用彩色。

**The No Accent Branding Rule.** 不允许再用墨绿、琥珀、紫蓝渐变或荧光色作为 LabPlot Lite 的品牌主色。

**The Plot Paper Boundary Rule.** 白底只属于图表和导出结果，不要把整站改成报告纸主题。

## 3. Typography

- **Display Font:** MiSans / PingFang SC with system fallbacks
- **Body Font:** PingFang SC with system fallbacks
- **Label/Mono Font:** SFMono-Regular family for metrics, code, dimensions

**Character:** 排版应像 Moonshot 官网一样克制、轻、留白充足。标题不靠大字压迫用户，而靠短句、居中或强对齐和灰阶对比建立秩序。

### Hierarchy

- **Display** (500, 56px, 1.2): 用于 landing 主标题或功能模式大标题。只出现一次，不能在工作台内反复使用。
- **Section** (500, 32px, 1.28): 用于主要分区标题，例如示例流程、产品能力、结果下载。
- **Title** (500, 18px, 1.52): 用于卡片标题、步骤标题和模式选择标题。
- **Body** (400, 18px, 1.52): 用于产品说明和引导句，文字必须短，不写重复标题的段落。
- **Label** (450, 14px, 20px): 用于 CTA、日期、辅助说明和小型控件。
- **Mono** (500, 13px, 1.45): 用于列名、R²、RMSE、MAE、DPI、导出尺寸和数值摘要。

### Named Rules

**The Quiet Type Rule.** 字重保持 400 到 500 为主，只有关键工具标签可到 600。禁止到处使用 760 以上的强粗体。

**The Short Sentence Rule.** 所有首页说明文字以一到两句为限；工作台提示只说下一步动作和判断依据。

## 4. Elevation

系统应几乎不依赖投影。Moonshot 式深度来自黑场、半透明白边、微弱灰阶层和图片/视频材质。LabPlot Lite 的工作台也应以边界和层级为主，只有大型浮层或结果容器允许轻微发光。

### Shadow Vocabulary

- **Focus Glow** (`0 0 40px oklch(96% 0 0 / 0.24)`): 只用于聚焦输入、关键生成区域或当前步骤，不用于普通卡片。
- **Inset Hairline** (`inset 1px 1px 0 -0.5px oklch(100% 0 0 / 0.10)`): 可用于输入、图表容器或重要面板的内部精致边界。
- **No Default Shadow** (`none`): 普通卡片、表单、示例项和下载项默认无外投影。

### Named Rules

**The Border Over Shadow Rule.** 优先用 1px 半透明白边、灰阶背景和间距建立层级，不给每个面板加阴影。

**The Glow Is Rare Rule.** 发光只用于聚焦和关键状态。持续发光、彩色 glow、霓虹边缘都禁止。

## 5. Components

### Buttons

按钮应像 Moonshot 的轻量 CTA：安静、圆润、边框明确，hover 才出现更多反馈。

- **Shape:** pill 按钮使用 999px；工作台内部小按钮可用 12px，避免大量 8px 卡片按钮造成后台工具感。
- **Primary:** 默认仍是透明或近黑底 + 白色文字 + 半透明白边。生成、下载、进入工作台等主要动作可使用白底黑字，但一屏最多一个。
- **Hover / Focus:** hover 使用 `white-wash` 或 `white-hover`，边框增强到 `graphite-line-strong`。focus 使用白色 glow，不使用绿色或琥珀色光圈。
- **Secondary / Ghost:** 次级按钮保持透明背景，文字降到 `text-secondary` 或 `text-muted`。

### Chips

标签用于主题、示例、状态和小说明，但必须弱化。

- **Style:** 14px、细边框、透明背景、pill 或 12px 圆角。
- **State:** active 状态只增强白边和文字亮度。只有错误、警告、成功能使用语义色。

### Cards / Containers

容器应接近 Moonshot 的研究卡和产品块：黑灰底、圆角、细边界、少文字。

- **Corner Style:** 内容卡 16px；工作台面板 12px；小型进度条和状态条 4px。
- **Background:** 常规容器使用 `graphite` 或 `deep-graphite`，不要使用彩色 tint。
- **Shadow Strategy:** 默认无外投影，靠边框和间距建立层级。
- **Border:** `graphite-line` 是默认边界，hover 或 active 提升到 `graphite-line-strong`。
- **Internal Padding:** landing 卡片 24px；工作台面板可更密，但不能低于 16px。

### Inputs / Fields

输入区应比普通表单更像一个聚焦工具入口，但不能变成 AI 聊天框。

- **Style:** 大入口可用 24px 圆角、半透明深灰底和内部 hairline；普通表单使用 12px 圆角、44px 高。
- **Focus:** 背景略亮、边框显现、白色 glow。禁止彩色 focus ring。
- **Error / Disabled:** 错误必须文本说明；禁用态降低透明度，不只改变颜色。

### Navigation

导航应轻，避免复杂后台感。

- 顶栏使用黑底、细边界和紧凑链接。品牌、工作台入口、主题切换足够，不扩展成复杂菜单。
- 首页导航像 Moonshot 一样短，最多保留几个明确入口。
- 工作台步骤导航可以保留，但视觉上应更像纵向文本索引或细边状态列表，不像彩色流程卡。

### Signature Component

**Mode Choice.** 简易模式和功能模式继续保留，但视觉上更像两个黑灰入口块，而不是彩色功能卡。简易模式是默认主路径，功能模式是次级深入口。

**Plot Result Panel.** 图表区域保留白底输出，这是产品必要性。外层容器使用黑灰工作台，内部画布使用 `plot-paper`，形成“黑场中的报告图件”。

**Research-like Samples.** 示例数据可以借鉴 Moonshot 研究卡：灰阶图像/图件预览、短标题、短说明、hover 轻微上移。不要用彩色编号按钮堆成教育软件。

## 6. Do's and Don'ts

### Do:

- **Do** 用黑、白、灰先完成所有视觉层级，再考虑语义色。
- **Do** 使用 80px 级别分区留白，让首页像克制的产品展示，而不是表单集合。
- **Do** 让 CTA 轻量化：透明底、细边框、pill、hover 轻反馈。
- **Do** 保留图表白底输出，但把它限制在结果和导出区域。
- **Do** 用短标题和短说明呈现功能，减少解释性段落。
- **Do** 在工作台里保持线性流程，但降低按钮和面板的视觉噪音。

### Don't:

- **Don't** 像复杂版 OriginLab，不要把大量按钮、菜单和参数一次性压给学生。
- **Don't** 像泛 SaaS 官网，不要用大面积营销文案、装饰卡片网格或夸张转化话术替代真实工具。
- **Don't** 像 AI 工具模板，不要使用彩色渐变、紫蓝 glow、玻璃拟态卡片、聊天框式首屏来暗示智能。
- **Don't** 像儿童教育软件，不要过度可爱、游戏化或降低学术严肃性。
- **Don't** 使用绿色或琥珀色作为品牌主色。它们只能作为图表数据色或语义状态色。
- **Don't** 用卡片套卡片、彩色编号、侧边彩条或渐变文字制造层级。
