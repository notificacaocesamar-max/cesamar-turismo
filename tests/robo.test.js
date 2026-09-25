// Testes do robô com o provedor de demonstração — rodar com:  node --test
const test = require("node:test");
const assert = require("node:assert/strict");
const Robo = require("../frontend/assets/js/core/robo.js");
const Prov = require("../frontend/assets/js/core/provedores.js");
const dados = require("../tools/seed-dados.js");

function novoDb() {
  return JSON.parse(JSON.stringify(Object.assign({}, dados, { ofertas: [], pesquisas: [], logs: [], execucoes: [] })));
}
function prov(dia, extra) {
  const regiaoPorIata = {}; dados.destinos.forEach((d) => (regiaoPorIata[d.aeroporto] = d.regiao));
  return Prov.criarProvedor("demo", Object.assign({ diaExecucao: dia, regiaoPorIata }, extra || {}));
}
const AGORA = new Date("2026-09-25T09:00:00Z");
const TOTAL_REGRAS_ATIVAS = dados.regras.filter((r) => r.ativo).length;

test("nenhuma oferta é publicada sem aprovação manual", async () => {
  const db = novoDb();
  const r = await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  assert.equal(r.novas, TOTAL_REGRAS_ATIVAS);
  assert.ok(db.ofertas.every((o) => o.status === "aguardando_aprovacao"));
});

test("guarda o custo original separado do preço anunciado e aplica a margem", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  for (const o of db.ofertas) {
    assert.ok(o.custoOriginal > 0);
    assert.ok(o.preco.precoParcelado > o.custoOriginal);
    assert.ok(o.preco.precoParcelado - o.custoOriginal >= 200 - 0.01, o.codigo + " respeita margem mínima");
  }
});

test("escolhe a opção válida mais barata entre São Paulo e Rio", async () => {
  const db = novoDb();
  const p = prov("2026-09-25");
  await Robo.executar(db, { provedor: p, agora: AGORA, somenteRegraId: "reg-italia" });
  const o = db.ofertas[0];
  const regra = db.regras.find((r) => r.id === "reg-italia");
  // refaz a busca ao vivo para as datas escolhidas nas duas cidades e confere que ninguém válido é mais barato
  for (const cidade of ["SAO", "RIO"]) {
    const aeros = db.aeroportos.filter((a) => a.origem && a.cidadeGrupo === cidade).map((a) => a.iata);
    const live = await p.searchLiveOffers({ aeroportosOrigem: aeros, aeroportoDestino: "FCO", dataIda: o.dataIda, dataVolta: o.dataVolta });
    const validas = live.filter((x) => Math.max(x.escalasIda, x.escalasVolta) <= regra.maxEscalas);
    validas.forEach((x) => assert.ok(x.preco >= o.custoOriginal));
  }
});

test("respeita máximo de escalas e exigência de bagagem", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  for (const o of db.ofertas) {
    const regra = db.regras.find((r) => r.id === o.regraId);
    assert.ok(Math.max(o.escalasIda, o.escalasVolta) <= regra.maxEscalas, o.codigo + " escalas");
    if (regra.exigirBagagem) assert.equal(o.bagagem, true, o.codigo + " bagagem");
  }
});

test("datas respeitam o período e a duração mínima/máxima", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  for (const o of db.ofertas) {
    const r = db.regras.find((x) => x.id === o.regraId);
    const dur = Prov.datas.diffDias(o.dataIda, o.dataVolta);
    assert.ok(o.dataIda >= r.periodoInicio && o.dataIda <= r.periodoFim, o.codigo + " período");
    assert.ok(dur >= r.duracaoMin && dur <= r.duracaoMax, o.codigo + " duração");
  }
});

test("código da oferta no formato SIGLA-MMAA e único", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  const it = db.ofertas.find((o) => o.destinoId === "italia");
  assert.match(it.codigo, /^ITA-\d{4}$/);
  assert.equal(new Set(db.ofertas.map((o) => o.codigo)).size, db.ofertas.length);
});

test("oferta publicada não muda sozinha: nova cotação fica pendente", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  db.ofertas.forEach((o) => (o.status = "publicado"));
  const antes = db.ofertas.map((o) => o.preco.precoParcelado);
  const r = await Robo.executar(db, { provedor: prov("2026-09-26"), agora: new Date("2026-09-26T09:00:00Z") });
  assert.ok(r.atualizadas > 0);
  db.ofertas.forEach((o, i) => assert.equal(o.preco.precoParcelado, antes[i]));
  const pend = db.ofertas.find((o) => o.atualizacaoPendente);
  assert.ok(pend);
  const destino = db.destinos.find((d) => d.id === pend.destinoId);
  assert.equal(Robo.aplicarAtualizacao(pend, destino, db.config), true);
  assert.equal(pend.atualizacaoPendente, undefined);
  assert.ok(pend.historico.length >= 2);
});

test("mesma execução no mesmo dia não duplica ofertas", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  const r2 = await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  assert.equal(db.ofertas.length, TOTAL_REGRAS_ATIVAS);
  assert.equal(r2.semAlteracao, TOTAL_REGRAS_ATIVAS);
});

test("falha em um destino é registrada e não interrompe os outros", async () => {
  const db = novoDb();
  const r = await Robo.executar(db, { provedor: prov("2026-09-25", { falharEm: ["CAI"] }), agora: AGORA });
  assert.equal(r.novas, TOTAL_REGRAS_ATIVAS - 1);
  assert.ok(r.erros >= 1);
  assert.ok(db.logs.some((l) => l.nivel === "erro" && l.destinoId === "egito"));
});

test("expira ofertas com pesquisa antiga ou embarque próximo", async () => {
  const db = novoDb();
  await Robo.executar(db, { provedor: prov("2026-09-25"), agora: AGORA });
  const alvo = db.ofertas.find((o) => o.destinoId === "alemanha"); // embarque em nov/2026
  db.regras.forEach((r) => (r.ativo = false)); // só a etapa de expiração
  const r = await Robo.executar(db, { provedor: prov("2026-11-20"), agora: new Date("2026-11-20T09:00:00Z") });
  assert.equal(alvo.status, "expirado");
  assert.equal(r.expiradas, TOTAL_REGRAS_ATIVAS); // todas com pesquisa de mais de 7 dias
});

test("provedores reais exigem credenciais e não inventam chaves", () => {
  assert.throws(() => Prov.criarProvedor("amadeus", { env: {} }), /AMADEUS_CLIENT_ID/);
  assert.throws(() => Prov.criarProvedor("duffel", { env: {} }), /DUFFEL_ACCESS_TOKEN/);
  assert.throws(() => Prov.criarProvedor("skyscanner", { env: {} }), /SKYSCANNER_API_KEY/);
  assert.throws(() => Prov.criarProvedor("xpto", {}), /desconhecido/);
});
