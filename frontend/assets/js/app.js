/* Cesamar Turismo — comportamento das páginas.
   Cada página declara <body data-page="..."> e este arquivo inicializa o que ela precisa. */
(function () {
  "use strict";
  var CFG = window.CESAMAR_CONFIG, API = window.CesamarAPI, C = window.Cesamar;
  var ROOT = C.ROOT, PAGE = document.body.getAttribute("data-page");
  var icon = C.icon;

  /* =========================================================== utilitários */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function brl(n) { return "R$ " + Math.round(n).toLocaleString("pt-BR"); }
  function params() { var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o; }
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var ESTILOS = [["praia", "Praia e sol"], ["lua-de-mel", "Lua de mel"], ["natureza", "Natureza"], ["aventura", "Aventura"], ["cultura", "Cultura e história"], ["cidade", "Grandes cidades"], ["gastronomia", "Gastronomia"], ["familia", "Em família"], ["luxo", "Premium"], ["serra", "Serra e frio"]];
  function estiloNome(k) { var e = ESTILOS.filter(function (x) { return x[0] === k; })[0]; return e ? e[1] : k; }
  function imgDestino(slug, dest) { return ROOT + "assets/img/destinos/" + ((dest && dest.imagem) || slug + ".svg"); }
  function toast(msg) { var t = $(".toast"); if (!t) return; t.innerHTML = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200); }

  var DATA = { destinos: [], pacotes: [], cruzeiros: [] }, DEST = {};
  function indexar() { DEST = {}; DATA.destinos.forEach(function (d) { DEST[d.slug] = d; }); }

  /* =========================================================== favoritos */
  var FAV_KEY = "cesamar.favoritos";
  function favs() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; } }
  function setFavs(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch (e) { } atualizaFavCount(); }
  function isFav(slug) { return favs().indexOf(slug) >= 0; }
  function atualizaFavCount() {
    var n = favs().length;
    $$(".fav-count").forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".fav-btn");
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var slug = b.getAttribute("data-slug"), a = favs(), i = a.indexOf(slug);
    if (i >= 0) { a.splice(i, 1); toast("Removido dos favoritos"); } else { a.push(slug); toast("Salvo nos favoritos " + icon("heart", ' style="width:16px;display:inline;vertical-align:-3px;fill:#e03c3c;stroke:#e03c3c"')); }
    setFavs(a);
    $$('.fav-btn[data-slug="' + slug + '"]').forEach(function (x) { x.setAttribute("aria-pressed", String(i < 0)); x.classList.remove("pop"); void x.offsetWidth; x.classList.add("pop"); });
    if (PAGE === "pacotes" && window.__refiltrar) window.__refiltrar();
  });

  /* =========================================================== cartões */
  function precoHTML(p, big) {
    var parc = p.parcelas ? '<span class="parc">ou ' + p.parcelas + "x de " + brl(p.precoAPartir / p.parcelas) + "</span>" : "";
    return '<div class="price">' + (p.precoDe ? "<s>de " + brl(p.precoDe) + "</s>" : "<small>a partir de</small>") +
      "<b>" + brl(p.precoAPartir).replace("R$ ", "<sup>R$</sup>") + '</b> <span class="per">por pessoa</span>' + (big ? parc : parc) + "</div>";
  }
  function badgeHTML(p) {
    var out = "";
    if (p.precoDe) out += '<span class="tag save">-' + Math.round((1 - p.precoAPartir / p.precoDe) * 100) + "%</span>";
    if (p.badge) out += '<span class="tag ' + (p.badge === "Mais vendido" ? "tag--coral" : p.badge === "Premium" ? "tag--ink" : "tag--sun") + '">' + esc(p.badge) + "</span>";
    return out;
  }
  function pkgCard(p) {
    var d = DEST[p.destino] || {};
    var url = ROOT + "pages/pacote.html?id=" + encodeURIComponent(p.slug);
    return '<article class="pkg reveal">' +
      '<a class="media" href="' + url + '" tabindex="-1" aria-hidden="true"><img src="' + imgDestino(p.destino, d) + '" alt="" loading="lazy"><div class="tags">' + badgeHTML(p) + "</div></a>" +
      '<button class="fav-btn" data-slug="' + esc(p.slug) + '" aria-pressed="' + isFav(p.slug) + '" aria-label="Salvar ' + esc(p.titulo) + ' nos favoritos">' + icon("heart") + "</button>" +
      '<div class="body"><span class="where">' + esc(d.nome || "") + " · " + esc(d.local || "") + "</span>" +
      '<h3><a href="' + url + '">' + esc(p.titulo) + "</a></h3><p>" + esc(p.resumo) + "</p>" +
      '<div class="meta"><span>' + icon("moon") + (p.noites + 1) + " dias / " + p.noites + " noites</span><span>" + icon("plane") + "Passagem + hotel</span></div>" +
      '<div class="foot">' + precoHTML(p) + '<a class="btn btn--ink btn--sm" href="' + url + '">Ver detalhes</a></div></div></article>';
  }
  function posterCard(d, opts) {
    opts = opts || {};
    var href = opts.href || (ROOT + "pages/pacotes.html?destino=" + d.slug);
    var nPk = DATA.pacotes.filter(function (p) { return p.destino === d.slug; }).length;
    return '<a class="poster reveal" href="' + href + '"' + (opts.style ? ' style="' + opts.style + '"' : "") + '><img src="' + imgDestino(d.slug, d) + '" alt="" loading="lazy">' +
      '<div class="top"><span class="tag tag--glass">' + esc(d.tipo === "nacional" ? "Brasil" : d.regiao) + "</span>" + (opts.badge != null ? opts.badge : (nPk ? '<span class="tag tag--glass">' + nPk + (nPk > 1 ? " pacotes" : " pacote") + "</span>" : "")) + "</div>" +
      '<div class="bottom"><h3>' + esc(d.nome) + "</h3><p>" + esc(opts.sub || d.chamada) + "</p></div>" +
      '<span class="go">' + icon("arrow") + "</span></a>";
  }

  /* =========================================================== reveal */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  function revelar(scope) {
    $$(".reveal:not(.in)", scope).forEach(function (el, i) {
      if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", (i % 4) * 0.08 + "s");
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  /* =========================================================== header / menu */
  function initHeader() {
    var h = $(".site-header"), btn = $(".menu-btn");
    function onScroll() { if (h) h.classList.toggle("is-solid", window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if (btn) btn.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      btn.setAttribute("aria-expanded", String(open)); btn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    $$(".mobile-nav a").forEach(function (a) { a.addEventListener("click", function () { document.body.classList.remove("menu-open"); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { document.body.classList.remove("menu-open", "filters-open"); } });
    atualizaFavCount();
  }

  /* =========================================================== promo */
  function initPromo() {
    var slides = $$(".promo-slide"); if (slides.length < 2) return;
    var i = 0;
    function go(n) { slides[i].classList.remove("on"); i = (n + slides.length) % slides.length; slides[i].classList.add("on"); }
    var t = setInterval(function () { go(i + 1); }, 5000);
    $$(".promo-nav").forEach(function (b) { b.addEventListener("click", function () { clearInterval(t); go(i + (b.dataset.dir === "prev" ? -1 : 1)); }); });
  }

  /* =========================================================== contadores */
  function initCounters() {
    $$("[data-count]").forEach(function (el) {
      var alvo = +el.getAttribute("data-count"), suf = el.getAttribute("data-suffix") || "", ok = false;
      function run() {
        if (ok) return; ok = true; var t0 = performance.now();
        (function step(t) { var k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(alvo * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
      }
      if (io) new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { run(); o.disconnect(); } }).observe(el); else run();
    });
  }

  /* =========================================================== formulários de lead */
  function validar(form) {
    var ok = true;
    $$(".field", form).forEach(function (f) { f.classList.remove("invalid"); });
    function bad(name) { var el = form.elements[name]; if (el) { el.closest(".field").classList.add("invalid"); if (ok) el.focus(); } ok = false; }
    var nome = (form.elements.nome || {}).value || "";
    var wa = ((form.elements.whatsapp || {}).value || "").replace(/\D/g, "");
    var email = ((form.elements.email || {}).value || "").trim();
    if (nome.trim().length < 2) bad("nome");
    if (form.elements.whatsapp && wa.length < 10) bad("whatsapp");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad("email");
    if (form.elements.consentimento && !form.elements.consentimento.checked) { ok = false; toast("Precisamos do seu consentimento para entrar em contato."); }
    return ok;
  }
  function mascaraTelefone(input) {
    input.addEventListener("input", function () {
      var v = input.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6) input.value = "(" + v.slice(0, 2) + ") " + v.slice(2, v.length - 4) + "-" + v.slice(-4);
      else if (v.length > 2) input.value = "(" + v.slice(0, 2) + ") " + v.slice(2);
      else input.value = v;
    });
  }
  /* Formulários de atendimento: montam a mensagem e abrem o WhatsApp.
     Nada é gravado no site (sem coleta de dados pessoais). */
  function initLeadForms() {
    $$("form[data-wa-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = function (n) { return form.elements[n] ? String(form.elements[n].value || "").trim() : ""; };
        var partes = ["Olá! Vim pelo site da Cesamar."];
        if (v("pacote")) partes.push("Tenho interesse em: " + v("pacote") + ".");
        else if (v("destino")) partes.push("Quero viajar para: " + v("destino") + ".");
        else partes.push("Quero ajuda para escolher um destino.");
        if (v("mes")) partes.push("Quando: " + v("mes") + ".");
        if (v("pessoas")) partes.push("Viajantes: " + v("pessoas") + (v("criancas") && v("criancas") !== "0" ? " adulto(s) e " + v("criancas") + " criança(s)" : "") + ".");
        if (v("origem")) partes.push("Saindo de: " + v("origem") + ".");
        if (v("orcamento")) partes.push("Orçamento por pessoa: " + v("orcamento") + ".");
        if (v("mensagem")) partes.push(v("mensagem"));
        var url = window.Cesamar.waLink(partes.join(" "));
        if (window.Cesamar.store) window.Cesamar.store.registrar("whatsapp", { campanhaId: null });
        window.open(url, "_blank", "noopener");
      });
    });
  }
  function mundoNomes() {
    var ST = window.Cesamar.store;
    var l = ST ? ST.carregar().destinos.filter(function (d) { return d.ativo; }).map(function (d) { return d.nomeExibicao || d.nome; }) : DATA.destinos.filter(function (d) { return d.tipo !== "nacional"; }).map(function (d) { return d.nome; });
    return l.sort(function (a, b) { return a.localeCompare(b); });
  }
  function preencherSelectDestinos(sel, valor) {
    if (!sel) return;
    sel.innerHTML = '<option value="">Ainda não sei — quero sugestões</option>' +
      '<optgroup label="Brasil">' + DATA.destinos.filter(function (d) { return d.tipo === "nacional"; }).map(opt).join("") + "</optgroup>" +
      '<optgroup label="Mundo">' + mundoNomes().map(function (n) { return opt({ nome: n }); }).join("") + "</optgroup>" +
      '<optgroup label="Cruzeiros">' + DATA.cruzeiros.map(function (c) { return "<option>Cruzeiro " + esc(c.nome) + "</option>"; }).join("") + "</optgroup>";
    function opt(d) { return "<option" + (valor === d.nome ? " selected" : "") + ">" + esc(d.nome) + "</option>"; }
    if (valor && !sel.value) { sel.insertAdjacentHTML("beforeend", "<option selected>" + esc(valor) + "</option>"); }
  }
  function preencherMeses(sel, primeiro) {
    if (!sel) return;
    var hoje = new Date(), html = '<option value="">' + (primeiro || "Qualquer mês") + "</option>";
    for (var i = 1; i <= 14; i++) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      var label = MESES[d.getMonth()].replace(/^./, function (c) { return c.toUpperCase(); }) + " de " + d.getFullYear();
      html += '<option value="' + label + '" data-m="' + (d.getMonth() + 1) + '">' + label + "</option>";
    }
    sel.innerHTML = html;
  }
  function mesNum(sel) { var o = sel && sel.selectedOptions && sel.selectedOptions[0]; return o ? +(o.getAttribute("data-m") || 0) : 0; }

  /* =========================================================== motor de sensações */
  var SENSACOES = [
    { k: "relaxar", t: "Relaxar", s: "Pé na areia e nada na agenda", i: "palm", temas: ["praia", "luxo"] },
    { k: "aventura", t: "Me aventurar", s: "Trilhas, dunas e adrenalina", i: "mountain", temas: ["aventura", "natureza"] },
    { k: "romance", t: "Me apaixonar", s: "Viagens a dois e lua de mel", i: "heart", temas: ["lua-de-mel"] },
    { k: "cultura", t: "Descobrir culturas", s: "História, templos e museus", i: "landmark", temas: ["cultura", "historia"] },
    { k: "cidade", t: "Viver a cidade", s: "Gastronomia, compras e agito", i: "sparkles", temas: ["cidade", "compras", "gastronomia"] },
    { k: "familia", t: "Curtir em família", s: "Para todas as idades", i: "family", temas: ["familia"] }
  ];
  function initSensacoes(root) {
    if (!root) return;
    var grid = $(".feel-grid", root), out = $(".feel-results", root), note = $(".feel-note", root), sel = $("select", root);
    preencherMeses(sel, "Qualquer época");
    grid.innerHTML = SENSACOES.map(function (s, i) {
      return '<button type="button" class="feel-opt" data-k="' + s.k + '" aria-pressed="' + (i === 0) + '">' + icon(s.i) + "<b>" + s.t + "</b><small>" + s.s + "</small></button>";
    }).join("");
    var atual = SENSACOES[0];
    function render() {
      var m = mesNum(sel);
      var lista = DATA.destinos.map(function (d) {
        var score = d.temas.filter(function (t) { return atual.temas.indexOf(t) >= 0; }).length;
        var bomMes = !m || (d.meses || []).indexOf(m) >= 0;
        return { d: d, score: score + (bomMes ? .5 : 0), bomMes: bomMes, match: score > 0 };
      }).filter(function (x) { return x.match; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
      out.innerHTML = lista.map(function (x) {
        return posterCard(x.d, { badge: m ? '<span class="tag ' + (x.bomMes ? "tag--sun" : "tag--glass") + '">' + (x.bomMes ? "Ótima época" : "Fora da alta") + "</span>" : "", sub: "Melhor época: " + x.d.epoca });
      }).join("");
      out.classList.remove("fade-swap"); void out.offsetWidth; out.classList.add("fade-swap");
      $$(".reveal", out).forEach(function (el) { el.classList.add("in"); });
      if (note) note.innerHTML = "Nenhuma dessas é bem o que você imaginou? <a class=\"link-arrow\" href=\"" + ROOT + "pages/contato.html\">Conte para um consultor e montamos do zero " + icon("arrow") + "</a>";
    }
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".feel-opt"); if (!b) return;
      $$(".feel-opt", grid).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      atual = SENSACOES.filter(function (s) { return s.k === b.dataset.k; })[0]; render();
    });
    sel.addEventListener("change", render);
    render();
  }

  /* =========================================================== HOME */
  function initHome() {
    // Parallax suave do hero
    var hero = $(".hero"), layers = $$(".hero-layer");
    var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (hero && layers.length && !reduz) {
      var mx = 0, my = 0, sy = 0, raf = null;
      function apply() {
        raf = null;
        layers.forEach(function (l) { var d = +l.getAttribute("data-depth"); l.style.transform = "translate(" + (mx * d * -600) + "px," + (my * d * -300 + sy * d * 1.2) + "px)"; });
      }
      hero.addEventListener("mousemove", function (e) { var r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(apply); });
      window.addEventListener("scroll", function () { sy = Math.min(window.scrollY, 900); if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
    }
    // Home de ofertas: seções renderizadas por ofertas.js; aqui só o formulário do WhatsApp
    preencherSelectDestinos($("#wa-form select[name=destino]"));
    preencherMeses($("#wa-form select[name=mes]"), "Datas flexíveis");
  }

  /* =========================================================== DESTINOS */
  function initDestinos() {
    // Mundo: os destinos monitorados pelo robô (ofertas de passagem) · Brasil: passagem + hotel
    var ST = window.Cesamar.store, estado = { tipo: "", regiao: "" };
    var grid = $("#grid-destinos"), chips = $("#filtro-destinos"), busca = $("#busca-destinos");
    var mundo = ST.carregar().destinos.filter(function (d) { return d.ativo; }).map(function (d) {
      var n = ST.publicadas().filter(function (o) { return o.destinoId === d.id; }).length, ct = ST.conteudo(d.id) || {};
      var im = ST.imagemPrincipal(d.id);
      return { slug: d.id, nome: d.nomeExibicao || d.nome, local: d.cidade + ", " + d.nome, tipo: "internacional", regiao: d.regiao, chamada: ct.tituloEmocional || "",
        imagem: im ? im.url.replace("assets/img/destinos/", "") : d.arte + ".svg", temas: d.campanhas || [], _href: ROOT + "pages/ofertas.html?destino=" + d.id,
        _badge: '<span class="tag tag--glass">' + (n ? n + (n > 1 ? " ofertas" : " oferta") : "Sob consulta") + "</span>" };
    });
    var brasil = DATA.destinos.filter(function (d) { return d.tipo === "nacional"; }).map(function (d) {
      return Object.assign({}, d, { _href: ROOT + "pages/pacotes.html?destino=" + d.slug, _badge: '<span class="tag tag--glass">Passagem + hotel</span>' });
    });
    var todos = mundo.concat(brasil);
    var regioes = []; todos.forEach(function (d) { if (regioes.indexOf(d.regiao) < 0) regioes.push(d.regiao); });
    chips.innerHTML = '<button class="chip" data-tipo="" aria-pressed="true">Todos</button><button class="chip" data-tipo="internacional" aria-pressed="false">Mundo</button><button class="chip" data-tipo="nacional" aria-pressed="false">Brasil</button><span style="width:1px;background:var(--line-strong);margin:0 6px"></span>' +
      regioes.map(function (r) { return '<button class="chip" data-regiao="' + esc(r) + '" aria-pressed="false">' + esc(r) + "</button>"; }).join("");
    function render() {
      var q = (busca.value || "").toLowerCase();
      var l = todos.filter(function (d) {
        return (!estado.tipo || d.tipo === estado.tipo) && (!estado.regiao || d.regiao === estado.regiao) &&
          (!q || (d.nome + " " + d.local + " " + d.regiao).toLowerCase().indexOf(q) >= 0);
      });
      grid.innerHTML = l.length ? l.map(function (d) { return posterCard(d, { href: d._href, badge: d._badge }); }).join("") : '<p class="empty">Nenhum destino encontrado. <a class="link-arrow" href="' + window.Cesamar.waLink() + '">Fale com um consultor ' + icon("arrow") + "</a></p>";
      $("#count-destinos").textContent = l.length + (l.length === 1 ? " destino" : " destinos");
      revelar(grid);
    }
    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      if (b.hasAttribute("data-tipo")) { estado.tipo = b.dataset.tipo; estado.regiao = ""; }
      else { estado.regiao = estado.regiao === b.dataset.regiao ? "" : b.dataset.regiao; }
      $$(".chip", chips).forEach(function (x) {
        x.setAttribute("aria-pressed", String(x.hasAttribute("data-tipo") ? (x.dataset.tipo === estado.tipo && !estado.regiao) : x.dataset.regiao === estado.regiao));
      });
      render();
    });
    busca.addEventListener("input", render);
    render();
  }

  /* =========================================================== PACOTES */
  function initPacotes() {
    var P = params(), f = $("#filtros"), grid = $("#grid-pacotes");
    var precos = DATA.pacotes.map(function (p) { return p.precoAPartir; });
    var pMax = Math.ceil(Math.max.apply(null, precos) / 1000) * 1000, pMin = Math.floor(Math.min.apply(null, precos) / 1000) * 1000;
    var regioes = []; DATA.destinos.forEach(function (d) { if (regioes.indexOf(d.regiao) < 0) regioes.push(d.regiao); });
    var estilosUsados = ESTILOS.filter(function (e) { return DATA.pacotes.some(function (p) { return p.tags.indexOf(e[0]) >= 0 || (DEST[p.destino] || { temas: [] }).temas.indexOf(e[0]) >= 0; }); });
    $("#f-regiao").innerHTML = regioes.map(function (r) { return '<label class="opt"><input type="checkbox" name="regiao" value="' + esc(r) + '"> ' + esc(r) + "</label>"; }).join("");
    $("#f-estilo").innerHTML = estilosUsados.map(function (e) { return '<label class="opt"><input type="checkbox" name="estilo" value="' + e[0] + '"' + (P.estilo === e[0] ? " checked" : "") + "> " + e[1] + "</label>"; }).join("");
    var range = f.elements.preco; range.min = pMin; range.max = pMax; range.step = 500; range.value = pMax;
    preencherMeses(f.elements.mes, "Qualquer mês");
    if (P.mes) $$("option", f.elements.mes).some(function (o) { if (o.getAttribute("data-m") === P.mes) { o.selected = true; return true; } });
    if (P.q) f.elements.q.value = P.q;
    if (P.favoritos) f.elements.favoritos.checked = true;
    var destinoFixo = P.destino || "";

    function vals(name) { return $$('input[name="' + name + '"]:checked', f).map(function (i) { return i.value; }); }
    function refiltrar() {
      var q = f.elements.q.value.trim().toLowerCase(), tipos = vals("tipo"), regs = vals("regiao"), ests = vals("estilo"),
        dur = (f.querySelector('input[name="duracao"]:checked') || {}).value || "", max = +range.value, m = mesNum(f.elements.mes), soFav = f.elements.favoritos.checked, fv = favs();
      $("#preco-val").textContent = +range.value >= pMax ? "Qualquer valor" : "até " + brl(max);
      var l = DATA.pacotes.filter(function (p) {
        var d = DEST[p.destino] || { temas: [], meses: [] };
        var tudo = (p.titulo + " " + p.resumo + " " + (d.nome || "") + " " + (d.local || "") + " " + p.tags.join(" ")).toLowerCase();
        return (!destinoFixo || p.destino === destinoFixo) && (!q || tudo.indexOf(q) >= 0) && (!tipos.length || tipos.indexOf(p.tipo) >= 0) &&
          (!regs.length || regs.indexOf(d.regiao) >= 0) && (!ests.length || ests.some(function (e) { return p.tags.indexOf(e) >= 0 || d.temas.indexOf(e) >= 0; })) &&
          (!dur || (dur === "curta" ? p.noites <= 5 : dur === "media" ? p.noites >= 6 && p.noites <= 9 : p.noites >= 10)) &&
          p.precoAPartir <= max && (!m || (d.meses || []).indexOf(m) >= 0) && (!soFav || fv.indexOf(p.slug) >= 0);
      });
      var ord = $("#ordem").value;
      l.sort(function (a, b) {
        if (ord === "menor") return a.precoAPartir - b.precoAPartir;
        if (ord === "maior") return b.precoAPartir - a.precoAPartir;
        if (ord === "duracao") return a.noites - b.noites;
        return (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0);
      });
      grid.innerHTML = l.map(pkgCard).join("") + sobMedidaCard(l.length);
      $("#count-pacotes").textContent = l.length + (l.length === 1 ? " pacote encontrado" : " pacotes encontrados");
      // filtros ativos
      var ativos = [];
      if (destinoFixo && DEST[destinoFixo]) ativos.push(["destino", DEST[destinoFixo].nome]);
      if (q) ativos.push(["q", "“" + q + "”"]);
      if (m) ativos.push(["mes", MESES[m - 1]]);
      if (soFav) ativos.push(["favoritos", "Meus favoritos"]);
      ests.forEach(function (e) { ativos.push(["estilo:" + e, estiloNome(e)]); });
      $("#ativos").innerHTML = ativos.map(function (a) { return '<button data-rm="' + a[0] + '">' + esc(a[1]) + " ✕</button>"; }).join("");
      revelar(grid);
    }
    window.__refiltrar = refiltrar;
    function sobMedidaCard(n) {
      return '<article class="pkg reveal" style="background:var(--ink);color:#fff;justify-content:center;border:0"><div class="body on-dark" style="justify-content:center">' +
        '<span class="eyebrow">Sob medida</span><h3 style="color:#fff">' + (n ? "Quer algo diferente?" : "Nenhum pacote com esses filtros.") + '</h3><p style="color:rgba(255,255,255,.75)">Nossos consultores combinam passagem e hotel para o destino, as datas e o orçamento que você quiser.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><a class="btn" href="' + ROOT + 'pages/contato.html">Falar com um consultor</a><a class="btn btn--ghost" href="' + C.waLink() + '" target="_blank" rel="noopener">WhatsApp</a></div></div></article>';
    }
    f.addEventListener("input", refiltrar); f.addEventListener("change", refiltrar);
    $("#ordem").addEventListener("change", refiltrar);
    $("#ativos").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; var k = b.dataset.rm;
      if (k === "destino") { destinoFixo = ""; history.replaceState(null, "", location.pathname); }
      else if (k === "q") f.elements.q.value = "";
      else if (k === "mes") f.elements.mes.value = "";
      else if (k === "favoritos") f.elements.favoritos.checked = false;
      else if (k.indexOf("estilo:") === 0) $$('input[name="estilo"]', f).forEach(function (i) { if (i.value === k.slice(7)) i.checked = false; });
      refiltrar();
    });
    $("#limpar").addEventListener("click", function () { f.reset(); range.value = pMax; destinoFixo = ""; history.replaceState(null, "", location.pathname); refiltrar(); });
    $$(".filters-toggle, .close-filters").forEach(function (b) { b.addEventListener("click", function () { document.body.classList.toggle("filters-open"); }); });
    // título dinâmico
    if (destinoFixo && DEST[destinoFixo]) {
      $("#titulo-pacotes").innerHTML = "Pacotes para <em class=\"a\">" + esc(DEST[destinoFixo].nome) + "</em>";
      $(".page-hero img.bg").src = imgDestino(destinoFixo, DEST[destinoFixo]);
    }
    refiltrar();
  }

  /* =========================================================== PACOTE (detalhe) */
  function initPacote() {
    var slug = params().id, box = $("#pacote");
    API.pacote(slug).then(function (p) {
      if (!p) { box.innerHTML = '<section class="section"><div class="wrap"><h1>Pacote não encontrado</h1><p><a class="link-arrow" href="' + ROOT + 'pages/pacotes.html">Ver todos os pacotes ' + icon("arrow") + "</a></p></div></section>"; return; }
      var d = DEST[p.destino] || { nome: "", local: "", temas: [], meses: [] };
      document.title = p.titulo + " · Cesamar Turismo";
      var mesesBons = (d.meses || []).map(function (m) { return MESES[m - 1].slice(0, 3); }).join(" · ");
      box.innerHTML =
        '<section class="pkg-hero"><img class="bg" src="' + imgDestino(p.destino, d) + '" alt=""><div class="wrap">' +
        '<nav class="crumbs" aria-label="Você está em"><a href="' + ROOT + 'index.html">Início</a><span aria-hidden="true">/</span><a href="' + ROOT + 'pages/pacotes.html">Pacotes</a><span aria-hidden="true">/</span><span>' + esc(p.titulo) + "</span></nav>" +
        '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">' + badgeHTML(p) + '<span class="tag tag--glass">' + esc(d.nome) + " · " + esc(d.local) + "</span></div>" +
        "<h1>" + esc(p.titulo) + '</h1><p class="sub">' + esc(p.resumo) + "</p></div></section>" +
        '<nav class="subnav" aria-label="Seções do pacote"><div class="wrap"><a href="#visao" class="on">Visão geral</a><a href="#hospedagem">Hospedagem</a><a href="#inclui">O que inclui</a><a href="#reservar">Consultar</a></div></nav>' +
        '<section class="section" style="padding-top:50px"><div class="wrap detail"><div>' +
        '<div class="facts" id="visao">' +
        fact("Duração", (p.noites + 1) + " dias / " + p.noites + " noites") + fact("Saída", p.saida || "Rio de Janeiro") + fact("Melhor época", d.epoca || "Ano todo") + fact("Estilo", p.tags.map(estiloNome).join(", ")) +
        "</div>" +
        '<span class="eyebrow">Sobre o destino</span><h2 style="font-size:clamp(1.6rem,2.6vw,2.2rem)">' + esc(d.chamada || p.titulo) + '</h2><p class="lead">' + esc(d.descricao || "") + "</p>" +
        '<h2 id="hospedagem" style="margin-top:56px;font-size:clamp(1.6rem,2.6vw,2.2rem)">Passagem + hospedagem</h2><p class="muted">Este pacote combina a passagem aérea de ida e volta com o hotel. Passeios e serviços de guia não fazem parte da oferta.</p><ol class="timeline">' +
        '<li class="reveal"><span class="d">' + icon("plane") + "</span><h4>Passagem aérea de ida e volta</h4><p>Saída de " + esc(p.saida || "Rio de Janeiro") + ", em classe econômica.</p></li>" +
        (p.hospedagem || []).map(function (h, i) { return '<li class="reveal"><span class="d">' + (i + 1) + "</span><h4>" + esc(h.cidade) + " · " + h.noites + " noites</h4><p>" + esc(h.hotel) + "</p></li>"; }).join("") + "</ol>" +
        '<div class="two-col" id="inclui" style="margin-top:40px"><div class="box"><h3>O que inclui</h3><ul class="checks yes">' + p.inclui.map(function (x) { return "<li>" + icon("check") + esc(x) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="box"><h3>Não inclui</h3><ul class="checks no">' + p.naoInclui.map(function (x) { return "<li>" + icon("x") + esc(x) + "</li>"; }).join("") + "</ul></div></div>" +
        '<p class="muted" style="font-size:.84rem;margin-top:22px">Valores por pessoa em apartamento duplo, sujeitos a disponibilidade e alteração no momento da solicitação. Datas e hotéis podem ser ajustados com o consultor.' + (mesesBons ? " Meses recomendados: " + mesesBons + "." : "") + "</p>" +
        "</div>" +
        '<aside class="book" id="reservar">' + precoHTML(p, true) + "<hr>" +
        '<form data-wa-form="pacote" class="form" style="grid-template-columns:1fr 1fr" novalidate>' +
        '<input type="hidden" name="pacote" value="' + esc(p.titulo) + '"><input type="hidden" name="destino" value="' + esc(d.nome) + '">' +
        '<div class="field full"><label for="b-mes">Mês de embarque</label><select id="b-mes" name="mes"></select></div>' +
        '<div class="field"><label>Adultos</label><div class="stepper"><button type="button" data-step="-1" aria-label="Menos adultos">−</button><input name="pessoas" value="2" inputmode="numeric" aria-label="Adultos"><button type="button" data-step="1" aria-label="Mais adultos">+</button></div></div>' +
        '<div class="field"><label>Crianças</label><div class="stepper"><button type="button" data-step="-1" aria-label="Menos crianças">−</button><input name="criancas" value="0" inputmode="numeric" aria-label="Crianças"><button type="button" data-step="1" aria-label="Mais crianças">+</button></div></div>' +
        '<div class="full" id="calc"></div>' +
        '<p class="ad-note full">' + esc(window.Cesamar.store ? window.Cesamar.store.carregar().config.avisoPreco : "") + "</p>" +
        '<button class="btn btn--wa btn--block full" type="submit">' + icon("whatsapp") + "Consultar este pacote</button>" +
        '<p class="consent full">Abre o WhatsApp com a sua mensagem pronta. Este site não guarda seus dados.</p>' +
        "</form></aside></div></section>" +
        '<section class="section section--paper"><div class="wrap"><div class="section-head"><div><span class="eyebrow">Você também pode gostar</span><h2>Outras combinações de <em class="a">passagem + hotel</em></h2></div><a class="link-arrow" href="' + ROOT + 'pages/pacotes.html">Todos os pacotes ' + icon("arrow") + '</a></div><div class="grid grid--3" id="relacionados"></div></div></section>';

      function fact(a, b) { return '<div class="fact"><small>' + a + "</small><b>" + esc(b) + "</b></div>"; }
      var form = $("form", box), selMes = form.elements.mes;
      preencherMeses(selMes, "Ainda não sei");
      $$("option", selMes).forEach(function (o) { var m = +o.getAttribute("data-m"); if (m && (d.meses || []).indexOf(m) >= 0) o.textContent += " ★"; });
      function calc() {
        var ad = Math.max(1, parseInt(form.elements.pessoas.value, 10) || 1), cr = Math.max(0, parseInt(form.elements.criancas.value, 10) || 0);
        form.elements.pessoas.value = ad; form.elements.criancas.value = cr;
        $("#calc").innerHTML = '<div class="total-line"><span>' + ad + " adulto" + (ad > 1 ? "s" : "") + " × " + brl(p.precoAPartir) + "</span><span>" + brl(ad * p.precoAPartir) + "</span></div>" +
          (cr ? '<div class="total-line"><span>' + cr + " criança" + (cr > 1 ? "s" : "") + '</span><span>sob consulta</span></div>' : "") +
          '<div class="total-line big"><span>Total estimado</span><span>' + brl(ad * p.precoAPartir) + "</span></div>";
      }
      form.addEventListener("click", function (e) {
        var b = e.target.closest("[data-step]"); if (!b) return;
        var inp = b.parentNode.querySelector("input"); inp.value = (parseInt(inp.value, 10) || 0) + (+b.dataset.step); calc();
      });
      form.addEventListener("input", calc); calc();
      // relacionados
      var rel = DATA.pacotes.filter(function (x) { return x.slug !== p.slug; }).map(function (x) {
        return { x: x, s: x.tags.filter(function (t) { return p.tags.indexOf(t) >= 0; }).length + (x.tipo === p.tipo ? .5 : 0) };
      }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3).map(function (o) { return o.x; });
      $("#relacionados").innerHTML = rel.map(pkgCard).join("");
      // subnav ativo
      var links = $$(".subnav a");
      var secs = links.map(function (a) { return $(a.getAttribute("href")); });
      window.addEventListener("scroll", function () {
        var y = window.scrollY + 200, idx = 0;
        secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top + window.scrollY < y) idx = i; });
        links.forEach(function (a, i) { a.classList.toggle("on", i === idx); });
      }, { passive: true });
      initLeadForms(); revelar(box);
    });
  }

  /* =========================================================== CRUZEIROS */
  function initCruzeiros() {
    var l = $("#lista-cruzeiros");
    l.innerHTML = DATA.cruzeiros.map(function (c) {
      return '<article class="cruise reveal"><div class="media"><img src="' + ROOT + "assets/img/destinos/" + c.arte + '.svg" alt="" loading="lazy"></div><div class="body">' +
        '<span class="eyebrow">' + c.noites + " noites · " + esc(c.temporada) + "</span><h3 style=\"font-size:clamp(1.6rem,2.4vw,2.2rem)\">" + esc(c.nome) + "</h3><p class=\"muted\">" + esc(c.resumo) + "</p>" +
        '<div class="route" aria-label="Portos">' + c.portos.map(function (p) { return "<span>" + esc(p) + "</span>"; }).join("<i></i>") + "</div>" +
        '<div class="foot" style="display:flex;justify-content:space-between;align-items:end;gap:14px;margin-top:auto;flex-wrap:wrap">' + precoHTML({ precoAPartir: c.precoAPartir, parcelas: 10 }) +
        '<a class="btn btn--ink" href="#cotar" data-cruzeiro="Cruzeiro ' + esc(c.nome) + '">Cotar este cruzeiro</a></div></div></article>';
    }).join("");
    var sel = $("#cotar select[name=destino]"); preencherSelectDestinos(sel);
    preencherMeses($("#cotar select[name=mes]"), "Ainda não sei");
    l.addEventListener("click", function (e) { var b = e.target.closest("[data-cruzeiro]"); if (b) { $$("option", sel).forEach(function (o) { if (o.textContent === b.dataset.cruzeiro) o.selected = true; }); } });
    revelar(l);
  }

  /* =========================================================== SERVIÇOS */
  function initServicos() {
    var g = $("#grid-servicos");
    API.servicos().then(function (s) {
      g.innerHTML = s.map(function (x) { return '<article class="svc reveal"><div class="ico">' + icon(x.icone === "bed" ? "bed" : x.icone) + "</div><h3>" + esc(x.nome) + "</h3><p>" + esc(x.texto) + "</p></article>"; }).join("");
      revelar(g);
    });
  }

  /* =========================================================== CONTATO / genérico */
  function initContato() {
    var P = params();
    preencherSelectDestinos($("select[name=destino]"), P.destino ? (DEST[P.destino] || {}).nome || P.destino : "");
    preencherMeses($("select[name=mes]"), "Ainda não sei");
  }

  /* =========================================================== boot */
  initHeader(); initPromo();
  Promise.all([API.destinos(), API.pacotes(), API.cruzeiros()]).then(function (r) {
    DATA.destinos = r[0] || []; DATA.pacotes = r[1] || []; DATA.cruzeiros = r[2] || []; indexar();
    var api = API.status();
    document.documentElement.setAttribute("data-fonte", api ? "api" : "local");
    try {
      if (PAGE === "home") initHome();
      else if (PAGE === "destinos") initDestinos();
      else if (PAGE === "pacotes") initPacotes();
      else if (PAGE === "pacote") initPacote();
      else if (PAGE === "cruzeiros") initCruzeiros();
      else if (PAGE === "servicos") initServicos();
      else if (PAGE === "contato") initContato();
      else if (PAGE === "quem-somos") initContato();
    } catch (e) { if (window.console) console.error("[Cesamar] erro ao iniciar página", e); }
    if (PAGE !== "pacote") initLeadForms();
    initCounters(); revelar(document);
  });
})();
