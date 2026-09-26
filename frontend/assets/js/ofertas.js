/* ==========================================================================
   Ofertas de passagem aérea — home, listagem e landing page da oferta.
   Dados: Cesamar.store (versão offline). Preços já vêm calculados pelo robô.
   Regras de exibição: sempre total + parcela, aviso junto ao preço,
   tipo do preço identificado, nunca "pacote" para oferta só de passagem.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.Cesamar, ST = C.store, P = C.precos, icon = C.icon, ROOT = C.ROOT;
  var PAGE = document.body.getAttribute("data-page");
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var TIPO = { ao_vivo: ["Preço ao vivo", "tp-live"], indicativo: ["Preço indicativo", "tp-ind"], manual: ["Oferta preparada manualmente", "tp-man"], demonstrativo: ["Conteúdo demonstrativo", "tp-demo"], radar: ["Oferta encontrada pelo robô", "tp-live"] };
  var CLASSE = { economica: "Econômica", premium: "Premium economy", executiva: "Executiva" };

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function brl(v) { return P.brl(v); }
  function dataBR(s) { var p = s.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function dataLonga(s) { var p = s.split("-"); return +p[2] + " de " + MESES[+p[1] - 1] + " de " + p[0]; }
  function params() { var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o; }
  function db() { return ST.carregar(); }
  function aeroNome(iata) { var a = db().aeroportos.filter(function (x) { return x.iata === iata; })[0]; return a ? iata + " — " + a.nome + (a.origem ? "" : ", " + a.cidade) : iata; }
  function escalas(n) { return n === 0 ? "Voo direto" : n + (n === 1 ? " escala" : " escalas"); }
  function dataCurta(s) { var p = String(s || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] : "Data a confirmar"; }
  function origemReal(o) {
    var a = db().aeroportos.filter(function (x) { return x.iata === o.aeroportoOrigem; })[0];
    return a ? a.cidade + " (" + a.iata + ")" : (o.aeroportoOrigem || o.cidadeOrigem || "Origem a confirmar");
  }
  function horarioPesquisa(o) {
    if (!o.pesquisadoEm) return "Preço pesquisado recentemente. Tarifas podem mudar a qualquer momento.";
    var dt = new Date(o.pesquisadoEm), data = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(dt);
    var hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false }).format(dt).replace(":00", "h").replace(":", "h");
    var hoje = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(new Date());
    return "Preço encontrado " + (data === hoje ? "hoje" : "em " + data) + " às " + hora + ". Tarifas podem mudar a qualquer momento.";
  }
  function fatosCard(o) {
    var maxEscalas = Math.max(Number(o.escalasIda || 0), Number(o.escalasVolta || 0));
    var taxas = o.taxasInclusas === true ? "Taxas incluídas" : o.taxasInclusas === false ? "Taxas não incluídas" : "Taxas a confirmar";
    return '<ul class="ad-facts" aria-label="Informações da passagem">' +
      '<li>' + icon("calendar") + '<span>' + dataCurta(o.dataIda) + "–" + dataCurta(o.dataVolta) + "</span></li>" +
      '<li>' + icon("pin") + '<span>' + esc(origemReal(o)) + "</span></li>" +
      '<li>' + icon("route") + '<span>' + escalas(maxEscalas) + "</span></li>" +
      '<li>' + icon("bag") + '<span>' + (o.bagagem ? "Mala despachada incluída" : "Somente bagagem de mão") + "</span></li>" +
      '<li>' + icon("check") + '<span>' + taxas + "</span></li></ul>";
  }
  function aviso() { return esc(db().config.avisoPreco); }
  function tipoTag(o) { var t = TIPO[o.tipoPreco] || TIPO.demonstrativo; return '<span class="tag tp ' + t[1] + '">' + t[0] + "</span>"; }
  function urlOferta(o) { return ROOT + "pages/oferta.html?codigo=" + encodeURIComponent(o.codigo); }
  function imagensOferta(destinoId, oferta) {
    var todas = ST.imagens(destinoId).filter(function (i) {
      return !i.aeroportos || !i.aeroportos.length || (oferta && i.aeroportos.indexOf(oferta.aeroportoDestino) >= 0);
    }), mes = oferta && oferta.dataIda ? +oferta.dataIda.slice(5, 7) : 0;
    return todas.slice().sort(function (a, b) {
      var aSazonal = mes && (a.meses || []).indexOf(mes) >= 0 ? 1 : 0;
      var bSazonal = mes && (b.meses || []).indexOf(mes) >= 0 ? 1 : 0;
      var aReal = a.demonstrativa === false ? 1 : 0, bReal = b.demonstrativa === false ? 1 : 0;
      return bSazonal - aSazonal || bReal - aReal || (b.principal ? 1 : 0) - (a.principal ? 1 : 0) || a.ordem - b.ordem;
    });
  }
  function img(destinoId, oferta) { var i = imagensOferta(destinoId, oferta)[0]; return i ? { src: ROOT + i.url, alt: i.alt } : { src: "", alt: "" }; }
  function radarAtivas() {
    var agora = Date.now(), dados = window.CESAMAR_RADAR || { ofertas: [] };
    return (dados.ofertas || []).filter(function (o) { return o.status === "publicado_automaticamente" && new Date(o.expiraEm).getTime() > agora && ST.destino(o.destinoId); });
  }

  /* ------------------------------------------------------------ bloco de preço (total + parcela + aviso) */
  function precoHTML(o, grande) {
    var p = o.preco;
    return '<div class="ad-price' + (grande ? " ad-price--lg" : "") + '">' +
      "<small>A partir de</small><b>" + brl(p.precoParcelado).replace("R$ ", "<sup>R$</sup>") + '</b><span class="per">por pessoa</span>' +
      '<span class="parc">ou ' + p.parcelas + "x de " + brl(p.valorParcela) + (p.jurosTexto ? " " + esc(p.jurosTexto) : "") + "</span>" +
      (p.precoPix && p.precoPix < p.precoParcelado ? '<span class="pix">' + brl(p.precoPix) + " no Pix</span>" : "") +
      (p.entradaTexto ? '<span class="cond">' + esc(p.entradaTexto) + "</span>" : "") +
      "</div>";
  }

  /* ------------------------------------------------------------ card de anúncio */
  function cardOferta(o, opts) {
    opts = opts || {};
    var d = ST.destino(o.destinoId) || {}, im = img(o.destinoId, o);
    var camp = opts.campanha ? db().campanhas.filter(function (c) { return c.id === opts.campanha; })[0] : null;
    return '<article class="ad reveal" data-codigo="' + esc(o.codigo) + '">' +
      '<a class="ad-media" href="' + urlOferta(o) + '" data-conhecer tabindex="-1" aria-hidden="true"><img src="' + im.src + '" alt="" loading="lazy">' +
      '<div class="ad-tags">' + tipoTag(o) + (opts.selo ? '<span class="tag tag--sun">' + esc(opts.selo) + "</span>" : "") + (camp ? '<span class="tag tag--glass">' + esc(camp.nome) + "</span>" : "") + "</div>" +
      '<span class="ad-code">' + esc(o.codigo) + "</span></a>" +
      '<div class="ad-body"><span class="ad-kicker">Passagem de ida e volta · ' + esc(d.cidade) + "</span>" +
      '<h3><a href="' + urlOferta(o) + '" data-conhecer>' + esc(o.titulo) + "</a></h3>" +
      '<p class="ad-sub">' + esc(o.subtitulo) + "</p>" +
      fatosCard(o) +
      precoHTML(o) +
      '<p class="ad-note">' + aviso() + "</p>" +
      '<p class="ad-fresh">' + icon("clock") + '<span>' + esc(horarioPesquisa(o)) + "</span></p>" +
      '<div class="ad-actions"><a class="btn btn--ink" href="' + urlOferta(o) + '" data-conhecer>Conhecer esta oportunidade</a>' +
      '<a class="btn btn--wa" href="' + ST.linkWhatsOferta(o) + '" target="_blank" rel="noopener" data-wa-oferta="' + esc(o.codigo) + '">' + icon("whatsapp") + "Falar com um consultor</a></div>" +
      "</div></article>";
  }

  function cardRadar(o) {
    var d = ST.destino(o.destinoId) || {}, im = img(o.destinoId, o);
    var origem = o.cidadeOrigem === "RIO" ? "Rio de Janeiro" : "São Paulo";
    return '<article class="ad reveal" data-codigo="' + esc(o.codigo) + '">' +
      '<a class="ad-media" href="' + esc(o.fonteUrl) + '" target="_blank" rel="noopener nofollow"><img src="' + im.src + '" alt="" loading="lazy"><div class="ad-tags">' + tipoTag({ tipoPreco: "radar" }) + '<span class="tag tag--sun">Atualização automática</span></div><span class="ad-code">' + esc(o.codigo) + '</span></a>' +
      '<div class="ad-body"><span class="ad-kicker">Passagem de ida e volta · ' + esc(o.destinoNome) + '</span><h3>' + esc(o.destinoNome) + ' saindo de ' + esc(origem) + '</h3>' +
      '<p class="ad-sub">Oferta encontrada pelo robô e publicada automaticamente.</p>' +
      '<ul class="ad-facts" aria-label="Informações disponíveis"><li>' + icon("calendar") + '<span>Datas disponíveis na fonte</span></li><li>' + icon("pin") + '<span>Saindo de ' + esc(origem) + '</span></li><li>' + icon("route") + '<span>Escalas a confirmar</span></li><li>' + icon("bag") + '<span>Bagagem a confirmar</span></li><li>' + icon("check") + '<span>' + (o.taxasInclusas ? "Taxas incluídas" : "Taxas a confirmar") + '</span></li></ul>' +
      precoHTML(o) + '<p class="ad-note">Valor por pessoa, sujeito a alteração e disponibilidade na fonte. Consulte datas, bagagem e condições antes da compra.</p>' +
      '<p class="ad-fresh">' + icon("clock") + '<span>' + esc(horarioPesquisa(o)) + ' Oferta válida no portal por até 3 dias.</span></p>' +
      '<div class="ad-actions"><a class="btn btn--ink" href="' + esc(o.fonteUrl) + '" target="_blank" rel="noopener nofollow">Ver oferta original</a></div></div></article>';
  }

  /* ------------------------------------------------------------ métricas (cliques) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    var card = a.closest("[data-codigo]"), cod = a.getAttribute("data-wa-oferta") || (card && card.getAttribute("data-codigo"));
    var o = cod ? ST.oferta(cod) : null;
    var base = o ? { ofertaCodigo: o.codigo, destinoId: o.destinoId, cidadeOrigem: o.cidadeOrigem, campanhaId: o.campanhaId } : {};
    if (a.href && a.href.indexOf("wa.me/") >= 0) ST.registrar("whatsapp", base);
    else if (a.hasAttribute("data-conhecer") && o) ST.registrar("conhecer", base);
  }, true);

  /* ------------------------------------------------------------ bloco parcelamento */
  function blocoParcelamento() {
    var p = db().config.parcelamento || {};
    return '<div class="parc-box reveal"><div class="parc-ico">' + icon("calendar") + "</div><div><h2>" + esc(p.titulo) + "</h2><p>" + esc(p.texto) + "</p>" +
      (p.condicoes ? '<p class="parc-cond">' + esc(p.condicoes) + "</p>" : "") + "</div>" +
      '<a class="btn btn--wa" href="' + ST.linkWhatsGeral("Olá! Quero conhecer as condições de parcelamento para uma viagem.") + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Consultar condições</a></div>";
  }

  function revelar(scope) {
    $$(".reveal:not(.in)", scope).forEach(function (el, i) {
      el.style.setProperty("--d", (i % 4) * 0.07 + "s");
      if ("IntersectionObserver" in window) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { el.classList.add("in"); ob.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" }).observe(el);
      else el.classList.add("in");
    });
  }

  /* ============================================================ HOME */
  function home() {
    // seletor de destino ou categoria
    var f = $("#busca-ofertas");
    if (f) {
      var dests = db().destinos.filter(function (d) { return d.ativo; }).sort(function (a, b) { return (a.nomeExibicao || a.nome).localeCompare(b.nomeExibicao || b.nome); });
      f.elements.alvo.innerHTML = '<option value="">Todas as oportunidades</option><optgroup label="Categorias">' +
        ST.campanhasAtivas().map(function (c) { return '<option value="categoria:' + c.id + '">' + esc(c.nome) + "</option>"; }).join("") +
        '</optgroup><optgroup label="Destinos">' + dests.map(function (d) { return '<option value="destino:' + d.id + '">' + esc(d.nomeExibicao || d.nome) + "</option>"; }).join("") + "</optgroup>";
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = new URLSearchParams(), v = f.elements.alvo.value;
        if (v) q.set(v.split(":")[0], v.split(":")[1]);
        if (f.elements.origem.value) q.set("origem", f.elements.origem.value);
        location.href = ROOT + "pages/ofertas.html" + (q.toString() ? "?" + q : "");
      });
    }
    // Lisboa e Porto são o carro-chefe. Os demais entram no destaque apenas
    // quando o preço publicado está abaixo do teto editorial do destino.
    var pub = ST.publicadas().slice().sort(function (a, b) { return a.preco.precoParcelado - b.preco.precoParcelado; });
    var tetos = { orlando: 4000, argentina: 1800, chile: 2500, franca: 4300, italia: 4200, espanha: 3900, mexico: 3800, japao: 7500, china: 6000, "coreia-do-sul": 6500, australia: 7500, "africa-do-sul": 5000 };
    var principais = ["portugal", "porto"].map(function (id) { return pub.filter(function (o) { return o.destinoId === id; })[0]; }).filter(Boolean);
    var imperdiveis = pub.filter(function (o) { return principais.indexOf(o) < 0 && tetos[o.destinoId] && o.preco.precoParcelado <= tetos[o.destinoId]; })
      .sort(function (a, b) { return (a.preco.precoParcelado / tetos[a.destinoId]) - (b.preco.precoParcelado / tetos[b.destinoId]); }).slice(0, 4);
    var g = $("#grid-destaques");
    if (g) {
      var radar = radarAtivas().slice(0, 4), destaques = principais.concat(imperdiveis).slice(0, Math.max(2, 6 - radar.length));
      g.innerHTML = destaques.map(function (o) { return cardOferta(o, { selo: (o.destinoId === "portugal" || o.destinoId === "porto") ? "Destaque Portugal" : "Oferta imperdível" }); }).join("") + radar.map(cardRadar).join("");
    }
    // seções por campanha (ordem definida no painel)
    var box = $("#secoes-campanhas");
    if (box) {
      box.innerHTML = ST.campanhasAtivas().map(function (c, i) {
        var lista = ST.ofertasDaCampanha(c.id).sort(function (a, b) { return a.preco.precoParcelado - b.preco.precoParcelado; });
        var semOferta = db().destinos.filter(function (d) { return (d.campanhas || []).indexOf(c.id) >= 0 && !lista.some(function (o) { return o.destinoId === d.id; }); });
        if (!lista.length && !semOferta.length) return "";
        return '<section class="section camp' + (i % 2 ? " section--paper" : "") + '" id="cat-' + c.id + '" aria-labelledby="t-' + c.id + '"><div class="wrap">' +
          '<div class="section-head"><div><span class="eyebrow">' + esc(c.nome) + '</span><h2 id="t-' + c.id + '">' + esc(c.titulo) + '</h2><p class="lead">' + esc(c.texto) + "</p></div>" +
          '<a class="link-arrow" href="' + ROOT + "pages/ofertas.html?categoria=" + c.id + '">Ver todas ' + icon("arrow") + "</a></div>" +
          '<div class="rail ad-rail">' + lista.map(function (o) { return cardOferta(o, { campanha: c.id }); }).join("") +
          semOferta.slice(0, 3).map(function (d) { return cardConsulta(d, c); }).join("") + "</div></div></section>";
      }).join("");
    }
    var pb = $("#bloco-parcelamento"); if (pb) pb.innerHTML = blocoParcelamento();
    revelar(document);
  }

  /** Destino da campanha sem oferta publicada: convida a consultar (sem preço inventado). */
  function cardConsulta(d, c) {
    var im = img(d.id), txt = "Olá! Tenho interesse em uma viagem para " + ST.nomeComArtigo(d) + (c ? " (" + c.nome + ")" : "") + ". Pode me ajudar?";
    return '<article class="ad ad--consulta reveal"><div class="ad-media"><img src="' + im.src + '" alt="" loading="lazy"><div class="ad-tags"><span class="tag tag--glass">Sob consulta</span></div></div>' +
      '<div class="ad-body"><span class="ad-kicker">' + esc(d.cidade) + "</span><h3>" + esc(d.nomeExibicao || d.nome) + '</h3><p class="ad-sub">Ainda sem oferta publicada para este destino.</p>' +
      '<div class="ad-actions"><a class="btn btn--wa" href="' + ST.linkWhatsGeral(txt) + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Consultar datas e valores</a></div></div></article>";
  }

  /* ============================================================ LISTAGEM */
  function listagem() {
    var q = params(), f = $("#filtros-ofertas"), grid = $("#grid-ofertas");
    var dests = db().destinos.filter(function (d) { return d.ativo; });
    f.elements.categoria.innerHTML = '<option value="">Todas as categorias</option>' + ST.campanhasAtivas().map(function (c) { return '<option value="' + c.id + '">' + esc(c.nome) + "</option>"; }).join("");
    f.elements.destino.innerHTML = '<option value="">Todos os destinos</option>' + dests.sort(function (a, b) { return (a.nomeExibicao || a.nome).localeCompare(b.nomeExibicao || b.nome); }).map(function (d) { return '<option value="' + d.id + '">' + esc(d.nomeExibicao || d.nome) + "</option>"; }).join("");
    var regioes = []; dests.forEach(function (d) { if (regioes.indexOf(d.regiao) < 0) regioes.push(d.regiao); });
    f.elements.regiao.innerHTML = '<option value="">Todas as regiões</option>' + regioes.map(function (r) { return "<option>" + esc(r) + "</option>"; }).join("");
    ["categoria", "destino", "origem", "regiao"].forEach(function (k) { if (q[k]) f.elements[k].value = q[k]; });
    var meses = {}; ST.publicadas().forEach(function (o) { meses[o.dataIda.slice(0, 7)] = 1; });
    f.elements.mes.innerHTML = '<option value="">Qualquer mês</option>' + Object.keys(meses).sort().map(function (m) { return '<option value="' + m + '">' + MESES[+m.slice(5) - 1].replace(/^./, function (c) { return c.toUpperCase(); }) + " de " + m.slice(0, 4) + "</option>"; }).join("");

    function render() {
      var v = { cat: f.elements.categoria.value, dest: f.elements.destino.value, orig: f.elements.origem.value, reg: f.elements.regiao.value, mes: f.elements.mes.value, ord: f.elements.ordem.value };
      var lista = ST.publicadas().filter(function (o) {
        var d = ST.destino(o.destinoId) || {};
        return (!v.cat || o.campanhaId === v.cat || (d.campanhas || []).indexOf(v.cat) >= 0) && (!v.dest || o.destinoId === v.dest) &&
          (!v.orig || o.cidadeOrigem === v.orig) && (!v.reg || d.regiao === v.reg) && (!v.mes || o.dataIda.slice(0, 7) === v.mes);
      });
      lista.sort(function (a, b) {
        if (v.ord === "data") return a.dataIda.localeCompare(b.dataIda);
        if (v.ord === "recentes") return b.pesquisadoEm.localeCompare(a.pesquisadoEm);
        return a.preco.precoParcelado - b.preco.precoParcelado;
      });
      var radar = radarAtivas().filter(function (o) { var d = ST.destino(o.destinoId) || {}; return (!v.dest || o.destinoId === v.dest) && (!v.orig || o.cidadeOrigem === v.orig) && (!v.reg || d.regiao === v.reg) && !v.mes && !v.cat; });
      grid.innerHTML = radar.map(cardRadar).join("") + lista.map(function (o) { return cardOferta(o, { campanha: v.cat || null }); }).join("") +
        '<article class="ad ad--consulta ad--cta"><div class="ad-body"><span class="eyebrow">Atendimento personalizado</span><h3>' + (lista.length ? "Não achou a data ideal?" : "Nenhuma oferta com esses filtros agora.") +
        '</h3><p class="ad-sub">Um consultor procura a melhor combinação de datas, origem e preço para você.</p><div class="ad-actions"><a class="btn btn--wa" href="' + ST.linkWhatsGeral() + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Falar com um consultor</a></div></div></article>";
      var total = lista.length + radar.length;
      $("#count-ofertas").textContent = total + (total === 1 ? " oportunidade publicada" : " oportunidades publicadas");
      var cat = v.cat && db().campanhas.filter(function (c) { return c.id === v.cat; })[0];
      var intro = $("#intro-categoria");
      intro.hidden = !cat;
      if (cat) intro.innerHTML = "<b>" + esc(cat.nome) + ".</b> " + esc(cat.texto);
      var u = new URLSearchParams(); if (v.cat) u.set("categoria", v.cat); if (v.dest) u.set("destino", v.dest); if (v.orig) u.set("origem", v.orig);
      history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : ""));
      revelar(grid);
    }
    f.addEventListener("change", render);
    $("#limpar-ofertas").addEventListener("click", function () { f.reset(); render(); });
    render();
    var pb = $("#bloco-parcelamento"); if (pb) pb.innerHTML = blocoParcelamento();
  }

  /* ============================================================ LANDING DA OFERTA */
  function landing() {
    var q = params(), o = ST.oferta(q.codigo || ""), box = $("#oferta");
    var preview = q.preview === "1";
    if (!o || (o.status !== "publicado" && !preview)) {
      box.innerHTML = '<section class="section" style="padding-top:calc(var(--header-h) + 80px)"><div class="wrap"><span class="eyebrow">Oferta indisponível</span><h1>Esta oportunidade não está mais no ar</h1>' +
        '<p class="lead">Os preços de passagens mudam todos os dias. Veja as ofertas atuais ou peça ao consultor uma nova cotação' + (q.codigo ? " (código " + esc(q.codigo) + ")" : "") + '.</p>' +
        '<div class="hero-ctas"><a class="btn btn--ink" href="ofertas.html">Ver ofertas atuais</a><a class="btn btn--wa" href="' + ST.linkWhatsGeral("Olá! Vi a oferta " + (q.codigo || "") + " no site e gostaria de uma nova cotação.") + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Falar com um consultor</a></div></div></section>";
      return;
    }
    var d = ST.destino(o.destinoId) || {}, ct = ST.conteudo(o.destinoId) || { motivos: [], faq: [] }, imgs = imagensOferta(o.destinoId, o).slice(0, 5);
    var camp = o.campanhaId && db().campanhas.filter(function (c) { return c.id === o.campanhaId; })[0];
    var wa = ST.linkWhatsOferta(o), p = o.preco;
    document.title = o.titulo + " · " + o.codigo + " · Cesamar Turismo";
    if (!preview) ST.registrar("visualizacao", { ofertaCodigo: o.codigo, destinoId: o.destinoId, cidadeOrigem: o.cidadeOrigem, campanhaId: o.campanhaId });
    var pesq = new Date(o.pesquisadoEm);
    var info = [
      ["Origem", ST.NOME_CIDADE[o.cidadeOrigem]], ["Destino", d.cidade + ", " + d.nome],
      ["Aeroporto de partida", aeroNome(o.aeroportoOrigem)], ["Aeroporto de chegada", aeroNome(o.aeroportoDestino)],
      ["Data de ida", dataBR(o.dataIda)], ["Data de volta", dataBR(o.dataVolta)],
      ["Companhia", o.companhia], ["Escalas", "Ida: " + escalas(o.escalasIda) + " · Volta: " + escalas(o.escalasVolta)],
      ["Classe", CLASSE[o.classe] || o.classe], ["Bagagem", o.bagagem ? "Bagagem despachada incluída" : "Apenas bagagem de mão (despachada à parte)"],
      ["Preço por pessoa", brl(p.precoParcelado)], ["Valor total (1 adulto)", brl(p.precoParcelado)],
      ["Parcelamento", p.parcelas + "x de " + brl(p.valorParcela) + (p.jurosTexto ? " " + p.jurosTexto : "")],
      ["Pesquisado em", pesq.toLocaleDateString("pt-BR") + " às " + pesq.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })],
      ["Código da oferta", o.codigo]
    ];
    box.innerHTML =
      (preview && o.status !== "publicado" ? '<div class="preview-bar">Pré-visualização · status: <b>' + esc(o.status.replace(/_/g, " ")) + "</b> · esta página não está visível ao público</div>" : "") +
      '<section class="lp-hero"><img class="bg" src="' + ROOT + imgs[0].url + '" alt="' + esc(imgs[0].alt) + '"><div class="wrap lp-hero-grid">' +
      '<div><nav class="crumbs" aria-label="Você está em"><a href="' + ROOT + 'index.html">Início</a><span aria-hidden="true">/</span><a href="ofertas.html">Ofertas</a><span aria-hidden="true">/</span><span>' + esc(o.codigo) + "</span></nav>" +
      '<div class="lp-tags">' + tipoTag(o) + (camp ? '<span class="tag tag--glass">' + esc(camp.nome) + "</span>" : "") + '<span class="tag tag--glass">' + esc(o.codigo) + "</span></div>" +
      "<h1>" + esc(ct.tituloEmocional || o.titulo) + '</h1><p class="lp-sub">' + esc(o.titulo) + " · " + esc(o.subtitulo) + "</p></div>" +
      '<aside class="lp-price">' + precoHTML(o, true) + '<p class="ad-note">' + aviso() + '</p><p class="ad-cta-text">' + esc(o.chamada) + "</p>" +
      '<a class="btn btn--wa btn--block" href="' + wa + '" target="_blank" rel="noopener" data-wa-oferta="' + esc(o.codigo) + '">' + icon("whatsapp") + "Falar com um consultor</a>" +
      '<a class="btn btn--ghost btn--block" href="#passagem">Ver detalhes da passagem</a></aside></div></section>' +

      '<section class="section" style="padding-top:60px"><div class="wrap"><div class="lp-gallery">' +
      imgs.map(function (im, i) { return '<button class="lp-g' + (i === 0 ? " lp-g--main" : "") + '" data-i="' + i + '" aria-label="Ampliar imagem ' + (i + 1) + '"><img src="' + ROOT + im.url + '" alt="' + esc(im.alt) + '" loading="lazy"><span class="lp-credit">' + esc(im.credito) + "</span></button>"; }).join("") +
      "</div></div></section>" +

      '<section class="section" style="padding-top:0"><div class="wrap split" style="align-items:start"><div>' +
      '<span class="eyebrow">Por que ir</span><h2>' + esc(o.titulo) + '</h2><p class="lead">' + esc(ct.texto) + "</p>" +
      (camp ? '<blockquote class="lp-quote">' + esc(camp.texto) + "</blockquote>" : "") + "</div>" +
      '<ul class="lp-reasons">' + (ct.motivos || []).map(function (m, i) { return '<li class="reveal"><span>' + String(i + 1).padStart(2, "0") + "</span>" + esc(m) + "</li>"; }).join("") + "</ul></div></section>" +

      '<section class="section section--paper" id="passagem"><div class="wrap split" style="align-items:start"><div>' +
      '<span class="eyebrow">Oferta de passagem aérea</span><h2>Informações da passagem</h2>' +
      '<dl class="lp-info">' + info.map(function (x) { return "<div><dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join("") + "</dl></div>" +
      '<div><span class="eyebrow">Condições</span><h2>Condições da oferta</h2><ul class="checks yes lp-cond">' +
      ["Passagem aérea de ida e volta para 1 adulto, em classe " + (CLASSE[o.classe] || o.classe).toLowerCase() + ".",
       "Não inclui hospedagem, passeios ou outros serviços — podem ser cotados à parte.",
       "Valor encontrado na pesquisa de " + pesq.toLocaleDateString("pt-BR") + "; sujeito a alteração e disponibilidade no momento da solicitação.",
       "A compra não é feita pelo site: um consultor confirma datas, taxas, bagagem e formas de pagamento antes da emissão.",
       o.bagagem ? "Tarifa com bagagem despachada." : "Tarifa sem bagagem despachada — a inclusão pode alterar o valor."
      ].concat(p.entradaTexto ? [p.entradaTexto] : []).map(function (t) { return "<li>" + icon("check") + esc(t) + "</li>"; }).join("") +
      "</ul>" + precoHTML(o) + '<p class="ad-note">' + aviso() + "</p></div></div></section>" +

      '<section class="section" style="padding-bottom:40px"><div class="wrap" id="bloco-parcelamento"></div></section>' +

      '<section class="section section--paper"><div class="wrap split" style="align-items:start"><div><span class="eyebrow">Dúvidas</span><h2>Perguntas frequentes</h2><p class="lead">Não encontrou sua resposta? O consultor explica tudo pelo WhatsApp.</p></div>' +
      '<div class="faq">' + (ct.faq || []).map(function (x, i) { return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(x.p) + "</summary><p>" + esc(x.r) + "</p></details>"; }).join("") + "</div></div></section>" +

      '<section class="section"><div class="wrap"><div class="cta-box on-dark lp-final"><div><span class="eyebrow">' + esc(o.codigo) + "</span><h2>" + esc(o.chamada) + '</h2><p class="lead">' + esc(o.titulo) + " · " + esc(o.subtitulo) + " · a partir de " + brl(p.precoParcelado) + " ou " + p.parcelas + "x de " + brl(p.valorParcela) + '.</p><p class="ad-note" style="color:rgba(255,255,255,.65)">' + aviso() + "</p></div>" +
      '<div class="lp-final-actions"><a class="btn btn--wa" href="' + wa + '" target="_blank" rel="noopener" data-wa-oferta="' + esc(o.codigo) + '">' + icon("whatsapp") + 'Falar com um consultor</a><a class="btn btn--ghost" href="ofertas.html">Ver outras ofertas</a></div></div></div></section>' +

      '<div class="lp-sticky" role="region" aria-label="Resumo da oferta"><div><b>' + brl(p.precoParcelado) + "</b><span>ou " + p.parcelas + "x de " + brl(p.valorParcela) + '</span></div><a class="btn btn--wa btn--sm" href="' + wa + '" target="_blank" rel="noopener" data-wa-oferta="' + esc(o.codigo) + '">' + icon("whatsapp") + "Consultor</a></div>" +
      '<dialog class="lp-lightbox" aria-label="Imagem ampliada"><button class="adm-x lp-close" aria-label="Fechar">✕</button><img alt=""><p></p></dialog>';

    $("#bloco-parcelamento").innerHTML = blocoParcelamento();
    // barra fixa do celular só aparece depois que o card de preço do topo sai da tela
    var sticky = $(".lp-sticky"), priceBox = $(".lp-price");
    var atualizarSticky = function () { sticky.classList.toggle("show", priceBox.getBoundingClientRect().bottom < 0); };
    window.addEventListener("scroll", atualizarSticky, { passive: true }); atualizarSticky();
    var dlg = $(".lp-lightbox");
    $$(".lp-g").forEach(function (b) {
      b.addEventListener("click", function () {
        var im = imgs[+b.dataset.i]; $("img", dlg).src = ROOT + im.url; $("img", dlg).alt = im.alt; $("p", dlg).textContent = im.alt + " · " + im.credito;
        if (dlg.showModal) dlg.showModal();
      });
    });
    $(".lp-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    revelar(box);
  }

  window.Cesamar.ofertas = { cardOferta: cardOferta, precoHTML: precoHTML };
  if (PAGE === "home") home();
  else if (PAGE === "ofertas") listagem();
  else if (PAGE === "oferta") landing();
})();
