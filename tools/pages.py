"""ATENÇÃO: sobrescreve frontend/pages/*.html. Use só para recriar do zero.
Gera as páginas internas (frontend/pages/*.html). Depois de geradas, podem ser editadas à mão."""
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'pages')
os.makedirs(OUT, exist_ok=True)
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>'

def page(slug, title, desc, body, hero=True):
    return f'''<!DOCTYPE html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · Cesamar Turismo</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#111436">
<link rel="stylesheet" href="../assets/css/site.css">
</head>
<body class="{'has-hero' if hero else ''}" data-page="{slug}" data-root="../">
<div id="site-header"></div>
<main id="conteudo">
{body}
</main>
<div id="site-footer"></div>
<script src="../assets/js/config.js"></script>
<script src="../assets/js/data.js"></script>
<script src="../assets/js/seed.js"></script>
<script src="../assets/js/core/precos.js"></script>
<script src="../assets/js/core/store.js"></script>
<script src="../assets/js/api.js"></script>
<script src="../assets/js/components.js"></script>
<script src="../assets/js/app.js"></script>
<script src="../assets/js/ofertas.js"></script>
</body>
</html>
'''

def phero(img, crumb, eyebrow, h1, lead, extra=''):
    return f'''<section class="page-hero on-dark">
  <img class="bg" src="../assets/img/destinos/{img}.svg" alt="">
  <div class="wrap">
    <nav class="crumbs" aria-label="Você está em"><a href="../index.html">Início</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>
    <span class="eyebrow">{eyebrow}</span>
    <h1 id="titulo-{crumb.lower().replace(' ', '-')}">{h1}</h1>
    <p class="lead">{lead}</p>{extra}
  </div>
</section>'''

def lead_form(fid, origem, titulo='Continuar no WhatsApp', dark=True, cols=True):
    """Formulário de atendimento: monta a mensagem e abre o WhatsApp. Não grava dados pessoais."""
    return f'''<form class="form" id="{fid}" data-wa-form="{origem}" novalidate>
  <div class="field full"><label for="{fid}-dest">Para onde você quer ir?</label><select id="{fid}-dest" name="destino"></select></div>
  <div class="field"><label for="{fid}-mes">Quando</label><select id="{fid}-mes" name="mes"></select></div>
  <div class="field"><label for="{fid}-pes">Viajantes</label><select id="{fid}-pes" name="pessoas"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option value="6 ou mais">6 ou mais</option></select></div>
  <div class="field"><label for="{fid}-origem">Saindo de</label><select id="{fid}-origem" name="origem"><option>São Paulo ou Rio de Janeiro</option><option>São Paulo</option><option>Rio de Janeiro</option></select></div>
  <div class="field"><label for="{fid}-orc">Orçamento por pessoa</label><select id="{fid}-orc" name="orcamento"><option value="">Prefiro não dizer</option><option>Até R$ 5 mil</option><option>R$ 5 a 10 mil</option><option>R$ 10 a 20 mil</option><option>Acima de R$ 20 mil</option></select></div>
  <div class="field full"><label for="{fid}-msg">Algo mais? (opcional)</label><textarea id="{fid}-msg" name="mensagem" placeholder="Ocasião especial, hotel, datas flexíveis…"></textarea></div>
  <button class="btn btn--wa full" type="submit">{titulo}</button>
  <p class="consent full">Sua mensagem é aberta no WhatsApp para você enviar. Este site não guarda seus dados pessoais.</p>
</form>'''

FEEL = '''<section class="section" aria-labelledby="t-sens">
  <div class="wrap">
    <div class="feel reveal" id="sensacoes">
      <div class="feel-head">
        <div><span class="eyebrow">Ainda em dúvida?</span><h2 id="t-sens" style="margin:0">Como você quer se <em class="a">sentir</em>?</h2></div>
        <label class="feel-when"><span class="muted" style="font-size:.9rem">Quando pretende ir?</span><select aria-label="Mês da viagem"></select></label>
      </div>
      <div class="feel-grid" role="group" aria-label="Escolha uma sensação"></div>
      <div class="feel-results" aria-live="polite"></div>
      <p class="feel-note"></p>
    </div>
  </div>
</section>'''

pages = {}

