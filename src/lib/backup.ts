// Backup v6: prévia, mescla e desfazer (projeto 9, Fase 1 — corrige A3).
// `importBackup` (storage.ts) continua substituindo, mas agora guarda o estado
// anterior em UNDO_KEY. Aqui ficam as operações puras + o undo.

import {
  MAX_ATTEMPTS,
  MAX_SESSIONS,
  UNDO_KEY,
  flushPendingWrite,
  getStateSnapshot,
  migrateLegacyState,
  replaceState,
  type AppState,
  type DailyAggregate,
  type QuestionSnapshot,
  type SessionRecord,
} from "@/lib/storage";

const BACKUP_APP = "pte-master-hub";
const BACKUP_VERSIONS = [2, 3, 4, 5, 6];

export interface BackupPreview {
  version: number;
  exportedAt: string | null;
  attempts: number;
  firstAttempt: string | null;
  lastAttempt: string | null;
  bookmarks: number;
  notes: number;
  sessions: number;
  questions: number;
  targetScore: number;
  dailyGoal: number;
}

function parseBackup(json: string):
  | { ok: true; state: AppState; exportedAt: string | null }
  | {
      ok: false;
      error: string;
    } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "o arquivo não é um JSON válido" };
  }
  const obj = parsed as Record<string, unknown>;
  const isCurrent = obj["app"] === BACKUP_APP && BACKUP_VERSIONS.includes(obj["version"] as number);
  const isLegacy = obj["app"] === "readaloud-trainer";
  if (!isCurrent && !isLegacy) {
    return { ok: false, error: "este arquivo não é um backup deste app" };
  }
  if (!Array.isArray(obj["attempts"])) {
    return { ok: false, error: "histórico de tentativas inválido" };
  }
  if (!Array.isArray(obj["bookmarks"])) {
    return { ok: false, error: "lista de favoritos inválida" };
  }
  const state = migrateLegacyState(parsed);
  return {
    ok: true,
    state,
    exportedAt: typeof obj["exportedAt"] === "string" ? obj["exportedAt"] : null,
  };
}

/** Valida e resume o backup para a UI confirmar ANTES de aplicar. */
export function previewBackup(
  json: string,
): { ok: true; preview: BackupPreview } | { ok: false; error: string } {
  const parsed = parseBackup(json);
  if (!parsed.ok) return parsed;
  const { state, exportedAt } = parsed;
  const stamps = state.attempts.map((a) => a.ts).filter((t) => t > 0);
  const firstAttempt = stamps.length
    ? new Date(Math.min(...stamps)).toISOString().slice(0, 10)
    : null;
  const lastAttempt = stamps.length
    ? new Date(Math.max(...stamps)).toISOString().slice(0, 10)
    : null;
  return {
    ok: true,
    preview: {
      version: state.version,
      exportedAt,
      attempts: state.attempts.length,
      firstAttempt,
      lastAttempt,
      bookmarks: state.bookmarks.length,
      notes: Object.keys(state.notes).length,
      sessions: state.sessions.length,
      questions: Object.keys(state.questions).length,
      targetScore: state.settings.targetScore,
      dailyGoal: state.settings.dailyGoal,
    },
  };
}

/** Fusão determinística de snapshots: máximos para acumulados, mais recente vence. */
function mergeSnapshot(a: QuestionSnapshot, b: QuestionSnapshot): QuestionSnapshot {
  const newer = b.lastAttemptAt >= a.lastAttemptAt ? b : a;
  return {
    attempts: a.attempts + b.attempts,
    bestScore: maxNullable(a.bestScore, b.bestScore),
    bestWpm: maxNullable(a.bestWpm, b.bestWpm),
    lastScore: newer.lastScore,
    lastAttemptAt: newer.lastAttemptAt,
    strongAttempts: a.strongAttempts + b.strongAttempts,
    // Fase 2: due-gating conservador — máximos (nada é inventado na fusão).
    dueStrongAttempts: Math.max(a.dueStrongAttempts ?? 0, b.dueStrongAttempts ?? 0),
    prevStrong: newer.prevStrong ?? false,
    lastAttemptDue: newer.lastAttemptDue ?? false,
    box: Math.max(a.box, b.box),
    dueAt: Math.max(a.dueAt, b.dueAt),
  };
}

function maxNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

function mergeDaily(
  cur: Record<string, DailyAggregate>,
  inc: Record<string, DailyAggregate>,
): Record<string, DailyAggregate> {
  const out: Record<string, DailyAggregate> = { ...cur };
  for (const [k, v] of Object.entries(inc)) {
    const c = out[k] ?? { attempts: 0, scored: 0, sum: 0 };
    out[k] = {
      attempts: c.attempts + v.attempts,
      scored: c.scored + v.scored,
      sum: c.sum + v.sum,
    };
  }
  return out;
}

/**
 * Mescla o backup com o estado atual (nada do atual é perdido):
 * tentativas = união cronológica; snapshots/agregados = fusão determinística;
 * favoritos = união; notas = a mais recente vence; sessões = união por id;
 * ajustes = os do backup.
 */
export function mergeStates(current: AppState, incoming: AppState): AppState {
  const attempts = [...current.attempts, ...incoming.attempts]
    .sort((x, y) => x.ts - y.ts)
    .slice(-MAX_ATTEMPTS);

  const questions: Record<string, QuestionSnapshot> = { ...current.questions };
  for (const [qid, snap] of Object.entries(incoming.questions)) {
    const cur = questions[qid];
    questions[qid] = cur ? mergeSnapshot(cur, snap) : snap;
  }

  const bookmarks = [...new Set([...current.bookmarks, ...incoming.bookmarks])];

  const notes = { ...current.notes };
  for (const [qid, note] of Object.entries(incoming.notes)) {
    const cur = notes[qid];
    if (!cur || note.updatedAt >= cur.updatedAt) notes[qid] = note;
  }

  const sessionsMap = new Map<string, SessionRecord>();
  for (const s of [...current.sessions, ...incoming.sessions]) {
    const prev = sessionsMap.get(s.id);
    if (!prev || s.finishedAt > prev.finishedAt) sessionsMap.set(s.id, s);
  }
  const sessions = [...sessionsMap.values()]
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, MAX_SESSIONS);

  const draft =
    (current.draft?.startedAt ?? 0) >= (incoming.draft?.startedAt ?? 0)
      ? current.draft
      : incoming.draft;

  return {
    version: 6,
    srsRules: 2,
    attempts,
    questions,
    daily: mergeDaily(current.daily, incoming.daily),
    bookmarks,
    notes,
    sessions,
    draft,
    settings: incoming.settings,
  };
}

/** Aplica o backup (replace: substitui; merge: mescla). Guarda o estado anterior para o undo. */
export function applyBackup(
  json: string,
  mode: "replace" | "merge",
): { ok: boolean; error?: string } {
  const parsed = parseBackup(json);
  if (!parsed.ok) return parsed;
  if (typeof window === "undefined") return { ok: false, error: "sem navegador" };
  try {
    flushPendingWrite();
    window.localStorage.setItem(UNDO_KEY, JSON.stringify(getStateSnapshot()));
  } catch {
    /* sem espaço para o undo — o import segue */
  }
  const next = mode === "merge" ? mergeStates(getStateSnapshot(), parsed.state) : parsed.state;
  replaceState({
    ...next,
    settings: { ...next.settings, lastBackupAt: Date.now() },
  });
  return { ok: true };
}

/** Restaura o estado guardado antes do último import. */
export function undoBackup(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(UNDO_KEY);
  if (!raw) return false;
  try {
    const restored = migrateLegacyState(JSON.parse(raw) as unknown);
    replaceState(restored);
    window.localStorage.removeItem(UNDO_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasUndoBackup(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(UNDO_KEY) !== null;
}
