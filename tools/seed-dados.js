/* Dados iniciais editáveis (depois ficam no painel / Supabase).
   Fotos reais têm fonte, autor e licença registrados abaixo. */
"use strict";

// ---------------------------------------------------------------- aeroportos
const aeroportos = [
  { iata: "GRU", nome: "Guarulhos", cidade: "São Paulo", cidadeGrupo: "SAO", pais: "Brasil", origem: true, ativo: true },
  { iata: "CGH", nome: "Congonhas", cidade: "São Paulo", cidadeGrupo: "SAO", pais: "Brasil", origem: true, ativo: true },
  { iata: "VCP", nome: "Viracopos (Campinas)", cidade: "São Paulo", cidadeGrupo: "SAO", pais: "Brasil", origem: true, ativo: true },
  { iata: "GIG", nome: "Galeão", cidade: "Rio de Janeiro", cidadeGrupo: "RIO", pais: "Brasil", origem: true, ativo: true },
  { iata: "SDU", nome: "Santos Dumont", cidade: "Rio de Janeiro", cidadeGrupo: "RIO", pais: "Brasil", origem: true, ativo: true },
];

// ---------------------------------------------------------------- destinos monitorados
// [id, sigla, país, cidade, IATA, nome do aeroporto, região, arte, campanhas]
const D = [
  ["italia", "ITA", "Itália", "Roma", "FCO", "Fiumicino", "Europa", "italia", ["romanticos", "cultura-aventura"]],
  ["portugal", "POR", "Portugal", "Lisboa", "LIS", "Humberto Delgado", "Europa", "lisboa", ["familia", "cultura-aventura"]],
  ["porto", "POR", "Portugal", "Porto", "OPO", "Francisco Sá Carneiro", "Europa", "lisboa", ["romanticos", "cultura-aventura"]],
  ["franca", "FRA", "França", "Paris", "CDG", "Charles de Gaulle", "Europa", "paris", ["romanticos", "cultura-aventura"]],
  ["espanha", "ESP", "Espanha", "Madri", "MAD", "Barajas", "Europa", "espanha", ["cultura-aventura", "familia"]],
  ["reino-unido", "UK", "Reino Unido", "Londres", "LHR", "Heathrow", "Europa", "londres", ["cultura-aventura", "familia"]],
  ["holanda", "HOL", "Holanda", "Amsterdã", "AMS", "Schiphol", "Europa", "holanda", ["cultura-aventura", "romanticos"]],
  ["alemanha", "ALE", "Alemanha", "Frankfurt", "FRA", "Frankfurt", "Europa", "alemanha", ["cultura-aventura"]],
  ["suica", "SUI", "Suíça", "Zurique", "ZRH", "Zurique", "Europa", "suica", ["romanticos", "cultura-aventura"]],
  ["grecia", "GRE", "Grécia", "Atenas", "ATH", "Eleftherios Venizelos", "Europa", "santorini", ["romanticos", "praias"]],
  ["turquia", "TUR", "Turquia", "Istambul", "IST", "Istambul", "Europa", "turquia", ["cultura-aventura"]],
  ["orlando", "ORL", "Estados Unidos", "Orlando", "MCO", "Orlando International", "América do Norte", "orlando", ["15-anos", "familia"]],
  ["canada", "CAN", "Canadá", "Toronto", "YYZ", "Pearson", "América do Norte", "canada", ["familia", "cultura-aventura"]],
  ["mexico", "MEX", "México", "Cancún", "CUN", "Cancún", "América Central", "cancun", ["praias", "romanticos", "familia"]],
  ["argentina", "ARG", "Argentina", "Bariloche", "BRC", "Teniente Luis Candelaria", "América do Sul", "patagonia", ["romanticos", "familia", "cultura-aventura"]],
  ["chile", "CHI", "Chile", "Santiago", "SCL", "Arturo Merino Benítez", "América do Sul", "chile", ["familia", "cultura-aventura"]],
  ["peru", "PER", "Peru", "Lima", "LIM", "Jorge Chávez", "América do Sul", "peru", ["cultura-aventura"]],
  ["japao", "JAP", "Japão", "Tóquio", "NRT", "Narita", "Ásia", "japao", ["cultura-aventura"]],
  ["dubai", "DXB", "Emirados Árabes", "Dubai", "DXB", "Dubai International", "Oriente Médio", "dubai", ["familia", "romanticos"]],
  ["egito", "EGI", "Egito", "Cairo", "CAI", "Cairo International", "África", "egito", ["cultura-aventura"]],
  ["africa-do-sul", "AFS", "África do Sul", "Cidade do Cabo", "CPT", "Cape Town International", "África", "africa-do-sul", ["praias", "cultura-aventura"]],
];
// artigo usado nas frases ("para a Itália", "para o Japão", "para Portugal")
const ARTIGO = { italia: "a", franca: "a", espanha: "a", "reino-unido": "o", holanda: "a", alemanha: "a", suica: "a", grecia: "a",
  turquia: "a", canada: "o", mexico: "o", argentina: "a", chile: "o", peru: "o", japao: "o", egito: "o", "africa-do-sul": "a" };
