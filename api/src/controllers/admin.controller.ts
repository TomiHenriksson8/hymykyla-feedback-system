
import mongoose from 'mongoose';
import ResponseModel from '../models/Response';
import SurveyModel from '../models/Survey';

/** Basic admin health & identity check */
export const health = (_req: any, res: any) => {
  res.json({ ok: true, time: new Date().toISOString() });
};

export const me = (req: any, res: any) => {
  const user = (req as any).user;
  res.json({ ok: true, user });
};

/**
 * List all feedback responses with optional filters
 * /admin/responses?limit=50&offset=0&surveyId=...&from=2025-01-01&to=2025-10-10
 */
export const listResponses = async (req: any, res: any) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? 50), 10), 200);
    const offset = Math.max(parseInt(String(req.query.offset ?? 0), 10), 0);
    const surveyId = req.query.surveyId as string | undefined;

    const parseDate = (v?: string) => {
      if (!v) return undefined;
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    const from = parseDate(req.query.from as string | undefined);
    const to = parseDate(req.query.to as string | undefined);

    const match: any = {};
    if (surveyId) {
      if (!mongoose.isValidObjectId(surveyId)) {
        return res.status(400).json({ error: 'invalid_surveyId' });
      }
      match.surveyId = new mongoose.Types.ObjectId(surveyId);
    }
    if (from || to) {
      match.submittedAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const [items, total] = await Promise.all([
      ResponseModel.find(match)
        .sort({ submittedAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      ResponseModel.countDocuments(match),
    ]);

    res.json({ ok: true, items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/** List all surveys (active + previous versions) */
export const listSurveys = async (_req: any, res: any) => {
  try {
    const surveys = await SurveyModel.find().sort({ version: -1 }).lean();
    res.json({ ok: true, surveys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
};

/** Get a single survey by ID */
export const getSurveyById = async (req: any, res: any) => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'invalid_id' });
    }
    const survey = await SurveyModel.findById(id).lean();
    if (!survey) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
};
