namespace Cesamar.Api;

/// <summary>
/// Todas as consultas SQL da API. O PostgreSQL já devolve o JSON pronto (json_agg),
/// com nomes em camelCase iguais aos de frontend/assets/js/data.js.
/// </summary>
public static class Sql
{
    public const string Health = "SELECT 1";

    public const string Destinos = """
        SELECT coalesce(json_agg(t ORDER BY t.ordem), '[]'::json)::text FROM (
          SELECT slug, nome, local, tipo, regiao, temas, meses, epoca, chamada, descricao, imagem, ordem
          FROM destinos WHERE ativo
        ) t
        """;

    private const string PacoteCols = """
          slug, titulo, destino_slug AS "destino", tipo, noites,
          preco_a_partir::float8 AS "precoAPartir", preco_de::float8 AS "precoDe", badge, parcelas,
          tags, resumo, inclui, nao_inclui AS "naoInclui", roteiro, destaque, saida, ordem, ativo
        """;

    public const string Pacotes = """
        SELECT coalesce(json_agg(t ORDER BY t.ordem), '[]'::json)::text FROM (
          SELECT
        """ + PacoteCols + """
          FROM pacotes WHERE ativo
        ) t
        """;

    public const string Pacote = """
        SELECT row_to_json(t)::text FROM (
          SELECT
        """ + PacoteCols + """
          FROM pacotes WHERE ativo AND slug = @slug
        ) t
        """;

    public const string Cruzeiros = """
        SELECT coalesce(json_agg(t ORDER BY t.ordem), '[]'::json)::text FROM (
          SELECT slug, nome, arte, noites, preco_a_partir::float8 AS "precoAPartir", temporada, portos, resumo, ordem
          FROM cruzeiros WHERE ativo
        ) t
        """;

    public const string InserirLead = """
        INSERT INTO leads (nome, email, whatsapp, destino, pacote, mes, pessoas, criancas, orcamento, mensagem, origem, origem_pagina, ip, user_agent)
        VALUES (@nome, @email, @whatsapp, @destino, @pacote, @mes, @pessoas, @criancas, @orcamento, @mensagem, @origem, @origem_pagina, @ip, @user_agent)
        RETURNING id
        """;

    public const string InserirEvento = """
        INSERT INTO lead_eventos (lead_id, tipo, de_status, para_status, nota, usuario)
        VALUES (@lead_id, @tipo, @de, @para, @nota, @usuario)
        """;

    public const string InserirAuditoria = """
        INSERT INTO auditoria (usuario, acao, entidade, entidade_id, detalhes, ip)
        VALUES (@usuario, @acao, @entidade, @entidade_id, @detalhes::jsonb, @ip)
        """;

    // ---------------------------------------------------------------- retaguarda
    public const string AdminLeads = """
        SELECT coalesce(json_agg(t ORDER BY t."criadoEm" DESC), '[]'::json)::text FROM (
          SELECT id, nome, email, whatsapp, destino, pacote, mes, pessoas, criancas, orcamento, mensagem,
                 origem, origem_pagina AS "origemPagina", status, responsavel, observacoes,
                 criado_em AS "criadoEm", atualizado_em AS "atualizadoEm"
          FROM leads
          WHERE (@status IS NULL OR status = @status)
            AND (@q IS NULL OR nome ILIKE '%' || @q || '%' OR coalesce(email,'') ILIKE '%' || @q || '%'
                 OR coalesce(whatsapp,'') ILIKE '%' || @q || '%' OR coalesce(destino,'') ILIKE '%' || @q || '%'
                 OR coalesce(pacote,'') ILIKE '%' || @q || '%')
          ORDER BY criado_em DESC
          LIMIT 500
        ) t
        """;

    public const string AdminLeadEventos = """
        SELECT coalesce(json_agg(t ORDER BY t."criadoEm"), '[]'::json)::text FROM (
          SELECT id, tipo, de_status AS "deStatus", para_status AS "paraStatus", nota, usuario, criado_em AS "criadoEm"
          FROM lead_eventos WHERE lead_id = @id
        ) t
        """;

    public const string LeadStatusParaUpdate = "SELECT status, responsavel FROM leads WHERE id = @id FOR UPDATE";

    public const string AtualizarLead = """
        UPDATE leads SET
          status        = coalesce(@status, status),
          responsavel   = CASE WHEN @responsavel IS NULL THEN responsavel WHEN @responsavel = '' THEN NULL ELSE @responsavel END,
          observacoes   = CASE WHEN @observacoes IS NULL THEN observacoes WHEN @observacoes = '' THEN NULL ELSE @observacoes END,
          atualizado_em = now()
        WHERE id = @id
        """;

    public const string AdminResumo = """
        SELECT json_build_object(
          'porStatus', (SELECT coalesce(json_object_agg(status, n), '{}'::json) FROM (SELECT status, count(*) n FROM leads GROUP BY status) s),
          'total',     (SELECT count(*) FROM leads),
          'hoje',      (SELECT count(*) FROM leads WHERE criado_em >= date_trunc('day', now())),
          'semana',    (SELECT count(*) FROM leads WHERE criado_em >= now() - interval '7 days'),
          'porDia',    (SELECT coalesce(json_agg(json_build_object('dia', d::date, 'n', coalesce(c.n, 0)) ORDER BY d), '[]'::json)
                        FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') d
                        LEFT JOIN (SELECT date_trunc('day', criado_em) dia, count(*) n FROM leads GROUP BY 1) c ON c.dia = d),
          'topDestinos', (SELECT coalesce(json_agg(x), '[]'::json) FROM (
                          SELECT coalesce(nullif(destino, ''), 'Sem destino definido') AS destino, count(*) n
                          FROM leads GROUP BY 1 ORDER BY 2 DESC LIMIT 6) x),
          'porOrigem', (SELECT coalesce(json_object_agg(origem, n), '{}'::json) FROM (SELECT origem, count(*) n FROM leads GROUP BY origem) o)
        )::text
        """;

    public const string AdminPacotes = """
        SELECT coalesce(json_agg(t ORDER BY t.ordem), '[]'::json)::text FROM (
          SELECT
        """ + PacoteCols + """
          , atualizado_em AS "atualizadoEm"
          FROM pacotes
        ) t
        """;

    public const string AtualizarPacote = """
        UPDATE pacotes SET
          titulo         = coalesce(@titulo, titulo),
          resumo         = coalesce(@resumo, resumo),
          preco_a_partir = coalesce(@preco, preco_a_partir),
          preco_de       = CASE WHEN @limpar_de THEN NULL ELSE coalesce(@preco_de, preco_de) END,
          badge          = CASE WHEN @badge IS NULL THEN badge WHEN @badge = '' THEN NULL ELSE @badge END,
          destaque       = coalesce(@destaque, destaque),
          ativo          = coalesce(@ativo, ativo),
          atualizado_em  = now()
        WHERE slug = @slug
        """;
}
