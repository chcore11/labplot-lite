---
name: impeccable
description: 当用户想要设计、重新设计、塑造、评审、审计、润色、澄清、提炼、加固、优化、适配、制作动画、配色、提取，或以其他方式改进前端界面时使用。覆盖网站、落地页、仪表盘、产品 UI、应用外壳、组件、表单、设置、引导流程和空状态。处理 UX 评审、视觉层级、信息架构、认知负担、可访问性、性能、响应式表现、主题、反模式、排版、字体、间距、布局、对齐、颜色、动效、微交互、UX 文案、错误状态、边界情况、i18n，以及可复用的设计系统或设计 token。也适用于让平淡设计变得更大胆或更有愉悦感，让过于吵闹的设计变得更克制，在浏览器中实时迭代 UI 元素，或制作需要技术上出众的雄心视觉效果。不用于纯后端或非 UI 任务。
---

设计并迭代生产级前端界面。产出真实可运行的代码，做出明确的设计取舍，并追求出色工艺。

## 设置（必需）

在任何设计工作或文件编辑之前，必须通过这些关卡。跳过它们会产出忽略项目背景的通用结果。

| 关卡 | 必需检查 | 失败时 |
|---|---|---|
| Context | 已通过 `node .agents/skills/impeccable/scripts/load-context.mjs` 得知 PRODUCT.md / DESIGN.md 加载结果。 | 先运行加载器再继续。 |
| Product | PRODUCT.md 存在，且不是空文件或占位文件（包含 `[TODO]` 标记，或少于 200 个字符）。 | 运行 `$impeccable teach`，刷新上下文，然后继续。绝不要只根据用户的原始提示自行合成 PRODUCT.md。 |
| Command | 使用子命令时，已加载匹配的命令参考。 | 先加载参考文档再继续。 |
| Craft | `$impeccable craft` 针对此任务已有用户确认过的形态简报。`teach` / PRODUCT.md 永远不算作形态。 | 运行 `$impeccable shape`，并等待明确的简报确认。 |
| Image | 必需的视觉探针 / mock 已生成，或已说明跳过原因。 | 写代码前，先解决 `shape.md` 或 `craft.md` 中的图像生成关卡。 |
| Mutation | 上方所有激活关卡都通过。 | 还不要编辑项目文件。 |

Codex 风格的 agent 在编辑文件前必须声明：

```text
IMPECCABLE_PREFLIGHT: context=pass product=pass command_reference=pass shape=pass|not_required image_gate=pass|skipped:<reason> mutation=open
```

对于 `$impeccable craft`，只有在用户单独回复并批准形态设计简报后，或用户在请求中提供了已经确认的简报时，`shape=pass` 才有效。不要在撰写 PRODUCT.md、总结假设，或自己起草了一份未经确认的简报之后标记 `shape=pass`。

其他运行环境如果能够暴露这些状态，也应遵循同一套检查清单。

### 1. 上下文收集

两个文件，不区分大小写。加载器默认查看项目根目录；如果根目录干净，则回退到 `.agents/context/` 和 `docs/`。可用 `IMPECCABLE_CONTEXT_DIR=path/to/dir` 覆盖（绝对路径，或相对于 cwd 的路径）。

- **PRODUCT.md**：必需。用户、品牌、语气、反参考、战略原则。
- **DESIGN.md**：可选，但强烈建议。颜色、排版、层级、组件。

一次调用同时加载两者：

```bash
node .agents/skills/impeccable/scripts/load-context.mjs
```

消费完整 JSON 输出。绝不要通过 `head`、`tail`、`grep` 或 `jq` 管道截断。输出中的 `contextDir` 字段会告诉你这些文件是从哪里解析出来的。

如果输出已经在本会话的对话历史中，不要重新运行。需要重新加载的例外情况：你刚运行过 `$impeccable teach` 或 `$impeccable document`（它们会重写这些文件），或用户手动编辑了其中一个文件。

`$impeccable live` 已经会通过 `live.mjs` 预热上下文。如果本会话运行过 `live.mjs`，就不要再运行 `load-context.mjs`。

如果 PRODUCT.md 缺失、为空，或是占位内容（包含 `[TODO]` 标记，或少于 200 个字符）：运行 `$impeccable teach`，然后带着新上下文回到用户的原始任务。如果原始任务是 `$impeccable craft`，在任何实现工作之前，先继续进入 `$impeccable shape`。

如果 DESIGN.md 缺失：每个会话提醒一次（*"Run `$impeccable document` for more on-brand output"*），然后继续。

### 2. 类型

每个设计任务都属于 **brand**（营销、落地页、活动、长篇内容、作品集：设计本身就是产品）或 **product**（应用 UI、后台、仪表盘、工具：设计服务于产品）。

