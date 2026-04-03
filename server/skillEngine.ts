import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { spawnSync } from "child_process";
import { getDb } from "./db";
import { skillGenerations, generationSteps } from "../drizzle/schema";

// Import prompts directly so esbuild can inline them into the bundle
// (readFileSync won't work in production because the JSON file isn't copied to dist/)
import PROMPTS from "./prompts.json";

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

// Export extraction functions for testing
export { isValidSkillMd as _isValidSkillMd, extractSkillMdFromStep5 as _extractSkillMdFromStep5, extractResourceFiles as _extractResourceFiles };

// ─────────────────────────────────────────────
// Abort Signal Management
// ─────────────────────────────────────────────

/** In-memory map of generationId → AbortController for running pipelines */
const runningPipelines = new Map<number, AbortController>();

/** Cancel a running generation pipeline */
export async function cancelGeneration(generationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Signal the running pipeline to abort
  const controller = runningPipelines.get(generationId);
  if (controller) {
    controller.abort();
    runningPipelines.delete(generationId);
  }

  // Update DB status to cancelled
  await db.update(skillGenerations)
    .set({ status: "cancelled", errorMessage: "Cancelled by user" })
    .where(eq(skillGenerations.id, generationId));

  // Mark any running/pending steps as cancelled
  const steps = await db.select().from(generationSteps)
    .where(eq(generationSteps.generationId, generationId));
  for (const step of steps) {
    if (step.status === "running" || step.status === "pending") {
      await db.update(generationSteps)
        .set({ status: "failed", errorMessage: "Cancelled by user", completedAt: new Date() })
        .where(eq(generationSteps.id, step.id));
    }
  }

  console.log("[SkillEngine] Generation " + generationId + " cancelled by user");
  return true;
}

/** Delete a generation and all its steps */
export async function deleteGeneration(generationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Cancel if running
  const controller = runningPipelines.get(generationId);
  if (controller) {
    controller.abort();
    runningPipelines.delete(generationId);
  }

  // Delete steps first (foreign key dependency)
  await db.delete(generationSteps).where(eq(generationSteps.generationId, generationId));
  await db.delete(skillGenerations).where(eq(skillGenerations.id, generationId));

  console.log("[SkillEngine] Generation " + generationId + " deleted");
  return true;
}

// ─────────────────────────────────────────────
// Context Compression
// ─────────────────────────────────────────────

function compressForContext(output: string, maxChars: number = 8000): string {
  if (output.length <= maxChars) return output;

  const lines = output.split("\n");
  const importantLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent = "";
  let currentSize = 0;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        const block = codeBlockContent + line + "\n";
        if (currentSize + block.length < maxChars * 0.7) {
          importantLines.push(block);
          currentSize += block.length;
        }
        codeBlockContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockContent = line + "\n";
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += line + "\n";
      continue;
    }

    const isImportant = line.startsWith("#") || line.startsWith("---") ||
      line.startsWith("- ") || line.startsWith("* ") ||
      line.startsWith("|") || line.match(/^\d+\./) ||
      line.startsWith("name:") || line.startsWith("description:");

    if (isImportant || currentSize < maxChars * 0.5) {
      importantLines.push(line);
      currentSize += line.length + 1;
    }

    if (currentSize >= maxChars) break;
  }

  const result = importantLines.join("\n");
  if (result.length < output.length) {
    return result + "\n\n... [content compressed for context window] ...";
  }
  return result;
}

// ─────────────────────────────────────────────
// Context Block Builder
// ─────────────────────────────────────────────

