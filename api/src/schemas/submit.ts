
import { z } from 'zod';

export const SubmitPayload = z.object({
  surveyId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    type: z.enum(['scale5', 'boolean', 'text']),
    valueNumber: z.number().int().min(1).max(5).optional(),
    valueBoolean: z.boolean().optional(),
    valueText: z.string().max(1000).optional(),
  })).min(1),
});
