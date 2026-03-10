# Skills

**AI Agent Skills 集合** — 基于 Agent Skills 开放标准构建的高质量 Skill 仓库。

---

## 仓库简介

本仓库是一个标准化的 AI Agent Skills 集合，遵循 [Agent Skills 开放标准](https://agentskills.io) 规范构建。每个 Skill 都经过严格的质量审计，确保在 Claude Code、Manus、OpenAI Codex、GitHub Copilot、Cursor 等主流 AI 平台上可直接使用。

仓库同时包含 **Perfect Skill Generator** — 一个基于对 100+ 优秀 Skills 深度分析提炼而成的 Skill 生成工具，可用于快速创建符合行业最佳实践的新 Skill。

---

## 目录结构

```
skills/
├── README.md                    # 本文件
├── CONTRIBUTING.md              # 贡献指南与质量标准
├── skills/                      # Skills 集合（每个子目录为一个独立 Skill）
│   └── {skill-name}/
│       ├── SKILL.md             # Skill 主文件（必需）
│       ├── scripts/             # 可执行脚本（可选）
│       ├── references/          # 按需加载的参考文档（可选）
│       └── templates/           # 输出模板/资产文件（可选）
├── generator/                   # Perfect Skill Generator 工具
│   ├── perfect-skill-generator.md   # v2.0 完整版生成器
│   └── research-foundation.md       # 研究基础报告
└── docs/                        # 文档与参考资料
    ├── research-report.md           # 优秀 AI Skills 全面分析报告
    └── review-report.md             # v1→v2 审查修复报告
```

---

## Skills 索引

| Skill 名称 | 类型 | 自由度 | 简介 |
|------------|------|--------|------|
| *即将添加* | — | — | 使用 Perfect Skill Generator 创建你的第一个 Skill |

> 随着新 Skill 的添加，此索引表将持续更新。

---

## 快速开始

### 使用已有 Skill

1. 进入 `skills/` 目录，找到目标 Skill 的子目录
2. 将整个目录复制到你的 AI 平台的 Skills 目录中：
   - **Claude Code**: `~/.claude/skills/` 或项目级 `.claude/skills/`
   - **Manus**: 通过 Project Skills 功能上传
   - **其他平台**: 参考各平台的 Skills 加载方式
3. 在对话中描述相关需求，AI 代理将自动触发匹配的 Skill

### 创建新 Skill

本仓库内置了 **Perfect Skill Generator v2.0**，这是一个 7 步结构化提示词系统，可引导 AI 模型从零生成生产级 Skill。

1. 打开 [`generator/perfect-skill-generator.md`](generator/perfect-skill-generator.md)
2. 按照 Step 1 到 Step 7 的顺序，将提示词发送给 AI 模型
3. 每个步骤完成后，将输出作为下一步的上下文继续对话
4. 最终获得完整的 Skill 包，放入 `skills/` 目录即可使用

**7 个步骤概览**：

| 步骤 | 名称 | 核心作用 |
|------|------|--------|
| Step 1 | 需求深度挖掘 | 5 维框架分析（定位/边界/场景/知识缺口/竞品） |
| Step 2 | 架构决策引擎 | 5 大决策（结构模式/自由度/资源规划/披露策略/质量保证） |
| Step 3 | 元数据精炼 | 3 个候选 description 自评打分，选出最优触发器 |
| Step 4 | SKILL.md 主体生成 | 按架构决策生成 < 500 行的精炼主体 |
| Step 5 | 质量审计与优化 | 10 维度加权评分 + 自动修复 |
| Step 6 | 配套资源生成 | 生成 scripts/、references/、templates/ 配套文件 |
| Step 7 | 最终组装与交付 | 格式验证 + 内容验证 + 最佳实践验证 |

---

## Skill 质量标准

本仓库中的每个 Skill 都必须满足以下标准（详见 [CONTRIBUTING.md](CONTRIBUTING.md)）：

| 维度 | 要求 |
|------|------|
| **格式规范** | YAML frontmatter 包含 name 和 description；name 为 hyphen-case，不超过 64 字符 |
| **简洁度** | SKILL.md 正文不超过 500 行；不解释 AI 已知的常识 |
| **描述质量** | description 使用客观描述性语气，包含触发关键词，30-200 词 |
| **渐进式披露** | 详细内容拆分到 references/，保持一层引用深度 |
| **质量保证** | 包含验证步骤或检查清单；包含反面案例（Anti-patterns） |
| **语气规范** | 使用祈使语气；不含面向人类的 README 式说明 |

---

## 参考资源

本仓库的设计理念和质量标准基于以下权威来源：

| 来源 | 说明 |
|------|------|
| [Anthropic Skills 仓库](https://github.com/anthropics/skills) | 官方 17 个 Skills 实现（88.1k Stars） |
| [Agent Skills 开放标准](https://agentskills.io) | 跨平台 Skills 互操作规范 |
| [Anthropic 最佳实践文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | 官方 Skill 设计指南 |
| [Manus Skills 博客](https://manus.im/blog/manus-skills) | Manus 平台 Skills 特性介绍 |

---

## 许可证

本仓库中的工具和文档采用 MIT 许可证。各 Skill 可能有独立的许可声明，请查看各 Skill 目录中的说明。
