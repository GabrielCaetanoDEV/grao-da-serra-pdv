-- Questão 10 — vw_produtos_para_repor
CREATE OR REPLACE VIEW vw_produtos_para_repor AS
SELECT p.id_produto,
       p.nome                         AS produto,
       c.nome                         AS categoria,
       p.estoque,
       p.estoque_minimo,
       p.estoque_minimo - p.estoque   AS faltam        -- coluna calculada
  FROM produto p
  JOIN categoria c ON c.id_categoria = p.id_categoria
  WHERE p.ativo = TRUE
   AND p.estoque <= p.estoque_minimo;