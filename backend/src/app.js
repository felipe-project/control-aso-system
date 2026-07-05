const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const cronRoutes = require('./routes/cronRoutes');
const setupRoutes = require('./routes/setupRoutes');

const app = express();

// Segurança: define headers HTTP recomendados (proteção contra alguns ataques comuns).
app.use(helmet());

// Libera CORS apenas para o domínio do frontend configurado no .env
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/setup', setupRoutes);

// Handler central de erros não tratados.
// Sempre loga o erro completo no servidor, mas só devolve detalhes técnicos
// pro cliente quando NÃO estiver em produção (evita vazar informação sensível).
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Erro interno do servidor.',
    ...(!isProd && { detail: err.message }),
  });
});

// Rota inexistente
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

module.exports = app;
