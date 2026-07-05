const express = require('express');
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkExpiringAsos } = require('../services/cronService');

const router = express.Router();

router.use(authMiddleware);

router.get('/email', settingsController.getEmailConfig);
router.put('/email', settingsController.upsertEmailConfig);
router.post('/email/test', settingsController.testEmailConfig);

router.get('/alert', settingsController.getGlobalAlert);
router.put('/alert', settingsController.updateGlobalAlert);

// Permite disparar manualmente a verificação de ASOs vencendo (útil para testes)
router.post('/run-check', async (req, res) => {
  await checkExpiringAsos();
  res.json({ success: true, message: 'Verificação executada.' });
});

module.exports = router;
