# PRD — projeto 10: Expansão máxima do banco com questões reais verificadas

> Fonte do escopo: `.opencode/project10.md` (planejamento). Este PRD confirma cada afirmação do
> planejamento **no código e nas fontes**, decide as questões delegadas (D1–D14), define escopo por
> fase e critérios de aceite. Roadmap correspondente: `.opencode/roadmap-proj10`.
>
> Estado de partida verificado em 12/10/2026 (leitura direta do repositório):
> projetos 1–9 concluídos; **2.618 questões**, 22 task types, 4 seções; storage v6; dedupe por
> `canonicalIdOf` + `canonical-map.json` (56 entradas, apenas `swt`); proveniência por
> `sourceClass()`; gates de referência verdes (vitest 343/343 na última execução registrada em
> `.opencode/monitor-notice-proj9.md`). App 100% local (localStorage), sem auth, sem nuvem, sem
> dependência de runtime nova.

---

## 0. Verificação do planejamento no código (o que confirma e o que corrige)

### 0.A Contagens: o diagnóstico de "bancos rasos" — CONFIRMADO

Contagem real extraída de `src/data/pte/manifest.json` (2.618 linhas):

| tipo | itens | leitura |
|---|---:|---|
| `lst_hcs` | 3 | raso (≤6) |
| `lst_hiw` | 3 | raso (≤6) |
| `lst_mcq_multi` | 3 | raso (≤6) |
| `lst_smw` | 3 | raso (≤6) |
| `lst_summary` | 5 | raso (≤6) |
| `describe_image` | 6 | raso (≤6) |
| `lst_mcq` | 6 | raso (≤6) |
| `summarize_group_discussion` | 13 | ok |
| `mcq_multi` | 18 | baixo |
| `write_essay` | 43 | ok |
| `reorder_paragraphs` | 57 | ok |
| `read_fib` | 62 | ok |
| `respond_to_situation` | 63 | ok |
| `swt` | 79 | ok |
| `retell_lecture` | 81 | ok |
| `lst_fib` | 96 | ok |
| `mcq_single` | 106 | ok |
| `summarize_spoken_text` | 115 | ok |
| `answer_short` | 141 | baixo para o tipo |
| `read_aloud` | 195 | ok |
| `repeat_sentence` | 586 | grande |
| `wfd` | 934 | grande |

São **7 tipos com ≤ 6 itens** (`isSmallBank` = `true`), exatamente os que o planejamento aponta.
`src/test/fase5-banco.test.ts` só verifica o selo por amostragem (`lst_hcs` ≤ 6, `wfd` > 6) — o
número não está congelado em nenhum lugar do código de produção: a Home deriva tudo do manifesto
(`TOTAL_ALL_QUESTIONS_LABEL`, `TYPE_COUNT`), conforme a regra herdada da Fase 5 do projeto 9.

### 0.B O motor sintetiza o áudio: o que isso impõe a cada tipo de escuta — CONFIRMADO (crítico)

`src/lib/pte/catalog.ts` → `baseOf()`:

```
const needsAudio = AUDIO_TYPES.has(taskType);
const transcript = str(q["transcript"]) || (needsAudio ? str(q["audio_text"]) || text : "");
const audioText  = str(q["audio_text"]) || (needsAudio ? transcript : "");
```

`AUDIO_TYPES` inclui `lst_hiw`, `lst_hcs`, `lst_summary`, `lst_smw`, `lst_mcq`, `lst_mcq_multi`,
`lst_fib`, `summarize_spoken_text`. O player é `useSpeechSynthesis` (TTS do sistema/navegador) —
não há arquivo de áudio no banco. Consequências vinculantes:

1. **Nenhum MP3 é redistribuído**: o áudio da questão é gerado do texto. Isso satisfaz a regra 4 do
   planejamento ("escuta só entra se o motor atual consegue usar — transcrição para TTS") e também
   evita redistribuir áudio de terceiros.
