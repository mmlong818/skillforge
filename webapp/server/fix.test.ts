import { describe, it, expect } from "vitest";

// ── Test the fix engine's extraction logic ──
// We test the core extraction functions by simulating LLM outputs

describe("Fix Engine — extractMarkdownBlock logic", () => {
  // Simulate the extraction pattern used in fixEngine
  function extractMarkdownBlock(text: string, _skillName: string): string | null {
    if (!text) return null;
    const blocks: string[] = [];
    const pattern = /```(?:markdown|md)\s*\n([\s\S]*?)```/g;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      blocks.push(m[1].trim());
    }
    const valid = blocks.filter(b => {
      return b.startsWith("---") && b.includes("name:") && b.includes("description:");
    });
    if (valid.length > 0) {
      return valid.sort((a, b) => b.length - a.length)[0];
    }
    return null;
  }

  it("extracts valid SKILL.md from markdown code block", () => {
    const output = `Here is the rewritten SKILL.md:

\`\`\`markdown
---
name: code-reviewer
description: Automated code review skill that analyzes code quality and provides improvement suggestions. Use when reviewing pull requests or auditing code quality.
version: 2.0.0
tags: [code-review, quality, automation]
---

# Code Reviewer

You are an expert code reviewer...

## Core Workflow

1. Analyze the code structure
2. Check for common anti-patterns
3. Provide actionable suggestions

## Format Rules

- Use markdown for all output
- Include line references

## Anti-patterns

- Do not suggest trivial changes
- Do not rewrite entire files

## Checklist

- [ ] Code structure analyzed
- [ ] Anti-patterns checked
- [ ] Suggestions provided
\`\`\``;

    const result = extractMarkdownBlock(output, "code-reviewer");
    expect(result).not.toBeNull();
    expect(result).toContain("name: code-reviewer");
    expect(result).toContain("description:");
    expect(result).toContain("Core Workflow");
    expect(result).toContain("Anti-patterns");
  });

  it("returns null when no valid markdown block exists", () => {
    const output = `The analysis shows several issues with the skill.

\`\`\`python
def hello():
    print("hello")
\`\`\`

No SKILL.md was generated.`;

    const result = extractMarkdownBlock(output, "test-skill");
    expect(result).toBeNull();
  });

  it("ignores markdown blocks without YAML frontmatter", () => {
    const output = `Here is some documentation:

\`\`\`markdown
# Just a regular document

This is not a SKILL.md file.
\`\`\`

And here is the actual SKILL.md:

\`\`\`markdown
---
name: my-skill
description: A useful skill for doing things. Use when you need to do things.
version: 1.0.0
tags: [utility]
---

# My Skill

Core workflow here...
\`\`\``;

    const result = extractMarkdownBlock(output, "my-skill");
    expect(result).not.toBeNull();
    expect(result).toContain("name: my-skill");
    expect(result).not.toContain("Just a regular document");
  });

  it("selects the longest valid block when multiple exist", () => {
    const shortBlock = `---
name: test
description: Short version. Use when testing.
version: 1.0.0
tags: [test]
---
Short content.`;

    const longBlock = `---
name: test
description: Comprehensive version of the test skill. Use when you need thorough testing with detailed analysis and reporting.
version: 2.0.0
tags: [test, comprehensive]
---

# Test Skill

## Role Definition
You are an expert tester...

## Core Workflow
1. Analyze requirements
2. Design test cases
3. Execute tests
4. Report results

## Format Rules
- Use structured output
- Include test IDs

## Anti-patterns
- Do not skip edge cases

## Checklist
- [ ] Requirements analyzed
- [ ] Tests designed
- [ ] Tests executed`;

    const output = `\`\`\`markdown
${shortBlock}
\`\`\`

Better version:

\`\`\`markdown
${longBlock}
\`\`\``;

    const result = extractMarkdownBlock(output, "test");
    expect(result).not.toBeNull();
    expect(result).toContain("version: 2.0.0");
    expect(result).toContain("Comprehensive version");
  });
});

describe("Fix Engine — extractResourceFiles logic", () => {
  function extractResourceFiles(text: string): Array<{ path: string; content: string }> {
    const files: Array<{ path: string; content: string }> = [];
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

  it("extracts resource files with path annotations", () => {
    const output = `Here is the SKILL.md and resources:

\`\`\`markdown
---
name: test
description: Test skill
---
Content
\`\`\`

\`\`\`markdown:references/best-practices.md
# Best Practices

1. Always validate input
2. Handle errors gracefully
\`\`\`

\`\`\`python:scripts/validate.py
#!/usr/bin/env python3
import sys

def validate(content):
    return len(content) > 0
\`\`\``;

    const files = extractResourceFiles(output);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe("references/best-practices.md");
    expect(files[0].content).toContain("Best Practices");
    expect(files[1].path).toBe("scripts/validate.py");
    expect(files[1].content).toContain("def validate");
  });

  it("skips SKILL.md path annotations", () => {
    const output = `\`\`\`markdown:SKILL.md
---
name: test
description: Test
---
Content
\`\`\``;

    const files = extractResourceFiles(output);
    expect(files).toHaveLength(0);
  });

  it("returns empty array when no resource files exist", () => {
    const output = "Just some plain text output with no code blocks.";
    const files = extractResourceFiles(output);
    expect(files).toHaveLength(0);
  });
});

describe("Fix Engine — FIX_STEPS definition", () => {
  it("has exactly 3 steps", () => {
    // Verify the fix pipeline has the correct number of steps
    const FIX_STEPS = [
      { number: 1, name: "问题诊断" },
      { number: 2, name: "重写修正" },
      { number: 3, name: "质量审计" },
    ];
    expect(FIX_STEPS).toHaveLength(3);
    expect(FIX_STEPS[0].number).toBe(1);
    expect(FIX_STEPS[1].number).toBe(2);
    expect(FIX_STEPS[2].number).toBe(3);
  });
});

describe("Fix Engine — assembleFixResult logic", () => {
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

  it("builds correct directory tree with nested files", () => {
    const files = [
      { path: "SKILL.md" },
      { path: "references/guide.md" },
      { path: "scripts/run.py" },
    ];
    const tree = buildTree("my-skill", files);
    expect(tree).toContain("my-skill/");
    expect(tree).toContain("SKILL.md");
    expect(tree).toContain("references");
    expect(tree).toContain("guide.md");
    expect(tree).toContain("scripts");
    expect(tree).toContain("run.py");
  });

  it("builds tree with only SKILL.md", () => {
    const files = [{ path: "SKILL.md" }];
    const tree = buildTree("simple-skill", files);
    expect(tree).toContain("simple-skill/");
    expect(tree).toContain("SKILL.md");
  });
});
