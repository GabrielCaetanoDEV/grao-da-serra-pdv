-- Questão 6 — sp_finalizar_pedido
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_finalizar_pedido $$

CREATE PROCEDURE sp_finalizar_pedido(IN p_id_pedido INT)
BEGIN
  DECLARE v_status     VARCHAR(10);
  DECLARE v_id_cliente INT;
  DECLARE v_bruto      DECIMAL(10,2);
  DECLARE v_desconto   DECIMAL(4,2);

  SELECT status, id_cliente
    INTO v_status, v_id_cliente
    FROM pedido
   WHERE id_pedido = p_id_pedido;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pedido não encontrado.';
  END IF;

  IF v_status <> 'ABERTO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Só é possível finalizar pedidos ABERTOS.';
  END IF;

  SET v_bruto = fn_total_pedido(p_id_pedido);                  -- ← (A) function da Q1

  IF v_bruto = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O pedido não tem itens.';
  END IF;

  SET v_desconto = fn_desconto_fidelidade(v_id_cliente);       -- ← (B) function da Q3

  UPDATE pedido
     SET desconto_percentual = v_desconto,
         valor_total = ROUND(v_bruto * (1 - v_desconto / 100), 2),
         status = 'PAGO'                                       -- ← (C)
   WHERE id_pedido = p_id_pedido;
END$$

DELIMITER ;