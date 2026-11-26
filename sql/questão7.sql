-- Questão 7 — sp_reajustar_precos_categoria
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_reajustar_precos_categoria $$

CREATE PROCEDURE sp_reajustar_precos_categoria(
  IN p_id_categoria INT,
  IN p_percentual   DECIMAL(5,2)
)
BEGIN
  DECLARE v_existe INT;

  SELECT COUNT(*) INTO v_existe
    FROM categoria
   WHERE id_categoria = p_id_categoria;

  IF v_existe = 0 THEN                                   -- ← (A) contagem zero = não existe
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria não encontrada.';
  END IF;

  IF p_percentual <= -100 THEN                           -- ← (B) menor ou igual
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O percentual deve ser maior que -100%.';
  END IF;

  UPDATE produto
     SET preco = ROUND(preco * (1 + p_percentual / 100), 2)
   WHERE id_categoria = p_id_categoria;                  -- ← (C) a FK do produto
END$$

DELIMITER ;