2. **HIW inverte o sinal do texto.** Em `lst_hiw` o motor faz
   `synth.speak(question.audioText || question.transcript, 1)` e marca os erros sobre
   `tokenize(question.text)` (`HiwPractice.tsx`). Ou seja: o texto **exibido** é o que contém as
   palavras erradas e `errors` aponta índices **nesse texto**; o áudio precisa dizer o texto
   **corrigido**. Logo, todo item de HIW importado deve trazer `audio_text` = transcrição com as
   palavras erradas substituídas pelas corretas (senão o TTS fala o erro e a questão deixa de ter
   erro audível). Ver D2.

### 0.C Duplicatas: o que existe hoje — CONFIRMADO e corrigido no escopo

- `src/data/pte/canonical-map.json` tem **56 entradas, todas de `swt`** (28 pares quase-duplicados).
  Os 19 tipos listados em `.opencode/proj9-work/dedupe.mjs` foram varridos; os 3 tipos da Fase 7 do
  projeto 9 (`summarize_group_discussion`, `respond_to_situation`, `describe_image`) ficaram fora do
  gerador — não têm entradas no mapa e por isso são hoje 2.562 ids "faltantes" do mapa (o que é o
  comportamento correto de `canonicalIdOf`: ausente ⇒ o próprio id).
- Reexecutar `dedupe.mjs` é **seguro e não perde nada**: ele regenera o arquivo a partir dos 19
  arquivos de dados e o conjunto atual é subconjunto do que ele produz. É o caminho para incluir os
  itens novos no mapa (D7).
- Similaridade usada pelo gerador: normalização + prefixo de 200 caracteres + Jaccard de trigramas
  ≥ 0,85. Nenhum item novo pode ser quase-duplicata de um existente sem entrar no mapa.

### 0.D Proveniência — CONFIRMADO

`src/lib/pte/manifest.ts` → `sourceClass(source)`: `verificada` para um conjunto fechado
(`goarno.io`, `pteacademy.in`, `band9pte.com.au`, `stormedugo.com`, `edknot.com`, `79score.com`,
`languageacademy.com.au`, `pearsonpte.com`, `ourworldindata.org`), `ia` para
`ai-generated-prediction`/`pte2-prediction`/`pteracai-seed`, `comunitária` para o resto. O selo é
exibido em `QuestionRow`/`PracticeShell` e o filtro "só fontes verificadas" (`settings.verifiedOnly`,
default desligado) afeta as filas de treino (SRS/plano/simulado), **nunca** as listas.

Fontes atuais por volume: `pte2-prediction` 1.081 · `ai-generated-prediction` 647 · `goarno.io` 344
· `pteracai-seed` 200 · `pteacademy.in` 107 · `anki-cards` 98 · `stormedugo.com` 47 · `edknot.com` 43
· `band9pte.com.au` 38 · `ourworldindata.org` 6 · `languageacademy.com.au` 3 · `pearsonpte.com` 2 ·
`79score.com` 2. **74% do banco é predição de IA/comunidade** — é exatamente o problema que a regra 2
do planejamento ataca: só entra o que tem fonte verificável, e o critério de confiança passa a ser o
eixo do projeto.

### 0.E Contrato do dado por tipo (o que um item novo precisa ter)

Derivado de `catalog.ts` + `src/data/pte/*.json` + `scripts/build-manifest.mjs`:

| tipo | campos obrigatórios no JSON | observações |
|---|---|---|
| `lst_hiw` | `id`, `text`, `errors` (índices), `explanation`, `trap`, `topic`, `source`, `word_count`, `audio_text` | `errors` conta tokens de `text` via `tokenize` |
| `lst_hcs`, `lst_smw`, `lst_mcq`, `lst_mcq_multi` | `id`, `text`, `options` (2+), `answer` (índice inteiro; `normalizeAnswers` aceita inteiro), `explanation`, `trap`, `topic`, `source`, `word_count` | cardinalidade: `lst_hcs`/`lst_smw`/`lst_mcq` = **1** resposta; `lst_mcq_multi` = 2+ |
| `answer_short` | `id`, `text`, `answer`, `topic`, `source`, `word_count` | resposta é string livre (avaliação por keywords) |
| `wfd`, `repeat_sentence` | `id`, `answer`, `source`, `word_count` (payload slim) | `text` derivado da `answer` |

