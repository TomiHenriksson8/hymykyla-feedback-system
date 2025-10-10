
import { api } from './api';

export async function getMe() {
  const r = await api('/auth/me');
  if (!r.ok) return null;
  return r.json() as Promise<{ ok: true; user: { sub: string; role: 'admin' } }>;
}

export async function postLogin(email: string, password: string) {
  const r = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error('Login failed');
  return r.json() as Promise<{ ok: true }>;
}

export async function postLogout() {
  await api('/auth/logout', { method: 'POST' });
}
