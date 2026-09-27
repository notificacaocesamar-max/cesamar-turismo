/* ==========================================================================
   Painel administrativo — VERSÃO OFFLINE (dados no localStorage deste navegador)
   Mesmas telas da versão online; na nuvem o store é trocado por Supabase e o
   robô roda no Cloud Run. Nenhuma oferta vai ao ar sem aprovação manual.
   ========================================================================== */
(function () {
  "use strict";
  var ST = window.Cesamar.store, P = window.Cesamar.precos, ROBO = window.Cesamar.robo, PROV = window.Cesamar.provedores;
  var SS = "cesamar.adm.sessao";
  var STATUS = [["rascunho", "Rascunho"], ["aguardando_aprovacao", "Aguardando aprovação"], ["publicado", "Publicado"], ["pausado", "Pausado"], ["expirado", "Expirado"], ["rejeitado", "Rejeitado"]];
  var TIPOS = [["demonstrativo", "Conteúdo demonstrativo"], ["ao_vivo", "Preço ao vivo"], ["indicativo", "Preço indicativo"], ["manual", "Oferta preparada manualmente"]];
  var ARRED = [["nenhum", "Sem arredondamento (centavos)"], ["inteiro", "Real inteiro acima"], ["dezena", "Dezena acima"], ["centena", "Centena acima"], ["final_90", "Final 9,90"]];
  var CID = { SAO: "São Paulo", RIO: "Rio de Janeiro" };
  var usuario = "", view = "painel", filtroStatus = "aguardando_aprovacao";

  /* ------------------------------------------------------------ utilitários */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function db() { return ST.carregar(); }
  function salvar(msg) { if (!ST.salvar()) toast("Não foi possível salvar: armazenamento do navegador cheio ou bloqueado."); else if (msg) toast(msg); }
  function brl(v) { return v == null || v === "" ? "—" : P.brl(v); }
  function dt(s) { if (!s) return "—"; var d = new Date(s); return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  function dBR(s) { if (!s) return "—"; var p = s.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function stNome(k) { var s = STATUS.filter(function (x) { return x[0] === k; })[0]; return s ? s[1] : k; }
  function tipoNome(k) { var s = TIPOS.filter(function (x) { return x[0] === k; })[0]; return s ? s[1] : k; }
  function destNome(id) { var d = ST.destino(id); return d ? (d.nomeExibicao || d.nome) : id; }
  function toast(t) { var el = $(".toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove("show"); }, 3000); }
  function uid(p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function opts(lista, atual) { return lista.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(atual) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); }
  function num(v) { if (v === "" || v == null) return ""; var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : ""; }
  function auditar(acao, detalhe) { db().logs.unshift({ id: uid("LOG"), execucaoId: null, nivel: "info", etapa: "painel", mensagem: usuario + ": " + acao + (detalhe ? " — " + detalhe : ""), destinoId: null, criadoEm: new Date().toISOString() }); }
  function head(eyebrow, titulo, extra) { return '<header class="adm-head"><div><span class="eyebrow">' + eyebrow + "</span><h1>" + titulo + "</h1></div>" + (extra || "") + "</header>"; }
  function regraPadrao() { return db().precos.filter(function (r) { return !r.destinoId; })[0]; }
  function regraDestino(id) { return db().precos.filter(function (r) { return r.destinoId === id; })[0]; }

  /* ------------------------------------------------------------ login (demonstração) */
  function entrar(nome, viewInicial) {
    if (viewInicial) view = viewInicial;
    usuario = nome; try { sessionStorage.setItem(SS, nome); } catch (e) { }
    $("#login").hidden = true; $("#app").hidden = false; $("#user-nome").textContent = nome; ir(view);
  }
  window.CesamarAdminEntrar = entrar;

  /* ------------------------------------------------------------ navegação */
  $("#adm-nav").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) ir(b.dataset.view); });
  function ir(v) {
    view = v;
    $$("#adm-nav button").forEach(function (b) { b.classList.toggle("on", b.dataset.view === v); });
    var pend = db().ofertas.filter(function (o) { return o.status === "aguardando_aprovacao" || o.atualizacaoPendente; }).length;
    $("#pill-pend").hidden = !pend; $("#pill-pend").textContent = pend;
    ({ painel: vPainel, ofertas: vOfertas, robo: vRobo, regras: vRegras, precos: vPrecos, destinos: vDestinos, textos: vTextos, imagens: vImagens, whatsapp: vWhats, metricas: vMetricas, config: vConfig }[v] || vPainel)();
    window.scrollTo(0, 0);
  }
  function main(html) { $("#adm-main").innerHTML = html; }

  /* ------------------------------------------------------------ drawer */
  function abrir(html) { $("#drawer-body").innerHTML = html; $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); }
  function fechar() { $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); }
  $("#drawer").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) fechar(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });

  /* ============================================================ PAINEL */
  function vPainel() {
    var D = db(), of = D.ofertas;
    var cont = function (s) { return of.filter(function (o) { return o.status === s; }).length; };
    var views = D.metricas.filter(function (m) { return m.tipo === "visualizacao"; }).length;
    var conh = D.metricas.filter(function (m) { return m.tipo === "conhecer"; }).length;
    var ult = (D.execucoes || [])[0];
    var dias = {}, hoje = new Date();
    for (var i = 29; i >= 0; i--) dias[new Date(hoje - i * 864e5).toISOString().slice(0, 10)] = 0;
    D.cliques.forEach(function (c) { var k = c.ts.slice(0, 10); if (k in dias) dias[k]++; });
    var max = Math.max.apply(null, Object.keys(dias).map(function (k) { return dias[k]; }).concat([1]));
    var barras = Object.keys(dias).map(function (k, i) { var h = dias[k] / max * 150; return '<rect x="' + (i * 30 + 4) + '" y="' + (170 - h) + '" width="22" height="' + Math.max(h, 2) + '" rx="4" fill="' + (dias[k] ? "#1fa855" : "#e5e1ea") + '"><title>' + dBR(k) + ": " + dias[k] + " clique(s)</title></rect>" + (i % 5 === 0 ? '<text x="' + (i * 30 + 15) + '" y="190" font-size="11" text-anchor="middle" fill="#5e6180">' + k.slice(8) + "/" + k.slice(5, 7) + "</text>" : ""); }).join("");
    var porDest = {}; D.cliques.forEach(function (c) { if (c.destinoId) porDest[c.destinoId] = (porDest[c.destinoId] || 0) + 1; });
    var rank = Object.keys(porDest).sort(function (a, b) { return porDest[b] - porDest[a]; }).slice(0, 6);
    main(head("Visão geral", "Painel de ofertas", '<button class="btn btn--sm" data-acao="robo">Executar robô agora</button>') +
      '<div class="adm-kpis">' + [["Aguardando aprovação", cont("aguardando_aprovacao"), "#d98a1c"], ["Publicadas", cont("publicado"), "#1f8a5b"], ["Visualizações", views, "#3b3a8f"], ["Cliques em Conhecer", conh, "#111436"], ["Cliques no WhatsApp", D.cliques.length, "#1fa855"]]
        .map(function (k) { return '<div class="kpi"><i style="background:' + k[2] + '"></i><small>' + k[0] + "</small><b>" + k[1] + "</b></div>"; }).join("") + "</div>" +
      '<div class="adm-grid2"><div class="adm-card"><h3>Cliques no WhatsApp — últimos 30 dias</h3><div class="adm-chart"><svg viewBox="0 0 900 200" preserveAspectRatio="none">' + barras + "</svg></div></div>" +
      '<div class="adm-card"><h3>Última execução do robô</h3>' + (ult ? '<p style="margin:0 0 8px"><b>' + dt(ult.inicio) + "</b> · provedor " + esc(ult.provedor) + '</p><ul class="adm-mini">' +
        "<li>Regras processadas <b>" + ult.regras + "</b></li><li>Ofertas novas <b>" + ult.novas + "</b></li><li>Atualizadas <b>" + ult.atualizadas + "</b></li><li>Sem alteração <b>" + ult.semAlteracao + "</b></li><li>Expiradas <b>" + ult.expiradas + '</b></li><li>Erros <b class="' + (ult.erros ? "t-err" : "") + '">' + ult.erros + "</b></li></ul>" : '<p class="muted">O robô ainda não rodou.</p>') +
        '<p class="muted" style="font-size:.84rem;margin:12px 0 0">Na versão online ele roda sozinho 1x por dia (' + esc(D.config.robo.horario) + ", Cloud Scheduler).</p></div></div>" +
      '<div class="adm-grid2"><div class="adm-card"><h3>Destinos com mais cliques no WhatsApp</h3><ol class="adm-rank">' + (rank.map(function (id) { return "<li><span>" + esc(destNome(id)) + "</span><b>" + porDest[id] + "</b></li>"; }).join("") || '<li style="grid-template-columns:1fr">Ainda sem cliques.</li>') + "</ol></div>" +
      '<div class="adm-card"><h3>Atenção</h3><ul class="adm-mini">' + alertas() + "</ul></div></div>");
    $("[data-acao=robo]").addEventListener("click", function () { ir("robo"); setTimeout(rodarRobo, 50); });
  }
  function alertas() {
    var D = db(), out = [];
    var pend = D.ofertas.filter(function (o) { return o.atualizacaoPendente; }).length;
    if (pend) out.push("<li>" + pend + " oferta(s) publicada(s) com nova cotação aguardando aprovação.</li>");
    var ag = D.ofertas.filter(function (o) { return o.status === "aguardando_aprovacao"; }).length;
    if (ag) out.push("<li>" + ag + " oferta(s) aguardando aprovação.</li>");
    var erros = D.logs.filter(function (l) { return l.nivel === "erro"; }).length;
    if (erros) out.push('<li class="t-err">' + erros + " erro(s) registrados pelo robô.</li>");
    if (D.imagens.some(function (i) { return i.demonstrativa; })) out.push("<li>Imagens ainda são ilustrações demonstrativas — troque por fotos próprias ou licenciadas.</li>");
    if (D.config.whatsappNumero === "5521993939181") out.push("<li>Confirme o número de WhatsApp da central (veio do site atual).</li>");
    return out.join("") || "<li>Tudo em ordem.</li>";
  }

  /* ============================================================ OFERTAS */
  function vOfertas() {
    var D = db();
    var cont = {}; D.ofertas.forEach(function (o) { cont[o.status] = (cont[o.status] || 0) + 1; });
    var abas = [["", "Todas", D.ofertas.length]].concat(STATUS.map(function (s) { return [s[0], s[1], cont[s[0]] || 0]; }));
    var l = D.ofertas.filter(function (o) { return !filtroStatus || o.status === filtroStatus; }).sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
    main(head("Anúncios", "Ofertas encontradas", '<button class="btn btn--sm btn--ink" id="nova-oferta">+ Oferta manual</button>') +
      '<div class="tabs adm-tabs" id="abas">' + abas.map(function (a) { return '<button data-st="' + a[0] + '" aria-selected="' + (filtroStatus === a[0]) + '">' + a[1] + "<span>" + a[2] + "</span></button>"; }).join("") + "</div>" +
      '<div class="adm-card adm-table-wrap"><table class="adm-table"><thead><tr><th>Código</th><th>Oferta</th><th>Origem</th><th>Ida / volta</th><th>Custo</th><th>Anunciado</th><th>Tipo</th><th>Status</th><th>Cliques</th></tr></thead><tbody>' +
      (l.map(function (o) {
        return '<tr data-cod="' + esc(o.codigo) + '"><td><b>' + esc(o.codigo) + "</b>" + (o.atualizacaoPendente ? '<small class="t-warn">nova cotação</small>' : "") + "</td><td>" + esc(o.titulo) + "<small>" + esc(o.companhia) + " · " + (Math.max(o.escalasIda, o.escalasVolta) === 0 ? "direto" : Math.max(o.escalasIda, o.escalasVolta) + " escala(s)") + (o.bagagem ? " · com bagagem" : "") + "</small></td>" +
          "<td>" + esc(CID[o.cidadeOrigem]) + "<small>" + esc(o.aeroportoOrigem) + "</small></td><td>" + dBR(o.dataIda) + "<small>" + dBR(o.dataVolta) + "</small></td>" +
          "<td>" + brl(o.custoOriginal) + "</td><td><b>" + brl(o.preco.precoParcelado) + "</b><small>" + o.preco.parcelas + "x " + brl(o.preco.valorParcela) + "</small></td>" +
          "<td><small>" + esc(tipoNome(o.tipoPreco)) + '</small></td><td><span class="st st-' + o.status + '">' + stNome(o.status) + "</span><small>" + dt(o.atualizadoEm) + "</small></td><td>" + (o.cliques || 0) + "<small>" + (o.visualizacoes || 0) + " visualiz.</small></td></tr>";
      }).join("") || '<tr><td colspan="9" class="empty">Nenhuma oferta neste status.</td></tr>') + "</tbody></table></div>");
    $("#abas").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { filtroStatus = b.dataset.st; vOfertas(); } });
    $("tbody").addEventListener("click", function (e) { var tr = e.target.closest("tr[data-cod]"); if (tr) abrirOferta(tr.dataset.cod); });
    $("#nova-oferta").addEventListener("click", novaOfertaManual);
  }

  function abrirOferta(cod) {
    var D = db(), o = ST.oferta(cod); if (!o) return;
    var p = o.preco, pend = o.atualizacaoPendente;
    var acoes = [];
    if (o.status !== "publicado") acoes.push(["publicar", "Aprovar e publicar", "btn--wa"]);
    if (o.status === "publicado") acoes.push(["pausar", "Pausar", "btn--ghost"]);
    if (o.status === "pausado") acoes.push(["reativar", "Reativar", "btn--wa"]);
    if (["rascunho", "aguardando_aprovacao", "pausado"].indexOf(o.status) >= 0) acoes.push(["rejeitar", "Rejeitar", "btn--ghost"]);
    if (["rejeitado", "expirado"].indexOf(o.status) >= 0) acoes.push(["rascunho", "Voltar para rascunho", "btn--ghost"]);
    abrir('<span class="st st-' + o.status + '">' + stNome(o.status) + '</span><h2 style="margin:12px 0 2px">' + esc(o.codigo) + " · " + esc(destNome(o.destinoId)) + '</h2><p class="muted" style="margin:0">Pesquisado ' + dt(o.pesquisadoEm) + " · fonte " + esc(o.fonte) + " · " + esc(tipoNome(o.tipoPreco)) + "</p>" +
      '<div class="d-actions">' + acoes.map(function (a) { return '<button class="btn btn--sm ' + a[2] + '" data-st-acao="' + a[0] + '">' + a[1] + "</button>"; }).join("") +
      '<a class="btn btn--sm btn--ghost" target="_blank" href="../pages/oferta.html?codigo=' + encodeURIComponent(o.codigo) + '&preview=1">Pré-visualizar</a></div>' +
      (pend ? '<div class="adm-alert"><b>Nova cotação encontrada pelo robô</b><br>' + CID[pend.cidadeOrigem] + " (" + pend.aeroportoOrigem + ") · " + dBR(pend.dataIda) + "–" + dBR(pend.dataVolta) + " · " + esc(pend.companhia) + "<br>Custo " + brl(pend.custoOriginal) + " → anúncio <b>" + brl(pend.preco.precoParcelado) + "</b> (" + pend.preco.parcelas + "x " + brl(pend.preco.valorParcela) + ') · atual ' + brl(p.precoParcelado) + '<div style="margin-top:10px;display:flex;gap:8px"><button class="btn btn--sm btn--wa" data-pend="aplicar">Aprovar nova cotação</button><button class="btn btn--sm btn--ghost" data-pend="descartar">Descartar</button></div></div>' : "") +
      '<div class="d-grid">' + [["Origem", CID[o.cidadeOrigem] + " · " + o.aeroportoOrigem], ["Destino", o.aeroportoDestino], ["Ida", dBR(o.dataIda)], ["Volta", dBR(o.dataVolta)], ["Companhia", o.companhia], ["Escalas", "ida " + o.escalasIda + " · volta " + o.escalasVolta], ["Bagagem", o.bagagem ? "Incluída" : "Não incluída"], ["Classe", { economica: "Econômica", premium: "Premium economy", executiva: "Executiva" }[o.classe] || o.classe],
        ["Custo original", brl(o.custoOriginal)], ["Preço anunciado", brl(p.precoParcelado)], ["Preço Pix", brl(p.precoPix)], ["Parcelas", p.parcelas + "x " + brl(p.valorParcela)], ["Ganho", brl(p.ganhoReais) + " (" + String(p.ganhoPct).replace(".", ",") + "%)"], ["Cliques WhatsApp", o.cliques || 0]]
        .map(function (x) { return "<div><small>" + x[0] + "</small><b>" + esc(x[1]) + "</b></div>"; }).join("") + "</div>" +
      '<form id="f-oferta" class="form" style="grid-template-columns:1fr 1fr">' +
      '<div class="field full"><label>Título do anúncio</label><input name="titulo" value="' + esc(o.titulo) + '"></div>' +
      '<div class="field full"><label>Subtítulo</label><input name="subtitulo" value="' + esc(o.subtitulo) + '"></div>' +
      '<div class="field full"><label>Chamada</label><input name="chamada" value="' + esc(o.chamada) + '"></div>' +
      '<div class="field"><label>Campanha</label><select name="campanhaId"><option value="">—</option>' + opts(D.campanhas.map(function (c) { return [c.id, c.nome]; }), o.campanhaId) + "</select></div>" +
      '<div class="field"><label>Identificação do preço</label><select name="tipoPreco">' + opts(TIPOS, o.tipoPreco) + "</select></div>" +
      '<div class="field"><label>Custo original (R$)</label><input name="custo" inputmode="decimal" value="' + o.custoOriginal + '"></div>' +
      '<div class="field"><label>&nbsp;</label><button type="button" class="btn btn--ghost" id="recalc">Recalcular com as regras atuais</button></div>' +
      '<button class="btn full" type="submit">Salvar edição</button></form>' +
      '<h3 style="font-size:1rem;margin-top:26px">Mensagem do WhatsApp</h3><div class="d-msg">' + esc(ST.mensagemOferta(o)) + "</div>" +
      '<h3 style="font-size:1rem;margin-top:26px">Histórico de preços</h3><table class="adm-table adm-table--sm"><thead><tr><th>Data</th><th>Origem</th><th>Datas</th><th>Custo</th><th>Anunciado</th></tr></thead><tbody>' +
      (o.historico || []).map(function (h) { return "<tr><td>" + dt(h.data) + "</td><td>" + esc(h.cidadeOrigem || "") + "</td><td>" + dBR(h.dataIda) + "<small>" + dBR(h.dataVolta) + "</small></td><td>" + brl(h.custo) + "</td><td>" + brl(h.precoAnunciado) + "</td></tr>"; }).join("") + "</tbody></table>");

    $$("[data-st-acao]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.stAcao, antes = o.status;
        o.status = { publicar: "publicado", pausar: "pausado", reativar: "publicado", rejeitar: "rejeitado", rascunho: "rascunho" }[a];
        if (o.status === "publicado") { o.publicadoEm = o.publicadoEm || new Date().toISOString(); o.aprovadoPor = usuario; }
        o.atualizadoEm = new Date().toISOString();
        auditar("oferta " + o.codigo + ": " + stNome(antes) + " → " + stNome(o.status));
        salvar("Oferta " + o.codigo + ": " + stNome(o.status)); abrirOferta(cod); if (view === "ofertas") vOfertas();
      });
    });
    $$("[data-pend]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.pend === "aplicar") { ROBO.aplicarAtualizacao(o, ST.destino(o.destinoId), D.config); auditar("oferta " + o.codigo + ": nova cotação aprovada"); }
        else { delete o.atualizacaoPendente; auditar("oferta " + o.codigo + ": nova cotação descartada"); }
        salvar("Oferta atualizada"); abrirOferta(cod); vOfertas();
      });
    });
    $("#recalc").addEventListener("click", function () {
      var f = $("#f-oferta");
      try {
        var c = num(f.custo.value); var r = P.calcular(c, regraPadrao(), regraDestino(o.destinoId)); delete r.regra;
        o.custoOriginal = c; o.preco = r; o.atualizadoEm = new Date().toISOString();
        o.historico = o.historico || []; o.historico.unshift({ data: o.atualizadoEm, custo: c, precoAnunciado: r.precoParcelado, companhia: o.companhia, dataIda: o.dataIda, dataVolta: o.dataVolta, cidadeOrigem: o.cidadeOrigem, manual: true });
        if (o.status === "publicado") { o.status = "aguardando_aprovacao"; toast("Preço mudou: a oferta voltou para aprovação."); }
        auditar("oferta " + o.codigo + ": preço recalculado", brl(r.precoParcelado));
        salvar(); abrirOferta(cod); vOfertas();
      } catch (err) { toast(err.message); }
    });
    $("#f-oferta").addEventListener("submit", function (e) {
      e.preventDefault(); var f = this;
      o.titulo = f.titulo.value.trim(); o.subtitulo = f.subtitulo.value.trim(); o.chamada = f.chamada.value.trim();
      o.campanhaId = f.campanhaId.value || null; o.tipoPreco = f.tipoPreco.value; o.textosAuto = false; o.atualizadoEm = new Date().toISOString();
      auditar("oferta " + o.codigo + ": textos editados"); salvar("Edição salva"); abrirOferta(cod); vOfertas();
    });
  }

  function novaOfertaManual() {
    var D = db();
    abrir('<h2 style="margin-top:0">Nova oferta manual</h2><p class="muted">Use quando o consultor encontrar uma tarifa fora do robô. Ela entra como rascunho e precisa de aprovação.</p>' +
      '<form id="f-nova" class="form" style="grid-template-columns:1fr 1fr">' +
      '<div class="field full"><label>Destino</label><select name="destinoId">' + opts(D.destinos.map(function (d) { return [d.id, (d.nomeExibicao || d.nome) + " (" + d.aeroporto + ")"]; })) + "</select></div>" +
      '<div class="field"><label>Aeroporto de partida</label><select name="aeroportoOrigem">' + opts(D.aeroportos.filter(function (a) { return a.origem; }).map(function (a) { return [a.iata, a.iata + " — " + a.nome]; })) + "</select></div>" +
      '<div class="field"><label>Companhia</label><input name="companhia" required></div>' +
      '<div class="field"><label>Data de ida</label><input type="date" name="dataIda" required></div><div class="field"><label>Data de volta</label><input type="date" name="dataVolta" required></div>' +
      '<div class="field"><label>Escalas (ida)</label><input type="number" min="0" max="3" name="escalasIda" value="1"></div><div class="field"><label>Escalas (volta)</label><input type="number" min="0" max="3" name="escalasVolta" value="1"></div>' +
      '<div class="field"><label>Bagagem despachada</label><select name="bagagem"><option value="0">Não incluída</option><option value="1">Incluída</option></select></div>' +
      '<div class="field"><label>Custo da tarifa (R$)</label><input name="custo" inputmode="decimal" required></div>' +
      '<button class="btn full" type="submit">Criar rascunho</button></form>');
    $("#f-nova").addEventListener("submit", function (e) {
      e.preventDefault(); var f = this;
      try {
        var d = ST.destino(f.destinoId.value), aero = D.aeroportos.filter(function (a) { return a.iata === f.aeroportoOrigem.value; })[0];
        if (f.dataVolta.value <= f.dataIda.value) throw new Error("A volta precisa ser depois da ida.");
        var c = num(f.custo.value), preco = P.calcular(c, regraPadrao(), regraDestino(d.id)); delete preco.regra;
        var agora = new Date().toISOString(), txt = ROBO.textosPadrao(d, aero.cidadeGrupo, f.dataIda.value, D.config);
        var o = { id: uid("OFE"), codigo: ROBO.gerarCodigo(d, f.dataIda.value, D.ofertas), regraId: null, destinoId: d.id, status: "rascunho", campanhaId: (d.campanhas || [])[0] || null,
          titulo: txt.titulo, subtitulo: txt.subtitulo, chamada: txt.chamada, textosAuto: true, cidadeOrigem: aero.cidadeGrupo, aeroportoOrigem: aero.iata, aeroportoDestino: d.aeroporto,
          dataIda: f.dataIda.value, dataVolta: f.dataVolta.value, companhia: f.companhia.value.trim(), escalasIda: +f.escalasIda.value, escalasVolta: +f.escalasVolta.value, classe: "economica",
          bagagem: f.bagagem.value === "1", custoOriginal: c, moeda: "BRL", preco: preco, tipoPreco: "manual", fonte: "manual:" + usuario, pesquisadoEm: agora, criadoEm: agora, atualizadoEm: agora,
          historico: [{ data: agora, custo: c, precoAnunciado: preco.precoParcelado, companhia: f.companhia.value, dataIda: f.dataIda.value, dataVolta: f.dataVolta.value, cidadeOrigem: aero.cidadeGrupo, manual: true }], cliques: 0, visualizacoes: 0 };
        D.ofertas.unshift(o); auditar("oferta manual criada", o.codigo); salvar("Rascunho " + o.codigo + " criado");
        filtroStatus = "rascunho"; vOfertas(); abrirOferta(o.codigo);
      } catch (err) { toast(err.message); }
    });
  }

  /* ============================================================ ROBÔ */
  function vRobo() {
    var D = db(), cfg = D.config.robo;
    var nivel = vRobo.nivel || "";
    var logs = D.logs.filter(function (l) { return !nivel || l.nivel === nivel; }).slice(0, 200);
    main(head("Automação", "Robô e registros", '<button class="btn btn--sm" id="rodar">Executar robô agora</button>') +
      '<div class="adm-grid2"><div class="adm-card"><h3>Execução</h3><form id="f-robo" class="form" style="grid-template-columns:1fr 1fr">' +
      '<div class="field"><label>Provedor de tarifas</label><select name="provedor"><option value="demo">Demonstração (dados simulados)</option><option disabled>Amadeus — requer servidor</option><option disabled>Duffel — requer servidor</option><option disabled>Skyscanner — requer servidor</option></select></div>' +
      '<div class="field"><label>Horário diário (versão online)</label><input name="horario" type="time" value="' + esc(cfg.horario) + '"></div>' +
      '<div class="field full"><label>Simular falha nestes destinos (para testar o registro de erros)</label><select name="falhas" multiple size="4">' + opts(D.destinos.map(function (d) { return [d.aeroporto, destNome(d.id) + " (" + d.aeroporto + ")"]; })).replace(/<option value="([A-Z]{3})"/g, function (m, i) { return (cfg.simularFalhaEm || []).indexOf(i) >= 0 ? m + " selected" : m; }) + "</select></div>" +
      '<div class="field"><label>Validade da pesquisa (dias)</label><input name="validade" type="number" min="1" value="' + D.config.validadeOfertaDias + '"></div>' +
      '<div class="field"><label>Antecedência mínima do embarque (dias)</label><input name="antecedencia" type="number" min="0" value="' + D.config.antecedenciaMinimaDias + '"></div>' +
      '<button class="btn btn--ghost full" type="submit">Salvar configuração</button></form>' +
      '<p class="muted" style="font-size:.84rem">No navegador o robô usa apenas o provedor de demonstração. Provedores reais rodam no servidor (Cloud Run), com as chaves em variáveis de ambiente.</p><div id="robo-status"></div></div>' +
      '<div class="adm-card"><h3>Execuções recentes</h3><table class="adm-table adm-table--sm"><thead><tr><th>Início</th><th>Novas</th><th>Atualiz.</th><th>Expir.</th><th>Erros</th></tr></thead><tbody>' +
      (D.execucoes || []).slice(0, 12).map(function (x) { return "<tr><td>" + dt(x.inicio) + "<small>" + esc(x.provedor) + "</small></td><td>" + x.novas + "</td><td>" + x.atualizadas + "</td><td>" + x.expiradas + '</td><td class="' + (x.erros ? "t-err" : "") + '">' + x.erros + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
      '<div class="adm-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><h3 style="margin:0">Registro (logs)</h3><div class="tabs" id="niveis">' +
      [["", "Todos"], ["erro", "Erros"], ["aviso", "Avisos"], ["info", "Informações"]].map(function (n) { return '<button data-n="' + n[0] + '" aria-selected="' + (nivel === n[0]) + '">' + n[1] + "</button>"; }).join("") + "</div></div>" +
      '<div class="adm-table-wrap" style="margin-top:14px;max-height:520px;overflow:auto"><table class="adm-table adm-table--sm"><thead><tr><th>Quando</th><th>Nível</th><th>Etapa</th><th>Mensagem</th></tr></thead><tbody>' +
      (logs.map(function (l) { return "<tr><td>" + dt(l.criadoEm) + '</td><td><span class="lv lv-' + l.nivel + '">' + l.nivel + "</span></td><td>" + esc(l.etapa) + "</td><td>" + esc(l.mensagem) + "</td></tr>"; }).join("") || '<tr><td colspan="4" class="empty">Sem registros.</td></tr>') + "</tbody></table></div></div>");
    $("#rodar").addEventListener("click", rodarRobo);
    $("#niveis").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { vRobo.nivel = b.dataset.n; vRobo(); } });
    $("#f-robo").addEventListener("submit", function (e) {
      e.preventDefault(); var f = this;
      cfg.horario = f.horario.value; cfg.simularFalhaEm = $$("option:checked", f.falhas).map(function (o) { return o.value; });
      D.config.validadeOfertaDias = +f.validade.value || 7; D.config.antecedenciaMinimaDias = +f.antecedencia.value || 0;
      auditar("configuração do robô alterada"); salvar("Configuração salva");
    });
  }
  function rodarRobo() {
    var D = db(), st = $("#robo-status");
    if (st) st.innerHTML = '<div class="adm-alert">Executando… consultando preços indicativos e ao vivo.</div>';
    var reg = {}; D.destinos.forEach(function (d) { reg[d.aeroporto] = d.regiao; });
    var hoje = new Date().toISOString().slice(0, 10);
    var prov = PROV.criarProvedor("demo", { diaExecucao: hoje, regiaoPorIata: reg, falharEm: D.config.robo.simularFalhaEm || [] });
    setTimeout(function () {
      ROBO.executar(D, { provedor: prov }).then(function (r) {
        salvar(); vRobo();
        $("#robo-status").innerHTML = '<div class="adm-alert ' + (r.erros ? "adm-alert--err" : "adm-alert--ok") + '">Concluído: ' + r.novas + " novas, " + r.atualizadas + " atualizadas (aguardando aprovação), " + r.semAlteracao + " sem alteração, " + r.expiradas + " expiradas, " + r.erros + " erro(s).</div>";
        var pend = D.ofertas.filter(function (o) { return o.status === "aguardando_aprovacao" || o.atualizacaoPendente; }).length;
        $("#pill-pend").hidden = !pend; $("#pill-pend").textContent = pend;
      });
    }, 30);
  }

  /* ============================================================ REGRAS DE MONITORAMENTO */
  function vRegras() {
    var D = db();
    main(head("Robô", "Regras de monitoramento", '<button class="btn btn--sm btn--ink" id="salvar-regras">Salvar alterações</button>') +
      '<p class="muted">Um passageiro adulto, classe econômica. Para cada destino o robô compara São Paulo (GRU, CGH, VCP) e Rio de Janeiro (GIG, SDU) e consulta preços ao vivo para até 3 combinações de datas.</p>' +
      '<div class="adm-card adm-table-wrap"><table class="adm-table adm-table--sm adm-edit"><thead><tr><th>Ativa</th><th>Destino</th><th>Período (ida)</th><th>Duração (dias)</th><th>Máx. escalas</th><th>Bagagem</th><th>Origens</th><th>Combinações</th></tr></thead><tbody>' +
      D.regras.map(function (r) {
        return '<tr data-id="' + r.id + '"><td><input type="checkbox" name="ativo"' + (r.ativo ? " checked" : "") + '></td><td><b>' + esc(destNome(r.destinoId)) + "</b><small>" + esc((ST.destino(r.destinoId) || {}).aeroporto) + "</small></td>" +
          '<td><input type="date" name="periodoInicio" value="' + r.periodoInicio + '"><input type="date" name="periodoFim" value="' + r.periodoFim + '"></td>' +
          '<td><input type="number" min="1" max="60" name="duracaoMin" value="' + r.duracaoMin + '" title="mínima"> a <input type="number" min="1" max="60" name="duracaoMax" value="' + r.duracaoMax + '" title="máxima"></td>' +
          '<td><select name="maxEscalas">' + opts([[0, "Só direto"], [1, "Até 1"], [2, "Até 2"], [3, "Até 3"]], r.maxEscalas) + "</select></td>" +
          '<td><label class="chk"><input type="checkbox" name="exigirBagagem"' + (r.exigirBagagem ? " checked" : "") + "> exigir</label></td>" +
          '<td><label class="chk"><input type="checkbox" name="SAO"' + (r.origens.indexOf("SAO") >= 0 ? " checked" : "") + '> SP</label><label class="chk"><input type="checkbox" name="RIO"' + (r.origens.indexOf("RIO") >= 0 ? " checked" : "") + "> RJ</label></td>" +
          '<td><select name="combinacoes">' + opts([[1, "1"], [2, "2"], [3, "3"]], r.combinacoes) + "</select></td></tr>";
      }).join("") + "</tbody></table></div>");
    $("#salvar-regras").addEventListener("click", function () {
      var erros = [];
      $$("tbody tr").forEach(function (tr) {
        var r = D.regras.filter(function (x) { return x.id === tr.dataset.id; })[0], g = function (n) { return tr.querySelector('[name="' + n + '"]'); };
        var novo = { ativo: g("ativo").checked, periodoInicio: g("periodoInicio").value, periodoFim: g("periodoFim").value, duracaoMin: +g("duracaoMin").value, duracaoMax: +g("duracaoMax").value,
          maxEscalas: +g("maxEscalas").value, exigirBagagem: g("exigirBagagem").checked, origens: ["SAO", "RIO"].filter(function (c) { return g(c).checked; }), combinacoes: +g("combinacoes").value };
        if (novo.periodoFim < novo.periodoInicio) erros.push(destNome(r.destinoId) + ": fim antes do início");
        else if (novo.duracaoMax < novo.duracaoMin) erros.push(destNome(r.destinoId) + ": duração máxima menor que a mínima");
        else if (!novo.origens.length) erros.push(destNome(r.destinoId) + ": escolha ao menos uma origem");
        else Object.assign(r, novo);
      });
      if (erros.length) { toast(erros[0]); return; }
      auditar("regras de monitoramento salvas"); salvar("Regras salvas");
    });
  }

  /* ============================================================ PREÇOS */
  function vPrecos() {
    var D = db(), r = regraPadrao(), pc = D.config.parcelamento;
    main(head("Regra de preço", "Preços e parcelamento") +
      '<div class="adm-grid2"><div class="adm-card"><h3>Regra padrão</h3><form id="f-preco" class="form" style="grid-template-columns:1fr 1fr">' + camposRegra(r, false) +
      '<button class="btn full" type="submit">Salvar regra padrão</button></form></div>' +
      '<div class="adm-card"><h3>Simulador</h3><div class="field"><label>Custo encontrado (R$)</label><input id="sim-custo" inputmode="decimal" value="4300"></div>' +
      '<div class="field" style="margin-top:10px"><label>Destino (aplica a regra específica, se houver)</label><select id="sim-dest"><option value="">— regra padrão —</option>' + opts(D.destinos.map(function (d) { return [d.id, destNome(d.id)]; })) + '</select></div><div id="sim-out" class="sim-out"></div>' +
      '<p class="muted" style="font-size:.82rem">Acréscimo: preço = custo × (1 + margem). Margem sobre o preço final: preço = custo ÷ (1 − margem − taxas). Arredondamento sempre para cima; nunca abaixo do custo.</p></div></div>' +
      '<div class="adm-card"><h3>Regras por destino</h3><p class="muted" style="margin-top:-6px">Campos vazios herdam a regra padrão.</p><div class="adm-table-wrap"><table class="adm-table adm-table--sm"><thead><tr><th>Destino</th><th>Margem</th><th>Mínimo</th><th>Parcelas</th><th>Custo financeiro</th><th></th></tr></thead><tbody>' +
      D.precos.filter(function (x) { return x.destinoId; }).map(function (x) { return '<tr data-id="' + x.id + '"><td><b>' + esc(destNome(x.destinoId)) + "</b></td><td>" + (x.margemPct != null && x.margemPct !== "" ? x.margemPct + "%" : "herda") + "</td><td>" + (x.margemMinimaReais != null && x.margemMinimaReais !== "" ? brl(x.margemMinimaReais) : "herda") + "</td><td>" + (x.parcelas || "herda") + "</td><td>" + (x.custoFinanceiroPct != null && x.custoFinanceiroPct !== "" ? x.custoFinanceiroPct + "%" : "herda") + '</td><td><button class="btn btn--ghost btn--sm" data-editar="' + x.id + '">Editar</button></td></tr>'; }).join("") +
      '</tbody></table></div><div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><select id="nova-regra-dest">' + opts(D.destinos.filter(function (d) { return !regraDestino(d.id); }).map(function (d) { return [d.id, destNome(d.id)]; })) + '</select><button class="btn btn--sm btn--ink" id="nova-regra">+ Regra para o destino</button></div></div>' +
      '<div class="adm-card"><h3>Bloco "Viajar ficou mais fácil" e condições</h3><form id="f-parc" class="form" style="grid-template-columns:1fr 1fr">' +
      '<div class="field full"><label>Título</label><input name="titulo" value="' + esc(pc.titulo) + '"></div><div class="field full"><label>Texto</label><textarea name="texto">' + esc(pc.texto) + "</textarea></div>" +
      '<div class="field full"><label>Condições especiais (juros, entrada…) — aparece no bloco quando preenchido</label><input name="condicoes" value="' + esc(pc.condicoes) + '"></div>' +
      '<button class="btn btn--ghost full" type="submit">Salvar texto do parcelamento</button></form></div>' +
      '<div class="adm-card"><h3>Aplicar regras às ofertas</h3><p class="muted">Recalcula o preço anunciado a partir do custo original guardado. Ofertas publicadas recebem a nova cotação como pendente (precisa aprovar).</p><button class="btn btn--sm" id="recalc-todas">Recalcular ofertas</button></div>');
    var simular = function () {
      var out = $("#sim-out");
      try {
        var x = P.calcular(num($("#sim-custo").value), regraPadrao(), $("#sim-dest").value ? regraDestino($("#sim-dest").value) : null);
        out.innerHTML = "<div><small>Preço anunciado</small><b>" + brl(x.precoParcelado) + "</b></div><div><small>Parcelas</small><b>" + x.parcelas + "x " + brl(x.valorParcela) + "</b></div><div><small>Preço Pix</small><b>" + brl(x.precoPix) + "</b></div><div><small>Ganho</small><b>" + brl(x.ganhoReais) + " (" + String(x.ganhoPct).replace(".", ",") + "%)</b></div>" +
          '<p class="sim-texto">' + esc(P.textoPreco(x)) + "</p>";
      } catch (e) { out.innerHTML = '<p class="t-err">' + esc(e.message) + "</p>"; }
    };
    $("#sim-custo").addEventListener("input", simular); $("#sim-dest").addEventListener("change", simular); simular();
    $("#f-preco").addEventListener("submit", function (e) {
      e.preventDefault(); var novo = lerRegra(this, false);
      try { P.calcular(1000, novo); } catch (err) { toast(err.message); return; }
      Object.assign(r, novo); auditar("regra de preço padrão alterada"); salvar("Regra padrão salva"); simular();
    });
    $("#f-parc").addEventListener("submit", function (e) { e.preventDefault(); pc.titulo = this.titulo.value; pc.texto = this.texto.value; pc.condicoes = this.condicoes.value; auditar("texto de parcelamento alterado"); salvar("Texto salvo"); });
    $$("[data-editar]").forEach(function (b) { b.addEventListener("click", function () { editarRegraDestino(b.dataset.editar); }); });
    $("#nova-regra").addEventListener("click", function () {
      var id = $("#nova-regra-dest").value; if (!id) return;
      var x = { id: uid("preco"), destinoId: id }; D.precos.push(x); salvar(); editarRegraDestino(x.id);
    });
    $("#recalc-todas").addEventListener("click", function () {
      var n = 0, pend = 0;
      D.ofertas.forEach(function (o) {
        if (["expirado", "rejeitado"].indexOf(o.status) >= 0) return;
        var x = P.calcular(o.custoOriginal, regraPadrao(), regraDestino(o.destinoId)); delete x.regra;
        if (x.precoParcelado === o.preco.precoParcelado && x.valorParcela === o.preco.valorParcela && x.precoPix === o.preco.precoPix) return;
        if (o.status === "publicado" || o.status === "pausado") { o.atualizacaoPendente = Object.assign({}, o, { preco: x }); delete o.atualizacaoPendente.atualizacaoPendente; delete o.atualizacaoPendente.historico; pend++; }
        else { o.preco = x; o.atualizadoEm = new Date().toISOString(); n++; }
      });
      auditar("regras reaplicadas", n + " atualizadas, " + pend + " pendentes"); salvar(n + " oferta(s) recalculada(s), " + pend + " publicada(s) aguardando aprovação");
    });
  }
  function camposRegra(r, destino) {
    var ph = destino ? ' placeholder="herda"' : "";
    return '<div class="field"><label>Modo de margem</label><select name="modo">' + (destino ? '<option value="">herda</option>' : "") + opts([["acrescimo", "Acréscimo sobre o custo"], ["margem_final", "Margem sobre o preço final"]], r.modo) + "</select></div>" +
      '<div class="field"><label>Margem (%)</label><input name="margemPct" inputmode="decimal" value="' + esc(r.margemPct == null ? "" : r.margemPct) + '"' + ph + "></div>" +
      '<div class="field"><label>Margem mínima (R$)</label><input name="margemMinimaReais" inputmode="decimal" value="' + esc(r.margemMinimaReais == null ? "" : r.margemMinimaReais) + '"' + ph + "></div>" +
      '<div class="field"><label>Taxas variáveis (%) — só margem final</label><input name="taxasVariaveisPct" inputmode="decimal" value="' + esc(r.taxasVariaveisPct == null ? "" : r.taxasVariaveisPct) + '"' + ph + "></div>" +
      '<div class="field"><label>Custo financeiro do parcelado (%)</label><input name="custoFinanceiroPct" inputmode="decimal" value="' + esc(r.custoFinanceiroPct == null ? "" : r.custoFinanceiroPct) + '"' + ph + "></div>" +
      '<div class="field"><label>Quantidade de parcelas</label><input name="parcelas" type="number" min="1" max="24" value="' + esc(r.parcelas == null ? "" : r.parcelas) + '"' + ph + "></div>" +
      '<div class="field"><label>Arredondamento comercial</label><select name="arredondamento">' + (destino ? '<option value="">herda</option>' : "") + opts(ARRED, r.arredondamento) + "</select></div>" +
      '<div class="field"><label>Desconto no Pix (%)</label><input name="pixDescontoPct" inputmode="decimal" value="' + esc(r.pixDescontoPct == null ? "" : r.pixDescontoPct) + '"' + ph + "></div>" +
      '<div class="field"><label>Texto de juros (ex.: sem juros)</label><input name="jurosTexto" value="' + esc(r.jurosTexto || "") + '"' + ph + "></div>" +
      '<div class="field"><label>Texto de entrada (ex.: entrada de 20%)</label><input name="entradaTexto" value="' + esc(r.entradaTexto || "") + '"' + ph + "></div>";
  }
  function lerRegra(f, destino) {
    var o = {};
    ["modo", "arredondamento", "jurosTexto", "entradaTexto"].forEach(function (k) { o[k] = f[k].value; });
    ["margemPct", "margemMinimaReais", "taxasVariaveisPct", "custoFinanceiroPct", "parcelas", "pixDescontoPct"].forEach(function (k) { o[k] = num(f[k].value); });
    if (!destino) ["margemPct", "margemMinimaReais", "taxasVariaveisPct", "custoFinanceiroPct", "pixDescontoPct"].forEach(function (k) { if (o[k] === "") o[k] = 0; });
    return o;
  }
  function editarRegraDestino(id) {
    var D = db(), x = D.precos.filter(function (r) { return r.id === id; })[0];
    abrir('<h2 style="margin-top:0">Regra de preço · ' + esc(destNome(x.destinoId)) + '</h2><form id="f-rd" class="form" style="grid-template-columns:1fr 1fr">' + camposRegra(x, true) +
      '<button class="btn full" type="submit">Salvar</button><button class="btn btn--ghost full" type="button" id="rm-rd">Remover regra (volta a usar a padrão)</button></form>');
    $("#f-rd").addEventListener("submit", function (e) {
      e.preventDefault(); var novo = lerRegra(this, true);
      try { P.calcular(1000, regraPadrao(), novo); } catch (err) { toast(err.message); return; }
      Object.keys(novo).forEach(function (k) { x[k] = novo[k]; }); auditar("regra de preço de " + destNome(x.destinoId) + " alterada"); salvar("Regra salva"); fechar(); vPrecos();
    });
    $("#rm-rd").addEventListener("click", function () { D.precos = D.precos.filter(function (r) { return r.id !== id; }); auditar("regra de " + destNome(x.destinoId) + " removida"); salvar("Regra removida"); fechar(); vPrecos(); });
  }

  /* ============================================================ DESTINOS E AEROPORTOS */
  function vDestinos() {
    var D = db();
    main(head("Cadastro", "Destinos e aeroportos", '<button class="btn btn--sm btn--ink" id="novo-dest">+ Destino</button>') +
      '<div class="adm-card adm-table-wrap"><table class="adm-table adm-table--sm"><thead><tr><th>Destino</th><th>País / cidade</th><th>Aeroporto</th><th>Região</th><th>Campanhas</th><th>Ativo</th></tr></thead><tbody>' +
      D.destinos.map(function (d) { return '<tr data-id="' + d.id + '"><td><b>' + esc(d.nomeExibicao || d.nome) + "</b><small>sigla " + esc(d.sigla) + "</small></td><td>" + esc(d.nome) + "<small>" + esc(d.cidade) + "</small></td><td>" + esc(d.aeroporto) + "</td><td>" + esc(d.regiao) + "</td><td><small>" + esc((d.campanhas || []).join(", ")) + "</small></td><td>" + (d.ativo ? "Sim" : "Não") + "</td></tr>"; }).join("") + "</tbody></table></div>" +
      '<div style="display:flex;justify-content:space-between;align-items:end;margin:30px 0 14px;gap:12px;flex-wrap:wrap"><h2 style="margin:0;font-size:1.6rem">Aeroportos</h2><button class="btn btn--sm btn--ink" id="novo-aero">+ Aeroporto</button></div>' +
      '<div class="adm-card adm-table-wrap"><table class="adm-table adm-table--sm"><thead><tr><th>IATA</th><th>Nome</th><th>Cidade</th><th>Grupo</th><th>Origem?</th><th>Ativo</th></tr></thead><tbody>' +
      D.aeroportos.map(function (a) { return '<tr data-iata="' + a.iata + '"><td><b>' + esc(a.iata) + "</b></td><td>" + esc(a.nome) + "</td><td>" + esc(a.cidade) + "</td><td>" + esc(a.cidadeGrupo) + "</td><td>" + (a.origem ? "Sim" : "—") + "</td><td>" + (a.ativo !== false ? "Sim" : "Não") + "</td></tr>"; }).join("") + "</tbody></table></div>");
    $$("tr[data-id]").forEach(function (tr) { tr.addEventListener("click", function () { editarDestino(tr.dataset.id); }); });
    $$("tr[data-iata]").forEach(function (tr) { tr.addEventListener("click", function () { editarAeroporto(tr.dataset.iata); }); });
    $("#novo-dest").addEventListener("click", function () { editarDestino(null); });
    $("#novo-aero").addEventListener("click", function () { editarAeroporto(null); });
  }
  function editarDestino(id) {
    var D = db(), d = id ? ST.destino(id) : { id: "", sigla: "", nome: "", cidade: "", aeroporto: "", nomeAeroporto: "", regiao: "Europa", campanhas: [], ativo: true, artigo: "a", nomeExibicao: "", arte: "" };
    abrir('<h2 style="margin-top:0">' + (id ? "Editar destino" : "Novo destino") + '</h2><form id="f-dest" class="form" style="grid-template-columns:1fr 1fr">' +
      (id ? "" : '<div class="field"><label>Identificador (sem espaços)</label><input name="id" required pattern="[a-z0-9-]+" placeholder="ex.: irlanda"></div>') +
      '<div class="field"><label>Sigla do código da oferta</label><input name="sigla" maxlength="4" value="' + esc(d.sigla) + '" required></div>' +
      '<div class="field"><label>País</label><input name="nome" value="' + esc(d.nome) + '" required></div><div class="field"><label>Nome no anúncio</label><input name="nomeExibicao" value="' + esc(d.nomeExibicao) + '" placeholder="ex.: Orlando"></div>' +
      '<div class="field"><label>Artigo ("a Itália", "o Japão")</label><select name="artigo">' + opts([["", "sem artigo"], ["a", "a"], ["o", "o"], ["as", "as"], ["os", "os"]], d.artigo) + "</select></div>" +
      '<div class="field"><label>Cidade</label><input name="cidade" value="' + esc(d.cidade) + '" required></div>' +
      '<div class="field"><label>Aeroporto (IATA)</label><input name="aeroporto" maxlength="3" value="' + esc(d.aeroporto) + '" required></div><div class="field"><label>Nome do aeroporto</label><input name="nomeAeroporto" value="' + esc(d.nomeAeroporto) + '"></div>' +
      '<div class="field"><label>Região</label><select name="regiao">' + opts(["Europa", "América do Norte", "América Central", "América do Sul", "Ásia", "Oriente Médio", "África", "Oceania"].map(function (x) { return [x, x]; }), d.regiao) + "</select></div>" +
      '<div class="field"><label>Ativo</label><select name="ativo">' + opts([["1", "Sim"], ["0", "Não"]], d.ativo ? "1" : "0") + "</select></div>" +
      '<div class="field full"><label>Campanhas</label><div class="chk-grid">' + D.campanhas.map(function (c) { return '<label class="chk"><input type="checkbox" name="camp" value="' + c.id + '"' + ((d.campanhas || []).indexOf(c.id) >= 0 ? " checked" : "") + "> " + esc(c.nome) + "</label>"; }).join("") + "</div></div>" +
      '<button class="btn full" type="submit">Salvar destino</button></form>');
    $("#f-dest").addEventListener("submit", function (e) {
      e.preventDefault(); var f = this;
      var novo = { sigla: f.sigla.value.trim().toUpperCase(), nome: f.nome.value.trim(), nomeExibicao: f.nomeExibicao.value.trim() || f.nome.value.trim(), artigo: f.artigo.value, cidade: f.cidade.value.trim(),
        aeroporto: f.aeroporto.value.trim().toUpperCase(), nomeAeroporto: f.nomeAeroporto.value.trim(), regiao: f.regiao.value, ativo: f.ativo.value === "1", campanhas: $$("input[name=camp]:checked", f).map(function (i) { return i.value; }) };
      if (!/^[A-Z]{3}$/.test(novo.aeroporto)) { toast("IATA deve ter 3 letras."); return; }
      if (id) Object.assign(d, novo);
      else {
        var nid = f.id.value.trim();
        if (ST.destino(nid)) { toast("Já existe um destino com esse identificador."); return; }
        d = Object.assign({ id: nid, slug: nid, arte: "", ordem: D.destinos.length }, novo); D.destinos.push(d);
        D.regras.push({ id: "reg-" + nid, destinoId: nid, ativo: false, origens: ["SAO", "RIO"], periodoInicio: new Date().toISOString().slice(0, 10), periodoFim: new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10), duracaoMin: 7, duracaoMax: 14, maxEscalas: 1, exigirBagagem: false, adultos: 1, classe: "economica", combinacoes: 3 });
        D.conteudos.push({ destinoId: nid, tituloEmocional: novo.nome, texto: "", motivos: [], faq: (D.conteudos[0] || { faq: [] }).faq });
        toast("Destino criado. A regra de monitoramento começa desativada.");
      }
      if (!D.aeroportos.some(function (a) { return a.iata === novo.aeroporto; })) D.aeroportos.push({ iata: novo.aeroporto, nome: novo.nomeAeroporto || novo.aeroporto, cidade: novo.cidade, cidadeGrupo: novo.aeroporto, pais: novo.nome, origem: false, ativo: true });
      auditar("destino salvo", d.id); salvar("Destino salvo"); fechar(); vDestinos();
    });
  }
  function editarAeroporto(iata) {
    var D = db(), a = iata ? D.aeroportos.filter(function (x) { return x.iata === iata; })[0] : { iata: "", nome: "", cidade: "", cidadeGrupo: "", pais: "", origem: false, ativo: true };
    abrir('<h2 style="margin-top:0">' + (iata ? "Aeroporto " + esc(iata) : "Novo aeroporto") + '</h2><form id="f-aero" class="form" style="grid-template-columns:1fr 1fr">' +
      '<div class="field"><label>IATA</label><input name="iata" maxlength="3" value="' + esc(a.iata) + '"' + (iata ? " readonly" : "") + ' required></div><div class="field"><label>Nome</label><input name="nome" value="' + esc(a.nome) + '" required></div>' +
      '<div class="field"><label>Cidade</label><input name="cidade" value="' + esc(a.cidade) + '"></div><div class="field"><label>País</label><input name="pais" value="' + esc(a.pais) + '"></div>' +
      '<div class="field"><label>Grupo de origem</label><select name="cidadeGrupo">' + opts([["SAO", "São Paulo"], ["RIO", "Rio de Janeiro"], [a.cidadeGrupo && a.cidadeGrupo.length === 3 && a.cidadeGrupo !== "SAO" && a.cidadeGrupo !== "RIO" ? a.cidadeGrupo : "OUTRO", "Destino (não é origem)"]], a.cidadeGrupo) + "</select></div>" +
      '<div class="field"><label>Usar como origem</label><select name="origem">' + opts([["1", "Sim"], ["0", "Não"]], a.origem ? "1" : "0") + "</select></div>" +
      '<div class="field"><label>Ativo</label><select name="ativo">' + opts([["1", "Sim"], ["0", "Não"]], a.ativo !== false ? "1" : "0") + "</select></div>" +
      '<p class="muted full" style="font-size:.84rem">Somente São Paulo e Rio de Janeiro podem ser origem nesta versão.</p><button class="btn full" type="submit">Salvar</button></form>');
    $("#f-aero").addEventListener("submit", function (e) {
      e.preventDefault(); var f = this, cod = f.iata.value.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(cod)) { toast("IATA deve ter 3 letras."); return; }
      var grupo = f.cidadeGrupo.value, origem = f.origem.value === "1";
      if (origem && grupo !== "SAO" && grupo !== "RIO") { toast("Origem precisa estar no grupo São Paulo ou Rio de Janeiro."); return; }
      var novo = { iata: cod, nome: f.nome.value.trim(), cidade: f.cidade.value.trim(), pais: f.pais.value.trim(), cidadeGrupo: grupo === "OUTRO" ? cod : grupo, origem: origem, ativo: f.ativo.value === "1" };
      if (iata) Object.assign(a, novo); else { if (D.aeroportos.some(function (x) { return x.iata === cod; })) { toast("Aeroporto já cadastrado."); return; } D.aeroportos.push(novo); }
      auditar("aeroporto salvo", cod); salvar("Aeroporto salvo"); fechar(); vDestinos();
    });
  }

  /* ============================================================ CAMPANHAS E TEXTOS */
  function vTextos() {
    var D = db(), cfg = D.config;
    main(head("Conteúdo", "Campanhas e textos") +
      '<div class="adm-card"><h3>Campanhas (textos por público)</h3><p class="muted" style="margin-top:-6px">Os destinos de cada campanha são marcados em Destinos e aeroportos. A ordem define a sequência das seções na página inicial.</p>' +
      D.campanhas.slice().sort(function (a, b) { return a.ordem - b.ordem; }).map(function (c) {
        return '<form class="form camp-form" data-id="' + c.id + '" style="grid-template-columns:2fr 1fr 1fr;border-top:1px solid var(--line);padding-top:16px;margin-top:16px">' +
          '<div class="field"><label>Nome</label><input name="nome" value="' + esc(c.nome) + '"></div><div class="field"><label>Ordem</label><input name="ordem" type="number" value="' + c.ordem + '"></div><div class="field"><label>Ativa</label><select name="ativa">' + opts([["1", "Sim"], ["0", "Não"]], c.ativa ? "1" : "0") + "</select></div>" +
          '<div class="field full"><label>Título da seção</label><input name="titulo" value="' + esc(c.titulo) + '"></div>' +
          '<div class="field full"><label>Texto</label><textarea name="texto">' + esc(c.texto) + '</textarea></div><button class="btn btn--ghost btn--sm" type="submit">Salvar campanha</button></form>';
      }).join("") + "</div>" +
      '<div class="adm-card"><h3>Textos por destino (página da oferta)</h3><div class="field"><label>Destino</label><select id="ct-dest">' + opts(D.destinos.map(function (d) { return [d.id, destNome(d.id)]; }), vTextos.dest) + '</select></div><div id="ct-form"></div></div>' +
      '<div class="adm-card"><h3>Textos gerais</h3><form id="f-gerais" class="form">' +
      '<div class="field full"><label>Chamada padrão dos anúncios</label><input name="chamadaPadrao" value="' + esc(cfg.chamadaPadrao) + '"></div>' +
      '<div class="field full"><label>Aviso obrigatório junto ao preço</label><textarea name="avisoPreco">' + esc(cfg.avisoPreco) + "</textarea></div>" +
      '<button class="btn btn--ghost full" type="submit">Salvar textos gerais</button></form><p class="muted" style="font-size:.84rem">Evite promessas absolutas ("o melhor do mundo") e não afirme que o preço está garantido.</p></div>');
    $$(".camp-form").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault(); var c = D.campanhas.filter(function (x) { return x.id === f.dataset.id; })[0];
        c.nome = f.nome.value.trim(); c.ordem = +f.ordem.value; c.ativa = f.ativa.value === "1"; c.titulo = f.titulo.value.trim(); c.texto = f.texto.value.trim();
        auditar("campanha " + c.id + " editada"); salvar("Campanha salva");
      });
    });
    var renderCt = function () {
      var id = $("#ct-dest").value; vTextos.dest = id; var ct = ST.conteudo(id);
      $("#ct-form").innerHTML = '<form id="f-ct" class="form">' +
        '<div class="field full"><label>Título emocional</label><input name="tituloEmocional" value="' + esc(ct.tituloEmocional) + '"></div>' +
        '<div class="field full"><label>Texto persuasivo</label><textarea name="texto" style="min-height:140px">' + esc(ct.texto) + "</textarea></div>" +
        '<div class="field full"><label>Motivos para a viagem (um por linha)</label><textarea name="motivos">' + esc((ct.motivos || []).join("\n")) + "</textarea></div>" +
        '<div class="field full"><label>Perguntas frequentes (pergunta numa linha, resposta na seguinte, linha em branco entre elas)</label><textarea name="faq" style="min-height:200px">' + esc((ct.faq || []).map(function (x) { return x.p + "\n" + x.r; }).join("\n\n")) + "</textarea></div>" +
        '<button class="btn full" type="submit">Salvar textos do destino</button></form>';
      $("#f-ct").addEventListener("submit", function (e) {
        e.preventDefault(); var f = this;
        ct.tituloEmocional = f.tituloEmocional.value.trim(); ct.texto = f.texto.value.trim();
        ct.motivos = f.motivos.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        ct.faq = f.faq.value.split(/\n\s*\n/).map(function (b) { var l = b.trim().split("\n"); return { p: (l.shift() || "").trim(), r: l.join(" ").trim() }; }).filter(function (x) { return x.p && x.r; });
        auditar("textos de " + destNome(id) + " editados"); salvar("Textos salvos");
      });
    };
    $("#ct-dest").addEventListener("change", renderCt); renderCt();
    $("#f-gerais").addEventListener("submit", function (e) { e.preventDefault(); cfg.chamadaPadrao = this.chamadaPadrao.value.trim(); cfg.avisoPreco = this.avisoPreco.value.trim(); auditar("textos gerais editados"); salvar("Textos salvos"); });
  }

  /* ============================================================ IMAGENS */
  function vImagens() {
    var D = db(), id = vImagens.dest || D.destinos[0].id, lista = ST.imagens(id);
    main(head("Conteúdo", "Imagens") +
      '<p class="muted">Use fotos próprias, licenciadas ou de bancos que permitam o uso comercial, sempre com o crédito. Não copie imagens do Google ou de concorrentes.</p>' +
      '<div class="adm-card"><div class="field" style="max-width:360px"><label>Destino</label><select id="img-dest">' + opts(D.destinos.map(function (d) { return [d.id, destNome(d.id)]; }), id) + "</select></div>" +
      '<div class="img-list">' + lista.map(function (im, i) {
        var src = /^(data:|https?:)/.test(im.url) ? im.url : "../" + im.url;
        return '<form class="img-item" data-id="' + im.id + '"><img src="' + esc(src) + '" alt=""><div class="form" style="grid-template-columns:1fr 1fr">' +
          '<div class="field full"><label>Endereço (caminho ou URL)</label><input name="url" value="' + esc(/^data:/.test(im.url) ? "(arquivo enviado)" : im.url) + '"' + (/^data:/.test(im.url) ? " readonly" : "") + "></div>" +
          '<div class="field full"><label>Texto alternativo</label><input name="alt" value="' + esc(im.alt) + '"></div>' +
          '<div class="field full"><label>Crédito</label><input name="credito" value="' + esc(im.credito) + '"></div>' +
          '<label class="chk"><input type="radio" name="principal-' + id + '" value="' + im.id + '"' + (im.principal ? " checked" : "") + "> Imagem principal</label>" +
          '<div class="img-btns"><button type="button" class="btn btn--ghost btn--sm" data-mv="-1"' + (i === 0 ? " disabled" : "") + '>↑</button><button type="button" class="btn btn--ghost btn--sm" data-mv="1"' + (i === lista.length - 1 ? " disabled" : "") + '>↓</button><button type="button" class="btn btn--ghost btn--sm" data-rm>Remover</button><button type="submit" class="btn btn--sm">Salvar</button></div></div></form>';
      }).join("") + "</div>" +
      '<h3 style="margin-top:24px">Adicionar imagem</h3><form id="f-img" class="form" style="grid-template-columns:1fr 1fr">' +
      '<div class="field"><label>Arquivo (até 400 KB na versão offline)</label><input type="file" name="arquivo" accept="image/*"></div><div class="field"><label>ou endereço (caminho/URL)</label><input name="url" placeholder="assets/img/fotos/italia-01.jpg"></div>' +
      '<div class="field"><label>Texto alternativo</label><input name="alt" required></div><div class="field"><label>Crédito</label><input name="credito" required placeholder="Foto: Nome / Banco de imagens"></div>' +
      '<button class="btn full" type="submit">Adicionar</button></form></div>');
    $("#img-dest").addEventListener("change", function () { vImagens.dest = this.value; vImagens(); });
    $$(".img-item").forEach(function (f) {
      var im = D.imagens.filter(function (x) { return x.id === f.dataset.id; })[0];
      f.addEventListener("submit", function (e) {
        e.preventDefault(); if (!/^data:/.test(im.url)) im.url = f.url.value.trim(); im.alt = f.alt.value.trim(); im.credito = f.credito.value.trim();
        var pr = $("input[type=radio]:checked", $("#adm-main")); if (pr) ST.imagens(id).forEach(function (x) { x.principal = x.id === pr.value; });
        im.demonstrativa = /ilustra/i.test(im.credito); auditar("imagem editada", destNome(id)); salvar("Imagem salva"); vImagens();
      });
      $$("[data-mv]", f).forEach(function (b) {
        b.addEventListener("click", function () {
          var l = ST.imagens(id).sort(function (a, b) { return a.ordem - b.ordem; }), i = l.indexOf(im), j = i + (+b.dataset.mv);
          if (j < 0 || j >= l.length) return; var t = l[j].ordem; l[j].ordem = im.ordem; im.ordem = t; salvar(); vImagens();
        });
      });
      $("[data-rm]", f).addEventListener("click", function () {
        if (ST.imagens(id).length <= 1) { toast("O destino precisa de pelo menos uma imagem."); return; }
        D.imagens = D.imagens.filter(function (x) { return x !== im; });
        if (im.principal) ST.imagens(id)[0].principal = true;
        auditar("imagem removida", destNome(id)); salvar("Imagem removida"); vImagens();
      });
    });
    $("#f-img").addEventListener("submit", function (e) {
      e.preventDefault(); var f = this, file = f.arquivo.files[0];
      var add = function (url) {
        var ordem = Math.max.apply(null, ST.imagens(id).map(function (x) { return x.ordem; }).concat([0])) + 1;
        D.imagens.push({ id: uid("img"), destinoId: id, url: url, alt: f.alt.value.trim(), credito: f.credito.value.trim(), principal: false, ordem: ordem, demonstrativa: false });
        auditar("imagem adicionada", destNome(id)); salvar("Imagem adicionada"); vImagens();
      };
      if (file) {
        if (file.size > 400 * 1024) { toast("Arquivo maior que 400 KB. Na versão online as fotos vão para o Supabase Storage."); return; }
        var r = new FileReader(); r.onload = function () { add(r.result); }; r.readAsDataURL(file);
      } else if (f.url.value.trim()) add(f.url.value.trim());
      else toast("Escolha um arquivo ou informe o endereço.");
    });
  }

  /* ============================================================ WHATSAPP E CONSULTORES */
  function vWhats() {
    var D = db(), cfg = D.config, ex = ST.publicadas()[0] || D.ofertas[0];
    main(head("Atendimento", "WhatsApp e consultores") +
      '<div class="adm-grid2"><div class="adm-card"><h3>Número e mensagens</h3><form id="f-wa" class="form">' +
      '<div class="field full"><label>Número do WhatsApp (com DDI e DDD, só números)</label><input name="numero" value="' + esc(cfg.whatsappNumero) + '" inputmode="numeric"></div>' +
      '<div class="field full"><label>Mensagem das ofertas — use {codigo} {destino} {origem} {preco} {parcelas} {parcela}</label><textarea name="msg" style="min-height:120px">' + esc(cfg.whatsappMensagem) + "</textarea></div>" +
      '<div class="field full"><label>Mensagem geral (botão flutuante)</label><textarea name="geral">' + esc(cfg.whatsappMensagemGeral) + "</textarea></div>" +
      '<button class="btn full" type="submit">Salvar</button></form><p class="muted" style="font-size:.84rem">Na versão online o número também pode vir da variável de ambiente WHATSAPP_NUMERO.</p></div>' +
      '<div class="adm-card"><h3>Pré-visualização</h3>' + (ex ? '<p class="muted" style="margin-top:-6px">Oferta ' + esc(ex.codigo) + '</p><div class="d-msg" id="wa-prev">' + esc(ST.mensagemOferta(ex)) + '</div><a class="btn btn--wa btn--sm" style="margin-top:12px" target="_blank" rel="noopener" href="' + ST.linkWhatsOferta(ex) + '">Testar link</a>' : "Sem ofertas.") + "</div></div>" +
      '<div class="adm-card"><h3>Consultores</h3><table class="adm-table adm-table--sm"><thead><tr><th>Nome</th><th>WhatsApp</th><th>Ativo</th><th>Observação</th><th></th></tr></thead><tbody>' +
      D.consultores.map(function (c) { return '<tr data-id="' + c.id + '"><td><input name="nome" value="' + esc(c.nome) + '"></td><td><input name="whatsapp" value="' + esc(c.whatsapp) + '"></td><td><input type="checkbox" name="ativo"' + (c.ativo ? " checked" : "") + '></td><td><input name="observacao" value="' + esc(c.observacao || "") + '"></td><td><button class="btn btn--ghost btn--sm" data-rm>Remover</button></td></tr>'; }).join("") +
      '</tbody></table><div style="display:flex;gap:10px;margin-top:14px"><button class="btn btn--sm btn--ink" id="add-cons">+ Consultor</button><button class="btn btn--sm" id="salvar-cons">Salvar consultores</button></div><p class="muted" style="font-size:.84rem">Hoje todos os botões usam o número da central. A lista prepara a futura distribuição de atendimentos entre consultores.</p></div>');
    $("#f-wa").addEventListener("submit", function (e) {
      e.preventDefault(); var n = this.numero.value.replace(/\D/g, "");
      if (n.length < 12 || n.length > 13) { toast("Informe DDI + DDD + número (ex.: 5521999999999)."); return; }
      cfg.whatsappNumero = n; cfg.whatsappMensagem = this.msg.value.trim(); cfg.whatsappMensagemGeral = this.geral.value.trim();
      auditar("configuração do WhatsApp alterada"); salvar("WhatsApp salvo"); vWhats();
    });
    $("#add-cons").addEventListener("click", function () { D.consultores.push({ id: uid("cons"), nome: "Novo consultor", whatsapp: "", ativo: false }); salvar(); vWhats(); });
    $$("tr[data-id] [data-rm]").forEach(function (b) { b.addEventListener("click", function () { var id = b.closest("tr").dataset.id; D.consultores = D.consultores.filter(function (c) { return c.id !== id; }); salvar("Consultor removido"); vWhats(); }); });
    $("#salvar-cons").addEventListener("click", function () {
      $$("tr[data-id]").forEach(function (tr) { var c = D.consultores.filter(function (x) { return x.id === tr.dataset.id; })[0]; c.nome = $("[name=nome]", tr).value.trim(); c.whatsapp = $("[name=whatsapp]", tr).value.replace(/\D/g, ""); c.ativo = $("[name=ativo]", tr).checked; c.observacao = $("[name=observacao]", tr).value.trim(); });
      auditar("consultores salvos"); salvar("Consultores salvos");
    });
  }

  /* ============================================================ MÉTRICAS */
  function vMetricas() {
    var D = db(), por = {};
    D.ofertas.forEach(function (o) { por[o.codigo] = { o: o, v: 0, c: 0, w: 0 }; });
    D.metricas.forEach(function (m) { if (m.ofertaCodigo && por[m.ofertaCodigo]) { if (m.tipo === "visualizacao") por[m.ofertaCodigo].v++; if (m.tipo === "conhecer") por[m.ofertaCodigo].c++; } });
    D.cliques.forEach(function (m) { if (m.ofertaCodigo && por[m.ofertaCodigo]) por[m.ofertaCodigo].w++; });
    var linhas = Object.keys(por).map(function (k) { return por[k]; }).filter(function (x) { return x.v || x.c || x.w; }).sort(function (a, b) { return b.w - a.w || b.v - a.v; });
    var geral = D.cliques.filter(function (c) { return !c.ofertaCodigo; }).length;
    var porOrig = { SAO: 0, RIO: 0 }; D.cliques.forEach(function (c) { if (c.cidadeOrigem) porOrig[c.cidadeOrigem] = (porOrig[c.cidadeOrigem] || 0) + 1; });
    var porCamp = {}; D.cliques.forEach(function (c) { if (c.campanhaId) porCamp[c.campanhaId] = (porCamp[c.campanhaId] || 0) + 1; });
    main(head("Resultados", "Métricas", '<button class="btn btn--sm btn--ghost" id="csv">Exportar cliques (CSV)</button>') +
      '<p class="muted">Registramos apenas eventos (oferta, destino, origem, campanha, página, data e hora). Nenhum dado pessoal é coletado.</p>' +
      '<div class="adm-kpis">' + [["Visualizações de ofertas", D.metricas.filter(function (m) { return m.tipo === "visualizacao"; }).length], ["Cliques em Conhecer", D.metricas.filter(function (m) { return m.tipo === "conhecer"; }).length], ["Cliques no WhatsApp", D.cliques.length], ["WhatsApp geral", geral], ["Origem SP / RJ", porOrig.SAO + " / " + porOrig.RIO]]
        .map(function (k) { return '<div class="kpi"><small>' + k[0] + "</small><b>" + k[1] + "</b></div>"; }).join("") + "</div>" +
      '<div class="adm-card adm-table-wrap"><table class="adm-table adm-table--sm"><thead><tr><th>Oferta</th><th>Destino</th><th>Visualizações</th><th>Conhecer</th><th>WhatsApp</th><th>Conversão (WhatsApp/visualização)</th></tr></thead><tbody>' +
      (linhas.map(function (x) { return "<tr><td><b>" + esc(x.o.codigo) + "</b><small>" + stNome(x.o.status) + "</small></td><td>" + esc(destNome(x.o.destinoId)) + "</td><td>" + x.v + "</td><td>" + x.c + "</td><td>" + x.w + "</td><td>" + (x.v ? Math.round(x.w / x.v * 100) + "%" : "—") + "</td></tr>"; }).join("") || '<tr><td colspan="6" class="empty">Ainda sem eventos. Navegue pelo site e clique nas ofertas para ver os números aqui.</td></tr>') + "</tbody></table></div>" +
      '<div class="adm-card"><h3>Cliques por campanha</h3><ul class="adm-mini">' + (Object.keys(porCamp).map(function (k) { return "<li>" + esc((D.campanhas.filter(function (c) { return c.id === k; })[0] || { nome: k }).nome) + " <b>" + porCamp[k] + "</b></li>"; }).join("") || "<li>—</li>") + "</ul></div>" +
      '<div class="adm-card adm-table-wrap"><h3 style="padding:16px 16px 0">Últimos cliques no WhatsApp</h3><table class="adm-table adm-table--sm"><thead><tr><th>Data e hora</th><th>Oferta</th><th>Destino</th><th>Origem</th><th>Campanha</th><th>Página</th></tr></thead><tbody>' +
      D.cliques.slice(0, 50).map(function (c) { return "<tr><td>" + dt(c.ts) + "</td><td>" + esc(c.ofertaCodigo || "geral") + "</td><td>" + esc(c.destinoId ? destNome(c.destinoId) : "—") + "</td><td>" + esc(CID[c.cidadeOrigem] || "—") + "</td><td>" + esc(c.campanhaId || "—") + "</td><td>" + esc(c.pagina) + "</td></tr>"; }).join("") + "</tbody></table></div>");
    $("#csv").addEventListener("click", function () {
      var csv = "data_hora;oferta;destino;origem;campanha;pagina\n" + D.cliques.map(function (c) { return [c.ts, c.ofertaCodigo || "", c.destinoId || "", c.cidadeOrigem || "", c.campanhaId || "", c.pagina].join(";"); }).join("\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = "cesamar-cliques-whatsapp.csv"; a.click();
    });
  }

  /* ============================================================ CONFIGURAÇÕES E DADOS */
  function vConfig() {
    var D = db();
    main(head("Sistema", "Configurações e dados") +
      '<div class="adm-grid2"><div class="adm-card"><h3>Senha do painel (versão offline)</h3><form id="f-senha" class="form"><div class="field full"><label>Nova senha</label><input name="senha" type="password" minlength="6" required></div><button class="btn full" type="submit">Alterar senha</button></form>' +
      '<p class="muted" style="font-size:.84rem">Proteção apenas de demonstração. Na versão online, o login usa Supabase Auth e as permissões ficam no banco (RLS).</p></div>' +
      '<div class="adm-card"><h3>Backup dos dados</h3><p class="muted">Tudo o que foi configurado aqui fica no navegador. Exporte para guardar ou levar para outro computador.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn--sm" id="exp">Exportar JSON</button><label class="btn btn--sm btn--ghost" style="cursor:pointer">Importar JSON<input type="file" id="imp" accept="application/json" hidden></label><button class="btn btn--sm btn--ghost" id="reset">Restaurar demonstração</button></div></div></div>' +
      '<div class="adm-card"><h3>Estrutura dos dados</h3><p class="muted">Coleções guardadas: ' + ["destinos", "aeroportos", "regras", "pesquisas", "ofertas", "campanhas", "conteudos", "imagens", "precos", "consultores", "cliques", "metricas", "logs", "execucoes"].map(function (k) { return "<b>" + k + "</b> (" + (D[k] || []).length + ")"; }).join(", ") + ".</p></div>");
    $("#f-senha").addEventListener("submit", function (e) { e.preventDefault(); D.config.adminSenhaDemo = this.senha.value; auditar("senha do painel alterada"); salvar("Senha alterada"); this.reset(); });
    $("#exp").addEventListener("click", function () { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(D, null, 1)], { type: "application/json" })); a.download = "cesamar-dados-" + new Date().toISOString().slice(0, 10) + ".json"; a.click(); });
    $("#imp").addEventListener("change", function () {
      var file = this.files[0]; if (!file) return; var r = new FileReader();
      r.onload = function () {
        try { var novo = JSON.parse(r.result); if (!novo.ofertas || !novo.destinos) throw new Error("Arquivo não parece um backup da Cesamar."); novo.geradoEm = window.CESAMAR_SEED.geradoEm; ST.salvar(novo); toast("Dados importados"); setTimeout(function () { location.reload(); }, 600); }
        catch (e) { toast(e.message); }
      };
      r.readAsText(file);
    });
    $("#reset").addEventListener("click", function () { if (confirm("Apagar as alterações deste navegador e voltar aos dados de demonstração?")) { ST.resetar(); toast("Dados restaurados"); setTimeout(function () { location.reload(); }, 600); } });
  }

  /* ------------------------------------------------------------ sessão */
  // A sessão online é validada por equipe-auth.js (Supabase Auth + TOTP).
})();
