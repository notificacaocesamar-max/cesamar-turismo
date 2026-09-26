(function () {
  "use strict";
  var form = document.getElementById("programar-form");
  if (!form) return;
  var cfg = window.CESAMAR_CONFIG || {}, supa = cfg.supabase || {}, msg = document.getElementById("programar-msg");
  var inicio = form.elements.periodoInicio, fim = form.elements.periodoFim;
  var limite = new Date(); limite.setMonth(limite.getMonth() + 3);
  var minimo = limite.getFullYear() + "-" + String(limite.getMonth() + 1).padStart(2, "0");
  inicio.min = minimo; fim.min = minimo;
  inicio.addEventListener("change", function () { fim.min = inicio.value || minimo; if (fim.value && fim.value < fim.min) fim.value = fim.min; });
  function mostrar(texto, tipo) { msg.textContent = texto; msg.className = "form-msg " + tipo; }
  function telefone(v) { return String(v || "").replace(/\D/g, ""); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (inicio.value < minimo) { mostrar("Escolha um período com pelo menos três meses de antecedência.", "warn"); return; }
    if (fim.value < inicio.value) { mostrar("O fim do período precisa ser igual ou posterior ao início.", "warn"); return; }
    var tel = telefone(form.elements.telefone.value);
    if (tel.length < 10 || tel.length > 15) { mostrar("Informe um telefone válido com DDD.", "warn"); return; }
    if (!supa.url || !supa.publishableKey) { mostrar("Não foi possível registrar agora. Tente novamente em alguns minutos.", "warn"); return; }
    var botao = form.querySelector("button[type=submit]"); botao.disabled = true; botao.textContent = "Criando seu radar…";
    fetch(supa.url + "/rest/v1/rpc/registrar_radar_viagem", { method: "POST", headers: { "Content-Type": "application/json", apikey: supa.publishableKey }, body: JSON.stringify({
      p_nome: form.elements.nome.value.trim(), p_destino: form.elements.destino.value.trim(), p_periodo_inicio: inicio.value + "-01", p_periodo_fim: fim.value + "-01",
      p_telefone: tel, p_email: form.elements.email.value.trim().toLowerCase(), p_orcamento: Number(form.elements.orcamento.value)
    }) }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function () {
      form.reset(); inicio.min = minimo; fim.min = minimo;
      mostrar("Seu radar foi criado. A equipe Cesamar entrará em contato quando encontrar uma oportunidade próxima do seu sonho.", "ok");
    }).catch(function () { mostrar("Não conseguimos registrar seu radar agora. Seus dados não foram enviados; tente novamente mais tarde.", "warn"); }).finally(function () { botao.disabled = false; botao.textContent = "Criar meu radar de viagem"; });
  });
})();
