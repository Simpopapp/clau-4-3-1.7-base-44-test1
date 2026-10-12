#!/usr/bin/env node
// Projeto 10 — Fase 1 (D1–D13): importa os bancos públicos do goarno.io para os 4 tipos rasos
// (lst_hiw, lst_hcs, lst_smw, lst_mcq) com verificação por máquina de cada gabarito (D5).
//
// Regras aplicadas:
//  - D2: em HIW, `text` é a transcrição exibida (com as palavras erradas) e `audio_text` é a
//    transcrição CORRIGIDA — é o que o TTS lê (`HiwPractice` usa `audioText || transcript`), e
//    `errors` indexa os tokens de `text` (mesmo `tokenize` do motor: split por espaço).
//  - D3: escolha única grava `answer` como índice inteiro (0-based).
//  - D4: `explanation` reproduz o gabarito da fonte (pares errada→correta, ou a alternativa + letra).
//  - D5: item que não fecha com o gabarito da fonte é DESCARTADO e reportado — nunca ajustado à mão.
//  - D9: script de proveniência versionado em `.opencode/proj10-work/`.
//
// Uso:
//   node .opencode/proj10-work/extract-goarno.mjs --check   # só verifica, não escreve
//   node .opencode/proj10-work/extract-goarno.mjs           # grava src/data/pte/*.json
//
// Depois de gravar: `node scripts/build-manifest.mjs` e `node .opencode/proj9-work/dedupe.mjs`.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(ROOT, "src", "data", "pte");
const CHECK = process.argv.includes("--check");
const BASE = "https://goarno.io/blog/";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";
const SOURCE = "goarno.io";
const TOPIC = "academic lecture";

const SOURCES = [
  {
    type: "lst_hiw",
    file: "lst_hiw.json",
    prefix: "goarno-hiw",
    url: `${BASE}highlight-incorrect-words-practice-questions-with-answers-pte-essential-questions/`,
    kind: "hiw",
  },
  {
    type: "lst_hcs",
    file: "lst_hcs.json",
    prefix: "goarno-hcs",
    url: `${BASE}highlight-correct-summary-practice-questions-with-answers-pte-essential-questions/`,
    kind: "choice",
  },
  {
    type: "lst_smw",
    file: "lst_smw.json",
    prefix: "goarno-smw",
    url: `${BASE}select-missing-word-practice-questions-with-answers-pte-essential-questions/`,
    kind: "choice",
  },
  {
    type: "lst_mcq",
    file: "lst_mcq.json",
    prefix: "goarno-mcq",
    url: `${BASE}multiple-choice-single-answer-listening-practice-questions-with-answers-pte-essential-questions/`,
    kind: "choice",
  },
];

// D11 — dicas rotativas e honestas (nunca um "erro comum" específico inventado por item).
const HIW_TRAPS = [
  "Leia a transcrição antes de ouvir: antecipar onde a palavra pode ter sido trocada (datas, quantidades, direção) reduz muito o tempo de reação.",
  "Marque só o que ouviu diferente do texto — destacar demais desconta pontos.",
  "Cerca de 80% do texto costuma bater com o áudio; a tarefa é achar os 20% que não batem.",
  "Palavras de polaridade (aumenta/diminui, antes/depois, mais/menos) são trocadas com frequência: escute a direção da afirmação.",
  "Vocabulário acadêmico parecido (adapt/integrate, holistic/dominant) exige ouvir a palavra inteira, não só o começo.",
];
const CHOICE_TRAPS = [
  "Alternativas que repetem o vocabulário do áudio mas invertem a conclusão são a armadilha mais comum.",
  "Elimine as opções que trazem informação que não aparece na gravação.",
  "Opções absolutas (always, never, entirely) raramente são a correta.",
  "Decida pela ideia central da gravação, não por uma frase isolada que aparece na opção.",
];

// ---------------------------------------------------------------- texto/HTML

