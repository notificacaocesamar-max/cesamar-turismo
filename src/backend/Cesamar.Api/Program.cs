// ==========================================================================
// Cesamar Turismo — API (.NET 8 Minimal API + PostgreSQL via Npgsql)
// - Serve o site (pasta frontend) em http://localhost:5080
// - Catálogo público: /api/destinos, /api/pacotes, /api/pacotes/{slug}, /api/cruzeiros
// - Leads: POST /api/leads (com limite de envios por IP)
// - Retaguarda: /api/admin/* (header X-Admin-Token)
// ==========================================================================
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using Cesamar.Api;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Npgsql;
using NpgsqlTypes;

var builder = WebApplication.CreateBuilder(args);

var connString = builder.Configuration.GetConnectionString("Cesamar")
    ?? throw new InvalidOperationException("ConnectionStrings:Cesamar não configurada (appsettings.json).");
builder.Services.AddSingleton(NpgsqlDataSource.Create(connString));

builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("leads", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(10), QueueLimit = 0 }));
});
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);

var app = builder.Build();
app.UseCors();
app.UseRateLimiter();

// ---------------------------------------------------------------- site estático
var frontendPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, app.Configuration["Frontend:Path"] ?? "../../../frontend"));
if (Directory.Exists(frontendPath))
{
    var files = new PhysicalFileProvider(frontendPath);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = files });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = files });
    app.Logger.LogInformation("Servindo o site a partir de {Path}", frontendPath);
}
else
{
    app.Logger.LogWarning("Pasta do frontend não encontrada em {Path} — só a API estará disponível.", frontendPath);
}

// ---------------------------------------------------------------- helpers
static NpgsqlParameter PText(string name, string? value) => new(name, NpgsqlDbType.Text) { Value = (object?)value ?? DBNull.Value };
static NpgsqlParameter PInt(string name, int? value) => new(name, NpgsqlDbType.Integer) { Value = (object?)value ?? DBNull.Value };
static NpgsqlParameter PBig(string name, long value) => new(name, NpgsqlDbType.Bigint) { Value = value };
static NpgsqlParameter PNum(string name, decimal? value) => new(name, NpgsqlDbType.Numeric) { Value = (object?)value ?? DBNull.Value };
static NpgsqlParameter PBool(string name, bool? value) => new(name, NpgsqlDbType.Boolean) { Value = (object?)value ?? DBNull.Value };

static async Task<IResult> JsonFromDb(NpgsqlDataSource db, string sql, params NpgsqlParameter[] ps)
{
    await using var cmd = db.CreateCommand(sql);
    cmd.Parameters.AddRange(ps);
    var result = await cmd.ExecuteScalarAsync();
    if (result is null or DBNull) return Results.NotFound(new { erro = "Não encontrado" });
    return Results.Text((string)result, "application/json; charset=utf-8");
}

static string? Limpo(string? s, int max)
{
    if (string.IsNullOrWhiteSpace(s)) return null;
    s = s.Trim();
    return s.Length > max ? s[..max] : s;
}

static string Ip(HttpContext ctx) => ctx.Connection.RemoteIpAddress?.ToString() ?? "";

static async Task Auditar(NpgsqlConnection conn, NpgsqlTransaction? tx, string? usuario, string acao, string entidade, string? id, object? detalhes, string ip)
{
    await using var cmd = new NpgsqlCommand(Sql.InserirAuditoria, conn, tx);
    cmd.Parameters.AddRange(new[]
    {
        PText("usuario", usuario), PText("acao", acao), PText("entidade", entidade), PText("entidade_id", id),
        PText("detalhes", detalhes is null ? null : JsonSerializer.Serialize(detalhes)), PText("ip", ip)
    });
    await cmd.ExecuteNonQueryAsync();
}