`scripts/build-manifest.mjs` lê `src/data/pte/<tipo>.json` e escreve `manifest.json`
(`{id,t,s,topic,src,wc}` + `d` opcional). `word_count` deve ser `tokenize(text).length` (o teste de
catálogo exige `wordCount > 0` e o banco de read aloud exige ±2 — para os tipos deste projeto basta
bater com o texto, D13).

### 0.F Achado novo (não estava no planejamento): os itens "seed" dos tipos rasos são incoerentes

Os 3 itens de `lst_hiw` têm `source: "pteracai-seed"` (classe `ia`) e a `explanation` **não
corresponde** aos `errors` gravados. Item `pte-lst_hi-bf40243b`:

- `errors: [5, 12, 17, 19, 33]`;
- `explanation`: "Word 5 ('gaining' vs. 'losing'), word 12 ('1980s' vs. '1990s'), word 17 ('East' vs.
  'West'), word 19 ('cooling' vs. 'warming'), word 33 ('coastal' vs. 'inland')";
- texto tokenizado: índice 5 = `been`, 12 = `since`, 17 = `most`, 19 = `the`, 33 = `ice`. As palavras
  citadas na `explanation` (`losing`, `1990s`, `West`, `warming`, `inland`) estão no texto em
  **6, 15, 23, 26, 37**.

Isto é: o gabarito e o texto não fecham. O `bank-integrity.test.ts` não pega o caso porque só valida
que o índice **cabe** no texto (não que a palavra no índice seja a palavra errada). Consequências:
(a) os itens de HIW hoje no banco são treino enganoso; (b) o projeto 10 não pode repetir o padrão —
todo item novo passa a ser **verificado por máquina** contra a própria lista de substituições da
fonte (D5 + Fase 1, critério de aceite). Corrigir os itens antigos está **fora do escopo** (regra 5
do planejamento: nada de apagar questões existentes); fica registrado como risco R6.

---

## 1. Princípios, restrições e escopo negativo

### 1.1 Princípios (na ordem em que valem)

1. **Fonte verificável ou nada.** Item novo só entra com URL/domínio público, sem login, com gabarito
   (chave de resposta/transcrição) presente na própria página.
2. **Zero invenção.** Nada gerado por IA, nada parafraseado "de memória", nada inferido. O texto
   entra como a fonte publica (apenas normalização de espaços), D10.
3. **Zero duplicata.** Checagem exata + similaridade ≥ 0,85 + `canonicalIdOf`, contra o banco e
   entre as fontes novas (D7).
4. **Honestidade de rótulo.** O nível de confiança da fonte é registrado; item de fonte única
   reconhecida é aprovado **com marcação de fonte** (nível Médio da tabela do planejamento), nunca
   promovido a "Alta" sem a segunda fonte independente.
5. **Nada além de dados.** Sem recurso novo, sem UI, sem motor, sem fluxo. Data + manifesto +
   testes de integridade.
6. **O motor manda.** Se o motor atual não consegue usar o dado (sem áudio para escuta, sem gabarito
   consumível), o item **não entra** — mesmo que a fonte seja boa.

### 1.2 Restrições técnicas invioláveis

- **Não** editar `src/routeTree.gen.ts`, `src/server.ts`, `src/start.ts`, nem adicionar plugins Vite.
- **Não** criar dependência de runtime nova (o banco é dado estático + TTS do navegador).
- **Não** duplicar campo de texto no JSON enxuto (payload slim da Fase 5): `wfd`/`repeat_sentence`
  guardam só `id/answer/source/word_count`.
- **Não** derivar caixa/due/strong do log (regra da Fase 2 do projeto 9) — nada aqui toca SRS.
- **Não** alterar o default do filtro "só fontes verificadas" (D4 revisado do projeto 9: WFD/RS não
  têm itens verificados; ligar o default esconderia 1.520 itens).
- **Manter verde** o `bank-integrity.test.ts` (ids únicos, gabarito no range, FIB, HIW, resíduos de
  scraping, typos conhecidos).
- Reexecutar `scripts/build-manifest.mjs` **sempre** que um JSON de dados mudar (há teste de
  paridade/velhice do manifesto).

