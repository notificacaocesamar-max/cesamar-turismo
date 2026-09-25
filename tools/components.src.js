/* Componentes compartilhados: ícones, logo, header, menu mobile, footer e WhatsApp.
   Renderizados via JS para funcionar abrindo os arquivos direto do disco (file://). */
(function () {
  "use strict";
  var CFG = window.CESAMAR_CONFIG;
  var C = CFG.contato;
  var ROOT = document.body.getAttribute("data-root") || "";
  var PAGE = document.body.getAttribute("data-page") || "";

  /* ---------------- Ícones (traço 1.8, 24x24) ---------------- */
  var P = {
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/><circle cx="10.5" cy="12.5" r="0"/>',
    ship: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 17.4 21 12H3l1.8 5.4M12 12V4M8 8h8l-1-4H9z"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    pin: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
    badge: '<path d="M3.9 8.6a4 4 0 0 1 4.7-4.7 4 4 0 0 1 6.8 0 4 4 0 0 1 4.7 4.7 4 4 0 0 1 0 6.8 4 4 0 0 1-4.7 4.7 4 4 0 0 1-6.8 0 4 4 0 0 1-4.7-4.7 4 4 0 0 1 0-6.8"/><path d="m9 12 2 2 4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2z"/>',
    sparkles: '<path d="M9.9 15.5A2 2 0 0 0 8.5 14l-6.1-1.6a.5.5 0 0 1 0-1L8.5 9.9A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z"/><path d="M20 3v4M22 5h-4"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    palm: '<path d="M13 8c0-2.8-2.2-5-5-5H7M13 7.9c1.9-1.9 5-2.3 7-.9M13 8c-2.8 0-5 2.2-5 5M13 8c2.3 0 4.3 1.4 5 3.5M12.5 8c.5 5-.5 10-2.5 13"/><path d="M5 21h10"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>',
    family: '<circle cx="7" cy="5" r="2.5"/><circle cx="17" cy="5" r="2.5"/><circle cx="12" cy="12" r="2"/><path d="M4 21v-6l-1-5h8l-1 5M20 21v-6l1-5h-8M10 21v-4h4v4"/>',
    whatsapp: '<path d="M3 21l1.7-5.2A8.9 8.9 0 1 1 8.3 19.4z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1.3-1.5-2-1-1 .8a4.5 4.5 0 0 1-2.6-2.6l.8-1-1-2z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'
  };
  function icon(name, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + ">" + (P[name] || "") + "</svg>";
  }

  /* ---------------- Logo (vetorizado da marca original) ---------------- */
  var RING = "__RING__";
  var BIRD = "__BIRD__";
  var WORD = "__WORD__";
  function logoMark() {
    return '<svg class="mark" viewBox="146 102 186 136" aria-hidden="true"><path d="' + RING + '" fill="none" stroke="#E03C3C" stroke-width="3.8" stroke-linecap="round"/><path class="bird" fill-rule="evenodd" d="' + BIRD + '"/></svg>';
  }
  function logoWord() {
    return '<svg class="word" viewBox="72 280 330 50" aria-hidden="true"><path fill-rule="evenodd" d="' + WORD + '"/></svg>';
  }
  function brand() {
    return '<a class="brand" href="' + ROOT + 'index.html" aria-label="Cesamar Turismo — página inicial">' + logoMark() + logoWord() + "</a>";
  }

  var NAV = [
    ["ofertas", "Ofertas", "pages/ofertas.html"],
    ["destinos", "Destinos", "pages/destinos.html"],
    ["pacotes", "Passagem + hotel", "pages/pacotes.html"],
    ["cruzeiros", "Cruzeiros", "pages/cruzeiros.html"],
    ["quem-somos", "Quem somos", "pages/quem-somos.html"],
    ["contato", "Contato", "pages/contato.html"]
  ];
  var ST = window.Cesamar && window.Cesamar.store;

  /* WhatsApp: número e mensagem vêm do painel (store); config.js é só o valor inicial */
  function waLink(msg) {
    if (ST) return ST.linkWhatsGeral(msg);
    return "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg || "Olá! Vim pelo site da Cesamar e quero falar com um consultor.");
  }
  function waTexto() {
    var n = ST ? String(ST.carregar().config.whatsappNumero || "") : C.whatsapp;
    n = n.replace(/\D/g, "").replace(/^55/, "");
    return n.length >= 10 ? "(" + n.slice(0, 2) + ") " + n.slice(2, n.length - 4) + "-" + n.slice(-4) : C.whatsappTexto;
  }

  /* Mega-menu de Ofertas: destinos monitorados por região + categorias (campanhas) */
  function megaMenu() {
    if (!ST) return "";
    var db = ST.carregar();
    var grupos = [["Europa", ["Europa"]], ["Américas", ["América do Norte", "América Central", "América do Sul"]], ["Ásia, África e Oriente Médio", ["Ásia", "Oriente Médio", "África"]]];
    function lista(regs) {
      return db.destinos.filter(function (d) { return d.ativo && regs.indexOf(d.regiao) >= 0; }).map(function (d) {
        var tem = ST.publicadas().some(function (o) { return o.destinoId === d.id; });
        return '<li><a href="' + ROOT + 'pages/ofertas.html?destino=' + d.id + '">' + (d.nomeExibicao || d.nome) + "<small>" + d.cidade + (tem ? " · com oferta" : "") + "</small></a></li>";
      }).join("");
    }
    var feat = ST.publicadas().sort(function (a, b) { return a.preco.precoParcelado - b.preco.precoParcelado; })[0];
    var fd = feat && ST.destino(feat.destinoId), fi = feat && ST.imagemPrincipal(feat.destinoId);
    return '<div class="mega" role="region" aria-label="Ofertas"><div class="wrap mega-grid">' +
      grupos.map(function (g, i) { return "<div><p class=\"mega-h\">" + g[0] + "</p><ul" + (i === 0 ? ' class="cols2"' : "") + ">" + lista(g[1]) + "</ul></div>"; }).join("") +
      (feat ? '<a class="mega-feat" href="' + ROOT + 'pages/oferta.html?codigo=' + feat.codigo + '"><img src="' + ROOT + fi.url + '" alt=""><span><small>Oportunidade da semana</small><b>' + feat.titulo + "</b>A partir de " + window.Cesamar.precos.brl(feat.preco.precoParcelado) + " ou " + feat.preco.parcelas + "x de " + window.Cesamar.precos.brl(feat.preco.valorParcela) + "</span></a>" : "") +
      '</div><div class="wrap mega-foot"><span class="mega-h" style="margin:0">Categorias</span>' +
      ST.campanhasAtivas().map(function (c) { return '<a href="' + ROOT + 'pages/ofertas.html?categoria=' + c.id + '">' + c.nome + "</a>"; }).join("") +
      '<a class="link-arrow" href="' + ROOT + 'pages/ofertas.html">Todas as ofertas ' + icon("arrow") + "</a></div></div>";
  }

  function header() {
    var links = NAV.map(function (n) {
      var a = '<a href="' + ROOT + n[2] + '"' + (PAGE === n[0] ? ' aria-current="page"' : "") + (n[0] === "ofertas" ? ' class="has-mega" aria-haspopup="true"' : "") + ">" + n[1] + "</a>";
      return n[0] === "ofertas" ? '<div class="nav-item">' + a + megaMenu() + "</div>" : a;
    }).join("");
    return '<a class="skip" href="#conteudo">Pular para o conteúdo</a>' +
      (CFG.prototipo ? '<div class="proto-bar"><b>Versão de demonstração</b> · preços simulados; fotos reais identificadas e licenciadas</div>' : "") +
      '<header class="site-header"><div class="wrap">' + brand() +
      '<nav class="nav" aria-label="Principal">' + links + "</nav>" +
      '<div class="header-cta"><a class="fav-link" href="' + ROOT + 'pages/pacotes.html?favoritos=1" aria-label="Meus favoritos">' + icon("heart") + '<span class="fav-count" hidden>0</span></a><a class="btn btn--sm btn--wa" href="' + waLink() + '" target="_blank" rel="noopener" data-wa-geral>' + icon("whatsapp") + 'Falar com um consultor</a></div>' +
      '<button class="menu-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-nav"><span></span></button>' +
      "</div></header>" +
      '<nav class="mobile-nav" id="mobile-nav" aria-label="Menu">' +
      '<a href="' + ROOT + 'index.html">Início</a>' + NAV.map(function (n) { return '<a href="' + ROOT + n[2] + '">' + n[1] + "</a>"; }).join("") +
      '<a class="btn btn--wa" href="' + waLink() + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Falar no WhatsApp</a></nav>";
  }

  function footer() {
    var E = CFG.empresa;
    return '<footer class="site-footer"><div class="wrap"><div class="foot-grid">' +
      "<div>" + brand() +
      '<p style="margin-top:22px;max-width:34ch">Viagens sob medida, com consultores especializados e suporte do embarque ao retorno. Há ' + E.fundacaoTexto + " no Centro do Rio.</p>" +
      '<div class="social"><a href="https://instagram.com/' + C.instagram + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon("instagram") + '</a><a href="' + waLink() + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon("whatsapp") + '</a><a href="mailto:' + C.email + '" aria-label="E-mail">' + icon("mail") + "</a></div></div>" +
      "<div><h4>Explore</h4><ul>" + NAV.slice(0, 4).concat([["servicos", "Serviços", "pages/servicos.html"]]).map(function (n) { return '<li><a href="' + ROOT + n[2] + '">' + n[1] + "</a></li>"; }).join("") + "</ul></div>" +
      '<div><h4>A agência</h4><ul><li><a href="' + ROOT + 'pages/quem-somos.html">Quem somos</a></li><li><a href="' + ROOT + 'pages/contato.html">Contato</a></li><li><a href="' + ROOT + 'retaguarda/index.html">Área da equipe</a></li></ul></div>' +
      "<div><h4>Fale com a gente</h4><ul>" +
      '<li><a href="tel:' + C.telefoneLink + '">' + C.telefone + "</a></li>" +
      '<li><a href="' + waLink() + '" target="_blank" rel="noopener">WhatsApp ' + waTexto() + "</a></li>" +
      '<li><a href="mailto:' + C.email + '">' + C.email + "</a></li>" +
      '<li><a href="' + C.mapsUrl + '" target="_blank" rel="noopener">' + C.endereco + "<br>" + C.bairroCidade + "</a></li>" +
      (C.horario ? "<li>" + C.horario + "</li>" : "") + "</ul></div>" +
      "</div>" +
      '<div class="foot-legal"><span>© ' + new Date().getFullYear() + " " + E.razaoSocial + " · CNPJ " + E.cnpj + "</span><span>Cadastur " + E.cadastur + " · Embratur " + E.embratur + "</span></div>" +
      "</div>" + giantWord() + "</footer>" +
      '<a class="wa-float" href="' + waLink() + '" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">' + icon("whatsapp", ' style="stroke-width:1.6"') + '<span class="tip">Falar com um consultor</span></a>' +
      '<div class="toast" role="status" aria-live="polite"></div>';
  }


  function creds() {
    var E = CFG.empresa;
    return [["badge", "Cadastur", E.cadastur + " · válido até " + E.cadasturValidade], ["award", "Embratur", E.embratur], ["landmark", "CNPJ", E.cnpj], ["pin", "Sede", C.endereco]]
      .map(function (c) { return '<div class="cred"><span class="ico">' + icon(c[0]) + "</span><div><small>" + c[1] + "</small><b>" + c[2] + "</b></div></div>"; }).join("");
  }
  function mapa() {
    // Mapa ilustrado (não depende de internet). Linhas aproximadas, sem escala.
    var ruas = "";
    for (var i = 0; i < 9; i++) ruas += '<path d="M' + (-40 + i * 70) + ' 420 L' + (160 + i * 70) + ' -20" stroke="#fff" stroke-width="7" opacity=".75"/>';
    for (var j = 0; j < 7; j++) ruas += '<path d="M-20 ' + (60 + j * 62) + ' L520 ' + (10 + j * 62) + '" stroke="#fff" stroke-width="5" opacity=".6"/>';
    return '<div class="map-card"><svg viewBox="0 0 700 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="700" height="420" fill="#ece6f4"/>' + ruas +
      '<path d="M520 -10 C560 60 540 140 590 200 C640 260 610 340 660 430 L720 430 L720 -10Z" fill="#9fc3e3"/>' +
      '<path d="M520 -10 C560 60 540 140 590 200 C640 260 610 340 660 430" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>' +
      '<path d="M140 430 L470 -10" stroke="#f7b26b" stroke-width="16" stroke-linecap="round"/>' +
      '<text x="330" y="150" transform="rotate(-53 330 150)" font-size="13" font-family="Poppins,sans-serif" font-weight="600" fill="#6b4a1f">AV. RIO BRANCO</text>' +
      '<circle cx="470" cy="40" r="26" fill="#cfe3c4"/><text x="430" y="86" font-size="11" font-family="Poppins,sans-serif" fill="#3d4a3a">Praça Mauá</text>' +
      '<text x="610" y="120" font-size="12" font-family="Poppins,sans-serif" fill="#2d5a7c" font-style="italic">Baía de</text><text x="600" y="136" font-size="12" font-family="Poppins,sans-serif" fill="#2d5a7c" font-style="italic">Guanabara</text>' +
      '<circle cx="350" cy="210" r="34" fill="#e03c3c" opacity=".18"><animate attributeName="r" values="18;40;18" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".35;0;.35" dur="2.6s" repeatCount="indefinite"/></circle>' +
      '<path d="M350 214 c-14 -16 -22 -26 -22 -38 a22 22 0 0 1 44 0 c0 12 -8 22 -22 38z" fill="#e03c3c"/><circle cx="350" cy="176" r="8" fill="#fff"/>' +
      '</svg><div class="pin-label" style="top:40%">Cesamar · ' + C.endereco + "</div>" +
      '<div class="map-actions"><a class="btn btn--ink btn--sm" href="' + C.mapsUrl + '" target="_blank" rel="noopener">' + icon("pin") + 'Abrir no Google Maps</a><a class="btn btn--light btn--sm" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(C.endereco + ", " + C.bairroCidade) + '" target="_blank" rel="noopener">Como chegar</a></div></div>';
  }

  function giantWord() {
    return '<div class="foot-signature" aria-hidden="true"><svg viewBox="76 254 323 70"><path fill-rule="evenodd" d="' + WORD + '"/></svg></div>';
  }
  function divider() {
    return '<div class="sig-divider" aria-hidden="true"><i></i>' + logoMark() + "<i></i></div>";
  }
  function intro() {
    var reduz = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var visto = false; try { visto = sessionStorage.getItem("cesamar.intro") === "1"; sessionStorage.setItem("cesamar.intro", "1"); } catch (e) { }
    if (reduz || visto || PAGE !== "home") return "";
    return '<div class="intro" aria-hidden="true"><div class="intro-in">' +
      '<svg class="intro-mark" viewBox="146 102 186 136"><path class="ring" pathLength="1" d="' + RING + '" fill="none" stroke="#E03C3C" stroke-width="3.8" stroke-linecap="round"/><path class="bird" fill-rule="evenodd" d="' + BIRD + '"/></svg>' +
      '<svg class="intro-word" viewBox="76 254 323 70"><path fill-rule="evenodd" d="' + WORD + '"/></svg>' +
      '<p class="intro-tag">Viagens e Turismo · há mais de 30 anos</p></div></div>';
  }

  /* ---------------- Montagem ---------------- */
  document.documentElement.classList.remove("no-js");
  if (CFG.prototipo) document.body.classList.add("proto");
  var h = document.getElementById("site-header"); if (h) h.outerHTML = intro() + header();
  var introEl = document.querySelector(".intro");
  if (introEl) { document.body.classList.add("intro-on"); setTimeout(function () { introEl.classList.add("out"); document.body.classList.remove("intro-on"); }, 2300); setTimeout(function () { introEl.remove(); }, 3200); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-sig-divider]"), function (el) { el.outerHTML = divider(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-creds]"), function (el) { el.innerHTML = creds(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-map]"), function (el) { el.outerHTML = mapa(); });
  Array.prototype.forEach.call(document.querySelectorAll("a[data-wa-geral]"), function (el) { el.href = waLink(); el.target = "_blank"; el.rel = "noopener"; });
  Array.prototype.forEach.call(document.querySelectorAll("a[data-wa]"), function (el) { el.href = waLink(); el.target = "_blank"; el.rel = "noopener"; el.insertAdjacentHTML("afterbegin", icon("whatsapp")); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-stamp-mark]"), function (el) { el.innerHTML = logoMark(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-contatos]"), function (el) {
    el.innerHTML =
      '<li><span class="ico">' + icon("whatsapp") + '</span><a href="' + waLink() + '" target="_blank" rel="noopener"><small>WhatsApp</small>' + waTexto() + "</a></li>" +
      '<li><span class="ico">' + icon("phone") + '</span><a href="tel:' + C.telefoneLink + '"><small>Telefone</small>' + C.telefone + "</a></li>" +
      '<li><span class="ico">' + icon("mail") + '</span><a href="mailto:' + C.email + '"><small>E-mail</small>' + C.email + "</a></li>" +
      '<li><span class="ico">' + icon("pin") + '</span><a href="' + C.mapsUrl + '" target="_blank" rel="noopener"><small>Visite a agência</small>' + C.endereco + ", " + C.bairroCidade + "</a></li>" +
      (C.horario ? '<li><span class="ico">' + icon("clock") + "</span><span><small>Horário</small>" + C.horario + "</span></li>" : "");
  });
  var f = document.getElementById("site-footer"); if (f) f.outerHTML = footer();

  window.Cesamar = window.Cesamar || {};
  window.Cesamar.icon = icon;
  window.Cesamar.waLink = waLink;
  window.Cesamar.logoMark = logoMark;
  window.Cesamar.ROOT = ROOT;
  window.Cesamar.divider = divider;
  // favicon com a marca
  if (!document.querySelector("link[rel=icon]")) { var l = document.createElement("link"); l.rel = "icon"; l.type = "image/svg+xml"; l.href = ROOT + "assets/img/logo/favicon.svg"; document.head.appendChild(l); }
})();
