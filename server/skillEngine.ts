import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { skillGenerations, generationSteps } from "../drizzle/schema";

/** Step definitions for the 7-step generation pipeline */
const STEPS = [
  { number: 1, name: "需求深度挖掘", nameEn: "Requirements Analysis" },
  { number: 2, name: "架构决策引擎", nameEn: "Architecture Decisions" },
  { number: 3, name: "元数据精炼", nameEn: "Metadata Refinement" },
  { number: 4, name: "SKILL.md 主体生成", nameEn: "SKILL.md Body Generation" },
  { number: 5, name: "质量审计与优化", nameEn: "Quality Audit & Optimization" },
  { number: 6, name: "配套资源生成", nameEn: "Resource Generation" },
  { number: 7, name: "最终组装与交付", nameEn: "Final Assembly & Delivery" },
] as const;

export { STEPS };

/** Build the system prompt that stays constant across all steps */
function buildSystemPrompt(): string {
  return `You are an expert Agent Skills architect with deep understanding of the Anthropic official Skills repository (88.1k Stars), 100+ community Skills, and the Agent Skills open standard specification.

Your task is to help design and generate a production-grade Agent Skill that follows industry best practices. Key principles:
- Concise is Key: only provide information the AI model doesn't already know
- Description is the trigger: it determines whether the Skill gets selected
- Progressive disclosure: SKILL.md < 500 lines, rest loaded on demand
- Freedom level must match task fragility
- Code examples are better than text explanations
- Anti-patterns are essential
- Built-in validation at every critical step
- One level of reference depth only
- Imperative tone: "Run" not "You should run"
- Written for AI agents, not for human readers

Always respond in the same language as the user's input. If the user writes in Chinese, respond in Chinese. If in English, respond in English.`;
}