设计前先识别类型。优先级：（1）任务本身的线索（如 "landing page" 与 "dashboard"）；（2）当前关注的界面（正在处理的页面、文件或路由）；（3）PRODUCT.md 中的 `register` 字段。第一个匹配项优先。

如果 PRODUCT.md 缺少 `register` 字段（旧版），则根据其中的 "Users" 和 "Product Purpose" 章节推断一次，并在本会话中缓存推断结果。建议用户运行 `$impeccable teach`，显式添加该字段。

加载匹配的参考文档：[reference/brand.md](reference/brand.md) 或 [reference/product.md](reference/product.md)。下方共享设计法则适用于两种类型。

## 共享设计法则

适用于每一个设计，两个类型都一样。让实现复杂度匹配美学愿景：极繁主义需要精巧代码，极简主义需要精准控制。创造性地解读。不同项目之间要有变化，绝不要收敛到同一种选择。GPT 有能力做出卓越作品，不要收手。

### 颜色

- 使用 OKLCH。随着亮度接近 0 或 100，降低彩度；极端亮度下的高彩度会显得刺眼。
- 绝不要使用 `#000` 或 `#fff`。让每个中性色都朝品牌色相轻微偏移（彩度 0.005-0.01 就够）。
- 选颜色之前先选定 **颜色策略**。承诺轴上有四个层级：
  - **Restrained**：带色中性色 + 一个强调色，且强调色不超过 10%。产品默认；品牌极简主义。
  - **Committed**：一个饱和色承载 30-60% 的界面。身份驱动型品牌页面的默认策略。
  - **Full palette**：3-4 个具名角色，每个都被有意使用。品牌活动；产品数据可视化。
  - **Drenched**：界面本身就是颜色。品牌首屏、活动页。
- “一个强调色不超过 10%”只适用于 Restrained。Committed / Full palette / Drenched 会有意超过它。不要条件反射地把每个设计都压回 Restrained。

### 主题

深色或浅色从来都不是默认选项。不要因为“工具用深色看起来酷”就选深色。也不要为了“安全”就选浅色。

选择之前，写一句关于物理场景的话：谁在使用它，在什么地方，在什么环境光下，带着什么状态。如果这句话不能迫使答案出现，就还不够具体。继续添加细节，直到它能迫使答案出现。

“可观测性仪表盘”不能迫使答案出现。“SRE 在凌晨 2 点的暗房里，通过 27 英寸显示器瞥一眼事故严重程度”可以。按这句话决策，而不是按类别决策。

### 排版

- 正文行长控制在 65-75ch 以内。
- 用字号 + 字重对比建立层级（层级之间比例不低于 1.25）。避免扁平字号体系。

### 布局

- 改变间距以形成节奏。所有地方都用相同 padding 会变得单调。
- 卡片是偷懒答案。只有当卡片确实是最佳 affordance 时才使用。嵌套卡片永远是错的。
- 不要把所有东西都包进容器里。大多数东西不需要容器。

### 动效

- 不要动画化 CSS 布局属性。
- 使用指数曲线缓出（ease-out-quart / quint / expo）。不要 bounce，不要 elastic。

### 绝对禁令

匹配到就拒绝。如果你正准备写出其中任何一种，请用不同结构重写该元素。

- **侧边条边框。** 在卡片、列表项、callout 或 alert 上，用大于 1px 的 `border-left` 或 `border-right` 作为彩色强调。永远不要有意这样做。改用完整边框、背景色调、前导数字 / 图标，或什么都不用。
- **渐变文字。** `background-clip: text` 与渐变背景结合。它只是装饰，绝无意义。使用单一纯色。通过字重或字号强调。
- **默认玻璃拟态。** 装饰性使用 blur 和玻璃卡片。要么少量且有目的，要么不用。
- **hero-metric 模板。** 大数字、小标签、辅助统计、渐变强调。这是 SaaS 陈词滥调。
- **相同卡片网格。** 同尺寸卡片，图标 + 标题 + 文本，无休止重复。
- **第一反应就是模态框。** 模态框通常是偷懒。先穷尽内联 / 渐进式替代方案。

### 文案

- 每个词都要有存在理由。不要复述标题，不要写重复标题含义的开场白。
- **不要使用 em dash。** 使用逗号、冒号、分号、句号或括号。也不要使用 `--`。

### AI 味测试

如果有人一看这个界面就能毫不犹豫地说“这是 AI 做的”，它就失败了。跨类型失败包括上方的绝对禁令。各类型专属失败写在各自参考文档里。

**类别反射检查。** 分两个高度运行；第二层会捕捉第一层漏掉的问题。

