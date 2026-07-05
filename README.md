# Sistema de Controle de ASO

Sistema web para o RH controlar o vencimento dos ASOs (Atestado de Saúde Ocupacional)
dos funcionários, com alertas automáticos por e-mail antes do vencimento.

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express + Prisma
- **Banco de dados:** PostgreSQL
- **E-mail:** Nodemailer (SMTP) + node-cron (verificação diária agendada)

## Como rodar localmente

### 1. Banco de dados

Se tiver Docker instalado, é o caminho mais simples:

```bash
docker compose up -d
```

Isso sobe um PostgreSQL local na porta 5432 (usuário `aso_user`, senha `aso_password`, banco `aso_control`).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate   # cria as tabelas no banco
npm run seed              # cria o primeiro usuário do RH
npm run dev                # inicia a API em http://localhost:3333
```

O comando `npm run seed` cria um usuário padrão:
- E-mail: `rh@hospital.com`
- Senha: `MudeEstaSenha123`

(Troque a senha depois do primeiro login, ou defina `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env` antes de rodar o seed.)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # inicia em http://localhost:5173
```

Abra `http://localhost:5173` no navegador e faça login.

## Testando o envio de e-mail

1. Acesse **Configurações** no menu lateral.
2. Preencha os dados de SMTP (se usar Gmail, veja a seção abaixo).
3. Clique em "Enviar e-mail de teste".
4. Cadastre um funcionário com data de vencimento próxima (ou já vencida) e rode manualmente a verificação:

```bash
curl -X POST http://localhost:3333/api/settings/run-check \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

(O token é o mesmo salvo no `localStorage` do navegador após o login, chave `aso_token`.)

## Usando Gmail como servidor SMTP

O Gmail não aceita mais a senha normal da conta para SMTP. É preciso:
1. Ativar a verificação em duas etapas na conta Google.
2. Gerar uma "Senha de app" em https://myaccount.google.com/apppasswords
3. Usar `smtp.gmail.com`, porta `587`, "conexão segura" **desmarcada** (usa STARTTLS automaticamente), usuário = seu e-mail, senha = a senha de app gerada.

## Próximos passos

Este README cobre apenas o ambiente local. Quando quiser colocar em produção,
me avise que te explico passo a passo (hospedagem do banco, backend e frontend,
variáveis de ambiente seguras, HTTPS, etc.).
