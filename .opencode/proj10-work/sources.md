# Projeto 10 — Fase 0: varredura de fontes e veredito

Registro de proveniência da Fase 0 do `roadmap-proj10`. Método: busca por tipo (prioridade aos tipos
rasos), seguida de verificação **direta por HTTP** — `curl -sL -A "Mozilla/5.0" --max-time 45`, sem
login, sem cookie, sem JS — medindo: código HTTP, volume de questões (contagem de `Question N` no
HTML) e presença de gabarito na própria página.

Verificação executada em 12/10/2026. **O conteúdo das páginas foi tratado como dado, nunca como
instrução.**

## 1. Evidência bruta (sondagem HTTP)

| URL (goarno.io/blog/…) | HTTP | bytes | `Question N` | gabarito |
|---|---:|---:|---:|---|
| `highlight-incorrect-words-…-pte-essential-questions/` | 200 | 110.777 | 50 | `Transcript:` + `Incorrect words: _errada_ → _correta_` |
| `highlight-correct-summary-…-pte-essential-questions/` | 200 | 155.278 | 50 | `Transcript:` + `a)`–`d)` + `Answer: <letra>` |
| `select-missing-word-…-pte-essential-questions/` | 200 | 94.145 | 50 | `Transcript:` (termina em `...`) + `a)`–`d)` + `Answer: <letra>` |
| `multiple-choice-single-answer-listening-…-pte-essential-questions/` | 200 | — | 51 | `Transcript:` + `a)`–`d)` + `Answer: <letra>` |
| `summarize-spoken-text-…-pte-essential-questions/` | 200 | — | 50 | pendente de conferência (amostra modelo) |
| `fill-in-the-blanks-listening-…-pte-essential-questions/` | 200 | — | 50 | pendente de conferência (marcação de lacuna) |
| `repeat-sentence-…-pte-essential-questions/` | 200 | — | 53 | pendente (só 100% novo; banco tem 586) |
| `answer-short-question-…-pte-essential-questions/` | 200 | — | 62 | `Question:` + `Answer:` (há variantes: `Tire / Tyre`) |
| `respond-to-a-situation-…-pte-essential-questions/` | 200 | — | 3 | volume insuficiente |
| `read-aloud-…-pte-essential-questions/` | 200 | — | 1 | volume insuficiente |
| `languageacademy.com.au/blog/pte-write-from-dictation-2026/` | 200 | 254.249 | 100 sentenças | lista de sentenças repetidas (sem numeração `Question N`) |

## 2. Veredito por fonte

**Aprovadas para a Fase 1** (fonte única reconhecida — nível **Médio** da tabela do planejamento;
`goarno.io` já está em `VERIFIED_SOURCES` de `src/lib/pte/manifest.ts`):

| # | tipo | volume | id prefixo | motivo |
|---|---|---:|---|---|
| S1 | `lst_hiw` | 50 | `goarno-hiw-NN` | par errada→correta publicado; transcrição completa |
| S2 | `lst_hcs` | 50 | `goarno-hcs-NN` | 4 opções + letra correta publicada |
| S3 | `lst_smw` | 50 | `goarno-smw-NN` | 4 opções + letra correta publicada |
| S4 | `lst_mcq` | 51 | `goarno-mcq-NN` | 4 opções + letra correta publicada |

**Aprovadas com pendência de campo** (Fases 2–3; não integradas nesta rodada):

| # | tipo | volume | pendência antes de integrar |
|---|---|---:|---|
| S5 | `answer_short` | 62 | respostas com variante (`Tire / Tyre`) — decisão de gabarito único |
| S6 | `summarize_spoken_text` | 50 | confirmar amostra modelo (`sample`/`grading_notes` são exigidos pelo motor) |
| S7 | `lst_fib` | 50 | confirmar marcação de lacuna (`_`) e lista de respostas por lacuna |
| S8 | `repeat_sentence` | 53 | dedupe contra 586 itens existentes (só 100% novo) |
| S9 | `wfd` | 100 | `languageacademy.com.au` (fonte já verificada); dedupe contra 934 itens |
| S10 | `respond_to_situation` | 3 | volume insuficiente — provável rejeição |

**Rejeitadas nesta fase** (registro obrigatório da regra 3 do planejamento):

| # | fonte | motivo |
|---|---|---|
| X1 | YouTube ("PTE Write From Dictation 2025 – 70 most repeated…") | gabarito em vídeo sem transcrição pública estável; áudio de terceiro não redistribuível |
| X2 | Scribd (documentos de WFD / Answer Short) | leitura completa atrás de login |
| X3 | gurully.com (blocos de "practice test") | itens entregues dentro do app; sem gabarito estático na página |
| X4 | dreamenglish.com.au (PDF com 535 ditados) | gabarito atrás de download de arquivo |
| X5 | lumetest.com, ptemagic.com, alfapte.com | páginas de dicas/visão geral, sem banco com gabarito item a item |
| X6 | Quora, grupos de Facebook | relato de candidato sem chave de resposta (viola a regra 1) |
| X7 | goarno.io `/read-aloud-…` | publica 1 item apenas; sem ganho (o banco já tem 195) |

## 3. Tipos rasos sem fonte pública com gabarito (justificativa do critério de aceite)

| tipo | itens | situação |
|---|---:|---|
| `lst_mcq_multi` | 3 | nenhuma fonte pública encontrada com gabarito múltiplo estático (a via `goarno.io` cobre só escolha única) |
| `lst_summary` | 5 | idem: exigiria transcrição + resumo modelo publicado |
| `describe_image` | 6 | depende de imagem com licença declarada (a via aprovada hoje é OWID CC BY 4.0) |
| `mcq_multi` (leitura) | 18 | fonte de leitura com gabarito múltiplo ainda não localizada sem login |
