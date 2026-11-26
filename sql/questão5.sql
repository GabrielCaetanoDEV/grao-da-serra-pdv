-- Questão 5 — sp_adicionar_item
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_adicionar_item $$

CREATE PROCEDURE sp_adicionar_item(
  IN p_id_pedido  INT,
  IN p_id_produto INT,
  IN p_quantidade INT
)
BEGIN
  DECLARE v_status  VARCHAR(10);
  DECLARE v_ativo   BOOLEAN;
  DECLARE v_estoque INT;
  DECLARE v_preco   DECIMAL(8,2);

  -- 1) PEDIDO
  SELECT status INTO v_status FROM pedido WHERE id_pedido = p_id_pedido;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pedido não encontrado.';
  END IF;

  IF v_status <> 'ABERTO' THEN                                   -- ← (A)
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Só é possível adicionar itens a pedidos ABERTOS.';
  END IF;

  -- 2) PRODUTO
  SELECT ativo, estoque, preco
    INTO v_ativo, v_estoque, v_preco
    FROM produto
   WHERE id_produto = p_id_produto;

  IF v_preco IS NULL THEN                                        -- ← (B)
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto não encontrado.';
  END IF;

  IF v_ativo = FALSE THEN                                        -- ← (C)
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto fora do cardápio (inativo).';
  END IF;

  -- 3) QUANTIDADE
  IF p_quantidade <= 0 THEN                                      -- ← (D)
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A quantidade deve ser maior que zero.';
  END IF;

  -- 4) ESTOQUE
  IF v_estoque < p_quantidade THEN                               -- ← (E)
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente para este produto.';
  END IF;

  -- 5) INSERE com o preço atual do produto
  INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario)
  VALUES (p_id_pedido, p_id_produto, p_quantidade, v_preco);     -- ← (F)
END$$

DELIMITER ;