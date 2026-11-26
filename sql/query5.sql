CALL sp_abrir_pedido(5, 1, @novo);
CALL sp_adicionar_item(@novo, 2, 2);   -- ✓ funciona
CALL sp_adicionar_item(1, 1, 1);       -- ✗ pedido pago
CALL sp_adicionar_item(@novo, 15, 1);  -- ✗ produto inativo
CALL sp_adicionar_item(@novo, 8, 1);   -- ✗ sem estoque