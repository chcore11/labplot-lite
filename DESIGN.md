---
name: LabPlot Lite
description: 报告纸与仪器面板结合的学生实验绘图工具
colors:
  page-canvas: "oklch(97.8% 0.006 255)"
  page-field: "oklch(95.2% 0.008 250)"
  surface: "oklch(99.2% 0.004 255)"
  surface-raised: "oklch(100% 0.004 255)"
  surface-panel: "oklch(93.8% 0.008 252)"
  surface-tool: "oklch(90.8% 0.01 250)"
  ink: "oklch(20% 0.014 255)"
  ink-soft: "oklch(38% 0.016 255)"
  ink-muted: "oklch(55% 0.014 255)"
  line-soft: "oklch(21% 0.014 255 / 0.10)"
  line-strong: "oklch(21% 0.014 255 / 0.22)"
  primary-blue: "oklch(48% 0.145 255)"
  primary-blue-hover: "oklch(42% 0.15 255)"
  primary-blue-soft: "oklch(48% 0.145 255 / 0.10)"
  instrument-teal: "oklch(58% 0.11 178)"
  data-amber: "oklch(72% 0.13 82)"
  data-red: "oklch(62% 0.16 32)"
  success: "oklch(48% 0.11 150)"
  warning: "oklch(60% 0.13 76)"
  danger: "oklch(55% 0.16 28)"
  plot-paper: "oklch(98.7% 0.004 95)"
  plot-ink: "oklch(17% 0.014 255)"
  plot-grid: "oklch(24% 0.012 255 / 0.13)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "0"
  section:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.22
    letterSpacing: "0"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
    letterSpacing: "0"
  mono:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Cascadia Mono, Roboto Mono, Consolas, Liberation Mono, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
rounded:
  card: "8px"
  panel: "8px"
  control: "6px"
  pill: "999px"
spacing:
  page-x: "56px"
  page-x-tablet: "32px"
  page-x-mobile: "16px"
  section-y: "72px"
  section-gap: "72px"
  cluster-gap: "18px"
components:
  button-primary:
    backgroundColor: "{colors.primary-blue}"
    textColor: "oklch(98% 0.004 255)"
    rounded: "{rounded.control}"
    padding: "0 16px"
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    typography: "{typography.label}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  plot-paper:
    backgroundColor: "{colors.plot-paper}"
    textColor: "{colors.plot-ink}"
    rounded: "3px"
    padding: "24px"
---

# Design System: LabPlot Lite

## 1. Overview

**Creative North Star: 报告纸上的轻量仪器面板**

LabPlot Lite 的界面应让学生感觉自己正在使用一个可信的实验绘图工具，而不是一个营销网站、AI 工具或复杂科研软件。默认视觉是浅色报告纸、冷静灰阶、清晰表格和白底图表。功能模式允许更高密度，但控件必须像专业软件一样稳定、可预测。

这套方向综合四类参考：Carbon 的数据密集产品结构，Spectrum 的专业工具控件密度，GOV.UK 的低学习成本表单规范，Datawrapper / Prism 的图表生成路径。功能模式遵循 Datawrapper 的四步命名：Upload Data、Check & Describe、Visualize、Publish & Embed；最后一步在 LabPlot Lite 中映射为本地下载和报告嵌入素材。借鉴的是原则，不是复制品牌。

实现层面以 Carbon + Plotly 为准：Carbon Web Components 接管通用工作台 UI，Plotly.js 接管科研绘图和图像导出。LabPlot Lite 的自有界面代码应尽量薄，只负责产品流程、数据状态和必要布局。

**Key Characteristics:**

- 浅色优先：页面背景接近实验报告纸，主内容用白色或浅灰面板承载。
- 图表可信：结果画布保持白底、细网格、清晰轴线和可读图例。
- 工具感克制：功能模式可以密集，但避免深色 SaaS、渐变、玻璃拟态和装饰图标。
- 蓝色只做功能色：主要动作、当前步骤、选中态使用蓝色，不把蓝色铺成品牌装饰。
- 数据色归数据：蓝、青、琥珀、红只用于曲线、状态和图表语义。

## 2. Color Strategy

颜色策略是 Restrained with Data Palette：界面 85% 以上由纸色、白色、灰阶和墨色完成。蓝色作为操作和选中状态，其他颜色只属于数据曲线或语义状态。

### Interface Neutrals

- **Page Canvas**: 全站背景，轻微偏冷，避免纯白刺眼。
- **Surface / Surface Raised**: 首页模块、工作台步骤面板、表单区域。
- **Surface Panel / Surface Tool**: 左侧步骤、属性组、表格预览和控制区。
- **Ink / Ink Soft / Ink Muted**: 标题、正文、辅助说明。

### Functional Color

- **Primary Blue**: 主按钮、当前步骤、可操作焦点。
- **Primary Blue Soft**: 选中背景、信息提示和聚焦区域。

### Data and State

- **Instrument Teal, Data Amber, Data Red**: 多曲线和图表示例。
- **Success, Warning, Danger**: 状态提示，必须配合文本。
- **Plot Paper / Plot Ink / Plot Grid**: 图表输出区域。

### Named Rules

**The Paper Boundary Rule.** 页面可以是浅灰纸感，但真正的图表画布必须比周围更白，形成“报告图件”的边界。

**The Blue Means Action Rule.** 蓝色只表示当前步骤、主操作、选中和链接，不用于装饰条、背景渐变或大面积品牌涂色。

