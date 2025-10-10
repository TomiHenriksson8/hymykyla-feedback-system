
import { Request, Response } from 'express';
import User from '../models/User';
import { comparePassword, hashPassword } from '../utils/password';
import { requireAuth, signSession, setSessionCookie, clearSessionCookie } from '../middleware/auth';
import { env } from '../config/env';
import { normalizeEmail } from '../utils/email';

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  const email = normalizeEmail(String(req.body?.email ?? ''));
  const password = String(req.body?.password ?? '');

  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

  const user = await User.findOne({ email }).lean();
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const token = signSession({ sub: user._id!.toString(), role: user.role ?? 'admin' });
  setSessionCookie(res, token);
  res.json({ ok: true });
};

// POST /auth/logout
export const logout = async (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ ok: true });
};

// GET /auth/me
export const me = async (req: Request, res: Response) => {
  // requireAuth middleware should have set req.user
  res.json({ ok: true, user: (req as any).user });
};

// POST /auth/create-admin (idempotent seed for dev)
export const createAdmin = async (_req: Request, res: Response) => {
  const email = normalizeEmail(env.ADMIN_EMAIL);
  const exists = await User.findOne({ email }).lean();
  if (exists) return res.json({ ok: true, seeded: false });

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await User.create({ email, passwordHash, role: 'admin' });
  res.json({ ok: true, seeded: true });
};
