"use strict";

const FONTES = [
  { nome: "MSC Cruzeiros", url: "https://www.msccruzeiros.com.br/ofertas", tipo: "oficial", automatizar: true },
  { nome: "Costa Cruzeiros", url: "https://www.costacruzeiros.com/cruzeiros-por-temporada/cruzeiros-verao.html", tipo: "oficial", automatizar: true },
  { nome: "Clube dos Cruzeiros", url: "https://www.clubedoscruzeiros.com.br/", tipo: "comparador", automatizar: false },
  { nome: "Melhores Destinos", url: "https://www.melhoresdestinos.com.br/promocao/cruzeiros", tipo: "radar editorial", automatizar: true },
  { nome: "CVC Cruzeiros", url: "https://www.cvc.com.br/cruzeiros", tipo: "agência", automatizar: false },
  { nome: "Decolar", url: "https://www.decolar.com/pacotes/cruzeiros", tipo: "agência", automatizar: false },
  { nome: "Cruzeiros.pt", url: "https://www.cruzeiros.pt/", tipo: "comparador", automatizar: false },
  { nome: "Logitravel", url: "https://www.logitravel.pt/cruzeiros/", tipo: "comparador", automatizar: false }
];

function texto(html) { return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
function menorPreco(html) {
  const valores = [...texto(html).matchAll(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/gi)]
    .map((m) => Number(m[1].replace(/\./g, "").replace(",", ".")))
    .filter((n) => n >= 500 && n <= 100000);
  return valores.length ? Math.min(...valores) : null;
}
async function consultar(opcoes) {
  const fetchFn = opcoes.fetch || fetch, agora = (opcoes.agora || new Date()).toISOString(), saida = [];
  for (const fonte of FONTES.filter((x) => x.automatizar)) {
    try {
      const r = await fetchFn(fonte.url, { headers: { "user-agent": opcoes.userAgent || "CesamarRadar/1.0", accept: "text/html" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const html = await r.text(), custo = menorPreco(html);
      saida.push({ ...fonte, custo, precoFinal: custo ? Math.round(custo * 1.10) : null, margemPct: 10, pesquisadoEm: agora, expiraEm: new Date(new Date(agora).getTime() + 3 * 86400000).toISOString(), status: custo ? "encontrada" : "sem_preco_estruturado" });
    } catch (e) { saida.push({ ...fonte, custo: null, margemPct: 10, pesquisadoEm: agora, status: "erro", erro: e.message }); }
  }
  return saida;
}

module.exports = { FONTES, consultar, menorPreco };