# ------------------------------------------------------------------ DESTINOS
pages['destinos'] = page('destinos', 'Destinos', 'Destinos nacionais e internacionais selecionados pelos consultores da Cesamar Turismo.',
phero('santorini', 'Destinos', 'Destinos', 'Para onde vamos <em class="a">desta vez</em>?', 'Vinte destinos internacionais monitorados todos os dias a partir de São Paulo e do Rio de Janeiro — e opções de passagem + hotel no Brasil.') + f'''
<section class="section" style="padding-top:56px">
  <div class="wrap">
    <div class="toolbar">
      <div class="chips" id="filtro-destinos" role="group" aria-label="Filtrar destinos"></div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
        <label class="search-in">{SEARCH}<input id="busca-destinos" type="search" placeholder="Buscar destino" aria-label="Buscar destino"></label>
        <span class="result-count" id="count-destinos"></span>
      </div>
    </div>
    <div class="grid grid--4" id="grid-destinos"></div>
  </div>
</section>''')

# ------------------------------------------------------------------ PACOTES
pages['pacotes'] = page('pacotes', 'Passagem + hotel', 'Pacotes de passagem aérea de ida e volta com hotel, nacionais e internacionais. Atendimento de consultor pelo WhatsApp.',
phero('japao', 'Pacotes', 'Passagem + hotel', 'Passagem e hotel, <em class="a">em uma só</em> conversa', 'Combinações de passagem aérea de ida e volta com hospedagem. Filtre por estilo, época e orçamento — e ajuste datas e hotel com um consultor.') + f'''
<section class="section" style="padding-top:56px">
  <div class="wrap listing">
    <form class="filters" id="filtros" aria-label="Filtros" onsubmit="return false">
      <button type="button" class="btn btn--ghost btn--sm close-filters">Fechar ✕</button>
      <h4>Buscar</h4>
      <label class="search-in">{SEARCH}<input name="q" type="search" placeholder="Destino, cidade, tema" aria-label="Buscar"></label>
      <h4>Destino</h4>
      <label class="opt"><input type="checkbox" name="tipo" value="nacional"> Brasil</label>
      <label class="opt"><input type="checkbox" name="tipo" value="internacional"> Internacional</label>
      <h4>Região</h4><div id="f-regiao"></div>
      <h4>Estilo de viagem</h4><div id="f-estilo"></div>
      <h4>Duração</h4>
      <label class="opt"><input type="radio" name="duracao" value="" checked> Qualquer</label>
      <label class="opt"><input type="radio" name="duracao" value="curta"> Até 5 noites</label>
      <label class="opt"><input type="radio" name="duracao" value="media"> 6 a 9 noites</label>
      <label class="opt"><input type="radio" name="duracao" value="longa"> 10 noites ou mais</label>
      <h4>Preço por pessoa</h4>
      <input type="range" name="preco" aria-label="Preço máximo"><div class="range-val" id="preco-val"></div>
      <h4>Mês da viagem</h4>
      <select name="mes" style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--line-strong)"></select>
      <h4>Lista</h4>
      <label class="opt"><input type="checkbox" name="favoritos"> Só meus favoritos ♥</label>
      <button type="button" class="btn btn--ghost btn--sm btn--block" id="limpar" style="margin-top:20px">Limpar filtros</button>
    </form>
    <div>
      <div class="list-top">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <button type="button" class="btn btn--ink btn--sm filters-toggle">Filtros</button>
          <strong id="count-pacotes"></strong>
          <div class="active-filters" id="ativos"></div>
        </div>
        <label><span class="sr-only">Ordenar</span><select id="ordem"><option value="rel">Mais procurados</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="duracao">Menor duração</option></select></label>
      </div>
      <div class="grid" id="grid-pacotes" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))"></div>
    </div>
  </div>
</section>''')

# ------------------------------------------------------------------ PACOTE (detalhe)
pages['pacote'] = page('pacote', 'Passagem + hotel', 'Passagem aérea de ida e volta com hotel: o que inclui e valores.', '<div id="pacote"><section class="pkg-hero"><div class="wrap"><p>Carregando…</p></div></section></div>')

