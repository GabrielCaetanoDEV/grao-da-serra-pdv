# ☕ Grão da Serra · PDV

Sistema de pedidos do **Empório & Café Grão da Serra**, feito para o exercício prático de Banco de Dados (Functions, Procedures, Views e Triggers), com interface web conectada ao MySQL.

> Gabriel Luis Caetano · Engenharia da Computação

## Estrutura

```
grao-da-serra-pdv/
├── sql/
│   ├── 00_criacao_banco.sql   ← script da professora (tabelas + dados de teste)
│   └── 01_solucoes.sql        ← questões 1 a 15
├── servidor/
│   ├── servidor.js            ← programa intermediário Node.js (Express + mysql2)
│   ├── package.json
│   └── .env.exemplo           ← modelo dos dados de acesso ao banco
├── index.html                 ← interface (questão 16)
├── css/estilo.css
└── js/
    ├── dados.js               ← único módulo de acesso a dados
    └── app.js                 ← telas e navegação
```

## Objetos do banco (questões 1 a 15)

| Tipo | Objetos |
|---|---|
| Functions | `fn_total_pedido`, `fn_situacao_estoque`, `fn_desconto_fidelidade` |
| Procedures | `sp_abrir_pedido`, `sp_adicionar_item`, `sp_finalizar_pedido`, `sp_reajustar_precos_categoria` |
| Views | `vw_cardapio`, `vw_pedidos_detalhados`, `vw_produtos_para_repor`, `vw_vendas_por_categoria` |
| Triggers | `trg_item_baixa_estoque`, `trg_item_devolve_estoque`, `trg_produto_historico_preco`, `trg_pedido_bloqueia_alteracao` |

## Interface

É um PDV com tema escuro, pensado para o atendente no balcão. A comanda imita um cupom térmico.

| Tela | Atalho | O que usa no banco |
|---|---|---|
| Balcão | F1 | `vw_cardapio`, `sp_abrir_pedido`, `sp_adicionar_item`, `DELETE item_pedido`, `sp_finalizar_pedido` |
| Cardápio | F2 | `vw_cardapio` |
| Pedidos | F3 | `vw_pedidos_detalhados` |
| Gerência | F4 | `vw_produtos_para_repor`, `vw_vendas_por_categoria`, `sp_reajustar_precos_categoria`, `historico_preco` |

- A interface **não calcula** totais, descontos nem estoque. Tudo vem do banco.
- As mensagens dos `SIGNAL` aparecem numa faixa fixa no topo da tela.
- O botão **Registro do banco** mostra cada `SELECT`/`CALL` executado.

## Como executar

1. No MySQL Workbench, rode `sql/00_criacao_banco.sql` e depois `sql/01_solucoes.sql`.
2. Instale o [Node.js](https://nodejs.org) (versão 18 ou mais nova).
3. Em `servidor/`, copie `.env.exemplo` para `.env` e preencha usuário, senha e porta do seu MySQL.
4. No terminal:
   ```bash
   cd servidor
   npm install
   npm start
   ```
5. Abra **http://localhost:3000**. O selo verde "conectado · grao_da_serra" no canto da tela confirma a conexão.

> Se abrir o `index.html` direto (sem o servidor), a tela roda em **modo demonstração**, com dados fictícios.
