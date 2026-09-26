"use strict";
const Fontes = require("./fontes.js");
const criarRepositorio = require("./repositorio-supabase.js");

async function main(env, deps) {
  deps = deps || {};
  const itens = await Fontes.passagensImperdiveis({ fetch: deps.fetch, limite: env.RADAR_PI_LIMITE || 15 });
  const repo = deps.repo || criarRepositorio(env, deps.fetch);
  await repo.salvar(itens);
  const validos = itens.filter((x) => x.status === "aguardando_confirmacao");
  console.log("[radar] Passagens Imperdíveis: " + validos.length + " oportunidades; nenhuma publicada automaticamente.");
  return { encontrados: validos.length, erros: itens.length - validos.length };
}

if (require.main === module) main(process.env).catch((e) => { console.error("[radar] falha:", e); process.exit(1); });
module.exports = { main };