const EXIBICAO = { portugal: "Lisboa", porto: "Porto", orlando: "Orlando", dubai: "Dubai", argentina: "Bariloche" }; // destinos anunciados pela cidade
const destinos = D.map((x, i) => ({
  id: x[0], slug: x[0], sigla: x[1], nome: x[2], cidade: x[3], aeroporto: x[4], nomeAeroporto: x[5], regiao: x[6],
  arte: x[7], campanhas: x[8], ativo: true, ordem: i, artigo: ARTIGO[x[0]] || "", nomeExibicao: EXIBICAO[x[0]] || x[2],
}));
destinos.forEach((d) => aeroportos.push({ iata: d.aeroporto, nome: d.nomeAeroporto, cidade: d.cidade, cidadeGrupo: d.aeroporto, pais: d.nome, origem: false, ativo: true }));

// ---------------------------------------------------------------- campanhas (textos por público)
const campanhas = [
  { id: "15-anos", nome: "Aniversário de 15 anos", titulo: "Seus 15 anos em um lugar mágico",
    texto: "Que tal comemorar seus 15 anos em um dos destinos mais mágicos do mundo? Transforme essa data especial em uma lembrança inesquecível.", ativa: true, ordem: 3 },
  { id: "romanticos", nome: "Destinos românticos", titulo: "Para viver a dois",
    texto: "Que tal eternizar momentos ao lado do amor da sua vida? Viva uma experiência inesquecível em um destino feito para momentos a dois.", ativa: true, ordem: 1 },
  { id: "familia", nome: "Viagens em família", titulo: "Juntos é melhor",
    texto: "As melhores lembranças são aquelas que vivemos juntos. Prepare-se para uma viagem especial com toda a família.", ativa: true, ordem: 2 },
  { id: "praias", nome: "Praias", titulo: "Mar, sol e pé na areia",
    texto: "Águas claras, areia macia e dias que parecem não ter fim. Escolha o seu mar e deixe o resto com a gente.", ativa: true, ordem: 4 },
  { id: "cultura-aventura", nome: "Cultura e aventura", titulo: "Para quem quer descobrir",
    texto: "História, sabores e paisagens que mudam a forma de ver o mundo. Viagens para voltar com muita coisa para contar.", ativa: true, ordem: 5 },
];

