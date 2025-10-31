// api/src/routes/public.routes.ts

import { Router } from 'express';
import { getActiveSurvey } from '../controllers/public.controller';

// Create a new router instance
const router = Router();

// Define the route:
// When a GET request comes to '/active-survey',
// run the 'getActiveSurvey' function.
router.get('/active-survey', getActiveSurvey);

// Export the router so 'app.ts' can use it
export default router;