# Perfect Skill Generator — AI Skills 完美生成器

**版本**: v2.0 &nbsp;|&nbsp; **作者**: 猫叔 × Manus AI &nbsp;|&nbsp; **日期**: 2026年3月10日

基于对 Anthropic 官方 Skills 仓库（88.1k Stars）、100+ 社区优秀 Skills、Agent Skills 开放标准规范的深度分析，提炼而成的终极 Skills 生成提示词工具。

---

## 工具概述

本工具是一个**结构化的多步骤提示词系统**，通过 7 个步骤引导 AI 模型从零生成符合行业最佳实践的高质量 Agent Skill。每个步骤都有明确的输入要求、处理逻辑和输出格式，确保生成的 Skill 在描述精准度、简洁度、结构合理性、渐进式披露、质量保证等维度均达到顶级水准。

**适用平台**: Claude Code、Manus、OpenAI Codex、GitHub Copilot、Cursor 等所有支持 Agent Skills 开放标准的平台。

> **平台差异提示**: 各平台对 Skills 的支持程度有所不同。Manus 支持 **Project Skills**（团队级别共享）和**运行时深度集成**（Skills 可直接调用浏览器、文件系统等工具）；Claude Code 支持本地 `.claude/skills/` 目录和项目级 Skills；其他平台可能仅支持基础的 SKILL.md 读取。生成的 Skill 核心内容跨平台通用，但脚本中的工具调用可能需要根据目标平台适配。

---

## 使用方式

将下方 7 个步骤的提示词**按顺序**发送给 AI 模型。每个步骤完成后，将输出结果作为下一步的上下文继续对话。最终将获得一个完整的、生产级的 Skill 包。

---

## Step 1: 需求深度挖掘

### 用户提交
向 AI 描述你想创建的 Skill，包括但不限于：技能名称、目标领域、核心功能、典型使用场景。

### 提示词

````
你是一位 Agent Skills 架构师，拥有对 Anthropic 官方 Skills 仓库中所有优秀 Skills 的深度理解。你的任务是帮助我设计一个完美的 Agent Skill。

我想创建的 Skill 是：[在此描述你的需求]

请通过以下框架对我的需求进行深度分析，输出一份结构化的需求文档：

## 1. 核心定位分析
- **Skill 名称**（hyphen-case，全小写，最长 64 字符）：
- **一句话定位**：这个 Skill 让 AI 代理能够做什么？
- **目标用户画像**：谁会使用这个 Skill？在什么场景下？
- **核心价值主张**：这个 Skill 提供了哪些 AI 模型本身不具备的知识或能力？

## 2. 功能边界分析
- **核心功能**（Must Have）：列出 3-5 个必须实现的核心功能
- **扩展功能**（Nice to Have）：列出可选的增强功能
- **明确排除**（Out of Scope）：列出这个 Skill 不应该做的事情

## 3. 使用场景枚举
请列出至少 5 个具体的使用场景，每个场景包含：
- 用户的原始请求（模拟真实对话）
- 期望的 AI 行为
- 期望的输出结果

## 4. 知识缺口分析
- AI 模型已经知道的（不需要在 Skill 中重复）：
- AI 模型不知道的（必须在 Skill 中提供）：
- AI 模型可能做错的（需要通过 Skill 纠正）：

## 5. 依赖和约束
- 需要的外部工具或 API：
- 文件格式要求：
- 平台或环境约束：

## 6. 竞品与已有 Skills 分析
请检查以下来源，确认是否已存在功能类似的 Skill：
- Anthropic 官方 Skills 仓库（https://github.com/anthropics/skills）中的 17 个官方 Skills
- ClawHub 社区市场中的热门 Skills
- 其他社区集合（awesome-agent-skills 等）

分析结果：
- 是否存在可直接复用的已有 Skill？
- 是否存在可扩展/改进的已有 Skill？
- 与已有 Skills 的差异化定位是什么？

请严格按照以上框架输出，不要遗漏任何部分。
````

### 预期输出
一份完整的结构化需求文档（含竞品分析），为后续架构决策提供基础。

---

