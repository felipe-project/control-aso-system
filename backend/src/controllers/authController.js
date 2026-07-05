const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const SALT_ROUNDS = 10;

/**
 * Cria um novo usuário do RH.
 * IMPORTANTE: esta rota exige um usuário já autenticado (ver authRoutes.js).
 * Ou seja, só quem já tem acesso ao sistema consegue cadastrar outra pessoa.
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Já existe um usuário com esse e-mail.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (err) {
    console.error('Erro em register:', err);
    return res.status(500).json({ error: 'Erro interno ao criar usuário.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Mensagem genérica de propósito: não revelar se foi o e-mail ou a senha que errou.
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Erro em login:', err);
    return res.status(500).json({ error: 'Erro interno ao autenticar.' });
  }
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  return res.json(user);
}

/**
 * Lista os usuários do sistema (sem expor a senha).
 */
async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(users);
  } catch (err) {
    console.error('Erro em listUsers:', err);
    return res.status(500).json({ error: 'Erro interno ao listar usuários.' });
  }
}

/**
 * Remove um usuário do sistema.
 * Duas proteções importantes:
 * - Não deixa o usuário se auto-excluir (evita perder acesso sem querer).
 * - Não deixa excluir o último usuário restante (o sistema ficaria sem ninguém pra entrar).
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Você não pode remover seu próprio usuário.' });
    }

    const totalUsers = await prisma.user.count();
    if (totalUsers <= 1) {
      return res.status(400).json({ error: 'Não é possível remover o último usuário do sistema.' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Erro em deleteUser:', err);
    return res.status(500).json({ error: 'Erro interno ao remover usuário.' });
  }
}

module.exports = { register, login, me, listUsers, deleteUser };
