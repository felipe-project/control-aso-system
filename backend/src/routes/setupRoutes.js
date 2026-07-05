const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

const router = express.Router();

/**
 * Cria o PRIMEIRO usuário do sistema, sem exigir login.
 *
 * Protegida por duas camadas:
 * 1. Só funciona se ainda não existir NENHUM usuário no banco (se conta > 0, recusa).
 * 2. Exige uma chave secreta (SETUP_SECRET) no cabeçalho "x-setup-secret".
 *
 * Depois que o primeiro usuário é criado, essa rota se torna inofensiva pra sempre
 * (sempre vai recusar, porque a condição "count === 0" nunca mais será verdadeira).
 * Por isso não é necessário remover essa rota depois de usá-la.
 */
router.post('/create-first-admin', async (req, res) => {
  try {
    const providedSecret = req.headers['x-setup-secret'];
    const expectedSecret = process.env.SETUP_SECRET;

    if (!expectedSecret) {
      return res.status(500).json({ error: 'SETUP_SECRET não configurado no servidor.' });
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Chave de configuração inválida ou não fornecida.' });
    }

    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
      return res.status(403).json({
        error: 'Já existe pelo menos um usuário no sistema. Esta rota só funciona na primeira configuração.',
      });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json(user);
  } catch (err) {
    console.error('Erro em create-first-admin:', err);
    return res.status(500).json({ error: 'Erro interno ao criar o primeiro usuário.' });
  }
});

module.exports = router;
