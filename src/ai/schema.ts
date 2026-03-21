import { z } from 'zod';

export const aiEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
});

export type AIEvaluation = z.infer<typeof aiEvaluationSchema>;

export const validateAIResponse = (payload: unknown): AIEvaluation => aiEvaluationSchema.parse(payload);
