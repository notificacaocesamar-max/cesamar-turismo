type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "radares_viagem" | "customer_leads";
  schema: string;
  record: Record<string, unknown> | null;
};

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

function resposta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function escapar(valor: unknown) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c] as string));
}

function dataBr(valor: unknown) {
  if (!valor) return "Não informado";
  const partes = String(valor).slice(0, 10).split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : escapar(valor);
}

function moeda(valor: unknown) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));
}

function conteudo(table: string, r: Record<string, unknown>) {
  if (table === "radares_viagem") {
    const assunto = `Novo radar personalizado: ${String(r.destino || "destino a definir")}`;
    const linhas = [
      ["Cliente", r.nome], ["Destino desejado", r.destino],
      ["Período", `${dataBr(r.periodo_inicio)} a ${dataBr(r.periodo_fim)}`],
      ["Orçamento para passagens", moeda(r.orcamento)], ["Telefone", r.telefone], ["E-mail", r.email],
    ];
    return { assunto, titulo: "Novo radar personalizado", linhas };
  }
  const assunto = `Novo contato do portal: ${String(r.oferta_titulo || r.oferta_codigo || "oferta")}`;
  const linhas = [
    ["Cliente", r.nome], ["Viajantes", r.quantidade_viajantes],
    ["Previsão", `${String(r.mes_viagem || "").padStart(2, "0")}/${r.ano_viagem || ""}`],
    ["Duração", r.duracao_dias ? `${r.duracao_dias} dias` : "Não informada"],
    ["Telefone", r.telefone], ["E-mail", r.email], ["Oferta", r.oferta_titulo || r.oferta_codigo || "Não informada"],
    ["Página da oferta", r.oferta_url || "Não informada"],
  ];
  return { assunto, titulo: "Novo cliente interessado", linhas };
}

async function supabase(path: string, init: RequestInit = {}) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...jsonHeaders, ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return resposta({ erro: "Método não permitido" }, 405);
  const segredo = Deno.env.get("CESAMAR_WEBHOOK_SECRET");
  if (!segredo || req.headers.get("x-cesamar-secret") !== segredo) return resposta({ erro: "Não autorizado" }, 401);

  let payload: WebhookPayload;
  try { payload = await req.json(); } catch { return resposta({ erro: "JSON inválido" }, 400); }
  if (payload.type !== "INSERT" || payload.schema !== "public" || !payload.record ||
      !["radares_viagem", "customer_leads"].includes(payload.table)) return resposta({ ignorado: true });

  const r = payload.record;
  const id = String(r.id || "");
  if (!id || r.email_status === "enviado") return resposta({ ignorado: true });

  const trava = await supabase(`${payload.table}?id=eq.${encodeURIComponent(id)}&email_status=neq.enviado`, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ email_status: "enviando", email_erro: null, email_tentativas: Number(r.email_tentativas || 0) + 1 }),
  });
  if (!trava.ok || !(await trava.json()).length) return resposta({ ignorado: true });

  try {
    const perfis = await supabase("staff_profiles?select=nome_completo,email&ativo=eq.true&recebe_leads=eq.true&papel=in.(gerencial,consultor)");
    if (!perfis.ok) throw new Error(`Não foi possível consultar destinatários (${perfis.status})`);
    const destinatarios = (await perfis.json()).filter((p: { email?: string }) => p.email);
    if (!destinatarios.length) throw new Error("Nenhum funcionário habilitado para receber leads");

    const info = conteudo(payload.table, r);
    const corpoLinhas = info.linhas.map(([rotulo, valor]) => `<tr><td style="padding:8px 12px;color:#666">${escapar(rotulo)}</td><td style="padding:8px 12px;font-weight:600">${escapar(valor)}</td></tr>`).join("");
    const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#171936"><h1 style="font-size:24px">${escapar(info.titulo)}</h1><p>Um novo pedido foi registrado no portal Cesamar Turismo.</p><table style="width:100%;border-collapse:collapse;background:#f7f4ef">${corpoLinhas}</table><p style="font-size:12px;color:#777">Registro ${escapar(id)} · enviado automaticamente pelo portal.</p></div>`;
    const brevo = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST", headers: { ...jsonHeaders, "api-key": Deno.env.get("BREVO_API_KEY")! },
      body: JSON.stringify({
        sender: { name: Deno.env.get("BREVO_SENDER_NAME") || "Cesamar Turismo", email: Deno.env.get("BREVO_SENDER_EMAIL") },
        to: destinatarios.map((p: { nome_completo: string; email: string }) => ({ name: p.nome_completo, email: p.email })),
        replyTo: r.email ? { name: String(r.nome || "Cliente Cesamar"), email: String(r.email) } : undefined,
        subject: info.assunto, htmlContent: html, tags: ["portal-cesamar", payload.table],
        headers: { "Idempotency-Key": `${payload.table}-${id}` },
      }),
    });
    const retorno = await brevo.json();
    if (!brevo.ok) throw new Error(`Brevo ${brevo.status}: ${retorno.message || "falha no envio"}`);
    await supabase(`${payload.table}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ email_status: "enviado", email_enviado_em: new Date().toISOString(), email_message_id: retorno.messageId || null, email_erro: null }) });
    return resposta({ enviado: true, destinatarios: destinatarios.length, messageId: retorno.messageId });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message.slice(0, 500) : "Falha desconhecida";
    await supabase(`${payload.table}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ email_status: "erro", email_erro: mensagem }) });
    return resposta({ erro: mensagem }, 500);
  }
});

