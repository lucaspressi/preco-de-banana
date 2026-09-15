# Preço de Banana

Portal de promoções e produtos afiliados. Você cadastra ofertas por um painel
privado e elas aparecem no site imediatamente — sem tocar em código.

**As melhores promoções da internet, todos os dias!**

---

## Sumário

- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Rodando localmente](#rodando-localmente)
- [Deploy no Render](#deploy-no-render)
- [Painel administrativo](#painel-administrativo)
- [Importação de produtos por link](#importação-de-produtos-por-link)
- [Segurança](#segurança)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Evoluções futuras](#evoluções-futuras)

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS v4 |
| Banco | PostgreSQL |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Validação | Zod |
| Autenticação | Sessão JWT (`jose`) + bcrypt, cookie HttpOnly |
| Scraping | Cheerio |

---

## Funcionalidades

**Site público**

- Home com hero, faixa de benefícios, ofertas em destaque, relâmpago,
  categorias e lojas
- Listagem de ofertas com busca e filtros (categoria, loja, faixa de preço,
  maior desconto, menor/maior preço, mais recentes)
- Páginas de categoria, loja, produto e cupons
- Ofertas relâmpago com contador regressivo — somem sozinhas ao expirar
- Cupons com cópia do código para a área de transferência
- CTAs de Telegram configuráveis + CTA flutuante no mobile
- SEO: metadata dinâmica, canonical, Open Graph, Twitter Card,
  `sitemap.xml`, `robots.txt` e JSON-LD de produto

**Painel administrativo**

- Login protegido, com limite de tentativas
- Dashboard com contadores e métricas de cliques (7 / 30 dias e total)
- CRUD completo de produtos, categorias, lojas, cupons e depoimentos
- Importação de produto por link, com prévia antes de salvar
- Configurações globais do site (inclusive o link do Telegram)

**Métricas**

- Rota `/go/[productId]` registra o clique e redireciona (307) para o afiliado
- O link de afiliado nunca aparece no HTML público

---

## Rodando localmente

**Pré-requisitos:** Node.js 20+ e PostgreSQL.

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
```

Preencha o `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/precodebanana?schema=public"
AUTH_SECRET="<mínimo 32 caracteres>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ADMIN_EMAIL="voce@exemplo.com"
ADMIN_PASSWORD="<senha forte>"
```

Gere o `AUTH_SECRET` com:

```bash
openssl rand -base64 32
```

```bash
# 3. Banco: cria as tabelas e popula categorias, lojas e o admin
npm run db:migrate
npm run db:seed

# 4. Sobe o servidor
npm run dev
```

- Site: <http://localhost:3000>
- Painel: <http://localhost:3000/admin>

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run check` | TypeScript + ESLint |
| `npm run db:migrate` | Cria/aplica migrations (desenvolvimento) |
| `npm run db:deploy` | Aplica migrations (produção) |
| `npm run db:seed` | Categorias, lojas, configurações e admin |
| `npm run db:studio` | Prisma Studio |
| `npm run admin:check` | Diagnostica problemas de login no painel |
| `npm run admin:reset-password` | Redefine a senha do admin |

---

## Deploy no Render

### Opção A — Blueprint (recomendado)

O repositório já traz um `render.yaml`.

1. No Render: **New +** → **Blueprint**
2. Selecione este repositório
3. O Render cria o PostgreSQL e o Web Service, e conecta o `DATABASE_URL`
   automaticamente
4. Preencha as variáveis marcadas como `sync: false`:
   - `NEXT_PUBLIC_SITE_URL` — a URL pública final
     (ex.: `https://preco-de-banana.onrender.com`)
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
5. Após o primeiro deploy, abra o **Shell** do serviço e rode:

   ```bash
   npm run db:seed
   ```

6. Acesse `/admin/login` e entre
7. **Remova `ADMIN_PASSWORD`** das variáveis do serviço (veja
   [Segurança](#segurança))

### Opção B — Manual, passo a passo

**1. Criar o PostgreSQL**

- **New +** → **PostgreSQL**
- Nome: `pdb-db` · Database: `precodebanana` · Região: a mesma do Web Service
- **Create Database**

**2. Copiar a connection string**

- Abra o banco criado → seção **Connections**
- Copie a **Internal Database URL**
  (a interna é mais rápida e não sai da rede do Render)

**3. Criar o Web Service**

- **New +** → **Web Service** → conecte este repositório
- Runtime: **Node**
- Build Command:

  ```bash
  npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
  ```

  > O `--include=dev` é necessário. Com `NODE_ENV=production`, o `npm ci`
  > ignora as `devDependencies` — e o build precisa delas
  > (`@tailwindcss/postcss`, `tailwindcss`, `typescript`, `prisma`, `tsx`).
  > Sem a flag, o build falha em `globals.css` com
  > *"Cannot find module '@tailwindcss/postcss'"*.

- Start Command:

  ```bash
  npm run start
  ```

**4. Configurar as variáveis de ambiente**

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Internal Database URL do passo 2 |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | URL pública do serviço |
| `ADMIN_EMAIL` | Seu e-mail de acesso |
| `ADMIN_PASSWORD` | Senha forte (temporária — ver passo 7) |
| `NODE_VERSION` | `22` |

**5. Migrations**

Rodam sozinhas no build (`prisma migrate deploy`). O comando aplica apenas
migrations pendentes e **nunca apaga dados**.

**6. Deploy**

**Create Web Service**. O primeiro build leva alguns minutos.

**7. Criar o admin**

No **Shell** do serviço:

```bash
npm run db:seed
```

Saída esperada:

```
✓ Admin criado: voce@exemplo.com
✓ 8 categorias
✓ 6 lojas
✓ Configuracoes do site
```

Entre em `/admin/login` e, em seguida, **remova `ADMIN_PASSWORD`** das
variáveis de ambiente. O login continua funcionando: a aplicação autentica
pelo hash gravado no banco, não pela variável.

**8. Configurar o Telegram**

Em `/admin/settings`, preencha o link do grupo. Enquanto o campo estiver
vazio, os botões de Telegram ficam ocultos no site.

### Observação sobre o plano free

O plano gratuito do Render hiberna o serviço após inatividade — o primeiro
acesso depois disso pode levar ~30 s. O banco free expira em 90 dias. Para uso
real, considere o plano pago.

---

## Painel administrativo

Acesse `/admin` (não há link para ele no site público).

| Rota | Função |
| --- | --- |
| `/admin` | Dashboard e métricas |
| `/admin/products` | Produtos |
| `/admin/products/new` | Novo produto (com importação por link) |
| `/admin/categories` | Categorias |
| `/admin/stores` | Lojas |
| `/admin/coupons` | Cupons |
| `/admin/testimonials` | Depoimentos |
| `/admin/settings` | Configurações globais |

### Ordenação das ofertas

1. `priority` (maior primeiro)
2. `isFeatured`
3. `createdAt` (mais recente primeiro)

### Como o desconto é exibido

| Situação | Percentual mostrado |
| --- | --- |
| Preço antigo **e** atual preenchidos | Calculado pelos preços (campo manual ignorado) |
| Só preço atual + campo manual | O valor do campo manual |
| Preços iguais ou atual maior | Nenhum — nem o valor manual |
| Sem preços | Nenhum |

O cálculo arredonda **para baixo**: R$ 399,90 → R$ 249,90 dá 37,51% e exibe
`37%`. Truncar sempre subestima, nunca exagera o desconto.

---

## Importação de produtos

Em **Produtos → Adicionar produto** há duas formas de preencher o formulário
automaticamente. Em ambas, **nada é salvo** até você revisar e publicar.

### Colar mensagem (recomendado)

Cole a mensagem completa da oferta — a mesma que você publica no Telegram ou
WhatsApp — e clique em **Extrair da mensagem**. São reconhecidos:

| Campo | Como é identificado |
| --- | --- |
| Nome | Primeira linha útil (sem preço, link ou hashtag) |
| Preço antigo | O maior valor `R$` do texto, ou a linha marcada com "De:" |
| Preço atual | O menor valor `R$`, ou a linha marcada com "Por:" |
| Desconto | Padrão `-XX% OFF` |
| Cupom | Após "Cupom:"/"Código:", ou linha isolada em CAIXA ALTA |
| Link | Primeira URL encontrada (já é o seu link de afiliado) |
| Loja | Deduzida do domínio, inclusive encurtadores (`meli.la` → Mercado Livre) |

Linhas de parcelamento (`15x de R$ 173,27`, `sem juros`) são ignoradas — sem
isso, o valor da parcela seria confundido com o preço do produto.

A imagem não costuma estar na mensagem, então ela é buscada a partir do link.
Se o link não permitir, basta colar a URL da imagem manualmente.

> **Por que esta é a via mais confiável:** links encurtados de afiliado
> (`meli.la`, `amzn.to`) frequentemente **não levam à página do produto** —
> redirecionam para perfil, home ou uma página de rastreamento, onde não
> existe preço algum. O texto que você mesmo escreveu é a fonte correta.

**Desconto sempre calculado pelos preços:** se a mensagem anuncia um
percentual que não bate com os valores (ex.: diz `-33%` mas de R$ 2.469,05
por R$ 2.279,00 dá `7%`), o site exibe **7%**. O importador avisa e deixa o
campo vazio.

Isso acontece porque o percentual da mensagem costuma ser calculado sobre um
preço de tabela que não aparece no texto. O visitante vê o valor riscado e o
valor final — anunciar um percentual que não corresponde a essa conta é
propaganda enganosa (CDC, art. 37).

O campo **Desconto (%)** do formulário só é usado quando **não há preço
antigo** para comparar. Havendo os dois preços, ele é ignorado.

### Importar por link

Cole a URL do produto na loja. O backend lê os metadados públicos da página
nesta ordem:

1. JSON-LD / schema.org `Product`
2. Open Graph
3. Metatags
4. HTML estruturado

Os campos encontrados preenchem o formulário. Você revisa, troca o link pelo
seu link de afiliado e publica.

#### O que esperar de cada loja

| Loja | Resultado esperado |
| --- | --- |
| KaBuM, Magalu, Mercado Livre | Boa extração (JSON-LD consistente) |
| Amazon | Costuma **falhar** em produção |
| Shopee, AliExpress | Preço raramente vem (conteúdo via JavaScript) |

Isso é esperado, não um defeito. A Amazon bloqueia requisições vindas de IPs
de datacenter — como os do Render — e o projeto **não implementa** contorno de
CAPTCHA ou proteção anti-bot, conforme especificado. Shopee e AliExpress
renderizam o preço no cliente, então ele não existe no HTML inicial.

Quando a importação por link falha, use a aba **Colar mensagem** — ela não
depende de acessar a loja. O formulário também permanece totalmente editável à
mão. A solução definitiva para dados sempre atualizados são as APIs oficiais de
afiliados; a arquitetura já está preparada (veja
[Evoluções futuras](#evoluções-futuras)).

---

## Segurança

- Senhas com hash **bcrypt** (custo 12); nunca em texto puro
- Sessão em **JWT HS256**, cookie `HttpOnly` + `SameSite=Lax`
  (`Secure` em produção), expiração de 8 h
- `/admin` e `/api/admin` protegidos em duas camadas: proxy no edge
  (`src/proxy.ts`) e verificação no servidor (que confirma que o usuário
  ainda existe no banco)
- Rate limit no login: 5 tentativas / 5 min por IP
- Mensagem de erro genérica e tempo de resposta constante — não permite
  descobrir quais e-mails existem
- Toda entrada validada com **Zod**; URLs restritas a `http`/`https`
  (bloqueia `javascript:` e `data:`)
- Proteção contra open redirect no parâmetro `next` do login
- Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`; `/admin` recebe `noindex` e `no-store`
- Nenhum segredo no bundle do cliente

### Sobre `ADMIN_PASSWORD`

`ADMIN_EMAIL` e `ADMIN_PASSWORD` são lidas **apenas pelo seed**, que grava o
hash no banco. A aplicação em execução nunca as consulta.

Por isso, **remova `ADMIN_PASSWORD` do ambiente após o primeiro deploy**. Uma
senha em texto puro no painel do Render fica visível para qualquer pessoa com
acesso à conta e pode vazar em logs.

Para trocar a senha depois: atualize `ADMIN_PASSWORD`, apague o usuário no
`/admin` (ou via Prisma Studio) e rode `npm run db:seed` de novo. O seed
preserva usuários já existentes.

### Não consigo entrar no painel

A mensagem *"E-mail ou senha inválidos"* é genérica de propósito — ela não
revela se o problema foi o e-mail ou a senha (isso impediria descobrir quais
e-mails existem). Para saber a causa real, rode no **Shell do serviço**:

```bash
npm run admin:check
```

O diagnóstico aponta qual dos casos é:

| Saída | Causa | Solução |
| --- | --- | --- |
| `Usuarios cadastrados: 0` | O seed nunca rodou | `npm run db:seed` |
| `AUTH_SECRET: ausente` | Variável faltando | Defina `AUTH_SECRET` (32+ chars) e refaça o deploy |
| `ADMIN_EMAIL ... NAO confere` | E-mail diferente do cadastrado | Use o e-mail que aparece na lista |
| Usuário existe, senha não confere | Senha divergente | Veja abaixo |

Para testar uma senha específica:

```bash
npm run admin:check -- "a-senha-que-estou-tentando"
```

Para redefinir:

```bash
npm run admin:reset-password -- seu@email.com "nova-senha-forte"
```

> **Por que o seed não resolve sozinho:** se o usuário já existe, o seed
> **preserva a senha atual** e não a sobrescreve. Isso é intencional — evita
> que rodar o seed de novo apague uma senha que você trocou depois. Quando
> você muda `ADMIN_PASSWORD` no painel do Render e roda o seed esperando que
> a senha mude, ela **não muda**. Use `admin:reset-password` nesse caso.

### Privacidade dos cliques

`AffiliateClick` guarda apenas `productId`, data/hora, `referrer` e
`userAgent`. **Endereço IP não é armazenado.**

---

## Estrutura do projeto

```
prisma/
  schema.prisma          Modelos do banco
  seed.ts                Categorias, lojas, configurações e admin
src/
  app/
    (public)/            Site público (header/footer)
    admin/
      login/             Tela de login
      (dashboard)/       Painel autenticado
    api/admin/           Endpoints do painel
    go/[productId]/      Redirect + registro de clique
    sitemap.ts robots.ts
  components/            Componentes compartilhados
  lib/
    auth.ts              Sessão e hash de senha
    admin-guard.ts       Proteção das rotas do painel
    queries.ts           Consultas + cache por tag
    settings.ts          Configurações globais
    validations.ts       Schemas Zod
    import/              Importação de produtos (providers)
  proxy.ts               Proteção de rotas + headers de segurança
render.yaml              Blueprint do Render
```

---

## Evoluções futuras

A importação usa uma interface de providers
(`src/lib/import/types.ts`). Para integrar uma API oficial, implemente
`ProductImportProvider` e registre o provider **antes** do scraper em
`src/lib/import/index.ts`:

```ts
const providers: ProductImportProvider[] = [
  new AmazonPaapiProvider(),      // ← novo
  new MercadoLivreApiProvider(),  // ← novo
  new ScrapeImportProvider(),     // fallback
];
```

Nenhuma outra parte do sistema precisa mudar. O mesmo desenho acomoda:

- Amazon Product Advertising API, Mercado Livre, Shopee e Magalu afiliados
- Bot do Telegram e publicação automática das ofertas
- Cron jobs para monitorar variação de preço
- Upload de imagens (hoje os campos aceitam URL; a troca é localizada)

---

## Imagem do mascote

A hero procura automaticamente por `public/mascote.png` (também aceita `.webp`,
`.jpg` ou `.avif`). Enquanto o arquivo não existir, é exibido um placeholder
neutro — nenhuma alteração de código é necessária, basta adicionar o arquivo.

---

## Licença

Projeto privado.
