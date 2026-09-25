# Diagnóstico e alterações — versão 2 (ofertas de passagem)

## 1. Diagnóstico do protótipo (versão 1)

**O que funcionava e foi preservado**
- Identidade visual: logo vetorizada, cores índigo/vermelho, tipografia (Fraunces, Lora, Poppins), abertura animada, hero da Baía de Guanabara, selo giratório e wordmark no rodapé.
- Design system em `assets/css/site.css` e componentes compartilhados (`components.js`): header, menu mobile, rodapé, botão flutuante.
- Funcionamento 100% offline (abre com duplo clique).
- Páginas institucionais: Quem somos, Cruzeiros, Serviços e Contato.
- Pacotes, agora como **passagem + hotel**.

**O que não atendia a nova especificação**
- O site girava em torno de "pacotes" com roteiro dia a dia, passeios, ingressos e guia. Isso misturava agência com serviço de turismo receptivo.
- Não havia ofertas de passagem, robô de preços, regra de margem nem aprovação de anúncios.
- Os formulários gravavam nome e telefone (lead). A nova especificação leva o cliente direto ao WhatsApp, sem coletar dados pessoais desnecessários.
- O painel (retaguarda) cuidava só de leads e dependia do backend .NET, que nunca foi compilado.
- Não havia avisos de preço, identificação do tipo de preço, código de oferta nem métricas de cliques.

## 2. Alterações feitas

| Área | Mudança |
|---|---|
| Conteúdo | Passeios, ingressos, guia e roteiro dia a dia foram removidos. Pacote passou a ser só **passagem de ida e volta + hotel**. Oferta só de passagem nunca é chamada de "pacote". |
| Home | Hero com seleção de destino ou categoria e origem (SP/RJ). Mostra ofertas em destaque, seções por campanha (românticos, família, 15 anos, praias, cultura e aventura), bloco "Viajar ficou mais fácil", atendimento personalizado e WhatsApp flutuante. |
| Ofertas | Nova listagem com filtros por categoria, destino, origem, região, mês e ordenação. |
| Landing da oferta | Foto de impacto, título emocional, preço e parcelas, galeria com ampliação, texto persuasivo e motivos da viagem. Traz também informações completas da passagem, condições, FAQ, CTA final e barra fixa no celular. |
| Preço | Motor único (`core/precos.js`) com acréscimo ou margem sobre o preço final, margem mínima, custo financeiro, Pix, parcelas e arredondamento. Aceita regras por destino. O total aparece sempre junto da parcela. |
| Robô | `core/robo.js` com a interface `FlightProvider`, provedor de demonstração e esqueletos para Amadeus, Duffel e Skyscanner. Executa o fluxo de 10 etapas, grava logs e expira ofertas antigas. **Nada é publicado sem aprovação.** |
| Painel | Novo painel offline com 11 telas (ver README). |
| WhatsApp | Cada oferta tem código e URL próprios, com mensagem automática editável. O número é configurável no painel. Os formulários só montam a mensagem, sem gravar dados. |
| Métricas | Registra visualizações, cliques em "Conhecer" e cliques no WhatsApp com destino, origem, campanha, página e data/hora, sem dados pessoais. |
| Nuvem | Preparado para Cloudflare Pages, Cloud Run (Job), Cloud Scheduler e Supabase, com `supabase/schema.sql` (RLS), `supabase/seed.sql`, `Dockerfile` e `.env.example`. |
| Ilustrações | 14 novas cenas (20 destinos no total) e 40 recortes de galeria, todos marcados como demonstrativos. |

## 3. Estrutura das páginas

```
index.html                     Home
pages/ofertas.html             Listagem de ofertas (filtros por URL: ?categoria= ?destino= ?origem=)
pages/oferta.html?codigo=XXX   Landing da oferta (?preview=1 mostra rascunhos para a equipe)
pages/destinos.html            20 destinos monitorados (Mundo) + Brasil (passagem + hotel)
pages/pacotes.html             Passagem + hotel (filtros, favoritos)
pages/pacote.html?id=xxx       Detalhe do pacote (passagem + hospedagem)
pages/cruzeiros.html · servicos.html · quem-somos.html · contato.html
retaguarda/index.html          Painel administrativo
```

## 4. Modelos de dados

| Modelo pedido | Offline (coleção) | Supabase (tabela) |
|---|---|---|
| Destination | `destinos` | `destinations` + `destination_campaigns` |
| Airport | `aeroportos` | `airports` |
| MonitoringRule | `regras` | `monitoring_rules` |
| FlightSearch | `pesquisas` | `flight_searches` |
| FlightOffer | `ofertas` (custo original separado do `preco` anunciado) | `flight_offers` + `flight_offer_prices` (histórico) |
| Campaign | `campanhas` | `campaigns` |
| DestinationContent | `conteudos` | `destination_contents` |
| Image | `imagens` (alt, crédito, principal, ordem) | `images` |
| PricingRule | `precos` (padrão + por destino) | `pricing_rules` |
| Consultant | `consultores` | `consultants` |
| WhatsAppClick | `cliques` | `whatsapp_clicks` |
| SystemLog | `logs` | `system_logs` |
| extras | `metricas`, `execucoes`, `config` | `metric_events`, `robot_runs`, `app_settings`, `admin_users` |

Status da oferta: `rascunho`, `aguardando_aprovacao`, `publicado`, `expirado`, `pausado`, `rejeitado`.
Tipo do preço: `ao_vivo`, `indicativo`, `manual`, `demonstrativo`.

## 5. Arquivos

**Novos:** `frontend/assets/js/core/{precos,provedores,robo,store}.js`, `frontend/assets/js/ofertas.js`, `frontend/assets/js/seed.js`, `frontend/pages/{ofertas,oferta}.html`, `frontend/assets/img/destinos/` (14 cenas novas), `frontend/assets/img/galeria/` (40 recortes), `frontend/_headers`, `robo/` (index, repositório JSON e Supabase), `supabase/{schema,seed}.sql`, `tests/` (27 testes), `tools/{seed-dados,gerar-seed,gerar-seed-supabase}.js`, `tools/art_destinos.py`, `Dockerfile`, `.dockerignore`, `.env.example`, `package.json`, `docs/PUBLICAR.md`, este arquivo.

**Modificados:** `frontend/index.html`, `frontend/retaguarda/{index.html,admin.js,admin.css}` (painel reescrito), `frontend/assets/js/app.js` (formulários → WhatsApp, destinos, pacote sem roteiro), `frontend/assets/js/config.js` (apiBase vazio no modo offline), `frontend/assets/css/site.css` (componentes de oferta, anexados ao fim), `frontend/pages/*.html` (regeneradas por `tools/pages.py`), `frontend/assets/js/{components,data}.js` (gerados por `tools/build.py`), `tools/{catalog,components.src,pages,build}.py/js`, `README.md`, `.gitignore`.

**Sem uso nesta versão (mantidos):** `src/backend/` (.NET), `database/`, `docker-compose.yml` e `start-local-backend.ps1` atendiam o modelo antigo de pacotes e leads. Podem ser removidos quando a versão em Supabase estiver no ar.
