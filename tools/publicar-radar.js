"use strict";
const fs = require("node:fs");
const path = require("node:path");
const Fontes = require("../radar/fontes.js");
const FontesCruzeiros = require("../radar/fontes-cruzeiros.js");
const criarRepositorioSupabase = require("../radar/repositorio-supabase.js");
const Precos = require("../frontend/assets/js/core/precos.js");

const ARQUIVO = path.join(__dirname, "..", "frontend", "assets", "js", "radar-publicado.js");
const MAPA = [
  [/\b(lisboa)\b/i, "portugal"], [/^porto$/i, "porto"], [/orlando|tampa/i, "orlando"],
  [/bariloche|buenos aires|cordoba|el calafate|mendoza|ushuaia|rosario|salta|jujuy/i, "argentina"],
  [/nova york|new york/i, "nova-york"], [/los angeles|calif[oó]rnia|hollywood/i, "california"],
  [/santiago|calama|copiapo/i, "chile"], [/madri|madrid|barcelona/i, "espanha"], [/paris/i, "franca"],
  [/roma|mil[aã]o|veneza/i, "italia"], [/canc[uú]n/i, "mexico"], [/t[oó]quio|tokyo|osaka/i, "japao"],
  [/foz do igua[cç]u/i, "foz-do-iguacu"], [/florian[oó]polis/i, "florianopolis"],
  [/macei[oó]/i, "maceio"], [/recife/i, "recife"], [/salvador/i, "salvador"], [/fortaleza/i, "fortaleza"],
  [/natal/i, "natal"], [/jo[aã]o pessoa/i, "joao-pessoa"], [/porto seguro/i, "porto-seguro"], [/manaus/i, "manaus"]
];
const REGRA = { modo: "acrescimo", margemPct: 10, margemMinimaReais: 250, taxasVariaveisPct: 0, custoFinanceiroPct: 0, parcelas: 10, arredondamento: "inteiro", pixDescontoPct: 0 };

function lerAnterior() {
  try { const t = fs.readFileSync(ARQUIVO, "utf8"); return JSON.parse(t.replace(/^window\.CESAMAR_RADAR\s*=\s*/, "").replace(/;\s*$/, "")); }
  catch (_) { return { atualizadoEm: null, ofertas: [] }; }
}
function destinoId(nome) { const x = MAPA.find(([re]) => re.test(nome)); return x ? x[1] : null; }
function diasEntre(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }
function codigo(chave) { return "RAD-" + Buffer.from(chave).toString("base64url").slice(0, 12).toUpperCase(); }

async function main(opcoes) {
  opcoes = opcoes || {};
  const agora = opcoes.agora || new Date(), iso = agora.toISOString();
  const anterior = opcoes.anterior || lerAnterior();
  const coletados = await Fontes.passagensImperdiveis({ fetch: opcoes.fetch, limite: process.env.RADAR_PI_LIMITE || 15, agora });
  const cruzeiros = await FontesCruzeiros.consultar({ fetch: opcoes.fetch, agora });
  const temSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const repo = opcoes.repo || (temSupabase ? criarRepositorioSupabase(process.env, opcoes.fetch) : null);
  if (repo) await repo.salvar(coletados);
  const candidatos = [];
  coletados.forEach((lead) => (lead.rotas || []).forEach((r) => {
    const destId = destinoId(r.destino); if (!destId) return;
    const chave = r.origem + "|" + destId + "|" + r.destino.toLowerCase();
    const preco = Precos.calcular(r.preco, REGRA);
    candidatos.push({ chave, codigo: codigo(chave), destinoId: destId, destinoNome: r.destino, cidadeOrigem: r.origem, custoOriginal: r.preco, preco, fonte: lead.fonte, fonteUrl: lead.url, pesquisadoEm: iso, expiraEm: new Date(agora.getTime() + 3 * 86400000).toISOString(), taxasInclusas: /c\/\s*taxas|com taxas/i.test(lead.titulo), status: "publicado_automaticamente" });
  }));
  const melhores = {}; candidatos.forEach((x) => { if (!melhores[x.chave] || x.custoOriginal < melhores[x.chave].custoOriginal) melhores[x.chave] = x; });
  const atuais = {};
  (anterior.ofertas || []).filter((x) => diasEntre(x.pesquisadoEm, iso) < 3 && destinoId(x.destinoNome) === x.destinoId).forEach((x) => { atuais[x.chave] = x; });
  Object.keys(melhores).forEach((k) => { if (!atuais[k] || melhores[k].custoOriginal < atuais[k].custoOriginal) atuais[k] = melhores[k]; });
  const saida = { atualizadoEm: iso, validadeDias: 3, ofertas: Object.values(atuais).sort((a, b) => a.preco.precoParcelado - b.preco.precoParcelado), cruzeiros };
  fs.writeFileSync(ARQUIVO, "window.CESAMAR_RADAR = " + JSON.stringify(saida) + ";\n", "utf8");
  console.log("[radar-publicador] " + coletados.length + " fontes aéreas; " + cruzeiros.length + " fontes de cruzeiro; " + saida.ofertas.length + " ofertas válidas por até 3 dias.");
  return saida;
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { main, destinoId };
