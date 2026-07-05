/**
 * Protege rotas chamadas por serviços externos de cron (ex: cron-job.org),
 * que não têm como fazer login normal. Em vez de JWT, exigimos um cabeçalho
 * com uma chave secreta que só você e o serviço de cron conhecem.
 */
function cronSecretMiddleware(req, res, next) {
  const providedSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return res.status(500).json({ error: 'CRON_SECRET não configurado no servidor.' });
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Chave de cron inválida ou não fornecida.' });
  }

  return next();
}

module.exports = cronSecretMiddleware;
