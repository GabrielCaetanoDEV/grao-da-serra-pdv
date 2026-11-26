/* ==============================================================
   servidor.js — programa intermediário entre a interface e o MySQL
   --------------------------------------------------------------
   O navegador não fala direto com o MySQL. Então este servidor
   Node.js (Express):
     1. entrega a interface (index.html, css, js) em http://localhost:3000
     2. recebe as chamadas da interface em /api/...
     3. executa no banco um SELECT na view ou um CALL na procedure
     4. devolve o resultado em JSON (ou a mensagem do SIGNAL, se der erro)

   Os dados de acesso ao banco ficam no arquivo .env (fora do Git).
   ============================================================== */

require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");

/* ---------- Conexão: um "pool" reaproveita conexões abertas ---------- */
const banco = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "grao_da_serra",
  decimalNumbers: true,   // DECIMAL chega como número, não como texto
  dateStrings: true,      // DATETIME chega como "2026-11-03 08:20:00"
  connectionLimit: 5,
  charset: "utf8mb4",     // acentos corretos nas mensagens de erro
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, ".."))); // serve a interface

/**
 * Envolve cada rota: se o banco devolver erro (ex.: SIGNAL da procedure),
 * responde 400 com a mensagem em português para a interface exibir.
 */
const rota = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (e) {
    console.error("[banco]", e.sqlMessage || e.message);
    res.status(400).json({ erro: e.sqlMessage || e.message });
  }
};

/** Executa um comando com parâmetros (?) e devolve as linhas. */
async function consultar(sql, params = []) {
  const [linhas] = await banco.query(sql, params);
  return linhas;
}

/* ==============================================================
   LEITURAS — SELECT nas views e tabelas
   ============================================================== */
app.get("/api/cardapio", rota(() =>
  consultar("SELECT * FROM vw_cardapio ORDER BY categoria, produto")));

app.get("/api/clientes", rota(() =>
  consultar("SELECT id_cliente, nome, cpf FROM cliente ORDER BY nome")));

app.get("/api/funcionarios", rota(() =>
  consultar("SELECT id_funcionario, nome, cargo FROM funcionario ORDER BY nome")));

app.get("/api/categorias", rota(() =>
  consultar("SELECT id_categoria, nome FROM categoria ORDER BY id_categoria")));

app.get("/api/pedidos", rota((req) => req.query.status
  ? consultar("SELECT * FROM vw_pedidos_detalhados WHERE status = ? ORDER BY id_pedido DESC", [req.query.status])
  : consultar("SELECT * FROM vw_pedidos_detalhados ORDER BY id_pedido DESC")));

app.get("/api/pedidos/:id/itens", rota((req) =>
  consultar(`SELECT i.id_produto, p.nome AS produto, i.quantidade, i.preco_unitario
               FROM item_pedido i JOIN produto p ON p.id_produto = i.id_produto
              WHERE i.id_pedido = ?`, [req.params.id])));

app.get("/api/repor", rota(() =>
  consultar("SELECT * FROM vw_produtos_para_repor ORDER BY faltam DESC")));

app.get("/api/vendas", rota(() =>
  consultar("SELECT * FROM vw_vendas_por_categoria")));

app.get("/api/historico", rota(() =>
  consultar(`SELECT h.id_historico, h.id_produto, p.nome AS produto, h.preco_antigo,
                    h.preco_novo, h.data_alteracao, h.usuario
               FROM historico_preco h JOIN produto p ON p.id_produto = h.id_produto
              ORDER BY h.id_historico DESC`)));

/* ==============================================================
   OPERAÇÕES — CALL nas procedures
   ============================================================== */

// sp_abrir_pedido tem parâmetro OUT: a variável @novo só existe na mesma
// conexão, então pegamos UMA conexão do pool para o CALL e o SELECT.
app.post("/api/pedidos", rota(async (req) => {
  const con = await banco.getConnection();
  try {
    await con.query("CALL sp_abrir_pedido(?, ?, @novo)", [req.body.id_cliente, req.body.id_funcionario]);
    const [[linha]] = await con.query("SELECT @novo AS id_pedido");
    return linha;
  } finally {
    con.release();
  }
}));

app.post("/api/pedidos/:id/itens", rota(async (req) => {
  await consultar("CALL sp_adicionar_item(?, ?, ?)", [req.params.id, req.body.id_produto, req.body.quantidade]);
  return { ok: true };
}));

app.delete("/api/pedidos/:id/itens/:idProduto", rota(async (req) => {
  const r = await consultar("DELETE FROM item_pedido WHERE id_pedido = ? AND id_produto = ?", [req.params.id, req.params.idProduto]);
  return { removidos: r.affectedRows };
}));

// Depois de finalizar, os valores calculados pelo banco são lidos da view.
app.post("/api/pedidos/:id/finalizar", rota(async (req) => {
  await consultar("CALL sp_finalizar_pedido(?)", [req.params.id]);
  const [linha] = await consultar(
    "SELECT id_pedido, valor_bruto, desconto_percentual, valor_total FROM vw_pedidos_detalhados WHERE id_pedido = ?",
    [req.params.id]);
  return linha;
}));

app.post("/api/reajuste", rota(async (req) => {
  await consultar("CALL sp_reajustar_precos_categoria(?, ?)", [req.body.id_categoria, req.body.percentual]);
  return { ok: true };
}));

/* ---------- Inicialização ---------- */
const PORTA = Number(process.env.PORT || 3000);
banco.query("SELECT 1")
  .then(() => app.listen(PORTA, () => console.log(`☕ Grão da Serra rodando em http://localhost:${PORTA}`)))
  .catch((e) => {
    console.error("Não foi possível conectar ao MySQL. Confira o arquivo servidor/.env\n", e.message);
    process.exit(1);
  });
