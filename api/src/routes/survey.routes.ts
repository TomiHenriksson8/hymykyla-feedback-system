
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listSurveys,
  listActiveSurveys,
  getSurvey,
  createSurvey,
  duplicateSurvey,
  replaceSurvey,
  patchSurvey,
  deleteSurvey,
  activateSurvey,
  deactivateSurvey,
  addQuestion,
  patchQuestion,
  deleteQuestion,
  reorderQuestions,
  replaceQuestions,
} from '../controllers/survey.controller';

const router = Router();

// Protect everything under this router
router.use(requireAuth);

/* ------------------------------- surveys CRUD ------------------------------ */
router.get('/', listSurveys);                // GET    /admin/surveys
router.get('/active', listActiveSurveys);    // GET    /admin/surveys/active
router.get('/:id', getSurvey);               // GET    /admin/surveys/:id
router.post('/', createSurvey);              // POST   /admin/surveys
router.post('/:id/duplicate', duplicateSurvey); // POST /admin/surveys/:id/duplicate
router.put('/:id', replaceSurvey);           // PUT    /admin/surveys/:id
router.patch('/:id', patchSurvey);           // PATCH  /admin/surveys/:id
router.delete('/:id', deleteSurvey);         // DELETE /admin/surveys/:id

/* --------------------------- activation management ------------------------- */
router.post('/:id/activate', activateSurvey);    // POST /admin/surveys/:id/activate?exclusive=true
router.post('/:id/deactivate', deactivateSurvey);// POST /admin/surveys/:id/deactivate

/* ------------------------------ question CRUD ------------------------------ */
router.post('/:id/questions', addQuestion);                  // POST   /admin/surveys/:id/questions
router.patch('/:id/questions/:qid', patchQuestion);          // PATCH  /admin/surveys/:id/questions/:qid
router.delete('/:id/questions/:qid', deleteQuestion);        // DELETE /admin/surveys/:id/questions/:qid
router.post('/:id/questions/reorder', reorderQuestions);     // POST   /admin/surveys/:id/questions/reorder
router.put('/:id/questions', replaceQuestions);              // PUT    /admin/surveys/:id/questions

export default router;

