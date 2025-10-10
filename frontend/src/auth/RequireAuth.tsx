
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export default function RequireAuth() {
  const { status } = useAuth();
  const loc = useLocation();

  if (status === 'loading') {
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/hallinta/kirjaudu" state={{ from: loc }} replace />;
  }
  return <Outlet />;
}
