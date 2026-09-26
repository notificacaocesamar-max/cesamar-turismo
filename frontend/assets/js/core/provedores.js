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

  function DuffelProvider(env, opcoes) {
    exigirServidor("DuffelProvider");
    exigirEnv(env, ["DUFFEL_ACCESS_TOKEN"], "Duffel");
    opcoes = opcoes || {};
    this.nome = "duffel"; this.env = env;
    this.base = (env.DUFFEL_BASE_URL || "https://api.duffel.com").replace(/\/$/, "");
    this.fetch = opcoes.fetch || (typeof fetch === "function" ? fetch : null);
    if (!this.fetch) throw new Error("Duffel: fetch não está disponível neste Node.");
    this.amostras = Math.max(1, Math.min(10, +(env.DUFFEL_DATE_SAMPLES || 3)));
    this.timeoutMs = Math.max(5000, +(env.DUFFEL_TIMEOUT_MS || 25000));
    this.supplierTimeoutMs = Math.max(3000, Math.min(this.timeoutMs - 1000, +(env.DUFFEL_SUPPLIER_TIMEOUT_MS || 15000)));
    this.moeda = (env.DUFFEL_REQUIRED_CURRENCY || "BRL").toUpperCase();
    this.cache = {};
  }
  DuffelProvider.prototype._chave = function (p) {
    return [p.cidadeOrigem, p.aeroportoDestino, p.dataIda, p.dataVolta, p.classe || "economica"].join("|");
  };
  DuffelProvider.prototype._classe = function (classe) {
    return ({ economica: "economy", executiva: "business", primeira: "first", premium_economy: "premium_economy" })[classe] || "economy";
  };
  DuffelProvider.prototype._datasAmostra = function (p) {
    var quantidade = p.amostrasConsultas == null ? this.amostras : Math.max(0, +p.amostrasConsultas);
    var total = Math.max(0, diffDias(p.de, p.ate)), out = [], vistos = {};
    for (var i = 0; i < quantidade; i++) {
      var deslocamento = quantidade === 1 ? Math.floor(total / 2) : Math.round(total * i / (quantidade - 1));
      var duracoes = [p.duracaoMin, Math.round((p.duracaoMin + p.duracaoMax) / 2), p.duracaoMax];
      var ida = addDias(p.de, deslocamento), volta = addDias(ida, duracoes[i % duracoes.length]);
      var k = ida + "|" + volta;
      if (!vistos[k]) { vistos[k] = true; out.push({ dataIda: ida, dataVolta: volta }); }
    }
    return out;
  };
  DuffelProvider.prototype._mapearOferta = function (oferta) {
    var slices = oferta.slices || [], ida = slices[0] || {}, volta = slices[1] || {};
    var segIda = ida.segments || [], segVolta = volta.segments || [];
    if (!segIda.length || !segVolta.length) return null;
    var primeiro = segIda[0], ultimoIda = segIda[segIda.length - 1], primeiroVolta = segVolta[0], ultimoVolta = segVolta[segVolta.length - 1];
    var moeda = String(oferta.total_currency || "").toUpperCase();
    if (moeda !== this.moeda) return null; // não mistura moeda estrangeira com margem em reais
    var passageiros = [].concat.apply([], slices.map(function (s) { return s.segments || []; })).reduce(function (acc, s) { return acc.concat(s.passengers || []); }, []);
    var bagagem = passageiros.some(function (psg) { return (psg.baggages || []).some(function (b) { return b.type === "checked" && +b.quantity > 0; }); });
    var cia = (primeiro.operating_carrier && primeiro.operating_carrier.name) || (oferta.owner && oferta.owner.name) || "Companhia aérea";
    return {
      idProvedor: oferta.id,
      companhia: cia,
      aeroportoOrigem: primeiro.origin && primeiro.origin.iata_code,
      aeroportoDestino: ultimoIda.destination && ultimoIda.destination.iata_code,
      dataIda: String(primeiro.departing_at || ida.departing_at || "").slice(0, 10),
      dataVolta: String(primeiroVolta.departing_at || volta.departing_at || "").slice(0, 10),
      escalasIda: Math.max(0, segIda.length - 1),
      escalasVolta: Math.max(0, segVolta.length - 1),
      bagagem: bagagem,
      classe: "economica",
      preco: +oferta.total_amount,
      moeda: moeda,
      fonte: "Duffel",
      tipoPreco: oferta.live_mode === false ? "teste_api" : "ao_vivo",
      taxasInclusas: true,
      expiraEm: oferta.expires_at || null
    };
  };
  DuffelProvider.prototype._buscar = async function (p) {
    var origem = p.cidadeOrigem === "SAO" || p.cidadeOrigem === "RIO" ? p.cidadeOrigem : (p.aeroportosOrigem || [])[0];
    var body = { data: {
      slices: [
        { origin: origem, destination: p.aeroportoDestino, departure_date: p.dataIda },
        { origin: p.aeroportoDestino, destination: origem, departure_date: p.dataVolta }
      ],
      passengers: [{ type: "adult" }],
      cabin_class: this._classe(p.classe),
      max_connections: Math.max(0, Math.min(3, p.maxEscalas == null ? 1 : +p.maxEscalas))
    } };
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, this.timeoutMs);
    var resp;
    try {
      resp = await this.fetch(this.base + "/air/offer_requests?return_offers=true&supplier_timeout=" + this.supplierTimeoutMs, {
        method: "POST", signal: controller.signal,
        headers: { Authorization: "Bearer " + this.env.DUFFEL_ACCESS_TOKEN, Accept: "application/json", "Content-Type": "application/json", "Accept-Encoding": "gzip", "Duffel-Version": "v2" },
        body: JSON.stringify(body)
      });
    } finally { clearTimeout(timer); }
    var json = await resp.json().catch(function () { return {}; });
    if (!resp.ok) {
      var detalhe = json && json.errors && json.errors[0] && (json.errors[0].message || json.errors[0].title);
      throw new Error("Duffel HTTP " + resp.status + (detalhe ? ": " + detalhe : ""));
    }
    var ofertas = (json.data && json.data.offers) || [];
    var self = this;
    return ofertas.map(function (o) { return self._mapearOferta(o); }).filter(function (o) {
      return o && isFinite(o.preco) && o.preco > 0 && (p.aeroportosOrigem || []).indexOf(o.aeroportoOrigem) >= 0;
    });
  };
  DuffelProvider.prototype.searchIndicativePrices = async function (p) {
    var out = [], datas = this._datasAmostra(p);
    for (var i = 0; i < datas.length; i++) {
      var busca = Object.assign({}, p, datas[i]);
      var ofertas = await this._buscar(busca);
      this.cache[this._chave(busca)] = ofertas;
      ofertas.forEach(function (o) { out.push({ aeroportoOrigem: o.aeroportoOrigem, aeroportoDestino: o.aeroportoDestino, dataIda: o.dataIda, dataVolta: o.dataVolta, preco: o.preco, moeda: o.moeda }); });
    }
    return out;
  };
  DuffelProvider.prototype.searchLiveOffers = function (p) {
    var chave = this._chave(p);
    if (Object.prototype.hasOwnProperty.call(this.cache, chave)) return Promise.resolve(this.cache[chave]);
    return this._buscar(p);
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
      case "duffel": return new DuffelProvider(opcoes.env || {}, opcoes);
      case "skyscanner": return new SkyscannerProvider(opcoes.env || {});
      default: throw new Error("Provedor de tarifas desconhecido: " + nome);
    }
  }

  return { criarProvedor: criarProvedor, DemoProvider: DemoProvider, AmadeusProvider: AmadeusProvider, DuffelProvider: DuffelProvider, SkyscannerProvider: SkyscannerProvider, datas: { addDias: addDias, diffDias: diffDias, iso: iso } };
});
