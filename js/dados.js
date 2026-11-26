/* ==============================================================
   dados.js — MÓDULO ÚNICO DE ACESSO A DADOS
   --------------------------------------------------------------
   Toda comunicação com o banco grao_da_serra passa por aqui.
   O resto da interface (app.js) só chama estas funções.

   DOIS MODOS (escolhidos automaticamente):
   - "real": a página foi aberta pelo servidor (http://localhost:3000).
     Cada função chama a API do servidor Node.js (servidor/servidor.js),
     que executa no MySQL o SELECT na view ou o CALL na procedure.
   - "demo": a página foi aberta direto do arquivo (file://).
     As funções usam DADOS FICTÍCIOS (cópia dos dados de teste), só
     para a tela poder ser vista sem banco.
   A interface (app.js) é a mesma nos dois modos.

   Regras do formato de retorno:
   - listas  -> array de objetos com os nomes de colunas da view
   - erros   -> lançar um Error cuja .message é a mensagem do SIGNAL
   ============================================================== */

const Dados = (() => {

  /** "real" = conectado ao banco pelo servidor | "demo" = dados fictícios */
  const MODO = location.protocol.startsWith("http") ? "real" : "demo";

  /* ------------------------------------------------------------
     Registro de comandos: cada função informa o SQL equivalente,
     que aparece na gaveta "Registro do banco" da interface.
     ------------------------------------------------------------ */
  let ouvinte = () => {};
  function registrar(sql, erro) { ouvinte({ sql, erro, quando: new Date() }); }
  function aoExecutar(fn) { ouvinte = fn; }

  /** Simula a latência de rede/banco para a tela parecer real. */
  const espera = (ms = 140) => new Promise((r) => setTimeout(r, ms));

  /** Executa uma operação fictícia registrando o SQL e repassando erros. */
  async function executar(sql, operacao) {
    await espera();
    try {
      const resultado = operacao();
      registrar(sql);
      return structuredClone(resultado);
    } catch (e) {
      registrar(sql, e.message);
      throw e;
    }
  }

  /* ============================================================
     DADOS FICTÍCIOS (iguais aos dados de teste do script)
     ============================================================ */
  const fake = {
    categorias: [
      { id_categoria: 1, nome: "Cafés" },
      { id_categoria: 2, nome: "Bebidas geladas" },
      { id_categoria: 3, nome: "Salgados" },
      { id_categoria: 4, nome: "Doces" },
      { id_categoria: 5, nome: "Empório" },
    ],
    produtos: [
      { id_produto: 1,  nome: "Café expresso",              preco: 6.00,  estoque: 200, estoque_minimo: 30, ativo: true,  id_categoria: 1 },
      { id_produto: 2,  nome: "Cappuccino",                 preco: 11.50, estoque: 120, estoque_minimo: 20, ativo: true,  id_categoria: 1 },
      { id_produto: 3,  nome: "Café coado na hora",         preco: 8.00,  estoque: 150, estoque_minimo: 20, ativo: true,  id_categoria: 1 },
      { id_produto: 4,  nome: "Suco de laranja",            preco: 9.00,  estoque: 40,  estoque_minimo: 10, ativo: true,  id_categoria: 2 },
      { id_produto: 5,  nome: "Chá gelado de hibisco",      preco: 8.50,  estoque: 8,   estoque_minimo: 10, ativo: true,  id_categoria: 2 },
      { id_produto: 6,  nome: "Pão de queijo",              preco: 5.50,  estoque: 60,  estoque_minimo: 15, ativo: true,  id_categoria: 3 },
      { id_produto: 7,  nome: "Empada de palmito",          preco: 9.50,  estoque: 4,   estoque_minimo: 10, ativo: true,  id_categoria: 3 },
      { id_produto: 8,  nome: "Quiche de alho-poró",        preco: 12.00, estoque: 0,   estoque_minimo: 6,  ativo: true,  id_categoria: 3 },
      { id_produto: 9,  nome: "Cuca de banana (fatia)",     preco: 7.50,  estoque: 25,  estoque_minimo: 8,  ativo: true,  id_categoria: 4 },
      { id_produto: 10, nome: "Strudel de maçã",            preco: 13.00, estoque: 12,  estoque_minimo: 5,  ativo: true,  id_categoria: 4 },
      { id_produto: 11, nome: "Bolo de cenoura (fatia)",    preco: 8.00,  estoque: 18,  estoque_minimo: 6,  ativo: true,  id_categoria: 4 },
      { id_produto: 12, nome: "Café em grãos 250 g",        preco: 34.90, estoque: 30,  estoque_minimo: 8,  ativo: true,  id_categoria: 5 },
      { id_produto: 13, nome: "Geleia colonial de morango", preco: 18.00, estoque: 5,   estoque_minimo: 5,  ativo: true,  id_categoria: 5 },
      { id_produto: 14, nome: "Mel silvestre 300 g",        preco: 27.00, estoque: 14,  estoque_minimo: 4,  ativo: true,  id_categoria: 5 },
      { id_produto: 15, nome: "Torta alemã (fatia)",        preco: 12.50, estoque: 0,   estoque_minimo: 4,  ativo: false, id_categoria: 4 },
    ],
    clientes: [
      { id_cliente: 1, nome: "Ana Beatriz Schroeder", cpf: "111.111.111-11" },
      { id_cliente: 2, nome: "Rafael Linzmeyer",      cpf: "222.222.222-22" },
      { id_cliente: 3, nome: "Luana Pscheidt",        cpf: "333.333.333-33" },
      { id_cliente: 4, nome: "Diego Fendrich",        cpf: "444.444.444-44" },
      { id_cliente: 5, nome: "Helena Rudnick",        cpf: "555.555.555-55" },
    ],
    funcionarios: [
      { id_funcionario: 1, nome: "Bruno Tavares", cargo: "Atendente" },
      { id_funcionario: 2, nome: "Sofia Grossl",  cargo: "Caixa" },
      { id_funcionario: 3, nome: "Otávio Weiss",  cargo: "Gerente" },
    ],
    pedidos: [
      { id_pedido: 1,  data_pedido: "2026-11-03 08:20:00", status: "PAGO",      desconto_percentual: 0, valor_total: 34.00, id_cliente: 1, id_funcionario: 1 },
      { id_pedido: 2,  data_pedido: "2026-11-03 15:45:00", status: "PAGO",      desconto_percentual: 0, valor_total: 24.50, id_cliente: 2, id_funcionario: 1 },
      { id_pedido: 3,  data_pedido: "2026-11-04 09:10:00", status: "PAGO",      desconto_percentual: 0, valor_total: 57.90, id_cliente: 1, id_funcionario: 2 },
      { id_pedido: 4,  data_pedido: "2026-11-05 16:30:00", status: "PAGO",      desconto_percentual: 0, valor_total: 37.00, id_cliente: 3, id_funcionario: 1 },
      { id_pedido: 5,  data_pedido: "2026-11-06 08:05:00", status: "PAGO",      desconto_percentual: 0, valor_total: 14.00, id_cliente: 1, id_funcionario: 2 },
      { id_pedido: 6,  data_pedido: "2026-11-07 10:50:00", status: "PAGO",      desconto_percentual: 0, valor_total: 83.00, id_cliente: 2, id_funcionario: 1 },
      { id_pedido: 7,  data_pedido: "2026-11-07 17:15:00", status: "CANCELADO", desconto_percentual: 0, valor_total: 0,     id_cliente: 4, id_funcionario: 2 },
      { id_pedido: 8,  data_pedido: "2026-11-09 08:30:00", status: "PAGO",      desconto_percentual: 0, valor_total: 13.50, id_cliente: 1, id_funcionario: 1 },
      { id_pedido: 9,  data_pedido: "2026-11-10 14:00:00", status: "ABERTO",    desconto_percentual: 0, valor_total: 0,     id_cliente: 3, id_funcionario: 2 },
      { id_pedido: 10, data_pedido: "2026-11-10 14:25:00", status: "ABERTO",    desconto_percentual: 0, valor_total: 0,     id_cliente: 2, id_funcionario: 1 },
    ],
    itens: [
      [1, 1, 2, 6.00], [1, 6, 4, 5.50],
      [2, 2, 1, 11.50], [2, 10, 1, 13.00],
      [3, 3, 1, 8.00], [3, 9, 2, 7.50], [3, 12, 1, 34.90],
      [4, 4, 2, 9.00], [4, 7, 2, 9.50],
      [5, 1, 1, 6.00], [5, 11, 1, 8.00],
      [6, 2, 2, 11.50], [6, 6, 6, 5.50], [6, 14, 1, 27.00],
      [7, 13, 2, 18.00],
      [8, 1, 1, 6.00], [8, 9, 1, 7.50],
      [9, 5, 2, 8.50], [9, 10, 1, 13.00],
      [10, 3, 2, 8.00], [10, 6, 2, 5.50],
    ].map(([id_pedido, id_produto, quantidade, preco_unitario]) => ({ id_pedido, id_produto, quantidade, preco_unitario })),
    historico: [],
  };

  /* Auxiliares do modo demonstração (no modo real, isto é o banco) */
  const prod = (id) => fake.produtos.find((p) => p.id_produto === Number(id));
  const ped = (id) => fake.pedidos.find((p) => p.id_pedido === Number(id));
  const cat = (id) => fake.categorias.find((c) => c.id_categoria === Number(id));
  const r2 = (v) => Math.round(v * 100) / 100;
  const falha = (msg) => { throw new Error(msg); };
  const agora = () => { // data/hora local no formato DATETIME do MySQL
    const d = new Date(), z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
  };
  const situacao = (p) => (p.estoque === 0 ? "ESGOTADO" : p.estoque <= p.estoque_minimo ? "REPOR" : "OK");
  const bruto = (id) => r2(fake.itens.filter((i) => i.id_pedido === id).reduce((s, i) => s + i.quantidade * i.preco_unitario, 0));
  const desconto = (idCli) => {
    const n = fake.pedidos.filter((p) => p.id_cliente === idCli && p.status === "PAGO").length;
    return n >= 4 ? 10 : n >= 2 ? 5 : 0;
  };

  /* ============================================================
     FUNÇÕES PÚBLICAS — uma por operação
     ============================================================ */

  /** SELECT * FROM vw_cardapio ORDER BY categoria, produto */
  function listarCardapio() {
    return executar("SELECT * FROM vw_cardapio ORDER BY categoria, produto;", () =>
      fake.produtos.filter((p) => p.ativo).map((p) => ({
        id_produto: p.id_produto,
        categoria: cat(p.id_categoria).nome,
        produto: p.nome,
        preco: p.preco,
        situacao: situacao(p),
      }))
    );
  }

  /** SELECT id_cliente, nome, cpf FROM cliente ORDER BY nome */
  function listarClientes() {
    return executar("SELECT id_cliente, nome, cpf FROM cliente ORDER BY nome;", () =>
      [...fake.clientes].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  /** SELECT id_funcionario, nome, cargo FROM funcionario ORDER BY nome */
  function listarFuncionarios() {
    return executar("SELECT id_funcionario, nome, cargo FROM funcionario ORDER BY nome;", () =>
      [...fake.funcionarios].sort((a, b) => a.nome.localeCompare(b.nome))
    );
  }

  /**
   * CALL sp_abrir_pedido(cliente, funcionario, @novo); SELECT @novo;
   * Retorna { id_pedido }
   */
  function abrirPedido(idCliente, idFuncionario) {
    return executar(`CALL sp_abrir_pedido(${idCliente}, ${idFuncionario}, @novo); SELECT @novo;`, () => {
      const id_pedido = Math.max(...fake.pedidos.map((p) => p.id_pedido)) + 1;
      fake.pedidos.push({ id_pedido, data_pedido: agora(), status: "ABERTO", desconto_percentual: 0, valor_total: 0,
        id_cliente: Number(idCliente), id_funcionario: Number(idFuncionario) });
      return { id_pedido };
    });
  }

  /** CALL sp_adicionar_item(pedido, produto, quantidade) */
  function adicionarItem(idPedido, idProduto, quantidade) {
    return executar(`CALL sp_adicionar_item(${idPedido}, ${idProduto}, ${quantidade});`, () => {
      const pe = ped(idPedido), pr = prod(idProduto), q = Number(quantidade);
      if (!pe) falha(`Pedido ${idPedido} não encontrado.`);
      if (pe.status !== "ABERTO") falha(`O pedido ${idPedido} está ${pe.status} e não pode receber itens.`);
      if (!pr) falha(`Produto ${idProduto} não encontrado.`);
      if (!pr.ativo) falha(`O produto "${pr.nome}" está fora do cardápio.`);
      if (!(q > 0)) falha("A quantidade deve ser maior que zero.");
      if (pr.estoque < q) falha(`Estoque insuficiente de "${pr.nome}": disponível ${pr.estoque}, pedido ${q}.`);
      if (fake.itens.some((i) => i.id_pedido === pe.id_pedido && i.id_produto === pr.id_produto))
        falha(`Entrada duplicada: "${pr.nome}" já está no pedido ${idPedido}.`); // chave primária composta
      fake.itens.push({ id_pedido: pe.id_pedido, id_produto: pr.id_produto, quantidade: q, preco_unitario: pr.preco });
      pr.estoque -= q; // simula trg_item_baixa_estoque
      return { ok: true };
    });
  }

  /** DELETE FROM item_pedido WHERE id_pedido = ? AND id_produto = ? */
  function removerItem(idPedido, idProduto) {
    return executar(`DELETE FROM item_pedido WHERE id_pedido = ${idPedido} AND id_produto = ${idProduto};`, () => {
      const i = fake.itens.findIndex((x) => x.id_pedido === Number(idPedido) && x.id_produto === Number(idProduto));
      if (i < 0) return { removidos: 0 };
      const [item] = fake.itens.splice(i, 1);
      prod(item.id_produto).estoque += item.quantidade; // simula trg_item_devolve_estoque
      return { removidos: 1 };
    });
  }

  /**
   * CALL sp_finalizar_pedido(pedido);
   * depois: SELECT desconto_percentual, valor_total FROM vw_pedidos_detalhados WHERE id_pedido = ?
   * Retorna { id_pedido, valor_bruto, desconto_percentual, valor_total }
   */
  function finalizarPedido(idPedido) {
    return executar(`CALL sp_finalizar_pedido(${idPedido});`, () => {
      const pe = ped(idPedido);
      if (!pe) falha(`Pedido ${idPedido} não encontrado.`);
      if (pe.status !== "ABERTO") falha(`O pedido ${idPedido} não está ABERTO (situação: ${pe.status}).`);
      const vb = bruto(pe.id_pedido);
      if (vb === 0) falha(`O pedido ${idPedido} não tem itens.`);
      pe.desconto_percentual = desconto(pe.id_cliente);
      pe.valor_total = r2(vb * (1 - pe.desconto_percentual / 100));
      pe.status = "PAGO";
      return { id_pedido: pe.id_pedido, valor_bruto: vb, desconto_percentual: pe.desconto_percentual, valor_total: pe.valor_total };
    });
  }

  /**
   * SELECT * FROM vw_pedidos_detalhados [WHERE status = ?] ORDER BY id_pedido DESC
   * status opcional: "ABERTO" | "PAGO" | "CANCELADO"
   */
  function listarPedidos(status) {
    const filtro = status ? ` WHERE status = '${status}'` : "";
    return executar(`SELECT * FROM vw_pedidos_detalhados${filtro} ORDER BY id_pedido DESC;`, () =>
      fake.pedidos
        .filter((p) => !status || p.status === status)
        .map((p) => ({
          id_pedido: p.id_pedido,
          data_pedido: p.data_pedido,
          status: p.status,
          cliente: fake.clientes.find((c) => c.id_cliente === p.id_cliente).nome,
          atendente: fake.funcionarios.find((f) => f.id_funcionario === p.id_funcionario).nome,
          qtd_itens: fake.itens.filter((i) => i.id_pedido === p.id_pedido).length,
          valor_bruto: bruto(p.id_pedido),
          desconto_percentual: p.desconto_percentual,
          valor_total: p.valor_total,
        }))
        .sort((a, b) => b.id_pedido - a.id_pedido)
    );
  }

  /** SELECT * FROM vw_produtos_para_repor ORDER BY faltam DESC */
  function listarProdutosParaRepor() {
    return executar("SELECT * FROM vw_produtos_para_repor ORDER BY faltam DESC;", () =>
      fake.produtos
        .filter((p) => p.ativo && p.estoque <= p.estoque_minimo)
        .map((p) => ({ id_produto: p.id_produto, produto: p.nome, categoria: cat(p.id_categoria).nome,
          estoque: p.estoque, estoque_minimo: p.estoque_minimo, faltam: p.estoque_minimo - p.estoque }))
        .sort((a, b) => b.faltam - a.faltam)
    );
  }

  /** SELECT * FROM vw_vendas_por_categoria */
  function listarVendasPorCategoria() {
    return executar("SELECT * FROM vw_vendas_por_categoria;", () =>
      fake.categorias.map((c) => {
        const itens = fake.itens.filter((i) => ped(i.id_pedido).status === "PAGO" && prod(i.id_produto).id_categoria === c.id_categoria);
        return {
          categoria: c.nome,
          unidades: itens.reduce((s, i) => s + i.quantidade, 0),
          faturamento: r2(itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0)),
        };
      })
    );
  }

  /** CALL sp_reajustar_precos_categoria(categoria, percentual) */
  function reajustarPrecos(idCategoria, percentual) {
    return executar(`CALL sp_reajustar_precos_categoria(${idCategoria}, ${percentual});`, () => {
      const p = Number(percentual);
      if (!cat(idCategoria)) falha(`Categoria ${idCategoria} não encontrada.`);
      if (!(p > -100)) falha("O percentual de reajuste deve ser maior que -100%.");
      const afetados = fake.produtos.filter((x) => x.id_categoria === Number(idCategoria));
      afetados.forEach((x) => {
        const novo = r2(x.preco * (1 + p / 100));
        if (novo !== x.preco) { // simula trg_produto_historico_preco
          fake.historico.push({ id_historico: fake.historico.length + 1, id_produto: x.id_produto,
            preco_antigo: x.preco, preco_novo: novo, data_alteracao: agora(), usuario: "root@localhost" });
        }
        x.preco = novo;
      });
      return { produtos_afetados: afetados.length };
    });
  }

  /** SELECT h.*, p.nome AS produto FROM historico_preco h JOIN produto p ... ORDER BY data_alteracao DESC */
  function listarHistoricoPrecos() {
    return executar(
      "SELECT h.id_historico, h.id_produto, p.nome AS produto, h.preco_antigo, h.preco_novo, h.data_alteracao, h.usuario FROM historico_preco h JOIN produto p ON p.id_produto = h.id_produto ORDER BY h.id_historico DESC;",
      () => fake.historico.map((h) => ({ ...h, produto: prod(h.id_produto).nome })).reverse()
    );
  }

  /* ---------- Funções extras (consultas simples de apoio) ---------- */

  /** EXTRA — SELECT id_categoria, nome FROM categoria ORDER BY id_categoria (usado no formulário de reajuste) */
  function listarCategorias() {
    return executar("SELECT id_categoria, nome FROM categoria ORDER BY id_categoria;", () => fake.categorias);
  }

  /** EXTRA — itens de um pedido, para montar a comanda ao retomar um pedido aberto */
  function listarItensPedido(idPedido) {
    return executar(
      `SELECT i.id_produto, p.nome AS produto, i.quantidade, i.preco_unitario FROM item_pedido i JOIN produto p ON p.id_produto = i.id_produto WHERE i.id_pedido = ${idPedido};`,
      () => fake.itens.filter((i) => i.id_pedido === Number(idPedido))
        .map((i) => ({ id_produto: i.id_produto, produto: prod(i.id_produto).nome, quantidade: i.quantidade, preco_unitario: i.preco_unitario }))
    );
  }

  /* ============================================================
     MODO REAL — chamadas ao servidor Node.js (servidor/servidor.js)
     ============================================================ */

  /** Faz a requisição HTTP, registra o SQL equivalente e repassa o erro do SIGNAL. */
  async function chamar(sql, metodo, url, corpo) {
    const resp = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await resp.json();
    if (!resp.ok) { registrar(sql, dados.erro); throw new Error(dados.erro); }
    registrar(sql);
    return dados;
  }

  const real = {
    listarCardapio: () => chamar("SELECT * FROM vw_cardapio ORDER BY categoria, produto;", "GET", "/api/cardapio"),
    listarClientes: () => chamar("SELECT id_cliente, nome, cpf FROM cliente ORDER BY nome;", "GET", "/api/clientes"),
    listarFuncionarios: () => chamar("SELECT id_funcionario, nome, cargo FROM funcionario ORDER BY nome;", "GET", "/api/funcionarios"),
    abrirPedido: (cli, func) => chamar(`CALL sp_abrir_pedido(${cli}, ${func}, @novo); SELECT @novo;`, "POST", "/api/pedidos",
      { id_cliente: cli, id_funcionario: func }),
    adicionarItem: (ped, prod, qtd) => chamar(`CALL sp_adicionar_item(${ped}, ${prod}, ${qtd});`, "POST", `/api/pedidos/${ped}/itens`,
      { id_produto: prod, quantidade: qtd }),
    removerItem: (ped, prod) => chamar(`DELETE FROM item_pedido WHERE id_pedido = ${ped} AND id_produto = ${prod};`, "DELETE",
      `/api/pedidos/${ped}/itens/${prod}`),
    finalizarPedido: (ped) => chamar(`CALL sp_finalizar_pedido(${ped});`, "POST", `/api/pedidos/${ped}/finalizar`),
    listarPedidos: (status) => chamar(`SELECT * FROM vw_pedidos_detalhados${status ? ` WHERE status = '${status}'` : ""} ORDER BY id_pedido DESC;`,
      "GET", `/api/pedidos${status ? `?status=${status}` : ""}`),
    listarProdutosParaRepor: () => chamar("SELECT * FROM vw_produtos_para_repor ORDER BY faltam DESC;", "GET", "/api/repor"),
    listarVendasPorCategoria: () => chamar("SELECT * FROM vw_vendas_por_categoria;", "GET", "/api/vendas"),
    reajustarPrecos: (cat, perc) => chamar(`CALL sp_reajustar_precos_categoria(${cat}, ${perc});`, "POST", "/api/reajuste",
      { id_categoria: cat, percentual: perc }),
    listarHistoricoPrecos: () => chamar("SELECT ... FROM historico_preco h JOIN produto p ... ORDER BY h.id_historico DESC;", "GET", "/api/historico"),
    listarCategorias: () => chamar("SELECT id_categoria, nome FROM categoria ORDER BY id_categoria;", "GET", "/api/categorias"),
    listarItensPedido: (ped) => chamar(`SELECT ... FROM item_pedido i JOIN produto p ... WHERE i.id_pedido = ${ped};`, "GET", `/api/pedidos/${ped}/itens`),
  };

  const demo = {
    listarCardapio, listarClientes, listarFuncionarios,
    abrirPedido, adicionarItem, removerItem, finalizarPedido,
    listarPedidos, listarProdutosParaRepor, listarVendasPorCategoria,
    reajustarPrecos, listarHistoricoPrecos,
    listarCategorias, listarItensPedido,
  };

  return { MODO, aoExecutar, ...(MODO === "real" ? real : demo) };
})();
