const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calcula a data de vencimento padrão (emissão + 1 ano).
 */
function calculateDefaultExpiry(issueDate) {
  const date = new Date(issueDate);
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

/**
 * Retorna quantos dias faltam até o vencimento (negativo se já venceu).
 */
function daysUntil(expiryDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - now) / MS_PER_DAY);
}

/**
 * Converte um valor + unidade (ex: 1 mês, 2 semanas, 10 dias) para dias corridos.
 */
function alertValueToDays(value, unit) {
  switch (unit) {
    case 'DAYS':
      return value;
    case 'WEEKS':
      return value * 7;
    case 'MONTHS':
      return value * 30; // aproximação; suficiente para alertas de RH
    default:
      throw new Error(`Unidade de alerta desconhecida: ${unit}`);
  }
}

/**
 * Classifica o status do ASO em: "expired", "warning" ou "ok".
 * "warning" leva em conta a configuração de alerta (global ou do funcionário).
 */
function getAsoStatus(expiryDate, alertDaysThreshold) {
  const remaining = daysUntil(expiryDate);

  if (remaining < 0) return 'expired';
  if (remaining <= alertDaysThreshold) return 'warning';
  return 'ok';
}

/**
 * Retorna quantos dias já passaram desde uma data até agora.
 */
function daysSince(pastDate) {
  const now = new Date();
  const past = new Date(pastDate);
  return Math.floor((now - past) / MS_PER_DAY);
}

module.exports = {
  calculateDefaultExpiry,
  daysUntil,
  daysSince,
  alertValueToDays,
  getAsoStatus,
};
