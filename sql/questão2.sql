-- Questão 2 — fn_situacao_estoque
DELIMITER $$

CREATE FUNCTION fn_situacao_estoque(p_id_produto INT)
RETURNS VARCHAR(10)
READS SQL DATA
BEGIN
  DECLARE v_estoque INT;   -- estoque do produto
  DECLARE v_minimo  INT;   -- estoque mínimo do produto

  -- 1) pega os valores do produto e guarda nas variáveis
  SELECT estoque, estoque_minimo
    INTO v_estoque, v_minimo
    FROM produto
   WHERE id_produto = p_id_produto;

  -- 2) decide o texto (testa de cima para baixo)
  RETURN CASE
           WHEN v_estoque = 0                           THEN 'ESGOTADO'
           WHEN v_estoque > 0 AND v_estoque <= v_minimo THEN 'REPOR'
           ELSE 'OK'
         END;
END$$

DELIMITER ;