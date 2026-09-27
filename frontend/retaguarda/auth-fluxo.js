(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CesamarAuthFluxo = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function fatoresTotp(resposta) { return (resposta && resposta.totp) || []; }
  function fatorVerificado(resposta) { return fatoresTotp(resposta).filter(function (x) { return x.status === "verified"; })[0] || null; }
  function fatoresPendentes(resposta) { return fatoresTotp(resposta).filter(function (x) { return x.status !== "verified"; }); }
  function codigo(valor) { return String(valor || "").replace(/\D/g, ""); }
  function podeVerControle(perfil) { return !!perfil && (perfil.papel === "master" || perfil.papel === "gerencial"); }
  function podeAtender(perfil) { return !!perfil && perfil.ativo !== false && perfil.papel !== "master" && perfil.pode_atender === true; }
  function recebeLeads(perfil) { return podeAtender(perfil) && perfil.recebe_leads === true; }
  function viewsPermitidas(perfil) {
    if (!perfil || perfil.ativo === false) return [];
    if (perfil.papel === "master" || perfil.papel === "gerencial") return ["painel","perfil","controle","ofertas","robo","regras","precos","destinos","textos","imagens","whatsapp","metricas","auditoria","config"];
    if (perfil.papel === "consultor") return ["perfil","ofertas"];
    return [];
  }
  function podeVerView(perfil, view) { return viewsPermitidas(perfil).indexOf(view) >= 0; }
  async function validarMfa(auth, fator, valor) {
    var token = codigo(valor);
    if (token.length !== 6) throw new Error("Digite os 6 números do aplicativo.");
    if (!fator || !fator.id) throw new Error("Fator de autenticação indisponível. Entre novamente.");
    var desafio = await auth.mfa.challenge({ factorId: fator.id });
    if (desafio.error) throw desafio.error;
    var verificacao = await auth.mfa.verify({ factorId: fator.id, challengeId: desafio.data.id, code: token });
    if (verificacao.error) throw verificacao.error;
    var nivel = await auth.mfa.getAuthenticatorAssuranceLevel();
    if (nivel.error) throw nivel.error;
    if (nivel.data.currentLevel !== "aal2") throw new Error("O código foi aceito, mas a sessão segura não foi atualizada. Tente novamente.");
    return verificacao.data;
  }
  return { fatoresTotp:fatoresTotp, fatorVerificado:fatorVerificado, fatoresPendentes:fatoresPendentes, codigo:codigo, podeVerControle:podeVerControle, podeAtender:podeAtender, recebeLeads:recebeLeads, viewsPermitidas:viewsPermitidas, podeVerView:podeVerView, validarMfa:validarMfa };
});
