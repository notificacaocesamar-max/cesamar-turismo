# Cesamar Turismo — site de ofertas de passagens (v2, versão offline)

O site divulga oportunidades de **passagens internacionais de ida e volta**, sempre saindo de São Paulo ou do Rio de Janeiro. Os preços são pesquisados por um robô diário, e a margem da agência é aplicada automaticamente. Um consultor aprova cada anúncio antes de ele ir ao ar, e o interessado é levado ao **WhatsApp**. O site não vende e não garante disponibilidade.

> Esta é a **versão offline de demonstração**. Os preços são simulados e aparecem como "Conteúdo demonstrativo". As ilustrações são demonstrativas.
> Veja o que mudou em [`DIAGNOSTICO.md`](DIAGNOSTICO.md) e como publicar em [`docs/PUBLICAR.md`](docs/PUBLICAR.md).

## Abrir agora (sem instalar nada)

| O quê | Arquivo |
|---|---|
| Site | `frontend/index.html` (dois cliques) |
| Painel | `frontend/retaguarda/index.html`, senha inicial **cesamar2026** |

Use Chrome ou Edge. O site e o painel compartilham os dados **neste navegador** (localStorage): o que você aprova ou edita no painel aparece no site na hora. Em **Configurações e dados** dá para exportar, importar ou restaurar a demonstração.

## O que tem no site

- **Home:** banner, seletor de destino ou categoria e origem, ofertas em destaque e seções por campanha (românticos, família, 15 anos, praias, cultura e aventura). Traz também o bloco "Viajar ficou mais fácil", o atendimento personalizado e o WhatsApp flutuante.
- **Cards de anúncio:** título ("Itália em maio de 2027"), origem, **preço total + parcelas**, aviso obrigatório, tipo do preço e código. Botões "Conhecer esta oportunidade" e "Falar com um consultor".
- **Landing da oferta** (`pages/oferta.html?codigo=ITA-0527`): galeria, texto persuasivo, motivos, informações completas da passagem, condições, FAQ e CTA final.
- **Mensagem do WhatsApp:** gerada com o código, por exemplo: *"Olá! Vi a oferta ITA-0527 para a Itália, saindo de São Paulo, a partir de R$ 4.079 ou 10x de R$ 407,90…"*.
- **Formulários:** apenas montam a mensagem e abrem o WhatsApp. **Nenhum dado pessoal é gravado.**

## Painel administrativo (11 telas)

1. **Painel:** indicadores, gráfico de cliques, última execução do robô e alertas.
2. **Ofertas:** filas por status (rascunho → aguardando aprovação → publicado / pausado / expirado / rejeitado). Permite aprovar, rejeitar, pausar e reativar. Também edita textos, campanha e tipo do preço, recalcula, aprova nova cotação, mostra o histórico de preços, pré-visualiza e cria oferta manual.
3. **Robô e registros:** executar agora, simular falhas, validade e antecedência, histórico de execuções e logs.
4. **Monitoramento:** período, duração mínima e máxima, escalas, bagagem, origens SP/RJ e combinações por destino.
5. **Preços e parcelamento:** regra padrão, regras por destino e simulador. Inclui o texto do bloco de parcelamento e a reaplicação das regras.
6. **Destinos e aeroportos:** cadastro de países, cidades e aeroportos, com as campanhas de cada destino.
7. **Campanhas e textos:** textos por público, textos de cada destino (título, texto, motivos, FAQ), chamada padrão e aviso de preço.
8. **Imagens:** principal, galeria, texto alternativo, crédito e ordem.
9. **WhatsApp e consultores:** número, mensagens com variáveis e lista de consultores.
10. **Métricas:** visualizações, cliques em Conhecer e no WhatsApp por oferta, destino, origem e campanha. Exporta CSV.
11. **Configurações e dados:** senha da demonstração e backup.

## Regras de preço (`frontend/assets/js/core/precos.js`)

```
Acréscimo:        preço = custo × (1 + margem)                      4.300 × 1,10 = 4.730 → 10x de 473
Margem no preço:  preço = custo ÷ (1 − margem − taxas variáveis)
+ margem mínima em R$, custo financeiro no parcelado, desconto Pix,
  arredondamento comercial (sempre para cima) e regra por destino.
```
O mesmo arquivo roda no navegador (painel, simulador) e no robô (Node).

## Robô (`frontend/assets/js/core/robo.js` + `robo/`)

Fluxo: indicativos → melhores datas → até 3 buscas ao vivo por origem → compara SP × RJ → mais barata válida → margem → parcelas → salva → prepara para aprovação → expira antigas.
Fonte de tarifas plugável (`FlightProvider`): **DemoProvider** (simulado, determinístico por dia), integração funcional com a **Duffel API** e esqueletos para Amadeus e Skyscanner. O robô distribui diariamente 80 consultas internacionais e 40 nacionais entre os destinos, datas e grupos aeroportuários `SAO` e `RIO`; aceita apenas resultados em BRL e mantém as chaves exclusivamente no servidor.

```bash
npm test                         # 27 testes: preços, robô e mapeamento Supabase
node robo/index.js               # roda o robô local (provedor demo, arquivo robo/dados/banco.json)
npm run seed                     # regera seed.js (offline) e supabase/seed.sql
```

## Estrutura

```
frontend/                 site estático (Cloudflare Pages)
  assets/js/core/         precos · provedores · robo · store (compartilhados)
  assets/js/ofertas.js    home, listagem e landing de ofertas
  assets/js/seed.js       dados de demonstração (gerado)
  retaguarda/             painel administrativo
robo/                     robô diário (Cloud Run Job) + repositórios JSON/Supabase
supabase/                 schema.sql (tabelas + RLS) e seed.sql
tests/                    testes (node --test)
tools/                    geradores de dados, páginas e ilustrações
Dockerfile · .env.example · docs/PUBLICAR.md · DIAGNOSTICO.md
```

## Pendências antes de publicar

- [ ] Confirmar o WhatsApp **(21) 99393-9181** (veio do site atual); pode ser trocado no painel.
- [ ] Trocar as ilustrações por fotos próprias ou licenciadas, com crédito (tela Imagens).
- [ ] Escolher e contratar o provedor de tarifas real (ver `docs/PUBLICAR.md`, item 4).
- [ ] Ligar site e painel ao Supabase (`docs/PUBLICAR.md`, item 5).
- [ ] Política de privacidade (LGPD) e revisão dos textos pela agência.
- [ ] Logo: pedir o arquivo vetorial original (a versão enviada diz "LDA"; a razão social é Ltda).

Fontes: Fraunces, Lora e Poppins, sob a licença SIL Open Font License.
