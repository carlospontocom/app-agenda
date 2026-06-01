# Agendamento Bancário — API

API REST do sistema de agendamento de serviços bancários.

**Stack:** Node.js + Express + TypeScript + TiDB Cloud (MySQL-compatível)

## Pré-requisitos

- Node.js 18+
- Conta no [TiDB Cloud](https://tidbcloud.com) (gratuita) ou qualquer banco MySQL

## Configuração

```bash
npm install
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=agenda_bancaria
JWT_SECRET=seu_segredo_jwt
JWT_EXPIRES_IN=7d
PORT=3000
```

## Executar

```bash
npm run migrate      # criar tabelas + admin padrão
npm run dev          # desenvolvimento (hot-reload)
npm run build        # build produção
npm start            # iniciar produção
```

## Documentação da API (Swagger)

Servidor rodando:

```
http://localhost:3000/api/docs
```

Produção:

```
https://agenda-api.onrender.com/api/docs
```

## Endpoints

### Autenticação

| Método | Rota                    | Descrição                   | Autenticação |
|--------|-------------------------|-----------------------------|--------------|
| POST   | `/api/auth/register`    | Registrar novo usuário      | ❌           |
| POST   | `/api/auth/login`       | Login do usuário            | ❌           |
| POST   | `/api/auth/recover`     | Recuperar senha             | ❌           |
| POST   | `/api/auth/update-password` | Atualizar senha          | ✅ Bearer    |

### Perfil

| Método | Rota              | Descrição                       | Autenticação |
|--------|-------------------|---------------------------------|--------------|
| GET    | `/api/profile`    | Obter dados do perfil próprio   | ✅ Bearer    |
| PATCH  | `/api/profile`    | Atualizar telefone/email/endereço/senha | ✅ Bearer |

### Agendamentos

| Método | Rota                           | Descrição                    | Autenticação |
|--------|--------------------------------|------------------------------|--------------|
| GET    | `/api/appointments`            | Listar agendamentos          | ✅ Bearer    |
| GET    | `/api/appointments/user/:id`   | Agendamentos de um usuário   | ✅ Bearer    |
| POST   | `/api/appointments`            | Criar agendamento            | ✅ Bearer    |
| PATCH  | `/api/appointments/:id`        | Atualizar agendamento        | ✅ Bearer    |
| DELETE | `/api/appointments/:id`        | Excluir agendamento          | ✅ Bearer    |
| PATCH  | `/api/appointments/:id/status` | Alterar status               | ✅ Bearer    |

### Administrador

| Método | Rota                                | Descrição                   | Autenticação     |
|--------|-------------------------------------|-----------------------------|------------------|
| POST   | `/api/admin/login`                  | Login do admin              | ❌               |
| GET    | `/api/admin/users`                  | Listar todos os usuários    | ✅ Bearer + Admin |
| PATCH  | `/api/admin/users/:id`              | Editar dados do usuário     | ✅ Bearer + Admin |
| PATCH  | `/api/admin/users/:id/toggle-status`| Ativar/desativar conta      | ✅ Bearer + Admin |
| GET    | `/api/admin/report`                 | Dados do relatório          | ✅ Bearer + Admin |

### Utilitários

| Método | Rota              | Descrição          |
|--------|-------------------|--------------------|
| GET    | `/api/health`     | Health check       |

## Admin padrão

- **Email:** `admin@gmail.com`
- **Senha:** `@123123`

## Serviços disponíveis

- Abrir nova conta
- Renegociar Dívidas
- Saque Volumoso
- Configurar app
- Cartão de Crédito
- Transferência / Pix

## Regras de Negócio

- Cliente pode ter no máximo **1 agendamento ativo** (pending ou confirmed)
- Cada agendamento pode conter até **2 serviços**
- Agendamentos devem ter no mínimo **2 horas de antecedência**
- Apenas dias úteis (segunda a sexta) nos **próximos 7 dias**
- Usuário edita apenas: telefone, email, endereço completo e senha
- Usuário **não** altera: nome, gênero, data de nascimento, documento
- Administrador pode editar dados e ativar/desativar contas
- Contas inativas não conseguem login nem recuperação de senha
- Novos cadastros são criados com status **ativo**

## Deploy (Render)

1. Conecte o repositório no Render
2. Escolha "Web Service", aponte para `backend/`
3. Configure as env vars no painel do Render
4. O `render.yaml` na raiz do projeto também pode ser usado

```bash
git push          # auto-deploy no Render
```
