# Landing Polish Workflow

这份工作流用于 LabPlot Lite 首页、首屏样张和公开说明区的视觉精修。目标是让首页更清晰、更克制、更像学生实验绘图工具，而不是增加营销噪音或平行 UI。

## 1. Preflight

每次开始前先完成以下动作：

1. 运行 `git status --short --branch`，确认当前树和远端状态。
2. 阅读 `AGENTS.md`、`README.md`、`PRODUCT.md`、`DESIGN.md`、`.impeccable/design.json` 和 `docs/design/carbon-resources.md`。
3. 运行 `node .agents/skills/impeccable/scripts/load-context.mjs`，确认 PRODUCT / DESIGN 上下文加载成功。
4. 将本次工作归类为 product-led landing：可以有首页表达，但必须服务学生实验绘图任务。
5. 写出计划，再编辑文件。计划必须说明要删除或收窄什么。

## 2. Design Checks

计划和实现都必须通过这些判断：

- 首页第一屏必须出现真实图件样张，不使用手写假曲线、抽象插画或纯装饰图。
- 主路径保持清楚：开始绘图、查看当前样张、理解默认流程。
- 只让当前中间样张可点击；侧边样张只是预览。
- 蓝色只用于主动作、链接、当前状态和可操作焦点。
- 不新增同质卡片网格、hero metric、玻璃拟态、渐变文字或大面积营销文案。
- 移动端优先单一焦点，不展示会误导点击的侧边样张。

## 3. Implementation Boundaries

- 通用控件继续使用 Carbon Web Components。首页按钮使用 `cds-button`。
- 图件继续来自 Plotly 真实导出的 `static/sample-previews/`，不新增绘图库。
- 首页自定义 CSS 只负责布局、样张舞台、留白和报告纸气质。
- 首页脚本只负责样张切换、可点击状态和轻量 reveal，不承载工作台状态。
- 如果新增代码量明显增加，优先删旧样式、旧交互或重复文案抵消。

## 4. Verification

提交前至少运行：

```bash
./scripts/check.sh
```

可见 UI 改动还要做浏览器验证：

- 桌面宽度下首页没有重叠，流程区能自然接在首屏后。
- 390px 宽度下没有横向溢出，按钮和文本不被截断。
- 点击侧边样张不会跳转或切换。
- 点击左右控制可以切换当前样张。
- 当前中间样张保留链接、焦点和 pointer。
- `prefers-reduced-motion` 不依赖动画传达信息。

## 5. Self-review

发布前按这个顺序自查：

1. Subtraction: 是否删掉了多余入口、重复样式、隐藏旧路径或过度说明。
2. Product fit: 是否仍然像学生实验报告工具，而不是泛 SaaS 首页。
3. Ownership: 是否没有新增 Carbon / Plotly 之外的平行系统。
4. Interaction: 是否只有一个自然主动作，轮播切换是否可预测。
5. Responsive: 是否在桌面和 390px 宽度都清楚、留白充足、无横向溢出。
6. Publish: diff 合理后再提交，推送前先 `git pull --rebase origin main`。
