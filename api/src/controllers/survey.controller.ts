
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Survey from '../models/Survey';

/* ----------------------------- validation utils ---------------------------- */

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}

function validateQuestion(q: any) {
  if (!q) throw new Error('Question missing');
  if (!['scale5', 'boolean', 'text'].includes(q.type)) throw new Error('Invalid question.type');
  if (!q.prompt || !isNonEmptyString(q.prompt.fi) || !isNonEmptyString(q.prompt.en) || !isNonEmptyString(q.prompt.sv)) {
    throw new Error('Question.prompt fi/en/sv required');
  }
  if (typeof q.order !== 'number') throw new Error('Question.order required');

  if (q.type === 'scale5') {
    const min = q.min ?? 1;
    const max = q.max ?? 5;
    if (!(Number.isInteger(min) && Number.isInteger(max) && min >= 1 && max <= 5 && min <= max)) {
      throw new Error('scale5 must have 1 ≤ min ≤ max ≤ 5');
    }
  }
  if (q.type === 'text') {
    const maxLength = q.maxLength ?? 1000;
    if (!(Number.isInteger(maxLength) && maxLength > 0)) throw new Error('text.maxLength must be > 0');
  }
}

function ensureUniqueOrder(questions: any[]) {
  const seen = new Set<number>();
  for (const q of questions) {
    if (seen.has(q.order)) throw new Error('Question.order must be unique');
    seen.add(q.order);
  }
}

function validateSurveyPayload(payload: any) {
  if (!payload) throw new Error('Body required');
  if (!isNonEmptyString(payload.title)) throw new Error('title required');
  if (!Number.isFinite(payload.version)) throw new Error('version required');
  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw new Error('questions must be a non-empty array');
  }
  payload.questions.forEach(validateQuestion);
  ensureUniqueOrder(payload.questions);
}

/* --------------------------------- helpers -------------------------------- */

function badRequest(res: Response, msg = 'bad_request') {
  return res.status(400).json({ error: msg });
}
function notFound(res: Response, msg = 'not_found') {
  return res.status(404).json({ error: msg });
}
function internal(res: Response) {
  return res.status(500).json({ error: 'internal_error' });
}

/* ------------------------------- list / fetch ------------------------------ */

export const listSurveys = async (req: Request, res: Response) => {
  try {
    const { title, isActive, skip = '0', limit = '20', sort = 'version:-1' } = req.query as Record<string, string>;
    const q: any = {};
    if (title?.trim()) q.title = new RegExp(title.trim(), 'i');
    if (isActive === 'true') q.isActive = true;
    if (isActive === 'false') q.isActive = false;

    const [field, dirRaw] = sort.split(':');
    const dir = dirRaw === '1' || dirRaw === 'asc' ? 1 : -1;

    const items = await Survey.find(q)
      .sort({ [field || 'version']: dir })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 100))
      .lean();

    res.json({ ok: true, items });
  } catch (err) {
    console.error(err);
    return internal(res);
  }
};

export const listActiveSurveys = async (_req: Request, res: Response) => {
  try {
    const items = await Survey.find({ isActive: true }).sort({ version: -1 }).lean();
    res.json({ ok: true, items });
  } catch (err) {
    console.error(err);
    return internal(res);
  }
};

export const getSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');
    const survey = await Survey.findById(id).lean();
    if (!survey) return notFound(res);
    res.json({ ok: true, survey });
  } catch (err) {
    console.error(err);
    return internal(res);
  }
};

/* --------------------------------- create --------------------------------- */

export const createSurvey = async (req: Request, res: Response) => {
  try {
    validateSurveyPayload(req.body);
    const created = await Survey.create(req.body);
    res.status(201).json({ ok: true, survey: created });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

/* -------------------------------- duplicate ------------------------------- */

export const duplicateSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    const { title, version, isActive = false } = req.body || {};
    if (!Number.isFinite(version)) return badRequest(res, 'version_required');

    const src = await Survey.findById(id).lean();
    if (!src) return notFound(res, 'source_not_found');

    const copy = {
      title: isNonEmptyString(title) ? title : `${src.title} (copy v${version})`,
      version,
      isActive: Boolean(isActive),
      questions: src.questions.map((q: any) => ({
        type: q.type,
        prompt: q.prompt,
        required: q.required,
        order: q.order,
        min: q.min,
        max: q.max,
        maxLength: q.maxLength,
      })),
    };

    validateSurveyPayload(copy);
    const created = await Survey.create(copy);
    res.status(201).json({ ok: true, survey: created });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

/* --------------------------------- update --------------------------------- */

export const replaceSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    validateSurveyPayload(req.body);
    const updated = await Survey.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return notFound(res);
    res.json({ ok: true, survey: updated });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

export const patchSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    const payload = { ...req.body };

    if (payload.questions) {
      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        return badRequest(res, 'questions_non_empty_required');
      }
      payload.questions.forEach(validateQuestion);
      ensureUniqueOrder(payload.questions);
    }
    if (payload.title && !isNonEmptyString(payload.title)) return badRequest(res, 'invalid_title');
    if (payload.version != null && !Number.isFinite(payload.version)) return badRequest(res, 'invalid_version');

    const updated = await Survey.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return notFound(res);
    res.json({ ok: true, survey: updated });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

/* --------------------------------- delete --------------------------------- */

export const deleteSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    const deleted = await Survey.findByIdAndDelete(id);
    if (!deleted) return notFound(res);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    return internal(res);
  }
};

