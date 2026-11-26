-- Questão 1 — fn_total_pedido

DELIMITER $$
DROP FUNCTION IF EXISTS fn_total_pedido $$        -- ← linha nova

CREATE FUNCTION fn_total_pedido(p_id_pedido INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(10,2);                  -- variável que guarda a soma

  SELECT SUM(quantidade * preco_unitario)         -- valor de cada item, somado
    INTO v_total                                  -- resultado vai para a variável
    FROM item_pedido                              -- tabela dos itens
   WHERE id_pedido = p_id_pedido;                 -- só os itens deste pedido

  RETURN COALESCE(v_total, 0);                    -- sem itens → devolve 0, não NULL
END$$

DELIMITER ;

DELIMITER ;