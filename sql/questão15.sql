-- Questão 15 — trg_pedido_bloqueia_alteracao
DELIMITER $$
DROP TRIGGER IF EXISTS trg_pedido_bloqueia_alteracao $$

CREATE TRIGGER trg_pedido_bloqueia_alteracao
BEFORE UPDATE ON pedido               -- ANTES de gravar, para poder barrar
FOR EACH ROW
BEGIN
  IF OLD.status IN ('PAGO', 'CANCELADO') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pedido encerrado (PAGO ou CANCELADO) não pode ser alterado.';
  END IF;
END$$

DELIMITER ;