### 1.3 Escopo negativo

Sem recursos, sem UI, sem motores, sem auth, sem nuvem; sem conteúdo de IA; sem prometer nota
oficial; sem apagar questões existentes; sem baixar nem redistribuir áudio de terceiros (o áudio é
TTS do texto, §0.B); sem usar PDF atrás de download/login; sem copiar banco inteiro de terceiros
(entram itens, com fonte, não o dump).

---

## 2. Decisões delegadas (decididas aqui, vinculantes)

O planejamento delega ao PRD as decisões de "como"; o protocolo proíbe perguntar ao utilizador
(Plan.md §"How to execute"), então cada dúvida vira decisão registrada.

- **D1 — Fonte primária desta rodada: `goarno.io`.** Já pertence a `VERIFIED_SOURCES`
  (`sourceClass` = `verificada`) e publica bancos de 50 questões por tipo com **transcrição + gabarito
  explícito** na própria página, sem login (verificado §6). Nenhuma fonte nova é promovida a
  "verificada" sem segunda fonte independente (§1.1 princípio 4).
- **D2 — HIW grava `audio_text` corrigido.** `text` = transcrição exibida (com as palavras erradas,
  como a fonte publica); `errors` = índices dos termos errados **nesse texto**, calculados com o
  mesmo `tokenize()` do motor; `audio_text` = transcrição com as palavras erradas trocadas pelas
  corretas (o que o áudio diz). Sem `audio_text` a questão não tem erro audível (§0.B).
- **D3 — Escolha única grava índice inteiro em `answer`.** `options` sem o prefixo `a)`/`b)`/…;
  `answer` = índice 0-based (`normalizeAnswers` converte inteiro em `[n]`). `lst_hcs`, `lst_smw`,
  `lst_mcq` = exatamente 1 correta (teste de integridade já exige cardinalidade).
- **D4 — `explanation` carrega o gabarito da fonte.** Para HIW, a lista de substituições
  (`errada → correta`); para os tipos de escolha, a alternativa correta por extenso + a letra da
  fonte. É o que torna o item auditável depois (regra 1 do planejamento) sem depender de reabrir a
  fonte.
- **D5 — Verificação por máquina antes de gravar.** Cada item passa por uma checagem no próprio
  script de importação: (HIW) toda palavra errada citada pela fonte existe em `text` **no índice
  gravado**; (escolha) `answer` dentro do range e a opção marcada é exatamente a que a fonte indica.
  Item que falha é **descartado e registrado**, nunca "ajustado à mão".
- **D6 — Convenção de id.** `goarno-hiw-NN`, `goarno-hcs-NN`, `goarno-smw-NN`, `goarno-mcq-NN`
  (NN = 2 dígitos, ordem de aparição na fonte). Prefixo por fonte+tipo, como já é hábito no banco
  (`goarno-ra-`, `storm-ra-`, `pte-ra-`).
- **D7 — Dedupe pelo gerador existente.** Reescrever `src/data/pte/canonical-map.json` com
  `.opencode/proj9-work/dedupe.mjs` (19 tipos, trigramas ≥ 0,85). Ganho duplo: os itens novos entram
  na checagem e o mapa passa a ser regenerado pela ferramenta canônica. Se um item novo casar com um
  existente, os dois permanecem (o antigo mantém o selo, o novo entra como "repetida") e a `answer`
  do par é conferida à mão — divergência de gabarito entre "duplicatas" é sinal de fonte ruim:
  nesse caso o item novo é descartado.
- **D8 — Testes atualizados com a realidade, não com números congelados.** `catalog.test.ts`
  (`EXPECTED_COUNTS`) passa a refletir as contagens novas; `fase5-banco.test.ts` deixa de fixar
  2.618 e o teste do selo "banco pequeno" passa a verificar a **semântica** (`isSmallBank(t) ===
  (typeCounts[t] ≤ SMALL_BANK_MAX)` para todo tipo) em vez de depender de um tipo específico
  continuar pequeno — do contrário, expandir o banco quebraria o teste por mérito.