- **第一阶：** 如果有人只根据类别就能猜到主题 + 调色板（“可观测性 -> 深蓝”、“医疗 -> 白 + 青绿”、“金融 -> 海军蓝 + 金色”、“加密 -> 黑底霓虹”），这就是第一层训练数据反射。重写场景句和颜色策略，直到答案不再能从领域里直接猜出。
- **第二阶：** 如果有人能根据类别加反参考猜到审美家族（“不是 SaaS 奶油风的 AI 工作流工具 -> 编辑式排版”、“不是海军蓝金色的 fintech -> 终端原生深色模式”），这就是更深一层的陷阱。第一层反射被避开了，但第二层没有。继续重做，直到两个答案都不明显。brand 类型的 [reflex-reject aesthetic lanes](reference/brand.md) 列表会捕捉当前已经饱和的审美路线。

## 命令

| 命令 | 类别 | 说明 | 参考 |
|---|---|---|---|
| `craft [feature]` | 构建 | 先塑形，再端到端构建一个功能 | [reference/craft.md](reference/craft.md) |
| `shape [feature]` | 构建 | 写代码前规划 UX/UI | [reference/shape.md](reference/shape.md) |
| `teach` | 构建 | 设置 PRODUCT.md 和 DESIGN.md 上下文 | [reference/teach.md](reference/teach.md) |
| `document` | 构建 | 从现有项目代码生成 DESIGN.md | [reference/document.md](reference/document.md) |
| `extract [target]` | 构建 | 将可复用 token 和组件提取进设计系统 | [reference/extract.md](reference/extract.md) |
| `critique [target]` | 评估 | 用启发式评分进行 UX 设计评审 | [reference/critique.md](reference/critique.md) |
| `audit [target]` | 评估 | 技术质量检查（a11y、性能、响应式） | [reference/audit.md](reference/audit.md) |
| `polish [target]` | 精修 | 发布前的最终质量打磨 | [reference/polish.md](reference/polish.md) |
| `bolder [target]` | 精修 | 放大过于安全或平淡的设计 | [reference/bolder.md](reference/bolder.md) |
| `quieter [target]` | 精修 | 降低过于激进或刺激的设计强度 | [reference/quieter.md](reference/quieter.md) |
| `distill [target]` | 精修 | 提炼到本质，移除复杂度 | [reference/distill.md](reference/distill.md) |
| `harden [target]` | 精修 | 生产就绪：错误、i18n、边界情况 | [reference/harden.md](reference/harden.md) |
| `onboard [target]` | 精修 | 设计首次使用流程、空状态、激活路径 | [reference/onboard.md](reference/onboard.md) |
| `animate [target]` | 增强 | 添加有目的的动画和动效 | [reference/animate.md](reference/animate.md) |
| `colorize [target]` | 增强 | 为单色 UI 添加策略性颜色 | [reference/colorize.md](reference/colorize.md) |
| `typeset [target]` | 增强 | 改进排版层级和字体 | [reference/typeset.md](reference/typeset.md) |
| `layout [target]` | 增强 | 修复间距、节奏和视觉层级 | [reference/layout.md](reference/layout.md) |
| `delight [target]` | 增强 | 添加个性和记忆点 | [reference/delight.md](reference/delight.md) |
| `overdrive [target]` | 增强 | 推到常规限制之外 | [reference/overdrive.md](reference/overdrive.md) |
| `clarify [target]` | 修复 | 改进 UX 文案、标签和错误消息 | [reference/clarify.md](reference/clarify.md) |
| `adapt [target]` | 修复 | 适配不同设备和屏幕尺寸 | [reference/adapt.md](reference/adapt.md) |
| `optimize [target]` | 修复 | 诊断并修复 UI 性能问题 | [reference/optimize.md](reference/optimize.md) |
| `live` | 迭代 | 视觉变体模式：在浏览器里选择元素，生成替代方案 | [reference/live.md](reference/live.md) |

另有两个管理命令：`pin <command>` 和 `unpin <command>`，详见下方。

### 路由规则

1. **没有参数**：将上方表格作为面向用户的命令菜单渲染出来，并按类别分组。询问用户想做什么。
2. **第一个词匹配某个命令**：加载它的参考文件，并遵循其中说明。命令名之后的所有内容都是目标。
3. **第一个词不匹配**：一般设计调用。应用设置步骤、共享设计法则和已加载的类型参考，将完整参数作为上下文。

到那时，设置（上下文收集、类型）已经加载完毕；子命令不会再次调用 `$impeccable`。

如果第一个词是 `craft`，设置仍会先运行，但后续流程由 [reference/craft.md](reference/craft.md) 接管。如果设置过程因为阻塞而调用了 `teach`，先完成 teach，刷新上下文，然后继续原始命令和目标。

## Pin / Unpin

**Pin** 会创建一个独立快捷方式，让 `$<command>` 直接调用 `$impeccable <command>`。**Unpin** 会移除它。脚本会写入项目中存在的每一个运行环境目录。

```bash
node .agents/skills/impeccable/scripts/pin.mjs <pin|unpin> <command>
```

有效的 `<command>` 是上方表格中的任意命令。简洁报告脚本结果。成功时确认新的快捷方式；出错时逐字转述 stderr。
