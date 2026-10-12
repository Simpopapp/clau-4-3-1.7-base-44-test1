import { dismissMicNotice, useMicNotice } from "@/lib/useSpeechRecognition";

/**
 * Aviso de 1º uso do microfone (projeto 9, Fase 3): explica para que o áudio
 * é usado antes de o usuário confiar no reconhecimento. Aparece uma vez por
 * navegador (flag em settings) e pode ser fechado.
 */
export function MicNotice() {
  const notice = useMicNotice();
  if (!notice) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-info/40 bg-info/10 px-4 py-3 text-sm text-foreground"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 leading-relaxed">{notice}</p>
        <button
          type="button"
          onClick={dismissMicNotice}
          aria-label="Fechar aviso sobre o microfone"
          className="min-h-[24px] px-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
