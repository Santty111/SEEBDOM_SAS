import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Package, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass =
  'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-brand-700';
const activeClass = 'bg-brand-50 text-brand-800';

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
          <span className="text-lg font-semibold text-brand-800">SEBDOM</span>
        </div>

        <nav
          id="mobile-nav"
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-1 border-b border-slate-200 bg-white px-4 py-3 shadow-md md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          aria-label="Principal"
        >
          {user?.role === 'admin' && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkClass} flex items-center gap-2 ${isActive ? activeClass : ''}`
              }
              onClick={closeMenu}
              end
            >
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              Administración
            </NavLink>
          )}
          <NavLink
            to="/productos"
            className={({ isActive }) =>
              `${linkClass} flex items-center gap-2 ${isActive ? activeClass : ''}`
            }
            onClick={closeMenu}
          >
            <Package className="h-4 w-4 shrink-0" aria-hidden />
            Productos
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <p className="hidden max-w-[10rem] truncate text-right text-sm text-slate-600 sm:block sm:max-w-xs">
            <span className="sr-only">Usuario: </span>
            <span className="font-medium text-slate-800">{user?.email}</span>
          </p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-800"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
