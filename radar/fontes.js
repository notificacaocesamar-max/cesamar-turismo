"use strict";
const crypto = require("node:crypto");

const BASE_PI = "https://passagensimperdiveis.com.br";

function limpar(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function meta(html, propriedade) {
  const re = new RegExp('<meta[^>]+(?:property|name)=["\\\']' + propriedade + '["\\\'][^>]+content=["\\\']([^"\\\']+)', "i");
  const inversa = new RegExp('<meta[^>]+content=["\\\']([^"\\\']+)["\\\'][^>]+(?:property|name)=["\\\']' + propriedade + '["\\\']', "i");
  return limpar((html.match(re) || html.match(inversa) || [])[1]);
}
function id(url) { return "PI-" + crypto.createHash("sha256").update(url).digest("hex").slice(0, 20); }
function extrairPreco(texto) {
  const achados = [...String(texto).matchAll(/R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/g)].map((m) => ({ texto: m[0], valor: Number(m[1].replace(/\./g, "").replace(",", ".")) }));
  const validos = achados.filter((x) => x.valor >= 100 && x.valor <= 100000);
  validos.sort((a, b) => a.valor - b.valor);
  return validos[0] || null;
}
function extrairRotas(texto) {
  const limpo = limpar(texto), rotas = [], vistos = {};
  const re = /(São Paulo|Rio de Janeiro|Campinas\s*\/\s*SP)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '\/-]{1,45}?)\s+A partir de R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/gi;
  for (const m of limpo.matchAll(re)) {
    const origem = /Rio/i.test(m[1]) ? "RIO" : "SAO";
    const destino = limpar(m[2]);
    const preco = Number(m[3].replace(/\./g, "").replace(",", "."));
    const chave = origem + "|" + destino.toLowerCase();
    if (preco >= 100 && preco <= 100000 && (!vistos[chave] || preco < vistos[chave].preco)) vistos[chave] = { origem, destino, preco };
  }
  Object.keys(vistos).forEach((k) => rotas.push(vistos[k]));
  return rotas;
}

async function obter(fetchFn, url, agente) {
  const r = await fetchFn(url, { headers: { "user-agent": agente, accept: "text/html,application/xhtml+xml" } });
  if (!r.ok) throw new Error("HTTP " + r.status + " em " + url);
  return r.text();
}

async function passagensImperdiveis(opcoes) {
  const fetchFn = opcoes.fetch || fetch;
  const agente = opcoes.userAgent || "CesamarRadar/1.0";
  const limite = Math.max(1, Math.min(30, +(opcoes.limite || 15)));
  const lista = await obter(fetchFn, BASE_PI + "/promocoes-recentes/", agente);
  const links = [...lista.matchAll(/href=["']([^"']*(?:promocao-de-passagens|passagens-nacionais-em-promocao)[^"']*)["']/gi)]
    .map((m) => new URL(m[1], BASE_PI).href);
  const unicos = [...new Set(links)].slice(0, limite), agora = (opcoes.agora || new Date()).toISOString(), saida = [];
  for (const url of unicos) {
    try {
      const html = await obter(fetchFn, url, agente);
      const textoPagina = limpar(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
      const titulo = meta(html, "og:title") || limpar((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
      const descricao = meta(html, "og:description") || meta(html, "description");
      const preco = extrairPreco(titulo + " " + descricao + " " + limpar(html));
      saida.push({
        id: id(url), fonte: "Passagens Imperdíveis", url, titulo,
        precoEncontrado: preco ? preco.valor : null, precoTexto: preco ? preco.texto : null,
        capturadoEm: agora, status: "aguardando_confirmacao", uso: "radar",
        rotas: extrairRotas(textoPagina),
        observacao: "Preço divulgado por terceiro; disponibilidade deve ser confirmada no fornecedor."
      });
    } catch (e) {
      saida.push({ id: id(url), fonte: "Passagens Imperdíveis", url, titulo: "Falha ao consultar oportunidade", capturadoEm: agora, status: "erro", uso: "radar", observacao: e.message });
    }
  }
  return saida;
}

module.exports = { passagensImperdiveis, extrairPreco, extrairRotas, limpar };
