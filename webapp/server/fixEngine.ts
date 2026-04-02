// ─────────────────────────────────────────────
// Fix Engine: 3-step Skill repair pipeline
// Step 1: Diagnose — analyze original SKILL.md for issues
// Step 2: Rewrite — produce corrected SKILL.md + resource files
// Step 3: Audit — quality check and final polish
// ─────────────────────────────────────────────

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { skillGenerations, generationSteps } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ── Abort management (shared pattern with skillEngine) ──
const runningFixPipelines = new Map<number, AbortController>();

export function cancelFixPipeline(generationId: number): boolean {
  const controller = runningFixPipelines.get(generationId);
  if (controller) {
    controller.abort();
    return true;
  }
  return false;
}

// ── Fix Steps Definition ──
export const FIX_STEPS = [
  { number: 1, name: "问题诊断" },
  { number: 2, name: "重写修正" },
  { number: 3, name: "质量审计" },
] as const;

// ── Prompts ──

const FIX_SYSTEM_PROMPT = `你是 SkillForge 修正引擎——一个专门修复和优化 Manus Agent Skill 的专家系统。

## 你的知识背景
你深入理解 Manus Skill 的标准结构和最佳实践：
- SKILL.md 是 Skill 的唯一入口文件，Manus 在触发时只读取这个文件
- SKILL.md 必须包含 YAML frontmatter（name, description, version, tags）
- description 字段是触发匹配的关键，必须同时说明 WHAT 和 WHEN
- 正文应包含：角色定义、核心工作流、格式规则、反模式、检查清单
- 可选的 references/ 目录用于存放参考文档（渐进式加载）
- 可选的 scripts/ 目录用于存放可执行脚本
- 可选的 templates/ 目录用于存放模板文件

## 格式铁律
- 输出中的代码块必须使用正确的语言标记
- SKILL.md 内容必须包裹在 \`\`\`markdown 代码块中
- 资源文件必须包裹在带路径标注的代码块中，格式为 \`\`\`语言:路径

## 质量标准（10 维度）
1. Frontmatter 完整性（name/description/version/tags 齐全且规范）
2. Description 质量（WHAT + WHEN 双覆盖，触发匹配友好）
3. 角色定义清晰度（明确的身份和职责边界）
4. 工作流可执行性（步骤具体、可操作、无歧义）
5. 格式规则明确性（输出格式有明确约束）
6. 反模式覆盖（常见错误有明确警告）
7. 检查清单实用性（可作为最终验证的 checklist）
8. 资源文件合理性（references/scripts/templates 是否必要且有用）
9. 整体长度适当性（SKILL.md 150-450 行，不过长不过短）
10. 专业领域准确性（领域知识是否正确、术语是否规范）`;

function buildDiagnosePrompt(originalContent: string, userInput: { skillName: string; domain: string; features: string; scenarios: string | null; extraNotes: string | null }): string {
  return `## 任务：诊断以下 Skill 的问题

### 用户提供的上下文
- **技能名称**: ${userInput.skillName}
- **目标领域**: ${userInput.domain}
- **核心功能**: ${userInput.features}
${userInput.scenarios ? `- **使用场景**: ${userInput.scenarios}` : ""}
${userInput.extraNotes ? `- **补充说明**: ${userInput.extraNotes}` : ""}

### 原始 SKILL.md 内容
\`\`\`
${originalContent}
\`\`\`

### 要求
请从以下 10 个维度逐一分析，给出评分（1-10）和具体问题描述：

1. **Frontmatter 完整性** — name/description/version/tags 是否齐全且规范
2. **Description 质量** — 是否同时说明了 WHAT（做什么）和 WHEN（何时触发）
3. **角色定义清晰度** — 是否有明确的身份和职责边界
4. **工作流可执行性** — 步骤是否具体、可操作、无歧义
5. **格式规则明确性** — 输出格式是否有明确约束
6. **反模式覆盖** — 是否列出了常见错误和警告
7. **检查清单实用性** — 是否有可作为最终验证的 checklist
8. **资源文件合理性** — references/scripts/templates 是否必要且有用
9. **整体长度适当性** — 是否在 150-450 行的合理范围内
10. **专业领域准确性** — 领域知识是否正确、术语是否规范

### 输出格式
先输出一个总评分表格，然后逐维度详细分析问题和改进建议。最后输出一个"关键修复清单"，列出必须修复的问题（按优先级排序）。`;
}