- **D9 — Scripts de importação ficam no repositório `.opencode/proj10-work/`.** É a convenção do
  projeto para registro de proveniência e reprodutibilidade (`proj9-work/dedupe.mjs`,
  `proj6-work/*.mjs`); rascunho/experimento vai para `/tmp` e não é commitado.
- **D10 — Nada de IA no dado.** Nenhum texto novo é escrito por modelo: `text`/`options`/`answer`
  vêm da fonte, verbatim (só espaços colapsados e o prefixo de alternativa removido). O que é
  redigido aqui é apenas `trap` (dica pedagógica) e o texto de `explanation` que **reproduz** o
  gabarito (D4) — nunca conteúdo de questão.
- **D11 — `trap` honesto e rotativo.** Cada item recebe uma dica curta escolhida por classe de
  substituição/erro (números, polaridade, vocabulário acadêmico, nomes próprios). Não se inventa um
  "erro comum" específico do item quando a fonte não o declara.
- **D12 — Nível de confiança declarado: Médio (fonte única reconhecida).** A tabela do planejamento
  exige duas fontes independentes para "Alta". Os itens desta rodada são de **fonte única** com
  gabarito completo — aprovados **com marcação de fonte** (o selo "verificada" do `sourceClass` já é
  a marcação visível na UI). Registrado aqui para que nenhuma rodada futura trate este lote como
  "Alta".
- **D13 — Normalização de texto.** Colapsar espaços/quebras; manter a pontuação da fonte (o motor
  normaliza ao comparar); `word_count` = `tokenize(text).length`; `topic` = `"academic lecture"`
  (gênero real das transcrições da fonte), sem inventar tópico por item.
- **D14 — Monitor/OpenCode indisponível nesta sandbox (registro obrigatório).** O protocolo manda
  avisar o "project monitor" (OpenCode em `127.0.0.1:4096`) no início e no fim do remix. Nesta
  sandbox o binário não existe (`/root/.bun/bin/opencode` ausente) e não há canal de MCP disponível
  para o agente desta sessão. Decisão: **não** se instala nem se sobe um segundo agente só para
  cumprir o ritual (custo/risco altos, ganho nulo para o dado), e **não** se simula a notificação: a
  mensagem pendente é registrada em `.opencode/monitor-notice-proj10.md`, seguindo a convenção já
  usada em `monitor-notice-proj9.md`, e reportada ao utilizador.

---

## 3. Escopo por fase (o COMO)

### 3.0 Fase 0 — Varredura e veredito (executada nesta rodada)

