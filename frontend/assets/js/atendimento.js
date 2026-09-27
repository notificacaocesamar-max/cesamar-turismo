(function () {
  "use strict";
  var cfg = (window.CESAMAR_CONFIG || {}).supabase || {};
  if (!cfg.url || !cfg.publishableKey) return;
  var headers = { apikey: cfg.publishableKey, "Content-Type": "application/json" };

  function sessaoEquipe() {
    try {
      var chave = Object.keys(localStorage).filter(function(k){ return k.indexOf("sb-cwohbclwyqsfuysfobce-auth-token") >= 0; })[0];
      if (!chave) return null; var dado=JSON.parse(localStorage.getItem(chave)||"null"), token=dado&&dado.access_token;
      if(!token) return null; var payload=JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
      return payload.aal === "aal2" && payload.exp*1000>Date.now() ? dado : null;
    } catch(e){ return null; }
  }
  function prepararEquipe() {
    var sessao=sessaoEquipe(), login=document.querySelector(".equipe-login");
    if(login && sessao && !document.querySelector(".equipe-conta")){
      var perfil=null; try{perfil=JSON.parse(sessionStorage.getItem("cesamar.equipe.perfil")||"null");}catch(e){}
      var root=window.Cesamar.ROOT||"", nome=(perfil&&perfil.nome_completo)||"Equipe Cesamar", box=document.createElement("details");
      function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
      box.className="equipe-conta";
      box.innerHTML='<summary><i aria-hidden="true"></i><span>'+esc(nome)+'</span></summary><div class="equipe-conta-menu"><small><i></i> Conectado</small><a href="'+root+'retaguarda/index.html">Acessar painel</a><a href="'+root+'retaguarda/index.html?logout=1&return=site">Logout</a></div>';
      login.replaceWith(box);
    }
    if(!sessao) return;
    var radar=(window.CESAMAR_RADAR||{}).ofertas||[], seed=((window.Cesamar||{}).store&&window.Cesamar.store.carregar().ofertas)||[];
    document.querySelectorAll(".ad[data-codigo]").forEach(function(card){
      if(card.querySelector("[data-fonte-equipe]")) return; var cod=card.getAttribute("data-codigo");
      var o=radar.concat(seed).filter(function(x){return x.codigo===cod;})[0]; if(!o||!o.fonteUrl) return;
      var a=document.createElement("a"); a.className="btn btn--ghost"; a.dataset.fonteEquipe="1"; a.href=o.fonteUrl; a.target="_blank"; a.rel="noopener nofollow"; a.textContent="Abrir oferta na fonte";
      var box=card.querySelector(".ad-actions"); if(box) box.appendChild(a);
    });
  }

  function rpc(nome, dados) {
    return fetch(cfg.url + "/rest/v1/rpc/" + nome, { method: "POST", headers: headers, body: JSON.stringify(dados || {}) })
      .then(function (r) { if (!r.ok) throw new Error("Não foi possível concluir agora."); return r.json(); });
  }
  function limpar(v) { return String(v || "").replace(/\D/g, ""); }
  function ofertaDo(el) {
    var card = el.closest("[data-codigo]"), codigo = card && card.getAttribute("data-codigo");
    var titulo = card && card.querySelector("h3");
    return { codigo: codigo || "", titulo: titulo ? titulo.textContent.trim() : document.title, url: location.href };
  }
  function abrirWhats(numero, oferta, nome) {
    var msg = "Olá, " + nome.split(" ")[0] + "! Vi a oferta " + (oferta.codigo || oferta.titulo) + " no portal da Cesamar e gostaria de mais informações.";
    location.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(msg);
  }
  function modal(oferta) {
    var antigo = document.getElementById("lead-plantao"); if (antigo) antigo.remove();
    var ano = new Date().getFullYear();
    var el = document.createElement("div"); el.id = "lead-plantao"; el.className = "lead-modal";
    el.innerHTML = '<div class="lead-modal-bg" data-fechar></div><section class="lead-modal-card" role="dialog" aria-modal="true" aria-labelledby="lead-titulo">' +
      '<button class="lead-modal-x" data-fechar aria-label="Fechar">×</button><span class="eyebrow">Atendimento personalizado</span>' +
      '<h2 id="lead-titulo">Vamos planejar essa viagem?</h2><p>Nossa equipe receberá seus dados e a oferta escolhida para continuar o atendimento.</p>' +
      '<form class="form" id="lead-form"><div class="field full"><label>Nome completo</label><input name="nome" autocomplete="name" required minlength="2"></div>' +
      '<div class="field"><label>Número de viajantes</label><input name="quantidade" type="number" min="1" max="99" value="1" required></div>' +
      '<div class="field"><label>Telefone com DDD</label><input name="telefone" inputmode="tel" autocomplete="tel" placeholder="21999999999" required></div>' +
      '<div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="email" required></div>' +
      '<div class="field"><label>Duração desejada (dias)</label><input name="duracao" type="number" min="1" max="365" value="7"></div>' +
      '<div class="field"><label>Mês</label><select name="mes" required>' + ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map(function(m,i){return '<option value="'+(i+1)+'">'+m+'</option>';}).join("") + '</select></div>' +
      '<div class="field"><label>Ano</label><input name="ano" type="number" min="' + ano + '" max="2100" value="' + (ano + 1) + '" required></div>' +
      '<button class="btn btn--ink full" type="submit">Enviar para os consultores</button><p class="lead-modal-msg full" role="status"></p></form></section>';
    document.body.appendChild(el); document.body.classList.add("modal-open"); el.querySelector("input").focus();
    el.addEventListener("click", function(e){ if(e.target.closest("[data-fechar]")){ el.remove(); document.body.classList.remove("modal-open"); }});
    el.querySelector("form").addEventListener("submit", function(e){
      e.preventDefault(); var f=this, msg=f.querySelector(".lead-modal-msg"), tel=limpar(f.telefone.value);
      if(tel.length<10 || tel.length>15){ msg.textContent="Informe um telefone válido com DDD."; return; }
      var b=f.querySelector("button[type=submit]"); b.disabled=true; msg.textContent="Enviando…";
      rpc("registrar_lead", { p_nome:f.nome.value, p_quantidade:+f.quantidade.value, p_email:f.email.value, p_telefone:tel,
        p_duracao:+f.duracao.value||null, p_mes:+f.mes.value, p_ano:+f.ano.value, p_oferta_codigo:oferta.codigo||null,
        p_oferta_titulo:oferta.titulo, p_oferta_url:oferta.url }).then(function(){ f.innerHTML='<div class="lead-ok full"><b>Solicitação recebida.</b><p>Um consultor entrará em contato assim que possível.</p></div>'; })
        .catch(function(err){ msg.textContent=err.message; b.disabled=false; });
    });
  }
  document.addEventListener("click", function (e) {
    var a=e.target.closest("a.btn[data-conhecer]"); if(!a) return;
    e.preventDefault(); var oferta=ofertaDo(a); a.classList.add("is-loading");
    rpc("rotear_atendimento", { p_oferta_codigo:oferta.codigo||null, p_destino:oferta.titulo }).then(function(r){
      var x=Array.isArray(r)?r[0]:r; if(x&&x.encontrado) abrirWhats(x.whatsapp,oferta,x.nome); else modal(oferta);
    }).catch(function(){ modal(oferta); }).finally(function(){ a.classList.remove("is-loading"); });
  }, true);
  setTimeout(prepararEquipe, 300); setTimeout(prepararEquipe, 1200);
})();
