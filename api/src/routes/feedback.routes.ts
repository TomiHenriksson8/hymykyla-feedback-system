
import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller';

const router = Router();

// POST /feedback/submit
router.post('/submit', submitFeedback);

export default router;

