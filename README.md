# LabPlot Lite

LabPlot Lite 是一个静态网页工具，用于学生实验数据绘图。它在浏览器中读取表格，生成计算列、曲线、基础拟合和导出文件。

## 功能

- 读取 `.csv`、`.xls`、`.xlsx`
- 识别表头行和数据起始行
- 手动指定数据读取范围
- 生成计算列
- 绘制折线图、散点图、散点连线图、面积图和柱状图
- 单曲线和多曲线绘图
- 一次线性拟合和二次拟合
- 输出 R²、RMSE、MAE、最大绝对误差等指标
- 导出 PNG、SVG、绘图 CSV、完整 CSV、TXT 和 ZIP

## 项目结构

```text
.
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── index.html
├── workbench.html
├── .agents/
│   └── skills/
├── docs/
│   ├── INDEX.md
│   ├── engineering/
│   │   └── frontend-contract.md
│   ├── workflows/
│   │   └── project-change-workflow.md
│   ├── design/
│   │   └── carbon-resources.md
│   └── adr/
├── static/
│   ├── js/
│   │   ├── 00-config-state.js
│   │   ├── 01-dom-workflow-utils.js
│   │   ├── 02-data-parse.js
│   │   ├── 03-workbench-ui.js
│   │   ├── 04-plot-readiness.js
│   │   ├── 05-fit.js
│   │   ├── 06-plot-build-render.js
│   │   ├── 07-downloads-result.js
│   │   └── 08-events-init.js
│   ├── styles/
│   │   ├── base.css
│   │   ├── navigation.css
│   │   ├── landing.css
│   │   ├── workbench.css
│   │   ├── plot.css
│   │   ├── footer.css
│   │   ├── responsive.css
│   │   └── motion.css
│   ├── theme.js
│   ├── style.css
│   ├── sample-previews/
│   │   ├── sample_01_temp_c_to_k.svg
│   │   ├── sample_02_voltage_scale.svg
│   │   ├── sample_03_abs_error.svg
│   │   └── sample_04_invalid_log.svg
│   ├── logo_dark.png
│   └── logo_light.png
├── samples/
│   ├── sample_01_temp_c_to_k.xlsx
│   ├── sample_02_voltage_scale.xlsx
│   ├── sample_03_abs_error.xlsx
│   ├── sample_04_invalid_log.xlsx
│   ├── temperature_time.csv
│   ├── voltage_current.csv
│   ├── concentration_absorbance.csv
│   ├── cooling_curve.csv
│   └── free_fall_fit.csv
└── .github/
    └── workflows/
        └── pages.yml
```

## 示例数据

- `sample_01_temp_c_to_k.xlsx`：荧光发射光谱，平滑连接、末端标签、手动轴范围和峰位参考线。
- `sample_02_voltage_scale.xlsx`：反应动力学衰减，右侧图例、脉冲参考线和阶梯连接。
- `sample_03_abs_error.xlsx`：标准曲线与残差，一次线性拟合、Y 误差棒和中点参考线。
- `sample_04_invalid_log.xlsx`：拉曼谱峰对比，多样品叠图、对数 Y 轴和 D 峰参考线。
- `temperature_time.csv`：基础 CSV 温度-时间曲线。
- `voltage_current.csv`：基础 CSV 电压-电流线性关系。
- `concentration_absorbance.csv`：基础 CSV 浓度-吸光度标准曲线。
- `cooling_curve.csv`：基础 CSV 冷却曲线。
- `free_fall_fit.csv`：基础 CSV 自由落体拟合数据。

首页样张位于 `static/sample-previews/`，由工作台载入上方 `.xlsx` 样例并通过 Plotly 导出的 SVG 生成；不要手写假曲线替代真实样例图。

## 本地预览

推荐用任意静态文件服务器打开项目根目录，例如：

```bash
./scripts/serve.sh
```

然后访问：

```text
http://127.0.0.1:8000/
```

直接打开 `index.html` 也可以使用大部分功能，但内置示例文件需要通过本地静态服务器或 GitHub Pages 加载。

## 协作与质量检查

所有非文档改动提交前运行：

```bash
./scripts/check.sh
```

这个检查入口会执行 JavaScript 语法检查、`git diff --check`、工作台 Carbon 控件约束和 Carbon + Plotly 架构 guardrails。GitHub Actions 也会在 push 和 pull request 上运行同一套检查。

可选安装本地 pre-commit hook：

```bash
./scripts/install-git-hooks.sh
```

更多协作流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)。文档地图见 [docs/INDEX.md](./docs/INDEX.md)，agentic coding 工具共用入口见 [AGENTS.md](./AGENTS.md)。

## 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库的 `main` 分支。
2. 打开仓库的 `Settings -> Pages`。
3. 在 `Build and deployment` 中选择 `GitHub Actions`。
4. 推送后，`.github/workflows/pages.yml` 会自动发布站点。

发布内容只包含：

- `index.html`
- `workbench.html`
- `static/`
- `samples/`
- `.nojekyll`

## 数据处理方式

数据读取、计算、绘图和导出都在浏览器中完成。文件不会保存到仓库，也不会被项目主动上传。

## 版权与第三方库

Copyright © 2026 LabPlot Lite contributors.

本仓库目前未声明开源许可证；复用、分发或二次发布前请先确认授权。页面通过 CDN 使用的 SheetJS、IBM Carbon Web Components、Plotly.js 和 JSZip 遵循各自项目的许可证与署名要求。

## 前端实现约束

LabPlot Lite 采用 Carbon + Plotly 的职责分工：Carbon 接管通用工作台 UI，Plotly 接管科研绘图和图表导出，项目代码只保留实验数据流程、拟合、指标和导出 payload。

详细工程契约、文件职责、依赖规则和验证命令集中维护在 [docs/engineering/frontend-contract.md](./docs/engineering/frontend-contract.md)。不要在 README、产品文档或工具入口里复制这份清单。

使用 agentic coding 工具修改项目时，优先让工具自动读取对应入口：`AGENTS.md`、`.github/copilot-instructions.md`、`CLAUDE.md` 或 `GEMINI.md`。Cursor、Windsurf、Cline、OpenCode 等支持 `AGENTS.md` 的工具直接复用根目录入口。

## 第三方前端库

页面通过 CDN 加载以下浏览器端库。工作台首屏只加载单图模式需要的少量 Carbon 组件；功能模式的 Carbon 组件在进入功能模式时加载。SheetJS、Plotly.js、JSZip 按动作延迟加载，避免首屏一次性下载所有重库；其中 JSZip 只在点击 ZIP 下载时加载并打包。

- SheetJS：读取 Excel 文件
- IBM Carbon Web Components：接管按钮、流程进度、文件上传、表单控件、通知、数据表格、折叠面板、标签和下载操作
- Plotly.js basic bundle：绘制工作台图表和 PNG / SVG 输出
- JSZip：按需生成 ZIP

如需完全离线使用，可以把这些库下载到 `static/vendor/`，再把 `workbench.html` 中的 CDN 地址替换成本地路径。

