-- =====================================================================
--  Anjos Bolos — limpar os dados para começar do zero
--
--  APAGA (sem volta): vendas e encomendas, clientes, produtos, receitas,
--  ingredientes e o histórico de preços.
--
--  MANTÉM, porque as telas dependem deles:
--    * as contas de login (funcionários) e suas funções
--    * as 5 categorias (Bolos Tradicionais, Bebidas, Salgados, Bolos de Pote, Bolos de Festa)
--    * os tipos de receita (Massa de Bolo, Recheio, Cobertura, Salgado)
--    * o produto "Bolo de Festa" (id 1), usado nas encomendas de bolo personalizado
--    * o "Cliente balcão" (id 1), usado nas vendas sem cliente identificado
--
--  Como usar: Supabase → SQL Editor → New query → cole tudo → Run.
-- =====================================================================
begin;

-- vendas
delete from public.detalhamento_pedido;
delete from public.item_pedido;
delete from public.pedido;

-- receitas e ingredientes
delete from public.composicao_produto;
delete from public.receita_ingrediente;
delete from public.receita;
delete from public.ingrediente;

-- históricos (existem só se o 002_edicao_precos.sql já foi rodado)
do $$ begin
  if to_regclass('public.produto_historico_preco') is not null then delete from public.produto_historico_preco; end if;
  if to_regclass('public.ingrediente_historico_custo') is not null then delete from public.ingrediente_historico_custo; end if;
end $$;

-- produtos e clientes, menos os fixos
delete from public.produto where id <> 1;
delete from public.cliente where id <> 1;

-- garante que os registros fixos existam e estejam "limpos"
insert into public.categoria_produto (id, nome, descricao) values
  (1, 'Bolos Tradicionais', 'Bolos simples e caseiros'),
  (2, 'Bebidas', 'Bebidas diversas da casa'),
  (3, 'Salgados', 'Salgados assados e fritos'),
  (4, 'Bolos de Pote', 'Bolos individuais servidos no pote'),
  (5, 'Bolos de Festa', 'Bolos decorados e personalizados')
on conflict (id) do nothing;

insert into public.tipo_receita (id, nome, descricao) values
  (1, 'Massa de Bolo', 'Base de massas para bolos'),
  (2, 'Recheio', 'Recheios de bolos e doces'),
  (3, 'Cobertura', 'Coberturas e glacês'),
  (4, 'Salgado', 'Receitas de salgados')
on conflict (id) do nothing;

insert into public.produto (id, nome, preco_final, custo_producao, categoria_id)
values (1, 'Bolo de Festa', 0, 0, 5)
on conflict (id) do update set nome = 'Bolo de Festa', preco_final = 0, custo_producao = 0, categoria_id = 5, imagem_path = null;

insert into public.cliente (id, nome, cpf, telefone) values (1, 'Cliente balcão', null, null)
on conflict (id) do update set nome = 'Cliente balcão', cpf = null, telefone = null;

-- numeração recomeça (pedido nº 1, ingrediente nº 1…)
select setval(pg_get_serial_sequence('public.pedido', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.item_pedido', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.detalhamento_pedido', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.ingrediente', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.receita', 'id'), 1, false);
select setval(pg_get_serial_sequence('public.produto', 'id'), 1);            -- próximo: 2
select setval(pg_get_serial_sequence('public.cliente', 'id'), 1);            -- próximo: 2
select setval(pg_get_serial_sequence('public.categoria_produto', 'id'), (select max(id) from public.categoria_produto));
select setval(pg_get_serial_sequence('public.tipo_receita', 'id'), (select max(id) from public.tipo_receita));

commit;

-- Conferência: deve mostrar 1 produto, 1 cliente e o resto zerado.
select
  (select count(*) from public.produto)     as produtos,
  (select count(*) from public.cliente)     as clientes,
  (select count(*) from public.ingrediente) as ingredientes,
  (select count(*) from public.receita)     as receitas,
  (select count(*) from public.pedido)      as pedidos;