function buildContextBlock(previousOutputs: string[], currentStep: number): string {
  if (previousOutputs.length === 0) return "";

  const contextParts: string[] = [];

  switch (currentStep) {
    case 2:
      contextParts.push("### Step 1 Output (Requirements Analysis)\n" + compressForContext(previousOutputs[0], 10000));
      break;
    case 3:
      contextParts.push("### Step 1 Output (Requirements Analysis)\n" + compressForContext(previousOutputs[0], 8000));
      contextParts.push("### Step 2 Output (Architecture Decisions)\n" + compressForContext(previousOutputs[1], 8000));
      break;
    case 4:
      // Step 4 needs full context from 1-3 for complete SKILL.md generation
      contextParts.push("### Step 1 Output (Requirements Analysis)\n" + compressForContext(previousOutputs[0], 8000));
      contextParts.push("### Step 2 Output (Architecture Decisions)\n" + compressForContext(previousOutputs[1], 8000));
      contextParts.push("### Step 3 Output (Metadata)\n" + previousOutputs[2]);
      break;
    case 5:
      // Step 5 (audit) needs full SKILL.md from Step 4 + metadata
      contextParts.push("### Step 1 Output (Requirements Analysis)\n" + compressForContext(previousOutputs[0], 5000));
      contextParts.push("### Step 3 Output (Metadata)\n" + previousOutputs[2]);
      contextParts.push("### Step 4 Output (SKILL.md Body)\n" + previousOutputs[3]);
      break;
    case 6:
      // Step 6 needs architecture + full SKILL.md for accurate resource generation
      contextParts.push("### Step 1 Output (Requirements Analysis)\n" + compressForContext(previousOutputs[0], 5000));
      contextParts.push("### Step 2 Output (Architecture Decisions - Resource Planning)\n" + compressForContext(previousOutputs[1], 10000));
      contextParts.push("### Step 4 Output (SKILL.md Body)\n" + compressForContext(previousOutputs[3], 10000));
      break;
    case 7:
      // Step 7 only needs metadata + skill name
      contextParts.push("### Step 3 Output (Metadata)\n" + compressForContext(previousOutputs[2], 3000));
      break;
    default:
      break;
  }

  if (contextParts.length === 0) return "";
  return "\n\n---\n## Previous Steps Output\n\n" + contextParts.join("\n\n---\n\n") + "\n\n---\n\n";
}

// ─────────────────────────────────────────────
// Step Prompts
// ─────────────────────────────────────────────

function buildStepPrompt(
  stepNumber: number,
  userInput: { skillName: string; domain: string; features: string; scenarios?: string | null; extraNotes?: string | null },
  previousOutputs: string[]
): string {
  const contextBlock = buildContextBlock(previousOutputs, stepNumber);

  const userDesc = [
    "Skill Info:",
    "- **Name**: " + userInput.skillName,
    "- **Domain**: " + userInput.domain,
    "- **Features**: " + userInput.features,
  ];
  if (userInput.scenarios) userDesc.push("- **Scenarios**: " + userInput.scenarios);
  if (userInput.extraNotes) userDesc.push("- **Notes**: " + userInput.extraNotes);

  const userDescStr = userDesc.join("\n");

  const stepTemplate = (PROMPTS.steps as Record<string, string>)[String(stepNumber)] || "";
  const stepPrompt = stepTemplate.replace(/\{\{SKILL_NAME\}\}/g, userInput.skillName);

  if (stepNumber === 1) {
    return userDescStr + "\n\n" + stepPrompt;
  } else {
    return contextBlock + stepPrompt;
  }
}

// ─────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────

