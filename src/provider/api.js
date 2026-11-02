// =====================================================================
//  Camada que substitui a API Java.
//  As telas continuam chamando api.get('/pedidos'), api.post('/clientes')
//  etc. e recebem os dados no MESMO formato que a API Java devolvia;
//  por baixo, tudo vai direto para o Supabase (banco + login + imagens).
//  As permissões ficam no banco (supabase/schema.sql).
// =====================================================================
import { supabase, supabaseCadastro, supabaseConfigurado } from './supabase';

/* ---------------- utilidades ---------------- */

class ApiError extends Error {
  constructor(status, message, config) {
    super(message);
    this.response = { status, data: { message } };
    this.config = config;
  }
}

const statusDoErro = (e) => {
  const c = e?.code || '';
  if (c === '42501' || /row-level security|permission denied|Apenas administradores/i.test(e?.message || '')) return 403;
  if (c === '23505') return 409;
  if (c === 'PGRST116') return 404;
  if (c === '23503' || c === '23514' || c === '22P02') return 400;
  return 500;
};

const traduzir = (e) => {
  const m = String(e?.message || e || '');
  if (/valor_embalagem|quantidade_embalagem|'medida'/i.test(m)) return 'O banco ainda não foi atualizado: rode o arquivo supabase/002_edicao_precos.sql no SQL Editor do Supabase.';
  if (/duplicate key|23505/i.test(m) || e?.code === '23505') return 'Já existe um cadastro com esses dados.';
  if (/row-level security|permission denied/i.test(m)) return 'Seu usuário não tem permissão para isso.';
  if (/violates foreign key/i.test(m)) return 'Este registro está ligado a outros e não pode ser alterado assim.';
  return m || 'Erro inesperado.';
};

function checar({ data, error }, config) {
  if (error) throw new ApiError(statusDoErro(error), traduzir(error), config);
  return data;
}

async function buscarTodos(construir, config) {
  const out = [];
  for (let de = 0; ; de += 1000) {
    const lote = checar(await construir().range(de, de + 999), config);
    out.push(...lote);
    if (lote.length < 1000) break;
  }
  return out;
}

// "2025-06-01T10:00:00" -> "2025-06-01 10:00:00" (formato que a API Java usava)
const dataHora = (v) => (v ? String(v).replace('T', ' ').slice(0, 19) : null);
// aceita "2025-06-01 10:00:00", "2025-06-01T10:00" ou Date
const paraBanco = (v) => {
  if (!v) return null;
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  return String(v).replace('T', ' ');
};
const num = (v) => (v == null ? null : Number(v));
const soDigitos = (s) => String(s ?? '').replace(/\D/g, '');
// aceita 12.5, "12,50" e "1.234,56"
const numero = (v) => {
  if (v == null || v === '') return NaN;
  if (typeof v === 'number') return v;
  const t = String(v).trim().replace(/[R$\s]/g, '');
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
};
const MEDIDAS = { grama: 1, quilograma: 1000, mililitro: 1, litro: 1000, unidade: 1 };

function urlImagem(path) {
  if (!path) return null;
  return supabase.storage.from('produtos').getPublicUrl(path).data.publicUrl;
}

/* ---------------- formatos de resposta (iguais aos DTOs do Java) ---------------- */

