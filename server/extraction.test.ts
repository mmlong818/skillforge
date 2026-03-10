import { describe, expect, it } from "vitest";
import { _isValidSkillMd, _extractSkillMdFromStep5, _extractResourceFiles } from "./skillEngine";

// ─────────────────────────────────────────────
// isValidSkillMd tests
// ─────────────────────────────────────────────

describe("isValidSkillMd", () => {
  it("returns true for content with YAML frontmatter containing name and description", () => {
    const content = `---
name: markdown-writer
description: |
  A skill for writing markdown documents
---

# Markdown Writer

Instructions here...`;
    expect(_isValidSkillMd(content, "markdown-writer")).toBe(true);
  });

  it("returns true for content with frontmatter and matching skill name", () => {
    const content = `---
name: api-tester
version: 1.0
---

# API Tester Skill

Test APIs efficiently.`;
    expect(_isValidSkillMd(content, "api-tester")).toBe(true);
  });

  it("returns false for Docker Compose tutorial (no YAML frontmatter)", () => {
    const content = `# Docker Compose Tutorial

This guide shows how to use Docker Compose for multi-container applications.

## Getting Started

First, create a docker-compose.yml file:

\`\`\`yaml
version: '3'
services:
  web:
    image: nginx
\`\`\`

## Running

Run \`docker-compose up\` to start all services.`;
    expect(_isValidSkillMd(content, "markdown-writer")).toBe(false);
  });

  it("returns false for random markdown without frontmatter", () => {
    const content = `# Some Random Document

This is just a regular document with lots of text that happens to be longer than 500 characters.
It talks about various topics but has no YAML frontmatter at all.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.`;
    expect(_isValidSkillMd(content, "test-skill")).toBe(false);
  });

  it("returns true when frontmatter has name matching skillName even without description", () => {
    const content = `---
name: code-reviewer
version: 2.0
---

# Code Reviewer

Review code for best practices.`;
    expect(_isValidSkillMd(content, "code-reviewer")).toBe(true);
  });
});

// ─────────────────────────────────────────────
// extractSkillMdFromStep5 tests
// ─────────────────────────────────────────────

