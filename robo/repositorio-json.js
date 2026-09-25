/* Armazenamento em arquivo JSON — para rodar o robô localmente e nos testes. */
"use strict";
const fs = require("fs"), path = require("path");

module.exports = function (env) {
  const arquivo = path.resolve(env.ROBO_ARQUIVO || path.join(__dirname, "dados", "banco.json"));
  return {
    async carregar() {
      if (fs.existsSync(arquivo)) return JSON.parse(fs.readFileSync(arquivo, "utf8"));
      const base = JSON.parse(JSON.stringify(require("../tools/seed-dados.js")));
      return Object.assign(base, { ofertas: [], pesquisas: [], logs: [], execucoes: [], cliques: [], metricas: [] });
    },
    async salvar(db) {
      fs.mkdirSync(path.dirname(arquivo), { recursive: true });
      fs.writeFileSync(arquivo, JSON.stringify(db, null, 1), "utf8");
      console.log("[robo] dados salvos em " + arquivo);
    },
  };
};
