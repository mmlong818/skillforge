// Curated high-quality SKILL.md exemplars from phuryn/pm-skills (MIT).
// Injected into generation prompts as few-shot references:
//   Step 2 gets section outlines (cheap), Step 4 gets full exemplar content.
import EXEMPLARS from "./exemplars.json";

export interface Exemplar {
  id: string;
  archetype: string;
  tags: string[];
  content: string;
}

export interface ExemplarUserInput {
  skillName: string;
  domain: string;
  features: string;
  scenarios?: string | null;
  extraNotes?: string | null;
}

const ALL: Exemplar[] = (EXEMPLARS as { exemplars: Exemplar[] }).exemplars;

/** Generic fallback when no tag matches: a well-structured workflow-type exemplar */
const FALLBACK_ID = "cohort-analysis";

/**
 * Pick up to `max` exemplars whose tags appear in the user's input.
 * Deterministic (pure function of input) so generate and resume build identical prompts.
 */
export function selectExemplars(userInput: ExemplarUserInput, max: number = 2): Exemplar[] {
  const text = [userInput.skillName, userInput.domain, userInput.features, userInput.scenarios, userInput.extraNotes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scored = ALL
    .map((e) => ({ e, score: e.tags.reduce((s, tag) => s + (text.includes(tag.toLowerCase()) ? 1 : 0), 0) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) return scored.slice(0, max).map((s) => s.e);
  return ALL.filter((e) => e.id === FALLBACK_ID);
}

function extractOutline(content: string): string {
  return content
    .split("\n")
    .filter((line) => /^#{1,3}\s/.test(line))
    .join("\n");
}

/** For Step 2 (architecture decisions): section outlines only */
export function buildExemplarOutlineBlock(exemplars: Exemplar[]): string {
  if (exemplars.length === 0) return "";
  const parts = exemplars.map(
    (e) => `### 范例结构：${e.id}（${e.archetype}）\n${extractOutline(e.content)}`
  );
  return (
    "\n\n---\n## 参考范例结构（来自社区验证的高质量 Skill 库 phuryn/pm-skills，MIT）\n\n" +
    "以下是与本需求类型相近的成熟 Skill 的章节结构。做架构决策时参考其组织方式和渐进式披露思路，不要照搬内容：\n\n" +
    parts.join("\n\n") +
    "\n\n---\n"
  );
}

/** For Step 4 (SKILL.md body generation): full exemplar content between plain-text markers (avoids nested code-fence issues) */
export function buildExemplarFullBlock(exemplars: Exemplar[]): string {
  if (exemplars.length === 0) return "";
  const parts = exemplars.map(
    (e) =>
      `--- 范例开始：${e.id}（${e.archetype}） ---\n${e.content}\n--- 范例结束：${e.id} ---`
  );
  return (
    "\n\n---\n## 高质量参考范例（来自社区验证的 Skill 库 phuryn/pm-skills，MIT）\n\n" +
    "以下完整 SKILL.md 范例与本需求类型相近。学习其行文风格、结构组织、信息密度和祈使语气；内容必须原创并紧扣本需求，不要抄袭范例的具体内容或领域知识：\n\n" +
    parts.join("\n\n") +
    "\n\n---\n"
  );
}
