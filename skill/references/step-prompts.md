# SkillForge Step Prompts

Complete prompt templates for each step of the 7-step pipeline. SKILL.md references specific sections by step number.

## Table of Contents

- [System Context](#system-context)
- [Step 1: Requirement Deep Analysis](#step-1)
- [Step 2: Architecture Decisions](#step-2)
- [Step 3: Metadata Crafting](#step-3)
- [Step 4: SKILL.md Body Generation](#step-4)
- [Step 5: Quality Audit](#step-5)
- [Step 6: Resource File Generation](#step-6)
- [Step 7: Usage Documentation](#step-7)

---

## System Context

Set this as the system prompt (or prepend to Step 1) before starting the pipeline:

> You are an expert Agent Skills architect. You design production-grade Agent Skills following best practices from the Manus Skills ecosystem and the Agent Skills open standard.
>
> Core Design Principles:
> 1. Concise is Key — Context window is a public good. Only provide information the AI model doesn't already know. Challenge each paragraph: "Does this justify its token cost?"
> 2. Description is the trigger — It determines whether the Skill gets selected. Must include WHAT the skill does AND WHEN to use it.
> 3. Progressive disclosure — SKILL.md is the main entry (<500 lines). Supporting files in scripts/, references/, templates/ are loaded on demand.
> 4. Code examples > text explanations — Prefer concise, runnable examples over verbose descriptions.
> 5. Anti-patterns are essential — Show what NOT to do using ❌/✅ contrast format.
> 6. Imperative tone — "Run" not "You should run".
> 7. No auxiliary files — Do NOT include README.md, CHANGELOG.md, or other documentation. Skills are for AI agents, not humans.
>
> Your goal is to produce COMPLETE, ACCURATE, and PRODUCTION-READY output. Every section should be thorough and actionable.
> Always respond in the same language as the user's input.

---

<a id="step-1"></a>
## Step 1: Requirement Deep Analysis

**Input:** User's skill requirement (name, domain, core capabilities, scenarios, notes).

**Prompt:**

请对以上需求进行深度分析，输出结构化需求文档（2000-5000 字）。

### 输出结构

#### 1. 核心定位
- 名称（hyphen-case 格式）
- 一句话定位（20 字以内）
- 目标用户画像（谁会使用这个 Skill）
- 核心价值主张（这个 Skill 提供了什么 AI 模型原本不具备的能力）

#### 2. 功能边界
- **核心功能**（3-7 个）：每个功能用「输入 → 处理逻辑 → 输出」三元组描述
- **扩展功能**（可选增强）：列出但标注为非必需
- **明确排除**：这个 Skill 不做什么（防止 Skill 被错误触发）

#### 3. 使用场景（至少 5 个）
每个场景包含：
- 用户的原始请求（自然语言）
- Skill 的期望行为（步骤描述）
- 期望输出格式（代码/文档/结构化数据）

#### 4. 知识缺口分析
这是最关键的分析，决定了 SKILL.md 应该包含什么内容：
- **AI 已知**：列出 AI 模型在此领域已经掌握的知识（这些内容不应出现在 SKILL.md 中）
- **AI 不知道**：列出 AI 模型缺失的领域知识、特定流程、配置细节（这些是 SKILL.md 的核心内容）
- **AI 易犯错**：列出 AI 模型在此领域常见的错误模式（这些需要反面案例）

#### 5. 依赖和约束
- 外部工具/API 依赖
- 平台兼容性要求
- 性能/安全约束

---

<a id="step-2"></a>
## Step 2: Architecture Decisions

**Input:** Step 1 output (requirement analysis document).

**Prompt:**

基于以上需求分析，做出 5 个关键架构决策。

### 输出结构

#### 决策 1：结构模式
从以下模式中选择一个，并说明理由：
- **工作流型**（step-by-step）：适用于有固定流程的任务
- **任务型**（task-oriented）：适用于目标明确但路径灵活的任务
- **指南型**（guide）：适用于需要领域知识指导的任务
- **能力型**（capability）：适用于增强特定能力的任务

#### 决策 2：自由度级别
- **高自由度**：创意型任务，只提供原则和示例
- **中自由度**：有框架的灵活性，提供流程但允许变通
- **低自由度**：严格流程，提供精确脚本和参数

说明选择理由和具体约束规则。

#### 决策 3：资源文件规划

列出所有需要的资源文件。对每个文件，使用以下格式：

| 文件路径 | 类型 | 用途 | 大致行数 |
|----------|------|------|----------|
| scripts/validate.py | 脚本 | 验证输出格式 | ~50 |
| references/api-spec.md | 参考 | API 规格文档 | ~200 |

注意：
- 文件路径必须使用 `scripts/`、`references/`、`templates/` 前缀
- 如果不需要资源文件，明确写「无需额外资源文件」
- 不要规划 README.md、CHANGELOG.md 等辅助文件

#### 决策 4：渐进式披露策略

SKILL.md 必须控制在 500 行以内。明确划分：
- **SKILL.md 中包含**：核心工作流程、关键规则、精选代码示例（<500 行）
- **references/ 中包含**：详细参考文档、完整 API 规格、大型示例集
- **scripts/ 中包含**：可执行脚本、自动化工具
- **加载触发条件**：什么情况下需要读取哪个资源文件

#### 决策 5：质量保证方案
- 验证检查清单（3-5 项）
- 常见错误和修复方案
- 输出质量标准

#### 目录结构

最后，输出完整的目录结构树：
```
skill-name/
├── SKILL.md
├── scripts/
│   └── ...
├── references/
│   └── ...
└── templates/
    └── ...
```

---

<a id="step-3"></a>
## Step 3: Metadata Crafting

**Input:** Step 1 + Step 2 outputs.

**Prompt:**

生成 SKILL.md 的 YAML frontmatter 元数据。

### 任务

#### 第一步：生成 3 个候选 description

对每个候选 description 进行自评打分：

| 候选 | 触发精准度 (1-5) | 能力覆盖度 (1-5) | 信息密度 (1-5) | 总分 |
|------|-------------------|-------------------|----------------|------|
| A    |                   |                   |                |      |
| B    |                   |                   |                |      |
| C    |                   |                   |                |      |

评分标准：
- **触发精准度**：用户说什么时会触发这个 Skill？description 是否覆盖了这些触发词？
- **能力覆盖度**：description 是否完整描述了 Skill 的所有核心能力？是否包含了「做什么」和「何时用」？
- **信息密度**：每个词是否都有价值？是否有冗余表述？

#### 第二步：输出最终 YAML frontmatter

选择得分最高的候选，输出最终版本。

格式要求：
- 使用 ```yaml 标记
- name 字段使用实际的 skill 名称
- description 使用 30-80 词，客观描述性语气

```yaml
---
name: skill-name
description: |
  最优 description 内容
---
```

---

<a id="step-4"></a>
## Step 4: SKILL.md Body Generation

**Input:** Step 1 + Step 2 + Step 3 outputs.

**Prompt:**

现在生成 SKILL.md 的完整正文（不含 frontmatter，frontmatter 已在 Step 3 生成）。

### 核心原则

遵循 Manus Skills 最佳实践：
- **Concise is Key**：只包含 AI 模型不已知的领域知识。对每段内容自问：「AI 真的需要这个解释吗？」
- **控制长度**：SKILL.md 正文应控制在 **150-450 行**以内。超过 500 行的内容应拆分到 references/ 中。
- **祈使语气**：全程使用 "Run"、"Check"、"Ensure" 等祈使语气，而非 "You should run"。
- **代码示例 > 文字说明**：用简洁的可运行示例替代冗长的文字描述。
- **反面案例必备**：使用 ❌/✅ 对比格式展示常见错误和正确做法。

### 结构要求

根据 Step 2 的架构决策，组织以下内容（根据实际需要调整章节）：

1. **概述**（2-3 句话说明 Skill 的核心用途和工作方式）
2. **核心工作流程**（主要步骤或决策流程，使用编号列表或流程图）
3. **详细规则和指令**（领域特定的规则、约束、配置要求）
4. **代码示例**（正确示例 + 错误示例对比，使用 ❌ Bad / ✅ Good 格式）
5. **边界情况处理**（特殊情况的处理策略）
6. **输出格式规范**（如果 Skill 有特定的输出格式要求）
7. **验证检查清单**（使用 Markdown checkbox 格式）

### 关键约束

- 不要包含 AI 模型已经知道的通用知识（如基础编程概念、常见框架用法）
- 不要重复 description 中已有的信息
- 如果某个章节内容超过 100 行，考虑将详细内容移到 references/ 中，在 SKILL.md 中只保留摘要和「详见 references/xxx.md」的引用
- 确保所有代码示例都是完整可运行的，不要使用 `...` 省略号

请直接输出 SKILL.md 正文内容（Markdown 格式），不需要包裹在代码块中。

---

<a id="step-5"></a>
## Step 5: Quality Audit

**Input:** Step 3 frontmatter + Step 4 body (combined as the draft SKILL.md).

**Prompt:**

对以上生成的 SKILL.md（Step 3 的 frontmatter + Step 4 的正文）进行严格的质量审计，然后输出修复后的完整版本。

### 输出格式（严格遵守以下结构）

你的输出必须严格包含以下两个部分，且顺序不可调换：

#### PART A：评分卡

输出评分表格（10 个维度，每个 1-10 分）：

| 维度 | 分数 | 问题（如有） |
|------|------|-------------|
| 1. Description 触发精准度 | | |
| 2. 知识增量（是否只含 AI 不知道的内容） | | |
| 3. 代码示例质量（可运行、有代表性） | | |
| 4. 反面案例覆盖（❌/✅ 对比格式） | | |
| 5. 结构清晰度 | | |
| 6. 渐进式披露（<500 行，详细内容在 references/） | | |
| 7. 语气一致性（全程祈使语气） | | |
| 8. 边界处理 | | |
| 9. 可操作性（指令可直接执行） | | |
| 10. 完整性（无遗漏关键内容） | | |

对每个低于 8 分的维度，简要说明问题和修复方案（每个不超过 3 行）。

PART A 限制在 1500 字以内。不要在 PART A 中复制或引用 SKILL.md 的完整内容。

#### PART B：优化后的完整 SKILL.md

输出优化后的完整 SKILL.md（包含 YAML frontmatter + 正文）。

这是最终版本，将直接写入文件系统。确保所有 PART A 中发现的问题都已修复。

---

<a id="step-6"></a>
## Step 6: Resource File Generation

**Input:** Step 2 architecture decisions (resource file plan) + Step 5 final SKILL.md.

**Prompt:**

根据 Step 2 架构决策中的资源文件规划，生成所有配套资源文件。

### 关键规则

1. **严格按照 Step 2 中规划的文件列表生成**，不要遗漏也不要额外添加未规划的文件
2. 如果 Step 2 中明确写了「无需额外资源文件」，则输出「无需生成资源文件」即可
3. 每个文件内容必须完整、可直接使用，不要用 `...` 省略号或 `TODO` 占位符
4. 脚本文件必须包含 shebang 行（如 `#!/usr/bin/env python3`）

### 输出格式

对每个文件，按以下格式输出：

```
### FILE: `文件路径`
```

紧跟一个带语言标记的完整代码块。

#### 格式示例

```
### FILE: `scripts/validate.py`
```

```python
#!/usr/bin/env python3
import sys
# complete code
```

```
### FILE: `references/api-guide.md`
```

```markdown
# API Guide
Complete content...
```

格式要求：
- 每个文件必须以 `### FILE:` 标记开头
- 路径必须使用 `scripts/`、`references/`、`templates/` 前缀
- 紧跟一个带语言标记的完整代码块
- 不要生成 SKILL.md（已在 Step 5 中完成）
- 不要生成 README.md、CHANGELOG.md 等辅助文件

---

<a id="step-7"></a>
## Step 7: Usage Documentation

**Input:** All previous steps' outputs.

**Prompt:**

为此 Skill 生成使用说明。

### 输出要求

请严格按以下 4 个部分输出，使用 Markdown 格式：

#### 1. 安装说明
简要说明如何将此 Skill 安装到 AI 平台（1-3 句话）。

#### 2. 触发示例
列出至少 5 个用户可以说的自然语言请求来触发此 Skill。

每个示例必须用引号包裹，格式如下：
- "请帮我用 {skill-name} 完成 XXX"
- "我需要 XXX，请使用 {skill-name}"
- "帮我 XXX"

#### 3. 迭代建议
提供 3-5 条具体的迭代改进建议，说明如何根据使用反馈持续优化此 Skill。

#### 4. 验证清单
提供 Skill 包完整性的检查项，使用 checkbox 格式：
- [ ] SKILL.md 存在且包含有效的 YAML frontmatter
- [ ] description 包含「做什么」和「何时用」
- [ ] ...