# ------------------------------------------------------------------ CRUZEIROS
pages['cruzeiros'] = page('cruzeiros', 'Cruzeiros', 'Cruzeiros pelo Mediterrâneo, Caribe, fiordes da Noruega e costa brasileira com saída do Rio.',
phero('cruzeiro-fiordes', 'Cruzeiros', 'Cruzeiros', 'Mais de 50 rotas. <em class="a">Um só</em> check-in.', 'Desfaça a mala uma vez e acorde em um porto diferente a cada dia. Ajudamos a escolher navio, cabine e itinerário — e cuidamos do aéreo até o embarque.') + f'''
<section class="section" style="padding-top:60px">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Itinerários em destaque</span><h2>Escolha o seu <em class="a">mar</em></h2></div></div>
    <div class="grid" id="lista-cruzeiros" style="gap:28px"></div>
  </div>
</section>
<section class="section section--paper">
  <div class="wrap split" style="align-items:start">
    <div>
      <span class="eyebrow">Dúvidas frequentes</span>
      <h2>Primeira vez em um <em class="a">cruzeiro</em>?</h2>
      <p class="lead">Separamos as perguntas que mais ouvimos no balcão da agência.</p>
      <div data-sig-divider></div>
    </div>
    <div class="faq">
      <details open><summary>O que está incluído no valor do cruzeiro?</summary><p>Em geral: cabine, refeições nos restaurantes principais, entretenimento a bordo e a maior parte das áreas de lazer. Bebidas, taxas portuárias e gorjetas costumam ser à parte — detalhamos tudo na proposta.</p></details>
      <details><summary>Preciso de passaporte?</summary><p>Na temporada pela costa brasileira, basta RG. Para itinerários internacionais é necessário passaporte e, dependendo dos países, visto. Orientamos sobre a documentação de cada itinerário.</p></details>
      <details><summary>Qual cabine escolher?</summary><p>Interna, externa, com varanda ou suíte: a escolha muda a experiência e o preço. Nossos consultores indicam a melhor relação custo-benefício para o seu perfil.</p></details>
      <details><summary>Vocês cuidam do aéreo até o porto?</summary><p>Sim. Montamos o pacote completo: voo, hotel pré ou pós-cruzeiro, traslados e seguro viagem.</p></details>
    </div>
  </div>
</section>
<section class="section" id="cotar">
  <div class="wrap">
    <div class="cta-box on-dark reveal">
      <div><span class="eyebrow">Cotação sem compromisso</span><h2>Vamos encontrar o <em class="a">seu</em> navio.</h2><p class="lead">Diga o itinerário e o mês. Respondemos com as melhores opções de navio e cabine.</p><ul class="contact-list" data-contatos></ul></div>
      {lead_form('cotar-form', 'cruzeiros', 'Cotar pelo WhatsApp')}
    </div>
  </div>
</section>''')

# ------------------------------------------------------------------ SERVIÇOS
pages['servicos'] = page('servicos', 'Serviços', 'Passagens aéreas, hotéis, cruzeiros, passagem + hotel, lua de mel, consultoria e assistência 24h.',
phero('paris', 'Serviços', 'Serviços', 'Tudo o que a sua viagem <em class="a">precisa</em>', 'Da passagem ao hotel e ao seguro viagem: uma agência completa, com uma pessoa de verdade cuidando de cada detalhe.') + '''
<section class="section" style="padding-top:60px">
  <div class="wrap">
    <div class="grid grid--3" id="grid-servicos"></div>
  </div>
</section>
<section class="section section--ink on-dark">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Como funciona</span><h2>Do primeiro café ao <em class="a">desembarque</em></h2></div><a class="btn btn--wa" data-wa href="#">Começar agora</a></div>
    <div class="steps">
      <div class="step reveal"><h3>A conversa</h3><p>Presencial na Rio Branco, por telefone ou WhatsApp. Entendemos o que você quer viver.</p></div>
      <div class="step reveal"><h3>A proposta</h3><p>Você recebe as opções de voo e hotel, com valores e condições transparentes.</p></div>
      <div class="step reveal"><h3>Os ajustes</h3><p>Trocamos o que for preciso até ficar do seu jeito. Depois, emitimos tudo.</p></div>
      <div class="step reveal"><h3>A viagem</h3><p>Documentos em mãos e suporte 24h durante toda a viagem.</p></div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap split" style="align-items:start">
    <div><span class="eyebrow">Perguntas frequentes</span><h2>Antes de <em class="a">fechar</em></h2><p class="lead">Se a sua dúvida não estiver aqui, é só chamar.</p><a class="btn btn--wa" data-wa href="#">Perguntar no WhatsApp</a></div>
    <div class="faq">
      <details open><summary>Posso parcelar a viagem?</summary><p>Sim. Trabalhamos com parcelamento no cartão e condições especiais conforme o fornecedor. As condições de cada pacote aparecem na proposta.</p></details>
      <details><summary>Vocês ajudam com passaporte e visto?</summary><p>Orientamos sobre toda a documentação necessária para o destino, prazos e exigências de entrada.</p></details>
      <details><summary>E se meu voo atrasar ou for cancelado?</summary><p>Nossa assistência 24h entra em ação para remarcar, reacomodar e orientar você durante toda a viagem.</p></details>
      <details><summary>Atendem grupos e empresas?</summary><p>Sim. Montamos viagens para famílias, grupos de amigos, formaturas e eventos corporativos.</p></details>
    </div>
  </div>
</section>''')

