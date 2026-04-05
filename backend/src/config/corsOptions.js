/**
 * CORS listo para front en Vite (local) y Vercel (producción).
 * Define CORS_ORIGINS como lista separada por comas, p. ej.:
 * https://mi-app.vercel.app,http://localhost:5173
 */
export function buildCorsOptions() {
  const raw = process.env.CORS_ORIGINS?.trim();

  if (!raw || raw === '*') {
    return { origin: true, credentials: true };
  }

  const allowed = raw.split(',').map((o) => o.trim()).filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  };
}
