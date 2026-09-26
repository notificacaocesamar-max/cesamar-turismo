"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Cruzeiros = require("../radar/fontes-cruzeiros.js");

test("radar de cruzeiros aplica exatamente 10% ao menor preço", async () => {
  const fetch = async () => ({ ok: true, text: async () => "Oferta por R$ 2.000 e outra por R$ 3.500" });
  const ofertas = await Cruzeiros.consultar({ fetch, agora: new Date("2026-09-26T12:00:00Z") });
  assert.ok(ofertas.length >= 2);
  ofertas.forEach((o) => { assert.equal(o.custo, 2000); assert.equal(o.precoFinal, 2200); assert.equal(o.margemPct, 10); });
});

test("fontes sem autorização ficam cadastradas sem consulta automática", () => {
  const restritas = Cruzeiros.FONTES.filter((x) => !x.automatizar).map((x) => x.nome);
  assert.ok(restritas.includes("CVC Cruzeiros"));
  assert.ok(restritas.includes("Decolar"));
  assert.ok(restritas.includes("Clube dos Cruzeiros"));
});
