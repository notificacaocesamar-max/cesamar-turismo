(function () {
  "use strict";
  var cfg = window.CESAMAR_CONFIG.supabase;
  var sb = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
  });
  var form = document.getElementById("form-senha");
  var msg = document.getElementById("mensagem");

  function mensagem(texto, erro) {
    msg.textContent = texto;
    msg.style.color = erro ? "#a92828" : "#176b42";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var senha = document.getElementById("senha").value;
    var confirmacao = document.getElementById("confirmacao").value;
    if (senha !== confirmacao) return mensagem("As senhas não são iguais.", true);
    if (!/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/[0-9]/.test(senha) || !/[^A-Za-z0-9]/.test(senha)) {
      return mensagem("Inclua maiúscula, minúscula, número e símbolo.", true);
    }
    var botao = form.querySelector("button");
    botao.disabled = true;
    mensagem("Salvando sua senha…", false);
    var sessao = await sb.auth.getSession();
    if (!sessao.data.session) {
      botao.disabled = false;
      return mensagem("Este link expirou ou já foi utilizado. Solicite um novo convite.", true);
    }
    var resultado = await sb.auth.updateUser({ password: senha });
    if (resultado.error) {
      botao.disabled = false;
      return mensagem(resultado.error.message || "Não foi possível salvar a senha.", true);
    }
    await sb.auth.signOut();
    mensagem("Senha criada. Redirecionando para o login seguro…", false);
    window.setTimeout(function () { window.location.replace("index.html"); }, 900);
  });
})();