/** Build the prompt for each step */
function buildStepPrompt(
  stepNumber: number,
  userInput: { skillName: string; domain: string; features: string; scenarios?: string | null; extraNotes?: string | null },
  previousOutputs: string[]
): string {
  const contextBlock = previousOutputs.length > 0
    ? `\n\n---\n## 前序步骤的输出结果\n\n${previousOutputs.map((o, i) => `### Step ${i + 1} 输出\n${o}`).join("\n\n---\n\n")}\n\n---\n\n`
    : "";

  const userDesc = `我想创建的 Skill 信息：
- **技能名称**: ${userInput.skillName}
- **目标领域**: ${userInput.domain}
- **核心功能**: ${userInput.features}
${userInput.scenarios ? `- **使用场景**: ${userInput.scenarios}` : ""}
${userInput.extraNotes ? `- **补充说明**: ${userInput.extraNotes}` : ""}`;

  switch (stepNumber) {
    case 1:
      return `${userDesc}

请通过以下框架对我的需求进行深度分析，输出一份结构化的需求文档：

## 1. 核心定位分析
- **Skill 名称**（hyphen-case，全小写，最长 64 字符）
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
- AI 模型已经知道的（不需要在 Skill 中重复）
- AI 模型不知道的（必须在 Skill 中提供）
- AI 模型可能做错的（需要通过 Skill 纠正）

## 5. 依赖和约束
- 需要的外部工具或 API
- 文件格式要求
- 平台或环境约束

## 6. 竞品与已有 Skills 分析
- 是否存在可直接复用的已有 Skill？
- 与已有 Skills 的差异化定位是什么？

请严格按照以上框架输出，不要遗漏任何部分。`;

    case 2:
      return `${contextBlock}基于上述需求分析，现在进行架构决策。请根据以下决策框架，为这个 Skill 做出最优的架构选择：

## 决策 1: 结构模式选择
从以下 4 种模式中选择：工作流型（Workflow-Based）、任务型（Task-Based）、指南型（Guidelines-Based）、能力型（Capabilities-Based）。
输出：选择的模式 + 选择理由 + 是否需要混合模式

## 决策 2: 自由度级别
高自由度（文本指导）、中自由度（带参数模板）、低自由度（具体脚本）。
输出：整体自由度级别 + 各功能模块的自由度分配

## 决策 3: 资源规划
确定是否需要 scripts/、references/、templates/ 目录。
输出：每个目录是否需要 + 具体包含什么文件 + 每个文件的用途

## 决策 4: 渐进式披露策略
模式 A: 高层指南 + 引用参考；模式 B: 按领域组织；模式 C: 条件性细节。
输出：选择的模式 + 文件拆分方案 + 每个文件的加载条件

## 决策 5: 质量保证策略
确定验证脚本、检查清单、反面案例、验证-修复-重复循环的需求。
输出：质量保证方案 + 具体验证点

## 最终架构蓝图
输出完整的目录结构和每个文件的简要说明及预估行数。`;

    case 3:
      return `${contextBlock}现在生成 SKILL.md 的 YAML 前置元数据（frontmatter）。

## 元数据生成规则

### name 字段（必填）
- 格式：hyphen-case（全小写，用连字符分隔），最长 64 字符
- 要求：与目录名完全一致

### description 字段（必填，最关键）
必须满足 5 条黄金规则：
1. 客观描述性语气（非第一/第二人称）
2. 做什么 + 何时用
3. 包含触发关键词
4. 长度 30-200 词，不超过 1024 字符
5. 不含 < > 角括号

## 输出要求
请生成 3 个候选版本的 description，并对每个版本进行自评：
- 触发精准度（1-5分）
- 触发精确度（1-5分）
- 信息密度（1-5分）

然后选出最优版本，输出最终的 YAML frontmatter。`;

    case 4:
      return `${contextBlock}现在生成 SKILL.md 的正文部分。

## 生成约束
1. 总行数 < 500 行
2. 简洁至上：对每一段内容自问"AI 模型是否真的需要这个解释？"
3. 祈使语气
4. 不含 README 内容
5. 避免信息重复

## 内容质量标准
1. 具体的代码示例优于抽象的文字解释
2. 明确的反面案例（Anti-patterns）
3. 决策框架而非决策结果
4. 验证检查清单
5. 渐进式引用

根据 Step 2 选择的结构模式生成正文。在输出后，统计总行数并确认未超过 500 行。`;

    case 5:
      return `${contextBlock}在生成配套资源之前，先对 SKILL.md 进行严格的质量审计。

请逐项检查以下 10 个维度，每个维度打分（1-10）：
1. 描述精准度（权重 15%）
2. 简洁度（权重 15%）
3. 结构合理性（权重 10%）
4. 渐进式披露（权重 10%）
5. 自由度匹配（权重 10%）
6. 质量保证机制（权重 10%）
7. 可复用性（权重 5%）
8. 跨平台兼容性（权重 5%）
9. 错误处理（权重 10%）
10. 专业深度（权重 10%）

## 输出要求
1. 评分卡（表格形式）
2. 必须修复的问题（Critical）及修改方案
3. 建议改进的问题（Recommended）及修改方案
4. 优化后的完整 SKILL.md（包含 frontmatter + 正文）
5. 资源文件变更提示`;

    case 6:
      return `${contextBlock}根据 Step 2 的架构决策中规划的资源文件，以及 Step 5 优化后的最终 SKILL.md，现在逐一生成配套资源。

## 生成规则

### scripts/ 目录
1. 包含完整的 docstring
2. 包含错误处理和有意义的错误信息
3. 支持命令行参数
4. 可独立运行

### references/ 目录
1. 超过 100 行时包含目录
2. 使用清晰的标题层级
3. 包含具体的代码示例
4. 避免与 SKILL.md 重复

### templates/ 目录
1. 包含占位符标记
2. 包含注释说明
3. 可直接使用

## 输出格式
对每个文件，请输出：
- 文件路径
- 用途说明
- 完整文件内容

请逐一生成所有规划的资源文件。如果架构决策中没有规划任何资源文件，请说明原因并确认 SKILL.md 本身已足够完整。`;

    case 7:
      return `${contextBlock}现在将所有组件组装为最终的 Skill 包。

## 组装要求

1. 输出完整的最终 SKILL.md（Step 5 优化后的版本，包含 frontmatter + 正文）
2. 列出所有配套文件及其完整内容
3. 生成完整的目录结构树

## 最终验证清单
- [ ] SKILL.md 以 --- 开头的 YAML frontmatter
- [ ] frontmatter 包含 name 和 description
- [ ] name 是 hyphen-case，≤ 64 字符
- [ ] description ≤ 1024 字符，不含 < >
- [ ] SKILL.md 正文 < 500 行
- [ ] 所有引用的文件都存在
- [ ] 没有 TODO 占位符残留
- [ ] 使用祈使语气
- [ ] 不含 README 式说明
- [ ] 反面案例明确标注

## 输出格式（严格遵循）

请使用以下 JSON 格式输出最终结果，确保可以被程序解析：

\`\`\`json
{
  "directory_tree": "skill-name/\\n├── SKILL.md\\n├── ...",
  "files": [
    {
      "path": "SKILL.md",
      "content": "---\\nname: ...\\n---\\n\\n# ..."
    },
    {
      "path": "scripts/validate.py",
      "content": "#!/usr/bin/env python3\\n..."
    }
  ],
  "usage": {
    "installation": "如何安装这个 Skill",
    "trigger_examples": ["示例1", "示例2", "示例3"],
    "iteration_suggestions": "后续改进建议"
  },
  "validation_passed": true
}
\`\`\`

请确保 JSON 格式正确，所有文件内容完整。`;

    default:
      return "";
  }
}

