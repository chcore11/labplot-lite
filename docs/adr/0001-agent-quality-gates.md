# ADR 0001: Agent Quality Gates

## Status

Accepted

## Context

LabPlot Lite 会由人类协作者和多个 agentic coding 工具共同修改。只靠 `AGENTS.md`、`PRODUCT.md`、`DESIGN.md` 和 skill 指令，无法保证每次提交都遵守相同的代码边界。

项目的长期架构是 Carbon + Plotly：

- Carbon Web Components 负责通用工作台 UI。
- Plotly.js 负责科研绘图、交互和图像导出。
- 项目 JavaScript 负责数据、拟合、指标、状态流转和导出素材。
- 项目 CSS 负责布局、品牌 token、Plotly 外壳和必要 Carbon 适配。

这些规则需要被脚本和 CI 检查，而不是只停留在文字说明中。

## Decision

新增统一质量入口：

```bash
./scripts/check.sh
```

该入口在本地、Git hook 和 GitHub Actions 中复用，负责：

- JavaScript 语法检查。
- `git diff --check` 空白检查。
- `workbench.html` 原生控件检查。
- Carbon + Plotly 架构 guardrail 检查。

新增 GitHub Actions quality workflow，在 push 和 pull request 时执行同一套检查。

新增 PR 模板和 `CONTRIBUTING.md`，让协作者记录实际验证，而不是只描述意图。

## Consequences

- agent 和人类协作者共享同一个最低质量门槛。
- 新增通用 UI 或图表能力时，会更早暴露架构偏离。
- 检查脚本保持轻量，不引入 package manager 或测试框架依赖。
- 未来如果加入 Playwright smoke test，应接入 `./scripts/check.sh` 或单独的 CI job，并继续复用同一套协作说明。
