-- Questão 3 — fn_desconto_fidelidade
DELIMITER $$
DROP FUNCTION IF EXISTS fn_desconto_fidelidade $$

CREATE FUNCTION fn_desconto_fidelidade(p_id_cliente INT)
RETURNS DECIMAL(4,2)
READS SQL DATA
BEGIN
  DECLARE v_pagos INT;   -- quantidade de pedidos pagos do cliente

  -- 1) conta os pedidos PAGOS deste cliente
  SELECT COUNT(*)
    INTO v_pagos
    FROM pedido
   WHERE id_cliente = p_id_cliente
     AND status = 'PAGO';             -- ← coluna + sinal de igual, sem crases

  -- 2) decide o percentual
  RETURN CASE
           WHEN v_pagos >= 4 THEN 10
           WHEN v_pagos >= 2 THEN 5   -- ← espaço antes do THEN
           ELSE 0
         END;
END$$

DELIMITER ;