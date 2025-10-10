
import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = (loc.state?.from?.pathname as string) || '/hallinta';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login(email, password);
      nav(redirectTo, { replace: true });
    } catch {
      setErr('Virheellinen sähköposti tai salasana');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'authenticated') {
    nav('/hallinta', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-appbg px-4">
      <form onSubmit={onSubmit} className="bg-panel border border-line rounded-2xl p-6 w-full max-w-sm">
        <div className="mb-6">
          <div className="text-2xl font-extrabold text-ink">HyMy-kylä Admin</div>
          <div className="text-sm text-ink-2">Kirjaudu sisään hallintapaneeliin</div>
        </div>

        <label className="block mb-3">
          <span className="text-sm text-ink-2">Sähköposti</span>
          <input
            type="email" autoFocus value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border border-line rounded-xl px-3 py-2"
            placeholder="admin@example.com"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-ink-2">Salasana</span>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full border border-line rounded-xl px-3 py-2"
            placeholder="••••••••"
          />
        </label>

        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

        <button
          disabled={loading}
          className="w-full px-4 py-2 rounded-xl bg-brand text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? 'Kirjaudutaan…' : 'Kirjaudu'}
        </button>
      </form>
    </div>
  );
}
