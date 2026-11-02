# Anjos Bolos

Sistema interno da confeitaria: registro de vendas e encomendas, catálogo de produtos e ingredientes, receitas, histórico, dashboards de vendas, produtos e finanças, e cardápio em PDF.

Esta versão foi refeita para **publicar de graça e sem servidor**:

| Antes | Agora |
|---|---|
| API Java/Spring (EC2) | Banco acessado direto pelo React, com as regras e permissões dentro do próprio banco |
| MySQL (EC2 privada) | Postgres do **Supabase** |
| Login com JWT próprio | **Supabase Auth** (e-mail e senha) |
| Fotos dos produtos no S3 | **Supabase Storage** |
| Redis (cache) | Não é mais necessário |
| E-mail via RabbitMQ | Aviso pelo **WhatsApp** com a mensagem pronta |
| Feriados num JSON do S3 | Calculados no banco (inclui Carnaval, Páscoa e Corpus Christi) |
| Front em EC2 com Nginx | **Vercel** |

As telas são as mesmas. A pasta `src/provider/api.js` responde às mesmas rotas que a API Java (`/pedidos`, `/clientes`, `/dashboards/...`) e no mesmo formato, mas por baixo fala com o Supabase.

---

## Publicar (uns 20 minutos)

### 1. Banco no Supabase

