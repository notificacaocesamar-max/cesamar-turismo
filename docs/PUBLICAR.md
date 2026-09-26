# Como publicar (planos gratuitos durante a demonstração)

Arquitetura alvo:

```
Visitante ──► Cloudflare Pages (frontend/)  ──lê ofertas publicadas──►  Supabase (Postgres + Auth + Storage)
                                                                          ▲
Cloud Scheduler (1x/dia) ──► Cloud Run Job "cesamar-robo" (Dockerfile) ───┘  grava pesquisas, ofertas p/ aprovação, logs
Equipe ──► /retaguarda (login Supabase Auth) ──► aprova/edita ofertas
```

> **Etapa atual: versão offline.** O frontend já pode ir para o Cloudflare Pages como vitrine de demonstração, mas enquanto o `store.js` usar o localStorage, as mudanças feitas no painel só valem no navegador de quem as fez. A troca pelo Supabase é a próxima etapa (item 5).

## 1. Frontend no Cloudflare Pages
1. Suba o projeto para um repositório no GitHub.
2. No Cloudflare, abra **Workers & Pages → Create → Pages → Connect to Git** e escolha o repositório.
3. Configure: *Framework preset* = None, *Build command* = (vazio), *Build output directory* = `frontend`.
4. Deploy. O arquivo `frontend/_headers` aplica cabeçalhos de segurança e `noindex` na retaguarda.
5. Domínio próprio: em **Custom domains**, aponte `cesamarturismo.com.br`.

## 2. Banco no Supabase
1. Crie um projeto (plano Free) na região São Paulo.
2. No **SQL Editor**, rode `supabase/schema.sql` e depois `supabase/seed.sql`.
   Se o banco já tiver sido criado com uma versão anterior, rode antes `supabase/migrations/002_duffel_campos.sql`.
3. Em **Authentication → Users**, crie o usuário da equipe e rode no SQL Editor:
   `insert into admin_users (user_id, nome, papel) values ('<uuid>', 'Alexandre', 'admin');`
4. Em **Project Settings → API**, anote `URL`, `anon key` (pode ir para o frontend) e `service_role key` (**somente** no Cloud Run).
5. Regerar os dados de exemplo: `npm run seed`.

## 3. Robô no Google Cloud Run (Job) + Cloud Scheduler
Pré-requisito: `gcloud` instalado e um projeto no Google Cloud com faturamento ativo (o uso de 1 execução/dia cabe na camada gratuita).

```bash
PROJETO=seu-projeto; REGIAO=southamerica-east1
gcloud config set project $PROJETO
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# segredo (nunca no código)
printf '%s' 'SUA_SERVICE_ROLE_KEY' | gcloud secrets create supabase-service-role --data-file=-

# build + job
gcloud run jobs deploy cesamar-robo --source . --region $REGIAO \
  --set-env-vars FLIGHT_PROVIDER=demo,ROBO_ARMAZENAMENTO=supabase,SUPABASE_URL=https://XXXX.supabase.co \
  --set-secrets SUPABASE_SERVICE_ROLE_KEY=supabase-service-role:latest \
  --max-retries 1 --task-timeout 15m

# teste manual
gcloud run jobs execute cesamar-robo --region $REGIAO --wait

# agenda diária às 06:00 (horário de Brasília)
SA=$(gcloud iam service-accounts list --filter="Compute Engine default" --format='value(email)')
gcloud run jobs add-iam-policy-binding cesamar-robo --region $REGIAO --member "serviceAccount:$SA" --role roles/run.invoker
gcloud scheduler jobs create http cesamar-robo-diario --location $REGIAO \
  --schedule "0 6 * * *" --time-zone "America/Sao_Paulo" \
  --uri "https://run.googleapis.com/v2/projects/$PROJETO/locations/$REGIAO/jobs/cesamar-robo:run" \
  --http-method POST --oauth-service-account-email $SA
```

### Alternativa inicial sem Cloud Run: GitHub Actions

O arquivo `.github/workflows/robo-diario.yml` executa o mesmo robô todos os dias às 06:00 de Brasília. Para ativar, cadastre em **Settings → Secrets and variables → Actions**:

- `DUFFEL_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Enquanto algum segredo estiver ausente, a rotina encerra sem consultar tarifas nem gerar dados falsos. Também é possível testar manualmente em **Actions → Monitorar passagens → Run workflow**.

Essa alternativa é adequada para validar o produto com baixo custo. O Cloud Run continua sendo a opção indicada quando o volume e o controle operacional aumentarem.

O orçamento padrão de pesquisa é de **80 consultas internacionais + 40 nacionais por dia**. O robô divide essas consultas de forma equilibrada entre todas as regras ativas, as origens `SAO`/`RIO` e datas distintas. Os limites podem ser alterados por `ROBO_CONSULTAS_INTERNACIONAIS` e `ROBO_CONSULTAS_NACIONAIS`.

## 4. Provedor de tarifas real
1. Escolha o fornecedor e obtenha credenciais **de teste**:
   - **Duffel**: busca ao vivo (`offer_requests`), mas não tem calendário de preços indicativos.
   - **Skyscanner**: depende de acordo de parceria.
   - **Amadeus**: o portal Self-Service foi descontinuado em 17/07/2026, segundo a imprensa do setor; o acesso agora passa pelo contrato Enterprise.
2. Complete o adaptador em `frontend/assets/js/core/provedores.js`, mapeando a resposta para `FlightOffer`.
3. Cadastre as chaves como segredos do Cloud Run e troque `FLIGHT_PROVIDER`. O resto do sistema não muda.
4. Revise o custo por consulta: 20 destinos × 2 origens × até 3 combinações = até 120 buscas ao vivo por dia.

## 5. Próxima etapa: ligar o site e o painel ao Supabase
- Criar `core/store-supabase.js` com as mesmas funções do `store.js` (`publicadas`, `oferta`, `registrar`…), lendo pela `anon key`.
- No painel, usar o Supabase Auth (e-mail e senha) e gravar pelas mesmas tabelas. O RLS já limita a escrita à equipe.
- Fotos: Supabase Storage (bucket `imagens`, leitura pública).
