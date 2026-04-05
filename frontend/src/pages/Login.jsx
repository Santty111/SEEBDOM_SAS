import { useEffect, useId, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/apiErrors.js';

export default function Login() {
  const { login, isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [initializing, isAuthenticated, from, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
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
