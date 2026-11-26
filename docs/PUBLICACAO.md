# Publicação do Dataê

Tudo nos planos grátis:

```
Vercel (frontend React)  ──HTTPS──►  Render (API .NET, Docker)  ──rede interna──►  Render (PostgreSQL)
                                              │
                                              └──►  Supabase Storage (fotos e banners, bucket privado)
```

O que já está pronto no repositório:

| Arquivo | Para quê |
|---|---|
| `render.yaml` | Blueprint da Render: cria o banco e a API de uma vez, já ligados |
| `Backend/Dockerfile` | A Render roda .NET por Docker |
| `frontend/vercel.json` | A Vercel devolve o `index.html` em `/e/*`, `/convite/*` e nos outros endereços |
| `Armazenamento:Tipo = S3` | Guarda as imagens no Supabase (em desenvolvimento continua o disco) |
| `/api/saude` | A Render confere se a API subiu |

## Antes de começar: limites dos planos grátis

- **Banco da Render:** o PostgreSQL grátis **expira cerca de 30 dias depois de criado** (confira a regra atual no painel). Crie o banco perto da apresentação. Se ele expirar, crie outro: as tabelas são recriadas sozinhas quando a API sobe, só os dados se perdem.
- **API da Render:** dorme depois de uns 15 minutos sem acesso, e o primeiro acesso demora de 30 a 60 segundos. O resumo automático do pós-evento só roda com a API acordada (o envio pelo botão funciona sempre).
- **Supabase:** o projeto grátis é **pausado depois de cerca de 7 dias sem uso** e precisa ser reativado no painel. Entre no painel alguns dias antes da apresentação.

## 1. Supabase (imagens)

1. Crie uma conta em supabase.com (dá para entrar com o GitHub) e um projeto. Anote a **região** escolhida.
2. **Storage → New bucket:** nome `datae`, deixe **desmarcado** "Public bucket". Se quiser, limite o tamanho dos arquivos a 10 MB (o mesmo limite da API).
3. **Project Settings → Storage → S3 Connection:**
   - anote o **Endpoint** (algo como `https://<projeto>.supabase.co/storage/v1/s3`) e a **Region**;
   - em **S3 Access Keys**, clique em "New access key" e anote o **Access Key ID** e o **Secret Access Key** (o segredo só aparece uma vez).

## 2. Render (banco e API)

1. Crie uma conta em render.com (entre com o GitHub, com acesso ao repositório).
2. **New → Blueprint**, escolha o repositório. A Render lê o `render.yaml` e propõe criar:
   - `datae-banco` (PostgreSQL, Free, Virginia);
   - `datae-api` (Web Service, Docker, Free, Virginia).
3. A Render pede os valores das variáveis marcadas como `sync: false`. Preencha agora as do Supabase (as outras você completa no passo 4):

   | Variável | Valor |
   |---|---|
   | `Armazenamento__S3__Endpoint` | Endpoint do Supabase |
   | `Armazenamento__S3__Regiao` | Region do Supabase |
   | `Armazenamento__S3__Bucket` | `datae` |
   | `Armazenamento__S3__ChaveAcesso` | Access Key ID |
   | `Armazenamento__S3__ChaveSecreta` | Secret Access Key |

   O endereço do banco (`ConnectionStrings__Padrao`) e a chave do JWT (`Jwt__Chave`) a Render preenche sozinha.
4. Publique e abra `https://<sua-api>.onrender.com/api/saude`: deve aparecer `{"status":"ok"}`. Anote o endereço da API.

## 3. Vercel (frontend)

1. Crie uma conta em vercel.com (entre com o GitHub).
2. **Add New → Project**, escolha o repositório:
   - Root Directory: `frontend`
   - Framework Preset: Vite (Build `npm run build`, Output `dist`)
   - Environment Variables:
     - `VITE_API_URL` = endereço da API (ex.: `https://datae-api.onrender.com`)
     - `VITE_GOOGLE_CLIENT_ID` = o Client ID do Google (se usar o login com Google)
3. Publique e anote o endereço do site (ex.: `https://datae.vercel.app`).

## 4. Ligar os dois

Na Render, em `datae-api → Environment`, preencha:

| Variável | Valor |
|---|---|
| `OrigensPermitidas__0` | Endereço da Vercel (libera o CORS) |
| `UrlSite` | Endereço da Vercel (vai nos links do WhatsApp e do e-mail) |

Opcionais (sem elas, a função fica desligada e responde 503; o resto funciona):

| Variável | Para quê |
|---|---|
| `Google__ClientId` | Login com Google. No Google Cloud Console, acrescente o endereço da Vercel em "Origens JavaScript autorizadas" |
| `Ia__ChaveApi` | Assistente de IA (chave da API da Anthropic) |
| `Email__Remetente`, `Email__Servidor`, `Email__Porta`, `Email__Usuario`, `Email__Senha` | Envio de e-mail por SMTP (Brevo, Resend, Gmail com senha de app...) |

Ao salvar, a Render publica a API de novo sozinha.

## 5. Teste final

- [ ] `/api/saude` responde
- [ ] Criar conta e entrar (com senha e, se configurado, com o Google)
- [ ] Criar um evento e enviar um banner: a imagem aparece, e o arquivo está no bucket `datae` (em `banners/{id do evento}/`)
- [ ] Abrir o link público `/e/{slug}` numa aba anônima: a página carrega (sem 404)
- [ ] Confirmar presença, reservar um presente, gerar o Pix e clicar em "Já fiz o Pix"
- [ ] Enviar uma foto pelo mural, aprovar no painel e ver aparecer na página pública
- [ ] Abrir um convite `/convite/{codigo}` numa aba anônima e entrar com outra conta
- [ ] Publicar uma nova versão e conferir que as fotos e os dados continuam lá

## Se algo der errado

- **A API não sobe:** veja os logs em `datae-api → Logs`. Com `Armazenamento__Tipo = S3`, faltar uma variável `Armazenamento__S3__*` impede a API de subir (a mensagem diz qual).
- **O site carrega, mas nada funciona:** confira `VITE_API_URL` na Vercel e `OrigensPermitidas__0` na Render (endereço exato, com `https://` e sem barra no fim). Mudou uma variável na Vercel? Publique de novo, porque elas entram no build.
- **As imagens não aparecem:** confira as chaves do Supabase e se o bucket se chama exatamente `datae`. O projeto pode estar pausado.
- **`/e/{slug}` dá 404 na Vercel:** confira se o Root Directory é `frontend` (é onde fica o `vercel.json`).
