import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import {
  applyBackup,
  hasUndoBackup,
  previewBackup,
  undoBackup,
  type BackupPreview,
} from "@/lib/backup";
import {
  exportBackup,
  updateSettings,
  useAppState,
  usePersistFailed,
  useQuotaPressure,
  useStorageStatus,
  ACCENT_OPTIONS,
  DEFAULT_PLUS,
  type Accent,
  type PlusSettings,
} from "@/lib/storage";
import { PLUS_DISCLAIMER, PLUS_LABEL, PLUS_TOGGLES } from "@/lib/plus/settings";
import { countdownLabel, daysUntil } from "@/lib/pte/goal";
import { cn } from "@/lib/utils";
import { downloadForOffline, useOfflineStatus } from "@/lib/offline";

function OfflineSection() {
  const o = useOfflineStatus();
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium">Uso offline</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Baixa todas as questões e páginas para treinar sem internet — inclusive tipos que você ainda
        não abriu.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Button
          size="sm"
          disabled={!o.supported || o.downloading}
          onClick={() => void downloadForOffline()}
        >
          {o.downloading ? `Baixando ${o.done}/${o.total}…` : "Baixar para offline"}
        </Button>
        {o.lastDownloadAt && !o.downloading && (
          <span className="text-xs text-muted-foreground">
            Último download: {new Date(o.lastDownloadAt).toLocaleString("pt-BR")}
          </span>
        )}
      </div>
      {!o.supported && (
        <p className="mt-2 text-xs text-muted-foreground">
          Este navegador não suporta uso offline.
        </p>
      )}
      {o.error && <p className="mt-2 text-xs text-destructive">{o.error}</p>}
    </section>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes — PTE Master Hub" },
      {
        name: "description",
        content:
          "Prepare seu treino: tempo de preparação, meta diária, velocidade do modelo, sotaque e backup.",
      },
      { property: "og:title", content: "Ajustes — PTE Master Hub" },
      {
        property: "og:description",
        content:
          "Tempo de preparação, meta diária, sotaque do reconhecimento e backup do progresso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const prepOptions = [
  { value: 20, label: "20 s" },
  { value: 30, label: "30 s" },
  { value: 40, label: "40 s (padrão PTE)" },
  { value: 0, label: "Sem contagem" },
];

const goalOptions = [5, 10, 15, 20];
const rateOptions = [
  { value: 1, label: "1.0× (normal)" },
  { value: 0.8, label: "0.8× (mais lento)" },
];
const targetOptions = [
  { value: 50, label: "50 — universidades" },
  { value: 58, label: "58 — trabalho/vistos" },
  { value: 65, label: "65 — imigração AU/UK" },
  { value: 79, label: "79 — pontuação máxima" },
];

function OptionGroup<T extends number | string>({
  title,
  description,
  options,
  current,
  onSelect,
}: {
  title: string;
  description: string;
  options: { value: T; label: string }[];
  current: T;
  onSelect: (value: T) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onSelect(o.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors",
              current === o.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Seção do pack studie-plus: 3 toggles independentes, todos desligados por padrão. */
function PlusSection() {
  const s = useAppState().settings;
  const plus = s.plus ?? { ...DEFAULT_PLUS };
  const toggle = (key: keyof PlusSettings, value: boolean) =>
    updateSettings({ plus: { ...plus, [key]: value } });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-medium">{PLUS_LABEL} (extra de estudo)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {PLUS_DISCLAIMER} Tudo desligado por padrão — ative só o que quiser usar.
      </p>
      <div className="mt-4 space-y-3">
        {PLUS_TOGGLES.map((t) => {
          const on = plus[t.key];
          return (
            <button
              key={t.key}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => toggle(t.key, !on)}
              className="flex w-full items-start gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/50"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  on ? "bg-primary" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full bg-background shadow transition-transform",
                    on && "translate-x-5",
                  )}
                />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">{t.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{t.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SettingsPage() {
  const app = useAppState();
  const s = app.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(() => hasUndoBackup());
  const [pending, setPending] = useState<{ text: string; preview: BackupPreview } | null>(null);
  const storageStatus = useStorageStatus();
  const quotaPressure = useQuotaPressure();
  const persistFailed = usePersistFailed();

  const exportar = () => {
    try {
      const blob = new Blob([exportBackup()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pte-master-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      updateSettings({ lastBackupAt: Date.now() });
      setBackupMsg("Backup exportado — guarde o arquivo baixado.");
    } catch {
      setBackupMsg("Não foi possível exportar agora.");
    }
  };

  const importar = async (file: File) => {
    try {
      const text = await file.text();
      const result = previewBackup(text);
      if (!result.ok) {
        setBackupMsg(`Arquivo inválido: ${result.error}`);
        return;
      }
      setBackupMsg(null);
      setPending({ text, preview: result.preview });
    } catch {
      setBackupMsg("Não foi possível ler o arquivo.");
    }
  };

  const confirmarImport = (mode: "replace" | "merge") => {
    if (!pending) return;
    const result = applyBackup(pending.text, mode);
    if (!result.ok) {
      setBackupMsg(`Arquivo inválido: ${result.error}`);
    } else {
      setBackupMsg(
        mode === "merge"
          ? "Backup mesclado — nada do progresso atual foi perdido."
          : "Progresso substituído pelo backup. Você pode desfazer logo abaixo.",
      );
      setPending(null);
    }
    setCanUndo(hasUndoBackup());
  };

  const desfazer = () => {
    if (undoBackup()) {
      setBackupMsg("Importação desfeita — o progresso anterior foi restaurado.");
      setCanUndo(hasUndoBackup());
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 pb-16 pt-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Ajustes</h1>

        <OptionGroup
          title="Preparação"
          description="Tempo para ler o passage mentalmente antes de gravar (o PTE dá 40 s)."
          options={prepOptions}
          current={s.prepSeconds}
          onSelect={(v) => updateSettings({ prepSeconds: v })}
        />
        <OptionGroup
          title="Meta diária"
          description="Quantas questões diferentes você quer ler por dia."
          options={goalOptions.map((g) => ({ value: g, label: `${g} questões` }))}
          current={s.dailyGoal}
          onSelect={(v) => updateSettings({ dailyGoal: v })}
        />
        <OptionGroup
          title="Velocidade do modelo"
          description="Velocidade padrão ao ouvir o passage lido pela voz do navegador."
          options={rateOptions}
          current={s.modelRate}
          onSelect={(v) => updateSettings({ modelRate: v })}
        />
        <OptionGroup<Accent>
          title="Sotaque do reconhecimento"
          description="Sotaque usado para transcrever sua leitura. O PTE usa inglês australiano."
          options={ACCENT_OPTIONS}
          current={s.accent}
          onSelect={(v) => updateSettings({ accent: v })}
        />

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-medium">Prova</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua meta: data da prova e pontuação-alvo. O app usa isso para mostrar a contagem
            regressiva e medir sua prontidão — nada sai daqui do navegador.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="exam-date"
                className="mb-1.5 block text-sm font-medium text-foreground/90"
              >
                Data da prova
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="exam-date"
                  type="date"
                  value={s.examDate ?? ""}
                  onChange={(e) => updateSettings({ examDate: e.target.value || null })}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                {s.examDate ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSettings({ examDate: null })}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
              {s.examDate ? (
                <p className="mt-2 text-sm text-primary">{countdownLabel(daysUntil(s.examDate))}</p>
              ) : null}
            </div>
            <OptionGroup
              title="Pontuação-alvo"
              description="Sua meta de score no PTE (escala 10–90). As estimativas de treino do app usam a mesma escala."
              options={targetOptions}
              current={s.targetScore}
              onSelect={(v) => updateSettings({ targetScore: v })}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-medium">Fontes das questões</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando ativado, as filas de treino (SRS, plano e simulado) usam só fontes verificadas.
            As listas continuam mostrando tudo, sempre com o selo da fonte.
          </p>
          <div className="mt-4">
            <Button
              variant={s.verifiedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => updateSettings({ verifiedOnly: !s.verifiedOnly })}
            >
              {s.verifiedOnly ? "Só fontes verificadas" : "Todas as fontes"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Verificada = fonte pública com curadoria · Comunitária = contribuição de usuários · IA =
            predição gerada por IA (peso reduzido na prontidão).
          </p>
        </section>

        <OfflineSection />

        <PlusSection />

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-medium">Backup do progresso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu histórico vive só neste navegador. Exporte um arquivo JSON para guardar ou levar
            para outro dispositivo — e importe de volta quando quiser.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportar}>
              Exportar backup
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Importar backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importar(file);
                e.target.value = "";
              }}
            />
          </div>
          {backupMsg ? <p className="mt-3 text-sm text-foreground/85">{backupMsg}</p> : null}
          {canUndo && !backupMsg ? (
            <p className="mt-3 text-sm text-foreground/85">
              Existe uma importação que pode ser desfeita.{" "}
              <button onClick={desfazer} className="text-primary underline underline-offset-2">
                Desfazer importação
              </button>
            </p>
          ) : null}
          {pending ? (
            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
              <p className="text-sm font-medium">Revisar importação</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O arquivo contém {pending.preview.attempts} tentativa(s),{" "}
                {pending.preview.questions} questão(ões) com progresso e {pending.preview.sessions}{" "}
                sessão(ões).
                {pending.preview.version != null
                  ? ` Versão do backup: ${pending.preview.version}.`
                  : ""}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha como aplicar: <strong>substituir</strong> troca todo o progresso atual pelo
                do arquivo (você pode desfazer); <strong>mesclar</strong> une os dois, mantendo o
                melhor resultado de cada questão.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => confirmarImport("replace")}>
                  Substituir progresso
                </Button>
                <Button size="sm" variant="outline" onClick={() => confirmarImport("merge")}>
                  Mesclar com o atual
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPending(null);
                    setBackupMsg(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
          {(() => {
            const days = s.lastBackupAt
              ? Math.floor((Date.now() - s.lastBackupAt) / 86_400_000)
              : null;
            if (days == null && app.attempts.length >= 20) {
              return (
                <p className="mt-3 text-sm text-muted-foreground">
                  Você já treinou {app.attempts.length} vezes e ainda não tem backup. Exporte um
                  arquivo para não arriscar perder o progresso.
                </p>
              );
            }
            if (days != null && days >= 14) {
              return (
                <p className="mt-3 text-sm text-muted-foreground">
                  Último backup: há {days} dia(s). Vale exportar um novo.
                </p>
              );
            }
            return null;
          })()}
        </section>

        {storageStatus !== "ok" ? (
          <div
            className="rounded-2xl border p-5"
            role={storageStatus === "future" ? "alert" : undefined}
          >
            {storageStatus === "quarantined" ? (
              <p className="text-sm text-muted-foreground">
                Encontramos dados salvos ilegíveis neste navegador e os guardamos em quarentena em
                vez de apagá-los — o app começou com o progresso limpo. Se você tinha um backup,
                importe-o aqui para recuperar.
              </p>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Estes dados foram salvos por uma versão mais nova do app. Ainda dá para treinar e
                exportar um backup, mas nada será gravado até você atualizar o app.
              </p>
            )}
          </div>
        ) : null}
        {quotaPressure || persistFailed ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              {persistFailed
                ? "O navegador negou o armazenamento persistente — em modo anônimo ou com pouco espaço, o progresso pode ser apagado ao limpar dados do site."
                : "O armazenamento deste navegador está chegando perto do limite."}{" "}
              Exporte um backup para garantir seu histórico.
            </p>
            <Button className="mt-3" variant="outline" size="sm" onClick={exportar}>
              Exportar agora
            </Button>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Tudo é salvo automaticamente neste navegador, sem conta. O reconhecimento de voz pode usar
          um serviço do próprio navegador (ex.: Chrome) — o app não envia nada por conta própria.
        </p>
      </main>
    </div>
  );
}
