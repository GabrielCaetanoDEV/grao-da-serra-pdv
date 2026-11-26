-- Questão 12 — trg_item_baixa_estoque
DELIMITER $$
DROP TRIGGER IF EXISTS trg_item_baixa_estoque $$

CREATE TRIGGER trg_item_baixa_estoque
AFTER INSERT ON item_pedido          -- dispara DEPOIS que um item é inserido
FOR EACH ROW                         -- uma vez para cada item inserido
BEGIN
  UPDATE produto
     SET estoque = estoque - NEW.quantidade    -- NEW = o item que acabou de entrar
   WHERE id_produto = NEW.id_produto;
END$$

DELIMITER ;