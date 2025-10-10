
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { requireAuth } from '../middleware/auth';
import { login, logout, me, createAdmin } from '../controllers/auth.controller';

const router = Router();

// limit login attempts
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20 });

// Auth
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// Dev only to create admin user
router.post('/create-admin', createAdmin);

export default router;