const dtoCliente = (c) => ({ id: c.id, nome: c.nome, cpf: c.cpf || '', telefone: c.telefone || '' });
const dtoCategoria = (c) => ({ id: c.id, nome: c.nome, descricao: c.descricao });
const dtoIngrediente = (i) => ({
  id: i.id, nome: i.nome, custoMedida: num(i.custo_medida),
  valorEmbalagem: num(i.valor_embalagem), quantidadeEmbalagem: num(i.quantidade_embalagem), medida: i.medida ?? null
});
// Valor e tamanho da embalagem -> custo por g, mL ou unidade (mesma conta do Java).
// Com "medida" (grama, quilograma, mililitro, litro, unidade) a quantidade vem como a pessoa digitou;
// sem medida, a quantidade já está em g/mL/unidade.
function camposIngrediente(body, cfg) {
  const v = numero(body.valorEmbalagem), q = numero(body.quantidadeEmbalagem);
  const medida = body.medida ? String(body.medida).toLowerCase() : null;
  if (!(v > 0)) throw new ApiError(400, 'O valor da embalagem deve ser maior que zero.', cfg);
  if (!(q > 0)) throw new ApiError(400, 'A quantidade da embalagem deve ser maior que zero.', cfg);
  if (medida && !MEDIDAS[medida]) throw new ApiError(400, 'Medida inválida.', cfg);
  return { valor_embalagem: v, quantidade_embalagem: q, medida, custo_medida: v / (q * (medida ? MEDIDAS[medida] : 1)) };
}
const dtoProduto = (p) => ({
  id: p.id, nome: p.nome, precoFinal: num(p.preco_final), custoProducao: num(p.custo_producao),
  categoriaProduto: p.categoria?.nome ?? null, categoriaProdutoId: p.categoria_id,
  nomeImagem: urlImagem(p.imagem_path)
});
const dtoUsuario = (u) => ({ id: u.id, nome: u.nome, cpf: u.cpf || '', email: u.email, telefone: u.telefone || '', funcao: u.funcao });
const dtoPedido = (p) => ({
  id: p.id,
  dataPedido: dataHora(p.data_pedido),
  dataRetirada: dataHora(p.data_retirada),
  dataPagamento: dataHora(p.data_pagamento),
  formaPagamento: p.forma_pagamento,
  status: p.status,
  observacao: p.observacao,
  usuario: p.usuario?.nome ?? null,
  usuarioId: p.usuario_id,
  Cliente: p.cliente?.nome ?? null,          // a API Java devolvia "Cliente" com C maiúsculo
  cliente: p.cliente?.nome ?? null,
  clienteId: p.cliente_id
});
const dtoItem = (i) => ({
  id: i.id, pedidoId: i.pedido_id, produtoId: i.produto_id, produto: i.produto?.nome ?? null,
  quantidade: num(i.quantidade), precoUnitario: num(i.preco_unitario), custoProducao: num(i.custo_producao), peso: num(i.peso)
});
const dtoReceita = (r) => {
  const itens = (r.itens || []).map((x) => ({
    ingredienteId: x.ingrediente_id, nome: x.ingrediente?.nome ?? null, quantidade: num(x.quantidade), unidadeMedida: x.unidade_medida,
    _custo: num(x.ingrediente?.custo_medida) * num(x.quantidade)
  }));
  const custo = Math.round(itens.reduce((s, x) => s + (x._custo || 0), 0) * 100) / 100;
  return { id: r.id, nome: r.nome, ingredientes: itens.map(({ _custo, ...x }) => x), custoProducao: custo, tipoReceita: r.tipo?.nome ?? null, tipoReceitaId: r.tipo_receita_id };
};

const SEL_PRODUTO = '*, categoria:categoria_produto(nome)';
const SEL_PEDIDO = '*, usuario:perfis(nome), cliente:cliente(nome)';
const SEL_ITEM = '*, produto:produto(nome)';
const SEL_RECEITA = '*, tipo:tipo_receita(nome), itens:receita_ingrediente(ingrediente_id, quantidade, unidade_medida, ingrediente:ingrediente(nome, custo_medida))';

/* ---------------- login e funcionários ---------------- */

async function login({ email, senha }, config) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: String(email || '').trim(), password: senha || '' });
  if (error) throw new ApiError(401, /confirm/i.test(error.message) ? 'Confirme seu e-mail pelo link enviado antes de entrar.' : 'E-mail ou senha incorretos.', config);
  const perfil = checar(await supabase.from('perfis').select('*').eq('id', data.user.id).maybeSingle(), config);
  if (!perfil?.funcao) {
    await supabase.auth.signOut();
    throw new ApiError(403, 'Seu usuário ainda não tem acesso. Peça a um administrador para cadastrar você.', config);
  }
  return { id: perfil.id, nome: perfil.nome, email: perfil.email, funcao: perfil.funcao, token: data.session.access_token };
}

