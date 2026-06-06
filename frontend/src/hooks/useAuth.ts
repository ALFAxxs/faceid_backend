import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { login as loginApi } from '@/api/auth';
import { toast } from '@/store/toastStore';

export function useAuth() {
  const navigate = useNavigate();
  const { access, username, setTokens, setUsername, logout: doLogout } = useAuthStore();

  async function login(user: string, password: string) {
    const { access, refresh } = await loginApi(user, password);
    setTokens(access, refresh);
    setUsername(user);
    navigate('/dashboard');
  }

  function logout() {
    doLogout();
    toast.info('Tizimdan chiqdingiz');
    navigate('/login');
  }

  return { isAuthenticated: !!access, username, login, logout };
}
