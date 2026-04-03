# SkillForge v1.4

**AI Agent Skills 锻造炉** — 用 AI 自动锻造生产级 Agent Skills 的开源工具。

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
![Version](https://img.shields.io/badge/version-1.4-blue.svg)

---

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/309866237129684078/GLnMzhHYFmrcXYPw.png" alt="SkillForge Screenshot" width="700">
</p>

---

## 这是什么

SkillForge 是一个完整的 Web 应用，内置经过实战验证的 **4 步 Agent Skills 生成引擎**，严格对齐 [Anthropic 官方 Agent Skills 规范](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)。

它解决一个核心问题：**如何让 AI 模型生成真正可用的、符合官方最佳实践的 Agent Skill，而不是内容过长、格式错误、无法触发的半成品。**

---

## 核心功能

| 功能 | 说明 |
|------|------|
| 一键生成 | 输入 Skill 名称和描述，自动执行 4 步生成流程 |
| 修正优化 | 上传已有 Skill，3 步自动诊断并重写为最佳实践版本 |
| 实时流式进度 | 每个步骤的输出实时流式展示，生成过程透明可见 |
| 标记提取 | 使用 `%%SKILL_BEGIN%%` / `%%SKILL_END%%` 标记精确提取，杜绝截断 |
| 完整 Skill 包 | SKILL.md + 可选配套资源文件 |
| ZIP 下载 | 一键打包下载，即装即用 |
| 任务控制 | 支持取消运行中的任务、重试失败步骤、删除历史记录 |

---

## 两大模式

### 创建新 Skill — 4 步生成流程

| 步骤 | 名称 | 核心作用 |
|------|------|----------|
| Step 1 | 内容规划 | 分析 Skill 定位、触发场景、知识缺口、资源文件需求 |
| Step 2 | SKILL.md 生成 | 生成符合官方规范的 SKILL.md（30-150 行，≤200 行上限） |
| Step 3 | 资源文件生成 | 按规划生成 scripts/、references/ 等配套文件 |
| Step 4 | 使用说明 | 生成安装指引、触发示例和验证清单 |

### 修正已有 Skill — 3 步优化流程

| 步骤 | 名称 | 核心作用 |
|------|------|----------|
| Step 1 | 问题诊断 | 对照最佳实践逐项检查，输出诊断报告 |
| Step 2 | SKILL.md 重写 | 保留原始意图，按最佳实践重写完整 SKILL.md |
| Step 3 | 质量审计 | 验证重写质量，确保优于原版 |

支持文本粘贴和 .md 文件上传两种输入方式。

---

## 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.4 | 2026-04-03 | 重构为 4 步流程对齐官方规范；标记提取彻底解决 SKILL.md 截断；实时流式进度展示；支持 Claude CLI / Anthropic API 后端 |
| v1.3 | 2026-04-02 | 修正部分情况下 SKILL.md 不完整；允许历史任务重置 |
| v1.2 | 2026-03-12 | 新增「修正已有 Skill」功能（3 步优化流程）；重写全部提示词 |
| v1.1 | 2026-03-11 | 新增任务取消/删除功能；修复部署问题 |
| v1.0 | 2026-03-10 | 首个版本：生成引擎、实时进度、ZIP 下载、历史记录 |

---

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + Tailwind CSS 4 + shadcn/ui |
| 后端 | Express 4 + tRPC 11 |
| 数据库 | MySQL / TiDB（Drizzle ORM） |
| LLM | Claude CLI / Anthropic API / OpenAI-compatible API |

---

## 快速开始

### 前置条件

- Node.js 22+
- pnpm
- MySQL 或 TiDB 数据库
- LLM 后端（三选一，见下方配置）

### 安装

```bash
git clone https://github.com/mmlong818/skillforge.git
cd skillforge

pnpm install

cp .env.example .env
# 编辑 .env 填入数据库连接和 LLM 配置
```

### 数据库初始化

按顺序执行 `drizzle/` 目录下的迁移文件：

```bash
mysql -u user -p skillforge < drizzle/0000_striped_iron_man.sql
mysql -u user -p skillforge < drizzle/0001_legal_thor.sql
mysql -u user -p skillforge < drizzle/0002_supreme_gabe_jones.sql
mysql -u user -p skillforge < drizzle/0003_wet_vance_astro.sql
mysql -u user -p skillforge < drizzle/0004_concerned_mattie_franklin.sql
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

支持三种后端，按优先级选择其一：

### 方式一：Claude CLI（本地订阅，推荐）

```env
CLAUDE_CLI=true
CLAUDE_CLI_PATH=claude   # Windows 示例：C:\Users\xxx\AppData\Roaming\npm\claude.cmd
```

需已安装并登录 [Claude Code CLI](https://claude.ai/code)。

### 方式二：Anthropic API Key

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
LLM_MODEL=claude-sonnet-4-6   # 可选，默认 claude-sonnet-4-6
```

### 方式三：OpenAI-compatible API

```env
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-xxxxx
LLM_MODEL=gpt-4o
```

支持 OpenAI、DeepSeek、Together AI、Ollama 等任何兼容 `/v1/chat/completions` 的提供商。

---

## 本地开发

无需 OAuth 服务器，启用 `LOCAL_DEV` 模式即可直接以管理员身份访问：

```env
LOCAL_DEV=true
```

---

## 项目结构

```
skillforge/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── skill/                 # Manus Skill（轻量版，无需部署）
│   ├── SKILL.md
│   └── references/
│       └── step-prompts.md
├── client/                # 前端 React 应用
│   └── src/
│       ├── pages/         # Home, Generate, History
│       └── components/
├── server/                # 后端 Express + tRPC
│   ├── skillEngine.ts     # 4 步生成引擎
│   ├── fixEngine.ts       # 3 步修正引擎
│   ├── prompts.json       # 提示词配置
│   ├── routers.ts
│   └── db.ts
├── drizzle/               # 数据库 Schema 和迁移
└── shared/                # 前后端共享类型
```

---

## Skill 质量标准

SkillForge 生成的每个 Skill 严格对齐 Anthropic 官方规范：

| 维度 | 要求 |
|------|------|
| 格式规范 | YAML frontmatter 包含 `name` 和 `description`；name 为 hyphen-case |
| 简洁度 | SKILL.md 正文 30-150 行，上限 200 行；不包含 AI 已知常识 |
| 描述质量 | description 第三人称，包含触发场景，≤200 词 |
| 渐进式披露 | 详细内容拆分到 `references/`，主文件保持轻量 |
| 代码优先 | 工作示例 snippet 优于文字描述 |

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

与 Claude Code 协作构建。