1. Crie uma conta em <https://supabase.com> e um **New project** (região **South America (São Paulo)**).
2. Abra **SQL Editor → New query**, cole todo o [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Numa nova query, cole o [`supabase/seed.sql`](supabase/seed.sql) e clique em **Run**. Ele cria o catálogo: 18 ingredientes, 5 categorias, 24 produtos, 4 tipos de receita, 7 receitas e o "Cliente balcão".
4. Numa nova query, cole o [`supabase/002_edicao_precos.sql`](supabase/002_edicao_precos.sql) e clique em **Run**. Ele permite editar preços e guarda o histórico de mudanças.
5. Em **Project Settings → API**, copie a **Project URL** (só o endereço terminado em `.supabase.co`) e a chave **anon public**.

### 2. Site na Vercel

1. Entre em <https://vercel.com> com o GitHub e clique em **Add New → Project**. Escolha este repositório.
2. A Vercel reconhece o Vite sozinha (build `npm run build`, pasta `dist`).
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`: a Project URL
   - `VITE_SUPABASE_ANON_KEY`: a chave anon public
   - `VITE_WHATSAPP_AVISOS` (opcional): o WhatsApp que recebe os avisos de bolo de festa, com DDD (ex.: `11999999999`)
4. Clique em **Deploy** e anote o endereço (ex.: `https://anjos-bolos.vercel.app`).

> Se mudar uma variável depois, faça **Redeploy**: no Vite as variáveis entram no momento da publicação.

### 3. Endereço do site no Supabase

Em **Authentication → URL Configuration**:
- **Site URL**: o endereço da Vercel
- **Redirect URLs**: `https://SEU-SITE.vercel.app/**`

### 4. Primeiro administrador

1. Em **Authentication → Users → Add user → Create new user**, crie o seu usuário (e-mail e senha) e marque **Auto Confirm User**.
2. No **SQL Editor**, rode (trocando o e-mail):

   ```sql
   update public.perfis set funcao = 'ADMINISTRADOR' where email = 'seu-email@gmail.com';
   ```

3. Entre no site com esse e-mail e senha.

### 5. Cadastrar a equipe

Logado como administrador, use a tela **Cadastro de Funcionário**, como antes: nome, CPF, e-mail, senha, telefone e função. O funcionário recebe um e-mail de confirmação e, depois de confirmar, já entra com a senha cadastrada.

> **Por que é seguro:** a função (Administrador, Gerente, Atendente) vem de um convite que só administradores conseguem criar. Quem criar conta por fora entra sem nenhuma função e não vê nada.
>
> O envio de e-mails que vem com o Supabase é limitado (poucos por hora). Para uma equipe pequena, dá conta. Se precisar de mais, configure um SMTP gratuito (Resend, Brevo) em **Authentication → Emails → SMTP Settings**, ou crie os usuários direto no painel do Supabase com **Auto Confirm**.

---

## Editar preços sem mexer nas vendas antigas

Nos catálogos de **Produtos** e **Ingredientes**, cada linha tem o botão **Editar**:

- **Produto:** nome, categoria, preço de venda, custo de produção e foto. A janela mostra o lucro e a margem enquanto você digita.
- **Ingrediente:** nome e o preço da embalagem que você compra (ex.: 1 kg por R$ 6,49). O sistema calcula o custo por grama, mL ou unidade.

As vendas antigas **não mudam**: cada item vendido guarda o preço e o custo do momento da venda. O valor novo vale a partir da próxima venda. Toda mudança fica registrada, com quem mudou e quando, nas tabelas `produto_historico_preco` e `ingrediente_historico_custo` (Supabase → Table Editor).

## Fotos dos produtos

Os produtos do catálogo inicial vêm **sem foto**, porque as fotos originais estavam num bucket S3 que não faz parte do código. Até ganharem foto, aparece uma imagem padrão de bolo. Para colocar a foto, use **Editar** no catálogo de produtos. Produtos novos cadastrados com foto já aparecem com ela.

## Começar do zero (apagar os dados de exemplo)

Rode o [`supabase/limpar_dados.sql`](supabase/limpar_dados.sql) no SQL Editor. Ele apaga vendas, clientes, produtos, receitas e ingredientes, e **mantém** as contas de login, as 5 categorias, os tipos de receita, o produto "Bolo de Festa" e o "Cliente balcão", que as telas usam por número. Fotos já enviadas ficam no Supabase em **Storage → produtos**; dá para apagar por lá, selecionando todas.

Para o bolo de festa funcionar, cadastre receitas dos tipos **Massa**, **Recheio** e **Cobertura** (na tela de Registro de Produto). São elas que aparecem como opções na montagem do bolo.

## Permissões

São as mesmas da API Java, agora garantidas pelo banco (Row Level Security):

| Função | Pode |
|---|---|
| Atendente | Vendas, encomendas, clientes, produtos; ver o catálogo |
| Gerente | Tudo do atendente + ingredientes, categorias e receitas |
| Administrador | Tudo + cadastro de funcionários e dashboards |

## Avisos de bolo de festa (antes por e-mail)

Ao registrar uma venda com bolo de festa de **2 kg ou mais**, o sistema abre o WhatsApp com massa, recheio, cobertura, peso e data de retirada já escritos, para o número em `VITE_WHATSAPP_AVISOS`. Se a variável estiver vazia, o WhatsApp pede para escolher o contato. O e-mail de "resumo com mais de 5 vendas" foi retirado.

## Limites do plano gratuito

- **Supabase:** 500 MB de banco e 1 GB de imagens, mais que suficiente. O projeto **pausa depois de 1 semana sem nenhum acesso**; para reativar, clique em *Restore* no painel. Nada é perdido.
- **Vercel:** sobra para um sistema deste tamanho.

## Rodar no computador

```bash
cp .env.example .env.local   # preencha com os dados do Supabase
npm install
npm run dev
```

Adicione `http://localhost:5173/**` nas Redirect URLs do Supabase.

## Estrutura

```
src/                 telas React (as mesmas do projeto original)
src/provider/api.js  camada que substitui a API Java
src/provider/supabase.js  conexão com o Supabase
supabase/schema.sql  tabelas, regras de negócio, permissões, dashboards, feriados e imagens
supabase/seed.sql    catálogo inicial
vercel.json          faz as rotas (/menu, /dash-vendas…) funcionarem ao recarregar a página
```

## O que mudou no comportamento

- O pedido registra sempre o funcionário que está logado, sem depender do nome salvo no navegador.
- Mudar o status de uma encomenda não exige mais que todos os campos do pedido estejam preenchidos.
- Ao finalizar um pedido que estava "pendente de pagamento", a data de pagamento é preenchida sozinha.
- Atendentes passam a ver receitas e categorias. Antes a API bloqueava, e a tela de vendas falhava para eles.
- A rota `/dashboards/dia-semana-mais-vendas`, que a tela chamava mas não existia na API, agora funciona.
