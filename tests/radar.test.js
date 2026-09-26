"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Fontes = require("../radar/fontes.js");

test("radar lê links promocionais e cria somente oportunidades pendentes", async () => {
  const lista = '<a href="/promocao-de-passagens-para-lisboa-2027-1/">Lisboa</a><a href="/api/privada">não</a>';
  const detalhe = '<meta property="og:title" content="Lisboa ida e volta por R$ 3.499,00"><meta property="og:description" content="Oferta saindo de São Paulo">';
  const fetchFake = async (url) => ({ ok: true, status: 200, text: async () => url.endsWith("promocoes-recentes/") ? lista : detalhe });
  const itens = await Fontes.passagensImperdiveis({ fetch: fetchFake, agora: new Date("2026-09-25T09:00:00Z") });
  assert.equal(itens.length, 1);
  assert.equal(itens[0].precoEncontrado, 3499);
  assert.equal(itens[0].status, "aguardando_confirmacao");
  assert.equal(itens[0].uso, "radar");
});

test("extrator ignora valores pequenos que não parecem passagem", () => {
  assert.equal(Fontes.extrairPreco("10x de R$ 49,90; total R$ 2.990,00").valor, 2990);
});
