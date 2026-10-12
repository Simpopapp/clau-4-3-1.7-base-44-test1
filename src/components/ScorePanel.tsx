import type { GradeResult } from "@/lib/scoring";
import { fluencyProxy, paceLabel } from "@/lib/scoring";
import { cn } from "@/lib/utils";

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ScorePanel({ grade }: { grade: GradeResult }) {
  const scoreTone =
    grade.score >= 90 ? "text-success" : grade.score >= 70 ? "text-warning" : "text-destructive";
  const paceTone = grade.paceVerdict === "ideal" ? "text-success" : "text-warning";
  const fluency = fluencyProxy(grade.pauses, grade.paceVerdict);
  const fluencyTone =
    fluency >= 80 ? "text-success" : fluency >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-5">
      {/* Subscores (Fase 3 — medição honesta): Conteúdo · Fluência (proxy) · Pronúncia */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center sm:p-4">
          <div
            className={cn("font-serif text-2xl font-semibold tabular-nums sm:text-3xl", scoreTone)}
          >
            {grade.score}
          </div>
          <div className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">
            Conteúdo
            <span className="block text-[10px] sm:text-[11px]">(estimativa de treino)</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center sm:p-4">
          <div
            className={cn(
              "font-serif text-2xl font-semibold tabular-nums sm:text-3xl",
              fluencyTone,
            )}
          >
            {fluency}
          </div>
          <div className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">
            Fluência
            <span className="block text-[10px] sm:text-[11px]">(proxy — ritmo e pausas)</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center sm:p-4">
          <div className="font-serif text-2xl font-semibold sm:text-3xl text-muted-foreground/60">
            —
          </div>
          <div className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">
            Pronúncia
            <span className="block text-[10px] sm:text-[11px]">(não avaliada)</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        O reconhecedor do navegador pode corrigir palavras para as mais prováveis — o score tende a
        ficar otimista.
      </p>

      <p className={cn("text-sm font-medium", paceTone)}>{paceLabel(grade.paceVerdict)}</p>

      <p className="text-xs tabular-nums text-muted-foreground">
        {grade.wpm} palavras/min · duração {formatDuration(grade.durationMs)} · pausas longas:{" "}
        {grade.pauses} · repetições: {grade.repetitions}
        {grade.moved > 0 ? ` · fora de ordem: ${grade.moved}` : ""}
      </p>

      {grade.mastered ? (
        <p className="text-sm font-medium text-success">
          Dominada — conteúdo e ritmo na faixa ideal do PTE.
        </p>
      ) : null}

      {grade.moved > 0 ? (
        <p className="text-xs text-muted-foreground">
          Palavras <span className="text-info underline decoration-dotted">pontilhadas</span>{" "}
          estavam certas, mas fora de ordem — vale crédito parcial. Atenção à sequência das ideias.
        </p>
      ) : null}

      {grade.extras.length > 0 ? (
        <div className="text-sm">
          <span className="text-muted-foreground">Palavras fora do passage: </span>
          <span className="text-info">{grade.extras.slice(0, 12).join(", ")}</span>
        </div>
      ) : null}

      {grade.transcript ? (
        <div className="rounded-xl border border-border/60 bg-secondary/40 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            O que captamos
          </p>
          <p className="mt-2 text-sm italic leading-relaxed text-foreground/85">
            {grade.transcript}
          </p>
        </div>
      ) : null}
    </div>
  );
}
