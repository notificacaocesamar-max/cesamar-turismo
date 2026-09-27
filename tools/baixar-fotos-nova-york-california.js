"use strict";
const fs = require("fs"), path = require("path");

const grupos = {
  "nova-york": ["Manhattan skyline New York", "Times Square New York", "Statue of Liberty New York", "Central Park Bow Bridge", "Brooklyn Bridge New York"],
  california: ["Hollywood sign Los Angeles", "Griffith Observatory Los Angeles", "Santa Monica Pier California", "Downtown Los Angeles skyline skyscrapers", "Universal Studios Hollywood entrance"],
};

function limpo(s) { return String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim(); }
async function buscar(termo) {
  const p = new URLSearchParams({ action:"query", generator:"search", gsrnamespace:"6", gsrlimit:"15", gsrsearch:termo + " filetype:bitmap", prop:"imageinfo", iiprop:"url|extmetadata|mime", iiurlwidth:"1600", format:"json", origin:"*" });
  const json = await (await fetch("https://commons.wikimedia.org/w/api.php?" + p)).json();
  const palavras = termo.toLowerCase().split(/\s+/).filter(x => x.length > 3 && !/^(california|york)$/.test(x));
  const bloqueadas = /9-11|fire|pollution|diagram|map|logo|poster/i;
  const itens = Object.values((json.query || {}).pages || {}).filter(x => /^image\/jpeg$/.test(x.imageinfo?.[0]?.mime || "") && !bloqueadas.test(x.title)).sort((a,b) => {
    const ta=a.title.toLowerCase(), tb=b.title.toLowerCase();
    const sa=palavras.filter(p=>ta.includes(p)).length, sb=palavras.filter(p=>tb.includes(p)).length;
    return sb-sa;
  });
  if (!itens.length) throw new Error("Nenhuma fotografia encontrada para " + termo);
  const x = itens[0], info = x.imageinfo[0], meta = info.extmetadata || {};
  return { termo, titulo:x.title.replace(/^File:/,""), url:info.thumburl || info.url, fonte:info.descriptionurl, autor:limpo(meta.Artist?.value) || "Wikimedia Commons", licenca:limpo(meta.LicenseShortName?.value) || "Licença livre no Wikimedia Commons" };
}

(async function () {
  const manifesto = {};
  for (const [destino, termos] of Object.entries(grupos)) {
    const pasta = path.join(__dirname, "../frontend/assets/img/biblioteca", destino);
    fs.mkdirSync(pasta, { recursive:true }); manifesto[destino] = [];
    for (let i=0;i<termos.length;i++) {
      const foto = await buscar(termos[i]);
      await new Promise(r => setTimeout(r, 650));
      var resposta = await fetch(foto.url);
      if (resposta.status === 429) { await new Promise(r => setTimeout(r, 3500)); resposta = await fetch(foto.url); }
      if (!resposta.ok) throw new Error("Falha no download: " + resposta.status);
      fs.writeFileSync(path.join(pasta, String(i+1).padStart(2,"0") + ".jpg"), Buffer.from(await resposta.arrayBuffer()));
      manifesto[destino].push(foto); console.log(destino, i+1, foto.titulo);
    }
  }
  fs.writeFileSync(path.join(__dirname, "fotos-ny-la.json"), JSON.stringify(manifesto,null,2));
})();
