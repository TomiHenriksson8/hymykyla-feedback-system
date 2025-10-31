// api/src/controllers/public.controller.ts

import SurveyModel from '../models/Survey';
import { Request, Response } from 'express';

/**
 * Hae ainoa aktiivinen kysely
 * GET /public/active-survey
 */
export const getActiveSurvey = async (_req: Request, res: Response) => {
  try {
    // Find the one survey that is marked as { isActive: true }
    // If there are multiple, sort by version and pick the newest.
    const survey = await SurveyModel.findOne({ isActive: true })
      .sort({ version: -1 })
      .lean(); // .lean() makes it faster, just plain data

    if (!survey) {
      // If no survey is active, send a 404
      return res.status(404).json({ error: 'no_active_survey' });
    }

    // Send the survey to the frontend
    res.json({ ok: true, survey });

  } catch (err) {
    console.error('Error fetching active survey:', err);
    res.status(500).json({ error: 'internal_error' });
  }
};