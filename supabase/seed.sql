-- Catálogo inicial da Anjos Bolos (convertido do inserts.sql original, sem pedidos e clientes de teste).
-- Rode depois do schema.sql.

insert into public.ingrediente (id, nome, custo_medida) values
(1, 'Farinha de Trigo', 0.0050),
(2, 'Açúcar Refinado', 0.0040),
(3, 'Ovos', 0.2500),
(4, 'Leite', 0.0100),
(5, 'Manteiga', 0.0800),
(6, 'Chocolate em Pó', 0.0500),
(7, 'Fermento', 0.0300),
(8, 'Coco Ralado', 0.0450),
(9, 'Suco de Laranja', 0.0200),
(10, 'Fubá', 0.0060),
(11, 'Nozes', 0.1500),
(12, 'Morango', 0.0700),
(13, 'Refrigerante', 0.0150),
(14, 'Café', 0.0250),
(15, 'Presunto', 0.0500),
(16, 'Queijo', 0.0550),
(17, 'Frango Desfiado', 0.0600),
(18, 'Molho de Tomate', 0.0300);

insert into public.categoria_produto (id, nome, descricao) values
(1, 'Bolos Tradicionais', 'Bolos simples e caseiros'),
(2, 'Bebidas', 'Bebidas diversas da casa'),
(3, 'Salgados', 'Salgados assados e fritos'),
(4, 'Bolos de Pote', 'Bolos individuais servidos no pote'),
(5, 'Bolos de Festa', 'Bolos decorados e personalizados');

insert into public.produto (id, nome, preco_final, custo_producao, categoria_id) values
(1, 'Bolo de Festa', 0.00, 0.00, 5),
(2, 'Bolo de Chocolate', 30.00, 22.00, 1),
(3, 'Bolo de Cenoura', 40.00, 25.00, 1),
(4, 'Bolo de Fubá', 35.00, 20.00, 1),
(5, 'Bolo de Laranja', 38.00, 22.00, 1),
(6, 'Bolo de Coco', 45.00, 27.00, 1),
(7, 'Bolo de Limão', 42.00, 25.00, 1),
(8, 'Bolo de Pote de Chocolate', 10.00, 5.50, 4),
(9, 'Bolo de Pote de Morango', 11.00, 6.00, 4),
(10, 'Bolo de Pote de Coco', 10.50, 5.80, 4),
(11, 'Bolo de Pote Ninho', 13.50, 7.80, 4),
(12, 'Bolo de Pote Prestígio', 12.00, 6.50, 4),
(13, 'Coxinha de Frango', 6.00, 3.00, 3),
(14, 'Empada de Palmito', 7.00, 3.50, 3),
(15, 'Esfiha de Carne', 6.50, 3.20, 3),
(16, 'Coxinha Catupiry', 7.00, 3.50, 3),
(17, 'Quiche Lorraine', 9.50, 5.00, 3),
(18, 'Pão de Queijo', 4.50, 1.80, 3),
(19, 'Café Expresso', 5.00, 1.50, 2),
(20, 'Cappuccino', 8.00, 3.50, 2),
(21, 'Refrigerante Lata', 6.00, 2.00, 2),
(22, 'Suco Natural Laranja', 8.00, 2.50, 2),
(23, 'Suco Natural Maracujá', 8.00, 2.80, 2),
(24, 'Chocolate Quente', 10.00, 4.00, 2);

insert into public.tipo_receita (id, nome, descricao) values
(1, 'Massa de Bolo', 'Base de massas para bolos'),
(2, 'Recheio', 'Recheios de bolos e doces'),
(3, 'Cobertura', 'Coberturas e glacês'),
(4, 'Salgado', 'Receitas de salgados');

insert into public.receita (id, nome, tipo_receita_id) values
(1, 'Massa Chocolate', 1),
(2, 'Massa Cenoura', 1),
(3, 'Recheio Chocolate', 2),
(4, 'Massa Red Velvet', 1),
(5, 'Recheio Ninho', 2),
(6, 'Massa Prestígio', 1),
(7, 'Cobertura Chocolate', 3);

insert into public.receita_ingrediente (receita_id, ingrediente_id, quantidade, unidade_medida) values
(1, 1, 500, 'GRAMA'),
(1, 2, 300, 'GRAMA'),
(1, 3, 4, 'UNIDADE'),
(1, 4, 200, 'MILILITRO'),
(1, 7, 10, 'GRAMA'),
(2, 1, 400, 'GRAMA'),
(2, 2, 200, 'GRAMA'),
(2, 3, 3, 'UNIDADE'),
(2, 4, 150, 'MILILITRO'),
(2, 7, 10, 'GRAMA'),
(3, 6, 100, 'GRAMA'),
(3, 5, 50, 'GRAMA'),
(4, 1, 450, 'GRAMA'),
(4, 2, 300, 'GRAMA'),
(4, 3, 3, 'UNIDADE'),
(4, 4, 200, 'MILILITRO'),
(4, 7, 12, 'GRAMA'),
(4, 14, 30, 'GRAMA'),
(5, 5, 100, 'GRAMA'),
(5, 4, 150, 'MILILITRO'),
(5, 2, 80, 'GRAMA'),
(5, 3, 2, 'UNIDADE'),
(6, 1, 480, 'GRAMA'),
(6, 2, 300, 'GRAMA'),
(6, 3, 4, 'UNIDADE'),
(6, 4, 220, 'MILILITRO'),
(6, 8, 100, 'GRAMA'),
(7, 6, 100, 'GRAMA'),
(7, 5, 50, 'GRAMA');

insert into public.composicao_produto (produto_id, receita_id, quantidade, observacao) values
(1, 1, 1, 'Base da massa de chocolate'),
(1, 3, 1, 'Recheio de chocolate'),
(2, 2, 1, 'Base da massa de cenoura'),
(3, 1, 1, 'Massa base para bolo de festa'),
(3, 3, 1, 'Recheio de chocolate para festa');

-- Cliente padrão para vendas de balcão sem cadastro (o sistema usa o id 1 quando a venda não tem CPF).
insert into public.cliente (id, nome, cpf, telefone) values (1, 'Cliente balcão', null, null);

-- Ajusta os contadores de id para continuar depois dos dados acima.
select setval(pg_get_serial_sequence('public.ingrediente','id'),        (select max(id) from public.ingrediente));
select setval(pg_get_serial_sequence('public.categoria_produto','id'),  (select max(id) from public.categoria_produto));
select setval(pg_get_serial_sequence('public.produto','id'),            (select max(id) from public.produto));
select setval(pg_get_serial_sequence('public.tipo_receita','id'),       (select max(id) from public.tipo_receita));
select setval(pg_get_serial_sequence('public.receita','id'),            (select max(id) from public.receita));
select setval(pg_get_serial_sequence('public.cliente','id'),            (select max(id) from public.cliente));
