CALL sp_finalizar_pedido(10);
SELECT status, desconto_percentual, valor_total FROM pedido WHERE id_pedido = 10;
-- PAGO | 5.00 | 25.65

CALL sp_finalizar_pedido(9);
SELECT status, desconto_percentual, valor_total FROM pedido WHERE id_pedido = 9;
-- PAGO | 0.00 | 30.00

CALL sp_finalizar_pedido(10);   -- ✗ "Só é possível finalizar pedidos ABERTOS." (esse erro é o esperado)