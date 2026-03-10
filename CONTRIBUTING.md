# 贡献指南

本文档定义了向 Skills 仓库添加新 Skill 的标准流程和质量要求。

---

## 添加新 Skill 的流程

### 1. 设计阶段

推荐使用本仓库内置的 [Perfect Skill Generator](generator/perfect-skill-generator.md) 进行 Skill 设计。该工具通过 7 个步骤引导你完成从需求分析到最终交付的全过程。

如果选择手动创建，请确保完成以下设计决策：

| 决策项 | 说明 |
|--------|------|
| **结构模式** | 工作流型、任务型、指南型、能力型，选择最匹配的一种 |
| **自由度级别** | 高（文本指导）、中（带参数模板）、低（具体脚本） |
| **资源规划** | 是否需要 scripts/、references/、templates/ |
| **渐进式披露** | 如何拆分内容，何时按需加载 |

### 2. 创建目录

在 `skills/` 目录下创建以你的 Skill 命名的子目录：

```
skills/
└── your-skill-name/
    ├── SKILL.md             # 必需
    ├── scripts/             # 可选
    ├── references/          # 可选
    └── templates/           # 可选
```

目录名必须与 SKILL.md 中 frontmatter 的 `name` 字段完全一致，使用 hyphen-case 格式。

### 3. 编写 SKILL.md

SKILL.md 是 Skill 的核心文件，必须包含以下部分：

**YAML Frontmatter（必需）**：

```yaml
---
name: your-skill-name
description: >
  Concise description of what this skill does and when to use it.
  Include specific trigger keywords, file types, and use cases.
---
```

**正文（必需）**：根据选择的结构模式编写，控制在 500 行以内。

### 4. 质量自检

提交前请逐项确认以下检查清单：

#### 格式验证

- [ ] SKILL.md 以 `---` 开头的 YAML frontmatter
- [ ] frontmatter 包含 `name` 和 `description` 字段
- [ ] `name` 是 hyphen-case 格式，不超过 64 字符
- [ ] `description` 不超过 1024 字符，不含 `< >` 角括号
- [ ] SKILL.md 正文不超过 500 行
- [ ] 所有引用的文件都存在且路径正确

#### 内容验证

- [ ] 没有 TODO 占位符残留
- [ ] 没有与 references/ 重复的内容
- [ ] 所有代码示例可运行
- [ ] 所有链接路径正确

#### 最佳实践验证

- [ ] 使用祈使语气（"Run" 而非 "You should run"）
- [ ] 不含 README 式的人类说明
- [ ] 不解释 AI 已知的常识
- [ ] 包含反面案例（Anti-patterns）
- [ ] 使用客观描述性语气编写 description

### 5. 更新索引

在仓库根目录的 `README.md` 中的 **Skills 索引** 表格中添加你的 Skill 条目。

---

## 质量标准详解

### Description 编写规范

Description 是 Skill 被发现和选中的唯一依据，是整个 Skill 最关键的部分。

| 规则 | 说明 | 示例 |
|------|------|------|
| **客观描述性语气** | 避免第一/第二人称 | "Guide for creating..." 而非 "I help you create..." |
| **做什么 + 何时用** | 同时说明功能和触发场景 | "Document creation and editing. Use for: creating .docx files..." |
| **包含触发关键词** | 列出文件类型、技术名词、操作动词 | "...whether in Python (FastMCP) or Node/TypeScript (MCP SDK)" |
| **长度适中** | 30-200 词，不超过 1024 字符 | 关键在于信息密度，每个词都应有助于触发精准度 |

### 简洁度要求

对每一段内容自问：

> "AI 模型是否真的需要这个解释？这段内容能否证明其 token 成本的合理性？"

如果答案是否定的，删除它。具体的代码示例优于抽象的文字解释——3 行代码胜过 10 行描述。

### 渐进式披露

SKILL.md 是代理启动时立即加载的内容，因此必须控制体积。详细的参考信息应放在 `references/` 目录中按需加载：

| 内容类型 | 放在 SKILL.md | 放在 references/ |
|---------|--------------|-----------------|
| 核心流程/原则 | 是 | 否 |
| 特定技术栈详细指南 | 否 | 是 |
| 通用代码示例 | 是 | 否 |
| 大量 API 参考 | 否 | 是 |
| 验证检查清单 | 是 | 否 |

引用 reference 文件时，必须在 SKILL.md 中说明加载条件：

```markdown
**For TypeScript patterns**: Read [references/typescript.md](references/typescript.md) for detailed implementation guide.
```

---

## 命名规范

| 项目 | 格式 | 示例 |
|------|------|------|
| 目录名 | hyphen-case | `frontend-design`、`mcp-builder` |
| SKILL.md 中的 name | 与目录名一致 | `frontend-design` |
| 脚本文件 | snake_case | `validate_output.py` |
| 参考文件 | snake_case 或 hyphen-case | `typescript-guide.md` |
| 模板文件 | 描述性命名 | `report-template.html` |