/* ---------------------------- activation control --------------------------- */

export const activateSurvey = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const exclusive = (req.query.exclusive ?? 'false') === 'true';
  if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

  const session = await mongoose.startSession();
  try {
    let updated: any;
    await session.withTransaction(async () => {
      if (exclusive) {
        await Survey.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } }, { session });
      }
      updated = await Survey.findByIdAndUpdate(id, { $set: { isActive: true } }, { new: true, session });
      if (!updated) throw new Error('not_found');
    });
    res.json({ ok: true, survey: updated });
  } catch (err: any) {
    console.error(err);
    if (err?.message === 'not_found') return notFound(res);
    return internal(res);
  } finally {
    await session.endSession();
  }
};

export const deactivateSurvey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    const updated = await Survey.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
    if (!updated) return notFound(res);
    res.json({ ok: true, survey: updated });
  } catch (err) {
    console.error(err);
    return internal(res);
  }
};

/* ------------------------------- question ops ------------------------------ */

export const addQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    const q = req.body;
    validateQuestion(q);

    const updated = await Survey.findByIdAndUpdate(
      id,
      {
        $push: {
          questions: {
            type: q.type,
            prompt: q.prompt,
            required: Boolean(q.required),
            order: q.order,
            min: q.min ?? 1,
            max: q.max ?? 5,
            maxLength: q.maxLength ?? 1000,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) return notFound(res, 'survey_not_found');
    ensureUniqueOrder(updated.questions as any[]);
    res.status(201).json({ ok: true, survey: updated });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

export const patchQuestion = async (req: Request, res: Response) => {
  try {
    const { id, qid } = req.params as { id: string; qid: string };
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(qid)) {
      return badRequest(res, 'invalid_id');
    }

    const survey = await Survey.findById(id);
    if (!survey) return notFound(res, 'survey_not_found');

    const sub = survey.questions.id(qid as any);
    if (!sub) return notFound(res, 'question_not_found');

    const patch = req.body || {};
    const candidate = { ...sub.toObject(), ...patch };
    validateQuestion(candidate);

    (sub as any).set(patch);
    ensureUniqueOrder(survey.questions as any[]);
    await survey.save();
    res.json({ ok: true, survey });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const { id, qid } = req.params as { id: string; qid: string };
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(qid)) {
      return badRequest(res, 'invalid_id');
    }

    const survey = await Survey.findById(id);
    if (!survey) return notFound(res, 'survey_not_found');

    const sub = survey.questions.id(qid as any);
    if (!sub) return notFound(res, 'question_not_found');

    sub.deleteOne();
    if (survey.questions.length === 0) return badRequest(res, 'survey_must_have_at_least_one_question');

    ensureUniqueOrder(survey.questions as any[]);
    await survey.save();
    res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

export const reorderQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const changes: Array<{ _id: string; order: number }> = req.body;

    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');
    if (!Array.isArray(changes) || changes.length === 0) return badRequest(res, 'changes_required');

    const survey = await Survey.findById(id);
    if (!survey) return notFound(res, 'survey_not_found');

    for (const { _id, order } of changes) {
      if (!mongoose.isValidObjectId(_id) || !Number.isInteger(order)) {
        return badRequest(res, 'invalid_change_item');
      }
      const sub = survey.questions.id(_id as any);
      if (!sub) return notFound(res, `question_not_found:${_id}`);
      (sub as any).order = order;
    }

    ensureUniqueOrder(survey.questions as any[]);
    await survey.save();
    res.json({ ok: true, survey });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

export const replaceQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) return badRequest(res, 'invalid_id');

    const questions = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return badRequest(res, 'questions_non_empty_required');
    }
    questions.forEach(validateQuestion);
    ensureUniqueOrder(questions);

    const updated = await Survey.findByIdAndUpdate(
      id,
      { $set: { questions } },
      { new: true, runValidators: true }
    );
    if (!updated) return notFound(res, 'survey_not_found');

    res.json({ ok: true, survey: updated });
  } catch (err: any) {
    console.error(err);
    return badRequest(res, err.message || 'validation_error');
  }
};

