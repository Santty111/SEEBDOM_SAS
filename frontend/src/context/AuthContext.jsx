import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../api/axiosConfig.js';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

/**
 * Estado global de autenticación (token + usuario).
 * Persistencia: localStorage (mismas claves que usa el interceptor de Axios).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = readStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setInitializing(false);
  }, []);

  useEffect(() => {
    const clearSession = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('sebdom:auth-expired', clearSession);
    return () => window.removeEventListener('sebdom:auth-expired', clearSession);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', {
      email: email?.trim(),
      password,
    });

    const payload = data?.data;
    if (!payload?.token || !payload?.user) {
      throw new Error('Respuesta de login inválida');
    }

    const { token: nextToken, user: nextUser } = payload;
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return payload;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      initializing,
      login,
      logout,
    }),
    [user, token, initializing, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