describe("extractSkillMdFromStep5", () => {
  it("Strategy 0: extracts from PART B section with validated frontmatter", () => {
    const step5Output = `## PART A: 评分卡

| 维度 | 评分 |
|------|------|
| Description 触发精准度 | 9 |
| 知识增量 | 8 |

## PART B: 优化后的完整 SKILL.md

\`\`\`markdown
---
name: markdown-writer
description: |
  A comprehensive skill for writing high-quality markdown documents
---

# Markdown Writer

Write beautiful markdown documents with proper formatting.

## Core Workflow

1. Analyze the document requirements
2. Structure the content
3. Apply formatting rules
4. Validate output

## Anti-patterns

- Do NOT use HTML inside markdown unless absolutely necessary
- Do NOT nest code blocks improperly

## Validation Checklist

- [ ] All headings follow hierarchy
- [ ] Code blocks have language tags
- [ ] Links are valid
\`\`\``;

    const result = _extractSkillMdFromStep5(step5Output, "", "", "markdown-writer");
    expect(result).toContain("name: markdown-writer");
    expect(result).toContain("description:");
    expect(result).toContain("# Markdown Writer");
    expect(result).toContain("Core Workflow");
    expect(result).not.toContain("PART A");
    expect(result).not.toContain("评分卡");
  });

  it("Strategy 0: correctly ignores example documents before PART B", () => {
    const step5Output = `## PART A: 评分卡

Here is an example of a well-structured document:

\`\`\`markdown
# Docker Compose Tutorial

This is a comprehensive guide to Docker Compose for multi-container applications.
Docker Compose simplifies the process of defining and running multi-container Docker applications.
With Compose, you use a YAML file to configure your application's services.

## Prerequisites

- Docker installed
- Basic understanding of containers

## Getting Started

Create a docker-compose.yml file in your project directory.
This file defines the services that make up your app.
Each service runs in its own container.

## Advanced Topics

Multi-stage builds, networking, volumes, and more advanced Docker Compose features.
Health checks, restart policies, and resource constraints.
Environment variables and secrets management.
\`\`\`

The above example shows good structure but lacks YAML frontmatter.

## PART B: 优化后的完整 SKILL.md

\`\`\`markdown
---
name: markdown-writer
description: |
  Skill for writing professional markdown documents with proper structure, formatting, and best practices. Covers headings, lists, tables, code blocks, links, images, and advanced formatting techniques.
---

# Markdown Writer

Professional markdown writing skill that helps create well-structured documents.

## Core Workflow

1. Analyze the document requirements and target audience
2. Plan the document structure with appropriate heading hierarchy
3. Write content sections with proper formatting and style
4. Apply markdown best practices for readability
5. Review and validate the final output

## Formatting Rules

- Use ATX-style headings (# H1, ## H2, etc.)
- Leave blank lines before and after headings
- Use fenced code blocks with language identifiers
- Prefer reference-style links for repeated URLs

## Anti-patterns

- Do NOT skip heading levels (e.g., jumping from H1 to H3)
- Do NOT use HTML unless absolutely necessary
- Do NOT nest code blocks improperly

## Validation Checklist

- [ ] All headings follow proper hierarchy
- [ ] Code blocks have language tags
- [ ] Links are valid and accessible
- [ ] Tables are properly formatted
\`\`\``;

    const result = _extractSkillMdFromStep5(step5Output, "", "", "markdown-writer");
    expect(result).toContain("name: markdown-writer");
    expect(result).toContain("Professional markdown writing skill");
    expect(result).not.toContain("Docker Compose Tutorial");
  });

  it("Strategy 1a: extracts validated block when no PART B marker exists", () => {
    const step5Output = `# Quality Audit

Some audit commentary here about the skill quality.

Here is an unrelated example:

\`\`\`markdown
# Random Example Document

This is just an example that happens to be in a markdown code block.
It has no YAML frontmatter and is not a SKILL.md file at all.
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
\`\`\`

And here is the optimized SKILL.md:

\`\`\`markdown
---
name: api-tester
description: |
  A comprehensive skill for testing REST APIs with automated validation, response checking, and detailed test report generation. Supports GET, POST, PUT, DELETE methods.
---

# API Tester

Test REST APIs efficiently with automated validation and comprehensive reporting.

## Core Features

- Send HTTP requests (GET, POST, PUT, DELETE, PATCH)
- Validate response status codes, headers, and body content
- Generate detailed test reports with pass/fail summaries
- Support for authentication (Bearer, Basic, API Key)

## Workflow

1. Define API endpoints and expected behaviors
2. Configure test cases with request parameters
3. Execute tests sequentially or in parallel
4. Analyze results and generate reports

## Anti-patterns

- Do NOT hardcode authentication tokens in test files
- Do NOT skip response body validation
- Do NOT ignore HTTP status codes

## Validation Checklist

- [ ] All endpoints return expected status codes
- [ ] Response bodies match expected schemas
- [ ] Error responses are properly formatted
- [ ] Authentication flows work correctly
\`\`\``;

    const result = _extractSkillMdFromStep5(step5Output, "", "", "api-tester");
    expect(result).toContain("name: api-tester");
    expect(result).toContain("Test REST APIs");
    expect(result).not.toContain("Random Example Document");
  });

  it("Strategy 3: falls back to Step 3 + Step 4 when Step 5 has no valid blocks", () => {
    const step5Output = `# Quality Audit Results

Score: 85/100

The skill looks good overall. Minor improvements suggested.

No code blocks here at all, just plain text commentary about the audit.`;

    const step3Output = `Here is the metadata:

---
name: data-analyzer
description: |
  Analyze structured data and produce insights
---

The description scores 4/5 on trigger accuracy.`;

    const step4Output = `# Data Analyzer

Analyze data with precision.

## Workflow

1. Load data
2. Clean and transform
3. Analyze patterns
4. Generate report

## Anti-patterns

- Do NOT skip data validation
- Do NOT assume data types`;

    const result = _extractSkillMdFromStep5(step5Output, step3Output, step4Output, "data-analyzer");
    expect(result).toContain("name: data-analyzer");
    expect(result).toContain("# Data Analyzer");
    expect(result).toContain("Analyze data with precision");
  });

  it("Strategy 2: extracts SKILL.md from raw YAML frontmatter in text (no code block)", () => {
    const step5Output = `## PART A: 评分卡

| 维度 | 评分 |
|------|------|
| Description | 9 |
| 知识增量 | 8 |

Lots of audit commentary here about various aspects of the skill.
This section contains detailed analysis of each dimension.
The auditor provides specific recommendations for improvement.
Multiple paragraphs of detailed feedback follow.

---
name: markdown-writer
description: |
  A comprehensive skill for writing professional markdown documents with proper structure and formatting.
---

## Core Workflow

1. Analyze document requirements
2. Plan structure with heading hierarchy
3. Write content with proper formatting
4. Apply best practices
5. Validate output

## Formatting Rules

- Use ATX-style headings
- Leave blank lines before and after headings
- Use fenced code blocks with language identifiers

## Anti-patterns

- Do NOT skip heading levels
- Do NOT use HTML unless necessary`;

    const result = _extractSkillMdFromStep5(step5Output, "", "", "markdown-writer");
    expect(result).toContain("name: markdown-writer");
    expect(result).toContain("Core Workflow");
    expect(result).toContain("Anti-patterns");
    expect(result).not.toContain("评分卡");
  });

  it("handles empty Step 5 output gracefully", () => {
    const result = _extractSkillMdFromStep5("", "---\nname: test\ndescription: |\n  test\n---", "# Test body", "test");
    expect(result).toContain("name: test");
    expect(result).toContain("# Test body");
  });
});

