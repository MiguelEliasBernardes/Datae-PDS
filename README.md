# Dataê

Plataforma web para organizar eventos sociais (chá de panela, casamento, aniversário e formatura) em um só lugar: convidados, lista de presentes com Pix, mural de fotos e uma página pública para cada evento.

**Sistema publicado:** https://datae-pds.vercel.app

Projeto da disciplina de Projeto de Desenvolvimento de Software (PDS), do curso de Análise e Desenvolvimento de Sistemas da Universidade Luterana do Brasil (ULBRA), campus Torres.

## O que o sistema faz

O Dataê atende quatro públicos:

- **Organizador** (com login): cria o evento e gerencia convidados, presentes, mural, checklist e a página pública.
- **Co-organizador** (com login): entra por um código de convite e ajuda a administrar o evento.
- **Formando** (com login, só em formaturas): entra na comissão por convite, com um papel (Administrador, Financeiro, Fotos ou Membro).
- **Convidado** (sem login): abre a página pública do evento, confirma presença, reserva presentes, paga pelo Pix e envia fotos.

Principais funcionalidades:

- **Página pública** do evento em `/e/{slug}`, com capa, cor do evento e contagem regressiva.
- **Confirmação de presença** sem login, com acompanhantes e observações.
- **Lista de presentes** com foto e reserva sem duplicidade: se duas pessoas reservarem ao mesmo tempo, só uma consegue.
- **Cotas de presente:** um item caro é dividido entre vários convidados.
- **Pix estático:** QR Code e "copia e cola" com o valor já preenchido. Depois de pagar, o convidado avisa com "Já fiz o Pix", e o organizador confere esses avisos num relatório.
- **Mural de fotos:** os convidados enviam fotos, e elas só aparecem na página depois que o organizador aprova.
- **Formatura:**
  - comissão com papéis e permissões;
  - lançamento de despesas e cálculo do rateio entre os formandos;
  - controle dos pagamentos de cada um;
  - uma sub-página com lista de presentes para cada formando.
- **Checklist** com prazos contados a partir da data do evento e dicas automáticas.
- **Assistente de IA:** sugere presentes e monta o roteiro do dia. Ele não recebe dados pessoais dos participantes.
- **Pós-evento:**
  - resumo da arrecadação;
  - agradecimentos por e-mail ou WhatsApp;
  - página de recapitulação com as fotos.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | ASP.NET Core (.NET 10, Minimal APIs), Entity Framework Core, autenticação JWT |
| Banco de dados | PostgreSQL |
| Integrações | Google Identity (login), API da Anthropic (assistente de IA), SMTP (e-mails) |

## Estrutura do repositório

```
Backend/     API em ASP.NET Core
  Rotas/       endpoints HTTP
  Servicos/    regras de negócio e controle de acesso
  Dados/       contexto do EF Core e migrations
  Modelos/     entidades do banco
  Dtos/        formatos de entrada e saída da API
frontend/    aplicação React
  src/api/     comunicação com a API
  src/paginas/ telas
  src/componentes/
```

## Como rodar localmente

### Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org) 22 ou mais recente
- [PostgreSQL](https://www.postgresql.org/download/) 16 ou outra versão recente, rodando na máquina
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/MiguelEliasBernardes/Datae-PDS.git
cd Datae-PDS
```

### 2. Configurar o backend

O backend lê a conexão com o banco do `Backend/appsettings.Development.json`. O padrão é `localhost:5432`, usuário `postgres` e banco `datae`.

Para usar a sua senha do PostgreSQL sem alterar arquivos versionados, crie o arquivo `Backend/appsettings.Local.json`. Ele é ignorado pelo git e tem prioridade sobre os outros:

```json
{
  "ConnectionStrings": {
    "Padrao": "Host=localhost;Port=5432;Database=datae;Username=postgres;Password=SUA_SENHA"
  }
}
```

Você não precisa criar o banco `datae` nem as tabelas: a API cria tudo ao iniciar, aplicando as migrations.

### 3. Rodar o backend

```bash
cd Backend
dotnet run --launch-profile http
```

A API sobe em http://localhost:5009. Para conferir, abra http://localhost:5009/api/saude: a resposta deve ser `{"status":"ok"}`.

### 4. Rodar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173, crie uma conta e um evento. Em desenvolvimento, o Vite repassa as chamadas de `/api` para o backend, então nenhuma variável de ambiente é necessária.

Em desenvolvimento:
- **Imagens:** banners, fotos do mural e fotos dos presentes ficam na pasta `Backend/Uploads/`.
- **E-mails:** não são enviados de verdade; cada um vira um arquivo `.eml` em `Backend/EmailsEnviados/`.

### Funções opcionais

O sistema funciona sem as configurações abaixo. Sem elas, a função correspondente fica desligada.

| Função | Onde configurar |
|---|---|
| Login com Google | `Google:ClientId` no `appsettings.Local.json` e `VITE_GOOGLE_CLIENT_ID` no `frontend/.env.local` (copie o `frontend/.env.example`). Os dois precisam ter o mesmo Client ID, criado no Google Cloud Console com `http://localhost:5173` nas origens autorizadas. |
| Assistente de IA | `Ia:ChaveApi` no `appsettings.Local.json`, com uma chave da API da Anthropic. Cada geração consome créditos da conta. |
| Envio real de e-mails | Seção `Email` no `appsettings.Local.json` (`Remetente`, `Servidor`, `Porta`, `Usuario`, `Senha`) e `PastaSaida` vazia. Funciona com qualquer provedor SMTP. |

Exemplo de `appsettings.Local.json` completo:

```json
{
  "ConnectionStrings": {
    "Padrao": "Host=localhost;Port=5432;Database=datae;Username=postgres;Password=SUA_SENHA"
  },
  "Google": { "ClientId": "SEU_CLIENT_ID.apps.googleusercontent.com" },
  "Ia": { "ChaveApi": "SUA_CHAVE_DA_ANTHROPIC" }
}
```

Nunca coloque chaves e senhas no `appsettings.json` nem no `appsettings.Development.json`, porque esses arquivos vão para o GitHub.

## Autor

Miguel Elias Bernardes. Orientador: Daniel Ricardo de Souza.
