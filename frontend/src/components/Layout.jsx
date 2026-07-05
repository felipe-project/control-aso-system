import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-800">Controle de ASO</h1>
          <p className="text-xs text-slate-500">Recursos Humanos</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink to="/" end className={linkClass}>
            Painel
          </NavLink>
          <NavLink to="/funcionarios/novo" className={linkClass}>
            Novo funcionário
          </NavLink>
          <NavLink to="/configuracoes" className={linkClass}>
            Configurações
          </NavLink>
          <NavLink to="/usuarios" className={linkClass}>
            Usuários
          </NavLink>
        </nav>

        <div className="px-4 py-4 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate mb-3">{user?.email}</p>
          <button
            onClick={logout}
            className="w-full text-sm text-red-600 hover:bg-red-50 rounded-lg py-2 font-medium"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
