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

const isTimeoutError = (error: unknown): boolean => error instanceof DOMException && error.name === "TimeoutError";

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

  let response: Response;
  try {
    response = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${params.apiKey}` },
      body: formData,
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new HttpError(504, "transcription_timeout", "Mistral transcription timed out.");
    }
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("Mistral transcription failure", { status: response.status, body });
    throw new HttpError(502, "transcription_failed", "Failed to transcribe session audio.");
  }

  const json = await response.json() as { text?: string };
  if (!json.text?.trim()) throw new HttpError(502, "transcription_empty", "Received empty transcription output.");
  return json.text.trim();
};

export const evaluateTranscript = async (params: {
  apiKey: string;
  model: string;
  rubric: unknown;
  transcript: string;
}): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        temperature: 0,
        messages: [
          { role: "system", content: "Return only JSON valid for the requested schema." },
          { role: "user", content: buildEvaluationPrompt(params.rubric, params.transcript) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: EVALUATION_SCHEMA.name,
            strict: true,
            schema: EVALUATION_SCHEMA.schema,
          },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch (error) {
    if (isTimeoutError(error)) throw new HttpError(504, "evaluation_timeout", "Mistral evaluation timed out.");
    throw error;
  }

  if (!response.ok) {
    const body = await response.text();
    console.error("Mistral evaluation failure", { status: response.status, body });
    throw new HttpError(502, "evaluation_failed", "Failed to evaluate transcript.");
  }

  const json = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new HttpError(502, "evaluation_empty", "Model output was empty.");

  try {
    return JSON.parse(content);
  } catch {
    throw new HttpError(502, "evaluation_malformed", "Model returned malformed JSON output.");
  }
};
