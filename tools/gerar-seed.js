/* Gera frontend/assets/js/seed.js rodando o robô com o provedor de DEMONSTRAÇÃO.
   Uso: node tools/gerar-seed.js [AAAA-MM-DD]
   As ofertas geradas ficam marcadas como "demonstrativo" (preços simulados). */
"use strict";
const fs = require("fs"), path = require("path");
const dados = require("./seed-dados.js");
const Robo = require("../frontend/assets/js/core/robo.js");
const Prov = require("../frontend/assets/js/core/provedores.js");

const dia = process.argv[2] || new Date().toISOString().slice(0, 10);
const agora = new Date(dia + "T09:00:00Z");
const db = JSON.parse(JSON.stringify(Object.assign({}, dados, { ofertas: [], pesquisas: [], logs: [], execucoes: [], metricas: [], cliques: [] })));
const regiaoPorIata = {}; db.destinos.forEach((d) => (regiaoPorIata[d.aeroporto] = d.regiao));
const provedor = Prov.criarProvedor("demo", { diaExecucao: dia, regiaoPorIata });

Robo.executar(db, { provedor, agora }).then((resumo) => {
  // Para a demonstração: 14 ofertas já aprovadas, as demais aguardando aprovação no painel
  db.ofertas.sort((a, b) => a.destinoId.localeCompare(b.destinoId));
  const deixarPendentes = ["alemanha", "turquia", "canada", "chile", "egito", "holanda"];
  db.ofertas.forEach((o) => {
    if (deixarPendentes.indexOf(o.destinoId) < 0) { o.status = "publicado"; o.publicadoEm = agora.toISOString(); o.aprovadoPor = "seed"; }
  });
  db.versao = 4; db.geradoEm = agora.toISOString();
  const out = "/* Dados de DEMONSTRAÇÃO gerados por tools/gerar-seed.js em " + dia + ".\n   Preços SIMULADOS pelo DemoProvider — não são tarifas reais. */\nwindow.CESAMAR_SEED = " + JSON.stringify(db) + ";\n";
  fs.writeFileSync(path.join(__dirname, "../frontend/assets/js/seed.js"), out, "utf8");
  console.log("seed.js ok:", resumo, "ofertas:", db.ofertas.length, "bytes:", out.length);
});
