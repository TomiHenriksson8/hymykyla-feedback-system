import { useAuthCtx } from './AuthProvider';
export function useAuth() {
  return useAuthCtx();
}
