const express = require('express');
const rateLimit = require('express-rate-limit');
const cronSecretMiddleware = require('../middleware/cronSecretMiddleware');
const { checkExpiringAsos } = require('../services/cronService');

const router = express.Router();

// Limita chamadas pra evitar abuso caso a chave secreta seja descoberta
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 24, // no máximo 1 por hora, em média, já é generoso pra um cron diário
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Endpoint feito para ser chamado por um serviço externo de cron
 * (ex: cron-job.org), já que hospedagens gratuitas "dormem" o servidor
 * e o robô interno (node-cron) pode não disparar sozinho.
 *
 * Autenticação: cabeçalho "x-cron-secret" com o valor de CRON_SECRET.
 */
router.post('/run-check', limiter, cronSecretMiddleware, async (req, res) => {
  await checkExpiringAsos();
  res.json({ success: true, message: 'Verificação executada via cron externo.' });
});

module.exports = router;
