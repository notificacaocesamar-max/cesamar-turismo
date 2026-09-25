"""Fonte única do catálogo de exemplo (destinos, pacotes, cruzeiros).
Gera frontend/assets/js/data.js e database/02-seed.sql.
Todos os preços são ILUSTRATIVOS (protótipo)."""
import json

DESTINOS = [
  # ---------- Nacional ----------
  dict(slug="fernando-de-noronha", nome="Fernando de Noronha", local="Pernambuco", tipo="nacional", regiao="Nordeste",
       temas=["praia","natureza","lua-de-mel"], epoca="Ago a jan",
       chamada="Mar cristalino e natureza protegida",
       descricao="Arquipélago de águas transparentes, trilhas com mirantes e mergulho entre tartarugas e golfinhos. Um destino de visitação controlada, ideal para quem busca natureza preservada."),
  dict(slug="gramado", nome="Gramado e Canela", local="Rio Grande do Sul", tipo="nacional", regiao="Sul",
       temas=["serra","gastronomia","familia"], epoca="Jun a ago · Natal Luz",
       chamada="Serra Gaúcha, fondue e clima de montanha",
       descricao="Charme europeu na serra: chocolaterias, vinícolas próximas, parques e o clima frio que faz do inverno a estação mais procurada."),
  dict(slug="jericoacoara", nome="Jericoacoara", local="Ceará", tipo="nacional", regiao="Nordeste",
       temas=["praia","aventura"], epoca="Jul a dez · temporada de ventos",
       chamada="Dunas, lagoas e o pôr do sol mais famoso do Ceará",
       descricao="Vila de ruas de areia, lagoas de água doce, kitesurf e a famosa Pedra Furada."),
  dict(slug="bonito", nome="Bonito", local="Mato Grosso do Sul", tipo="nacional", regiao="Centro-Oeste",
       temas=["natureza","aventura","familia"], epoca="Ano todo",
       chamada="Rios transparentes e ecoturismo de referência",
       descricao="Flutuação em rios cristalinos, grutas, cachoeiras e atrativos com visitação controlada — referência mundial em ecoturismo."),
  dict(slug="lencois-maranhenses", nome="Lençóis Maranhenses", local="Maranhão", tipo="nacional", regiao="Nordeste",
       temas=["natureza","aventura"], epoca="Jun a set · lagoas cheias",
       chamada="Um deserto de dunas brancas e lagoas azuis",
       descricao="Parque nacional com dunas a perder de vista e lagoas de chuva que formam uma paisagem única no mundo."),
  # ---------- Internacional ----------
  dict(slug="paris", nome="Paris", local="França", tipo="internacional", regiao="Europa",
       temas=["cidade","cultura","lua-de-mel"], epoca="Abr a jun · set a out",
       chamada="Arte, gastronomia e a luz da Cidade Luz",
       descricao="Museus, cafés, as margens do Sena e bairros cheios de personalidade. Combina muito bem com o interior da França ou outras capitais europeias."),
  dict(slug="santorini", nome="Santorini e Atenas", local="Grécia", tipo="internacional", regiao="Europa",
       temas=["praia","lua-de-mel","cultura"], epoca="Mai a out",
       chamada="Casas brancas, cúpulas azuis e o Egeu",
       descricao="Vilas penduradas na caldeira, pores do sol inesquecíveis e a história da Grécia antiga em Atenas."),
  dict(slug="japao", nome="Japão", local="Tóquio · Kyoto · Osaka", tipo="internacional", regiao="Ásia",
       temas=["cultura","cidade","gastronomia"], epoca="Mar a abr · out a nov",
       chamada="Tradição milenar e futuro na mesma viagem",
       descricao="Templos, jardins, trens-bala e uma gastronomia inesquecível. Primavera das cerejeiras e outono das folhas vermelhas são as épocas mais disputadas."),
  dict(slug="nova-york", nome="Nova York", local="Estados Unidos", tipo="internacional", regiao="América do Norte",
       temas=["cidade","compras","cultura"], epoca="Abr a jun · set a dez",
       chamada="A cidade que nunca para",
       descricao="Broadway, museus, parques, compras e bairros para explorar a pé. Dezembro tem o clima de fim de ano mais famoso do mundo."),
  dict(slug="lisboa", nome="Lisboa e Porto", local="Portugal", tipo="internacional", regiao="Europa",
       temas=["cidade","gastronomia","cultura"], epoca="Mar a out",
       chamada="Bondes, miradouros e vinho do Porto",
       descricao="Ladeiras, azulejos, pastéis de nata e o Douro. Um destino acolhedor, no nosso idioma, que agrada a todas as idades."),
  dict(slug="patagonia", nome="Patagônia", local="Argentina", tipo="internacional", regiao="América do Sul",
       temas=["natureza","aventura","neve"], epoca="Nov a mar",
       chamada="Geleiras, montanhas e o fim do mundo",
       descricao="El Calafate e o Glaciar Perito Moreno, trilhas em El Chaltén e a navegação pelo Canal de Beagle em Ushuaia."),
  dict(slug="maldivas", nome="Maldivas", local="Oceano Índico", tipo="internacional", regiao="Ásia",
       temas=["praia","lua-de-mel","luxo"], epoca="Dez a abr",
       chamada="Bangalôs sobre a água e lagoas turquesa",
       descricao="Resorts em ilhas particulares, recifes de coral e privacidade total — o destino clássico de lua de mel."),
  dict(slug="cancun", nome="Cancún e Riviera Maya", local="México", tipo="internacional", regiao="Caribe",
       temas=["praia","familia","cultura"], epoca="Dez a abr",
       chamada="Caribe mexicano e sítios arqueológicos maias",
       descricao="Resorts all inclusive, cenotes, parques temáticos e ruínas maias à beira-mar em Tulum."),
  dict(slug="egito", nome="Egito", local="Cairo · Luxor · Nilo", tipo="internacional", regiao="África",
       temas=["cultura","historia"], epoca="Out a abr",
       chamada="Pirâmides, templos e um cruzeiro pelo Nilo",
       descricao="As pirâmides de Gizé, o Vale dos Reis e a navegação pelo Nilo entre Luxor e Aswan."),
]