# ------------------------------------------------------------------ QUEM SOMOS
pages['quem-somos'] = page('quem-somos', 'Quem somos', 'Há mais de 30 anos a Cesamar Turismo leva clientes a experiências inesquecíveis. Conheça a agência.',
phero('rio-de-janeiro', 'Quem somos', 'Quem somos', 'Mais de 30 anos <em class="a">levando você</em> mais longe', 'Uma agência carioca, no coração do Centro do Rio, que acredita que viajar bem começa por uma boa conversa.') + '''
<section class="section">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Nossa história</span>
      <h2>Reconhecida entre as <em class="a">melhores</em> agências do país</h2>
      <p class="lead">Reconhecida como uma das melhores agências de viagens do país, a Cesamar Turismo possui mais de 30 anos de atividade levando clientes a experiências inesquecíveis.</p>
      <p class="muted">Temos credenciamentos nacionais e internacionais, consultores especializados e oferecemos suporte contínuo durante toda a viagem — do primeiro contato ao retorno para casa.</p>
      <div class="stats"><div class="stat"><b data-count="30" data-suffix="+">30+</b><span>anos de estrada</span></div><div class="stat"><b data-count="50" data-suffix="+">50+</b><span>rotas de cruzeiro</span></div><div class="stat"><b>24h</b><span>de assistência</span></div></div>
    </div>
    <div class="frame-wrap reveal">
      <div class="frame"><img src="../assets/img/destinos/lisboa.svg" alt=""></div>
      <div class="frame-stamp" aria-hidden="true"><svg class="stamp-svg" viewBox="0 0 140 140"><defs><path id="circ2" d="M70 70 m-52 0 a52 52 0 1 1 104 0 a52 52 0 1 1 -104 0"/></defs><text font-size="9.6" fill="#111436" font-family="Poppins, sans-serif" font-weight="500"><textPath href="#circ2" textLength="320" lengthAdjust="spacing">CESAMAR · VIAGENS E TURISMO · RIO DE JANEIRO · </textPath></text></svg><span class="stamp-mark" data-stamp-mark></span></div>
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Nossos valores</span><h2>O que não <em class="a">abrimos mão</em></h2></div></div>
    <div class="why">
      <div class="reveal"><span class="n">01</span><h3>Gente antes de sistema</h3><p>Um consultor que conhece você e acompanha a viagem inteira.</p></div>
      <div class="reveal"><span class="n">02</span><h3>Transparência</h3><p>O que está incluso, o que não está e quanto custa — antes de você fechar.</p></div>
      <div class="reveal"><span class="n">03</span><h3>Presença</h3><p>Suporte 24 horas, em qualquer fuso horário, até o seu retorno.</p></div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head"><div><span class="eyebrow">Credenciais</span><h2>Agência <em class="a">regularizada</em></h2><p class="lead">Viaje com a segurança de uma empresa registrada nos órgãos oficiais de turismo.</p></div></div>
    <div class="creds" data-creds></div>
  </div>
</section>
<section class="section section--paper">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Visite a agência</span>
      <h2>Um café no <em class="a">Centro do Rio</em></h2>
      <p class="lead">Estamos na Av. Rio Branco, a poucos passos do metrô Largo da Carioca e do VLT. Venha conversar pessoalmente com um consultor.</p>
      <ul class="contact-list" data-contatos style="color:var(--text)"></ul>
    </div>
    <div data-map></div>
  </div>
</section>''')

