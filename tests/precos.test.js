// Testes das regras de preço — rodar com:  node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../frontend/assets/js/core/precos.js");

test("exemplo da especificação: R$ 4.300 + 10% = R$ 4.730 em 10x de R$ 473", () => {
  const r = P.calcular(4300, { margemPct: 10, parcelas: 10, arredondamento: "inteiro" });
  assert.equal(r.precoParcelado, 4730);
  assert.equal(r.valorParcela, 473);
  assert.equal(r.totalParcelado, 4730);
  assert.equal(r.ganhoReais, 430);
  assert.equal(P.textoPreco(r), "A partir de R$ 4.730 por pessoa ou 10x de R$ 473");
});

test("margem mínima em reais prevalece quando o percentual rende pouco", () => {
  const r = P.calcular(1000, { margemPct: 5, margemMinimaReais: 200, arredondamento: "inteiro" });
  assert.equal(r.precoBase, 1200); // 5% seria R$ 50
  assert.equal(r.ganhoReais, 200);
});

test("margem mínima não interfere quando o percentual já é maior", () => {
  const r = P.calcular(4300, { margemPct: 10, margemMinimaReais: 200 });
  assert.equal(r.precoBase, 4730);
});

test("margem sobre o preço final: custo ÷ (1 − margem − taxas)", () => {
  const r = P.calcular(4300, { modo: "margem_final", margemPct: 10, taxasVariaveisPct: 4, arredondamento: "nenhum" });
  // 4300 / 0.86 = 5000
  assert.equal(r.precoBase, 5000);
  assert.equal(r.ganhoPct, 14); // 700 / 5000
});

test("margem sobre o preço final rejeita margem + taxas >= 100%", () => {
  assert.throws(() => P.calcular(1000, { modo: "margem_final", margemPct: 90, taxasVariaveisPct: 10 }), /menor que 100%/);
});

test("custo financeiro entra só no preço parcelado; Pix fica no preço base", () => {
  const r = P.calcular(4300, { margemPct: 10, custoFinanceiroPct: 5, parcelas: 10, arredondamento: "inteiro" });
  assert.equal(r.precoPix, 4730);
  assert.equal(r.precoParcelado, 4967); // 4730 × 1,05 = 4966,50 → 4967
  assert.equal(r.valorParcela, 496.7);
  assert.ok(r.totalParcelado >= r.precoParcelado);
});

test("desconto no Pix", () => {
  const r = P.calcular(4300, { margemPct: 10, pixDescontoPct: 5, arredondamento: "inteiro" });
  assert.equal(r.precoPix, 4494); // 4730 × 0,95 = 4493,50 → 4494
  assert.equal(r.precoParcelado, 4730);
});

test("desconto no Pix nunca fica abaixo do custo", () => {
  const r = P.calcular(1000, { margemPct: 2, pixDescontoPct: 30 });
  assert.ok(r.precoPix >= 1000);
});

test("arredondamentos comerciais sempre para cima", () => {
  assert.equal(P.arredondar(4730.01, "inteiro"), 4731);
  assert.equal(P.arredondar(4730, "inteiro"), 4730);
  assert.equal(P.arredondar(4731, "dezena"), 4740);
  assert.equal(P.arredondar(4701, "centena"), 4800);
  assert.equal(P.arredondar(4730, "final_90"), 4739.9);
  assert.equal(P.arredondar(4739.95, "final_90"), 4749.9);
  assert.equal(P.arredondar(4739.9, "final_90"), 4739.9);
  assert.equal(P.arredondar(1234.561, "nenhum"), 1234.57);
});

test("parcela arredonda para cima nos centavos (total parcelado nunca menor que o preço)", () => {
  const r = P.calcular(1000, { margemPct: 0, parcelas: 3, arredondamento: "nenhum" });
  assert.equal(r.valorParcela, 333.34);
  assert.ok(r.totalParcelado >= r.precoParcelado);
});

test("regra do destino sobrepõe a padrão e campos vazios herdam", () => {
  const padrao = { margemPct: 10, parcelas: 10, arredondamento: "inteiro" };
  const japao = { margemPct: 12, parcelas: "", arredondamento: null };
  const r = P.calcular(10000, padrao, japao);
  assert.equal(r.precoBase, 11200);
  assert.equal(r.parcelas, 10);
});

test("nunca retorna preço menor que o custo, mesmo com margem zero", () => {
  const r = P.calcular(3999.99, { margemPct: 0, arredondamento: "inteiro" });
  assert.equal(r.precoBase, 4000);
  assert.ok(r.precoParcelado >= r.custo);
});

test("entradas inválidas geram erro claro", () => {
  assert.throws(() => P.calcular(0, {}), /maior que zero/);
  assert.throws(() => P.calcular("abc", {}), /inválido/);
  assert.throws(() => P.calcular(100, { parcelas: 0 }), /Parcelas/);
  assert.throws(() => P.calcular(100, { margemPct: -1 }), /negativa/);
  assert.throws(() => P.calcular(100, { modo: "xpto" }), /desconhecido/);
});

test("aceita valores digitados com vírgula (vindos do painel)", () => {
  const r = P.calcular("4300,00", { margemPct: "10" });
  assert.equal(r.precoBase, 4730);
});