def P(slug, titulo, destino, tipo, noites, preco, tags, resumo, hospedagem, destaque=False, saida="Rio de Janeiro (GIG)", extra_inclui=None):
    """Pacote = passagem aérea de ida e volta + hotel. Sem passeios, ingressos ou guias."""
    inclui = ["Passagem aérea de ida e volta"] + (extra_inclui or []) + [f"{h[1]} noites em {h[0]} — {h[2]}" for h in hospedagem]
    return dict(slug=slug, titulo=titulo, destino=destino, tipo=tipo, noites=noites, precoAPartir=preco,
                tags=tags, resumo=resumo, inclui=inclui, naoInclui=BASE_NAO,
                hospedagem=[dict(cidade=h[0], noites=h[1], hotel=h[2]) for h in hospedagem],
                destaque=destaque, saida=saida)

BASE_NAO = ["Passeios, ingressos e serviços de guia", "Refeições além do café da manhã", "Seguro viagem (cotado à parte)", "Taxas locais cobradas no destino"]

PACOTES = [
  P("noronha-essencial", "Noronha: passagem + pousada", "fernando-de-noronha", "nacional", 5, 7490, ["praia","natureza"],
    "Passagem de ida e volta e cinco noites em pousada selecionada, com café da manhã.",
    [("Fernando de Noronha", 5, "pousada com café da manhã")], destaque=True),
  P("gramado-inverno", "Gramado: passagem + hotel", "gramado", "nacional", 4, 3290, ["serra","familia"],
    "Passagem até Porto Alegre e quatro noites em hotel no centro de Gramado.",
    [("Gramado", 4, "hotel com café da manhã")]),
  P("paris-romantico", "Paris: passagem + hotel boutique", "paris", "internacional", 7, 13900, ["lua-de-mel","cidade"],
    "Passagem de ida e volta e sete noites em hotel boutique bem localizado.",
    [("Paris", 7, "hotel boutique com café da manhã")], destaque=True),
  P("japao-sakura", "Japão: passagem + hotéis em Tóquio e Kyoto", "japao", "internacional", 12, 22900, ["cultura","cidade"],
    "Passagem de ida e volta e hospedagem em Tóquio e Kyoto na temporada das cerejeiras.",
    [("Tóquio", 6, "hotel 4★ com café da manhã"), ("Kyoto", 6, "hotel 4★ com café da manhã")], destaque=True),
  P("grecia-classica", "Atenas e Santorini: passagem + hotéis", "santorini", "internacional", 8, 15700, ["praia","lua-de-mel"],
    "Passagem de ida e volta, voo Atenas–Santorini e oito noites de hotel.",
    [("Atenas", 3, "hotel com café da manhã"), ("Santorini", 5, "hotel com vista para a caldeira")], extra_inclui=["Voo Atenas–Santorini"]),
  P("nova-york-classica", "Nova York: passagem + hotel", "nova-york", "internacional", 6, 10400, ["cidade","compras"],
    "Passagem de ida e volta e seis noites em hotel em Midtown.",
    [("Nova York", 6, "hotel em Midtown")]),
  P("patagonia-fim-do-mundo", "Patagônia: passagem + hotéis", "patagonia", "internacional", 8, 11900, ["natureza","aventura"],
    "Passagem de ida e volta, voos internos e hotéis em El Calafate e Ushuaia.",
    [("El Calafate", 4, "hotel com café da manhã"), ("Ushuaia", 4, "hotel com café da manhã")], extra_inclui=["Voos internos Buenos Aires–El Calafate–Ushuaia"]),
  P("maldivas-lua-de-mel", "Maldivas: passagem + bangalô", "maldivas", "internacional", 7, 32500, ["lua-de-mel","luxo","praia"],
    "Passagem de ida e volta e sete noites em bangalô sobre a água com meia pensão.",
    [("Maldivas", 7, "bangalô sobre a água com meia pensão")], destaque=True, extra_inclui=["Traslado aeroporto–resort (hidroavião)"]),
  P("lisboa-porto", "Lisboa e Porto: passagem + hotéis", "lisboa", "internacional", 8, 9800, ["cidade","gastronomia"],
    "Passagem de ida e volta, trem Lisboa–Porto e oito noites de hotel.",
    [("Lisboa", 4, "hotel com café da manhã"), ("Porto", 4, "hotel com café da manhã")], extra_inclui=["Trem Lisboa–Porto"]),
]

