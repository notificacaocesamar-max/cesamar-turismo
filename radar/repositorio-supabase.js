"use strict";

module.exports = function criarRepositorio(env, fetchFn) {
  const base = env.SUPABASE_URL, chave = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !chave) throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  fetchFn = fetchFn || fetch;
  const headers = { apikey: chave, Authorization: "Bearer " + chave, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };
  return {
    async salvar(itens) {
      if (!itens.length) return;
      const linhas = itens.map((x) => ({ id: x.id, fonte: x.fonte, url: x.url, titulo: x.titulo, preco_encontrado: x.precoEncontrado, preco_texto: x.precoTexto, capturado_em: x.capturadoEm, status: x.status, uso: x.uso, observacao: x.observacao }));
      const r = await fetchFn(base + "/rest/v1/radar_leads?on_conflict=id", { method: "POST", headers, body: JSON.stringify(linhas) });
      if (!r.ok) throw new Error("Supabase radar_leads: " + r.status + " " + await r.text());
    }
  };
};
