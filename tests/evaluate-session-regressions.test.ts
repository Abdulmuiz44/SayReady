import { assertEquals, assertRejects } from "jsr:@std/assert@1";

import { HttpError } from "../supabase/functions/_shared/errors.ts";
import {
  clampScore,
  evaluateWithSchemaRetry,
  EVAL_PROMPT_VERSION,
  mapTopIssues,
  normalizeRubric,
} from "../supabase/functions/evaluate-session/evaluation.ts";

Deno.test("schema-valid output parsing", async () => {
  const result = await evaluateWithSchemaRetry(async () => ({
    summary: "Solid structure with minor grammar slips.",
    score: 87,
    confidence: 0.82,
    feedback_items: [
      {
        category: "grammar",
        severity: "medium",
        explanation: "Verb tense drift in the middle section.",
        suggestion: "Keep tense consistent when describing prior actions.",
        mistake_key: "grammar.tense_drift",
      },
    ],
  }));

  assertEquals(result.score, 87);
  assertEquals(result.top_issues, ["grammar.tense_drift"]);
});

Deno.test("deterministic mapping of top issues", () => {
  const mapped = mapTopIssues([
    {
      category: "clarity",
      severity: "medium",
      explanation: "Overly long sentence.",
      suggestion: "Split long ideas.",
      mistake_key: "clarity.run_on",
    },
    {
      category: "grammar",
      severity: "high",
      explanation: "Agreement mismatch.",
      suggestion: "Match subject and verb.",
      mistake_key: "grammar.sva",
    },
    {
      category: "fluency",
      severity: "high",
      explanation: "Repeated fillers.",
      suggestion: "Pause silently instead of fillers.",
      mistake_key: "fluency.fillers",
    },
  ]);

  assertEquals(mapped, ["fluency.fillers", "grammar.sva", "clarity.run_on"]);
});

Deno.test("score clamping 0–100", async () => {
  const low = await evaluateWithSchemaRetry(async () => ({
    summary: "Needs major improvement.",
    score: -4,
    confidence: 0.4,
    feedback_items: [],
  }));
  const high = await evaluateWithSchemaRetry(async () => ({
    summary: "Great job.",
    score: 140,
    confidence: 0.91,
    feedback_items: [],
  }));

  assertEquals(clampScore(-4), 0);
  assertEquals(clampScore(140), 100);
  assertEquals(low.score, 0);
  assertEquals(high.score, 100);
});

Deno.test("fallback error when malformed twice", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      evaluateWithSchemaRetry(async () => {
        calls += 1;
        return { invalid: true };
      }),
    HttpError,
    "Evaluation output failed schema validation.",
  );
  assertEquals(calls, 2);
});

Deno.test("rubric normalization ensures category fields", () => {
  const normalized = normalizeRubric({
    categories: [{ key: "grammar" }],
  }) as { categories: Array<Record<string, unknown>> };

  assertEquals(normalized.categories[0], {
    key: "grammar",
    title: "grammar",
    description: "",
    weight: 0,
    scoring_guidelines: [],
    common_mistakes: [],
  });
  assertEquals(EVAL_PROMPT_VERSION, "2026-03-21.v1");
});