// ---------------------------------------------------------------- conteúdo por destino (landing page)
const FAQ_PADRAO = [
  { p: "Este preço está garantido?", r: "Não. As tarifas aéreas mudam conforme a disponibilidade. O valor mostrado é o encontrado na data da pesquisa e é confirmado pelo consultor no momento da sua solicitação." },
  { p: "O que está incluído?", r: "Esta é uma oferta de passagem aérea de ida e volta para um adulto, em classe econômica. Hospedagem e outros serviços podem ser cotados à parte com o consultor." },
  { p: "Posso mudar as datas?", r: "Sim. Informe as datas que você prefere e o consultor procura a melhor combinação disponível — o valor pode ser diferente do anunciado." },
  { p: "Preciso de passaporte ou visto?", r: "As exigências de entrada mudam com frequência e dependem da sua nacionalidade. Nosso consultor confirma os documentos necessários antes da emissão." },
  { p: "Como funciona o parcelamento?", r: "O valor pode ser dividido no cartão, conforme as condições vigentes no dia da emissão. O consultor informa as opções, inclusive para pagamento via Pix." },
];
const C = {
  italia: ["Gastronomia, história e paisagens apaixonantes", "Gastronomia, história e paisagens apaixonantes. Descubra a Itália e crie memórias que acompanharão você para sempre. Roma é o ponto de partida perfeito: de lá, trens rápidos levam a Florença, Veneza e à Costa Amalfitana.", ["Roma, Florença e Veneza a poucas horas de trem entre si", "Uma das cozinhas mais amadas do planeta", "Primavera com clima agradável para caminhar pelas cidades", "Arte e arquitetura em cada esquina"]],
  portugal: ["Lisboa te espera de braços abertos", "Ladeiras, azulejos, pastéis de nata e o pôr do sol no Tejo. Portugal fala a nossa língua e recebe brasileiros como poucos lugares no mundo — perfeito para a primeira viagem à Europa.", ["Idioma em comum e muita afinidade cultural", "Porta de entrada fácil para o resto da Europa", "Gastronomia e vinhos com ótimo custo-benefício", "Praias do Algarve a poucas horas de Lisboa"]],
  porto: ["Porto: história, vinho e o Douro aos seus pés", "Casas coloridas na Ribeira, o brilho do Douro e as caves de vinho do Porto formam um cenário romântico e acolhedor. Uma cidade para caminhar sem pressa e brindar cada descoberta.", ["Ribeira e Ponte Dom Luís I", "Caves históricas de vinho do Porto", "Passeios pelo Vale do Douro", "Fácil combinação com Lisboa na mesma viagem"]],
  franca: ["Paris, para viver pelo menos uma vez", "Museus, cafés, jardins e a luz única do fim de tarde às margens do Sena. Paris combina romance, cultura e compras como poucas cidades conseguem.", ["Um dos destinos mais românticos do mundo", "Museus e monumentos que atravessam séculos", "Fácil conexão de trem com Londres, Bruxelas e o interior da França", "Primavera e outono com clima agradável"]],
  espanha: ["Madri: arte, tapas e noites que não terminam", "Museus de nível mundial, praças animadas e uma culinária que se come em pequenos pratos e grandes conversas. De Madri, trens rápidos levam a Barcelona, Sevilha e Toledo.", ["Museus do Prado e Reina Sofía", "Vida noturna e gastronomia vibrantes", "Trem rápido para Barcelona e Andaluzia", "Clima ensolarado boa parte do ano"]],
  "reino-unido": ["Londres: tradição com sotaque moderno", "Parques enormes, museus com entrada gratuita, musicais e um ritmo de metrópole que encanta todas as idades.", ["Muitos museus com entrada gratuita", "Musicais do West End", "Parques e bairros para explorar a pé", "Conexão de trem com Paris pelo Eurotúnel"]],
  holanda: ["Amsterdã entre canais e bicicletas", "Casas estreitas refletidas nos canais, museus de arte encantadores e campos de tulipas na primavera. Uma cidade para sentir sem pressa.", ["Canais que são Patrimônio Mundial", "Campos de tulipas na primavera", "Tudo pode ser feito a pé ou de bicicleta", "Base para conhecer Bélgica e Alemanha"]],
  alemanha: ["Alemanha de castelos, rios e cervejarias", "Frankfurt é a porta de entrada para cidades medievais, o Vale do Reno e a Rota Romântica. Tradição e eficiência na mesma viagem.", ["Vale do Reno e seus castelos", "Mercados de Natal no fim do ano", "Trens pontuais ligando todo o país", "Grande hub para conexões na Europa"]],
  suica: ["Suíça: montanhas de cartão-postal", "Lagos azuis, vilarejos nos Alpes e trens panorâmicos que parecem pintados à mão. Um destino feito para contemplar.", ["Alpes e lagos de tirar o fôlego", "Trens panorâmicos entre cidades", "Neve no inverno, trilhas no verão", "Chocolates e queijos famosos"]],
  grecia: ["Grécia: o azul que você sempre imaginou", "Casas brancas, cúpulas azuis, o mar Egeu e a história da Grécia antiga em Atenas. Um destino perfeito para viver a dois.", ["Pores do sol inesquecíveis nas ilhas", "Acrópole e sítios históricos", "Voos curtos de Atenas para as ilhas", "Culinária mediterrânea fresca e leve"]],
  turquia: ["Istambul, entre dois continentes", "Mesquitas, bazares perfumados e o Bósforo separando Europa e Ásia. Uma cidade intensa, acolhedora e cheia de contrastes.", ["Uma cidade entre Europa e Ásia", "Grande Bazar e mercados de especiarias", "Arquitetura bizantina e otomana", "Culinária rica e cheia de sabores"]],
  orlando: ["Orlando, onde a magia acontece", "Parques temáticos, compras e diversão para todas as idades. Um dos destinos mais mágicos do mundo para comemorar datas especiais em família ou com os amigos.", ["Parques temáticos para todas as idades", "Um dos destinos preferidos para festas de 15 anos", "Outlets e compras", "Clima quente boa parte do ano"]],
  canada: ["Canadá: natureza grandiosa e cidades acolhedoras", "Toronto é moderna, multicultural e fica a poucas horas das Cataratas do Niágara. Uma viagem que agrada de crianças a avós.", ["Cataratas do Niágara por perto", "Cidades seguras e organizadas", "Outono com folhas vermelhas e neve no inverno", "Multiculturalismo e ótima gastronomia"]],
  mexico: ["Cancún: Caribe de águas turquesa", "Mar em tons de azul, resorts pé na areia e cenotes escondidos na mata. Perfeito para casais, famílias e quem só quer descansar.", ["Mar do Caribe de águas claras", "Resorts para todos os estilos", "Cenotes e sítios arqueológicos maias", "Voos com poucas conexões a partir do Brasil"]],
  argentina: ["Bariloche: neve, lagos e montanhas", "No inverno, Bariloche combina paisagens cobertas de neve, estações de esqui, chocolates artesanais e o azul intenso dos lagos da Patagônia. Uma viagem para viver o frio de verdade.", ["Neve e esportes de inverno", "Cerro Catedral e paisagens da Cordilheira", "Chocolate artesanal e gastronomia patagônica", "Lagos e mirantes inesquecíveis"]],
  chile: ["Chile: Andes, vinhos e neve", "Santiago fica aos pés da Cordilheira: no inverno há estações de esqui a menos de duas horas, e no ano todo vinícolas encantadoras.", ["Neve no inverno perto da capital", "Rota de vinícolas no Vale do Maipo", "Voo curto e sem fuso horário grande", "Combina cidade e natureza"]],
  peru: ["Peru: história viva nos Andes", "De Lima, a capital gastronômica da América do Sul, até Cusco e Machu Picchu — uma viagem que mistura sabores, cultura e paisagens impressionantes.", ["Gastronomia premiada de Lima", "Cusco e Machu Picchu", "Cultura andina preservada", "Voo curto a partir do Brasil"]],
  japao: ["Japão: tradição e tecnologia em uma só viagem", "Tradição e tecnologia em uma só viagem. Descubra templos, sabores e cidades que parecem ter vindo do futuro — com a primavera das cerejeiras e o outono das folhas vermelhas como épocas mais disputadas.", ["Templos e jardins milenares", "Uma das gastronomias mais respeitadas do mundo", "Trens-bala entre as principais cidades", "Cerejeiras na primavera e cores no outono"]],
  dubai: ["Dubai: o extraordinário no meio do deserto", "Arranha-céus que tocam as nuvens, praias de água morna e o silêncio das dunas ao pôr do sol. Um destino surpreendente para famílias e casais.", ["Arquitetura impressionante", "Praias e resorts de alto padrão", "Deserto a poucos minutos da cidade", "Ótima parada para quem segue para a Ásia"]],
  egito: ["Egito: onde a história começou", "As Pirâmides de Gizé, o Nilo e templos milenares. Uma viagem para ver de perto o que só conhecíamos dos livros.", ["Pirâmides de Gizé e a Esfinge", "Cruzeiros pelo Nilo", "Templos de Luxor e Karnak", "Museus com tesouros milenares"]],
  "africa-do-sul": ["Cidade do Cabo: onde a montanha encontra o mar", "A Table Mountain, praias com pinguins, vinícolas históricas e safáris a poucas horas de voo. Uma das cidades mais bonitas do hemisfério sul.", ["Paisagens entre montanha e oceano", "Vinícolas de Stellenbosch e Franschhoek", "Possibilidade de combinar com safári", "Verão agradável de novembro a março"]],
};
const conteudos = destinos.map((d) => ({
  destinoId: d.id, tituloEmocional: C[d.id][0], texto: C[d.id][1], motivos: C[d.id][2], faq: FAQ_PADRAO,
}));

