
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { health } from '../controllers/admin.controller';
import { me } from '../controllers/auth.controller';

const router = Router();

router.use(requireAuth)

// Basic admin health & identity
router.get('/health', health);
router.get('/me', me);


export default router;

