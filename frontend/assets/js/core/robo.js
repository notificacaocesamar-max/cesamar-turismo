/* ==========================================================================
   Robô de ofertas da Cesamar — roda 1x por dia (Cloud Scheduler → Cloud Run)
   e também pelo painel offline ("Executar robô agora").
   Fluxo por regra de monitoramento (destino + período):
    1. preços indicativos do período          6. margem da agência
    2. melhores datas                          7. parcelamento
    3. preços ao vivo (até 3 combinações)      8. salvar pesquisa e histórico
    4. comparar São Paulo × Rio de Janeiro     9. preparar anúncio p/ aprovação
    5. escolher a opção válida mais barata    10. atualizar/expirar ofertas antigas
   Nenhuma oferta é publicada automaticamente.
   O robô trabalha sobre um objeto `db` em memória; quem chama decide onde salvar
   (localStorage no painel offline, arquivo JSON ou Supabase no servidor).
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./precos.js"), require("./provedores.js"));
  else (root.Cesamar = root.Cesamar || {}).robo = factory(root.Cesamar.precos, root.Cesamar.provedores);
})(typeof self !== "undefined" ? self : this, function (Precos, Prov) {
  "use strict";

  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var NOME_CIDADE = { SAO: "São Paulo", RIO: "Rio de Janeiro" };

  function uid(p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function agoraISO(agora) { return (agora || new Date()).toISOString(); }
  function hojeISO(agora) { return agoraISO(agora).slice(0, 10); }

  /** Código amigável da oferta: ITA-0527 (sigla do destino + mês/ano da ida). */
  function gerarCodigo(destino, dataIda, existentes) {
    var base = (destino.sigla || destino.slug.slice(0, 3)).toUpperCase() + "-" + dataIda.slice(5, 7) + dataIda.slice(2, 4);
    var cod = base, n = 1;
    while (existentes.some(function (o) { return o.codigo === cod; })) { n++; cod = base + "-" + n; }
    return cod;
  }

  function textosPadrao(destino, cidade, dataIda, config) {
    var m = +dataIda.slice(5, 7), a = dataIda.slice(0, 4);
    return {
      titulo: (destino.nomeExibicao || destino.nome) + " em " + MESES[m - 1] + " de " + a,
      subtitulo: "Ida e volta saindo " + (cidade === "RIO" ? "do " : "de ") + NOME_CIDADE[cidade],
      chamada: (config && config.chamadaPadrao) || "Vai ficar fora dessa? Acione agora um dos nossos consultores."
    };
  }

  function valida(o, regra) {
    if (Math.max(o.escalasIda, o.escalasVolta) > regra.maxEscalas) return "escalas acima do máximo";
    if (regra.exigirBagagem && !o.bagagem) return "sem bagagem despachada";
    return null;
  }

  /**
   * Executa o robô.
   * @param {object} db      coleções: destinos, aeroportos, regras, precos (PricingRule), ofertas, pesquisas, logs, config
   * @param {object} opcoes  { provedor, agora: Date, somenteRegraId }
   * @returns {Promise<object>} resumo da execução
   */
  function executar(db, opcoes) {
    opcoes = opcoes || {};
    var agora = opcoes.agora || new Date();
    var provedor = opcoes.provedor;
    var execId = uid("EXE");
    var resumo = { execucaoId: execId, inicio: agoraISO(agora), fim: null, provedor: provedor.nome, regras: 0, novas: 0, atualizadas: 0, semAlteracao: 0, expiradas: 0, erros: 0 };
    var log = function (nivel, etapa, msg, destinoId) {
      db.logs.unshift({ id: uid("LOG"), execucaoId: execId, nivel: nivel, etapa: etapa, mensagem: msg, destinoId: destinoId || null, criadoEm: agoraISO(new Date()) });
      if (nivel === "erro") resumo.erros++;
    };
    var cfg = db.config || {};
    var regraPadrao = (db.precos || []).filter(function (r) { return !r.destinoId; })[0] || {};
    var aeroportosPorCidade = {};
    db.aeroportos.filter(function (a) { return a.origem && a.ativo !== false; }).forEach(function (a) {
      (aeroportosPorCidade[a.cidadeGrupo] = aeroportosPorCidade[a.cidadeGrupo] || []).push(a.iata);
    });

    log("info", "inicio", "Execução iniciada com o provedor '" + provedor.nome + "'.");
    var regras = db.regras.filter(function (r) { return r.ativo && (!opcoes.somenteRegraId || r.id === opcoes.somenteRegraId); });
    resumo.regras = regras.length;

    var fila = Promise.resolve();
    regras.forEach(function (regra) {
      fila = fila.then(function () { return processarRegra(regra); });
    });

    function processarRegra(regra) {
      var destino = db.destinos.filter(function (x) { return x.id === regra.destinoId; })[0];
      if (!destino || destino.ativo === false) { log("aviso", "regra", "Regra " + regra.id + " ignorada: destino inativo ou inexistente."); return Promise.resolve(); }
      var hoje = hojeISO(agora);
      var de = regra.periodoInicio < hoje ? hoje : regra.periodoInicio;
      if (de > regra.periodoFim) { log("aviso", "regra", "Período já encerrado para " + destino.nome + ".", destino.id); return Promise.resolve(); }
      var cidades = regra.origens && regra.origens.length ? regra.origens : ["SAO", "RIO"];
      var porCidade = {};

      var passos = cidades.map(function (cidade) {
        var aeroportos = aeroportosPorCidade[cidade] || [];
        var base = { cidadeOrigem: cidade, aeroportosOrigem: aeroportos, aeroportoDestino: destino.aeroporto, adultos: 1, classe: regra.classe || "economica" };
        // 1. indicativos
        return provedor.searchIndicativePrices(Object.assign({}, base, { de: de, ate: regra.periodoFim, duracaoMin: regra.duracaoMin, duracaoMax: regra.duracaoMax }))
          .then(function (ind) {
            db.pesquisas.unshift({ id: uid("PES"), execucaoId: execId, regraId: regra.id, destinoId: destino.id, cidadeOrigem: cidade, tipo: "indicativa", resultados: ind.length, melhorPreco: ind.length ? Math.min.apply(null, ind.map(function (x) { return x.preco; })) : null, criadoEm: agoraISO(agora) });
            if (!ind.length) { log("aviso", "indicativos", "Nenhum preço indicativo " + cidade + " → " + destino.aeroporto + ".", destino.id); return []; }
            // 2. melhores datas (combinações distintas de ida/volta)
            ind.sort(function (a, b) { return a.preco - b.preco; });
            var escolhidas = [], vistos = {};
            for (var i = 0; i < ind.length && escolhidas.length < (regra.combinacoes || 3); i++) {
              var k = ind[i].dataIda + ind[i].dataVolta;
              if (!vistos[k]) { vistos[k] = 1; escolhidas.push(ind[i]); }
            }
            // 3. preços ao vivo
            return Promise.all(escolhidas.map(function (c) {
              return provedor.searchLiveOffers(Object.assign({}, base, { dataIda: c.dataIda, dataVolta: c.dataVolta }));
            })).then(function (listas) {
              var todas = [].concat.apply([], listas);
              db.pesquisas.unshift({ id: uid("PES"), execucaoId: execId, regraId: regra.id, destinoId: destino.id, cidadeOrigem: cidade, tipo: "ao_vivo", resultados: todas.length, melhorPreco: todas.length ? Math.min.apply(null, todas.map(function (x) { return x.preco; })) : null, criadoEm: agoraISO(agora) });
              var validas = todas.filter(function (o) { return !valida(o, regra); });
              if (!validas.length) log("aviso", "ao_vivo", "Nenhuma opção válida saindo de " + NOME_CIDADE[cidade] + " (filtros de escala/bagagem).", destino.id);
              validas.sort(function (a, b) { return a.preco - b.preco; });
              porCidade[cidade] = validas[0] || null;
            });
          })
          .catch(function (e) { log("erro", "provedor", destino.nome + " / " + NOME_CIDADE[cidade] + ": " + e.message, destino.id); });
      });

      return Promise.all(passos).then(function () {
        // 4 e 5. comparar SP × RJ e escolher a mais barata
        var melhor = null;
        Object.keys(porCidade).forEach(function (c) { var o = porCidade[c]; if (o && (!melhor || o.preco < melhor.o.preco)) melhor = { cidade: c, o: o }; });
        if (!melhor) { log("aviso", "comparacao", "Sem oferta válida para " + destino.nome + " nesta execução.", destino.id); return; }
        var comp = Object.keys(porCidade).map(function (c) { return NOME_CIDADE[c] + ": " + (porCidade[c] ? Precos.brl(porCidade[c].preco) + " (" + porCidade[c].aeroportoOrigem + ")" : "—"); }).join(" | ");
        log("info", "comparacao", destino.nome + " → " + comp + " → escolhida " + NOME_CIDADE[melhor.cidade] + ".", destino.id);

        // 6 e 7. preço anunciado e parcelamento
        var regraDestino = (db.precos || []).filter(function (r) { return r.destinoId === destino.id; })[0];
        var preco;
        try { preco = Precos.calcular(melhor.o.preco, regraPadrao, regraDestino); }
        catch (e) { log("erro", "preco", destino.nome + ": " + e.message, destino.id); return; }
        delete preco.regra;

        // 8, 9 e 10. salvar / preparar anúncio
        salvarOferta(destino, regra, melhor.cidade, melhor.o, preco);
      });
    }

    function salvarOferta(destino, regra, cidade, o, preco) {
      var agoraS = agoraISO(agora);
      var hist = { data: agoraS, custo: o.preco, precoAnunciado: preco.precoParcelado, companhia: o.companhia, dataIda: o.dataIda, dataVolta: o.dataVolta, cidadeOrigem: cidade };
      var dados = {
        cidadeOrigem: cidade, aeroportoOrigem: o.aeroportoOrigem, aeroportoDestino: o.aeroportoDestino,
        dataIda: o.dataIda, dataVolta: o.dataVolta, companhia: o.companhia, escalasIda: o.escalasIda, escalasVolta: o.escalasVolta,
        classe: o.classe, bagagem: o.bagagem, custoOriginal: o.preco, moeda: o.moeda, preco: preco,
        tipoPreco: o.tipoPreco || "ao_vivo", fonte: o.fonte || provedor.nome, idProvedor: o.idProvedor, pesquisadoEm: agoraS
      };
      // mesma regra = mesma oferta (atualiza em vez de duplicar)
      var existente = db.ofertas.filter(function (x) { return x.regraId === regra.id && ["expirado", "rejeitado"].indexOf(x.status) < 0; })[0];
      if (existente) {
        existente.historico = existente.historico || [];
        existente.historico.unshift(hist);
        var mudou = existente.custoOriginal !== o.preco || existente.dataIda !== o.dataIda || existente.cidadeOrigem !== cidade;
        if (!mudou) { existente.pesquisadoEm = agoraS; resumo.semAlteracao++; return; }
        if (existente.status === "publicado" || existente.status === "pausado") {
          existente.atualizacaoPendente = dados; // publicada continua no ar até alguém aprovar o novo preço
          log("info", "anuncio", existente.codigo + ": nova cotação aguardando aprovação (" + Precos.brl(preco.precoParcelado) + ").", destino.id);
        } else {
          Object.assign(existente, dados);
          if (existente.textosAuto) Object.assign(existente, textosPadrao(destino, cidade, o.dataIda, cfg));
          existente.status = "aguardando_aprovacao";
        }
        existente.atualizadoEm = agoraS;
        resumo.atualizadas++;
        return;
      }
      var textos = textosPadrao(destino, cidade, o.dataIda, cfg);
      var nova = Object.assign({
        id: uid("OFE"), codigo: gerarCodigo(destino, o.dataIda, db.ofertas), regraId: regra.id, destinoId: destino.id,
        status: "aguardando_aprovacao", campanhaId: (destino.campanhas || [])[0] || null,
        titulo: textos.titulo, subtitulo: textos.subtitulo, chamada: textos.chamada, textosAuto: true,
        criadoEm: agoraS, atualizadoEm: agoraS, publicadoEm: null, historico: [hist], cliques: 0, visualizacoes: 0
      }, dados);
      db.ofertas.unshift(nova);
      resumo.novas++;
      log("info", "anuncio", nova.codigo + " preparada para aprovação: " + Precos.textoPreco(preco) + ".", destino.id);
    }

    return fila.then(function () {
      // 10. expirar ofertas antigas
      var hoje = hojeISO(agora), validade = cfg.validadeOfertaDias || 7, antecedencia = cfg.antecedenciaMinimaDias || 15;
      var limiteIda = Prov.datas.addDias(hoje, antecedencia);
      db.ofertas.forEach(function (o) {
        if (["expirado", "rejeitado"].indexOf(o.status) >= 0) return;
        var velha = Prov.datas.diffDias(o.pesquisadoEm.slice(0, 10), hoje) > validade;
        var embarquePerto = o.dataIda < limiteIda;
        if (velha || embarquePerto) {
          o.status = "expirado"; o.atualizadoEm = agoraISO(agora); resumo.expiradas++;
          log("info", "expiracao", o.codigo + " expirada (" + (embarquePerto ? "embarque em menos de " + antecedencia + " dias" : "pesquisa com mais de " + validade + " dias") + ").", o.destinoId);
        }
      });
      resumo.fim = agoraISO(new Date());
      db.execucoes = db.execucoes || [];
      db.execucoes.unshift(resumo);
      log("info", "fim", "Execução concluída: " + resumo.novas + " novas, " + resumo.atualizadas + " atualizadas, " + resumo.expiradas + " expiradas, " + resumo.erros + " erros.");
      return resumo;
    });
  }

  /** Aplica uma cotação pendente a uma oferta publicada (ação humana no painel). */
  function aplicarAtualizacao(oferta, destino, config) {
    if (!oferta.atualizacaoPendente) return false;
    Object.assign(oferta, oferta.atualizacaoPendente);
    delete oferta.atualizacaoPendente;
    if (oferta.textosAuto && destino) Object.assign(oferta, textosPadrao(destino, oferta.cidadeOrigem, oferta.dataIda, config));
    oferta.atualizadoEm = new Date().toISOString();
    return true;
  }

  return { executar: executar, gerarCodigo: gerarCodigo, textosPadrao: textosPadrao, aplicarAtualizacao: aplicarAtualizacao, NOME_CIDADE: NOME_CIDADE, MESES: MESES };
});