## Step 2: 架构决策引擎

### 用户提交
将 Step 1 的输出结果作为上下文。

### 提示词

````
基于上述需求分析，现在进行架构决策。请根据以下决策框架，为这个 Skill 做出最优的架构选择：

## 决策 1: 结构模式选择

从以下 4 种经过验证的结构模式中选择最适合的：

| 模式 | 适用场景 | 典型案例 |
|------|---------|---------|
| **工作流型（Workflow-Based）** | 有清晰的顺序步骤、阶段性流程 | mcp-builder（4阶段）、PDF表单填充（5步骤） |
| **任务型（Task-Based）** | 提供多种独立操作/能力 | PDF处理（合并/拆分/提取）、天气查询 |
| **指南型（Guidelines-Based）** | 制定标准、规范、审美准则 | frontend-design（美学指南）、brand-guidelines |
| **能力型（Capabilities-Based）** | 多个相互关联的功能特性 | 产品管理、Google Workspace 集成 |

**输出**：选择的模式 + 选择理由 + 是否需要混合模式

## 决策 2: 自由度级别

根据任务的脆弱性和可变性，确定指令的具体程度（类比来自 Anthropic 官方最佳实践）：

| 级别 | 特征 | 类比 | 适用场景 |
|------|------|------|---------|
| **高自由度** | 文本指导 + 启发式规则 | 开阔田野（官方类比） | 多种方法均可行，依赖上下文判断 |
| **中自由度** | 伪代码/带参数模板 | 有标记的小径（补充类比） | 存在首选模式，允许一定变化 |
| **低自由度** | 具体脚本/严格步骤 | 有护栏的窄桥（官方类比） | 操作脆弱易错，一致性至关重要 |

**输出**：整体自由度级别 + 各功能模块的自由度分配

## 决策 3: 资源规划

确定是否需要以下可选资源目录：

