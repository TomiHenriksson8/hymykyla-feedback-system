import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { requireAuth } from '../middleware/auth';
// 1. CHANGE PASSWROD 
import { login, logout, me, createAdmin, changePassword } from '../controllers/auth.controller';

const router = Router();

// limit login attempts
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20 });

// Auth
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// 2. CHANGE PASSWORD ROUTE
router.post('/change-password', requireAuth, changePassword);

// Dev only to create admin user
router.post('/create-admin', createAdmin);

export default router;