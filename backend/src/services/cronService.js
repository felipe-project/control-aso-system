const cron = require('node-cron');
const prisma = require('../config/prisma');
const { sendExpiryAlert } = require('./emailService');
const { alertValueToDays, daysUntil, daysSince } = require('../utils/asoStatus');

// A cada quantos dias o alerta se repete enquanto o ASO estiver dentro da janela
// de aviso (incluindo quando já está vencido).
const REPEAT_INTERVAL_DAYS = 7;

/**
 * Verifica todos os funcionários ativos e envia alerta por e-mail para aqueles
 * cujo ASO está dentro da janela configurada (global ou específica do funcionário).
 * Uma vez dentro da janela, o alerta se repete a cada REPEAT_INTERVAL_DAYS dias
 * (inclusive depois de vencido), até a data de vencimento ser atualizada.
 */
async function checkExpiringAsos() {
  console.log(`[cron] Iniciando verificação de ASOs em ${new Date().toISOString()}`);

  try {
    const globalAlert = await prisma.alertSetting.findFirst({ where: { employeeId: null } })
      || { value: 30, unit: 'DAYS' };

    const employees = await prisma.employee.findMany({
      where: { active: true },
      include: { alertSetting: true },
    });

    let sentCount = 0;

    for (const employee of employees) {
      const alert = employee.alertSetting || globalAlert;
      const alertDays = alertValueToDays(alert.value, alert.unit);
      const remaining = daysUntil(employee.asoExpiryDate);

      // Só notifica quando o ASO entrou na janela de alerta (inclui já vencidos)
      if (remaining > alertDays) continue;

      // Busca o último alerta enviado para essa mesma data de vencimento
      const lastNotification = await prisma.notification.findFirst({
        where: {
          employeeId: employee.id,
          asoExpiryDateSnapshot: employee.asoExpiryDate,
        },
        orderBy: { sentAt: 'desc' },
      });

      // Se já enviou antes, só envia de novo depois de passar o intervalo de repetição
      if (lastNotification && daysSince(lastNotification.sentAt) < REPEAT_INTERVAL_DAYS) {
        continue;
      }

      try {
        await sendExpiryAlert(employee, remaining);
        await prisma.notification.create({
          data: {
            employeeId: employee.id,
            asoExpiryDateSnapshot: employee.asoExpiryDate,
          },
        });
        sentCount += 1;
      } catch (emailErr) {
        console.error(`[cron] Falha ao enviar alerta para ${employee.name}:`, emailErr.message);
      }
    }

    console.log(`[cron] Verificação concluída. ${sentCount} alerta(s) enviado(s).`);
  } catch (err) {
    console.error('[cron] Erro ao verificar ASOs:', err);
  }
}

/**
 * Agenda a verificação diária conforme o CRON_SCHEDULE definido no .env
 * (padrão: todos os dias às 08:00).
 */
function startCronJobs() {
  const schedule = process.env.CRON_SCHEDULE || '0 8 * * *';

  cron.schedule(schedule, checkExpiringAsos, { timezone: 'America/Sao_Paulo' });
  console.log(`[cron] Job de verificação de ASOs agendado (${schedule}, America/Sao_Paulo).`);
}

module.exports = { startCronJobs, checkExpiringAsos };
