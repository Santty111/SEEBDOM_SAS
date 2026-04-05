import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

/**
 * Contenedor con barra superior y área principal semántica.
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