// ---------------------------------------------------------------- imagens
const imagens = [];
destinos.forEach((d) => {
  imagens.push({ id: "img-" + d.id + "-1", destinoId: d.id, url: "assets/img/destinos/" + d.arte + ".svg", alt: "Ilustração de " + d.cidade + ", " + d.nome, credito: "Ilustração demonstrativa Cesamar", principal: true, ordem: 1, demonstrativa: true });
  imagens.push({ id: "img-" + d.id + "-2", destinoId: d.id, url: "assets/img/galeria/" + d.arte + "-a.svg", alt: "Detalhe da ilustração de " + d.cidade, credito: "Ilustração demonstrativa Cesamar", principal: false, ordem: 2, demonstrativa: true });
  imagens.push({ id: "img-" + d.id + "-3", destinoId: d.id, url: "assets/img/galeria/" + d.arte + "-b.svg", alt: "Outro detalhe da ilustração de " + d.cidade, credito: "Ilustração demonstrativa Cesamar", principal: false, ordem: 3, demonstrativa: true });
});
imagens.unshift.apply(imagens, require("./fotos-biblioteca.js").imagens());

// Seleção editorial de fotos reais. `meses` permite combinar a imagem com a
// época da oferta; quando vazio, a foto pode ser usada o ano inteiro.
const fotosLicenciadas = [
  { id: "foto-lisboa-bonde", destinoId: "portugal", url: "assets/img/fotos/lisboa-bonde.jpg", alt: "Bonde amarelo percorrendo uma rua histórica de Lisboa", credito: "Foto: Denisa Lesniaková / Pexels", fonteUrl: "https://www.pexels.com/photo/yellow-tram-in-the-street-of-lisbon-15234185/", licenca: "Pexels License", licencaUrl: "https://www.pexels.com/license/", meses: [], principal: true, ordem: 0, demonstrativa: false },
  { id: "foto-porto-ribeira", destinoId: "porto", url: "assets/img/fotos/porto-ribeira.jpg", alt: "Ponte Dom Luís I e o casario da Ribeira às margens do Douro, no Porto", credito: "Foto: Fred C / Pexels", fonteUrl: "https://www.pexels.com/photo/dom-luis-i-bridge-over-douro-river-in-porto-30148222/", licenca: "Pexels License", licencaUrl: "https://www.pexels.com/license/", meses: [], principal: true, ordem: 0, demonstrativa: false },
  { id: "foto-argentina-neve", destinoId: "argentina", url: "assets/img/fotos/argentina-patagonia-lago-neve.jpg", alt: "Picos nevados refletidos em um lago na Patagônia argentina", credito: "Foto: Alessio Roversi / Unsplash", fonteUrl: "https://unsplash.com/photos/jagged-snow-capped-mountains-rise-above-a-clear-lake-MjUciQ6_tdg", licenca: "Unsplash License", licencaUrl: "https://unsplash.com/license", meses: [], principal: true, ordem: 0, demonstrativa: false, observacao: "Imagem principal da Argentina; não usar fotografias do Obelisco." },
  { id: "foto-argentina-patagonia", destinoId: "argentina", url: "assets/img/fotos/argentina-patagonia-neve.jpg", alt: "Montanhas cobertas de neve na Patagônia argentina", credito: "Foto licenciada via Pexels", fonteUrl: "https://www.pexels.com/photo/snowcapped-mountains-in-patagonia-in-argentina-21638496/", licenca: "Pexels License", licencaUrl: "https://www.pexels.com/license/", meses: [], principal: false, ordem: 1, demonstrativa: false, observacao: "Imagem alternativa da Argentina; não usar fotografias do Obelisco." },
  { id: "foto-japao-sakura-fuji", destinoId: "japao", url: "assets/img/fotos/japao-cerejeiras-fuji.jpg", alt: "Cerejeiras floridas com o Monte Fuji ao fundo, no Japão", credito: "Foto: Nicola Toscan / Pexels", fonteUrl: "https://www.pexels.com/photo/cherry-blossoms-with-mount-fuji-background-37183410/", licenca: "Pexels License", licencaUrl: "https://www.pexels.com/license/", meses: [3, 4], principal: true, ordem: 0, demonstrativa: false },
];
imagens.unshift.apply(imagens, fotosLicenciadas);

