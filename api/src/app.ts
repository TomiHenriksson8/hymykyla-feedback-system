import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requireAuth } from './middleware/auth';

// --- Route Imports ---
import surveyRoutes from './routes/survey.routes';
import feedbackRoutes from './routes/feedback.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes'; 
import responseRoutes from './routes/response.routes';

export const app = express();

// --- Core Middlewares ---
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

// --- Health Checks ---
app.get('/health', (_req, res) => res.send('ok'));
app.get('/ready', (_req, res) => res.send('ready'));

// --- Route Definitions ---

// --- PUBLIC ROUTES ---
// Anyone can access these
app.use('/auth', authRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/public', publicRoutes); 

// --- ADMIN-ONLY ROUTES ---
// requireAuth middleware protects these
app.use('/surveys', requireAuth, surveyRoutes);
app.use('/admin', requireAuth, adminRoutes);
app.use('/surveys', requireAuth, surveyRoutes);
app.use('/responses', requireAuth, responseRoutes);


// --- Root and Error Handlers ---
app.get('/', (_req, res) => res.json({ name: 'hymykylä-api', status: 'running' }));

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});