DELETE FROM item_pedido WHERE id_pedido = @novo AND id_produto = 9;
SELECT estoque FROM produto WHERE id_produto = 9;   -- deve voltar para 25