// ---------------------------------------------------------------- regras de monitoramento
// [destino, início, fim, duração mín, máx, máx escalas, exigir bagagem]
const R = [
  ["italia", "2027-05-01", "2027-05-31", 10, 16, 1, false], ["portugal", "2027-04-01", "2027-04-30", 8, 14, 1, false], ["porto", "2027-04-01", "2027-05-15", 8, 14, 1, false],
  ["franca", "2027-05-01", "2027-06-15", 8, 14, 1, false], ["espanha", "2027-04-15", "2027-05-31", 8, 14, 1, false],
  ["reino-unido", "2027-06-01", "2027-06-30", 8, 14, 1, false], ["holanda", "2027-04-01", "2027-04-30", 8, 12, 1, false],
  ["alemanha", "2026-11-25", "2026-12-15", 8, 14, 1, false], ["suica", "2027-01-15", "2027-02-28", 8, 14, 1, false],
  ["grecia", "2027-06-01", "2027-07-15", 10, 16, 2, false], ["turquia", "2027-04-01", "2027-05-15", 8, 14, 1, false],
  ["orlando", "2027-01-10", "2027-02-15", 8, 14, 1, true], ["canada", "2027-09-15", "2027-10-31", 8, 14, 1, false],
  ["mexico", "2027-03-01", "2027-04-15", 6, 10, 1, false], ["argentina", "2027-07-01", "2027-08-20", 5, 8, 1, true],
  ["chile", "2027-07-01", "2027-08-15", 5, 8, 0, true], ["peru", "2027-05-01", "2027-06-30", 7, 12, 1, false],
  ["japao", "2027-03-20", "2027-04-20", 12, 18, 2, true], ["dubai", "2027-11-01", "2027-12-10", 7, 12, 1, false],
  ["egito", "2027-10-15", "2027-11-30", 9, 14, 2, false], ["africa-do-sul", "2027-10-01", "2027-11-15", 9, 14, 2, false],
];
const regras = R.map((r) => ({
  id: "reg-" + r[0], destinoId: r[0], ativo: true, origens: ["SAO", "RIO"], periodoInicio: r[1], periodoFim: r[2],
  duracaoMin: r[3], duracaoMax: r[4], maxEscalas: r[5], exigirBagagem: r[6], adultos: 1, classe: "economica", combinacoes: 3,
}));

