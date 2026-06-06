import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

// Production'da VITE_API_URL bo'sh qoldiriladi -> nisbiy '/api' (nginx bir domendan xizmat qiladi).
// Lokal dev'da .env dagi http://localhost:8000 ishlatiladi.
export const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Har bir so'rovga access tokenni qo'shamiz
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Media (rasm) URL ni to'liq qilish uchun yordamchi
export const mediaUrl = (path: string | null): string | null =>
  path ? (path.startsWith('http') ? path : `${API_URL}${path}`) : null;

// 401 bo'lsa refresh token bilan qayta urinish, bo'lmasa logout
let refreshing = false;
let queue: ((token: string | null) => void)[] = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      const { refresh, setAccess, logout } = useAuthStore.getState();

      if (!refresh) {
        logout();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (refreshing) {
        // Boshqa so'rov refresh qilayotgan bo'lsa navbatda kutamiz
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              original._retry = true;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      original._retry = true;
      refreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh/`, { refresh });
        setAccess(data.access);
        queue.forEach((cb) => cb(data.access));
        queue = [];
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        queue.forEach((cb) => cb(null));
        queue = [];
        logout();
        redirectToLogin();
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }

    // Umumiy xato xabari
    if (status && status !== 401) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Server xatosi yuz berdi';
      toast.error(typeof msg === 'string' ? msg : 'Xatolik yuz berdi');
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default api;
