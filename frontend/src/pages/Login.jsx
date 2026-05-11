import { useEffect, useId, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SEED_TEST_PRESETS } from '../config/seedTestPresets.js';
import { getApiErrorMessage } from '../utils/apiErrors.js';

export default function Login() {
  const { login, isAuthenticated, initializing, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailId = useId();
  const passwordId = useId();
  const presetId = useId();
  const errorId = useId();
  const showTestPresets = import.meta.env.DEV;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      const defaultPath = user?.role === 'admin' ? '/dashboard' : '/productos';
      const target = location.state?.from || defaultPath;
      navigate(target, { replace: true });
    }
  }, [initializing, isAuthenticated, navigate, user, location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { user: loggedUser } = await login(email, password);
      const defaultPath = loggedUser?.role === 'admin' ? '/dashboard' : '/productos';
      const target = location.state?.from || defaultPath;
      navigate(target, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-b from-brand-50 to-slate-100 px-4 py-10">
      <main className="mx-auto w-full max-w-md">
        <section
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
          aria-labelledby="login-heading"
        >
          <h1 id="login-heading" className="text-center text-2xl font-bold text-slate-900">
            SEBDOM V2
          </h1>
          <p className="mt-1 text-center text-sm text-slate-600">
            Inicie sesión para continuar
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {showTestPresets ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-3">
                <label htmlFor={presetId} className="block text-sm font-medium text-amber-900">
                  Usuario de prueba
                </label>
                <p className="mt-0.5 text-xs text-amber-800/90">
                  Solo visible en modo desarrollo. Ejecuta el seed del backend si aún no existen en la base.
                </p>
                <select
                  id={presetId}
                  name="testPreset"
                  value=""
                  onChange={(e) => {
                    const key = e.target.value;
                    const preset = SEED_TEST_PRESETS.find((p) => p.value === key);
                    if (preset) {
                      setEmail(preset.email);
                      setPassword(preset.password);
                      setError('');
                    }
                    e.target.value = '';
                  }}
                  className="mt-2 w-full rounded-lg border border-amber-300/80 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">— Elegir para rellenar correo y contraseña —</option>
                  {SEED_TEST_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor={emailId} className="block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </div>

            <div>
              <label htmlFor={passwordId} className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 shadow-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </div>

            {error ? (
              <div
                id={errorId}
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
