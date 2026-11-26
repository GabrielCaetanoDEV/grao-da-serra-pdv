/* ==============================================================
   app.js — telas e navegação do Grão da Serra · PDV
   --------------------------------------------------------------
   Regra de ouro: esta camada NÃO calcula totais, descontos nem
   estoque. Ela só exibe o que vem das views e aciona as procedures
   através do módulo Dados (js/dados.js). Depois de cada operação,
   os dados são recarregados, porque os triggers mudam o banco.
   ============================================================== */

/* ---------- Estado da interface ---------- */
const estado = {
  tela: "balcao",
  pedido: null,              // { id_pedido, cliente, atendente, itens: [] }
  ultimoFechado: null,       // resultado do sp_finalizar_pedido para exibir no cupom
  filtroCategoria: "Todas",
  busca: "",
  filtroStatus: "",          // "" = todos
};

/* ---------- Utilidades ---------- */
const $ = (sel) => document.querySelector(sel);
const moeda = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) => `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
const num3 = (n) => String(n).padStart(3, "0");
const dataBR = (s) => new Date(s.replace(" ", "T")).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const TELAS = {
  balcao:   { titulo: "Balcão",   sub: "Novo pedido · atendimento" },
  cardapio: { titulo: "Cardápio", sub: "vw_cardapio · produtos ativos" },
  pedidos:  { titulo: "Pedidos",  sub: "vw_pedidos_detalhados · acompanhamento" },
  gerencia: { titulo: "Gerência", sub: "Estoque, vendas e preços" },
};

/* ---------- Faixa de mensagens (retornos do banco / SIGNAL) ---------- */
let timerFaixa;
function mensagem(texto, tipo = "ok", origem = "") {
  const faixa = $("#faixa-mensagem");
  faixa.className = `faixa ${tipo}`;
  faixa.innerHTML = `<span>${tipo === "erro" ? "⚠" : "✓"}</span>
    <div>${esc(texto)}${origem ? `<div class="faixa-origem">${esc(origem)}</div>` : ""}</div>
    <button class="btn-icone" aria-label="Fechar mensagem">✕</button>`;
  faixa.hidden = false;
  faixa.querySelector("button").onclick = () => (faixa.hidden = true);
  clearTimeout(timerFaixa);
  if (tipo === "ok") timerFaixa = setTimeout(() => (faixa.hidden = true), 4500); // erros ficam até fechar
}

/** Envolve uma ação do banco: mostra sucesso ou o erro devolvido pelo SIGNAL. */
async function acao(fn, sucesso, origem) {
  try {
    const r = await fn();
    if (sucesso) mensagem(typeof sucesso === "function" ? sucesso(r) : sucesso, "ok", origem);
    return r;
  } catch (e) {
    mensagem(e.message, "erro", origem);
    return null;
  }
}

/* ---------- Registro do banco (gaveta) ---------- */
Dados.aoExecutar(({ sql, erro, quando }) => {
  const li = document.createElement("li");
  if (erro) { li.className = "erro"; li.dataset.erro = `↳ ${erro}`; }
  li.innerHTML = `<time>${quando.toLocaleTimeString("pt-BR")}</time>${esc(sql)}`;
  $("#lista-log").prepend(li);
});
$("#btn-log").onclick = () => $("#gaveta-log").classList.toggle("aberta");
$("#fechar-log").onclick = () => $("#gaveta-log").classList.remove("aberta");

/* ---------- Navegação ---------- */
function irPara(tela) {
  estado.tela = tela;
  document.querySelectorAll(".menu-item").forEach((b) => b.classList.toggle("ativo", b.dataset.tela === tela));
  $("#topo-titulo").textContent = TELAS[tela].titulo;
  $("#topo-sub").textContent = TELAS[tela].sub;
  renderizar();
}
document.querySelectorAll(".menu-item").forEach((b) => (b.onclick = () => irPara(b.dataset.tela)));
document.addEventListener("keydown", (e) => {
  const atalhos = { F1: "balcao", F2: "cardapio", F3: "pedidos", F4: "gerencia" };
  if (atalhos[e.key]) { e.preventDefault(); irPara(atalhos[e.key]); }
  if (e.key === "/" && estado.tela === "balcao" && document.activeElement.tagName !== "INPUT") {
    e.preventDefault(); $("#busca")?.focus();
  }
});

function renderizar() {
  ({ balcao: telaBalcao, cardapio: telaCardapio, pedidos: telaPedidos, gerencia: telaGerencia })[estado.tela]();
}

/* ==============================================================
   TELA 1 — BALCÃO (novo pedido)
   ============================================================== */
async function telaBalcao() {
  const [cardapio, clientes, funcionarios, abertos] = await Promise.all([
    Dados.listarCardapio(), Dados.listarClientes(), Dados.listarFuncionarios(), Dados.listarPedidos("ABERTO"),
  ]);
  // valor bruto do pedido atual vem da view (fn_total_pedido), não de conta feita aqui
  const linhaAtual = estado.pedido ? abertos.find((p) => p.id_pedido === estado.pedido.id_pedido) : null;

  const categorias = ["Todas", ...new Set(cardapio.map((p) => p.categoria))];
  const termo = estado.busca.toLowerCase();
  const visiveis = cardapio.filter((p) =>
    (estado.filtroCategoria === "Todas" || p.categoria === estado.filtroCategoria) &&
    p.produto.toLowerCase().includes(termo));
  const noPedido = new Set((estado.pedido?.itens || []).map((i) => i.id_produto));

  $("#tela").innerHTML = `
    <div class="balcao">
      <div class="balcao-produtos">
        <div class="barra-filtros">
          <div class="chips">
            ${categorias.map((c) => `<button class="chip ${c === estado.filtroCategoria ? "ativo" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
          </div>
          <input id="busca" class="busca" placeholder="Buscar produto  ( / )" value="${esc(estado.busca)}">
        </div>
        <div class="grade-produtos">
          ${visiveis.map((p) => `
            <button class="card-produto ${noPedido.has(p.id_produto) ? "no-pedido" : ""}" data-id="${p.id_produto}"
              ${p.situacao === "ESGOTADO" ? "disabled title='Produto esgotado'" : ""}>
              ${p.situacao !== "OK" ? `<span class="cp-aviso selo ${p.situacao}">${p.situacao === "REPOR" ? "últimas" : "esgotado"}</span>` : ""}
              <span class="cp-cat">${esc(p.categoria)}</span>
              <span class="cp-nome">${esc(p.produto)}</span>
              <span class="cp-preco">${moeda(p.preco)}</span>
            </button>`).join("") || `<p class="vazio">Nenhum produto encontrado.</p>`}
        </div>
      </div>

      <div class="comanda-wrap">
        <div class="comanda">${cupom(clientes, funcionarios, abertos, linhaAtual)}</div>
      </div>
    </div>`;

  // filtros
  document.querySelectorAll("[data-cat]").forEach((b) => (b.onclick = () => { estado.filtroCategoria = b.dataset.cat; telaBalcao(); }));
  const busca = $("#busca");
  busca.oninput = () => { estado.busca = busca.value; clearTimeout(busca._t); busca._t = setTimeout(async () => { await telaBalcao(); const b = $("#busca"); b.focus(); b.setSelectionRange(b.value.length, b.value.length); }, 220); };

  // clicar no produto abre a janela de quantidade
  document.querySelectorAll(".card-produto:not(:disabled)").forEach((b) => (b.onclick = () => {
    if (!estado.pedido) return mensagem("Abra um pedido na comanda antes de adicionar produtos.", "erro");
    pedirQuantidade(cardapio.find((p) => p.id_produto === Number(b.dataset.id)));
  }));

  ligarCupom(clientes, funcionarios);
}

/** Monta o HTML do cupom conforme a etapa: escolher cliente, pedido aberto ou pedido pago. */
function cupom(clientes, funcionarios, abertos, linhaAtual) {
  const cabecalho = `<h3>Grão da Serra</h3><p class="cupom-sub">Empório &amp; Café · Comanda</p><hr>`;

  // Etapa 3: pedido acabou de ser pago
  if (estado.ultimoFechado) {
    const f = estado.ultimoFechado;
    return `${cabecalho}
      <div class="cupom-numero">Nº ${num3(f.id_pedido)}</div>
      <span class="carimbo">PAGO</span>
      <hr>
      <div class="cupom-linha"><span>Cliente</span><span>${esc(f.cliente)}</span></div>
      <div class="cupom-linha"><span>Valor bruto</span><span>${moeda(f.valor_bruto)}</span></div>
      <div class="cupom-linha"><span>Desconto fidelidade</span><span>${pct(f.desconto_percentual)}</span></div>
      <hr>
      <div class="cupom-linha"><span>TOTAL</span></div>
      <div class="cupom-total">${moeda(f.valor_total)}</div>
      <div class="cupom-acoes"><button class="btn-primario btn-grande" id="btn-novo">Novo pedido</button></div>
      <p class="dica-banco">valores calculados por sp_finalizar_pedido</p>`;
  }

  // Etapa 1: nenhum pedido aberto
  if (!estado.pedido) {
    return `${cabecalho}
      <label for="sel-cliente">Cliente</label>
      <select id="sel-cliente">${clientes.map((c) => `<option value="${c.id_cliente}">${esc(c.nome)}</option>`).join("")}</select>
      <label for="sel-func">Atendente</label>
      <select id="sel-func">${funcionarios.map((f) => `<option value="${f.id_funcionario}">${esc(f.nome)} · ${esc(f.cargo)}</option>`).join("")}</select>
      <div class="cupom-acoes"><button class="btn-primario btn-grande" id="btn-abrir">Abrir pedido</button></div>
      ${abertos.length ? `<hr><label for="sel-retomar">Ou continuar um pedido aberto</label>
        <select id="sel-retomar"><option value="">Selecione…</option>
          ${abertos.map((p) => `<option value="${p.id_pedido}">Nº ${num3(p.id_pedido)} · ${esc(p.cliente)}</option>`).join("")}
        </select>` : ""}
      <p class="dica-banco">CALL sp_abrir_pedido(cliente, funcionário, @novo)</p>`;
  }

  // Etapa 2: pedido aberto recebendo itens
  const p = estado.pedido;
  return `${cabecalho}
    <div class="cupom-numero">Nº ${num3(p.id_pedido)}</div>
    <div class="cupom-linha"><span>Cliente</span><span>${esc(p.cliente)}</span></div>
    <div class="cupom-linha"><span>Atendente</span><span>${esc(p.atendente)}</span></div>
    <hr>
    ${p.itens.length ? `<ul class="cupom-itens">${p.itens.map((i) => `
      <li>
        <span class="ci-nome">${esc(i.produto)}</span>
        <span class="ci-detalhe">${i.quantidade} un × ${moeda(i.preco_unitario)}</span>
        <button class="ci-remover" data-remover="${i.id_produto}" title="Remover item">✕</button>
      </li>`).join("")}</ul>`
      : `<p class="cupom-vazio">Toque em um produto para adicionar.</p>`}
    <hr>
    <div class="cupom-linha forte"><span>Valor bruto</span><span>${moeda(linhaAtual?.valor_bruto ?? 0)}</span></div>
    <p class="dica-banco">desconto de fidelidade aplicado pelo banco ao finalizar</p>
    <div class="cupom-acoes">
      <button class="btn-primario btn-grande" id="btn-finalizar">Finalizar pedido</button>
      <button class="btn-fantasma" id="btn-sair">Deixar em aberto</button>
    </div>`;
}

function ligarCupom(clientes, funcionarios) {
  $("#btn-abrir")?.addEventListener("click", async () => {
    const idCli = Number($("#sel-cliente").value), idFunc = Number($("#sel-func").value);
    const r = await acao(() => Dados.abrirPedido(idCli, idFunc), (r) => `Pedido nº ${r.id_pedido} aberto.`, "sp_abrir_pedido");
    if (!r) return;
    estado.pedido = {
      id_pedido: r.id_pedido,
      cliente: clientes.find((c) => c.id_cliente === idCli).nome,
      atendente: funcionarios.find((f) => f.id_funcionario === idFunc).nome,
      itens: [],
    };
    telaBalcao();
  });

  $("#sel-retomar")?.addEventListener("change", (e) => e.target.value && retomarPedido(Number(e.target.value)));

  document.querySelectorAll("[data-remover]").forEach((b) => (b.onclick = async () => {
    const ok = await acao(() => Dados.removerItem(estado.pedido.id_pedido, Number(b.dataset.remover)), "Item removido · estoque devolvido.", "DELETE item_pedido → trg_item_devolve_estoque");
    if (ok) { await recarregarItens(); telaBalcao(); }
  }));

  $("#btn-finalizar")?.addEventListener("click", async () => {
    const r = await acao(() => Dados.finalizarPedido(estado.pedido.id_pedido), null, "sp_finalizar_pedido");
    if (!r) return;
    estado.ultimoFechado = { ...r, cliente: estado.pedido.cliente };
    mensagem(`Pedido nº ${r.id_pedido} pago: ${moeda(r.valor_total)} (desconto ${pct(r.desconto_percentual)}).`, "ok", "sp_finalizar_pedido");
    estado.pedido = null;
    telaBalcao();
  });

  $("#btn-sair")?.addEventListener("click", () => { estado.pedido = null; telaBalcao(); });
  $("#btn-novo")?.addEventListener("click", () => { estado.ultimoFechado = null; telaBalcao(); });
}

/** Retoma um pedido aberto (ex.: pedidos 9 e 10 dos dados de teste). */
async function retomarPedido(idPedido) {
  const [linha] = (await Dados.listarPedidos("ABERTO")).filter((p) => p.id_pedido === idPedido);
  if (!linha) return mensagem(`O pedido ${idPedido} não está mais aberto.`, "erro");
  estado.ultimoFechado = null;
  estado.pedido = { id_pedido: idPedido, cliente: linha.cliente, atendente: linha.atendente, itens: [] };
  await recarregarItens();
  if (estado.tela !== "balcao") irPara("balcao"); else telaBalcao();
}

async function recarregarItens() {
  estado.pedido.itens = await Dados.listarItensPedido(estado.pedido.id_pedido);
}

/** Janela de quantidade → sp_adicionar_item */
function pedirQuantidade(produto) {
  const dlg = $("#dlg-qtd"), campo = $("#qtd-valor");
  $("#qtd-cat").textContent = produto.categoria;
  $("#qtd-nome").textContent = produto.produto;
  $("#qtd-preco").textContent = `${moeda(produto.preco)} / un`;
  campo.value = 1;
  dlg.querySelectorAll("[data-passo]").forEach((b) => (b.onclick = () => { campo.value = Math.max(1, Number(campo.value) + Number(b.dataset.passo)); }));
  dlg.onclose = async () => {
    if (dlg.returnValue !== "ok") return;
    const ok = await acao(
      () => Dados.adicionarItem(estado.pedido.id_pedido, produto.id_produto, Number(campo.value)),
      `${campo.value}× ${produto.produto} adicionado.`, "sp_adicionar_item → trg_item_baixa_estoque");
    if (ok) await recarregarItens();
    telaBalcao();
  };
  dlg.returnValue = "";
  dlg.showModal();
  campo.select();
}

/* ==============================================================
   TELA 2 — CARDÁPIO (vw_cardapio)
   ============================================================== */
async function telaCardapio() {
  const itens = await Dados.listarCardapio();
  const grupos = itens.reduce((g, p) => ((g[p.categoria] ||= []).push(p), g), {});

  $("#tela").innerHTML = `<div class="cardapio">
    ${Object.entries(grupos).map(([cat, lista]) => `
      <section class="cardapio-bloco">
        <h2>${esc(cat)} <span>${lista.length} itens</span></h2>
        ${lista.map((p) => `
          <div class="linha-cardapio ${p.situacao}">
            <span class="lc-id">#${String(p.id_produto).padStart(2, "0")}</span>
            <span class="lc-nome">${esc(p.produto)}</span>
            ${p.situacao === "OK" ? "<span></span>" : `<span class="selo ${p.situacao}">${p.situacao === "REPOR" ? "últimas unidades" : "esgotado"}</span>`}
            <span class="lc-preco">${moeda(p.preco)}</span>
          </div>`).join("")}
      </section>`).join("")}
  </div>`;
}

/* ==============================================================
   TELA 3 — PEDIDOS (vw_pedidos_detalhados)
   ============================================================== */
async function telaPedidos() {
  const todos = await Dados.listarPedidos(estado.filtroStatus || undefined);
  const contagem = await Dados.listarPedidos(); // para os números do topo
  const conta = (s) => contagem.filter((p) => p.status === s).length;

  const filtros = [["", "Todos", contagem.length], ["ABERTO", "Abertos", conta("ABERTO")], ["PAGO", "Pagos", conta("PAGO")], ["CANCELADO", "Cancelados", conta("CANCELADO")]];

  $("#tela").innerHTML = `
    <div class="resumo-status">
      ${filtros.map(([, rot, n]) => `<div class="mini-kpi"><span>${rot}</span><strong>${n}</strong></div>`).join("")}
    </div>
    <div class="painel">
      <div class="painel-cab">
        <div class="chips">${filtros.map(([s, rot]) => `<button class="chip ${s === estado.filtroStatus ? "ativo" : ""}" data-status="${s}">${rot}</button>`).join("")}</div>
        <span class="fonte">vw_pedidos_detalhados</span>
      </div>
      <table class="tabela" style="margin-top:14px">
        <thead><tr>
          <th>Nº</th><th>Data</th><th>Status</th><th>Cliente</th><th>Atendente</th>
          <th class="direita">Itens</th><th class="direita">Bruto</th><th class="direita">Desc.</th><th class="direita">Total</th><th></th>
        </tr></thead>
        <tbody>
          ${todos.map((p) => `<tr>
            <td class="mono">${num3(p.id_pedido)}</td>
            <td class="fraco">${dataBR(p.data_pedido)}</td>
            <td><span class="selo ${p.status}">${p.status}</span></td>
            <td>${esc(p.cliente)}</td>
            <td class="fraco">${esc(p.atendente)}</td>
            <td class="num">${p.qtd_itens}</td>
            <td class="num">${moeda(p.valor_bruto)}</td>
            <td class="num">${pct(p.desconto_percentual)}</td>
            <td class="num"><strong>${p.status === "PAGO" ? moeda(p.valor_total) : "—"}</strong></td>
            <td class="direita">${p.status === "ABERTO" ? `<button class="link-acao" data-retomar="${p.id_pedido}">Continuar →</button>` : ""}</td>
          </tr>`).join("") || `<tr><td colspan="10" class="vazio">Nenhum pedido com esse status.</td></tr>`}
        </tbody>
      </table>
    </div>`;

  document.querySelectorAll("[data-status]").forEach((b) => (b.onclick = () => { estado.filtroStatus = b.dataset.status; telaPedidos(); }));
  document.querySelectorAll("[data-retomar]").forEach((b) => (b.onclick = () => retomarPedido(Number(b.dataset.retomar))));
}

/* ==============================================================
   TELA 4 — GERÊNCIA
   ============================================================== */
async function telaGerencia() {
  const [repor, vendas, categorias, historico] = await Promise.all([
    Dados.listarProdutosParaRepor(), Dados.listarVendasPorCategoria(), Dados.listarCategorias(), Dados.listarHistoricoPrecos(),
  ]);
  const maior = Math.max(1, ...vendas.map((v) => Number(v.faturamento))); // escala visual das barras, não é regra de negócio

  $("#tela").innerHTML = `
    <div class="gerencia">

      <section class="painel">
        <div class="painel-cab"><h2>Produtos para repor</h2><span class="fonte">vw_produtos_para_repor</span></div>
        <p class="painel-sub">Lista de compras do dia, pronta para ligar aos fornecedores.</p>
        ${repor.length ? `<table class="tabela">
          <thead><tr><th>Produto</th><th>Categoria</th><th class="direita">Estoque</th><th class="direita">Mín.</th><th class="direita">Faltam</th></tr></thead>
          <tbody>${repor.map((r) => `<tr>
            <td>${esc(r.produto)}</td><td class="fraco">${esc(r.categoria)}</td>
            <td class="num">${r.estoque}</td><td class="num fraco">${r.estoque_minimo}</td>
            <td class="num faltam">${r.faltam}</td></tr>`).join("")}</tbody>
        </table>` : `<p class="vazio">Nada para repor. ☕</p>`}
      </section>

      <section class="painel">
        <div class="painel-cab"><h2>Vendas por categoria</h2><span class="fonte">vw_vendas_por_categoria</span></div>
        <p class="painel-sub">Somente pedidos pagos.</p>
        <div class="barras">
          ${vendas.map((v) => `
            <div class="barra-linha">
              <span>${esc(v.categoria)}</span>
              <div class="barra-trilho"><div class="barra-cheia" style="width:${(Number(v.faturamento) / maior) * 100}%"></div></div>
              <span class="barra-valor">${moeda(v.faturamento)}<small>${v.unidades} un</small></span>
            </div>`).join("")}
        </div>
      </section>

      <section class="painel largo">
        <div class="painel-cab"><h2>Reajuste de preços</h2><span class="fonte">sp_reajustar_precos_categoria</span></div>
        <p class="painel-sub">Positivo para aumento, negativo para redução. Cada alteração vai para o histórico automaticamente.</p>
        <form class="form-reajuste" id="form-reajuste">
          <label>Categoria
            <select class="campo" id="rj-cat">${categorias.map((c) => `<option value="${c.id_categoria}">${esc(c.nome)}</option>`).join("")}</select>
          </label>
          <label>Percentual (%)
            <input class="campo mono" id="rj-pct" type="number" step="0.01" value="10" required>
          </label>
          <button class="btn-primario" type="submit">Aplicar reajuste</button>
        </form>
      </section>

      <section class="painel largo">
        <div class="painel-cab"><h2>Histórico de preços</h2><span class="fonte">historico_preco · gerado por trigger</span></div>
        <p class="painel-sub">Auditoria de reajustes: quem alterou, quando e de quanto para quanto.</p>
        ${historico.length ? `<table class="tabela">
          <thead><tr><th>#</th><th>Produto</th><th class="direita">Antigo</th><th></th><th class="direita">Novo</th><th>Data</th><th>Usuário</th></tr></thead>
          <tbody>${historico.map((h) => `<tr>
            <td class="mono fraco">${h.id_historico}</td><td>${esc(h.produto)}</td>
            <td class="num fraco">${moeda(h.preco_antigo)}</td>
            <td class="seta ${Number(h.preco_novo) > Number(h.preco_antigo) ? "sobe" : "desce"}">${Number(h.preco_novo) > Number(h.preco_antigo) ? "▲" : "▼"}</td>
            <td class="num"><strong>${moeda(h.preco_novo)}</strong></td>
            <td class="fraco">${dataBR(h.data_alteracao)}</td><td class="mono fraco">${esc(h.usuario)}</td></tr>`).join("")}</tbody>
        </table>` : `<p class="vazio">Nenhuma alteração de preço registrada ainda.</p>`}
      </section>
    </div>`;

  $("#form-reajuste").onsubmit = async (e) => {
    e.preventDefault();
    const idCat = Number($("#rj-cat").value), perc = Number($("#rj-pct").value);
    const nome = categorias.find((c) => c.id_categoria === idCat).nome;
    const ok = await acao(() => Dados.reajustarPrecos(idCat, perc), `Reajuste de ${pct(perc)} aplicado em ${nome}.`, "sp_reajustar_precos_categoria → trg_produto_historico_preco");
    if (ok) telaGerencia();
  };
}

/* ---------- Relógio e selo de conexão ---------- */
function relogio() {
  const d = new Date();
  $("#relogio").innerHTML = `${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    <small>${d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</small>`;
}
relogio(); setInterval(relogio, 15000);

const selo = $("#modo-conexao");
if (Dados.MODO === "real") { selo.classList.add("real"); selo.textContent = "● conectado · grao_da_serra"; }
else selo.textContent = "MODO DEMONSTRAÇÃO\ndados fictícios em js/dados.js";
selo.style.whiteSpace = "pre-line";

irPara("balcao");
