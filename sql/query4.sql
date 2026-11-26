CALL sp_abrir_pedido(5, 1, @novo);
SELECT @novo;                                  -- 11
SELECT * FROM pedido WHERE id_pedido = @novo;  -- status ABERTO