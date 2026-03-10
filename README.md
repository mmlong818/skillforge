# SkillForge

**AI Agent Skills 锻造炉** — 一个结构化的 7 步提示词系统，从零锻造生产级 Agent Skills。

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/309866237129684078/GLnMzhHYFmrcXYPw.png" alt="SkillForge Screenshot" width="700">
</p>

---

## 这是什么

SkillForge 是一套经过实战验证的 **Agent Skills 生成方法论**，基于对 Anthropic 官方 Skills 仓库（88.1k Stars）、100+ 社区优秀 Skills、Agent Skills 开放标准规范的深度分析提炼而成。

它解决一个核心问题：**如何让 AI 模型生成真正可用的、符合行业最佳实践的 Agent Skill，而不是看起来像模像样但实际无法触发或质量低下的半成品。**

本仓库包含以下内容：

| 目录 | 内容 | 说明 |
|------|------|------|
| `generator/` | Perfect Skill Generator v2.0 | 7 步结构化提示词系统，引导 AI 从零生成 Skill |
| `webapp/` | SkillForge Web App | 完整的 Web 应用源码，将 7 步流程自动化为一键生成 |
| `skills/` | Skills 集合 | 使用 SkillForge 生成的高质量 Skill（持续添加中） |
| `docs/` | 研究报告 | 支撑方法论的分析报告和审查记录 |

---

## 快速开始

### 方式一：使用提示词手动生成（推荐）

打开 [`generator/perfect-skill-generator.md`](generator/perfect-skill-generator.md)，按照 Step 1 到 Step 7 的顺序将提示词发送给任意 AI 模型（Claude、GPT、Gemini 等均可）。每个步骤完成后，将输出作为下一步的上下文继续对话。

**7 步流程概览**：

| 步骤 | 名称 | 核心作用 |
|------|------|----------|
| Step 1 | 需求深度挖掘 | 5 维框架分析：定位、边界、场景、知识缺口、竞品 |
| Step 2 | 架构决策引擎 | 5 大决策：结构模式、自由度、资源规划、披露策略、质量保证 |
| Step 3 | 元数据精炼 | 3 个候选 description 自评打分，选出最优触发器 |
| Step 4 | SKILL.md 主体生成 | 按架构决策生成精炼的指令主体（150-450 行） |
| Step 5 | 质量审计与优化 | 10 维度加权评分 + 自动修复低分项 |
| Step 6 | 配套资源生成 | 生成 scripts/、references/、templates/ 等配套文件 |
| Step 7 | 最终组装与交付 | 格式验证 + 内容验证 + 最佳实践验证 |

### 方式二：自部署 Web 应用

SkillForge 同时提供了完整的 Web 应用源码（`webapp/` 目录），你可以自行部署运行。详见 [webapp/README.md](webapp/README.md)。

技术栈：React 19 + Express 4 + tRPC 11 + MySQL，支持任意 OpenAI-compatible LLM API。

### 使用已有 Skill

1. 进入 `skills/` 目录，找到目标 Skill 的子目录
2. 将整个目录复制到你的 AI 平台的 Skills 目录中：
   - **Claude Code**: `~/.claude/skills/` 或项目级 `.claude/skills/`
   - **Manus**: 通过 Project Skills 功能上传
   - **其他平台**: 参考各平台的 Skills 加载方式
3. 在对话中描述相关需求，AI 代理将自动触发匹配的 Skill

---

## Skills 索引

| Skill 名称 | 类型 | 简介 |
|------------|------|------|
| *持续添加中* | — | 欢迎使用 SkillForge 创建并贡献你的 Skill |

---

## Skill 质量标准

本仓库中的每个 Skill 都必须满足以下标准（详见 [CONTRIBUTING.md](CONTRIBUTING.md)）：

| 维度 | 要求 |
|------|------|
| 格式规范 | YAML frontmatter 包含 `name` 和 `description`；name 为 hyphen-case，不超过 64 字符 |
| 简洁度 | SKILL.md 正文 150-450 行；不解释 AI 已知的常识 |
| 描述质量 | description 使用客观描述性语气，包含触发关键词，30-200 词 |
| 渐进式披露 | 详细内容拆分到 `references/`，保持一层引用深度 |
| 质量保证 | 包含验证步骤或检查清单；包含反面案例（Anti-patterns） |
| 语气规范 | 使用祈使语气；不含面向人类的 README 式说明 |

---

## 目录结构

```
skillforge/
├── README.md                        # 本文件
├── LICENSE                          # CC BY-NC-SA 4.0 许可证
├── CONTRIBUTING.md                  # 贡献指南与质量标准
├── webapp/                          # SkillForge Web App 完整源码
│   ├── README.md                    # Web App 部署指南
│   ├── .env.example                 # 环境变量模板
│   ├── client/                      # 前端 React 应用
│   ├── server/                      # 后端 Express + tRPC
│   ├── drizzle/                     # 数据库 Schema 和迁移
│   └── shared/                      # 前后端共享类型
├── skills/                          # Skills 集合
│   └── {skill-name}/
│       ├── SKILL.md                 # Skill 主文件（必需）
│       ├── scripts/                 # 可执行脚本（可选）
│       ├── references/              # 按需加载的参考文档（可选）
│       └── templates/               # 输出模板（可选）
├── generator/                       # SkillForge 生成器
│   ├── perfect-skill-generator.md   # v2.0 完整版 7 步生成器
│   └── research-foundation.md       # 研究基础报告
└── docs/                            # 文档与参考资料
    ├── research-report.md           # 优秀 AI Skills 全面分析报告
    └── review-report.md             # v1 → v2 审查修复报告
```

---

## 研究基础

SkillForge 的设计理念和质量标准基于以下权威来源的系统性分析：

| 来源 | 说明 |
|------|------|
| [Anthropic Skills 仓库](https://github.com/anthropics/skills) | 官方 17 个 Skills 实现（88.1k Stars） |
| [Agent Skills 开放标准](https://agentskills.io) | 跨平台 Skills 互操作规范 |
| [Anthropic 最佳实践文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | 官方 Skill 设计指南 |

详细的研究过程和分析结论记录在 `docs/` 和 `generator/research-foundation.md` 中。

---

## 贡献

欢迎贡献新的 Skill 或改进现有内容。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献流程和质量标准。

---

## 许可证

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证。

**简单来说**：

| 允许 | 不允许 |
|------|--------|
| 个人学习和使用 | 商业用途 |
| 修改和二次创作 | 不注明出处 |
| 非商业性分享和传播 | 使用更宽松的许可证再发布 |

如需商业授权，请联系作者。

---

## 作者

**猫叔** — AI 技术专家

与 Manus AI 协作构建。
