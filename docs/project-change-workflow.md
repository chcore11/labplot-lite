# Large Change Workflow

这份工作流适用于 LabPlot Lite 中任何较大的改动，包括首页、工作台 UI、绘图能力、数据处理、导出、样例数据、设计系统和协作规范。目标是先对齐项目边界，再实施，再自审，避免越改越乱。

## When To Use

满足任一条件时使用这套流程：

- 改动跨多个文件或多个职责边界。
- 改动会影响用户主流程、首页、工作台步骤、绘图、拟合、导出或样例数据。
- 改动会新增 UI、交互、图表能力、依赖、设计 token 或项目规范。
- 用户明确要求美化、重构、减少冗余、自审、遵循规范或推送前完整验证。
- 你不确定改动是否会引入重复逻辑、平行 UI 或平行绘图层。

小的错字、单行文案、明显无风险的文档链接修复可以只走 `AGENTS.md` 的标准检查。

## 1. Preflight

每次开始前先完成以下动作：

1. 运行 `git status --short --branch`，确认当前树和远端状态。
2. 阅读 `AGENTS.md`、`README.md`、`PRODUCT.md`、`DESIGN.md`、`.impeccable/design.json` 和相关 `docs/` 文件。
3. 如果涉及 UI、设计、布局、动效、交互或视觉清理，运行 `node .agents/skills/impeccable/scripts/load-context.mjs`。
4. 判断影响面：product、design、UI components、plotting、parsing、fitting、export、samples、deployment、docs。
5. 写出计划，再编辑文件。计划必须说明要删除、收窄或复用什么。

## 2. Plan First

计划要足够具体，至少回答：

- 这次改动服务哪个用户路径。
- 哪些行为由 Carbon 负责，哪些由 Plotly 负责，哪些才属于项目代码。
- 需要读哪些 owner 文件，是否跨越了文件职责边界。
- 预计删除哪些旧逻辑、旧样式、重复入口或过时文案。
- 最小验证路径是什么。

不要只写“优化 UI”或“重构代码”。如果计划无法说明边界和验证方式，先继续读代码。

## 3. Implementation Boundaries

- 通用 UI 默认使用 Carbon Web Components，不新增并行按钮、表单、表格、通知或 accordion 系统。
- 科研绘图默认使用 Plotly trace、layout 和 config，不新增并行 canvas / SVG 图表引擎。
- Carbon 控件 glue 放在 `static/js/01-dom-workflow-utils.js`。
- Plotly 组装放在 `static/js/06-plot-build-render.js`。
- 事件 wiring 放在 `static/js/08-events-init.js`。
- 下载 payload 放在 `static/js/07-downloads-result.js`。
- CSS 只负责布局、品牌 token、Plotly 外壳和必要 Carbon 适配。
- 新增代码量明显增加时，先寻找可删除的旧路径或可复用的现有 helper。

## 4. Design And UX Checks

涉及可见界面时，额外检查：

- 产品仍然像学生实验报告工具，而不是泛 SaaS、AI 工具或复杂 Origin 复刻。
- 主路径保持清楚：导入、检查、配置、绘图、导出。
- 首页和样例必须使用真实 Plotly 图件，不使用手写假曲线。
- 蓝色只用于主动作、链接、当前状态和可操作焦点。
- 不新增同质卡片网格、hero metric、玻璃拟态、渐变文字或大面积营销文案。
- 390px 宽度下没有文字、按钮、表格、图表或样张重叠。
- 可点击目标和非可点击预览在交互上清楚区分。

## 5. Verification

提交前至少运行：

```bash
./scripts/check.sh
```

如果环境不方便运行 shell 脚本，等价检查是：

```bash
for f in static/js/*.js static/theme.js; do node --check "$f" || exit 1; done
git diff --check
node scripts/check-workbench-controls.mjs
node scripts/check-architecture.mjs
```

根据影响面补充验证：

- UI / layout：浏览器检查桌面和 390px 宽度。
- Workbench：加载样例、应用预设、生成 Plotly 图、确认摘要。
- Chart / export：确认 PNG、SVG、CSV、TXT 和 ZIP 下载路径。
- Samples：确认示例文件、预览图、URL 参数和预设行为一致。
- Docs-only：至少运行 `git diff --check` 并检查链接路径。

## 6. Self-review

发布前按这个顺序自查：

1. Subtraction: 是否删掉了多余入口、重复样式、隐藏旧路径或过度说明。同一个信息、入口、状态或样例说明不要在同一屏里出现多次；如果必须重复，必须服务不同任务层级。
2. Product fit: 是否仍然服务学生实验绘图和报告输出。
3. Ownership: 是否没有新增 Carbon / Plotly 之外的平行系统。
4. Boundaries: 是否把代码放在对应 owner 文件，而不是临时塞进一个模块。
5. Interaction: 主动作、状态反馈、禁用态和错误路径是否自然。
6. Responsive: 桌面和 390px 宽度是否清楚、留白充足、无横向溢出。
7. Publish: diff 合理后再提交，推送前先 `git pull --rebase origin main`。

## 7. Publish

推送前确认：

- `git status --short --branch` 显示只有本次相关改动。
- `git diff --stat` 与计划一致，没有无关文件。
- 提交信息描述产品级变化，而不是泛泛写 “update”。
- 推送后确认 `main...origin/main` 为 `0 0`。
