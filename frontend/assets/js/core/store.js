/* ==========================================================================
   Armazenamento da VERSÃO OFFLINE (demonstração)
   - Primeiro acesso: copia os dados de assets/js/seed.js
   - Alterações do painel ficam no localStorage deste navegador
     (site e painel abertos no mesmo navegador enxergam os mesmos dados)
   - Na versão online este módulo é trocado por chamadas ao Supabase
   ========================================================================== */
(function () {
  "use strict";
  var KEY = "cesamar.demo.v2";
  var SEED = window.CESAMAR_SEED;
  var cache = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function carregar() {
    if (cache) return cache;
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.geradoEm === SEED.geradoEm && s.versao === SEED.versao) { cache = s; return cache; }
    } catch (e) { /* armazenamento indisponível: segue com o seed em memória */ }
    cache = clone(SEED);
    ["metricas", "cliques", "logs", "pesquisas", "execucoes"].forEach(function (k) { cache[k] = cache[k] || []; });
    salvar(cache);
    return cache;
  }
  function salvar(db) {
    cache = db || cache;
    try { localStorage.setItem(KEY, JSON.stringify(cache)); return true; }
    catch (e) { return false; }
  }
  function resetar() { cache = null; try { localStorage.removeItem(KEY); } catch (e) { } return carregar(); }

  // ------------------------------------------------------------ consultas
  function destino(id) { return carregar().destinos.filter(function (d) { return d.id === id; })[0] || null; }
  function conteudo(id) { return carregar().conteudos.filter(function (c) { return c.destinoId === id; })[0] || null; }
  function imagens(id) {
    return carregar().imagens.filter(function (i) { return i.destinoId === id; }).sort(function (a, b) { return (b.principal ? 1 : 0) - (a.principal ? 1 : 0) || a.ordem - b.ordem; });
  }
  function imagemPrincipal(id) { var l = imagens(id); return l[0] || null; }
  function publicadas() { return carregar().ofertas.filter(function (o) { return o.status === "publicado"; }); }
  function oferta(codigo) { return carregar().ofertas.filter(function (o) { return o.codigo === codigo; })[0] || null; }
  function campanhasAtivas() { return carregar().campanhas.filter(function (c) { return c.ativa; }).sort(function (a, b) { return a.ordem - b.ordem; }); }
  function ofertasDaCampanha(campId) {
    return publicadas().filter(function (o) {
      var d = destino(o.destinoId);
      return o.campanhaId === campId || (d && (d.campanhas || []).indexOf(campId) >= 0);
    });
  }

  // ------------------------------------------------------------ métricas (sem dados pessoais)
  function registrar(tipo, dados) {
    var db = carregar();
    var ev = { id: "EV-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), tipo: tipo, ts: new Date().toISOString(),
      ofertaCodigo: dados.ofertaCodigo || null, destinoId: dados.destinoId || null, cidadeOrigem: dados.cidadeOrigem || null,
      campanhaId: dados.campanhaId || null, pagina: location.pathname.split("/").pop() || "index.html" };
    if (tipo === "whatsapp") db.cliques.unshift(ev); else db.metricas.unshift(ev);
    if (db.metricas.length > 5000) db.metricas.length = 5000;
    if (db.cliques.length > 5000) db.cliques.length = 5000;
    var o = ev.ofertaCodigo && oferta(ev.ofertaCodigo);
    if (o) {
      if (tipo === "visualizacao") o.visualizacoes = (o.visualizacoes || 0) + 1;
      if (tipo === "conhecer") o.conhecer = (o.conhecer || 0) + 1;
      if (tipo === "whatsapp") o.cliques = (o.cliques || 0) + 1;
    }
    salvar(db);
  }

  // ------------------------------------------------------------ WhatsApp
  var NOME_CIDADE = { SAO: "São Paulo", RIO: "Rio de Janeiro" };
  function brl(v) { return window.Cesamar.precos.brl(v); }
  function numeroWhats() { return String(carregar().config.whatsappNumero || "").replace(/\D/g, ""); }
  /** "a Itália", "o Japão", "Portugal", "Orlando" — usa o campo `artigo` do destino (editável). */
  function nomeComArtigo(d) {
    var nome = d.nomeExibicao || d.nome;
    return (d.artigo ? d.artigo + " " : "") + nome;
  }
  function mensagemOferta(o) {
    var d = destino(o.destinoId) || { nome: "" };
    return (carregar().config.whatsappMensagem || "")
      .replace("{codigo}", o.codigo).replace("{destino}", nomeComArtigo(d))
      .replace("{origem}", NOME_CIDADE[o.cidadeOrigem] || o.cidadeOrigem)
      .replace("{preco}", brl(o.preco.precoParcelado)).replace("{parcelas}", o.preco.parcelas).replace("{parcela}", brl(o.preco.valorParcela))
      .replace(/\bde Rio de Janeiro/g, "do Rio de Janeiro");
  }
  function linkWhats(texto) { return "https://wa.me/" + numeroWhats() + "?text=" + encodeURIComponent(texto); }
  function linkWhatsOferta(o) { return linkWhats(mensagemOferta(o)); }
  function linkWhatsGeral(texto) { return linkWhats(texto || carregar().config.whatsappMensagemGeral); }

  window.Cesamar = window.Cesamar || {};
  window.Cesamar.store = {
    carregar: carregar, salvar: salvar, resetar: resetar, destino: destino, conteudo: conteudo, imagens: imagens,
    imagemPrincipal: imagemPrincipal, publicadas: publicadas, oferta: oferta, campanhasAtivas: campanhasAtivas,
    ofertasDaCampanha: ofertasDaCampanha, registrar: registrar, mensagemOferta: mensagemOferta, nomeComArtigo: nomeComArtigo,
    linkWhatsOferta: linkWhatsOferta, linkWhatsGeral: linkWhatsGeral, NOME_CIDADE: NOME_CIDADE
  };
})();
