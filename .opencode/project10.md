# Project 10 — Maximum bank expansion with verified real questions

> Starting state (10/12/2026): projects 1–9 completed. Catalog 22/22 types, storage v6,
> dedupe via `canonicalIdOf`/`canonical-map.json`, provenance in the UI.
> Single scope: research the internet in depth and bring in the MAXIMUM number of new questions from
> unofficial sources with very high confidence of being real exam questions, without duplicating.

## Scope (single)

Extensive and deep sweep of the internet (preparation sites, prediction files, "real exam questions"
banks, recent candidate reports, open repositories, public PDFs) to expand as much as possible the
number of useful questions across all types, keeping the seriousness of the project. Nothing beyond
that: no features, no changes to UI, engines or flows.

## Observed problem

Shallow banks turn into rote memorization: `lst_hcs` 3 · `lst_hiw` 3 · `lst_smw` 3 · `lst_mcq_multi` 3 ·
`lst_summary` 5 · `lst_mcq` 6 · `describe_image` 6 · `answer_short` and `mcq_multi` low.
Large types (wfd, repeat_sentence, read_aloud) can also grow if there are 100% new items.

## Inviolable rules

1. Only content from a verifiable source, accessible without login, with answer key/transcript/
   answer present and strong signs of being a real question (recurrence across several
   independent sources, labeled as "real exam"/"repeated", recent candidate reports) gets in.
2. Nothing AI-generated, nothing paraphrased "from memory", nothing of low probability.
   When in doubt, leave it out.
3. Zero duplicates: dedupe against the existing bank (exact + similarity ≥ 0.85 +
   `canonicalIdOf`) AND among the new sources.
4. Listening only gets in if the current engine can use it (transcript for TTS).
5. Each new question carries a verifiable `source` (URL/domain) shown in the provenance.
6. No changes to engines, UI or flows — only data, manifest and integrity tests.

## Confidence criterion per source

| Level | Criterion | Decision |
|---|---|---|
| High | Item appears in ≥ 2 independent sources, or a recognized source with a history of "repeated questions" and answer key | Approve |
| Medium | Single recognized source, complete answer key, format faithful to the exam | Approve with source marking |
| Low | No answer key, generic content, suspected AI, requires login, copy of another source already used | Reject and record the reason |

## Logical order (phases)

0. **Sweep and verdict**: search for sources per type (priority to the shallow ones), verify access
   (HTTP 200, no login), answer key present, signs of being real; record approved and
   rejected sources with URL, volume and evidence.
1. **Shallow types (P0)**: lst_hcs, lst_hiw, lst_smw, lst_mcq_multi, lst_summary, lst_mcq,
   describe_image, answer_short, mcq_multi — extraction, normalization, dedupe, integration.
2. **Medium types (P1)**: swt, retell_lecture, write_essay, mcq_single, read_fib,
   reorder_paragraphs, summarize_group_discussion, respond_to_situation.
3. **Large types (P2)**: lst_fib, summarize_spoken_text, read_aloud, repeat_sentence, wfd
   — only 100% new items.
4. **Closing**: final count per type and per source, dedupe report, gates
   (vitest, tsgo, build, lint, bank-integrity, build-manifest).

## Acceptance criteria

- No type with ≤ 6 items without a recorded justification (nonexistent reliable source).
- Every new question with a verifiable `source` and approved in the dedupe.
- Rejected sources documented with the reason; never fill in with doubtful content.

## Negative scope

No features, UI, engines, auth, cloud; no AI content; no promising an official score;
no deleting existing questions.
