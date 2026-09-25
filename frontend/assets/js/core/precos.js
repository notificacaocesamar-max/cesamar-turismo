/* ==========================================================================
   Motor de preços da Cesamar — o MESMO arquivo roda no navegador (painel/site)
   e no robô em Node (Cloud Run). Testes: tests/precos.test.js
   --------------------------------------------------------------------------
   Modos:
   - "acrescimo":      preço = custo × (1 + margem)
   - "margem_final":   preço = custo ÷ (1 − margem − taxas variáveis)
   Depois: garante a margem mínima em R$, aplica o custo financeiro no preço
   parcelado, arredonda SEMPRE para cima e calcula a parcela.
   Nunca devolve preço menor que o custo.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.Cesamar = root.Cesamar || {}).precos = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PADRAO = {
    modo: "acrescimo",          // "acrescimo" | "margem_final"
    margemPct: 10,              // %
    margemMinimaReais: 0,       // R$ mínimos de ganho por passageiro
    taxasVariaveisPct: 0,       // % (só no modo margem_final: gateway, impostos sobre a venda…)
    custoFinanceiroPct: 0,      // % acrescentado ao preço parcelado (taxa do cartão/antecipação)
    parcelas: 10,
    arredondamento: "inteiro",  // "nenhum" | "inteiro" | "dezena" | "centena" | "final_90"
    pixDescontoPct: 0,          // % de desconto sobre o preço base para pagamento via Pix
    jurosTexto: "",             // ex.: "sem juros" ou "juros de 1,99% a.m." — exibido quando preenchido
    entradaTexto: ""            // ex.: "entrada de 20%" — exibido quando preenchido
  };

  function num(v, nome) {
    var n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : v;
    if (typeof n !== "number" || !isFinite(n)) throw new Error("Valor inválido para " + nome + ": " + v);
    return n;
  }
  // Evita erros de ponto flutuante (ex.: 4300 * 1.1 = 4730.000000000001)
  function cent(v) { return Math.round(v * 100) / 100; }
  function tetoCentavos(v) { return Math.ceil(v * 100 - 1e-6) / 100; }

  function arredondar(valor, modo) {
    var v = cent(valor);
    switch (modo || "nenhum") {
      case "nenhum": return tetoCentavos(valor);
      case "inteiro": return Math.ceil(v - 1e-9);
      case "dezena": return Math.ceil(v / 10 - 1e-9) * 10;
      case "centena": return Math.ceil(v / 100 - 1e-9) * 100;
      case "final_90": { // próximo valor terminado em 9,90 (ex.: 4.730 → 4.739,90)
        var base = Math.floor(v / 10) * 10 + 9.9;
        if (base < v - 1e-9) base += 10;
        return cent(base);
      }
      default: throw new Error("Arredondamento desconhecido: " + modo);
    }
  }

  /** Junta a regra padrão com a regra específica do destino (campos vazios herdam do padrão). */
  function resolverRegra(regraPadrao, regraDestino) {
    var r = {}, k;
    for (k in PADRAO) r[k] = PADRAO[k];
    for (k in (regraPadrao || {})) if (regraPadrao[k] !== undefined && regraPadrao[k] !== null && regraPadrao[k] !== "") r[k] = regraPadrao[k];
    for (k in (regraDestino || {})) if (regraDestino[k] !== undefined && regraDestino[k] !== null && regraDestino[k] !== "") r[k] = regraDestino[k];
    return r;
  }

  function validarRegra(r) {
    var m = num(r.margemPct, "margemPct"), t = num(r.taxasVariaveisPct, "taxasVariaveisPct");
    if (m < 0) throw new Error("A margem não pode ser negativa.");
    if (num(r.margemMinimaReais, "margemMinimaReais") < 0) throw new Error("A margem mínima não pode ser negativa.");
    if (num(r.custoFinanceiroPct, "custoFinanceiroPct") < 0) throw new Error("O custo financeiro não pode ser negativo.");
    if (num(r.pixDescontoPct, "pixDescontoPct") < 0 || r.pixDescontoPct >= 100) throw new Error("Desconto Pix deve estar entre 0 e 99%.");
    var p = num(r.parcelas, "parcelas");
    if (p < 1 || p > 24 || Math.floor(p) !== p) throw new Error("Parcelas deve ser um número inteiro de 1 a 24.");
    if (r.modo === "margem_final" && m + t >= 100) throw new Error("No modo margem sobre o preço final, margem + taxas precisa ser menor que 100%.");
    if (r.modo !== "acrescimo" && r.modo !== "margem_final") throw new Error("Modo de margem desconhecido: " + r.modo);
  }

  /**
   * Calcula o preço anunciado a partir do custo da tarifa (por passageiro).
   * @returns {{custo, precoBase, precoPix, precoParcelado, parcelas, valorParcela, ganhoReais, ganhoPct, regra}}
   */
  function calcular(custo, regraPadrao, regraDestino) {
    var c = num(custo, "custo");
    if (c <= 0) throw new Error("O custo precisa ser maior que zero.");
    var r = resolverRegra(regraPadrao, regraDestino);
    validarRegra(r);
    var m = r.margemPct / 100, t = r.taxasVariaveisPct / 100;

    var base = r.modo === "margem_final" ? c / (1 - m - t) : c * (1 + m);
    if (base - c < r.margemMinimaReais) base = c + num(r.margemMinimaReais, "margemMinimaReais");
    base = cent(base);

    var parcelado = arredondar(base * (1 + r.custoFinanceiroPct / 100), r.arredondamento);
    var precoBase = arredondar(base, r.arredondamento);
    var pix = r.pixDescontoPct > 0 ? arredondar(base * (1 - r.pixDescontoPct / 100), r.arredondamento) : precoBase;
    if (pix < c) pix = tetoCentavos(c); // desconto nunca derruba o preço abaixo do custo

    var valorParcela = tetoCentavos(parcelado / r.parcelas);
    return {
      custo: cent(c),
      precoBase: precoBase,
      precoPix: pix,
      precoParcelado: parcelado,
      parcelas: r.parcelas,
      valorParcela: valorParcela,
      totalParcelado: cent(valorParcela * r.parcelas),
      ganhoReais: cent(precoBase - c),
      ganhoPct: cent((precoBase - c) / precoBase * 100),
      jurosTexto: r.jurosTexto || "",
      entradaTexto: r.entradaTexto || "",
      regra: r
    };
  }

  function brl(v, casas) {
    var c = casas == null ? (Math.round(v) === v ? 0 : 2) : casas;
    return "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c });
  }

  /** Texto padrão de preço: sempre mostra total + parcela (nunca só a parcela). */
  function textoPreco(p) {
    return "A partir de " + brl(p.precoParcelado) + " por pessoa ou " + p.parcelas + "x de " + brl(p.valorParcela);
  }

  return { PADRAO: PADRAO, calcular: calcular, arredondar: arredondar, resolverRegra: resolverRegra, brl: brl, textoPreco: textoPreco };
});
