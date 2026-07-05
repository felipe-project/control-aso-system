const nodemailer = require('nodemailer');
const prisma = require('../config/prisma');

/**
 * Monta um transporter do nodemailer a partir da configuração salva no banco.
 * Lança erro se a configuração de e-mail ainda não foi cadastrada.
 */
async function getTransporter() {
  const config = await prisma.emailConfig.findFirst();

  if (!config || !config.smtpHost || !config.smtpPass) {
    throw new Error('Configuração de e-mail não cadastrada. Acesse Configurações > E-mail.');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure, // true para porta 465, false para 587/25 (STARTTLS)
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  return { transporter, config };
}

/**
 * Envia um e-mail avisando o RH que o ASO de um funcionário está próximo do vencimento.
 */
async function sendExpiryAlert(employee, daysRemaining) {
  const { transporter, config } = await getTransporter();

  const toList = config.notifyEmails.split(',').map((e) => e.trim()).filter(Boolean);

  const statusText = daysRemaining < 0
    ? `venceu há ${Math.abs(daysRemaining)} dia(s)`
    : `vence em ${daysRemaining} dia(s)`;

  const formattedDate = new Date(employee.asoExpiryDate).toLocaleDateString('pt-BR');

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: toList,
    subject: `[ASO] Atenção: ASO de ${employee.name} ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #b91c1c;">Alerta de vencimento de ASO</h2>
        <p>O ASO do(a) colaborador(a) abaixo precisa de atenção:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 6px; font-weight: bold;">Nome</td><td style="padding: 6px;">${employee.name}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">CPF</td><td style="padding: 6px;">${employee.cpf}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Cargo</td><td style="padding: 6px;">${employee.role}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Setor</td><td style="padding: 6px;">${employee.department}</td></tr>
          <tr><td style="padding: 6px; font-weight: bold;">Vencimento do ASO</td><td style="padding: 6px;">${formattedDate} (${statusText})</td></tr>
        </table>
        <p style="margin-top: 16px; color: #555;">Este é um e-mail automático do Sistema de Controle de ASO.</p>
      </div>
    `,
  });
}

/**
 * Envia um e-mail de teste para os endereços de notificação cadastrados,
 * usado no botão "Testar" da tela de configurações.
 */
async function sendTestEmail() {
  const { transporter, config } = await getTransporter();
  const toList = config.notifyEmails.split(',').map((e) => e.trim()).filter(Boolean);

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: toList,
    subject: '[ASO] E-mail de teste',
    html: '<p>Se você recebeu este e-mail, a configuração de SMTP do Sistema de Controle de ASO está funcionando corretamente. ✅</p>',
  });
}

module.exports = { sendExpiryAlert, sendTestEmail };
