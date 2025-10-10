import { Request, Response } from 'express';
import { z } from 'zod';
import SurveyModel, { Survey as SurveyType, Question } from '../models/Survey';
import ResponseModel from '../models/Response';
import { SubmitPayload } from '../schemas/submit';

type SubmitBody = z.infer<typeof SubmitPayload>;

export const submitFeedback = async (req: Request, res: Response) => {
  // 1) Validate payload
  const parsed = SubmitPayload.safeParse(req.body);
  if (!parsed.success) return res.status(400).send('Invalid payload');
  const body: SubmitBody = parsed.data;

  // 2) Load survey (lean for speed, but typed)
  const survey = await SurveyModel.findById(body.surveyId).lean<SurveyType>().exec();
  if (!survey || !survey.isActive) return res.status(400).send('Invalid survey');

  // 3) Build quick lookup for questions
  const qMap = new Map<string, Question>(survey.questions.map((q) => [q._id.toString(), q]));

  // 4) Validate answers against survey questions
  for (const a of body.answers) {
    const q = qMap.get(a.questionId);
    if (!q) return res.status(400).send('Unknown question');
    if (a.type !== q.type) return res.status(400).send('Type mismatch');

    if (q.type === 'scale5') {
      const v = a.valueNumber;
      const min = q.min ?? 1;
      const max = q.max ?? 5;
      if (!(Number.isInteger(v) && v! >= min && v! <= max)) {
        return res.status(400).send('Invalid scale value');
      }
    } else if (q.type === 'boolean') {
      if (typeof a.valueBoolean !== 'boolean') {
        return res.status(400).send('Invalid boolean value');
      }
    } else if (q.type === 'text') {
      const limit = q.maxLength ?? 1000;
      if (a.valueText && a.valueText.length > limit) {
        return res.status(400).send('Text too long');
      }
    }
  }

  // (Optional strictness you can enable later)
  // - ensure required questions are answered
  // - ensure no duplicate answers for same question

  // 5) Persist response
  await ResponseModel.create({
    surveyId: (survey as any)._id,         // _id exists on lean doc at runtime
    surveyVersion: survey.version,
    answers: body.answers,
  });

  // 6) No content
  res.sendStatus(204);
};
