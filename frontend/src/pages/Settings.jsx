import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyEmailForm = {
  smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: false,
  fromName: 'Sistema de Controle de ASO', fromEmail: '', notifyEmails: '',
};

export default function Settings() {
  const [emailForm, setEmailForm] = useState(emptyEmailForm);
  const [hasPassword, setHasPassword] = useState(false);
  const [alertForm, setAlertForm] = useState({ value: 30, unit: 'DAYS' });

  const [emailMsg, setEmailMsg] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [testMsg, setTestMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.get('/settings/email').then(({ data }) => {
      if (data) {
        setEmailForm({ ...emptyEmailForm, ...data, smtpPass: '' });
        setHasPassword(data.hasPassword);
      }
    });
    api.get('/settings/alert').then(({ data }) => setAlertForm({ value: data.value, unit: data.unit }));
  }, []);

  async function saveEmail(e) {
    e.preventDefault();
    setEmailMsg(null);
    setSaving(true);
    try {
      await api.put('/settings/email', emailForm);
      setEmailMsg({ type: 'success', text: 'Configuração de e-mail salva com sucesso.' });
      setHasPassword(true);
      setEmailForm((f) => ({ ...f, smtpPass: '' }));
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  async function testEmail() {
    setTestMsg(null);
    setTesting(true);
    try {
      const { data } = await api.post('/settings/email/test');
      setTestMsg({ type: 'success', text: data.message });
    } catch (err) {
      setTestMsg({ type: 'error', text: err.response?.data?.error || 'Falha no teste.' });
    } finally {
      setTesting(false);
    }
  }

  async function saveAlert(e) {
    e.preventDefault();
    setAlertMsg(null);
    try {
      await api.put('/settings/alert', alertForm);
      setAlertMsg({ type: 'success', text: 'Prazo de alerta padrão atualizado.' });
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.error || 'Erro ao salvar.' });
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500">Ajuste o envio de e-mails e o prazo padrão de alerta</p>
      </div>

      {/* Configuração de e-mail */}
      <form onSubmit={saveEmail} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Envio de e-mail (SMTP)</h3>
        <p className="text-xs text-slate-500 -mt-2">
          Dados do servidor de e-mail usado para disparar os alertas de vencimento. Se usar Gmail, gere uma "senha de app".
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Servidor SMTP" required>
            <input required className="input" value={emailForm.smtpHost} onChange={(e) => setEmailForm({ ...emailForm, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
          </Field>
          <Field label="Porta" required>
            <input required type="number" className="input" value={emailForm.smtpPort} onChange={(e) => setEmailForm({ ...emailForm, smtpPort: e.target.value })} />
          </Field>
          <Field label="Usuário SMTP" required>
            <input required className="input" value={emailForm.smtpUser} onChange={(e) => setEmailForm({ ...emailForm, smtpUser: e.target.value })} />
          </Field>
          <Field label={`Senha SMTP ${hasPassword ? '(já configurada)' : ''}`}>
            <input type="password" className="input" value={emailForm.smtpPass} onChange={(e) => setEmailForm({ ...emailForm, smtpPass: e.target.value })} placeholder={hasPassword ? 'Deixe em branco para manter' : ''} />
          </Field>
          <Field label="Nome do remetente">
            <input className="input" value={emailForm.fromName} onChange={(e) => setEmailForm({ ...emailForm, fromName: e.target.value })} />
          </Field>
          <Field label="E-mail do remetente" required>
            <input required type="email" className="input" value={emailForm.fromEmail} onChange={(e) => setEmailForm({ ...emailForm, fromEmail: e.target.value })} />
          </Field>
        </div>

        <Field label="E-mail(s) do RH que recebem os alertas" required>
          <input required className="input" value={emailForm.notifyEmails} onChange={(e) => setEmailForm({ ...emailForm, notifyEmails: e.target.value })} placeholder="rh@hospital.com, coordenacao@hospital.com" />
          <p className="text-xs text-slate-500 mt-1">Separe vários e-mails por vírgula.</p>
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={emailForm.smtpSecure} onChange={(e) => setEmailForm({ ...emailForm, smtpSecure: e.target.checked })} />
          Usar conexão segura (SSL) — geralmente porta 465
        </label>

        {emailMsg && <Message type={emailMsg.type} text={emailMsg.text} />}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={testEmail} disabled={testing} className="text-slate-700 border border-slate-300 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-50 disabled:opacity-60">
            {testing ? 'Enviando...' : 'Enviar e-mail de teste'}
          </button>
        </div>
        {testMsg && <Message type={testMsg.type} text={testMsg.text} />}
      </form>

      {/* Prazo de alerta padrão */}
      <form onSubmit={saveAlert} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Prazo de alerta padrão</h3>
        <p className="text-xs text-slate-500 -mt-2">
          Com quanta antecedência o sistema deve avisar o RH antes do ASO vencer (vale para todos os funcionários, exceto os que tiverem um prazo específico definido no cadastro).
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Avisar</span>
          <input type="number" min={1} className="input w-24" value={alertForm.value} onChange={(e) => setAlertForm({ ...alertForm, value: e.target.value })} />
          <select className="input w-36" value={alertForm.unit} onChange={(e) => setAlertForm({ ...alertForm, unit: e.target.value })}>
            <option value="DAYS">dia(s)</option>
            <option value="WEEKS">semana(s)</option>
            <option value="MONTHS">mês(es)</option>
          </select>
          <span className="text-sm text-slate-600">antes do vencimento</span>
        </div>

        {alertMsg && <Message type={alertMsg.type} text={alertMsg.text} />}

        <button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
          Salvar
        </button>
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

function Message({ type, text }) {
  const styles = type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200';
  return <p className={`text-sm px-3 py-2 rounded-lg border ${styles}`}>{text}</p>;
}
