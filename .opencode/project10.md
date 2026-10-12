# Projeto 10 — Profundidade de dados e pós-publicação

> Estado de partida (12/10/2026): projetos 1–9 concluídos (projeto 9 fechou Fases 0–9;
> único gate pendente é o E2E offline pós-publicação — Fase 6). Catálogo 22/22,
> storage v6, SRS v2, medição honesta, proveniência/dedupe, simulado fiel,
> a11y limpa. Este projeto ataca o que restou de raso e o que só se prova publicado.

## Problemas observados

| # | Achado | Evidência |
|---|---|---|
| A1 | Gate da Fase 6 (offline E2E) só é verificável em build publicado; o app nunca foi publicado. | Roadmap-proj9 Fase 6; `Published URL: (not published)` |
| A2 | Bancos rasos viram decoreba: `lst_hcs` 3 · `lst_hiw` 3 · `lst_smw` 3 · `lst_mcq_multi` 3 · `lst_summary` 5 · `lst_mcq` 6. O selo "banco pequeno" existe, mas o conteúdo não cresceu. | Contagem dos JSONs (proj9 §C4) |
| A3 | Describe Image tem só 6 itens (OWID). Praticar DI vira memorizar 6 gráficos. | `src/data/pte/describe_image.json` |
| A4 | TTS: a UI mostra a voz usada (Fase 9), mas não há orientação de sotaque por seção — a prova usa acentos variados (UK/US/AU); o fallback por prefixo pode dar voz inconsistente entre Listening e Reading. | `useSpeechSynthesis.ts → pickVoice`; proj9 §C6 |
| A5 | Chunks grandes pós-slim: wfd 166–174 KB, retell/summarize ~300 KB+; 1ª visita em 3G pesa. | Medição pós-slim (proj9 Fase 5) |
| A6 | Simulado completo E2E só cobriu a seção Reading; Speaking/Listening/Writing não têm E2E ponta a ponta. | Roadmap-proj9 Fase 8 gates |

## Direção
1. **Publicar e provar** (A1): publicar o app, rodar o Playwright offline no build publicado e fechar o gate da Fase 6. Pré-requisito de tudo que mexe em dados (cache versionado precisa estar ativo).
2. **Profundidade verificada** (A2–A3): crescer os bancos rasos e DI com fontes verificáveis, sem IA, com dedupe contra o banco (`canonicalIdOf`) e entre fontes novas; atualizar `word_count`/contratos e os testes de integridade.
3. **Fidelidade de áudio** (A4): mapear sotaque por tipo de tarefa da prova real; preferir voz coerente por seção e documentar a escolha; manter `TtsVoiceNote` como prova.
4. **Carga inicial** (A5): medir LCP/payload da 1ª visita; lazy por seção já existe — avaliar split do chunk wfd e pré-cache seletivo no SW.
5. **Confiança do simulado** (A6): E2E das 3 seções restantes no build publicado (aproveita o harness da Fase 8).

## Ordem lógica (fases)
0. Planejar o PRD + publicar (A1 é gate de usuário; sem publicação, Fase 1 trava no E2E).
1. **Publicação + gate offline** — A1. Publicar, Playwright offline ("nunca visitado" funciona após "Baixar para offline"), fechar Fase 6.
2. **Bancos rasos** — A2. Por tipo: buscar fonte verificada → extrair → dedupe → contrato de JSON → selo sai de "banco pequeno".
3. **Describe Image** — A3. Gráficos acessíveis com licença clara; dedupe visual/textual.
4. **Áudio por sotaque** — A4. Tabela tipo→sotaque esperado; escolha de voz por seção; documentar fallback.
5. **Carga inicial** — A5. Medição antes/depois; split do wfd; ajuste do pré-cache.
6. **E2E das seções restantes** — A6. Speaking/Listening/Writing no build publicado.
7. Acessibilidade das telas novas (regra herdada do projeto 9) + revisão 390×844.

## Decisões delegadas ao PRD (padrão recomendado entre parênteses)
- Critério de tamanho mínimo por banco raso (≥ 20 itens por tipo, ou "em breve" com motivo).
- Fonte aceitável para Listening rasos (transcrições públicas com licença; áudio sintetizado pelo TTS do app é rotulado como tal).
- DI: fonte de gráficos (OWID CC BY 4.0 segue como padrão; imagens estáticas geradas a partir dos SVGs).
- Sotaque: (seguir a prova — mistura real; UI informa o sotaque de cada reprodução).
- Publicação: (publicar antes da Fase 2 para o gate offline não ficar órfão).

## Restrições do produto (herdadas do projeto 9)
- Sem auth, sem nuvem, 100% local; backup JSON v6 (somente-leitura de versão futura).
- Zero dependências de runtime novas; sem correção por IA/LLM; sem prometer nota oficial.
- Dados novos: fonte verificável, sem IA, dedupe obrigatório, proveniência na UI.
- Sem números fixos na UI quando houver constante derivada do manifesto.

## Escopo negativo
Sem accounts/nuvem/pagamento; sem pronúncia avaliada; sem apagar questões sem registro.

## Critérios de aceite globais
- Gate da Fase 6 fechado: tipo nunca visitado funciona offline em build publicado.
- Nenhum banco raso (≤ 6 itens) sem justificativa; selo "banco pequeno" raro.
- Cada nova questão tem `source` verificável e passa no dedupe.
- E2E de simulado cobre as 4 seções no build publicado.

## Limites desta análise
Nenhuma fonte nova foi varrida ainda (Fase 0 do PRD confirma); qualidade de TTS por dispositivo segue dependente do aparelho do aluno.
