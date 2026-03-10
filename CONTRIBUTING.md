# 贡献指南

感谢你对 SkillForge 的关注。本文档定义了向仓库贡献 Skill 的标准流程和质量要求。

---

## 添加新 Skill 的流程

### 1. 设计阶段

推荐使用本仓库内置的 [Perfect Skill Generator](generator/perfect-skill-generator.md) 进行 Skill 设计。该工具通过 7 个步骤引导你完成从需求分析到最终交付的全过程。

如果选择手动创建，请确保完成以下设计决策：

| 决策项 | 说明 |
|--------|------|
| 结构模式 | 工作流型、任务型、指南型、能力型，选择最匹配的一种 |
| 自由度级别 | 高（文本指导）、中（带参数模板）、低（具体脚本） |
| 资源规划 | 是否需要 scripts/、references/、templates/ |
| 渐进式披露 | 如何拆分内容，何时按需加载 |

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

**正文结构建议**：

- 核心工作流程或决策逻辑
- 关键规则和约束条件
- 反面案例（Anti-patterns）
- 验证检查清单

### 4. 质量自检

提交前请对照以下清单自检：

| 检查项 | 要求 |
|--------|------|
| frontmatter 格式 | `name` 为 hyphen-case，不超过 64 字符 |
| description 质量 | 客观描述性语气，30-200 词，包含触发关键词 |
| 正文行数 | 150-450 行（不含 frontmatter） |
| 语气 | 祈使语气，面向 AI 代理而非人类读者 |
| 常识过滤 | 不解释 AI 模型已知的通用知识 |
| 渐进式披露 | 详细内容拆分到 references/，保持一层引用深度 |
| 反面案例 | 包含至少一个 Anti-pattern 示例 |
| 验证步骤 | 包含检查清单或验证逻辑 |

### 5. 提交 Pull Request

1. Fork 本仓库
2. 在 `skills/` 目录下添加你的 Skill 目录
3. 更新 README.md 中的 Skills 索引表
4. 提交 PR，描述你的 Skill 的核心功能和适用场景

---

## 改进现有内容

如果你发现现有 Skill 或文档中的问题，欢迎提交 Issue 或 PR。改进类型包括但不限于：

- 修复 SKILL.md 中的错误或遗漏
- 优化 description 的触发精准度
- 补充反面案例或验证步骤
- 改进 generator 的提示词质量

---

## 许可证

贡献到本仓库的内容将遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证。提交 PR 即表示你同意以该许可证发布你的贡献。
