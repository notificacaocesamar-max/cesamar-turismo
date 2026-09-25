// Mapeamento banco (snake_case) <-> robô (camelCase) do repositório Supabase — sem rede.
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../robo/repositorio-supabase.js");
const Robo = require("../frontend/assets/js/core/robo.js");
const Prov = require("../frontend/assets/js/core/provedores.js");

const tabelas = {
  destinations: [{ id: "italia", sigla: "ITA", nome: "Itália", nome_exibicao: "Itália", artigo: "a", cidade: "Roma", aeroporto: "FCO", regiao: "Europa", ativo: true, ordem: 0 }],
  destination_campaigns: [{ destino_id: "italia", campanha_id: "romanticos" }],
  airports: [
    { iata: "GRU", nome: "Guarulhos", cidade: "São Paulo", cidade_grupo: "SAO", pais: "Brasil", origem: true, ativo: true },
    { iata: "GIG", nome: "Galeão", cidade: "Rio de Janeiro", cidade_grupo: "RIO", pais: "Brasil", origem: true, ativo: true },
    { iata: "FCO", nome: "Fiumicino", cidade: "Roma", cidade_grupo: "FCO", pais: "Itália", origem: false, ativo: true }],
  monitoring_rules: [{ id: "reg-italia", destino_id: "italia", ativo: true, origens: ["SAO", "RIO"], periodo_inicio: "2027-05-01", periodo_fim: "2027-05-31", duracao_min: 10, duracao_max: 12, max_escalas: 1, exigir_bagagem: false, adultos: 1, classe: "economica", combinacoes: 3 }],
  pricing_rules: [{ id: "padrao", destino_id: null, modo: "acrescimo", margem_pct: "10.00", margem_minima_reais: "0.00", taxas_variaveis_pct: "0", custo_financeiro_pct: "0", parcelas: 10, arredondamento: "inteiro", pix_desconto_pct: "0", juros_texto: null, entrada_texto: null }],
  app_settings: [{ chave: "validadeOfertaDias", valor: 7 }, { chave: "chamadaPadrao", valor: "Vai ficar fora dessa?" }],
  flight_offers: [],
};

test("montarDb converte tabelas para o formato do robô", () => {
  const db = R.montarDb(tabelas);
  assert.deepEqual(db.destinos[0].campanhas, ["romanticos"]);
  assert.equal(db.aeroportos[0].cidadeGrupo, "SAO");
  assert.equal(db.regras[0].duracaoMin, 10);
  assert.equal(db.precos[0].margemPct, 10);           // numeric do Postgres chega como texto
  assert.equal(db.precos[0].jurosTexto, undefined);   // null = herda
  assert.equal(db.config.validadeOfertaDias, 7);
});

test("montarGravacao gera linhas snake_case sem a coluna gerada", async () => {
  const db = R.montarDb(tabelas);
  const resumo = await Robo.executar(db, { provedor: Prov.criarProvedor("demo", { diaExecucao: "2026-09-25" }), agora: new Date("2026-09-25T09:00:00Z") });
  const g = R.montarGravacao(db, resumo);
  assert.equal(g.robot_runs[0].id, resumo.execucaoId);
  assert.equal(g.flight_offers.length, 1);
  const o = g.flight_offers[0];
  assert.equal(o.status, "aguardando_aprovacao");
  assert.ok(o.custo_original > 0 && o.preco.precoParcelado > o.custo_original);
  assert.equal(o.preco_anunciado, undefined);
  assert.ok(Object.keys(o).every((k) => k === k.toLowerCase()));
  assert.equal(g.flight_offer_prices.length, 1);
  assert.ok(g.flight_searches.length >= 2);
  assert.ok(g.system_logs.every((l) => l.execucao_id === resumo.execucaoId));
});
