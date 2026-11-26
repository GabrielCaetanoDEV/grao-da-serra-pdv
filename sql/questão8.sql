-- Questão 8 — vw_cardapio
CREATE OR REPLACE VIEW vw_cardapio AS
SELECT p.id_produto,
       c.nome                            AS categoria,
       p.nome                            AS produto,
       p.preco,
       fn_situacao_estoque(p.id_produto) AS situacao    -- ← function da Questão 2
  FROM produto p
  JOIN categoria c ON c.id_categoria = p.id_categoria
 WHERE p.ativo = TRUE;                                  -- ← só produtos ativos