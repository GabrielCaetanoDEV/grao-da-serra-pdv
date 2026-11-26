-- =====================================================================
-- Empório & Café Grão da Serra — Soluções das questões 1 a 15
-- Autor: Gabriel Luis Caetano
-- Executar depois de 00_criacao_banco.sql (pode ser executado várias vezes:
-- cada objeto é recriado com DROP ... IF EXISTS / CREATE OR REPLACE)
-- =====================================================================
USE grao_da_serra;

-- =====================================================================
-- 5. FUNCTIONS
-- =====================================================================

-- Questão 1 — fn_total_pedido
-- Soma quantidade × preço de todos os itens do pedido. Sem itens → 0.
DELIMITER $$
DROP FUNCTION IF EXISTS fn_total_pedido $$
CREATE FUNCTION fn_total_pedido(p_id_pedido INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
  DECLARE v_total DECIMAL(10,2);

  SELECT SUM(quantidade * preco_unitario)
    INTO v_total
    FROM item_pedido
   WHERE id_pedido = p_id_pedido;

  RETURN COALESCE(v_total, 0);          -- SUM sem linhas devolve NULL
END$$
DELIMITER ;

-- Questão 2 — fn_situacao_estoque
-- ESGOTADO (estoque 0), REPOR (0 < estoque <= mínimo) ou OK.
DELIMITER $$
DROP FUNCTION IF EXISTS fn_situacao_estoque $$
CREATE FUNCTION fn_situacao_estoque(p_id_produto INT)
RETURNS VARCHAR(10)
READS SQL DATA
BEGIN
  DECLARE v_estoque INT;
  DECLARE v_minimo  INT;

  SELECT estoque, estoque_minimo
    INTO v_estoque, v_minimo
    FROM produto
   WHERE id_produto = p_id_produto;

  RETURN CASE
           WHEN v_estoque = 0                           THEN 'ESGOTADO'
           WHEN v_estoque > 0 AND v_estoque <= v_minimo THEN 'REPOR'
           ELSE 'OK'
         END;
END$$
DELIMITER ;

-- Questão 3 — fn_desconto_fidelidade
-- 4+ pedidos pagos → 10% | 2 ou 3 → 5% | menos de 2 → 0%.
DELIMITER $$
DROP FUNCTION IF EXISTS fn_desconto_fidelidade $$
CREATE FUNCTION fn_desconto_fidelidade(p_id_cliente INT)
RETURNS DECIMAL(4,2)
READS SQL DATA
BEGIN
  DECLARE v_pagos INT;

  SELECT COUNT(*)
    INTO v_pagos
    FROM pedido
   WHERE id_cliente = p_id_cliente
     AND status = 'PAGO';               -- abertos e cancelados não contam

  RETURN CASE
           WHEN v_pagos >= 4 THEN 10
           WHEN v_pagos >= 2 THEN 5
           ELSE 0
         END;
END$$
DELIMITER ;

-- =====================================================================
-- 6. PROCEDURES
-- =====================================================================

-- Questão 4 — sp_abrir_pedido
-- Cria o pedido (data e status com valores padrão) e devolve o número no OUT.
DELIMITER $$
DROP PROCEDURE IF EXISTS sp_abrir_pedido $$
CREATE PROCEDURE sp_abrir_pedido(
  IN  p_id_cliente     INT,
  IN  p_id_funcionario INT,
  OUT p_id_pedido      INT
)
BEGIN
  INSERT INTO pedido (id_cliente, id_funcionario)
  VALUES (p_id_cliente, p_id_funcionario);

  SET p_id_pedido = LAST_INSERT_ID();   -- último AUTO_INCREMENT desta conexão
END$$
DELIMITER ;

-- Questão 5 — sp_adicionar_item
-- Valida pedido, produto, quantidade e estoque; insere com o preço atual do produto.
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

  -- pedido
  SELECT status INTO v_status FROM pedido WHERE id_pedido = p_id_pedido;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pedido não encontrado.';
  END IF;

  IF v_status <> 'ABERTO' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Só é possível adicionar itens a pedidos ABERTOS.';
  END IF;

  -- produto
  SELECT ativo, estoque, preco
    INTO v_ativo, v_estoque, v_preco
    FROM produto
   WHERE id_produto = p_id_produto;

  IF v_preco IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto não encontrado.';
  END IF;

  IF v_ativo = FALSE THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto fora do cardápio (inativo).';
  END IF;

  -- quantidade
  IF p_quantidade <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A quantidade deve ser maior que zero.';
  END IF;

  -- estoque
  IF v_estoque < p_quantidade THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente para este produto.';
  END IF;

  -- passou em tudo: o preço vem da tabela, nunca de fora
  INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario)
  VALUES (p_id_pedido, p_id_produto, p_quantidade, v_preco);
END$$
DELIMITER ;

-- Questão 6 — sp_finalizar_pedido
-- Valida, calcula bruto (fn_total_pedido) e desconto (fn_desconto_fidelidade) e grava como PAGO.
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

  SET v_bruto = fn_total_pedido(p_id_pedido);

  IF v_bruto = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O pedido não tem itens.';
  END IF;

  SET v_desconto = fn_desconto_fidelidade(v_id_cliente);

  UPDATE pedido
     SET desconto_percentual = v_desconto,
         valor_total = ROUND(v_bruto * (1 - v_desconto / 100), 2),
         status = 'PAGO'
   WHERE id_pedido = p_id_pedido;
END$$
DELIMITER ;

