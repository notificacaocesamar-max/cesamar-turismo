/* Gera supabase/seed.sql a partir de frontend/assets/js/seed.js (mesmos dados da versão offline).
   Uso: node tools/gerar-seed-supabase.js */
"use strict";
const fs = require("fs"), path = require("path");
global.window = {};
require("../frontend/assets/js/seed.js");
const S = window.CESAMAR_SEED;
const q = (v) => v === null || v === undefined || v === "" ? "null" : typeof v === "number" || typeof v === "boolean" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const j = (v) => q(JSON.stringify(v)) + "::jsonb";
const arr = (a) => "array[" + a.map(q).join(",") + "]::text[]";
const L = ["-- Dados iniciais (DEMONSTRAÇÃO) gerados por tools/gerar-seed-supabase.js — preços simulados", "begin;"];
S.destinos.forEach((d) => L.push(`insert into destinations (id,sigla,nome,nome_exibicao,artigo,cidade,aeroporto,regiao,ativo,ordem) values (${[d.id, d.sigla, d.nome, d.nomeExibicao].map(q).join(",") + ",'" + (d.artigo || "") + "'," + [d.cidade, d.aeroporto, d.regiao, d.ativo, d.ordem].map(q).join(",")}) on conflict (id) do nothing;`));
S.aeroportos.forEach((a) => L.push(`insert into airports (iata,nome,cidade,cidade_grupo,pais,origem,ativo) values (${[a.iata, a.nome, a.cidade, a.cidadeGrupo, a.pais, !!a.origem, a.ativo !== false].map(q).join(",")}) on conflict (iata) do nothing;`));
S.campanhas.forEach((c) => L.push(`insert into campaigns (id,nome,titulo,texto,ativa,ordem) values (${[c.id, c.nome, c.titulo, c.texto, c.ativa, c.ordem].map(q).join(",")}) on conflict (id) do nothing;`));
S.destinos.forEach((d) => (d.campanhas || []).forEach((c) => L.push(`insert into destination_campaigns values (${q(d.id)},${q(c)}) on conflict do nothing;`)));
S.conteudos.forEach((c) => L.push(`insert into destination_contents (destino_id,titulo_emocional,texto,motivos,faq) values (${q(c.destinoId)},${q(c.tituloEmocional)},${q(c.texto)},${j(c.motivos)},${j(c.faq)}) on conflict (destino_id) do nothing;`));
S.imagens.forEach((i) => L.push(`insert into images (destino_id,url,alt,credito,principal,ordem,demonstrativa) values (${[i.destinoId, i.url, i.alt, i.credito, i.principal, i.ordem, i.demonstrativa].map(q).join(",")});`));
S.regras.forEach((r) => L.push(`insert into monitoring_rules (id,destino_id,ativo,origens,periodo_inicio,periodo_fim,duracao_min,duracao_max,max_escalas,exigir_bagagem,adultos,classe,combinacoes) values (${q(r.id)},${q(r.destinoId)},${r.ativo},${arr(r.origens)},${q(r.periodoInicio)},${q(r.periodoFim)},${r.duracaoMin},${r.duracaoMax},${r.maxEscalas},${r.exigirBagagem},${r.adultos},${q(r.classe)},${r.combinacoes}) on conflict (id) do nothing;`));
S.precos.forEach((p) => L.push(`insert into pricing_rules (id,destino_id,modo,margem_pct,margem_minima_reais,taxas_variaveis_pct,custo_financeiro_pct,parcelas,arredondamento,pix_desconto_pct,juros_texto,entrada_texto) values (${[p.id, p.destinoId, p.modo, p.margemPct, p.margemMinimaReais, p.taxasVariaveisPct, p.custoFinanceiroPct, p.parcelas, p.arredondamento, p.pixDescontoPct, p.jurosTexto, p.entradaTexto].map(q).join(",")}) on conflict (id) do nothing;`));
S.consultores.forEach((c) => L.push(`insert into consultants (id,nome,whatsapp,ativo,observacao) values (${[c.id, c.nome, c.whatsapp, c.ativo, c.observacao].map(q).join(",")}) on conflict (id) do nothing;`));
const cfg = Object.assign({}, S.config); delete cfg.adminSenhaDemo; // senha de demonstração não vai para a nuvem
const publicas = ["whatsappNumero", "whatsappMensagem", "whatsappMensagemGeral", "chamadaPadrao", "avisoPreco", "parcelamento"];
Object.keys(cfg).forEach((k) => L.push(`insert into app_settings (chave,valor,publico) values (${q(k)},${j(cfg[k])},${publicas.includes(k)}) on conflict (chave) do nothing;`));
(S.execucoes || []).forEach((x) => L.push(`insert into robot_runs (id,provedor,inicio,fim,regras,novas,atualizadas,sem_alteracao,expiradas,erros) values (${[x.execucaoId, x.provedor, x.inicio, x.fim, x.regras, x.novas, x.atualizadas, x.semAlteracao, x.expiradas, x.erros].map(q).join(",")}) on conflict (id) do nothing;`));
S.ofertas.forEach((o) => {
  L.push(`insert into flight_offers (id,codigo,regra_id,destino_id,campanha_id,status,titulo,subtitulo,chamada,textos_auto,cidade_origem,aeroporto_origem,aeroporto_destino,data_ida,data_volta,companhia,escalas_ida,escalas_volta,classe,bagagem,custo_original,moeda,preco,tipo_preco,fonte,id_provedor,pesquisado_em,publicado_em,aprovado_por,criado_em,atualizado_em) values (${[o.id, o.codigo, o.regraId, o.destinoId, o.campanhaId, o.status, o.titulo, o.subtitulo, o.chamada, !!o.textosAuto, o.cidadeOrigem, o.aeroportoOrigem, o.aeroportoDestino, o.dataIda, o.dataVolta, o.companhia, o.escalasIda, o.escalasVolta, o.classe, o.bagagem, o.custoOriginal, o.moeda].map(q).join(",")},${j(o.preco)},${[o.tipoPreco, o.fonte, o.idProvedor, o.pesquisadoEm, o.publicadoEm, o.aprovadoPor, o.criadoEm, o.atualizadoEm].map(q).join(",")}) on conflict (id) do nothing;`);
  (o.historico || []).forEach((h) => L.push(`insert into flight_offer_prices (oferta_id,data,custo,preco_anunciado,companhia,data_ida,data_volta,cidade_origem,manual) values (${[o.id, h.data, h.custo, h.precoAnunciado, h.companhia, h.dataIda, h.dataVolta, h.cidadeOrigem, !!h.manual].map(q).join(",")});`));
});
L.push("commit;");
fs.writeFileSync(path.join(__dirname, "../supabase/seed.sql"), L.join("\n") + "\n", "utf8");
console.log("supabase/seed.sql:", L.length, "linhas");