function extractSummary(output: string, stepNumber: number): string {
  const stepNames = ["", "Requirements analyzed", "Architecture decided", "Metadata generated", "SKILL.md body generated", "Quality audit done", "Resources generated", "Usage guide generated"];
  const lines = output.split("\n").filter((l: string) => l.trim());
  const firstMeaningful = lines.find((l: string) => l.startsWith("#") || l.startsWith("##") || (l.length > 15 && !l.startsWith("```"))) || lines[0] || "";
  const cleaned = firstMeaningful.replace(/^#+\s*/, "").replace(/^```\w*\s*/, "").slice(0, 200);
  return stepNames[stepNumber] + ": " + cleaned;
}

function safeErrorMessage(error: any): string {
  const msg = error?.message || String(error);
  return msg.length > 2000 ? msg.slice(0, 2000) + "... [truncated]" : msg;
}

function invokeCLI(messages: { role: string; content: string }[]): string {
  const claudePath = process.env.CLAUDE_CLI_PATH || "claude";
  const systemMsg = messages.find(m => m.role === "system")?.content || "";
  const others = messages.filter(m => m.role !== "system");
  const last = others[others.length - 1];
  const prior = others.slice(0, -1);

  let prompt = "";
  if (systemMsg) prompt += `[SYSTEM]:\n${systemMsg}\n\n---\n\n`;
  if (prior.length > 0) {
    const ctx = prior.map(m => `[${m.role.toUpperCase()}]:\n${m.content}`).join("\n\n---\n\n");
    prompt += `${ctx}\n\n---\n\n`;
  }
  prompt += last.content;

  const args = ["--print"];

  const result = spawnSync(claudePath, args, {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    timeout: 300000,
    shell: true,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Claude CLI failed (exit ${result.status}): ${result.stderr?.slice(0, 500)}`);
  return result.stdout.trim();
}

async function invokeLLMWithRetry(
  messages: { role: string; content: string }[],
  maxRetries: number = 5
): Promise<string> {
  let lastError: any;

  // Use Claude CLI if configured
  if (process.env.CLAUDE_CLI === "true") {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return invokeCLI(messages);
      } catch (error: any) {
        lastError = error;
        console.warn("[SkillEngine] Claude CLI attempt " + attempt + "/" + maxRetries + " failed: " + (error.message?.slice(0, 200)));
        if (attempt < maxRetries) await new Promise(r => setTimeout(r, 3000 * attempt));
      }
    }
    throw lastError;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await invokeLLM({
        messages: messages as any,
      });

      const output = typeof result.choices[0]?.message?.content === "string"
        ? result.choices[0].message.content
        : JSON.stringify(result.choices[0]?.message?.content);

      return output;
    } catch (error: any) {
      lastError = error;
      const msg = error.message?.slice(0, 200) || "";
      console.warn("[SkillEngine] LLM call attempt " + attempt + "/" + maxRetries + " failed: " + msg);

      if (attempt < maxRetries) {
        const is403or500 = msg.includes("403") || msg.includes("Forbidden") || msg.includes("rate") || msg.includes("500") || msg.includes("Internal");
        const baseDelay = is403or500 ? 10000 : 3000;
        const delay = baseDelay * Math.pow(1.5, attempt - 1);
        console.log("[SkillEngine] Retrying in " + (delay / 1000) + "s...");
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────────
// File Extraction (from Step 5 and Step 6)
// ─────────────────────────────────────────────

/**
 * Validate whether a markdown block looks like a real SKILL.md.
 * Must contain YAML frontmatter with name/description fields.
 */
function isValidSkillMd(content: string, skillName: string): boolean {
  // Must have YAML frontmatter
  const hasFrontmatter = /^---\s*\n[\s\S]*?name:\s*\S/m.test(content);
  const hasDescription = /description:/m.test(content);
  // Check if content relates to the target skill (case-insensitive)
  const nameNormalized = skillName.toLowerCase().replace(/[-_]/g, "[\\s\\-_]?");
  const nameRegex = new RegExp(nameNormalized, "i");
  const relatedToSkill = nameRegex.test(content);
  // A valid SKILL.md should have frontmatter with name + description,
  // OR at least be clearly related to the target skill
  return (hasFrontmatter && hasDescription) || (hasFrontmatter && relatedToSkill);
}

/**
 * Extract the optimized SKILL.md from Step 5 output.
 * Step 5 outputs in two parts:
 *   PART A: score card
 *   PART B: full SKILL.md wrapped in ```markdown ... ```
 *
 * The key challenge: Step 5's audit output may contain MULTIPLE markdown code blocks,
 * including example documents (e.g., Docker Compose tutorials) that are NOT the actual SKILL.md.
 * We must validate each candidate block to ensure it's the real SKILL.md.
 */
function extractSkillMdFromStep5(step5Output: string, step3Output: string, step4Output: string, skillName: string = ""): string {
  // ── Strategy -1 (highest priority): Find content between %%SKILL_BEGIN%% and %%SKILL_END%% markers ──
  const BEGIN_MARKER = '%%SKILL_BEGIN%%';
  const END_MARKER = '%%SKILL_END%%';
  const beginIdx = step5Output.indexOf(BEGIN_MARKER);
  const endIdx = step5Output.indexOf(END_MARKER);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    let content = step5Output.slice(beginIdx + BEGIN_MARKER.length, endIdx).trim();
    const mdMatch = content.match(/^```(?:markdown|md)\n([\s\S]*?)```\s*$/);
    if (mdMatch) content = mdMatch[1].trim();
    if (content.length > 100) {
      console.log("[SkillEngine] Strategy -1: Extracted via %%SKILL_BEGIN%%/%%SKILL_END%% markers (" + content.length + " chars)");
      return content;
    }
  }

  // ── Strategy 0 (highest priority): Find PART B section, then extract markdown block within it ──
  const partBPatterns = [
    /##\s*PART\s*B[^\n]*/i,
    /##\s*优化后的完整\s*SKILL/i,
    /##\s*优化后的\s*SKILL/i,
    /##\s*Optimized\s*SKILL/i,
    /PART\s*B\s*[:：]/i,
    /优化后的完整\s*SKILL\.md/i,
  ];

  for (const pattern of partBPatterns) {
    const partBMatch = pattern.exec(step5Output);
    if (partBMatch && partBMatch.index !== undefined) {
      const afterPartB = step5Output.slice(partBMatch.index);
      // Find all markdown/md code blocks after PART B
      const mdBlocksAfterB: string[] = [];
      const mdPatternLocal = /```(?:markdown|md)\n([\s\S]*?)```/g;
      let localMatch;
      while ((localMatch = mdPatternLocal.exec(afterPartB)) !== null) {
        if (localMatch[1].trim().length > 500) {
          mdBlocksAfterB.push(localMatch[1].trim());
        }
      }
      // Prefer blocks with valid YAML frontmatter
      const validBlocks = mdBlocksAfterB.filter(b => isValidSkillMd(b, skillName));
      if (validBlocks.length > 0) {
        const best = validBlocks.reduce((a, b) => a.length > b.length ? a : b);
        console.log("[SkillEngine] Strategy 0: Extracted SKILL.md from PART B section with frontmatter validation (" + best.length + " chars)");
        return best;
      }
      // If no validated blocks, try any code block after PART B
      if (mdBlocksAfterB.length > 0) {
        const best = mdBlocksAfterB.reduce((a, b) => a.length > b.length ? a : b);
        console.log("[SkillEngine] Strategy 0b: Extracted SKILL.md from PART B section (no frontmatter validation) (" + best.length + " chars)");
        return best;
      }
      // Try any code block (not just markdown-tagged) after PART B
      const anyCodeMatch = afterPartB.match(/```[\w]*\n([\s\S]*?)```/);
      if (anyCodeMatch && anyCodeMatch[1].trim().length > 500) {
        const content = anyCodeMatch[1].trim();
        console.log("[SkillEngine] Strategy 0c: Extracted from PART B generic code block (" + content.length + " chars)");
        return content;
      }
    }
  }

  // ── Strategy 1: Find validated ```markdown ... ``` code blocks anywhere in output ──
  const allMarkdownBlocks: string[] = [];
  const mdPattern = /```(?:markdown|md)\n([\s\S]*?)```/g;
  let m;
  while ((m = mdPattern.exec(step5Output)) !== null) {
    if (m[1].trim().length > 500) {
      allMarkdownBlocks.push(m[1].trim());
    }
  }

  if (allMarkdownBlocks.length > 0) {
    // First try: blocks with valid YAML frontmatter
    const validBlocks = allMarkdownBlocks.filter(b => isValidSkillMd(b, skillName));
    if (validBlocks.length > 0) {
      const best = validBlocks.reduce((a, b) => a.length > b.length ? a : b);
      console.log("[SkillEngine] Strategy 1a: Extracted validated SKILL.md markdown block (" + best.length + " chars, " + validBlocks.length + " valid of " + allMarkdownBlocks.length + " total)");
      return best;
    }
    // If no validated blocks, log warning and skip to safer strategies
    console.warn("[SkillEngine] Strategy 1: Found " + allMarkdownBlocks.length + " markdown blocks but NONE passed validation. Skipping to avoid extracting wrong content.");
  }

  // ── Strategy 2: Find YAML frontmatter in raw text and extract everything after it ──
  // LLM may output the SKILL.md directly (not wrapped in code blocks) after PART A
  const fmSearchPattern = /---\n([\s\S]*?)---/g;
  const yamlCandidates: { index: number; content: string }[] = [];
  while ((m = fmSearchPattern.exec(step5Output)) !== null) {
    const fmContent = m[1];
    if (fmContent.includes("name:") && (fmContent.includes("description:") || fmContent.includes(skillName))) {
      // Found a valid YAML frontmatter. Extract everything from here to the end of output.
      const fromFrontmatter = step5Output.slice(m.index);
      if (fromFrontmatter.length > 500) {
        yamlCandidates.push({ index: m.index, content: fromFrontmatter.trim() });
      }
    }
  }
  if (yamlCandidates.length > 0) {
    // Pick the one that appears latest in the output (most likely to be the final/optimized version)
    const best = yamlCandidates[yamlCandidates.length - 1].content;
    console.log("[SkillEngine] Strategy 2: Extracted SKILL.md from YAML frontmatter in raw text (" + best.length + " chars, at index " + yamlCandidates[yamlCandidates.length - 1].index + ")");
    return best;
  }

  // ── Strategy 3 (reliable fallback): Combine Step 3 (frontmatter) + Step 4 (body) ──
  const frontmatterMatch = step3Output.match(/(---\n[\s\S]*?---)/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "---\nname: " + (skillName || "skill") + "\ndescription: |\n  Generated skill\n---";
  const combined = frontmatter + "\n\n" + step4Output;
  console.log("[SkillEngine] Strategy 3 (fallback): Combined Step 3 frontmatter + Step 4 body (" + combined.length + " chars)");
  return combined;
}

/**
 * Extract resource files from Step 6 output.
 * Step 6 uses the format: ### FILE: `path` followed by code block
 */
function extractResourceFiles(step6Output: string): { path: string; content: string }[] {
  if (!step6Output) return [];

  const files: { path: string; content: string }[] = [];
  const seen = new Set<string>();

  function addFile(fpath: string, content: string) {
    const normalized = fpath.replace(/^\.\//, "").trim();
    if (normalized && content && normalized !== "SKILL.md" && !seen.has(normalized)) {
      seen.add(normalized);
      files.push({ path: normalized, content: content.trim() });
    }
  }

  // Pattern 1: ### FILE: `path` followed by ```...```
  const p1 = /###?\s*FILE:\s*`([^`\n]+)`\s*\n+```[\w]*\n([\s\S]*?)```/g;
  let match;
  while ((match = p1.exec(step6Output)) !== null) {
    addFile(match[1], match[2]);
  }

  // Pattern 2: ### `path` followed by ```...```
  const p2 = /###?\s*`([^\n`]+\.\w+)`\s*\n+```[\w]*\n([\s\S]*?)```/g;
  while ((match = p2.exec(step6Output)) !== null) {
    addFile(match[1], match[2]);
  }

  // Pattern 3: ### path/to/file.ext (without backticks) followed by ```...```
  const p3 = /###?\s+(\S+\/\S+\.\w+)\s*\n+```[\w]*\n([\s\S]*?)```/g;
  while ((match = p3.exec(step6Output)) !== null) {
    addFile(match[1], match[2]);
  }

  // Pattern 4: **path** followed by ```...```
  const p4 = /\*\*([^\n*]+\.\w+)\*\*\s*\n+```[\w]*\n([\s\S]*?)```/g;
  while ((match = p4.exec(step6Output)) !== null) {
    addFile(match[1], match[2]);
  }

  // Pattern 5: Any heading with a file-like name followed by code block
  const p5 = new RegExp("^(?:#+\\s+)?(?:\\*\\*)?(?:`)?([a-zA-Z0-9_\\-./]+\\.\\w{1,10})(?:`)?(?:\\*\\*)?\\s*\\n+```[\\w]*\\n([\\s\\S]*?)```", "gm");
  while ((match = p5.exec(step6Output)) !== null) {
    addFile(match[1], match[2]);
  }

  console.log("[SkillEngine] Extracted " + files.length + " resource files total");
  return files;
}

// ─────────────────────────────────────────────
// Assemble Result from available step outputs
// ─────────────────────────────────────────────

function assembleResult(
  userInput: { skillName: string },
  previousOutputs: string[],
  completedSteps: number
): { directory_tree: string; files: { path: string; content: string }[]; usage: any; validation_passed: boolean; partial: boolean } {
  let skillMdContent = "";
  const resourceFiles: { path: string; content: string }[] = [];
  let partial = false;

  // Extract SKILL.md
  if (previousOutputs[4]) {
    // Step 5 completed - use audited version
    skillMdContent = extractSkillMdFromStep5(
      previousOutputs[4],
      previousOutputs[2] || "",
      previousOutputs[3] || "",
      userInput.skillName
    );
  } else if (previousOutputs[3] && previousOutputs[2]) {
    // Step 4 completed - combine frontmatter + body
    const frontmatterMatch = previousOutputs[2].match(/(---\n[\s\S]*?---)/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "---\nname: " + userInput.skillName + "\ndescription: |\n  Generated skill\n---";
    skillMdContent = frontmatter + "\n\n" + previousOutputs[3];
    partial = true;
  } else if (previousOutputs[3]) {
    skillMdContent = previousOutputs[3];
    partial = true;
  }

  // Extract resource files from Step 6
  if (previousOutputs[5]) {
    const extracted = extractResourceFiles(previousOutputs[5]);
    resourceFiles.push(...extracted);
  } else {
    partial = true;
  }

  // Build file list
  const files: { path: string; content: string }[] = [];
  if (skillMdContent) {
    files.push({ path: "SKILL.md", content: skillMdContent });
  }
  files.push(...resourceFiles);

  // Build directory tree
  const buildTree = (fileList: { path: string }[]) => {
    const dirs = new Set<string>();
    for (const f of fileList) {
      const parts = f.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join("/"));
      }
    }

    const allEntries = Array.from(dirs).sort().concat(fileList.map(f => f.path));
    const uniqueSet = new Set(allEntries);
    const unique = Array.from(uniqueSet).sort();

    const lines = [userInput.skillName + "/"];
    for (let i = 0; i < unique.length; i++) {
      const isLast = i === unique.length - 1;
      const prefix = isLast ? "  └── " : "  ├── ";
      lines.push(prefix + unique[i]);
    }
    return lines.join("\n");
  };

  const tree = buildTree(files);

  // Usage info
  const usageInfo: any = {
    installation: "Copy the " + userInput.skillName + "/ directory to your AI platform's skills directory.",
    trigger_examples: ["Please use the " + userInput.skillName + " skill"],
    iteration_suggestions: "Continuously optimize SKILL.md based on usage feedback.",
  };

  // Try to extract trigger examples from Step 7
  if (previousOutputs[6]) {
    const triggerMatches: string[] = [];
    const triggerPattern = /[-*]\s*[""\u201c\u300c]([^""\u201d\u300d\n]+)[""\u201d\u300d]/g;
    let tm;
    while ((tm = triggerPattern.exec(previousOutputs[6])) !== null) {
      triggerMatches.push(tm[1]);
    }
    if (triggerMatches.length >= 2) {
      usageInfo.trigger_examples = triggerMatches.slice(0, 8);
    }
  }

  return {
    directory_tree: tree,
    files,
    usage: usageInfo,
    validation_passed: !partial,
    partial,
  };
}

// ─────────────────────────────────────────────
// Main Pipeline
// ─────────────────────────────────────────────

export async function runGenerationPipeline(generationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Register abort controller for this pipeline
  const abortController = new AbortController();
  runningPipelines.set(generationId, abortController);

  const [gen] = await db.select().from(skillGenerations).where(eq(skillGenerations.id, generationId)).limit(1);
  if (!gen) throw new Error("Generation " + generationId + " not found");

  const userInput = {
    skillName: gen.skillName,
    domain: gen.domain,
    features: gen.features,
    scenarios: gen.scenarios,
    extraNotes: gen.extraNotes,
  };

  await db.update(skillGenerations).set({ status: "running", currentStep: 1 }).where(eq(skillGenerations.id, generationId));

  for (const step of STEPS) {
    await db.insert(generationSteps).values({
      generationId,
      stepNumber: step.number,
      stepName: step.name,
      status: "pending",
    });
  }

  const previousOutputs: string[] = [];
  const systemPrompt = PROMPTS.system;
  let lastCompletedStep = 0;

  try {
    // Execute Steps 1-7
    for (const step of STEPS) {
      // Check abort signal before each step
      if (abortController.signal.aborted) {
        console.log("[SkillEngine] Generation " + generationId + " aborted before step " + step.number);
        runningPipelines.delete(generationId);
        return;
      }

      await db.update(skillGenerations).set({ currentStep: step.number }).where(eq(skillGenerations.id, generationId));

      await db.update(generationSteps)
        .set({ status: "running", startedAt: new Date() })
        .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      try {
        const prompt = buildStepPrompt(step.number, userInput, previousOutputs);
        console.log("[SkillEngine] Step " + step.number + " prompt length: " + prompt.length + " chars");

        const output = await invokeLLMWithRetry([
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ]);

        console.log("[SkillEngine] Step " + step.number + " output length: " + output.length + " chars");

        const summary = extractSummary(output, step.number);
        previousOutputs.push(output);
        lastCompletedStep = step.number;

        await db.update(generationSteps)
          .set({ status: "completed", output, summary, completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      } catch (stepError: any) {
        console.error("[SkillEngine] Step " + step.number + " failed after retries:", stepError.message?.slice(0, 500));
        await db.update(generationSteps)
          .set({ status: "failed", errorMessage: safeErrorMessage(stepError), completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

        // If Step 5+ fails, we can still assemble a partial result from completed steps
        if (lastCompletedStep >= 4) {
          console.log("[SkillEngine] Step " + step.number + " failed but we have " + lastCompletedStep + " completed steps. Assembling partial result...");

          // Fill in empty outputs for failed steps
          while (previousOutputs.length < 7) {
            previousOutputs.push("");
          }

          const resultData = assembleResult(userInput, previousOutputs, lastCompletedStep);

          if (resultData.files.length > 0) {
            await db.update(skillGenerations)
              .set({
                status: "completed",
                result: resultData,
                errorMessage: "Steps 1-" + lastCompletedStep + " completed. Step " + step.number + " failed: " + safeErrorMessage(stepError).slice(0, 200),
                completedAt: new Date(),
              })
              .where(eq(skillGenerations.id, generationId));

            console.log("[SkillEngine] Generation " + generationId + " partially completed with " + resultData.files.length + " files (steps 1-" + lastCompletedStep + ")");
            return;
          }
        }

        // If we don't have enough steps for a partial result, mark as failed
        await db.update(skillGenerations)
          .set({ status: "failed", errorMessage: "Step " + step.number + " failed: " + safeErrorMessage(stepError) })
          .where(eq(skillGenerations.id, generationId));
        return;
      }
    }

    // ── Assemble Final Result (code-level, not LLM-level) ──
    console.log("[SkillEngine] Assembling final Skill package from step outputs...");

    const resultData = assembleResult(userInput, previousOutputs, 7);

    console.log("[SkillEngine] Assembled " + resultData.files.length + " files: " + resultData.files.map(f => f.path).join(", "));

    await db.update(skillGenerations)
      .set({ status: "completed", result: resultData, completedAt: new Date() })
      .where(eq(skillGenerations.id, generationId));

    console.log("[SkillEngine] Generation " + generationId + " completed with " + resultData.files.length + " files");

  } catch (error: any) {
    console.error("[SkillEngine] Pipeline failed for generation " + generationId + ":", safeErrorMessage(error));
    await db.update(skillGenerations)
      .set({ status: "failed", errorMessage: safeErrorMessage(error) })
      .where(eq(skillGenerations.id, generationId));
  } finally {
    runningPipelines.delete(generationId);
  }
}

// ─────────────────────────────────────────────
// Resume Pipeline (retry from failed step)
// ─────────────────────────────────────────────

export async function resumeGenerationPipeline(generationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Register abort controller for resume
  const abortController = new AbortController();
  runningPipelines.set(generationId, abortController);

  const [gen] = await db.select().from(skillGenerations).where(eq(skillGenerations.id, generationId)).limit(1);
  if (!gen) throw new Error("Generation " + generationId + " not found");

  const steps = await db.select().from(generationSteps)
    .where(eq(generationSteps.generationId, generationId))
    .orderBy(generationSteps.stepNumber);

  // Find the first non-completed step
  let resumeFromStep = 0;
  const previousOutputs: string[] = [];

  for (const step of steps) {
    if (step.status === "completed" && step.output) {
      previousOutputs.push(step.output);
    } else {
      resumeFromStep = step.stepNumber;
      break;
    }
  }

  if (resumeFromStep === 0) {
    console.log("[SkillEngine] All steps already completed for generation " + generationId);
    return;
  }

  console.log("[SkillEngine] Resuming generation " + generationId + " from step " + resumeFromStep);

  const userInput = {
    skillName: gen.skillName,
    domain: gen.domain,
    features: gen.features,
    scenarios: gen.scenarios,
    extraNotes: gen.extraNotes,
  };

  await db.update(skillGenerations).set({ status: "running", currentStep: resumeFromStep, errorMessage: null }).where(eq(skillGenerations.id, generationId));

  const systemPrompt = PROMPTS.system;
  let lastCompletedStep = resumeFromStep - 1;

  try {
    for (const step of STEPS) {
      if (step.number < resumeFromStep) continue;

      // Check abort signal before each step
      if (abortController.signal.aborted) {
        console.log("[SkillEngine] Resume generation " + generationId + " aborted before step " + step.number);
        runningPipelines.delete(generationId);
        return;
      }

      await db.update(skillGenerations).set({ currentStep: step.number }).where(eq(skillGenerations.id, generationId));

      // Reset the step status
      await db.update(generationSteps)
        .set({ status: "running", startedAt: new Date(), output: null, summary: null, errorMessage: null, completedAt: null })
        .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      try {
        const prompt = buildStepPrompt(step.number, userInput, previousOutputs);
        console.log("[SkillEngine] Resume Step " + step.number + " prompt length: " + prompt.length + " chars");

        const output = await invokeLLMWithRetry([
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ]);

        console.log("[SkillEngine] Resume Step " + step.number + " output length: " + output.length + " chars");

        const summary = extractSummary(output, step.number);
        previousOutputs.push(output);
        lastCompletedStep = step.number;

        await db.update(generationSteps)
          .set({ status: "completed", output, summary, completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

      } catch (stepError: any) {
        console.error("[SkillEngine] Resume Step " + step.number + " failed:", stepError.message?.slice(0, 500));
        await db.update(generationSteps)
          .set({ status: "failed", errorMessage: safeErrorMessage(stepError), completedAt: new Date() })
          .where(and(eq(generationSteps.generationId, generationId), eq(generationSteps.stepNumber, step.number)));

        // Partial result assembly
        if (lastCompletedStep >= 4) {
          while (previousOutputs.length < 7) previousOutputs.push("");
          const resultData = assembleResult(userInput, previousOutputs, lastCompletedStep);
          if (resultData.files.length > 0) {
            await db.update(skillGenerations)
              .set({
                status: "completed",
                result: resultData,
                errorMessage: "Steps 1-" + lastCompletedStep + " completed. Step " + step.number + " failed: " + safeErrorMessage(stepError).slice(0, 200),
                completedAt: new Date(),
              })
              .where(eq(skillGenerations.id, generationId));
            return;
          }
        }

        await db.update(skillGenerations)
          .set({ status: "failed", errorMessage: "Step " + step.number + " failed: " + safeErrorMessage(stepError) })
          .where(eq(skillGenerations.id, generationId));
        return;
      }
    }

    // Assemble final result
    const resultData = assembleResult(userInput, previousOutputs, 7);

    await db.update(skillGenerations)
      .set({ status: "completed", result: resultData, errorMessage: null, completedAt: new Date() })
      .where(eq(skillGenerations.id, generationId));

    console.log("[SkillEngine] Resume generation " + generationId + " completed with " + resultData.files.length + " files");

  } catch (error: any) {
    console.error("[SkillEngine] Resume pipeline failed:", safeErrorMessage(error));
    await db.update(skillGenerations)
      .set({ status: "failed", errorMessage: safeErrorMessage(error) })
      .where(eq(skillGenerations.id, generationId));
  } finally {
    runningPipelines.delete(generationId);
  }
}
