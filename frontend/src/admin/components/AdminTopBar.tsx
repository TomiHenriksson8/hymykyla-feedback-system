
import { useAuth } from '../../auth/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminTopbar() {
  const { logout } = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    await logout();
    nav('/hallinta/kirjaudu', { replace: true });
  }

  return (
    <header className="h-14 border-b border-line bg-panel/90 backdrop-blur px-5 flex items-center justify-between">
      <div className="font-heading text-[15px] font-semibold tracking-tight text-ink">
        Hallintapaneeli
      </div>
      <button
        onClick={onLogout}
        className="font-heading text-[14px] px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-600"
      >
        Kirjaudu ulos
      </button>
    </header>
  );
}

