
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requireAuth } from './middleware/auth';

import surveyRoutes from './routes/survey.routes';
import feedbackRoutes from './routes/feedback.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

export const app = express();

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true })); // <— add this
app.use(cookieParser());

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.send('ok'));
app.get('/ready', (_req, res) => res.send('ready'));

app.use('/auth', authRoutes);
app.use('/surveys', surveyRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/admin', requireAuth, adminRoutes);

app.get('/', (_req, res) => res.json({ name: 'hymykylä-api', status: 'running' }));

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