CRUZEIROS = [
  dict(slug="mediterraneo", nome="Mediterrâneo", arte="cruzeiro-mediterraneo", noites=7, precoAPartir=7900,
       temporada="Abr a out", portos=["Barcelona","Marselha","Gênova","Roma (Civitavecchia)","Nápoles","Palma de Mallorca"],
       resumo="Seis países em uma semana: Espanha, França e Itália com a cabine como seu hotel."),
  dict(slug="caribe", nome="Caribe", arte="cruzeiro-caribe", noites=7, precoAPartir=6400,
       temporada="Ano todo", portos=["Miami","Nassau","Cozumel","Roatán","Costa Maya"],
       resumo="Ilhas de areia branca, mergulho em recifes e dias de sol a bordo."),
  dict(slug="costa-brasileira", nome="Costa Brasileira", arte="cruzeiro-brasil", noites=5, precoAPartir=3200,
       temporada="Nov a abr", portos=["Rio de Janeiro","Búzios","Ilhabela","Balneário Camboriú","Santos"],
       resumo="Sem passaporte e com saída do Rio: a temporada de verão no litoral brasileiro."),
  dict(slug="fiordes-noruega", nome="Fiordes da Noruega", arte="cruzeiro-fiordes", noites=7, precoAPartir=11200,
       temporada="Mai a set", portos=["Copenhague","Stavanger","Geiranger","Hellesylt","Bergen"],
       resumo="Paredões verdes, cachoeiras e vilarejos à beira dos fiordes sob o sol da meia-noite."),
]

SERVICOS = [
  dict(slug="aereo", nome="Passagens aéreas", icone="plane", texto="Emissão nacional e internacional, com busca das melhores conexões, tarifas e assentos."),
  dict(slug="hospedagem", nome="Hotéis e resorts", icone="bed", texto="Da pousada charmosa ao resort all inclusive, com parceiros que conhecemos de perto."),
  dict(slug="cruzeiros", nome="Cruzeiros", icone="ship", texto="Mais de 50 rotas pelo mundo, com orientação sobre navio, cabine e itinerário."),
  dict(slug="combinados", nome="Passagem + hotel", icone="map", texto="Combinamos a passagem de ida e volta com o hotel certo para as suas datas e o seu orçamento."),
  dict(slug="lua-de-mel", nome="Lua de mel", icone="heart", texto="Destinos românticos, experiências a dois e cada detalhe pensado para o casal."),
  dict(slug="consultoria", nome="Consultoria de viagem", icone="compass", texto="Documentação, vistos, melhor época e dicas de quem já esteve lá."),
  dict(slug="assistencia", nome="Assistência 24 horas", icone="shield", texto="Suporte contínuo durante toda a viagem, a qualquer hora do dia."),
]

MESES = {
  "fernando-de-noronha":[8,9,10,11,12,1], "gramado":[6,7,8,11,12,1], "jericoacoara":[7,8,9,10,11,12],
  "bonito":list(range(1,13)), "lencois-maranhenses":[6,7,8,9], "paris":[4,5,6,9,10], "santorini":[5,6,7,8,9,10],
  "japao":[3,4,10,11], "nova-york":[4,5,6,9,10,11,12], "lisboa":[3,4,5,6,7,8,9,10], "patagonia":[11,12,1,2,3],
  "maldivas":[12,1,2,3,4], "cancun":[12,1,2,3,4], "egito":[10,11,12,1,2,3,4],
}
for _d in DESTINOS: _d["meses"] = MESES[_d["slug"]]

