CALL sp_reajustar_precos_categoria(1, 5);
SELECT * FROM historico_preco;
-- 3 linhas (produtos 1, 2 e 3), com preço antigo e novo

UPDATE produto SET estoque = 199 WHERE id_produto = 1;
SELECT * FROM historico_preco;
-- continua com 3 linhas (estoque não gera histórico)