-- Questão 7 — sp_reajustar_precos_categoria
-- Aplica o percentual a todos os produtos da categoria (arredondado em 2 casas).
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

  IF v_existe = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Categoria não encontrada.';
  END IF;

  IF p_percentual <= -100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O percentual deve ser maior que -100%.';
  END IF;

  UPDATE produto
     SET preco = ROUND(preco * (1 + p_percentual / 100), 2)
   WHERE id_categoria = p_id_categoria;   -- o WHERE impede reajustar a loja inteira
END$$
DELIMITER ;

-- =====================================================================
-- 7. VIEWS
-- =====================================================================

-- Questão 8 — vw_cardapio
CREATE OR REPLACE VIEW vw_cardapio AS
SELECT p.id_produto,
       c.nome                            AS categoria,
       p.nome                            AS produto,
       p.preco,
       fn_situacao_estoque(p.id_produto) AS situacao
  FROM produto p
  JOIN categoria c ON c.id_categoria = p.id_categoria
 WHERE p.ativo = TRUE;

-- Questão 9 — vw_pedidos_detalhados
-- LEFT JOIN mantém pedidos sem itens (qtd_itens = 0).
CREATE OR REPLACE VIEW vw_pedidos_detalhados AS
SELECT pe.id_pedido,
       pe.data_pedido,
       pe.status,
       c.nome                        AS cliente,
       f.nome                        AS atendente,
       COUNT(i.id_produto)           AS qtd_itens,
       fn_total_pedido(pe.id_pedido) AS valor_bruto,
       pe.desconto_percentual,
       pe.valor_total
  FROM pedido pe
  JOIN cliente     c ON c.id_cliente     = pe.id_cliente
  JOIN funcionario f ON f.id_funcionario = pe.id_funcionario
  LEFT JOIN item_pedido i ON i.id_pedido = pe.id_pedido
 GROUP BY pe.id_pedido, pe.data_pedido, pe.status, c.nome, f.nome,
          pe.desconto_percentual, pe.valor_total;

-- Questão 10 — vw_produtos_para_repor
CREATE OR REPLACE VIEW vw_produtos_para_repor AS
SELECT p.id_produto,
       p.nome                       AS produto,
       c.nome                       AS categoria,
       p.estoque,
       p.estoque_minimo,
       p.estoque_minimo - p.estoque AS faltam
  FROM produto p
  JOIN categoria c ON c.id_categoria = p.id_categoria
 WHERE p.ativo = TRUE
   AND p.estoque <= p.estoque_minimo;

-- Questão 11 — vw_vendas_por_categoria
-- CASE dentro do SUM filtra os pedidos PAGOS sem eliminar categorias sem venda.
CREATE OR REPLACE VIEW vw_vendas_por_categoria AS
SELECT c.nome AS categoria,
       COALESCE(SUM(CASE WHEN pe.status = 'PAGO'
                         THEN i.quantidade END), 0)                    AS unidades,
       COALESCE(SUM(CASE WHEN pe.status = 'PAGO'
                         THEN i.quantidade * i.preco_unitario END), 0) AS faturamento
  FROM categoria c
  LEFT JOIN produto     p  ON p.id_categoria = c.id_categoria
  LEFT JOIN item_pedido i  ON i.id_produto   = p.id_produto
  LEFT JOIN pedido      pe ON pe.id_pedido   = i.id_pedido
 GROUP BY c.id_categoria, c.nome;

-- =====================================================================
-- 8. TRIGGERS
-- =====================================================================

-- Questão 12 — trg_item_baixa_estoque (vendeu, baixou)
DELIMITER $$
DROP TRIGGER IF EXISTS trg_item_baixa_estoque $$
CREATE TRIGGER trg_item_baixa_estoque
AFTER INSERT ON item_pedido
FOR EACH ROW
BEGIN
  UPDATE produto
     SET estoque = estoque - NEW.quantidade
   WHERE id_produto = NEW.id_produto;
END$$
DELIMITER ;

-- Questão 13 — trg_item_devolve_estoque (removeu, devolveu)
DELIMITER $$
DROP TRIGGER IF EXISTS trg_item_devolve_estoque $$
CREATE TRIGGER trg_item_devolve_estoque
AFTER DELETE ON item_pedido
FOR EACH ROW
BEGIN
  UPDATE produto
     SET estoque = estoque + OLD.quantidade
   WHERE id_produto = OLD.id_produto;
END$$
DELIMITER ;

-- Questão 14 — trg_produto_historico_preco (auditoria de preço)
DELIMITER $$
DROP TRIGGER IF EXISTS trg_produto_historico_preco $$
CREATE TRIGGER trg_produto_historico_preco
AFTER UPDATE ON produto
FOR EACH ROW
BEGIN
  IF NEW.preco <> OLD.preco THEN          -- mudança só de estoque não gera histórico
    INSERT INTO historico_preco (id_produto, preco_antigo, preco_novo, usuario)
    VALUES (NEW.id_produto, OLD.preco, NEW.preco, CURRENT_USER());
  END IF;
END$$
DELIMITER ;

-- Questão 15 — trg_pedido_bloqueia_alteracao (pedido encerrado não muda)
DELIMITER $$
DROP TRIGGER IF EXISTS trg_pedido_bloqueia_alteracao $$
CREATE TRIGGER trg_pedido_bloqueia_alteracao
BEFORE UPDATE ON pedido
FOR EACH ROW
BEGIN
  IF OLD.status IN ('PAGO', 'CANCELADO') THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Pedido encerrado (PAGO ou CANCELADO) não pode ser alterado.';
  END IF;
END$$
DELIMITER ;