EXTRA = {
  "noronha-essencial":   dict(badge="Mais vendido", precoDe=None),
  "gramado-inverno":     dict(badge="Família", precoDe=3690),
  "paris-romantico":     dict(badge="Lua de mel", precoDe=None),
  "japao-sakura":        dict(badge="Temporada 2027", precoDe=None),
  "grecia-classica":     dict(badge="Novo", precoDe=16900),
  "nova-york-classica":  dict(badge=None, precoDe=None),
  "patagonia-fim-do-mundo": dict(badge="Novo", precoDe=None),
  "maldivas-lua-de-mel": dict(badge="Premium", precoDe=None),
  "lisboa-porto":        dict(badge="Mais vendido", precoDe=10900),
}
for _p in PACOTES:
    _p.update(EXTRA.get(_p["slug"], {}))
    _p["parcelas"] = 10

def js():
    data = dict(destinos=DESTINOS, pacotes=PACOTES,
                cruzeiros=CRUZEIROS, servicos=SERVICOS)
    return ("/* Catálogo de exemplo — gerado por tools/catalog.py. Preços ILUSTRATIVOS.\n"
            "   Usado quando a API (backend) não está rodando. */\n"
            "window.CESAMAR_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")

def q(s): return "'" + str(s).replace("'", "''") + "'"
def jb(o): return q(json.dumps(o, ensure_ascii=False)) + "::jsonb"
def arr(a): return "ARRAY[" + ",".join(q(x) for x in a) + "]::text[]" if a else "ARRAY[]::text[]"

def iarr(a): return "'{" + ",".join(map(str, a)) + "}'::int[]"

def sql():
    out = ["-- Seed de exemplo gerado por tools/catalog.py — preços ILUSTRATIVOS", "BEGIN;"]
    for i, d in enumerate(DESTINOS):
        out.append(f"INSERT INTO destinos (slug,nome,local,tipo,regiao,temas,meses,epoca,chamada,descricao,ordem) VALUES "
                   f"({q(d['slug'])},{q(d['nome'])},{q(d['local'])},{q(d['tipo'])},{q(d['regiao'])},{arr(d['temas'])},{iarr(d['meses'])},{q(d['epoca'])},{q(d['chamada'])},{q(d['descricao'])},{i}) ON CONFLICT (slug) DO NOTHING;")
    for i, p in enumerate(PACOTES):
        rot = p["hospedagem"]  # coluna 'roteiro' do backend legado recebe a hospedagem
        out.append(f"INSERT INTO pacotes (slug,titulo,destino_slug,tipo,noites,preco_a_partir,preco_de,badge,parcelas,tags,resumo,inclui,nao_inclui,roteiro,destaque,saida,ordem) VALUES "
                   f"({q(p['slug'])},{q(p['titulo'])},{q(p['destino'])},{q(p['tipo'])},{p['noites']},{p['precoAPartir']},{p['precoDe'] or 'NULL'},{q(p['badge']) if p['badge'] else 'NULL'},{p['parcelas']},{arr(p['tags'])},{q(p['resumo'])},{jb(p['inclui'])},{jb(p['naoInclui'])},{jb(rot)},{'true' if p['destaque'] else 'false'},{q(p['saida'])},{i}) ON CONFLICT (slug) DO NOTHING;")
    for i, c in enumerate(CRUZEIROS):
        out.append(f"INSERT INTO cruzeiros (slug,nome,arte,noites,preco_a_partir,temporada,portos,resumo,ordem) VALUES "
                   f"({q(c['slug'])},{q(c['nome'])},{q(c['arte'])},{c['noites']},{c['precoAPartir']},{q(c['temporada'])},{arr(c['portos'])},{q(c['resumo'])},{i}) ON CONFLICT (slug) DO NOTHING;")
    out.append("COMMIT;")
    return "\n".join(out) + "\n"

if __name__ == "__main__":
    import sys, os
    root = sys.argv[1]
    open(os.path.join(root, "frontend/assets/js/data.js"), "w", encoding="utf-8").write(js())
    os.makedirs(os.path.join(root, "database"), exist_ok=True)
    open(os.path.join(root, "database/02-seed.sql"), "w", encoding="utf-8").write(sql())
    print("ok", len(DESTINOS), len(PACOTES), len(CRUZEIROS))
