SELECT estoque FROM produto WHERE id_produto = 9;   -- anote o valor (deve ser 25)

CALL sp_abrir_pedido(5, 1, @novo);                  -- abre um pedido novo para o teste
CALL sp_adicionar_item(@novo, 9, 1);                -- vende 1 Cuca de banana

SELECT estoque FROM produto WHERE id_produto = 9;   -- deve ter diminuído 1 (24)