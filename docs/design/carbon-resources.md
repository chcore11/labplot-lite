# Carbon Resource Map

这份文档记录 LabPlot Lite 可以直接引用的 Carbon / IBM 官方公开资源。新增通用 UI、调整图表样式、更新设计系统说明前，先用这里作为资源地图。

核对日期：2026-05-13。

## 项目规则

LabPlot Lite 借用系统，不借 IBM 品牌身份。

- Carbon Web Components 接管通用工作台 UI。
- Plotly 接管科研图表渲染、交互和图片导出。
- IBM Design Language 和 Carbon data visualization 可作为图表清晰度、布局纪律、数据颜色、标签、图例、动效和可访问性的依据。
- IBM logo、Brand Center 资产、IBM 内部资源和 IBM 产品品牌身份不能复制进 LabPlot Lite，除非项目已经获得明确授权。

## Carbon Design System

官方入口：[Carbon Design System](https://carbondesignsystem.com/)

适用范围：

- 产品 UI foundation、pattern、代码、可访问性指南和可复用组件。
- 通用工作台控件的默认实现依据。
- 按钮、表单、进度、上传、通知、表格、accordion、tag 等 UI 行为。

官方依据：

- Carbon 官方将它定义为 IBM 面向产品和数字体验的开源设计系统，基于 IBM Design Language，包含代码、设计工具、资源、人机界面指南和社区。
- Carbon 组件概览说明，组件是设计系统的关键构建块，系统化复用能形成跨产品的视觉和功能一致性。

主要页面：

- [Components overview](https://carbondesignsystem.com/components/overview/components/)
- [Button](https://carbondesignsystem.com/components/button/usage/)
- [Checkbox](https://carbondesignsystem.com/components/checkbox/usage/)
- [Data table](https://carbondesignsystem.com/components/data-table/usage/)
- [File uploader](https://carbondesignsystem.com/components/file-uploader/usage/)
- [Form](https://carbondesignsystem.com/components/form/usage/)
- [Notification](https://carbondesignsystem.com/components/notification/usage/)
- [Number input](https://carbondesignsystem.com/components/number-input/usage/)
- [Progress indicator](https://carbondesignsystem.com/components/progress-indicator/usage/)
- [Select](https://carbondesignsystem.com/components/select/usage/)
- [Tag](https://carbondesignsystem.com/components/tag/usage/)
- [Text input](https://carbondesignsystem.com/components/text-input/usage/)

## Carbon Web Components

官方教程：[Web Components tutorial](https://carbondesignsystem.com/developing/web-components-tutorial/overview/)

适用范围：

- 在原生 HTML / JavaScript 中使用 Carbon 组件。
- 在 `workbench.html` 和 `static/js/00-config-state.js` 中新增或延迟加载 `cds-*` 组件。
- 确认 Web Components 可以在不新增框架级 UI 栈的情况下使用。

项目用法：

- 优先使用 `cds-*` markup，不新增原生 `button`、`input`、`select`、`textarea`、`table` 或自定义伪控件。
- 控件读写、disabled、checked、options glue 集中放在 `static/js/01-dom-workflow-utils.js`。
- 如果 Carbon 不能覆盖某个通用 UI 需求，同次改动要写清楚检查过哪个 Carbon 组件或 pattern，以及为什么只保留一个很薄的自定义 wrapper。

## IBM Design Language

官方入口：[IBM Design Language](https://www.ibm.com/design/language/)

适用范围：

- 高层产品设计语言：排版、颜色、2x Grid、图标、插画、布局、动效和数据可视化。
- 保持学生科研工具的清晰、克制、可检查，而不是营销页。
- 使用 Carbon 上游设计原则，同时避免把 LabPlot Lite 做成 IBM 产品。

主要页面：

- [IBM Design Language resources](https://www.ibm.com/design/language/resources/)
- [Typeface](https://www.ibm.com/design/language/typography/typeface/)
- [Type basics](https://www.ibm.com/design/language/typography/type-basics/)
- [Color](https://www.ibm.com/design/language/color/)
- [2x Grid](https://www.ibm.com/design/language/2x-grid/)
- [Iconography overview](https://www.ibm.com/design/language/iconography/)
- [Layout overview](https://www.ibm.com/design/language/layout/)
- [Animation overview](https://www.ibm.com/design/language/animation/)

## Carbon And IBM Data Visualization

IBM 入口：[Data visualization overview](https://www.ibm.com/design/language/data-visualization/overview/)

Carbon 入口：[Carbon data visualization](https://carbondesignsystem.com/data-visualization/getting-started/)

适用范围：

- 用 Plotly 继续渲染图表，但用 IBM / Carbon 的图表规范约束清晰度。
- 图表标题、轴标签、tick 密度、网格密度、图例、直接标签、颜色、纹理、交互和动效。
- `static/js/06-plot-build-render.js` 中的 Plotly layout 默认值。

官方依据：

- IBM data visualization 指南强调清晰、准确表达、一致性、上下文，以及避免不必要装饰。
- IBM chart design 指南要求标题反映主要洞察，图例解释视觉属性和数据的对应关系，在可行时使用图内直接标签，并保持图表文本简洁。
- IBM chart anatomy 指南要求轴、tick 和网格帮助读者理解比例、尺度、指标和单位，同时避免过多图框元素影响理解。
- Carbon axes 指南建议柱状图和面积比较图的数值轴从 0 开始；折线图和散点图在关注趋势方向时可以使用非零范围。
- Carbon legends 指南建议能直接标注时避免图例，单一数据类别不使用图例，图例使用清晰语言，颜色不足以区分时增加纹理等辅助编码。

主要页面：

- [IBM data visualization overview](https://www.ibm.com/design/language/data-visualization/overview/)
- [IBM data visualization design basics](https://www.ibm.com/design/language/data-visualization/design/basics/)
- [Carbon axes and labels](https://carbondesignsystem.com/data-visualization/axes-and-labels/)
- [Carbon legends](https://carbondesignsystem.com/data-visualization/legends/)
- [Carbon data visualization color palettes](https://carbondesignsystem.com/data-visualization/color-palettes/)
- [Carbon chart anatomy](https://carbondesignsystem.com/data-visualization/chart-anatomy/)

项目用法：

- Plotly 输出保持 report-ready：白底 plot paper、可读轴线、明确单位、清晰图例和克制网格。
- 空间足够时，优先使用直接标签或短图例，不用过长 legend key。
- 单曲线图默认不显示图例，除非没有图例会造成歧义。
- 柱状图和面积比较图默认让数值轴从 0 开始。
- 折线图和散点图只在目标是趋势检查且不会暗示错误幅度比较时，才允许非零范围。
- 数据缺失时，不要在未标注 gap 的情况下跨缺失区间插值。
- 重要区分不能只靠颜色，还要配合文本、符号、线型或纹理。

## 设计资产和权限

官方资源页：[IBM Design Language resources](https://www.ibm.com/design/language/resources/)

可参考的公开资源：

- IBM Design Language Figma library。
- Carbon all themes Figma library。
- IBM Plex typeface releases。
- IBM color palette files。
- Carbon UI icon resources。
- Carbon data visualization resources。
- Motion in UI guidance。

受限或品牌敏感资源：

- IBM logo 和 co-branding request 是授权或 IBM ID 门槛资源。
- IBM Brand Center 资源可能需要 IBM ID 或明确授权。
- IBM photography assets 和部分 internal starter files 是受限资源。

项目用法：

- 不把 IBM logo、IBM 8-bar 标志、IBM rebus pattern、IBM co-branding、IBM photography 或 IBM 品牌插画加入 LabPlot Lite。
- 不让 LabPlot Lite 视觉上像 IBM 自有产品。
- 可以引用公开设计原则、组件行为、数据可视化规则、可访问性原则和公开设计资产作为依据。

## Agent Checklist

新增通用 UI 前：

1. 搜索 `workbench.html` 里的现有 `cds-*` pattern。
2. 查对应 Carbon 组件页。
3. 使用 Carbon markup 和项目 helper glue。
4. 删除被替换的原生控件和旧样式。
5. 如果仍保留自定义 UI，说明 Carbon 为什么不适合。

修改图表样式前：

1. 查 IBM / Carbon data visualization 中的轴、标签、图例、颜色和 chart anatomy 指南。
2. 通过 Plotly trace、layout 或 config 实现。
3. 保持绘图逻辑在 `static/js/06-plot-build-render.js`。
4. 如果图表输出变化，验证 PNG / SVG / CSV / TXT / ZIP 导出。
