
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
router.get('/', listSurveys);                // GET    /surveys
router.get('/active', listActiveSurveys);    // GET    /surveys/active
router.get('/:id', getSurvey);               // GET    /surveys/:id
router.post('/', createSurvey);              // POST   /surveys
router.post('/:id/duplicate', duplicateSurvey); // POST /surveys/:id/duplicate
router.put('/:id', replaceSurvey);           // PUT    /surveys/:id
router.patch('/:id', patchSurvey);           // PATCH  /surveys/:id
router.delete('/:id', deleteSurvey);         // DELETE /surveys/:id

/* --------------------------- activation management ------------------------- */
router.post('/:id/activate', activateSurvey);    // POST /surveys/:id/activate?exclusive=true
router.post('/:id/deactivate', deactivateSurvey);// POST /surveys/:id/deactivate

/* ------------------------------ question CRUD ------------------------------ */
router.post('/:id/questions', addQuestion);                  // POST   /surveys/:id/questions
router.patch('/:id/questions/:qid', patchQuestion);          // PATCH  /surveys/:id/questions/:qid
router.delete('/:id/questions/:qid', deleteQuestion);        // DELETE /surveys/:id/questions/:qid
router.post('/:id/questions/reorder', reorderQuestions);     // POST   /surveys/:id/questions/reorder
router.put('/:id/questions', replaceQuestions);              // PUT    /surveys/:id/questions

export default router;

