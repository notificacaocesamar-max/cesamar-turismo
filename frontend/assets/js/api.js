/* Camada de dados: tenta a API .NET; se não responder, usa o catálogo local (data.js).
   Assim o site funciona 100% offline (abrindo o index.html com duplo clique). */
(function () {
  "use strict";
  var CFG = window.CESAMAR_CONFIG || {};
  var LOCAL = window.CESAMAR_DATA || { destinos: [], pacotes: [], cruzeiros: [], servicos: [] };
  var OFFLINE_KEY = "cesamar.leads.offline";
  var apiStatus = null; // null = não testado, true/false

  function timeoutFetch(url, opts, ms) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || CFG.apiTimeoutMs || 1800);
    opts = opts || {};
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).finally(function () { clearTimeout(t); });
  }

  function get(path) {
    if (apiStatus === false || !CFG.apiBase) return Promise.reject(new Error("api-off"));
    return timeoutFetch(CFG.apiBase + path, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); apiStatus = true; return r.json(); })
      .catch(function (e) { if (apiStatus !== true) apiStatus = false; throw e; });
  }

  // Um único teste de saúde antes das consultas evita várias tentativas quando a API está desligada
  var ready = null;
  function ping() {
    if (!ready) ready = (!CFG.apiBase ? Promise.resolve(false) : timeoutFetch(CFG.apiBase + "/health", {}, 1200)
      .then(function (r) { apiStatus = r.ok; return r.ok; }).catch(function () { apiStatus = false; return false; }));
    return ready;
  }
  function withFallback(path, localValue) {
    return ping().then(function (ok) { return ok ? get(path).catch(function () { return localValue; }) : localValue; });
  }

  function readOffline() { try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]"); } catch (e) { return []; } }
  function writeOffline(list) { try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(list)); } catch (e) { /* modo privado */ } }

  window.CesamarAPI = {
    status: function () { return apiStatus; },
    destinos: function () { return withFallback("/destinos", LOCAL.destinos); },
    pacotes: function () { return withFallback("/pacotes", LOCAL.pacotes); },
    pacote: function (slug) {
      var local = LOCAL.pacotes.filter(function (p) { return p.slug === slug; })[0] || null;
      return ping().then(function (ok) { return ok ? get("/pacotes/" + encodeURIComponent(slug)).catch(function () { return local; }) : local; });
    },
    cruzeiros: function () { return withFallback("/cruzeiros", LOCAL.cruzeiros); },
    servicos: function () { return Promise.resolve(LOCAL.servicos); },

    /* Envia lead. Resolve com {via:"api"} ou {via:"offline"} — nunca perde o contato. */
    enviarLead: function (lead) {
      lead.origemPagina = location.pathname.split("/").pop() || "index.html";
      lead.criadoEm = new Date().toISOString();
      if (!CFG.apiBase) return Promise.resolve(salvarOffline(lead));
      return timeoutFetch(CFG.apiBase + "/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      }, 4000).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (b) { var e = new Error(b.erro || ("HTTP " + r.status)); e.validation = r.status === 400; throw e; });
        apiStatus = true;
        return r.json().then(function (b) { return { via: "api", id: b.id }; });
      }).catch(function (e) {
        if (e.validation) throw e;
        return salvarOffline(lead);
      });
    },
    leadsOffline: readOffline,
    limparLeadsOffline: function () { writeOffline([]); }
  };

  function salvarOffline(lead) {
    var list = readOffline();
    lead.id = "local-" + Date.now();
    lead.status = "NOVO";
    list.unshift(lead);
    writeOffline(list);
    return { via: "offline", id: lead.id };
  }
})();
