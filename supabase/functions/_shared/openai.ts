import { HttpError } from "./errors.ts";

type FeedbackItem = {
  category: string;
  severity: "low" | "medium" | "high";
  quote?: string;
  explanation: string;
  suggestion: string;
  mistake_key?: string;
};

export type EvaluationResult = {
  summary: string;
  score: number;
  confidence: number;
  feedback_items: FeedbackItem[];
};

const EVALUATION_SCHEMA = {
  name: "session_evaluation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      score: { type: "number", minimum: 0, maximum: 100 },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      feedback_items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: { type: "string" },
            severity: { type: "string", enum: ["low", "medium", "high"] },
            quote: { type: "string" },
            explanation: { type: "string" },
            suggestion: { type: "string" },
            mistake_key: { type: "string" },
          },
          required: ["category", "severity", "explanation", "suggestion"],
        },
      },
    },
    required: ["summary", "score", "confidence", "feedback_items"],
  },
};

const buildEvaluationPrompt = (rubric: unknown, transcript: string): string => {
  return [
    "You are an evaluator for speaking practice sessions.",
    "Use ONLY the rubric below and transcript to grade.",
    "Be deterministic and strict. Do not hallucinate missing audio context.",
    "Rubric JSON:",
    JSON.stringify(rubric),
    "Transcript:",
    transcript,
  ].join("\n\n");
};

export const transcribeAudio = async (params: {
  apiKey: string;
  model: string;
  audioBytes: Uint8Array;
  fileName?: string;
  mimeType?: string;
}): Promise<string> => {
  const formData = new FormData();
  const file = new File([params.audioBytes], params.fileName ?? "session-audio.webm", {
    type: params.mimeType ?? "audio/webm",
  });
  formData.append("model", params.model);
  formData.append("file", file);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("OpenAI transcription failure", { status: response.status, body });
    throw new HttpError(502, "transcription_failed", "Failed to transcribe session audio.");
  }

  const json = await response.json() as { text?: string };
  if (!json.text?.trim()) {
    throw new HttpError(502, "transcription_empty", "Received empty transcription output.");
  }

  return json.text.trim();
};

export const evaluateTranscript = async (params: {
  apiKey: string;
  model: string;
  rubric: unknown;
  transcript: string;
}): Promise<unknown> => {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Return only JSON valid for the requested schema.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildEvaluationPrompt(params.rubric, params.transcript),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: EVALUATION_SCHEMA.name,
          strict: true,
          schema: EVALUATION_SCHEMA.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("OpenAI evaluation failure", { status: response.status, body });
    throw new HttpError(502, "evaluation_failed", "Failed to evaluate transcript.");
  }

  const json = await response.json() as {
    output_text?: string;
  };

  if (!json.output_text) {
    throw new HttpError(502, "evaluation_empty", "Model output was empty.");
  }

  try {
    return JSON.parse(json.output_text);
  } catch {
    throw new HttpError(502, "evaluation_malformed", "Model returned malformed JSON output.");
  }
};