static async Task<(long? id, string? erro)> GravarLead(NpgsqlDataSource db, LeadIn lead, string ip, string? userAgent)
{
    var nome = Limpo(lead.Nome, 120);
    var email = Limpo(lead.Email, 160);
    var whatsapp = Limpo(lead.Whatsapp, 30);
    var digitos = whatsapp is null ? "" : Regex.Replace(whatsapp, "\\D", "");

    if (nome is null || nome.Length < 2) return (null, "Informe seu nome.");
    if (email is null && digitos.Length == 0) return (null, "Informe um WhatsApp ou e-mail para contato.");
    if (digitos.Length > 0 && (digitos.Length < 10 || digitos.Length > 13)) return (null, "WhatsApp inválido — use DDD + número.");
    if (email is not null && !Regex.IsMatch(email, "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return (null, "E-mail inválido.");

    await using var conn = await db.OpenConnectionAsync();
    await using var tx = await conn.BeginTransactionAsync();
    long id;
    await using (var cmd = new NpgsqlCommand(Sql.InserirLead, conn, tx))
    {
        cmd.Parameters.AddRange(new[]
        {
            PText("nome", nome), PText("email", email), PText("whatsapp", whatsapp),
            PText("destino", Limpo(lead.Destino, 120)), PText("pacote", Limpo(lead.Pacote, 160)), PText("mes", Limpo(lead.Mes, 40)),
            PInt("pessoas", lead.Pessoas is > 0 and < 100 ? lead.Pessoas : null),
            PInt("criancas", lead.Criancas is >= 0 and < 100 ? lead.Criancas : null),
            PText("orcamento", Limpo(lead.Orcamento, 60)), PText("mensagem", Limpo(lead.Mensagem, 2000)),
            PText("origem", Limpo(lead.Origem, 40) ?? "site"), PText("origem_pagina", Limpo(lead.OrigemPagina, 120)),
            PText("ip", ip), PText("user_agent", Limpo(userAgent, 300))
        });
        id = (long)(await cmd.ExecuteScalarAsync())!;
    }
    await using (var ev = new NpgsqlCommand(Sql.InserirEvento, conn, tx))
    {
        ev.Parameters.AddRange(new[] { PBig("lead_id", id), PText("tipo", "CRIADO"), PText("de", null), PText("para", "NOVO"), PText("nota", null), PText("usuario", null) });
        await ev.ExecuteNonQueryAsync();
    }
    await tx.CommitAsync();
    return (id, null);
}

// ---------------------------------------------------------------- público
var api = app.MapGroup("/api");

api.MapGet("/health", async (NpgsqlDataSource db) =>
{
    try
    {
        await using var cmd = db.CreateCommand(Sql.Health);
        await cmd.ExecuteScalarAsync();
        return Results.Ok(new { ok = true, banco = "ok", hora = DateTimeOffset.Now });
    }
    catch (Exception ex)
    {
        return Results.Json(new { ok = false, banco = "indisponível", detalhe = ex.GetType().Name }, statusCode: 503);
    }
});

api.MapGet("/destinos", (NpgsqlDataSource db) => JsonFromDb(db, Sql.Destinos));
api.MapGet("/pacotes", (NpgsqlDataSource db) => JsonFromDb(db, Sql.Pacotes));
api.MapGet("/pacotes/{slug}", (string slug, NpgsqlDataSource db) => JsonFromDb(db, Sql.Pacote, PText("slug", slug)));
api.MapGet("/cruzeiros", (NpgsqlDataSource db) => JsonFromDb(db, Sql.Cruzeiros));

api.MapPost("/leads", async (LeadIn lead, HttpContext ctx, NpgsqlDataSource db) =>
{
    var (id, erro) = await GravarLead(db, lead, Ip(ctx), ctx.Request.Headers.UserAgent.ToString());
    return erro is not null ? Results.BadRequest(new { erro }) : Results.Created($"/api/admin/leads/{id}", new { id });
}).RequireRateLimiting("leads");

// ---------------------------------------------------------------- retaguarda
var adminToken = app.Configuration["Admin:Token"];
if (string.IsNullOrWhiteSpace(adminToken) || adminToken.StartsWith("TROQUE", StringComparison.OrdinalIgnoreCase))
    app.Logger.LogWarning("Admin:Token não configurado ou ainda com o valor padrão. Defina um token forte antes de publicar.");

var admin = app.MapGroup("/api/admin").AddEndpointFilter(async (ctx, next) =>
{
    var informado = ctx.HttpContext.Request.Headers["X-Admin-Token"].ToString();
    if (string.IsNullOrWhiteSpace(adminToken) ||
        !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(informado), Encoding.UTF8.GetBytes(adminToken)))
        return Results.Json(new { erro = "Não autorizado" }, statusCode: StatusCodes.Status401Unauthorized);
    return await next(ctx);
});
static string Usuario(HttpContext ctx) => Limpo(ctx.Request.Headers["X-Admin-Usuario"].ToString(), 60) ?? "retaguarda";

admin.MapGet("/ping", (HttpContext ctx) => Results.Ok(new { ok = true, usuario = Usuario(ctx) }));
admin.MapGet("/resumo", (NpgsqlDataSource db) => JsonFromDb(db, Sql.AdminResumo));
admin.MapGet("/leads", (string? status, string? q, NpgsqlDataSource db) =>
    JsonFromDb(db, Sql.AdminLeads, PText("status", Limpo(status, 30)), PText("q", Limpo(q, 80))));
admin.MapGet("/leads/{id:long}/eventos", (long id, NpgsqlDataSource db) => JsonFromDb(db, Sql.AdminLeadEventos, PBig("id", id)));

admin.MapPatch("/leads/{id:long}", async (long id, LeadUpdate body, HttpContext ctx, NpgsqlDataSource db) =>
{
    var status = Limpo(body.Status, 30);
    if (status is not null && !LeadUpdate.StatusValidos.Contains(status))
        return Results.BadRequest(new { erro = "Status inválido." });
    var usuario = Usuario(ctx);

    await using var conn = await db.OpenConnectionAsync();
    await using var tx = await conn.BeginTransactionAsync();
    string statusAtual; string? respAtual;
    await using (var sel = new NpgsqlCommand(Sql.LeadStatusParaUpdate, conn, tx))
    {
        sel.Parameters.Add(PBig("id", id));
        await using var r = await sel.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return Results.NotFound(new { erro = "Lead não encontrado." });
        statusAtual = r.GetString(0);
        respAtual = r.IsDBNull(1) ? null : r.GetString(1);
    }
    var responsavel = body.Responsavel is null ? null : body.Responsavel.Trim();
    var observacoes = body.Observacoes is null ? null : body.Observacoes.Trim();
    await using (var up = new NpgsqlCommand(Sql.AtualizarLead, conn, tx))
    {
        up.Parameters.AddRange(new[] { PText("status", status), PText("responsavel", responsavel), PText("observacoes", observacoes), PBig("id", id) });
        await up.ExecuteNonQueryAsync();
    }
    async Task Evento(string tipo, string? de, string? para, string? nota)
    {
        await using var ev = new NpgsqlCommand(Sql.InserirEvento, conn, tx);
        ev.Parameters.AddRange(new[] { PBig("lead_id", id), PText("tipo", tipo), PText("de", de), PText("para", para), PText("nota", nota), PText("usuario", usuario) });
        await ev.ExecuteNonQueryAsync();
    }
    if (status is not null && status != statusAtual) await Evento("STATUS", statusAtual, status, null);
    if (responsavel is not null && responsavel != (respAtual ?? "")) await Evento("RESPONSAVEL", respAtual, responsavel == "" ? null : responsavel, null);
    if (!string.IsNullOrWhiteSpace(body.Nota)) await Evento("NOTA", null, null, Limpo(body.Nota, 1000));
    await Auditar(conn, tx, usuario, "LEAD_ATUALIZADO", "lead", id.ToString(), body, Ip(ctx));
    await tx.CommitAsync();
    return Results.Ok(new { ok = true });
});

// Importa leads que ficaram salvos no navegador enquanto o servidor estava offline
admin.MapPost("/leads/importar", async (List<LeadIn> leads, HttpContext ctx, NpgsqlDataSource db) =>
{
    int ok = 0; var erros = new List<string>();
    foreach (var l in leads.Take(200))
    {
        var (id, erro) = await GravarLead(db, l with { Origem = (l.Origem ?? "site") + "-offline" }, Ip(ctx), "importado-retaguarda");
        if (erro is null) ok++; else erros.Add($"{l.Nome}: {erro}");
    }
    await using var conn = await db.OpenConnectionAsync();
    await Auditar(conn, null, Usuario(ctx), "LEADS_IMPORTADOS", "lead", null, new { ok, erros = erros.Count }, Ip(ctx));
    return Results.Ok(new { importados = ok, erros });
});

admin.MapGet("/pacotes", (NpgsqlDataSource db) => JsonFromDb(db, Sql.AdminPacotes));
admin.MapPut("/pacotes/{slug}", async (string slug, PacoteUpdate body, HttpContext ctx, NpgsqlDataSource db) =>
{
    if (body.PrecoAPartir is < 0 || body.PrecoDe is < 0) return Results.BadRequest(new { erro = "Preço inválido." });
    await using var conn = await db.OpenConnectionAsync();
    await using var tx = await conn.BeginTransactionAsync();
    await using (var cmd = new NpgsqlCommand(Sql.AtualizarPacote, conn, tx))
    {
        cmd.Parameters.AddRange(new[]
        {
            PText("titulo", Limpo(body.Titulo, 160)), PText("resumo", Limpo(body.Resumo, 600)),
            PNum("preco", body.PrecoAPartir), PBool("limpar_de", body.LimparPrecoDe == true), PNum("preco_de", body.PrecoDe),
            PText("badge", body.Badge is null ? null : body.Badge.Trim()), PBool("destaque", body.Destaque), PBool("ativo", body.Ativo),
            PText("slug", slug)
        });
        if (await cmd.ExecuteNonQueryAsync() == 0) return Results.NotFound(new { erro = "Pacote não encontrado." });
    }
    await Auditar(conn, tx, Usuario(ctx), "PACOTE_ATUALIZADO", "pacote", slug, body, Ip(ctx));
    await tx.CommitAsync();
    return Results.Ok(new { ok = true });
});

app.Run();

// ---------------------------------------------------------------- modelos
public record LeadIn(string? Nome, string? Email, string? Whatsapp, string? Destino, string? Pacote, string? Mes,
    int? Pessoas, int? Criancas, string? Orcamento, string? Mensagem, string? Origem, string? OrigemPagina);

public record LeadUpdate(string? Status, string? Responsavel, string? Observacoes, string? Nota)
{
    public static readonly HashSet<string> StatusValidos = new() { "NOVO", "EM_ATENDIMENTO", "PROPOSTA_ENVIADA", "FECHADO", "PERDIDO" };
}

public record PacoteUpdate(string? Titulo, string? Resumo, decimal? PrecoAPartir, decimal? PrecoDe, bool? LimparPrecoDe,
    string? Badge, bool? Destaque, bool? Ativo);
