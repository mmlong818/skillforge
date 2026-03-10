# SkillForge

**AI Agent Skills 锻造炉** — 用 AI 自动锻造生产级 Agent Skills 的开源工具。

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/309866237129684078/GLnMzhHYFmrcXYPw.png" alt="SkillForge Screenshot" width="700">
</p>

---

## 这是什么

SkillForge 是一个完整的 Web 应用，内置经过实战验证的 **7 步 Agent Skills 生成引擎**，基于对 Anthropic 官方 Skills 仓库（88.1k Stars）、100+ 社区优秀 Skills、Agent Skills 开放标准规范的深度分析提炼而成。

它解决一个核心问题：**如何让 AI 模型生成真正可用的、符合行业最佳实践的 Agent Skill，而不是看起来像模像样但实际无法触发或质量低下的半成品。**

---

## 核心功能

| 功能 | 说明 |
|------|------|
| 一键生成 | 输入 Skill 名称和描述，自动执行 7 步生成流程 |
| 实时进度 | 每个步骤的执行状态实时展示 |
| 质量审计 | 10 维度加权评分 + 自动修复低分项 |
| 完整 Skill 包 | SKILL.md + scripts/ + references/ + templates/ |
| ZIP 下载 | 一键打包下载，即装即用 |
| 任务控制 | 支持取消运行中的任务、删除历史记录 |

---

## 7 步生成流程

| 步骤 | 名称 | 核心作用 |
|------|------|----------|
| Step 1 | 需求深度挖掘 | 5 维框架分析：定位、边界、场景、知识缺口、竞品 |
| Step 2 | 架构决策引擎 | 5 大决策：结构模式、自由度、资源规划、披露策略、质量保证 |
| Step 3 | 元数据精炼 | 3 个候选 description 自评打分，选出最优触发器 |
| Step 4 | SKILL.md 主体生成 | 按架构决策生成精炼的指令主体（150-450 行） |
| Step 5 | 质量审计与优化 | 10 维度加权评分 + 自动修复低分项 |
| Step 6 | 配套资源生成 | 生成 scripts/、references/、templates/ 等配套文件 |
| Step 7 | 最终组装与交付 | 格式验证 + 内容验证 + 最佳实践验证 |

---

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + Tailwind CSS 4 + shadcn/ui |
| 后端 | Express 4 + tRPC 11 |
| 数据库 | MySQL / TiDB（Drizzle ORM） |
| LLM | OpenAI-compatible API（支持任意兼容提供商） |

---

## 快速开始

### 前置条件

- Node.js 22+
- pnpm
- MySQL 或 TiDB 数据库
- OpenAI-compatible LLM API Key

### 安装

```bash
git clone https://github.com/mmlong818/skillforge.git
cd skillforge/webapp

pnpm install

cp .env.example .env
# 编辑 .env 填入你的数据库连接和 API Key
```

### 数据库初始化

按顺序执行 `drizzle/` 目录下的迁移文件：

```bash
mysql -u user -p skillforge < drizzle/0000_striped_iron_man.sql
mysql -u user -p skillforge < drizzle/0001_legal_thor.sql
mysql -u user -p skillforge < drizzle/0002_supreme_gabe_jones.sql
mysql -u user -p skillforge < drizzle/0003_wet_vance_astro.sql
```

### 启动

```bash
# 开发模式
pnpm dev

# 生产构建
pnpm build
node dist/index.js
```

访问 `http://localhost:3000` 即可使用。

---

## LLM 配置

本应用使用 OpenAI-compatible API 格式。你可以使用任何支持 `/v1/chat/completions` 端点的提供商：

| 提供商 | API URL | 说明 |
|--------|---------|------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | 推荐 GPT-4o |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | 性价比高 |
| Together AI | `https://api.together.xyz/v1/chat/completions` | 多种开源模型 |
| 本地部署 | `http://localhost:11434/v1/chat/completions` | Ollama 等 |

在 `.env` 中设置 `BUILT_IN_FORGE_API_URL` 和 `BUILT_IN_FORGE_API_KEY` 即可。

---

## 项目结构

```
skillforge/
├── README.md              # 本文件
├── LICENSE                # CC BY-NC-SA 4.0 许可证
├── CONTRIBUTING.md        # 贡献指南
└── webapp/                # Web 应用完整源码
    ├── .env.example       # 环境变量模板
    ├── client/            # 前端 React 应用
    │   └── src/
    │       ├── pages/     # 页面组件（Home, Generate, History）
    │       └── components/# 可复用 UI 组件
    ├── server/            # 后端 Express + tRPC
    │   ├── skillEngine.ts # 7 步 LLM 生成引擎
    │   ├── prompts.json   # 7 步提示词配置
    │   ├── routers.ts     # API 路由
    │   └── db.ts          # 数据库查询
    ├── drizzle/           # 数据库 Schema 和迁移
    └── shared/            # 前后端共享类型
```

---

## Skill 质量标准

SkillForge 生成的每个 Skill 都遵循以下标准：

| 维度 | 要求 |
|------|------|
| 格式规范 | YAML frontmatter 包含 `name` 和 `description`；name 为 hyphen-case |
| 简洁度 | SKILL.md 正文 150-450 行；不解释 AI 已知的常识 |
| 描述质量 | description 包含触发关键词，30-200 词 |
| 渐进式披露 | 详细内容拆分到 `references/`，保持一层引用深度 |
| 质量保证 | 包含验证检查清单和反面案例（Anti-patterns） |

---

## 研究基础

SkillForge 的设计理念和质量标准基于以下权威来源的系统性分析：

| 来源 | 说明 |
|------|------|
| [Anthropic Skills 仓库](https://github.com/anthropics/skills) | 官方 17 个 Skills 实现（88.1k Stars） |
| [Agent Skills 开放标准](https://agentskills.io) | 跨平台 Skills 互操作规范 |
| [Anthropic 最佳实践文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | 官方 Skill 设计指南 |

---

## 许可证

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证。

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
