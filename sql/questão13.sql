-- Questão 13 — trg_item_devolve_estoque
DELIMITER $$
DROP TRIGGER IF EXISTS trg_item_devolve_estoque $$

CREATE TRIGGER trg_item_devolve_estoque
AFTER DELETE ON item_pedido          -- dispara DEPOIS que um item é removido
FOR EACH ROW
BEGIN
  UPDATE produto
     SET estoque = estoque + OLD.quantidade    -- OLD = o item que acabou de sair
   WHERE id_produto = OLD.id_produto;
END$$

DELIMITER ;