import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import {
  SECTION_META,
  SECTION_ORDER,
  TYPE_META,
  TOTAL_ALL_QUESTIONS_LABEL,
  TYPE_COUNT,
  firstIdOfType,
  sectionCountLabel,
} from "@/lib/pte";
import { estimateTargetLabel } from "@/lib/pte/goal";
import { overallEstimate } from "@/lib/pte/readiness";
import { useAppState } from "@/lib/storage";
import type { Section, TaskType } from "@/lib/pte/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `PTE Master Hub — treine o PTE Academic com ${TOTAL_ALL_QUESTIONS_LABEL} questões reais`,
      },
      {
        name: "description",
        content: `Pratique o PTE Academic com ${TOTAL_ALL_QUESTIONS_LABEL} questões em ${TYPE_COUNT} tipos de tarefa, nas quatro seções da prova. Correção palavra por palavra, revisão espaçada e progresso salvo no seu navegador.`,
      },
      { property: "og:title", content: "PTE Master Hub" },
      {
        property: "og:description",
        content: `Treine o PTE Academic com ${TOTAL_ALL_QUESTIONS_LABEL} questões reais — fala, escrita, leitura e escuta.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const sectionToPath: Record<Section, "/speaking" | "/writing" | "/reading" | "/listening"> = {
  speaking: "/speaking",
  writing: "/writing",
  reading: "/reading",
  listening: "/listening",
};

/** Primeiro task type (com itens) da seção, na ordem do catálogo. */
function sectionFirstType(section: Section): TaskType | undefined {
  return (Object.keys(TYPE_META) as TaskType[]).find(
    (t) => TYPE_META[t].section === section && firstIdOfType(t),
  );
}

/** Faixa de meta (estimativa de treino × alvo) — só aparece quando há treino com score. */
function TargetStrip() {
  const app = useAppState();
  const estimate = useMemo(() => overallEstimate(app), [app]);
  if (estimate === null) return null;
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {estimateTargetLabel(estimate, app.settings.targetScore)}
    </p>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <section className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">PTE Academic</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Treine para o PTE com questões reais
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            {TOTAL_ALL_QUESTIONS_LABEL} questões em {TYPE_COUNT} tipos de tarefa, nas quatro seções
            da prova — com correção palavra por palavra, revisão espaçada e progresso salvo no seu
            navegador. Nenhum servidor, nenhuma conta.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="lg">
              <Link to="/practice">Começar a treinar</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/exam">Fazer um simulado</Link>
            </Button>
          </div>
        </section>

        <TargetStrip />

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {SECTION_ORDER.map((section: Section) => {
            const meta = SECTION_META[section];
            const first = sectionFirstType(section);
            const firstId = first ? firstIdOfType(first) : undefined;
            return (
              <div
                key={section}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-serif text-xl font-semibold text-foreground">
                    <Link to={sectionToPath[section]} className="hover:text-primary">
                      {meta.label}
                    </Link>
                  </h2>
                  <span className="text-sm font-medium text-primary">
                    {sectionCountLabel(section)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium">
                  <Link
                    to={sectionToPath[section]}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Ver todas →
                  </Link>
                  {firstId ? (
                    <Link
                      to="/practice"
                      search={{ q: firstId }}
                      className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Praticar a primeira →
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Tudo é salvo automaticamente neste navegador — exporte um backup em Ajustes quando quiser
          levar seu progresso para outro dispositivo.
        </p>
      </main>
    </div>
  );
}
