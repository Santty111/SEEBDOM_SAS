import axios from 'axios';

/** Claves compartidas con `AuthContext` (mismo origen de verdad). */
export const AUTH_TOKEN_KEY = 'sebdom.auth.token';
export const AUTH_USER_KEY = 'sebdom.auth.user';

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

/**
 * Cliente HTTP central: adjunta JWT en cada petición y limpia sesión ante 401.
 */
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30_000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      window.dispatchEvent(new CustomEvent('sebdom:auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