// ---------------------------------------------------------------- regras de preço
const precos = [
  { id: "preco-padrao", destinoId: null, modo: "acrescimo", margemPct: 10, margemMinimaReais: 250, taxasVariaveisPct: 0, custoFinanceiroPct: 0, parcelas: 10, arredondamento: "inteiro", pixDescontoPct: 0, jurosTexto: "", entradaTexto: "" },
  { id: "preco-japao", destinoId: "japao", margemPct: 8 },
  { id: "preco-argentina", destinoId: "argentina", margemMinimaReais: 200, parcelas: 6 },
];

// ---------------------------------------------------------------- consultores e configuração
const consultores = [
  { id: "cons-central", nome: "Central Cesamar", whatsapp: "5521993939181", ativo: true, observacao: "Número do site atual — confirmar" },
];
const config = {
  whatsappNumero: "5521993939181",
  whatsappMensagem: "Olá! Vi a oferta {codigo} para {destino}, saindo de {origem}, a partir de {preco} ou {parcelas}x de {parcela}. Quero confirmar a disponibilidade e conhecer as condições.",
  whatsappMensagemGeral: "Olá! Vim pelo site da Cesamar e quero falar com um consultor sobre uma viagem.",
  chamadaPadrao: "Preço encontrado na última pesquisa do robô. Tarifas podem mudar a qualquer momento.",
  avisoPreco: "Valor por pessoa, sujeito a alteração e disponibilidade no momento da solicitação. Consulte datas, taxas, bagagem, formas de pagamento e demais condições.",
  parcelamento: {
    titulo: "Viajar ficou mais fácil",
    texto: "Planeje sua viagem com antecedência e aproveite a possibilidade de pagamento em até 10 vezes. Converse com um consultor para conhecer as condições disponíveis.",
    condicoes: "",
  },
  validadeOfertaDias: 7,
  antecedenciaMinimaDias: 15,
  robo: { horario: "06:00", provedor: "demo", simularFalhaEm: [] },
  adminSenhaDemo: "cesamar2026",
};

module.exports = { aeroportos, destinos, campanhas, conteudos, imagens, regras, precos, consultores, config };