# ------------------------------------------------------------------ CONTATO
pages['contato'] = page('contato', 'Contato', 'Fale com um consultor da Cesamar Turismo: WhatsApp, telefone, e-mail ou visite a agência na Av. Rio Branco, Centro do Rio.',
phero('maldivas', 'Contato', 'Contato', 'Vamos planejar a sua <em class="a">próxima</em> viagem?', 'Conte o que você imagina. Um consultor responde pelo WhatsApp com uma proposta personalizada, sem compromisso.') + f'''
<section class="section" style="padding-top:60px">
  <div class="wrap">
    <div class="cta-box on-dark">
      <div><span class="eyebrow">Canais de atendimento</span><h2>Como prefere <em class="a">conversar</em>?</h2><p class="lead">Respondemos pelo canal que for mais confortável para você.</p><ul class="contact-list" data-contatos></ul></div>
      {lead_form('contato-form', 'contato', 'Continuar no WhatsApp')}
    </div>
  </div>
</section>
<section class="section section--paper">
  <div class="wrap split">
    <div data-map></div>
    <div>
      <span class="eyebrow">Onde estamos</span>
      <h2>Av. Rio Branco, 39 <em class="a">· Sala 803</em></h2>
      <p class="lead">Centro, Rio de Janeiro — RJ. Próximo à Praça Mauá, ao VLT e às estações de metrô do Centro.</p>
      <div class="creds" data-creds style="margin-top:24px"></div>
    </div>
  </div>
</section>''')

# ------------------------------------------------------------------ OFERTAS (listagem)
pages['ofertas'] = page('ofertas', 'Ofertas de passagens', 'Ofertas de passagens aéreas internacionais de ida e volta saindo de São Paulo e do Rio de Janeiro, selecionadas por consultores da Cesamar.',
phero('italia', 'Ofertas', 'Ofertas de passagem aérea', 'Oportunidades de ida e volta <em class="a">selecionadas</em>', 'O robô pesquisa todos os dias ofertas saindo de São Paulo e do Rio de Janeiro. Quando encontra um preço melhor, atualiza o portal automaticamente; cada oportunidade permanece por até três dias.') + f'''
<section class="section" style="padding-top:48px">
  <div class="wrap">
    <form class="of-filters" id="filtros-ofertas" aria-label="Filtrar ofertas" onsubmit="return false">
      <select name="categoria" aria-label="Categoria"></select>
      <select name="destino" aria-label="Destino"></select>
      <select name="origem" aria-label="Saindo de"><option value="">São Paulo ou Rio</option><option value="SAO">São Paulo</option><option value="RIO">Rio de Janeiro</option></select>
      <select name="regiao" aria-label="Região"></select>
      <select name="mes" aria-label="Mês da ida"></select>
      <select name="ordem" aria-label="Ordenar"><option value="preco">Menor preço</option><option value="data">Data de ida</option><option value="recentes">Pesquisa mais recente</option></select>
      <button type="button" class="btn btn--ghost btn--sm" id="limpar-ofertas">Limpar</button>
    </form>
    <p class="of-intro" id="intro-categoria" hidden></p>
    <p class="result-count" id="count-ofertas" style="margin:0 0 18px"></p>
    <div class="grid-ads" id="grid-ofertas"></div>
  </div>
</section>
<section class="section section--tight"><div class="wrap" id="bloco-parcelamento"></div></section>''')

# ------------------------------------------------------------------ OFERTA (landing page)
pages['oferta'] = page('oferta', 'Oferta de passagem', 'Oferta de passagem aérea de ida e volta selecionada pela Cesamar Turismo.', '<div id="oferta"></div>')

for k, v in pages.items():
    open(os.path.join(OUT, k + '.html'), 'w', encoding='utf-8').write(v)
print('páginas:', ', '.join(pages))
