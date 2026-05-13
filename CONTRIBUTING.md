# Contributing

LabPlot Lite 是一个静态浏览器应用。协作时优先保持产品轻、路径清楚、代码边界稳定。

## 开始前

1. 先读 `AGENTS.md`。
2. 较大改动先按 `docs/project-change-workflow.md` 列计划、实施、自审和验证。
3. UI、设计、布局或交互改动先运行：

   ```bash
   node .agents/skills/impeccable/scripts/load-context.mjs
   ```

4. 不要引入与 Carbon 并行的通用 UI 系统。
5. 不要引入与 Plotly 并行的科研绘图引擎。
6. 新增通用 UI 前先查 Carbon Web Components 和项目现有 `cds-*` 用法；Carbon 能覆盖时只写状态 glue，不自写控件。

## 本地检查

所有非文档改动提交前运行：

```bash
./scripts/check.sh
```

这个命令会检查：

- `static/js/*.js` 和 `static/theme.js` 的语法。
- Git diff 是否包含空白错误。
- `workbench.html` 是否误加原生控件。
- 是否新增平行 UI / 图表架构风险。

可以安装本地 Git hook：

```bash
./scripts/install-git-hooks.sh
```

## 本地预览

```bash
./scripts/serve.sh
```

默认地址是：

```text
http://127.0.0.1:8000/
```

如端口被占用：

```bash
./scripts/serve.sh 8001
```

## UI 改动验证

UI、布局或交互改动需要额外检查：

- 桌面宽度下 `index.html` 和 `workbench.html` 能正常加载。
- 390px 宽度下没有文字、按钮、表格、图表重叠。
- 工作台仍保留上传、检查、绘图、导出线性路径。
- 示例数据能够进入绘图流程。

## Chart / Export 改动验证

涉及 Plotly、拟合、下载或 ZIP 时，至少验证一次完整流程：

1. 打开 `http://127.0.0.1:8000/workbench.html`。
2. 加载一个示例数据集。
3. 应用推荐绘图设置。
4. 生成 Plotly 图。
5. 确认结果摘要出现。
6. 确认 PNG、SVG、CSV、TXT 下载入口可用。
7. 点击 ZIP 下载入口，确认文件会按需打包并开始下载。

## PR 要求

PR 需要说明实际运行过的检查命令。UI PR 需要提供桌面和 390px 检查记录；如果无法提供截图，至少说明浏览器、地址和检查结果。

UI PR 还需要写明 Carbon-first 结果：复用了哪个 Carbon 组件，或者为什么 Carbon 不能覆盖。若代码量净增加，需要说明为什么不能通过删除旧自写 UI、复用 Carbon 或复用现有 helper 来抵消。
