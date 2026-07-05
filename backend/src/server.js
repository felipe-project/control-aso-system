require('dotenv').config();

const app = require('./app');
const { startCronJobs } = require('./services/cronService');

// Falha rápido (e com mensagem clara) se variáveis críticas não estiverem configuradas.
// Melhor travar aqui na inicialização do que descobrir isso em produção mais tarde.
function validateEnv() {
  const errors = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL não está definida.');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET não está definida.');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET é muito curta (use pelo menos 32 caracteres aleatórios).');
  } else if (process.env.JWT_SECRET.includes('troque_isso')) {
    errors.push('JWT_SECRET ainda está com o valor de exemplo do .env.example. Gere um valor novo e único.');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    errors.push('FRONTEND_URL não está definida (necessária para o CORS em produção).');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
    errors.push('CRON_SECRET não está definida (necessária para o disparo externo do robô de e-mail).');
  }

  if (errors.length > 0) {
    console.error('Não foi possível iniciar o servidor. Corrija o arquivo .env:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}

validateEnv();

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  startCronJobs();
});