function buildRewritePrompt(originalContent: string, diagnosisOutput: string, userInput: { skillName: string; domain: string; features: string; scenarios: string | null; extraNotes: string | null }): string {
  return `## 任务：基于诊断结果重写 Skill

### 用户提供的上下文
- **技能名称**: ${userInput.skillName}
- **目标领域**: ${userInput.domain}
- **核心功能**: ${userInput.features}
${userInput.scenarios ? `- **使用场景**: ${userInput.scenarios}` : ""}
${userInput.extraNotes ? `- **补充说明**: ${userInput.extraNotes}` : ""}

### 诊断结果
${diagnosisOutput}

### 原始 SKILL.md
\`\`\`
${originalContent}
\`\`\`

### 重写要求

1. **保留原始 Skill 的核心意图和领域知识**，不要改变 Skill 的根本目的
2. **修复诊断中发现的所有问题**，按关键修复清单逐项解决
3. **遵循标准结构**：
   - YAML frontmatter（name, description, version, tags）
   - description 必须包含 WHAT + WHEN
   - 正文包含：角色定义、核心工作流、格式规则、反模式、检查清单
4. **控制长度**：SKILL.md 在 150-450 行之间
5. **如果需要 references/ 文件**，也一并输出

### 输出格式（严格遵守）

**SKILL.md 内容**必须包裹在一个 \`\`\`markdown 代码块中，这是整个输出中**唯一**的 markdown 代码块：

\`\`\`markdown
---
name: ${userInput.skillName}
description: ...
version: ...
tags: [...]
---

（正文内容）
\`\`\`

**如果需要资源文件**，使用带路径标注的代码块：

\`\`\`markdown:references/example.md
（文件内容）
\`\`\`

\`\`\`python:scripts/example.py
（文件内容）
\`\`\``;
}

function buildAuditPrompt(rewrittenOutput: string, originalContent: string, userInput: { skillName: string; domain: string; features: string }): string {
  return `## 任务：审计重写后的 Skill 质量

### 重写后的输出
${rewrittenOutput}

### 原始 SKILL.md（用于对比）
\`\`\`
${originalContent.slice(0, 3000)}
\`\`\`

### 审计要求

1. 对重写后的 SKILL.md 进行 10 维度评分（与诊断阶段相同标准）
2. 与原始版本进行对比，列出改进点
3. 如果仍有问题，输出最终修正版

### 输出格式

**PART A: 评分卡**
输出 10 维度评分表格，以及与原始版本的对比。

**PART B: 最终版本**
如果需要进一步修正，输出最终版 SKILL.md（包裹在 \`\`\`markdown 代码块中）。
如果重写版本已经足够好（平均分 >= 8），直接说明"重写版本已达标，无需进一步修正"。

注意：PART B 中最多只能有**一个** \`\`\`markdown 代码块，即最终版 SKILL.md。`;
}

// ── LLM invocation with retry ──

async function invokeLLMWithRetry(messages: Array<{ role: string; content: string }>, maxRetries = 3): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await invokeLLM({ messages: messages as any });
      const output = typeof result.choices[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : JSON.stringify(result.choices[0]?.message?.content);
      if (!output || output === "null") throw new Error("Empty LLM response");
      return output;
    } catch (err: any) {
      lastError = err;
      console.error("[FixEngine] LLM attempt " + attempt + " failed:", err.message?.slice(0, 200));
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
  throw lastError || new Error("LLM invocation failed after retries");
}

// ── Result extraction ──

function extractFixedSkillMd(step2Output: string, step3Output: string, skillName: string): string {
  // Try Step 3 first (audit may have produced a final version)
  const step3Md = extractMarkdownBlock(step3Output, skillName);
  if (step3Md && step3Md.length > 500) return step3Md;

  // Fall back to Step 2
  const step2Md = extractMarkdownBlock(step2Output, skillName);
  if (step2Md && step2Md.length > 500) return step2Md;

  // Last resort: return Step 2 raw (shouldn't happen with good prompts)
  return step2Output;
}

