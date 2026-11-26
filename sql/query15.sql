-- 1) tentar mexer num pedido pago → deve dar ERRO
UPDATE pedido SET valor_total = 1 WHERE id_pedido = 1;

-- 2) um pedido aberto ainda pode ser finalizado → deve FUNCIONAR
CALL sp_abrir_pedido(5, 1, @teste);
CALL sp_adicionar_item(@teste, 1, 1);
CALL sp_finalizar_pedido(@teste);
SELECT status FROM pedido WHERE id_pedido = @teste;   -- PAGO