/** Extract a brief summary from LLM output */
function extractSummary(output: string, stepNumber: number): string {
  const stepNames = ["", "需求分析完成", "架构决策完成", "元数据生成完成", "主体生成完成", "质量审计完成", "资源生成完成", "最终组装完成"];
  const lines = output.split("\n").filter(l => l.trim());
  // Take first meaningful line as summary
  const firstLine = lines.find(l => l.startsWith("#") || l.startsWith("##") || l.length > 10) || lines[0] || "";
  const cleaned = firstLine.replace(/^#+\s*/, "").slice(0, 200);
  return `${stepNames[stepNumber]}: ${cleaned}`;
}

/** Run the full 7-step generation pipeline */
export async function runGenerationPipeline(generationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Load generation record
  const [gen] = await db.select().from(skillGenerations).where(eq(skillGenerations.id, generationId)).limit(1);
  if (!gen) throw new Error(`Generation ${generationId} not found`);

  const userInput = {
    skillName: gen.skillName,
    domain: gen.domain,
    features: gen.features,
    scenarios: gen.scenarios,
    extraNotes: gen.extraNotes,
  };

  // Update status to running
  await db.update(skillGenerations).set({ status: "running", currentStep: 1 }).where(eq(skillGenerations.id, generationId));

  // Create all step records
  for (const step of STEPS) {
    await db.insert(generationSteps).values({
      generationId,
      stepNumber: step.number,
      stepName: step.name,
      status: "pending",
    });
  }

  const previousOutputs: string[] = [];
  const systemPrompt = buildSystemPrompt();

  try {
    for (const step of STEPS) {
      // Update current step
      await db.update(skillGenerations).set({ currentStep: step.number }).where(eq(skillGenerations.id, generationId));

      // Mark step as running
      await db.update(generationSteps)
        .set({ status: "running", startedAt: new Date() })
        .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      try {
        const prompt = buildStepPrompt(step.number, userInput, previousOutputs);

        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          maxTokens: 16384,
        });

        const output = typeof result.choices[0]?.message?.content === "string"
          ? result.choices[0].message.content
          : JSON.stringify(result.choices[0]?.message?.content);

        const summary = extractSummary(output, step.number);
        previousOutputs.push(output);

        // Mark step as completed
        await db.update(generationSteps)
          .set({ status: "completed", output, summary, completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      } catch (stepError: any) {
        // Mark step as failed
        await db.update(generationSteps)
          .set({ status: "failed", errorMessage: stepError.message, completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

        throw stepError;
      }
    }

    // Parse the final step output to extract files
    const finalOutput = previousOutputs[previousOutputs.length - 1];
    let resultData: any = null;
    try {
      // Try to extract JSON from the output
      const jsonMatch = finalOutput.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        resultData = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing the whole output as JSON
        resultData = JSON.parse(finalOutput);
      }
    } catch {
      // If JSON parsing fails, wrap the output as a single SKILL.md file
      resultData = {
        files: [{ path: "SKILL.md", content: finalOutput }],
        directory_tree: "skill/\n└── SKILL.md",
        usage: { installation: "Copy the skill directory to your AI platform's skills folder.", trigger_examples: [], iteration_suggestions: "" },
      };
    }

    // Mark generation as completed
    await db.update(skillGenerations)
      .set({ status: "completed", result: resultData, completedAt: new Date() })
      .where(eq(skillGenerations.id, generationId));

  } catch (error: any) {
    // Mark generation as failed
    await db.update(skillGenerations)
      .set({ status: "failed", errorMessage: error.message })
      .where(eq(skillGenerations.id, generationId));
  }
}
