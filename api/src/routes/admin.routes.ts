
import { Router } from 'express';
import { getSurveyById, health, listResponses, listSurveys, me } from '../controllers/admin.controller';


const router = Router();

// Basic admin health & identity
router.get('/health', health);
router.get('/me', me);

// Responses
router.get('/responses', listResponses);

// Surveys
router.get('/surveys', listSurveys);
router.get('/surveys/:id', getSurveyById);

export default router;

