/* Configuração central do site Cesamar Turismo.
   Altere aqui contatos e o endereço da API — nenhum outro arquivo precisa mudar. */
window.CESAMAR_CONFIG = {
  supabase: {
    url: "https://cwohbclwyqsfuysfobce.supabase.co",
    publishableKey: "sb_publishable_-zwf2vobwshQnpFxa_QAaQ_s861Dh62"
  },
  // Backend .NET (ver start-local-backend.ps1). Se estiver desligado, o site usa assets/js/data.js
  apiBase: "", // versão offline: vazio. Na versão online, informe a URL da API (ex.: https://api.seudominio.com.br/api)
  apiTimeoutMs: 1800,

  // Mostra a faixa "Protótipo · conteúdo e preços ilustrativos" no topo
  prototipo: false,

  // Chave temporária: mude para true para restaurar WhatsApp, e-mail,
  // telefones e os formulários que encaminham o visitante ao WhatsApp.
  contatosAtivos: false,

  empresa: {
    nomeFantasia: "Cesamar Turismo",
    razaoSocial: "Cesamar Turismo e Viagens Ltda",
    cnpj: "32.059.875/0001-55",
    cadastur: "32.059.875/0001-55",
    cadasturValidade: "10/04/2027",
    embratur: "073890041-9",
    fundacaoTexto: "mais de 30 anos"
  },

  contato: {
    telefone: "(21) 2233-8123",
    telefoneLink: "+552122338123",
    // WhatsApp que aparece no site atual — CONFIRMAR antes de publicar
    whatsapp: "5521993939181",
    whatsappTexto: "(21) 99393-9181",
    email: "cesamarturismo@gmail.com",
    instagram: "cesamarturismo",
    endereco: "Av. Rio Branco, 39 — Sala 803",
    bairroCidade: "Centro, Rio de Janeiro — RJ",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.+Rio+Branco,+39,+Centro,+Rio+de+Janeiro",
    horario: "" // ex.: "Seg a sex, 9h às 18h" — vazio = não exibe
  }
};

document.documentElement.classList.toggle("contatos-off", !window.CESAMAR_CONFIG.contatosAtivos);
