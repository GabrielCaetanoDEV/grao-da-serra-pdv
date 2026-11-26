-- Questão 4 — sp_abrir_pedido
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_abrir_pedido $$

CREATE PROCEDURE sp_abrir_pedido(
  IN  p_id_cliente     INT,      -- entra: quem está comprando
  IN  p_id_funcionario INT,      -- entra: quem está atendendo
  OUT p_id_pedido      INT       -- sai: o número do pedido criado
)
BEGIN
  INSERT INTO pedido (id_cliente, id_funcionario)     -- (A)
  VALUES (p_id_cliente, p_id_funcionario);            -- (B)

  SET p_id_pedido = LAST_INSERT_ID();                 -- (C)
END$$

DELIMITER ;