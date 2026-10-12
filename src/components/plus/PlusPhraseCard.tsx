import { useEffect, useState } from "react";

import type { PhraseData } from "@/lib/plus/phrases";
import { lookupPhrase } from "@/lib/plus/phrases";
import { PlusSpeakButton } from "@/components/plus/PlusSpeakButton";
import { cn } from "@/lib/utils";

interface PlusPhraseCardProps {
  /** Task type da questão (define o arquivo phrases/{type}.json). */
  type: string;
  /** Id da questão. */
  qid: string;
  /** Frases já segmentadas pelo chamador (mesma segmentação do extractor). */
  sentences: string[];
  /** Tradução por frase (settings.plus.phraseTranslation). Falso → sem expansão. */
  enabled: boolean;
  /** Áudio de pronúncia (settings.plus.plusAudio) — independente da tradução. */
  audioEnabled?: boolean;
}

/**
 * Card do pack "studie-plus" com dois recursos independentes:
 * - Tradução por frase (tipo 2): cada frase expande (só por tap explícito) a
 *   tradução literal + interpretativa — SÓ TEXTO. Tradução nunca tem áudio:
 *   o aluno já sabe falar português; o áudio ensina a pronúncia do inglês.
 * - Áudio de pronúncia: 🔊 compacto na linha da frase ORIGINAL em inglês,
 *   controlado só pelo toggle de áudio dos Ajustes (funciona com ou sem
 *   tradução; sem sotaque/idioma de tradução — herda settings.accent).
 */
export function PlusPhraseCard({
  type,
  qid,
  sentences,
  enabled,
  audioEnabled,
}: PlusPhraseCardProps) {
  const [data, setData] = useState<PhraseData | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const audio = audioEnabled === true;

  const loaded = data !== null;
  // Dados de tradução só carregam quando o recurso de tradução está ativo.
  useEffect(() => {
    if (!enabled) {
      setData(null);
      setOpen(null);
      return;
    }
    let active = true;
    const mods = import.meta.glob<{ default: PhraseData }>("@/data/plus/phrases/*.json");
    const loader = mods[`/src/data/plus/phrases/${type}.json`];
    const p = loader ? loader() : Promise.reject(new Error("sem dados"));
    p.then((mod) => {
      if (active) setData((mod.default ?? mod) as PhraseData);
    }).catch(() => {
      if (active) setData({});
    });
    return () => {
      active = false;
    };
  }, [enabled, type]);

  if (!enabled && !audio) return null;

  const entry = enabled && loaded ? (data ?? {})[qid] : undefined;
  const hasData = Boolean(entry && Array.isArray(entry.t) && entry.t.some((t) => t?.l?.trim()));
  // Modo tradução: só existe quando há dados de tradução para a questão.
  const translationMode = enabled && hasData;

  // Estado vazio honesto: sem tradução e sem áudio nada sobra para mostrar.
  // (Também cobre o primeiro render, antes dos dados carregarem — igual ao
  // comportamento anterior: nada pisca como "carregando".)
  if (enabled && !audio && !hasData) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p className="font-serif text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tradução por frase · Studie Plus
        </p>
        <p className="mt-1 text-xs">Tradução de frase não disponível para esta questão.</p>
      </div>
    );
  }

  const header = translationMode
    ? "Tradução por frase · Studie Plus"
    : "Pronúncia por frase · Studie Plus";

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <p className="font-serif text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {header}
      </p>
      <ul className="mt-2 space-y-1">
        {sentences.map((s, i) => {
          const isOpen = open === i;
          return (
            <li key={`${qid}-${i}`}>
              <div className="flex items-start gap-1">
                {translationMode ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className={cn(
                      "flex min-h-[44px] min-w-0 flex-1 items-start justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                      isOpen ? "bg-secondary" : "hover:bg-secondary",
                    )}
                  >
                    <span className="min-w-0 flex-1 font-serif leading-relaxed text-foreground/90">
                      {s}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 shrink-0 text-xs text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    >
                      ▾
                    </span>
                  </button>
                ) : (
                  <span className="min-w-0 flex-1 px-2 py-2 font-serif text-sm leading-relaxed text-foreground/90">
                    {s}
                  </span>
                )}
                {audio ? (
                  <PlusSpeakButton
                    text={s}
                    enabled
                    label={`Ouvir pronúncia da frase ${i + 1}`}
                    compact
                    className="mt-0.5"
                  />
                ) : null}
              </div>
              {translationMode && isOpen ? (
                <div className="mb-2 rounded-lg border border-border bg-background px-3 py-2">
                  {(() => {
                    const t = lookupPhrase(data ?? {}, qid, i);
                    if (!t) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          Tradução não disponível para esta frase.
                        </p>
                      );
                    }
                    return (
                      <>
                        <p className="text-sm font-medium text-foreground">{t.l}</p>
                        {t.c ? (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {t.c}
                          </p>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
