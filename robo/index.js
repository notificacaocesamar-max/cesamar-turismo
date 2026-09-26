/* ==========================================================================
   Robô diário da Cesamar (Node 20+) — roda no Google Cloud Run (Job),
   disparado 1x por dia pelo Cloud Scheduler. Também roda local:
       node robo/index.js                 (provedor demo + arquivo JSON)
   Variáveis: ver .env.example
   ========================================================================== */
"use strict";
const Robo = require("../frontend/assets/js/core/robo.js");
const Prov = require("../frontend/assets/js/core/provedores.js");

async function main(env) {
  const armazenamento = (env.ROBO_ARMAZENAMENTO || "json").toLowerCase();
  const repo = armazenamento === "supabase" ? require("./repositorio-supabase.js")(env) : require("./repositorio-json.js")(env);
  const db = await repo.carregar();
  const regiaoPorIata = {}; db.destinos.forEach((d) => (regiaoPorIata[d.aeroporto] = d.regiao));
  const hoje = new Date().toISOString().slice(0, 10);
  const provedor = Prov.criarProvedor(env.FLIGHT_PROVIDER || "demo", { env, diaExecucao: hoje, regiaoPorIata, falharEm: [] });
  console.log(`[robo] provedor=${provedor.nome} armazenamento=${armazenamento} regras=${db.regras.filter((r) => r.ativo).length}`);
  const resumo = await Robo.executar(db, {
    provedor,
    limiteConsultasInternacionais: +(env.ROBO_CONSULTAS_INTERNACIONAIS || 80),
    limiteConsultasNacionais: +(env.ROBO_CONSULTAS_NACIONAIS || 40),
  });
  await repo.salvar(db, resumo);
  console.log("[robo] resumo " + JSON.stringify(resumo));
  // Falha total (todas as regras com erro) sinaliza erro para o Cloud Run/Scheduler registrar
  return resumo.regras > 0 && resumo.erros >= resumo.regras ? 1 : 0;
}

if (require.main === module) {
  main(process.env).then((code) => process.exit(code)).catch((e) => { console.error("[robo] falha:", e); process.exit(1); });
}
module.exports = { main };
