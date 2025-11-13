// controllers/responses.ts
import mongoose from "mongoose";
import ResponseModel from "../models/Response";

/**
 * List all feedback responses with optional filters
 * Supports:
 *   /responses?limit=50&offset=0&surveyId=...&from=2025-01-01&to=2025-10-10
 *   /responses?limit=50&dateFrom=2025-10-19T21:00:00.000Z&dateTo=2025-10-27T21:59:59.999Z
 */
export const listResponses = async (req: any, res: any) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? 50), 10), 200);
    const offset = Math.max(parseInt(String(req.query.offset ?? 0), 10), 0);
    const surveyId = req.query.surveyId as string | undefined;


    const match: any = {};

    if (surveyId && mongoose.isValidObjectId(surveyId)) {
      match.surveyId = new mongoose.Types.ObjectId(surveyId);
    }


    const from = (req.query.from as string | undefined) ?? (req.query.dateFrom as string | undefined);
    const to = (req.query.to as string | undefined) ?? (req.query.dateTo as string | undefined);

    if (from || to) {
      match.submittedAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          match.submittedAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          match.submittedAt.$lte = toDate;
        }
      }

      if (Object.keys(match.submittedAt).length === 0) {
        delete match.submittedAt;
      }
    }

    const [items, total] = await Promise.all([
      ResponseModel.find(match)
        .sort({ submittedAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      ResponseModel.countDocuments(match),
    ]);

    return res.json({ ok: true, items, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
};