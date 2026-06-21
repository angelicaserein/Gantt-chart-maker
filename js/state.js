export const palette = ["#d9bfd0", "#cda9c3", "#b98eaf", "#a77b9d", "#e5ccd9", "#d3bdd9", "#c1a2cb"];

export const state = {
  title: "Summer Project",
  start: "2026-06-04",
  end: "2026-09-02",
  categories: [
    { id: "cat-docs",   name: "Documentation", color: "#c896c8" },
    { id: "cat-collab", name: "Development",    color: "#b496c8" },
    { id: "cat-eval",   name: "Evaluation",     color: "#a096c8" }
  ],
  items: [
    // Documentation — line 0: Proposal tasks
    { id: "docs-proposal-draft",  categoryId: "cat-docs", name: "Draft the initial proposal",         tag: "Proposal", start: "2026-06-04", end: "2026-06-10", color: "#c896c8", line: 0 },
    { id: "docs-proposal-refine", categoryId: "cat-docs", name: "Refine the proposal",                tag: "Proposal", start: "2026-06-11", end: "2026-06-17", color: "#c896c8", line: 0 },
    // Documentation — line 1: Report tasks
    { id: "docs-lit-review",      categoryId: "cat-docs", name: "Conduct literature review",          tag: "Report",   start: "2026-06-04", end: "2026-06-24", color: "#c896c8", line: 1 },
    { id: "docs-report-draft",    categoryId: "cat-docs", name: "Draft the initial report",           tag: "Report",   start: "2026-06-25", end: "2026-08-12", color: "#c896c8", line: 1 },
    { id: "docs-report-analyze",  categoryId: "cat-docs", name: "Analyze data and refine the report", tag: "Report",   start: "2026-08-13", end: "2026-08-26", color: "#c896c8", line: 1 },
    { id: "docs-final-review",    categoryId: "cat-docs", name: "Final review and polishing",         tag: "Report",   start: "2026-08-27", end: "2026-09-02", color: "#c896c8", line: 1 },

    // Development — line 0: Cooperation tasks
    { id: "dev-collab-establish", categoryId: "cat-collab", name: "Establish collaboration with the participant", tag: "Cooperation",  start: "2026-06-04", end: "2026-06-10", color: "#b496c8", line: 0 },
    { id: "dev-collab-finalize",  categoryId: "cat-collab", name: "Finalize the co-design process",              tag: "Cooperation",  start: "2026-06-11", end: "2026-06-17", color: "#b496c8", line: 0 },
    // Development — line 1: Requirements tasks
    { id: "dev-req-elicit",       categoryId: "cat-collab", name: "Elicit requirements",                         tag: "Requirements", start: "2026-06-04", end: "2026-06-17", color: "#b496c8", line: 1 },
    { id: "dev-req-analysis",     categoryId: "cat-collab", name: "Conduct requirements analysis",               tag: "Requirements", start: "2026-06-18", end: "2026-07-01", color: "#b496c8", line: 1 },
    // Development — line 2: Design & Dev tasks
    { id: "dev-design-scope",     categoryId: "cat-collab", name: "Define prototype scope and technical approach", tag: "Design",     start: "2026-06-11", end: "2026-06-17", color: "#b496c8", line: 2 },
    { id: "dev-design-spec",      categoryId: "cat-collab", name: "Complete prototype design specification",      tag: "Design",      start: "2026-06-18", end: "2026-07-01", color: "#b496c8", line: 2 },
    { id: "dev-iterative",        categoryId: "cat-collab", name: "Iterative development",                       tag: "Dev",         start: "2026-07-02", end: "2026-07-29", color: "#b496c8", line: 2 },
    { id: "dev-optimize",         categoryId: "cat-collab", name: "Optimize and refine code",                    tag: "Dev",         start: "2026-07-30", end: "2026-08-19", color: "#b496c8", line: 2 },

    // Evaluation — Experiment tasks
    { id: "eval-methods-design",  categoryId: "cat-eval", name: "Design evaluation methods",                        tag: "Experiment",  start: "2026-06-11", end: "2026-06-17", color: "#a096c8" },
    { id: "eval-questionnaire",   categoryId: "cat-eval", name: "Improve the evaluation design and questionnaire",  tag: "Experiment",  start: "2026-06-18", end: "2026-06-24", color: "#a096c8" },
    // Evaluation — ABAB phases
    { id: "eval-a1-baseline",     categoryId: "cat-eval", name: "A₁ Phase 1 Baseline",                             tag: "ABAB phases", start: "2026-06-25", end: "2026-07-08", color: "#a096c8" },
    { id: "eval-b1-intervention", categoryId: "cat-eval", name: "B₁ Phase 2 Intervention",                         tag: "ABAB phases", start: "2026-07-09", end: "2026-07-23", color: "#a096c8" },
    { id: "eval-a2-baseline",     categoryId: "cat-eval", name: "A₂ Phase 3 Return to Baseline",                   tag: "ABAB phases", start: "2026-07-24", end: "2026-08-05", color: "#a096c8" },
    { id: "eval-b2-intervention", categoryId: "cat-eval", name: "B₂ Phase 4 Re-intervention",                      tag: "ABAB phases", start: "2026-08-06", end: "2026-08-19", color: "#a096c8" }
  ]
};
