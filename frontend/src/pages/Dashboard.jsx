import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadEmployees() {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', {
        params: { search: search || undefined, status: statusFilter || undefined },
      });
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadEmployees, 300); // debounce da busca
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const counts = employees.reduce(
    (acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }),
    {}
  );

  async function handleDelete(id, name) {
    if (!confirm(`Remover o funcionário "${name}"? Essa ação pode ser desfeita apenas pelo suporte técnico.`)) return;
    await api.delete(`/employees/${id}`);
    loadEmployees();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel de ASOs</h2>
          <p className="text-sm text-slate-500">Acompanhe o vencimento dos atestados de saúde ocupacional</p>
        </div>
        <Link
          to="/funcionarios/novo"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          + Novo funcionário
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Em dia" value={counts.ok || 0} color="emerald" />
        <SummaryCard label="Vencendo" value={counts.warning || 0} color="amber" />
        <SummaryCard label="Vencidos" value={counts.expired || 0} color="red" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-3">
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos os status</option>
            <option value="ok">Em dia</option>
            <option value="warning">Vencendo</option>
            <option value="expired">Vencido</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Vencimento do ASO</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>
            )}
            {!loading && employees.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nenhum funcionário encontrado.</td></tr>
            )}
            {!loading && employees.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                <td className="px-4 py-3 text-slate-600">{emp.role}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(emp.asoExpiryDate).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link to={`/funcionarios/${emp.id}/editar`} className="text-brand-600 hover:underline">
                    Editar
                  </Link>
                  <button onClick={() => handleDelete(emp.id, emp.name)} className="text-red-600 hover:underline">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-red-700 bg-red-50 border-red-200',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