async function cadastrarUsuario(body, config) {
  const email = String(body.email || '').trim().toLowerCase();
  const funcao = String(body.funcao || '').toUpperCase();
  const dados = { nome: String(body.nome || '').trim(), cpf: soDigitos(body.cpf) || null, telefone: soDigitos(body.telefone) || null, funcao };

  // Já tem conta? Só atualiza a função e os dados.
  const existente = checar(await supabase.from('perfis').select('id').ilike('email', email).maybeSingle(), config);
  if (existente) {
    const p = checar(await supabase.from('perfis').update(dados).eq('id', existente.id).select().single(), config);
    return dtoUsuario(p);
  }
  // Convite primeiro (só administradores conseguem), depois a conta.
  checar(await supabase.from('convites').upsert({ email, ...dados }), config);
  const { data, error } = await supabaseCadastro.auth.signUp({
    email, password: body.senha || '',
    options: { data: { nome: dados.nome }, emailRedirectTo: `${window.location.origin}/login` }
  });
  if (error) {
    await supabase.from('convites').delete().eq('email', email);
    throw new ApiError(400, /password/i.test(error.message) ? 'A senha precisa ter pelo menos 6 caracteres.' : traduzir(error), config);
  }
  return { id: data.user?.id ?? null, ...dados, email };
}

/* ---------------- rotas ---------------- */

