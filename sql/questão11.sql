-- Questão 11 — vw_vendas_por_categoria
CREATE OR REPLACE VIEW vw_vendas_por_categoria AS
SELECT c.nome AS categoria,
       COALESCE(SUM(CASE WHEN pe.status = 'PAGO'
                         THEN i.quantidade END), 0)                     AS unidades,
       COALESCE(SUM(CASE WHEN pe.status = 'PAGO'
                         THEN i.quantidade * i.preco_unitario END), 0)  AS faturamento
  FROM categoria c
  LEFT JOIN produto     p  ON p.id_categoria = c.id_categoria
  LEFT JOIN item_pedido i  ON i.id_produto   = p.id_produto
  LEFT JOIN pedido      pe ON pe.id_pedido   = i.id_pedido
 GROUP BY c.id_categoria, c.nome;