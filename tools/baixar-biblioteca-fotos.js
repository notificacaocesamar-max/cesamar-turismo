/* Baixa somente fotos ausentes da biblioteca local.
   Uso: node tools/baixar-biblioteca-fotos.js */
"use strict";
const fs = require("fs"), path = require("path");
const B = require("./fotos-biblioteca.js");
const raiz = path.join(__dirname, "../frontend");
const fila = [];
Object.keys(B.catalogo).forEach((destinoId) => B.catalogo[destinoId].ids.forEach((id, indice) => {
  const rel = B.arquivo(destinoId, indice), destino = path.join(raiz, rel);
  if (!fs.existsSync(destino) || fs.statSync(destino).size < 10000) fila.push({ id, destino, rel });
}));

async function baixar(item) {
  fs.mkdirSync(path.dirname(item.destino), { recursive: true });
  const resposta = await fetch(B.download(item.id));
  if (!resposta.ok) throw new Error(item.id + ": HTTP " + resposta.status);
  fs.writeFileSync(item.destino, Buffer.from(await resposta.arrayBuffer()));
  console.log("ok", item.rel);
}

(async () => {
  for (let i = 0; i < fila.length; i += 6) await Promise.all(fila.slice(i, i + 6).map(baixar));
  console.log("Biblioteca pronta:", Object.keys(B.catalogo).length, "destinos,", B.imagens().length, "fotos catalogadas.");
})().catch((e) => { console.error(e); process.exit(1); });
