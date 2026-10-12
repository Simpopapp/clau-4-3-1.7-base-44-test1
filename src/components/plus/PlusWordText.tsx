import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Glossary } from "@/lib/plus/glossary";
import { lookupWord } from "@/lib/plus/glossary";
import { splitWords } from "@/lib/plus/words";
import { PlusSpeakButton } from "@/components/plus/PlusSpeakButton";
import { cn } from "@/lib/utils";

interface PlusWordTextProps {
  text: string;
  /** Tradução por palavra (settings.plus.wordTranslation). Falso → sem tradução. */
  enabled: boolean;
  /** Áudio de pronúncia (settings.plus.plusAudio) — independente da tradução:
   *  palavras ficam tappable e o balão oferta 🔊 falando a palavra em inglês. */
  audioEnabled?: boolean;
  /** Classes do parágrafo (o motor decide o tamanho/tipografia). */
  className?: string;
  /** Renderiza <span> em vez de <p> (para trechos dentro de outro bloco). */
  inline?: boolean;
}

/**
 * Parágrafo do pack "studie-plus": cada palavra é alvo de toque que abre um
 * balão fixo com a pronúncia (🔊 fala a palavra em INGLÊS, sotaque dos
 * Ajustes) e, quando a tradução por palavra está ativa, a tradução literal +
 * nota contextual — SÓ TEXTO. Abre SOMENTE por tap explícito (nunca em
 * hover/scroll); fecha por toque fora, ✕ ou Esc.
 */
export function PlusWordText({
  text,
  enabled,
  audioEnabled,
  className,
  inline,
}: PlusWordTextProps) {
  const [glossary, setGlossary] = useState<Glossary | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<(HTMLElement | null)[]>([]);

  // Glossário carregado por import dinâmico, só quando o recurso está ativo.
  useEffect(() => {
    let active = true;
    if (enabled) {
      import("@/data/plus/glossary.json")
        .then((mod) => {
          if (active) setGlossary((mod.default ?? mod) as Glossary);
        })
        .catch(() => {
          if (active) setGlossary({});
        });
    } else {
      setGlossary(null);
      setOpen(null);
      setAnchor(null);
    }
    return () => {
      active = false;
    };
  }, [enabled]);

  const parts = useMemo(() => splitWords(text), [text]);
  const audio = audioEnabled === true;
  const interactive = (enabled && glossary !== null) || audio;

  const openAt = (i: number, el: HTMLElement) => {
    if (open === i) {
      setOpen(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const width = 300;
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - width - 8));
    setOpen(i);
    setAnchor({ top: r.bottom + 6, left });
  };

  const toggleAt = (i: number) => {
    const el = spanRefs.current[i];
    if (el) openAt(i, el);
  };

  // Fecha por toque fora (fora do balão e fora do texto) ou Esc.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popRef.current?.contains(target)) return;
      const insideText = rootRef.current?.contains(target) ?? false;
      if (insideText) return;
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Mantém o balão dentro do viewport na vertical (mobile): mede após o render
  // e sobe o topo se o rodapé do balão estourar a altura da tela.
  useLayoutEffect(() => {
    if (open === null) return;
    const el = popRef.current;
    if (!el) return;
    const maxTop = Math.max(8, window.innerHeight - el.offsetHeight - 8);
    setAnchor((a) => {
      if (!a) return a;
      const top = Math.min(Math.max(8, a.top), maxTop);
      return top === a.top ? a : { ...a, top };
    });
  }, [open, anchor]);

  if (!interactive) {
    return inline ? (
      <span
        ref={(el) => {
          rootRef.current = el;
        }}
        className={className}
      >
        {text}
      </span>
    ) : (
      <p
        ref={(el) => {
          rootRef.current = el;
        }}
        className={className}
      >
        {text}
      </p>
    );
  }

  const entry = open !== null ? lookupWord(glossary ?? {}, parts.tokens[open]?.core ?? "") : null;

  const tokens = parts.tokens.map((t, i) => (
    <span
      key={`${t.core}-${i}`}
      ref={(el) => {
        spanRefs.current[i] = el;
      }}
      role="button"
      tabIndex={0}
      aria-label={
        enabled && audio
          ? `Traduzir e ouvir ${t.core}`
          : audio
            ? `Ouvir pronúncia de ${t.core}`
            : `Traduzir ${t.core}`
      }
      onClick={() => toggleAt(i)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleAt(i);
        }
      }}
      className={cn(
        "relative inline-block cursor-pointer whitespace-pre rounded-sm px-0.5 after:absolute after:-inset-x-0.5 after:-inset-y-2 after:content-['']",
        open === i ? "bg-secondary" : "hover:bg-secondary",
      )}
    >
      {t.core + t.trail}
    </span>
  ));

  const body = (
    <>
      {parts.lead ? parts.lead : null}
      {tokens}
    </>
  );

  return (
    <>
      {inline ? (
        <span
          ref={(el) => {
            rootRef.current = el;
          }}
          className={className}
        >
          {body}
        </span>
      ) : (
        <p
          ref={(el) => {
            rootRef.current = el;
          }}
          className={className}
        >
          {body}
        </p>
      )}

      {open !== null && anchor
        ? createPortal(
            <div
              ref={popRef}
              role="dialog"
              aria-label={enabled ? "Tradução da palavra" : "Pronúncia da palavra"}
              className="fixed z-50 max-h-[70dvh] w-[280px] max-w-[calc(100vw-16px)] overflow-y-auto rounded-xl border border-border bg-popover p-3 shadow-lg"
              style={{ top: anchor.top, left: anchor.left }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="pt-2 font-serif text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {parts.tokens[open]?.core}
                </p>
                <button
                  type="button"
                  aria-label="Fechar tradução"
                  onClick={() => setOpen(null)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-lg text-muted-foreground hover:bg-secondary"
                >
                  ✕
                </button>
              </div>
              {audio ? (
                <div className="mb-2">
                  <PlusSpeakButton
                    text={parts.tokens[open]?.core ?? ""}
                    enabled
                    label="Ouvir pronúncia da palavra"
                    compact
                  />
                </div>
              ) : null}
              {enabled ? (
                entry ? (
                  <>
                    <p className="-mt-1 text-sm font-medium text-foreground">{entry.literal}</p>
                    {entry.contextual ? (
                      <p className="mt-1 pb-1 text-xs leading-relaxed text-muted-foreground">
                        {entry.contextual}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="-mt-1 pb-1 text-xs text-muted-foreground">
                    Tradução não disponível para esta palavra.
                  </p>
                )
              ) : audio ? (
                <p className="pb-1 text-xs text-muted-foreground">Pronúncia · Studie Plus</p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
