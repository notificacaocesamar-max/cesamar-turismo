/* Biblioteca permanente de fotografias reais licenciadas.
   Cada destino tem pelo menos 5 arquivos locais. A página original e a licença
   ficam registradas para auditoria; o site nunca depende da URL remota. */
"use strict";

const LICENCA = "https://www.pexels.com/license/";
const catalogo = {
  italia: { ponto: "Coliseu, Roma", ids: [15562413, 18030958, 36398115, 32472809, 20392466] },
  portugal: { ponto: "Lisboa e seus monumentos", ids: [20350963, 35453213, 19295195, 38825914, 25695856] },
  porto: { ponto: "Ribeira e Rio Douro, Porto", ids: [24879031, 36935876, 36935877, 20105730, 20230667] },
  franca: { ponto: "Torre Eiffel, Paris", ids: [30379456, 17938396, 32424965, 929313, 30690159] },
  espanha: { ponto: "Palácio Real, Madri", ids: [21855187, 20877001, 16499032, 26780297, 35398273] },
  "reino-unido": { ponto: "Big Ben e Westminster, Londres", ids: [17379169, 16230702, 39473887, 10851173, 28684164] },
  holanda: { ponto: "Canais de Amsterdã", ids: [38340539, 38327085, 38354520, 17959985, 38354667] },
  alemanha: { ponto: "Skyline de Frankfurt", ids: [30475302, 12323353, 12742508, 417120, 25524357] },
  suica: { ponto: "Lago de Zurique e Alpes Suíços", ids: [32138888, 28484880, 20103003, 28711176, 16449741] },
  grecia: { ponto: "Acrópole de Atenas", ids: [36825391, 14749814, 30312498, 14446404, 36050702] },
  turquia: { ponto: "Bósforo e Santa Sofia, Istambul", ids: [9327611, 17036268, 28601269, 11463926, 9327536] },
  orlando: { ponto: "Lake Eola e skyline de Orlando", ids: [11988945, 20486251, 11669048, 15526516, 14474187] },
  canada: { ponto: "CN Tower e skyline de Toronto", ids: [25696388, 19878015, 29422607, 27375689, 26855042] },
  mexico: { ponto: "Praias de Cancún", ids: [8437275, 1802255, 5960710, 3651084, 29152364] },
  argentina: { ponto: "Obelisco e arquitetura de Buenos Aires", ids: [38148844, 13265635, 33112756, 38148849, 1392732] },
  chile: { ponto: "Santiago e Cordilheira dos Andes", ids: [37309391, 33606787, 26840727, 30342880, 36143071] },
  peru: { ponto: "Machu Picchu, Peru", ids: [37885473, 16973650, 15449571, 33799523, 7343987] },
  japao: { ponto: "Monte Fuji e templos japoneses", ids: [31385052, 1494077, 4336279, 33341991, 28163625] },
  dubai: { ponto: "Burj Khalifa e skyline de Dubai", ids: [36260020, 36813102, 12748748, 19180974, 37842374] },
  egito: { ponto: "Pirâmides de Gizé, Cairo", ids: [31133003, 34852221, 34812111, 10928747, 9824463] },
  "africa-do-sul": { ponto: "Table Mountain, Cidade do Cabo", ids: [36597753, 8470660, 8470657, 37833044, 2327285] },
};

function arquivo(destinoId, indice) { return "assets/img/biblioteca/" + destinoId + "/" + String(indice + 1).padStart(2, "0") + ".jpg"; }
function pagina(id) { return "https://www.pexels.com/photo/" + id + "/"; }
function download(id) { return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=1600"; }

function imagens() {
  const out = [];
  Object.keys(catalogo).forEach((destinoId) => {
    const item = catalogo[destinoId];
    item.ids.forEach((id, indice) => out.push({
      id: "biblioteca-" + destinoId + "-" + (indice + 1), destinoId,
      url: arquivo(destinoId, indice), alt: item.ponto + " — fotografia " + (indice + 1),
      credito: "Foto licenciada via Pexels", fonteUrl: pagina(id),
      licenca: "Pexels License", licencaUrl: LICENCA, meses: [],
      principal: indice === 0, ordem: 10 + indice, demonstrativa: false,
      pexelsId: id, pontoTuristico: item.ponto,
    }));
  });
  return out;
}

module.exports = { catalogo, imagens, arquivo, pagina, download, LICENCA };
