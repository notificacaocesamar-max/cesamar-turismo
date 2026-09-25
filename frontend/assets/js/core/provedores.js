/* ==========================================================================
   Provedores de tarifas (FlightProvider)
   --------------------------------------------------------------------------
   Todo provedor implementa:
     searchIndicativePrices(params: SearchParams)   -> Promise<IndicativeResult[]>
     searchLiveOffers(params: LiveSearchParams)     -> Promise<FlightOffer[]>

   SearchParams      { cidadeOrigem, aeroportosOrigem[], aeroportoDestino, de, ate,
                       duracaoMin, duracaoMax, adultos, classe }
   IndicativeResult  { aeroportoOrigem, aeroportoDestino, dataIda, dataVolta, preco, moeda }
   LiveSearchParams  { cidadeOrigem, aeroportosOrigem[], aeroportoDestino, dataIda, dataVolta,
                       adultos, classe }
   FlightOffer       { idProvedor, companhia, aeroportoOrigem, aeroportoDestino, dataIda, dataVolta,
                       escalasIda, escalasVolta, bagagem, classe, preco, moeda, fonte, tipoPreco }

   DemoProvider: dados SIMULADOS (determinísticos por dia) — tipoPreco "demonstrativo".
   Skyscanner / Duffel / Amadeus: esqueletos SÓ para o servidor (robô no Cloud Run).
   Nunca instanciar provedores reais no navegador — as chaves ficam em variáveis de ambiente.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.Cesamar = root.Cesamar || {}).provedores = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ------------------------------------------------------------ utilitários de data
  function d(s) { var p = s.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function iso(dt) { return dt.toISOString().slice(0, 10); }
  function addDias(s, n) { var x = d(s); x.setUTCDate(x.getUTCDate() + n); return iso(x); }
  function diffDias(a, b) { return Math.round((d(b) - d(a)) / 86400000); }

  // Hash determinístico (FNV-1a) -> número em [0,1)
  function rnd(txt) {
    var h = 2166136261;
    for (var i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
  }

  // ------------------------------------------------------------ DemoProvider
  // Tarifa base simulada (R$, ida e volta, 1 adulto, econômica) — NÃO são preços reais.
  var BASE = {
    FCO: 4300, LIS: 3900, CDG: 4500, MAD: 4200, LHR: 4800, AMS: 4600, FRA: 4500, ZRH: 5200, ATH: 5000, IST: 4700,
    MCO: 3900, YYZ: 4900, CUN: 4100, EZE: 1500, SCL: 1800, LIM: 2300, NRT: 7600, DXB: 5300, CAI: 5600, CPT: 5400
  };
  var CIAS = {
    Europa: ["TAP Air Portugal", "Air France", "KLM", "Iberia", "ITA Airways", "Lufthansa", "LATAM", "Swiss", "British Airways", "Turkish Airlines"],
    "América do Norte": ["LATAM", "American Airlines", "Delta", "United", "Azul", "Copa Airlines", "Air Canada"],
    "América Central": ["Copa Airlines", "LATAM", "Aeroméxico"],
    "América do Sul": ["LATAM", "Aerolíneas Argentinas", "GOL", "Sky Airline", "JetSMART"],
    "Ásia": ["Emirates", "Qatar Airways", "Turkish Airlines", "American Airlines", "Air France"],
    "Oriente Médio": ["Emirates", "Qatar Airways", "Turkish Airlines"],
    "África": ["South African Airways", "Emirates", "Qatar Airways", "Ethiopian Airlines", "Turkish Airlines"]
  };
  // Aeroportos domésticos (CGH, SDU) exigem conexão; VCP tem poucos voos internacionais
  var EXTRA_ESCALA = { CGH: 1, SDU: 1, VCP: 0 };
  var FATOR_AEROPORTO = { GRU: 1, CGH: 1.04, VCP: 1.02, GIG: 1.02, SDU: 1.06 };

  function sazonal(dataIda) { // meses de alta temporada ficam mais caros
    var m = +dataIda.slice(5, 7);
    return [1.18, 1.12, 1.0, 0.97, 0.95, 1.02, 1.2, 1.1, 0.96, 0.98, 1.0, 1.22][m - 1];
  }

  function DemoProvider(opcoes) {
    opcoes = opcoes || {};
    this.nome = "demo";
    this.diaExecucao = opcoes.diaExecucao || iso(new Date()); // variação diária determinística
    this.falharEm = opcoes.falharEm || []; // IATAs que simulam erro (para testar o registro de erros)
    this.regiaoPorIata = opcoes.regiaoPorIata || {};
  }
  DemoProvider.prototype._falha = function (iata) {
    if (this.falharEm.indexOf(iata) >= 0) {
      var e = new Error("Tempo de resposta excedido ao consultar " + iata + " (falha simulada)");
      e.codigo = "TIMEOUT_SIMULADO"; throw e;
    }
  };
  DemoProvider.prototype._preco = function (orig, dest, ida, volta) {
    var base = BASE[dest] || 5000;
    var dur = diffDias(ida, volta);
    var dow = d(ida).getUTCDay(); // terça/quarta mais baratas
    var fDow = [1.06, 1.0, 0.95, 0.96, 1.03, 1.08, 1.04][dow];
    var ruido = 0.9 + rnd(orig + dest + ida + volta + this.diaExecucao) * 0.22;
    var fDur = 1 + Math.max(0, dur - 10) * 0.004;
    return Math.round(base * sazonal(ida) * fDow * ruido * fDur * (FATOR_AEROPORTO[orig] || 1.03));
  };
  DemoProvider.prototype.searchIndicativePrices = function (p) {
    var self = this;
    return new Promise(function (ok) {
      self._falha(p.aeroportoDestino);
      var out = [], total = diffDias(p.de, p.ate);
      p.aeroportosOrigem.forEach(function (orig) {
        for (var i = 0; i <= total; i++) {
          var ida = addDias(p.de, i);
          for (var dur = p.duracaoMin; dur <= p.duracaoMax; dur++) {
            var volta = addDias(ida, dur);
            out.push({ aeroportoOrigem: orig, aeroportoDestino: p.aeroportoDestino, dataIda: ida, dataVolta: volta, preco: self._preco(orig, p.aeroportoDestino, ida, volta), moeda: "BRL" });
          }
        }
      });
      ok(out);
    });
  };
  DemoProvider.prototype.searchLiveOffers = function (p) {
    var self = this;
    return new Promise(function (ok) {
      self._falha(p.aeroportoDestino);
      var cias = CIAS[self.regiaoPorIata[p.aeroportoDestino]] || CIAS.Europa;
      var out = [];
      p.aeroportosOrigem.forEach(function (orig) {
        var ind = self._preco(orig, p.aeroportoDestino, p.dataIda, p.dataVolta);
        for (var k = 0; k < 4; k++) {
          var s = rnd(orig + p.aeroportoDestino + p.dataIda + k + self.diaExecucao);
          var esc = (s < 0.35 ? 0 : s < 0.85 ? 1 : 2) + (EXTRA_ESCALA[orig] || 0);
          var bag = rnd("bag" + orig + p.dataIda + k) > 0.45;
          var preco = Math.round(ind * (0.97 + s * 0.15) * (bag ? 1.07 : 1) * (esc === 0 ? 1.12 : 1));
          out.push({
            idProvedor: "DEMO-" + orig + p.aeroportoDestino + p.dataIda.replace(/-/g, "") + k,
            companhia: cias[Math.floor(rnd("cia" + orig + p.dataIda + k) * cias.length)],
            aeroportoOrigem: orig, aeroportoDestino: p.aeroportoDestino, dataIda: p.dataIda, dataVolta: p.dataVolta,
            escalasIda: esc, escalasVolta: esc, bagagem: bag, classe: p.classe || "economica",
            preco: preco, moeda: "BRL", fonte: "demo", tipoPreco: "demonstrativo"
          });
        }
      });
      ok(out);
    });
  };

  // ------------------------------------------------------------ Adaptadores reais (servidor)
  // Esqueletos: a chamada HTTP e o mapeamento de campos devem ser concluídos com a documentação
  // oficial e credenciais de teste do provedor escolhido. Nada aqui foi testado contra a API real.
  function exigirServidor(nome) {
    if (typeof window !== "undefined") throw new Error(nome + " só pode rodar no servidor (robô). Nunca no navegador.");
  }
  function exigirEnv(env, chaves, nome) {
    chaves.forEach(function (k) { if (!env[k]) throw new Error(nome + ": variável de ambiente " + k + " não configurada."); });
  }

  // ATENÇÃO: o portal Amadeus Self-Service foi descontinuado em 17/07/2026 (segundo comunicado divulgado pela
  // imprensa do setor). Novos acessos passam por contrato Enterprise — confirmar condições antes de usar.
  function AmadeusProvider(env) {
    exigirServidor("AmadeusProvider");
    exigirEnv(env, ["AMADEUS_CLIENT_ID", "AMADEUS_CLIENT_SECRET"], "Amadeus");
    this.nome = "amadeus"; this.env = env;
    this.base = env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
  }
  AmadeusProvider.prototype.searchIndicativePrices = function () {
    // TODO: GET /v1/shopping/flight-dates (Flight Cheapest Date Search) + token OAuth2 (client_credentials)
    return Promise.reject(new Error("AmadeusProvider.searchIndicativePrices ainda não implementado"));
  };
  AmadeusProvider.prototype.searchLiveOffers = function () {
    // TODO: GET/POST /v2/shopping/flight-offers (Flight Offers Search) e mapear para FlightOffer
    return Promise.reject(new Error("AmadeusProvider.searchLiveOffers ainda não implementado"));
  };

  function DuffelProvider(env) {
    exigirServidor("DuffelProvider");
    exigirEnv(env, ["DUFFEL_ACCESS_TOKEN"], "Duffel");
    this.nome = "duffel"; this.env = env;
  }
  DuffelProvider.prototype.searchIndicativePrices = function () {
    // Duffel não oferece calendário de preços indicativos: usar outro provedor para esta etapa
    // ou amostrar poucas datas com offer_requests (atenção ao custo por consulta).
    return Promise.reject(new Error("DuffelProvider não oferece preços indicativos — combine com outro provedor"));
  };
  DuffelProvider.prototype.searchLiveOffers = function () {
    // TODO: POST https://api.duffel.com/air/offer_requests (header Duffel-Version) e mapear offers
    return Promise.reject(new Error("DuffelProvider.searchLiveOffers ainda não implementado"));
  };

  function SkyscannerProvider(env) {
    exigirServidor("SkyscannerProvider");
    exigirEnv(env, ["SKYSCANNER_API_KEY"], "Skyscanner");
    this.nome = "skyscanner"; this.env = env;
  }
  SkyscannerProvider.prototype.searchIndicativePrices = function () {
    // TODO: POST /apiservices/v3/flights/indicative/search (acesso via parceria Skyscanner)
    return Promise.reject(new Error("SkyscannerProvider.searchIndicativePrices ainda não implementado"));
  };
  SkyscannerProvider.prototype.searchLiveOffers = function () {
    // TODO: POST /apiservices/v3/flights/live/search/create + /poll
    return Promise.reject(new Error("SkyscannerProvider.searchLiveOffers ainda não implementado"));
  };

  /** Fábrica: escolhe o provedor pela configuração (FLIGHT_PROVIDER). O resto do sistema não muda. */
  function criarProvedor(nome, opcoes) {
    switch ((nome || "demo").toLowerCase()) {
      case "demo": return new DemoProvider(opcoes);
      case "amadeus": return new AmadeusProvider(opcoes.env || {});
      case "duffel": return new DuffelProvider(opcoes.env || {});
      case "skyscanner": return new SkyscannerProvider(opcoes.env || {});
      default: throw new Error("Provedor de tarifas desconhecido: " + nome);
    }
  }

  return { criarProvedor: criarProvedor, DemoProvider: DemoProvider, AmadeusProvider: AmadeusProvider, DuffelProvider: DuffelProvider, SkyscannerProvider: SkyscannerProvider, datas: { addDias: addDias, diffDias: diffDias, iso: iso } };
});