**The Data Color Rule.** 多彩只出现在图表曲线、状态和少量数据标记中，不出现在卡片标题和营销区块。

## 3. Typography

产品 UI 使用系统字体栈，不引入装饰字体。字号层级保持紧凑，服务扫描和重复操作。

- **Display**: 首页主标题。只出现一次。
- **Section**: 首页分区和工作台主要区块标题。
- **Title**: 卡片、步骤、模式入口标题。
- **Body**: 说明文本和流程指引。
- **Label**: 控件标签、按钮、状态和小标题。
- **Mono**: 列名、拟合指标、DPI、尺寸和数值摘要。

### Named Rules

**The Scan First Rule.** 工作台内优先保证标签和当前状态可扫读，不用大标题制造层级。

**The Short Help Rule.** 帮助文案只说明下一步动作、判断依据和风险，不能重复标题。

## 4. Layout

首页是产品 landing，但第一屏必须直接展示图表输出和工作流。工作台是工具，不是展示页。

- Landing 首屏: 左侧一句定位和入口，右侧展示“数据表 -> 设置 -> 图表结果”的真实产品意象。
- Workflow: 使用 Datawrapper 对齐的 4 个稳定步骤，避免彩色编号卡片。
- Workbench: 顶部状态栏，左侧或上方步骤导航，右侧主任务面板。
- Result: 图表预览是主内容，摘要和下载是右侧辅助内容。
- Mobile: 390px 宽度下优先保留主动作、当前步骤和图表预览，复杂表格允许横向滚动。

## 5. Components

### Component Ownership

默认先使用 Carbon Web Components。按钮、步骤条、文件上传、select、text input、textarea、number input、checkbox、notification、data table、accordion、tag 和下载操作都属于 Carbon 范围。只有当 Carbon 组件无法表达 LabPlot Lite 的产品语义时，才允许写轻量 wrapper；wrapper 只能做布局和数据 glue，不复制 Carbon 视觉样式。

Plotly 负责图表本体。新增图表类型、图例、坐标轴、工具栏、PNG / SVG 输出和交互能力时，应扩展 Plotly trace / layout / config。项目 CSS 只能控制 Plotly 所在的报告纸外壳、尺寸和周围摘要布局，不能手写新的绘图引擎。

### Buttons

按钮使用 `cds-button`。主按钮蓝底白字，次按钮使用 Carbon tertiary / ghost，危险操作使用 Carbon danger variant。不要新增 `.btn`、原生 `button` 视觉类或独立按钮 hover 系统。

### Panels

面板半径 8px，边框 1px，轻微阴影只用于页面级容器。工作台内部不要卡片套卡片，表单组用浅灰背景和分隔线而不是强卡片。

### Inputs

输入、选择、数字输入、文本域和文件上传使用 Carbon 控件。项目层只负责宽度、网格和上下文说明，不重写控件边框、focus、hover 或 disabled 视觉。

### Step Navigation

步骤导航使用 Carbon progress indicator。它应该像任务清单，不像营销流程卡；当前步骤、完成步骤和 disabled 状态都交给 Carbon 表达。

### Plot Result Panel

外层是工具面板，内层是白底报告图。Plotly 图表必须保持白底、细轴线、可读图例和可导出的尺寸。画布周围可以有浅灰网格或标尺感，但不能干扰图表。

### Sample Cards

示例入口优先使用 Carbon button / link / tile 中最简单可读的组件。不要为示例入口创建一套独立卡片系统，除非它同时删除了更多旧样式。

### Code And CSS Rules

- 通用控件新增时先搜索现有 `cds-*` 用法，复用 helper，而不是新写原生控件处理。
- CSS 不复制 Carbon 控件内部样式，只设置布局、间距、宽度和品牌 token。
- 删除旧样式优先于叠加覆盖。任何新增 UI 样式都应能指出它替代了哪段旧代码或承载了什么 Carbon / Plotly 之外的产品语义。
- `static/js/01-dom-workflow-utils.js` 是 Carbon 控件读写 glue 的集中位置，不要在多个模块重复写 `.value` / `checked` / disabled 兼容逻辑。
- `static/js/06-plot-build-render.js` 是 Plotly trace / layout 组装边界，新增绘图能力应先进入这里，而不是在事件层直接拼图表。

## 6. Do's and Don'ts

### Do

- Do 用浅色纸面和白底图表建立报告可信感。
- Do 保留线性路径：上传、识别、加工、绘图、结果、导出。
- Do 让高级设置收进 Carbon accordion 或右侧属性区，不阻塞新手。
- Do 使用表格、轴线、拟合指标和导出尺寸作为专业信号。
- Do 在首页展示真实产品流程，而不是抽象插画。
- Do 让 Carbon 管 UI，让 Plotly 管图表，让项目代码管实验数据流程。

### Don't

- Don't 使用深色渐变、玻璃拟态、彩色 glow 或 AI 工具模板。
- Don't 把首页做成示例数据文档，landing 应该先给定位和入口。
- Don't 把功能模式做成复杂 Origin 菜单。
- Don't 让颜色承担唯一状态表达。
- Don't 用同尺寸图标卡片网格堆功能。
- Don't 为按钮、表单、表格、通知或折叠面板重建 Carbon 已有能力。
- Don't 为科研图重新手写 canvas / SVG 绘图层。
