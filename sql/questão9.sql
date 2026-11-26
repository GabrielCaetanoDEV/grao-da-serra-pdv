-- Questão 9 — vw_pedidos_detalhados
CREATE OR REPLACE VIEW vw_pedidos_detalhados AS
SELECT pe.id_pedido,
       pe.data_pedido,
       pe.status,
       c.nome                        AS cliente,
       f.nome                        AS atendente,
       COUNT(i.id_produto)           AS qtd_itens,     -- produtos diferentes no pedido
       fn_total_pedido(pe.id_pedido) AS valor_bruto,   -- function da Questão 1
       pe.desconto_percentual,
       pe.valor_total
  FROM pedido pe
  JOIN cliente     c ON c.id_cliente     = pe.id_cliente
  JOIN funcionario f ON f.id_funcionario = pe.id_funcionario
  LEFT JOIN item_pedido i ON i.id_pedido = pe.id_pedido   -- LEFT: mantém pedidos sem itens
 GROUP BY pe.id_pedido, pe.data_pedido, pe.status, c.nome, f.nome,
          pe.desconto_percentual, pe.valor_total;