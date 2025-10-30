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

    // Accept both old and new param names
    const rawFrom =
      (req.query.from as string | undefined) ??
      (req.query.dateFrom as string | undefined);
    const rawTo =
      (req.query.to as string | undefined) ??
      (req.query.dateTo as string | undefined);

    const isPlainYMD = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

    const parseDate = (v?: string) => {
      if (!v) return undefined;
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? undefined : d;
    };

    const from = parseDate(rawFrom);
    let to = parseDate(rawTo);

    // If `to` is a plain date (YYYY-MM-DD), make it inclusive by setting end-of-day (local).
    if (to && isPlainYMD(rawTo)) {
      to = new Date(to);
      to.setHours(23, 59, 59, 999);
    }

    // Optional sanity: swap if caller inverted range
    let fromFinal = from;
    let toFinal = to;
    if (fromFinal && toFinal && fromFinal > toFinal) {
      const tmp = fromFinal;
      fromFinal = toFinal;
      toFinal = tmp;
    }

    const match: any = {};
    if (surveyId) {
      if (!mongoose.isValidObjectId(surveyId)) {
        return res.status(400).json({ error: "invalid_surveyId" });
      }
      match.surveyId = new mongoose.Types.ObjectId(surveyId);
    }
    if (fromFinal || toFinal) {
      match.submittedAt = {
        ...(fromFinal ? { $gte: fromFinal } : {}),
        ...(toFinal ? { $lte: toFinal } : {}),
      };
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
