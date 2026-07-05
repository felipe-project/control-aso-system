const prisma = require('../config/prisma');
const { sendTestEmail } = require('../services/emailService');

// --- Configuração de e-mail (SMTP) ---

async function getEmailConfig(req, res) {
  try {
    const config = await prisma.emailConfig.findFirst();
    if (!config) return res.json(null);

    // Nunca devolvemos a senha do SMTP para o frontend
    const { smtpPass, ...safeConfig } = config;
    return res.json({ ...safeConfig, hasPassword: Boolean(smtpPass) });
  } catch (err) {
    console.error('Erro em getEmailConfig:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar configuração de e-mail.' });
  }
}

async function upsertEmailConfig(req, res) {
  try {
    const {
      smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure,
      fromName, fromEmail, notifyEmails,
    } = req.body;

    if (!smtpHost || !smtpPort || !smtpUser || !fromEmail || !notifyEmails) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios do e-mail.' });
    }

    const existing = await prisma.emailConfig.findFirst();

    const data = {
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser,
      smtpSecure: smtpSecure ?? true,
      fromName: fromName || 'Sistema de Controle de ASO',
      fromEmail,
      notifyEmails,
      // só sobrescreve a senha se uma nova foi enviada
      ...(smtpPass && { smtpPass }),
    };

    const config = existing
      ? await prisma.emailConfig.update({ where: { id: existing.id }, data })
      : await prisma.emailConfig.create({ data: { ...data, smtpPass: smtpPass || '' } });

    const { smtpPass: _hidden, ...safeConfig } = config;
    return res.json(safeConfig);
  } catch (err) {
    console.error('Erro em upsertEmailConfig:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar configuração de e-mail.' });
  }
}

async function testEmailConfig(req, res) {
  try {
    await sendTestEmail();
    return res.json({ success: true, message: 'E-mail de teste enviado com sucesso.' });
  } catch (err) {
    console.error('Erro ao enviar e-mail de teste:', err);
    return res.status(400).json({ error: `Falha ao enviar e-mail de teste: ${err.message}` });
  }
}

// --- Configuração global de alerta (quando avisar antes do vencimento) ---

async function getGlobalAlert(req, res) {
  try {
    let setting = await prisma.alertSetting.findFirst({ where: { employeeId: null } });
    if (!setting) {
      setting = await prisma.alertSetting.create({
        data: { employeeId: null, value: 30, unit: 'DAYS' },
      });
    }
    return res.json(setting);
  } catch (err) {
    console.error('Erro em getGlobalAlert:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar configuração de alerta.' });
  }
}

async function updateGlobalAlert(req, res) {
  try {
    const { value, unit } = req.body;

    if (!value || !['DAYS', 'WEEKS', 'MONTHS'].includes(unit)) {
      return res.status(400).json({ error: 'Informe um valor e uma unidade válida (DAYS, WEEKS ou MONTHS).' });
    }

    const existing = await prisma.alertSetting.findFirst({ where: { employeeId: null } });

    const setting = existing
      ? await prisma.alertSetting.update({
          where: { id: existing.id },
          data: { value: Number(value), unit },
        })
      : await prisma.alertSetting.create({
          data: { employeeId: null, value: Number(value), unit },
        });

    return res.json(setting);
  } catch (err) {
    console.error('Erro em updateGlobalAlert:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar configuração de alerta.' });
  }
}

module.exports = {
  getEmailConfig,
  upsertEmailConfig,
  testEmailConfig,
  getGlobalAlert,
  updateGlobalAlert,
};