function extractMarkdownBlock(text: string, skillName: string): string | null {
  if (!text) return null;

  // Find all ```markdown blocks
  const blocks: string[] = [];
  const pattern = /```(?:markdown|md)\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    blocks.push(m[1].trim());
  }

  // Filter for valid SKILL.md blocks (has YAML frontmatter)
  const valid = blocks.filter(b => {
    return b.startsWith("---") && b.includes("name:") && b.includes("description:");
  });

  if (valid.length > 0) {
    // Return the longest valid block
    return valid.sort((a, b) => b.length - a.length)[0];
  }

  return null;
}

function extractResourceFiles(text: string): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  // Match ```language:path blocks
  const pattern = /```(?:\w+):([^\n]+)\n([\s\S]*?)```/g;
  let m;
  while ((m = pattern.exec(text)) !== null) {
    const path = m[1].trim();
    const content = m[2].trim();
    if (path && content && !path.includes("SKILL.md")) {
      files.push({ path, content });
    }
  }
  return files;
}

function assembleFixResult(
  userInput: { skillName: string },
  previousOutputs: string[],
  lastCompletedStep: number
): any {
  const files: Array<{ path: string; content: string }> = [];
  const partial = lastCompletedStep < 3;

  // Extract SKILL.md
  const skillMd = lastCompletedStep >= 2
    ? extractFixedSkillMd(previousOutputs[1] || "", previousOutputs[2] || "", userInput.skillName)
    : "";

  if (skillMd && skillMd.length > 100) {
    files.push({ path: "SKILL.md", content: skillMd });
  }

  // Extract resource files from Step 2 output
  if (previousOutputs[1]) {
    const resources = extractResourceFiles(previousOutputs[1]);
    for (const r of resources) {
      if (!files.some(f => f.path === r.path)) {
        files.push(r);
      }
    }
  }

  // Build directory tree
  const tree = buildTree(userInput.skillName, files);

  return {
    directory_tree: tree,
    files,
    usage: {
      installation: "将 " + userInput.skillName + "/ 目录复制到你的 AI 平台的 skills 目录中。",
      trigger_examples: ["请使用 " + userInput.skillName + " 技能"],
      iteration_suggestions: "根据使用反馈持续优化 SKILL.md。",
    },
    validation_passed: !partial,
    partial,
  };
}

function buildTree(skillName: string, files: Array<{ path: string }>): string {
  const dirs = new Set<string>();
  for (const f of files) {
    const parts = f.path.split("/");
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  const allEntries = Array.from(dirs).sort().concat(files.map(f => f.path));
  const unique = Array.from(new Set(allEntries)).sort();
  const lines = [skillName + "/"];
  for (let i = 0; i < unique.length; i++) {
    const isLast = i === unique.length - 1;
    const prefix = isLast ? "  └── " : "  ├── ";
    lines.push(prefix + unique[i]);
  }
  return lines.join("\n");
}

function safeErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  const msg = err.message || String(err);
  return msg.slice(0, 2000);
}

function extractSummary(output: string, stepNumber: number): string {
  if (stepNumber === 1) {
    // Try to extract average score
    const scoreMatch = output.match(/(?:平均|总|综合)[^\d]*(\d+(?:\.\d+)?)/);
    if (scoreMatch) return `诊断完成，综合评分: ${scoreMatch[1]}/10`;
    return "问题诊断完成";
  }
  if (stepNumber === 2) {
    const lineCount = (output.match(/```markdown[\s\S]*?```/)?.[0] || "").split("\n").length;
    return lineCount > 10 ? `重写完成 (约 ${lineCount} 行)` : "重写完成";
  }
  if (stepNumber === 3) {
    const hasPartB = /PART\s*B/i.test(output);
    return hasPartB ? "审计完成，已输出最终修正版" : "审计完成，重写版本已达标";
  }
  return "完成";
}

// ─────────────────────────────────────────────
// Main Fix Pipeline
// ─────────────────────────────────────────────

