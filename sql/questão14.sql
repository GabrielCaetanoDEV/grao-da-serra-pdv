-- Questão 14 — trg_produto_historico_preco
DELIMITER $$
DROP TRIGGER IF EXISTS trg_produto_historico_preco $$

CREATE TRIGGER trg_produto_historico_preco
AFTER UPDATE ON produto
FOR EACH ROW
BEGIN
  IF NEW.preco <> OLD.preco THEN               -- só se o PREÇO realmente mudou
    INSERT INTO historico_preco (id_produto, preco_antigo, preco_novo, usuario)
    VALUES (NEW.id_produto, OLD.preco, NEW.preco, CURRENT_USER());
  END IF;
END$$

DELIMITER ;