# Projeto 10 — Expansão máxima do banco com questões reais verificadas

> Estado de partida (12/10/2026): projetos 1–9 concluídos. Catálogo 22/22 tipos, storage v6,
> dedupe por `canonicalIdOf`/`canonical-map.json`, proveniência na UI.
> Escopo único: pesquisar a fundo na internet e trazer o MÁXIMO de questões novas de fontes
> não oficiais com confiança muito alta de serem questões reais da prova, sem duplicar.

## Escopo (único)

Varredura extensa e profunda da internet (sites de preparação, prediction files, bancos
"real exam questions", relatos recentes de candidatos, repositórios abertos, PDFs públicos)
para expandir ao máximo o número de questões úteis em todos os tipos, mantendo a seriedade
do projeto. Nada além disso: sem features, sem mudanças de UI, motores ou fluxos.

## Problema observado

Bancos rasos viram decoreba: `lst_hcs` 3 · `lst_hiw` 3 · `lst_smw` 3 · `lst_mcq_multi` 3 ·
`lst_summary` 5 · `lst_mcq` 6 · `describe_image` 6 · `answer_short` e `mcq_multi` baixos.
Tipos grandes (wfd, repeat_sentence, read_aloud) também podem crescer se houver itens 100% novos.

## Regras invioláveis

1. Só entra conteúdo de fonte verificável, acessível sem login, com gabarito/transcrição/
   resposta presente e sinais fortes de ser questão real (recorrência em várias fontes
   independentes, rotulado como "real exam"/"repeated", relatos de candidatos recentes).
2. Nada gerado por IA, nada parafraseado "de memória", nada de baixa probabilidade.
   Na dúvida, fica de fora.
3. Zero duplicatas: dedupe contra o banco existente (exato + similaridade ≥ 0,85 +
   `canonicalIdOf`) E entre as fontes novas.
4. Listening só entra se o motor atual consegue usar (transcript para TTS).
5. Cada questão nova leva `source` verificável (URL/domínio) exibido na proveniência.
6. Sem alterar motores, UI ou fluxos — apenas dados, manifesto e testes de integridade.

## Critério de confiança por fonte

| Nível | Critério | Decisão |
|---|---|---|
| Alto | Item aparece em ≥ 2 fontes independentes, ou fonte reconhecida com histórico de "repeated questions" e gabarito | Aprovar |
| Médio | Fonte única reconhecida, gabarito completo, formato fiel à prova | Aprovar com marcação de fonte |
| Baixo | Sem gabarito, conteúdo genérico, suspeita de IA, exige login, cópia de outra fonte já usada | Reprovar e registrar motivo |

## Ordem lógica (fases)

0. **Varredura e veredito**: buscar fontes por tipo (prioridade aos rasos), verificar acesso
   (HTTP 200, sem login), gabarito presente, sinais de realidade; registrar aprovadas e
   reprovadas com URL, volume e evidência.
1. **Tipos rasos (P0)**: lst_hcs, lst_hiw, lst_smw, lst_mcq_multi, lst_summary, lst_mcq,
   describe_image, answer_short, mcq_multi — extração, normalização, dedupe, integração.
2. **Tipos médios (P1)**: swt, retell_lecture, write_essay, mcq_single, read_fib,
   reorder_paragraphs, summarize_group_discussion, respond_to_situation.
3. **Tipos grandes (P2)**: lst_fib, summarize_spoken_text, read_aloud, repeat_sentence, wfd
   — só itens 100% novos.
4. **Fechamento**: contagem final por tipo e por fonte, relatório de dedupe, gates
   (vitest, tsgo, build, lint, bank-integrity, build-manifest).

## Critérios de aceite

- Nenhum tipo com ≤ 6 itens sem justificativa registrada (fonte confiável inexistente).
- Toda questão nova com `source` verificável e aprovada no dedupe.
- Fontes reprovadas documentadas com motivo; nunca preencher com conteúdo duvidoso.

## Escopo negativo

Sem features, UI, motores, auth, nuvem; sem conteúdo por IA; sem prometer nota oficial;
sem apagar questões existentes.
