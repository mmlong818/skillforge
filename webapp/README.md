# SkillForge Web App

SkillForge 的 Web 应用版本，将 7 步 Skill 生成流程自动化为一键生成。

---

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + Tailwind CSS 4 + shadcn/ui |
| 后端 | Express 4 + tRPC 11 |
| 数据库 | MySQL / TiDB（Drizzle ORM） |
| LLM | OpenAI-compatible API（支持任意兼容提供商） |
| 认证 | Manus OAuth（可选，可禁用） |

---

## 快速开始

### 前置条件

- Node.js 22+
- pnpm
- MySQL 或 TiDB 数据库
- OpenAI-compatible LLM API Key

### 安装

```bash
# 克隆仓库
git clone https://github.com/mmlong818/skillforge.git
cd skillforge/webapp

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的数据库连接和 API Key
```

### 数据库初始化

使用 `drizzle/` 目录下的 SQL 迁移文件初始化数据库：

```bash
# 按顺序执行迁移文件
mysql -u user -p skillforge < drizzle/0000_striped_iron_man.sql
mysql -u user -p skillforge < drizzle/0001_legal_thor.sql
mysql -u user -p skillforge < drizzle/0002_supreme_gabe_jones.sql
mysql -u user -p skillforge < drizzle/0003_wet_vance_astro.sql
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000` 即可使用。

### 构建生产版本

```bash
pnpm build
node dist/index.js
```

---

## LLM 配置

本应用使用 OpenAI-compatible API 格式调用 LLM。你可以使用任何支持 `/v1/chat/completions` 端点的提供商：

| 提供商 | API URL | 说明 |
|--------|---------|------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | 推荐使用 GPT-4o |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | 性价比高 |
| Together AI | `https://api.together.xyz/v1/chat/completions` | 支持多种开源模型 |
| 自建 | `http://localhost:11434/v1/chat/completions` | Ollama 等本地部署 |

在 `.env` 中设置 `BUILT_IN_FORGE_API_URL` 和 `BUILT_IN_FORGE_API_KEY` 即可。

---

## 项目结构

```
webapp/
├── client/               # 前端 React 应用
│   ├── src/
│   │   ├── pages/        # 页面组件（Home, Generate, History）
│   │   ├── components/   # 可复用组件（shadcn/ui）
│   │   └── lib/          # tRPC 客户端
│   └── index.html
├── server/               # 后端 Express + tRPC
│   ├── skillEngine.ts    # 7 步 LLM 生成引擎
│   ├── prompts.json      # 7 步提示词配置
│   ├── routers.ts        # tRPC API 路由
│   ├── db.ts             # 数据库查询
│   └── _core/            # 框架层（认证、LLM、上下文）
├── drizzle/              # 数据库 Schema 和迁移
└── shared/               # 前后端共享类型
```

---

## 核心功能

| 功能 | 说明 |
|------|------|
| 一键生成 | 输入 Skill 名称和描述，自动执行 7 步生成流程 |
| 实时进度 | 每个步骤的执行状态实时展示 |
| 结果预览 | 生成完成后预览 SKILL.md 和配套文件 |
| ZIP 下载 | 一键打包下载完整 Skill 目录 |
| 历史记录 | 查看和管理所有生成记录 |
| 任务控制 | 支持取消运行中的任务、删除历史记录 |

---

## 认证说明

本应用默认集成了 Manus OAuth 认证。如果你不需要多用户认证功能，可以：

1. 不配置 `JWT_SECRET`、`VITE_APP_ID` 等认证相关环境变量
2. 修改 `server/routers.ts` 中的 `protectedProcedure` 为 `publicProcedure`

---

## 许可证

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可证，禁止商业用途。