const rotas = [
  // login
  ['GET', /^\/auth$/, (m, { params }, cfg) => login(params || {}, cfg)],

  // funcionários
  ['POST', /^\/usuarios$/, (m, { body }, cfg) => cadastrarUsuario(body, cfg)],
  ['GET', /^\/usuarios$/, async (m, o, cfg) => checar(await supabase.from('perfis').select('*').not('funcao', 'is', null).order('nome'), cfg).map(dtoUsuario)],
  ['GET', /^\/usuarios\/filtro-nome$/, async (m, { params }, cfg) =>
    checar(await supabase.from('perfis').select('*').ilike('nome', `%${params?.nome || ''}%`).order('nome'), cfg).map(dtoUsuario)],

  // clientes
  ['GET', /^\/clientes$/, async (m, o, cfg) => (await buscarTodos(() => supabase.from('cliente').select('*').order('id'), cfg)).map(dtoCliente)],
  ['GET', /^\/clientes\/filtro-nome$/, async (m, { params }, cfg) =>
    checar(await supabase.from('cliente').select('*').ilike('nome', `%${params?.nome || ''}%`).order('nome'), cfg).map(dtoCliente)],
  ['GET', /^\/clientes\/filtro-cpf$/, async (m, { params }, cfg) =>
    dtoCliente(checar(await supabase.from('cliente').select('*').eq('cpf', soDigitos(params?.cpf)).single(), cfg))],
  ['GET', /^\/clientes\/(\d+)$/, async (m, o, cfg) => dtoCliente(checar(await supabase.from('cliente').select('*').eq('id', m[1]).single(), cfg))],
  ['POST', /^\/clientes$/, async (m, { body }, cfg) =>
    dtoCliente(checar(await supabase.from('cliente').insert({ nome: body.nome, cpf: soDigitos(body.cpf) || null, telefone: soDigitos(body.telefone) || null }).select().single(), cfg))],
  ['PUT', /^\/clientes\/(\d+)$/, async (m, { body }, cfg) =>
    dtoCliente(checar(await supabase.from('cliente').update({ nome: body.nome, cpf: soDigitos(body.cpf) || null, telefone: soDigitos(body.telefone) || null }).eq('id', m[1]).select().single(), cfg))],
  ['DELETE', /^\/clientes\/(\d+)$/, async (m, o, cfg) => { checar(await supabase.from('cliente').delete().eq('id', m[1]), cfg); return null; }],

  // categorias
  ['GET', /^\/categorias-produtos$/, async (m, o, cfg) => checar(await supabase.from('categoria_produto').select('*').order('id'), cfg).map(dtoCategoria)],
  ['POST', /^\/categorias-produtos$/, async (m, { body }, cfg) =>
    dtoCategoria(checar(await supabase.from('categoria_produto').insert({ nome: body.nome, descricao: body.descricao || '' }).select().single(), cfg))],

  // tipos de receita
  ['GET', /^\/tipos-receitas$/, async (m, o, cfg) => checar(await supabase.from('tipo_receita').select('*').order('id'), cfg)],

  // ingredientes
  ['GET', /^\/ingredientes$/, async (m, o, cfg) => checar(await supabase.from('ingrediente').select('*').order('nome'), cfg).map(dtoIngrediente)],
  ['GET', /^\/ingredientes\/filtro-nome$/, async (m, { params }, cfg) =>
    checar(await supabase.from('ingrediente').select('*').ilike('nome', `%${params?.nome || ''}%`).order('nome'), cfg).map(dtoIngrediente)],
  ['POST', /^\/ingredientes$/, async (m, { body }, cfg) => {
    const nome = String(body.nome || '').trim();
    if (!nome) throw new ApiError(400, 'Informe o nome do ingrediente.', cfg);
    return dtoIngrediente(checar(await supabase.from('ingrediente').insert({ nome, ...camposIngrediente(body, cfg) }).select().single(), cfg));
  }],
  ['PUT', /^\/ingredientes\/(\d+)$/, async (m, { body }, cfg) => {
    const campos = {};
    if (body.nome != null) {
      campos.nome = String(body.nome).trim();
      if (!campos.nome) throw new ApiError(400, 'Informe o nome do ingrediente.', cfg);
    }
    if (body.valorEmbalagem != null || body.quantidadeEmbalagem != null) Object.assign(campos, camposIngrediente(body, cfg));
    return dtoIngrediente(checar(await supabase.from('ingrediente').update(campos).eq('id', m[1]).select().single(), cfg));
  }],
  ['DELETE', /^\/ingredientes\/(\d+)$/, async (m, o, cfg) => { checar(await supabase.from('ingrediente').delete().eq('id', m[1]), cfg); return null; }],

  // produtos
  ['GET', /^\/produtos$/, async (m, o, cfg) => checar(await supabase.from('produto').select(SEL_PRODUTO).order('id'), cfg).map(dtoProduto)],
  ['GET', /^\/produtos\/filtro-nome$/, async (m, { params }, cfg) =>
    checar(await supabase.from('produto').select(SEL_PRODUTO).ilike('nome', `%${params?.nome || ''}%`).order('nome'), cfg).map(dtoProduto)],
  ['GET', /^\/produtos\/categoria\/(\d+)$/, async (m, o, cfg) =>
    checar(await supabase.from('produto').select(SEL_PRODUTO).eq('categoria_id', m[1]).order('nome'), cfg).map(dtoProduto)],
  ['GET', /^\/produtos\/(\d+)$/, async (m, o, cfg) => dtoProduto(checar(await supabase.from('produto').select(SEL_PRODUTO).eq('id', m[1]).single(), cfg))],
  ['POST', /^\/produtos$/, async (m, { body }, cfg) =>
    dtoProduto(checar(await supabase.from('produto').insert({
      nome: String(body.nome || '').trim(), preco_final: numero(body.precoFinal) || 0, custo_producao: numero(body.custoProducao) || 0, categoria_id: body.categoriaProdutoId || null
    }).select(SEL_PRODUTO).single(), cfg))],
  // Editar produto: só muda o cadastro. Vendas antigas guardam o preço da época (item_pedido).
  ['PUT', /^\/produtos\/(\d+)$/, async (m, { body }, cfg) => {
    const campos = {};
    if (body.nome != null) {
      campos.nome = String(body.nome).trim();
      if (!campos.nome) throw new ApiError(400, 'Informe o nome do produto.', cfg);
    }
    if (body.precoFinal != null) {
      campos.preco_final = numero(body.precoFinal);
      if (!(campos.preco_final >= 0)) throw new ApiError(400, 'Preço de venda inválido.', cfg);
    }
    if (body.custoProducao != null) {
      campos.custo_producao = numero(body.custoProducao);
      if (!(campos.custo_producao >= 0)) throw new ApiError(400, 'Custo de produção inválido.', cfg);
    }
    if (body.categoriaProdutoId != null) campos.categoria_id = Number(body.categoriaProdutoId) || null;
    return dtoProduto(checar(await supabase.from('produto').update(campos).eq('id', m[1]).select(SEL_PRODUTO).single(), cfg));
  }],
  ['DELETE', /^\/produtos\/(\d+)$/, async (m, o, cfg) => { checar(await supabase.from('produto').delete().eq('id', m[1]), cfg); return null; }],
  ['PATCH', /^\/produtos\/(\d+)\/imagem$/, async (m, { body }, cfg) => {
    const arquivo = body instanceof FormData ? body.get('imagem') : body;
    if (!arquivo) throw new ApiError(400, 'Nenhuma imagem enviada.', cfg);
    const ext = (arquivo.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `produto-${m[1]}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('produtos').upload(path, arquivo, { contentType: arquivo.type || 'image/jpeg', upsert: true });
    if (error) throw new ApiError(400, /mime|type/i.test(error.message) ? 'Use uma imagem JPG, PNG ou WEBP.' : /size/i.test(error.message) ? 'A imagem pode ter no máximo 3 MB.' : error.message, cfg);
    checar(await supabase.from('produto').update({ imagem_path: path }).eq('id', m[1]), cfg);
    return urlImagem(path);
  }, 200],

  // receitas
  ['GET', /^\/receitas$/, async (m, o, cfg) => checar(await supabase.from('receita').select(SEL_RECEITA).order('id'), cfg).map(dtoReceita)],
  ['GET', /^\/receitas\/filtro-nome$/, async (m, { params }, cfg) =>
    checar(await supabase.from('receita').select(SEL_RECEITA).ilike('nome', `%${params?.nome || ''}%`), cfg).map(dtoReceita)],
  ['GET', /^\/receitas\/tipo\/(\d+)$/, async (m, o, cfg) => checar(await supabase.from('receita').select(SEL_RECEITA).eq('tipo_receita_id', m[1]), cfg).map(dtoReceita)],
  ['GET', /^\/receitas\/(\d+)$/, async (m, o, cfg) => dtoReceita(checar(await supabase.from('receita').select(SEL_RECEITA).eq('id', m[1]).single(), cfg))],
  ['POST', /^\/receitas$/, async (m, { body }, cfg) => {
    let tipoId = body.tipoReceitaId || null;
    const tipoNome = body.tipo || body.tipoReceita;
    if (!tipoId && tipoNome) {
      const t = checar(await supabase.from('tipo_receita').select('id').ilike('nome', `${tipoNome}%`).limit(1), cfg);
      tipoId = t[0]?.id || null;
    }
    const itens = (body.ingredientes || []).filter((x) => x.ingredienteId && Number(x.quantidade) > 0);
    if (!itens.length) throw new ApiError(400, 'Adicione pelo menos um ingrediente.', cfg);
    const r = checar(await supabase.from('receita').insert({ nome: String(body.nome || '').trim(), tipo_receita_id: tipoId }).select('id').single(), cfg);
    const { error } = await supabase.from('receita_ingrediente').insert(itens.map((x) => ({
      receita_id: r.id, ingrediente_id: Number(x.ingredienteId), quantidade: Number(x.quantidade), unidade_medida: String(x.unidadeMedida || 'GRAMA').toUpperCase()
    })));
    if (error) { await supabase.from('receita').delete().eq('id', r.id); checar({ error }, cfg); }
    return dtoReceita(checar(await supabase.from('receita').select(SEL_RECEITA).eq('id', r.id).single(), cfg));
  }, 201],
  ['DELETE', /^\/receitas\/(\d+)$/, async (m, o, cfg) => { checar(await supabase.from('receita').delete().eq('id', m[1]), cfg); return null; }],

  // pedidos
  ['GET', /^\/pedidos$/, async (m, o, cfg) => (await buscarTodos(() => supabase.from('pedido').select(SEL_PEDIDO).order('id'), cfg)).map(dtoPedido)],
  ['GET', /^\/pedidos\/filtro-status$/, async (m, { params }, cfg) =>
    (await buscarTodos(() => supabase.from('pedido').select(SEL_PEDIDO).eq('status', params?.status).order('id'), cfg)).map(dtoPedido)],
  ['GET', /^\/pedidos\/filtro-cliente\/(\d+)$/, async (m, o, cfg) =>
    (await buscarTodos(() => supabase.from('pedido').select(SEL_PEDIDO).eq('cliente_id', m[1]).order('id'), cfg)).map(dtoPedido)],
  ['GET', /^\/pedidos\/(\d+)$/, async (m, o, cfg) => dtoPedido(checar(await supabase.from('pedido').select(SEL_PEDIDO).eq('id', m[1]).single(), cfg))],
  ['POST', /^\/pedidos$/, async (m, { body }, cfg) => {
    const { data: { user } } = await supabase.auth.getUser();
    return dtoPedido(checar(await supabase.from('pedido').insert({
      data_pedido: paraBanco(body.dataPedido) || paraBanco(new Date()),
      data_retirada: paraBanco(body.dataRetirada),
      data_pagamento: paraBanco(body.dataPagamento),
      forma_pagamento: body.formaPagamento || 'NAO_REALIZADO',
      status: body.status || 'CONFIRMADO',
      observacao: body.observacao || null,
      usuario_id: user?.id ?? null,            // sempre quem está logado
      cliente_id: body.clienteId || 1          // 1 = "Cliente balcão"
    }).select(SEL_PEDIDO).single(), cfg));
  }, 201],
  ['PUT', /^\/pedidos\/(\d+)$/, async (m, { body }, cfg) => {
    const campos = {};
    if (body.status) campos.status = body.status;
    if (body.formaPagamento) campos.forma_pagamento = body.formaPagamento;
    if ('dataRetirada' in body && body.dataRetirada) campos.data_retirada = paraBanco(body.dataRetirada);
    if ('dataPagamento' in body && body.dataPagamento) campos.data_pagamento = paraBanco(body.dataPagamento);
    if ('observacao' in body) campos.observacao = body.observacao || null;
    if (body.clienteId) campos.cliente_id = body.clienteId;
    return dtoPedido(checar(await supabase.from('pedido').update(campos).eq('id', m[1]).select(SEL_PEDIDO).single(), cfg));
  }],
  ['PATCH', /^\/pedidos\/(\d+)$/, async (m, { body }, cfg) => {
    const campos = { status: body.status };
    if (body.formaPagamento) campos.forma_pagamento = body.formaPagamento;
    if (body.dataRetirada) campos.data_retirada = paraBanco(body.dataRetirada);
    if ('observacao' in body) campos.observacao = body.observacao || null;
    return dtoPedido(checar(await supabase.from('pedido').update(campos).eq('id', m[1]).select(SEL_PEDIDO).single(), cfg));
  }],
  ['DELETE', /^\/pedidos\/(\d+)$/, async (m, o, cfg) => { checar(await supabase.from('pedido').delete().eq('id', m[1]), cfg); return null; }],

  // itens do pedido
  ['GET', /^\/itens-pedido$/, async (m, o, cfg) => (await buscarTodos(() => supabase.from('item_pedido').select(SEL_ITEM).order('id'), cfg)).map(dtoItem)],
  ['GET', /^\/itens-pedido\/filtro-pedido\/(\d+)$/, async (m, o, cfg) =>
    checar(await supabase.from('item_pedido').select(SEL_ITEM).eq('pedido_id', m[1]).order('id'), cfg).map(dtoItem)],
  ['POST', /^\/itens-pedido$/, async (m, { body }, cfg) => {
    if (!body.produtoId) throw new ApiError(400, 'Produto do item não informado.', cfg);
    return dtoItem(checar(await supabase.from('item_pedido').insert({
      pedido_id: body.pedidoId, produto_id: body.produtoId, quantidade: Number(body.quantidade) || 1,
      preco_unitario: Number(body.precoUnitario) || 0, peso: body.peso == null ? null : Number(body.peso)
    }).select(SEL_ITEM).single(), cfg));
  }, 201],

  // detalhamento (massa, recheio, cobertura do bolo de festa)
  ['POST', /^\/detalhamentos-pedidos$/, async (m, { body }, cfg) => {
    const d = checar(await supabase.from('detalhamento_pedido').insert({
      item_pedido_id: body.fkItemPedido, receita_id: body.fkReceita, observacao: body.observacao || null
    }).select('*, receita:receita(nome, tipo:tipo_receita(nome))').single(), cfg);
    return { itemPedidoId: d.item_pedido_id, receitaId: d.receita_id, receitaNome: d.receita?.nome, tipoReceita: d.receita?.tipo?.nome, observacao: d.observacao };
  }, 201],
  ['GET', /^\/detalhamentos-pedidos\/filtro-item-pedido\/(\d+)$/, async (m, o, cfg) => {
    const ds = checar(await supabase.from('detalhamento_pedido').select('*, receita:receita(nome, tipo:tipo_receita(nome))').eq('item_pedido_id', m[1]), cfg);
    return { itemPedidoId: Number(m[1]), receitas: ds.map((d) => ({ nomeReceita: d.receita?.nome, tipoReceita: d.receita?.tipo?.nome, observacao: d.observacao })) };
  }],

  // dashboards (só administradores)
  ['GET', /^\/dashboards\/menor-margem-lucro$/, async (m, o, cfg) => {
    const r = checar(await supabase.rpc('dash_margem_lucro', { p_maior: false }), cfg)[0];
    if (!r) throw new ApiError(404, 'Nenhum produto com preço.', cfg);
    return { nomeProduto: r.nome_produto, margemLucro: num(r.margem_lucro) };
  }],
  ['GET', /^\/dashboards\/maior-margem-lucro$/, async (m, o, cfg) => {
    const r = checar(await supabase.rpc('dash_margem_lucro', { p_maior: true }), cfg)[0];
    if (!r) throw new ApiError(404, 'Nenhum produto com preço.', cfg);
    return { nomeProduto: r.nome_produto, margemLucro: num(r.margem_lucro) };
  }],
  ['GET', /^\/dashboards\/produtos-mais-vendidos$/, async (m, { params }, cfg) =>
    checar(await supabase.rpc('dash_produtos_mais_vendidos', { p_inicio: params.inicio, p_fim: params.fim, p_limite: 5 }), cfg)
      .map((r) => ({ nomeProduto: r.nome_produto, quantidadeVendida: num(r.quantidade_vendida), categoriaProduto: r.categoria_produto }))],
  ['GET', /^\/dashboards\/produto-mais-vendido$/, async (m, { params }, cfg) => {
    const r = checar(await supabase.rpc('dash_produtos_mais_vendidos', { p_inicio: params.inicio, p_fim: params.fim, p_limite: 1 }), cfg)[0];
    if (!r) throw new ApiError(404, 'Nenhuma venda no período.', cfg);
    return r.nome_produto;
  }],
  ['GET', /^\/dashboards\/pedidos-faturamento$/, async (m, { params }, cfg) =>
    checar(await supabase.rpc('dash_pedidos_faturamento', { p_inicio: params.inicio, p_fim: params.fim }), cfg)
      .map((r) => ({ quantidadePedidos: num(r.quantidade_pedidos), quantidadeProdutosVendidos: num(r.quantidade_produtos_vendidos), faturamento: num(r.faturamento), custos: num(r.custos), dataPedido: String(r.data_pedido).slice(0, 10) }))],
  ['GET', /^\/dashboards\/vendas-dia-semana$/, async (m, { params }, cfg) =>
    checar(await supabase.rpc('dash_vendas_dia_semana', { p_inicio: params.inicio, p_fim: params.fim }), cfg)
      .map((r) => ({ diaSemana: r.dia_semana, totalVendas: num(r.total_vendas) }))],
  ['GET', /^\/dashboards\/dia-semana-mais-vendas$/, async (m, { params }, cfg) => {
    const rs = checar(await supabase.rpc('dash_vendas_dia_semana', { p_inicio: params.inicio, p_fim: params.fim }), cfg);
    if (!rs.length) return '';
    return rs.reduce((a, b) => (num(b.total_vendas) > num(a.total_vendas) ? b : a)).dia_semana;
  }],
  ['GET', /^\/dashboards\/produtos-recomendados-feriados$/, async (m, o, cfg) =>
    checar(await supabase.rpc('dash_produtos_recomendados_feriados'), cfg)
      .map((r) => ({ dataFeriado: String(r.data_feriado).slice(0, 10), feriado: r.feriado, produto: r.produto, categoria: r.categoria }))],
];

/* ---------------- interface parecida com o axios ---------------- */

async function requisitar(method, url, body, config = {}) {
  const cfg = { ...config, url, method: method.toLowerCase() };
  if (!supabaseConfigurado) throw new ApiError(503, 'O site ainda não está ligado ao Supabase (variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).', cfg);
  const [caminho, qs] = String(url).split('?');
  const params = { ...Object.fromEntries(new URLSearchParams(qs || '')), ...(config.params || {}) };
  for (const [m, re, fn, statusOk] of rotas) {
    if (m !== method) continue;
    const match = caminho.match(re);
    if (!match) continue;
    const data = await fn(match, { body: body ?? {}, params }, cfg);
    return { data, status: statusOk || (method === 'POST' ? 201 : 200), config: cfg };
  }
  throw new ApiError(404, `Rota não encontrada: ${method} ${caminho}`, cfg);
}

const api = {
  get: (url, config) => requisitar('GET', url, null, config),
  delete: (url, config) => requisitar('DELETE', url, null, config),
  post: (url, body, config) => requisitar('POST', url, body, config),
  put: (url, body, config) => requisitar('PUT', url, body, config),
  patch: (url, body, config) => requisitar('PATCH', url, body, config),
};

// O antigo serviço de e-mail foi trocado por avisos no WhatsApp (veja ResumoVenda.jsx).
const email = { post: async () => ({ data: null, status: 204 }) };

export { email };
export default api;