| 资源类型 | 用途 | 何时需要 |
|---------|------|---------|
| **scripts/** | 可执行代码（Python/Bash） | 有重复性的确定性操作 |
| **references/** | 按需加载的参考文档 | 有特定场景才需要的参考信息（API 文档、领域知识、变体指南等），或内容超过 SKILL.md 500 行限制需要拆分 |
| **templates/** | 输出模板/资产文件 | 需要固定格式的输出 |

**注意**：references/ 不仅仅是"溢出容器"。即使 SKILL.md 未超过 500 行，只要某些信息仅在特定场景下需要，就应放在 references/ 中按需加载。例如 mcp-builder 的 SKILL.md 并未接近 500 行，但仍使用了 5 个 reference 文件来按需加载不同技术栈的详细指南。

**大文件提示**：对于超过 10,000 词的参考文件，应在 SKILL.md 中提供 grep 模式，以便代理快速定位所需内容。

**输出**：每个目录是否需要 + 具体包含什么文件 + 每个文件的用途

## 决策 4: 渐进式披露策略

从以下 3 种披露模式中选择：

- **模式 A: 高层指南 + 引用参考** — 主文件提供概览，链接到详细参考
- **模式 B: 按领域组织** — 按领域/变体分文件存储
- **模式 C: 条件性细节** — 基础内容在主文件，高级功能按需链接

**输出**：选择的模式 + 文件拆分方案 + 每个文件的加载条件

## 决策 5: 质量保证策略

确定质量保证机制：

- 是否需要验证脚本？
- 是否需要检查清单？
- 是否需要反面案例（Anti-patterns）？
- 是否需要验证-修复-重复循环？

**输出**：质量保证方案 + 具体验证点

## 最终架构蓝图

请输出完整的目录结构：

    skill-name/
    ├── SKILL.md
    ├── scripts/
    │   └── ...
    ├── references/
    │   └── ...
    └── templates/
        └── ...

以及每个文件的简要说明和预估行数。
````

### 预期输出
一份完整的架构决策文档和目录结构蓝图。

---

## Step 3: 元数据精炼

### 用户提交
将 Step 1 和 Step 2 的输出作为上下文。

### 提示词

````
现在生成 SKILL.md 的 YAML 前置元数据（frontmatter）。这是整个 Skill 最关键的部分，因为代理启动时只加载元数据来决定是否触发这个 Skill。

## 元数据生成规则

### name 字段（必填）
- 格式：hyphen-case（全小写，用连字符分隔）
- 长度：最长 64 字符
- 要求：与目录名完全一致

### description 字段（必填，最关键）
这是 Skill 被发现和选中的唯一依据。代理需要从可能超过 100 个 Skills 中选择正确的一个。

**必须满足的 5 条黄金规则**：

1. **客观描述性语气**：因为描述会被注入系统提示词，必须使用名词短语或第三人称描述，避免使用第一人称（"I"）或第二人称（"You"）
   - 正确："Guide for creating high-quality MCP servers..."
   - 正确："Document creation and editing with tracked changes. Use for: ..."
   - 错误："I help you create MCP servers..."

2. **做什么 + 何时用**：同时说明功能和触发场景
   - 正确："Document creation and editing with tracked changes. Use for: creating .docx files, modifying content, working with tracked changes."
   - 错误："A tool for documents"

3. **包含触发关键词**：列出具体的文件类型、技术名词、操作动词
   - 正确："...Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK)."

4. **长度适中**：建议 30-200 词，不超过 1024 字符。关键不在于词数下限，而在于信息密度——每个词都应有助于触发精准度

5. **不含特殊字符**：不使用 < > 等角括号

### 可选字段
除 name 和 description 外，frontmatter 还支持以下可选字段：
- **license**: 许可证说明（如 "Complete terms in LICENSE.txt"）
- **allowed-tools**: 限制该 Skill 可调用的工具范围（数组格式）
- **metadata**: 自定义元数据（对象格式，可存储版本号、标签等）

## 输出要求

请生成 3 个候选版本的 description，并对每个版本进行自评：
- 触发精准度（1-5分）：能否在正确场景被选中？
- 触发精确度（1-5分）：在不相关场景中不被误触发的能力，5分表示几乎不会误触发
- 信息密度（1-5分）：每个词是否都有价值？

然后选出最优版本，输出最终的 YAML frontmatter：

```yaml
---
name: skill-name
description: ...
# 以下为可选字段，按需添加：
# license: ...
# allowed-tools: [...]
# metadata: {}
---
```
````

### 预期输出
经过评估和筛选的最优 YAML frontmatter。

---

## Step 4: SKILL.md 主体生成

### 用户提交
将前 3 步的所有输出作为上下文。

### 提示词

````
现在生成 SKILL.md 的正文部分。这是 Skill 被触发后代理实际读取的指令。

## 生成约束

### 硬性约束
1. **总行数 < 500 行**：超过此限制必须拆分到 reference/ 文件
2. **简洁至上**：对每一段内容自问 "AI 模型是否真的需要这个解释？" "这段内容能否证明其 token 成本的合理性？"
3. **祈使语气**：始终使用祈使句/不定式形式（"Run the script" 而非 "You should run the script"）
4. **不含 README 内容**：Skills 是给 AI 代理的，不是给人类用户的
5. **避免信息重复**：信息只存在于 SKILL.md 或 references 中，不能两处都有

### 结构要求（根据 Step 2 的架构决策）

**如果是工作流型**，使用以下结构：

    # [Skill Title]
    ## Overview（1-2句话）
    ## Process Overview（步骤概览）
    ## Step 1: [步骤名]
    ### 1.1 [子步骤]
    ### 1.2 [子步骤]
    ## Step 2: [步骤名]
    ...
    ## Validation（验证检查清单）

**如果是任务型**，使用以下结构：

    # [Skill Title]
    ## Overview（1-2句话）
    ## Quick Start（最常见操作的快速入门）
    ## [Task Category 1]
    ## [Task Category 2]
    ...
    ## Common Patterns（通用模式）

**如果是指南型**，使用以下结构：

    # [Skill Title]
    ## Overview（1-2句话）
    ## Core Principles（核心原则，3-5条）
    ## [Guideline Area 1]
    ## [Guideline Area 2]
    ...
    ## Anti-patterns（反面案例）

**如果是能力型**，使用以下结构：

    # [Skill Title]
    ## Overview（1-2句话）
    ## Core Capabilities
    ### 1. [Capability Name]
    ### 2. [Capability Name]
    ...
    ## Integration Points（集成点）

### 内容质量标准

**优秀内容的特征**（从 Anthropic 官方 Skills 中提炼）：

1. **具体的代码示例优于抽象的文字解释**
   - 好：直接给出 3 行代码示例
   - 差：用 10 行文字解释如何写代码

2. **明确的反面案例（Anti-patterns）**
   - 好："NEVER use generic AI aesthetics like Inter, Roboto, Arial..."
   - 差："Try to use good fonts"

3. **决策框架而非决策结果**
   - 好：提供判断标准，让 AI 根据上下文决策
   - 差：直接给出固定答案

4. **验证检查清单**
   - 好：每个步骤后列出具体的验证条件
   - 差：最后说一句 "make sure everything is correct"

5. **渐进式引用**
   - 好："For TypeScript patterns, see [reference/typescript.md](reference/typescript.md)"
   - 差：把所有内容都塞在主文件里

### 引用格式

当引用 reference/ 文件时，使用以下格式：
- 说明何时需要读取该文件
- 使用相对路径链接
- 简要描述文件内容

示例：

    **For advanced form filling**: Read [reference/form-guide.md](reference/form-guide.md) for field mapping patterns and validation rules.

## 输出要求

请直接输出完整的 SKILL.md 正文（不含 frontmatter，那已经在 Step 3 生成了）。在输出后，统计总行数并确认未超过 500 行。
````

### 预期输出
完整的 SKILL.md 正文内容。

---

## Step 5: 质量审计与优化

### 用户提交
将前 4 步的所有输出作为上下文。

### 提示词

````
在生成配套资源之前，先对 SKILL.md 进行严格的质量审计。这样可以确保配套资源基于最终优化后的正文生成，避免后续不匹配。

请逐项检查以下 10 个维度，每个维度打分（1-10），并给出具体的改进建议。

## 质量审计清单

> **权重说明**：以下权重为通用推荐值。对于无脚本的指南型 Skill，可将"错误处理"的权重转移到"专业深度"；对于跨平台工具型 Skill，建议提高"跨平台兼容性"的权重至 10%。请根据当前 Skill 的类型适当调整。

### 维度 1: 描述精准度（权重 15%）
- description 是否清晰说明了"做什么"和"何时用"？
- 是否包含足够的触发关键词？
- 是否使用客观描述性语气（非第一/第二人称）？
- 误触发风险是否可控？

### 维度 2: 简洁度（权重 15%）
- 是否每段内容都证明了其 token 成本的合理性？
- 是否存在 AI 模型已经知道的冗余解释？
- 代码示例是否比文字解释更简洁有效？
- SKILL.md 是否控制在 500 行以内？

### 维度 3: 结构合理性（权重 10%）
- 选择的结构模式是否最适合这个 Skill？
- 标题层级是否清晰？
- 信息组织是否符合代理的阅读逻辑？

### 维度 4: 渐进式披露（权重 10%）
- 是否合理拆分了内容到 reference/ 文件？
- 每个引用是否清楚说明了加载条件？
- 是否避免了深层嵌套引用（保持一层深度）？

### 维度 5: 自由度匹配（权重 10%）
- 指令的具体程度是否匹配任务的脆弱性？
- 脆弱操作是否有足够严格的步骤？
- 灵活操作是否给了足够的自由空间？

### 维度 6: 质量保证机制（权重 10%）
- 是否内置了验证步骤？
- 是否有检查清单？
- 是否包含反面案例（Anti-patterns）？
- 是否实现了验证-修复-重复循环？

### 维度 7: 可复用性（权重 5%）
- 是否考虑了多种使用场景？
- 是否支持参数化配置？
- 是否可以在不同项目中复用？

### 维度 8: 跨平台兼容性（权重 5%）
- 是否符合 Agent Skills 开放标准格式？
- 是否可在 Claude Code、Manus、Codex 等平台使用？
- 脚本是否有平台依赖？

### 维度 9: 错误处理（权重 10%）
- 指令中是否考虑了常见的失败场景？
- 错误信息是否可操作（指导代理如何修复）？
- 是否考虑了边缘情况？

### 维度 10: 专业深度（权重 10%）
- 是否包含了该领域的专业知识？
- 是否超越了通用 AI 的能力水平？
- 是否体现了行业最佳实践？

## 输出要求

### 评分卡

| 维度 | 得分(1-10) | 权重 | 加权得分 | 关键发现 |
|------|-----------|------|---------|---------|
| 描述精准度 | | 15% | | |
| 简洁度 | | 15% | | |
| ... | | | | |
| **总分** | | **100%** | **X.X/10** | |

### 必须修复的问题（Critical）
[列出必须修复的问题及具体修改方案]

### 建议改进的问题（Recommended）
[列出建议改进的问题及具体修改方案]

### 优化后的完整 SKILL.md
[输出经过所有修复和改进后的最终版本，包含 frontmatter]

### 资源文件变更提示
如果正文修改涉及引用路径或资源文件的变更，请在此列出需要在下一步（配套资源生成）中同步调整的文件。
````

### 预期输出
质量评分卡 + 改进方案 + 优化后的最终 SKILL.md + 资源文件变更提示。

---

## Step 6: 配套资源生成

### 用户提交
将前 5 步的所有输出（特别是 Step 5 优化后的 SKILL.md）作为上下文。

### 提示词

````
根据 Step 2 的架构决策中规划的资源文件，以及 Step 5 优化后的最终 SKILL.md，现在逐一生成配套资源。

## 生成规则

### scripts/ 目录
对于每个脚本文件：
1. 包含完整的 docstring（说明用途、参数、示例）
2. 包含错误处理和有意义的错误信息
3. 支持命令行参数（使用 argparse 或 sys.argv）
4. 可独立运行（包含 `if __name__ == "__main__":` 入口）
5. 推荐输出清晰的状态信息（如使用 emoji 前缀：✅ 成功、❌ 错误、🔍 进行中），但非强制要求，需考虑目标环境的终端兼容性

### references/ 目录
对于每个参考文件：
1. 如果超过 100 行，在顶部包含目录（Table of Contents）
2. 如果超过 10,000 词，在 SKILL.md 中提供 grep 模式以便快速定位
3. 使用清晰的标题层级
4. 包含具体的代码示例和配置片段
5. 避免与 SKILL.md 主文件的内容重复

### templates/ 目录
对于每个模板文件：
1. 包含占位符标记（使用 [PLACEHOLDER] 格式）
2. 包含注释说明每个占位符的用途
3. 可直接使用或作为起点修改

## 输出要求

请按以下格式输出每个文件：

### 文件：`[路径/文件名]`
**用途**：[一句话说明]
**加载条件**：[何时被 AI 代理读取或执行]

```
[文件内容]
```

---

请逐一生成所有规划的资源文件。
````

### 预期输出
所有配套资源文件的完整内容。

---

## Step 7: 最终组装与交付

### 用户提交
将 Step 5 优化后的 SKILL.md 和 Step 6 的配套资源作为上下文。

### 提示词

````
现在将所有组件组装为最终的 Skill 包。

## 组装清单

1. **确认 SKILL.md**：使用 Step 5 优化后的最终版本（已包含 frontmatter + 正文）
2. **确认资源文件**：列出所有 scripts/、references/、templates/ 文件
3. **生成目录结构**：输出完整的文件树

## 最终验证

请对最终的 Skill 包执行以下验证：

### 格式验证
- [ ] SKILL.md 以 `---` 开头的 YAML frontmatter
- [ ] frontmatter 包含 name 和 description 字段
- [ ] name 是 hyphen-case 格式，≤ 64 字符
- [ ] description ≤ 1024 字符，不含 < > 角括号
- [ ] SKILL.md 正文 < 500 行
- [ ] 所有引用的文件都存在
- [ ] frontmatter 中无未知字段（允许的字段：name、description、license、allowed-tools、metadata）

### 内容验证
- [ ] 没有 TODO 占位符残留
- [ ] 没有与 references/ 重复的内容
- [ ] 所有代码示例可运行
- [ ] 所有链接路径正确
- [ ] SKILL.md 中的引用路径与实际资源文件一致

### 最佳实践验证
- [ ] 使用祈使语气
- [ ] 不含 README 式的人类说明
- [ ] 不解释 AI 已知的常识
- [ ] 反面案例明确标注

## 输出要求

### 1. 完整的 SKILL.md（可直接使用）
```markdown
[完整内容]
```

### 2. 所有配套文件（逐一输出）

### 3. 使用说明
- 如何安装这个 Skill
- 如何在对话中触发
- 典型的使用示例（3个）

### 4. 迭代建议
- 首次使用后应关注的改进方向
- 建议收集的用户反馈
- 后续版本的功能规划
````

### 预期输出
完整的、可直接部署的 Skill 包，附带使用说明和迭代建议。

---

## 附录 A: 快速参考卡

### 优秀 Skill 的 10 条黄金法则

| 编号 | 法则 | 来源 |
|------|------|------|
| 1 | **简洁至上**：只提供 AI 不知道的信息 | skill-creator 核心原则 "Concise is Key" |
| 2 | **描述即触发器**：description 决定 Skill 是否被选中 | skill-creator "Primary trigger mechanism" |
| 3 | **渐进式披露**：SKILL.md < 500 行，其余按需加载 | skill-creator "Three-level loading system" |
| 4 | **自由度匹配**：指令严格度匹配任务脆弱度 | skill-creator "Set Appropriate Degrees of Freedom" |
| 5 | **代码优于文字**：3 行代码示例胜过 10 行解释 | skill-creator "Prefer concise examples over verbose explanations" |
| 6 | **反面案例必备**：明确告诉 AI 不要做什么 | frontend-design 案例（禁用 Inter/Roboto/Arial） |
| 7 | **验证内置**：每个关键步骤后都有验证点 | mcp-builder 案例（四阶段各有检查清单） |
| 8 | **一层引用**：所有 reference 直接从 SKILL.md 链接 | progressive-disclosure-patterns.md "Avoid deeply nested references" |
| 9 | **祈使语气**：使用 "Run" 而非 "You should run" | skill-creator "Always use imperative/infinitive form" |
| 10 | **为 AI 写，非为人写**：不需要 README 和 CHANGELOG | skill-creator "Do NOT include: README.md, CHANGELOG.md" |

### 结构模式速查

```
需要顺序步骤？ → 工作流型（Workflow-Based）
需要多种操作？ → 任务型（Task-Based）
需要制定标准？ → 指南型（Guidelines-Based）
需要多个功能？ → 能力型（Capabilities-Based）
```

### 自由度速查

```
操作可能出错？ → 低自由度（具体脚本）
有首选方式？   → 中自由度（带参数模板）
多种方式均可？ → 高自由度（文本指导）
```

---

## 附录 B: 优秀 Skills 案例库

### 案例 1: frontend-design（指南型 + 高自由度）

**亮点**: 将设计师的审美判断力编码为可执行指令；明确的反面案例（禁用 Inter/Roboto/Arial）；五维美学框架（Typography、Color、Motion、Spatial、Backgrounds）。这是指南型 Skill 的标杆——它不告诉 AI 具体用什么字体，而是提供判断框架让 AI 根据上下文选择。

### 案例 2: mcp-builder（工作流型 + 中自由度）

**亮点**: 四阶段渐进式工作流（深度研究→实现→审查测试→创建评估）；reference/ 目录包含 5 个按需加载的参考文件（mcp_best_practices.md、node_mcp_server.md、python_mcp_server.md、evaluation.md 等）；支持 TypeScript/Python 双栈；内置评估生成阶段。这是复杂工作流 Skill 的典范——主文件只包含流程概览，技术细节全部按需加载。

### 案例 3: PDF 表单填充（工作流型 + 低自由度）

**亮点**: 5 步严格流程（分析→映射→验证→填充→验证）；每步都有可执行脚本；验证-修复-重复循环。这是低自由度 Skill 的典范——操作脆弱易错，因此每一步都有严格的脚本和验证。

### 案例 4: brand-guidelines（指南型 + 中自由度）

**亮点**: 将品牌知识编码为可执行约束；templates/ 包含 logo、字体等品牌资产。展示了如何将企业特有的隐性知识（品牌规范）转化为 AI 可执行的显性指令。

### 案例 5: gog - Google Workspace CLI（能力型 + 低自由度）

**亮点**: 覆盖 Gmail、Drive、Docs、Sheets 四大产品；统一的 CLI 接口；29.4K 下载量的社区验证。展示了能力型 Skill 如何通过统一接口整合多个相关功能。

---

## 附录 C: 常见错误与修复

| 常见错误 | 为什么是错误 | 如何修复 |
|---------|------------|---------|
| description 太短（< 20 词） | 无法提供足够的触发信息 | 扩展到 30-200 词，包含具体场景 |
| description 太长（> 1024 字符） | 超出格式限制 | 精简到核心功能和触发场景 |
| SKILL.md 超过 500 行 | 上下文窗口浪费 | 拆分到 reference/ 文件 |
| 解释 AI 已知的常识 | 浪费 token | 删除，假设 AI 已经知道 |
| 没有反面案例 | AI 可能走向通用/低质量输出 | 添加 "NEVER" 和 "AVOID" 指令 |
| 深层嵌套引用 | AI 可能不完整读取 | 所有引用保持一层深度 |
| 使用第一/第二人称描述 | 与系统提示词注入不兼容 | 改为客观描述性语气 |
| 没有验证步骤 | 无法保证输出质量 | 在关键步骤后添加验证检查 |
| 混合了 README 内容 | Skills 是给 AI 的，不是给人的 | 删除所有面向人类的说明 |
| 信息在 SKILL.md 和 reference 中重复 | 浪费 token + 可能不一致 | 信息只存在于一处 |

---

## 附录 D: 修复日志（v1.0 → v2.0）

| 编号 | 类别 | 修复内容 |
|------|------|---------|
| C-1 | 格式 | 将版本信息从引用块改为普通段落，避免 PDF 标题重复渲染 |
| C-2 | 内容 | 确保附录 B 完整包含 5 个案例的详细分析 |
| C-3 | 格式 | 所有提示词外层改用四反引号（````）包裹，内部结构模板改用缩进代码块，彻底解决代码块嵌套冲突 |
| M-1 | 技术 | description 长度建议从"50-200 词"修正为"30-200 词"，与官方实际用法一致 |
| M-2 | 技术 | 补充 frontmatter 可选字段说明（license、allowed-tools、metadata） |
| M-3 | 技术 | "第三人称撰写"改为"客观描述性语气"，更准确反映官方用法 |
| M-4 | 技术 | 明确标注自由度类比中"有标记的小径"为补充类比，非官方原文 |
| M-5 | 技术 | references/ 触发条件从"内容超过 500 行"扩展为"按需加载的参考信息 + 溢出内容" |
| D-1 | 逻辑 | Step 1 增加"竞品与已有 Skills 分析"环节 |
| D-2 | 逻辑 | 将 Step 5（原配套资源生成）和 Step 6（原质量审计）对调顺序，确保配套资源基于审计优化后的正文生成 |
| D-3 | 逻辑 | 质量审计增加权重灵活性说明和资源文件变更提示 |
| D-4 | 准确性 | 黄金法则来源标注细化到具体文档章节 |
| E-1 | 优化 | 附录 D 记录完整修复日志（本附录） |
| E-2 | 优化 | 工具概述中增加平台差异提示 |
| E-3 | 优化 | 脚本 emoji 输出从"要求"改为"推荐" |
| E-4 | 优化 | 增加大文件（>10k 词）的 grep 模式指导 |
| E-5 | 优化 | "误触发风险"评分改为"触发精确度"，高分始终代表正面含义 |
