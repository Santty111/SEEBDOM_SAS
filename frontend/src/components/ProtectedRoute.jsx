import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui/Spinner.jsx';

/**
 * Agrupa rutas que exigen sesión JWT válida y opcionalmente un rol específico.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, initializing, user } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <Spinner label="Comprobando sesión" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Verificar si el rol del usuario está permitido
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/productos" replace />;
  }

  return <Outlet />;
}
