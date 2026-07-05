const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me, listUsers, deleteUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Limita tentativas de login para dificultar ataques de força bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limita criação de usuários para evitar abuso, mesmo estando autenticado
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: { error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rota pública: só o login não exige autenticação prévia
router.post('/login', loginLimiter, login);

// Todas as rotas abaixo exigem estar logado (authMiddleware).
// Isso impede que qualquer pessoa de fora crie uma conta sozinha.
router.post('/register', authMiddleware, registerLimiter, register);
router.get('/me', authMiddleware, me);
router.get('/users', authMiddleware, listUsers);
router.delete('/users/:id', authMiddleware, deleteUser);

module.exports = router;
