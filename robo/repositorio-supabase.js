/* ==========================================================================
   Armazenamento no Supabase (PostgREST) usando a SERVICE ROLE KEY.
   Essa chave ignora o RLS: use SOMENTE no servidor (Cloud Run), nunca no navegador.
   Mapeia as tabelas de supabase/schema.sql para o formato usado pelo robô.
   ATENÇÃO: o mapeamento está coberto por testes (tests/supabase-map.test.js), mas a
   comunicação HTTP ainda não foi testada contra um projeto Supabase real.
   ========================================================================== */
"use strict";

const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const snake = (s) => s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
function linhaParaObj(r) { const o = {}; Object.keys(r).forEach((k) => (o[camel(k)] = r[k])); return o; }
function objParaLinha(o, campos) { const r = {}; campos.forEach((k) => { if (o[k] !== undefined) r[snake(k)] = o[k]; }); return r; }
const num = (v) => (v === null || v === undefined ? v : Number(v));

const CAMPOS_OFERTA = ["id", "codigo", "regraId", "destinoId", "campanhaId", "status", "titulo", "subtitulo", "chamada", "textosAuto",
  "cidadeOrigem", "aeroportoOrigem", "aeroportoDestino", "dataIda", "dataVolta", "companhia", "escalasIda", "escalasVolta", "classe",
  "bagagem", "custoOriginal", "moeda", "preco", "tipoPreco", "fonte", "idProvedor", "atualizacaoPendente", "pesquisadoEm", "publicadoEm",
  "aprovadoPor", "criadoEm", "atualizadoEm"];

/** Converte as linhas do banco no objeto `db` do robô. */
function montarDb(t) {
  const campanhasPorDestino = {};
  (t.destination_campaigns || []).forEach((x) => (campanhasPorDestino[x.destino_id] = (campanhasPorDestino[x.destino_id] || []).concat(x.campanha_id)));
  const config = {}; (t.app_settings || []).forEach((s) => (config[s.chave] = s.valor));
  return {
    destinos: t.destinations.map((r) => Object.assign(linhaParaObj(r), { campanhas: campanhasPorDestino[r.id] || [] })),
    aeroportos: t.airports.map(linhaParaObj),
    regras: t.monitoring_rules.map(linhaParaObj),
    precos: t.pricing_rules.map((r) => {
      const o = linhaParaObj(r);
      ["margemPct", "margemMinimaReais", "taxasVariaveisPct", "custoFinanceiroPct", "pixDescontoPct"].forEach((k) => (o[k] = num(o[k])));
      Object.keys(o).forEach((k) => o[k] === null && delete o[k]); // null = herda da regra padrão
      return o;
    }),
    ofertas: t.flight_offers.map((r) => Object.assign(linhaParaObj(r), { custoOriginal: num(r.custo_original), historico: [] })),
    config,
    pesquisas: [], logs: [], execucoes: [],
  };
}

/** Linhas a gravar após uma execução. */
function montarGravacao(db, resumo) {
  const desde = resumo.inicio;
  const ofertas = db.ofertas.filter((o) => o.atualizadoEm >= desde || o.criadoEm >= desde).map((o) => {
    const r = objParaLinha(o, CAMPOS_OFERTA);
    delete r.preco_anunciado; // coluna gerada
    return r;
  });
  const historico = [];
  db.ofertas.forEach((o) => (o.historico || []).filter((h) => h.data >= desde).forEach((h) =>
    historico.push({ oferta_id: o.id, data: h.data, custo: h.custo, preco_anunciado: h.precoAnunciado, companhia: h.companhia, data_ida: h.dataIda, data_volta: h.dataVolta, cidade_origem: h.cidadeOrigem, manual: !!h.manual })));
  return {
    robot_runs: [{ id: resumo.execucaoId, provedor: resumo.provedor, inicio: resumo.inicio, fim: resumo.fim, regras: resumo.regras, novas: resumo.novas, atualizadas: resumo.atualizadas, sem_alteracao: resumo.semAlteracao, expiradas: resumo.expiradas, erros: resumo.erros }],
    flight_searches: db.pesquisas.filter((p) => p.execucaoId === resumo.execucaoId).map((p) => objParaLinha(p, ["id", "execucaoId", "regraId", "destinoId", "cidadeOrigem", "tipo", "resultados", "melhorPreco", "criadoEm"])),
    system_logs: db.logs.filter((l) => l.execucaoId === resumo.execucaoId).map((l) => objParaLinha(l, ["execucaoId", "nivel", "etapa", "mensagem", "destinoId", "criadoEm"])),
    flight_offers: ofertas,
    flight_offer_prices: historico,
  };
}

module.exports = function (env) {
  const url = env.SUPABASE_URL, chave = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (somente no servidor).");
  const cab = { apikey: chave, Authorization: "Bearer " + chave, "Content-Type": "application/json" };
  async function get(tabela, filtro) {
    const r = await fetch(`${url}/rest/v1/${tabela}?select=*${filtro ? "&" + filtro : ""}`, { headers: cab });
    if (!r.ok) throw new Error(`GET ${tabela}: ${r.status} ${await r.text()}`);
    return r.json();
  }
  async function upsert(tabela, linhas, conflito) {
    if (!linhas.length) return;
    const r = await fetch(`${url}/rest/v1/${tabela}${conflito ? "?on_conflict=" + conflito : ""}`, {
      method: "POST", headers: Object.assign({ Prefer: "resolution=merge-duplicates,return=minimal" }, cab), body: JSON.stringify(linhas),
    });
    if (!r.ok) throw new Error(`POST ${tabela}: ${r.status} ${await r.text()}`);
  }
  return {
    async carregar() {
      const nomes = ["destinations", "destination_campaigns", "airports", "monitoring_rules", "pricing_rules", "app_settings"];
      const t = {};
      for (const n of nomes) t[n] = await get(n);
      t.flight_offers = await get("flight_offers", "status=not.in.(expirado,rejeitado)");
      return montarDb(t);
    },
    async salvar(db, resumo) {
      const g = montarGravacao(db, resumo);
      await upsert("robot_runs", g.robot_runs, "id");
      await upsert("flight_offers", g.flight_offers, "id");
      await upsert("flight_searches", g.flight_searches, "id");
      await upsert("flight_offer_prices", g.flight_offer_prices);
      await upsert("system_logs", g.system_logs);
      console.log(`[robo] Supabase: ${g.flight_offers.length} ofertas, ${g.flight_searches.length} pesquisas, ${g.system_logs.length} logs gravados`);
    },
  };
};
module.exports.montarDb = montarDb;
module.exports.montarGravacao = montarGravacao;
