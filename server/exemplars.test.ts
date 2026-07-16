import { describe, it, expect } from "vitest";
import { selectExemplars, buildExemplarOutlineBlock, buildExemplarFullBlock } from "./exemplars";

describe("selectExemplars", () => {
  it("matches Chinese input by bilingual tags", () => {
    const picked = selectExemplars({
      skillName: "jingpin-fenxi",
      domain: "市场调研",
      features: "分析竞品的优劣势，输出竞争格局报告",
    });
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.length).toBeLessThanOrEqual(2);
    expect(picked.map((e) => e.id)).toContain("competitor-analysis");
  });

  it("matches English input", () => {
    const picked = selectExemplars({
      skillName: "retention-explorer",
      domain: "data analytics",
      features: "cohort retention analysis with visualization charts",
    });
    expect(picked.map((e) => e.id)).toContain("cohort-analysis");
  });

  it("falls back to one generic exemplar when nothing matches", () => {
    const picked = selectExemplars({
      skillName: "xyz",
      domain: "量子占星",
      features: "完全无关的领域",
    });
    expect(picked.length).toBe(1);
    expect(picked[0].id).toBe("cohort-analysis");
  });

  it("is deterministic for identical input (generate/resume build same prompt)", () => {
    const input = { skillName: "prd-writer", domain: "产品", features: "写需求文档 PRD" };
    const a = selectExemplars(input).map((e) => e.id);
    const b = selectExemplars(input).map((e) => e.id);
    expect(a).toEqual(b);
  });
});

describe("exemplar prompt blocks", () => {
  const picked = selectExemplars({ skillName: "prd-writer", domain: "产品", features: "写 PRD 需求文档" });

  it("outline block contains headings but not body text", () => {
    const block = buildExemplarOutlineBlock(picked);
    expect(block).toContain("参考范例结构");
    expect(block).toMatch(/^#{1,3}\s/m);
    expect(block).not.toContain("```");
  });

  it("full block wraps content in plain-text markers", () => {
    const block = buildExemplarFullBlock(picked);
    expect(block).toContain("--- 范例开始：");
    expect(block).toContain("--- 范例结束：");
    expect(block).toContain("name: ");
  });

  it("empty selection yields empty blocks", () => {
    expect(buildExemplarOutlineBlock([])).toBe("");
    expect(buildExemplarFullBlock([])).toBe("");
  });
});
