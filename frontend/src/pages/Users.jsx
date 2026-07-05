import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', email: '', password: '' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      setSuccess(`Usuário "${form.name}" criado com sucesso.`);
      setForm(emptyForm);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Remover o acesso de "${name}" ao sistema?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao remover usuário.');
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Usuários do sistema</h2>
        <p className="text-sm text-slate-500">Gerencie quem tem acesso ao painel de controle de ASO</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Novo usuário</h3>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" required>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="E-mail" required>
            <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        <Field label="Senha provisória" required>
          <input required type="password" minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" />
          <p className="text-xs text-slate-500 mt-1">Recomende que a pessoa troque essa senha no primeiro acesso.</p>
        </Field>

        {error && <p className="text-sm px-3 py-2 rounded-lg border text-red-700 bg-red-50 border-red-200">{error}</p>}
        {success && <p className="text-sm px-3 py-2 rounded-lg border text-emerald-700 bg-emerald-50 border-emerald-200">{success}</p>}

        <button type="submit" disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60">
          {saving ? 'Criando...' : 'Criar usuário'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Usuários com acesso</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Carregando...</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {u.name} {u.id === currentUser?.id && <span className="text-xs text-slate-400">(você)</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUser?.id && (
                    <button onClick={() => handleDelete(u.id, u.name)} className="text-red-600 hover:underline">
                      Remover acesso
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