**Método:** busca por tipo (prioridade aos rasos), depois verificação direta por HTTP
(`curl -sL`, sem login, `User-Agent` de navegador, `--max-time 45`): código 200, volume de questões
(contagem de `Question N` no HTML), presença de gabarito (transcrição + "Answer:"/"Incorrect
words:") e estrutura consumível pelo motor (§0.B/0.E).

**Saída:** `.opencode/proj10-work/sources.md` — uma linha por fonte com URL, HTTP, volume, evidência
do gabarito e veredito (aprovada / aprovada-com-pendência / rejeitada + motivo). Nada entra no banco
antes desse registro.

**Regra de rejeição aplicada:** sem gabarito, atrás de login/download, vídeo sem transcrição pública,
com conteúdo genérico ou cópia de fonte já usada ⇒ rejeitada, com o motivo escrito.

### 3.1 Fase 1 — Tipos rasos (P0)

**Alvo desta rodada (fonte única verificada, gabarito completo, motor compatível):**

| tipo | hoje | + | depois | fonte |
|---|---:|---:|---:|---|
| `lst_hiw` | 3 | 50 | 53 | goarno.io |
| `lst_hcs` | 3 | 50 | 53 | goarno.io |
| `lst_smw` | 3 | 50 | 53 | goarno.io |
| `lst_mcq` | 6 | 51 | 57 | goarno.io |

**Por item:** id (D6), `text`/`options`/`answer` verbatim da fonte (D10/D13), `audio_text` corrigido
(HIW, D2), `explanation` com o gabarito (D4), `trap` rotativo (D11), `topic`, `source: "goarno.io"`,
`word_count`. Os itens novos são **anexados** ao fim de `questions[]` (a ordem estável do banco é
"a ordem do arquivo": o primeiro item de cada tipo segue sendo o que já era).

**Pendente da fase (registrado com fonte pronta, não executado agora):**
`lst_mcq_multi` (a fonte primária não publica o tipo; procurar segunda fonte antes de qualquer
coisa), `lst_summary` (idem), `describe_image` (exige imagem com licença clara — a via atual é OWID
CC BY 4.0; qualquer nova imagem só entra com licença declarada), `answer_short` (fonte de 62 itens
aprovada-com-pendência: respostas com variante `Tire / Tyre` exigem decisão de gabarito) e
`mcq_multi` (fonte de leitura múltipla ainda não localizada sem login).

### 3.2 Fase 2 — Tipos médios (P1)

`swt`, `retell_lecture`, `write_essay`, `mcq_single`, `read_fib`, `reorder_paragraphs`,
`summarize_group_discussion`, `respond_to_situation`. Só entram itens **100% novos** e com gabarito
do próprio tipo (amostra modelo para SWT/SST, resposta para RTS/ASQ, ordem correta para reorder).
A fonte `goarno.io` já tem volume para `summarize_spoken_text`, `fill-in-the-blanks-listening`,
`repeat-sentence` e `respond-to-a-situation` (3 itens — provavelmente rejeitada por volume), a
conferir campo a campo antes de integrar.

### 3.3 Fase 3 — Tipos grandes (P2)

`lst_fib`, `summarize_spoken_text`, `read_aloud`, `repeat_sentence`, `wfd` — só itens 100% novos,
com dedupe obrigatório contra o banco grande (o risco é justamente repetir o que já existe 934/586
vezes). Fonte já verificada e disponível para WFD: `languageacademy.com.au` (100 sentenças
repetidas, página pública, sem login); fonte `goarno.io` para FIB/SST/RS.

### 3.4 Fase 4 — Fechamento

Contagem final por tipo e por fonte, relatório de dedupe (pares novos no mapa, se houver), veredito
de cada fonte rejeitada, e os gates do projeto (§4). Atualizar `.opencode/project10.md`? **Não** —
escopo do planejamento é intocável; o progresso vive no roadmap.

---

## 4. Critérios de aceite globais (do planejamento, verificáveis)

1. **Nenhum tipo com ≤ 6 itens sem justificativa registrada** (fonte confiável inexistente). Estado
   após esta rodada: `lst_hiw` 53, `lst_hcs` 53, `lst_smw` 53, `lst_mcq` 57; permanecem rasos
   `lst_mcq_multi` (3), `lst_summary` (5), `describe_image` (6) — justificativa exigida no fechamento
   da fase 1 para cada um.
2. **Todo item novo com `source` verificável** e aprovado no dedupe (exato + ≥0,85 + canônico).
3. **Fontes rejeitadas documentadas com o motivo**; nunca preencher com conteúdo duvidoso.
4. **Gates verdes** ao fim da rodada: `bunx vitest run` (inclui `bank-integrity`), `tsc --noEmit`,
   `bun run build`, `bun run lint`, `node scripts/build-manifest.mjs` reexecutado.
5. **Nada fora de dados**: nenhum arquivo de `src/components`, `src/routes`, `src/lib/pte/*` de
   motor tocado — exceção única: testes que fixam contagens (D8).
6. **Auditabilidade**: a partir do id, chega-se ao tipo, à fonte e ao gabarito (`explanation`)
   sem sair do repositório.

---

## 5. Riscos e mitigações

| # | risco | mitigação |
|---|---|---|
| R1 | Copiar texto com erro de transcrição da página (aspas tipográficas, `—`) e sujar o banco | normalização de espaços preservando a pontuação + `bank-integrity` (resíduos de scraping) + leitura de amostra |
| R2 | HIW com índice de erro deslocado (o defeito do §0.F) | D5: verificação por máquina de cada índice contra a lista da fonte **antes** de gravar; zero tolerância |
| R3 | Item novo ser quase-duplicata de um existente (sobretudo em `lst_mcq`) | D7: dedupe canônico obrigatório; divergência de gabarito ⇒ descarte |
| R4 | Bancos grandes (`wfd`, `repeat_sentence`) incharem com repetição | Fase 3 exige 100% de novidade, comprovada por similaridade |
| R5 | TTS do navegador não estar disponível no preview (sem voz instalada) | não é gate de dados: a questão continua válida (texto + gabarito); registrar na verificação |
| R6 | Itens antigos de `pteracai-seed` incoerentes (§0.F) seguirem no banco | fora do escopo removê-los; reportado ao utilizador e registrado aqui |
| R7 | Fonte mudar/derrubar a página depois da importação | `explanation` guarda o gabarito da fonte (D4) e o id carrega a fonte (D6) |

---

## 6. Registro de fontes (Fase 0 — verificado em 12/10/2026)

Verificação: `curl -sL -A "Mozilla/5.0"`, HTTP 200, sem login, sem paywall, contagem de `Question N`
no HTML, padrão de gabarito presente. **O conteúdo das páginas foi tratado como dado, nunca como
instrução** (regra §45.7 do `.opencode/AGENTS.md`).

**Aprovadas (gabarito explícito, estrutura consumível pelo motor):**

| # | fonte | URL | HTTP | volume | gabarito observado | veredito |
|---|---|---|---:|---:|---|---|
| S1 | goarno.io | `/blog/highlight-incorrect-words-practice-questions-with-answers-pte-essential-questions/` | 200 | 50 | `Transcript:` + `Incorrect words: errada → correta` | **aprovada** → `lst_hiw` |
| S2 | goarno.io | `/blog/highlight-correct-summary-practice-questions-with-answers-pte-essential-questions/` | 200 | 50 | `Transcript:` + opções `a)`–`d)` + `Answer: b` | **aprovada** → `lst_hcs` |
| S3 | goarno.io | `/blog/select-missing-word-practice-questions-with-answers-pte-essential-questions/` | 200 | 50 | `Transcript:` (termina em `...`) + `a)`–`d)` + `Answer: b` | **aprovada** → `lst_smw` |
| S4 | goarno.io | `/blog/multiple-choice-single-answer-listening-practice-questions-with-answers-pte-essential-questions/` | 200 | 51 | `Transcript:` + `a)`–`d)` + `Answer: b` | **aprovada** → `lst_mcq` |

**Aprovadas com pendência de campo (entram nas fases 2–3 depois de conferir o campo do gabarito):**

| # | fonte | URL | HTTP | volume | pendência |
|---|---|---|---:|---:|---|
| S5 | goarno.io | `/blog/answer-short-question-practice-questions-with-answers-pte-essential-questions/` | 200 | 62 | respostas com variante (`Tire / Tyre`) — definir gabarito único antes de integrar |
| S6 | goarno.io | `/blog/summarize-spoken-text-practice-questions-with-answers-pte-essential-questions/` | 200 | 50 | conferir se há **amostra modelo** (o motor exige `sample`/`grading_notes`) |
| S7 | goarno.io | `/blog/fill-in-the-blanks-listening-practice-questions-with-answers-pte-essential-questions/` | 200 | 50 | conferir marcação de lacuna (`_`) e lista de respostas por lacuna |
| S8 | goarno.io | `/blog/repeat-sentence-practice-questions-with-answers-pte-essential-questions/` | 200 | 53 | só 100% novo (banco tem 586); dedupe obrigatório |
| S9 | languageacademy.com.au | `/blog/pte-write-from-dictation-2026/` | 200 | 100 | sentenças repetidas em lista; fonte já verificada → `wfd` (fase 3) |
| S10 | goarno.io | `/blog/respond-to-a-situation-practice-questions-with-answers-pte-essential-questions/` | 200 | 3 | volume baixo; provavelmente rejeitada por insuficiência |

**Rejeitadas (com motivo):**

| # | fonte | motivo |
|---|---|---|
| X1 | YouTube (vídeos de "repeated questions") | sem transcrição/gabarito estável que o agente possa citar; áudio não é redistribuível |
| X2 | Scribd (documentos de WFD/ASQ) | login/paywall para leitura completa |
| X3 | gurully.com (blocos "practice test") | conteúdo entregue dentro do app da plataforma; não há gabarito estático na página |
| X4 | dreamenglish.com.au (PDF "535 ditados") | gabarito atrás de download de arquivo — sem URL de conteúdo verificável |
| X5 | lumetest.com / ptemagic.com / alfapte.com | páginas de dica/visão geral, sem banco com gabarito item a item |
| X6 | Quora / grupos de Facebook | relato de candidato, sem chave de resposta; viola a regra 1 |
| X7 | `goarno.io` `/read-aloud-…` | a página publica 1 item; sem ganho (o banco tem 195) |

---

## 7. Matriz de arquivos por fase (máximo de superfície tocada)

| fase | arquivos | tipo de mudança |
|---|---|---|
| 0 | `.opencode/proj10-work/sources.md` | documentação (artefato de fase) |
| 1 | `src/data/pte/lst_hiw.json`, `lst_hcs.json`, `lst_smw.json`, `lst_mcq.json`, `src/data/pte/manifest.json`, `src/data/pte/canonical-map.json`, `src/test/catalog.test.ts`, `src/test/fase5-banco.test.ts`, `.opencode/proj10-work/extract-goarno.mjs` | dados + manifesto + mapa canônico + testes que fixam contagem + script de proveniência |
| 2 | `src/data/pte/{swt,retell_lecture,write_essay,mcq_single,read_fib,reorder_paragraphs,summarize_group_discussion,respond_to_situation}.json` + manifesto | dados |
| 3 | `src/data/pte/{lst_fib,summarize_spoken_text,read_aloud,repeat_sentence,wfd}.json` + manifesto | dados |
| 4 | `.opencode/proj10-work/sources.md` (fechamento) + `.opencode/roadmap-proj10` (checkboxes/gates) | documentação de progresso |

**Fora de escopo, em qualquer fase:** `src/components/**`, `src/routes/**`, `src/lib/pte/catalog.ts`,
`src/lib/pte/types.ts`, `src/lib/pte/manifest.ts` (motor/proveniência), `src/server.ts`,
`src/start.ts`, `src/routeTree.gen.ts`, `package.json`.

---

## 8. Casos de teste por fase (mínimo obrigatório)

**Fase 1 (executados nesta rodada):**
1. `bank-integrity` verde com o banco maior: ids únicos, escolha com gabarito no range e
   cardinalidade certa (`lst_hcs`/`lst_smw`/`lst_mcq` = 1), HIW com índice dentro do texto.
2. `catalog.test.ts`: `EXPECTED_COUNTS` novo bate com `typeCounts`, `TOTAL_ALL_QUESTIONS` =
   tamanho do manifesto = soma das seções.
3. `fase5-banco.test.ts`: total novo (sem número congelado antigo) + selo "banco pequeno" verificado
   por semântica para todos os tipos.
4. Checagem de origem do dado (script, D5): cada palavra errada do HIW está em `text` no índice
   gravado; cada `answer` de escolha aponta para a alternativa com a letra da fonte. **Falha ⇒ item
   descartado**, com contagem no relatório do script.
5. Reexecução de `build-manifest.mjs` + `dedupe.mjs` sem diff inesperado (mapa só cresce).

**Fase 2/3:** para cada tipo integrado, teste de integridade do tipo (já existentes) + a checagem de
origem aplicável (gabarito do tipo presente) + dedupe.

**Fase 4:** contagem por tipo/fonte conferida contra o manifesto; lista de rejeitadas com motivo;
gates completos.

---

## 9. Definição de pronto do projeto

O projeto 10 está pronto quando: (a) todo tipo com ≤ 6 itens tem fonte integrada **ou** justificativa
registrada; (b) todos os itens novos têm `source` verificável, gabarito auditável em `explanation` e
aprovação no dedupe canônico; (c) as fontes rejeitadas estão documentadas com motivo; (d) os gates
(`vitest`, `tsc`, `build`, `lint`, manifesto, integridade) estão verdes; (e) nada fora de dados foi
tocado; (f) o roadmap-proj10 está marcado, com a linha de Gates em cada fase, e o aviso pendente ao
monitor registrado (D14).