function htmlToText(html) {
  let h = html
    .replace(
      /<(script|style|nav|header|footer|figure|figcaption|form|svg)[^>]*>[\s\S]*?<\/\1>/gi,
      " ",
    )
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n");
  h = h.replace(/<[^>]+>/g, " ");
  h = h
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, d) => String.fromCodePoint(parseInt(d, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"');
  return h
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const STOP_LINE =
  /^(Practice .* with|Explore More|Want to practice|Frequently asked|Related|Share this|Table of Contents|Skip to content|Written by|Updated on)/i;

function splitBlocks(text) {
  const out = [];
  const re = /^Question\s+(\d+)\s*$/gm;
  let last = null;
  let m;
  while ((m = re.exec(text))) {
    if (last) out.push({ n: last.n, body: text.slice(last.at, m.index) });
    last = { n: Number(m[1]), at: m.index + m[0].length };
  }
  if (last) {
    let body = text.slice(last.at);
    const cut = body.search(
      /\n(?=Practice .* with|Explore More|Want to practice|Frequently asked)/,
    );
    if (cut > 0) body = body.slice(0, cut);
    out.push({ n: last.n, body });
  }
  return out.map((b) => ({ n: b.n, lines: b.body.split("\n").filter((l) => !STOP_LINE.test(l)) }));
}

// ---------------------------------------------------------------- parsers

const CORE = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
const tokenize = (text) => text.split(/\s+/).filter(Boolean);

/** HIW: transcrição (com erros) + pares `_errada_ → _correta_`. */
function parseHiw(lines) {
  const ti = lines.findIndex((l) => /^Transcript:?$/i.test(l));
  const wi = lines.findIndex((l) => /^Incorrect words:/i.test(l));
  if (ti < 0 || wi < 0 || wi <= ti)
    return { ok: false, reason: "transcrição ou lista de palavras ausente" };
  const text = lines
    .slice(ti + 1, wi)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  // A fonte marca as palavras com <em> (itálico) — depois de remover as tags ficam pares
  // `errada → correta` separados por vírgula. Aceita também a forma com underscores/asteriscos
  // (renderização em markdown) para o parser não depender do wrapper HTML.
  const clean = (s) => s.replace(/^[\s_*]+|[\s_*]+$/g, "").trim();
  const pairsRaw = lines
    .slice(wi)
    .join(" ")
    .replace(/incorrect words:/i, " ");
  const pairs = pairsRaw
    .split(/,|;/)
    .map((chunk) => chunk.split(/→|->|\u2192/))
    .filter((p) => p.length === 2)
    .map(([wrong, right]) => [clean(wrong), clean(right)])
    .filter(([wrong, right]) => wrong && right);
  if (!text) return { ok: false, reason: "texto vazio" };
  if (pairs.length === 0) return { ok: false, reason: "gabarito (pares) ausente" };

  const tokens = tokenize(text);
  const used = new Set();
  const errors = [];
  const audio = [...tokens];
  for (const [wrong, right] of pairs) {
    const want = CORE(wrong);
    let idx = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (!used.has(i) && CORE(tokens[i]) === want) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return { ok: false, reason: `palavra "${wrong}" não está no texto exibido` };
    if (CORE(right) === want) return { ok: false, reason: `par idêntico "${wrong}"` };
    used.add(idx);
    errors.push(idx);
    const m = tokens[idx].match(/^([^A-Za-z0-9]*)([A-Za-z0-9][A-Za-z0-9'’-]*)([^A-Za-z0-9]*)$/);
    audio[idx] = m ? `${m[1]}${right}${m[3]}` : right;
  }
  return {
    ok: true,
    text,
    errors: errors.sort((a, b) => a - b),
    audioText: audio.join(" "),
    pairs,
  };
}

/** Escolha única: transcrição + opções `a)`–`d)` + `Answer: <letra>`. */
function parseChoice(lines) {
  const ti = lines.findIndex((l) => /^Transcript:?$/i.test(l));
  const ai = lines.findIndex((l) => /^Answer:\s*[a-d]\b/i.test(l));
  if (ti < 0 || ai < 0) return { ok: false, reason: "transcrição ou resposta ausente" };
  const optStart = lines.findIndex((l, i) => i > ti && /^[a-d]\)\s*\S/.test(l));
  if (optStart < 0 || optStart > ai) return { ok: false, reason: "opções ausentes" };
  const text = lines
    .slice(ti + 1, optStart)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const options = [];
  for (const line of lines.slice(optStart, ai)) {
    const m = line.match(/^([a-d])\)\s*(.+)$/);
    if (m) options.push({ letter: m[1], text: m[2].trim() });
    else if (options.length > 0) options[options.length - 1].text += ` ${line.trim()}`;
    else return { ok: false, reason: "linha inesperada antes das opções" };
  }
  const letter = lines[ai].match(/^Answer:\s*([a-d])\b/i)[1].toLowerCase();
  const idx = options.findIndex((o) => o.letter === letter);
  if (!text) return { ok: false, reason: "texto vazio" };
  if (options.length < 2) return { ok: false, reason: `só ${options.length} opção(ões)` };
  if (idx < 0) return { ok: false, reason: `letra "${letter}" fora das opções` };
  if (options.some((o) => !o.text)) return { ok: false, reason: "opção vazia" };
  return {
    ok: true,
    text,
    options: options.map((o) => o.text),
    answer: idx,
    letter,
  };
}

// ---------------------------------------------------------------- build

function buildHiw(n, parsed) {
  const list = parsed.pairs.map(([w, r]) => `${w}→${r}`).join(", ");
  const id = `goarno-hiw-${String(n).padStart(2, "0")}`;
  return {
    text: parsed.text,
    id,
    answer: "",
    errors: parsed.errors,
    explanation: `The recording differs from the transcript in ${parsed.pairs.length} place(s): ${list}. (Source key: goarno.io)`,
    trap: HIW_TRAPS[(n - 1) % HIW_TRAPS.length],
    topic: TOPIC,
    source: SOURCE,
    word_count: tokenize(parsed.text).length,
    audio_text: parsed.audioText,
  };
}

function buildChoice(n, parsed, prefix) {
  const id = `${prefix}-${String(n).padStart(2, "0")}`;
  return {
    text: parsed.text,
    id,
    answer: parsed.answer,
    options: parsed.options,
    explanation: `Option ${parsed.letter}) is correct: "${parsed.options[parsed.answer]}" (Source key: goarno.io)`,
    trap: CHOICE_TRAPS[(n - 1) % CHOICE_TRAPS.length],
    topic: TOPIC,
    source: SOURCE,
    word_count: tokenize(parsed.text).length,
  };
}

function ordered(obj, template) {
  const out = {};
  for (const k of template) if (k in obj) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}

// ---------------------------------------------------------------- run

const report = { types: {}, discarded: [], duplicatesInside: [] };

for (const src of SOURCES) {
  const res = await fetch(src.url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${src.url} → HTTP ${res.status}`);
  const html = await res.text();
  const blocks = splitBlocks(htmlToText(html));
  const existing = JSON.parse(readFileSync(join(DIR, src.file), "utf8"));
  const template = Object.keys(existing.questions[0]);

  const fresh = [];
  let ok = 0;
  for (const block of blocks) {
    const parsed = src.kind === "hiw" ? parseHiw(block.lines) : parseChoice(block.lines);
    if (!parsed.ok) {
      report.discarded.push({ type: src.type, n: block.n, reason: parsed.reason });
      continue;
    }
    const item =
      src.kind === "hiw" ? buildHiw(block.n, parsed) : buildChoice(block.n, parsed, src.prefix);
    // D5 — rechecagem final sobre o item já montado.
    if (src.kind === "hiw") {
      const toks = tokenize(item.text);
      const bad = item.errors.find((i) => i < 0 || i >= toks.length);
      if (bad !== undefined) {
        report.discarded.push({
          type: src.type,
          n: block.n,
          reason: `índice ${bad} fora do texto`,
        });
        continue;
      }
      if (item.errors.length === 0) {
        report.discarded.push({ type: src.type, n: block.n, reason: "sem erros" });
        continue;
      }
    } else {
      if (item.answer < 0 || item.answer >= item.options.length) {
        report.discarded.push({ type: src.type, n: block.n, reason: "answer fora do range" });
        continue;
      }
      if (new Set(item.options).size !== item.options.length) {
        report.discarded.push({ type: src.type, n: block.n, reason: "opções repetidas" });
        continue;
      }
    }
    if (existing.questions.some((q) => CORE(q.text) === CORE(item.text))) {
      report.duplicatesInside.push({
        type: src.type,
        n: block.n,
        reason: "texto idêntico já no banco",
      });
      continue;
    }
    if (fresh.some((q) => CORE(q.text) === CORE(item.text))) {
      report.duplicatesInside.push({
        type: src.type,
        n: block.n,
        reason: "texto idêntico entre os novos",
      });
      continue;
    }
    fresh.push(ordered(item, template));
    ok++;
  }

  report.types[src.type] = {
    lidos: blocks.length,
    verificados: ok,
    descartados: blocks.length - ok,
    antes: existing.questions.length,
    depois: existing.questions.length + fresh.length,
  };

  if (!CHECK && fresh.length > 0) {
    existing.questions.push(...fresh);
    existing.total = existing.questions.length;
    existing.generated_at = "2026-10-12";
    writeFileSync(join(DIR, src.file), `${JSON.stringify(existing, null, 2)}\n`);
  }
}

console.log(JSON.stringify(report, null, 2));
const total = Object.values(report.types).reduce((a, t) => a + t.verificados, 0);
console.log(
  `${CHECK ? "[check] " : ""}verificados: ${total} · descartados: ${report.discarded.length} · idênticos evitados: ${report.duplicatesInside.length}`,
);
if (report.discarded.length > 0) process.exitCode = 1;