// ─────────────────────────────────────────────
// extractResourceFiles tests
// ─────────────────────────────────────────────

describe("extractResourceFiles", () => {
  it("extracts files with ### FILE: `path` format", () => {
    const output = `Here are the resource files:

### FILE: \`scripts/validate.sh\`
\`\`\`bash
#!/bin/bash
echo "Validating..."
\`\`\`

### FILE: \`references/api-guide.md\`
\`\`\`markdown
# API Guide

Use the API as follows...
\`\`\``;

    const files = _extractResourceFiles(output);
    expect(files).toHaveLength(2);
    expect(files[0].path).toBe("scripts/validate.sh");
    expect(files[0].content).toContain("#!/bin/bash");
    expect(files[1].path).toBe("references/api-guide.md");
    expect(files[1].content).toContain("# API Guide");
  });

  it("extracts files with ### `path` format", () => {
    const output = `### \`templates/report.md\`
\`\`\`markdown
# Report Template

## Summary
{{summary}}
\`\`\``;

    const files = _extractResourceFiles(output);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("templates/report.md");
  });

  it("skips SKILL.md files", () => {
    const output = `### FILE: \`SKILL.md\`
\`\`\`markdown
---
name: test
---
Should be skipped
\`\`\`

### FILE: \`scripts/run.py\`
\`\`\`python
print("hello")
\`\`\``;

    const files = _extractResourceFiles(output);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("scripts/run.py");
  });

  it("deduplicates files with same path", () => {
    const output = `### FILE: \`scripts/validate.sh\`
\`\`\`bash
#!/bin/bash
echo "first"
\`\`\`

### FILE: \`scripts/validate.sh\`
\`\`\`bash
#!/bin/bash
echo "second"
\`\`\``;

    const files = _extractResourceFiles(output);
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain("first");
  });

  it("handles empty input", () => {
    expect(_extractResourceFiles("")).toHaveLength(0);
    expect(_extractResourceFiles("no files here")).toHaveLength(0);
  });

  it("extracts files with **path** format", () => {
    const output = `**scripts/deploy.sh**
\`\`\`bash
#!/bin/bash
deploy_app
\`\`\``;

    const files = _extractResourceFiles(output);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("scripts/deploy.sh");
  });
});
