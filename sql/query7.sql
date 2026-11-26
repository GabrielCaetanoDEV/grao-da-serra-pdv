CALL sp_reajustar_precos_categoria(1, 10);
SELECT id_produto, nome, preco FROM produto WHERE id_categoria = 1;
-- 1 → 6.60 | 2 → 12.65 | 3 → 8.80

CALL sp_reajustar_precos_categoria(99, 10);    -- ✗ "Categoria não encontrada."
CALL sp_reajustar_precos_categoria(1, -100);   -- ✗ "O percentual deve ser maior que -100%."