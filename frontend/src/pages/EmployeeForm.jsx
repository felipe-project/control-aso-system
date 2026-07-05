import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const emptyForm = {
  name: '', cpf: '', role: '', department: '', email: '', phone: '',
  admissionDate: '', asoIssueDate: '', asoExpiryDate: '',
  useCustomAlert: false, alertValue: 30, alertUnit: 'DAYS',
};

export default function EmployeeForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/employees/${id}`).then(({ data }) => {
      setForm({
        name: data.name,
        cpf: data.cpf,
        role: data.role,
        department: data.department,
        email: data.email || '',
        phone: data.phone || '',
        admissionDate: data.admissionDate ? data.admissionDate.slice(0, 10) : '',
        asoIssueDate: data.asoIssueDate.slice(0, 10),
        asoExpiryDate: data.asoExpiryDate.slice(0, 10),
        useCustomAlert: Boolean(data.alertSetting),
        alertValue: data.alertSetting?.value || 30,
        alertUnit: data.alertSetting?.unit || 'DAYS',
      });
    });
  }, [id, isEditing]);

  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Sugere automaticamente o vencimento (emissão + 1 ano) quando o usuário
      // preenche a data de emissão e ainda não mexeu manualmente no vencimento.
      if (field === 'asoIssueDate' && value && !prev.asoExpiryDate) {
        const d = new Date(value);
        d.setFullYear(d.getFullYear() + 1);
        next.asoExpiryDate = d.toISOString().slice(0, 10);
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name: form.name,
      cpf: form.cpf,
      role: form.role,
      department: form.department,
      email: form.email || null,
      phone: form.phone || null,
      admissionDate: form.admissionDate || null,
      asoIssueDate: form.asoIssueDate,
      asoExpiryDate: form.asoExpiryDate,
      ...(form.useCustomAlert && { alertValue: form.alertValue, alertUnit: form.alertUnit }),
    };

    try {
      if (isEditing) {
        await api.put(`/employees/${id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar funcionário.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        {isEditing ? 'Editar funcionário' : 'Novo funcionário'}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome completo" required>
            <input required value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="input" />
          </Field>
          <Field label="CPF" required>
            <input required value={form.cpf} onChange={(e) => handleChange('cpf', e.target.value)} className="input" placeholder="000.000.000-00" />
          </Field>
          <Field label="Cargo" required>
            <input required value={form.role} onChange={(e) => handleChange('role', e.target.value)} className="input" placeholder="Enfermeiro(a)" />
          </Field>
          <Field label="Setor" required>
            <input required value={form.department} onChange={(e) => handleChange('department', e.target.value)} className="input" placeholder="UTI" />
          </Field>
          <Field label="E-mail">
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="input" />
          </Field>
          <Field label="Telefone">
            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="input" />
          </Field>
          <Field label="Data de admissão">
            <input type="date" value={form.admissionDate} onChange={(e) => handleChange('admissionDate', e.target.value)} className="input" />
          </Field>
        </div>

        <hr className="border-slate-200" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de emissão do ASO" required>
            <input required type="date" value={form.asoIssueDate} onChange={(e) => handleChange('asoIssueDate', e.target.value)} className="input" />
          </Field>
          <Field label="Data de vencimento do ASO" required>
            <input required type="date" value={form.asoExpiryDate} onChange={(e) => handleChange('asoExpiryDate', e.target.value)} className="input" />
          </Field>
        </div>
        <p className="text-xs text-slate-500 -mt-3">
          O vencimento é sugerido automaticamente (emissão + 1 ano), mas pode ser ajustado manualmente.
        </p>

        <hr className="border-slate-200" />

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
            <input
              type="checkbox"
              checked={form.useCustomAlert}
              onChange={(e) => handleChange('useCustomAlert', e.target.checked)}
            />
            Definir um prazo de alerta específico para este funcionário
          </label>

          {form.useCustomAlert && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Avisar</span>
              <input
                type="number"
                min={1}
                value={form.alertValue}
                onChange={(e) => handleChange('alertValue', e.target.value)}
                className="input w-20"
              />
              <select
                value={form.alertUnit}
                onChange={(e) => handleChange('alertUnit', e.target.value)}
                className="input w-36"
              >
                <option value="DAYS">dia(s)</option>
                <option value="WEEKS">semana(s)</option>
                <option value="MONTHS">mês(es)</option>
              </select>
              <span className="text-sm text-slate-600">antes do vencimento</span>
            </div>
          )}
          {!form.useCustomAlert && (
            <p className="text-xs text-slate-500">Será usado o prazo de alerta global (configurável em Configurações).</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="text-slate-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-100">
            Cancelar
          </button>
        </div>
      </form>
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
