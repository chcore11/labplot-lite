# LabPlot Lite

LabPlot Lite 是一个面向学生实验数据处理的静态网页工具。用户可以在浏览器中读取实验表格，生成计算列，绘制曲线，完成基础拟合，并导出报告素材。

## 功能

- 读取 `.csv`、`.xls`、`.xlsx` 数据文件
- 自动猜测表头行和数据起始行
- 支持手动指定数据读取范围
- 生成派生计算列
- 绘制折线图、散点图、散点连线图
- 支持单曲线和多曲线绘图
- 支持一次线性拟合和二次拟合
- 输出 R²、RMSE、MAE、最大绝对误差等指标
- 导出 PNG、SVG、绘图 CSV、完整 CSV、拟合报告 TXT 和 ZIP 素材包

## 项目结构

```text
.
├── index.html
├── workbench.html
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
│   ├── logo_dark.png
│   └── logo_light.png
├── samples/
│   ├── sample_01_temp_c_to_k.xlsx
│   ├── sample_02_voltage_scale.xlsx
│   ├── sample_03_abs_error.xlsx
│   └── sample_04_invalid_log.xlsx
└── .github/
    └── workflows/
        └── pages.yml
```

## 示例数据

- `sample_01_temp_c_to_k.xlsx`：荧光发射光谱，适合练习多曲线光谱对比。
- `sample_02_voltage_scale.xlsx`：反应动力学衰减，适合练习多组时间序列绘图。
- `sample_03_abs_error.xlsx`：标准曲线与残差，适合练习一次线性拟合和拟合质量检查。
- `sample_04_invalid_log.xlsx`：拉曼谱峰对比，适合练习多峰谱图和多样品叠图。

## 本地预览

推荐用任意静态文件服务器打开项目根目录，例如：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://127.0.0.1:8000/
```

直接打开 `index.html` 也可以使用大部分功能，但内置示例文件需要通过本地静态服务器或 GitHub Pages 加载。

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

数据读取、计算、绘图和导出都在浏览器中完成。用户上传的文件不会被保存到仓库，也不会被这个项目主动上传到远程服务器。

## 第三方前端库

页面通过 CDN 加载以下浏览器端库：

- SheetJS：读取 Excel 文件
- Plotly.js：绘制工作台图表和 PNG / SVG 输出
- JSZip：生成 ZIP 素材包

如需完全离线使用，可以把这些库下载到 `static/vendor/`，再把 `workbench.html` 中的 CDN 地址替换成本地路径。