export async function runFixPipeline(generationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const abortController = new AbortController();
  runningFixPipelines.set(generationId, abortController);

  const [gen] = await db.select().from(skillGenerations).where(eq(skillGenerations.id, generationId)).limit(1);
  if (!gen) throw new Error("Generation " + generationId + " not found");

  const userInput = {
    skillName: gen.skillName,
    domain: gen.domain,
    features: gen.features,
    scenarios: gen.scenarios,
    extraNotes: gen.extraNotes,
  };

  const originalContent = gen.originalSkillMd || "";

  await db.update(skillGenerations).set({ status: "running", currentStep: 1 }).where(eq(skillGenerations.id, generationId));

  // Create step records
  for (const step of FIX_STEPS) {
    await db.insert(generationSteps).values({
      generationId,
      stepNumber: step.number,
      stepName: step.name,
      status: "pending",
    });
  }

  const previousOutputs: string[] = [];
  let lastCompletedStep = 0;

  try {
    for (const step of FIX_STEPS) {
      if (abortController.signal.aborted) {
        console.log("[FixEngine] Generation " + generationId + " aborted before step " + step.number);
        runningFixPipelines.delete(generationId);
        return;
      }

      await db.update(skillGenerations).set({ currentStep: step.number }).where(eq(skillGenerations.id, generationId));
      await db.update(generationSteps)
        .set({ status: "running", startedAt: new Date() })
        .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      try {
        let prompt: string;
        if (step.number === 1) {
          prompt = buildDiagnosePrompt(originalContent, userInput);
        } else if (step.number === 2) {
          prompt = buildRewritePrompt(originalContent, previousOutputs[0], userInput);
        } else {
          prompt = buildAuditPrompt(previousOutputs[1], originalContent, userInput);
        }

        console.log("[FixEngine] Step " + step.number + " prompt length: " + prompt.length + " chars");

        const output = await invokeLLMWithRetry([
          { role: "system", content: FIX_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ]);

        console.log("[FixEngine] Step " + step.number + " output length: " + output.length + " chars");

        const summary = extractSummary(output, step.number);
        previousOutputs.push(output);
        lastCompletedStep = step.number;

        await db.update(generationSteps)
          .set({ status: "completed", output, summary, completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      } catch (stepError: any) {
        console.error("[FixEngine] Step " + step.number + " failed:", stepError.message?.slice(0, 500));
        await db.update(generationSteps)
          .set({ status: "failed", errorMessage: safeErrorMessage(stepError), completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

        // Partial result from Step 2+
        if (lastCompletedStep >= 2) {
          while (previousOutputs.length < 3) previousOutputs.push("");
          const resultData = assembleFixResult(userInput, previousOutputs, lastCompletedStep);
          if (resultData.files.length > 0) {
            await db.update(skillGenerations)
              .set({
                status: "completed",
                result: resultData,
                errorMessage: "步骤 1-" + lastCompletedStep + " 完成。步骤 " + step.number + " 失败: " + safeErrorMessage(stepError).slice(0, 200),
                completedAt: new Date(),
              })
              .where(eq(skillGenerations.id, generationId));
            return;
          }
        }

        await db.update(skillGenerations)
          .set({ status: "failed", errorMessage: "步骤 " + step.number + " 失败: " + safeErrorMessage(stepError) })
          .where(eq(skillGenerations.id, generationId));
        return;
      }
    }

    // Assemble final result
    console.log("[FixEngine] Assembling fixed Skill package...");
    const resultData = assembleFixResult(userInput, previousOutputs, 3);
    console.log("[FixEngine] Assembled " + resultData.files.length + " files");

    await db.update(skillGenerations)
      .set({ status: "completed", result: resultData, completedAt: new Date() })
      .where(eq(skillGenerations.id, generationId));

    console.log("[FixEngine] Fix generation " + generationId + " completed");

  } catch (error: any) {
    console.error("[FixEngine] Pipeline failed:", safeErrorMessage(error));
    await db.update(skillGenerations)
      .set({ status: "failed", errorMessage: safeErrorMessage(error) })
      .where(eq(skillGenerations.id, generationId));
  } finally {
    runningFixPipelines.delete(generationId);
  }
}
